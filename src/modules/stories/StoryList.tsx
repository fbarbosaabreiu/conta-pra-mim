import { Screen } from '../../components/Screen'
import { Tile } from '../../components/Tile'
import { stories } from '../../content/stories'
import { useProgress } from '../../lib/progress'
import { tr, useLang, useT } from '../../i18n'

export default function StoryList() {
  const progress = useProgress()
  const lang = useLang()
  const t = useT()

  return (
    <Screen title={t.stories} back="/">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((s) => {
          const reads = progress.storiesRead[s.id]
          return (
            <Tile
              key={s.id}
              to={`/historias/${s.id}`}
              emoji={s.cover}
              label={tr(s.title, lang)}
              color={s.color}
              badge={reads ? `📖 ${reads}` : undefined}
            />
          )
        })}
      </div>
    </Screen>
  )
}
