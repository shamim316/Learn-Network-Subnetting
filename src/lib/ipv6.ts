/**
 * IPv6 address math.
 *
 * 128 bits does not fit in a JavaScript number, so addresses are held as
 * BigInt. Formatting follows RFC 5952 (lowercase, no leading zeros, one "::"
 * over the longest run of zero hextets).
 */

import type { Result } from './ipv4'
import { ok, err, parseIPv4 } from './ipv4'

export const IPV6_BITS = 128
export const IPV6_MAX = (1n << 128n) - 1n

export function hextetsOf(value: bigint): number[] {
  const hextets: number[] = []
  for (let i = 7; i >= 0; i--) hextets.push(Number((value >> BigInt(i * 16)) & 0xffffn))
  return hextets
}

export function bitsOf6(value: bigint): number[] {
  const bits: number[] = []
  for (let i = 127; i >= 0; i--) bits.push(Number((value >> BigInt(i)) & 1n))
  return bits
}

/** Every hextet padded to four digits: 2001:0db8:0000:0000:0000:0000:0000:0001 */
export function formatIPv6Full(value: bigint): string {
  return hextetsOf(value)
    .map((h) => h.toString(16).padStart(4, '0'))
    .join(':')
}

/** RFC 5952 canonical form: 2001:db8::1 */
export function formatIPv6(value: bigint): string {
  const hextets = hextetsOf(value)
  // Find the longest run of consecutive zero hextets; ties go to the leftmost.
  let bestStart = -1
  let bestLength = 0
  let start = -1
  let length = 0
  for (let i = 0; i < 8; i++) {
    if (hextets[i] === 0) {
      if (start === -1) start = i
      length++
      if (length > bestLength) {
        bestStart = start
        bestLength = length
      }
    } else {
      start = -1
      length = 0
    }
  }
  const text = hextets.map((h) => h.toString(16))
  if (bestLength < 2) return text.join(':')
  const head = text.slice(0, bestStart).join(':')
  const tail = text.slice(bestStart + bestLength).join(':')
  return `${head}::${tail}`
}

/** Parse any RFC 4291 textual form, including "::" and a trailing IPv4 literal. */
export function parseIPv6(input: string): Result<bigint> {
  let text = input.trim()
  if (text === '') return err('Enter an IPv6 address.')
  if (text.startsWith('[') && text.endsWith(']')) text = text.slice(1, -1)
  const zone = text.indexOf('%')
  if (zone !== -1) text = text.slice(0, zone) // drop the %eth0 scope id
  if (!/^[0-9a-fA-F:.]+$/.test(text)) return err('IPv6 uses hex digits, colons, and (for embedded IPv4) dots.')

  // A trailing dotted quad stands in for the final two hextets; rewrite it as
  // those two hex groups so the rest of the parser sees an ordinary address.
  if (text.includes('.')) {
    const lastColon = text.lastIndexOf(':')
    if (lastColon === -1) return err('That looks like an IPv4 address, not IPv6.')
    const v4 = parseIPv4(text.slice(lastColon + 1))
    if (!v4.ok) return err(`Embedded IPv4 part: ${v4.error}`)
    const high = ((v4.value >>> 16) & 0xffff).toString(16)
    const low = (v4.value & 0xffff).toString(16)
    text = `${text.slice(0, lastColon + 1)}${high}:${low}`
  }

  const doubleColon = text.indexOf('::')
  if (text.indexOf('::', doubleColon + 1) !== -1) return err('"::" can only appear once — otherwise the gap is ambiguous.')

  let head: string[]
  let tail: string[]
  if (doubleColon === -1) {
    head = text.split(':')
    tail = []
  } else {
    const left = text.slice(0, doubleColon)
    const right = text.slice(doubleColon + 2)
    head = left === '' ? [] : left.split(':')
    tail = right === '' ? [] : right.split(':')
  }
  if (head.some((g) => g === '') || tail.some((g) => g === '')) return err('Empty group — check the colons.')

  const groups = [...head, ...tail]
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return err(`"${group}" is not a 1–4 digit hex group.`)
  }

  const total = groups.length
  if (doubleColon === -1) {
    if (total !== 8) return err(`An uncompressed IPv6 address needs exactly 8 groups — got ${total}.`)
  } else if (total >= 8) {
    return err('"::" has to stand in for at least one zero group.')
  }

  const parsedHead = head.map((g) => parseInt(g, 16))
  const parsedTail = tail.map((g) => parseInt(g, 16))
  const gap = 8 - parsedHead.length - parsedTail.length
  const hextets = [...parsedHead, ...new Array(Math.max(0, gap)).fill(0), ...parsedTail]

  let value = 0n
  for (const hextet of hextets) value = (value << 16n) | BigInt(hextet)
  return ok(value)
}

export type Cidr6 = { address: bigint; prefix: number }

export function parseIPv6Cidr(input: string, defaultPrefix = 128): Result<Cidr6> {
  const text = input.trim()
  const slash = text.lastIndexOf('/')
  const addressPart = slash === -1 ? text : text.slice(0, slash)
  const prefixPart = slash === -1 ? String(defaultPrefix) : text.slice(slash + 1).trim()
  const address = parseIPv6(addressPart)
  if (!address.ok) return err(address.error)
  if (!/^\d{1,3}$/.test(prefixPart)) return err(`"${prefixPart}" is not a prefix length between 0 and 128.`)
  const prefix = Number(prefixPart)
  if (prefix > 128) return err('IPv6 prefixes stop at /128.')
  return ok({ address: address.value, prefix })
}

