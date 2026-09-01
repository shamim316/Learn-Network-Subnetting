import { Html } from '@react-three/drei'
import { useMemo, useState } from 'react'
import { Bar, Scene } from './scene'
import { useScenePalette, type ScenePalette } from '../../theme'
import {
  blockSize,
  formatCidr,
  formatIPv4,
  magicNumber,
  networkOf,
  parseCidr,
  prefixToMask,
  subnetsOf,
  usableHosts,
  type Cidr,
} from '../../lib/ipv4'
import { DataTable, Field, Figure, Legend, Stat, inputClass } from '../ui'

const WIDTH = 18

/** World-space box the hierarchy occupies, so the camera can frame it. */
export function hierarchyExtent(explode: number, hasGrandchildren: boolean) {
  const childY = 2.4 + explode * 1.8
  const grandY = childY + 2.4 + explode * 1.8
  const top = (hasGrandchildren ? grandY : childY) + 1.6
  const bottom = -2.6
  return { width: WIDTH + 5, height: top - bottom, centerY: (top + bottom) / 2 }
}

export type HierBlock = {
  key: string
  label: string
  sublabel?: string
  offset: number
  size: number
  tone?: 'network' | 'subnet' | 'host' | 'accent' | 'neutral'
  dim?: boolean
}

function toneColor(palette: ScenePalette, tone?: HierBlock['tone']) {
  switch (tone) {
    case 'network':
      return palette.network
    case 'host':
      return palette.host
    case 'accent':
      return palette.accent
    case 'neutral':
      return palette.neutral
    default:
      return palette.subnet
  }
}

/**
 * A parent block with its children pulled out beneath it. The same scene backs
 * the equal-split demo and the VLSM designer — only the block list differs.
 */
