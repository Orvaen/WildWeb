import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'

export function Logo({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="30" fill="var(--fg)" />
      <g fill="var(--bg)">
        <path d="M19 15c4 9 6 21 3 34l-4 1c2-12 2-23 1-35z" />
        <path d="M31 11c4 11 5 26 2 41l-5 1c3-14 3-28 3-42z" />
        <path d="M43 15c3 10 3 21-1 33l-4 0c3-11 4-22 5-33z" />
      </g>
    </svg>
  )
}

export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 grid max-w-[62ch] gap-1.5">
      <span className="kicker">{kicker}</span>
      <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-extrabold">{title}</h1>
      {children && <p className="text-mute">{children}</p>}
    </div>
  )
}

export function SectionHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mb-6 grid max-w-[60ch] justify-items-center gap-1.5 text-center">
      <span className="kicker">{kicker}</span>
      <h2 className="text-[clamp(1.3rem,2.6vw,1.7rem)] font-extrabold">{title}</h2>
      {children && <p className="text-mute">{children}</p>}
    </div>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: ReactNode; password?: boolean }

export function Field({ label, error, hint, password, id, ...rest }: FieldProps) {
  const [show, setShow] = useState(false)
  const input = (
    <input id={id} {...rest} type={password ? (show ? 'text' : 'password') : rest.type}
      aria-invalid={!!error} className={`field-input ${password ? 'pr-20' : ''}`} />
  )
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-[.88rem] font-semibold text-fg">{label}</label>
      {password ? (
        <div className="relative">
          {input}
          <button type="button" onClick={() => setShow(!show)}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md px-2 py-1 text-[.8rem] font-semibold text-mute hover:text-fg">
            {show ? 'Masquer' : 'Afficher'}
          </button>
        </div>
      ) : input}
      {hint && <span className="text-[.76rem] text-mute">{hint}</span>}
      {error && <span className="text-[.78rem] text-bad">{error}</span>}
    </div>
  )
}

export function Modal({ open, onClose, labelledBy, children, wide }: { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLElement>('input, button:not([data-close])')?.focus()
    return () => removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: 'var(--scrim)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        className={`animate-pop relative grid max-h-[calc(100dvh-32px)] w-full gap-3 overflow-auto rounded-[14px] border border-line bg-surface px-6 py-[22px] ${wide ? 'max-w-[520px]' : 'max-w-[460px]'}`}>
        <button data-close aria-label="Fermer" onClick={onClose}
          className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-raised text-fg hover:bg-line">×</button>
        {children}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 rounded-lg bg-raised p-1">
      {options.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={`flex-1 rounded-md px-2 py-1.5 text-[.84rem] font-semibold transition ${value === k ? 'bg-surface text-fg shadow-sm' : 'text-mute hover:text-fg'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}

export function Chips<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} className="chip" aria-pressed={o === value} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}

// Avatar du joueur : son image s'il en a envoyé une, sinon l'initiale sur sa couleur.
export function Avatar({ name, color, src, size = 'size-10 text-base rounded-xl', className = '' }: { name: string; color: string; src?: string; size?: string; className?: string }) {
  if (src) return <img src={src} alt="" className={`shrink-0 object-cover ${size} ${className}`} style={{ background: color }} />
  return <span className={`grid shrink-0 place-items-center font-extrabold text-white ${size} ${className}`} style={{ background: color }}>{name[0]?.toUpperCase()}</span>
}

export function Gem() {
  return <i className="inline-block size-3 shrink-0 rotate-45 rounded-[2px]" style={{ background: 'linear-gradient(135deg,var(--accent),var(--sky))' }} />
}
