import animalsData from '../../content/quiz/animais.json'
import colorsData from '../../content/quiz/cores.json'
import numbers from '../../content/quiz/numeros.json'
import { variant } from '../../lib/phrases'
import type { Lang } from '../../i18n'
import { grammar, type CountNoun, type Noun } from '../../i18n/grammar'

export type ThemeId = 'animais' | 'cores' | 'numeros'

/** Títulos em ui.themes. */
export const themes: { id: ThemeId; emoji: string; color: string }[] = [
  { id: 'animais', emoji: '🐶', color: 'var(--color-leaf)' },
  { id: 'cores', emoji: '🎨', color: 'var(--color-grape)' },
  { id: 'numeros', emoji: '🔢', color: 'var(--color-sun)' },
]

type Animal = { id: string; emoji: string; audio: string } & Record<Lang, Noun & { sound: string }>
type Color = { id: string; hex: string; name: Record<Lang, string> }
type CountItem = { emoji: string } & Record<Lang, CountNoun>

const animals: Animal[] = animalsData
const colors: Color[] = colorsData
const countItems: CountItem[] = numbers.items

export interface QuizOption {
  id: string
  label: string
  emoji?: string
  color?: string
  number?: number
  /** Falado quando a criança toca nesta opção errada: "Esse é o cachorro". */
  thisIs: string
  /** Gravação do bicho (public/sounds) e o som por escrito, usado se ela falhar. */
  audio?: string
  soundText?: string
}

export interface Question {
  /** Texto na tela. */
  prompt: string
  /** O que a voz fala (pode diferir: "Quem faz assim?" + o som de verdade). */
  spoken: string
  /** Gravação tocada logo depois da pergunta falada. */
  promptAudio?: string
  answerId: string
  options: QuizOption[]
  /** Comemoração mostrada no acerto, ex.: "O gato faz miau!". */
  success: string
  /** Comemoração falada (sem onomatopeias, que a voz sintética lê mal). */
  successSpoken: string
  /** Só nas perguntas de número: itens para a criança contar. */
  count?: { emoji: string; n: number; words: string[] }
}

const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Sorteia a resposta (evitando repetir a anterior) e completa com distratores. */
function withDistractors<T extends { id: string }>(pool: T[], numOptions: number, avoidId?: string) {
  const answer = pick(pool.filter((x) => x.id !== avoidId))
  const others = shuffle(pool.filter((x) => x.id !== answer.id)).slice(0, numOptions - 1)
  return { answer, options: shuffle([answer, ...others]) }
}

function animalQuestion(lang: Lang, numOptions: number, avoidId?: string): Question {
  const g = grammar[lang]
  const { answer, options } = withDistractors(animals, numOptions, avoidId)
  const opts = options.map((a) => ({
    id: a.id,
    label: a[lang].name,
    emoji: a.emoji,
    thisIs: g.thisIs(a[lang]),
    audio: a.audio,
    soundText: a[lang].sound,
  }))
  const subject = answer[lang]

  if (Math.random() < 0.5) {
    const prompt = variant('find', g.findPrompts(subject))
    return {
      prompt,
      spoken: prompt,
      answerId: answer.id,
      options: opts,
      success: g.found(subject),
      successSpoken: g.foundSpoken(subject),
    }
  }
  return {
    prompt: g.soundPrompt(subject.sound),
    spoken: variant('sound', g.soundSpoken),
    promptAudio: answer.audio,
    answerId: answer.id,
    options: opts,
    success: g.says(subject, subject.sound),
    successSpoken: g.foundSpoken(subject),
  }
}

function colorQuestion(lang: Lang, numOptions: number, avoidId?: string): Question {
  const g = grammar[lang]
  const { answer, options } = withDistractors(colors, numOptions, avoidId)
  const prompt = variant('color', g.colorPrompts(answer.name[lang]))
  return {
    prompt,
    spoken: prompt,
    answerId: answer.id,
    options: options.map((c) => ({ id: c.id, label: c.name[lang], color: c.hex, thisIs: g.colorThisIs(c.name[lang]) })),
    success: g.colorFound(answer.name[lang]),
    successSpoken: g.colorFound(answer.name[lang]),
  }
}

function numberQuestion(lang: Lang, numOptions: number, avoidId?: string): Question {
  const g = grammar[lang]
  // Começa contando até 3; com mais opções, vai até o máximo.
  const max = numOptions <= 2 ? 3 : numbers.max
  const pool = Array.from({ length: max }, (_, i) => ({ id: String(i + 1), n: i + 1 }))
  const { answer, options } = withDistractors(pool, numOptions, avoidId)
  const picked = pick(countItems)
  const item = picked[lang]
  const words = g.countWords(item.fem)

  const prompt = variant('number', g.howManyPrompts(item))
  const success = g.amount(answer.n, item)

  return {
    prompt,
    spoken: prompt,
    answerId: answer.id,
    options: options
      .sort((a, b) => a.n - b.n)
      .map((o) => ({ id: o.id, label: words[o.n - 1], number: o.n, thisIs: g.numberThisIs(o.n) })),
    success,
    successSpoken: success,
    count: { emoji: picked.emoji, n: answer.n, words },
  }
}

const generators: Record<ThemeId, (lang: Lang, numOptions: number, avoidId?: string) => Question> = {
  animais: animalQuestion,
  cores: colorQuestion,
  numeros: numberQuestion,
}

export function makeQuestion(theme: ThemeId, lang: Lang, numOptions: number, avoidId?: string): Question {
  return generators[theme](lang, numOptions, avoidId)
}
