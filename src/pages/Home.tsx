import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Screen } from '../components/Screen'
import { Tile } from '../components/Tile'
import { SoundToggle, VoiceToggle } from '../components/AudioToggles'
import { LanguagePicker } from '../components/LanguagePicker'
import { useLang, useT } from '../i18n'
import { HOW_TO_LINK } from './HowTo'
import { PRIVACY_LINK } from './Privacy'
import { BedtimeTile } from '../modules/bedtime/BedtimeTile'
import { authEnabled, signOut } from '../lib/auth'
import type { Lang } from '../i18n'

const SIGN_OUT: Record<Lang, string> = { pt: 'Sair', en: 'Sign out', es: 'Salir', fr: 'Se déconnecter' }

export default function Home() {
  const t = useT()
  const lang = useLang()
  return (
    <Screen
      right={
        <div className="flex gap-3">
          <VoiceToggle />
          <SoundToggle />
        </div>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-10">
        <div className="text-center">
          <motion.div
            className="text-8xl"
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1 }}
            aria-hidden
          >
            🧸
          </motion.div>
          <h1 className="mt-2 text-5xl font-bold sm:text-6xl">Fala Falinha</h1>
          <p className="mt-2 text-xl opacity-70">{t.tagline}</p>
        </div>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          <Tile to="/historias" emoji="📖" label={t.stories} color="var(--color-coral)" big />
          <Tile to="/quiz" emoji="🎯" label={t.play} color="var(--color-sky)" big />
          <BedtimeTile />
        </div>

        <LanguagePicker />

        <div className="flex flex-wrap justify-center gap-x-5">
          <Link to="/como-usar" className="inline-flex min-h-11 items-center px-1 text-base underline opacity-60">
            ❓ {HOW_TO_LINK[lang]}
          </Link>
          <Link to="/creditos" className="inline-flex min-h-11 items-center px-1 text-base underline opacity-60">
            {t.soundCredits}
          </Link>
          <Link to="/privacidade" className="inline-flex min-h-11 items-center px-1 text-base underline opacity-60">
            {PRIVACY_LINK[lang]}
          </Link>
          {authEnabled && (
            <button
              onClick={() => void signOut()}
              className="inline-flex min-h-11 items-center px-1 text-base underline opacity-60"
            >
              {SIGN_OUT[lang]}
            </button>
          )}
        </div>
      </div>
    </Screen>
  )
}
