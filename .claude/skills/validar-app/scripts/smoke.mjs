// Conferência rápida do site NO AR, para rodar logo depois de publicar.
// Confere: a produção está com a versão que acabou de ser gerada, abre sem erros nem arquivos
// faltando, histórias/brincadeiras/sons funcionam, a página /sobre, a prévia de link, a medição e o
// Supabase respondem. Não cria conta nem envia eventos.
// Uso: node smoke.mjs [url]   (padrão https://falafalinha.com/)
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, launch, reporter } from './lib.mjs'
import { app, openPage, stableContext } from './regress-lib.mjs'

const ROOT_URL = (process.argv[2] ?? 'https://falafalinha.com/').replace(/\/?$/, '/')
const r = reporter()
const bust = `?v=${Date.now()}`
const get = (path, init) => fetch(new URL(path, ROOT_URL).href, init).catch((e) => ({ ok: false, status: String(e) }))

// 1. Versão no ar = versão gerada aqui (mesmo nome do arquivo principal)
const live = await (await get(bust)).text?.() ?? ''
const liveJs = live.match(/assets\/index-[\w-]+\.js/)?.[0]
const distIndex = join(ROOT, 'dist/index.html')
const builtJs = existsSync(distIndex) ? readFileSync(distIndex, 'utf8').match(/assets\/index-[\w-]+\.js/)?.[0] : null
if (builtJs) r.check('produção está com a versão nova', liveJs === builtJs, `no ar: ${liveJs}; gerada: ${builtJs} (o deploy pode ainda não ter terminado)`)
else console.log(`ℹ️  sem dist/ para comparar; no ar: ${liveJs}`)

// 2. Arquivos públicos
for (const path of ['sobre/', 'og.png', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest', 'sw.js', 'sounds/vaca.mp3']) {
  const res = await get(path + bust, { method: 'GET' })
  r.check(`${path} responde`, res.ok, String(res.status))
}

// 3. Serviços externos
const env = existsSync(join(ROOT, '.env.production')) ? readFileSync(join(ROOT, '.env.production'), 'utf8') : ''
const val = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const analytics = val('VITE_ANALYTICS_URL')
if (analytics) {
  const res = await fetch(`${analytics}/painel`).catch((e) => ({ status: String(e) }))
  r.check('medição de uso no ar (painel pede senha)', res.status === 401, String(res.status))
}
const sbUrl = val('VITE_SUPABASE_URL')
const sbKey = val('VITE_SUPABASE_ANON_KEY')
if (sbUrl && sbKey) {
  const res = await fetch(`${sbUrl}/auth/v1/settings`, { headers: { apikey: sbKey } }).catch((e) => ({ ok: false, status: String(e) }))
  const s = res.ok ? await res.json() : {}
  r.check('Supabase responde e o login por e-mail está ligado', res.ok && s.external?.email === true, String(res.status))
  r.check('Supabase: criar conta não exige confirmar e-mail', s.mailer_autoconfirm === true, 'ligue de novo: Authentication → Sign In / Providers → Email → desligar "Confirm email"')
}

// 4. O app no navegador
const browser = await launch()
const ctx = await stableContext(browser)
const errors = []
for (const path of ['/', '/historias', '/historias/fazenda', '/quiz/animais', '/dormir', '/creditos', '/privacidade']) {
  const { page, problems } = await openPage(ctx, app(ROOT_URL, path) + '')
  errors.push(...problems.map((p) => `${path}: ${p}`))
  if (path === '/') r.check('início abre sem pedir login', await page.getByRole('link', { name: /Histórias/ }).first().isVisible().catch(() => false))
  if (path === '/historias') {
    const n = await page.locator('main a').count()
    r.check(`lista de histórias (${n})`, n >= 20, `${n} na tela`)
  }
  await page.close()
}
r.check('nenhum erro de JS nem arquivo faltando no ar', !errors.length, errors.join(' | '))
await browser.close()
r.finish()
