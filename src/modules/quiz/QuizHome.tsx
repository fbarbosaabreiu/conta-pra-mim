import { Screen } from '../../components/Screen'
import { Tile } from '../../components/Tile'
import { AgeGroups } from '../../components/AgeGroups'
import { QUIZ_BY_AGE, AGE_COPY } from '../../content/ages'
import { useProgress } from '../../lib/progress'
import { useSettings } from '../../lib/settings'
import { themes } from './questions'
import { useLang, useT } from '../../i18n'

export default function QuizHome() {
  const progress = useProgress()
  const t = useT()
  const ages = AGE_COPY[useLang()]
  const { age } = useSettings()

  return (
    <Screen title={t.letsPlay} back="/">
      <AgeGroups
        items={themes}
        recommended={age ? (theme) => QUIZ_BY_AGE[age].includes(theme.id) : undefined}
        className="grid grid-cols-1 gap-6 sm:grid-cols-3"
        emptyNote={ages.noQuiz}
        restTitle="later"
        render={(theme) => {
          const done = progress.quizzesDone[theme.id]
          return (
            <Tile
              key={theme.id}
              to={`/quiz/${theme.id}`}
              emoji={theme.emoji}
              label={t.themes[theme.id]}
              color={theme.color}
              badge={done ? `⭐ ${done}` : undefined}
            />
          )
        }}
      />
    </Screen>
  )
}
