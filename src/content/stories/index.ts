import type { Story, StorySource } from '../../types'
import { tr, type Lang } from '../../i18n/langs'
import fazenda from './fazenda.json'
import arcoIris from './arco-iris.json'
import patinhos from './patinhos.json'

// Para adicionar uma história: crie o JSON nesta pasta e inclua-o aqui.
export const stories: StorySource[] = [fazenda, arcoIris, patinhos]

/** A história com todos os textos no idioma pedido. */
function resolve(s: StorySource, lang: Lang): Story {
  const opt = <T,>(x: T | undefined, f: (x: T) => string) => (x === undefined ? undefined : f(x))
  return {
    ...s,
    title: tr(s.title, lang),
    pages: s.pages.map((p) => ({
      ...p,
      text: tr(p.text, lang),
      reveal: opt(p.reveal, (r) => tr(r, lang)),
      highlight: p.highlight?.[lang],
      parentTip: opt(p.parentTip, (t) => tr(t, lang)),
      elements: p.elements.map((e) => ({ ...e, word: tr(e.word, lang), sound: opt(e.sound, (x) => tr(x, lang)) })),
    })),
  }
}

export function getStory(id: string | undefined, lang: Lang): Story | undefined {
  const s = stories.find((s) => s.id === id)
  return s && resolve(s, lang)
}
