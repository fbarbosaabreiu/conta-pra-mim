import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang, type Lang } from '../i18n'
import { markOnboardingSeen } from '../lib/onboarding'
import { playTap } from '../lib/sfx'
import { say, stopSpeaking } from '../lib/speech'
import { SoundToggle, VoiceToggle } from '../components/AudioToggles'

// "Como usar": aparece na primeira abertura e pode ser revisto pela tela inicial.
// Escrito para o adulto — quem segura o celular e conduz a brincadeira.

type StepId = 'welcome' | 'stories' | 'pause' | 'quiz' | 'sound' | 'tips'

interface Copy {
  skip: string
  next: string
  back: string
  start: string
  stepOf: (n: number, total: number) => string
  tapTheCow: string
  /** Onomatopeia da vaca e frase de exemplo da pausa, no idioma. */
  moo: string
  pauseSample: string
  steps: Record<StepId, { title: string; body: string }>
  tips: string[]
  soundLabels: { voice: string; sound: string }
}

const COPY: Record<Lang, Copy> = {
  pt: {
    skip: 'Pular',
    next: 'Próximo',
    back: 'Voltar',
    start: 'Começar!',
    stepOf: (n, t) => `Passo ${n} de ${t}`,
    tapTheCow: 'Toque na vaca 👆',
    moo: 'muuu!',
    pauseSample: 'A vaca faz…',
    steps: {
      welcome: {
        title: 'Bem-vindo ao Fala Falinha!',
        body: 'Histórias e brincadeiras para ajudar seu bebê a falar. Funciona melhor com você junto, de preferência no colo.',
      },
      stories: {
        title: 'Histórias que falam',
        body: 'O app lê a história em voz alta, e a palavra lida se acende. Toque nos bichos: eles fazem o som de verdade.',
      },
      pause: {
        title: 'A vez do bebê',
        body: 'Quando aparecer “👂 Sua vez!”, pare e espere. Dê tempo para a criança tentar falar — qualquer tentativa vale! Depois toque no ❓ (ou espere) para ver a resposta.',
      },
      quiz: {
        title: 'Brincar',
        body: 'Perguntas sobre animais, cores e números. Se errar, o app mostra o que foi tocado e dá uma dica — sem bronca. Se a criança ficar parada, ele encoraja.',
      },
      sound: {
        title: 'Som e voz',
        body: 'Estes botões ficam no topo da tela. Se não ouvir nada, toque na tela uma vez: o celular só libera o som depois de um toque.',
      },
      tips: { title: 'Dicas para os pais', body: '' },
    },
    tips: [
      '5 a 10 minutos por vez já é ótimo.',
      'Repita as palavras e imite os sons junto.',
      'Comemore cada tentativa, mesmo incompleta.',
      'Ler a mesma história várias vezes é bom: é assim que os bebês aprendem.',
      'No iPhone: Safari → Compartilhar → “Adicionar à Tela de Início” para usar como app, até sem internet.',
    ],
    soundLabels: { voice: 'liga/desliga a narração', sound: 'liga/desliga todo o som' },
  },
  en: {
    skip: 'Skip',
    next: 'Next',
    back: 'Back',
    start: 'Let’s go!',
    stepOf: (n, t) => `Step ${n} of ${t}`,
    tapTheCow: 'Tap the cow 👆',
    moo: 'moo!',
    pauseSample: 'The cow says…',
    steps: {
      welcome: {
        title: 'Welcome to Fala Falinha!',
        body: 'Stories and games to help your baby start talking. It works best with you alongside — ideally on your lap.',
      },
      stories: {
        title: 'Stories that talk',
        body: 'The app reads the story out loud and lights up each word as it goes. Tap the animals: they make their real sounds.',
      },
      pause: {
        title: 'Baby’s turn',
        body: 'When “👂 Your turn!” shows up, stop and wait. Give your child time to try saying it — any attempt counts! Then tap ❓ (or wait) to see the answer.',
      },
      quiz: {
        title: 'Play',
        body: 'Questions about animals, colors and numbers. A wrong tap just shows what was touched and gives a hint — no scolding. If your child goes quiet, the app cheers them on.',
      },
      sound: {
        title: 'Sound and voice',
        body: 'These buttons sit at the top of the screen. If you hear nothing, tap the screen once: phones only allow sound after a tap.',
      },
      tips: { title: 'Tips for parents', body: '' },
    },
    tips: [
      '5 to 10 minutes at a time is plenty.',
      'Repeat the words and make the sounds together.',
      'Celebrate every attempt, even half-words.',
      'Reading the same story again and again is great: that’s how babies learn.',
      'On iPhone: Safari → Share → “Add to Home Screen” to use it like an app, even offline.',
    ],
    soundLabels: { voice: 'turns narration on/off', sound: 'turns all sound on/off' },
  },
  es: {
    skip: 'Saltar',
    next: 'Siguiente',
    back: 'Atrás',
    start: '¡Empezar!',
    stepOf: (n, t) => `Paso ${n} de ${t}`,
    tapTheCow: 'Toca la vaca 👆',
    moo: '¡muuu!',
    pauseSample: 'La vaca hace…',
    steps: {
      welcome: {
        title: '¡Bienvenido a Fala Falinha!',
        body: 'Cuentos y juegos para ayudar a tu bebé a hablar. Funciona mejor contigo al lado, mejor aún en tu regazo.',
      },
      stories: {
        title: 'Cuentos que hablan',
        body: 'La app lee el cuento en voz alta y resalta cada palabra. Toca los animales: hacen su sonido de verdad.',
      },
      pause: {
        title: 'El turno del bebé',
        body: 'Cuando aparezca “👂 ¡Tu turno!”, para y espera. Dale tiempo para intentar decirlo: ¡cualquier intento vale! Después toca ❓ (o espera) para ver la respuesta.',
      },
      quiz: {
        title: 'Jugar',
        body: 'Preguntas sobre animales, colores y números. Si se equivoca, la app muestra lo que tocó y da una pista, sin regaños. Si el niño se queda quieto, la app lo anima.',
      },
      sound: {
        title: 'Sonido y voz',
        body: 'Estos botones están arriba en la pantalla. Si no oyes nada, toca la pantalla una vez: el móvil solo permite sonido después de un toque.',
      },
      tips: { title: 'Consejos para los padres', body: '' },
    },
    tips: [
      'De 5 a 10 minutos cada vez es suficiente.',
      'Repitan las palabras e imiten los sonidos juntos.',
      'Celebra cada intento, aunque esté incompleto.',
      'Leer el mismo cuento muchas veces es bueno: así aprenden los bebés.',
      'En iPhone: Safari → Compartir → “Añadir a pantalla de inicio” para usarla como app, incluso sin internet.',
    ],
    soundLabels: { voice: 'activa/desactiva la narración', sound: 'activa/desactiva todo el sonido' },
  },
  fr: {
    skip: 'Passer',
    next: 'Suivant',
    back: 'Retour',
    start: 'C’est parti !',
    stepOf: (n, t) => `Étape ${n} sur ${t}`,
    tapTheCow: 'Touche la vache 👆',
    moo: 'meuh !',
    pauseSample: 'La vache fait…',
    steps: {
      welcome: {
        title: 'Bienvenue dans Fala Falinha !',
        body: 'Des histoires et des jeux pour aider votre bébé à parler. C’est encore mieux avec vous à côté, idéalement sur vos genoux.',
      },
      stories: {
        title: 'Des histoires qui parlent',
        body: 'L’appli lit l’histoire à voix haute et allume chaque mot lu. Touchez les animaux : ils font leur vrai cri.',
      },
      pause: {
        title: 'Au tour de bébé',
        body: 'Quand « 👂 À toi ! » apparaît, arrêtez-vous et attendez. Laissez à l’enfant le temps d’essayer — chaque essai compte ! Puis touchez ❓ (ou attendez) pour voir la réponse.',
      },
      quiz: {
        title: 'Jouer',
        body: 'Des questions sur les animaux, les couleurs et les nombres. En cas d’erreur, l’appli montre ce qui a été touché et donne un indice — sans gronder. Si l’enfant ne touche plus rien, elle l’encourage.',
      },
      sound: {
        title: 'Son et voix',
        body: 'Ces boutons sont en haut de l’écran. Si vous n’entendez rien, touchez l’écran une fois : le téléphone n’autorise le son qu’après un toucher.',
      },
      tips: { title: 'Conseils pour les parents', body: '' },
    },
    tips: [
      '5 à 10 minutes à la fois, c’est parfait.',
      'Répétez les mots et imitez les bruits ensemble.',
      'Fêtez chaque essai, même incomplet.',
      'Relire la même histoire, c’est très bien : c’est comme ça que les bébés apprennent.',
      'Sur iPhone : Safari → Partager → « Sur l’écran d’accueil » pour l’utiliser comme une appli, même hors ligne.',
    ],
    soundLabels: { voice: 'active/coupe la narration', sound: 'active/coupe tout le son' },
  },
}

