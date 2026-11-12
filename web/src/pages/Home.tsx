import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { BattleShot, CharacterShot, MarketShot, WorldShot } from '../components/PixelScenes'
import { useUi } from '../context/UiContext'
import { NEWS } from '../data/news'

// Page d'accueil façon page produit : grand titre, visuel du jeu sur halo, chiffres clés,
// onglets de fonctionnalités, grandes cartes, comparaison, garanties, actus, appel final.

const ALPHA = new Date('2027-02-01T18:00:00+01:00').getTime()

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t) }, [ms])
  return now
}

function AlphaCountdown() {
  const now = useNow()
  let s = Math.max(0, Math.floor((ALPHA - now) / 1000))
  const d = Math.floor(s / 86400); s %= 86400
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    <span role="timer" className="eyebrow tabular-nums">
      Alpha dans <b className="text-fg">{d} j {p(h)} h {p(m)} min {p(sec)} s</b> · date provisoire
    </span>
  )
}

function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`wrap max-w-[1200px] py-20 md:py-28 ${className}`}>{children}</section>
}

function Heading({ eyebrow, title, children, center }: { eyebrow?: string; title: ReactNode; children?: ReactNode; center?: boolean }) {
  return (
    <div className={`mb-12 grid max-w-[760px] gap-4 ${center ? 'mx-auto justify-items-center text-center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="display text-[clamp(2rem,4.6vw,3.6rem)]">{title}</h2>
      {children && <p className="max-w-[60ch] text-[1.05rem] text-text">{children}</p>}
    </div>
  )
}

// ---------- Onglets de fonctionnalités, qui défilent tout seuls ----------
const FEATURES: { title: string; text: string; shot: ReactNode }[] = [
  { title: 'Une région partagée, en temps réel', text: "Routes, villes et grottes sont communes à tous. Tu vois passer les autres dresseurs, tu leur parles et tu peux les défier sur place. Jusqu'à 200 joueurs par zone.", shot: <WorldShot /> },
  { title: 'Des combats classés, au tour par tour', text: 'Simple ou double, matchmaking selon ton Elo, paliers de Bronze à Maître et une nouvelle saison tous les trois mois.', shot: <BattleShot /> },
  { title: 'Un Hôtel des ventes entre joueurs', text: 'Mets en vente tes captures et tes objets, fixe ton prix et récupère tes gains même hors ligne. Historique des prix inclus.', shot: <MarketShot /> },
  { title: 'Un dresseur qui te ressemble', text: "Couleurs, tenues, montures et effets : personnalise ton personnage dès l'entrée en jeu, sans aucun avantage en combat.", shot: <CharacterShot /> },
]
const DURATION = 7000

function FeatureTabs() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    if (paused || reduced) return
    const t = setTimeout(() => setActive((a) => (a + 1) % FEATURES.length), DURATION)
    return () => clearTimeout(t)
  }, [active, paused, reduced])

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div role="tablist" aria-orientation="vertical" className="grid">
        {FEATURES.map((f, i) => {
          const on = i === active
          return (
            <button key={f.title} role="tab" aria-selected={on} onClick={() => setActive(i)}
              className={`relative grid gap-2 border-l-2 py-5 pl-6 text-left transition ${on ? 'border-transparent' : 'border-line hover:border-mute'}`}>
              {on && <span className="absolute top-0 -left-0.5 h-full w-0.5 bg-line"><span key={active} className={`tab-progress block h-full w-full bg-accent ${paused ? 'paused' : ''}`} style={{ ['--dur' as string]: `${DURATION}ms` }} /></span>}
              <span className={`display text-[1.35rem] !leading-tight transition ${on ? 'text-fg' : 'text-mute'}`}>{f.title}</span>
              <span className={`grid transition-all duration-300 ${on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <span className="overflow-hidden text-text">{f.text}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="relative isolate min-w-0">
        <div className="glow -inset-10 opacity-60" />
        <div key={active} className="animate-pop">{FEATURES[active].shot}</div>
      </div>
    </div>
  )
}

// ---------- Maquettes des cartes « Comment ça marche » ----------
function TerminalMock() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0c0c10] p-4 font-mono text-[.78rem] leading-relaxed text-[#cfd6e4] shadow-2xl">
      <div className="mb-2 flex gap-1.5"><i className="size-2.5 rounded-full bg-[#ef6a5f]" /><i className="size-2.5 rounded-full bg-[#f4be4f]" /><i className="size-2.5 rounded-full bg-[#5fc454]" /></div>
      <p><span className="text-[#7eaaff]">~</span> WildLink-Setup.exe</p>
      <p className="text-white/50">Installation du client… <span className="text-[#5fc454]">terminé</span></p>
      <p className="text-white/50">Taille : 12 Mo · version 0.1.0-alpha</p>
      <p><span className="text-[#7eaaff]">~</span> <span className="animate-pulse">▍</span></p>
    </div>
  )
}
function RomMock() {
  return (
    <div className="grid gap-3 rounded-xl border-2 border-dashed border-white/25 bg-black/30 p-5 text-white shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-white/10 font-mono text-[.7rem] font-bold">.gba</span>
        <div><b className="block text-[.9rem]">rouge_feu.gba</b><span className="text-[.75rem] text-white/60">16 Mo · version française reconnue</span></div>
      </div>
      <div className="grid gap-1.5 text-[.76rem] text-white/70">
        <span className="flex justify-between"><span>Extraction des cartes</span><span className="font-mono">64 %</span></span>
        <span className="h-1.5 overflow-hidden rounded-full bg-white/15"><i className="block h-full w-[64%] rounded-full bg-white" /></span>
      </div>
    </div>
  )
}

