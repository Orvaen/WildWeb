import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { Chips, PageHead } from '../components/ui'
import { NEWS } from '../data/news'

export function NewsList() {
  const cats = ['Tout', ...new Set(NEWS.map((n) => n.cat))]
  const [cat, setCat] = useState('Tout')
  return (
    <div className="wrap pt-11 pb-16">
      <PageHead kicker="Actualités" title="Journal de développement">Annonces, devlogs et notes de mise à jour.</PageHead>
      <Chips value={cat} options={cats} onChange={setCat} />
      <div className="grid gap-3.5 md:grid-cols-3">
        {NEWS.map((p, i) => ({ p, i })).filter(({ p }) => cat === 'Tout' || p.cat === cat).map(({ p, i }) => <PostCard key={p.id} post={p} index={i} />)}
      </div>
    </div>
  )
}

export function Article() {
  const { id } = useParams()
  const i = NEWS.findIndex((n) => n.id === id)
  const p = NEWS[i]
  const back = <Link to="/actus" className="link-u w-fit text-[.85rem] font-semibold">← Toutes les actualités</Link>
  if (!p) return (
    <div className="wrap grid max-w-[68ch] gap-4 pt-11 pb-16">{back}<h1 className="text-2xl font-extrabold">Article introuvable</h1><p className="text-mute">Cet article n'existe pas ou a été retiré.</p></div>
  )
  const prev = NEWS[i + 1], next = NEWS[i - 1]
  return (
    <article className="wrap grid max-w-[68ch] gap-4 pt-11 pb-16">
      {back}
      <div className="flex items-center gap-2.5 text-[.85rem] text-mute"><span className="rounded-md bg-accent px-2 py-0.5 text-[.74rem] font-semibold text-accent-fg">{p.cat}</span>{p.date}</div>
      <h1 className="text-[clamp(1.6rem,3.2vw,2.1rem)] leading-tight font-extrabold">{p.title}</h1>
      <p className="text-[1.05rem] text-mute">{p.sum}</p>
      {p.body.map((b, k) => (
        <div key={k} className="grid gap-2">
          {b.h && <h2 className="mt-2 text-[1.1rem] font-bold">{b.h}</h2>}
          {b.p && <p className="text-fg">{b.p}</p>}
          {b.list && <ul className="grid list-disc gap-1 pl-5 text-fg">{b.list.map((l) => <li key={l}>{l}</li>)}</ul>}
        </div>
      ))}
      <div className="mt-3 flex flex-wrap justify-between gap-3 border-t border-line pt-4 text-[.85rem] font-semibold">
        {prev ? <Link className="link-u" to={`/actus/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next && <Link className="link-u" to={`/actus/${next.id}`}>{next.title} →</Link>}
      </div>
    </article>
  )
}
