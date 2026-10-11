import { useSyncExternalStore } from 'react'

export interface Settings {
  /** Liga/desliga todo o áudio do app. */
  sound: boolean
  /** Narração e falas (histórias, perguntas, nomes dos bichos). */
  voice: boolean
}

const KEY = 'conta-pra-mim:settings'
const defaults: Settings = { sound: true, voice: true }

let state: Settings = load()
const listeners = new Set<() => void>()

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaults, ...JSON.parse(raw) }
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
