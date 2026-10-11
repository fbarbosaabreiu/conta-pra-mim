import { useEffect, useMemo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BackButton } from '../../components/Screen'
import { stopSleep } from '../../lib/sleepSounds'

// Tela noturna do "Soninho": céu escuro com estrelas piscando devagar.
// Também cuida de parar som e timer quando a pessoa sai do módulo.

let presence = 0

export function NightSky({
  title,
  back,
  right,
  sky = 'linear-gradient(#0b1437, #1e2a5e 70%, #2b3a78)',
  children,
}: {
  title?: string
  back: string
  right?: ReactNode
  sky?: string
  children: ReactNode
}) {
  useEffect(() => {
    presence++
    return () => {
      presence--
      // Entre a lista e uma história a tela troca, mas o som continua; fora do módulo, para.
      setTimeout(() => presence === 0 && stopSleep(), 400)
    }
  }, [])

  const stars = useMemo(
    () =>
      Array.from({ length: 36 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 70,
        size: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 3,
      })),
    [],
  )

  return (
    <div className="relative min-h-dvh overflow-hidden text-indigo-50" style={{ background: sky }}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {stars.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }}
            animate={{ opacity: [0.15, 0.9, 0.15] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col">
        <header className="flex min-h-20 items-center gap-3 px-4 pt-4">
          <BackButton to={back} />
          {title && <h1 className="flex-1 text-3xl font-semibold sm:text-4xl">{title}</h1>}
          {!title && <div className="flex-1" />}
          {right}
        </header>
        <main className="flex flex-1 flex-col px-4 pt-2 pb-6">{children}</main>
      </div>
    </div>
  )
}
