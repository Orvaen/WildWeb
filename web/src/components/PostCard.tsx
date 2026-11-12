import { Link } from 'react-router-dom'
import { readTime, type Post } from '../data/news'
import Cover from './Cover'

export const CAT_STYLE: Record<string, string> = {
  Devlog: 'bg-[rgba(61,123,255,.16)] text-link',
  Annonce: 'bg-[rgba(138,108,255,.18)] text-violet',
  'Mise à jour': 'bg-[rgba(60,200,245,.16)] text-sky',
  Communauté: 'bg-raised text-text',
}

export function CatPill({ cat }: { cat: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[.74rem] font-semibold ${CAT_STYLE[cat] ?? 'bg-raised text-text'}`}>{cat}</span>
}

export default function PostCard({ post }: { post: Post; index?: number }) {
  return (
    <Link to={`/actus/${post.id}`} className="group grid min-w-0 content-start gap-4">
      <Cover art={post.art} className="aspect-[16/10] rounded-2xl border border-line" />
      <div className="grid gap-2 px-1">
        <div className="flex items-center gap-2.5 text-[.82rem] text-mute"><CatPill cat={post.cat} />{post.date} · {readTime(post)} min</div>
        <h3 className="display text-[1.3rem] !leading-snug transition group-hover:text-link">{post.title}</h3>
        <p className="line-clamp-2 text-text">{post.sum}</p>
      </div>
    </Link>
  )
}
