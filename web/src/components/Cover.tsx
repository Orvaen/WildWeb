import type { CoverArt } from '../data/news'
import { Logo } from './ui'

// Illustration d'article : fond dégradé sombre, trame de points et un motif propre à chaque sujet.

const BG: Record<CoverArt, string> = {
  code: 'radial-gradient(circle at 20% 20%, rgba(61,123,255,.55), transparent 55%), radial-gradient(circle at 90% 90%, rgba(138,108,255,.5), transparent 55%), #0b0f1d',
  rom: 'radial-gradient(circle at 80% 20%, rgba(60,200,245,.5), transparent 55%), radial-gradient(circle at 10% 90%, rgba(61,123,255,.45), transparent 55%), #08141d',
  logo: 'radial-gradient(circle at 50% 30%, rgba(61,123,255,.6), transparent 60%), radial-gradient(circle at 85% 95%, rgba(60,200,245,.35), transparent 50%), #070b16',
  road: 'radial-gradient(circle at 15% 80%, rgba(138,108,255,.5), transparent 55%), radial-gradient(circle at 90% 15%, rgba(61,123,255,.45), transparent 55%), #0e0b1d',
  site: 'radial-gradient(circle at 70% 70%, rgba(61,123,255,.5), transparent 55%), radial-gradient(circle at 20% 10%, rgba(60,200,245,.4), transparent 50%), #0a1020',
  team: 'radial-gradient(circle at 30% 30%, rgba(60,200,245,.45), transparent 55%), radial-gradient(circle at 80% 80%, rgba(138,108,255,.5), transparent 55%), #0b0d1c',
}

function Art({ art, big }: { art: CoverArt; big: boolean }) {
  const s = big ? 1 : .62
  const win = 'rounded-xl border border-white/15 bg-black/45 shadow-2xl backdrop-blur-sm'
  switch (art) {
    case 'code':
      return (
        <div className={`${win} w-[84%] max-w-[420px] overflow-hidden whitespace-nowrap p-[4%] font-mono text-white/80`} style={{ fontSize: `${.78 * s}rem`, lineHeight: 1.7 }}>
          <div className="mb-[3%] flex gap-1.5"><i className="size-2 rounded-full bg-[#ef6a5f]" /><i className="size-2 rounded-full bg-[#f4be4f]" /><i className="size-2 rounded-full bg-[#5fc454]" /></div>
          <p><span className="text-[#c792ea]">while</span> (!lumina_should_close(win)) {'{'}</p>
          <p className="pl-[6%]">glClear(GL_COLOR_BUFFER_BIT);</p>
          <p className="pl-[6%]"><span className="text-[#7eaaff]">render_map</span>(&amp;map);</p>
          <p className="pl-[6%]">lumina_swap(win);</p>
          <p>{'}'}</p>
        </div>
      )
    case 'rom':
      return (
        <div className={`${win} flex w-[66%] max-w-[360px] items-center gap-[5%] p-[5%] text-white`}>
          <span className="grid aspect-[3/4] w-[24%] shrink-0 place-items-center rounded-md bg-gradient-to-b from-white/25 to-white/5 font-mono font-bold" style={{ fontSize: `${.7 * s}rem` }}>GBA</span>
          <div className="grid min-w-0 grow gap-[.4em]" style={{ fontSize: `${.85 * s}rem` }}>
            <b className="truncate">rouge_feu.gba</b>
            <span className="text-white/55">cartes · sprites · sons</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-white/15"><i className="block h-full w-[72%] rounded-full bg-white" /></span>
          </div>
        </div>
      )
    case 'logo':
      return <div className="drop-shadow-[0_20px_40px_rgba(61,123,255,.55)] [--bg:#070b16] [--fg:#ffffff]"><Logo className={big ? 'size-36' : 'size-20'} /></div>
    case 'road':
      return (
        <div className="relative w-[80%] max-w-[460px]">
          <div className="absolute top-1/2 right-[6%] left-[6%] h-0.5 -translate-y-1/2 bg-gradient-to-r from-white/70 via-white/40 to-white/10" />
          <div className="relative flex justify-between">
            {['Client', 'Serveur', 'Alpha', 'Bêta'].map((l, i) => (
              <div key={l} className="grid justify-items-center gap-2 text-white" style={{ fontSize: `${.78 * s}rem` }}>
                <span className={`grid place-items-center rounded-full border-2 ${i < 1 ? 'border-white bg-white text-[#0e0b1d]' : 'border-white/50 bg-[#0e0b1d]'}`} style={{ width: `${2.2 * s}rem`, height: `${2.2 * s}rem` }}>{i + 1}</span>
                <span className={i < 1 ? 'font-semibold' : 'text-white/60'}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )
    case 'site':
      return (
        <div className={`${win} w-[74%] max-w-[420px] overflow-hidden`}>
          <div className="flex items-center gap-1.5 border-b border-white/10 px-[4%] py-[2.5%]"><i className="size-2 rounded-full bg-white/30" /><i className="size-2 rounded-full bg-white/30" /><span className="ml-2 rounded bg-white/10 px-2 font-mono text-white/60" style={{ fontSize: `${.62 * s}rem` }}>wildlink.arkerion.dev</span></div>
          <div className="grid justify-items-center gap-[.5em] p-[7%] text-white">
            <b style={{ fontSize: `${1.5 * s}rem`, fontFamily: 'var(--font-display)', letterSpacing: '-.03em' }}>Wild Link</b>
            <span className="rounded-lg bg-white px-3 py-1 font-semibold text-black" style={{ fontSize: `${.7 * s}rem` }}>Télécharger</span>
          </div>
        </div>
      )
    case 'team':
      return (
        <div className="flex -space-x-[4%]">
          {['#3d7bff', '#3cc8f5', '#8a6cff', '#ffffff'].map((c, i) => (
            <span key={c} className="grid place-items-center rounded-2xl border-4 border-[#0b0d1c] font-extrabold" style={{ background: c, color: i === 3 ? '#0b0d1c' : '#fff', width: `${4.2 * s}rem`, height: `${4.2 * s}rem`, fontSize: `${1.4 * s}rem` }}>
              {i === 3 ? '+' : ['O', 'L', 'K'][i]}
            </span>
          ))}
        </div>
      )
  }
}

export default function Cover({ art, big = false, className = '' }: { art: CoverArt; big?: boolean; className?: string }) {
  return (
    <div className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: BG[art] }} aria-hidden="true">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.35) 1px, transparent 1.2px)', backgroundSize: '20px 20px', maskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 75%)' }} />
      <div className="relative grid w-full place-items-center transition duration-500 group-hover:scale-[1.03]"><Art art={art} big={big} /></div>
    </div>
  )
}
