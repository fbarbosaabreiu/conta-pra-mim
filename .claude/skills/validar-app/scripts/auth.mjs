// Login com Supabase simulado (sem conta real): entrar com e-mail e senha, criar conta, esqueci a
// senha (inclusive o link que volta do e-mail), sessão, sair, privacidade e apagar conta.
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
  if (location.protocol === 'about:') return // página em branco usada para "abrir o link do e-mail"
  localStorage.setItem('conta-pra-mim:settings', JSON.stringify({ sound: false, voice: false, lang: 'pt' }))
  localStorage.setItem('fala-falinha:onboarding-done', '1')
})

// ---- Supabase de mentira (contas: mae@exemplo.com / senha123)
const calls = []
let password = 'senha123'
const user = { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'mae@exemplo.com', app_metadata: {}, user_metadata: {}, identities: [{}], created_at: new Date().toISOString() }
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = () => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.assinatura`
const session = (email = user.email) => ({
  access_token: jwt(),
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'refresh-de-teste',
  user: { ...user, email },
})
const fail = (code, msg) => ({ code, error_code: code, msg, message: msg })
await ctx.route(/fake-projeto\.supabase\.co/, async (route) => {
  const req = route.request()
  const url = new URL(req.url())
  const body = req.postDataJSON?.() ?? null
  calls.push(`${req.method()} ${url.pathname}`)
  const json = (status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
  if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password')
    return body?.email === user.email && body?.password === password
      ? json(200, session())
      : json(400, fail('invalid_credentials', 'Invalid login credentials'))
  if (url.pathname === '/auth/v1/signup')
    return body?.email === user.email
      ? json(422, fail('user_already_exists', 'User already registered'))
      : json(200, session(body?.email))
  if (url.pathname === '/auth/v1/recover') return json(200, {})
  if (url.pathname === '/auth/v1/user' && req.method() === 'PUT') {
    password = body?.password
    return json(200, user)
  }
  if (url.pathname === '/auth/v1/user') return json(200, user)
  if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 })
  if (url.pathname === '/rest/v1/rpc/delete_my_account') return route.fulfill({ status: 204 })
  return json(404, {})
})

const page = await ctx.newPage()
page.setDefaultTimeout(8000)
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const alert = async () => (await page.getByRole('alert').isVisible().catch(() => false)) ? await page.getByRole('alert').innerText() : ''
const inside = () => page.getByText('Histórias', { exact: true }).isVisible().catch(() => false)
const fill = async (email, pass) => {
  if (email !== null) await page.getByLabel('Seu e-mail').fill(email)
  if (pass !== null) await page.getByLabel(/Senha/).fill(pass)
}
const signOut = async () => {
  await page.goto(`${BASE}/`)
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: 'Sair' }).click()
  await page.waitForTimeout(800)
}

// 1. Sem sessão → tela de entrar
await page.goto(`${BASE}/`)
await page.waitForTimeout(800)
r.check('sem sessão abre a tela de entrar', await page.getByRole('button', { name: 'Entrar', exact: true }).isVisible())
r.check('história não abre sem login', !(await inside()))
await page.screenshot({ path: `${OUT}/login-1-entrar.png` })

// 2. Privacidade abre sem login
await page.getByRole('link', { name: 'Privacidade' }).click()
await page.waitForTimeout(600)
r.check('privacidade abre sem login', await page.getByRole('heading', { name: 'Sua conta' }).isVisible())
await page.goto(`${BASE}/`)
await page.waitForTimeout(500)

// 3. E-mail inválido e senha errada
await fill('sem-arroba', 'qualquer')
await page.getByRole('button', { name: 'Entrar', exact: true }).click()
await page.waitForTimeout(300)
r.check('e-mail inválido mostra aviso', (await alert()).includes('Confira o e-mail'))
await fill('mae@exemplo.com', 'errada')
await page.getByRole('button', { name: 'Entrar', exact: true }).click()
await page.waitForTimeout(600)
r.check('senha errada mostra aviso amigável', (await alert()).includes('E-mail ou senha errados'), await alert())

// 4. Mostrar senha
await page.getByRole('button', { name: 'Mostrar senha' }).click()
r.check('botão mostra a senha', (await page.getByLabel(/Senha/).getAttribute('type')) === 'text')

// 5. Senha certa → entra (e-mail com maiúscula e espaço)
await fill('Mae@Exemplo.com ', 'senha123')
await page.getByRole('button', { name: 'Entrar', exact: true }).click()
await page.waitForTimeout(1200)
r.check('senha certa abre o app', await inside())
await page.screenshot({ path: `${OUT}/login-2-dentro.png` })

// 6. Sessão continua depois de recarregar
await page.reload()
await page.waitForTimeout(1000)
r.check('continua logado depois de recarregar', await inside())

// 7. Privacidade mostra a conta
await page.goto(`${BASE}/privacidade`)
await page.waitForTimeout(600)
r.check('privacidade mostra o e-mail da conta', await page.getByText('Conectado como mae@exemplo.com').isVisible())

// 8. Sair
await signOut()
r.check('sair volta para a tela de entrar', await page.getByRole('button', { name: 'Entrar', exact: true }).isVisible())

// 9. Criar conta: senha curta, e-mail que já existe, conta nova
await page.getByRole('button', { name: 'Primeira vez? Criar conta' }).click()
await fill('novo@exemplo.com', '123')
await page.getByRole('button', { name: 'Criar conta' }).click()
await page.waitForTimeout(300)
r.check('criar conta pede senha de 6+', (await alert()).includes('pelo menos 6'))
await fill('mae@exemplo.com', 'senha456')
await page.getByRole('button', { name: 'Criar conta' }).click()
await page.waitForTimeout(600)
r.check('e-mail já cadastrado mostra aviso', (await alert()).includes('já tem conta'), await alert())
await page.screenshot({ path: `${OUT}/login-3-criar.png` })
await fill('novo@exemplo.com', 'senha456')
await page.getByRole('button', { name: 'Criar conta' }).click()
await page.waitForTimeout(1200)
r.check('conta nova entra direto', await inside())
await signOut()

// 10. Esqueci a senha → manda o link
await page.getByRole('button', { name: 'Esqueci a senha' }).click()
await fill('mae@exemplo.com', null)
await page.getByRole('button', { name: 'Mandar link' }).click()
await page.waitForTimeout(600)
r.check('esqueci a senha manda o link', calls.includes('POST /auth/v1/recover') && (await page.getByRole('status').innerText()).includes('mandamos um link'))
await page.screenshot({ path: `${OUT}/login-4-esqueci.png` })

// 11. O link do e-mail volta ao app e pede a senha nova
const root = BASE.replace(/#$/, '')
// o link do e-mail abre uma página nova (só trocar o # não recarregaria o app)
await page.goto('about:blank')
await page.goto(`${root}#access_token=${jwt()}&expires_in=3600&refresh_token=refresh-de-teste&token_type=bearer&type=recovery`)
await page.waitForTimeout(1000)
r.check('link de recuperação pede a senha nova', await page.getByRole('button', { name: 'Salvar senha nova' }).isVisible())
r.check('link some do endereço', !page.url().includes('access_token'), page.url())
await page.screenshot({ path: `${OUT}/login-5-senha-nova.png` })
await fill(null, 'nova-senha')
await page.getByRole('button', { name: 'Salvar senha nova' }).click()
await page.waitForTimeout(1200)
r.check('senha nova salva e entra', password === 'nova-senha' && (await inside()))
await signOut()

// 12. Link vencido
await page.goto('about:blank')
await page.goto(`${root}#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`)
await page.waitForTimeout(800)
r.check('link vencido avisa e oferece outro', (await alert()).includes('venceu') && (await page.getByRole('button', { name: 'Mandar link' }).isVisible()))

// 13. Volta, entra com a senha nova e apaga a conta
await page.getByRole('button', { name: 'Voltar' }).click()
await fill('mae@exemplo.com', 'nova-senha')
await page.getByRole('button', { name: 'Entrar', exact: true }).click()
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