function StepCard({ n, title, text, bg, children }: { n: number; title: string; text: string; bg: string; children: ReactNode }) {
  return (
    <article className="panel group grid min-w-0 overflow-hidden">
      <div className="relative grid min-h-[230px] place-items-center overflow-hidden p-6" style={{ background: bg }}>
        <div className="w-full max-w-[330px] transition duration-500 group-hover:-translate-y-1">{children}</div>
      </div>
      <div className="grid gap-2 p-6">
        <span className="eyebrow">Étape {n}</span>
        <h3 className="display text-[1.4rem] !leading-tight">{title}</h3>
        <p className="text-text">{text}</p>
      </div>
    </article>
  )
}

// ---------- Icônes ----------
const I = {
  win: <svg viewBox="0 0 16 16" className="size-5 fill-current"><path d="M1 2.5 7 1.7v6H1zM8 1.6 15 .7v7H8zM1 8.3h6v6L1 13.5zM8 8.3h7v7l-7-.9z" /></svg>,
  linux: <svg viewBox="0 0 16 16" className="size-5 fill-current"><path d="M8 1c2 0 3 1.6 3 3.6 0 1.4.8 2.3 1.6 3.5.9 1.3 1.4 2.7.8 3.9-.5 1-1.7 1-2.6 1.6-.8.6-1.6 1.4-2.8 1.4s-2-.8-2.8-1.4c-.9-.6-2.1-.6-2.6-1.6-.6-1.2-.1-2.6.8-3.9C4.2 6.9 5 6 5 4.6 5 2.6 6 1 8 1z" /></svg>,
  mac: <svg viewBox="0 0 16 16" className="size-5 fill-current"><path d="M11.2 8.5c0-1.6 1.3-2.3 1.4-2.4-.8-1.1-1.9-1.3-2.4-1.3-1-.1-2 .6-2.5.6s-1.3-.6-2.2-.6C4.4 4.8 3.3 5.5 2.7 6.6c-1.2 2.1-.3 5.2.9 6.9.6.8 1.2 1.7 2.1 1.7.8 0 1.2-.5 2.2-.5s1.3.5 2.2.5 1.5-.9 2-1.7c.7-1 .9-1.9 1-2-.1 0-1.9-.7-1.9-3zM9.6 3.6c.5-.6.8-1.3.7-2.1-.7 0-1.5.5-2 1.1-.4.5-.8 1.3-.7 2 .8.1 1.5-.4 2-1z" /></svg>,
  shield: <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.8"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>,
  rom: <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 3v3M15 3v3" /></svg>,
  lock: <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.8"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>,
  check: <svg viewBox="0 0 16 16" className="size-4 shrink-0 fill-none stroke-current" strokeWidth="2"><path d="M3.5 8.5l3 3 6-7" /></svg>,
  cross: <svg viewBox="0 0 16 16" className="size-4 shrink-0 fill-none stroke-current" strokeWidth="2"><path d="M4 4l8 8M12 4l-8 8" /></svg>,
}

