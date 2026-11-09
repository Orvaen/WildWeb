import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

export type AuthMode = 'login' | 'register'

type Ui = {
  authMode: AuthMode | null
  openAuth: (mode: AuthMode) => void
  closeAuth: () => void
  playOpen: boolean
  setPlayOpen: (v: boolean) => void
  toast: (msg: string) => void
  toastMsg: string | null
}

const UiCtx = createContext<Ui | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [playOpen, setPlayOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const timer = useRef<number>()

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToastMsg(null), 2600)
  }, [])

  return (
    <UiCtx.Provider value={{
      authMode, openAuth: setAuthMode, closeAuth: () => setAuthMode(null),
      playOpen, setPlayOpen, toast, toastMsg,
    }}>
      {children}
    </UiCtx.Provider>
  )
}

export function useUi() {
  const ctx = useContext(UiCtx)
  if (!ctx) throw new Error('useUi doit être utilisé dans UiProvider')
  return ctx
}
