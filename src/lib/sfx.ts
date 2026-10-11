// Efeitos sonoros sintetizados com Web Audio — sem arquivos.

import { getSettings } from './settings'

let ctx: AudioContext | null = null

// iOS: sem isto, o Web Audio fica mudo quando a chave lateral está no silencioso (Safari 17+).
const nav = navigator as Navigator & { audioSession?: { type: string } }
if (nav.audioSession) nav.audioSession.type = 'playback'

function getContext(): AudioContext | null {
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

/**
 * Safari só libera o áudio se o contexto for retomado dentro de um gesto do usuário
 * (e às vezes fica "interrupted" depois de trocar de app). Um buffer mudo tocado
 * no gesto destrava de vez.
 */
function unlock() {
  const c = getContext()
  if (!c) return
  if (c.state !== 'running') void c.resume()
  const src = c.createBufferSource()
  src.buffer = c.createBuffer(1, 1, 22050)
  src.connect(c.destination)
  src.start(0)
}

for (const evt of ['pointerdown', 'touchend', 'keydown']) {
  window.addEventListener(evt, unlock, { capture: true, passive: true })
}

/** Executa `play` assim que o contexto estiver rodando. */
function withAudio(play: (c: AudioContext) => void) {
  if (!getSettings().sound) return
  const c = getContext()
  if (!c) return
  if (c.state === 'running') play(c)
  else void c.resume().then(() => play(c), () => {})
}

// ---------- Gravações (MP3) ----------
// Tocadas pelo mesmo AudioContext (já destravado no primeiro toque), o que funciona
// no iOS mesmo fora de um gesto — ao contrário de new Audio().play().

const buffers = new Map<string, Promise<AudioBuffer>>()
let clipSource: AudioBufferSourceNode | null = null

function loadClip(c: AudioContext, url: string): Promise<AudioBuffer> {
  let p = buffers.get(url)
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${url}`)
        return r.arrayBuffer()
      })
      .then((data) => c.decodeAudioData(data))
    p.catch(() => buffers.delete(url))
    buffers.set(url, p)
  }
  return p
}

/** Toca um arquivo de áudio; resolve quando termina (ou é interrompido). */
export async function playClipUrl(url: string): Promise<void> {
  if (!getSettings().sound) return
  const c = getContext()
  if (!c) throw new Error('sem Web Audio')
  if (c.state !== 'running') await c.resume()
  const buffer = await loadClip(c, url)
  stopClip()
  await new Promise<void>((resolve) => {
    const src = c.createBufferSource()
    src.buffer = buffer
    src.connect(c.destination)
    src.onended = () => {
      if (clipSource === src) clipSource = null
      resolve()
    }
    clipSource = src
    src.start()
  })
}

export function stopClip() {
  const src = clipSource
  clipSource = null
  try {
    src?.stop()
  } catch {
    // já parou
  }
}

function note(c: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, vol: number) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const t = c.currentTime + 0.01 + at
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

export function playTap() {
  withAudio((c) => note(c, 660, 0, 0.15, 'triangle', 0.35))
}

export function playPop() {
  withAudio((c) => {
    note(c, 520, 0, 0.12, 'sine', 0.4)
    note(c, 880, 0.07, 0.16, 'sine', 0.4)
  })
}

export function playSuccess() {
  withAudio((c) =>
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(c, f, i * 0.1, 0.35, 'triangle', 0.35)),
  )
}

/** Suave de propósito: errar não é castigo. */
export function playTryAgain() {
  withAudio((c) => {
    note(c, 392, 0, 0.2, 'sine', 0.25)
    note(c, 349.23, 0.16, 0.28, 'sine', 0.25)
  })
}
