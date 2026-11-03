import { Navigate, Route, Routes } from 'react-router-dom'
import { useTheme } from './lib/theme.js'
import Home from './pages/Home.jsx'
import Quiz from './pages/Quiz.jsx'
import Certificate from './pages/Certificate.jsx'

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const themeProps = { theme, onToggleTheme: toggleTheme }

  return (
    <Routes>
      <Route path="/" element={<Home {...themeProps} />} />
      <Route path="/quiz/:grade" element={<Quiz {...themeProps} />} />
      <Route path="/certificate/:grade" element={<Certificate {...themeProps} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
