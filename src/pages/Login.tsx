import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { motion } from 'framer-motion'
import { LanguagePicker } from '../components/LanguagePicker'
import { useLang, type Lang } from '../i18n'
import { recoveryLinkFailed, sendPasswordReset, setNewPassword, signIn, signUp, useSession } from '../lib/auth'
import { track } from '../lib/analytics'
import { PRIVACY_LINK } from './Privacy'

const NB = ' '
const MIN_PASSWORD = 6

type Mode = 'signin' | 'signup' | 'forgot' | 'recovery'

type Texts = {
  intro: Record<Mode, string>
  email: string
  password: string
  newPassword: string
  show: string
  hide: string
  submit: Record<Mode, string>
  busy: string
  toSignup: string
  toSignin: string
  forgot: string
  back: string
  later: string
  resetSent: string
  badEmail: string
  shortPassword: string
  wrongLogin: string
  exists: string
  needsConfirm: string
  samePassword: string
  linkFailed: string
  tooMany: string
  offline: string
  privacy: string
}

const T: Record<Lang, Texts> = {
  pt: {
    intro: {
      signin: 'Para o adulto: entre para recuperar o progresso guardado.',
      signup: 'Para o adulto: crie uma conta grátis para guardar o progresso e continuar em outro aparelho. É opcional.',
      forgot: 'Digite seu e-mail e mandaremos um link para criar uma senha nova.',
      recovery: 'Escolha sua senha nova.',
    },
    email: 'Seu e-mail',
    password: 'Senha',
    newPassword: `Senha nova (mínimo ${MIN_PASSWORD} caracteres)`,
    show: 'Mostrar senha',
    hide: 'Esconder senha',
    submit: { signin: 'Entrar', signup: 'Criar conta', forgot: 'Mandar link', recovery: 'Salvar senha nova' },
    busy: 'Um instante…',
    toSignup: 'Primeira vez? Criar conta',
    toSignin: 'Já tenho conta. Entrar',
    forgot: 'Esqueci a senha',
    back: 'Voltar',
    later: 'Agora não',
    resetSent: 'Se esse e-mail tiver conta, mandamos um link para criar uma senha nova. Veja também o spam.',
    badEmail: 'Confira o e-mail digitado.',
    shortPassword: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`,
    wrongLogin: 'E-mail ou senha errados.',
    exists: 'Esse e-mail já tem conta. Toque em “Já tenho conta. Entrar”.',
    needsConfirm: 'Mandamos um e-mail para confirmar a conta. Abra o link e depois entre aqui.',
    samePassword: 'A senha nova precisa ser diferente da antiga.',
    linkFailed: 'O link venceu ou já foi usado. Peça outro aqui.',
    tooMany: 'Muitas tentativas. Espere um pouco e tente de novo.',
    offline: 'Sem internet. Conecte-se para entrar (depois o app funciona offline).',
    privacy: 'Usamos o e-mail só para o seu acesso.',
  },
  en: {
    intro: {
      signin: 'For the grown-up: sign in to get your saved progress back.',
      signup: 'For the grown-up: create a free account to save progress and continue on another device. It’s optional.',
      forgot: 'Enter your email and we’ll send you a link to create a new password.',
      recovery: 'Choose your new password.',
    },
    email: 'Your email',
    password: 'Password',
    newPassword: `New password (at least ${MIN_PASSWORD} characters)`,
    show: 'Show password',
    hide: 'Hide password',
    submit: { signin: 'Sign in', signup: 'Create account', forgot: 'Send link', recovery: 'Save new password' },
    busy: 'One moment…',
    toSignup: 'First time? Create an account',
    toSignin: 'I have an account. Sign in',
    forgot: 'Forgot password',
    back: 'Back',
    later: 'Not now',
    resetSent: 'If this email has an account, we sent a link to create a new password. Check your spam folder too.',
    badEmail: 'Please check the email address.',
    shortPassword: `The password needs at least ${MIN_PASSWORD} characters.`,
    wrongLogin: 'Wrong email or password.',
    exists: 'This email already has an account. Tap “I have an account. Sign in”.',
    needsConfirm: 'We sent an email to confirm your account. Open the link, then sign in here.',
    samePassword: 'The new password must be different from the old one.',
    linkFailed: 'The link expired or was already used. Ask for another one here.',
    tooMany: 'Too many attempts. Wait a little and try again.',
    offline: 'No internet. Connect to sign in (afterwards the app works offline).',
    privacy: 'We only use your email for your access.',
  },
  es: {
    intro: {
      signin: 'Para el adulto: entra para recuperar el progreso guardado.',
      signup: 'Para el adulto: crea una cuenta gratis para guardar el progreso y seguir en otro dispositivo. Es opcional.',
      forgot: 'Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.',
      recovery: 'Elige tu contraseña nueva.',
    },
    email: 'Tu correo',
    password: 'Contraseña',
    newPassword: `Contraseña nueva (mínimo ${MIN_PASSWORD} caracteres)`,
    show: 'Mostrar contraseña',
    hide: 'Ocultar contraseña',
    submit: { signin: 'Entrar', signup: 'Crear cuenta', forgot: 'Enviar enlace', recovery: 'Guardar contraseña nueva' },
    busy: 'Un momento…',
    toSignup: '¿Primera vez? Crear cuenta',
    toSignin: 'Ya tengo cuenta. Entrar',
    forgot: 'Olvidé la contraseña',
    back: 'Volver',
    later: 'Ahora no',
    resetSent: 'Si este correo tiene cuenta, enviamos un enlace para crear una contraseña nueva. Revisa también el spam.',
    badEmail: 'Revisa el correo escrito.',
    shortPassword: `La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`,
    wrongLogin: 'Correo o contraseña incorrectos.',
    exists: 'Este correo ya tiene cuenta. Toca “Ya tengo cuenta. Entrar”.',
    needsConfirm: 'Enviamos un correo para confirmar la cuenta. Abre el enlace y luego entra aquí.',
    samePassword: 'La contraseña nueva debe ser distinta de la anterior.',
    linkFailed: 'El enlace venció o ya se usó. Pide otro aquí.',
    tooMany: 'Demasiados intentos. Espera un poco y vuelve a intentarlo.',
    offline: 'Sin internet. Conéctate para entrar (después la app funciona sin conexión).',
    privacy: 'Usamos el correo solo para tu acceso.',
  },
  fr: {
    intro: {
      signin: `Pour l’adulte${NB}: connectez-vous pour retrouver la progression enregistrée.`,
      signup: `Pour l’adulte${NB}: créez un compte gratuit pour garder la progression et continuer sur un autre appareil. C’est facultatif.`,
      forgot: 'Saisissez votre e-mail et nous vous enverrons un lien pour créer un nouveau mot de passe.',
      recovery: 'Choisissez votre nouveau mot de passe.',
    },
    email: 'Votre e-mail',
    password: 'Mot de passe',
    newPassword: `Nouveau mot de passe (${MIN_PASSWORD} caractères minimum)`,
    show: 'Afficher le mot de passe',
    hide: 'Masquer le mot de passe',
    submit: { signin: 'Se connecter', signup: 'Créer un compte', forgot: 'Envoyer le lien', recovery: 'Enregistrer' },
    busy: 'Un instant…',
    toSignup: `Première fois${NB}? Créer un compte`,
    toSignin: 'J’ai déjà un compte. Se connecter',
    forgot: 'Mot de passe oublié',
    back: 'Retour',
    later: 'Pas maintenant',
    resetSent: 'Si cet e-mail a un compte, nous avons envoyé un lien pour créer un nouveau mot de passe. Regardez aussi les spams.',
    badEmail: 'Vérifiez l’adresse e-mail.',
    shortPassword: `Le mot de passe doit avoir au moins ${MIN_PASSWORD} caractères.`,
    wrongLogin: 'E-mail ou mot de passe incorrect.',
    exists: `Cet e-mail a déjà un compte. Touchez «${NB}J’ai déjà un compte. Se connecter${NB}».`,
    needsConfirm: 'Nous avons envoyé un e-mail pour confirmer le compte. Ouvrez le lien, puis connectez-vous ici.',
    samePassword: 'Le nouveau mot de passe doit être différent de l’ancien.',
    linkFailed: 'Le lien a expiré ou a déjà servi. Demandez-en un autre ici.',
    tooMany: 'Trop d’essais. Attendez un peu et réessayez.',
    offline: 'Pas d’internet. Connectez-vous pour entrer (ensuite l’appli marche hors ligne).',
    privacy: 'Nous utilisons l’e-mail uniquement pour votre accès.',
  },
}

/** Mensagem amigável para os erros mais comuns do Supabase. */
function friendly(err: unknown, t: Texts): string {
  const e = err as { status?: number; message?: string; code?: string }
  const code = e?.code ?? ''
  const msg = e?.message ?? ''
  if (!navigator.onLine) return t.offline
  if (code === 'invalid_credentials' || /invalid login/i.test(msg)) return t.wrongLogin
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered/i.test(msg)) return t.exists
  if (code === 'email_not_confirmed') return t.needsConfirm
  if (code === 'weak_password' || /password should/i.test(msg)) return t.shortPassword
  if (code === 'same_password') return t.samePassword
  if (e?.status === 429 || /rate|too many/i.test(msg)) return t.tooMany
  if (/expired|invalid.*(jwt|token)|session/i.test(msg)) return t.linkFailed
  if (/email/i.test(msg)) return t.badEmail
  return msg || String(err)
}

const field =
  'w-full rounded-2xl border-2 border-ink/15 bg-white px-4 py-3 text-xl outline-none focus:border-coral'
const primary =
  'tile-shadow w-full rounded-full bg-coral px-8 py-4 text-2xl font-semibold text-white active:scale-95 disabled:opacity-50'
const secondary = 'min-h-11 underline opacity-70'

export default function Login({ recovery = false, onRecovered }: { recovery?: boolean; onRecovered?: () => void }) {
  const lang = useLang()
  const t = T[lang]
  const session = useSession()
  const [mode, setMode] = useState<Mode>(recovery ? 'recovery' : recoveryLinkFailed ? 'forgot' : 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(recoveryLinkFailed && !recovery ? t.linkFailed : '')
  const [info, setInfo] = useState('')

  const needsEmail = mode !== 'recovery'
  const needsPassword = mode !== 'forgot'
  const newPassword = mode === 'signup' || mode === 'recovery'

  function go(next: Mode) {
    setMode(next)
    setError('')
    setInfo('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = email.trim().toLowerCase()
    if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return setError(t.badEmail)
    if (newPassword && password.length < MIN_PASSWORD) return setError(t.shortPassword)
    if (needsPassword && !password) return setError(t.wrongLogin)
    setBusy(true)
    setError('')
    setInfo('')
    try {
      // ao entrar, a sessão nova chega pelo onAuthStateChange e a tela volta para o início
      if (mode === 'signin') await signIn(clean, password)
      else if (mode === 'signup') {
        await signUp(clean, password)
        track('signup')
      }
      else if (mode === 'forgot') {
        await sendPasswordReset(clean)
        setInfo(t.resetSent)
      } else {
        await setNewPassword(password)
        onRecovered?.()
      }
    } catch (err) {
      setError(friendly(err, t))
    } finally {
      setBusy(false)
    }
  }

  // Já entrou (ou acabou de entrar): volta para o app.
  if (session && !recovery) return <Navigate to="/" replace />

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
        <p className="mt-3 text-lg opacity-75">{t.intro[mode]}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-4">
        {needsEmail && (
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
        )}
        {needsPassword && (
          <label className="flex flex-col gap-2 text-lg font-semibold">
            {newPassword && mode === 'recovery' ? t.newPassword : t.password}
            <span className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={newPassword ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${field} pr-14`}
              />
              <button
                type="button"
                aria-label={showPassword ? t.hide : t.show}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-1 flex min-w-11 items-center justify-center text-2xl"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </span>
          </label>
        )}
        <button type="submit" disabled={busy} className={primary}>
          {busy ? t.busy : t.submit[mode]}
        </button>

        <div className="flex flex-wrap justify-between gap-x-4 text-base">
          {mode === 'signin' && (
            <>
              <button type="button" className={secondary} onClick={() => go('signup')}>
                {t.toSignup}
              </button>
              <button type="button" className={secondary} onClick={() => go('forgot')}>
                {t.forgot}
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button type="button" className={secondary} onClick={() => go('signin')}>
              {t.toSignin}
            </button>
          )}
          {mode === 'forgot' && (
            <button type="button" className={secondary} onClick={() => go('signin')}>
              {t.back}
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="w-full rounded-2xl bg-coral/15 px-4 py-3 text-center text-lg font-semibold text-coral" role="alert">
          {error}
        </p>
      )}
      {info && !error && (
        <p className="text-center text-lg font-semibold" role="status">
          ✅ {info}
        </p>
      )}

      {recovery ? (
        <button type="button" className={secondary} onClick={() => onRecovered?.()}>
          {t.later}
        </button>
      ) : (
        <Link to="/" className={`${secondary} inline-flex items-center`}>
          {t.later}
        </Link>
      )}

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
