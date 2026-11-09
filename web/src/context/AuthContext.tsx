import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, setToken, type ImageKind, type User } from '../lib/api'
import { tokenStore } from '../lib/storage'

type AuthState = {
  user: User | null
  ready: boolean // false tant qu'on vérifie le jeton enregistré
  login: (login: string, password: string, remember: boolean) => Promise<User>
  register: (username: string, email: string, password: string) => Promise<User>
  logout: () => void
  updateProfile: (patch: Parameters<typeof api.updateMe>[0]) => Promise<User>
  changePassword: (current: string, next: string) => Promise<void>
  uploadImage: (kind: ImageKind, file: File) => Promise<User>
  removeImage: (kind: ImageKind) => Promise<User>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const logout = useCallback(() => {
    tokenStore.clear()
    setToken(null)
    setUser(null)
  }, [])

  // Au chargement : on reprend le jeton enregistré et on vérifie qu'il est encore valide.
  useEffect(() => {
    const saved = tokenStore.get()
    if (!saved) { setReady(true); return }
    setToken(saved)
    api.me()
      .then(setUser)
      .catch((e) => { if (e instanceof ApiError && e.status === 401) logout() })
      .finally(() => setReady(true))
  }, [logout])

  const save = (token: string, u: User, remember: boolean) => {
    tokenStore.set(token, remember)
    setToken(token)
    setUser(u)
    return u
  }

  const value: AuthState = {
    user,
    ready,
    logout,
    login: async (login, password, remember) => {
      const r = await api.login(login, password, remember)
      return save(r.token, r.user, remember)
    },
    register: async (username, email, password) => {
      const r = await api.register(username, email, password)
      return save(r.token, r.user, false)
    },
    updateProfile: async (patch) => {
      const u = await api.updateMe(patch)
      setUser(u)
      return u
    },
    uploadImage: async (kind, file) => { const u = await api.uploadImage(kind, file); setUser(u); return u },
    removeImage: async (kind) => { const u = await api.deleteImage(kind); setUser(u); return u },
    changePassword: async (current, next) => {
      // L'API révoque les anciens jetons et en renvoie un nouveau.
      const r = await api.changePassword(current, next)
      save(r.token, r.user, tokenStore.remembered())
    },
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
