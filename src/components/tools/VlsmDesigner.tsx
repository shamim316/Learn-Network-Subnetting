import { useMemo, useState } from 'react'
import { Scene } from '../three/scene'
import { SubnetHierarchyScene, hierarchyExtent, type HierBlock } from '../three/SubnetHierarchy'
import { Callout, Card, DataTable, Field, Legend, Stat, buttonClass, inputClass, primaryButtonClass } from '../ui'
import { useScenePalette } from '../../theme'
import { blockSize, formatCidr, formatIPv4, networkOf, parseCidr, prefixToMask } from '../../lib/ipv4'
import { fixedLengthCost, planVlsm, type Requirement } from '../../lib/vlsm'

const DEFAULT_REQUIREMENTS: Requirement[] = [
  { id: 'r1', name: 'Users — floor 1', hosts: 500 },
  { id: 'r2', name: 'Users — floor 2', hosts: 220 },
  { id: 'r3', name: 'Wireless', hosts: 120 },
  { id: 'r4', name: 'Voice', hosts: 60 },
  { id: 'r5', name: 'Servers', hosts: 25 },
  { id: 'r6', name: 'Management', hosts: 12 },
  { id: 'r7', name: 'WAN link A', hosts: 2 },
  { id: 'r8', name: 'WAN link B', hosts: 2 },
]

let nextId = 100