/** Rótulo do link "Como usar" na tela inicial. */
export const HOW_TO_LINK: Record<Lang, string> = {
  pt: 'Como usar',
  en: 'How to use',
  es: 'Cómo usar',
  fr: 'Mode d’emploi',
}

const STEPS: { id: StepId; emoji: string; color: string }[] = [
  { id: 'welcome', emoji: '🧸', color: 'var(--color-sun)' },
  { id: 'stories', emoji: '📖', color: 'var(--color-coral)' },
  { id: 'pause', emoji: '👂', color: 'var(--color-grape)' },
  { id: 'quiz', emoji: '🎯', color: 'var(--color-sky)' },
  { id: 'sound', emoji: '🔊', color: 'var(--color-leaf)' },
  { id: 'tips', emoji: '💛', color: 'var(--color-sun)' },
]

const slide = {
  enter: (dir: number) => ({ x: dir * 280, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -280, opacity: 0 }),
}

export default function HowTo() {
  const navigate = useNavigate()
  const t = COPY[useLang()]
  const [[index, dir], setStep] = useState<[number, number]>([0, 1])
  const step = STEPS[index]
  const last = index === STEPS.length - 1

  function go(delta: number) {
    const next = index + delta
    if (next < 0 || next >= STEPS.length) return
    playTap()
    stopSpeaking()
    setStep([next, delta])
  }

  function finish() {
    playTap()
    stopSpeaking()
    markOnboardingSeen()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col px-4 pt-4 pb-6">
      <header className="flex min-h-14 items-center justify-between">
        <div className="flex gap-2" aria-label={t.stepOf(index + 1, STEPS.length)}>
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-3 rounded-full transition-all ${i === index ? 'w-8 bg-coral' : 'w-3 bg-ink/20'}`}
            />
          ))}
        </div>
        {!last && (
          <button
            onClick={finish}
            className="rounded-full px-5 py-2 text-xl font-semibold text-ink/70 underline-offset-4 hover:underline active:scale-95"
          >
            {t.skip}
          </button>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.section
            key={index}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) go(1)
              else if (info.offset.x > 80) go(-1)
            }}
            // Rola se não couber (celulares baixos); o arrasto lateral continua funcionando.
            className="flex w-full flex-col items-center justify-center-safe gap-4 overflow-y-auto py-2 text-center"
          >
            <motion.div
              className={`flex shrink-0 items-center justify-center rounded-full shadow-inner ${
                step.id === 'tips' ? 'size-24 text-6xl' : 'size-36 text-8xl'
              }`}
              style={{ background: step.color }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.1 }}
              aria-hidden
            >
              <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
                {step.emoji}
              </motion.span>
            </motion.div>
            <h1 className="text-4xl font-bold">{t.steps[step.id].title}</h1>
            {t.steps[step.id].body && (
              <p className="max-w-md text-xl leading-relaxed opacity-80">
                <WithAnswerButton text={t.steps[step.id].body} />
              </p>
            )}
            <StepExtra id={step.id} t={t} />
          </motion.section>
        </AnimatePresence>
      </div>

      <nav className="mt-4 flex items-center justify-between gap-4">
        <button
          onClick={() => go(-1)}
          className={`rounded-full px-6 py-4 text-xl font-semibold text-ink/70 active:scale-95 ${index === 0 ? 'invisible' : ''}`}
        >
          ◀ {t.back}
        </button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={last ? finish : () => go(1)}
          className="tile-shadow rounded-full bg-coral px-10 py-4 text-2xl font-semibold text-white"
        >
          {last ? t.start : `${t.next} ▶`}
        </motion.button>
      </nav>
    </div>
  )
}

/** Partes interativas de alguns passos: a vaca de demonstração, os botões de som, a lista de dicas. */
function StepExtra({ id, t }: { id: StepId; t: Copy }) {
  if (id === 'stories') return <CowDemo hint={t.tapTheCow} moo={t.moo} />
  if (id === 'pause') return <PauseDemo sample={t.pauseSample} />
  if (id === 'sound')
    return (
      <div className="flex flex-col gap-3 text-left text-lg">
        <Row control={<VoiceToggle />} label={t.soundLabels.voice} />
        <Row control={<SoundToggle />} label={t.soundLabels.sound} />
      </div>
    )
  if (id === 'tips')
    return (
      <ul className="flex max-w-md flex-col gap-2 text-left text-base">
        {t.tips.map((tip, i) => (
          <motion.li
            key={i}
            className="flex gap-3 rounded-2xl bg-white/80 px-4 py-2.5 shadow-sm"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.1 }}
          >
            <span aria-hidden>💛</span>
            <span>{tip}</span>
          </motion.li>
        ))}
      </ul>
    )
  return null
}

function Row({ control, label }: { control: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-4">
      {control}
      <span>{label}</span>
    </div>
  )
}

/** A mesma interação das histórias: toca a vaca e ela muge (e libera o áudio do celular). */
function CowDemo({ hint, moo }: { hint: string; moo: string }) {
  const [taps, setTaps] = useState(0)
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        key={taps}
        onClick={() => {
          setTaps((n) => n + 1)
          void say({ clip: 'vaca.mp3', fallback: moo })
        }}
        animate={taps ? { scale: [1, 1.25, 0.92, 1.08, 1], rotate: [0, -8, 8, -4, 0] } : { y: [0, -6, 0] }}
        transition={taps ? { duration: 0.6 } : { duration: 2, repeat: Infinity }}
        className="text-7xl leading-none"
        aria-label="vaca"
      >
        🐄
      </motion.button>
      <span className="h-7 text-xl font-semibold text-coral">{taps ? moo : hint}</span>
    </div>
  )
}

/** No texto, o ❓ vira o mesmo botão amarelo redondo da história (o emoji solto parece um erro). */
function WithAnswerButton({ text }: { text: string }) {
  const parts = text.split('❓')
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span
              className="mx-0.5 inline-flex size-8 items-center justify-center rounded-full bg-sun align-middle text-base"
              aria-label="?"
            >
              ❓
            </span>
          )}
        </span>
      ))}
    </>
  )
}

/** Mostra como fica a pausa: a frase, o ❓ e as bolinhas esperando. */
function PauseDemo({ sample }: { sample: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-3 text-2xl shadow-sm" aria-hidden>
      <span>🧸</span>
      <span className="font-medium">{sample}</span>
      <motion.span
        className="inline-flex size-11 items-center justify-center rounded-full bg-sun text-2xl"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        ❓
      </motion.span>
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2.5 rounded-full bg-coral"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </span>
    </div>
  )
}
