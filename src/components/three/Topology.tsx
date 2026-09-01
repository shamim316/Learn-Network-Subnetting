import { Html } from '@react-three/drei'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { Scene } from './scene'
import { useScenePalette, type ScenePalette } from '../../theme'
import { Field, Figure, Legend } from '../ui'

export type TopologyNode = {
  id: string
  label: string
  tier: 'internet' | 'edge' | 'core' | 'distribution' | 'access' | 'cloud'
  position: [number, number, number]
  size?: [number, number, number]
  ipv4?: string
  ipv6?: string
  vlan?: string
  role: string
  note: string
}

export type TopologyLink = [string, string]

/**
 * A deliberately small but realistic enterprise: one /16 of RFC 1918 space and
 * one /48 of IPv6, carved so that every tier summarizes cleanly upward.
 */
export const REFERENCE_TOPOLOGY: { nodes: TopologyNode[]; links: TopologyLink[] } = {
  nodes: [
    {
      id: 'internet',
      label: 'Internet / ISP',
      tier: 'internet',
      position: [0, 7.5, 0],
      size: [3.4, 1, 1.6],
      ipv4: '203.0.113.0/29 (assigned)',
      ipv6: '2001:db8:acad::/48 (delegated)',
      role: 'Upstream transit',
      note: 'The provider hands you one public IPv4 block and one IPv6 prefix. Everything below is your own address plan, and everything above only ever sees these two prefixes.',
    },
    {
      id: 'edge',
      label: 'Edge firewall',
      tier: 'edge',
      position: [0, 5.2, 0],
      size: [3.2, 0.9, 1.6],
      ipv4: '203.0.113.1/29 outside · 10.10.0.1/30 inside',
      ipv6: '2001:db8:acad::1/64',
      vlan: '—',
      role: 'NAT, policy, and the IPv4/IPv6 boundary',
      note: 'Translates the whole 10.10.0.0/16 estate behind a handful of public addresses. On the IPv6 side there is no translation — the /48 is routed straight through.',
    },
    {
      id: 'dmz',
      label: 'DMZ',
      tier: 'edge',
      position: [5.2, 5.2, 0],
      size: [2.6, 0.8, 1.5],
      ipv4: '10.10.255.0/26',
      ipv6: '2001:db8:acad:ff::/64',
      vlan: '900',
      role: 'Internet-facing services',
      note: 'Deliberately placed at the very top of the block so that the DMZ prefix is easy to match in firewall policy and never gets confused with internal space.',
    },
    {
      id: 'core',
      label: 'Core switches',
      tier: 'core',
      position: [0, 3.0, 0],
      size: [4, 0.9, 1.8],
      ipv4: '10.10.0.0/24 (links) · 10.10.1.0/24 (loopbacks)',
      ipv6: '2001:db8:acad:0::/64',
      role: 'Layer-3 backbone, route summarization point',
      note: 'Point-to-point links come from one /24 carved into /31s; loopbacks come from a second /24 as /32s. Keeping infrastructure addressing in its own contiguous space is what lets the core advertise two prefixes instead of forty.',
    },
    {
      id: 'dist-campus',
      label: 'Campus distribution',
      tier: 'distribution',
      position: [-6.6, 0.9, 0],
      size: [3.2, 0.8, 1.6],
      ipv4: '10.10.16.0/20',
      ipv6: '2001:db8:acad:10::/60',
      role: 'Aggregates the user-facing VLANs',
      note: 'The whole campus summarizes into a single /20 upstream. Individual VLAN flaps never reach the core routing table.',
    },
    {
      id: 'dist-dc',
      label: 'Datacenter distribution',
      tier: 'distribution',
      position: [0.6, 0.9, 0],
      size: [3.2, 0.8, 1.6],
      ipv4: '10.10.32.0/20',
      ipv6: '2001:db8:acad:20::/60',
      role: 'Aggregates the server segments',
      note: 'Server segments are sized for churn, not for today: a /24 per tier even when only 30 hosts exist, because renumbering a live application tier is far more expensive than spare addresses.',
    },
    {
      id: 'cloud-gw',
      label: 'Cloud gateway',
      tier: 'distribution',
      position: [6.8, 0.9, 0],
      size: [3.2, 0.8, 1.6],
      ipv4: '10.10.48.0/20 (routed to VPC)',
      ipv6: '2001:db8:acad:30::/60',
      role: 'IPsec / Direct Connect to the cloud VPC',
      note: 'The cloud block is reserved out of the same /16 before anything is built, so on-premises and cloud can never collide and the tunnel needs no NAT.',
    },
    {
      id: 'vlan-users',
      label: 'User VLAN',
      tier: 'access',
      position: [-10, -1.6, 0],
      size: [2.4, 0.7, 1.4],
      ipv4: '10.10.16.0/22',
      ipv6: '2001:db8:acad:10::/64',
      vlan: '110',
      role: '≈900 laptops and desks',
      note: 'A /22 gives 1,022 usable addresses — headroom for growth without merging four broadcast domains into one noisy /21.',
    },
    {
      id: 'vlan-voice',
      label: 'Voice VLAN',
      tier: 'access',
      position: [-6.6, -1.6, 0],
      size: [2.4, 0.7, 1.4],
      ipv4: '10.10.20.0/23',
      ipv6: '2001:db8:acad:11::/64',
      vlan: '120',
      role: 'IP phones, separate QoS domain',
      note: 'Voice is separated from data mostly for policy: a distinct subnet makes QoS marking, DHCP options, and firewall rules trivial to express.',
    },
    {
      id: 'vlan-wifi',
      label: 'Wireless VLAN',
      tier: 'access',
      position: [-3.2, -1.6, 0],
      size: [2.4, 0.7, 1.4],
      ipv4: '10.10.24.0/22',
      ipv6: '2001:db8:acad:12::/64',
      vlan: '130',
      role: 'Guest and corporate SSIDs',
      note: 'Wireless clients arrive and leave constantly, so the DHCP pool is sized well above the concurrent client count to survive lease churn.',
    },
    {
      id: 'srv-app',
      label: 'App tier',
      tier: 'access',
      position: [0.6, -1.6, 0],
      size: [2.4, 0.7, 1.4],
      ipv4: '10.10.32.0/24',
      ipv6: '2001:db8:acad:20::/64',
      vlan: '210',
      role: 'Application servers',
      note: 'Tiering by function rather than by rack is what lets a firewall rule read "app tier to database tier" instead of listing individual hosts.',
    },
    {
      id: 'srv-db',
      label: 'Database tier',
      tier: 'access',
      position: [4.2, -1.6, 0],
      size: [2.4, 0.7, 1.4],
      ipv4: '10.10.33.0/24',
      ipv6: '2001:db8:acad:21::/64',
      vlan: '220',
      role: 'Database servers',
      note: 'Adjacent to the app tier in address space, so both together summarize as 10.10.32.0/23 for any policy that treats them as one zone.',
    },
    {
      id: 'vpc',
      label: 'Cloud VPC',
      tier: 'cloud',
      position: [8.2, -1.6, 0],
      size: [2.8, 0.7, 1.4],
      ipv4: '10.10.48.0/20',
      ipv6: '2001:db8:acad:30::/60',
      role: 'Three availability zones, public + private subnets',
      note: 'Each availability zone gets a /24 public and a /22 private subnet. The VPC CIDR cannot be shrunk after creation, so the /20 is chosen for the five-year plan, not the first deployment.',
    },
  ],
  links: [
    ['internet', 'edge'],
    ['edge', 'dmz'],
    ['edge', 'core'],
    ['core', 'dist-campus'],
    ['core', 'dist-dc'],
    ['core', 'cloud-gw'],
    ['dist-campus', 'vlan-users'],
    ['dist-campus', 'vlan-voice'],
    ['dist-campus', 'vlan-wifi'],
    ['dist-dc', 'srv-app'],
    ['dist-dc', 'srv-db'],
    ['cloud-gw', 'vpc'],
  ],
}

