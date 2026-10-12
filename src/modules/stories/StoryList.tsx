import { Screen } from '../../components/Screen'
import { Tile } from '../../components/Tile'
import { AgeGroups } from '../../components/AgeGroups'
import { stories } from '../../content/stories'
import { STORIES_BY_AGE } from '../../content/ages'
import { useProgress } from '../../lib/progress'
import { useSettings } from '../../lib/settings'
import { tr, useLang, useT } from '../../i18n'

export default function StoryList() {
  const progress = useProgress()
  const lang = useLang()
  const t = useT()
  const { age } = useSettings()

  return (
    <Screen title={t.stories} back="/">
      <AgeGroups
        items={stories}
        recommended={age ? (s) => STORIES_BY_AGE[age].includes(s.id) : undefined}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        render={(s) => {
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
        }}
      />
    </Screen>
  )
}
