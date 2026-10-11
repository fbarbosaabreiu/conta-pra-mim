import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { LanguagePicker } from '../components/LanguagePicker'
import { useLang, type Lang } from '../i18n'
import { sendCode, verifyCode } from '../lib/auth'
import { PRIVACY_LINK } from './Privacy'

const NB = ' '

const T: Record<
  Lang,
  {
    title: string
    intro: string
    email: string
    send: string
    sending: string
    codeSent: (email: string) => string
    code: string
    enter: string
    entering: string
    otherEmail: string
    resend: string
    resent: string
    badEmail: string
    badCode: string
    tooMany: string
    offline: string
    privacy: string
  }
> = {
  pt: {
    title: 'Entrar',
    intro: 'Para o adulto: digite seu e-mail e enviaremos um código de 6 números. Na primeira vez, isso já cria sua conta.',
    email: 'Seu e-mail',
    send: 'Receber código',
    sending: 'Enviando…',
    codeSent: (e) => `Enviamos um código para ${e}. Ele pode levar um minutinho para chegar — veja também o spam.`,
    code: 'Código de 6 números',
    enter: 'Entrar',
    entering: 'Entrando…',
    otherEmail: 'Usar outro e-mail',
    resend: 'Reenviar código',
    resent: 'Código reenviado!',
    badEmail: 'Confira o e-mail digitado.',
    badCode: 'Código errado ou vencido. Confira ou peça outro.',
    tooMany: 'Muitas tentativas. Espere um minuto e tente de novo.',
    offline: 'Sem internet. Conecte-se para entrar (depois o app funciona offline).',
    privacy: 'Usamos o e-mail só para o seu acesso.',
  },
  en: {
    title: 'Sign in',
    intro: 'For the grown-up: enter your email and we’ll send you a 6-digit code. The first time, this also creates your account.',
    email: 'Your email',
    send: 'Get code',
    sending: 'Sending…',
    codeSent: (e) => `We sent a code to ${e}. It may take a minute to arrive — check your spam folder too.`,
    code: '6-digit code',
    enter: 'Sign in',
    entering: 'Signing in…',
    otherEmail: 'Use another email',
    resend: 'Resend code',
    resent: 'Code sent again!',
    badEmail: 'Please check the email address.',
    badCode: 'Wrong or expired code. Check it or ask for a new one.',
    tooMany: 'Too many attempts. Wait a minute and try again.',
    offline: 'No internet. Connect to sign in (afterwards the app works offline).',
    privacy: 'We only use your email for your access.',
  },
  es: {
    title: 'Entrar',
    intro: 'Para el adulto: escribe tu correo y te enviaremos un código de 6 números. La primera vez, esto ya crea tu cuenta.',
    email: 'Tu correo',
    send: 'Recibir código',
    sending: 'Enviando…',
    codeSent: (e) => `Enviamos un código a ${e}. Puede tardar un minutito en llegar: revisa también el spam.`,
    code: 'Código de 6 números',
    enter: 'Entrar',
    entering: 'Entrando…',
    otherEmail: 'Usar otro correo',
    resend: 'Reenviar código',
    resent: '¡Código reenviado!',
    badEmail: 'Revisa el correo escrito.',
    badCode: 'Código incorrecto o vencido. Revísalo o pide otro.',
    tooMany: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
    offline: 'Sin internet. Conéctate para entrar (después la app funciona sin conexión).',
    privacy: 'Usamos el correo solo para tu acceso.',
  },
  fr: {
    title: 'Connexion',
    intro: `Pour l’adulte${NB}: saisissez votre e-mail et nous vous enverrons un code à 6 chiffres. La première fois, cela crée aussi votre compte.`,
    email: 'Votre e-mail',
    send: 'Recevoir le code',
    sending: 'Envoi…',
    codeSent: (e) => `Nous avons envoyé un code à ${e}. Il peut mettre une minute à arriver — regardez aussi les spams.`,
    code: 'Code à 6 chiffres',
    enter: 'Se connecter',
    entering: 'Connexion…',
    otherEmail: 'Utiliser un autre e-mail',
    resend: 'Renvoyer le code',
    resent: `Code renvoyé${NB}!`,
    badEmail: 'Vérifiez l’adresse e-mail.',
    badCode: 'Code faux ou expiré. Vérifiez-le ou demandez-en un autre.',
    tooMany: `Trop d’essais. Attendez une minute et réessayez.`,
    offline: 'Pas d’internet. Connectez-vous pour entrer (ensuite l’appli marche hors ligne).',
    privacy: 'Nous utilisons l’e-mail uniquement pour votre accès.',
  },
}

