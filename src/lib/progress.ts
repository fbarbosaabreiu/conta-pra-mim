import { useState } from 'react'

const KEY = 'conta-pra-mim:progress'

export interface Progress {
  storiesRead: Record<string, number>
  quizzesDone: Record<string, number>
}

const empty = (): Progress => ({ storiesRead: {}, quizzesDone: {} })

export function getProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...empty(), ...JSON.parse(raw) }
  } catch {
    // armazenamento indisponível ou corrompido: começa do zero
  }
  return empty()
}

const listeners = new Set<(p: Progress) => void>()

/** Avisa quando o progresso muda (a conta opcional usa para guardar uma cópia na nuvem). */
export function onProgressChange(fn: (p: Progress) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Grava o progresso inteiro (usado ao juntar com a cópia da conta). */
export function setProgress(p: Progress, notify = true) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // sem armazenamento: progresso não é salvo
  }
  if (notify) listeners.forEach((l) => l(p))
}

function bump(field: keyof Progress, id: string) {
  const p = getProgress()
  p[field][id] = (p[field][id] ?? 0) + 1
  setProgress(p)
}

export const markStoryRead = (id: string) => bump('storiesRead', id)
export const markQuizDone = (id: string) => bump('quizzesDone', id)

/** Junta dois progressos (o deste aparelho e o da conta), ficando com o maior número de cada item. */
export function mergeProgress(a: Progress, b: Partial<Progress> | null | undefined): Progress {
  const out = empty()
  for (const field of ['storiesRead', 'quizzesDone'] as const) {
    for (const src of [a[field], b?.[field] ?? {}])
      for (const [id, n] of Object.entries(src))
        if (typeof n === 'number' && n > (out[field][id] ?? 0)) out[field][id] = n
  }
  return out
}

/** Lê o progresso ao montar a tela (as listas remontam a cada navegação). */
export function useProgress(): Progress {
  const [progress] = useState(getProgress)
  return progress
}
