// Accès au stockage du navigateur, sans planter s'il est bloqué.

export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem('wl.' + key)
      return v == null ? fallback : (JSON.parse(v) as T)
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem('wl.' + key, JSON.stringify(value)) } catch { /* stockage indisponible */ }
  },
  remove(key: string) {
    try { localStorage.removeItem('wl.' + key) } catch { /* stockage indisponible */ }
  },
}

// Le jeton va dans localStorage si « Rester connecté », sinon dans sessionStorage.
export const tokenStore = {
  get(): string | null {
    try { return localStorage.getItem('wl.token') ?? sessionStorage.getItem('wl.token') } catch { return null }
  },
  set(token: string, remember: boolean) {
    try {
      this.clear()
      ;(remember ? localStorage : sessionStorage).setItem('wl.token', token)
    } catch { /* stockage indisponible */ }
  },
  clear() {
    try { localStorage.removeItem('wl.token'); sessionStorage.removeItem('wl.token') } catch { /* stockage indisponible */ }
  },
  remembered(): boolean {
    try { return localStorage.getItem('wl.token') != null } catch { return false }
  },
}
