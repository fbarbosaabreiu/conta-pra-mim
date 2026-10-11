// Sons para dormir (chuva, mar, ruído branco, canção de ninar) e timer de sono do módulo "Soninho".
// Os sons são gerados aqui mesmo (sem arquivos) e tocados em loop por um <audio> — no iPhone,
// um <audio> toca mesmo com a chave lateral no silencioso, ao contrário do Web Audio.

import { useSyncExternalStore } from 'react'
import { getSettings } from './settings'
import { stopSpeaking } from './speech'

export type SleepSound = 'chuva' | 'mar' | 'ruido' | 'ninar'
export const SLEEP_SOUNDS: SleepSound[] = ['chuva', 'mar', 'ruido', 'ninar']
export const SLEEP_TIMERS = [10, 20, 30] as const

const RATE = 22050

// ---------- Síntese ----------

function noise(seconds: number, color: 'pink' | 'brown'): Float32Array {
  const out = new Float32Array(Math.round(seconds * RATE))
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, brown = 0
  for (let i = 0; i < out.length; i++) {
    const w = Math.random() * 2 - 1
    if (color === 'brown') {
      brown = (brown + 0.02 * w) / 1.02
      out[i] = brown * 3.5
    } else {
      // Ruído rosa (Paul Kellet): mais grave e macio que o branco.
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  }
  return out
}

/** Emenda o fim no começo (crossfade), para o loop não dar "clique". */
function seamless(buf: Float32Array, fadeSeconds = 0.6): Float32Array {
  const n = Math.round(fadeSeconds * RATE)
  const len = buf.length - n
  const out = buf.slice(0, len)
  for (let i = 0; i < n; i++) {
    const t = i / n
    out[i] = buf[i] * t + buf[len + i] * (1 - t)
  }
  return out
}

function normalize(buf: Float32Array, peak: number): Float32Array {
  let max = 0
  for (const v of buf) max = Math.max(max, Math.abs(v))
  const k = max ? peak / max : 1
  for (let i = 0; i < buf.length; i++) buf[i] *= k
  return buf
}

function rain(): Float32Array {
  const buf = noise(12.6, 'pink')
  for (let i = 0; i < buf.length; i++) buf[i] *= 0.55
  // Gotinhas: estalos curtos e abafados em momentos aleatórios.
  const drops = Math.round(12 * 22)
  for (let d = 0; d < drops; d++) {
    const start = Math.floor(Math.random() * (buf.length - RATE * 0.02))
    const amp = 0.08 + Math.random() * 0.22
    const len = Math.round(RATE * (0.004 + Math.random() * 0.01))
    for (let i = 0; i < len; i++) buf[start + i] += (Math.random() * 2 - 1) * amp * Math.exp((-5 * i) / len)
  }
  return normalize(seamless(buf), 0.32)
}

function sea(): Float32Array {
  // Duas ondas de 8 s: o volume do ruído sobe e desce devagar (o envelope fecha certinho no loop).
  const wave = 8
  const buf = noise(wave * 2 + 0.6, 'brown')
  for (let i = 0; i < buf.length; i++) {
    const t = (i / RATE) % wave
    const s = Math.sin((Math.PI * t) / wave)
    buf[i] *= 0.18 + 0.82 * s * s
  }
  return normalize(seamless(buf), 0.38)
}

function whiteNoise(): Float32Array {
  return normalize(seamless(noise(10.6, 'pink')), 0.26)
}

/** "Canção de ninar" de Brahms (domínio público), em timbre de caixinha de música. */
function lullaby(): Float32Array {
  const N: Record<string, number> = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25,
  }
  // [nota, tempos] — compasso 3/4.
  const melody: [string, number][] = [
    ['E4', 1], ['E4', 1], ['G4', 3], ['E4', 1], ['E4', 1], ['G4', 3],
    ['E4', 1], ['G4', 1], ['C5', 1.5], ['B4', 0.5], ['A4', 1], ['A4', 1], ['G4', 3],
    ['D4', 1], ['E4', 1], ['F4', 2], ['D4', 1], ['D4', 1], ['E4', 1], ['F4', 3],
    ['D4', 1], ['F4', 1], ['B4', 1.5], ['A4', 0.5], ['G4', 1], ['B4', 1], ['C5', 3],
    ['C4', 1], ['C4', 1], ['C5', 3], ['A4', 1], ['F4', 1], ['G4', 3],
    ['E4', 1], ['C4', 1], ['F4', 1.5], ['G4', 0.5], ['A4', 1], ['G4', 3],
    ['C4', 1], ['C4', 1], ['C5', 3], ['A4', 1], ['F4', 1], ['G4', 3],
    ['E4', 1], ['C4', 1], ['F4', 1], ['E4', 1], ['D4', 1], ['C4', 4],
  ]
  const beat = 0.62
  const total = melody.reduce((a, [, d]) => a + d, 0) * beat + 2.5
  const buf = new Float32Array(Math.round(total * RATE))
  let t = 0
  for (const [name, dur] of melody) {
    const f = N[name]
    const start = Math.round(t * RATE)
    const len = Math.min(buf.length - start, Math.round(RATE * 2.4))
    for (let i = 0; i < len; i++) {
      const s = i / RATE
      const env = Math.min(1, s / 0.006) * Math.exp(-s / 0.75)
      const tone = Math.sin(2 * Math.PI * f * s) + 0.25 * Math.sin(4 * Math.PI * f * s) + 0.06 * Math.sin(6 * Math.PI * f * s)
      buf[start + i] += tone * env
    }
    t += dur * beat
  }
  // Eco curto e suave, para soar como num quarto.
  const d = Math.round(RATE * 0.19)
  for (let i = d; i < buf.length; i++) buf[i] += buf[i - d] * 0.28
  return normalize(buf, 0.34)
}

