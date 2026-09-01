import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  isDark: boolean
  toggle: () => void
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = 'lns-theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  // index.html already applied the class before paint; trust it.
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    root.style.colorScheme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Private mode or blocked storage — the toggle still works for this visit.
    }
  }, [theme])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])
  const toggle = useCallback(() => setThemeState((current) => (current === 'dark' ? 'light' : 'dark')), [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, isDark: theme === 'dark', toggle, setTheme }),
    [theme, toggle, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}

/**
 * The 3D scenes cannot read Tailwind classes, so they take explicit colors.
 * These mirror the CSS custom properties in index.css.
 */
export type ScenePalette = {
  background: string
  network: string
  subnet: string
  host: string
  accent: string
  neutral: string
  edge: string
  label: string
  labelMuted: string
  surface: string
  danger: string
  ok: string
}

const LIGHT_PALETTE: ScenePalette = {
  background: '#eef1f6',
  network: '#2563eb',
  subnet: '#0d9488',
  host: '#f59e0b',
  accent: '#7c3aed',
  neutral: '#94a3b8',
  edge: '#334155',
  label: '#0f172a',
  labelMuted: '#64748b',
  surface: '#ffffff',
  danger: '#dc2626',
  ok: '#16a34a',
}

const DARK_PALETTE: ScenePalette = {
  background: '#0d131c',
  network: '#60a5fa',
  subnet: '#2dd4bf',
  host: '#fbbf24',
  accent: '#a78bfa',
  neutral: '#64748b',
  edge: '#cbd5e1',
  label: '#e2e8f0',
  labelMuted: '#94a3b8',
  surface: '#1a2230',
  danger: '#f87171',
  ok: '#4ade80',
}

export function useScenePalette(): ScenePalette {
  const { isDark } = useTheme()
  return isDark ? DARK_PALETTE : LIGHT_PALETTE
}