export function maskOf6(prefix: number): bigint {
  if (prefix <= 0) return 0n
  if (prefix >= 128) return IPV6_MAX
  return ((1n << BigInt(prefix)) - 1n) << BigInt(128 - prefix)
}

export function networkOf6(address: bigint, prefix: number): bigint {
  return address & maskOf6(prefix)
}

export function lastAddressOf6(address: bigint, prefix: number): bigint {
  return networkOf6(address, prefix) | (IPV6_MAX >> BigInt(prefix))
}

export function countOf6(prefix: number): bigint {
  return 1n << BigInt(128 - prefix)
}

export function formatCidr6(cidr: Cidr6): string {
  return `${formatIPv6(cidr.address)}/${cidr.prefix}`
}

export function contains6(outer: Cidr6, inner: Cidr6): boolean {
  if (inner.prefix < outer.prefix) return false
  return networkOf6(inner.address, outer.prefix) === networkOf6(outer.address, outer.prefix)
}

/** Group a big count into thousands separators without going through Number. */
export function formatBigCount(value: bigint): string {
  return value.toLocaleString('en-US')
}

/** A readable approximation for counts too large to take in as digits. */
export function approximateCount(prefix: number): string {
  const hostBits = 128 - prefix
  if (hostBits <= 20) return formatBigCount(countOf6(prefix))
  return `2^${hostBits} (≈ 10^${Math.round(hostBits * 0.30103)})`
}

export type IPv6Scope = {
  name: string
  cidr: string
  description: string
}

const IPV6_RANGES: IPv6Scope[] = [
  { name: 'Unspecified', cidr: '::/128', description: 'The all-zeros address. A source address that means "I do not have one yet" (used during DHCPv6 / DAD).' },
  { name: 'Loopback', cidr: '::1/128', description: 'The IPv6 equivalent of 127.0.0.1. One address instead of a whole /8.' },
  { name: 'IPv4-mapped', cidr: '::ffff:0:0/96', description: 'Carries an IPv4 address inside an IPv6 socket API, e.g. ::ffff:192.0.2.1.' },
  { name: 'Documentation', cidr: '2001:db8::/32', description: 'Reserved for examples and documentation — the IPv6 counterpart of 192.0.2.0/24.' },
  { name: 'Global unicast', cidr: '2000::/3', description: 'Publicly routable space delegated by the RIRs. Everything that starts with 2 or 3.' },
  { name: 'Unique local (ULA)', cidr: 'fc00::/7', description: 'Private, non-globally-routed addressing. In practice fd00::/8 with a random 40-bit global ID.' },
  { name: 'Link-local', cidr: 'fe80::/10', description: 'Auto-configured on every interface, never routed. Used by ND, OSPFv3, and BGP next-hops.' },
  { name: 'Multicast', cidr: 'ff00::/8', description: 'One-to-many. IPv6 has no broadcast — it uses scoped multicast groups instead.' },
]

export const IPV6_SCOPES = IPV6_RANGES

export function scopeOf6(address: bigint): IPv6Scope | null {
  // Ordered most specific first so ::1 does not match ::/128's sibling ranges.
  const ordered = [...IPV6_RANGES].sort((a, b) => {
    const pa = Number(a.cidr.split('/')[1])
    const pb = Number(b.cidr.split('/')[1])
    return pb - pa
  })
  for (const range of ordered) {
    const parsed = parseIPv6Cidr(range.cidr)
    if (parsed.ok && contains6(parsed.value, { address, prefix: 128 })) return range
  }
  return null
}

/** Build the modified EUI-64 interface identifier from a 48-bit MAC address. */
export function eui64FromMac(mac: string): Result<{ interfaceId: bigint; steps: string[] }> {
  const hex = mac.replace(/[.:-]/g, '').toLowerCase()
  if (!/^[0-9a-f]{12}$/.test(hex)) return err('A MAC address has 12 hex digits, e.g. 00:1a:2b:3c:4d:5e.')
  const first = parseInt(hex.slice(0, 2), 16)
  const flipped = (first ^ 0b00000010) & 0xff
  const assembled = `${flipped.toString(16).padStart(2, '0')}${hex.slice(2, 6)}fffe${hex.slice(6)}`
  const interfaceId = BigInt('0x' + assembled)
  const steps = [
    `MAC ${hex.match(/.{2}/g)!.join(':')}`,
    `Split in half and insert ff:fe in the middle → ${hex.slice(0, 6)}:fffe:${hex.slice(6)}`,
    `Flip the universal/local bit (bit 7) of the first byte: ${first.toString(2).padStart(8, '0')} → ${flipped.toString(2).padStart(8, '0')}`,
    `Interface ID = ${(assembled.match(/.{4}/g) ?? []).join(':')}`,
  ]
  return ok({ interfaceId, steps })
}

/** The solicited-node multicast group an address joins: ff02::1:ffXX:XXXX */
export function solicitedNodeMulticast(address: bigint): bigint {
  const base = parseIPv6('ff02::1:ff00:0')
  if (!base.ok) return 0n
  return base.value | (address & 0xffffffn)
}

export function compareIPv6(a: bigint, b: bigint): number {
  return a < b ? -1 : a > b ? 1 : 0
}
