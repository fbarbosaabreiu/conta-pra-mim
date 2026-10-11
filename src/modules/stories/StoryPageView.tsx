import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls, useIsPresent } from 'framer-motion'
import type { Hotspot, StoryPage } from '../../types'
import { playPop, playSuccess } from '../../lib/sfx'
import { isSpeaking, say, stopSpeaking, wait, type Part } from '../../lib/speech'
import { useSettings } from '../../lib/settings'
import { vary, YOUR_TURN } from '../../lib/phrases'
import { Narrator } from '../../components/Narrator'
import { useLang, useT } from '../../i18n'

/** Quanto tempo a narração espera a criança tentar completar a frase. */
const PAUSE_MS = 4000

interface Props {
  page: StoryPage
  background: string
}

export function StoryPageView({ page, background }: Props) {
  const { sound, voice } = useSettings()
  const lang = useLang()
  const t = useT()
  const narrate = sound && voice
  const [revealed, setRevealed] = useState(false)
  const [yourTurn, setYourTurn] = useState<string | null>(null)
  const [narrating, setNarrating] = useState(false)
  const [activeChar, setActiveChar] = useState(-1)
  const revealedRef = useRef(false)

  function reveal() {
    if (revealedRef.current || !page.reveal) return
    revealedRef.current = true
    setRevealed(true)
    setYourTurn(null)
    playSuccess()
    // Com gravação, quem "fala" é o bicho; a voz sintética lendo "muuu" soa robótica.
    void say(page.revealAudio ? { clip: page.revealAudio, fallback: page.reveal } : page.reveal)
  }

  // Ao trocar de página a antiga continua montada durante a animação de saída;
  // isPresent=false cancela a narração dela antes que atrapalhe a nova.
  const isPresent = useIsPresent()

  // Narração automática: lê o texto, faz a pausa "sua vez!" e revela o final.
  useEffect(() => {
    if (!narrate || !isPresent) return
    let cancelled = false
    void (async () => {
      await wait(900) // deixa a página assentar antes de começar a falar
      // Se a criança já tocou num bicho ou no ❓, deixa o som terminar em vez de cortá-lo.
      while (!cancelled && isSpeaking()) await wait(150)
      if (cancelled) return
      setNarrating(true)
      // Resposta já revelada: lê a frase inteira, com o final.
      const early = revealedRef.current
      await say({ text: page.text, onWord: setActiveChar }, ...(early ? revealParts(page) : []))
      if (cancelled) return
      setNarrating(false)
      if (!page.reveal || revealedRef.current) return
      setYourTurn(vary(YOUR_TURN[lang]))
      await wait(PAUSE_MS)
      if (!cancelled) reveal()
    })()
    return () => {
      cancelled = true
      setYourTurn(null)
      setNarrating(false)
      setActiveChar(-1)
      stopSpeaking()
    }
    // Roda uma vez por página (e quando a voz é ligada/desligada).
  }, [narrate, isPresent])

  function replay() {
    setNarrating(true)
    void say({ text: page.text, onWord: setActiveChar }, ...(revealed && page.reveal ? revealParts(page) : [])).then(
      () => setNarrating(false),
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div
        data-scene
        className="relative min-h-[45dvh] flex-1 overflow-hidden rounded-[2rem] shadow-inner"
        style={{ background: page.background ?? background }}
      >
        {page.elements.map((h, i) => (
          <HotspotItem key={i} index={i} hotspot={h} quiet={narrating} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Narrator />
        <p className="text-center text-3xl leading-snug font-medium sm:text-4xl">
          <HighlightedText text={page.text} highlight={page.highlight} activeChar={activeChar} />{' '}
          {page.reveal &&
            (revealed ? (
              <motion.span
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="inline-block font-bold"
                style={{ color: page.accent ?? 'var(--color-coral)' }}
              >
                {page.reveal}
              </motion.span>
            ) : (
              <motion.button
                onClick={reveal}
                aria-label={t.showAnswer}
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
            aria-label={t.listenAgain}
            className="tile-shadow flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl active:scale-90"
          >
            🔁
          </button>
        )}
      </div>

      <div className="flex h-12 items-center justify-center">
        <AnimatePresence>
          {yourTurn && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="flex items-center gap-3"
              data-testid="your-turn"
            >
              <span className="text-3xl font-bold text-coral">{yourTurn}</span>
              <WaitingDots ms={PAUSE_MS} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {page.parentTip && (
        <p className="mx-auto max-w-2xl rounded-2xl bg-white/70 px-4 py-2 text-center text-base opacity-80">
          👨‍👩‍👧 <span className="font-semibold">{t.tip}</span> {page.parentTip}
        </p>
      )}
    </div>
  )
}

function revealParts(page: StoryPage): Part[] {
  if (!page.reveal) return []
  return [page.revealAudio ? { clip: page.revealAudio, fallback: page.reveal } : page.reveal]
}

/** Três bolinhas que acendem durante a pausa — mostra que o app está esperando, não travado. */
function WaitingDots({ ms }: { ms: number }) {
  return (
    <span className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-3 rounded-full bg-coral"
          initial={{ opacity: 0.2, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: ((i + 1) * ms) / 4000, duration: 0.3 }}
        />
      ))}
    </span>
  )
}

/** O que a voz fala ao tocar num elemento sem gravação: "sol", ou "dois" nos patinhos. */
function hotspotSpeech(h: Hotspot): string {
  if (/^\d+$/.test(h.word)) return h.sound ?? h.word
  return h.word
}

/** Folga entre o balão e a borda da cena / o elemento, em px. */
const GAP = 6

/**
 * Onde o balão da palavra cabe: acima do elemento se houver espaço, senão embaixo, e — se o
 * elemento ocupa a cena quase toda — encostado no topo da cena. Na horizontal, empurra para dentro.
 * Posições em px relativas ao elemento (o balão é filho dele).
 */
function placeBubble(holder: HTMLElement, bubble: HTMLElement) {
  const scene = holder.closest('[data-scene]')
  const h = holder.getBoundingClientRect()
  if (!scene) return { left: h.width / 2 - bubble.offsetWidth / 2, top: -bubble.offsetHeight - GAP, below: false }
  const s = scene.getBoundingClientRect()
  const w = bubble.offsetWidth
  const bh = bubble.offsetHeight
  let left = h.width / 2 - w / 2
  const absLeft = h.left + left
  if (absLeft < s.left + GAP) left += s.left + GAP - absLeft
  else if (absLeft + w > s.right - GAP) left -= absLeft + w - (s.right - GAP)
  const fitsAbove = h.top - bh - GAP >= s.top + GAP
  const fitsBelow = h.bottom + bh + GAP <= s.bottom - GAP
  if (fitsAbove) return { left, top: -bh - GAP, below: false }
  if (fitsBelow) return { left, top: h.height + GAP, below: true }
  return { left, top: s.top + GAP - h.top, below: true }
}

function HotspotItem({ hotspot, index, quiet }: { hotspot: Hotspot; index: number; quiet: boolean }) {
  const controls = useAnimationControls()
  const [showWord, setShowWord] = useState(false)
  const holderRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [bubblePos, setBubblePos] = useState<{ left: number; top: number; below: boolean } | null>(null)
  const named = useRef(false)
  const busy = useRef(false)
  const size = hotspot.size ?? 16
  // Cada elemento "respira" num ritmo próprio, para a cena não parecer parada.
  const idle = useMemo(() => ({ duration: 2.4 + Math.random() * 1.6, delay: Math.random() * 1.5 }), [])

  // Mede antes de pintar, para o balão já aparecer no lugar certo.
  useLayoutEffect(() => {
    if (!showWord) return setBubblePos(null)
    if (holderRef.current && bubbleRef.current) setBubblePos(placeBubble(holderRef.current, bubbleRef.current))
  }, [showWord])

  useEffect(() => {
    if (!showWord) return
    const t = setTimeout(() => setShowWord(false), 2000)
    return () => clearTimeout(t)
  }, [showWord])

  function onTap() {
    void controls.start({
      scale: [1, 1.25, 0.92, 1.08, 1],
      rotate: [0, -8, 8, -4, 0],
      transition: { duration: 0.6 },
    })
    setShowWord(true)

    // Durante a narração, ou com o som deste elemento ainda tocando, só anima:
    // recomeçar a fala a cada toque é o que mais soa robótico.
    if (quiet || busy.current) {
      playPop()
      return
    }

    const parts: Part[] = []
    if (hotspot.audio) {
      parts.push({ clip: hotspot.audio, fallback: hotspot.sound })
      // O nome só no primeiro toque; depois, só o som do bicho.
      if (!named.current) parts.push(hotspot.word)
    } else {
      playPop()
      parts.push(hotspotSpeech(hotspot))
    }
    named.current = true
    busy.current = true
    void say(...parts).finally(() => (busy.current = false))
  }

  return (
    <div
      ref={holderRef}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
    >
      <AnimatePresence>
        {showWord && (
          <motion.div
            ref={bubbleRef}
            className="pointer-events-none absolute top-0 left-0 z-10 rounded-2xl bg-white px-4 py-1 text-center whitespace-nowrap shadow-lg"
            style={{
              left: bubblePos?.left ?? 0,
              top: bubblePos?.top ?? 0,
              visibility: bubblePos ? 'visible' : 'hidden',
            }}
            initial={{ opacity: 0, y: bubblePos?.below ? -10 : 10, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
          >
            <span className="block text-3xl font-bold">{hotspot.word}</span>
            {hotspot.sound && <span className="block text-xl text-coral">{hotspot.sound}</span>}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 + index * 0.12 }}
      >
        <motion.div
          animate={{ y: [0, -size * 0.25, 0], rotate: [0, 1.5, 0] }}
          transition={{ duration: idle.duration, delay: idle.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.button
            animate={controls}
            onTap={onTap}
            aria-label={hotspot.word}
            className="block leading-none drop-shadow-md"
            style={{ fontSize: `min(${size}vmin, ${size * 7}px)` }}
          >
            {hotspot.emoji}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}

const normalize = (w: string) => w.toLowerCase().replace(/[.,!?¡¿…:;"“”«»]/g, '')

/** Texto com palavras-chave em destaque e, durante a narração, a palavra falada acesa. */
function HighlightedText({
  text,
  highlight = [],
  activeChar,
}: {
  text: string
  highlight?: string[]
  activeChar: number
}) {
  const targets = new Set(highlight.map(normalize))
  // Separador original entre as palavras (no francês, espaço inseparável antes de "!" e "?").
  const words = [...text.matchAll(/(\S+)(\s*)/g)].map((m) => ({ w: m[1], sep: m[2], at: m.index ?? 0 }))
  return (
    <>
      {words.map(({ w, sep, at }, i) => {
        const active = activeChar === at
        const key = targets.has(normalize(w))
        return (
          <span key={i}>
            <motion.span
              // Fundo troca na hora (só uma palavra acesa por vez); o "pulinho" é animado.
              className={`inline-block rounded-lg ${key ? 'font-bold text-coral' : ''} ${active ? 'bg-sun/35' : ''}`}
              data-active={active || undefined}
              animate={active ? { scale: 1.15, y: -3 } : { scale: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 ? sep : ''}
          </span>
        )
      })}
    </>
  )
}
