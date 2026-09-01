/**
 * VLSM allocation and the range/CIDR conversions it needs.
 *
 * Range math uses plain numbers rather than bitwise operators, because an
 * inclusive range can legitimately end at 2^32 - 1 and its exclusive end at
 * 2^32, which no longer fits in 32 bits.
 */

import { blockSize, usableHosts, networkOf, formatIPv4, type Cidr } from './ipv4'

export const u32 = (n: number): number => n >>> 0

/** Smallest prefix length whose block still has room for `hosts` interfaces. */
export function prefixForHosts(hosts: number): number | null {
  for (let prefix = 32; prefix >= 0; prefix--) {
    if (usableHosts(prefix) >= hosts) return prefix
  }
  return null
}

/** Break an inclusive address range into the fewest aligned CIDR blocks. */
export function rangeToCidrs(start: number, end: number): Cidr[] {
  const blocks: Cidr[] = []
  let cursor = start
  while (cursor <= end) {
    // The largest block that both starts on `cursor`'s alignment and fits.
    let size = cursor === 0 ? Math.pow(2, 32) : (cursor & -cursor) >>> 0
    const remaining = end - cursor + 1
    while (size > remaining) size /= 2
    blocks.push({ address: u32(cursor), prefix: 32 - Math.log2(size) })
    cursor += size
  }
  return blocks
}

export type Requirement = {
  id: string
  name: string
  hosts: number
}

export type Allocation = {
  requirement: Requirement
  cidr: Cidr
  prefix: number
  size: number
  usable: number
  spare: number
}

export type VlsmPlan = {
  base: Cidr
  allocations: Allocation[]
  free: Cidr[]
  usedAddresses: number
  totalAddresses: number
  errors: string[]
}

/**
 * Allocate largest-first from the bottom of the block. Sorting by size is what
 * keeps every subnet naturally aligned: a /26 can only start on a /26 boundary,
 * and handing out the big blocks first guarantees those boundaries still exist.
 */
export function planVlsm(base: Cidr, requirements: Requirement[]): VlsmPlan {
  const network = networkOf(base.address, base.prefix)
  const totalAddresses = blockSize(base.prefix)
  const end = network + totalAddresses - 1
  const errors: string[] = []

  const sized = requirements
    .map((requirement) => {
      const prefix = prefixForHosts(requirement.hosts)
      return { requirement, prefix }
    })
    .filter((entry) => {
      if (entry.prefix === null) {
        errors.push(`"${entry.requirement.name}" asks for ${entry.requirement.hosts} hosts — more than IPv4 can express in one subnet.`)
        return false
      }
      return true
    })
    .sort((a, b) => (a.prefix! - b.prefix!) || a.requirement.name.localeCompare(b.requirement.name))

  const allocations: Allocation[] = []
  let cursor = network

  for (const entry of sized) {
    const prefix = entry.prefix!
    const size = blockSize(prefix)
    // Advance to the next boundary this block can legally start on.
    const aligned = Math.ceil(cursor / size) * size
    if (aligned + size - 1 > end) {
      errors.push(
        `Out of space: "${entry.requirement.name}" needs a /${prefix} (${size} addresses) and ${formatIPv4(base.address)}/${base.prefix} has no room left.`,
      )
      continue
    }
    const cidr: Cidr = { address: u32(aligned), prefix }
    allocations.push({
      requirement: entry.requirement,
      cidr,
      prefix,
      size,
      usable: usableHosts(prefix),
      spare: usableHosts(prefix) - entry.requirement.hosts,
    })
    cursor = aligned + size
  }

  const free = cursor <= end ? rangeToCidrs(cursor, end) : []
  return {
    base: { address: u32(network), prefix: base.prefix },
    allocations,
    free,
    usedAddresses: cursor - network,
    totalAddresses,
    errors,
  }
}

/** What an equal-size (classful-style) split would have cost, for comparison. */
export function fixedLengthCost(_base: Cidr, requirements: Requirement[]): { prefix: number | null; subnets: number; addresses: number } {
  const largest = requirements.reduce((max, r) => Math.max(max, r.hosts), 0)
  const prefix = prefixForHosts(largest)
  if (prefix === null || requirements.length === 0) return { prefix: null, subnets: 0, addresses: 0 }
  const needed = requirements.length
  return { prefix, subnets: needed, addresses: needed * blockSize(prefix) }
}
