import { useMemo } from 'react'
import { motion } from 'framer-motion'

const PIECES = ['⭐', '🌟', '✨', '🎈', '💛', '🎉']

/** Estrelas e balões caindo devagar ao fundo (tela de fim / parabéns). */
export function FallingStars({ count = 14 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        emoji: PIECES[i % PIECES.length],
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 4 + Math.random() * 3,
        size: 1.5 + Math.random() * 1.5,
      })),
    [count],
  )
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {items.map((p, i) => (
        <motion.span
          key={i}
          className="absolute -top-12"
          style={{ left: `${p.left}%`, fontSize: `${p.size}rem` }}
          animate={{ y: ['0vh', '110vh'], rotate: [0, 360], x: [0, 20, -20, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  )
}
