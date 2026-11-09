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

// clientIP renvoie l'IP du joueur. Derrière Caddy, la connexion vient de 127.0.0.1 :
// on lit alors l'IP transmise par le proxy. Ces en-têtes ne sont crus que si la requête
// arrive par la boucle locale, sinon n'importe qui pourrait les inventer.
func (s *Server) clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	if ip := net.ParseIP(host); ip == nil || !ip.IsLoopback() {
		return host
	}
	if s.trustCloudflare {
		if v := strings.TrimSpace(r.Header.Get("CF-Connecting-IP")); net.ParseIP(v) != nil {
			return v
		}
	}
	// Caddy ajoute l'IP de son client en dernier dans X-Forwarded-For.
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if v := strings.TrimSpace(parts[len(parts)-1]); net.ParseIP(v) != nil {
			return v
		}
	}
	return host
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
		if !s.limiter.Allow(s.clientIP(r)) {
			writeError(w, http.StatusTooManyRequests, "Trop de tentatives, réessaie dans une minute.")
			return
		}
		next(w, r)
	}
}
