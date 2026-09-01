import { VlsmDesigner } from '../../components/tools/VlsmDesigner'
import { Callout } from '../../components/ui'

export function VlsmPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">VLSM designer</h1>
        <p className="text-lg text-ink-2">
          Enter what each segment needs; the planner sizes, orders, and aligns every subnet, then shows what is left.
        </p>
      </header>
      <VlsmDesigner />
      <Callout kind="note" title="Why largest first">
        <p>
          Allocations are placed biggest to smallest. A /26 can only begin on a multiple of 64, so if a /30 is handed out
          first at offset 0, the next /26 has to skip forward to offset 64 and the addresses in between are stranded.
          Sorting by size makes every block land on its own boundary with no gaps.
        </p>
      </Callout>
    </div>
  )
}
