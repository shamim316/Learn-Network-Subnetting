import { useState } from 'react'
import { AddressAnatomyScene } from '../three/AddressAnatomy'
import { IPv6StructureScene } from '../three/IPv6Structure'
import { Scene } from '../three/scene'
import { Card, DataTable, Field, Legend, Mono, Stat, buttonClass, inputClass } from '../ui'
import { useScenePalette } from '../../theme'
import {
  binaryIPv4,
  blockSize,
  broadcastOf,
  classOf,
  firstHost,
  formatIPv4,
  lastHost,
  magicNumber,
  maskToPrefix,
  networkOf,
  parseCidr,
  parseIPv4,
  prefixToMask,
  specialRangeOf,
  usableHosts,
  wildcardOf,
} from '../../lib/ipv4'
import {
  approximateCount,
  countOf6,
  eui64FromMac,
  formatIPv6,
  formatIPv6Full,
  lastAddressOf6,
  networkOf6,
  parseIPv6Cidr,
  scopeOf6,
  solicitedNodeMulticast,
} from '../../lib/ipv6'

function IPv4Panel() {
  const palette = useScenePalette()
  const [text, setText] = useState('10.42.18.77/26')
  const [maskText, setMaskText] = useState('')
  const [explode, setExplode] = useState(0.3)

  const parsed = parseCidr(text, 24)
  const maskParsed = maskText.trim() === '' ? null : parseIPv4(maskText)
  const maskPrefix = maskParsed && maskParsed.ok ? maskToPrefix(maskParsed.value) : null

  if (!parsed.ok) {
    return (
      <Card>
        <Field label="Address / CIDR" error={parsed.error}>
          <input className={inputClass} value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
        </Field>
      </Card>
    )
  }

  const address = parsed.value.address
  const prefix = maskPrefix && maskPrefix.ok ? maskPrefix.value : parsed.value.prefix
  const network = networkOf(address, prefix)
  const broadcast = broadcastOf(address, prefix)
  const addressClass = classOf(address)
  const special = specialRangeOf(address)
  const magic = magicNumber(prefix)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Address / CIDR" hint="e.g. 10.42.18.77/26">
          <input className={inputClass} value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
        </Field>
        <Field
          label="Or a dotted mask"
          hint={maskParsed && !maskParsed.ok ? undefined : 'Overrides the /prefix above'}
          error={maskParsed && !maskParsed.ok ? maskParsed.error : maskPrefix && !maskPrefix.ok ? maskPrefix.error : null}
        >
          <input
            className={inputClass}
            placeholder="255.255.255.192"
            value={maskText}
            onChange={(event) => setMaskText(event.target.value)}
            spellCheck={false}
          />
        </Field>
        <Field label={`Prefix /${prefix}`} hint={`${32 - prefix} host bits`}>
          <input
            type="range"
            min={0}
            max={32}
            value={prefix}
            onChange={(event) => {
              setMaskText('')
              setText(`${formatIPv4(address)}/${event.target.value}`)
            }}
          />
        </Field>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <Scene cameraPosition={[0, 3.2, 23]} fov={42} height="h-[20rem]" maxDistance={80} fit={{ width: 23, height: 9 }}>
          <AddressAnatomyScene address={address} prefix={prefix} parentPrefix={prefix} explode={explode} />
        </Scene>
        <div className="flex flex-wrap items-center gap-4 border-t border-line bg-surface p-3">
          <label className="flex items-center gap-2 text-xs text-ink-3">
            Explode
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(event) => setExplode(Number(event.target.value))} />
          </label>
          <Legend
            items={[
              { color: palette.network, label: 'Network bits' },
              { color: palette.host, label: 'Host bits' },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Network address" value={`${formatIPv4(network)}/${prefix}`} />
        <Stat label="Broadcast" value={prefix >= 31 ? '— (no broadcast)' : formatIPv4(broadcast)} />
        <Stat label="First host" value={prefix >= 32 ? formatIPv4(network) : formatIPv4(firstHost(address, prefix))} />
        <Stat label="Last host" value={prefix >= 32 ? formatIPv4(network) : formatIPv4(lastHost(address, prefix))} />
        <Stat label="Subnet mask" value={formatIPv4(prefixToMask(prefix))} />
        <Stat label="Wildcard mask" value={formatIPv4(wildcardOf(prefix))} hint="ACL / OSPF form" />
        <Stat label="Total addresses" value={blockSize(prefix).toLocaleString()} hint={`2^${32 - prefix}`} />
        <Stat label="Usable hosts" value={usableHosts(prefix).toLocaleString()} hint={prefix === 31 ? 'RFC 3021 point-to-point' : prefix === 32 ? 'single host route' : '2^h − 2'} />
      </div>

      <DataTable
        head={['Property', 'Value']}
        rows={[
          ['Address in binary', <span className="bits text-ink">{binaryIPv4(address)}</span>],
          ['Mask in binary', <span className="bits text-ink">{binaryIPv4(prefixToMask(prefix))}</span>],
          ['Network in binary', <span className="bits text-ink">{binaryIPv4(network)}</span>],
          ['Integer value', <Mono>{(address >>> 0).toLocaleString()}</Mono>],
          ['Hexadecimal', <Mono>0x{(address >>> 0).toString(16).padStart(8, '0')}</Mono>],
          [
            'Legacy class',
            <span>
              Class {addressClass.name} — <span className="text-ink-3">{addressClass.note}</span>
            </span>,
          ],
          [
            'Reserved range',
            special ? (
              <span>
                {special.label} — <Mono>{special.cidr}</Mono> <span className="text-ink-3">({special.reference})</span>
              </span>
            ) : (
              <span className="text-ink-3">None — this is ordinary public unicast space.</span>
            ),
          ],
          [
            'Block increment',
            <span>
              every <Mono>{magic.increment}</Mono> in octet {magic.octetIndex + 1} — subnets start at{' '}
              <Mono>{formatIPv4(network)}</Mono>, <Mono>{formatIPv4((network + blockSize(prefix)) >>> 0)}</Mono>, …
            </span>,
          ],
          ['Reverse DNS zone', <Mono>{formatIPv4(address).split('.').reverse().join('.')}.in-addr.arpa</Mono>],
        ]}
      />
    </div>
  )
}

