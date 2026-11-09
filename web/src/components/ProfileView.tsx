import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROLE_LABEL, bannerOf } from '../data/game'
import type { PublicUser } from '../lib/api'
import { Avatar } from './ui'
import { ago, date, isOnline } from '../lib/format'

// Profil façon forum : bannière, avatar, statistiques, onglets, colonne « À propos » et fil d'activité.

const ALPHA = new Date('2027-02-01T00:00:00+01:00').getTime()

type Badge = { icon: string; name: string; desc: string; earned: boolean }

function badgesOf(p: PublicUser): Badge[] {
  return [
    { icon: '🌱', name: 'Pionnier', desc: "Inscrit avant l'ouverture de l'alpha", earned: new Date(p.createdAt).getTime() < ALPHA },
    { icon: '✍️', name: 'Présentation', desc: 'A rempli sa bio', earned: p.bio.length > 0 },
    { icon: '⚔️', name: 'Premier combat', desc: 'Gagner un combat classé', earned: false },
    { icon: '📦', name: 'Collectionneur', desc: 'Capturer 50 créatures différentes', earned: false },
    { icon: '🏅', name: "Champion d'arène", desc: 'Battre les 8 champions', earned: false },
    { icon: '🤝', name: 'Marchand', desc: "Vendre 10 objets à l'Hôtel des ventes", earned: false },
  ]
}

const Icon = {
  pin: <svg viewBox="0 0 16 16" className="size-3.5 fill-current" aria-hidden="true"><path d="M8 0a5.5 5.5 0 0 0-5.5 5.5C2.5 9.6 8 16 8 16s5.5-6.4 5.5-10.5A5.5 5.5 0 0 0 8 0zm0 7.6a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2z" /></svg>,
  cal: <svg viewBox="0 0 16 16" className="size-3.5 fill-current" aria-hidden="true"><path d="M4 0h2v2h4V0h2v2h3v14H1V2h3zm-1 6v8h10V6z" /></svg>,
  clock: <svg viewBox="0 0 16 16" className="size-3.5 fill-current" aria-hidden="true"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.8 8.3V3.5H7.2v5.5l4 2.4.8-1.3z" /></svg>,
}

function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-[.92rem] font-bold">{title}</h2>{action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

