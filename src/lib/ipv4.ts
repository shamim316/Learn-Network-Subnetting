/**
 * IPv4 address math.
 *
 * Addresses are held as unsigned 32-bit numbers. Every bitwise result is passed
 * through `>>> 0` because JavaScript's bitwise operators work on *signed* 32-bit
 * integers, so anything with the high bit set (128.0.0.0 and up) comes back
 * negative without it.
 */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export const ok = <T,>(value: T): Result<T> => ({ ok: true, value })
export const err = <T,>(error: string): Result<T> => ({ ok: false, error })

export const IPV4_BITS = 32

/** Parse dotted-quad notation, e.g. "192.168.10.37". */
export function parseIPv4(input: string): Result<number> {
  const text = input.trim()
  if (text === '') return err('Enter an IPv4 address.')
  const parts = text.split('.')
  if (parts.length !== 4) return err('An IPv4 address has four octets separated by dots.')
  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return err(`"${part}" is not a number between 0 and 255.`)
    const n = Number(part)
    if (n > 255) return err(`Octets max out at 255 — "${part}" does not fit in 8 bits.`)
    value = (value * 256 + n) >>> 0
  }
  return ok(value >>> 0)
}

export function formatIPv4(value: number): string {
  return octetsOf(value).join('.')
}

export function octetsOf(value: number): [number, number, number, number] {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]
}

/** All 32 bits, most significant first. */
export function bitsOf(value: number): number[] {
  const bits: number[] = []
  for (let i = 31; i >= 0; i--) bits.push((value >>> i) & 1)
  return bits
}

export function bitsToValue(bits: number[]): number {
  return bits.reduce((acc, bit) => ((acc << 1) | bit) >>> 0, 0) >>> 0
}

/** "11000000.10101000.00001010.00100101" */
export function binaryIPv4(value: number, separator = '.'): string {
  return octetsOf(value)
    .map((o) => o.toString(2).padStart(8, '0'))
    .join(separator)
}

export function prefixToMask(prefix: number): number {
  if (prefix <= 0) return 0
  if (prefix >= 32) return 0xffffffff >>> 0
  return (0xffffffff << (32 - prefix)) >>> 0
}

export function maskToPrefix(mask: number): Result<number> {
  const bits = bitsOf(mask)
  const firstZero = bits.indexOf(0)
  const prefix = firstZero === -1 ? 32 : firstZero
  // A legal mask is a run of ones followed by a run of zeros — nothing else.
  if (bits.slice(prefix).some((b) => b === 1)) {
    return err(`${formatIPv4(mask)} is not a valid mask: the 1 bits must be contiguous.`)
  }
  return ok(prefix)
}

export function wildcardOf(prefix: number): number {
  return (~prefixToMask(prefix)) >>> 0
}

export function networkOf(address: number, prefix: number): number {
  return (address & prefixToMask(prefix)) >>> 0
}

export function broadcastOf(address: number, prefix: number): number {
  return (networkOf(address, prefix) | wildcardOf(prefix)) >>> 0
}

/** Total addresses in the block, including network and broadcast. */
export function blockSize(prefix: number): number {
  return Math.pow(2, 32 - prefix)
}

/**
 * Addresses you can actually assign to an interface.
 * /31 carries two usable addresses on point-to-point links (RFC 3021) and /32
 * is a single host route, so neither one subtracts network + broadcast.
 */
export function usableHosts(prefix: number): number {
  if (prefix >= 32) return 1
  if (prefix === 31) return 2
  return blockSize(prefix) - 2
}

export function firstHost(address: number, prefix: number): number {
  const network = networkOf(address, prefix)
  return prefix >= 31 ? network : (network + 1) >>> 0
}

export function lastHost(address: number, prefix: number): number {
  const broadcast = broadcastOf(address, prefix)
  return prefix >= 31 ? broadcast : (broadcast - 1) >>> 0
}

export type Cidr = { address: number; prefix: number }

/** Parse "10.20.0.0/16"; a bare address is treated as a /32. */
export function parseCidr(input: string, defaultPrefix = 32): Result<Cidr> {
  const text = input.trim()
  const slash = text.indexOf('/')
  const addressPart = slash === -1 ? text : text.slice(0, slash)
  const prefixPart = slash === -1 ? String(defaultPrefix) : text.slice(slash + 1).trim()
  const address = parseIPv4(addressPart)
  if (!address.ok) return err(address.error)
  if (!/^\d{1,2}$/.test(prefixPart)) return err(`"${prefixPart}" is not a prefix length between 0 and 32.`)
  const prefix = Number(prefixPart)
  if (prefix > 32) return err('IPv4 prefixes stop at /32 — there are only 32 bits.')
  return ok({ address: address.value, prefix })
}

export function formatCidr(cidr: Cidr): string {
  return `${formatIPv4(cidr.address)}/${cidr.prefix}`
}

export function sameNetwork(a: number, b: number, prefix: number): boolean {
  return networkOf(a, prefix) === networkOf(b, prefix)
}

