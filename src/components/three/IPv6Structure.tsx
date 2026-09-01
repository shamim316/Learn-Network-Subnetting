import { Html } from '@react-three/drei'
import { useMemo, useState } from 'react'
import { GlyphBox, Scene, glyphTexture } from './scene'
import { useScenePalette } from '../../theme'
import {
  approximateCount,
  bitsOf6,
  formatIPv6,
  formatIPv6Full,
  hextetsOf,
  lastAddressOf6,
  networkOf6,
  parseIPv6,
  scopeOf6,
} from '../../lib/ipv6'
import { Field, Figure, Legend, Stat, inputClass } from '../ui'

const BIT = 0.4
const PITCH = 0.46

type Field6 = 'routing' | 'subnet' | 'interface'

function fieldOf(index: number, routingPrefix: number, subnetEnd: number): Field6 {
  if (index < routingPrefix) return 'routing'
  if (index < subnetEnd) return 'subnet'
  return 'interface'
}

function place(index: number, explode: number, routingPrefix: number, subnetEnd: number) {
  const hextet = Math.floor(index / 16)
  const bit = index % 16
  const nibble = Math.floor(bit / 4)
  const x = (bit - 7.5) * PITCH + (nibble - 1.5) * explode * 0.75
  const y = (3.5 - hextet) * (0.62 + explode * 0.55)
  const field = fieldOf(index, routingPrefix, subnetEnd)
  const z = field === 'routing' ? -explode * 1.3 : field === 'interface' ? explode * 1.3 : 0
  return { x, y, z, hextet, bit, nibble, field }
}

export function IPv6StructureScene({
  address,
  routingPrefix,
  subnetEnd,
  explode,
}: {
  address: bigint
  routingPrefix: number
  subnetEnd: number
  explode: number
}) {
  const palette = useScenePalette()
  const [hoveredHextet, setHoveredHextet] = useState<number | null>(null)
  const bits = useMemo(() => bitsOf6(address), [address])
  const hextets = hextetsOf(address)

  const colorFor = (field: Field6) =>
    field === 'routing' ? palette.accent : field === 'subnet' ? palette.subnet : palette.host

  return (
    <group>
      {bits.map((bit, index) => {
        const { x, y, z, field, hextet } = place(index, explode, routingPrefix, subnetEnd)
        const isRow = hoveredHextet === hextet
        return (
          <GlyphBox
            key={index}
            position={[x, y, z]}
            size={[BIT, isRow ? BIT * 1.3 : BIT, BIT]}
            color={colorFor(field)}
            opacity={bit === 1 ? 1 : 0.28}
            onPointerOver={() => setHoveredHextet(hextet)}
            onPointerOut={() => setHoveredHextet((current) => (current === hextet ? null : current))}
          />
        )
      })}

      {/* One hex digit per nibble, sitting just under its four bits. */}
      {Array.from({ length: 32 }, (_, nibbleIndex) => {
        const firstBit = nibbleIndex * 4
        const { x, y, z, field } = place(firstBit, explode, routingPrefix, subnetEnd)
        const spot = place(firstBit + 3, explode, routingPrefix, subnetEnd)
        const digit = ((hextets[Math.floor(nibbleIndex / 4)] >> ((3 - (nibbleIndex % 4)) * 4)) & 0xf).toString(16)
        return (
          <group key={`nibble-${nibbleIndex}`} position={[(x + spot.x) / 2, y - 0.36, z]}>
            <mesh raycast={() => null}>
              <boxGeometry args={[PITCH * 3.3, 0.34, BIT * 0.5]} />
              <meshBasicMaterial color={colorFor(field)} transparent opacity={0.14} />
            </mesh>
            {/* Square plane so the hex glyph is not stretched by the plate's shape. */}
            <mesh position={[0, 0, BIT * 0.26]} raycast={() => null}>
              <planeGeometry args={[0.3, 0.3]} />
              <meshBasicMaterial map={glyphTexture(digit)} transparent color={palette.label} depthWrite={false} />
            </mesh>
          </group>
        )
      })}

      {/* Hextet labels down the left edge. */}
      {hextets.map((hextet, index) => {
        const { y, z } = place(index * 16, explode, routingPrefix, subnetEnd)
        const isZero = hextet === 0
        return (
          <Html key={`h-${index}`} position={[-4.6 - explode * 1.4, y, z]} center className="scene-label" zIndexRange={[8, 0]}>
            <div className="text-right font-mono text-[0.68rem] whitespace-nowrap" style={{ color: isZero ? palette.labelMuted : palette.label }}>
              {hextet.toString(16).padStart(4, '0')}
              <span className="ml-1 text-[0.55rem]" style={{ color: palette.labelMuted }}>
                #{index + 1}
              </span>
            </div>
          </Html>
        )
      })}

      {/* Field captions on the right. */}
      {[
        { label: `Global routing prefix · /${routingPrefix}`, color: palette.accent, index: Math.max(0, routingPrefix / 32 - 0.5) },
        { label: `Subnet ID · ${subnetEnd - routingPrefix} bits`, color: palette.subnet, index: (routingPrefix + subnetEnd) / 32 - 0.5 },
        { label: `Interface ID · ${128 - subnetEnd} bits`, color: palette.host, index: (subnetEnd + 128) / 32 - 0.5 },
      ]
        .filter((entry) => entry.index >= 0 && entry.index <= 7.5)
        .map((entry) => {
          const y = (3.5 - entry.index) * (0.62 + explode * 0.55)
          const z = entry.color === palette.accent ? -explode * 1.3 : entry.color === palette.host ? explode * 1.3 : 0
          return (
            <Html key={entry.label} position={[4.7 + explode * 1.4, y, z]} className="scene-label" zIndexRange={[8, 0]}>
              <div className="font-mono text-[0.62rem] font-semibold whitespace-nowrap" style={{ color: entry.color }}>
                {entry.label}
              </div>
            </Html>
          )
        })}

      {hoveredHextet !== null ? (
        <Html
          position={[0, place(hoveredHextet * 16, explode, routingPrefix, subnetEnd).y + 0.75, place(hoveredHextet * 16, explode, routingPrefix, subnetEnd).z]}
          center
          className="scene-label"
          zIndexRange={[9, 0]}
        >
          <div
            className="rounded-md border px-2 py-1 font-mono text-[0.62rem] whitespace-nowrap"
            style={{ background: palette.surface, borderColor: palette.neutral, color: palette.label }}
          >
            hextet {hoveredHextet + 1} · bits {hoveredHextet * 16}–{hoveredHextet * 16 + 15} ·{' '}
            {hextets[hoveredHextet].toString(2).padStart(16, '0')}
          </div>
        </Html>
      ) : null}
    </group>
  )
}

