import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { store } from '../lib/storage'

type Theme = 'light' | 'dark'
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} })

// Sombre par défaut (comme index.html) ; le choix du joueur est retenu.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => store.get<Theme>('theme', 'dark'))

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    store.set('theme', next)
    setTheme(next)
  }
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
