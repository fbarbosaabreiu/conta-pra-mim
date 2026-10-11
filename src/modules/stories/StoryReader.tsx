import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Screen } from '../../components/Screen'
import { getStory } from '../../content/stories'
import { markStoryRead } from '../../lib/progress'
import { playSuccess, playTap } from '../../lib/sfx'
import { speak, wait } from '../../lib/speech'
import { VoiceToggle } from '../../components/AudioToggles'
import { StoryPageView } from './StoryPageView'

const slide = {
  enter: (dir: number) => ({ x: dir * 300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -300, opacity: 0 }),
}

export default function StoryReader() {
  const { id } = useParams()
  const story = getStory(id)
  const [[index, dir], setPage] = useState<[number, number]>([0, 1])

  if (!story) return <Navigate to="/historias" replace />

  const total = story.pages.length
  const finished = index >= total

  function go(delta: number) {
    const next = index + delta
    if (next < 0 || next > total) return
    if (next === total) {
      markStoryRead(story!.id)
      playSuccess()
      void wait(600).then(() => speak('Fim!'))
    } else {
      playTap()
    }
    setPage([next, delta])
  }

  function restart() {
    playTap()
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
          <NavButton label="Página anterior" onClick={() => go(-1)} disabled={index === 0}>
            ◀
          </NavButton>
          <div className="flex flex-wrap justify-center gap-2" aria-label={`Página ${index + 1} de ${total}`}>
            {story.pages.map((_, i) => (
              <span
                key={i}
                className={`size-3 rounded-full transition-all ${i === index ? 'w-8 bg-coral' : 'bg-ink/20'}`}
              />
            ))}
          </div>
          <NavButton label="Próxima página" onClick={() => go(1)}>
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
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <motion.div
        className="text-9xl"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        🎉
      </motion.div>
      <p className="text-6xl font-bold">Fim!</p>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onRestart}
          className="tile-shadow rounded-full bg-coral px-8 py-4 text-2xl font-semibold text-white active:scale-95"
        >
          🔁 De novo!
        </button>
        <Link
          to="/historias"
          onClick={playTap}
          className="tile-shadow rounded-full bg-sky px-8 py-4 text-2xl font-semibold text-white active:scale-95"
        >
          📚 Outras histórias
        </Link>
      </div>
    </div>
  )
}
