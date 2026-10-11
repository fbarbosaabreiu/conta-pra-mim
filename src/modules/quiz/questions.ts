import animals from '../../content/quiz/animais.json'
import colors from '../../content/quiz/cores.json'
import numbers from '../../content/quiz/numeros.json'

export type ThemeId = 'animais' | 'cores' | 'numeros'

export const themes: { id: ThemeId; title: string; emoji: string; color: string }[] = [
  { id: 'animais', title: 'Animais', emoji: '🐶', color: 'var(--color-leaf)' },
  { id: 'cores', title: 'Cores', emoji: '🎨', color: 'var(--color-grape)' },
  { id: 'numeros', title: 'Números', emoji: '🔢', color: 'var(--color-sun)' },
]

export interface QuizOption {
  id: string
  label: string
  emoji?: string
  color?: string
  number?: number
  /** Falado quando a criança toca nesta opção errada: "Esse é o cachorro". */
  thisIs: string
}

export interface Question {
  prompt: string
  answerId: string
  options: QuizOption[]
  /** Comemoração mostrada no acerto, ex.: "O gato faz miau!". */
  success: string
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

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Sorteia a resposta (evitando repetir a anterior) e completa com distratores. */
function withDistractors<T extends { id: string }>(pool: T[], numOptions: number, avoidId?: string) {
  const answer = pick(pool.filter((x) => x.id !== avoidId))
  const others = shuffle(pool.filter((x) => x.id !== answer.id)).slice(0, numOptions - 1)
  return { answer, options: shuffle([answer, ...others]) }
}

function animalQuestion(numOptions: number, avoidId?: string): Question {
  const { answer, options } = withDistractors(animals, numOptions, avoidId)
  const opts = options.map((a) => ({
    id: a.id,
    label: a.name,
    emoji: a.emoji,
    thisIs: `${a.article === 'a' ? 'Essa' : 'Esse'} é ${a.article} ${a.name}, faz ${a.sound}.`,
  }))
  const subject = `${answer.article} ${answer.name}`

  if (Math.random() < 0.5) {
    return {
      prompt: `Cadê ${subject}?`,
      answerId: answer.id,
      options: opts,
      success: `${capitalize(subject)}!`,
    }
  }
  return {
    prompt: `Quem faz “${answer.sound}”?`,
    answerId: answer.id,
    options: opts,
    success: `${capitalize(subject)} faz ${answer.sound}!`,
  }
}

function colorQuestion(numOptions: number, avoidId?: string): Question {
  const { answer, options } = withDistractors(colors, numOptions, avoidId)
  return {
    prompt: `Toque no ${answer.name}`,
    answerId: answer.id,
    options: options.map((c) => ({ id: c.id, label: c.name, color: c.hex, thisIs: `Esse é o ${c.name}.` })),
    success: `${capitalize(answer.name)}!`,
  }
}

function numberQuestion(numOptions: number, avoidId?: string): Question {
  // Começa contando até 3; com mais opções, vai até o máximo.
  const max = numOptions <= 2 ? 3 : numbers.max
  const pool = Array.from({ length: max }, (_, i) => ({ id: String(i + 1), n: i + 1 }))
  const { answer, options } = withDistractors(pool, numOptions, avoidId)
  const item = pick(numbers.items)
  const words = item.feminine ? numbers.words.feminine : numbers.words.masculine

  return {
    prompt: `${item.feminine ? 'Quantas' : 'Quantos'} ${item.plural}?`,
    answerId: answer.id,
    options: options
      .sort((a, b) => a.n - b.n)
      .map((o) => ({ id: o.id, label: words[o.n - 1], number: o.n, thisIs: `Esse é o ${o.n}.` })),
    success: `${capitalize(words[answer.n - 1])} ${answer.n === 1 ? item.singular : item.plural}!`,
    count: { emoji: item.emoji, n: answer.n, words },
  }
}

const generators: Record<ThemeId, (numOptions: number, avoidId?: string) => Question> = {
  animais: animalQuestion,
  cores: colorQuestion,
  numeros: numberQuestion,
}

export function makeQuestion(theme: ThemeId, numOptions: number, avoidId?: string): Question {
  return generators[theme](numOptions, avoidId)
}