export default function Home() {
  const { openAuth, setPlayOpen } = useUi()

  return (
    <div className="overflow-x-clip">
      {/* ---------- Hero ---------- */}
      <section className="relative isolate">
        <div className="wrap grid max-w-[1200px] justify-items-center pt-16 text-center md:pt-24">
          <Link to="/actus/devlog-3" className="group mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 py-1 pr-3 pl-1 text-[.85rem] text-text backdrop-blur transition hover:border-mute">
            <span className="rounded-full bg-accent px-2 py-0.5 text-[.72rem] font-semibold text-accent-fg">Nouveau</span>
            Premier rendu natif du client
            <span className="transition group-hover:translate-x-0.5">→</span>
          </Link>
          <h1 className="display text-[clamp(3.2rem,11vw,8.5rem)]">Wild Link</h1>
          <p className="display mt-4 max-w-[22ch] text-[clamp(1.4rem,3.4vw,2.6rem)] !font-semibold !tracking-[-.025em] text-text">
            Le MMO de capture pour toi <span className="text-gradient-wide">et toute ta région</span>
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button className="btn btn-contrast btn-xl" onClick={() => setPlayOpen(true)}>Télécharger Wild Link</button>
            <button className="btn btn-ghost btn-xl" onClick={() => openAuth('register')}>Créer un compte</button>
          </div>
          <p className="mt-4 text-[.9rem] text-mute">Gratuit · Windows, Linux et macOS · avec ta ROM de Pokémon Rouge Feu</p>
          <div className="mt-3"><AlphaCountdown /></div>
        </div>

        <div className="wrap relative isolate mt-14 max-w-[1080px] md:mt-20">
          <div className="glow -inset-x-10 -top-16 bottom-0 md:-inset-x-24" />
          <WorldShot />
        </div>
      </section>

      {/* ---------- Chiffres clés ---------- */}
      <Section className="!pb-0">
        <div className="grid grid-cols-2 gap-y-10 border-y border-line py-12 md:grid-cols-4">
          {[['200', 'joueurs par zone'], ['240×160', 'la résolution d’origine, nette'], ['0', 'donnée du jeu distribuée'], ['3', 'plateformes : Windows, Linux, macOS']].map(([v, l]) => (
            <div key={l} className="grid justify-items-center gap-1 px-4 text-center">
              <b className="display text-gradient-wide text-[clamp(2.2rem,5vw,3.6rem)]">{v}</b>
              <span className="max-w-[18ch] text-[.92rem] text-text">{l}</span>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-mute">
          <span className="eyebrow">Disponible sur</span>
          <span className="flex items-center gap-2 font-semibold">{I.win}Windows</span>
          <span className="flex items-center gap-2 font-semibold">{I.linux}Linux</span>
          <span className="flex items-center gap-2 font-semibold">{I.mac}macOS</span>
        </div>
      </Section>

      {/* ---------- Fonctionnalités ---------- */}
      <Section>
        <Heading eyebrow="Le jeu" title={<>Tout le jeu,<br />un seul monde</>}>
          Un client natif léger, un serveur qui fait foi et une région où tout le monde joue en même temps.
        </Heading>
        <FeatureTabs />
      </Section>

      {/* ---------- Comment ça marche ---------- */}
      <Section>
        <Heading eyebrow="Installation" title="Prêt à jouer en trois étapes" center>
          Le client n'embarque aucune donnée du jeu original : tout est lu depuis ta ROM, sur ton ordinateur.
        </Heading>
        <div className="grid gap-5 md:grid-cols-3">
          <StepCard n={1} title="Télécharge le client" text="12 Mo, natif, pour Windows, Linux et macOS. Crée ton compte au premier lancement." bg="radial-gradient(circle at 30% 20%, rgba(61,123,255,.55), transparent 60%), radial-gradient(circle at 90% 90%, rgba(138,108,255,.45), transparent 55%), #0e1220">
            <TerminalMock />
          </StepCard>
          <StepCard n={2} title="Ajoute ta ROM" text="Sélectionne la ROM de Pokémon Rouge Feu (.gba). Cartes, sprites et sons sont extraits en local." bg="radial-gradient(circle at 70% 20%, rgba(60,200,245,.5), transparent 60%), radial-gradient(circle at 10% 90%, rgba(61,123,255,.45), transparent 55%), #0b1622">
            <RomMock />
          </StepCard>
          <StepCard n={3} title="Crée ton dresseur" text="Choisis ton apparence et tes couleurs, puis sors du labo avec des centaines d'autres joueurs." bg="radial-gradient(circle at 50% 10%, rgba(138,108,255,.5), transparent 60%), radial-gradient(circle at 80% 100%, rgba(60,200,245,.35), transparent 55%), #120f22">
            <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"><CharacterShot /></div>
          </StepCard>
        </div>
      </Section>

      {/* ---------- Comparaison ---------- */}
      <Section>
        <Heading eyebrow="Jouer avec un ami" title="Moins d'étapes, plus de jeu">
          Sans Wild Link, jouer à plusieurs veut dire émulateur, plugin réseau, ports à ouvrir et versions à accorder.
        </Heading>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="panel grid content-start gap-5 p-7">
            <div className="flex items-baseline justify-between gap-4"><h3 className="text-[1.05rem] font-bold">Émulateur + jeu en réseau</h3><b className="display text-[2.6rem] text-mute">9</b></div>
            <ul className="grid gap-2.5 text-text">
              {['Installer un émulateur compatible', 'Trouver et configurer le plugin réseau', 'Ouvrir un port sur sa box', "Envoyer son IP à l'ami", 'Avoir exactement la même version', '…et recommencer pour chaque ami'].map((t) => <li key={t} className="flex items-start gap-2.5"><span className="mt-1 text-mute">{I.cross}</span>{t}</li>)}
            </ul>
          </div>
          <div className="panel relative isolate grid content-start gap-5 overflow-hidden p-7">
            <div className="glow inset-0 opacity-40" />
            <div className="flex items-baseline justify-between gap-4"><h3 className="text-[1.05rem] font-bold">Wild Link</h3><b className="display text-gradient-wide text-[2.6rem]">2</b></div>
            <ul className="grid gap-2.5 text-fg">
              {['Lancer Wild Link et se connecter', "Rejoindre l'ami, déjà en ligne dans la région"].map((t) => <li key={t} className="flex items-start gap-2.5"><span className="mt-1 text-accent">{I.check}</span>{t}</li>)}
            </ul>
            <p className="mt-auto text-[.8rem] text-mute">Exemple d'illustration.</p>
          </div>
        </div>
      </Section>

      {/* ---------- Garanties ---------- */}
      <Section>
        <Heading eyebrow="Fair-play" title="Pensé pour durer" center />
        <div className="grid gap-5 md:grid-cols-3">
          {[[I.shield, 'Le serveur fait foi', 'Combats, captures et échanges sont validés côté serveur : la triche locale ne sert à rien.'],
            [I.rom, 'Aucune ROM distribuée', 'Wild Link ne fournit aucune donnée du jeu original. Les ressources restent sur ton ordinateur.'],
            [I.lock, 'Compte protégé', 'Mots de passe hachés, sessions révocables et limite de tentatives de connexion.']].map(([icon, t, d]) => (
            <div key={t as string} className="panel grid content-start gap-3 p-7">
              <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-link">{icon}</span>
              <h3 className="text-[1.1rem] font-bold">{t}</h3>
              <p className="text-text">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- Actus ---------- */}
      <Section>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <Heading eyebrow="Actualités" title="Journal de développement" />
          <Link to="/actus" className="link-u mb-12 font-semibold">Tous les articles →</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">{NEWS.slice(0, 3).map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
      </Section>

      {/* ---------- Appel final ---------- */}
      <section className="relative isolate">
        <div className="wrap grid max-w-[1200px] justify-items-center py-28 text-center md:py-36">
          <div className="glow inset-x-[10%] inset-y-10 opacity-70" />
          <h2 className="display text-[clamp(2.4rem,7vw,5.5rem)]">Télécharger Wild Link</h2>
          <p className="mt-5 max-w-[46ch] text-[1.1rem] text-text">Rejoins la région avant tout le monde et garde ton pseudo pour l'alpha.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button className="btn btn-contrast btn-xl" onClick={() => setPlayOpen(true)}>Télécharger</button>
            <Link to="/vote" className="btn btn-ghost btn-xl">Voter pour le serveur</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
