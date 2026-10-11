// Usabilidade no celular (390×844), nos 4 idiomas:
// sem rolagem horizontal, botões ≥ 44×44 px com nome acessível, balões das palavras dentro da cena.
// Uso: node usability.mjs <pasta-de-saida> [pt,en,...]
import { mkdirSync } from 'node:fs'
import { BASE, LANGS, UI, launch, openStory, phoneContext, reporter, stories, tr } from './lib.mjs'

const OUT = process.argv[2] ?? 'validacao'
const langs = process.argv[3] ? process.argv[3].split(',') : LANGS
mkdirSync(OUT, { recursive: true })
const MIN = 44 // área de toque mínima recomendada (Apple/Google)
const r = reporter()
const browser = await launch()

/** Confere a tela atual: rolagem horizontal e botões/links (tamanho e nome). */
async function checkScreen(page) {
  return page.evaluate((MIN) => {
    const problems = []
    if (document.documentElement.scrollWidth > window.innerWidth + 1)
      problems.push(`rolagem horizontal (${document.documentElement.scrollWidth}px > ${window.innerWidth}px)`)
    const scene = (el) => !!el.closest('.overflow-hidden.rounded-\\[2rem\\]')
    for (const el of document.querySelectorAll('button, a, [role="radio"]')) {
      const b = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      if (!b.width || !b.height || style.visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue
      const name = (el.getAttribute('aria-label') || el.textContent || '').trim()
      const label = name.slice(0, 25) || el.outerHTML.slice(0, 40)
      if (!name) problems.push(`sem nome acessível: ${label}`)
      // elementos da cena são figuras (o tamanho vem do desenho) e links dentro de um parágrafo
      // de texto são exceção da regra (WCAG 2.5.8); o mínimo vale para os controles
      const inline = el.tagName === 'A' && !!el.closest('p')
      if (!scene(el) && !inline && (b.width < MIN - 0.5 || b.height < MIN - 0.5))
        problems.push(`toque pequeno (${Math.round(b.width)}×${Math.round(b.height)}): "${label}"`)
    }
    return problems
  }, MIN)
}

for (const lang of langs) {
  const { ctx, page, errors } = await phoneContext(browser, lang, { sound: false, voice: false })

  // Telas principais
  for (const [name, path] of [
    ['início', '/'],
    ['histórias', '/historias'],
    ['quiz', '/quiz'],
    ['quiz animais', '/quiz/animais'],
    ['créditos', '/creditos'],
    ['tutorial', '/como-usar'],
  ]) {
    await page.goto(`${BASE}${path}`)
    await page.waitForTimeout(900)
    const problems = await checkScreen(page)
    await page.screenshot({ path: `${OUT}/ux-${lang}-${name.replace(/\s/g, '-')}.png` })
    r.check(`[${lang}] tela ${name}`, problems.length === 0, problems.join('; '))
  }

  // Histórias: cada página, cada elemento → balão dentro da cena
  for (const s of stories) {
    await openStory(page, s.id)
    const problems = await checkScreen(page)
    for (let i = 0; i < s.pages.length; i++) {
      const sceneBox = await page.locator('main .overflow-hidden.rounded-\\[2rem\\]').last().boundingBox()
      for (const e of s.pages[i].elements) {
        const word = tr(e.word, lang)
        const btn = page.locator('main .overflow-hidden.rounded-\\[2rem\\]').last().getByLabel(word, { exact: true }).first()
        const holder = btn.locator('xpath=ancestor::div[contains(@class,"-translate-y-1/2")][1]')
        await btn.click({ force: true })
        await page.waitForTimeout(450)
        const bb = await holder.locator('.whitespace-nowrap').first().boundingBox().catch(() => null)
        if (!bb) problems.push(`p${i + 1} "${word}": balão não apareceu`)
        else if (
          bb.x < sceneBox.x - 1 ||
          bb.y < sceneBox.y - 1 ||
          bb.x + bb.width > sceneBox.x + sceneBox.width + 1 ||
          bb.y + bb.height > sceneBox.y + sceneBox.height + 1
        )
          problems.push(`p${i + 1} "${word}": balão sai da cena`)
      }
      if (i === 0) await page.screenshot({ path: `${OUT}/ux-${lang}-historia-${s.id}.png` })
      await page.getByLabel(UI[lang].next).click()
      await page.waitForTimeout(900)
    }
    r.check(`[${lang}] história ${s.id}: botões e balões`, problems.length === 0, problems.join('; '))
  }
  r.check(`[${lang}] sem erros de JS`, errors.length === 0, errors.join(' | '))
  await ctx.close()
}
await browser.close()
r.finish()
