import { useEffect, useRef, type ReactNode } from 'react'

// Scènes pixel art à la résolution GBA (240×160), agrandies sans flou.
type Ctx = CanvasRenderingContext2D

function painter(c: Ctx, seedInit: number) {
  let seed = seedInit
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const P = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h) }
  return { r, P }
}

function drawWorld(c: Ctx) {
  const { r, P } = painter(c, 99)
  const grass = (x: number, y: number) => { P(x, y, 16, 16, '#7cc35a'); for (let i = 0; i < 4; i++) { const a = x + Math.floor(r() * 14), b = y + Math.floor(r() * 14); P(a, b, 1, 2, '#64ab48'); P(a + 1, b + 1, 1, 1, '#64ab48') } }
  const tiles: Record<string, (x: number, y: number) => void> = {
    g: grass,
    t: (x, y) => { P(x, y, 16, 16, '#529d3e'); for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) { const bx = x + k * 4, by = y + j * 4; P(bx, by + 3, 4, 1, '#3c7d2e'); P(bx + 1, by, 1, 3, '#70c24f'); P(bx + 2, by + 1, 1, 2, '#8cd664') } },
    p: (x, y) => { P(x, y, 16, 16, '#e5cd94'); for (let i = 0; i < 5; i++) P(x + Math.floor(r() * 15), y + Math.floor(r() * 15), 1, 1, r() < .5 ? '#cfb378' : '#f2deac') },
    a: (x, y) => { grass(x, y); P(x + 6, y + 11, 4, 5, '#7a5532'); P(x + 1, y + 3, 14, 8, '#2f7a3a'); P(x + 3, y + 1, 10, 12, '#2f7a3a'); P(x + 4, y + 3, 5, 3, '#4aa04e'); P(x + 5, y + 2, 3, 1, '#66bb66'); P(x + 2, y + 10, 12, 2, '#235e2c') },
    f: (x, y) => { grass(x, y); const cs = ['#f05050', '#f6d23a', '#ffffff']; for (let i = 0; i < 2; i++) { const a = x + 3 + i * 7, b = y + 3 + Math.floor(r() * 7), col = cs[Math.floor(r() * 3)]; P(a, b + 1, 3, 1, col); P(a + 1, b, 1, 3, col); P(a + 1, b + 1, 1, 1, '#ffe9a0') } },
    s: (x, y) => { grass(x, y); P(x + 7, y + 9, 2, 6, '#6b4a2b'); P(x + 2, y + 3, 12, 7, '#a8794a'); P(x + 3, y + 4, 10, 5, '#c79a63'); P(x + 4, y + 5, 8, 1, '#7a5532'); P(x + 4, y + 7, 6, 1, '#7a5532') },
    w: (x, y) => { P(x, y, 16, 16, '#4a9ee0'); P(x + 2, y + 4, 5, 1, '#8cc8f4'); P(x + 9, y + 10, 5, 1, '#8cc8f4') },
  }
  const map = ['aaaaaaaaaaaaaaa', 'aagggfggaggggaa', 'ggtttggggggtttg', 'ggtttgpppggtttg', 'gggggppppgggggf', 'gfgpppggppgwwwg', 'ppppggsgpppwwwg', 'ppgggggggppgggg', 'aggtttgfggppgaa', 'aaatttggggppaaa']
  map.forEach((row, j) => [...row].forEach((k, i) => tiles[k](i * 16, j * 16)))
  const sprite = ['....HHHHHH......', '...HHHHHHHH.....', '...HWWHHHHHH....', '...KSSSSSSK.....', '...SKSSSSKS.....', '....SSSSSS......', '...BBBBBBBB.....', '..SBBBBBBBBS....', '..SBBBBBBBBS....', '...DDDDDDDD.....', '...DDD..DDD.....', '...KKK..KKK.....']
  const trainer = (x: number, y: number, hat: string, shirt: string) => {
    const pal: Record<string, string> = { H: hat, W: '#ffffff', K: '#20242a', S: '#f1c39a', B: shirt, D: '#2f3d55' }
    P(x + 3, y + 13, 9, 2, 'rgba(0,0,0,.2)')
    sprite.forEach((row, j) => [...row].forEach((ch, i) => { if (pal[ch]) P(x + i, y + j + 2, 1, 1, pal[ch]) }))
  }
  trainer(48, 40, '#e05a47', '#3f7fd6')
  trainer(116, 78, '#2f7bf0', '#f2a35e')
  trainer(184, 98, '#7a4bd6', '#5fae3e')
}

