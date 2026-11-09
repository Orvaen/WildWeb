// API Wild Link : comptes joueurs, authentification JWT et profils.
package main

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"os"
	"time"
)

// apiVersion change à chaque évolution du format des données renvoyées au site.
const apiVersion = "0.4.1"

type Server struct {
	store   *Store
	secret  []byte
	limiter *Limiter
	origins map[string]bool
	uploads string // dossier des fichiers envoyés (avatars…)
	// trustCloudflare : lire l'IP réelle dans CF-Connecting-IP (site derrière le proxy Cloudflare).
	trustCloudflare bool
}

func main() {
	addr := env("WL_ADDR", "127.0.0.1:8081")
	dbPath := env("WL_DB", "wildlink.db")
	uploads := env("WL_UPLOADS", "uploads")

	secret := os.Getenv("WL_JWT_SECRET")
	if secret == "" {
		b := make([]byte, 32)
		if _, err := rand.Read(b); err != nil {
			log.Fatal(err)
		}
		secret = hex.EncodeToString(b)
		log.Println("WL_JWT_SECRET absent : secret aléatoire généré (les sessions sautent au redémarrage)")
	}

	store, err := OpenStore(dbPath)
	if err != nil {
		log.Fatalf("base de données : %v", err)
	}
	defer store.Close()

	s := &Server{
		store:   store,
		secret:  []byte(secret),
		limiter: NewLimiter(10, time.Minute),
		origins: map[string]bool{env("WL_WEB_ORIGIN", "http://localhost:5173"): true},
		uploads: uploads,

		trustCloudflare: os.Getenv("WL_TRUST_CLOUDFLARE") == "1",
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		// app et pid permettent au script de lancement de retrouver une ancienne instance oubliée.
		writeJSON(w, http.StatusOK, map[string]any{"status": "ok", "app": "wildlink-api", "version": apiVersion, "pid": os.Getpid()})
	})
	mux.HandleFunc("POST /api/auth/register", s.limit(s.handleRegister))
	mux.HandleFunc("POST /api/auth/login", s.limit(s.handleLogin))
	mux.HandleFunc("GET /api/me", s.auth(s.handleMe))
	mux.HandleFunc("PATCH /api/me", s.auth(s.handleUpdateMe))
	mux.HandleFunc("POST /api/me/password", s.auth(s.handleChangePassword))
	mux.HandleFunc("GET /api/users/{username}", s.handlePublicProfile)
	avatarOf := func(u *User) string { return u.Avatar }
	bannerOf := func(u *User) string { return u.BannerImage }
	mux.HandleFunc("POST /api/me/avatar", s.limit(s.auth(s.handleUpload(avatarKind, store.SetAvatar, avatarOf))))
	mux.HandleFunc("DELETE /api/me/avatar", s.auth(s.handleDeleteUpload(avatarKind, store.SetAvatar, avatarOf)))
	mux.HandleFunc("POST /api/me/banner", s.limit(s.auth(s.handleUpload(bannerKind, store.SetBannerImage, bannerOf))))
	mux.HandleFunc("DELETE /api/me/banner", s.auth(s.handleDeleteUpload(bannerKind, store.SetBannerImage, bannerOf)))
	mux.Handle("GET /api/uploads/", s.uploadsHandler())

	srv := &http.Server{
		Addr:              addr,
		Handler:           s.cors(logRequests(mux)),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
	}
	log.Printf("API Wild Link v%s sur %s (base : %s)", apiVersion, addr, dbPath)
	log.Fatal(srv.ListenAndServe())
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
