// Narração com a voz do próprio navegador (Web Speech API, pt-BR).
// Quando houver gravações, `playClip` toca arquivos de public/sounds no lugar.

import { getSettings } from './settings'

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

/** Fala o texto, interrompendo a fala anterior. Resolve quando terminar (ou for interrompida). */
export function speak(text: string, { rate = 0.85, pitch = 1.15 }: SpeakOptions = {}): Promise<void> {
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

export function stopSpeaking() {
  synth?.cancel()
  stopClip()
}

let clip: HTMLAudioElement | null = null

/** Toca um arquivo de public/sounds. Rejeita se o arquivo não existir ou falhar. */
export function playClip(file: string): Promise<void> {
  if (!getSettings().sound) return Promise.resolve()
  stopClip()
  synth?.cancel()
  return new Promise((resolve, reject) => {
    const a = new Audio(`${import.meta.env.BASE_URL}sounds/${file}`)
    clip = a
    a.onended = () => resolve()
    a.onerror = () => reject(new Error(`som não encontrado: ${file}`))
    a.play().catch(reject)
  })
}

function stopClip() {
  if (!clip) return
  clip.pause()
  clip = null
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
