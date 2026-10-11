import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { playTap } from '../lib/sfx'
import { useT } from '../i18n'

interface ScreenProps {
  title?: string
  back?: string
  right?: ReactNode
  children: ReactNode
}

export function Screen({ title, back, right, children }: ScreenProps) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col">
      <header className="flex min-h-20 items-center gap-3 px-4 pt-4">
        {back && <BackButton to={back} />}
        {title && <h1 className="flex-1 text-3xl font-semibold sm:text-4xl">{title}</h1>}
        {!title && <div className="flex-1" />}
        {right}
      </header>
      <main className="flex flex-1 flex-col px-4 pt-2 pb-6">{children}</main>
    </div>
  )
}

export function BackButton({ to }: { to: string }) {
  const t = useT()
  return (
    <motion.div whileTap={{ scale: 0.88 }}>
      <Link
        to={to}
        onClick={playTap}
        aria-label={t.back}
        className="tile-shadow flex size-14 items-center justify-center rounded-full bg-white text-3xl"
      >
        ⬅️
      </Link>
    </motion.div>
  )
}
