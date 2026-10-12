import { useSyncExternalStore } from 'react'
import { LANGS, isLang, type Lang } from '../i18n/langs'
import { isAge, type AgeId } from './age'

export interface Settings {
  /** Liga/desliga todo o áudio do app. */
  sound: boolean
  /** Narração e falas (histórias, perguntas, nomes dos bichos). */
  voice: boolean
  /** Idioma dos textos, das histórias e da voz. */
  lang: Lang
  /** Faixa etária escolhida pelos pais (null = ainda não escolheu). */
  age: AgeId | null
}

const KEY = 'conta-pra-mim:settings'
/** Na primeira vez, usa o idioma do aparelho se o app tiver; senão, português. */
export function detectLang(): Lang {
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l?.slice(0, 2).toLowerCase()
    if (isLang(code)) return code
  }
  return LANGS[0]
}

const defaults: Settings = { sound: true, voice: true, lang: detectLang(), age: null }

let state: Settings = load()
const listeners = new Set<() => void>()

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = { ...defaults, ...JSON.parse(raw) }
      if (!isLang(saved.lang)) saved.lang = defaults.lang
      if (!isAge(saved.age)) saved.age = null
      return saved
    }
  } catch {
    // armazenamento indisponível: usa o padrão
  }
  return defaults
}

export function getSettings(): Settings {
  return state
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // sem armazenamento: vale só para esta sessão
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings)
}
