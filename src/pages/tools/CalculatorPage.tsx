import { SubnetCalculator } from '../../components/tools/SubnetCalculator'
import { Callout } from '../../components/ui'

export function CalculatorPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Subnet calculator</h1>
        <p className="text-lg text-ink-2">
          IPv4 and IPv6, with the binary breakdown and the 3D model wired to every keystroke.
        </p>
      </header>
      <SubnetCalculator />
      <Callout kind="tip" title="Reading the output">
        <p>
          The two numbers worth checking first are the usable range and the block increment. If the address you were given
          is not inside the range, the mask is wrong. If the increment does not match the next subnet in your plan, the
          allocation is misaligned and will overlap something.
        </p>
      </Callout>
    </div>
  )
}
