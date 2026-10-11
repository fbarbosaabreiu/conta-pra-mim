import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { playTap } from '../lib/sfx'

interface TileProps {
  to: string
  emoji: string
  label: string
  color: string
  badge?: string
  big?: boolean
}

/** Botão grande e colorido usado nos menus. */
export function Tile({ to, emoji, label, color, badge, big }: TileProps) {
  return (
    <motion.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.03 }} className="relative">
      <Link
        to={to}
        onClick={playTap}
        className={`tile-shadow flex h-full flex-col items-center justify-center gap-2 rounded-[2rem] p-5 text-center text-white ${
          big ? 'min-h-56 sm:min-h-72' : 'min-h-44'
        }`}
        style={{ background: color }}
      >
        <span className={big ? 'text-8xl sm:text-9xl' : 'text-7xl'} aria-hidden>
          {emoji}
        </span>
        <span className={`font-semibold drop-shadow ${big ? 'text-4xl' : 'text-2xl'}`}>{label}</span>
      </Link>
      {badge && (
        <span className="absolute -top-2 -right-2 rounded-full bg-white px-3 py-1 text-lg font-semibold shadow">
          {badge}
        </span>
      )}
    </motion.div>
  )
}
