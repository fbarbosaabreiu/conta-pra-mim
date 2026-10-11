/** Elemento tocável de uma cena: ao tocar, pula e mostra a palavra. */
export interface Hotspot {
  emoji: string
  word: string
  /** Onomatopeia ou complemento mostrado abaixo da palavra (ex.: "muuu!"). */
  sound?: string
  /**
   * Gravação em public/sounds tocada ao tocar (ex.: "vaca.mp3"), seguida do nome.
   * Sem gravação (ou se falhar), a voz fala a palavra e o som.
   */
  audio?: string
  /** Posição do centro, em % da cena. */
  x: number
  y: number
  /** Tamanho relativo (≈ % da menor dimensão da tela). */
  size?: number
}

export interface StoryPage {
  /** CSS de fundo da cena; se ausente, usa o da história. */
  background?: string
  elements: Hotspot[]
  text: string
  /**
   * Final da frase escondido atrás de um "?" — o adulto lê, pausa,
   * a criança tenta completar e depois toca para revelar.
   */
  reveal?: string
  /** Gravação tocada depois de revelar (ex.: "vaca.mp3" depois do "muuu!"). */
  revealAudio?: string
  /** Cor do texto revelado (ex.: a própria cor na história das cores). */
  accent?: string
  /** Palavras do texto que ficam em destaque. */
  highlight?: string[]
  /** Dica discreta para o adulto. */
  parentTip?: string
}

export interface Story {
  id: string
  title: string
  cover: string
  color: string
  background: string
  pages: StoryPage[]
}

// ---------- Como as histórias são escritas (src/content/stories/*.json) ----------
// Os textos vêm em todos os idiomas; `getStory` resolve para o idioma atual,
// e as telas recebem os tipos acima, com texto simples.

import type { Lang, Text } from './i18n/langs'

export type HotspotSource = Omit<Hotspot, 'word' | 'sound'> & { word: Text; sound?: Text }

export type StoryPageSource = Omit<StoryPage, 'elements' | 'text' | 'reveal' | 'highlight' | 'parentTip'> & {
  elements: HotspotSource[]
  text: Text
  reveal?: Text
  highlight?: Record<Lang, string[]>
  parentTip?: Text
}

export type StorySource = Omit<Story, 'title' | 'pages'> & { title: Text; pages: StoryPageSource[] }
