import { motion, useAnimationControls } from 'framer-motion'
import type { QuizOption } from './questions'

interface Props {
  option: QuizOption
  /** Retorna se acertou; no erro, o botão balança. */
  onPick: (option: QuizOption) => boolean
  /** Pulsa a resposta certa depois de um erro, como dica. */
  hint: boolean
  /** Posição, para as opções entrarem uma depois da outra. */
  index: number
}

export function OptionButton({ option, onPick, hint, index }: Props) {
  const react = useAnimationControls()

  function onClick() {
    if (!onPick(option)) {
      // Um "balançar" brincalhão (o bicho mostrando quem é), não um "não" seco.
      void react.start({
        rotate: [0, -10, 10, -6, 6, 0],
        y: [0, -12, 0, -6, 0],
        transition: { duration: 0.7 },
      })
    }
  }

  return (
    <motion.div
      initial={{ scale: 0, y: 40 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.25 + index * 0.15 }}
    >
    <motion.div
      animate={hint ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={hint ? { duration: 0.9, repeat: Infinity } : undefined}
    >
      <motion.button
        animate={react}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        aria-label={option.label}
        className={`tile-shadow flex aspect-square w-full items-center justify-center rounded-[2rem] bg-white p-3 ${
          hint ? 'ring-8 ring-sun' : ''
        }`}
      >
        <OptionVisual option={option} />
      </motion.button>
    </motion.div>
    </motion.div>
  )
}

export function OptionVisual({ option }: { option: QuizOption }) {
  if (option.color) {
    return (
      <span
        className="relative block aspect-square w-[min(26vmin,10rem)] rounded-full shadow-inner"
        style={{ background: option.color }}
      >
        <span className="absolute top-[18%] left-[22%] size-[22%] rounded-full bg-white/50" />
      </span>
    )
  }

  if (option.number !== undefined) {
    return (
      <span className="flex flex-col items-center gap-2">
        <span className="text-[min(22vmin,8rem)] leading-none font-bold text-ink">{option.number}</span>
        <span className="flex gap-1.5">
          {Array.from({ length: option.number }, (_, i) => (
            <span key={i} className="size-3 rounded-full bg-coral sm:size-4" />
          ))}
        </span>
      </span>
    )
  }

  return <span className="text-[min(24vmin,9rem)] leading-none">{option.emoji}</span>
}
