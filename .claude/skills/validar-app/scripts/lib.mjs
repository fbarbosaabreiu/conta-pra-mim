// Partes comuns dos testes no navegador.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
export const BASE = process.env.APP_URL ?? 'http://localhost:5173/#'
export const LANGS = ['pt', 'en', 'es', 'fr']

/** Rótulos da interface usados pelos testes (iguais a src/i18n/ui.ts). */
export const UI = {
  pt: { next: 'Próxima página', show: 'Mostrar resposta', count: 'Contar este', end: 'Fim!' },
  en: { next: 'Next page', show: 'Show answer', count: 'Count this one', end: 'The end!' },
  es: { next: 'Página siguiente', show: 'Mostrar respuesta', count: 'Contar este', end: '¡Fin!' },
  fr: { next: 'Page suivante', show: 'Montrer la réponse', count: 'Compter celui-ci', end: 'Fin !' },
}

export const stories = readdirSync(join(ROOT, 'src/content/stories'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(ROOT, 'src/content/stories', f), 'utf8')))
export const sounds = readdirSync(join(ROOT, 'public/sounds')).filter((f) => f.endsWith('.mp3'))
export const tr = (x, lang) => (typeof x === 'string' ? x : x[lang])

export async function launch() {
  const channel = process.env.BROWSER === 'chrome' ? 'chrome' : 'msedge'
  return chromium.launch({ channel, headless: true })
}

/**
 * Contexto de celular com o idioma escolhido, tutorial já visto, voz simulada (termina rápido)
 * e registro de cada gravação tocada — tanto por <audio> quanto pelo Web Audio.
 */
export async function phoneContext(browser, lang, { sound = true, voice = true, viewport } = {}) {
  const ctx = await browser.newContext({ viewport: viewport ?? { width: 390, height: 844 }, hasTouch: true })
  await ctx.addInitScript(
    ({ lang, sound, voice }) => {
      localStorage.setItem('conta-pra-mim:settings', JSON.stringify({ sound, voice, lang }))
      localStorage.setItem('fala-falinha:onboarding-done', '1')
      window.__clips = []
      window.__bad = []
      const fake = {
        getVoices: () => [],
        addEventListener() {},
        cancel() {},
        speak(u) {
          setTimeout(() => u.onend && u.onend({}), 30)
        },
      }
      Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true })
      const mplay = HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play = function (...a) {
        const p = mplay.apply(this, a)
        const n = (this.src || '').split('/').pop()
        if (n.endsWith('.mp3'))
          p.then(
            () => window.__clips.push(n),
            (e) => e.name !== 'AbortError' && window.__bad.push(`não tocou ${n}: ${e.name}`),
          )
        return p
      }
      const tag = new WeakMap()
      const tagBuf = new WeakMap()
      const ab = Response.prototype.arrayBuffer
      Response.prototype.arrayBuffer = async function () {
        if (!this.ok) window.__bad.push(`arquivo faltando ${this.url}`)
        const d = await ab.call(this)
        tag.set(d, this.url.split('/').pop())
        return d
      }
      const dec = BaseAudioContext.prototype.decodeAudioData
      BaseAudioContext.prototype.decodeAudioData = async function (d, ...r) {
        const b = await dec.call(this, d, ...r)
        if (tag.get(d)) tagBuf.set(b, tag.get(d))
        return b
      }
      const st = AudioBufferSourceNode.prototype.start
      AudioBufferSourceNode.prototype.start = function (...a) {
        const n = this.buffer && tagBuf.get(this.buffer)
        if (n) window.__clips.push(n)
        return st.apply(this, a)
      }
    },
    { lang, sound, voice },
  )
  const page = await ctx.newPage()
  page.setDefaultTimeout(8000)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return { ctx, page, errors }
}

/** Espera até tocar `name` (ou qualquer gravação, se omitido); devolve o que tocou. */
export async function waitClip(page, name) {
  let clips = []
  for (let k = 0; k < 30 && !(name ? clips.includes(name) : clips.length); k++) {
    await page.waitForTimeout(100)
    clips = await page.evaluate(() => window.__clips)
  }
  return clips
}

export const clearClips = (page) => page.evaluate(() => (window.__clips = []))

/** Abre uma história do começo (passa pela lista para o leitor reiniciar). */
export async function openStory(page, id) {
  await page.goto(`${BASE}/historias`)
  await page.waitForTimeout(250)
  await page.goto(`${BASE}/historias/${id}`)
  await page.waitForTimeout(800)
}

export function reporter() {
  const results = []
  return {
    check(name, ok, detail = '') {
      results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? '  — ' + detail : ''}`)
    },
    finish() {
      const pass = results.filter((r) => r.startsWith('PASS')).length
      console.log(results.join('\n'))
      console.log(`\n${pass}/${results.length} passaram`)
      if (pass !== results.length) process.exitCode = 1
    },
  }
}