export function SubnetHierarchyScene({
  totalSize,
  baseLabel,
  blocks,
  explode,
  selected,
  onSelect,
  grandchildren,
  grandchildLabel,
}: {
  totalSize: number
  baseLabel: string
  blocks: HierBlock[]
  explode: number
  selected?: string | null
  onSelect?: (key: string | null) => void
  grandchildren?: HierBlock[]
  grandchildLabel?: string
}) {
  const palette = useScenePalette()
  const [hovered, setHovered] = useState<string | null>(null)

  const childY = 2.4 + explode * 1.8
  const grandY = childY + 2.4 + explode * 1.8
  const count = blocks.length
  const extent = hierarchyExtent(explode, (grandchildren?.length ?? 0) > 0)

  const positioned = blocks.map((block, index) => {
    const width = Math.max((block.size / totalSize) * WIDTH, 0.06)
    const start = -WIDTH / 2 + (block.offset / totalSize) * WIDTH
    const gap = explode * 0.5 * (index - (count - 1) / 2)
    return { block, index, width, x: start + width / 2 + gap }
  })

  const labelEvery = count <= 16 ? 1 : count <= 32 ? 2 : 4

  const grandCount = grandchildren?.length ?? 0
  const grandPositioned = (grandchildren ?? []).map((block, index) => {
    const parent = blocks.find((candidate) => candidate.key === selected)
    const parentSize = parent?.size ?? totalSize
    const parentOffset = parent?.offset ?? 0
    const width = Math.max((block.size / parentSize) * WIDTH, 0.06)
    const start = -WIDTH / 2 + ((block.offset - parentOffset) / parentSize) * WIDTH
    const gap = explode * 0.5 * (index - (grandCount - 1) / 2)
    return { block, index, width, x: start + width / 2 + gap }
  })

  return (
    <group position={[0, -extent.centerY, 0]}>
      {/* Parent block. */}
      <mesh position={[0, 0, 0]} onClick={() => onSelect?.(null)}>
        <boxGeometry args={[WIDTH, 0.7, 2.2]} />
        <meshStandardMaterial color={palette.network} roughness={0.5} />
      </mesh>
      <Html position={[0, -0.85, 1.2]} center className="scene-label" zIndexRange={[8, 0]}>
        <div className="text-center font-mono text-xs font-semibold" style={{ color: palette.label }}>
          {baseLabel}
          <div className="text-[0.6rem] font-normal" style={{ color: palette.labelMuted }}>
            {totalSize.toLocaleString()} addresses
          </div>
        </div>
      </Html>

      {/* Children. */}
      {positioned.map(({ block, index, width, x }) => {
        const isSelected = selected === block.key
        const isHovered = hovered === block.key
        const height = isSelected || isHovered ? 1.15 : 0.9
        return (
          <group key={block.key}>
            <Bar
              position={[x, (childY + 0.35) / 2, 0]}
              size={[0.04, childY - 0.35, 0.04]}
              color={palette.neutral}
              opacity={0.55}
            />
            <mesh
              position={[x, childY, 0]}
              onClick={(event) => {
                event.stopPropagation()
                onSelect?.(isSelected ? null : block.key)
              }}
              onPointerOver={(event) => {
                event.stopPropagation()
                setHovered(block.key)
              }}
              onPointerOut={() => setHovered((current) => (current === block.key ? null : current))}
            >
              <boxGeometry args={[Math.max(width - explode * 0.12, 0.05), height, 2]} />
              <meshStandardMaterial
                color={toneColor(palette, block.tone)}
                roughness={0.45}
                transparent={block.dim}
                opacity={block.dim ? 0.35 : 1}
              />
            </mesh>
            {index % labelEvery === 0 || isSelected || isHovered ? (
              <Html position={[x, childY + 1.0, 0]} center className="scene-label" zIndexRange={[8, 0]}>
                <div className="text-center font-mono text-[0.62rem] whitespace-nowrap" style={{ color: palette.label }}>
                  {block.label}
                  {block.sublabel ? (
                    <div className="text-[0.55rem]" style={{ color: palette.labelMuted }}>
                      {block.sublabel}
                    </div>
                  ) : null}
                </div>
              </Html>
            ) : null}
          </group>
        )
      })}

      {/* Optional third tier: the selected child, split again. */}
      {grandPositioned.length > 0 ? (
        <group>
          {grandPositioned.map(({ block, width, x }) => (
            <group key={block.key}>
              <Bar
                position={[x, (grandY + childY) / 2, 0]}
                size={[0.04, grandY - childY - 0.6, 0.04]}
                color={palette.neutral}
                opacity={0.45}
              />
              <mesh position={[x, grandY, 0]}>
                <boxGeometry args={[Math.max(width - explode * 0.12, 0.05), 0.8, 1.8]} />
                <meshStandardMaterial color={toneColor(palette, block.tone ?? 'host')} roughness={0.45} />
              </mesh>
              <Html position={[x, grandY + 0.9, 0]} center className="scene-label" zIndexRange={[8, 0]}>
                <div className="font-mono text-[0.58rem] whitespace-nowrap" style={{ color: palette.labelMuted }}>
                  {block.label}
                </div>
              </Html>
            </group>
          ))}
          {grandchildLabel ? (
            <Html position={[-WIDTH / 2 - 0.5, grandY, 0]} className="scene-label" zIndexRange={[8, 0]}>
              <div className="font-mono text-[0.6rem]" style={{ color: palette.labelMuted }}>
                {grandchildLabel}
              </div>
            </Html>
          ) : null}
        </group>
      ) : null}
    </group>
  )
}

