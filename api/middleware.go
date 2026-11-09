package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type ctxKey struct{}

func currentUser(r *http.Request) *User { return r.Context().Value(ctxKey{}).(*User) }

// auth exige un en-tête « Authorization: Bearer <jwt> » valide.
func (s *Server) auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		raw, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		if !ok || raw == "" {
			writeError(w, http.StatusUnauthorized, "Connexion requise.")
			return
		}
		u, err := s.parseToken(raw)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "Session expirée, reconnecte-toi.")
			return
		}
		// « Vu dernièrement » : une écriture par minute au plus.
		if u.LastSeenAt == nil || time.Since(*u.LastSeenAt) > time.Minute {
			s.store.TouchLastSeen(u.ID)
			now := time.Now().UTC()
			u.LastSeenAt = &now
		}
		next(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, u)))
	}
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if o := r.Header.Get("Origin"); s.origins[o] {
			w.Header().Set("Access-Control-Allow-Origin", o)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
	})
}

// Limiter : fenêtre fixe par IP, contre le bourrinage des mots de passe.
type Limiter struct {
	mu     sync.Mutex
	max    int
	window time.Duration
	hits   map[string]*bucket
}

type bucket struct {
	n     int
	reset time.Time
}

func NewLimiter(max int, window time.Duration) *Limiter {
	return &Limiter{max: max, window: window, hits: map[string]*bucket{}}
}

func (l *Limiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	b, ok := l.hits[key]
	if !ok || now.After(b.reset) {
		if len(l.hits) > 10000 {
			l.hits = map[string]*bucket{}
		}
		l.hits[key] = &bucket{n: 1, reset: now.Add(l.window)}
		return true
	}
	b.n++
	return b.n <= l.max
}

func (s *Server) limit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr
		}
		if !s.limiter.Allow(ip) {
			writeError(w, http.StatusTooManyRequests, "Trop de tentatives, réessaie dans une minute.")
			return
		}
		next(w, r)
	}
}
