import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang, type Lang } from '../i18n'
import { Screen } from '../components/Screen'
import { analyticsEnabled, forgetMe, getDeviceId, setConsent, shortCode, useConsent } from '../lib/analytics'
import { playTap } from '../lib/sfx'
import { authEnabled, deleteAccount, signOut, useSession } from '../lib/auth'

// Aviso de consentimento (tela inicial) e tela "Privacidade". Escrito para o adulto.

interface Copy {
  link: string
  bannerTitle: string
  bannerBody: string
  accept: string
  decline: string
  more: string
  title: string
  intro: string
  collectTitle: string
  collect: string[]
  neverTitle: string
  never: string[]
  why: string
  statusOn: string
  statusOff: string
  deviceCode: (code: string) => string
  turnOn: string
  turnOff: string
  erase: string
  erased: string
  eraseFailed: string
  accountTitle: string
  account: string[]
  signedInAs: (email: string) => string
  signOut: string
  deleteAccount: string
  deleteConfirm: string
  deleteFailed: string
}

const COPY: Record<Lang, Copy> = {
  pt: {
    link: 'Privacidade',
    bannerTitle: '📊 Podemos medir o uso do app?',
    bannerBody:
      'De forma anônima: quais histórias e brincadeiras são usadas, quando, e a cidade aproximada. Nada de nome, fotos, voz ou localização exata.',
    accept: 'Pode medir',
    decline: 'Agora não',
    more: 'Saiba mais',
    title: 'Privacidade',
    intro: 'Para melhorar as histórias, o Fala Falinha pode medir o uso do app — só se você deixar.',
    collectTitle: 'O que é registrado',
    collect: [
      'Um código aleatório deste aparelho (não identifica ninguém).',
      'Quando o app é aberto e quais histórias e brincadeiras são usadas.',
      'Data e hora, idioma do app e tipo de aparelho (iPhone, Android…).',
      'Cidade e país aproximados, deduzidos da conexão de internet.',
    ],
    neverTitle: 'O que nunca é registrado',
    never: ['Nomes, e-mail ou telefone (a medição nunca usa o e-mail da sua conta).', 'Fotos, voz ou o que a criança fala.', 'Localização exata (GPS) ou o endereço de internet.'],
    why: 'Os dados servem só para saber quais histórias as famílias mais usam e melhorar o app. Não são vendidos nem compartilhados.',
    statusOn: 'A medição está ligada.',
    statusOff: 'A medição está desligada.',
    deviceCode: (c) => `Código deste aparelho: ${c}`,
    turnOn: 'Ligar a medição',
    turnOff: 'Desligar a medição',
    erase: 'Apagar os dados deste aparelho',
    erased: 'Pronto: os dados deste aparelho foram apagados e a medição foi desligada.',
    eraseFailed: 'A medição foi desligada, mas não deu para apagar agora (sem internet?). Tente de novo mais tarde.',
    accountTitle: 'Sua conta',
    account: [
      'Para entrar, guardamos só o e-mail do adulto, no Supabase (servidores em São Paulo, Brasil).',
      'O e-mail serve apenas para o acesso: não mandamos propaganda nem o compartilhamos.',
      'Você pode apagar a conta quando quiser, aqui embaixo.',
    ],
    signedInAs: (e) => `Conectado como ${e}`,
    signOut: 'Sair',
    deleteAccount: 'Apagar minha conta',
    deleteConfirm: 'Apagar sua conta e seu e-mail? Isso não pode ser desfeito.',
    deleteFailed: 'Não deu para apagar agora (sem internet?). Tente de novo mais tarde.',
  },
  en: {
    link: 'Privacy',
    bannerTitle: '📊 May we measure app usage?',
    bannerBody:
      'Anonymously: which stories and games are used, when, and the approximate city. No names, photos, voice or exact location.',
    accept: 'Yes, measure',
    decline: 'Not now',
    more: 'Learn more',
    title: 'Privacy',
    intro: 'To improve the stories, Fala Falinha can measure how the app is used — only if you allow it.',
    collectTitle: 'What is recorded',
    collect: [
      'A random code for this device (it doesn’t identify anyone).',
      'When the app is opened and which stories and games are used.',
      'Date and time, app language and device type (iPhone, Android…).',
      'Approximate city and country, inferred from the internet connection.',
    ],
    neverTitle: 'What is never recorded',
    never: ['Names, email or phone number (measurement never uses your account email).', 'Photos, voice or what your child says.', 'Exact location (GPS) or the IP address.'],
    why: 'The data is only used to learn which stories families use most and to improve the app. It is never sold or shared.',
    statusOn: 'Measurement is on.',
    statusOff: 'Measurement is off.',
    deviceCode: (c) => `This device’s code: ${c}`,
    turnOn: 'Turn measurement on',
    turnOff: 'Turn measurement off',
    erase: 'Erase this device’s data',
    erased: 'Done: this device’s data was erased and measurement was turned off.',
    eraseFailed: 'Measurement was turned off, but the data couldn’t be erased right now (offline?). Please try again later.',
    accountTitle: 'Your account',
    account: [
      'To sign in, we only store the grown-up’s email, at Supabase (servers in São Paulo, Brazil).',
      'The email is only used for access: we don’t send ads or share it.',
      'You can delete your account at any time, below.',
    ],
    signedInAs: (e) => `Signed in as ${e}`,
    signOut: 'Sign out',
    deleteAccount: 'Delete my account',
    deleteConfirm: 'Delete your account and email? This cannot be undone.',
    deleteFailed: 'Couldn’t delete it now (offline?). Please try again later.',
  },
  es: {
    link: 'Privacidad',
    bannerTitle: '📊 ¿Podemos medir el uso de la app?',
    bannerBody:
      'De forma anónima: qué cuentos y juegos se usan, cuándo y la ciudad aproximada. Nada de nombres, fotos, voz ni ubicación exacta.',
    accept: 'Sí, medir',
    decline: 'Ahora no',
    more: 'Saber más',
    title: 'Privacidad',
    intro: 'Para mejorar los cuentos, Fala Falinha puede medir el uso de la app, solo si lo permites.',
    collectTitle: 'Qué se registra',
    collect: [
      'Un código aleatorio de este dispositivo (no identifica a nadie).',
      'Cuándo se abre la app y qué cuentos y juegos se usan.',
      'Fecha y hora, idioma de la app y tipo de dispositivo (iPhone, Android…).',
      'Ciudad y país aproximados, deducidos de la conexión a internet.',
    ],
    neverTitle: 'Qué nunca se registra',
    never: ['Nombres, correo o teléfono (la medición nunca usa el correo de tu cuenta).', 'Fotos, voz ni lo que dice el niño.', 'Ubicación exacta (GPS) ni la dirección IP.'],
    why: 'Los datos solo sirven para saber qué cuentos usan más las familias y mejorar la app. Nunca se venden ni se comparten.',
    statusOn: 'La medición está activada.',
    statusOff: 'La medición está desactivada.',
    deviceCode: (c) => `Código de este dispositivo: ${c}`,
    turnOn: 'Activar la medición',
    turnOff: 'Desactivar la medición',
    erase: 'Borrar los datos de este dispositivo',
    erased: 'Listo: se borraron los datos de este dispositivo y se desactivó la medición.',
    eraseFailed: 'La medición se desactivó, pero no se pudieron borrar los datos ahora (¿sin internet?). Inténtalo más tarde.',
    accountTitle: 'Tu cuenta',
    account: [
      'Para entrar, solo guardamos el correo del adulto, en Supabase (servidores en São Paulo, Brasil).',
      'El correo solo sirve para el acceso: no enviamos publicidad ni lo compartimos.',
      'Puedes borrar tu cuenta cuando quieras, aquí abajo.',
    ],
    signedInAs: (e) => `Conectado como ${e}`,
    signOut: 'Salir',
    deleteAccount: 'Borrar mi cuenta',
    deleteConfirm: '¿Borrar tu cuenta y tu correo? No se puede deshacer.',
    deleteFailed: 'No se pudo borrar ahora (¿sin internet?). Inténtalo más tarde.',
  },
  fr: {
    link: 'Confidentialité',
    bannerTitle: '📊 Peut-on mesurer l’utilisation de l’appli ?',
    bannerBody:
      'De façon anonyme : quelles histoires et quels jeux sont utilisés, quand, et la ville approximative. Ni nom, ni photo, ni voix, ni position exacte.',
    accept: 'Oui, mesurer',
    decline: 'Pas maintenant',
    more: 'En savoir plus',
    title: 'Confidentialité',
    intro: 'Pour améliorer les histoires, Fala Falinha peut mesurer l’utilisation de l’appli — seulement si vous l’acceptez.',
    collectTitle: 'Ce qui est enregistré',
    collect: [
      'Un code aléatoire pour cet appareil (il n’identifie personne).',
      'Quand l’appli est ouverte et quelles histoires et quels jeux sont utilisés.',
      'Date et heure, langue de l’appli et type d’appareil (iPhone, Android…).',
      'Ville et pays approximatifs, déduits de la connexion internet.',
    ],
    neverTitle: 'Ce qui n’est jamais enregistré',
    never: ['Noms, e-mail ou téléphone (la mesure n’utilise jamais l’e-mail de votre compte).', 'Photos, voix ou ce que dit l’enfant.', 'Position exacte (GPS) ou l’adresse IP.'],
    why: 'Les données servent uniquement à savoir quelles histoires les familles utilisent le plus et à améliorer l’appli. Elles ne sont jamais vendues ni partagées.',
    statusOn: 'La mesure est activée.',
    statusOff: 'La mesure est désactivée.',
    deviceCode: (c) => `Code de cet appareil : ${c}`,
    turnOn: 'Activer la mesure',
    turnOff: 'Désactiver la mesure',
    erase: 'Effacer les données de cet appareil',
    erased: 'C’est fait : les données de cet appareil ont été effacées et la mesure est désactivée.',
    eraseFailed: 'La mesure est désactivée, mais l’effacement n’a pas pu se faire (hors ligne ?). Réessayez plus tard.',
    accountTitle: 'Votre compte',
    account: [
      'Pour se connecter, nous gardons uniquement l’e-mail de l’adulte, chez Supabase (serveurs à São Paulo, Brésil).',
      'L’e-mail sert seulement à l’accès : pas de publicité, aucun partage.',
      'Vous pouvez supprimer votre compte à tout moment, ci-dessous.',
    ],
    signedInAs: (e) => `Connecté : ${e}`,
    signOut: 'Se déconnecter',
    deleteAccount: 'Supprimer mon compte',
    deleteConfirm: 'Supprimer votre compte et votre e-mail ? C’est définitif.',
    deleteFailed: 'Impossible de supprimer maintenant (hors ligne ?). Réessayez plus tard.',
  },
}

