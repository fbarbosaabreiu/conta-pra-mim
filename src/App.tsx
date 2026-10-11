import { Navigate, Route, Routes } from 'react-router'
import Home from './pages/Home'
import Credits from './pages/Credits'
import StoryList from './modules/stories/StoryList'
import StoryReader from './modules/stories/StoryReader'
import QuizHome from './modules/quiz/QuizHome'
import QuizRunner from './modules/quiz/QuizRunner'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/historias" element={<StoryList />} />
      <Route path="/historias/:id" element={<StoryReader />} />
      <Route path="/quiz" element={<QuizHome />} />
      <Route path="/quiz/:theme" element={<QuizRunner />} />
      <Route path="/creditos" element={<Credits />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
