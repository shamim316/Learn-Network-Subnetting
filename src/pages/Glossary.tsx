import { useMemo, useState } from 'react'
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryCategory } from '../lib/glossary'
import { inputClass } from '../components/ui'

export function GlossaryPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<GlossaryCategory | 'All'>('All')

  const entries = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return GLOSSARY.filter((entry) => {
      const matchesCategory = category === 'All' || entry.category === category
      if (!matchesCategory) return false
      if (!needle) return true
      return (
        entry.term.toLowerCase().includes(needle) ||
        (entry.aka ?? '').toLowerCase().includes(needle) ||
        entry.short.toLowerCase().includes(needle) ||
        entry.long.toLowerCase().includes(needle)
      )
    }).sort((a, b) => a.term.localeCompare(b.term))
  }, [query, category])

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Glossary</h1>
        <p className="text-lg text-ink-2">
          Every component named in the course, defined once. The dotted terms throughout the modules link back here.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <input
          className={`${inputClass} font-sans`}
          placeholder="Search terms and definitions…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {(['All', ...GLOSSARY_CATEGORIES] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                category === option ? 'border-network bg-network/10 text-network' : 'border-line text-ink-2 hover:border-line-strong'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-3">
          {entries.length} of {GLOSSARY.length} terms
        </p>
      </div>

      <dl className="flex flex-col gap-4">
        {entries.map((entry) => (
          <div key={entry.id} id={entry.id} className="scroll-mt-24 rounded-xl border border-line bg-surface p-5">
            <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-lg font-semibold text-ink">{entry.term}</span>
              {entry.aka ? <span className="text-xs text-ink-3">also: {entry.aka}</span> : null}
              <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-ink-3">
                {entry.category}
              </span>
            </dt>
            <dd className="mt-2 text-sm font-medium text-ink-2">{entry.short}</dd>
            <dd className="mt-2 text-sm leading-7 text-ink-2">{entry.long}</dd>
            {entry.example ? (
              <dd className="bits mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-2">{entry.example}</dd>
            ) : null}
          </div>
        ))}
      </dl>

      {entries.length === 0 ? <p className="text-sm text-ink-3">No terms match that search.</p> : null}
    </div>
  )
}
