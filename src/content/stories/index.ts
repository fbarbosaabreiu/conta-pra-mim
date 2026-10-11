import type { Story, StorySource } from '../../types'
import { tr, type Lang } from '../../i18n/langs'
import fazenda from './fazenda.json'
import arcoIris from './arco-iris.json'
import patinhos from './patinhos.json'
import bichinhosDeCasa from './bichinhos-de-casa.json'
import zoologico from './zoologico.json'
import boaNoite from './boa-noite.json'
import noSitio from './no-sitio.json'
import praia from './praia.json'
import floresta from './floresta.json'
import selva from './selva.json'
import banho from './banho.json'
import cozinha from './cozinha.json'
import roupas from './roupas.json'
import brinquedos from './brinquedos.json'
import veiculos from './veiculos.json'
import ceu from './ceu.json'
import parque from './parque.json'
import frutas from './frutas.json'
import dormir from './dormir.json'
import musica from './musica.json'

// Para adicionar uma história: crie o JSON nesta pasta e inclua-o aqui.
export const stories: StorySource[] = [
  // bichos
  fazenda,
  bichinhosDeCasa,
  zoologico,
  noSitio,
  praia,
  floresta,
  selva,
  boaNoite,
  // cores e números
  arcoIris,
  patinhos,
  // objetos e rotina
  banho,
  cozinha,
  roupas,
  brinquedos,
  veiculos,
  ceu,
  parque,
  frutas,
  dormir,
  musica,
]

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
