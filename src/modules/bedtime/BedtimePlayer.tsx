import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang, useT } from '../../i18n'
import { bedtimeAnalyticsId, getBedtimeStory, type BedtimeElement } from '../../content/bedtime'
import { say, stopSpeaking, wait } from '../../lib/speech'
import { useSettings } from '../../lib/settings'
import { setStoryPlaying, useSleep } from '../../lib/sleepSounds'
import { track } from '../../lib/analytics'
import { NightSky } from './NightSky'
import { SleepControls } from './SleepControls'
import { BEDTIME_COPY } from './copy'

/** Respiro antes de ler cada página e depois de terminar, antes de virar. */
const BEFORE_MS = 1200
const AFTER_MS = 2600

export default function BedtimePlayer() {
  const { id } = useParams()
  const lang = useLang()
  const story = getBedtimeStory(id, lang)
  if (!story) return <Navigate to="/dormir" replace />
  // key: recomeça do zero ao trocar de história ou de idioma
  return <Player key={`${story.id}-${lang}`} story={story} />
}

function Player({ story }: { story: NonNullable<ReturnType<typeof getBedtimeStory>> }) {
  const lang = useLang()
  const t = BEDTIME_COPY[lang]
  const ui = useT()
  const { sound, voice } = useSettings()
  const narrate = sound && voice
  const { timerFinished } = useSleep()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [activeChar, setActiveChar] = useState(-1)
  const total = story.pages.length
  const finished = index >= total

  // Medição: uma abertura por história (o ref evita contar duas vezes quando o React repete o efeito).
  const tracked = useRef(false)
  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    track('story_open', { story: bedtimeAnalyticsId(story.id) })
  }, [story.id])

  // O timer acabou: para a leitura.
  useEffect(() => {
    if (timerFinished) setPlaying(false)
  }, [timerFinished])

  // Mantém a tela acesa enquanto lê sozinho (com a tela apagada o iPhone para a voz).
  useEffect(() => {
    setStoryPlaying(playing && !finished)
    return () => setStoryPlaying(false)
  }, [playing, finished])

  // Leitura automática: lê a página com voz calma, espera e vira sozinha.
  useEffect(() => {
    if (!playing || finished) return
    let cancelled = false
    void (async () => {
      await wait(BEFORE_MS)
      if (cancelled) return
      const text = story.pages[index].text
      if (narrate) await say({ text, onWord: setActiveChar, calm: true })
      // Sem voz: dá tempo de o adulto ler em voz alta.
      else await wait(Math.max(4000, text.split(/\s+/).length * 650))
      if (cancelled) return
      setActiveChar(-1)
      await wait(AFTER_MS)
      if (!cancelled) setIndex((i) => i + 1)
    })()
    return () => {
      cancelled = true
      setActiveChar(-1)
      stopSpeaking()
    }
  }, [index, playing, finished, narrate])

  // Fim: "boa noite" baixinho.
  useEffect(() => {
    if (!finished) return
    track('story_complete', { story: bedtimeAnalyticsId(story.id) })
    if (narrate && !timerFinished) void wait(800).then(() => say({ text: t.goodNightSpoken, calm: true }))
  }, [finished])

  const go = (delta: number) => setIndex((i) => Math.min(total, Math.max(0, i + delta)))

  return (
    <NightSky title={story.title} back="/dormir" sky={story.sky}>
      <div className="flex flex-1 flex-col gap-4">
        <AnimatePresence mode="wait">
          {finished ? (
            <TheEnd key="end" t={t} onAgain={() => { setIndex(0); setPlaying(true) }} />
          ) : (
            <motion.div
              key={index}
              className="flex flex-1 flex-col gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            >
              <div className="relative min-h-[40dvh] flex-1">
                {story.pages[index].elements.map((e, i) => (
                  <Floating key={i} element={e} index={i} />
                ))}
              </div>
              <p className="mx-auto max-w-2xl text-center text-3xl leading-relaxed font-medium sm:text-4xl">
                <Words text={story.pages[index].text} activeChar={activeChar} />
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {timerFinished && (
          <p className="text-center text-xl text-indigo-200" role="status">
            {t.timerFinished}
          </p>
        )}

        {!finished && (
          <nav className="flex items-center justify-center gap-6">
            <RoundButton label={ui.prevPage} onClick={() => go(-1)} disabled={index === 0}>
              ◀
            </RoundButton>
            <button
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? t.pause : t.play}
              className="flex h-16 min-w-40 items-center justify-center gap-2 rounded-full bg-indigo-100 px-6 text-xl font-semibold text-indigo-950 active:scale-95"
            >
              {playing ? `⏸ ${t.pause}` : `▶ ${t.play}`}
            </button>
            <RoundButton label={ui.nextPage} onClick={() => go(1)}>
              ▶
            </RoundButton>
          </nav>
        )}

        {!finished && (
          <div className="flex justify-center gap-2" aria-label={ui.pageOf(index + 1, total)}>
            {story.pages.map((_, i) => (
              <span key={i} className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-indigo-100' : 'w-2 bg-white/25'}`} />
            ))}
          </div>
        )}

        <SleepControls compact />
      </div>
    </NightSky>
  )
}

