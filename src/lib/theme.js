import { useEffect, useState } from 'react'

const KEY = 'cheetahquiz-theme'

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#2A1C12' : '#FFF9F0')
    try {
      localStorage.setItem(KEY, theme)
    } catch {}
  }, [theme])

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}
