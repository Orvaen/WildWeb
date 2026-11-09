import { useEffect, useState } from 'react'
import { PageHead } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useUi } from '../context/UiContext'
import { TOP_VOTERS, VOTE_COOLDOWN, VOTE_SITES } from '../data/game'
import { store } from '../lib/storage'

export const rankBadge = (i: number) =>
  `inline-grid size-[22px] place-items-center rounded-full text-[.74rem] font-bold ${i === 0 ? 'bg-gold text-white' : i === 1 ? 'bg-silver text-white' : i === 2 ? 'bg-bronze text-white' : ''}`

export default function Vote() {
  const { user } = useAuth()
  const { toast, openAuth } = useUi()
  const [votes, setVotes] = useState<Record<string, number>>(() => store.get('votes', {}))
  const [count, setCount] = useState<number>(() => store.get('vcount', 0))
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  const vote = (id: string) => {
    if (!user) { toast('Connecte-toi pour que ton vote soit compté'); openAuth('login'); return }
    const v = { ...votes, [id]: Date.now() }
    setVotes(v); setCount(count + 1); store.set('votes', v); store.set('vcount', count + 1)
    toast('Vote enregistré : 1 Clé de vote ajoutée')
  }
  const rewards: [string, string, string][] = [['1', 'Chaque vote', '1 Clé de vote et 500 ₽ en jeu'], ['10', '10 votes dans le mois', 'Badge de profil « Supporter »'], ['30', '30 votes dans le mois', 'Tenue saisonnière exclusive'], ['#1', 'Top 3 du mois', 'Grade Ranger offert pour 30 jours']]

  return (
    <div className="wrap pt-11 pb-16">
      <PageHead kicker="Vote" title="Vote pour Wild Link">Chaque vote fait monter le serveur dans les classements et te rapporte des récompenses en jeu. Tu peux voter toutes les 1 h 30 sur chaque site.</PageHead>
      <div className="grid gap-3.5 md:grid-cols-2">
        <div className="card grid content-start gap-4 p-5">
          <h2 className="text-[1.1rem] font-bold">Sites de vote</h2>
          {VOTE_SITES.map((s) => {
            const left = (votes[s.id] ?? 0) + VOTE_COOLDOWN - now
            const ready = left <= 0
            const m = Math.floor(left / 60000), sec = Math.floor((left % 60000) / 1000)
            return (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="text-[.95rem] font-bold">{s.name}</h3>
                  <span className="text-[.84rem] text-mute tabular-nums">{ready ? 'Disponible' : `Prochain vote dans ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min ${String(sec).padStart(2, '0')} s`}</span></div>
                <button className={`btn btn-sm ${ready ? 'btn-primary' : 'btn-ghost'}`} disabled={!ready} onClick={() => vote(s.id)}>Voter</button>
              </div>
            )
          })}
          <div className="grid gap-1.5">
            <div className="flex justify-between text-[.88rem]"><span className="text-mute">Ta progression du mois</span><b className="text-fg tabular-nums">{count} / 50</b></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-raised"><i className="block h-full rounded-full" style={{ width: `${Math.min(100, count * 2)}%`, background: 'linear-gradient(90deg,var(--accent),var(--sky))' }} /></div>
          </div>
        </div>
        <div className="card grid content-start gap-4 p-5">
          <h2 className="text-[1.1rem] font-bold">Récompenses</h2>
          {rewards.map(([ic, t, d]) => (
            <div key={t} className="flex items-center gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-sky-soft text-[.9rem] font-extrabold text-sky">{ic}</span>
              <div><b className="text-fg">{t}</b><p className="text-[.88rem] text-mute">{d}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12 mb-4"><h2 className="text-[1.3rem] font-extrabold">Meilleurs voteurs de novembre</h2><p className="text-[.78rem] text-mute">Données d'exemple</p></div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[420px] text-[.86rem]">
          <thead><tr className="bg-raised text-left text-[.74rem] tracking-wider text-mute uppercase"><th className="px-3 py-2.5">#</th><th className="px-3 py-2.5">Joueur</th><th className="px-3 py-2.5 text-right">Votes</th></tr></thead>
          <tbody>{TOP_VOTERS.map((v, i) => (
            <tr key={v.name} className="border-t border-line hover:bg-raised"><td className="px-3 py-2.5"><span className={rankBadge(i)}>{i + 1}</span></td><td className="px-3 py-2.5 font-semibold text-fg">{v.name}</td><td className="px-3 py-2.5 text-right tabular-nums">{v.votes}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
