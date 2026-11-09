import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Field, PageHead } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useUi } from '../context/UiContext'
import { BANNERS, PROFILE_COLORS, ROLE_LABEL, bannerOf } from '../data/game'
import { ApiError, type User } from '../lib/api'
import { strongPassword, validEmail, validUsername } from '../lib/format'

// Paramètres du compte, façon forum : menu à gauche, sections en cartes à droite.

type Errors = Record<string, string>
type Section = 'profil' | 'compte' | 'securite' | 'achats'
const errorBox = 'rounded-lg bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] px-3 py-2 text-[.86rem] text-bad'

function Panel({ title, desc, children, footer }: { title: string; desc: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <header className="border-b border-line px-5 py-4">
        <h2 className="text-[1.02rem] font-bold">{title}</h2>
        <p className="text-[.86rem] text-mute">{desc}</p>
      </header>
      <div className="grid gap-4 p-5">{children}</div>
      {footer && <footer className="flex items-center justify-end gap-3 border-t border-line bg-raised px-5 py-3">{footer}</footer>}
    </section>
  )
}

function useSave() {
  const { updateProfile } = useAuth()
  const { toast } = useUi()
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const save = async (patch: Parameters<typeof updateProfile>[0], local: Errors = {}) => {
    setErrors(local)
    if (Object.keys(local).length) return
    setBusy(true)
    try { await updateProfile(patch); toast('Modifications enregistrées') }
    catch (err) { if (err instanceof ApiError) setErrors({ ...err.fields, form: Object.keys(err.fields).length ? '' : err.message }) }
    finally { setBusy(false) }
  }
  return { errors, busy, save }
}

function PublicProfile({ user }: { user: User }) {
  const [f, setF] = useState({ color: user.color, banner: user.banner || 'ocean', bio: user.bio, location: user.location })
  const { errors, busy, save } = useSave()
  const dirty = f.color !== user.color || f.banner !== user.banner || f.bio !== user.bio || f.location !== user.location
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Errors = {}
    if (f.bio.length > 280) errs.bio = '280 caractères maximum.'
    if (f.location.length > 40) errs.location = '40 caractères maximum.'
    save(f, errs)
  }
  return (
    <form onSubmit={submit} noValidate>
      <Panel title="Profil public" desc="Ce que les autres joueurs voient sur ta page."
        footer={<>{dirty && <span className="mr-auto text-[.82rem] text-mute">Modifications non enregistrées</span>}<button className="btn btn-primary" disabled={busy || !dirty}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></>}>
        {/* Aperçu en direct */}
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="h-24" style={{ background: bannerOf(f.banner) }} />
          <div className="flex items-end gap-3 px-4 pb-4">
            <span className="-mt-8 grid size-16 place-items-center rounded-2xl border-4 border-surface text-2xl font-extrabold text-white" style={{ background: f.color }}>{user.username[0]?.toUpperCase()}</span>
            <div className="min-w-0 pb-0.5">
              <b className="block text-fg">{user.username}</b>
              <span className="block truncate text-[.82rem] text-mute">{f.bio || 'Ta bio apparaîtra ici.'}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-1.5">
          <span className="text-[.88rem] font-semibold text-fg">Bannière</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Object.entries(BANNERS).map(([id, b]) => (
              <button key={id} type="button" aria-pressed={f.banner === id} onClick={() => setF({ ...f, banner: id })}
                className={`grid gap-1 rounded-lg p-1 text-[.74rem] text-mute transition ${f.banner === id ? 'ring-2 ring-accent' : 'ring-1 ring-line hover:ring-mute'}`}>
                <i className="block h-9 rounded-md" style={{ background: b.bg }} />{b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <span className="text-[.88rem] font-semibold text-fg">Couleur de l'avatar</span>
          <div className="flex flex-wrap gap-2">
            {PROFILE_COLORS.map((c) => (
              <button key={c} type="button" aria-label={`Couleur ${c}`} aria-pressed={f.color === c} onClick={() => setF({ ...f, color: c })}
                className={`size-[30px] rounded-full border-2 border-surface transition ${f.color === c ? 'ring-2 ring-fg' : 'ring-1 ring-line'}`} style={{ background: c }} />
            ))}
          </div>
        </div>

        <div className="grid gap-1">
          <label htmlFor="p-bio" className="text-[.88rem] font-semibold text-fg">Bio</label>
          <textarea id="p-bio" rows={4} maxLength={280} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })}
            placeholder="Ton style de jeu, ta créature préférée, ce que tu cherches…" aria-invalid={!!errors.bio} className="field-input resize-y" />
          <div className="flex justify-between text-[.76rem]"><span className="text-bad">{errors.bio}</span><span className="text-mute tabular-nums">{f.bio.length} / 280</span></div>
        </div>
        <Field id="p-loc" label="Localisation" maxLength={40} placeholder="Avignon, France" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} error={errors.location} />
        {errors.form && <p role="alert" className={errorBox}>{errors.form}</p>}
      </Panel>
    </form>
  )
}

function AccountInfo({ user }: { user: User }) {
  const [f, setF] = useState({ username: user.username, email: user.email ?? '', lang: user.lang })
  const { errors, busy, save } = useSave()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Errors = {}
    if (!validUsername(f.username)) errs.username = '3 à 16 caractères : lettres, chiffres, _ ou -.'
    if (!validEmail(f.email)) errs.email = 'Adresse e-mail invalide.'
    save(f, errs)
  }
  return (
    <form onSubmit={submit} noValidate>
      <Panel title="Compte" desc="Tes identifiants de connexion, sur le site et dans le jeu."
        footer={<button className="btn btn-primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="a-name" label="Pseudo" maxLength={16} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} error={errors.username} />
          <Field id="a-mail" label="E-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} hint={!errors.email && 'Jamais affiché publiquement.'} />
        </div>
        <div className="grid max-w-[260px] gap-1">
          <label htmlFor="a-lang" className="text-[.88rem] font-semibold text-fg">Langue</label>
          <select id="a-lang" className="field-input" value={f.lang} onChange={(e) => setF({ ...f, lang: e.target.value as User['lang'] })}>
            <option value="fr">Français</option><option value="en">English</option><option value="es">Español</option>
          </select>
        </div>
        {errors.form && <p role="alert" className={errorBox}>{errors.form}</p>}
      </Panel>
    </form>
  )
}

