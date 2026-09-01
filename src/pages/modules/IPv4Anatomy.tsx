import { ModuleShell } from '../../components/ModuleShell'
import { AddressAnatomyExplorer } from '../../components/three/AddressAnatomy'
import { Callout, DataTable, DefList, H2, Lead, Mono, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'
import { SPECIAL_IPV4_RANGES } from '../../lib/ipv4'

export function IPv4Anatomy() {
  return (
    <ModuleShell slug="ipv4-anatomy">
      <Section>
        <Lead>
          An IPv4 address is 32 bits that identify an interface, printed in four decimal chunks for the benefit of
          humans. Everything else — classes, private ranges, the shape of the whole internet's address space — is a
          convention layered on top of those 32 bits.
        </Lead>
        <P>
          32 bits gives 2<sup>32</sup> = 4,294,967,296 addresses, and a meaningful fraction of those are reserved. That
          scarcity is the reason for <Term id="nat" />, for <Term id="rfc1918">private addressing</Term>, and ultimately
          for IPv6. It is also why IPv4 subnetting is an exercise in not wasting anything.
        </P>
      </Section>

      <Section>
        <H2>The object itself</H2>
        <AddressAnatomyExplorer
          title="IPv4 address — exploded by octet"
          initialAddress="203.0.113.42"
          initialPrefix={24}
          initialParentPrefix={24}
          caption={
            <span>
              Four <Term id="octet">octets</Term>, eight bits each. The plates group the bits the way the dots do in{' '}
              <Term id="dotted-decimal">dotted decimal</Term> — but note that nothing in the address itself marks those
              boundaries. They exist only in the notation.
            </span>
          }
        />
      </Section>

      <Section>
        <H2>An address names an interface, not a device</H2>
        <P>
          This distinction matters more than it first appears. A router with six interfaces has at least six addresses,
          one per network it touches. A server with two NICs in two VLANs has two. A laptop on Wi-Fi and Ethernet
          simultaneously has two, in different subnets, and its operating system picks between them per destination.
        </P>
        <P>
          "Which subnet is this host in?" is therefore always really "which subnet is this <em>interface</em> in?" — and
          the answer depends on the mask configured on that interface, not on anything intrinsic to the address.
        </P>
      </Section>

      <Section>
        <H2>The classful past</H2>
        <P>
          Before <Term id="cidr" />, the leading bits of an address determined its mask. You did not choose a prefix
          length; the address chose it for you.
        </P>
        <DataTable
          head={['Class', 'First octet', 'Implied mask', 'Networks', 'Hosts per network']}
          rows={[
            ['A', '1 – 126', <Mono>/8</Mono>, '126', '16,777,214'],
            ['B', '128 – 191', <Mono>/16</Mono>, '16,384', '65,534'],
            ['C', '192 – 223', <Mono>/24</Mono>, '2,097,152', '254'],
            ['D', '224 – 239', 'multicast', '—', '—'],
            ['E', '240 – 255', 'reserved', '—', '—'],
          ]}
        />
        <P>
          The waste is obvious in hindsight. An organisation with 300 hosts was too big for a class C and received a class
          B — 65,534 addresses, of which it used half a percent. CIDR replaced the scheme in 1993 by making the prefix
          length explicit everywhere, and the classes have had no protocol meaning since.
        </P>
        <Callout kind="warn" title="Classes still bite">
          <p>
            Some CLIs still apply a classful default when you omit the mask, and some documentation still says "a class C
            network" when it means "a /24". Read those as historical shorthand — but never let a device pick a mask for
            you.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>Ranges you must recognise on sight</H2>
        <P>
          A large slice of IPv4 is reserved for specific purposes. Recognising these instantly saves an enormous amount of
          troubleshooting time — an interface that has assigned itself <Mono>169.254.x.x</Mono> is telling you DHCP
          failed, not that someone configured a strange address.
        </P>
        <DataTable
          dense
          head={['Block', 'Purpose', 'Reference']}
          rows={SPECIAL_IPV4_RANGES.map((range) => [
            <Mono>{range.cidr}</Mono>,
            range.label,
            <span className="text-ink-3">{range.reference}</span>,
          ])}
        />
        <UL>
          <li>
            The three <Term id="rfc1918" /> blocks are where nearly every enterprise network lives. They are not routed on
            the internet, which is exactly why they need <Term id="nat" /> at the edge.
          </li>
          <li>
            <Mono>100.64.0.0/10</Mono> is carrier-grade NAT space. If you see it on a customer link, the provider is
            sharing public addresses between subscribers, and inbound connections will not work.
          </li>
          <li>
            The three documentation blocks (<Mono>192.0.2.0/24</Mono>, <Mono>198.51.100.0/24</Mono>,{' '}
            <Mono>203.0.113.0/24</Mono>) are what examples should use. Every public address in this course comes from
            them.
          </li>
        </UL>
      </Section>

      <Section>
        <H2>Reading an address quickly</H2>
        <DataTable
          head={['What you see', 'What it tells you']}
          rows={[
            [<Mono>10.x.x.x</Mono>, 'Private. Large enterprise or cloud VPC — the /8 gives room for a full hierarchy.'],
            [<Mono>172.16–31.x.x</Mono>, 'Private. A /12, often used by container platforms and VPN pools.'],
            [<Mono>192.168.x.x</Mono>, 'Private. Small sites, home networks, lab equipment defaults.'],
            [<Mono>169.254.x.x</Mono>, 'Link-local — DHCP failed and the host self-assigned. Almost always a fault.'],
            [<Mono>127.x.x.x</Mono>, 'Loopback. Never leaves the host.'],
            [<Mono>224–239.x.x.x</Mono>, 'Multicast group, not a host address.'],
            ['Anything ending .0 or .255', 'Frequently the network or broadcast address — but only the mask can confirm it.'],
          ]}
        />
        <Callout kind="note" title="The .0 / .255 trap">
          <p>
            <Mono>10.1.2.0</Mono> is a perfectly valid host address inside <Mono>10.1.0.0/16</Mono>, and{' '}
            <Mono>10.1.2.255</Mono> is a valid host address there too. Whether an address is the network or the broadcast
            depends entirely on the prefix length — never on how it looks.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['ip-address', 'octet', 'dotted-decimal', 'classful', 'rfc1918', 'nat']} />
      </Section>

      <Takeaways
        items={[
          'An IPv4 address is 32 bits; the dots are notation and carry no protocol meaning.',
          'Addresses identify interfaces, so the mask on that interface — not the address — decides which subnet it is in.',
          'Classful addressing is history, but its vocabulary and its default masks still appear in tools and documentation.',
          'Reserved ranges are diagnostic: 169.254 means DHCP failed, 100.64 means carrier NAT, RFC 1918 means you are inside someone’s private plan.',
        ]}
      />
    </ModuleShell>
  )
}
