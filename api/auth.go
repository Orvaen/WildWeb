package main

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	tokenTTL         = 24 * time.Hour
	tokenTTLRemember = 30 * 24 * time.Hour
	issuer           = "wildlink"
)

type Claims struct {
	Username string `json:"usr"`
	Version  int    `json:"ver"`
	jwt.RegisteredClaims
}

// dummyHash sert à comparer un mot de passe quand le compte n'existe pas.
var dummyHash, _ = hashPassword("WildLink-dummy-0")

func hashPassword(pw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), 12)
	return string(b), err
}

func checkPassword(hash, pw string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(pw)) == nil
}

func (s *Server) issueToken(u *User, remember bool) (string, time.Time, error) {
	ttl := tokenTTL
	if remember {
		ttl = tokenTTLRemember
	}
	exp := time.Now().Add(ttl)
	claims := Claims{
		Username: u.Username,
		Version:  u.TokenVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(u.ID, 10),
			Issuer:    issuer,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	}
	tok, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
	return tok, exp, err
}

// parseToken vérifie la signature, l'expiration et que le jeton n'a pas été révoqué.
func (s *Server) parseToken(raw string) (*User, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (any, error) {
		return s.secret, nil
	}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithIssuer(issuer), jwt.WithExpirationRequired())
	if err != nil {
		return nil, err
	}
	id, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("sujet invalide")
	}
	u, err := s.store.UserByID(id)
	if err != nil {
		return nil, err
	}
	if u.TokenVersion != claims.Version {
		return nil, errors.New("jeton révoqué")
	}
	return u, nil
}
