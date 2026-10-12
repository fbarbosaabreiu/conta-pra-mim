import type { ReactNode } from 'react'
import { useLang } from '../i18n'
import { useSettings } from '../lib/settings'
import { AGE_COPY } from '../content/ages'

interface AgeGroupsProps<T> {
  items: T[]
  /** Sem faixa escolhida: undefined, e a lista aparece inteira, sem títulos. */
  recommended?: (item: T) => boolean
  render: (item: T) => ReactNode
  className: string
  /** Texto quando nada é recomendado para a idade (ex.: jogos antes de 1 ano). */
  emptyNote?: string
  /** Título do segundo grupo: "Outras" (padrão) ou "Para mais tarde". */
  restTitle?: 'others' | 'later'
}

/** Divide uma lista em "Para 1–2 anos" (primeiro) e o resto. */
export function AgeGroups<T>({ items, recommended, render, className, emptyNote, restTitle = 'others' }: AgeGroupsProps<T>) {
  const t = AGE_COPY[useLang()]
  const { age } = useSettings()
  if (!age || !recommended) return <div className={className}>{items.map(render)}</div>

  const top = items.filter(recommended)
  const rest = items.filter((i) => !recommended(i))
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">👶 {t.forAge(t.labels[age])}</h2>
      {top.length ? <div className={className}>{top.map(render)}</div> : emptyNote && <p className="text-lg opacity-80">{emptyNote}</p>}
      {rest.length > 0 && (
        <>
          <h2 className="mt-6 text-2xl font-semibold opacity-70">{t[restTitle]}</h2>
          <div className={className}>{rest.map(render)}</div>
        </>
      )}
    </div>
  )
}
