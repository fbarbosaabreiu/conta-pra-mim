// Comparação visual: fotografa as telas principais na produção e na versão nova e mede quanto mudou.
// Não falha sozinho — mudança pode ser de propósito. Gera <pasta>/visual-<tela>.png
// (produção | nova | diferença em vermelho) para alguém OLHAR cada tela marcada com ⚠️.
// Uso: node visual.mjs <pasta-de-saida> [limite-%]   (padrão 1%)
import { mkdirSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { launch } from './lib.mjs'
import { LOCAL, PROD, SCREENS, app, openPage, stableContext } from './regress-lib.mjs'

const OUT = process.argv[2] ?? 'regressao'
const LIMIT = Number(process.argv[3] ?? 1)
mkdirSync(OUT, { recursive: true })

const screens = [...SCREENS.map(([n, p]) => [n, (root) => app(root, p)]), ['sobre', (root) => `${root.replace(/\/?$/, '/')}sobre/`]]

async function shoot(browser, root, url, loggedIn) {
  const ctx = await stableContext(browser, { loggedIn })
  const { page, problems } = await openPage(ctx, url(root))
  const ok = !problems.some((p) => /^404 /.test(p) && !/\.(png|mp3|svg|ico|json)$/.test(p))
  const buf = await page.screenshot({ fullPage: true })
  await ctx.close()
  return { png: PNG.sync.read(buf), ok }
}

/** Junta as três imagens lado a lado (alturas diferentes viram fundo cinza). */
function sideBySide(a, b, diff) {
  const w = a.width
  const h = Math.max(a.height, b.height)
  const out = new PNG({ width: w * 3 + 20, height: h })
  out.data.fill(200)
  for (const [img, x0] of [[a, 0], [b, w + 10], [diff, 2 * w + 20]])
    PNG.bitblt(img, out, 0, 0, Math.min(img.width, w), img.height, x0, 0)
  return out
}

/** Recorta/estica a altura para comparar páginas de tamanhos diferentes. */
function fit(img, h) {
  const out = new PNG({ width: img.width, height: h })
  out.data.fill(255)
  PNG.bitblt(img, out, 0, 0, img.width, Math.min(img.height, h), 0, 0)
  return out
}

const browser = await launch()
const rows = []
for (const loggedIn of [false, true]) {
  for (const [name, url] of screens) {
    if (loggedIn && !['inicio', 'privacidade'].includes(name)) continue
    const label = loggedIn ? `${name}-com-conta` : name
    const prod = await shoot(browser, PROD, url, loggedIn)
    const local = await shoot(browser, LOCAL, url, loggedIn)
    if (!prod.ok) {
      rows.push({ label, pct: null, note: 'nova (não existe na produção)' })
      continue
    }
    const h = Math.max(prod.png.height, local.png.height)
    const a = fit(prod.png, h)
    const b = fit(local.png, h)
    const diff = new PNG({ width: a.width, height: h })
    const n = pixelmatch(a.data, b.data, diff.data, a.width, h, { threshold: 0.1, alpha: 0.3 })
    const pct = (100 * n) / (a.width * h)
    const sizeNote = prod.png.height !== local.png.height ? ` (altura ${prod.png.height}→${local.png.height}px)` : ''
    rows.push({ label, pct, note: sizeNote })
    if (pct >= LIMIT || sizeNote) writeFileSync(`${OUT}/visual-${label}.png`, PNG.sync.write(sideBySide(a, b, diff)))
  }
}
await browser.close()

let changed = 0
for (const { label, pct, note } of rows) {
  if (pct === null) {
    console.log(`🆕  ${label}: ${note}`)
    continue
  }
  const mark = pct >= LIMIT || note ? '⚠️ ' : '✅ '
  if (mark === '⚠️ ') changed++
  console.log(`${mark} ${label}: ${pct.toFixed(2)}% diferente${note}${mark === '⚠️ ' ? `  → ${OUT}/visual-${label}.png` : ''}`)
}
console.log(`\n${rows.length - changed}/${rows.length} telas iguais à produção${changed ? ` — OLHE as ${changed} marcadas com ⚠️ (produção | nova | diferença)` : ''}`)
