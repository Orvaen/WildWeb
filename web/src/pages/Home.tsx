import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BattleShot, MarketShot, WorldShot } from '../components/PixelScenes'
import { SectionHead } from '../components/ui'
import { useUi } from '../context/UiContext'
import { NEWS } from '../data/news'
import PostCard from '../components/PostCard'

const ALPHA = new Date('2027-02-01T18:00:00+01:00').getTime()

function Countdown() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  let s = Math.max(0, Math.floor((ALPHA - now) / 1000))
  const d = Math.floor(s / 86400); s %= 86400
  const cells: [number, string][] = [[d, 'Jours'], [Math.floor(s / 3600), 'Heures'], [Math.floor((s % 3600) / 60), 'Minutes'], [s % 60, 'Secondes']]
  return (
    <div role="timer" className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-[10px] border border-line bg-surface px-4 py-2.5 shadow-[0_8px_24px_-16px_rgba(0,0,0,.35)]">
      <span className="text-[.9rem] font-bold text-fg">Ouverture de l'alpha</span>
      <div className="flex items-start gap-1.5 tabular-nums">
        {cells.map(([v, l], i) => (
          <div key={l} className="flex items-start gap-1.5">
            {i > 0 && <span className="pt-1 text-[.95rem] font-bold text-mute">:</span>}
            <div className="grid justify-items-center gap-0.5">
              <b className="min-w-10 rounded-md bg-raised p-1.5 text-center text-[1.05rem] leading-none font-extrabold text-fg">{String(v).padStart(2, '0')}</b>
              <span className="text-[.62rem] tracking-wider text-mute uppercase">{l}</span>
            </div>
          </div>
        ))}
      </div>
      <small className="w-full text-center text-[.74rem] text-mute">Date provisoire : 1er février 2027</small>
    </div>
  )
}

const FEATURES: [string, string, string][] = [
  ['🗺️', 'Monde partagé', 'Croise les autres joueurs sur les routes, dans les Centres et les arènes, en temps réel.'],
  ['⚔️', 'PvP classé', 'Matchmaking par saison, en simple ou en double, avec un classement public.'],
  ['🤝', 'Échanges', "Échange tes captures en direct avec n'importe quel joueur croisé en jeu."],
  ['🏪', 'Hôtel des ventes', 'Mets en vente tes captures et tes objets, achète ceux des autres joueurs.'],
  ['🎨', 'Ton dresseur', 'Personnalise ton apparence, tes couleurs, ta tenue et ta monture.'],
  ['🏆', 'Événements', "Tournois, chasses saisonnières et défis communautaires tout au long de l'année."],
]

function ShowRow({ kicker, title, text, ticks, shot, flip, children }: { kicker: string; title: string; text: string; ticks: string[]; shot: ReactNode; flip?: boolean; children?: ReactNode }) {
  return (
    <div className="grid items-center gap-6 md:grid-cols-[1fr_1.15fr] md:gap-12">
      <div className={`grid min-w-0 content-center gap-3 ${flip ? 'md:order-2' : ''}`}>
        <span className="kicker">{kicker}</span>
        <h2 className="text-[clamp(1.3rem,2.6vw,1.7rem)] leading-tight font-extrabold">{title}</h2>
        <p className="max-w-[46ch]">{text}</p>
        <ul className="mt-1 grid gap-1.5">
          {ticks.map((t) => (
            <li key={t} className="flex items-center gap-2.5 text-[.9rem]">
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-accent-soft">
                <svg viewBox="0 0 16 16" className="size-3" aria-hidden="true"><path d="M4 8.2l2.6 2.5L12 5.4" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>{t}
            </li>
          ))}
        </ul>
        {children}
      </div>
      {shot}
    </div>
  )
}

