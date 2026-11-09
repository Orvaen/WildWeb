import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api, ApiError, type PublicUser } from '../lib/api'
import { date } from '../lib/format'

export default function Player() {
  const { username = '' } = useParams()
  const { user } = useAuth()
  const [p, setP] = useState<PublicUser | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setP(null); setErr(null)
    api.profile(username).then(setP).catch((e) => setErr(e instanceof ApiError ? e.message : 'Erreur inattendue.'))
  }, [username])

  if (err) return <div className="wrap grid gap-3 pt-11 pb-16"><h1 className="text-2xl font-extrabold">Joueur introuvable</h1><p className="text-mute">{err}</p><Link to="/classement" className="link-u w-fit font-semibold">Voir le classement →</Link></div>
  if (!p) return <div className="wrap pt-11 pb-16 text-mute">Chargement du profil…</div>

  return (
    <div className="wrap pt-11 pb-16">
      <div className="card overflow-hidden">
        <div className="h-28" style={{ background: `linear-gradient(120deg, ${p.color}, color-mix(in srgb, ${p.color} 40%, var(--sky)))` }} />
        <div className="flex flex-wrap items-end gap-4 px-6 pb-6">
          <div className="-mt-8 rounded-2xl border-4 border-surface"><Avatar name={p.username} color={p.color} size="size-16 text-[1.6rem] rounded-xl" /></div>
          <div className="grow">
            <h1 className="text-[1.5rem] font-extrabold">{p.username}</h1>
            <p className="text-mute">Membre depuis le {date(p.createdAt)} · <span className="capitalize">{p.role}</span></p>
          </div>
          {user?.username === p.username && <Link to="/compte" className="btn btn-ghost">Modifier mon profil</Link>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['0 h', 'Temps de jeu'], ['0', 'Captures'], ['—', 'Elo PvP'], ['—', 'Badges']].map(([v, l]) => <div key={l} className="card px-4 py-3.5"><b className="block text-[1.2rem] font-extrabold text-fg">{v}</b><span className="text-[.82rem] text-mute">{l}</span></div>)}
      </div>
    </div>
  )
}
