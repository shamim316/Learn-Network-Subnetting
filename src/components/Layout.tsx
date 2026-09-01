import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { MODULES, PARTS, TOOLS } from '../lib/curriculum'
import { useTheme } from '../theme'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  )
}

export function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-2.5 py-1.5 text-sm transition-colors ${
    isActive ? 'bg-network/10 font-medium text-network' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
  }`

function CourseNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-6 text-sm">
      <div>
        <p className="mb-2 px-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-3">Start</p>
        <NavLink to="/" end className={navLinkClass} onClick={onNavigate}>
          Overview
        </NavLink>
      </div>
      {PARTS.map((part) => (
        <div key={part.title}>
          <p className="mb-2 px-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-3">{part.title}</p>
          <div className="flex flex-col gap-0.5">
            {part.modules.map((module) => (
              <NavLink key={module.slug} to={module.path} className={navLinkClass} onClick={onNavigate}>
                <span className="mr-2 font-mono text-xs text-ink-3">{String(module.number).padStart(2, '0')}</span>
                {module.title}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
      <div>
        <p className="mb-2 px-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-3">Tools</p>
        <div className="flex flex-col gap-0.5">
          {TOOLS.map((tool) => (
            <NavLink key={tool.path} to={tool.path} className={navLinkClass} onClick={onNavigate}>
              {tool.title}
            </NavLink>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 px-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-3">Reference</p>
        <NavLink to="/glossary" className={navLinkClass} onClick={onNavigate}>
          Glossary
        </NavLink>
      </div>
    </nav>
  )
}

export function Layout() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const progress = MODULES.findIndex((module) => module.path === location.pathname)

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] items-center gap-4 px-4 py-3">
          <button
            type="button"
            className="rounded-lg border border-line px-2.5 py-1.5 text-sm text-ink-2 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle course navigation"
          >
            ☰
          </button>
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-ink">Subnetting in 3D</span>
            <span className="hidden text-xs text-ink-3 sm:inline">IPv4 &amp; IPv6 for network engineers</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {progress >= 0 ? (
              <span className="hidden text-xs text-ink-3 md:inline">
                Module {progress + 1} of {MODULES.length}
              </span>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem] gap-8 px-4 py-8">
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-64 shrink-0 overflow-y-auto pb-8 lg:block">
          <CourseNav />
        </aside>

        {menuOpen ? (
          <div className="fixed inset-0 top-[3.5rem] z-20 overflow-y-auto bg-bg p-4 lg:hidden">
            <CourseNav onNavigate={() => setMenuOpen(false)} />
          </div>
        ) : null}

        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-[90rem] px-4 py-6 text-xs text-ink-3">
          Built for teaching network engineering. Examples use RFC 1918 and RFC 5737/3849 documentation space, so nothing
          here can collide with a real network.
        </div>
      </footer>
    </div>
  )
}
