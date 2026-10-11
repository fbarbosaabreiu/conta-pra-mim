import { useState } from 'react'

const KEY = 'conta-pra-mim:progress'

export interface Progress {
  storiesRead: Record<string, number>
  quizzesDone: Record<string, number>
}

function load(): Progress {
  const empty: Progress = { storiesRead: {}, quizzesDone: {} }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...empty, ...JSON.parse(raw) }
  } catch {
    // armazenamento indisponível ou corrompido: começa do zero
  }
  return empty
}

function bump(field: keyof Progress, id: string) {
  const p = load()
  p[field][id] = (p[field][id] ?? 0) + 1
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // sem armazenamento: progresso não é salvo
  }
}

export const markStoryRead = (id: string) => bump('storiesRead', id)
export const markQuizDone = (id: string) => bump('quizzesDone', id)

/** Lê o progresso ao montar a tela (as listas remontam a cada navegação). */
export function useProgress(): Progress {
  const [progress] = useState(load)
  return progress
}