function drawBattle(c: Ctx) {
  const { P } = painter(c, 1)
  const g = c.createLinearGradient(0, 0, 0, 160)
  g.addColorStop(0, '#bfe3f7'); g.addColorStop(.55, '#e8f6e0'); g.addColorStop(1, '#bfe0a0')
  c.fillStyle = g; c.fillRect(0, 0, 240, 160)
  P(0, 52, 240, 2, '#a8d48a')
  const ell = (cx: number, cy: number, rx: number, ry: number) => { for (let yy = -ry; yy <= ry; yy++) { const w = Math.round(rx * Math.sqrt(1 - (yy * yy) / (ry * ry))); P(cx - w, cy + yy, w * 2, 1, yy < 0 ? '#a6d884' : '#8cc46a') } }
  ell(170, 74, 40, 9); ell(66, 112, 52, 11)
  // créature de feu, de face
  let x = 152, y = 40
  P(x + 4, y + 30, 28, 5, 'rgba(0,0,0,.18)'); P(x + 6, y + 10, 24, 20, '#e8833a'); P(x + 4, y + 14, 28, 12, '#e8833a')
  P(x + 6, y + 4, 6, 8, '#e8833a'); P(x + 24, y + 4, 6, 8, '#e8833a'); P(x + 8, y + 6, 2, 4, '#ffd27a'); P(x + 26, y + 6, 2, 4, '#ffd27a')
  P(x + 10, y + 20, 16, 8, '#ffe0b0'); P(x + 11, y + 14, 4, 4, '#ffffff'); P(x + 21, y + 14, 4, 4, '#ffffff'); P(x + 12, y + 15, 2, 3, '#20242a'); P(x + 22, y + 15, 2, 3, '#20242a')
  P(x + 16, y + 21, 4, 1, '#a04a20'); P(x + 30, y + 6, 4, 8, '#ffb02e'); P(x + 32, y + 2, 3, 6, '#ffd64a'); P(x + 33, y, 2, 3, '#fff1a0')
  // créature d'eau, de dos
  x = 40; y = 78
  P(x + 6, y + 30, 36, 6, 'rgba(0,0,0,.18)'); P(x + 8, y + 10, 32, 22, '#3f8fd8'); P(x + 4, y + 16, 40, 14, '#3f8fd8'); P(x + 12, y + 6, 24, 6, '#3f8fd8')
  P(x + 14, y + 2, 6, 6, '#3f8fd8'); P(x + 28, y + 2, 6, 6, '#3f8fd8'); P(x + 10, y + 12, 10, 6, '#7cc0f2'); P(x + 18, y + 18, 14, 10, '#8fd0f6')
  P(x + 38, y + 20, 8, 4, '#2a6db0'); P(x + 44, y + 16, 4, 6, '#2a6db0')
  P(30, 14, 26, 6, '#ffffff'); P(36, 10, 14, 4, '#ffffff'); P(120, 22, 20, 5, '#ffffff'); P(125, 18, 10, 4, '#ffffff')
}

function PixelCanvas({ draw }: { draw: (c: Ctx) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current?.getContext('2d')
    if (!c) return
    c.imageSmoothingEnabled = false
    draw(c)
  }, [draw])
  return <canvas ref={ref} width={240} height={160} className="pixel block size-full" aria-hidden="true" />
}

export function ShotFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="shot m-0 min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center gap-1.5 border-b border-line bg-raised px-3 py-2">
        <i className="size-[9px] rounded-full bg-[#ef6a5f]" /><i className="size-[9px] rounded-full bg-[#f4be4f]" /><i className="size-[9px] rounded-full bg-[#5fc454]" />
        <span className="ml-2 truncate text-[.75rem] font-medium text-mute">{title}</span>
      </div>
      <div className="relative aspect-[3/2] overflow-hidden">{children}</div>
    </figure>
  )
}

const tag = 'absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[1cqw] bg-[rgba(10,14,20,.72)] px-[1.2cqw] py-[.3cqw] text-[2.3cqw] font-semibold text-white'

export function WorldShot() {
  return (
    <ShotFrame title="Wild Link · Route 3">
      <PixelCanvas draw={drawWorld} />
      <span className={tag} style={{ left: '23%', top: '30%' }}>Lyra_42</span>
      <span className={tag + ' !bg-[#005ee0]'} style={{ left: '52%', top: '50%' }}>Toi</span>
      <span className={tag} style={{ left: '80%', top: '62%' }}>KaelTV</span>
      <div className="absolute bottom-[2.5cqw] left-[2.5cqw] w-[42cqw] rounded-[2cqw] bg-[rgba(10,14,20,.7)] px-[2cqw] py-[1.6cqw] text-[2.2cqw] leading-[1.45] text-[#e9eef5]">
        <p><b className="text-[#8ec1ff]">Lyra_42</b> qqn pour l'arène ?</p>
        <p><b className="text-[#8ec1ff]">KaelTV</b> go, j'arrive</p>
        <p className="text-[#ffd27a]">Nova a rejoint la zone</p>
      </div>
    </ShotFrame>
  )
}

