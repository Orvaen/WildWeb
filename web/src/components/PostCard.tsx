import { Link } from 'react-router-dom'
import type { Post } from '../data/news'

export default function PostCard({ post, index }: { post: Post; index: number }) {
  const h = (index * 67 + 200) % 360
  return (
    <Link to={`/actus/${post.id}`} className="card group grid min-w-0 content-start overflow-hidden transition hover:-translate-y-0.5 hover:border-accent">
      <div className="flex aspect-[2/1] items-end p-3" style={{
        background: `radial-gradient(circle at 25% 30%, hsl(${h} 60% 62% / .55), transparent 60%), radial-gradient(circle at 80% 80%, hsl(${h + 60} 70% 60% / .45), transparent 55%), var(--bg-3)`,
      }}>
        <span className="rounded-md bg-surface px-2.5 py-1 text-[.74rem] font-semibold text-fg">{post.cat}</span>
      </div>
      <div className="grid content-start gap-1.5 px-4 pt-3.5 pb-4">
        <span className="text-[.8rem] text-mute">{post.date}</span>
        <h3 className="text-[.95rem] leading-snug font-bold">{post.title}</h3>
        <p className="text-[.86rem]">{post.sum}</p>
        <span className="link-u mt-1 w-fit text-[.8rem] font-semibold">Lire l'article →</span>
      </div>
    </Link>
  )
}