/** Mensagem amigável para os erros mais comuns do Supabase. */
function friendly(err: unknown, t: (typeof T)[Lang]): string {
  const e = err as { status?: number; message?: string; code?: string }
  if (!navigator.onLine) return t.offline
  if (e?.status === 429 || /rate|too many/i.test(e?.message ?? '')) return t.tooMany
  if (/expired|invalid|token/i.test(e?.message ?? '') || e?.code === 'otp_expired') return t.badCode
  if (/email/i.test(e?.message ?? '')) return t.badEmail
  return e?.message ?? String(err)
}

const field =
  'w-full rounded-2xl border-2 border-ink/15 bg-white px-4 py-3 text-xl outline-none focus:border-coral'
const primary =
  'tile-shadow w-full rounded-full bg-coral px-8 py-4 text-2xl font-semibold text-white active:scale-95 disabled:opacity-50'

export default function Login() {
  const lang = useLang()
  const t = T[lang]
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function onSend(e?: FormEvent) {
    e?.preventDefault()
    const clean = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return setError(t.badEmail)
    setBusy(true)
    setError('')
    try {
      await sendCode(clean)
      setEmail(clean)
      if (step === 'code') setInfo(t.resent)
      setStep('code')
    } catch (err) {
      setError(friendly(err, t))
    } finally {
      setBusy(false)
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      // a sessão nova chega pelo onAuthStateChange e o app abre sozinho
      await verifyCode(email, code.replace(/\D/g, ''))
    } catch (err) {
      setError(friendly(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 py-8">
      <motion.div
        className="text-8xl"
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1 }}
        aria-hidden
      >
        🧸
      </motion.div>
      <div className="text-center">
        <h1 className="text-5xl font-bold">Fala Falinha</h1>
        <p className="mt-3 text-lg opacity-75">{t.intro}</p>
      </div>

      {step === 'email' ? (
        <form onSubmit={onSend} noValidate className="flex w-full flex-col gap-4">
          <label className="flex flex-col gap-2 text-lg font-semibold">
            {t.email}
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </label>
          <button type="submit" disabled={busy} className={primary}>
            {busy ? t.sending : t.send}
          </button>
        </form>
      ) : (
        <form onSubmit={onVerify} className="flex w-full flex-col gap-4">
          <p className="text-center text-lg" role="status">
            {t.codeSent(email)}
          </p>
          <label className="flex flex-col gap-2 text-lg font-semibold">
            {t.code}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={8}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${field} text-center text-3xl tracking-[0.4em]`}
            />
          </label>
          <button type="submit" disabled={busy || code.replace(/\D/g, '').length < 6} className={primary}>
            {busy ? t.entering : t.enter}
          </button>
          <div className="flex justify-between gap-4 text-base">
            <button
              type="button"
              className="min-h-11 underline opacity-70"
              onClick={() => {
                setStep('email')
                setCode('')
                setError('')
                setInfo('')
              }}
            >
              {t.otherEmail}
            </button>
            <button type="button" className="min-h-11 underline opacity-70" disabled={busy} onClick={() => void onSend()}>
              {t.resend}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="w-full rounded-2xl bg-coral/15 px-4 py-3 text-center text-lg font-semibold text-coral" role="alert">
          {error}
        </p>
      )}
      {info && !error && <p className="text-center text-lg font-semibold">✅ {info}</p>}

      <LanguagePicker />
      <p className="text-center text-sm opacity-60">
        {t.privacy}{' '}
        <Link to="/privacidade" className="inline-flex min-h-11 items-center underline">
          {PRIVACY_LINK[lang]}
        </Link>
      </p>
    </div>
  )
}
