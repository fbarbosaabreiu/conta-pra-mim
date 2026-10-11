// Worker de medição do Fala Falinha.
//   POST /e        recebe um lote de eventos do app (só de aparelhos que consentiram)
//   POST /forget   apaga todos os eventos de um aparelho (pedido feito pela tela Privacidade)
//   GET  /painel   painel de uso, protegido por senha (DASHBOARD_PASSWORD)

import { renderDashboard, type DashboardData } from './dashboard'

interface D1Result<T> {
  results: T[]
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<unknown>
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<unknown>
}
interface Env {
  DB: D1Database
  DASHBOARD_PASSWORD?: string
  ALLOWED_ORIGINS: string
}
interface CfProps {
  country?: string
  region?: string
  city?: string
  timezone?: string
}

const EVENT_NAMES = new Set([
  'app_open',
  'story_open',
  'story_complete',
  'quiz_start',
  'quiz_complete',
  'onboarding_done',
  'onboarding_skip',
])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const SLUG = /^[a-z0-9-]{1,40}$/
const MAX_BODY = 16_000
const MAX_EVENTS = 50

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    const cors: Record<string, string> =
      origin && allowed.includes(origin)
        ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
        : {}

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    try {
      if (url.pathname === '/e' && request.method === 'POST') {
        if (!cors['Access-Control-Allow-Origin']) return new Response('origem não permitida', { status: 403 })
        return await ingest(request, env, cors)
      }
      if (url.pathname === '/forget' && request.method === 'POST') {
        if (!cors['Access-Control-Allow-Origin']) return new Response('origem não permitida', { status: 403 })
        return await forget(request, env, cors)
      }
      if (url.pathname === '/painel' || url.pathname === '/painel/') {
        const denied = checkPassword(request, env)
        if (denied) return denied
        const days = parseDays(url.searchParams.get('d'))
        const data = await loadDashboard(env, days)
        return new Response(renderDashboard(data), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        })
      }
    } catch (err) {
      console.error(err)
      return new Response('erro', { status: 500, headers: cors })
    }
    return new Response('não encontrado', { status: 404 })
  },
}

// ---------- Recebimento ----------

interface IncomingEvent {
  name?: unknown
  story?: unknown
  theme?: unknown
  value?: unknown
  t?: unknown
  hour?: unknown
  dow?: unknown
}
interface IncomingBatch {
  device?: unknown
  session?: unknown
  lang?: unknown
  standalone?: unknown
  events?: unknown
  catalog?: unknown
}

const str = (x: unknown, re: RegExp) => (typeof x === 'string' && re.test(x) ? x : null)
const int = (x: unknown, min: number, max: number) =>
  typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max ? x : null

