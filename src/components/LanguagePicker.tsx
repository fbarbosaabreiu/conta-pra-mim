import { motion } from 'framer-motion'
import { LANGS, LANG_INFO, useLang, useT } from '../i18n'
import { updateSettings } from '../lib/settings'
import { playTap } from '../lib/sfx'
import { speak } from '../lib/speech'

/** Troca o idioma do app (textos, histórias e voz) e fala o nome do idioma escolhido. */
export function LanguagePicker() {
  const lang = useLang()
  const t = useT()
  return (
    <div role="radiogroup" aria-label={t.language} className="flex flex-wrap justify-center gap-2">
      {LANGS.map((l) => {
        const active = l === lang
        return (
          <motion.button
            key={l}
            role="radio"
            aria-checked={active}
            lang={LANG_INFO[l].locale}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              playTap()
              if (active) return
              updateSettings({ lang: l })
              void speak(LANG_INFO[l].name)
            }}
            className={`rounded-full px-4 py-2 text-lg font-semibold shadow-sm transition-colors ${
              active ? 'bg-coral text-white' : 'bg-white/80'
            }`}
          >
            {LANG_INFO[l].name}
          </motion.button>
        )
      })}
    </div>
  )
}
