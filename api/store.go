package main

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	_ "modernc.org/sqlite" // pilote SQLite en pur Go, pas besoin de CGO sous Windows
)

var (
	ErrNotFound      = errors.New("introuvable")
	ErrUsernameTaken = errors.New("pseudo déjà pris")
	ErrEmailTaken    = errors.New("e-mail déjà utilisé")
)

type User struct {
	ID           int64      `json:"id"`
	Username     string     `json:"username"`
	Email        string     `json:"email,omitempty"`
	PasswordHash string     `json:"-"`
	Color        string     `json:"color"`
	Lang         string     `json:"lang"`
	Role         string     `json:"role"`
	Bio          string     `json:"bio"`
	Location     string     `json:"location"`
	Banner       string     `json:"banner"`
	Avatar       string     `json:"avatar"`
	BannerImage  string     `json:"bannerImage"`
	CreatedAt    time.Time  `json:"createdAt"`
	LastSeenAt   *time.Time `json:"lastSeenAt"`
	TokenVersion int        `json:"-"`
}

// PublicUser : ce que tout le monde peut voir d'un joueur.
type PublicUser struct {
	Username    string     `json:"username"`
	Color       string     `json:"color"`
	Role        string     `json:"role"`
	Bio         string     `json:"bio"`
	Location    string     `json:"location"`
	Banner      string     `json:"banner"`
	Avatar      string     `json:"avatar"`
	BannerImage string     `json:"bannerImage"`
	CreatedAt   time.Time  `json:"createdAt"`
	LastSeenAt  *time.Time `json:"lastSeenAt"`
}

func (u *User) Public() PublicUser {
	return PublicUser{Username: u.Username, Color: u.Color, Role: u.Role, Bio: u.Bio, Location: u.Location,
		Banner: u.Banner, Avatar: u.Avatar, BannerImage: u.BannerImage, CreatedAt: u.CreatedAt, LastSeenAt: u.LastSeenAt}
}

// ProfileFields : ce que le joueur peut modifier lui-même.
type ProfileFields struct {
	Username, Email, Color, Lang, Bio, Location, Banner string
}

type Store struct{ db *sql.DB }

func OpenStore(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path+"?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	_, err = db.Exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL,
  username_lc   TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT '#005ee0',
  lang          TEXT NOT NULL DEFAULT 'fr',
  role          TEXT NOT NULL DEFAULT 'joueur',
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);`)
	if err != nil {
		return nil, err
	}
	// Colonnes ajoutées après la première version : on les crée si elles manquent.
	for _, col := range []string{
		`bio TEXT NOT NULL DEFAULT ''`,
		`location TEXT NOT NULL DEFAULT ''`,
		`banner TEXT NOT NULL DEFAULT 'ocean'`,
		`last_seen_at TIMESTAMP`,
		`avatar TEXT NOT NULL DEFAULT ''`,
		`banner_image TEXT NOT NULL DEFAULT ''`,
	} {
		if _, err := db.Exec(`ALTER TABLE users ADD COLUMN ` + col); err != nil && !strings.Contains(err.Error(), "duplicate column") {
			return nil, err
		}
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }

const userCols = `id, username, email, password_hash, color, lang, role, bio, location, banner, avatar, banner_image, token_version, created_at, last_seen_at`

func scanUser(row interface{ Scan(...any) error }) (*User, error) {
	var u User
	var seen sql.NullTime
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Color, &u.Lang, &u.Role,
		&u.Bio, &u.Location, &u.Banner, &u.Avatar, &u.BannerImage, &u.TokenVersion, &u.CreatedAt, &seen)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if seen.Valid {
		u.LastSeenAt = &seen.Time
	}
	return &u, err
}

func (s *Store) CreateUser(username, email, hash string) (*User, error) {
	res, err := s.db.Exec(`INSERT INTO users (username, username_lc, email, password_hash) VALUES (?, ?, ?, ?)`,
		username, strings.ToLower(username), strings.ToLower(email), hash)
	if err != nil {
		return nil, uniqueErr(err)
	}
	id, _ := res.LastInsertId()
	return s.UserByID(id)
}

func (s *Store) UserByID(id int64) (*User, error) {
	return scanUser(s.db.QueryRow(`SELECT `+userCols+` FROM users WHERE id = ?`, id))
}

func (s *Store) UserByUsername(name string) (*User, error) {
	return scanUser(s.db.QueryRow(`SELECT `+userCols+` FROM users WHERE username_lc = ?`, strings.ToLower(name)))
}

// UserByLogin accepte un pseudo ou un e-mail.
func (s *Store) UserByLogin(login string) (*User, error) {
	l := strings.ToLower(strings.TrimSpace(login))
	return scanUser(s.db.QueryRow(`SELECT `+userCols+` FROM users WHERE username_lc = ? OR email = ?`, l, l))
}

func (s *Store) UpdateProfile(id int64, p ProfileFields) (*User, error) {
	_, err := s.db.Exec(`UPDATE users SET username = ?, username_lc = ?, email = ?, color = ?, lang = ?, bio = ?, location = ?, banner = ? WHERE id = ?`,
		p.Username, strings.ToLower(p.Username), strings.ToLower(p.Email), p.Color, p.Lang, p.Bio, p.Location, p.Banner, id)
	if err != nil {
		return nil, uniqueErr(err)
	}
	return s.UserByID(id)
}

func (s *Store) SetAvatar(id int64, url string) (*User, error) {
	if _, err := s.db.Exec(`UPDATE users SET avatar = ? WHERE id = ?`, url, id); err != nil {
		return nil, err
	}
	return s.UserByID(id)
}

func (s *Store) SetBannerImage(id int64, url string) (*User, error) {
	if _, err := s.db.Exec(`UPDATE users SET banner_image = ? WHERE id = ?`, url, id); err != nil {
		return nil, err
	}
	return s.UserByID(id)
}

// TouchLastSeen enregistre la dernière activité du joueur.
func (s *Store) TouchLastSeen(id int64) {
	_, _ = s.db.Exec(`UPDATE users SET last_seen_at = ? WHERE id = ?`, time.Now().UTC(), id)
}

// UpdatePassword change le hash et invalide tous les jetons existants.
func (s *Store) UpdatePassword(id int64, hash string) error {
	_, err := s.db.Exec(`UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?`, hash, id)
	return err
}

func uniqueErr(err error) error {
	msg := err.Error()
	switch {
	case strings.Contains(msg, "users.username_lc"):
		return ErrUsernameTaken
	case strings.Contains(msg, "users.email"):
		return ErrEmailTaken
	}
	return err
}