/** Rótulo do link "Privacidade" na tela inicial. */
export const PRIVACY_LINK: Record<Lang, string> = {
  pt: COPY.pt.link,
  en: COPY.en.link,
  es: COPY.es.link,
  fr: COPY.fr.link,
}

/** Aviso na tela inicial enquanto a pessoa ainda não escolheu. */
export function ConsentBanner() {
  const t = COPY[useLang()]
  const consent = useConsent()
  const { pathname } = useLocation()
  const show = analyticsEnabled && consent === null && pathname === '/'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label={t.bannerTitle}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.6 }}
          className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4"
        >
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
            <p className="text-lg font-semibold">{t.bannerTitle}</p>
            <p className="mt-1 text-base opacity-80">{t.bannerBody}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  playTap()
                  setConsent('granted')
                }}
                className="rounded-full bg-sky px-5 py-2.5 text-lg font-semibold text-white active:scale-95"
              >
                {t.accept}
              </button>
              <button
                onClick={() => {
                  playTap()
                  setConsent('denied')
                }}
                className="rounded-full bg-black/5 px-5 py-2.5 text-lg font-semibold active:scale-95"
              >
                {t.decline}
              </button>
              <Link to="/privacidade" className="ml-auto text-base underline opacity-70">
                {t.more}
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Privacy() {
  const t = COPY[useLang()]
  const consent = useConsent()
  const [message, setMessage] = useState<string | null>(null)
  const device = consent === 'granted' ? getDeviceId() : null
  const session = useSession()
  const [accountMsg, setAccountMsg] = useState<string | null>(null)

  return (
    <Screen title={t.title} back="/">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 text-lg">
        <p>{t.intro}</p>
        <section>
          <h2 className="mb-2 text-xl font-semibold">{t.collectTitle}</h2>
          <ul className="flex flex-col gap-1.5">
            {t.collect.map((c) => (
              <li key={c}>✅ {c}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold">{t.neverTitle}</h2>
          <ul className="flex flex-col gap-1.5">
            {t.never.map((c) => (
              <li key={c}>🚫 {c}</li>
            ))}
          </ul>
        </section>
        <p className="opacity-80">{t.why}</p>

        {authEnabled && (
          <section>
            <h2 className="mb-2 text-xl font-semibold">{t.accountTitle}</h2>
            <ul className="flex flex-col gap-1.5">
              {t.account.map((c) => (
                <li key={c}>🔐 {c}</li>
              ))}
            </ul>
            {session && (
              <div className="mt-3 rounded-3xl bg-white p-4 shadow-sm">
                <p className="font-semibold">{t.signedInAs(session.user.email ?? '')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => void signOut()}
                    className="min-h-11 rounded-full bg-black/5 px-5 py-2.5 font-semibold active:scale-95"
                  >
                    {t.signOut}
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm(t.deleteConfirm)) return
                      try {
                        await deleteAccount()
                      } catch {
                        setAccountMsg(t.deleteFailed)
                      }
                    }}
                    className="min-h-11 rounded-full bg-coral px-5 py-2.5 font-semibold text-white active:scale-95"
                  >
                    {t.deleteAccount}
                  </button>
                </div>
                {accountMsg && <p className="mt-2 text-base">{accountMsg}</p>}
              </div>
            )}
          </section>
        )}

        {analyticsEnabled && (
          <section className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="font-semibold">{consent === 'granted' ? t.statusOn : t.statusOff}</p>
            {device && <p className="mt-1 text-base opacity-70">{t.deviceCode(shortCode(device))}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {consent === 'granted' ? (
                <>
                  <button
                    onClick={() => {
                      playTap()
                      setConsent('denied')
                      setMessage(null)
                    }}
                    className="rounded-full bg-black/5 px-5 py-2.5 font-semibold active:scale-95"
                  >
                    {t.turnOff}
                  </button>
                  <button
                    onClick={async () => {
                      playTap()
                      setMessage((await forgetMe()) ? t.erased : t.eraseFailed)
                    }}
                    className="rounded-full bg-coral px-5 py-2.5 font-semibold text-white active:scale-95"
                  >
                    {t.erase}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    playTap()
                    setConsent('granted')
                    setMessage(null)
                  }}
                  className="rounded-full bg-sky px-5 py-2.5 font-semibold text-white active:scale-95"
                >
                  {t.turnOn}
                </button>
              )}
            </div>
            {message && <p className="mt-3 text-base">{message}</p>}
          </section>
        )}
      </div>
    </Screen>
  )
}
