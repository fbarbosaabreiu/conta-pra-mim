import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { useLang } from '../../i18n'
import { playTap } from '../../lib/sfx'
import { BEDTIME_COPY } from './copy'

/** Faixa larga e baixa na tela inicial (as duas de cima continuam grandes). */
export function BedtimeTile() {
  const t = BEDTIME_COPY[useLang()]
  return (
    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} className="sm:col-span-2">
      <Link
        to="/dormir"
        onClick={playTap}
        className="tile-shadow flex min-h-24 items-center justify-center gap-4 rounded-[2rem] px-6 py-4 text-white"
        style={{ background: 'linear-gradient(120deg, #1e2a5e, #3b3f8f)' }}
      >
        <motion.span
          className="text-6xl"
          animate={{ rotate: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        >
          🌙
        </motion.span>
        <span className="text-left">
          <span className="block text-3xl font-semibold">{t.title}</span>
          <span className="block text-base text-indigo-200">{t.subtitle}</span>
        </span>
      </Link>
    </motion.div>
  )
}
