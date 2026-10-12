// Medição de uso anônima, só com consentimento (LGPD).
// Envia eventos em lotes para o Worker em analytics/ (VITE_ANALYTICS_URL).
// Sem consentimento — ou sem endereço configurado, como no desenvolvimento — nada sai do aparelho.

import { useSyncExternalStore } from 'react'
import { getSettings } from './settings'
import { getOrigin } from './referral'

const ENDPOINT = (import.meta.env.VITE_ANALYTICS_URL as string | undefined)?.replace(/\/$/, '')
export const analyticsEnabled = !!ENDPOINT

const CONSENT_KEY = 'fala-falinha:analytics-consent'
const DEVICE_KEY = 'fala-falinha:device'
const CATALOG_KEY = 'fala-falinha:catalog-sent'
const ORIGIN_SENT_KEY = 'fala-falinha:origem-sent'
/** Depois de tanto tempo com o app em segundo plano, a volta conta como nova sessão. */
const SESSION_IDLE_MS = 30 * 60 * 1000

export type Consent = 'granted' | 'denied' | null
export type EventName =
  | 'app_open'
  | 'story_open'
  | 'story_complete'
  | 'quiz_start'
  | 'quiz_complete'
  | 'onboarding_done'
  | 'onboarding_skip'
  | 'arrival' // de onde a família chegou (theme = origem do link); uma vez por aparelho
  | 'share' // tocou em "Indicar para outra família"
  | 'signup' // criou a conta (opcional) para guardar o progresso

interface QueuedEvent {
  name: EventName
  story?: string
  theme?: string
  value?: number
  t: number
  hour: number
  dow: number
}

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // sem armazenamento: vale só para esta sessão
  }
}

const uuid = () =>
  crypto.randomUUID?.() ??
  '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16),
  )

// ---------- Consentimento ----------

let consent: Consent = (read(CONSENT_KEY) as Consent) ?? null
const listeners = new Set<() => void>()

export function getConsent(): Consent {
  return consent
}

export function useConsent(): Consent {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => consent,
  )
}

export function setConsent(value: 'granted' | 'denied') {
  consent = value
  write(CONSENT_KEY, value)
  if (value === 'denied') {
    queue = []
    write(DEVICE_KEY, null) // sem consentimento, o aparelho deixa de ter código
    write(ORIGIN_SENT_KEY, null)
  }
  listeners.forEach((l) => l())
  if (value === 'granted') startSession()
}

/** Código do aparelho (só existe com consentimento). */
export function getDeviceId(): string | null {
  if (consent !== 'granted') return null
  let id = read(DEVICE_KEY)
  if (!id) {
    id = uuid()
    write(DEVICE_KEY, id)
  }
  return id
}

/** Código curto mostrado na tela Privacidade e no painel. */
export const shortCode = (id: string) => id.slice(0, 6).toUpperCase()

/** Apaga no servidor tudo o que foi registrado deste aparelho e para de medir. */
export async function forgetMe(): Promise<boolean> {
  const device = read(DEVICE_KEY)
  setConsent('denied')
  if (!ENDPOINT || !device) return true
  try {
    const r = await fetch(`${ENDPOINT}/forget`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ device }),
    })
    return r.ok
  } catch {
    return false
  }
}

// ---------- Sessão e envio ----------

let session = uuid()
let hiddenAt = 0
let queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let catalog: { id: string; title: string }[] | null = null

/** Registra um evento (ignorado sem consentimento). */
export function track(name: EventName, data: { story?: string; theme?: string; value?: number } = {}) {
  if (!ENDPOINT || consent !== 'granted') return
  const now = new Date()
  queue.push({ name, ...data, t: now.getTime(), hour: now.getHours(), dow: now.getDay() })
  if (queue.length >= 20) flush()
  else if (!timer) timer = setTimeout(flush, 4000)
}

function flush() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  const device = getDeviceId()
  if (!ENDPOINT || !device || !queue.length) return
  const body: Record<string, unknown> = {
    device,
    session,
    lang: getSettings().lang,
    standalone: matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
    events: queue.splice(0, 50),
  }
  // Catálogo de histórias: só quando muda (o painel usa para mostrar as nunca abertas).
  const catalogJson = catalog && JSON.stringify(catalog)
  if (catalogJson && read(CATALOG_KEY) !== catalogJson) {
    body.catalog = catalog
    write(CATALOG_KEY, catalogJson)
  }
  const json = JSON.stringify(body)
  // text/plain evita a pré-consulta CORS; sendBeacon sobrevive ao fechar o app.
  const sent = navigator.sendBeacon?.(`${ENDPOINT}/e`, new Blob([json], { type: 'text/plain' }))
  if (!sent) {
    void fetch(`${ENDPOINT}/e`, { method: 'POST', body: json, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(
      () => {},
    )
  }
  if (queue.length) timer = setTimeout(flush, 1000)
}

function startSession() {
  session = uuid()
  track('app_open')
  const origin = getOrigin()
  if (origin && !read(ORIGIN_SENT_KEY)) {
    track('arrival', { theme: origin })
    write(ORIGIN_SENT_KEY, '1')
  }
}

/** Chamado uma vez ao abrir o app: começa a sessão e cuida de enviar ao sair. */
let initialized = false
export function initAnalytics(storyCatalog: { id: string; title: string }[]) {
  catalog = storyCatalog
  if (!ENDPOINT || initialized) return
  initialized = true
  if (consent === 'granted') startSession()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now()
      flush()
    } else if (hiddenAt && Date.now() - hiddenAt > SESSION_IDLE_MS && consent === 'granted') {
      startSession()
    }
  })
  window.addEventListener('pagehide', flush)
}
