export const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €'
export const fmt = (n: number) => n.toLocaleString('fr-FR')
export const date = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export const strongPassword = (pw: string) => pw.length >= 8 && /\d/.test(pw) && /[A-Z]/.test(pw)
export const passwordScore = (pw: string) =>
  [pw.length >= 8, /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw), pw.length >= 12].filter(Boolean).length
export const validUsername = (u: string) => /^[A-Za-z0-9_-]{3,16}$/.test(u)
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
