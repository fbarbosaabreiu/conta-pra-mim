import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Screen } from '../../components/Screen'
import { Celebration } from '../../components/Celebration'
import { Narrator } from '../../components/Narrator'
import { FallingStars } from '../../components/FallingStars'
import { markQuizDone } from '../../lib/progress'
import { playSuccess, playTap, playTryAgain } from '../../lib/sfx'
import { say, speak, stopSpeaking, wait, type Part } from '../../lib/speech'
import { NUDGE, OOPS, PRAISE, QUIZ_DONE, vary } from '../../lib/phrases'
import { makeQuestion, themes, type QuizOption, type ThemeId } from './questions'
import { OptionButton, OptionVisual } from './OptionButton'
import { CountScene } from './CountScene'
import { VoiceToggle } from '../../components/AudioToggles'
import { useLang, useT, type Lang } from '../../i18n'

const TOTAL = 5
/** Acertos de primeira necessários para passar de 2 para 3 opções. */
const LEVEL_UP_AFTER = 2
/** Sem nenhum toque por este tempo, o app encoraja e repete a pergunta (no máximo 2x). */
const NUDGE_AFTER_MS = 9000
const MAX_NUDGES = 2

export default function QuizRunner() {
  const { theme: themeId } = useParams()
  const lang = useLang()
  const t = useT()
  const theme = themes.find((t) => t.id === themeId)
  if (!theme) return <Navigate to="/quiz" replace />
  // key: reinicia todo o estado ao trocar de tema ou de idioma
  return <QuizSession key={`${theme.id}-${lang}`} themeId={theme.id} lang={lang} title={t.themes[theme.id]} />
}

