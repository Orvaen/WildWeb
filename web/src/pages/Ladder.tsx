import { useMemo, useState } from 'react'
import { PageHead } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { LADDER, tierOf } from '../data/game'
import { fmt } from '../lib/format'
import { rankBadge } from './Vote'

const PER = 20

export default function Ladder() {
  const { user } = useAuth()
  const [mode, setMode] = useState<'simple' | 'double'>('simple')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const rows = useMemo(() => LADDER[mode].map((p, i) => ({ ...p, rank: i + 1 })).filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())), [mode, q])
  const pages = Math.max(1, Math.ceil(rows.length / PER))
  const cur = Math.min(page, pages - 1)
  const th = 'px-3 py-2.5'

  return (
    <div className="wrap pt-11 pb-16">
      <PageHead kicker="Classement" title="Saison 1 · PvP classé">Mis à jour toutes les 10 minutes. Fin de saison le 31 mars 2027.</PageHead>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['simple', 'double'] as const).map((m) => <button key={m} className="chip" aria-pressed={mode === m} onClick={() => { setMode(m); setPage(0) }}>{m === 'simple' ? 'Simple' : 'Double'}</button>)}
        </div>
        <input type="search" className="field-input w-full max-w-[260px] !rounded-full" placeholder="Rechercher un joueur" aria-label="Rechercher un joueur"
          value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-[.86rem]">
          <thead><tr className="bg-raised text-left text-[.74rem] tracking-wider text-mute uppercase">
            <th className={th}>#</th><th className={th}>Joueur</th><th className={th}>Palier</th><th className={th + ' text-right'}>Elo</th><th className={th + ' text-right'}>V</th><th className={th + ' text-right'}>D</th><th className={th + ' text-right'}>Ratio</th>
          </tr></thead>
          <tbody>
            {rows.length ? rows.slice(cur * PER, cur * PER + PER).map((p) => {
              const [t, c] = tierOf(p.elo)
              return (
                <tr key={p.name} className={`border-t border-line hover:bg-raised ${user && p.name === user.username ? 'bg-accent-soft' : ''}`}>
                  <td className={th}><span className={rankBadge(p.rank - 1)}>{p.rank}</span></td>
                  <td className={th + ' font-bold text-fg'}>{p.name}</td>
                  <td className={th}><span className="text-[.82rem] font-bold" style={{ color: c }}>{t}</span></td>
                  <td className={th + ' text-right tabular-nums'}>{fmt(p.elo)}</td>
                  <td className={th + ' text-right tabular-nums'}>{p.w}</td>
                  <td className={th + ' text-right tabular-nums'}>{p.l}</td>
                  <td className={th + ' text-right tabular-nums'}>{((p.w / (p.w + p.l)) * 100).toFixed(1).replace('.', ',')} %</td>
                </tr>
              )
            }) : <tr><td colSpan={7} className={th + ' text-mute'}>Aucun joueur ne correspond à « {q} ».</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-3.5 flex items-center justify-end gap-2 text-[.9rem] text-mute">
        <span>Page {cur + 1} sur {pages}</span>
        <button className="btn btn-ghost btn-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Précédent</button>
        <button className="btn btn-ghost btn-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Suivant</button>
      </div>
      <p className="mt-2 text-[.78rem] text-mute">Joueurs et scores d'exemple.</p>
    </div>
  )
}
