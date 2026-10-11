// Relatório de qualidade de cada som de public/sounds + folha de espectrogramas para conferir no olho.
// Uso: node audio_report.mjs <pasta-de-saida>
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import ffmpeg from 'ffmpeg-static'
import { ROOT, sounds } from './lib.mjs'

const OUT = process.argv[2] ?? 'validacao'
mkdirSync(join(OUT, 'espectros'), { recursive: true })
const RATE = 16000

function pcm(file) {
  const r = spawnSync(ffmpeg, ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'], { maxBuffer: 1 << 28 })
  if (r.status !== 0) throw new Error(r.stderr.toString())
  return new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 2)
}

const db = (x) => 20 * Math.log10(Math.max(x, 1e-9))
const N = 1024

/** FFT radix-2 in-place (re, im). */
function fft(re, im) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    for (let i = 0; i < n; i += len)
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k)
        const wi = Math.sin(ang * k)
        const ar = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi
        const ai = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr
        re[i + k + len / 2] = re[i + k] - ar
        im[i + k + len / 2] = im[i + k] - ai
        re[i + k] += ar
        im[i + k] += ai
      }
  }
}

/**
 * Espectro: parte da energia acima de 300 Hz (o que o alto-falante do celular toca) e
 * planura espectral média dos trechos com som (≈1 = chiado/ruído; baixo = tons, harmônicos).
 */
function spectrum(x) {
  const cut = Math.round((300 * N) / RATE)
  let hi = 0
  let all = 0
  const frames = []
  for (let i = 0; i + N <= x.length; i += N / 2) {
    const re = new Float64Array(N)
    const im = new Float64Array(N)
    let e = 0
    for (let k = 0; k < N; k++) {
      re[k] = x[i + k] * (0.5 - 0.5 * Math.cos((2 * Math.PI * k) / N))
      e += re[k] * re[k]
    }
    fft(re, im)
    let logSum = 0
    let sum = 0
    for (let k = 1; k < N / 2; k++) {
      const pw = re[k] * re[k] + im[k] * im[k] + 1e-9
      all += pw
      if (k >= cut) hi += pw
      logSum += Math.log(pw)
      sum += pw
    }
    const m = N / 2 - 1
    frames.push({ e, flat: Math.exp(logSum / m) / (sum / m) })
  }
  const loud = frames.filter((f) => f.e >= frames.map((g) => g.e).sort((a, b) => a - b)[Math.floor(frames.length / 2)])
  const flat = loud.reduce((a, f) => a + f.flat, 0) / Math.max(1, loud.length)
  return { high: all ? hi / all : 0, flat }
}

const rows = []
for (const s of sounds) {
  const file = join(ROOT, 'public/sounds', s)
  const x = pcm(file)
  const dur = x.length / RATE
  let sum = 0
  let peak = 0
  let clipped = 0
  for (const v of x) {
    sum += v * v
    peak = Math.max(peak, Math.abs(v))
    if (Math.abs(v) >= 32700) clipped++
  }
  const mean = db(Math.sqrt(sum / x.length) / 32768)
  const peakDb = db(peak / 32768)
  const { high, flat } = spectrum(x)
  const warn = []
  if (mean < -26) warn.push('baixo demais')
  if (clipped / x.length > 0.001) warn.push(`estourado (${((clipped / x.length) * 100).toFixed(1)}% no limite)`)
  if (high < 0.5) warn.push('grave demais p/ celular')
  if (dur < 0.5) warn.push('curto')
  if (dur > 4.5) warn.push('longo')
  if (flat > 0.35) warn.push('parece ruído')
  rows.push({ s, dur, mean, peakDb, high, flat, warn })
  spawnSync(ffmpeg, [
    '-v', 'error', '-y', '-i', file,
    '-lavfi', `showspectrumpic=s=300x150:legend=0:fscale=lin:stop=6000,drawtext=text='${s.replace('.mp3', '')}':fontcolor=white:fontsize=20:x=4:y=4`,
    join(OUT, 'espectros', s.replace('.mp3', '.png')),
  ])
}

// folha com todos os espectrogramas (4 por linha)
const imgs = sounds.map((s) => join(OUT, 'espectros', s.replace('.mp3', '.png')))
const cols = 4
const layout = imgs.map((_, i) => `${(i % cols) * 300}_${Math.floor(i / cols) * 150}`).join('|')
const sheet = spawnSync(ffmpeg, [
  '-v', 'error', '-y',
  ...imgs.flatMap((f) => ['-i', f]),
  '-filter_complex', `xstack=inputs=${imgs.length}:layout=${layout}:fill=black`,
  join(OUT, 'sons.png'),
])
if (sheet.status !== 0) console.error(sheet.stderr.toString())

console.log('som              dur    médio   pico  >300Hz  planura')
for (const r of rows)
  console.log(
    `${r.s.padEnd(16)} ${r.dur.toFixed(1).padStart(4)}s ${r.mean.toFixed(1).padStart(6)} ${r.peakDb.toFixed(1).padStart(6)}  ${(r.high * 100).toFixed(0).padStart(5)}%  ${r.flat.toFixed(2).padStart(6)}  ${r.warn.length ? '⚠️ ' + r.warn.join(', ') : 'ok'}`,
  )
const bad = rows.filter((r) => r.warn.length)
console.log(`\n${rows.length - bad.length}/${rows.length} sem alertas. Espectrogramas: ${join(OUT, 'sons.png')}`)
