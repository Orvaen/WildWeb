# WildWeb

Site de Wild Link : front React + Tailwind CSS, API Go pour les comptes joueurs (JWT).

```
WildWeb/
├── api/   API Go : inscription, connexion, JWT, profil (SQLite)
└── web/   Front React + TypeScript + Tailwind CSS 4 (Vite)
```

## Lancer en développement

Prérequis : Go 1.22 ou plus et Node 18 ou plus.

Une seule commande, à la racine du projet :

```bash
npm run dev
```

Ou double-clic sur `run.cmd` (Windows), ou `./run.sh` (Linux, macOS, Git Bash).

Le script `scripts/dev.mjs` :

- installe les dépendances si elles manquent (`go mod tidy`, `npm install`) ;
- choisit un port libre pour l'API, à partir de 8081 ;
- garde un secret JWT de dev dans `api/.dev-secret`, pour rester connecté entre deux lancements ;
- attend que l'API réponde, puis démarre le site et branche le proxy `/api` sur le bon port ;
- affiche les logs des deux côtés, préfixés `[api]` et `[web]` ;
- arrête tout avec un seul Ctrl+C.

Ouvre ensuite l'adresse affichée par Vite (en général `http://localhost:5173`).

### Lancer à la main

```bash
cd api && go run .          # API sur 127.0.0.1:8081
cd web && npm run dev       # site sur http://localhost:5173
```

Si l'API n'est pas sur 8081, donne son port au site : `WL_API_PORT=8090 npm run dev`.

## Variables d'environnement de l'API

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `WL_ADDR` | `127.0.0.1:8081` | Adresse d'écoute |
| `WL_DB` | `wildlink.db` | Fichier SQLite |
| `WL_UPLOADS` | `uploads` | Dossier des fichiers envoyés (avatars, bannières) |
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
| `POST` | `/api/me/avatar` | Bearer | Envoi d'avatar (multipart, champ `avatar`, 4 Mo max) : recadré en carré 256 px, réencodé en PNG |
| `DELETE` | `/api/me/avatar` | Bearer | Retire l'avatar |
| `POST` | `/api/me/banner` | Bearer | Image de bannière (multipart, champ `banner`, 8 Mo max) : recadrée en 1500 × 500, réencodée en JPEG |
| `DELETE` | `/api/me/banner` | Bearer | Retire l'image de bannière (retour au dégradé) |
| `GET` | `/api/users/{pseudo}` | — | Profil public |
| `GET` | `/api/uploads/…` | — | Fichiers envoyés (avatars) |

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

## Mise en ligne (wildlink.arkerion.dev)

Le dossier `deploy/` installe tout sur un serveur Ubuntu ou Debian neuf, x86_64 ou ARM (par exemple une VM gratuite Oracle Cloud) :

```bash
curl -fsSL https://raw.githubusercontent.com/Orvaen/WildWeb/main/deploy/install.sh -o install.sh
sudo bash install.sh wildlink.arkerion.dev
```

Le script installe Go, Node et Caddy, ouvre les ports 80 et 443, construit le site et l'API, crée le service `wildlink-api` et configure le HTTPS. Avant de le lancer, l'enregistrement DNS `A wildlink → IP du serveur` doit exister chez Cloudflare, en nuage gris (DNS only).

| Fichier | Rôle |
| --- | --- |
| `deploy/install.sh` | Première installation (peut être relancé sans perte) |
| `deploy/update.sh` | Mise à jour : `sudo bash /opt/wildweb/deploy/update.sh` |
| `deploy/build.sh` | Construit `web/dist` et `api/wildlink-api` |
| `deploy/Caddyfile` | HTTPS, `/api` vers l'API Go, le reste vers le site React |
| `deploy/wildlink-api.service` | Service systemd de l'API |

Sur le serveur :

- configuration et secret JWT : `/etc/wildlink/wildlink.env` ;
- base de données et images envoyées : `/var/lib/wildlink` (à sauvegarder) ;
- logs de l'API : `journalctl -u wildlink-api -f`.

Pour passer derrière le proxy Cloudflare (nuage orange), mets `WL_TRUST_CLOUDFLARE=1` dans `/etc/wildlink/wildlink.env`, redémarre l'API (`sudo systemctl restart wildlink-api`) et choisis le mode SSL/TLS **Full (strict)** dans Cloudflare.

## Build de production

```bash
cd web && npm run build      # génère web/dist
cd api && go build -o wildlink-api .
```

Sers `web/dist` derrière le même domaine que l'API (par exemple avec Caddy ou Nginx, `/api` vers le binaire Go), avec une redirection de toutes les autres routes vers `index.html`.
