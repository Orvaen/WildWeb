# WildWeb

Site de Wild Link : front React + Tailwind CSS, API Go pour les comptes joueurs (JWT).

```
WildWeb/
├── api/   API Go : inscription, connexion, JWT, profil (SQLite)
└── web/   Front React + TypeScript + Tailwind CSS 4 (Vite)
```

## Lancer en développement

Deux terminaux.

**1. L'API** (Go 1.22 ou plus) :

```bash
cd api
go mod tidy
go run .
```

Elle écoute sur `http://127.0.0.1:8081` et crée `wildlink.db` au premier lancement.

**2. Le site** (Node 18 ou plus) :

```bash
cd web
npm install
npm run dev
```

Ouvre `http://localhost:5173`. En dev, Vite redirige `/api` vers l'API Go.

## Variables d'environnement de l'API

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `WL_ADDR` | `127.0.0.1:8081` | Adresse d'écoute |
| `WL_DB` | `wildlink.db` | Fichier SQLite |
| `WL_JWT_SECRET` | aléatoire | Clé de signature des jetons. **À fixer en production**, sinon tout le monde est déconnecté à chaque redémarrage. |
| `WL_WEB_ORIGIN` | `http://localhost:5173` | Origine autorisée (CORS) si le site n'est pas servi sur le même domaine |

Générer un secret : `openssl rand -hex 32`

## Routes de l'API

| Méthode | Route | Auth | Rôle |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | — | `{username, email, password}` → `{token, expiresAt, user}` |
| `POST` | `/api/auth/login` | — | `{login, password, remember}` (login = pseudo ou e-mail) |
| `GET` | `/api/me` | Bearer | Compte connecté |
| `PATCH` | `/api/me` | Bearer | `{username?, email?, color?, lang?}` |
| `POST` | `/api/me/password` | Bearer | `{current, new}` → nouveau jeton, les anciens sont révoqués |
| `GET` | `/api/users/{pseudo}` | — | Profil public |

Erreurs : `{"error": "…"}`, et pour les formulaires `{"error": "…", "fields": {"champ": "message"}}` (statut 422).

## Sécurité

- Mots de passe hachés avec bcrypt (coût 12), 8 à 72 caractères avec un chiffre et une majuscule.
- JWT HS256 signé par `WL_JWT_SECRET`, valable 24 h (30 jours avec « Rester connecté »).
- Chaque compte a un numéro de version de jeton : changer de mot de passe invalide tous les jetons existants.
- Connexion et inscription limitées à 10 essais par minute et par IP.
- Même message et même durée de réponse que le compte existe ou non.
- Le front garde le jeton dans `localStorage` (ou `sessionStorage` sans « Rester connecté »). Pour la production, un cookie `HttpOnly` est plus sûr face au XSS ; le client du jeu, lui, pourra utiliser le même jeton en Bearer.

## Ce qui est encore en données d'exemple

Boutique (pas de paiement), votes (compteur local au navigateur), classement et statistiques du profil. Ce sont les prochaines routes à ajouter à l'API.

## Build de production

```bash
cd web && npm run build      # génère web/dist
cd api && go build -o wildlink-api .
```

Sers `web/dist` derrière le même domaine que l'API (par exemple avec Caddy ou Nginx, `/api` vers le binaire Go), avec une redirection de toutes les autres routes vers `index.html`.
