// Client de l'API Go. Le jeton JWT est envoyé dans l'en-tête Authorization.

export type User = {
  id: number
  username: string
  email?: string
  color: string
  lang: 'fr' | 'en' | 'es'
  role: string
  createdAt: string
}

export type PublicUser = Pick<User, 'username' | 'color' | 'role' | 'createdAt'>

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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur. Vérifie que l'API tourne.")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Pas de message de l'API : la requête n'a probablement pas atteint le serveur Go.
    const fallback = res.status >= 500
      ? `Le serveur ne répond pas (erreur ${res.status}). Vérifie que l'API Go tourne sur le port 8081.`
      : `Erreur ${res.status} : réponse inattendue du serveur.`
    throw new ApiError(res.status, data.error ?? fallback, data.fields ?? {})
  }
  return data as T
}

export const api = {
  register: (username: string, email: string, password: string) =>
    request<AuthResponse>('POST', '/auth/register', { username, email, password }),
  login: (login: string, password: string, remember: boolean) =>
    request<AuthResponse>('POST', '/auth/login', { login, password, remember }),
  me: () => request<User>('GET', '/me'),
  updateMe: (patch: Partial<Pick<User, 'username' | 'email' | 'color' | 'lang'>>) => request<User>('PATCH', '/me', patch),
  changePassword: (current: string, next: string) => request<AuthResponse>('POST', '/me/password', { current, new: next }),
  profile: (username: string) => request<PublicUser>('GET', `/users/${encodeURIComponent(username)}`),
}
