import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Field, PageHead } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useUi } from '../context/UiContext'
import { PROFILE_COLORS } from '../data/game'
import { ApiError, type User } from '../lib/api'
import { date, strongPassword, validEmail, validUsername } from '../lib/format'
import { store } from '../lib/storage'

type Errors = Record<string, string>
const errorBox = 'rounded-lg bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] px-3 py-2 text-[.86rem] text-bad'

function ProfileForm({ user }: { user: User }) {
  const { updateProfile } = useAuth()
  const { toast } = useUi()
  const [f, setF] = useState({ username: user.username, email: user.email ?? '', color: user.color, lang: user.lang })
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Errors = {}
    if (!validUsername(f.username)) errs.username = '3 à 16 caractères : lettres, chiffres, _ ou -.'
    if (!validEmail(f.email)) errs.email = 'Adresse e-mail invalide.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await updateProfile(f)
      toast('Profil enregistré')
    } catch (err) {
      if (err instanceof ApiError) setErrors({ ...err.fields, form: Object.keys(err.fields).length ? '' : err.message })
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} noValidate className="grid max-w-[440px] gap-3.5">
      <Field id="p-name" label="Pseudo" maxLength={16} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} error={errors.username} />
      <Field id="p-mail" label="E-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} hint="Visible par toi seul." />
      <div className="grid gap-1.5">
        <span className="text-[.88rem] font-semibold text-fg">Couleur du profil</span>
        <div className="flex flex-wrap gap-2">
          {PROFILE_COLORS.map((c) => (
            <button key={c} type="button" aria-label={`Couleur ${c}`} aria-pressed={f.color === c} onClick={() => setF({ ...f, color: c })}
              className={`size-[30px] rounded-full border-2 border-bg transition ${f.color === c ? 'ring-2 ring-fg' : 'ring-1 ring-line'}`} style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="grid gap-1">
        <label htmlFor="p-lang" className="text-[.88rem] font-semibold text-fg">Langue</label>
        <select id="p-lang" className="field-input" value={f.lang} onChange={(e) => setF({ ...f, lang: e.target.value as User['lang'] })}>
          <option value="fr">Français</option><option value="en">English</option><option value="es">Español</option>
        </select>
      </div>
      {errors.form && <p role="alert" className={errorBox}>{errors.form}</p>}
      <button className="btn btn-primary w-fit" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
    </form>
  )
}

function SecurityForm() {
  const { changePassword } = useAuth()
  const { toast } = useUi()
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Errors = {}
    if (!cur) errs.current = 'Entre ton mot de passe actuel.'
    if (!strongPassword(next)) errs.new = 'Au moins 8 caractères, un chiffre et une majuscule.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await changePassword(cur, next)
      setCur(''); setNext('')
      toast('Mot de passe changé. Tes autres appareils ont été déconnectés.')
    } catch (err) {
      if (err instanceof ApiError) setErrors({ ...err.fields, form: Object.keys(err.fields).length ? '' : err.message })
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} noValidate className="grid max-w-[440px] gap-3.5">
      <Field id="s-old" label="Mot de passe actuel" password autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} error={errors.current} />
      <Field id="s-new" label="Nouveau mot de passe" password autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.new} hint={!errors.new && '8 caractères minimum, avec un chiffre et une majuscule'} />
      {errors.form && <p role="alert" className={errorBox}>{errors.form}</p>}
      <button className="btn btn-primary w-fit" disabled={busy}>{busy ? 'Modification…' : 'Changer le mot de passe'}</button>
      <div className="card mt-2 grid gap-1.5 p-4">
        <b className="text-fg">Double authentification</b>
        <p className="text-[.88rem] text-mute">Protège ton compte avec une application d'authentification. Disponible avec l'alpha.</p>
        <button type="button" className="btn btn-ghost btn-sm w-fit" disabled>Activer</button>
      </div>
    </form>
  )
}

export default function Account() {
  const { user, ready, logout } = useAuth()
  const { openAuth, toast } = useUi()
  const [tab, setTab] = useState<'profil' | 'securite' | 'achats'>('profil')

  if (!ready) return <div className="wrap pt-11 pb-16 text-mute">Chargement du compte…</div>
  if (!user) return (
    <div className="wrap pt-11 pb-16">
      <PageHead kicker="Mon compte" title="Connecte-toi">Retrouve ton profil, tes achats et tes récompenses de vote.</PageHead>
      <div className="flex gap-2.5"><button className="btn btn-primary" onClick={() => openAuth('login')}>Se connecter</button><button className="btn btn-ghost" onClick={() => openAuth('register')}>Créer un compte</button></div>
    </div>
  )

  const votes = store.get<number>('vcount', 0)
  const stats: [string, string][] = [['0 h', 'Temps de jeu'], ['0', 'Captures'], ['—', 'Elo PvP'], [String(votes), 'Votes ce mois-ci']]
  const tabs: [typeof tab, string][] = [['profil', 'Profil'], ['securite', 'Sécurité'], ['achats', 'Achats']]

  return (
    <div className="wrap pt-11 pb-16">
      <div className="flex flex-wrap items-center gap-5">
        <Avatar name={user.username} color={user.color} size="size-14 text-[1.4rem] rounded-2xl" />
        <div>
          <h1 className="text-[1.5rem] font-extrabold">{user.username}</h1>
          <p className="flex flex-wrap items-center gap-2 text-mute">Membre depuis le {date(user.createdAt)}
            <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[.74rem] font-semibold text-link capitalize">{user.role}</span>
          </p>
        </div>
        <Link to={`/joueur/${user.username}`} className="link-u ml-auto text-[.88rem] font-semibold">Voir mon profil public →</Link>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([v, l]) => <div key={l} className="card px-4 py-3.5"><b className="block text-[1.2rem] font-extrabold text-fg tabular-nums">{v}</b><span className="text-[.82rem] text-mute">{l}</span></div>)}
      </div>
      <p className="mt-2 text-[.78rem] text-mute">Les statistiques de jeu se rempliront dès l'alpha.</p>

      <div role="tablist" className="mt-9 mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-[.92rem] font-semibold whitespace-nowrap transition ${tab === k ? 'border-accent text-fg' : 'border-transparent text-mute hover:text-fg'}`}>{l}</button>
        ))}
      </div>
      {tab === 'profil' && <ProfileForm key={user.id + user.username} user={user} />}
      {tab === 'securite' && <SecurityForm />}
      {tab === 'achats' && (
        <div className="card grid max-w-[440px] gap-2 p-5"><b className="text-fg">Aucun achat pour l'instant</b><p className="text-mute">Tes achats de la boutique apparaîtront ici.</p><Link className="btn btn-ghost btn-sm w-fit" to="/boutique">Voir la boutique</Link></div>
      )}
      <button className="btn btn-ghost mt-8" onClick={() => { logout(); toast('Tu es déconnecté') }}>Se déconnecter</button>
    </div>
  )
}
