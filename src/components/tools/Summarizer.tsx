import { useMemo, useState } from 'react'
import { Scene } from '../three/scene'
import { SubnetHierarchyScene, hierarchyExtent, type HierBlock } from '../three/SubnetHierarchy'
import { Callout, Card, DataTable, Field, Legend, Stat, inputClass } from '../ui'
import { useScenePalette } from '../../theme'
import { binaryIPv4, blockSize, formatCidr, formatIPv4, networkOf, parseCidr, type Cidr } from '../../lib/ipv4'
import { aggregate, commonSupernet } from '../../lib/summarize'

const DEFAULT_INPUT = `10.1.0.0/24
10.1.1.0/24
10.1.2.0/24
10.1.3.0/24
10.1.8.0/24`

export function Summarizer() {
  const palette = useScenePalette()
  const [text, setText] = useState(DEFAULT_INPUT)
  const [explode, setExplode] = useState(0.3)

  const { inputs, errors } = useMemo(() => {
    const lines = text
      .split(/[\n,;]+/)
      .map((line) => line.trim())
      .filter(Boolean)
    const inputs: Cidr[] = []
    const errors: string[] = []
    for (const line of lines) {
      const parsed = parseCidr(line, 24)
      if (parsed.ok) {
        inputs.push({ address: networkOf(parsed.value.address, parsed.value.prefix), prefix: parsed.value.prefix })
      } else {
        errors.push(`${line}: ${parsed.error}`)
      }
    }
    return { inputs, errors }
  }, [text])

  const exact = useMemo(() => aggregate(inputs), [inputs])
  const supernet = useMemo(() => commonSupernet(inputs), [inputs])

  const totalInput = inputs.reduce((sum, cidr) => sum + blockSize(cidr.prefix), 0)

  const blocks: HierBlock[] = supernet
    ? inputs
        .map((cidr) => ({
          key: formatCidr(cidr),
          label: formatCidr(cidr),
          offset: cidr.address - supernet.cidr.address,
          size: blockSize(cidr.prefix),
          tone: 'subnet' as const,
        }))
        .sort((a, b) => a.offset - b.offset)
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Field label="Prefixes to summarize" hint="One per line, or comma-separated">
          <textarea
            className={`${inputClass} h-40 resize-y`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
          />
        </Field>
        <div className="flex flex-col gap-4">
          <Field label="Explode" hint="Separate the member prefixes">
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(event) => setExplode(Number(event.target.value))} />
          </Field>
          <div className="grid gap-2">
            <Stat label="Prefixes in" value={inputs.length.toString()} hint={`${totalInput.toLocaleString()} addresses`} />
            <Stat label="Prefixes out (exact)" value={exact.length.toString()} hint="covers exactly the same addresses" />
          </div>
        </div>
      </div>

      {errors.length > 0 ? (
        <Callout kind="warn" title="Could not parse">
          <ul className="list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Callout>
      ) : null}

      {supernet ? (
        <>
          <div className="overflow-hidden rounded-xl border border-line">
            <Scene
              cameraPosition={[0, 3, 26]}
              fov={42}
              height="h-[19rem]"
              maxDistance={120}
              fit={hierarchyExtent(explode, false)}
            >
              <SubnetHierarchyScene
                totalSize={blockSize(supernet.cidr.prefix)}
                baseLabel={`summary ${formatCidr(supernet.cidr)}`}
                blocks={blocks}
                explode={explode}
              />
            </Scene>
            <div className="border-t border-line bg-surface p-3">
              <Legend
                items={[
                  { color: palette.network, label: 'Advertised summary' },
                  { color: palette.subnet, label: 'Member prefix' },
                ]}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Single summary route" value={formatCidr(supernet.cidr)} hint={`${supernet.sharedBits} shared leading bits`} />
            <Stat label="Covers" value={blockSize(supernet.cidr.prefix).toLocaleString()} hint="addresses" />
            <Stat
              label="Over-advertised"
              value={supernet.extraAddresses.toLocaleString()}
              hint={supernet.extraAddresses > 0 ? 'addresses inside the summary you did not allocate' : 'perfect fit'}
            />
          </div>

          {supernet.extraAddresses > 0 ? (
            <Callout kind="warn" title="This summary is not exact">
              <p>
                Advertising <span className="font-mono">{formatCidr(supernet.cidr)}</span> claims{' '}
                {supernet.extraAddresses.toLocaleString()} addresses you have not allocated. That is safe when nothing else
                uses them, and a black hole when something does. The exact aggregation below covers only real space.
              </p>
            </Callout>
          ) : null}

          <Card>
            <p className="mb-3 text-sm font-semibold text-ink">Where the addresses stop agreeing</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-xs">
                <tbody>
                  {inputs.map((cidr) => {
                    const binary = binaryIPv4(cidr.address, '')
                    return (
                      <tr key={formatCidr(cidr)}>
                        <td className="py-1 pr-4 font-mono whitespace-nowrap text-ink-2">{formatCidr(cidr)}</td>
                        <td className="bits py-1">
                          {binary.split('').map((bit, index) => (
                            <span
                              key={index}
                              className={
                                index < supernet.sharedBits
                                  ? 'text-network'
                                  : index < cidr.prefix
                                    ? 'text-host'
                                    : 'text-ink-3'
                              }
                            >
                              {bit}
                              {index % 8 === 7 && index < 31 ? <span className="text-ink-3"> </span> : null}
                            </span>
                          ))}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-line">
                    <td className="py-1 pr-4 font-mono whitespace-nowrap text-ink">summary</td>
                    <td className="bits py-1 text-network">
                      {binaryIPv4(supernet.cidr.address, '')
                        .split('')
                        .map((bit, index) => (
                          <span key={index} className={index < supernet.sharedBits ? 'text-network' : 'text-ink-3'}>
                            {index < supernet.sharedBits ? bit : 'x'}
                            {index % 8 === 7 && index < 31 ? ' ' : null}
                          </span>
                        ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-3">
              Blue bits are identical across every input — those are the bits the summary keeps. The first bit where any two
              inputs disagree is where the summary has to stop, which is why non-contiguous allocations cannot be
              summarized tightly.
            </p>
          </Card>

          <DataTable
            head={['Exact aggregation', 'Addresses', 'Range']}
            rows={exact.map((cidr) => {
              const size = blockSize(cidr.prefix)
              return [
                <span className="font-mono">{formatCidr(cidr)}</span>,
                size.toLocaleString(),
                <span className="font-mono">
                  {formatIPv4(cidr.address)} – {formatIPv4(cidr.address + size - 1)}
                </span>,
              ]
            })}
          />
        </>
      ) : (
        <Callout kind="note">
          <p>Enter at least one prefix to see its summary.</p>
        </Callout>
      )}
    </div>
  )
}
