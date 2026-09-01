import type { ReactNode } from 'react'
import { GLOSSARY_BY_ID } from '../lib/glossary'

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-lg leading-relaxed text-ink-2">{children}</p>
}

export function P({ children }: { children: ReactNode }) {
  return <p className="leading-7 text-ink-2">{children}</p>
}

export function H2({ children }: { children: string }) {
  const id = slugify(children)
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl font-semibold tracking-tight text-ink">
      <a href={`#${id}`} className="no-underline hover:text-network">
        {children}
      </a>
    </h2>
  )
}

export function H3({ children }: { children: string }) {
  const id = slugify(children)
  return (
    <h3 id={id} className="scroll-mt-24 text-lg font-semibold tracking-tight text-ink">
      {children}
    </h3>
  )
}

export function Section({ children }: { children: ReactNode }) {
  return <section className="flex flex-col gap-4">{children}</section>
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 pl-5 leading-7 text-ink-2 marker:text-ink-3">{children}</ul>
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="flex list-decimal flex-col gap-2 pl-5 leading-7 text-ink-2 marker:text-ink-3">{children}</ol>
}

export function Mono({ children, tone }: { children: ReactNode; tone?: 'network' | 'host' | 'subnet' | 'accent' }) {
  const toneClass =
    tone === 'network'
      ? 'text-network'
      : tone === 'host'
        ? 'text-host'
        : tone === 'subnet'
          ? 'text-subnet'
          : tone === 'accent'
            ? 'text-accent'
            : 'text-ink'
  return (
    <code className={`rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em] ${toneClass}`}>{children}</code>
  )
}

const CALLOUT_STYLES = {
  note: { border: 'border-l-network', label: 'Note', tint: 'bg-network/5' },
  tip: { border: 'border-l-ok', label: 'In practice', tint: 'bg-ok/5' },
  warn: { border: 'border-l-danger', label: 'Watch out', tint: 'bg-danger/5' },
  spec: { border: 'border-l-accent', label: 'Standards', tint: 'bg-accent/5' },
} as const

export function Callout({
  kind = 'note',
  title,
  children,
}: {
  kind?: keyof typeof CALLOUT_STYLES
  title?: string
  children: ReactNode
}) {
  const style = CALLOUT_STYLES[kind]
  return (
    <aside className={`rounded-r-lg border border-line border-l-4 ${style.border} ${style.tint} px-4 py-3`}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">{title ?? style.label}</p>
      <div className="flex flex-col gap-2 text-sm leading-6 text-ink-2">{children}</div>
    </aside>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface p-5 ${className}`}>{children}</div>
}

export function Figure({
  title,
  caption,
  children,
}: {
  title?: string
  caption?: ReactNode
  children: ReactNode
}) {
  return (
    <figure className="flex flex-col gap-0 overflow-hidden rounded-xl border border-line bg-surface">
      {title ? (
        <div className="border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-3">
          {title}
        </div>
      ) : null}
      {children}
      {caption ? (
        <figcaption className="border-t border-line px-4 py-3 text-sm leading-6 text-ink-3">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

export function Takeaways({ items }: { items: ReactNode[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-3">Take away</p>
      <ul className="flex flex-col gap-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3 text-sm leading-6 text-ink-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-network" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DataTable({
  head,
  rows,
  dense,
}: {
  head: ReactNode[]
  rows: ReactNode[][]
  dense?: boolean
}) {
  const cell = dense ? 'px-3 py-1.5' : 'px-4 py-2.5'
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="bg-surface-2 text-left">
            {head.map((heading, index) => (
              <th key={index} className={`${cell} font-semibold text-ink whitespace-nowrap`}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-line align-top">
              {row.map((value, columnIndex) => (
                <td key={columnIndex} className={`${cell} text-ink-2`}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
      <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-3">{label}</div>
      <div className="mt-0.5 font-mono text-sm break-all text-ink">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-ink-3">{hint}</div> : null}
    </div>
  )
}

/** Definition cards for named components — the "what is this part called" panel. */
export function DefList({ ids }: { ids: string[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {ids.map((id) => {
        const entry = GLOSSARY_BY_ID[id]
        if (!entry) return null
        return (
          <div key={id} className="rounded-lg border border-line bg-surface p-4">
            <dt className="text-sm font-semibold text-ink">
              {entry.term}
              {entry.aka ? <span className="ml-2 text-xs font-normal text-ink-3">also: {entry.aka}</span> : null}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-ink-2">{entry.short}</dd>
            {entry.example ? (
              <dd className="bits mt-2 text-xs text-ink-3">{entry.example}</dd>
            ) : null}
          </div>
        )
      })}
    </dl>
  )
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-2">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: ReactNode
  error?: string | null
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">{label}</span>
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : hint ? <span className="text-xs text-ink-3">{hint}</span> : null}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-ink-3 focus:border-network focus:outline-none'

export const buttonClass =
  'rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50'

export const primaryButtonClass =
  'rounded-lg bg-network px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