function Hp({ name, lvl, pct, color, className, hp }: { name: string; lvl: number; pct: number; color: string; className: string; hp?: string }) {
  return (
    <div className={`absolute grid w-[38cqw] grid-cols-[1fr_auto] gap-x-[2cqw] gap-y-[.6cqw] rounded-[1.8cqw] bg-[rgba(250,251,252,.95)] px-[2cqw] py-[1.4cqw] text-[2.5cqw] text-[#1a2026] shadow-[0_.6cqw_0_rgba(0,0,0,.15)] ${className}`}>
      <b>{name}</b><span className="font-semibold text-[#55606a]">N.{lvl}</span>
      <div className="col-span-2 h-[1.5cqw] overflow-hidden rounded-[1cqw] bg-[#d9dee3]"><i className="block h-full rounded-[1cqw]" style={{ width: pct + '%', background: color }} /></div>
      {hp && <small className="col-span-2 text-right text-[2.1cqw] text-[#55606a] tabular-nums">{hp}</small>}
    </div>
  )
}

export function BattleShot() {
  const moves: [string, string][] = [['Hydrocanon', '#4a9ee0'], ['Vague glacée', '#7cc8f0'], ['Protection', '#a0a8b0'], ['Repos', '#c890e8']]
  return (
    <ShotFrame title="Wild Link · Combat classé">
      <PixelCanvas draw={drawBattle} />
      <Hp name="Brasille" lvl={32} pct={38} color="#f0b23a" className="top-[5cqw] left-[4cqw]" />
      <Hp name="Ondine" lvl={34} pct={82} color="#3cc06a" className="top-[31cqw] right-[4cqw]" hp="87 / 106" />
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-[1.2cqw] bg-[rgba(18,24,32,.88)] p-[2cqw]">
        {moves.map(([m, c]) => (
          <span key={m} className="rounded-[1.4cqw] bg-[#f6f8fa] px-[2cqw] py-[1.3cqw] text-[2.4cqw] font-semibold text-[#1a2026]" style={{ borderLeft: `1.2cqw solid ${c}` }}>{m}</span>
        ))}
      </div>
    </ShotFrame>
  )
}

export function MarketShot() {
  const rows: [string, string, string, string][] = [['#5aa9e6', 'Ondine', 'N.30 · Calme', '12 500 ₽'], ['#f2a35e', 'Brasille', 'N.25 · Rigide', '9 800 ₽'], ['#9b7be0', 'Pierre lune', 'Objet · x3', '4 200 ₽'], ['#6cc47a', 'Feuillet', 'N.18 · Jovial', '3 150 ₽']]
  return (
    <ShotFrame title="Wild Link · Hôtel des ventes">
      <div className="grid h-full content-start gap-[1.8cqw] bg-bg p-[3cqw]">
        <div className="flex items-center gap-[1.5cqw]">
          <span className="flex-1 rounded-[1.6cqw] border border-line bg-surface px-[2.2cqw] py-[1.6cqw] text-[2.4cqw] text-mute">Rechercher…</span>
          {['Captures', 'Objets'].map((c) => <span key={c} className="rounded-full bg-accent-soft px-[2.2cqw] py-[1.2cqw] text-[2.2cqw] font-semibold text-link">{c}</span>)}
        </div>
        {rows.map(([c, n, d, p]) => (
          <div key={n} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-[2.4cqw] rounded-[2cqw] border border-line bg-surface px-[2.4cqw] py-[2cqw] text-[2.4cqw]">
            <i className="size-[7cqw] rounded-[1.8cqw]" style={{ background: `radial-gradient(circle at 35% 35%,#fff8,transparent 45%),${c}` }} />
            <div><b className="block text-fg">{n}</b><small className="text-[2.1cqw] text-mute">{d}</small></div>
            <span className="font-bold text-fg tabular-nums">{p}</span>
            <em className="rounded-full bg-accent px-[2.4cqw] py-[1cqw] text-[2.2cqw] font-semibold not-italic text-accent-fg">Acheter</em>
          </div>
        ))}
      </div>
    </ShotFrame>
  )
}
