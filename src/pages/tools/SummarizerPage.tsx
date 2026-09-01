import { Summarizer } from '../../components/tools/Summarizer'
import { Callout } from '../../components/ui'

export function SummarizerPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Summarizer</h1>
        <p className="text-lg text-ink-2">
          Aggregate prefixes into the shortest covering routes, and see exactly which bit stops the summary from getting
          any shorter.
        </p>
      </header>
      <Summarizer />
      <Callout kind="warn" title="Exact versus convenient">
        <p>
          The single summary route is the one you would type into a router. It is only safe if you own every address
          inside it. When you do not, use the exact aggregation — more routes, but no black holes.
        </p>
      </Callout>
    </div>
  )
}
