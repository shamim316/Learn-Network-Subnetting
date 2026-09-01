import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { GLOSSARY_BY_ID } from '../lib/glossary'

/**
 * An inline glossary reference. Hover or focus reveals the definition; clicking
 * pins it open so the reader can select the text or follow through to the full
 * glossary entry.
 */
export function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const entry = GLOSSARY_BY_ID[id]
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const popoverId = useId()

  if (!entry) return <span className="text-danger">[missing term: {id}]</span>

  const open = hovered || pinned

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? popoverId : undefined}
        onClick={() => setPinned((value) => !value)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="cursor-help border-b border-dashed border-network/60 font-medium text-ink decoration-network hover:border-network"
      >
        {children ?? entry.term}
      </button>
      {open ? (
        <span
          id={popoverId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-40 mb-2 block w-[min(20rem,78vw)] -translate-x-1/2 rounded-lg border border-line bg-surface p-3 text-left shadow-lg shadow-black/10"
        >
          <span className="block text-sm font-semibold text-ink">{entry.term}</span>
          {entry.aka ? <span className="block text-xs text-ink-3">also: {entry.aka}</span> : null}
          <span className="mt-1.5 block text-sm leading-6 font-normal text-ink-2">{entry.short}</span>
          {entry.example ? <span className="bits mt-1.5 block text-xs text-ink-3">{entry.example}</span> : null}
          <Link
            to={`/glossary#${entry.id}`}
            className="mt-2 inline-block text-xs font-medium text-network hover:underline"
          >
            Full definition →
          </Link>
        </span>
      ) : null}
    </span>
  )
}
