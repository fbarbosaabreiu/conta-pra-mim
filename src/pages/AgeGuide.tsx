import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Screen } from '../components/Screen'
import { AgePicker } from '../components/AgePicker'
import { tr, useLang, useT } from '../i18n'
import { useSettings } from '../lib/settings'
import { playTap } from '../lib/sfx'
import { stories } from '../content/stories'
import { themes } from '../modules/quiz/questions'
import { AGE_COPY, QUIZ_BY_AGE, STORIES_BY_AGE } from '../content/ages'

// Guia para os pais por faixa etária: marcos da fala, tempo de tela, como usar juntos e ideias fora da tela.
export default function AgeGuide() {
  const lang = useLang()
  const t = AGE_COPY[lang]
  const ui = useT()
  const { age } = useSettings()
  const g = age ? t.guides[age] : null

  return (
    <Screen title={t.guideTitle} back="/">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 text-lg leading-relaxed">
        <AgePicker />
        {!g || !age ? (
          <p className="text-center opacity-70">{t.questionHint}</p>
        ) : (
          <>
            <Section title={t.sections.speech}>
              <List items={g.speech} />
            </Section>
            <Section title={t.sections.screen}>
              <p>{g.screen}</p>
            </Section>
            <Section title={t.sections.together}>
              <List items={g.together} />
            </Section>
            <Section title={t.sections.offline}>
              <List items={g.offline} />
            </Section>
            <Section title={t.sections.recommended}>
              <div className="flex flex-wrap gap-2">
                {STORIES_BY_AGE[age].map((id) => {
                  const s = stories.find((s) => s.id === id)
                  return (
                    s && (
                      <Chip key={id} to={`/historias/${id}`}>
                        {s.cover} {tr(s.title, lang)}
                      </Chip>
                    )
                  )
                })}
                {QUIZ_BY_AGE[age].map((id) => (
                  <Chip key={id} to={`/quiz/${id}`}>
                    {themes.find((th) => th.id === id)?.emoji} {ui.play}: {ui.themes[id]}
                  </Chip>
                ))}
              </div>
              {QUIZ_BY_AGE[age].length === 0 && <p className="mt-3 opacity-80">{t.noQuiz}</p>}
            </Section>
            <p className="rounded-2xl bg-white/60 p-4 text-base">{t.disclaimer}</p>
            <p className="text-sm opacity-60">{t.sources}</p>
          </>
        )}
      </div>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="tile-shadow rounded-[1.5rem] bg-white p-5">
      <h2 className="mb-2 text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-6">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  )
}

function Chip({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} onClick={playTap} className="inline-flex min-h-11 items-center rounded-full bg-amber-100 px-4 font-medium">
      {children}
    </Link>
  )
}
