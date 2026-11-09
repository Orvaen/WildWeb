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

type Server struct {
	store   *Store
	secret  []byte
	limiter *Limiter
	origins map[string]bool
}

func main() {
	addr := env("WL_ADDR", "127.0.0.1:8081")
	dbPath := env("WL_DB", "wildlink.db")

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
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("POST /api/auth/register", s.limit(s.handleRegister))
	mux.HandleFunc("POST /api/auth/login", s.limit(s.handleLogin))
	mux.HandleFunc("GET /api/me", s.auth(s.handleMe))
	mux.HandleFunc("PATCH /api/me", s.auth(s.handleUpdateMe))
	mux.HandleFunc("POST /api/me/password", s.auth(s.handleChangePassword))
	mux.HandleFunc("GET /api/users/{username}", s.handlePublicProfile)

	srv := &http.Server{
		Addr:              addr,
		Handler:           s.cors(logRequests(mux)),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
	}
	log.Printf("API Wild Link sur %s (base : %s)", addr, dbPath)
	log.Fatal(srv.ListenAndServe())
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
