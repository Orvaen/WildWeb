import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { store } from '../lib/storage'

type Theme = 'light' | 'dark'
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

const systemTheme = (): Theme => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Theme | null>(() => store.get<Theme | null>('theme', null))
  const [system, setSystem] = useState<Theme>(systemTheme)
  const theme = saved ?? system

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => setSystem(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    store.set('theme', next)
    setSaved(next)
  }
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