function RoundButton({ children, label, onClick, disabled }: { children: string; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-14 items-center justify-center rounded-full bg-white/10 text-2xl active:scale-90 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/** Elemento da cena flutuando devagar; um toque só faz brilhar (sem som, para não agitar). */
function Floating({ element, index }: { element: BedtimeElement; index: number }) {
  const size = element.size ?? 16
  const [glow, setGlow] = useState(0)
  const motionCfg = useMemo(() => ({ duration: 5 + Math.random() * 3, delay: Math.random() * 2 }), [])
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${element.x}%`, top: `${element.y}%` }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.3 + index * 0.25 }}
    >
      <motion.button
        key={glow}
        onClick={() => setGlow((g) => g + 1)}
        aria-hidden
        tabIndex={-1}
        className="block leading-none"
        style={{ fontSize: `min(${size}vmin, ${size * 7}px)`, filter: 'drop-shadow(0 0 18px rgba(199,210,254,0.35))' }}
        animate={glow ? { scale: [1, 1.15, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } : { y: [0, -size * 0.18, 0] }}
        transition={glow ? { duration: 1.4 } : { duration: motionCfg.duration, delay: motionCfg.delay, repeat: Infinity, ease: 'easeInOut' }}
      >
        {element.emoji}
      </motion.button>
    </motion.div>
  )
}

/** Texto com a palavra sendo lida acesa (quando a voz informa). */
function Words({ text, activeChar }: { text: string; activeChar: number }) {
  const parts = [...text.matchAll(/(\S+)(\s*)/g)]
  return (
    <>
      {parts.map((m, i) => (
        <span key={i}>
          <span
            className={`rounded-lg transition-colors duration-300 ${m.index === activeChar ? 'bg-white/20 text-white' : ''}`}
            data-active={m.index === activeChar || undefined}
          >
            {m[1]}
          </span>
          {m[2]}
        </span>
      ))}
    </>
  )
}

function TheEnd({ t, onAgain }: { t: (typeof BEDTIME_COPY)['pt']; onAgain: () => void }) {
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center gap-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      <motion.span
        className="text-9xl"
        animate={{ y: [0, -8, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        🌙
      </motion.span>
      <p className="text-5xl font-semibold">{t.goodNight}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={onAgain} className="min-h-12 rounded-full bg-white/10 px-6 text-lg font-semibold active:scale-95">
          🔁 {t.again}
        </button>
        <Link to="/dormir" className="inline-flex min-h-12 items-center rounded-full bg-indigo-100 px-6 text-lg font-semibold text-indigo-950 active:scale-95">
          📚 {t.otherStories}
        </Link>
      </div>
    </motion.div>
  )
}
