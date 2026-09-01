/**
 * Route summarization (supernetting) for IPv4.
 */

import { binaryIPv4, blockSize, compareIPv4, formatCidr, networkOf, type Cidr } from './ipv4'
import { rangeToCidrs, u32 } from './vlsm'

const startOf = (cidr: Cidr) => networkOf(cidr.address, cidr.prefix)
const endOf = (cidr: Cidr) => networkOf(cidr.address, cidr.prefix) + blockSize(cidr.prefix) - 1

/**
 * Exact aggregation: merge contained and adjacent blocks until nothing more
 * collapses. The result covers precisely the input addresses — no more.
 */
export function aggregate(inputs: Cidr[]): Cidr[] {
  if (inputs.length === 0) return []
  const ranges = inputs
    .map((cidr) => ({ start: startOf(cidr), end: endOf(cidr) }))
    .sort((a, b) => compareIPv4(a.start, b.start) || a.end - b.end)

  const merged: { start: number; end: number }[] = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end + 1) {
      last.end = Math.max(last.end, range.end)
    } else {
      merged.push({ ...range })
    }
  }

  return merged.flatMap((range) => rangeToCidrs(range.start, range.end))
}

/**
 * The single prefix that covers every input: keep the bits all of them share.
 * This is what a router actually advertises when you configure one summary
 * route, and it may include addresses you never allocated.
 */
export function commonSupernet(inputs: Cidr[]): { cidr: Cidr; sharedBits: number; extraAddresses: number } | null {
  if (inputs.length === 0) return null
  const low = inputs.reduce((min, c) => (compareIPv4(startOf(c), min) < 0 ? startOf(c) : min), startOf(inputs[0]))
  const high = inputs.reduce((max, c) => (compareIPv4(endOf(c), max) > 0 ? endOf(c) : max), endOf(inputs[0]))

  let sharedBits = 32
  for (let bit = 31; bit >= 0; bit--) {
    if (((low >>> bit) & 1) !== ((high >>> bit) & 1)) {
      sharedBits = 31 - bit
      break
    }
  }
  const cidr: Cidr = { address: u32(networkOf(low, sharedBits)), prefix: sharedBits }
  const covered = blockSize(sharedBits)
  const wanted = aggregate(inputs).reduce((sum, c) => sum + blockSize(c.prefix), 0)
  return { cidr, sharedBits, extraAddresses: covered - wanted }
}

/** Per-bit agreement across the inputs, for the "where do they stop matching" view. */
export function bitAgreement(inputs: Cidr[]): { bits: (0 | 1 | null)[]; rows: { label: string; binary: string }[] } {
  const bits: (0 | 1 | null)[] = []
  const networks = inputs.map((cidr) => startOf(cidr))
  for (let i = 0; i < 32; i++) {
    const shift = 31 - i
    const first = ((networks[0] ?? 0) >>> shift) & 1
    const same = networks.every((n) => ((n >>> shift) & 1) === first)
    bits.push(same ? ((first as 0 | 1)) : null)
  }
  const rows = inputs.map((cidr) => ({
    label: formatCidr({ address: startOf(cidr), prefix: cidr.prefix }),
    binary: binaryIPv4(startOf(cidr)),
  }))
  return { bits, rows }
}
