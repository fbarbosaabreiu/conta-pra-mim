import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
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
import { authEnabled, recoveryLink } from './lib/auth'
import Login from './pages/Login'
import AgeGuide from './pages/AgeGuide'
import { SessionReminder } from './components/SessionReminder'

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

  // A conta é opcional (só para guardar o progresso): o app abre sem login e a tela de entrar fica
  // em /entrar. Quem chega pelo link de "esqueci a senha" escolhe a senha nova antes de seguir.
  const [recovering, setRecovering] = useState(recoveryLink)
  if (recovering) return <Login recovery onRecovered={() => setRecovering(false)} />

  return (
    <>
    <ConsentBanner />
    <SessionReminder />
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
      {authEnabled && <Route path="/entrar" element={<Login />} />}
      <Route path="/guia" element={<AgeGuide />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
