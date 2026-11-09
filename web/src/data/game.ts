// Données de la boutique, du vote et du classement. Les joueurs et scores sont des exemples.

export type Rank = { id: string; name: string; price: number; best?: boolean; perks: string[] }
export const RANKS: Rank[] = [
  { id: 'ranger', name: 'Ranger', price: 4.99, perks: ['Pseudo en couleur', '2 emplacements de boîte en plus', 'Accès au salon Discord VIP'] },
  { id: 'champion', name: 'Champion', price: 9.99, best: true, perks: ['Tout le grade Ranger', '1 000 gemmes chaque mois', 'File prioritaire à la connexion', 'Emote exclusive'] },
  { id: 'maitre', name: 'Maître', price: 19.99, perks: ['Tout le grade Champion', '2 500 gemmes chaque mois', 'Titre de profil animé', 'Accès anticipé aux nouveautés'] },
]

export type GemPack = { id: string; n: number; price: number; bonus?: string }
export const GEMS: GemPack[] = [
  { id: 'g500', n: 500, price: 4.99 },
  { id: 'g1200', n: 1200, price: 9.99, bonus: '+20 %' },
  { id: 'g2600', n: 2600, price: 19.99, bonus: '+30 %' },
]

export type Cosmetic = { id: string; cat: string; name: string; gems: number; sw: [string, string] }
export const COSMETICS: Cosmetic[] = [
  { id: 'c1', cat: 'Tenues', name: 'Tenue Randonneur', gems: 600, sw: ['#4a7c59', '#d9c39a'] },
  { id: 'c2', cat: 'Tenues', name: 'Tenue Nuit d’été', gems: 800, sw: ['#1e2a4a', '#f2c14e'] },
  { id: 'c3', cat: 'Montures', name: 'Vélo rétro rouge', gems: 1200, sw: ['#c4372b', '#e8e8e8'] },
  { id: 'c4', cat: 'Montures', name: 'Vélo néon', gems: 1500, sw: ['#16a3b8', '#e94fa4'] },
  { id: 'c5', cat: 'Effets', name: 'Traînée de feuilles', gems: 400, sw: ['#6cc47a', '#2f6b3a'] },
  { id: 'c6', cat: 'Effets', name: 'Traînée d’étincelles', gems: 450, sw: ['#f2a541', '#fff1c9'] },
]

export type CartItem = { id: string; name: string; price?: number; gems?: number }
export const ALL_ITEMS: CartItem[] = [
  ...RANKS.map((r) => ({ id: r.id, name: 'Grade ' + r.name, price: r.price })),
  ...GEMS.map((g) => ({ id: g.id, name: g.n.toLocaleString('fr-FR') + ' gemmes', price: g.price })),
  ...COSMETICS.map((c) => ({ id: c.id, name: c.name, gems: c.gems })),
]

export const VOTE_SITES = [
  { id: 'v1', name: 'Top Serveurs' },
  { id: 'v2', name: 'Serveurs-Jeux' },
  { id: 'v3', name: 'Liste des MMO' },
]
export const VOTE_COOLDOWN = 90 * 60 * 1000

// Générateur déterministe pour des données d'exemple stables
function rng(seed: number) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647 }
const A = ['Sacha', 'Lyra', 'Kael', 'Nova', 'Ryu', 'Mira', 'Tao', 'Zed', 'Elio', 'Yuna', 'Orin', 'Vex', 'Lumi', 'Kira', 'Aro', 'Nyx']
const B = ['', '_', 'x', '42', 'TV', 'Pro', '07', 'Dex', 'Fox', 'GG', '_Fr', '99']

export type Player = { name: string; elo: number; w: number; l: number }
function makeLadder(seed: number): Player[] {
  const r = rng(seed); const used = new Set<string>()
  const name = () => A[Math.floor(r() * A.length)] + B[Math.floor(r() * B.length)] + (r() < .4 ? Math.floor(r() * 90 + 10) : '')
  return Array.from({ length: 100 }, (_, i) => {
    let n: string
    do n = name(); while (used.has(n))
    used.add(n)
    const elo = Math.round(2150 - i * 9 - r() * 6)
    const games = Math.floor(r() * 120 + 40)
    const wr = Math.min(.78, .42 + (100 - i) / 330 + r() * .05)
    const w = Math.round(games * wr)
    return { name: n, elo, w, l: games - w }
  })
}
export const LADDER = { simple: makeLadder(7), double: makeLadder(31) }

export const TOP_VOTERS = (() => {
  const r = rng(11)
  return Array.from({ length: 10 }, (_, i) => ({ name: A[Math.floor(r() * A.length)] + B[Math.floor(r() * B.length)] + i, votes: 62 - i * 3 - Math.floor(r() * 2) }))
})()

export const tierOf = (elo: number): [string, string] =>
  elo >= 2000 ? ['Maître', 'var(--accent)'] : elo >= 1800 ? ['Diamant', '#3fa4c9'] : elo >= 1600 ? ['Or', '#c9961a'] : elo >= 1400 ? ['Argent', '#8a94a3'] : ['Bronze', '#b06b3a']

export const PROFILE_COLORS = ['#005ee0', '#0284c7', '#1f9a55', '#c4372b', '#c9961a', '#7c4dcc', '#13181a']
