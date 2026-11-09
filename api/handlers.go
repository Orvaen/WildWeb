package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/mail"
	"regexp"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"
)

var (
	reUsername = regexp.MustCompile(`^[A-Za-z0-9_-]{3,16}$`)
	reColor    = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
	langs      = map[string]bool{"fr": true, "en": true, "es": true}
	banners    = map[string]bool{"ocean": true, "foret": true, "braise": true, "crepuscule": true, "glace": true, "nuit": true}
)

type authResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
	User      *User     `json:"user"`
}

// fieldErrors : erreurs par champ, renvoyées au formulaire.
type fieldErrors map[string]string

func validPassword(pw string) bool {
	if len(pw) < 8 || len(pw) > 72 { // bcrypt ignore au-delà de 72 octets
		return false
	}
	var digit, upper bool
	for _, r := range pw {
		digit = digit || unicode.IsDigit(r)
		upper = upper || unicode.IsUpper(r)
	}
	return digit && upper
}

func validEmail(e string) bool {
	a, err := mail.ParseAddress(e)
	return err == nil && a.Address == e && strings.Contains(e, ".")
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	in.Username = strings.TrimSpace(in.Username)
	in.Email = strings.TrimSpace(in.Email)

	errs := fieldErrors{}
	if !reUsername.MatchString(in.Username) {
		errs["username"] = "3 à 16 caractères : lettres, chiffres, _ ou -."
	}
	if !validEmail(in.Email) {
		errs["email"] = "Adresse e-mail invalide."
	}
	if !validPassword(in.Password) {
		errs["password"] = "8 à 72 caractères, avec au moins un chiffre et une majuscule."
	}
	if len(errs) > 0 {
		writeFieldErrors(w, errs)
		return
	}

	hash, err := hashPassword(in.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	u, err := s.store.CreateUser(in.Username, in.Email, hash)
	switch {
	case errors.Is(err, ErrUsernameTaken):
		writeFieldErrors(w, fieldErrors{"username": "Ce pseudo est déjà pris."})
		return
	case errors.Is(err, ErrEmailTaken):
		writeFieldErrors(w, fieldErrors{"email": "Un compte existe déjà avec cet e-mail."})
		return
	case err != nil:
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	s.respondWithToken(w, http.StatusCreated, u, false)
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Login    string `json:"login"`
		Password string `json:"password"`
		Remember bool   `json:"remember"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	u, err := s.store.UserByLogin(in.Login)
	if err != nil {
		checkPassword(dummyHash, in.Password) // même durée de réponse, compte existant ou non
	}
	if err != nil || !checkPassword(u.PasswordHash, in.Password) {
		// Même message dans les deux cas pour ne pas révéler si le compte existe.
		writeError(w, http.StatusUnauthorized, "Pseudo, e-mail ou mot de passe incorrect.")
		return
	}
	s.respondWithToken(w, http.StatusOK, u, in.Remember)
}

func (s *Server) respondWithToken(w http.ResponseWriter, status int, u *User, remember bool) {
	tok, exp, err := s.issueToken(u, remember)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	writeJSON(w, status, authResponse{Token: tok, ExpiresAt: exp, User: u})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, currentUser(r))
}

func (s *Server) handleUpdateMe(w http.ResponseWriter, r *http.Request) {
	u := currentUser(r)
	var in struct {
		Username *string `json:"username"`
		Email    *string `json:"email"`
		Color    *string `json:"color"`
		Lang     *string `json:"lang"`
		Bio      *string `json:"bio"`
		Location *string `json:"location"`
		Banner   *string `json:"banner"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	p := ProfileFields{Username: u.Username, Email: u.Email, Color: u.Color, Lang: u.Lang, Bio: u.Bio, Location: u.Location, Banner: u.Banner}
	errs := fieldErrors{}
	if in.Username != nil {
		p.Username = strings.TrimSpace(*in.Username)
		if !reUsername.MatchString(p.Username) {
			errs["username"] = "3 à 16 caractères : lettres, chiffres, _ ou -."
		}
	}
	if in.Email != nil {
		p.Email = strings.TrimSpace(*in.Email)
		if !validEmail(p.Email) {
			errs["email"] = "Adresse e-mail invalide."
		}
	}
	if in.Color != nil {
		p.Color = *in.Color
		if !reColor.MatchString(p.Color) {
			errs["color"] = "Couleur invalide."
		}
	}
	if in.Lang != nil {
		p.Lang = *in.Lang
		if !langs[p.Lang] {
			errs["lang"] = "Langue non prise en charge."
		}
	}
	if in.Bio != nil {
		p.Bio = strings.TrimSpace(*in.Bio)
		if utf8.RuneCountInString(p.Bio) > 280 {
			errs["bio"] = "280 caractères maximum."
		}
	}
	if in.Location != nil {
		p.Location = strings.TrimSpace(*in.Location)
		if utf8.RuneCountInString(p.Location) > 40 {
			errs["location"] = "40 caractères maximum."
		}
	}
	if in.Banner != nil {
		p.Banner = *in.Banner
		if !banners[p.Banner] {
			errs["banner"] = "Bannière inconnue."
		}
	}
	if len(errs) > 0 {
		writeFieldErrors(w, errs)
		return
	}
	updated, err := s.store.UpdateProfile(u.ID, p)
	switch {
	case errors.Is(err, ErrUsernameTaken):
		writeFieldErrors(w, fieldErrors{"username": "Ce pseudo est déjà pris."})
	case errors.Is(err, ErrEmailTaken):
		writeFieldErrors(w, fieldErrors{"email": "Un compte existe déjà avec cet e-mail."})
	case err != nil:
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
	default:
		writeJSON(w, http.StatusOK, updated)
	}
}

func (s *Server) handleChangePassword(w http.ResponseWriter, r *http.Request) {
	u := currentUser(r)
	var in struct {
		Current string `json:"current"`
		New     string `json:"new"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	if !checkPassword(u.PasswordHash, in.Current) {
		writeFieldErrors(w, fieldErrors{"current": "Mot de passe actuel incorrect."})
		return
	}
	if !validPassword(in.New) {
		writeFieldErrors(w, fieldErrors{"new": "8 à 72 caractères, avec au moins un chiffre et une majuscule."})
		return
	}
	hash, err := hashPassword(in.New)
	if err == nil {
		err = s.store.UpdatePassword(u.ID, hash)
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	// Les anciens jetons sont révoqués : on en renvoie un nouveau pour rester connecté ici.
	fresh, err := s.store.UserByID(u.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	s.respondWithToken(w, http.StatusOK, fresh, false)
}

func (s *Server) handlePublicProfile(w http.ResponseWriter, r *http.Request) {
	u, err := s.store.UserByUsername(r.PathValue("username"))
	if errors.Is(err, ErrNotFound) {
		writeError(w, http.StatusNotFound, "Ce joueur n'existe pas.")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Erreur interne.")
		return
	}
	writeJSON(w, http.StatusOK, u.Public())
}

// ---------- JSON ----------

func readJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<16)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "Requête invalide.")
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func writeFieldErrors(w http.ResponseWriter, errs fieldErrors) {
	writeJSON(w, http.StatusUnprocessableEntity, map[string]any{"error": "Certains champs sont invalides.", "fields": errs})
}
