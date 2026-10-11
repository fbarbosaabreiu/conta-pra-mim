import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { tr, useLang } from '../../i18n'
import { bedtimeStories } from '../../content/bedtime'
import { playTap } from '../../lib/sfx'
import { NightSky } from './NightSky'
import { SleepControls } from './SleepControls'
import { BEDTIME_COPY } from './copy'

export default function BedtimeHome() {
  const lang = useLang()
  const t = BEDTIME_COPY[lang]

  return (
    <NightSky title={`🌙 ${t.title}`} back="/">
      <p className="mb-5 text-lg text-indigo-200">{t.subtitle}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bedtimeStories.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.5 }}
            whileTap={{ scale: 0.96 }}
          >
            <Link
              to={`/dormir/${s.id}`}
              onClick={playTap}
              className="flex min-h-28 items-center gap-4 rounded-3xl p-4 ring-1 ring-white/10"
              style={{ background: s.sky }}
            >
              <motion.span
                className="text-5xl"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              >
                {s.cover}
              </motion.span>
              <span className="text-xl font-semibold">{tr(s.title, lang)}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-6">
        <SleepControls />
      </div>

      <p className="mt-5 text-base text-indigo-200/80">{t.tip}</p>
    </NightSky>
  )
}
