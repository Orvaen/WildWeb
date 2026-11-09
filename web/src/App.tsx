import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { UiProvider } from './context/UiContext'
import Account from './pages/Account'
import Home from './pages/Home'
import Ladder from './pages/Ladder'
import { Article, NewsList } from './pages/News'
import Player from './pages/Player'
import Shop from './pages/Shop'
import Vote from './pages/Vote'
import Wiki from './pages/Wiki'

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => { if (!hash) scrollTo(0, 0) }, [pathname, hash])
  return null
}

function NotFound() {
  return (
    <div className="wrap grid justify-items-start gap-3 pt-11 pb-16">
      <h1 className="text-2xl font-extrabold">Page introuvable</h1>
      <p className="text-mute">Cette page n'existe pas.</p>
      <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UiProvider>
          <BrowserRouter>
            <ScrollTop />
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="actus" element={<NewsList />} />
                <Route path="actus/:id" element={<Article />} />
                <Route path="boutique" element={<Shop />} />
                <Route path="vote" element={<Vote />} />
                <Route path="classement" element={<Ladder />} />
                <Route path="wiki" element={<Wiki />} />
                <Route path="compte" element={<Account />} />
                <Route path="joueur/:username" element={<Player />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </UiProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
