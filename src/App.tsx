import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { LANG_INFO, tr, useLang } from './i18n'
import Privacy, { ConsentBanner } from './pages/Privacy'
import { initAnalytics } from './lib/analytics'
import { stories } from './content/stories'
import Home from './pages/Home'
import Credits from './pages/Credits'
import HowTo from './pages/HowTo'
import { hasSeenOnboarding } from './lib/onboarding'
import StoryList from './modules/stories/StoryList'
import StoryReader from './modules/stories/StoryReader'
import QuizHome from './modules/quiz/QuizHome'
import QuizRunner from './modules/quiz/QuizRunner'
import BedtimeHome from './modules/bedtime/BedtimeHome'
import BedtimePlayer from './modules/bedtime/BedtimePlayer'
import { bedtimeAnalyticsId, bedtimeStories } from './content/bedtime'
import { authEnabled, recoveryLink, useSession } from './lib/auth'
import Login from './pages/Login'

/** Avaliado a cada vez que "/" abre (o App não re-renderiza ao trocar de rota). */
function HomeOrOnboarding() {
  return hasSeenOnboarding() ? <Home /> : <Navigate to="/como-usar" replace />
}

export default function App() {
  const lang = useLang()
  useEffect(() => {
    document.documentElement.lang = LANG_INFO[lang].locale
  }, [lang])

  // Medição de uso (só envia algo se a família aceitar no aviso da tela inicial).
  useEffect(
    () =>
      initAnalytics([
        ...stories.map((s) => ({ id: s.id, title: tr(s.title, 'pt') })),
        ...bedtimeStories.map((s) => ({ id: bedtimeAnalyticsId(s.id), title: `🌙 ${tr(s.title, 'pt')}` })),
      ]),
    [],
  )

  // Login (só quando o Supabase está configurado): sem sessão, abre a tela de entrar.
  // A privacidade fica aberta, para ser lida antes de criar a conta.
  // Quem chega pelo link de "esqueci a senha" escolhe a senha nova antes de entrar.
  const session = useSession()
  const { pathname } = useLocation()
  const [recovering, setRecovering] = useState(recoveryLink)
  if (recovering) return <Login recovery onRecovered={() => setRecovering(false)} />
  if (authEnabled && !session && pathname !== '/privacidade') {
    return session === undefined ? null : <Login />
  }

  return (
    <>
    <ConsentBanner />
    <Routes>
      {/* Primeira abertura: mostra o "Como usar" (que tem "Pular"). Links diretos não são desviados. */}
      <Route path="/" element={<HomeOrOnboarding />} />
      <Route path="/como-usar" element={<HowTo />} />
      <Route path="/historias" element={<StoryList />} />
      <Route path="/historias/:id" element={<StoryReader />} />
      <Route path="/quiz" element={<QuizHome />} />
      <Route path="/quiz/:theme" element={<QuizRunner />} />
      <Route path="/dormir" element={<BedtimeHome />} />
      <Route path="/dormir/:id" element={<BedtimePlayer />} />
      <Route path="/creditos" element={<Credits />} />
      <Route path="/privacidade" element={<Privacy />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
