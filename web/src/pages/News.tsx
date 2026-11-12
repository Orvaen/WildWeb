import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Cover from '../components/Cover'
import PostCard, { CatPill } from '../components/PostCard'
import { useUi } from '../context/UiContext'
import { NEWS, readTime, slug } from '../data/news'

// ---------- Liste des actualités ----------
export function NewsList() {
  const cats = ['Tout', ...new Set(NEWS.map((n) => n.cat))]
  const [cat, setCat] = useState('Tout')
  const list = NEWS.filter((p) => cat === 'Tout' || p.cat === cat)
  const [featured, ...rest] = list

  return (
    <div className="wrap max-w-[1200px] pt-14 pb-24 md:pt-20">
      <div className="mb-10 grid gap-4">
        <span className="eyebrow">Actualités</span>
        <h1 className="display text-[clamp(2.6rem,7vw,5rem)]">Journal de développement</h1>
        <p className="max-w-[56ch] text-[1.1rem] text-text">Devlogs, annonces et notes de mise à jour, au fil de la construction de Wild Link.</p>
      </div>

      <div role="tablist" className="mb-10 flex flex-wrap gap-2 border-b border-line pb-5">
        {cats.map((c) => (
          <button key={c} role="tab" aria-selected={c === cat} onClick={() => setCat(c)}
            className={`rounded-full px-4 py-1.5 text-[.9rem] font-medium transition ${c === cat ? 'bg-contrast text-contrast-fg' : 'text-text hover:bg-raised hover:text-fg'}`}>
            {c}
          </button>
        ))}
      </div>

      {featured && (
        <Link to={`/actus/${featured.id}`} className="group mb-16 grid items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
          <Cover art={featured.art} big className="aspect-[16/9] rounded-3xl border border-line" />
          <div className="grid content-center gap-4">
            <div className="flex items-center gap-2.5 text-[.85rem] text-mute"><CatPill cat={featured.cat} />{featured.date} · {readTime(featured)} min de lecture</div>
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.8rem)] transition group-hover:text-link">{featured.title}</h2>
            <p className="text-[1.05rem] text-text">{featured.sum}</p>
            <span className="link-u w-fit font-semibold">Lire l'article →</span>
          </div>
        </Link>
      )}

      {rest.length > 0 && <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p) => <PostCard key={p.id} post={p} />)}</div>}
    </div>
  )
}

// ---------- Page article ----------
function ReadingProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const on = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setP(max > 0 ? Math.min(1, h.scrollTop / max) : 0)
    }
    on()
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])
  return <div className="fixed top-0 left-0 z-50 h-[3px] bg-accent transition-[width] duration-75" style={{ width: `${p * 100}%` }} aria-hidden="true" />
}

function ShareButton() {
  const { toast } = useUi()
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); toast('Lien copié') }
    catch { toast("Copie impossible : copie l'adresse dans la barre du navigateur") }
  }
  return (
    <button onClick={copy} className="btn btn-ghost btn-sm">
      <svg viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current" strokeWidth="1.6" aria-hidden="true"><path d="M6.5 9.5l3-3M7 4.5l1.3-1.3a2.6 2.6 0 0 1 3.7 3.7L10.7 8M9 11.5l-1.3 1.3a2.6 2.6 0 0 1-3.7-3.7L5.3 8" /></svg>
      Copier le lien
    </button>
  )
}

export function Article() {
  const { id } = useParams()
  const i = NEWS.findIndex((n) => n.id === id)
  const p = NEWS[i]

  if (!p) return (
    <div className="wrap grid max-w-[720px] justify-items-start gap-4 pt-20 pb-24">
      <Link to="/actus" className="link-u text-[.9rem] font-semibold">← Toutes les actualités</Link>
      <h1 className="display text-[2.6rem]">Article introuvable</h1>
      <p className="text-text">Cet article n'existe pas ou a été retiré.</p>
    </div>
  )

  const headings = p.body.filter((b) => b.h).map((b) => b.h as string)
  const others = NEWS.filter((n) => n.id !== p.id).slice(0, 3)

  return (
    <article>
      <ReadingProgress />

      {/* En-tête */}
      <header className="wrap grid max-w-[880px] justify-items-center gap-5 pt-14 text-center md:pt-20">
        <Link to="/actus" className="link-u text-[.88rem] font-semibold">← Journal de développement</Link>
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-[.88rem] text-mute"><CatPill cat={p.cat} />{p.date} · {readTime(p)} min de lecture</div>
        <h1 className="display text-[clamp(2.2rem,6vw,4.4rem)]">{p.title}</h1>
        <p className="max-w-[56ch] text-[1.15rem] text-text">{p.sum}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-accent font-extrabold text-accent-fg">O</span>
          <div className="text-left"><b className="block text-[.92rem] text-fg">Orvaen</b><span className="text-[.82rem] text-mute">Fondateur de Wild Link</span></div>
        </div>
      </header>

      <div className="wrap mt-12 max-w-[1200px]">
        <Cover art={p.art} big className="aspect-[16/10] rounded-3xl border border-line sm:aspect-[21/9]" />
      </div>

      {/* Contenu + sommaire */}
      <div className="wrap mt-14 grid max-w-[1080px] gap-12 lg:grid-cols-[200px_minmax(0,680px)] lg:justify-center">
        <aside className="hidden lg:block">
          <div className="sticky top-24 grid gap-6">
            {headings.length > 0 && (
              <nav aria-label="Sommaire" className="grid gap-1">
                <span className="eyebrow mb-2">Dans cet article</span>
                {headings.map((h) => <a key={h} href={`#${slug(h)}`} className="border-l-2 border-line py-1 pl-3 text-[.88rem] text-text transition hover:border-accent hover:text-fg">{h}</a>)}
              </nav>
            )}
            <ShareButton />
          </div>
        </aside>

        <div className="grid min-w-0 content-start gap-6 text-[1.08rem] leading-[1.75] text-fg">
          {p.body.map((b, k) => (
            <div key={k} className="grid gap-4">
              {b.h && <h2 id={slug(b.h)} className="display mt-6 scroll-mt-24 text-[1.8rem]">{b.h}</h2>}
              {b.p && <p className="text-text">{b.p}</p>}
              {b.list && (
                <ul className="grid gap-2.5">
                  {b.list.map((l) => (
                    <li key={l} className="flex gap-3 text-text">
                      <span className="mt-[.7em] size-1.5 shrink-0 rounded-full bg-accent" />{l}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 lg:hidden"><span className="text-[.9rem] text-mute">Partager cet article</span><ShareButton /></div>
        </div>
      </div>

      {/* Suite */}
      <section className="wrap mt-24 max-w-[1200px] border-t border-line pt-16 pb-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-[clamp(1.8rem,3.6vw,2.6rem)]">À lire aussi</h2>
          <Link to="/actus" className="link-u font-semibold">Tous les articles →</Link>
        </div>
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{others.map((o) => <PostCard key={o.id} post={o} />)}</div>
      </section>
    </article>
  )
}
