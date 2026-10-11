import { Screen } from '../components/Screen'
import credits from '../content/sound-credits.json'
import { say } from '../lib/speech'

const NAMES: Record<string, string> = {
  vaca: '🐮 Vaca',
  porco: '🐷 Porco',
  pato: '🦆 Pato',
  ovelha: '🐑 Ovelha',
  galo: '🐓 Galo',
  galinha: '🐔 Galinha',
  gato: '🐱 Gato',
  cachorro: '🐶 Cachorro',
  sapo: '🐸 Sapo',
  leao: '🦁 Leão',
  abelha: '🐝 Abelha',
  passarinho: '🐦 Passarinho',
}

/** Atribuição exigida pelas licenças CC BY / CC BY-SA das gravações. */
export default function Credits() {
  return (
    <Screen title="Créditos dos sons" back="/">
      <p className="mb-4 text-lg opacity-80">
        Gravações reais de animais do Wikimedia Commons. Todas foram recortadas, tiveram o volume normalizado e foram
        convertidas para MP3. Toque no nome para ouvir.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {credits.map((c) => (
          <li key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <button
              onClick={() => void say({ clip: c.file })}
              className="text-2xl font-semibold active:scale-95"
              aria-label={`Ouvir ${c.id}`}
            >
              {NAMES[c.id] ?? c.id} 🔈
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
        ))}
      </ul>
      <p className="mt-6 text-sm opacity-70">
        Os arquivos adaptados sob CC BY-SA continuam disponíveis sob a mesma licença.
      </p>
    </Screen>
  )
}