function QuizSession({ themeId, lang, title }: { themeId: ThemeId; lang: Lang; title: string }) {
  const t = useT()
  const [step, setStep] = useState(0)
  // Ref (e não state): é lido no fim assíncrono da comemoração.
  const firstTryHits = useRef(0)
  const [question, setQuestion] = useState(() => makeQuestion(themeId, lang, 2))
  const [missed, setMissed] = useState(false)
  const [praise, setPraise] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [doneText, setDoneText] = useState('')
  const [pokes, setPokes] = useState(0)
  /** Id da comemoração em andamento (0 = nenhuma); evita avançar duas vezes. */
  const celebration = useRef(0)
  const nudges = useRef(0)

  const celebrating = praise !== null
  const answer = question.options.find((o) => o.id === question.answerId)!

  // A pergunta falada, seguida do som de verdade quando é "Quem faz…?".
  const promptParts: Part[] = [question.spoken, ...(question.promptAudio ? [{ clip: question.promptAudio }] : [])]
  const askAgain = () => void say(...promptParts)

  // Lê cada pergunta nova, depois de um respiro.
  useEffect(() => {
    nudges.current = 0
    const t = setTimeout(askAgain, 700)
    return () => clearTimeout(t)
    // Uma vez por pergunta.
  }, [question])

  // Se a criança ficar parada, encoraja e repete — em vez de repetir a cada erro.
  useEffect(() => {
    if (celebrating || finished || nudges.current >= MAX_NUDGES) return
    const t = setTimeout(() => {
      nudges.current++
      void say(vary(NUDGE[lang]), ...promptParts)
    }, NUDGE_AFTER_MS)
    return () => clearTimeout(t)
    // Reinicia a contagem a cada interação.
  }, [question, pokes, celebrating, finished])

  useEffect(() => stopSpeaking, [])

  const clipOf = (o: QuizOption): Part[] => (o.audio ? [{ clip: o.audio, fallback: o.soundText }] : [])
  const poke = () => setPokes((n) => n + 1)

  function pickOption(option: QuizOption): boolean {
    if (celebrating) return true
    poke()
    if (option.id === question.answerId) {
      const p = vary(PRAISE[lang])
      playSuccess()
      if (!missed) firstTryHits.current++
      const id = Date.now()
      celebration.current = id
      setPraise(p)
      // A festa dura o tempo da fala + som, não um tempo fixo.
      void say({ pause: 250 }, `${p} ${question.successSpoken}`, ...clipOf(option))
        .then(() => wait(700))
        .then(() => nextQuestion(id))
      return true
    }
    playTryAgain()
    // Nomeia (e toca o som de) o que a criança tocou — o erro também ensina, sem sermão.
    void say(`${vary(OOPS[lang])} ${option.thisIs}`, ...clipOf(option))
    setMissed(true)
    return false
  }

  function nextQuestion(id = celebration.current) {
    if (!id || id !== celebration.current) return
    celebration.current = 0
    stopSpeaking()
    setPraise(null)
    if (step + 1 >= TOTAL) {
      const text = vary(QUIZ_DONE[lang])
      markQuizDone(themeId)
      setDoneText(text)
      setFinished(true)
      void wait(500).then(() => speak(text))
      return
    }
    const numOptions = firstTryHits.current >= LEVEL_UP_AFTER ? 3 : 2
    setStep(step + 1)
    setQuestion(makeQuestion(themeId, lang, numOptions, question.answerId))
    setMissed(false)
  }

  function restart() {
    playTap()
    setStep(0)
    firstTryHits.current = 0
    setQuestion(makeQuestion(themeId, lang, 2))
    setMissed(false)
    setFinished(false)
  }

  if (finished) {
    return (
      <Screen title={title} back="/quiz">
        <Finished text={doneText} onRestart={restart} />
      </Screen>
    )
  }

  return (
    <Screen title={title} back="/quiz" right={<VoiceToggle />}>
      <div className="flex justify-center gap-1 text-2xl" aria-label={t.questionOf(step + 1, TOTAL)}>
        {Array.from({ length: TOTAL }, (_, i) => (
          <motion.span
            key={i}
            className={i < step ? '' : 'opacity-25 grayscale'}
            animate={i === step - 1 ? { scale: [1, 1.6, 1], rotate: [0, 20, 0] } : {}}
            transition={{ duration: 0.6 }}
          >
            ⭐
          </motion.span>
        ))}
      </div>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col items-center justify-center gap-6"
      >
        <div className="flex items-center gap-3">
          <Narrator />
          <h2 className="text-center text-4xl font-bold sm:text-5xl">
            <button onClick={askAgain} aria-label={t.listen(question.prompt)}>
              {question.prompt}
            </button>
          </h2>
        </div>

        {question.count && (
          <CountScene
            emoji={question.count.emoji}
            n={question.count.n}
            words={question.count.words}
            onTap={poke}
          />
        )}

        <div
          className="grid w-full max-w-3xl gap-4"
          style={{ gridTemplateColumns: `repeat(${question.options.length}, minmax(0, 1fr))` }}
        >
          {question.options.map((o, i) => (
            <OptionButton
              key={o.id}
              index={i}
              option={o}
              onPick={pickOption}
              hint={missed && o.id === question.answerId}
            />
          ))}
        </div>

        <div className="h-8">
          <AnimatePresence>
            {missed && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} className="text-xl">
                {t.tryAnother} 💛
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {praise !== null && (
          <Celebration
            visual={<OptionVisual option={answer} />}
            title={praise}
            subtitle={question.success}
            onDone={() => nextQuestion()}
            durationMs={9000}
          />
        )}
      </AnimatePresence>
    </Screen>
  )
}

function Finished({ text, onRestart }: { text: string; onRestart: () => void }) {
  const t = useT()
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden text-center">
      <FallingStars />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        className="flex items-end gap-2"
      >
        <Narrator size="text-8xl" />
        <motion.span
          className="text-8xl"
          animate={{ rotate: [0, -10, 10, 0], y: [0, -10, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          🏆
        </motion.span>
      </motion.div>
      <p className="text-6xl font-bold">{t.congrats}</p>
      <p className="text-2xl opacity-80">{text.startsWith(`${t.congrats} `) ? text.slice(t.congrats.length + 1) : text}</p>
      <div className="flex gap-2 text-5xl">
        {Array.from({ length: TOTAL }, (_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
          >
            ⭐
          </motion.span>
        ))}
      </div>
      <div className="relative flex flex-wrap justify-center gap-4">
        <button
          onClick={onRestart}
          className="tile-shadow rounded-full bg-coral px-8 py-4 text-2xl font-semibold text-white active:scale-95"
        >
          🔁 {t.again}
        </button>
        <Link
          to="/quiz"
          onClick={playTap}
          className="tile-shadow rounded-full bg-sky px-8 py-4 text-2xl font-semibold text-white active:scale-95"
        >
          🎯 {t.otherGames}
        </Link>
      </div>
    </div>
  )
}
