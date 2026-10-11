// Narração com a voz do próprio navegador (Web Speech API, pt-BR), intercalada
// com gravações de public/sounds via `say(...)`.

import { getSettings } from './settings'
import { playClipUrl, stopClip } from './sfx'

const synth: SpeechSynthesis | null = 'speechSynthesis' in window ? window.speechSynthesis : null
export const speechSupported = synth !== null

let voice: SpeechSynthesisVoice | null = null

/** Prefere vozes pt-BR "naturais" (Edge: Francisca/Antonio, Chrome: Google, iOS: Luciana). */
function pickVoice() {
  if (!synth) return
  const all = synth.getVoices()
  const ptBR = all.filter((v) => v.lang.replace('_', '-').toLowerCase() === 'pt-br')
  const pt = ptBR.length ? ptBR : all.filter((v) => v.lang.toLowerCase().startsWith('pt'))
  voice =
    pt.find((v) => /natural/i.test(v.name)) ??
    pt.find((v) => /francisca|luciana|google/i.test(v.name)) ??
    pt[0] ??
    null
}

if (synth) {
  pickVoice()
  synth.addEventListener('voiceschanged', pickVoice)
}

const canSpeak = () => {
  const s = getSettings()
  return synth !== null && s.sound && s.voice
}

// Mantém referência para o navegador não descartar a fala no meio (bug do Chrome).
let current: SpeechSynthesisUtterance | null = null

interface SpeakOptions {
  rate?: number
  pitch?: number
}

function speakNow(text: string, { rate = 0.85, pitch = 1.15 }: SpeakOptions = {}): Promise<void> {
  if (!canSpeak() || !text) return Promise.resolve()
  synth!.cancel()

  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'pt-BR'
    if (voice) u.voice = voice
    u.rate = rate
    u.pitch = pitch

    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(safety)
      resolve()
    }
    u.onend = finish
    u.onerror = finish
    // Alguns navegadores às vezes não disparam onend.
    const safety = setTimeout(finish, 2000 + text.length * 180)

    current = u
    synth!.speak(current)
  })
}

/** Um passo de uma sequência: texto falado ou gravação de public/sounds. */
export type Part =
  | string
  | { text: string; pitch?: number }
  /** `fallback` é falado se a gravação não carregar. */
  | { clip: string; fallback?: string }

let sequence = 0

/**
 * Fala/toca as partes em ordem. Uma chamada nova interrompe a anterior.
 * Resolve quando termina ou é interrompida.
 */
export async function say(...parts: Part[]): Promise<void> {
  const id = ++sequence
  synth?.cancel()
  stopClip()
  for (const part of parts) {
    if (id !== sequence) return
    if (typeof part === 'string') {
      await speakNow(part)
    } else if ('text' in part) {
      await speakNow(part.text, { pitch: part.pitch })
    } else {
      try {
        await playClipUrl(`${import.meta.env.BASE_URL}sounds/${part.clip}`)
      } catch {
        if (part.fallback && id === sequence) await speakNow(part.fallback, { pitch: 1.3 })
      }
    }
  }
}

/** Fala um texto, interrompendo qualquer fala/som anterior. */
export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  return say({ text, pitch: options.pitch })
}

export function stopSpeaking() {
  sequence++
  synth?.cancel()
  stopClip()
}

// iOS só libera a fala depois de uma primeira fala disparada por um toque.
if (synth) {
  const unlock = () => {
    synth.speak(new SpeechSynthesisUtterance(''))
    window.removeEventListener('pointerdown', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
