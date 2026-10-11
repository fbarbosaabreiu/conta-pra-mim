// Narração com a voz do próprio navegador (Web Speech API, no idioma do app), intercalada
// com gravações de public/sounds via `say(...)`.

import { useSyncExternalStore } from 'react'
import { getSettings } from './settings'
import { playClipUrl, stopClip } from './sfx'
import { LANG_INFO, type Lang } from '../i18n/langs'

const synth: SpeechSynthesis | null = 'speechSynthesis' in window ? window.speechSynthesis : null
export const speechSupported = synth !== null

/** Vozes boas conhecidas por idioma (Edge "Natural", Chrome "Google", iOS). */
const PREFERRED: Record<Lang, RegExp> = {
  pt: /francisca|luciana|google/i,
  en: /aria|jenny|samantha|google us/i,
  es: /elvira|monica|mónica|google español$/i,
  fr: /denise|amélie|amelie|thomas|google/i,
}

/** Vozes antigas de desktop, bem robóticas — só usadas se não houver outra. */
const OLD_DESKTOP: Partial<Record<Lang, RegExp>> = {
  pt: /\b(maria|daniel|heloisa)\b/i,
}

/**
 * Nota da voz: neurais/online (Edge "… Online (Natural)", iOS "Aprimorada/Premium", Google)
 * soam muito menos robóticas que as antigas de desktop.
 */
function voiceScore(v: SpeechSynthesisVoice, lang: Lang): number {
  const n = v.name
  let s = 0
  if (/natural|neural/i.test(n)) s += 60
  if (/premium|enhanced|aprimorad|melhorad/i.test(n)) s += 50
  if (/online/i.test(n)) s += 20
  if (/google/i.test(n)) s += 30
  if (!v.localService) s += 5
  if (PREFERRED[lang].test(n)) s += 10
  if (OLD_DESKTOP[lang]?.test(n) && !/natural|online/i.test(n)) s -= 30
  return s
}

const voices = new Map<Lang, SpeechSynthesisVoice | null>()

/** Prefere a variante exata do idioma (pt-BR, en-US…) e, dentro dela, a voz de melhor nota. */
function voiceFor(lang: Lang): SpeechSynthesisVoice | null {
  if (!synth) return null
  if (voices.has(lang)) return voices.get(lang)!
  const all = synth.getVoices()
  const locale = LANG_INFO[lang].locale.toLowerCase()
  const exact = all.filter((v) => v.lang.replace('_', '-').toLowerCase() === locale)
  const list = exact.length ? exact : all.filter((v) => v.lang.toLowerCase().startsWith(lang))
  const voice = [...list].sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang))[0] ?? null
  // Sem vozes ainda (Chrome carrega depois): não guarda, tenta de novo na próxima fala.
  if (all.length) voices.set(lang, voice)
  return voice
}

if (synth) synth.addEventListener('voiceschanged', () => voices.clear())

const canSpeak = () => {
  const s = getSettings()
  return synth !== null && s.sound && s.voice
}

// ---------- "Está falando?" (anima o narrador) ----------

let speaking = false
const listeners = new Set<() => void>()
function setSpeaking(v: boolean) {
  if (speaking === v) return
  speaking = v
  listeners.forEach((l) => l())
}
/** Se há fala ou gravação tocando agora. */
export const isSpeaking = () => speaking

export function useSpeaking(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => speaking,
  )
}

// ---------- Fala ----------

// Mantém referência para o navegador não descartar a fala no meio (bug do Chrome).
let current: SpeechSynthesisUtterance | null = null

/** Ajustes para soar menos "lido": tira aspas e reticências que algumas vozes pronunciam. */
function forSpeech(text: string): string {
  return text
    .replace(/[“”"]/g, '')
    .replace(/\.\.\.|…/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
}

interface SpeakOptions {
  /** Recebe o índice (no texto original) da palavra sendo falada, se a voz informar. */
  onWord?: (charIndex: number) => void
}

function speakNow(text: string, { onWord }: SpeakOptions = {}): Promise<void> {
  if (!canSpeak() || !text) return Promise.resolve()
  synth!.cancel()

  const spoken = forSpeech(text)
  // Mapeia posições do texto falado de volta para o original (para destacar a palavra certa).
  const words = [...text.matchAll(/\S+/g)].map((m) => m.index ?? 0)

  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(spoken)
    const { lang } = getSettings()
    u.lang = LANG_INFO[lang].locale
    const voice = voiceFor(lang)
    if (voice) u.voice = voice
    const naturalVoice = !!voice && voiceScore(voice, lang) >= 30
    // Vozes neurais já têm entonação boa; nas antigas, um pouco mais devagar e agudo soa mais "fala com bebê".
    u.rate = naturalVoice ? 0.92 : 0.88
    u.pitch = naturalVoice ? 1.05 : 1.15

    if (onWord) {
      u.onboundary = (e) => {
        if (e.name && e.name !== 'word') return
        const wordIdx = spoken.slice(0, e.charIndex).split(/\s+/).filter(Boolean).length
        if (wordIdx < words.length) onWord(words[wordIdx])
      }
    }

    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(safety)
      onWord?.(-1)
      resolve()
    }
    u.onend = finish
    u.onerror = finish
    // Alguns navegadores às vezes não disparam onend.
    const safety = setTimeout(finish, 2500 + spoken.length * 200)

    current = u
    synth!.speak(current)
  })
}

/** Um passo de uma sequência. */
export type Part =
  | string
  | { text: string; onWord?: (charIndex: number) => void }
  /** Gravação de public/sounds; `fallback` é falado se ela não carregar. */
  | { clip: string; fallback?: string }
  /** Silêncio, em ms. */
  | { pause: number }

/** Respiro entre uma fala/som e o próximo, para não soar emendado. */
const GAP_MS = 280

let sequence = 0
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Fala/toca as partes em ordem, com um respiro entre elas. Uma chamada nova
 * interrompe a anterior. Resolve quando termina ou é interrompida.
 */
export async function say(...parts: Part[]): Promise<void> {
  const id = ++sequence
  synth?.cancel()
  stopClip()
  setSpeaking(true)
  try {
    for (let i = 0; i < parts.length; i++) {
      if (id !== sequence) return
      const part = parts[i]
      if (typeof part === 'string') {
        await speakNow(part)
      } else if ('text' in part) {
        await speakNow(part.text, { onWord: part.onWord })
      } else if ('pause' in part) {
        await wait(part.pause)
        continue
      } else {
        try {
          await playClipUrl(`${import.meta.env.BASE_URL}sounds/${part.clip}`)
        } catch {
          if (part.fallback && id === sequence) await speakNow(part.fallback)
        }
      }
      if (i < parts.length - 1 && id === sequence) await wait(GAP_MS)
    }
  } finally {
    if (id === sequence) setSpeaking(false)
  }
}

/** Fala um texto, interrompendo qualquer fala/som anterior. */
export function speak(text: string): Promise<void> {
  return say(text)
}

export function stopSpeaking() {
  sequence++
  synth?.cancel()
  stopClip()
  setSpeaking(false)
}

// iOS só libera a fala depois de uma primeira fala disparada por um toque.
if (synth) {
  const unlock = () => {
    synth.speak(new SpeechSynthesisUtterance(''))
    window.removeEventListener('pointerdown', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
}
