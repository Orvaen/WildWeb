import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUi } from '../context/UiContext'
import { ApiError } from '../lib/api'
import { passwordScore, strongPassword, validEmail, validUsername } from '../lib/format'
import { Field, Modal, Segmented } from './ui'

type Errors = Record<string, string>

function LoginForm() {
  const { login } = useAuth()
  const { closeAuth, openAuth, toast } = useUi()
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Errors = {}
    if (!id.trim()) errs.login = 'Entre ton pseudo ou ton e-mail.'
    if (!pw) errs.password = 'Entre ton mot de passe.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const u = await login(id.trim(), pw, remember)
      closeAuth()
      toast(`Bienvenue ${u.username} !`)
      navigate('/compte')
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Erreur inattendue.' })
    } finally {
      setBusy(false)
      setPw('')
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-2.5">
      <Field id="l-id" label="Pseudo ou e-mail" autoComplete="username" placeholder="Sacha_42" value={id} onChange={(e) => setId(e.target.value)} error={errors.login} />
      <Field id="l-pw" label="Mot de passe" password autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} error={errors.password} />
      <label className="flex items-center gap-2 text-[.88rem] text-mute">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[var(--accent)]" />
        Rester connecté 30 jours
      </label>
      {errors.form && <p role="alert" className="rounded-lg bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] px-3 py-2 text-[.86rem] text-bad">{errors.form}</p>}
      <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
      <p className="text-center text-[.88rem] text-mute">Pas encore de compte ? <button type="button" className="link-u font-semibold" onClick={() => openAuth('register')}>Créer un compte</button></p>
    </form>
  )
}

function RegisterForm() {
  const { register } = useAuth()
  const { closeAuth, openAuth, toast } = useUi()
  const navigate = useNavigate()
  const [f, setF] = useState({ username: '', email: '', password: '', confirm: '' })
  const [cgu, setCgu] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const score = passwordScore(f.password)
  const meter = ['Très faible', 'Très faible', 'Faible', 'Correct', 'Solide', 'Très solide'][score]
  const meterColor = score <= 2 ? 'var(--bad)' : score === 3 ? 'var(--warn)' : 'var(--good)'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Errors = {}
    if (!validUsername(f.username)) errs.username = '3 à 16 caractères : lettres, chiffres, _ ou -.'
    if (!validEmail(f.email)) errs.email = 'Adresse e-mail invalide.'
    if (!strongPassword(f.password)) errs.password = 'Au moins 8 caractères, un chiffre et une majuscule.'
    if (!f.confirm || f.confirm !== f.password) errs.confirm = 'Les mots de passe ne correspondent pas.'
    if (!cgu) errs.cgu = 'Tu dois accepter les CGU pour continuer.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const u = await register(f.username, f.email, f.password)
      closeAuth()
      toast(`Compte créé, bienvenue ${u.username} !`)
      navigate('/compte')
    } catch (err) {
      if (err instanceof ApiError) setErrors({ ...err.fields, form: Object.keys(err.fields).length ? '' : err.message })
      else setErrors({ form: 'Erreur inattendue.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-2.5">
      <Field id="r-name" label="Pseudo" autoComplete="username" maxLength={16} placeholder="Sacha_42" value={f.username} onChange={set('username')} error={errors.username} hint={!errors.username && '3 à 16 caractères : lettres, chiffres, _ et -'} />
      <Field id="r-mail" label="E-mail" type="email" autoComplete="email" placeholder="toi@exemple.fr" value={f.email} onChange={set('email')} error={errors.email} />
      <div className="grid items-start gap-2.5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Field id="r-pw" label="Mot de passe" password autoComplete="new-password" value={f.password} onChange={set('password')} error={errors.password} />
          <div className="h-1 overflow-hidden rounded bg-line"><i className="block h-full transition-all" style={{ width: `${(score / 5) * 100}%`, background: meterColor }} /></div>
          {!errors.password && <span className="text-[.76rem] text-mute">{f.password ? meter : '8 car. min., 1 chiffre, 1 majuscule'}</span>}
        </div>
        <Field id="r-pw2" label="Confirmer" password autoComplete="new-password" value={f.confirm} onChange={set('confirm')} error={errors.confirm} />
      </div>
      <label className="flex items-start gap-2 text-[.88rem] text-mute">
        <input type="checkbox" checked={cgu} onChange={(e) => setCgu(e.target.checked)} className="mt-1 accent-[var(--accent)]" />
        J'accepte les CGU et le règlement de Wild Link
      </label>
      {errors.cgu && <span className="-mt-1.5 text-[.78rem] text-bad">{errors.cgu}</span>}
      {errors.form && <p role="alert" className="rounded-lg bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] px-3 py-2 text-[.86rem] text-bad">{errors.form}</p>}
      <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Création…' : 'Créer mon compte'}</button>
      <p className="text-center text-[.88rem] text-mute">Déjà inscrit ? <button type="button" className="link-u font-semibold" onClick={() => openAuth('login')}>Se connecter</button></p>
    </form>
  )
}

export default function AuthModal() {
  const { authMode, openAuth, closeAuth } = useUi()
  return (
    <Modal open={authMode !== null} onClose={closeAuth} labelledBy="auth-title" wide>
      <h3 id="auth-title" className="text-[1.1rem] font-extrabold">{authMode === 'register' ? 'Inscription' : 'Connexion'}</h3>
      <Segmented value={authMode ?? 'login'} options={[['login', 'Connexion'], ['register', 'Inscription']]} onChange={openAuth} />
      {authMode === 'register' ? <RegisterForm key="r" /> : <LoginForm key="l" />}
    </Modal>
  )
}
