import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProfileView from '../components/ProfileView'
import { useAuth } from '../context/AuthContext'
import { api, ApiError, type PublicUser } from '../lib/api'
import { store } from '../lib/storage'

export default function Player() {
  const { username = '' } = useParams()
  const { user } = useAuth()
  const [p, setP] = useState<PublicUser | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const own = !!user && user.username.toLowerCase() === username.toLowerCase()

  useEffect(() => {
    setP(null); setErr(null)
    api.profile(username).then(setP).catch((e) => setErr(e instanceof ApiError ? e.message : 'Erreur inattendue.'))
  }, [username])

  if (err) return (
    <div className="wrap grid gap-3 pt-11 pb-16">
      <h1 className="text-2xl font-extrabold">Joueur introuvable</h1>
      <p className="text-mute">{err}</p>
      <Link to="/classement" className="link-u w-fit font-semibold">Voir le classement →</Link>
    </div>
  )
  if (!p) return (
    <div className="wrap pt-6 pb-16" aria-busy="true">
      <div className="card h-80 animate-pulse bg-raised" />
    </div>
  )
  // Pour son propre profil, on affiche les données fraîches du compte (mises à jour sans recharger).
  return <ProfileView p={own && user ? user : p} own={own} votes={own ? store.get<number>('vcount', 0) : 0} />
}
