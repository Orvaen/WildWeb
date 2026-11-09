import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Avatar, PageHead } from '../components/ui'

function Q({ q, children, open }: { q: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="card group">
      <summary className="flex cursor-pointer list-none justify-between gap-3 px-4 py-3 text-[.92rem] font-bold text-fg [&::-webkit-details-marker]:hidden">
        {q}<span className="font-medium text-mute group-open:hidden">+</span><span className="hidden font-medium text-mute group-open:inline">–</span>
      </summary>
      <div className="grid gap-2 px-4 pb-4 text-mute">{children}</div>
    </details>
  )
}

const SECTIONS = [['installation', 'Installation'], ['faq', 'FAQ'], ['regles', 'Règlement'], ['equipe', 'Équipe']]
const STAFF = [['Orvaen', 'Fondateur · développeur', '#005ee0'], ['Poste ouvert', 'Modération', '#8a94a3'], ['Poste ouvert', 'Game design', '#8a94a3'], ['Poste ouvert', 'Pixel art', '#8a94a3']]

export default function Wiki() {
  const { hash } = useLocation()
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }) }, [hash])
  const sec = 'mb-11 grid scroll-mt-24 gap-2.5'
  return (
    <div className="wrap pt-11 pb-16">
      <PageHead kicker="Wiki" title="Guide et aide">Tout ce qu'il faut savoir pour installer le client et jouer.</PageHead>
      <div className="grid items-start gap-8 md:grid-cols-[200px_1fr]">
        <nav aria-label="Sommaire" className="flex flex-wrap gap-1 md:sticky md:top-20 md:grid">
          {SECTIONS.map(([id, l]) => <a key={id} href={`#${id}`} className="rounded-md px-2.5 py-1.5 font-medium text-mute hover:bg-raised hover:text-fg">{l}</a>)}
        </nav>
        <div>
          <section id="installation" className={sec}>
            <h2 className="text-[1.15rem] font-extrabold">Installation</h2>
            <Q open q="Configuration requise"><p>Windows 10 ou plus récent, une distribution Linux 64 bits récente, ou macOS 12 et plus. Une carte graphique compatible OpenGL 3.3, 2 Go de RAM et 200 Mo d'espace disque.</p></Q>
            <Q q="Où trouver ma ROM ?"><p>Wild Link ne fournit aucune ROM. Tu dois fournir la ROM de Pokémon Rouge Feu (fichier .gba, version française ou anglaise). Le client vérifie la version du fichier au chargement.</p></Q>
            <Q q="Le client ne se lance pas"><p>Mets à jour tes pilotes graphiques, puis relance. Si le problème continue, envoie le fichier <code className="rounded border border-line bg-raised px-1">wildlink.log</code> sur le salon #support du Discord.</p></Q>
          </section>
          <section id="faq" className={sec}>
            <h2 className="text-[1.15rem] font-extrabold">FAQ</h2>
            <Q q="Le jeu est-il gratuit ?"><p>Oui. La boutique ne vend que des cosmétiques et des grades de confort, sans avantage en combat.</p></Q>
            <Q q="Puis-je jouer sur téléphone ?"><p>Pas pour l'instant. Le client est prévu pour ordinateur. Une version Android sera étudiée après la bêta.</p></Q>
            <Q q="Ma progression sera-t-elle conservée après l'alpha ?"><p>Non, l'alpha sera remise à zéro. Les achats et les récompenses de vote seront conservés sur ton compte.</p></Q>
            <Q q="Mon compte du site sert-il en jeu ?"><p>Oui. Le même compte (pseudo et mot de passe) sert à te connecter dans le client.</p></Q>
          </section>
          <section id="regles" className={sec}>
            <h2 className="text-[1.15rem] font-extrabold">Règlement en jeu</h2>
            <ul className="card grid gap-1.5 p-5 text-[.9rem]">
              {['Respecte les autres joueurs : pas d’insultes, de harcèlement ni de discrimination.', 'Aucun logiciel de triche, macro ou bot de farm automatique.', 'Pas de vente de comptes, de captures ou d’objets contre de l’argent réel.', 'Signale les bugs au lieu de les exploiter.', 'Un seul compte par joueur en PvP classé.'].map((r) => (
                <li key={r} className="flex gap-2 before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-accent">{r}</li>
              ))}
            </ul>
          </section>
          <section id="equipe" className={sec}>
            <h2 className="text-[1.15rem] font-extrabold">Équipe</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {STAFF.map(([n, r, c], i) => <div key={i} className="card flex items-center gap-3 p-4"><Avatar name={n} color={c} /><div><b className="text-fg">{n}</b><p className="text-[.86rem] text-mute">{r}</p></div></div>)}
            </div>
            <div className="card p-5"><h3 className="font-bold">Recrutement</h3><p className="text-mute">Nous cherchons des modérateurs et des testeurs pour l'alpha. Candidature sur le Discord, salon #recrutement.</p></div>
          </section>
        </div>
      </div>
    </div>
  )
}