function Security() {
  const { changePassword, logout } = useAuth()
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
    try { await changePassword(cur, next); setCur(''); setNext(''); toast('Mot de passe changé. Tes autres appareils ont été déconnectés.') }
    catch (err) { if (err instanceof ApiError) setErrors({ ...err.fields, form: Object.keys(err.fields).length ? '' : err.message }) }
    finally { setBusy(false) }
  }
  return (
    <div className="grid gap-5">
      <form onSubmit={submit} noValidate>
        <Panel title="Mot de passe" desc="Changer ton mot de passe déconnecte tous tes autres appareils."
          footer={<button className="btn btn-primary" disabled={busy}>{busy ? 'Modification…' : 'Changer le mot de passe'}</button>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="s-old" label="Mot de passe actuel" password autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} error={errors.current} />
            <Field id="s-new" label="Nouveau mot de passe" password autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.new} hint={!errors.new && '8 car. min., 1 chiffre, 1 majuscule'} />
          </div>
          {errors.form && <p role="alert" className={errorBox}>{errors.form}</p>}
        </Panel>
      </form>
      <Panel title="Double authentification" desc="Protège ton compte avec une application d'authentification.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-md bg-raised px-2 py-1 text-[.8rem] font-semibold text-mute">Désactivée</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled>Disponible avec l'alpha</button>
        </div>
      </Panel>
      <Panel title="Session" desc="Te déconnecter de ce navigateur.">
        <button type="button" className="btn btn-ghost w-fit" onClick={() => { logout(); toast('Tu es déconnecté') }}>Se déconnecter</button>
      </Panel>
    </div>
  )
}

const SECTIONS: [Section, string, string][] = [
  ['profil', 'Profil public', 'M8 1a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM1.5 15c0-3 2.9-5 6.5-5s6.5 2 6.5 5z'],
  ['compte', 'Compte', 'M1 3h14v10H1zm2 2v1l5 3 5-3V5L8 8z'],
  ['securite', 'Sécurité', 'M8 0l6 2.5V7c0 4-2.6 7.6-6 9-3.4-1.4-6-5-6-9V2.5z'],
  ['achats', 'Achats', 'M1 1h2.2l.6 2H15l-1.6 6H5.2l.4 1.5H14V12H4.4L2.2 2.5H1zM5 13.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm7 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z'],
]

export default function Account() {
  const { user, ready } = useAuth()
  const { openAuth } = useUi()
  const [section, setSection] = useState<Section>('profil')

  if (!ready) return <div className="wrap pt-11 pb-16 text-mute">Chargement du compte…</div>
  if (!user) return (
    <div className="wrap pt-11 pb-16">
      <PageHead kicker="Mon compte" title="Connecte-toi">Retrouve ton profil, tes achats et tes récompenses de vote.</PageHead>
      <div className="flex gap-2.5"><button className="btn btn-primary" onClick={() => openAuth('login')}>Se connecter</button><button className="btn btn-ghost" onClick={() => openAuth('register')}>Créer un compte</button></div>
    </div>
  )

  return (
    <div className="wrap max-w-[1080px] pt-8 pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><span className="kicker">Paramètres</span><h1 className="text-[1.6rem] font-extrabold">Mon compte</h1></div>
        <Link to={`/joueur/${user.username}`} className="btn btn-ghost">Voir mon profil →</Link>
      </div>
      <div className="grid items-start gap-6 md:grid-cols-[230px_1fr]">
        <nav aria-label="Sections" className="card grid gap-0.5 p-2 md:sticky md:top-20">
          <div className="mb-1 flex items-center gap-3 rounded-lg px-2 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl font-extrabold text-white" style={{ background: user.color }}>{user.username[0]?.toUpperCase()}</span>
            <div className="min-w-0"><b className="block truncate text-fg">{user.username}</b><span className="text-[.78rem] text-mute">{ROLE_LABEL[user.role] ?? user.role}</span></div>
          </div>
          {SECTIONS.map(([k, l, d]) => (
            <button key={k} onClick={() => setSection(k)} aria-current={section === k ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[.9rem] font-medium transition ${section === k ? 'bg-accent-soft text-link' : 'text-text hover:bg-raised hover:text-fg'}`}>
              <svg viewBox="0 0 16 16" className="size-4 shrink-0 fill-current" aria-hidden="true"><path d={d} /></svg>{l}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          {section === 'profil' && <PublicProfile key={user.id} user={user} />}
          {section === 'compte' && <AccountInfo key={user.id} user={user} />}
          {section === 'securite' && <Security />}
          {section === 'achats' && (
            <Panel title="Achats" desc="L'historique de tes achats sur la boutique.">
              <div className="rounded-[10px] border border-dashed border-line px-4 py-8 text-center">
                <p className="font-semibold text-fg">Aucun achat pour l'instant</p>
                <p className="mb-3 text-mute">Tes grades, gemmes et cosmétiques apparaîtront ici.</p>
                <Link className="btn btn-ghost btn-sm" to="/boutique">Voir la boutique</Link>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
