import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls, useIsPresent } from 'framer-motion'
import type { Hotspot, StoryPage } from '../../types'
import { playPop, playSuccess } from '../../lib/sfx'
import { playClip, speak, stopSpeaking, wait } from '../../lib/speech'
import { useSettings } from '../../lib/settings'

/** Quanto tempo a narração espera a criança tentar completar a frase. */
const PAUSE_MS = 3500

interface Props {
  page: StoryPage
  background: string
}

export function StoryPageView({ page, background }: Props) {
  const { sound, voice } = useSettings()
  const narrate = sound && voice
  const [revealed, setRevealed] = useState(false)
  const [yourTurn, setYourTurn] = useState(false)
  const revealedRef = useRef(false)

  function reveal() {
    if (revealedRef.current || !page.reveal) return
    revealedRef.current = true
    setRevealed(true)
    setYourTurn(false)
    playSuccess()
    void speak(page.reveal, { pitch: 1.25 })
  }

  // Ao trocar de página a antiga continua montada durante a animação de saída;
  // isPresent=false cancela a narração dela antes que atrapalhe a nova.
  const isPresent = useIsPresent()

  // Narração automática: lê o texto, faz a pausa "sua vez!" e revela o final.
  useEffect(() => {
    if (!narrate || !isPresent) return
    let cancelled = false
    void (async () => {
      await wait(500)
      if (cancelled) return
      await speak(page.text)
      if (cancelled || !page.reveal || revealedRef.current) return
      setYourTurn(true)
      await wait(PAUSE_MS)
      if (!cancelled) reveal()
    })()
    return () => {
      cancelled = true
      setYourTurn(false)
      stopSpeaking()
    }
    // Roda uma vez por página (e quando a voz é ligada/desligada).
  }, [narrate, isPresent])

  function replay() {
    void speak(revealed && page.reveal ? `${page.text} ${page.reveal}` : page.text)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div
        className="relative min-h-[45dvh] flex-1 overflow-hidden rounded-[2rem] shadow-inner"
        style={{ background: page.background ?? background }}
      >
        {page.elements.map((h, i) => (
          <HotspotItem key={i} hotspot={h} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <p className="text-center text-3xl leading-snug font-medium sm:text-4xl">
          <HighlightedText text={page.text} highlight={page.highlight} />{' '}
          {page.reveal &&
            (revealed ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                className="inline-block font-bold"
                style={{ color: page.accent ?? 'var(--color-coral)' }}
              >
                {page.reveal}
              </motion.span>
            ) : (
              <motion.button
                onClick={reveal}
                aria-label="Mostrar resposta"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="tile-shadow inline-flex size-14 items-center justify-center rounded-full bg-sun align-middle text-3xl"
              >
                ❓
              </motion.button>
            ))}
        </p>
        {narrate && (
          <button
            onClick={replay}
            aria-label="Ouvir de novo"
            className="tile-shadow flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl active:scale-90"
          >
            🔁
          </button>
        )}
      </div>

      <AnimatePresence>
        {yourTurn && (
          <motion.p
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: [1, 1.08, 1] }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ scale: { duration: 1, repeat: Infinity } }}
            className="text-center text-3xl font-bold text-coral"
            data-testid="your-turn"
          >
            👂 Sua vez!
          </motion.p>
        )}
      </AnimatePresence>

      {page.parentTip && (
        <p className="mx-auto max-w-2xl rounded-2xl bg-white/70 px-4 py-2 text-center text-base opacity-80">
          👨‍👩‍👧 <span className="font-semibold">Dica:</span> {page.parentTip}
        </p>
      )}
    </div>
  )
}

/** O que a voz fala ao tocar num elemento: "Vaca! Muuu!", ou só "dois" nos números. */
function hotspotSpeech(h: Hotspot): string {
  if (!h.sound) return h.word
  if (/^\d+$/.test(h.word)) return h.sound
  return `${h.word}! ${h.sound}`
}

function HotspotItem({ hotspot }: { hotspot: Hotspot }) {
  const controls = useAnimationControls()
  const [showWord, setShowWord] = useState(false)
  const size = hotspot.size ?? 16

  useEffect(() => {
    if (!showWord) return
    const t = setTimeout(() => setShowWord(false), 1800)
    return () => clearTimeout(t)
  }, [showWord])

  function onTap() {
    if (hotspot.audio) {
      // Gravação real; se faltar o arquivo, cai para a voz.
      playClip(hotspot.audio).catch(() => speak(hotspotSpeech(hotspot), { pitch: 1.3 }))
    } else {
      playPop()
      void speak(hotspotSpeech(hotspot), { pitch: 1.3 })
    }
    setShowWord(false)
    // Reabre no próximo frame para reiniciar o timer e a animação do balão.
    requestAnimationFrame(() => setShowWord(true))
    void controls.start({
      scale: [1, 1.25, 0.92, 1.08, 1],
      rotate: [0, -8, 8, -4, 0],
      transition: { duration: 0.6 },
    })
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
    >
      <AnimatePresence>
        {showWord && (
          <motion.div
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-2xl bg-white px-4 py-1 text-center whitespace-nowrap shadow-lg"
            initial={{ opacity: 0, y: 10, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
          >
            <span className="block text-3xl font-bold">{hotspot.word}</span>
            {hotspot.sound && <span className="block text-xl text-coral">{hotspot.sound}</span>}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        animate={controls}
        onTap={onTap}
        aria-label={hotspot.word}
        className="block leading-none drop-shadow-md"
        style={{ fontSize: `min(${size}vmin, ${size * 7}px)` }}
      >
        {hotspot.emoji}
      </motion.button>
    </div>
  )
}

const normalize = (w: string) => w.toLowerCase().replace(/[.,!?…:;"“”]/g, '')

function HighlightedText({ text, highlight = [] }: { text: string; highlight?: string[] }) {
  const targets = new Set(highlight.map(normalize))
  const words = text.split(' ')
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          {targets.has(normalize(w)) ? <span className="font-bold text-coral">{w}</span> : w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}
