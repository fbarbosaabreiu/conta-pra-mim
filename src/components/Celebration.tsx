import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'

const CONFETTI = ['⭐', '🎉', '✨', '💛', '🌟', '🎈']

interface CelebrationProps {
  visual?: ReactNode
  title: string
  subtitle?: string
  onDone: () => void
  durationMs?: number
}

/** Festa em tela cheia; some sozinha ou com um toque. */
export function Celebration({ visual, title, subtitle, onDone, durationMs = 2200 }: CelebrationProps) {
  // Garante que onDone rode uma vez só (timer e toque podem disparar juntos).
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const finished = useRef(false)
  const finish = () => {
    if (finished.current) return
    finished.current = true
    onDoneRef.current()
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (finished.current) return
      finished.current = true
      onDoneRef.current()
    }, durationMs)
    return () => clearTimeout(t)
  }, [durationMs])

  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        emoji: CONFETTI[i % CONFETTI.length],
        angle: (i / 16) * Math.PI * 2 + Math.random() * 0.4,
        dist: 140 + Math.random() * 160,
      })),
    [],
  )

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={finish}
      data-testid="celebration"
    >
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute text-4xl"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist,
            scale: 1.2,
            opacity: 0,
            rotate: 180,
          }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        >
          {p.emoji}
        </motion.span>
      ))}
      <motion.div
        className="flex flex-col items-center gap-3 rounded-[2.5rem] bg-white px-10 py-8 text-center shadow-2xl"
        initial={{ scale: 0.4, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      >
        {visual && (
          <motion.div
            animate={{ rotate: [0, -8, 8, -8, 0], y: [0, -10, 0, -6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.2 }}
          >
            {visual}
          </motion.div>
        )}
        <p className="text-5xl font-bold text-coral">{title}</p>
        {subtitle && <p className="text-3xl font-semibold">{subtitle}</p>}
      </motion.div>
    </motion.div>
  )
}