function toWavUrl(samples: Float32Array): string {
  const data = new DataView(new ArrayBuffer(44 + samples.length * 2))
  const str = (o: number, s: string) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  data.setUint32(4, 36 + samples.length * 2, true)
  str(8, 'WAVEfmt ')
  data.setUint32(16, 16, true)
  data.setUint16(20, 1, true)
  data.setUint16(22, 1, true)
  data.setUint32(24, RATE, true)
  data.setUint32(28, RATE * 2, true)
  data.setUint16(32, 2, true)
  data.setUint16(34, 16, true)
  str(36, 'data')
  data.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    data.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true)
  }
  return URL.createObjectURL(new Blob([data.buffer], { type: 'audio/wav' }))
}

const GENERATORS: Record<SleepSound, () => Float32Array> = { chuva: rain, mar: sea, ruido: whiteNoise, ninar: lullaby }
const urls = new Map<SleepSound, string>()
const urlFor = (s: SleepSound) => {
  let u = urls.get(s)
  if (!u) {
    u = toWavUrl(GENERATORS[s]())
    urls.set(s, u)
  }
  return u
}

// ---------- Estado (som, timer) ----------

interface SleepState {
  sound: SleepSound | null
  /** Quando o timer desliga tudo (epoch ms), ou null. */
  timerEnd: number | null
  timerMinutes: number | null
  /** O timer acabou: a história para e aparece "bons sonhos". */
  timerFinished: boolean
}

let state: SleepState = { sound: null, timerEnd: null, timerMinutes: null, timerFinished: false }
const listeners = new Set<() => void>()
const set = (patch: Partial<SleepState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function useSleep(): SleepState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

let audio: HTMLAudioElement | null = null
let fadeTimer: ReturnType<typeof setInterval> | null = null

/** Liga/troca o som (chamar a partir de um toque, para o iPhone deixar tocar). */
export function setSleepSound(sound: SleepSound | null) {
  if (fadeTimer) clearInterval(fadeTimer)
  fadeTimer = null
  if (!sound || !getSettings().sound) {
    audio?.pause()
    set({ sound: null })
    updateWakeLock()
    return
  }
  if (!audio) {
    audio = new Audio()
    audio.loop = true
    audio.setAttribute('playsinline', '')
  }
  audio.volume = 1
  audio.src = urlFor(sound)
  void audio.play().catch(() => set({ sound: null }))
  set({ sound, timerFinished: false })
  updateWakeLock()
}

/** Diminui o volume aos poucos e para (no iPhone o volume não é ajustável: para no fim). */
function fadeOutSound(ms: number) {
  const a = audio
  if (!a || a.paused) return set({ sound: null })
  const start = a.volume
  const t0 = Date.now()
  if (fadeTimer) clearInterval(fadeTimer)
  fadeTimer = setInterval(() => {
    const k = 1 - (Date.now() - t0) / ms
    if (k <= 0) {
      clearInterval(fadeTimer!)
      fadeTimer = null
      a.pause()
      a.volume = 1
      set({ sound: null })
      updateWakeLock()
    } else {
      a.volume = Math.max(0, start * k)
    }
  }, 200)
}

let timerHandle: ReturnType<typeof setTimeout> | null = null

export function setSleepTimer(minutes: number | null) {
  if (timerHandle) clearTimeout(timerHandle)
  timerHandle = null
  if (!minutes) return set({ timerEnd: null, timerMinutes: null })
  const end = Date.now() + minutes * 60_000
  set({ timerEnd: end, timerMinutes: minutes, timerFinished: false })
  timerHandle = setTimeout(finishTimer, minutes * 60_000)
}

function finishTimer() {
  timerHandle = null
  stopSpeaking()
  fadeOutSound(20_000)
  set({ timerEnd: null, timerMinutes: null, timerFinished: true })
  setStoryPlaying(false)
}

/** Ao sair do módulo: para o som e o timer. */
export function stopSleep() {
  setSleepTimer(null)
  if (fadeTimer) clearInterval(fadeTimer)
  fadeTimer = null
  audio?.pause()
  set({ sound: null, timerFinished: false })
  setStoryPlaying(false)
}

// ---------- Tela acesa ----------
// Com a tela apagada o iPhone para a narração; enquanto há história ou som tocando, pede para manter acesa.

let storyPlaying = false
let wakeLock: { release(): Promise<void> } | null = null

export function setStoryPlaying(playing: boolean) {
  storyPlaying = playing
  updateWakeLock()
}

function updateWakeLock() {
  const want = storyPlaying || state.sound !== null
  const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } }
  if (want && !wakeLock && nav.wakeLock && document.visibilityState === 'visible') {
    nav.wakeLock.request('screen').then(
      (l) => {
        wakeLock = l
        if (!(storyPlaying || state.sound !== null)) void l.release().then(() => (wakeLock = null))
      },
      () => {},
    )
  } else if (!want && wakeLock) {
    const l = wakeLock
    wakeLock = null
    void l.release().catch(() => {})
  }
}

// O pedido de tela acesa cai quando o app vai para segundo plano; renova na volta.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    wakeLock = null
    updateWakeLock()
  }
})
