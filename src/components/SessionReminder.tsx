import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '../i18n'
import { useSettings } from '../lib/settings'
import { stopSpeaking } from '../lib/speech'
import { AGE_COPY, SESSION_MINUTES, SESSION_MINUTES_DEFAULT } from '../content/ages'

const TICK_MS = 15_000
/** Longe do app por mais que isso: começa uma sessão nova. */
const NEW_SESSION_AFTER_MS = 30 * 60_000
/** Telas onde não interrompe: o Soninho (é para dormir) e as páginas para os pais. */
const QUIET = ['/dormir', '/guia', '/como-usar', '/privacidade', '/creditos']

/**
 * Depois de alguns minutos seguidos (conforme a idade), sugere com carinho levar a brincadeira para
 * fora da tela. Só conta o tempo com o app visível.
 */
export function SessionReminder() {
  const lang = useLang()
  const t = AGE_COPY[lang]
  const { age } = useSettings()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = useRef(0)
  const lastSeen = useRef(Date.now())
  const limit = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [idea, setIdea] = useState('')
  const [tick, setTick] = useState(0)
  const quiet = QUIET.some((p) => pathname.startsWith(p))
  const minutes = age ? SESSION_MINUTES[age] : SESSION_MINUTES_DEFAULT

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      if (now - lastSeen.current > NEW_SESSION_AFTER_MS) {
        active.current = 0
        limit.current = null
      }
      lastSeen.current = now
      if (document.visibilityState === 'visible') active.current += TICK_MS
      setTick((n) => n + 1)
    }, TICK_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSeen.current > NEW_SESSION_AFTER_MS) {
        active.current = 0
        limit.current = null
      }
      lastSeen.current = Date.now()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // A cada tick (ou troca de tela) confere se passou do limite, fora das telas quietas.
  useEffect(() => {
    if (open || quiet || active.current < (limit.current ?? minutes * 60_000)) return
    const ideas = t.guides[age ?? 'a1'].offline
    setIdea(ideas[Math.floor(Math.random() * ideas.length)])
    stopSpeaking()
    setOpen(true)
  }, [tick, quiet, open, minutes, age, t])

  const more = () => {
    limit.current = active.current + 5 * 60_000
    setOpen(false)
  }
  const stop = () => {
    active.current = 0
    limit.current = null
    setOpen(false)
    navigate('/')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-title"
            className="w-full max-w-md rounded-[2rem] bg-white p-6 text-center shadow-xl"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
          >
            <h2 id="session-title" className="text-2xl font-semibold">
              {t.reminder.title(Math.round(active.current / 60_000))}
            </h2>
            <p className="mt-2 text-lg">{t.reminder.body}</p>
            <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-lg">🌳 {idea}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button onClick={more} className="min-h-12 rounded-full bg-black/5 px-5 text-lg font-semibold active:scale-95">
                {t.reminder.more}
              </button>
              <button
                onClick={stop}
                className="min-h-12 rounded-full bg-[var(--color-coral)] px-5 text-lg font-semibold text-white active:scale-95"
              >
                {t.reminder.stop}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
