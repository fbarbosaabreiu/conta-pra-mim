// Frases do quiz montadas com a gramática de cada idioma (artigos, gênero, plural, pontuação).
// As listas são variações sorteadas por `variant` (src/lib/phrases.ts).

import { frSpacing, type Lang } from './langs'

export interface Noun {
  name: string
  /** Feminino (o padrão é masculino; em inglês não faz diferença). */
  fem?: boolean
}

export interface CountNoun {
  singular: string
  plural: string
  fem?: boolean
}

export interface Grammar {
  /** "Cadê o gato?", "Onde está o gato?"… */
  findPrompts(n: Noun): string[]
  /** Na tela: "Quem faz “miau”?" */
  soundPrompt(sound: string): string
  /** Falado antes da gravação: "Quem faz assim?" */
  soundSpoken: string[]
  /** "O gato!" */
  found(n: Noun): string
  /** "É o gato!" (falado, sem onomatopeia) */
  foundSpoken(n: Noun): string
  /** "O gato faz miau!" */
  says(n: Noun, sound: string): string
  /** Depois de um "Olha só," ao tocar na opção errada: "esse é o gato!" */
  thisIs(n: Noun): string
  colorPrompts(color: string): string[]
  colorThisIs(color: string): string
  colorFound(color: string): string
  /** "Quantas maçãs?"… */
  howManyPrompts(item: CountNoun): string[]
  numberThisIs(n: number): string
  /** Palavras de contagem de 1 em diante, concordando com o item contado. */
  countWords(fem?: boolean): string[]
  /** "Duas maçãs!" */
  amount(n: number, item: CountNoun): string
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const ptThe = (n: Noun) => `${n.fem ? 'a' : 'o'} ${n.name}`
const ptWords = { m: ['um', 'dois', 'três', 'quatro', 'cinco'], f: ['uma', 'duas', 'três', 'quatro', 'cinco'] }

const pt: Grammar = {
  findPrompts: (n) => [`Cadê ${ptThe(n)}?`, `Onde está ${ptThe(n)}?`, `Mostra pra mim ${ptThe(n)}!`, `Você acha ${ptThe(n)}?`],
  soundPrompt: (s) => `Quem faz “${s}”?`,
  soundSpoken: ['Quem faz assim?', 'Escuta só... quem faz esse barulho?', 'Que bicho faz assim?'],
  found: (n) => `${cap(ptThe(n))}!`,
  foundSpoken: (n) => `É ${ptThe(n)}!`,
  says: (n, s) => `${cap(ptThe(n))} faz ${s}!`,
  thisIs: (n) => `${n.fem ? 'essa' : 'esse'} é ${ptThe(n)}!`,
  colorPrompts: (c) => [`Toque no ${c}!`, `Cadê o ${c}?`, `Mostra o ${c}!`, `Qual é o ${c}?`],
  colorThisIs: (c) => `esse é o ${c}!`,
  colorFound: (c) => `${cap(c)}!`,
  howManyPrompts: (i) => {
    const how = i.fem ? 'Quantas' : 'Quantos'
    return [`${how} ${i.plural}?`, `${how} ${i.plural} tem aqui?`, `Vamos contar! ${how} ${i.plural}?`]
  },
  numberThisIs: (n) => `esse é o ${n}!`,
  countWords: (fem) => (fem ? ptWords.f : ptWords.m),
  amount: (n, i) => `${cap((i.fem ? ptWords.f : ptWords.m)[n - 1])} ${n === 1 ? i.singular : i.plural}!`,
}

const enWords = ['one', 'two', 'three', 'four', 'five']

const en: Grammar = {
  findPrompts: (n) => [
    `Where’s the ${n.name}?`,
    `Can you find the ${n.name}?`,
    `Show me the ${n.name}!`,
    `Where’s the ${n.name} hiding?`,
  ],
  soundPrompt: (s) => `Who says “${s}”?`,
  soundSpoken: ['Who says this?', 'Listen... who makes this sound?', 'Which animal goes like this?'],
  found: (n) => `The ${n.name}!`,
  foundSpoken: (n) => `It’s the ${n.name}!`,
  says: (n, s) => `The ${n.name} says ${s}!`,
  thisIs: (n) => `that’s the ${n.name}!`,
  colorPrompts: (c) => [`Touch ${c}!`, `Where’s ${c}?`, `Show me ${c}!`, `Which one is ${c}?`],
  colorThisIs: (c) => `that’s ${c}!`,
  colorFound: (c) => `${cap(c)}!`,
  howManyPrompts: (i) => [`How many ${i.plural}?`, `How many ${i.plural} are there?`, `Let’s count! How many ${i.plural}?`],
  numberThisIs: (n) => `that’s ${n}!`,
  countWords: () => enWords,
  amount: (n, i) => `${cap(enWords[n - 1])} ${n === 1 ? i.singular : i.plural}!`,
}

const esThe = (n: Noun) => `${n.fem ? 'la' : 'el'} ${n.name}`
// Contando sozinho é "uno"; antes de um substantivo masculino vira "un" (ver amount).
const esWords = { m: ['uno', 'dos', 'tres', 'cuatro', 'cinco'], f: ['una', 'dos', 'tres', 'cuatro', 'cinco'] }

const es: Grammar = {
  findPrompts: (n) => [`¿Dónde está ${esThe(n)}?`, `¡Muéstrame ${esThe(n)}!`, `¿Cuál es ${esThe(n)}?`],
  soundPrompt: (s) => `¿Quién hace “${s}”?`,
  soundSpoken: ['¿Quién hace así?', 'Escucha... ¿quién hace este ruido?', '¿Qué animal hace así?'],
  found: (n) => `¡${cap(esThe(n))}!`,
  foundSpoken: (n) => `¡Es ${esThe(n)}!`,
  says: (n, s) => `¡${cap(esThe(n))} hace ${s}!`,
  thisIs: (n) => `¡${n.fem ? 'esa' : 'ese'} es ${esThe(n)}!`,
  colorPrompts: (c) => [`¡Toca el ${c}!`, `¿Dónde está el ${c}?`, `¡Muéstrame el ${c}!`, `¿Cuál es el ${c}?`],
  colorThisIs: (c) => `¡ese es el ${c}!`,
  colorFound: (c) => `¡${cap(c)}!`,
  howManyPrompts: (i) => {
    const how = i.fem ? 'Cuántas' : 'Cuántos'
    return [`¿${how} ${i.plural}?`, `¿${how} ${i.plural} hay aquí?`, `¡Vamos a contar! ¿${how} ${i.plural}?`]
  },
  numberThisIs: (n) => `¡ese es el ${n}!`,
  countWords: (fem) => (fem ? esWords.f : esWords.m),
  amount: (n, i) => {
    const word = n === 1 ? (i.fem ? 'una' : 'un') : esWords.m[n - 1]
    return `¡${cap(word)} ${n === 1 ? i.singular : i.plural}!`
  },
}

// Elisão: "l’abeille", "l’orange", "d’étoiles".
const vowel = (s: string) => /^[aeiouyàâéèêîôû]/i.test(s)
const frThe = (n: Noun) => (vowel(n.name) ? `l’${n.name}` : `${n.fem ? 'la' : 'le'} ${n.name}`)
const frLe = (s: string) => (vowel(s) ? `l’${s}` : `le ${s}`)
const frDe = (s: string) => (vowel(s) ? `d’${s}` : `de ${s}`)
const frWords = { m: ['un', 'deux', 'trois', 'quatre', 'cinq'], f: ['une', 'deux', 'trois', 'quatre', 'cinq'] }

const frRaw: Grammar = {
  findPrompts: (n) => [`Où est ${frThe(n)} ?`, `Montre-moi ${frThe(n)} !`, `Tu trouves ${frThe(n)} ?`, `Il est où, ${frThe(n)} ?`],
  soundPrompt: (s) => `Qui fait « ${s} » ?`,
  soundSpoken: ['Qui fait comme ça ?', 'Écoute... qui fait ce bruit ?', 'Quel animal fait comme ça ?'],
  found: (n) => `${cap(frThe(n))} !`,
  foundSpoken: (n) => `C’est ${frThe(n)} !`,
  says: (n, s) => `${cap(frThe(n))} fait ${s} !`,
  thisIs: (n) => `c’est ${frThe(n)} !`,
  colorPrompts: (c) => [`Touche ${frLe(c)} !`, `Où est ${frLe(c)} ?`, `Montre-moi ${frLe(c)} !`, `C’est lequel, ${frLe(c)} ?`],
  colorThisIs: (c) => `c’est ${frLe(c)} !`,
  colorFound: (c) => `${cap(c)} !`,
  howManyPrompts: (i) => [
    `Combien ${frDe(i.plural)} ?`,
    `Il y a combien ${frDe(i.plural)} ?`,
    `On compte ! Combien ${frDe(i.plural)} ?`,
  ],
  numberThisIs: (n) => `c’est le ${n} !`,
  countWords: (fem) => (fem ? frWords.f : frWords.m),
  amount: (n, i) => `${cap((i.fem ? frWords.f : frWords.m)[n - 1])} ${n === 1 ? i.singular : i.plural} !`,
}

/** Aplica o espaço inseparável do francês em tudo que a gramática devolve. */
function withFrSpacing(g: Grammar): Grammar {
  const fix = <T>(x: T): T =>
    (typeof x === 'string' ? frSpacing(x) : Array.isArray(x) ? x.map((s) => frSpacing(s)) : x) as T
  return Object.fromEntries(
    Object.entries(g).map(([k, v]) => [k, typeof v === 'function' ? (...a: never[]) => fix(v(...a)) : fix(v)]),
  ) as unknown as Grammar
}

export const grammar: Record<Lang, Grammar> = { pt, en, es, fr: withFrSpacing(frRaw) }