function IPv6Panel() {
  const palette = useScenePalette()
  const [text, setText] = useState('2001:db8:acad:12::a1/64')
  const [mac, setMac] = useState('00:1a:2b:3c:4d:5e')
  const [explode, setExplode] = useState(0.3)
  const [routing, setRouting] = useState(48)

  const parsed = parseIPv6Cidr(text, 64)
  const eui = eui64FromMac(mac)

  if (!parsed.ok) {
    return (
      <Card>
        <Field label="IPv6 address / prefix" error={parsed.error}>
          <input className={inputClass} value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
        </Field>
      </Card>
    )
  }

  const { address, prefix } = parsed.value
  const network = networkOf6(address, prefix)
  const last = lastAddressOf6(address, prefix)
  const scope = scopeOf6(address)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="IPv6 address / prefix" hint="e.g. 2001:db8:acad:12::a1/64">
          <input className={inputClass} value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
        </Field>
        <Field label={`Routing prefix /${Math.min(routing, prefix)}`} hint="Where your delegation ends">
          <input type="range" min={0} max={64} step={4} value={routing} onChange={(event) => setRouting(Number(event.target.value))} />
        </Field>
        <Field label="Explode" hint="Separate hextets and fields">
          <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(event) => setExplode(Number(event.target.value))} />
        </Field>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <Scene cameraPosition={[0, 0.5, 16]} fov={45} height="h-[20rem]" maxDistance={60} fit={{ width: 15, height: 9.5 }}>
          <IPv6StructureScene address={address} routingPrefix={Math.min(routing, prefix)} subnetEnd={prefix} explode={explode} />
        </Scene>
        <div className="flex flex-wrap items-center gap-4 border-t border-line bg-surface p-3">
          <Legend
            items={[
              { color: palette.accent, label: 'Routing prefix' },
              { color: palette.subnet, label: 'Subnet ID' },
              { color: palette.host, label: 'Interface ID' },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Stat label="Compressed" value={formatIPv6(address)} />
        <Stat label="Expanded" value={<span className="bits">{formatIPv6Full(address)}</span>} />
        <Stat label="Prefix" value={`${formatIPv6(network)}/${prefix}`} />
        <Stat label="Last address" value={formatIPv6(last)} />
      </div>

      <DataTable
        head={['Property', 'Value']}
        rows={[
          ['Addresses in prefix', <Mono>{approximateCount(prefix)}</Mono>],
          [
            '/64 subnets available',
            prefix <= 64 ? <Mono>{(countOf6(prefix) / countOf6(64)).toLocaleString()}</Mono> : <span className="text-ink-3">Prefix is longer than /64 — it is inside a single subnet.</span>,
          ],
          [
            'Scope',
            scope ? (
              <span>
                {scope.name} — <Mono>{scope.cidr}</Mono>
                <span className="mt-1 block text-xs text-ink-3">{scope.description}</span>
              </span>
            ) : (
              <span className="text-ink-3">No reserved-range match.</span>
            ),
          ],
          ['Solicited-node multicast', <Mono>{formatIPv6(solicitedNodeMulticast(address))}</Mono>],
          ['Subnet-router anycast', <Mono>{formatIPv6(network)}</Mono>],
          [
            'Reverse DNS zone',
            <span className="bits text-xs text-ink">
              {formatIPv6Full(address).replace(/:/g, '').split('').reverse().join('.')}.ip6.arpa
            </span>,
          ],
        ]}
      />

      <Card>
        <p className="mb-3 text-sm font-semibold text-ink">Modified EUI-64 from a MAC address</p>
        <Field label="MAC address" error={eui.ok ? null : eui.error}>
          <input className={inputClass} value={mac} onChange={(event) => setMac(event.target.value)} spellCheck={false} />
        </Field>
        {eui.ok ? (
          <>
            <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm text-ink-2">
              {eui.value.steps.map((step) => (
                <li key={step} className="font-mono text-xs">
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-3">
              <Stat
                label="Resulting SLAAC address"
                value={formatIPv6(networkOf6(address, 64) | eui.value.interfaceId)}
                hint="prefix from the router advertisement + interface ID from the MAC"
              />
            </div>
          </>
        ) : null}
      </Card>
    </div>
  )
}

export function SubnetCalculator() {
  const [family, setFamily] = useState<'v4' | 'v6'>('v4')
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {(['v4', 'v6'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFamily(option)}
            className={`${buttonClass} ${family === option ? 'border-network text-network' : ''}`}
            aria-pressed={family === option}
          >
            {option === 'v4' ? 'IPv4' : 'IPv6'}
          </button>
        ))}
      </div>
      {family === 'v4' ? <IPv4Panel /> : <IPv6Panel />}
    </div>
  )
}
