export type ModuleMeta = {
  slug: string
  path: string
  number: number
  title: string
  blurb: string
  minutes: number
  part: string
}

export type Part = {
  title: string
  summary: string
  modules: ModuleMeta[]
}

const raw: { part: string; summary: string; modules: Omit<ModuleMeta, 'number' | 'path' | 'part'>[] }[] = [
  {
    part: 'Part 1 — Foundations',
    summary: 'What a network boundary actually is, and the binary you need before any of the rest makes sense.',
    modules: [
      {
        slug: 'why-subnet',
        title: 'Why Networks Get Divided',
        blurb: 'Broadcast domains, failure domains, and policy boundaries — the three reasons a flat network stops working.',
        minutes: 10,
      },
      {
        slug: 'binary',
        title: 'Bits, Bytes, and Base-2',
        blurb: 'Place values, powers of two, and converting between binary, decimal, and hex without a calculator.',
        minutes: 12,
      },
    ],
  },
  {
    part: 'Part 2 — IPv4',
    summary: 'From the 32-bit address to a fully right-sized, summarizable IPv4 plan.',
    modules: [
      {
        slug: 'ipv4-anatomy',
        title: 'Anatomy of an IPv4 Address',
        blurb: 'Four octets, 32 bits, and the reserved ranges you must recognise on sight.',
        minutes: 14,
      },
      {
        slug: 'masks-and-cidr',
        title: 'Masks, Prefixes, and CIDR',
        blurb: 'Where the network/host boundary comes from, and how a router uses it in one AND operation.',
        minutes: 15,
      },
      {
        slug: 'subnet-anatomy',
        title: 'Inside a Single Subnet',
        blurb: 'Network address, broadcast, first and last host, and why /31 breaks the "subtract 2" rule.',
        minutes: 12,
      },
      {
        slug: 'subnetting-practice',
        title: 'Subnetting by Hand',
        blurb: 'Borrowing bits, the magic-number method, and working a real allocation start to finish.',
        minutes: 18,
      },
      {
        slug: 'vlsm',
        title: 'VLSM: Right-Sizing Every Subnet',
        blurb: 'Allocating largest-first so every block stays aligned, and what fixed-size subnetting wastes.',
        minutes: 16,
      },
      {
        slug: 'summarization',
        title: 'Summarization and Supernetting',
        blurb: 'Turning many prefixes into one, and the hierarchical plan that makes it possible.',
        minutes: 14,
      },
    ],
  },
  {
    part: 'Part 3 — IPv6',
    summary: '128 bits changes the arithmetic and, more importantly, changes the design habits.',
    modules: [
      {
        slug: 'ipv6-anatomy',
        title: 'Anatomy of an IPv6 Address',
        blurb: 'Hextets, zero compression, address scopes, and the fields inside a global unicast address.',
        minutes: 16,
      },
      {
        slug: 'ipv6-subnetting',
        title: 'Subnetting IPv6',
        blurb: 'Why every LAN is a /64, how to carve a /48, and nibble-aligned plans that read themselves.',
        minutes: 16,
      },
    ],
  },
  {
    part: 'Part 4 — Production',
    summary: 'How the theory lands on real campus, datacenter, and cloud networks.',
    modules: [
      {
        slug: 'production-design',
        title: 'Designing a Production Address Plan',
        blurb: 'A hierarchical plan for a multi-site enterprise, from RIR allocation down to the access VLAN.',
        minutes: 20,
      },
      {
        slug: 'operations',
        title: 'When Subnetting Goes Wrong',
        blurb: 'Overlap, mask mismatch, exhausted cloud CIDRs, and the failure signatures that identify each.',
        minutes: 15,
      },
    ],
  },
]

let counter = 0
export const PARTS: Part[] = raw.map((section) => ({
  title: section.part,
  summary: section.summary,
  modules: section.modules.map((module) => {
    counter += 1
    return {
      ...module,
      number: counter,
      part: section.part,
      path: `/modules/${module.slug}`,
    }
  }),
}))

export const MODULES: ModuleMeta[] = PARTS.flatMap((part) => part.modules)

export function moduleBySlug(slug: string): ModuleMeta | undefined {
  return MODULES.find((module) => module.slug === slug)
}

export function neighbours(slug: string): { previous?: ModuleMeta; next?: ModuleMeta } {
  const index = MODULES.findIndex((module) => module.slug === slug)
  if (index === -1) return {}
  return { previous: MODULES[index - 1], next: MODULES[index + 1] }
}

export const TOOLS = [
  {
    path: '/tools/calculator',
    title: 'Subnet calculator',
    blurb: 'IPv4 and IPv6, with the binary breakdown and the 3D model wired to every keystroke.',
  },
  {
    path: '/tools/vlsm',
    title: 'VLSM designer',
    blurb: 'Turn a list of host requirements into an aligned, non-overlapping allocation plan.',
  },
  {
    path: '/tools/summarizer',
    title: 'Summarizer',
    blurb: 'Aggregate prefixes into the shortest covering routes and see the shared bits.',
  },
]
