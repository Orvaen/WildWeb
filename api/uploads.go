package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"image"
	_ "image/gif" // formats acceptés à l'envoi
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	xdraw "golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

// imageKind : une sorte d'image envoyée par les joueurs (avatar ou bannière).
type imageKind struct {
	field    string // nom du champ du formulaire
	dir      string // sous-dossier de uploads
	w, h     int    // taille finale, recadrée pour remplir le cadre
	maxBytes int64
	jpeg     bool // JPEG pour les grandes images opaques, PNG sinon
	minSide  int
}

var (
	avatarKind = imageKind{field: "avatar", dir: "avatars", w: 256, h: 256, maxBytes: 4 << 20, minSide: 32}
	bannerKind = imageKind{field: "banner", dir: "banners", w: 1500, h: 500, maxBytes: 8 << 20, jpeg: true, minSide: 300}
)

const uploadsURL = "/api/uploads/"

// processImage lit l'image, la recadre au bon format et la réencode.
// Réencoder retire les métadonnées (position GPS…) et tout contenu caché dans le fichier.
// Renvoie les octets et l'extension, ou un message d'erreur pour le joueur.
func processImage(file multipart.File, k imageKind) ([]byte, string, string) {
	// D'abord les dimensions seules, pour refuser une image géante avant de la décoder en mémoire.
	cfg, _, err := image.DecodeConfig(file)
	if err != nil {
		return nil, "", "Format non pris en charge : PNG, JPEG, GIF ou WebP."
	}
	if min(cfg.Width, cfg.Height) < k.minSide || cfg.Width > 6000 || cfg.Height > 6000 {
		return nil, "", fmt.Sprintf("L'image doit faire au moins %d pixels de côté (6000 au maximum).", k.minSide)
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return nil, "", "Erreur de lecture."
	}
	src, _, err := image.Decode(file)
	if err != nil {
		return nil, "", "Image illisible ou abîmée."
	}

	// Recadrage centré au rapport largeur/hauteur voulu, puis mise à l'échelle.
	b := src.Bounds()
	cw, ch := b.Dx(), b.Dx()*k.h/k.w
	if ch > b.Dy() {
		ch, cw = b.Dy(), b.Dy()*k.w/k.h
	}
	origin := image.Pt(b.Min.X+(b.Dx()-cw)/2, b.Min.Y+(b.Dy()-ch)/2)
	crop := image.Rectangle{Min: origin, Max: origin.Add(image.Pt(cw, ch))}
	out := image.NewRGBA(image.Rect(0, 0, k.w, k.h))
	xdraw.CatmullRom.Scale(out, out.Bounds(), src, crop, xdraw.Over, nil)

	var buf bytes.Buffer
	ext := ".png"
	if k.jpeg {
		ext = ".jpg"
		err = jpeg.Encode(&buf, out, &jpeg.Options{Quality: 86})
	} else {
		err = png.Encode(&buf, out)
	}
	if err != nil {
		return nil, "", "Erreur interne."
	}
	return buf.Bytes(), ext, ""
}

type setImage func(id int64, url string) (*User, error)
type getImage func(*User) string

func (s *Server) handleUpload(k imageKind, set setImage, current getImage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := currentUser(r)
		r.Body = http.MaxBytesReader(w, r.Body, k.maxBytes+1<<20)
		if err := r.ParseMultipartForm(k.maxBytes); err != nil {
			writeFieldErrors(w, fieldErrors{k.field: fmt.Sprintf("Image trop lourde (%d Mo maximum).", k.maxBytes>>20)})
			return
		}
		file, _, err := r.FormFile(k.field)
		if err != nil {
			writeFieldErrors(w, fieldErrors{k.field: "Aucune image reçue."})
			return
		}
		defer file.Close()

		data, ext, msg := processImage(file, k)
		if msg != "" {
			writeFieldErrors(w, fieldErrors{k.field: msg})
			return
		}
		dir := filepath.Join(s.uploads, k.dir)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			writeError(w, http.StatusInternalServerError, "Erreur interne.")
			return
		}
		rnd := make([]byte, 8)
		_, _ = rand.Read(rnd)
		name := hex.EncodeToString(rnd) + ext
		if err := os.WriteFile(filepath.Join(dir, name), data, 0o644); err != nil {
			writeError(w, http.StatusInternalServerError, "Erreur interne.")
			return
		}
		updated, err := set(u.ID, uploadsURL+k.dir+"/"+name)
		if err != nil {
			_ = os.Remove(filepath.Join(dir, name))
			writeError(w, http.StatusInternalServerError, "Erreur interne.")
			return
		}
		s.removeUpload(k, current(u))
		writeJSON(w, http.StatusOK, updated)
	}
}

func (s *Server) handleDeleteUpload(k imageKind, set setImage, current getImage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := currentUser(r)
		updated, err := set(u.ID, "")
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Erreur interne.")
			return
		}
		s.removeUpload(k, current(u))
		writeJSON(w, http.StatusOK, updated)
	}
}

// removeUpload supprime l'ancien fichier, uniquement s'il est bien dans le dossier attendu.
func (s *Server) removeUpload(k imageKind, url string) {
	name, ok := strings.CutPrefix(url, uploadsURL+k.dir+"/")
	if !ok || name == "" || strings.ContainsAny(name, `/\`) || strings.Contains(name, "..") {
		return
	}
	_ = os.Remove(filepath.Join(s.uploads, k.dir, name))
}

// uploadsHandler sert les fichiers envoyés, sans jamais lister les dossiers.
func (s *Server) uploadsHandler() http.Handler {
	fs := http.StripPrefix(uploadsURL, http.FileServer(http.Dir(s.uploads)))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		fs.ServeHTTP(w, r)
	})
}
