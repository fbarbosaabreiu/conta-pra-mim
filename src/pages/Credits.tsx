import { Screen } from '../components/Screen'
import credits from '../content/sound-credits.json'
import { say } from '../lib/speech'
import { useLang, useT, type Lang } from '../i18n'

const NAMES: Record<string, { emoji: string } & Record<Lang, string>> = {
  vaca: { emoji: '🐮', pt: 'Vaca', en: 'Cow', es: 'Vaca', fr: 'Vache' },
  porco: { emoji: '🐷', pt: 'Porco', en: 'Pig', es: 'Cerdo', fr: 'Cochon' },
  pato: { emoji: '🦆', pt: 'Pato', en: 'Duck', es: 'Pato', fr: 'Canard' },
  ovelha: { emoji: '🐑', pt: 'Ovelha', en: 'Sheep', es: 'Oveja', fr: 'Mouton' },
  galo: { emoji: '🐓', pt: 'Galo', en: 'Rooster', es: 'Gallo', fr: 'Coq' },
  galinha: { emoji: '🐔', pt: 'Galinha', en: 'Hen', es: 'Gallina', fr: 'Poule' },
  gato: { emoji: '🐱', pt: 'Gato', en: 'Cat', es: 'Gato', fr: 'Chat' },
  cachorro: { emoji: '🐶', pt: 'Cachorro', en: 'Dog', es: 'Perro', fr: 'Chien' },
  sapo: { emoji: '🐸', pt: 'Sapo', en: 'Frog', es: 'Rana', fr: 'Grenouille' },
  leao: { emoji: '🦁', pt: 'Leão', en: 'Lion', es: 'León', fr: 'Lion' },
  abelha: { emoji: '🐝', pt: 'Abelha', en: 'Bee', es: 'Abeja', fr: 'Abeille' },
  passarinho: { emoji: '🐦', pt: 'Passarinho', en: 'Bird', es: 'Pajarito', fr: 'Oiseau' },
}

/** Atribuição exigida pelas licenças CC BY / CC BY-SA das gravações. */
export default function Credits() {
  const lang = useLang()
  const t = useT()
  return (
    <Screen title={t.soundCredits} back="/">
      <p className="mb-4 text-lg opacity-80">{t.creditsIntro}</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {credits.map((c) => {
          const name = NAMES[c.id]
          return (
          <li key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <button
              onClick={() => void say({ clip: c.file })}
              className="text-2xl font-semibold active:scale-95"
              aria-label={t.listenTo(name?.[lang] ?? c.id)}
            >
              {name ? `${name.emoji} ${name[lang]}` : c.id} 🔈
            </button>
            <p className="mt-1 text-sm break-words">
              <a href={c.source} target="_blank" rel="noreferrer" className="underline">
                {c.title}
              </a>{' '}
              — {c.author}
            </p>
            <p className="text-sm opacity-70">
              {c.licenseUrl ? (
                <a href={c.licenseUrl} target="_blank" rel="noreferrer" className="underline">
                  {c.license}
                </a>
              ) : (
                c.license
              )}
            </p>
          </li>
          )
        })}
      </ul>
      <p className="mt-6 text-sm opacity-70">{t.creditsShareAlike}</p>
    </Screen>
  )
}
