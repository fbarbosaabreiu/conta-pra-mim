import { useEffect, useRef, useState } from 'react'
import { track } from '../../lib/analytics'
import { Link, Navigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Screen } from '../../components/Screen'
import { getStory } from '../../content/stories'
import { markStoryRead } from '../../lib/progress'
import { playSuccess, playTap } from '../../lib/sfx'
import { speak, wait } from '../../lib/speech'
import { STORY_END, vary } from '../../lib/phrases'
import { Narrator } from '../../components/Narrator'
import { FallingStars } from '../../components/FallingStars'
import { VoiceToggle } from '../../components/AudioToggles'
import { StoryPageView } from './StoryPageView'
import { useLang, useT } from '../../i18n'

const slide = {
  enter: (dir: number) => ({ x: dir * 300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -300, opacity: 0 }),
}

export default function StoryReader() {
  const { id } = useParams()
  const lang = useLang()
  const t = useT()
  const story = getStory(id, lang)
  const [[index, dir], setPage] = useState<[number, number]>([0, 1])

  // Uma vez por história aberta (o ref evita contar duas vezes quando o React repete o efeito).
  const tracked = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!story || tracked.current === id) return
    tracked.current = id
    track('story_open', { story: story.id })
  }, [id])

  if (!story) return <Navigate to="/historias" replace />

  const total = story.pages.length
  const finished = index >= total

  function go(delta: number) {
    const next = index + delta
    if (next < 0 || next > total) return
    if (next === total) {
      markStoryRead(story!.id)
      track('story_complete', { story: story!.id })
      playSuccess()
      void wait(700).then(() => speak(vary(STORY_END[lang])))
    } else {
      playTap()
    }
    setPage([next, delta])
  }

  function restart() {
    playTap()
    track('story_open', { story: story!.id }) // "De novo!" conta como nova leitura
    setPage([0, 1])
  }

  return (
    <Screen title={story.title} back="/historias" right={<VoiceToggle />}>
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.div
            key={index}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="flex flex-1 flex-col"
            drag={finished ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) go(1)
              else if (info.offset.x > 80) go(-1)
            }}
          >
            {finished ? (
              <TheEnd onRestart={restart} />
            ) : (
              <StoryPageView page={story.pages[index]} background={story.background} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {!finished && (
        <nav className="mt-4 flex items-center justify-between gap-4">
          <NavButton label={t.prevPage} onClick={() => go(-1)} disabled={index === 0}>
            ◀
          </NavButton>
          <div className="flex flex-wrap justify-center gap-2" aria-label={t.pageOf(index + 1, total)}>
            {story.pages.map((_, i) => (
              <span
                key={i}
                className={`size-3 rounded-full transition-all ${i === index ? 'w-8 bg-coral' : 'bg-ink/20'}`}
              />
            ))}
          </div>
          <NavButton label={t.nextPage} onClick={() => go(1)}>
            ▶
          </NavButton>
        </nav>
      )}
    </Screen>
  )
}

function NavButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: string
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="tile-shadow flex size-20 items-center justify-center rounded-full bg-sun text-4xl text-white disabled:opacity-30"
    >
      {children}
    </motion.button>
  )
}

function TheEnd({ onRestart }: { onRestart: () => void }) {
  const t = useT()
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden text-center">
      <FallingStars />
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <Narrator size="text-9xl" />
      </motion.div>
      <motion.p
        className="text-6xl font-bold"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {t.theEnd}
      </motion.p>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onRestart}
          className="tile-shadow rounded-full bg-coral px-8 py-4 text-2xl font-semibold text-white active:scale-95"
        >
          🔁 {t.again}
        </button>
        <Link
          to="/historias"
          onClick={playTap}
          className="tile-shadow rounded-full bg-sky px-8 py-4 text-2xl font-semibold text-white active:scale-95"
        >
          📚 {t.otherStories}
        </Link>
      </div>
    </div>
  )
}
