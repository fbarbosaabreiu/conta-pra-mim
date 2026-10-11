import type { Lang } from '../../i18n/langs'
import type { SleepSound } from '../../lib/sleepSounds'

// Textos do módulo "Soninho" nas 4 línguas (francês já com espaço inseparável antes de ! ? :).

interface Copy {
  title: string
  subtitle: string
  soundLabel: string
  sounds: Record<SleepSound | 'off', string>
  timerLabel: string
  never: string
  minutes: (n: number) => string
  remaining: (mmss: string) => string
  play: string
  pause: string
  goodNight: string
  goodNightSpoken: string
  again: string
  otherStories: string
  timerFinished: string
  tip: string
}

const NB = ' '

export const BEDTIME_COPY: Record<Lang, Copy> = {
  pt: {
    title: 'Soninho',
    subtitle: 'Histórias calmas que se leem sozinhas',
    soundLabel: 'Som para dormir',
    sounds: { off: 'Sem som', chuva: 'Chuva', mar: 'Mar', ruido: 'Ruído branco', ninar: 'Canção de ninar' },
    timerLabel: 'Desligar em',
    never: 'Nunca',
    minutes: (n) => `${n} min`,
    remaining: (t) => `Desliga em ${t}`,
    play: 'Ler sozinho',
    pause: 'Pausar',
    goodNight: 'Boa noite',
    goodNightSpoken: 'Boa noite. Durma bem.',
    again: 'Ler de novo',
    otherStories: 'Outras histórias',
    timerFinished: 'O tempo acabou. Bons sonhos!',
    tip: 'Dica: escolha um som e o timer, comece a história e deixe o celular longe do berço.',
  },
  en: {
    title: 'Sleepy time',
    subtitle: 'Calm stories that read themselves',
    soundLabel: 'Sleep sound',
    sounds: { off: 'No sound', chuva: 'Rain', mar: 'Sea', ruido: 'White noise', ninar: 'Lullaby' },
    timerLabel: 'Turn off in',
    never: 'Never',
    minutes: (n) => `${n} min`,
    remaining: (t) => `Turns off in ${t}`,
    play: 'Read aloud',
    pause: 'Pause',
    goodNight: 'Good night',
    goodNightSpoken: 'Good night. Sleep well.',
    again: 'Read again',
    otherStories: 'Other stories',
    timerFinished: 'Time’s up. Sweet dreams!',
    tip: 'Tip: pick a sound and the timer, start the story and keep the phone away from the crib.',
  },
  es: {
    title: 'A dormir',
    subtitle: 'Cuentos tranquilos que se leen solos',
    soundLabel: 'Sonido para dormir',
    sounds: { off: 'Sin sonido', chuva: 'Lluvia', mar: 'Mar', ruido: 'Ruido blanco', ninar: 'Canción de cuna' },
    timerLabel: 'Apagar en',
    never: 'Nunca',
    minutes: (n) => `${n} min`,
    remaining: (t) => `Se apaga en ${t}`,
    play: 'Leer solo',
    pause: 'Pausar',
    goodNight: 'Buenas noches',
    goodNightSpoken: 'Buenas noches. Que duermas bien.',
    again: 'Leer otra vez',
    otherStories: 'Otros cuentos',
    timerFinished: 'Se acabó el tiempo. ¡Dulces sueños!',
    tip: 'Consejo: elige un sonido y el temporizador, empieza el cuento y deja el móvil lejos de la cuna.',
  },
  fr: {
    title: 'Dodo',
    subtitle: 'Des histoires calmes qui se lisent toutes seules',
    soundLabel: 'Son pour dormir',
    sounds: { off: 'Sans son', chuva: 'Pluie', mar: 'Mer', ruido: 'Bruit blanc', ninar: 'Berceuse' },
    timerLabel: 'Arrêter dans',
    never: 'Jamais',
    minutes: (n) => `${n}${NB}min`,
    remaining: (t) => `Arrêt dans ${t}`,
    play: 'Lecture auto',
    pause: 'Pause',
    goodNight: 'Bonne nuit',
    goodNightSpoken: 'Bonne nuit. Dors bien.',
    again: 'Relire',
    otherStories: 'Autres histoires',
    timerFinished: `C’est l’heure. Fais de beaux rêves${NB}!`,
    tip: `Astuce${NB}: choisissez un son et le minuteur, lancez l’histoire et gardez le téléphone loin du lit de bébé.`,
  },
}

export const SOUND_EMOJI: Record<SleepSound | 'off', string> = {
  off: '🔇',
  chuva: '🌧️',
  mar: '🌊',
  ruido: '〰️',
  ninar: '🎵',
}