async function readJson<T>(request: Request): Promise<T | null> {
  const text = await request.text()
  if (text.length > MAX_BODY) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function platformOf(ua: string): string {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'outro'
}

async function ingest(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const body = await readJson<IncomingBatch>(request)
  const device = body && str(body.device, UUID)
  const session = body && str(body.session, UUID)
  if (!body || !device || !session || !Array.isArray(body.events)) {
    return new Response('lote inválido', { status: 400, headers: cors })
  }

  const cf = ((request as unknown as { cf?: CfProps }).cf ?? {}) as CfProps
  const now = Date.now()
  const ts = new Date(now).toISOString()
  const lang = str(body.lang, /^[a-z]{2}$/)
  const standalone = body.standalone === true ? 1 : 0
  const platform = platformOf(request.headers.get('User-Agent') ?? '')

  const insert = env.DB.prepare(
    `INSERT INTO events (ts, client_ts, hour, dow, device, session, name, story, theme, value, lang, country, region, city, tz, platform, standalone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const statements: D1PreparedStatement[] = []
  for (const e of (body.events as IncomingEvent[]).slice(0, MAX_EVENTS)) {
    if (typeof e?.name !== 'string' || !EVENT_NAMES.has(e.name)) continue
    // Horário do aparelho só é aceito se for plausível (até 7 dias atrás, sem futuro).
    const t = typeof e.t === 'number' && e.t <= now + 60_000 && e.t >= now - 7 * 864e5 ? new Date(e.t).toISOString() : null
    statements.push(
      insert.bind(
        ts,
        t,
        int(e.hour, 0, 23),
        int(e.dow, 0, 6),
        device,
        session,
        e.name,
        str(e.story, SLUG),
        str(e.theme, SLUG),
        int(e.value, 0, 1000),
        lang,
        cf.country ?? null,
        cf.region ?? null,
        cf.city ?? null,
        cf.timezone ?? null,
        platform,
        standalone,
      ),
    )
  }

  // Catálogo de histórias (id + título), para mostrar também as que ninguém abriu.
  if (Array.isArray(body.catalog)) {
    const upsert = env.DB.prepare(
      'INSERT INTO stories (id, title, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at',
    )
    for (const s of body.catalog.slice(0, 200) as { id?: unknown; title?: unknown }[]) {
      const id = str(s?.id, SLUG)
      const title = typeof s?.title === 'string' ? s.title.slice(0, 80) : null
      if (id && title) statements.push(upsert.bind(id, title, ts))
    }
  }

  if (statements.length) await env.DB.batch(statements)
  return new Response(null, { status: 204, headers: cors })
}

async function forget(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const body = await readJson<{ device?: unknown }>(request)
  const device = body && str(body.device, UUID)
  if (!device) return new Response('aparelho inválido', { status: 400, headers: cors })
  await env.DB.prepare('DELETE FROM events WHERE device = ?').bind(device).run()
  return new Response(null, { status: 204, headers: cors })
}

// ---------- Painel ----------

function checkPassword(request: Request, env: Env): Response | null {
  const unauthorized = () =>
    new Response('Senha necessária', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Fala Falinha - painel", charset="UTF-8"' },
    })
  if (!env.DASHBOARD_PASSWORD) return new Response('Defina DASHBOARD_PASSWORD (wrangler secret put).', { status: 503 })
  const header = request.headers.get('Authorization') ?? ''
  if (!header.startsWith('Basic ')) return unauthorized()
  let decoded = ''
  try {
    decoded = new TextDecoder().decode(Uint8Array.from(atob(header.slice(6)), (c) => c.charCodeAt(0)))
  } catch {
    return unauthorized()
  }
  const password = decoded.slice(decoded.indexOf(':') + 1)
  return safeEqual(password, env.DASHBOARD_PASSWORD) ? null : unauthorized()
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function parseDays(d: string | null): number {
  if (d === null || d === '') return 30 // padrão: últimos 30 dias ("0" = tudo)
  const n = Number(d)
  return [7, 30, 90, 0].includes(n) ? n : 30
}

async function loadDashboard(env: Env, days: number): Promise<DashboardData> {
  const since = days ? new Date(Date.now() - days * 864e5).toISOString() : '0000'
  const q = <T>(sql: string, ...args: unknown[]) =>
    env.DB.prepare(sql)
      .bind(...args)
      .all<T>()
      .then((r) => r.results)

  const [totals, newDevices, daily, storyStats, catalog, quiz, places, heat, devices, recent, platforms, langs] =
    await Promise.all([
      q<DashboardData['totals']>(
        `SELECT COUNT(DISTINCT device) AS devices, COUNT(DISTINCT session) AS sessions,
                SUM(name = 'story_open') AS storyOpens, SUM(name = 'story_complete') AS storyCompletes,
                SUM(name = 'quiz_complete') AS quizCompletes
         FROM events WHERE ts >= ?`,
        since,
      ),
      q<{ n: number }>(`SELECT COUNT(*) AS n FROM (SELECT device FROM events GROUP BY device HAVING MIN(ts) >= ?)`, since),
      q<DashboardData['daily'][number]>(
        `SELECT substr(ts, 1, 10) AS day, COUNT(DISTINCT device) AS devices, COUNT(DISTINCT session) AS sessions
         FROM events WHERE ts >= ? GROUP BY day ORDER BY day`,
        since,
      ),
      q<{ story: string; opens: number; completes: number; devices: number }>(
        `SELECT story, SUM(name = 'story_open') AS opens, SUM(name = 'story_complete') AS completes,
                COUNT(DISTINCT CASE WHEN name = 'story_open' THEN device END) AS devices
         FROM events WHERE ts >= ? AND story IS NOT NULL GROUP BY story`,
        since,
      ),
      q<{ id: string; title: string }>(`SELECT id, title FROM stories`),
      q<DashboardData['quiz'][number]>(
        `SELECT theme, SUM(name = 'quiz_start') AS starts, SUM(name = 'quiz_complete') AS completes,
                COUNT(DISTINCT device) AS devices
         FROM events WHERE ts >= ? AND theme IS NOT NULL GROUP BY theme ORDER BY starts DESC`,
        since,
      ),
      q<DashboardData['places'][number]>(
        `SELECT country, region, city, COUNT(DISTINCT device) AS devices, COUNT(DISTINCT session) AS sessions
         FROM events WHERE ts >= ? GROUP BY country, region, city ORDER BY devices DESC, sessions DESC LIMIT 20`,
        since,
      ),
      q<DashboardData['heat'][number]>(
        `SELECT dow, hour, COUNT(DISTINCT session) AS sessions
         FROM events WHERE ts >= ? AND dow IS NOT NULL AND hour IS NOT NULL GROUP BY dow, hour`,
        since,
      ),
      q<DashboardData['devices'][number]>(
        `SELECT device, MIN(ts) AS first, MAX(ts) AS last, COUNT(DISTINCT session) AS sessions,
                SUM(name = 'story_open') AS stories, SUM(name = 'quiz_complete') AS quizzes,
                MAX(city) AS city, MAX(country) AS country, MAX(platform) AS platform, MAX(lang) AS lang,
                MAX(standalone) AS installed
         FROM events WHERE ts >= ? GROUP BY device ORDER BY last DESC LIMIT 100`,
        since,
      ),
      q<DashboardData['recent'][number]>(
        `SELECT ts, device, name, story, theme, value, city, country FROM events ORDER BY id DESC LIMIT 40`,
      ),
      q<{ key: string; devices: number }>(
        `SELECT platform AS key, COUNT(DISTINCT device) AS devices FROM events WHERE ts >= ? GROUP BY platform ORDER BY devices DESC`,
        since,
      ),
      q<{ key: string; devices: number }>(
        `SELECT lang AS key, COUNT(DISTINCT device) AS devices FROM events WHERE ts >= ? GROUP BY lang ORDER BY devices DESC`,
        since,
      ),
    ])

  // Junta catálogo + estatísticas: histórias nunca abertas aparecem com zero.
  const byId = new Map(storyStats.map((s) => [s.story, s]))
  const titles = new Map(catalog.map((c) => [c.id, c.title]))
  const ids = new Set([...titles.keys(), ...byId.keys()])
  const stories = [...ids].map((id) => {
    const s = byId.get(id)
    return { id, title: titles.get(id) ?? id, opens: s?.opens ?? 0, completes: s?.completes ?? 0, devices: s?.devices ?? 0 }
  })

  return {
    days,
    generatedAt: new Date().toISOString(),
    totals: totals[0] ?? { devices: 0, sessions: 0, storyOpens: 0, storyCompletes: 0, quizCompletes: 0 },
    newDevices: newDevices[0]?.n ?? 0,
    daily,
    stories,
    quiz,
    places,
    heat,
    devices,
    recent,
    platforms,
    langs,
  }
}
