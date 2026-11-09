package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"image"
	_ "image/gif" // formats acceptés à l'envoi
	_ "image/jpeg"
	"image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	xdraw "golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

const (
	avatarMaxBytes = 4 << 20 // 4 Mo à l'envoi
	avatarSize     = 256     // image enregistrée : 256×256 px
	avatarURL      = "/api/uploads/avatars/"
)

// handleUploadAvatar reçoit une image (champ « avatar »), la recadre en carré, la réduit et l'enregistre en PNG.
// Réencoder l'image retire les métadonnées (position GPS…) et tout contenu caché dans le fichier.
func (s *Server) handleUploadAvatar(w http.ResponseWriter, r *http.Request) {
	u := currentUser(r)
	r.Body = http.MaxBytesReader(w, r.Body, avatarMaxBytes+1<<20)
	if err := r.ParseMultipartForm(avatarMaxBytes); err != nil {
		writeFieldErrors(w, fieldErrors{"avatar": "Image trop lourde (4 Mo maximum)."})
		return
	}
	file, _, err := r.FormFile("avatar")
	if err != nil {
		writeFieldErrors(w, fieldErrors{"avatar": "Aucune image reçue."})
		return
	}
	defer file.Close()

	// On lit d'abord les dimensions seules, pour refuser une image géante avant de la décoder en mémoire.
	cfg, _, err := image.DecodeConfig(file)
	if err != nil {
		writeFieldErrors(w, fieldErrors{"avatar": "Format non pris en charge : PNG, JPEG, GIF ou WebP."})
		return
	}
	if cfg.Width < 32 || cfg.Height < 32 || cfg.Width > 6000 || cfg.Height > 6000 {
		writeFieldErrors(w, fieldErrors{"avatar": "L'image doit faire entre 32 et 6000 pixels de côté."})
		return
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	src, _, err := image.Decode(file)
	if err != nil {
		writeFieldErrors(w, fieldErrors{"avatar": "Image illisible ou abîmée."})
		return
	}
	b := src.Bounds()

	// Recadrage carré centré, puis réduction.
	side := min(b.Dx(), b.Dy())
	origin := image.Pt(b.Min.X+(b.Dx()-side)/2, b.Min.Y+(b.Dy()-side)/2)
	crop := image.Rectangle{Min: origin, Max: origin.Add(image.Pt(side, side))}
	out := image.NewRGBA(image.Rect(0, 0, avatarSize, avatarSize))
	xdraw.CatmullRom.Scale(out, out.Bounds(), src, crop, xdraw.Over, nil)

	var buf bytes.Buffer
	if err := png.Encode(&buf, out); err != nil {
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	dir := filepath.Join(s.uploads, "avatars")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	rnd := make([]byte, 8)
	_, _ = rand.Read(rnd)
	name := hex.EncodeToString(rnd) + ".png"
	if err := os.WriteFile(filepath.Join(dir, name), buf.Bytes(), 0o644); err != nil {
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	updated, err := s.store.SetAvatar(u.ID, avatarURL+name)
	if err != nil {
		_ = os.Remove(filepath.Join(dir, name))
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	s.removeAvatarFile(u.Avatar)
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleDeleteAvatar(w http.ResponseWriter, r *http.Request) {
	u := currentUser(r)
	updated, err := s.store.SetAvatar(u.ID, "")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	s.removeAvatarFile(u.Avatar)
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) removeAvatarFile(url string) {
	name, ok := strings.CutPrefix(url, avatarURL)
	if !ok || name == "" || strings.ContainsAny(name, `/\`) {
		return
	}
	_ = os.Remove(filepath.Join(s.uploads, "avatars", name))
}

// uploadsHandler sert les fichiers envoyés, sans jamais lister les dossiers.
func (s *Server) uploadsHandler() http.Handler {
	fs := http.StripPrefix("/api/uploads/", http.FileServer(http.Dir(s.uploads)))
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
