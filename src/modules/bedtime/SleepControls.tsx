import { useEffect, useState } from 'react'
import { useLang } from '../../i18n'
import { SLEEP_SOUNDS, SLEEP_TIMERS, setSleepSound, setSleepTimer, useSleep, type SleepSound } from '../../lib/sleepSounds'
import { useSettings } from '../../lib/settings'
import { BEDTIME_COPY, SOUND_EMOJI } from './copy'

/** Escolha do som para dormir e do timer. `compact` = só uma linha de cada (tela da história). */
export function SleepControls({ compact = false }: { compact?: boolean }) {
  const t = BEDTIME_COPY[useLang()]
  const { sound, timerEnd, timerMinutes } = useSleep()
  const { sound: soundOn } = useSettings()
  const remaining = useRemaining(timerEnd)

  // Som do app desligado no 🔊: o som para dormir também para.
  useEffect(() => {
    if (!soundOn && sound) setSleepSound(null)
  }, [soundOn, sound])

  const chip = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-base font-medium transition active:scale-95 ${
      active ? 'bg-indigo-100 text-indigo-950' : 'bg-white/10 text-indigo-50 hover:bg-white/15'
    }`

  const options: (SleepSound | 'off')[] = ['off', ...SLEEP_SOUNDS]

  return (
    <section className={`flex flex-col gap-3 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 ${compact ? 'text-sm' : ''}`}>
      <div>
        {!compact && <p className="mb-2 text-sm font-semibold tracking-wide text-indigo-200 uppercase">{t.soundLabel}</p>}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label={t.soundLabel}>
          {options.map((o) => {
            const active = (sound ?? 'off') === o
            return (
              <button
                key={o}
                role="radio"
                aria-checked={active}
                disabled={!soundOn && o !== 'off'}
                onClick={() => setSleepSound(o === 'off' ? null : o)}
                className={`${chip(active)} disabled:opacity-40`}
              >
                <span aria-hidden>{SOUND_EMOJI[o]}</span>
                {t.sounds[o]}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        {!compact && <p className="mb-2 text-sm font-semibold tracking-wide text-indigo-200 uppercase">{t.timerLabel}</p>}
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label={t.timerLabel}>
          {[null, ...SLEEP_TIMERS].map((m) => {
            const active = timerMinutes === m
            return (
              <button
                key={m ?? 'never'}
                role="radio"
                aria-checked={active}
                onClick={() => setSleepTimer(m)}
                className={chip(active)}
              >
                {m === null ? `⏰ ${t.never}` : `⏰ ${t.minutes(m)}`}
              </button>
            )
          })}
          {remaining && (
            <span className="ml-1 shrink-0 text-base text-indigo-200 tabular-nums" aria-live="polite">
              {t.remaining(remaining)}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

/** "18:32" até o timer desligar, atualizado a cada segundo. */
function useRemaining(end: number | null): string | null {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!end) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [end])
  if (!end) return null
  const s = Math.max(0, Math.round((end - now) / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
