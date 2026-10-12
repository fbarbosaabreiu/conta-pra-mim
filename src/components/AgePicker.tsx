import { useState } from 'react'
import { Link } from 'react-router'
import { useLang } from '../i18n'
import { AGES, type AgeId } from '../lib/age'
import { updateSettings, useSettings } from '../lib/settings'
import { playTap } from '../lib/sfx'
import { AGE_COPY } from '../content/ages'

/** Botões de faixa etária (um grupo de rádio). Escolher salva nas configurações. */
export function AgePicker({ onPick }: { onPick?: (age: AgeId) => void }) {
  const t = AGE_COPY[useLang()]
  const { age } = useSettings()
  return (
    <div role="radiogroup" aria-label={t.question} className="flex flex-wrap justify-center gap-2">
      {AGES.map((a) => (
        <button
          key={a}
          role="radio"
          aria-checked={age === a}
          onClick={() => {
            playTap()
            updateSettings({ age: a })
            onPick?.(a)
          }}
          className={`min-h-12 rounded-full px-5 text-lg font-semibold active:scale-95 ${
            age === a ? 'bg-[var(--color-coral)] text-white' : 'tile-shadow bg-white'
          }`}
        >
          {t.labels[a]}
        </button>
      ))}
    </div>
  )
}

/** Na tela inicial: pergunta a idade (se ainda não escolheu) ou mostra a escolhida + link do guia. */
export function AgeBar() {
  const t = AGE_COPY[useLang()]
  const { age } = useSettings()
  const [editing, setEditing] = useState(false)

  if (!age || editing)
    return (
      <section className="tile-shadow w-full max-w-3xl rounded-[2rem] bg-white px-5 py-5 text-center">
        <h2 className="text-2xl font-semibold">👶 {t.question}</h2>
        <p className="mt-1 mb-4 text-base opacity-70">{t.questionHint}</p>
        <AgePicker onPick={() => setEditing(false)} />
      </section>
    )

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-lg">
      <span>
        👶 <strong>{t.labels[age]}</strong>
      </span>
      <button onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center px-1 underline opacity-70">
        {t.change}
      </button>
      <Link
        to="/guia"
        onClick={playTap}
        className="tile-shadow inline-flex min-h-11 items-center rounded-full bg-white px-4 font-semibold"
      >
        📘 {t.guideLink}
      </Link>
    </div>
  )
}
