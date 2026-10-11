// Frases variadas: ouvir sempre o mesmo "Isso!" é o que mais soa robótico.

import { frSpacing, type Lang } from '../i18n/langs'

const last = new Map<string[], string>()

/** Sorteia uma frase do grupo, sem repetir a anterior do mesmo grupo. */
export function vary(pool: string[]): string {
  const options = pool.length > 1 ? pool.filter((p) => p !== last.get(pool)) : pool
  const choice = options[Math.floor(Math.random() * options.length)]
  last.set(pool, choice)
  return choice
}

const lastIndex = new Map<string, number>()

/** Como `vary`, para listas montadas na hora (ex.: com o nome do bicho): evita repetir o mesmo formato. */
export function variant<T>(key: string, list: T[]): T {
  let i = Math.floor(Math.random() * list.length)
  if (list.length > 1 && i === lastIndex.get(key)) i = (i + 1) % list.length
  lastIndex.set(key, i)
  return list[i]
}

type Pool = Record<Lang, string[]>

/** Francês escrito com espaço normal antes de ! e ?; aqui vira espaço inseparável. */
const pool = (p: Pool): Pool => ({ ...p, fr: p.fr.map(frSpacing) })

export const PRAISE = pool({
  pt: ['Isso!', 'Muito bem!', 'Isso mesmo!', 'Uau, acertou!', 'Que esperto!', 'Arrasou!', 'Você conseguiu!', 'Eba!'],
  en: ['Yes!', 'Well done!', 'That’s right!', 'Wow, you got it!', 'So clever!', 'Awesome!', 'You did it!', 'Yay!'],
  es: ['¡Sí!', '¡Muy bien!', '¡Eso es!', '¡Guau, acertaste!', '¡Qué listo!', '¡Genial!', '¡Lo lograste!', '¡Bien!'],
  fr: ['Oui !', 'Très bien !', 'C’est ça !', 'Waouh, bravo !', 'Trop fort !', 'Super !', 'Tu as réussi !', 'Youpi !'],
})

/** Antes de dizer o que a criança tocou por engano — leve, sem cara de erro. */
export const OOPS = pool({
  pt: ['Olha só,', 'Hum,', 'Ah,', 'Opa,'],
  en: ['Look,', 'Hmm,', 'Oh,', 'Oops,'],
  es: ['Mira,', 'Hmm,', 'Ah,', 'Uy,'],
  fr: ['Regarde,', 'Hmm,', 'Ah,', 'Oups,'],
})

/** Quando a criança fica um tempo sem tocar em nada. */
export const NUDGE = pool({
  pt: ['Vamos lá!', 'Tenta tocar!', 'Você consegue!', 'Vem, vamos tentar!'],
  en: ['Come on!', 'Try tapping!', 'You can do it!', 'Let’s give it a try!'],
  es: ['¡Vamos!', '¡Intenta tocar!', '¡Tú puedes!', '¡Ven, vamos a intentarlo!'],
  fr: ['Allez !', 'Essaie de toucher !', 'Tu peux le faire !', 'Viens, on essaie !'],
})

/** A primeira de cada idioma começa com o "Parabéns!" da tela final (ui.congrats). */
export const QUIZ_DONE = pool({
  pt: ['Parabéns! Você foi muito bem!', 'Uau! Acabou! Que demais!', 'Eba! Você completou tudo!'],
  en: ['Well done! You did great!', 'Wow! All done! Amazing!', 'Yay! You finished everything!'],
  es: ['¡Muy bien! ¡Lo hiciste genial!', '¡Guau! ¡Terminaste! ¡Qué bien!', '¡Bien! ¡Completaste todo!'],
  fr: ['Bravo ! Tu as très bien joué !', 'Waouh ! C’est fini ! Génial !', 'Youpi ! Tu as tout terminé !'],
})

export const STORY_END = pool({
  pt: ['Fim! Gostou da história?', 'E acabou! Vamos ler de novo?', 'Fim! Que história legal!'],
  en: ['The end! Did you like the story?', 'All done! Shall we read it again?', 'The end! What a fun story!'],
  es: ['¡Fin! ¿Te gustó el cuento?', '¡Y se acabó! ¿Lo leemos otra vez?', '¡Fin! ¡Qué cuento tan bonito!'],
  fr: ['Fin ! Tu as aimé l’histoire ?', 'Et c’est fini ! On la relit ?', 'Fin ! Quelle belle histoire !'],
})

/** Texto visual na pausa para a criança falar. */
export const YOUR_TURN = pool({
  pt: ['👂 Sua vez!', '👂 Fala você!', '👂 E aí?', '👂 Como é?'],
  en: ['👂 Your turn!', '👂 You say it!', '👂 What is it?', '👂 How does it go?'],
  es: ['👂 ¡Tu turno!', '👂 ¡Dilo tú!', '👂 ¿Y bien?', '👂 ¿Cómo es?'],
  fr: ['👂 À toi !', '👂 Dis-le !', '👂 Alors ?', '👂 C’est quoi ?'],
})
