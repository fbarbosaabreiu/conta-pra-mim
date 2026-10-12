// Inventário: tudo o que a produção oferece (links, botões, histórias, brincadeiras, sons) precisa
// continuar existindo na versão nova, nos 4 idiomas. Item sumido = FAIL (a menos que seja aceito).
// Uso: node inventory.mjs <pasta-de-saida> [--aceitar "texto1|texto2"]
//   PROD_URL / LOCAL_URL trocam os endereços (padrão: https://falafalinha.com/ e http://localhost:4173/).
import { mkdirSync, writeFileSync } from 'node:fs'
import { LANGS, launch, reporter } from './lib.mjs'
import { LOCAL, PROD, SCREENS, app, openPage, stableContext } from './regress-lib.mjs'

const OUT = process.argv[2] ?? 'regressao'
const acceptArg = process.argv.indexOf('--aceitar')
const accepted = acceptArg > 0 ? process.argv[acceptArg + 1].split('|').map((s) => s.trim()).filter(Boolean) : []
mkdirSync(OUT, { recursive: true })

/** Links internos e nomes de botões/links visíveis numa tela. */
async function itemsOf(page) {
  return page.evaluate(() => {
    const out = new Set()
    const norm = (s) => s.replace(/\s+/g, ' ').trim()
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href')
      if (href.startsWith('#/') || href.startsWith('/')) out.add(`link ${href.replace(/\?.*$/, '')}`)
    }
    for (const el of document.querySelectorAll('button, a, [role="button"]')) {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue
      const name = norm(el.getAttribute('aria-label') || el.textContent || '')
      if (name) out.add(`${el.tagName === 'A' ? 'link' : 'botão'} “${name}”`)
    }
    return [...out].sort()
  })
}

async function collect(root, lang, browser) {
  const ctx = await stableContext(browser, { lang, loggedIn: true })
  const inv = {}
  const problems = []
  for (const [name, path] of SCREENS) {
    const { page, problems: p } = await openPage(ctx, app(root, path))
    inv[name] = await itemsOf(page)
    problems.push(...p.map((x) => `${name}: ${x}`))
    await page.close()
  }
  // cada história, brincadeira e história de dormir listada abre sem erro
  for (const list of ['historias', 'quiz', 'dormir']) {
    for (const item of inv[list].filter((i) => i.startsWith(`link #/${list}/`))) {
      const path = item.slice(6)
      const { page, problems: p } = await openPage(ctx, app(root, path))
      inv[`${list}:${path}`] = await itemsOf(page)
      problems.push(...p.map((x) => `${path}: ${x}`))
      await page.close()
    }
  }
  await ctx.close()
  return { inv, problems }
}

const r = reporter()
const browser = await launch()
const report = {}
for (const lang of LANGS) {
  const prod = await collect(PROD, lang, browser)
  const local = await collect(LOCAL, lang, browser)
  report[lang] = { prod: prod.inv, local: local.inv }
  const missing = []
  const added = []
  for (const screen of Object.keys(prod.inv)) {
    const now = new Set(local.inv[screen] ?? [])
    for (const item of prod.inv[screen]) {
      if (now.has(item)) continue
      if (accepted.some((a) => item.includes(a) || screen.includes(a))) continue
      missing.push(`${screen}: ${item}`)
    }
    for (const item of local.inv[screen] ?? []) if (!prod.inv[screen].includes(item)) added.push(`${screen}: ${item}`)
  }
  r.check(`[${lang}] nada da produção sumiu (${Object.keys(prod.inv).length} telas)`, !missing.length, `\n      - ${missing.join('\n      - ')}`)
  r.check(`[${lang}] versão nova abre sem erros`, !local.problems.length, local.problems.join(' | '))
  if (prod.problems.length) console.log(`ℹ️  [${lang}] a produção já tem problemas (não é regressão): ${prod.problems.join(' | ')}`)
  if (added.length) console.log(`ℹ️  [${lang}] novidades (${added.length}): ${added.slice(0, 15).join(' · ')}${added.length > 15 ? ' …' : ''}`)
}
writeFileSync(`${OUT}/inventario.json`, JSON.stringify(report, null, 2))
await browser.close()
r.finish()
