// Login com Supabase simulado (sem conta real): tela de entrar, código, sessão, sair, privacidade e apagar conta.
// Precisa de um servidor com chaves de mentira, por exemplo:
//   VITE_SUPABASE_URL=https://fake-projeto.supabase.co VITE_SUPABASE_ANON_KEY=teste npx vite --port 5174
// Uso: APP_URL=http://localhost:5174/# node auth.mjs <pasta-de-saida>
import { mkdirSync } from 'node:fs'
import { BASE, launch, reporter } from './lib.mjs'

const OUT = process.argv[2] ?? 'validacao'
mkdirSync(OUT, { recursive: true })
const r = reporter()
const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
await ctx.addInitScript(() => {
  localStorage.setItem('conta-pra-mim:settings', JSON.stringify({ sound: false, voice: false, lang: 'pt' }))
  localStorage.setItem('fala-falinha:onboarding-done', '1')
})

// ---- Supabase de mentira
const calls = []
const user = { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'mae@exemplo.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }
const session = () => ({
  access_token: 'token-de-teste',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'refresh-de-teste',
  user,
})
await ctx.route(/fake-projeto\.supabase\.co/, async (route) => {
  const req = route.request()
  const url = new URL(req.url())
  const body = req.postDataJSON?.() ?? null
  calls.push(`${req.method()} ${url.pathname}`)
  const json = (status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
  if (url.pathname === '/auth/v1/otp') return json(200, {})
  if (url.pathname === '/auth/v1/verify')
    return body?.token === '123456' ? json(200, session()) : json(403, { code: 'otp_expired', msg: 'Token has expired or is invalid', error_code: 'otp_expired' })
  if (url.pathname === '/auth/v1/user') return json(200, user)
  if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 })
  if (url.pathname === '/rest/v1/rpc/delete_my_account') return route.fulfill({ status: 204 })
  return json(404, {})
})

const page = await ctx.newPage()
page.setDefaultTimeout(8000)
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

// 1. Sem sessão → tela de entrar
await page.goto(`${BASE}/`)
await page.waitForTimeout(800)
r.check('sem sessão abre a tela de entrar', await page.getByRole('button', { name: 'Receber código' }).isVisible())
r.check('história não abre sem login', !(await page.getByText('Histórias', { exact: true }).isVisible().catch(() => false)))
await page.screenshot({ path: `${OUT}/login-1-email.png` })

// 2. Privacidade abre sem login e volta para a tela de entrar
await page.getByRole('link', { name: 'Privacidade' }).click()
await page.waitForTimeout(600)
r.check('privacidade abre sem login', await page.getByRole('heading', { name: 'Sua conta' }).isVisible())
await page.goto(`${BASE}/`)
await page.waitForTimeout(500)

// 3. E-mail inválido
await page.getByLabel('Seu e-mail').fill('sem-arroba')
await page.getByRole('button', { name: 'Receber código' }).click()
await page.waitForTimeout(300)
r.check('e-mail inválido mostra aviso', await page.getByRole('alert').isVisible())

// 4. Pede o código
await page.getByLabel('Seu e-mail').fill('Mae@Exemplo.com ')
await page.getByRole('button', { name: 'Receber código' }).click()
await page.waitForTimeout(600)
r.check('envia o código e pede os 6 números', await page.getByLabel('Código de 6 números').isVisible())
r.check('chamou o Supabase para enviar o código', calls.includes('POST /auth/v1/otp'), calls.join(', '))
await page.screenshot({ path: `${OUT}/login-2-codigo.png` })

// 5. Código errado
await page.getByLabel('Código de 6 números').fill('000000')
await page.getByRole('button', { name: 'Entrar' }).click()
await page.waitForTimeout(600)
r.check('código errado mostra aviso amigável', (await page.getByRole('alert').innerText()).includes('Código errado'))

// 6. Código certo → entra
await page.getByLabel('Código de 6 números').fill('123456')
await page.getByRole('button', { name: 'Entrar' }).click()
await page.waitForTimeout(1200)
r.check('código certo abre o app', await page.getByText('Histórias', { exact: true }).isVisible())
await page.screenshot({ path: `${OUT}/login-3-dentro.png` })

// 7. Sessão continua depois de recarregar
await page.reload()
await page.waitForTimeout(1000)
r.check('continua logado depois de recarregar', await page.getByText('Histórias', { exact: true }).isVisible())

// 8. Privacidade mostra a conta
await page.goto(`${BASE}/privacidade`)
await page.waitForTimeout(600)
r.check('privacidade mostra o e-mail da conta', await page.getByText('Conectado como mae@exemplo.com').isVisible())

// 9. Sair
await page.goto(`${BASE}/`)
await page.waitForTimeout(600)
await page.getByRole('button', { name: 'Sair' }).click()
await page.waitForTimeout(800)
r.check('sair volta para a tela de entrar', await page.getByRole('button', { name: 'Receber código' }).isVisible())

// 10. Apagar conta
await page.getByLabel('Seu e-mail').fill('mae@exemplo.com')
await page.getByRole('button', { name: 'Receber código' }).click()
await page.waitForTimeout(500)
await page.getByLabel('Código de 6 números').fill('123456')
await page.getByRole('button', { name: 'Entrar' }).click()
await page.waitForTimeout(1000)
await page.goto(`${BASE}/privacidade`)
await page.waitForTimeout(600)
page.once('dialog', (d) => d.accept())
await page.getByRole('button', { name: 'Apagar minha conta' }).click()
await page.waitForTimeout(800)
r.check('apagar conta chama o Supabase e desconecta', calls.includes('POST /rest/v1/rpc/delete_my_account') && !(await page.getByText('Conectado como').isVisible().catch(() => false)), calls.join(', '))

r.check('sem erros de JS', errors.length === 0, errors.join(' | '))
await browser.close()
r.finish()
