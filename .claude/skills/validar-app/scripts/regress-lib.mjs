// Base dos testes de regressão: um navegador "estável" (mesma tela, sem animações, sorteios
// repetíveis, sem service worker) para comparar a produção com a versão nova.
// Nunca envia nada de verdade: a medição de uso e o Supabase são bloqueados.

export const PROD = process.env.PROD_URL ?? 'https://falafalinha.com/'
export const LOCAL = process.env.LOCAL_URL ?? 'http://localhost:4173/'
export const app = (root, path) => `${root.replace(/\/?$/, '/')}#${path}`

/** Telas comparadas (rota do app, ou caminho do site quando começa sem '#'). */
export const SCREENS = [
  ['inicio', '/'],
  ['historias', '/historias'],
  ['historia-fazenda', '/historias/fazenda'],
  ['quiz', '/quiz'],
  ['quiz-animais', '/quiz/animais'],
  ['dormir', '/dormir'],
  ['creditos', '/creditos'],
  ['privacidade', '/privacidade'],
  ['como-usar', '/como-usar'],
  ['entrar', '/entrar'],
]

/**
 * Contexto de celular repetível. `loggedIn` coloca uma sessão de mentira no armazenamento: assim a
 * versão com login obrigatório (se houver) também abre, e o estado "com conta" fica coberto.
 */
export async function stableContext(browser, { lang = 'pt', loggedIn = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    hasTouch: true,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  })
  await ctx.addInitScript(
    ({ lang, loggedIn }) => {
      if (location.protocol === 'about:') return
      try {
        localStorage.setItem('conta-pra-mim:settings', JSON.stringify({ sound: false, voice: false, lang }))
        localStorage.setItem('fala-falinha:onboarding-done', '1')
        localStorage.setItem('fala-falinha:analytics-consent', 'denied')
        if (loggedIn) {
          const exp = Math.floor(Date.now() / 1000) + 86400
          const user = { id: '00000000-0000-0000-0000-00000000beef', aud: 'authenticated', role: 'authenticated', email: 'regressao@exemplo.com', app_metadata: {}, user_metadata: {}, identities: [{}], created_at: '2026-01-01T00:00:00Z' }
          localStorage.setItem('fala-falinha:auth', JSON.stringify({ access_token: 'regressao', token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'regressao', user }))
        }
      } catch {
        // sem armazenamento
      }
      // sorteios repetíveis (ordem das respostas do quiz etc.)
      let seed = 42
      Math.random = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
      const fake = { getVoices: () => [], addEventListener() {}, removeEventListener() {}, cancel() {}, pause() {}, resume() {}, speak(u) { setTimeout(() => u.onend && u.onend({}), 30) } }
      Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true })
    },
    { lang, loggedIn },
  )
  // nada sai para a medição nem para o Supabase de verdade
  await ctx.route(/api\.falafalinha\.com|supabase\.co/, (route) => route.abort())
  return ctx
}

/** Abre a página e registra erros de JavaScript e arquivos do próprio site que falharam. */
export async function openPage(ctx, url) {
  const page = await ctx.newPage()
  page.setDefaultTimeout(10000)
  const problems = []
  const origin = new URL(url).origin
  page.on('pageerror', (e) => problems.push(`erro JS: ${e.message}`))
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(origin)) problems.push(`${r.status()} ${r.url().slice(origin.length)}`)
  })
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  // espera as fontes para a foto sair igual
  await page.evaluate(() => document.fonts?.ready).catch(() => {})
  return { page, problems }
}
