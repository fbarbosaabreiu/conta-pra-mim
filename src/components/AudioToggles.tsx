import { updateSettings, useSettings } from '../lib/settings'
import { speechSupported, stopSpeaking } from '../lib/speech'
import { playTap } from '../lib/sfx'

const btn =
  'tile-shadow flex size-14 items-center justify-center rounded-full bg-white text-3xl active:scale-90 disabled:opacity-40'

/** Liga/desliga todo o áudio. */
export function SoundToggle() {
  const { sound } = useSettings()
  return (
    <button
      onClick={() => {
        if (sound) stopSpeaking()
        updateSettings({ sound: !sound })
        playTap()
      }}
      aria-label={sound ? 'Desligar sons' : 'Ligar sons'}
      aria-pressed={sound}
      className={btn}
    >
      {sound ? '🔊' : '🔇'}
    </button>
  )
}

/** Liga/desliga a narração (voz). */
export function VoiceToggle() {
  const { sound, voice } = useSettings()
  if (!speechSupported) return null
  const on = sound && voice
  return (
    <button
      onClick={() => {
        if (on) stopSpeaking()
        updateSettings({ voice: !voice })
        playTap()
      }}
      disabled={!sound}
      aria-label={on ? 'Desligar narração' : 'Ligar narração'}
      aria-pressed={on}
      className={`${btn} ${on ? '' : 'grayscale'}`}
    >
      {on ? '🗣️' : '🤐'}
    </button>
  )
}