const IPV6_PRESETS = [
  { label: 'Site /48', address: '2001:db8:acad:12::1', prefix: 64, routing: 48 },
  { label: 'ISP /56 home', address: '2001:db8:cafe:a01::10', prefix: 64, routing: 56 },
  { label: 'ULA', address: 'fd3a:9b2c:5f10:7::5', prefix: 64, routing: 48 },
  { label: 'Link-local', address: 'fe80::1a2b:3cff:fe4d:5e6f', prefix: 64, routing: 10 },
]

export function IPv6StructureExplorer({
  initialAddress = '2001:db8:acad:0012:0000:0000:0000:0001',
  initialRouting = 48,
  initialSubnetEnd = 64,
  caption,
}: {
  initialAddress?: string
  initialRouting?: number
  initialSubnetEnd?: number
  caption?: React.ReactNode
}) {
  const palette = useScenePalette()
  const [text, setText] = useState(initialAddress)
  const [routing, setRouting] = useState(initialRouting)
  const [subnetEnd, setSubnetEnd] = useState(initialSubnetEnd)
  const [explode, setExplode] = useState(0.35)

  const parsed = parseIPv6(text)
  const address = parsed.ok ? parsed.value : 0n
  const effectiveRouting = Math.min(routing, subnetEnd)
  const scope = scopeOf6(address)

  return (
    <Figure title="Exploded view — IPv6 address" caption={caption}>
      <Scene cameraPosition={[0, 0.5, 16]} fov={45} target={[0, 0, 0]} maxDistance={60} fit={{ width: 15, height: 9.5 }}>
        <IPv6StructureScene address={address} routingPrefix={effectiveRouting} subnetEnd={subnetEnd} explode={explode} />
      </Scene>

      <div className="border-t border-line p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="IPv6 address" error={parsed.ok ? null : parsed.error}>
            <input className={inputClass} value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
          </Field>
          <Field label={`Routing prefix /${effectiveRouting}`} hint="Delegated to you by the ISP or RIR">
            <input type="range" min={0} max={64} step={4} value={routing} onChange={(event) => setRouting(Number(event.target.value))} />
          </Field>
          <Field label={`Subnet boundary /${subnetEnd}`} hint={subnetEnd === 64 ? 'the standard LAN size' : 'non-standard — SLAAC needs /64'}>
            <input type="range" min={16} max={128} step={4} value={subnetEnd} onChange={(event) => setSubnetEnd(Number(event.target.value))} />
          </Field>
          <Field label="Explode" hint="Separate hextets, nibbles, and fields">
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(event) => setExplode(Number(event.target.value))} />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-3">Try:</span>
          {IPV6_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setText(preset.address)
                setRouting(preset.routing)
                setSubnetEnd(preset.prefix)
              }}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 hover:border-accent hover:text-accent"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Legend
            items={[
              { color: palette.accent, label: 'Global routing prefix' },
              { color: palette.subnet, label: 'Subnet ID' },
              { color: palette.host, label: 'Interface ID' },
            ]}
          />
        </div>

        {parsed.ok ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Stat label="Compressed (RFC 5952)" value={formatIPv6(address)} />
            <Stat label="Fully expanded" value={<span className="bits">{formatIPv6Full(address)}</span>} />
            <Stat label={`Prefix /${subnetEnd}`} value={`${formatIPv6(networkOf6(address, subnetEnd))}/${subnetEnd}`} hint={`last: ${formatIPv6(lastAddressOf6(address, subnetEnd))}`} />
            <Stat label="Addresses in prefix" value={approximateCount(subnetEnd)} hint={scope ? `${scope.name} — ${scope.cidr}` : 'no reserved-range match'} />
            <div className="sm:col-span-2">
              <Stat
                label={`Subnets available between /${effectiveRouting} and /${subnetEnd}`}
                value={subnetEnd >= effectiveRouting ? Math.pow(2, subnetEnd - effectiveRouting).toLocaleString() : '—'}
                hint={`${subnetEnd - effectiveRouting} subnet-ID bits`}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Figure>
  )
}
