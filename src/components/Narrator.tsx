import { motion } from 'framer-motion'
import { useSpeaking } from '../lib/speech'

/** Ursinho que "fala" (balança) enquanto a narração ou um som toca. */
export function Narrator({ size = 'text-5xl' }: { size?: string }) {
  const speaking = useSpeaking()
  return (
    <motion.span
      aria-hidden
      className={`inline-block shrink-0 leading-none ${size}`}
      animate={
        speaking
          ? { rotate: [0, -6, 6, -4, 0], scale: [1, 1.08, 0.98, 1.06, 1], y: [0, -3, 0] }
          : { rotate: 0, scale: 1, y: [0, -2, 0] }
      }
      transition={
        speaking
          ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      🧸
    </motion.span>
  )
}
