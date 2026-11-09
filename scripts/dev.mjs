#!/usr/bin/env node
// Lance l'API Go et le site React ensemble, avec un seul Ctrl+C pour tout arrêter.
//   node scripts/dev.mjs   (ou : npm run dev à la racine, ou double-clic sur run.cmd)
//
// - choisit automatiquement un port libre pour l'API (à partir de 8081)
// - installe les dépendances si elles manquent
// - garde un secret JWT de dev dans api/.dev-secret pour rester connecté entre deux lancements
// - attend que l'API réponde avant de démarrer le site

import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const API = join(ROOT, 'api')
const WEB = join(ROOT, 'web')
const WIN = process.platform === 'win32'

const color = { api: '\x1b[36m', web: '\x1b[35m', run: '\x1b[33m', err: '\x1b[31m', off: '\x1b[0m' }
const say = (tag, msg) => console.log(`${color[tag] ?? ''}[${tag}]${color.off} ${msg}`)
const fail = (msg) => { say('err', msg); process.exit(1) }

function has(cmd) {
  return spawnSync(cmd, ['--version'], { shell: WIN, stdio: 'ignore' }).status === 0
    || spawnSync(cmd, ['version'], { shell: WIN, stdio: 'ignore' }).status === 0
}

function runSync(tag, cmd, args, cwd) {
  say(tag, `${cmd} ${args.join(' ')}`)
  const r = spawnSync(cmd, args, { cwd, shell: WIN, stdio: 'inherit' })
  if (r.status !== 0) fail(`« ${cmd} ${args.join(' ')} » a échoué (code ${r.status}).`)
}

function portFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.once('error', () => resolve(false))
    s.once('listening', () => s.close(() => resolve(true)))
    s.listen(port, '127.0.0.1')
  })
}

async function freePort(from, tries = 50) {
  for (let p = from; p < from + tries; p++) if (await portFree(p)) return p
  fail(`Aucun port libre entre ${from} et ${from + tries - 1}.`)
}

async function waitHealth(port, child, timeoutMs = 120_000) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (child.exitCode !== null) fail("L'API s'est arrêtée au démarrage (voir les lignes [api] au-dessus).")
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/health`)
      if (r.ok) return
    } catch { /* pas encore prête */ }
    await new Promise((r) => setTimeout(r, 400))
  }
  fail("L'API n'a pas répondu à temps.")
}

function start(tag, cmd, args, cwd, env) {
  const child = spawn(cmd, args, { cwd, shell: WIN, env: { ...process.env, ...env, FORCE_COLOR: '1' } })
  const pipe = (stream, out) => {
    let buf = ''
    stream.on('data', (d) => {
      buf += d.toString()
      const lines = buf.split(/\r?\n/)
      buf = lines.pop()
      for (const l of lines) if (l.trim()) out.write(`${color[tag]}[${tag}]${color.off} ${l}\n`)
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  return child
}

// Arrête un processus et tous ses enfants (go run lance un second exécutable).
function kill(child) {
  if (!child || child.exitCode !== null) return
  if (WIN) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  else child.kill('SIGTERM')
}

// ---------- Vérifications ----------
if (!has('go')) fail("Go n'est pas installé ou pas dans le PATH (https://go.dev/dl/).")
if (!has('npm')) fail("Node/npm n'est pas installé ou pas dans le PATH (https://nodejs.org/).")

if (!existsSync(join(API, 'go.sum'))) runSync('run', 'go', ['mod', 'tidy'], API)
if (!existsSync(join(WEB, 'node_modules'))) runSync('run', 'npm', ['install'], WEB)

const secretFile = join(API, '.dev-secret')
if (!existsSync(secretFile)) writeFileSync(secretFile, randomBytes(32).toString('hex'))
const secret = process.env.WL_JWT_SECRET || readFileSync(secretFile, 'utf8').trim()

// ---------- Lancement ----------
const apiPort = await freePort(Number(process.env.WL_API_PORT) || 8081)
if (apiPort !== 8081) say('run', `Port 8081 occupé, l'API utilise le port ${apiPort}.`)

const children = []
const stopAll = (code = 0) => { children.forEach(kill); process.exit(code) }
process.on('SIGINT', () => { say('run', 'Arrêt…'); stopAll(0) })
process.on('SIGTERM', () => stopAll(0))

say('run', `Démarrage de l'API sur 127.0.0.1:${apiPort}…`)
const api = start('api', 'go', ['run', '.'], API, { WL_ADDR: `127.0.0.1:${apiPort}`, WL_JWT_SECRET: secret })
children.push(api)
api.on('exit', (c) => { if (c !== null && c !== 0) { say('err', `L'API s'est arrêtée (code ${c}).`); stopAll(1) } })

await waitHealth(apiPort, api)
say('run', 'API prête. Démarrage du site…')

const web = start('web', 'npm', ['run', 'dev'], WEB, { WL_API_PORT: String(apiPort) })
children.push(web)
web.on('exit', (c) => { if (c !== null && c !== 0) { say('err', `Le site s'est arrêté (code ${c}).`); stopAll(1) } })

say('run', 'Ctrl+C pour tout arrêter.')
