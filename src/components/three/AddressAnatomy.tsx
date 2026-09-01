import { Html } from '@react-three/drei'
import { useMemo, useState } from 'react'
import { Bar, GlyphBox, Scene } from './scene'
import { useScenePalette } from '../../theme'
import {
  bitsOf,
  bitsToValue,
  binaryIPv4,
  broadcastOf,
  firstHost,
  formatIPv4,
  lastHost,
  networkOf,
  octetsOf,
  parseIPv4,
  prefixToMask,
  usableHosts,
  wildcardOf,
} from '../../lib/ipv4'
import { Field, Figure, Legend, Stat, inputClass } from '../ui'

const BIT_SIZE = 0.5
const BIT_PITCH = 0.56

type Role = 'network' | 'subnet' | 'host'

function roleOf(index: number, prefix: number, parentPrefix: number): Role {
  if (index < Math.min(parentPrefix, prefix)) return 'network'
  if (index < prefix) return 'subnet'
  return 'host'
}

function layout(index: number, explode: number, prefix: number, parentPrefix: number) {
  const octet = Math.floor(index / 8)
  const bitInOctet = index % 8
  const spread = (bitInOctet - 3.5) * explode * 0.22
  const octetGap = (octet - 1.5) * explode * 1.7
  const x = (index - 15.5) * BIT_PITCH + octetGap + spread
  const role = roleOf(index, prefix, parentPrefix)
  const y = role === 'network' ? explode * 0.95 : role === 'subnet' ? explode * 0.4 : -explode * 0.95
  const z = role === 'host' ? explode * 0.5 : -explode * 0.25
  return { x, y, z, octet, bitInOctet, role }
}

export function AddressAnatomyScene({
  address,
  prefix,
  parentPrefix,
  explode,
  onToggleBit,
}: {
  address: number
  prefix: number
  parentPrefix: number
  explode: number
  onToggleBit?: (index: number) => void
}) {
  const palette = useScenePalette()
  const [hovered, setHovered] = useState<number | null>(null)
  const bits = useMemo(() => bitsOf(address), [address])
  const octets = octetsOf(address)

  const colorFor = (role: Role) =>
    role === 'network' ? palette.network : role === 'subnet' ? palette.subnet : palette.host

  const boundaryX =
    prefix > 0 && prefix < 32
      ? (layout(prefix - 1, explode, prefix, parentPrefix).x + layout(prefix, explode, prefix, parentPrefix).x) / 2
      : null

  return (
    <group>
      {bits.map((bit, index) => {
        const { x, y, z, role } = layout(index, explode, prefix, parentPrefix)
        const isHovered = hovered === index
        return (
          <GlyphBox
            key={index}
            position={[x, y, z]}
            size={[BIT_SIZE, isHovered ? BIT_SIZE * 1.25 : BIT_SIZE, BIT_SIZE]}
            color={colorFor(role)}
            opacity={bit === 1 ? 1 : 0.32}
            glyph={String(bit)}
            glyphColor={bit === 1 ? '#ffffff' : palette.label}
            onClick={onToggleBit ? () => onToggleBit(index) : undefined}
            onPointerOver={() => setHovered(index)}
            onPointerOut={() => setHovered((current) => (current === index ? null : current))}
          />
        )
      })}

      {/* One plate per octet, so the dotted-decimal grouping stays visible. */}
      {[0, 1, 2, 3].map((octet) => {
        const first = layout(octet * 8, explode, prefix, parentPrefix)
        const last = layout(octet * 8 + 7, explode, prefix, parentPrefix)
        const width = last.x - first.x + BIT_SIZE + 0.2
        const centre = (first.x + last.x) / 2
        return (
          <group key={octet}>
            <Bar
              position={[centre, -1.35 - explode * 0.4, 0]}
              size={[width, 0.06, BIT_SIZE + 0.3]}
              color={palette.neutral}
              opacity={0.5}
            />
            <Html position={[centre, -1.95 - explode * 0.4, 0]} center className="scene-label" zIndexRange={[8, 0]}>
              <div className="text-center" style={{ color: palette.label }}>
                <div className="font-mono text-base font-semibold">{octets[octet]}</div>
                <div className="font-mono text-[0.6rem]" style={{ color: palette.labelMuted }}>
                  octet {octet + 1} · bits {octet * 8}–{octet * 8 + 7}
                </div>
              </div>
            </Html>
          </group>
        )
      })}

      {/* The prefix boundary: everything left of this plane is the network. */}
      {boundaryX !== null ? (
        <group>
          <mesh position={[boundaryX, 0, 0]} raycast={() => null}>
            <planeGeometry args={[0.05, 5.2]} />
            <meshBasicMaterial color={palette.accent} transparent opacity={0.9} />
          </mesh>
          <Html position={[boundaryX, 2.9, 0]} center className="scene-label" zIndexRange={[8, 0]}>
            <div
              className="rounded px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold"
              style={{ background: palette.accent, color: '#fff' }}
            >
              /{prefix}
            </div>
          </Html>
        </group>
      ) : null}

      {/* Field captions. */}
      {prefix > 0 ? (
        <Html
          position={[layout(Math.floor((prefix - 1) / 2), explode, prefix, parentPrefix).x, 2.1 + explode * 0.9, 0]}
          center
          className="scene-label"
          zIndexRange={[8, 0]}
        >
          <div className="font-mono text-[0.7rem] font-semibold" style={{ color: palette.network }}>
            NETWORK · {prefix} bits
          </div>
        </Html>
      ) : null}
      {prefix < 32 ? (
        <Html
          position={[layout(Math.floor((prefix + 32) / 2), explode, prefix, parentPrefix).x, -3.4 - explode * 1.1, 0]}
          center
          className="scene-label"
          zIndexRange={[8, 0]}
        >
          <div className="font-mono text-[0.7rem] font-semibold" style={{ color: palette.host }}>
            HOST · {32 - prefix} bits · {Math.pow(2, 32 - prefix).toLocaleString()} addresses
          </div>
        </Html>
      ) : null}

      {hovered !== null ? (
        <Html
          position={[
            layout(hovered, explode, prefix, parentPrefix).x,
            layout(hovered, explode, prefix, parentPrefix).y + 0.9,
            layout(hovered, explode, prefix, parentPrefix).z,
          ]}
          center
          className="scene-label"
          zIndexRange={[9, 0]}
        >
          <div
            className="rounded-md border px-2 py-1 text-center font-mono text-[0.65rem] whitespace-nowrap"
            style={{ background: palette.surface, borderColor: palette.neutral, color: palette.label }}
          >
            bit {hovered} · value {Math.pow(2, 7 - (hovered % 8))} in octet {Math.floor(hovered / 8) + 1}
            <br />
            {layout(hovered, explode, prefix, parentPrefix).role} bit
          </div>
        </Html>
      ) : null}
    </group>
  )
}

