import { tr, type Lang, type Text } from '../../i18n/langs'
import lua from './lua.json'
import ovelhinhas from './ovelhinhas.json'
import ursinha from './ursinha.json'
import barquinho from './barquinho.json'
import nuvem from './nuvem.json'

// Histórias do módulo "Soninho": curtas, repetitivas e calmas, lidas sozinhas no modo automático.
// Para adicionar uma: crie o JSON nesta pasta (textos nas 4 línguas) e inclua-o aqui.

export interface BedtimeElement {
  emoji: string
  x: number
  y: number
  size?: number
}

export interface BedtimeStorySource {
  id: string
  title: Text
  cover: string
  /** CSS de fundo (céu noturno). */
  sky: string
  pages: { elements: BedtimeElement[]; text: Text }[]
}

export interface BedtimeStory {
  id: string
  title: string
  cover: string
  sky: string
  pages: { elements: BedtimeElement[]; text: string }[]
}

export const bedtimeStories: BedtimeStorySource[] = [lua, ovelhinhas, ursinha, barquinho, nuvem]

/** Id usado na medição de uso (separa das histórias normais). */
export const bedtimeAnalyticsId = (id: string) => `soninho-${id}`

export function getBedtimeStory(id: string | undefined, lang: Lang): BedtimeStory | undefined {
  const s = bedtimeStories.find((s) => s.id === id)
  if (!s) return undefined
  return {
    ...s,
    title: tr(s.title, lang),
    pages: s.pages.map((p) => ({ elements: p.elements, text: tr(p.text, lang) })),
  }
}
