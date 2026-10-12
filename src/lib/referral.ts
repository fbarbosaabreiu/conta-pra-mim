// De onde a família chegou: links divulgados levam uma marca, como
// https://falafalinha.com/?origem=instagram (também aceita ?utm_source=…).
// Guarda só a primeira marca vista neste aparelho e tira a marca do endereço.
// A medição só envia a origem com consentimento (veja analytics.ts).
// A página /sobre também manda ?lang=… para o app abrir no idioma que a família escolheu lá.

import { isLang } from '../i18n/langs'
import { updateSettings } from './settings'

const KEY = 'fala-falinha:origem'

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

function readFromUrl(): string | null {
  const params = new URLSearchParams(location.search)
  const raw = params.get('origem') ?? params.get('utm_source') ?? params.get('ref')
  const lang = params.get('lang')
  if (raw === null && lang === null) return null
  if (isLang(lang)) updateSettings({ lang })
  for (const k of ['origem', 'utm_source', 'utm_medium', 'utm_campaign', 'ref', 'lang']) params.delete(k)
  const query = params.toString()
  history.replaceState(history.state, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`)
  return raw === null ? null : slug(raw) || null
}

const fromUrl = readFromUrl()
try {
  if (fromUrl && !localStorage.getItem(KEY)) localStorage.setItem(KEY, fromUrl)
} catch {
  // sem armazenamento: a origem vale só nesta abertura
}

/** Primeira origem registrada neste aparelho (ou `null` se veio sem marca). */
export function getOrigin(): string | null {
  try {
    return localStorage.getItem(KEY) ?? fromUrl
  } catch {
    return fromUrl
  }
}
