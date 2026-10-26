import { MoonIcon, SunIcon } from './Icons.jsx'

export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark'
  return (
    <button type="button" className="icon-btn" onClick={onToggle} aria-label={dark ? '라이트모드로 전환' : '다크모드로 전환'}>
      {dark ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
