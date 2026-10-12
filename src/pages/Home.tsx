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
import { authEnabled, signOut, useSession } from '../lib/auth'
import { shareApp } from '../lib/share'
import type { Lang } from '../i18n'
import { AgeBar } from '../components/AgePicker'

const SIGN_OUT: Record<Lang, string> = { pt: 'Sair', en: 'Sign out', es: 'Salir', fr: 'Se déconnecter' }
const SHARE: Record<Lang, string> = {
  pt: 'Indicar para outra família',
  en: 'Share with another family',
  es: 'Recomendar a otra familia',
  fr: 'Recommander à une autre famille',
}
const SAVE: Record<Lang, string> = {
  pt: 'Salvar progresso',
  en: 'Save progress',
  es: 'Guardar progreso',
  fr: 'Garder la progression',
}
const SAVED: Record<Lang, string> = {
  pt: 'Progresso salvo na conta',
  en: 'Progress saved to your account',
  es: 'Progreso guardado en la cuenta',
  fr: 'Progression enregistrée sur le compte',
}

const pill = 'tile-shadow inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-lg font-semibold active:scale-95'

export default function Home() {
  const t = useT()
  const lang = useLang()
  const session = useSession()
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

        <AgeBar />

        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          <Tile to="/historias" emoji="📖" label={t.stories} color="var(--color-coral)" big />
          <Tile to="/quiz" emoji="🎯" label={t.play} color="var(--color-sky)" big />
          <BedtimeTile />
        </div>

        <LanguagePicker />

        {/* Para o adulto: indicar o app e (opcional) guardar o progresso numa conta */}
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => void shareApp(lang)} className={pill}>
            <span aria-hidden>💌</span> {SHARE[lang]}
          </button>
          {authEnabled && session === null && (
            <Link to="/entrar" className={pill}>
              <span aria-hidden>💾</span> {SAVE[lang]}
            </Link>
          )}
          {session && (
            <p className="inline-flex min-h-12 items-center gap-2 px-2 text-base opacity-70">
              <span aria-hidden>✅</span> {SAVED[lang]}
            </p>
          )}
        </div>

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
          {session && (
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