/** Equal-size split of one block: borrow n bits, get 2^n subnets. */
export function SubnetSplitExplorer({
  initialBase = '192.168.10.0/24',
  caption,
}: {
  initialBase?: string
  caption?: React.ReactNode
}) {
  const palette = useScenePalette()
  const [baseText, setBaseText] = useState(initialBase)
  const [borrow, setBorrow] = useState(2)
  const [explode, setExplode] = useState(0.4)
  const [selected, setSelected] = useState<string | null>(null)

  const parsed = parseCidr(baseText, 24)
  const base: Cidr = parsed.ok
    ? { address: networkOf(parsed.value.address, parsed.value.prefix), prefix: parsed.value.prefix }
    : { address: 0, prefix: 24 }

  const maxBorrow = Math.max(0, 32 - base.prefix)
  const effectiveBorrow = Math.min(borrow, maxBorrow)
  const newPrefix = base.prefix + effectiveBorrow

  const { subnets, total } = useMemo(
    () => subnetsOf(base, newPrefix, 64),
    [base.address, base.prefix, newPrefix],
  )

  const totalSize = blockSize(base.prefix)
  const baseNetwork = networkOf(base.address, base.prefix)

  const blocks: HierBlock[] = subnets.map((subnet) => ({
    key: formatCidr(subnet),
    label: formatIPv4(subnet.address),
    sublabel: `/${subnet.prefix} · ${usableHosts(subnet.prefix).toLocaleString()} hosts`,
    offset: subnet.address - baseNetwork,
    size: blockSize(subnet.prefix),
    tone: 'subnet' as const,
  }))

  const selectedSubnet = subnets.find((subnet) => formatCidr(subnet) === selected)
  const grandchildren: HierBlock[] | undefined =
    selectedSubnet && selectedSubnet.prefix < 30
      ? subnetsOf(selectedSubnet, selectedSubnet.prefix + 2, 8).subnets.map((child) => ({
          key: `g-${formatCidr(child)}`,
          label: formatCidr(child),
          offset: child.address - baseNetwork,
          size: blockSize(child.prefix),
          tone: 'host',
        }))
      : undefined

  const magic = magicNumber(newPrefix)
  const splitExtent = hierarchyExtent(explode, (grandchildren?.length ?? 0) > 0)

  return (
    <Figure title="Exploded view — one block, split into subnets" caption={caption}>
      <Scene
        cameraPosition={[0, 3, 26]}
        fov={42}
        maxDistance={120}
        fit={{ width: splitExtent.width, height: splitExtent.height }}
      >
        <SubnetHierarchyScene
          totalSize={totalSize}
          baseLabel={formatCidr(base)}
          blocks={blocks}
          explode={explode}
          selected={selected}
          onSelect={setSelected}
          grandchildren={grandchildren}
          grandchildLabel={selectedSubnet ? `split again: /${selectedSubnet.prefix + 2}` : undefined}
        />
      </Scene>

      <div className="border-t border-line p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Parent block" error={parsed.ok ? null : parsed.error}>
            <input className={inputClass} value={baseText} onChange={(event) => setBaseText(event.target.value)} spellCheck={false} />
          </Field>
          <Field
            label={`Borrow ${effectiveBorrow} bits → /${newPrefix}`}
            hint={`${total.toLocaleString()} subnets of ${blockSize(newPrefix).toLocaleString()} addresses`}
          >
            <input
              type="range"
              min={0}
              max={Math.min(maxBorrow, 6)}
              value={effectiveBorrow}
              onChange={(event) => {
                setBorrow(Number(event.target.value))
                setSelected(null)
              }}
            />
          </Field>
          <Field label="Explode" hint="Separate the children from the parent">
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(event) => setExplode(Number(event.target.value))} />
          </Field>
        </div>

        <p className="mt-3 text-xs text-ink-3">
          Click a subnet to split it one level further. {total > subnets.length ? `Showing the first ${subnets.length} of ${total.toLocaleString()} subnets.` : null}
        </p>

        <div className="mt-4">
          <Legend
            items={[
              { color: palette.network, label: 'Parent block' },
              { color: palette.subnet, label: 'Subnet' },
              { color: palette.host, label: 'Further split' },
            ]}
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="New mask" value={formatIPv4(prefixToMask(newPrefix))} hint={`/${newPrefix}`} />
          <Stat label="Subnets" value={total.toLocaleString()} hint={`2^${effectiveBorrow}`} />
          <Stat label="Addresses each" value={blockSize(newPrefix).toLocaleString()} hint={`2^${32 - newPrefix}`} />
          <Stat label="Usable hosts each" value={usableHosts(newPrefix).toLocaleString()} hint={`increment ${magic.increment} in octet ${magic.octetIndex + 1}`} />
        </div>

        <div className="mt-4">
          <DataTable
            dense
            head={['#', 'Subnet', 'First host', 'Last host', 'Broadcast']}
            rows={subnets.slice(0, 16).map((subnet, index) => {
              const size = blockSize(subnet.prefix)
              const broadcast = subnet.address + size - 1
              return [
                index,
                <span className="font-mono">{formatCidr(subnet)}</span>,
                <span className="font-mono">{subnet.prefix >= 31 ? formatIPv4(subnet.address) : formatIPv4(subnet.address + 1)}</span>,
                <span className="font-mono">{subnet.prefix >= 31 ? formatIPv4(broadcast) : formatIPv4(broadcast - 1)}</span>,
                <span className="font-mono">{subnet.prefix >= 31 ? '—' : formatIPv4(broadcast)}</span>,
              ]
            })}
          />
        </div>
      </div>
    </Figure>
  )
}