export default function Home() {
  const { openAuth, setPlayOpen } = useUi()
  const icon = 'size-4 fill-current'
  return (
    <>
      <section className="hero-bg">
        <div className="wrap grid justify-items-center gap-3.5 pt-[72px] pb-16 text-center">
          <span className="kicker">Rejoignez Wild Link</span>
          <h1 className="max-w-[22ch] text-[clamp(1.8rem,4.2vw,2.8rem)] leading-[1.1] font-extrabold">
            Le MMO de capture en ligne<br /><span className="text-gradient">Joué</span> par toute une région
          </h1>
          <p className="font-semibold text-fg">Wild Link est bien plus qu'un serveur de jeu.</p>
          <p className="max-w-[62ch] text-[.95rem] text-mute">Explore, combats et échange avec des centaines de dresseurs en même temps, à partir de la ROM de Pokémon Rouge Feu.</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button className="btn btn-primary btn-lg group" onClick={() => setPlayOpen(true)}>Jouer <span className="transition group-hover:translate-x-0.5">→</span></button>
            <button className="btn btn-ghost btn-lg" onClick={() => openAuth('register')}>Créer un compte</button>
          </div>
          <Countdown />
        </div>
      </section>

      <div className="border-y border-line bg-surface">
        <div className="wrap flex flex-wrap items-center justify-center gap-x-9 gap-y-2.5 py-[18px] text-[.92rem] font-bold text-fg">
          <span className="flex items-center gap-2"><svg viewBox="0 0 16 16" className={icon}><path d="M1 2.5 7 1.7v6H1zM8 1.6 15 .7v7H8zM1 8.3h6v6L1 13.5zM8 8.3h7v7l-7-.9z" /></svg>Windows</span>
          <span className="flex items-center gap-2"><svg viewBox="0 0 16 16" className={icon}><path d="M8 1c2 0 3 1.6 3 3.6 0 1.4.8 2.3 1.6 3.5.9 1.3 1.4 2.7.8 3.9-.5 1-1.7 1-2.6 1.6-.8.6-1.6 1.4-2.8 1.4s-2-.8-2.8-1.4c-.9-.6-2.1-.6-2.6-1.6-.6-1.2-.1-2.6.8-3.9C4.2 6.9 5 6 5 4.6 5 2.6 6 1 8 1z" /></svg>Linux</span>
          <span className="flex items-center gap-2"><svg viewBox="0 0 16 16" className={icon}><path d="M11.2 8.5c0-1.6 1.3-2.3 1.4-2.4-.8-1.1-1.9-1.3-2.4-1.3-1-.1-2 .6-2.5.6s-1.3-.6-2.2-.6C4.4 4.8 3.3 5.5 2.7 6.6c-1.2 2.1-.3 5.2.9 6.9.6.8 1.2 1.7 2.1 1.7.8 0 1.2-.5 2.2-.5s1.3.5 2.2.5 1.5-.9 2-1.7c.7-1 .9-1.9 1-2-.1 0-1.9-.7-1.9-3zM9.6 3.6c.5-.6.8-1.3.7-2.1-.7 0-1.5.5-2 1.1-.4.5-.8 1.3-.7 2 .8.1 1.5-.4 2-1z" /></svg>macOS</span>
          <span>Kanto-1 · <b className="text-sky tabular-nums">1 284</b> en ligne</span>
          <small className="w-full text-center text-[.78rem] font-medium text-mute">Client natif, léger et gratuit · chiffres d'exemple</small>
        </div>
      </div>

      <section className="py-14">
        <div className="wrap">
          <SectionHead kicker="Installation" title="Prêt à jouer en trois étapes">Le client n'embarque aucune donnée de jeu : tout vient de la ROM du jeu.</SectionHead>
          <div className="grid gap-3.5 md:grid-cols-3">
            {[['Télécharge le client', 'Disponible sur Windows, Linux et macOS. Crée ton compte au premier lancement.'], ['Ajoute ta ROM', 'Sélectionne la ROM de Pokémon Rouge Feu (fichier .gba). Les données sont extraites en local.'], ['Crée ton dresseur', 'Choisis ton apparence, tes couleurs et tes cosmétiques, puis lance-toi.']].map(([t, d], i) => (
              <div key={t} className="card grid content-start gap-2 p-5">
                <span className="grid size-[30px] place-items-center rounded-lg bg-accent text-[.85rem] font-extrabold text-accent-fg">{i + 1}</span>
                <h3 className="text-[.95rem] font-bold">{t}</h3>
                <p className="text-[.88rem]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="wrap">
          <SectionHead kicker="Le jeu" title="Tout ce qu'un MMO de capture doit avoir">Un seul monde partagé, pensé pour jouer ensemble.</SectionHead>
          <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map(([e, t, d], i) => (
              <div key={t} className="card group grid content-start gap-2 p-5 transition hover:-translate-y-0.5 hover:border-accent">
                <span className={`grid size-9 place-items-center rounded-[9px] text-[1.1rem] ${i % 2 ? 'bg-accent-soft' : 'bg-sky-soft'}`} aria-hidden="true">{e}</span>
                <h3 className="flex items-center gap-2 text-[.95rem] font-bold">{t}<span className="font-normal text-mute transition group-hover:translate-x-0.5 group-hover:text-accent">→</span></h3>
                <p className="text-[.88rem]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="wrap grid gap-16">
          <ShowRow kicker="Exploration" title="Toute la région, en même temps que les autres" shot={<WorldShot />}
            text="Les routes, les villes et les grottes sont partagées. Tu vois passer les autres dresseurs, tu leur parles et tu peux les défier sur place."
            ticks={["Jusqu'à 200 joueurs par zone", 'Chat local, de groupe et privé', 'Groupes de 4 pour explorer ensemble']} />
          <ShowRow flip kicker="Combat" title="Des combats classés, au tour par tour" shot={<BattleShot />}
            text="Affronte d'autres joueurs en simple ou en double. Chaque saison a son classement, ses paliers et ses récompenses."
            ticks={['Matchmaking selon ton Elo', 'Paliers de Bronze à Maître', 'Replays de tes derniers combats']}>
            <Link to="/classement" className="link-u w-fit text-[.9rem] font-semibold">Voir le classement →</Link>
          </ShowRow>
          <ShowRow kicker="Économie" title="Un Hôtel des ventes entre joueurs" shot={<MarketShot />}
            text="Mets en vente tes captures et tes objets, fixe ton prix et récupère tes gains même hors ligne."
            ticks={['Recherche par nom, nature et statistiques', 'Historique des prix', 'Échanges directs sécurisés']} />
          <p className="text-center text-[.78rem] text-mute">Aperçus d'illustration en attendant les vraies captures du jeu.</p>
        </div>
      </section>

      <section className="py-14">
        <div className="wrap">
          <SectionHead kicker="Actualités" title="Derniers articles" />
          <div className="grid gap-3.5 md:grid-cols-3">{NEWS.slice(0, 3).map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
          <div className="mt-7 text-center"><Link to="/actus" className="btn btn-ghost">Tous les articles</Link></div>
        </div>
      </section>

      <section className="pb-14">
        <div className="wrap">
          <div className="card flex flex-wrap items-center justify-between gap-6 rounded-xl px-7 py-7">
            <div><h2 className="text-[1.3rem] font-extrabold">Rejoins la communauté</h2><p className="mt-1 text-mute">Suis le développement et vote pour le serveur chaque jour.</p></div>
            <div className="flex flex-wrap gap-2.5">
              <a className="btn btn-ghost" href="https://discord.com" target="_blank" rel="noreferrer">Discord</a>
              <Link className="btn btn-primary" to="/vote">Voter</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
