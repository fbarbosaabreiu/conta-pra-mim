/** Elemento tocável de uma cena: ao tocar, pula e mostra a palavra. */
export interface Hotspot {
  emoji: string
  word: string
  /** Onomatopeia ou complemento mostrado abaixo da palavra (ex.: "muuu!"). */
  sound?: string
  /**
   * Arquivo em public/sounds tocado ao tocar (ex.: "vaca.mp3").
   * Sem arquivo, a voz do navegador fala a palavra e o som.
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
