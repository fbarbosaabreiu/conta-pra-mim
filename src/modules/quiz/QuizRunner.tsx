import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Screen } from '../../components/Screen'
import { Celebration } from '../../components/Celebration'
import { markQuizDone } from '../../lib/progress'
import { playSuccess, playTap, playTryAgain } from '../../lib/sfx'
import { makeQuestion, themes, type QuizOption, type ThemeId } from './questions'
import { OptionButton, OptionVisual } from './OptionButton'
import { CountScene } from './CountScene'
import { VoiceToggle } from '../../components/AudioToggles'
import { speak, stopSpeaking } from '../../lib/speech'

const TOTAL = 5
/** Acertos de primeira necessários para passar de 2 para 3 opções. */
const LEVEL_UP_AFTER = 2

export default function QuizRunner() {
  const { theme: themeId } = useParams()
  const theme = themes.find((t) => t.id === themeId)
  if (!theme) return <Navigate to="/quiz" replace />
  // key: reinicia todo o estado ao trocar de tema
  return <QuizSession key={theme.id} themeId={theme.id} title={theme.title} />
}

function QuizSession({ themeId, title }: { themeId: ThemeId; title: string }) {
  const [step, setStep] = useState(0)
  const [firstTryHits, setFirstTryHits] = useState(0)
  const [question, setQuestion] = useState(() => makeQuestion(themeId, 2))
  const [missed, setMissed] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [finished, setFinished] = useState(false)

  const answer = question.options.find((o) => o.id === question.answerId)!

  // Lê cada pergunta nova em voz alta.
  useEffect(() => {
    const t = setTimeout(() => void speak(question.prompt), 400)
    return () => clearTimeout(t)
  }, [question])

  useEffect(() => stopSpeaking, [])

  function pickOption(option: QuizOption): boolean {
    if (celebrating) return true
    if (option.id === question.answerId) {
      playSuccess()
      void speak(`Isso! ${question.success}`)
      if (!missed) setFirstTryHits((n) => n + 1)
      setCelebrating(true)
      return true
    }
    playTryAgain()
    // Nomeia o que a criança tocou e repete a pergunta: o erro também ensina.
    void speak(`${option.thisIs} ${question.prompt}`)
    setMissed(true)
    return false
  }

  function nextQuestion() {
    setCelebrating(false)
    if (step + 1 >= TOTAL) {
      markQuizDone(themeId)
      setFinished(true)
      void speak('Parabéns!')
      return
    }
    const numOptions = firstTryHits >= LEVEL_UP_AFTER ? 3 : 2
    setStep(step + 1)
    setQuestion(makeQuestion(themeId, numOptions, question.answerId))
    setMissed(false)
  }

  function restart() {
    playTap()
    setStep(0)
    setFirstTryHits(0)
    setQuestion(makeQuestion(themeId, 2))
    setMissed(false)
    setFinished(false)
  }

  if (finished) {
    return (
      <Screen title={title} back="/quiz">
        <Finished onRestart={restart} />
      </Screen>
    )
  }

  return (
    <Screen
      title={title}
      back="/quiz"
      right={<VoiceToggle />}
    >
      <div className="flex justify-center gap-1 text-2xl" aria-label={`Pergunta ${step + 1} de ${TOTAL}`}>
        {Array.from({ length: TOTAL }, (_, i) => (
          <span key={i} className={i < step ? '' : 'opacity-25 grayscale'}>
            ⭐
          </span>
        ))}
      </div>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col items-center justify-center gap-6"
      >
        <h2 className="text-center text-4xl font-bold sm:text-5xl">
          <button onClick={() => void speak(question.prompt)} aria-label={`Ouvir: ${question.prompt}`}>
            {question.prompt}
          </button>
        </h2>

        {question.count && (
          <CountScene emoji={question.count.emoji} n={question.count.n} words={question.count.words} />
        )}

        <div
          className="grid w-full max-w-3xl gap-4"
          style={{ gridTemplateColumns: `repeat(${question.options.length}, minmax(0, 1fr))` }}
        >
          {question.options.map((o) => (
            <OptionButton
              key={o.id}
              option={o}
              onPick={pickOption}
              hint={missed && o.id === question.answerId}
            />
          ))}
        </div>

        {missed && <p className="text-xl opacity-70">Quase! Vamos tentar de novo? 💛</p>}
      </motion.div>

      <AnimatePresence>
        {celebrating && (
          <Celebration
            visual={<OptionVisual option={answer} />}
            title="Isso!"
            subtitle={question.success}
            onDone={nextQuestion}
            durationMs={2800}
          />
        )}
      </AnimatePresence>
    </Screen>
  )
}

function Finished({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <motion.div
        className="text-9xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        🏆
      </motion.div>
      <p className="text-6xl font-bold">Parabéns!</p>
      <div className="flex gap-2 text-5xl">
        {Array.from({ length: TOTAL }, (_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
          >
            ⭐
          </motion.span>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onRestart}
          className="tile-shadow rounded-full bg-coral px-8 py-4 text-2xl font-semibold text-white active:scale-95"
        >
          🔁 De novo!
        </button>
        <Link
          to="/quiz"
          onClick={playTap}
          className="tile-shadow rounded-full bg-sky px-8 py-4 text-2xl font-semibold text-white active:scale-95"
        >
          🎯 Outros jogos
        </Link>
      </div>
    </div>
  )
}
