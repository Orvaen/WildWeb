import { useCallback, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUi } from '../context/UiContext'
import AuthModal from './AuthModal'
import ErrorBoundary from './ErrorBoundary'
import Header from './Header'
import PlayModal from './PlayModal'

function Footer() {
  const { setPlayOpen } = useUi()
  const col = 'grid content-start gap-1.5 [&_a]:text-mute [&_a:hover]:text-fg [&_button]:text-left [&_button]:text-mute [&_button:hover]:text-fg'
  return (
    <footer className="mt-10 border-t border-line text-[.9rem]" style={{ background: 'var(--footer)' }}>
      <div className="wrap grid grid-cols-2 gap-7 py-9 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <h4 className="mb-2.5 text-[.9rem] font-bold">Wild Link</h4>
          <p className="max-w-[40ch] text-mute">MMO communautaire non officiel. Aucun contenu protégé n'est distribué : chaque joueur fournit sa ROM du jeu.</p>
        </div>
        <div className={col}><h4 className="mb-1 text-[.9rem] font-bold">Jeu</h4><Link to="/actus">Actualités</Link><Link to="/classement">Classement</Link><Link to="/boutique">Boutique</Link><Link to="/vote">Voter</Link></div>
        <div className={col}><h4 className="mb-1 text-[.9rem] font-bold">Aide</h4><Link to="/wiki">Wiki</Link><Link to="/wiki#faq">FAQ</Link><Link to="/wiki#regles">Règlement</Link><Link to="/wiki#equipe">Recrutement</Link></div>
        <div className={col}><h4 className="mb-1 text-[.9rem] font-bold">Télécharger</h4>
          {['Windows', 'Linux', 'macOS'].map((os) => <button key={os} onClick={() => setPlayOpen(true)}>{os}</button>)}
        </div>
      </div>
      <div className="wrap flex flex-wrap justify-between gap-2 border-t border-line py-4 text-[.8rem] text-mute">
        <span>© 2026 Wild Link · un projet Arkerion</span>
        <span>Non affilié à Nintendo, Game Freak ou The Pokémon Company.</span>
      </div>
    </footer>
  )
}

function TabBar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth()
  const { openAuth } = useUi()
  const cls = 'grid justify-items-center gap-0.5 py-1.5 text-[.72rem] font-medium text-mute'
  const icon = 'size-5 fill-current'
  return (
    <nav aria-label="Raccourcis" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line px-2 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden" style={{ background: 'var(--hdr)' }}>
      {user ? (
        <Link to={`/joueur/${user.username}`} className={cls}><svg viewBox="0 0 16 16" className={icon}><path d="M8 1a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM1.5 15c0-3 2.9-5 6.5-5s6.5 2 6.5 5z" /></svg>Profil</Link>
      ) : (
        <button onClick={() => openAuth('login')} className={cls}><svg viewBox="0 0 16 16" className={icon}><path d="M8 1a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM1.5 15c0-3 2.9-5 6.5-5s6.5 2 6.5 5z" /></svg>Connexion</button>
      )}
      <Link to="/actus" className={cls}><svg viewBox="0 0 16 16" className={icon}><path d="M2 2h12v12H2zM4 4v2h8V4zM4 8v1h8V8zM4 11v1h5v-1z" /></svg>Actus</Link>
      <Link to="/classement" className={cls}><svg viewBox="0 0 16 16" className={icon}><path d="M1 9h4v6H1zM6 4h4v11H6zM11 7h4v8h-4z" /></svg>Classement</Link>
      <button onClick={onMenu} className={cls}><svg viewBox="0 0 16 16" className={icon}><path d="M1 3h14v1.6H1zM1 7.2h14v1.6H1zM1 11.4h14V13H1z" /></svg>Menu</button>
    </nav>
  )
}

function Toast() {
  const { toastMsg } = useUi()
  if (!toastMsg) return null
  return (
    <div role="status" className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-1/2 z-[60] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-lg bg-fg px-5 py-3 text-[.92rem] font-semibold text-bg shadow-xl md:bottom-6">
      {toastMsg}
    </div>
  )
}

export default function Layout() {
  const [menuOpen, setMenuOpenRaw] = useState(false)
  const setMenuOpen = useCallback((v: boolean) => setMenuOpenRaw(v), [])
  const { pathname } = useLocation()
  return (
    <div className="min-h-dvh pb-16 md:pb-0">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main><ErrorBoundary resetKey={pathname}><Outlet /></ErrorBoundary></main>
      <Footer />
      <TabBar onMenu={() => { scrollTo(0, 0); setMenuOpen(!menuOpen) }} />
      <AuthModal />
      <PlayModal />
      <Toast />
    </div>
  )
}