export function contains(outer: Cidr, inner: Cidr): boolean {
  if (inner.prefix < outer.prefix) return false
  return networkOf(inner.address, outer.prefix) === networkOf(outer.address, outer.prefix)
}

export function overlaps(a: Cidr, b: Cidr): boolean {
  const prefix = Math.min(a.prefix, b.prefix)
  return networkOf(a.address, prefix) === networkOf(b.address, prefix)
}

/** Split a block into equal children of `newPrefix`, capped at `limit` entries. */
export function subnetsOf(base: Cidr, newPrefix: number, limit = 256): { subnets: Cidr[]; total: number } {
  const network = networkOf(base.address, base.prefix)
  const total = Math.pow(2, Math.max(0, newPrefix - base.prefix))
  const step = blockSize(newPrefix)
  const subnets: Cidr[] = []
  for (let i = 0; i < Math.min(total, limit); i++) {
    subnets.push({ address: (network + i * step) >>> 0, prefix: newPrefix })
  }
  return { subnets, total }
}

/** The "magic number": the increment between consecutive subnets. */
export function magicNumber(prefix: number): { increment: number; octetIndex: number } {
  const octetIndex = Math.min(3, Math.floor((prefix - 1) / 8))
  const bitsInOctet = prefix - octetIndex * 8
  const increment = Math.pow(2, 8 - bitsInOctet)
  return { increment, octetIndex }
}

export type AddressClass = 'A' | 'B' | 'C' | 'D' | 'E'

export function classOf(address: number): { name: AddressClass; note: string; defaultPrefix: number | null } {
  const first = (address >>> 24) & 255
  if (first < 128) return { name: 'A', note: '0.0.0.0 – 127.255.255.255, default mask /8', defaultPrefix: 8 }
  if (first < 192) return { name: 'B', note: '128.0.0.0 – 191.255.255.255, default mask /16', defaultPrefix: 16 }
  if (first < 224) return { name: 'C', note: '192.0.0.0 – 223.255.255.255, default mask /24', defaultPrefix: 24 }
  if (first < 240) return { name: 'D', note: '224.0.0.0 – 239.255.255.255, multicast', defaultPrefix: null }
  return { name: 'E', note: '240.0.0.0 – 255.255.255.255, reserved / experimental', defaultPrefix: null }
}

type SpecialRange = { cidr: string; label: string; reference: string }

const SPECIAL_RANGES: SpecialRange[] = [
  { cidr: '0.0.0.0/8', label: 'This network ("unspecified" source)', reference: 'RFC 1122' },
  { cidr: '10.0.0.0/8', label: 'Private use', reference: 'RFC 1918' },
  { cidr: '100.64.0.0/10', label: 'Carrier-grade NAT shared space', reference: 'RFC 6598' },
  { cidr: '127.0.0.0/8', label: 'Loopback', reference: 'RFC 1122' },
  { cidr: '169.254.0.0/16', label: 'Link-local (APIPA)', reference: 'RFC 3927' },
  { cidr: '172.16.0.0/12', label: 'Private use', reference: 'RFC 1918' },
  { cidr: '192.0.2.0/24', label: 'Documentation (TEST-NET-1)', reference: 'RFC 5737' },
  { cidr: '192.88.99.0/24', label: '6to4 relay anycast (deprecated)', reference: 'RFC 7526' },
  { cidr: '192.168.0.0/16', label: 'Private use', reference: 'RFC 1918' },
  { cidr: '198.18.0.0/15', label: 'Benchmark testing', reference: 'RFC 2544' },
  { cidr: '198.51.100.0/24', label: 'Documentation (TEST-NET-2)', reference: 'RFC 5737' },
  { cidr: '203.0.113.0/24', label: 'Documentation (TEST-NET-3)', reference: 'RFC 5737' },
  { cidr: '224.0.0.0/4', label: 'Multicast', reference: 'RFC 5771' },
  { cidr: '240.0.0.0/4', label: 'Reserved for future use', reference: 'RFC 1112' },
  { cidr: '255.255.255.255/32', label: 'Limited broadcast', reference: 'RFC 919' },
]

/** Which reserved block, if any, an address falls in. */
export function specialRangeOf(address: number): SpecialRange | null {
  for (const range of SPECIAL_RANGES) {
    const parsed = parseCidr(range.cidr)
    if (parsed.ok && contains(parsed.value, { address, prefix: 32 })) return range
  }
  return null
}

export function isPrivate(address: number): boolean {
  const range = specialRangeOf(address)
  return range?.label === 'Private use'
}

export const SPECIAL_IPV4_RANGES = SPECIAL_RANGES

/** Sort helper that keeps unsigned order (plain `a - b` overflows to negatives). */
export function compareIPv4(a: number, b: number): number {
  return a >>> 0 < b >>> 0 ? -1 : a >>> 0 > b >>> 0 ? 1 : 0
}