export default function ProfileView({ p, own, votes = 0 }: { p: PublicUser; own: boolean; votes?: number }) {
  const [tab, setTab] = useState<'activite' | 'apropos' | 'badges'>('activite')
  const badges = badgesOf(p)
  const earned = badges.filter((b) => b.earned)
  const online = isOnline(p.lastSeenAt)
  const role = ROLE_LABEL[p.role] ?? p.role
  const stats: [string, string][] = [['0', 'Combats'], ['0', 'Captures'], ['—', 'Elo PvP'], [String(earned.length), 'Badges'], [own ? String(votes) : '—', 'Votes du mois']]

  const about = (
    <Card title="À propos">
      {p.bio ? <p className="mb-4 whitespace-pre-line text-fg">{p.bio}</p>
        : <p className="mb-4 text-mute italic">{own ? "Tu n'as pas encore écrit de bio." : "Ce joueur n'a pas encore écrit de bio."}</p>}
      <dl className="grid gap-2.5 text-[.88rem]">
        {p.location && <div className="flex items-center gap-2.5"><dt className="text-mute">{Icon.pin}</dt><dd className="text-fg">{p.location}</dd></div>}
        <div className="flex items-center gap-2.5"><dt className="text-mute">{Icon.cal}</dt><dd>Inscrit le <b className="font-semibold text-fg">{date(p.createdAt)}</b></dd></div>
        <div className="flex items-center gap-2.5"><dt className="text-mute">{Icon.clock}</dt><dd>Vu <b className="font-semibold text-fg">{ago(p.lastSeenAt)}</b></dd></div>
      </dl>
      {own && <Link to="/compte" className="link-u mt-4 inline-block text-[.85rem] font-semibold">Modifier mes infos</Link>}
    </Card>
  )

  const badgeGrid = (all: boolean) => (
    <div className={`grid gap-2.5 ${all ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {(all ? badges : earned).map((b) => (
        <div key={b.name} title={b.desc} className={`flex items-center gap-3 rounded-[10px] border border-line p-3 ${b.earned ? 'bg-surface' : 'bg-raised opacity-55'}`}>
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-[1.2rem] ${b.earned ? 'bg-accent-soft' : 'bg-line grayscale'}`}>{b.icon}</span>
          <div className="min-w-0"><b className="block text-[.9rem] text-fg">{b.name}</b><span className="block text-[.78rem] text-mute">{b.earned ? b.desc : `À débloquer : ${b.desc.toLowerCase()}`}</span></div>
        </div>
      ))}
      {!all && !earned.length && <p className="text-mute">Aucun badge pour l'instant.</p>}
    </div>
  )

  const activity = (
    <Card title="Activité récente">
      <ol className="relative grid gap-5 border-l-2 border-line pl-5">
        <li className="relative">
          <span className="absolute top-1 -left-[27px] size-3 rounded-full border-2 border-surface bg-accent" />
          <p className="text-fg"><b>{p.username}</b> a rejoint Wild Link</p>
          <span className="text-[.8rem] text-mute">{date(p.createdAt)}</span>
        </li>
        {earned.map((b) => (
          <li key={b.name} className="relative">
            <span className="absolute top-1 -left-[27px] size-3 rounded-full border-2 border-surface bg-sky" />
            <p className="text-fg">A obtenu le badge <b>{b.icon} {b.name}</b></p>
            <span className="text-[.8rem] text-mute">{b.desc}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-[10px] border border-dashed border-line px-4 py-5 text-center text-[.88rem] text-mute">
        Les combats, captures et échanges apparaîtront ici dès l'ouverture de l'alpha.
      </div>
    </Card>
  )

  return (
    <div className="wrap max-w-[1080px] pt-6 pb-16">
      {/* En-tête du profil */}
      <div className="card overflow-hidden">
        <div className="relative h-40 sm:h-52" style={{ background: bannerOf(p.banner) }}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.5) 1px, transparent 1.2px)', backgroundSize: '18px 18px', maskImage: 'linear-gradient(transparent, #000)' }} />
        </div>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3 px-5 pb-5 sm:px-7">
          <div className="relative -mt-14 sm:-mt-16">
            <Avatar name={p.username} color={p.color} src={p.avatar} size="size-28 rounded-[22px] text-[2.6rem] sm:size-32" className="border-[5px] border-surface shadow-lg" />
            <span title={online ? 'En ligne' : 'Hors ligne'} className={`absolute right-1 bottom-1 size-5 rounded-full border-[3px] border-surface ${online ? 'bg-good' : 'bg-mute'}`} />
          </div>
          <div className="min-w-0 grow pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.6rem] leading-tight font-extrabold">{p.username}</h1>
              <span className="rounded-md px-2 py-0.5 text-[.72rem] font-bold text-white" style={{ background: p.color }}>{role}</span>
              {online && <span className="rounded-md bg-[color-mix(in_srgb,var(--good)_15%,transparent)] px-2 py-0.5 text-[.72rem] font-semibold text-good">En ligne</span>}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[.86rem] text-mute">
              {p.location && <span className="flex items-center gap-1.5">{Icon.pin}{p.location}</span>}
              <span className="flex items-center gap-1.5">{Icon.cal}Membre depuis le {date(p.createdAt)}</span>
              <span className="flex items-center gap-1.5">{Icon.clock}Vu {ago(p.lastSeenAt)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {own ? (
              <Link to="/compte" className="btn btn-primary">Modifier le profil</Link>
            ) : (
              <>
                <button className="btn btn-primary" disabled title="Bientôt disponible">Suivre</button>
                <button className="btn btn-ghost" disabled title="Bientôt disponible">Message</button>
              </>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 border-t border-line sm:grid-cols-5">
          {stats.map(([v, l], i) => (
            <div key={l} className={`px-4 py-3.5 text-center ${i ? 'border-l border-line' : ''} ${i > 2 ? 'hidden sm:block' : ''}`}>
              <b className="block text-[1.25rem] font-extrabold text-fg tabular-nums">{v}</b>
              <span className="text-[.74rem] tracking-wider text-mute uppercase">{l}</span>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div role="tablist" className="flex gap-1 overflow-x-auto border-t border-line px-3">
          {([['activite', 'Activité'], ['apropos', 'À propos'], ['badges', `Badges · ${earned.length}/${badges.length}`]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`-mb-px border-b-2 px-3.5 py-3 text-[.9rem] font-semibold whitespace-nowrap transition ${tab === k ? 'border-accent text-fg' : 'border-transparent text-mute hover:text-fg'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[300px_1fr]">
        <aside className="grid gap-5 lg:sticky lg:top-20">
          {about}
          <Card title="Badges obtenus" action={<button className="link-u text-[.8rem] font-semibold" onClick={() => setTab('badges')}>Tout voir</button>}>
            {badgeGrid(false)}
          </Card>
        </aside>
        <div className="grid min-w-0 gap-5">
          {tab === 'activite' && activity}
          {tab === 'apropos' && (
            <Card title={`À propos de ${p.username}`}>
              <div className="grid gap-4 sm:grid-cols-2">
                {[['Rôle', role], ['Localisation', p.location || '—'], ['Inscription', date(p.createdAt)], ['Dernière visite', ago(p.lastSeenAt)], ['Équipe', 'Aucune'], ['Région favorite', 'Kanto']].map(([k, v]) => (
                  <div key={k} className="rounded-[10px] bg-raised px-4 py-3"><span className="block text-[.74rem] tracking-wider text-mute uppercase">{k}</span><b className="text-fg">{v}</b></div>
                ))}
              </div>
            </Card>
          )}
          {tab === 'badges' && <Card title="Tous les badges">{badgeGrid(true)}</Card>}
        </div>
      </div>
    </div>
  )
}
