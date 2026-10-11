import { Screen } from '../../components/Screen'
import { Tile } from '../../components/Tile'
import { useProgress } from '../../lib/progress'
import { themes } from './questions'
import { useT } from '../../i18n'

export default function QuizHome() {
  const progress = useProgress()
  const t = useT()

  return (
    <Screen title={t.letsPlay} back="/">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {themes.map((theme) => {
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
        })}
      </div>
    </Screen>
  )
}
