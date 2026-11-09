export const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €'
export const fmt = (n: number) => n.toLocaleString('fr-FR')
export const date = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export const strongPassword = (pw: string) => pw.length >= 8 && /\d/.test(pw) && /[A-Z]/.test(pw)
export const passwordScore = (pw: string) =>
  [pw.length >= 8, /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw), pw.length >= 12].filter(Boolean).length
export const validUsername = (u: string) => /^[A-Za-z0-9_-]{3,16}$/.test(u)
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

// « il y a 5 min », « hier », etc.
export function ago(iso: string | null): string {
  if (!iso) return 'jamais'
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  if (s < 172800) return 'hier'
  if (s < 30 * 86400) return `il y a ${Math.floor(s / 86400)} jours`
  return 'le ' + date(iso)
}
export const isOnline = (iso: string | null) => !!iso && Date.now() - new Date(iso).getTime() < 5 * 60 * 1000
