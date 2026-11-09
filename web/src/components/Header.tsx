import { useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useUi } from '../context/UiContext'
import { Avatar, Logo } from './ui'

export const NAV = [
  { to: '/actus', label: 'Actualités' },
  { to: '/boutique', label: 'Boutique' },
  { to: '/vote', label: 'Voter' },
  { to: '/classement', label: 'Classement' },
  { to: '/wiki', label: 'Wiki' },
]

function ThemeButton() {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'
  return (
    <button onClick={toggle} aria-label={label} title={label}
      className="grid size-8 place-items-center rounded-full border border-line bg-surface text-fg transition hover:bg-raised">
      {theme === 'dark' ? (
        <svg viewBox="0 0 16 16" className="size-[15px] fill-current" aria-hidden="true"><circle cx="8" cy="8" r="3.2" /><path d="M7.3 0h1.4v2.4H7.3zM7.3 13.6h1.4V16H7.3zM0 7.3h2.4v1.4H0zM13.6 7.3H16v1.4h-2.4zM2.1 3.1l1-1 1.7 1.7-1 1zM11.2 12.2l1-1 1.7 1.7-1 1zM2.1 12.9l1.7-1.7 1 1-1.7 1.7zM11.2 3.8l1.7-1.7 1 1-1.7 1.7z" /></svg>
      ) : (
        <svg viewBox="0 0 16 16" className="size-[15px] fill-current" aria-hidden="true"><path d="M6.2.6a7.4 7.4 0 1 0 9.2 9.2A6 6 0 0 1 6.2.6z" /></svg>
      )}
    </button>
  )
}

export default function Header({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const { user } = useAuth()
  const { openAuth, setPlayOpen } = useUi()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => { setMenuOpen(false) }, [pathname, setMenuOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-line backdrop-blur-md" style={{ background: 'var(--hdr)' }}>
      <div className="relative flex h-[58px] items-center gap-4 px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-[3.5vw]">
        <Link to="/" className="mr-auto flex items-center gap-2.5 text-[.92rem] font-extrabold tracking-[.03em] text-fg uppercase md:mr-0 md:justify-self-start">
          <Logo /> Wild Link
        </Link>

        <nav aria-label="Menu principal" className="md:justify-self-center">
          <ul className={`${menuOpen ? 'flex' : 'hidden'} absolute inset-x-0 top-full flex-col border-b border-line bg-surface px-4 py-2 md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0`}>
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} className={({ isActive }) => `nav-link block px-2 py-3 text-[14px] font-medium transition md:px-3 md:py-1.5 ${isActive ? 'active text-fg' : 'text-mute hover:text-fg'}`}>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 md:justify-self-end">
          <ThemeButton />
          {user ? (
            <button onClick={() => navigate(`/joueur/${user.username}`)} className="btn btn-ghost hidden !py-1 !pl-1 md:inline-flex">
              <Avatar name={user.username} color={user.color} size="size-6 text-[.7rem] rounded-full" />
              {user.username}
            </button>
          ) : (
            <button onClick={() => openAuth('login')} className="btn btn-ghost hidden md:inline-flex">Connexion</button>
          )}
          <button onClick={() => setPlayOpen(true)} className="btn btn-primary">Jouer</button>
          <button onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Menu"
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-fg md:hidden">Menu</button>
        </div>
      </div>
    </header>
  )
}
