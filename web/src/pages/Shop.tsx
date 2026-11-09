import { useEffect, useState } from 'react'
import { Chips, Gem, PageHead } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useUi } from '../context/UiContext'
import { ALL_ITEMS, COSMETICS, GEMS, RANKS } from '../data/game'
import { eur, fmt } from '../lib/format'
import { store } from '../lib/storage'

export default function Shop() {
  const { user } = useAuth()
  const { toast, openAuth } = useUi()
  const [cart, setCart] = useState<string[]>(() => store.get('cart', []))
  const [cat, setCat] = useState('Tout')
  const [note, setNote] = useState("Le paiement ouvrira avec l'alpha. Les prix sont indicatifs.")
  useEffect(() => store.set('cart', cart), [cart])

  const add = (id: string) => {
    if (COSMETICS.some((c) => c.id === id) && cart.includes(id)) return toast('Déjà dans ton panier')
    // Un seul grade à la fois
    const base = RANKS.some((r) => r.id === id) ? cart.filter((c) => !RANKS.some((r) => r.id === c)) : cart
    setCart([...base, id])
    toast('Ajouté au panier')
  }
  const items = cart.map((id) => ALL_ITEMS.find((i) => i.id === id)).filter((i) => i !== undefined)
  const total = items.reduce((s, i) => s + (i.price ?? 0), 0)
  const gems = items.reduce((s, i) => s + (i.gems ?? 0), 0)
  const checkout = () => {
    if (!user) { setNote('Connecte-toi pour finaliser ta commande.'); openAuth('login'); return }
    setNote(`Merci ${user.username} ! Le paiement n'est pas encore branché : rien n'a été débité.`)
  }
  const cats = ['Tout', ...new Set(COSMETICS.map((c) => c.cat))]
  const item = 'card grid min-w-0 content-start gap-2 p-4 transition hover:-translate-y-0.5 hover:border-accent'

  return (
    <div className="wrap pt-11 pb-16">
      <PageHead kicker="Boutique" title="Soutiens Wild Link">Tout ce qui est vendu ici est cosmétique ou confort. Aucun achat ne donne d'avantage en combat.</PageHead>
      <div className="grid items-start gap-7 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-11">
          <section className="grid gap-4">
            <h2 className="text-[1.15rem] font-extrabold">Grades</h2>
            <div className="grid gap-3.5 md:grid-cols-3">
              {RANKS.map((r) => (
                <div key={r.id} className={`${item} ${r.best ? 'outline-2 outline-accent' : ''}`}>
                  {r.best && <span className="w-fit rounded-md bg-accent px-2 py-0.5 text-[.72rem] font-semibold text-accent-fg">Le plus choisi</span>}
                  <h3 className="text-[.95rem] font-bold">{r.name}</h3>
                  <div className="text-[1.2rem] font-extrabold text-fg">{eur(r.price)} <small className="text-[.8rem] font-medium text-mute">/ mois</small></div>
                  <ul className="grid gap-1.5 text-[.86rem]">{r.perks.map((p) => <li key={p} className="flex gap-2 before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-accent">{p}</li>)}</ul>
                  <button className={`btn ${r.best ? 'btn-primary' : 'btn-ghost'} mt-1`} onClick={() => add(r.id)}>Ajouter</button>
                </div>
              ))}
            </div>
          </section>
          <section className="grid gap-4">
            <div><h2 className="text-[1.15rem] font-extrabold">Gemmes</h2><p className="text-mute">La monnaie de la boutique, utilisable pour les cosmétiques.</p></div>
            <div className="grid gap-3.5 md:grid-cols-3">
              {GEMS.map((g) => (
                <div key={g.id} className={item}>
                  <div className="flex items-center gap-2 text-[1.3rem] font-bold text-fg"><Gem />{fmt(g.n)}</div>
                  <span className={`w-fit rounded-md px-2 py-0.5 text-[.72rem] font-semibold ${g.bonus ? 'bg-accent text-accent-fg' : 'border border-line text-mute'}`}>{g.bonus ?? 'Pack de base'}</span>
                  <div className="mt-1 flex items-center justify-between"><b className="text-fg tabular-nums">{eur(g.price)}</b><button className="btn btn-ghost btn-sm" onClick={() => add(g.id)}>Ajouter</button></div>
                </div>
              ))}
            </div>
          </section>
          <section className="grid gap-4">
            <h2 className="text-[1.15rem] font-extrabold">Cosmétiques</h2>
            <Chips value={cat} options={cats} onChange={setCat} />
            <div className="-mt-3 grid gap-3.5 md:grid-cols-3">
              {COSMETICS.filter((c) => cat === 'Tout' || c.cat === cat).map((c) => (
                <div key={c.id} className={item}>
                  <div className="grid h-16 place-items-center rounded-lg bg-raised"><div className="flex gap-1.5">{c.sw.map((s) => <i key={s} className="h-8 w-7 rounded-md" style={{ background: s }} />)}</div></div>
                  <span className="text-[.78rem] text-mute">{c.cat}</span>
                  <h3 className="text-[.95rem] font-bold">{c.name}</h3>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 font-bold text-fg tabular-nums"><Gem />{fmt(c.gems)}</span><button className="btn btn-ghost btn-sm" onClick={() => add(c.id)}>Ajouter</button></div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside aria-label="Panier" className="card sticky top-20 grid gap-3.5 p-5 shadow-sm">
          <h3 className="text-[1.05rem] font-bold">Panier</h3>
          <ul className="grid gap-2.5">
            {items.length ? items.map((it, k) => (
              <li key={k} className="flex items-center justify-between gap-2.5 text-[.9rem]">
                <span>{it.name}</span>
                <span className="flex items-center gap-1.5 tabular-nums">
                  {it.price ? eur(it.price) : <><Gem />{fmt(it.gems ?? 0)}</>}
                  <button aria-label={`Retirer ${it.name}`} className="px-1 text-mute hover:text-fg" onClick={() => setCart(cart.filter((_, j) => j !== k))}>×</button>
                </span>
              </li>
            )) : <li className="text-mute">Ton panier est vide.</li>}
          </ul>
          <div className="flex justify-between border-t border-line pt-3 font-bold text-fg"><span>Total</span><span className="tabular-nums">{eur(total)}</span></div>
          <div className="flex justify-between font-semibold"><span className="text-mute">Gemmes</span><span className="flex items-center gap-1.5 text-fg tabular-nums"><Gem />{fmt(gems)}</span></div>
          <button className="btn btn-primary" disabled={!items.length} onClick={checkout}>Passer au paiement</button>
          <p className="rounded-lg border border-dashed border-line px-3 py-2 text-[.82rem] text-mute">{note}</p>
        </aside>
      </div>
    </div>
  )
}
