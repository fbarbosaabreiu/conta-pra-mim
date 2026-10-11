import { useState } from 'react'
import { motion } from 'framer-motion'
import { playPop } from '../../lib/sfx'
import { speak } from '../../lib/speech'

/** Itens para contar: cada toque marca o item com o próximo número e o fala. */
export function CountScene({ emoji, n, words }: { emoji: string; n: number; words: string[] }) {
  const [order, setOrder] = useState<Record<number, number>>({})
  const counted = Object.keys(order).length

  function tap(i: number) {
    if (order[i] !== undefined) return
    playPop()
    void speak(words[counted], { pitch: 1.3 })
    setOrder({ ...order, [i]: counted + 1 })
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-3 rounded-[2rem] bg-white/70 p-4">
        {Array.from({ length: n }, (_, i) => (
          <motion.button
            key={i}
            onClick={() => tap(i)}
            whileTap={{ scale: 0.85 }}
            animate={order[i] ? { y: [0, -16, 0] } : {}}
            aria-label={order[i] ? `Item ${order[i]}` : 'Contar este'}
            className={`relative text-[min(14vmin,5rem)] leading-none transition-opacity ${
              order[i] ? '' : 'opacity-90'
            }`}
          >
            {emoji}
            {order[i] && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 flex size-9 items-center justify-center rounded-full bg-coral text-xl font-bold text-white"
              >
                {order[i]}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
      <p className="h-8 text-2xl font-semibold text-coral">
        {counted > 0 && Array.from({ length: counted }, (_, i) => i + 1).join(', ')}
      </p>
    </div>
  )
}