export function VlsmDesigner() {
  const palette = useScenePalette()
  const [baseText, setBaseText] = useState('10.20.0.0/22')
  const [requirements, setRequirements] = useState<Requirement[]>(DEFAULT_REQUIREMENTS)
  const [explode, setExplode] = useState(0.35)
  const [copied, setCopied] = useState(false)

  const parsed = parseCidr(baseText, 24)
  const base = parsed.ok
    ? { address: networkOf(parsed.value.address, parsed.value.prefix), prefix: parsed.value.prefix }
    : { address: 0, prefix: 24 }

  const plan = useMemo(() => planVlsm(base, requirements), [base.address, base.prefix, requirements])
  const fixed = fixedLengthCost(base, requirements)

  const blocks: HierBlock[] = [
    ...plan.allocations.map((allocation, index) => ({
      key: formatCidr(allocation.cidr),
      label: formatCidr(allocation.cidr),
      sublabel: allocation.requirement.name,
      offset: allocation.cidr.address - plan.base.address,
      size: allocation.size,
      tone: (index % 2 === 0 ? 'subnet' : 'accent') as HierBlock['tone'],
    })),
    ...plan.free.map((free) => ({
      key: `free-${formatCidr(free)}`,
      label: formatCidr(free),
      sublabel: 'free',
      offset: free.address - plan.base.address,
      size: blockSize(free.prefix),
      tone: 'neutral' as const,
      dim: true,
    })),
  ]

  const update = (id: string, patch: Partial<Requirement>) =>
    setRequirements((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  const exportText = [
    `# VLSM plan for ${formatCidr(plan.base)}`,
    ...plan.allocations.map((allocation) => {
      const size = allocation.size
      const network = allocation.cidr.address
      const broadcast = network + size - 1
      const range =
        allocation.prefix >= 31
          ? `${formatIPv4(network)}–${formatIPv4(broadcast)}`
          : `${formatIPv4(network + 1)}–${formatIPv4(broadcast - 1)}`
      return `${allocation.requirement.name.padEnd(22)} ${formatCidr(allocation.cidr).padEnd(20)} mask ${formatIPv4(
        prefixToMask(allocation.prefix),
      ).padEnd(16)} hosts ${range}`
    }),
    ...plan.free.map((free) => `${'(free)'.padEnd(22)} ${formatCidr(free)}`),
  ].join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const utilisation = plan.totalAddresses > 0 ? (plan.usedAddresses / plan.totalAddresses) * 100 : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Block to divide" error={parsed.ok ? null : parsed.error} hint={parsed.ok ? `${blockSize(base.prefix).toLocaleString()} addresses` : undefined}>
          <input className={inputClass} value={baseText} onChange={(event) => setBaseText(event.target.value)} spellCheck={false} />
        </Field>
        <Field label="Explode" hint="Separate the allocations">
          <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(event) => setExplode(Number(event.target.value))} />
        </Field>
        <div className="flex items-end gap-2">
          <button type="button" className={buttonClass} onClick={copy}>
            {copied ? 'Copied' : 'Copy plan'}
          </button>
          <button type="button" className={buttonClass} onClick={() => setRequirements(DEFAULT_REQUIREMENTS)}>
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <Scene
          cameraPosition={[0, 3, 26]}
          fov={42}
          height="h-[20rem]"
          maxDistance={120}
          fit={hierarchyExtent(explode, false)}
        >
          <SubnetHierarchyScene
            totalSize={plan.totalAddresses}
            baseLabel={formatCidr(plan.base)}
            blocks={blocks}
            explode={explode}
          />
        </Scene>
        <div className="border-t border-line bg-surface p-3">
          <Legend
            items={[
              { color: palette.network, label: 'Parent block' },
              { color: palette.subnet, label: 'Allocated subnet' },
              { color: palette.accent, label: 'Allocated subnet (alternating shade)' },
              { color: palette.neutral, label: 'Unallocated' },
            ]}
          />
        </div>
      </div>

      {plan.errors.length > 0 ? (
        <Callout kind="warn" title="This plan does not fit">
          <ul className="list-disc pl-5">
            {plan.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Callout>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Allocated" value={`${plan.usedAddresses.toLocaleString()} / ${plan.totalAddresses.toLocaleString()}`} hint={`${utilisation.toFixed(1)}% of the block`} />
        <Stat label="Subnets placed" value={`${plan.allocations.length} of ${requirements.length}`} />
        <Stat label="Free blocks left" value={plan.free.map((free) => formatCidr(free)).join(', ') || 'none'} />
        <Stat
          label="Fixed-size equivalent"
          value={fixed.prefix === null ? '—' : `${fixed.subnets} × /${fixed.prefix}`}
          hint={fixed.prefix === null ? undefined : `${fixed.addresses.toLocaleString()} addresses — ${(fixed.addresses - plan.usedAddresses).toLocaleString()} wasted`}
        />
      </div>

      <Card>
        <p className="mb-3 text-sm font-semibold text-ink">Requirements</p>
        <div className="flex flex-col gap-2">
          {requirements.map((requirement) => (
            <div key={requirement.id} className="flex flex-wrap items-center gap-2">
              <input
                className={`${inputClass} flex-1 min-w-40 font-sans`}
                value={requirement.name}
                onChange={(event) => update(requirement.id, { name: event.target.value })}
              />
              <input
                className={`${inputClass} w-28`}
                type="number"
                min={1}
                value={requirement.hosts}
                onChange={(event) => update(requirement.id, { hosts: Math.max(1, Number(event.target.value) || 1) })}
              />
              <span className="text-xs text-ink-3">hosts</span>
              <button
                type="button"
                className={buttonClass}
                onClick={() => setRequirements((current) => current.filter((item) => item.id !== requirement.id))}
                aria-label={`Remove ${requirement.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`${primaryButtonClass} mt-3`}
          onClick={() =>
            setRequirements((current) => [...current, { id: `r${nextId++}`, name: `Segment ${current.length + 1}`, hosts: 10 }])
          }
        >
          Add segment
        </button>
      </Card>

      <DataTable
        head={['Segment', 'Hosts needed', 'Subnet', 'Mask', 'Usable range', 'Broadcast', 'Spare']}
        rows={plan.allocations.map((allocation) => {
          const network = allocation.cidr.address
          const broadcast = network + allocation.size - 1
          return [
            allocation.requirement.name,
            allocation.requirement.hosts.toLocaleString(),
            <span className="font-mono">{formatCidr(allocation.cidr)}</span>,
            <span className="font-mono">{formatIPv4(prefixToMask(allocation.prefix))}</span>,
            <span className="font-mono">
              {allocation.prefix >= 31
                ? `${formatIPv4(network)} – ${formatIPv4(broadcast)}`
                : `${formatIPv4(network + 1)} – ${formatIPv4(broadcast - 1)}`}
            </span>,
            <span className="font-mono">{allocation.prefix >= 31 ? '—' : formatIPv4(broadcast)}</span>,
            <span className={allocation.spare === 0 ? 'text-danger' : 'text-ink-2'}>{allocation.spare.toLocaleString()}</span>,
          ]
        })}
      />
    </div>
  )
}
