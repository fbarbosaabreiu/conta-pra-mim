// Fluxo completo nos 4 idiomas: todas as histórias até o fim, os 3 quizzes e todos os sons dos créditos.
// Uso: node e2e.mjs [pt,en,...]
import { BASE, LANGS, UI, clearClips, launch, openStory, phoneContext, reporter, sounds, stories, tr, waitClip } from './lib.mjs'

const langs = process.argv[2] ? process.argv[2].split(',') : LANGS
const r = reporter()
const browser = await launch()

for (const lang of langs) {
  const t = UI[lang]
  const { ctx, page, errors } = await phoneContext(browser, lang)

  await page.goto(`${BASE}/historias`)
  await page.waitForTimeout(600)
  const tiles = await page.locator('main a').count()
  r.check(`[${lang}] lista mostra as ${stories.length} histórias`, tiles === stories.length, `${tiles} na tela`)

  for (const s of stories) {
    await openStory(page, s.id)
    const problems = []
    let i = 0
    try {
    for (; i < s.pages.length; i++) {
      const p = s.pages[i]
      await clearClips(page)
      const text = (await page.locator('main p').first().innerText()).trim()
      const first = tr(p.text, lang).split(/\s/)[0]
      if (!text.startsWith(first)) problems.push(`p${i + 1} texto errado: "${text.slice(0, 30)}"`)
      if (p.reveal) {
        const show = page.getByLabel(t.show)
        if (await show.count()) await show.click({ force: true })
        if (p.revealAudio && !(await waitClip(page, p.revealAudio)).includes(p.revealAudio))
          problems.push(`p${i + 1}: ❓ não tocou ${p.revealAudio}`)
      }
      const e = p.elements.find((x) => x.audio)
      if (e) {
        const word = tr(e.word, lang)
        await page.waitForTimeout(1500)
        await clearClips(page)
        await page.getByLabel(word, { exact: true }).first().click({ force: true })
        if (!(await waitClip(page, e.audio)).includes(e.audio)) problems.push(`p${i + 1}: tocar em "${word}" não tocou ${e.audio}`)
      }
      await page.getByLabel(t.next).click()
      await page.waitForTimeout(1000) // a página anterior sai deslizando
    }
    if (!(await page.getByText(t.end, { exact: true }).isVisible().catch(() => false))) problems.push('não chegou na tela de fim')
    } catch (err) {
      // não derruba o teste inteiro: registra, guarda a tela e segue para a próxima história
      const shot = `${process.env.OUT ?? 'validacao'}/falha-${lang}-${s.id}-p${i + 1}.png`
      await page.screenshot({ path: shot }).catch(() => {})
      problems.push(`p${i + 1}: ${String(err.message).split(/\r?\n/)[0]} (tela: ${shot})`)
    }
    r.check(`[${lang}] história ${s.id} (${s.pages.length} páginas)`, problems.length === 0, problems.join('; '))
  }

  for (const theme of ['animais', 'cores', 'numeros']) {
    await page.goto(`${BASE}/quiz`)
    await page.waitForTimeout(250)
    await page.goto(`${BASE}/quiz/${theme}`)
    await page.waitForTimeout(500)
    let ok = true
    let why = ''
    for (let q = 0; q < 5 && ok; q++) {
      await page.waitForTimeout(800)
      if (theme === 'numeros') {
        const items = page.getByLabel(t.count)
        const n = await items.count()
        for (let i = 0; i < n; i++) await items.first().click()
      }
      const opts = page.locator('main .grid button')
      let hit = false
      for (let i = 0; i < (await opts.count()) && !hit; i++) {
        await opts.nth(i).click({ force: true })
        await page.waitForTimeout(300)
        hit = await page.getByTestId('celebration').isVisible()
      }
      if (!hit) {
        ok = false
        why = `pergunta ${q + 1}: nenhuma opção foi aceita`
        break
      }
      await page
        .getByTestId('celebration')
        .waitFor({ state: 'detached', timeout: 12000 })
        .catch(() => ((ok = false), (why = 'a comemoração não terminou')))
    }
    if (ok) {
      await page.waitForTimeout(600)
      ok = await page.getByText('🏆').isVisible()
      if (!ok) why = 'sem tela final'
    }
    r.check(`[${lang}] quiz ${theme} completo`, ok, why)
  }

  await page.goto(`${BASE}/creditos`)
  await page.waitForTimeout(500)
  const btns = page.locator('main li button')
  const n = await btns.count()
  const silent = []
  for (let i = 0; i < n; i++) {
    await clearClips(page)
    await btns.nth(i).click()
    if (!(await waitClip(page)).length) silent.push(await btns.nth(i).innerText())
  }
  r.check(`[${lang}] créditos: ${n} sons, todos tocam`, n === sounds.length && !silent.length, `${n} de ${sounds.length}; mudos: ${silent.join(', ')}`)

  const bad = await page.evaluate(() => window.__bad)
  r.check(`[${lang}] sem erros de JS nem arquivos faltando`, !errors.length && !bad.length, [...errors, ...bad].join(' | '))
  await ctx.close()
}
await browser.close()
r.finish()
