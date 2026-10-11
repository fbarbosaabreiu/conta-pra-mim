import { Screen } from '../../components/Screen'
import { Tile } from '../../components/Tile'
import { useProgress } from '../../lib/progress'
import { themes } from './questions'

export default function QuizHome() {
  const progress = useProgress()

  return (
    <Screen title="Vamos brincar?" back="/">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {themes.map((t) => {
          const done = progress.quizzesDone[t.id]
          return (
            <Tile
              key={t.id}
              to={`/quiz/${t.id}`}
              emoji={t.emoji}
              label={t.title}
              color={t.color}
              badge={done ? `⭐ ${done}` : undefined}
            />
          )
        })}
      </div>
    </Screen>
  )
}