const PRESETS = [
  { label: 'Campus VLAN', ip: '10.42.18.77', prefix: 26 },
  { label: 'Home LAN', ip: '192.168.1.50', prefix: 24 },
  { label: 'Router link', ip: '172.16.255.2', prefix: 31 },
  { label: 'Class B legacy', ip: '172.20.130.9', prefix: 16 },
]

export function AddressAnatomyExplorer({
  initialAddress = '192.168.10.37',
  initialPrefix = 26,
  initialParentPrefix,
  caption,
  title = 'Exploded view — IPv4 address',
}: {
  initialAddress?: string
  initialPrefix?: number
  initialParentPrefix?: number
  caption?: React.ReactNode
  title?: string
}) {
  const palette = useScenePalette()
  const [text, setText] = useState(initialAddress)
  const [prefix, setPrefix] = useState(initialPrefix)
  const [parentPrefix, setParentPrefix] = useState(initialParentPrefix ?? initialPrefix)
  const [explode, setExplode] = useState(0.35)

  const parsed = parseIPv4(text)
  const address = parsed.ok ? parsed.value : 0
  const effectiveParent = Math.min(parentPrefix, prefix)

  const toggleBit = (index: number) => {
    const bits = bitsOf(address)
    bits[index] = bits[index] === 1 ? 0 : 1
    setText(formatIPv4(bitsToValue(bits)))
  }

  const network = networkOf(address, prefix)
  const broadcast = broadcastOf(address, prefix)

  return (
    <Figure title={title} caption={caption}>
      <Scene cameraPosition={[0, 3.2, 23]} fov={42} maxDistance={80} fit={{ width: 23, height: 9 }}>
        <AddressAnatomyScene
          address={address}
          prefix={prefix}
          parentPrefix={effectiveParent}
          explode={explode}
          onToggleBit={toggleBit}
        />
      </Scene>

      <div className="border-t border-line p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="IPv4 address" error={parsed.ok ? null : parsed.error}>
            <input className={inputClass} value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
          </Field>
          <Field label={`Prefix /${prefix}`} hint={formatIPv4(prefixToMask(prefix))}>
            <input
              type="range"
              min={0}
              max={32}
              value={prefix}
              onChange={(event) => setPrefix(Number(event.target.value))}
            />
          </Field>
          <Field
            label={`Parent prefix /${effectiveParent}`}
            hint={prefix > effectiveParent ? `${prefix - effectiveParent} borrowed bits` : 'no borrowed bits'}
          >
            <input
              type="range"
              min={0}
              max={32}
              value={parentPrefix}
              onChange={(event) => setParentPrefix(Number(event.target.value))}
            />
          </Field>
          <Field label="Explode" hint="Pull the octets and fields apart">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explode}
              onChange={(event) => setExplode(Number(event.target.value))}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-3">Try:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setText(preset.ip)
                setPrefix(preset.prefix)
                setParentPrefix(Math.min(preset.prefix, 24))
              }}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 hover:border-network hover:text-network"
            >
              {preset.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-ink-3">Click a cube to flip that bit.</span>
        </div>

        <div className="mt-4">
          <Legend
            items={[
              { color: palette.network, label: 'Network bits (parent prefix)' },
              { color: palette.subnet, label: 'Borrowed subnet bits' },
              { color: palette.host, label: 'Host bits' },
            ]}
          />
        </div>

        {parsed.ok ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Network" value={`${formatIPv4(network)}/${prefix}`} />
            <Stat label="Broadcast" value={prefix >= 31 ? '—' : formatIPv4(broadcast)} />
            <Stat
              label="Host range"
              value={prefix >= 32 ? formatIPv4(address) : `${formatIPv4(firstHost(address, prefix))} – ${formatIPv4(lastHost(address, prefix))}`}
            />
            <Stat label="Usable hosts" value={usableHosts(prefix).toLocaleString()} hint={`wildcard ${formatIPv4(wildcardOf(prefix))}`} />
            <div className="sm:col-span-2 lg:col-span-4">
              <Stat label="Binary" value={<span className="bits">{binaryIPv4(address)}</span>} hint={`mask ${binaryIPv4(prefixToMask(prefix))}`} />
            </div>
          </div>
        ) : null}
      </div>
    </Figure>
  )
}