/** World-space box the topology occupies at a given explode value. */
export function topologyExtent(nodes: TopologyNode[], explode: number) {
  const xs = nodes.map((node) => node.position[0] * (1 + explode * 0.35))
  const ys = nodes.map((node) => node.position[1] * (1 + explode * 0.5))
  const minY = Math.min(...ys) - 1.6
  const maxY = Math.max(...ys) + 1.8
  return {
    width: (Math.max(...xs) - Math.min(...xs)) + 7,
    height: maxY - minY,
    centerY: (maxY + minY) / 2,
  }
}

function tierColor(palette: ScenePalette, tier: TopologyNode['tier']) {
  switch (tier) {
    case 'internet':
      return palette.neutral
    case 'edge':
      return palette.danger
    case 'core':
      return palette.network
    case 'distribution':
      return palette.subnet
    case 'cloud':
      return palette.accent
    default:
      return palette.host
  }
}

function LinkTube({ from, to, color }: { from: THREE.Vector3; to: THREE.Vector3; color: string }) {
  const { position, quaternion, length } = useMemo(() => {
    const direction = to.clone().sub(from)
    const length = direction.length()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize(),
    )
    return { position: from.clone().add(to).multiplyScalar(0.5), quaternion, length }
  }, [from, to])

  return (
    <mesh position={position} quaternion={quaternion} raycast={() => null}>
      <cylinderGeometry args={[0.035, 0.035, length, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.55} />
    </mesh>
  )
}

