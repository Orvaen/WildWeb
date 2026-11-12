// Client de l'API Go. Le jeton JWT est envoyé dans l'en-tête Authorization.

export type User = {
  id: number
  username: string
  email?: string
  color: string
  lang: 'fr' | 'en' | 'es'
  role: string
  bio: string
  location: string
  banner: string
  avatar: string
  bannerImage: string
  createdAt: string
  lastSeenAt: string | null
}

export type PublicUser = Pick<User, 'username' | 'color' | 'role' | 'bio' | 'location' | 'banner' | 'avatar' | 'bannerImage' | 'createdAt' | 'lastSeenAt'>
export type ProfilePatch = Partial<Pick<User, 'username' | 'email' | 'color' | 'lang' | 'bio' | 'location' | 'banner'>>

export type ImageKind = 'avatar' | 'banner'

export type AuthResponse = { token: string; expiresAt: string; user: User }

export class ApiError extends Error {
  status: number
  fields: Record<string, string>
  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

let token: string | null = null
export const setToken = (t: string | null) => { token = t }

// Version vitrine (GitHub Pages) : pas d'API derrière, on le dit clairement au lieu d'afficher une erreur réseau.
export const STATIC_SITE = import.meta.env.VITE_STATIC === '1'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (STATIC_SITE) throw new ApiError(0, "Les comptes ouvriront avec l'alpha : cette version en ligne du site est une vitrine.")
  const headers: Record<string, string> = {}
  const form = body instanceof FormData
  if (body !== undefined && !form) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : form ? body : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur. Vérifie que l'API tourne.")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Pas de message de l'API : la requête n'a probablement pas atteint le serveur Go.
    const fallback = res.status >= 500
      ? `Le serveur ne répond pas (erreur ${res.status}). Vérifie que l'API Go tourne (lance « npm run dev » à la racine).`
      : `Erreur ${res.status} : réponse inattendue du serveur.`
    throw new ApiError(res.status, data.error ?? fallback, data.fields ?? {})
  }
  return data as T
}

// Complète les champs absents (API plus ancienne que le site, par exemple).
function normalize<T extends Partial<User>>(u: T): T & PublicUser {
  return { ...u, bio: u.bio ?? '', location: u.location ?? '', banner: u.banner || 'ocean', color: u.color || '#005ee0',
    role: u.role || 'joueur', avatar: u.avatar ?? '', bannerImage: u.bannerImage ?? '', lastSeenAt: u.lastSeenAt ?? null } as T & PublicUser
}
const withUser = (r: AuthResponse): AuthResponse => ({ ...r, user: normalize(r.user) })

export const api = {
  register: (username: string, email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/register', { username, email, password }).then(withUser),
  login: (login: string, password: string, remember: boolean) =>
    request<AuthResponse>('POST', '/auth/login', { login, password, remember }).then(withUser),
  me: () => request<User>('GET', '/me').then(normalize),
  updateMe: (patch: ProfilePatch) => request<User>('PATCH', '/me', patch).then(normalize),
  changePassword: (current: string, next: string) => request<AuthResponse>('POST', '/me/password', { current, new: next }).then(withUser),
  // kind : 'avatar' ou 'banner' (même nom pour la route et le champ du formulaire)
  uploadImage: (kind: ImageKind, file: File) => {
    const fd = new FormData()
    fd.append(kind, file)
    return request<User>('POST', `/me/${kind}`, fd).then(normalize)
  },
  deleteImage: (kind: ImageKind) => request<User>('DELETE', `/me/${kind}`).then(normalize),
  profile: (username: string) => request<PublicUser>('GET', `/users/${encodeURIComponent(username)}`).then(normalize),
}
