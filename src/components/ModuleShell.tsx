import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { moduleBySlug, neighbours } from '../lib/curriculum'

export function ModuleShell({ slug, children }: { slug: string; children: ReactNode }) {
  const module = moduleBySlug(slug)
  const { previous, next } = neighbours(slug)
  if (!module) return <p>Unknown module.</p>

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">
          {module.part} · Module {module.number} · {module.minutes} min
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{module.title}</h1>
        <p className="text-lg text-ink-2">{module.blurb}</p>
      </header>

      <div className="flex flex-col gap-10">{children}</div>

      <nav className="mt-4 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
        {previous ? (
          <Link to={previous.path} className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-network">
            <span className="text-xs uppercase tracking-wider text-ink-3">Previous</span>
            <span className="mt-1 block text-sm font-medium text-ink">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={next.path}
            className="rounded-xl border border-line bg-surface p-4 text-right transition-colors hover:border-network"
          >
            <span className="text-xs uppercase tracking-wider text-ink-3">Next</span>
            <span className="mt-1 block text-sm font-medium text-ink">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