export function TopologyScene({
  nodes,
  links,
  explode,
  selected,
  onSelect,
}: {
  nodes: TopologyNode[]
  links: TopologyLink[]
  explode: number
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const palette = useScenePalette()

  const extent = topologyExtent(nodes, explode)
  const tierIndex = useMemo(() => {
    const counters = new Map<string, number>()
    const map = new Map<string, number>()
    for (const node of nodes) {
      const next = (counters.get(node.tier) ?? 0) + 1
      counters.set(node.tier, next)
      map.set(node.id, next - 1)
    }
    return map
  }, [nodes])

  const placed = useMemo(() => {
    const map = new Map<string, THREE.Vector3>()
    for (const node of nodes) {
      const [x, y, z] = node.position
      map.set(node.id, new THREE.Vector3(x * (1 + explode * 0.35), y * (1 + explode * 0.5), z))
    }
    return map
  }, [nodes, explode])

  return (
    <group position={[0, -extent.centerY, 0]}>
      {links.map(([a, b]) => {
        const from = placed.get(a)
        const to = placed.get(b)
        if (!from || !to) return null
        const active = selected === a || selected === b
        return <LinkTube key={`${a}-${b}`} from={from} to={to} color={active ? palette.accent : palette.edge} />
      })}

      {nodes.map((node) => {
        const position = placed.get(node.id)!
        const isSelected = selected === node.id
        const size = node.size ?? [2.4, 0.7, 1.4]
        return (
          <group key={node.id} position={position}>
            <mesh
              onClick={(event) => {
                event.stopPropagation()
                onSelect(isSelected ? null : node.id)
              }}
              scale={isSelected ? 1.12 : 1}
            >
              <boxGeometry args={size} />
              <meshStandardMaterial
                color={tierColor(palette, node.tier)}
                roughness={0.42}
                emissive={isSelected ? tierColor(palette, node.tier) : '#000000'}
                emissiveIntensity={isSelected ? 0.35 : 0}
              />
            </mesh>
            {/* Neighbouring labels in a tier are staggered so they never collide. */}
            <Html
              position={[0, size[1] / 2 + 0.6 + ((tierIndex.get(node.id) ?? 0) % 2) * 0.78, 0]}
              center
              className="scene-label"
              zIndexRange={[8, 0]}
            >
              <div className="text-center whitespace-nowrap">
                <div className="text-[0.68rem] font-semibold" style={{ color: palette.label }}>
                  {node.label}
                </div>
                {node.ipv4 ? (
                  <div className="font-mono text-[0.55rem]" style={{ color: palette.labelMuted }}>
                    {node.ipv4.split(' ')[0]}
                  </div>
                ) : null}
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

export function TopologyExplorer({
  caption,
  title = 'Production topology — where each subnet lives',
}: {
  caption?: React.ReactNode
  title?: string
}) {
  const palette = useScenePalette()
  const [explode, setExplode] = useState(0.45)
  const [selected, setSelected] = useState<string | null>('dist-campus')
  const node = REFERENCE_TOPOLOGY.nodes.find((candidate) => candidate.id === selected) ?? null

  return (
    <Figure title={title} caption={caption}>
      <Scene
        cameraPosition={[0, 3, 26]}
        fov={45}
        maxDistance={140}
        fit={topologyExtent(REFERENCE_TOPOLOGY.nodes, explode)}
      >
        <TopologyScene
          nodes={REFERENCE_TOPOLOGY.nodes}
          links={REFERENCE_TOPOLOGY.links}
          explode={explode}
          selected={selected}
          onSelect={setSelected}
        />
      </Scene>

      <div className="border-t border-line p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Explode" hint="Separate the tiers">
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(event) => setExplode(Number(event.target.value))} />
          </Field>
          <div className="flex items-end">
            <Legend
              items={[
                { color: palette.danger, label: 'Edge' },
                { color: palette.network, label: 'Core' },
                { color: palette.subnet, label: 'Distribution' },
                { color: palette.host, label: 'Access / segment' },
                { color: palette.accent, label: 'Cloud' },
              ]}
            />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-line bg-surface-2 p-4">
          {node ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-ink">{node.label}</span>
                <span className="text-xs uppercase tracking-wider text-ink-3">{node.tier}</span>
                {node.vlan ? <span className="text-xs text-ink-3">VLAN {node.vlan}</span> : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {node.ipv4 ? (
                  <div className="font-mono text-xs text-network">IPv4 · {node.ipv4}</div>
                ) : null}
                {node.ipv6 ? <div className="font-mono text-xs text-accent">IPv6 · {node.ipv6}</div> : null}
              </div>
              <p className="text-sm text-ink-2">
                <span className="font-medium text-ink">{node.role}.</span> {node.note}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-3">Click any block in the scene to see its allocation and why it is sized that way.</p>
          )}
        </div>
      </div>
    </Figure>
  )
}
