import { ModuleShell } from '../../components/ModuleShell'
import { AddressAnatomyExplorer } from '../../components/three/AddressAnatomy'
import { Callout, DataTable, DefList, H2, Lead, Mono, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'
import { formatIPv4, parseIPv4 } from '../../lib/ipv4'

const EXAMPLE = parseIPv4('192.168.10.64')
const EXAMPLE_BASE = EXAMPLE.ok ? EXAMPLE.value : 0

export function SubnetAnatomy() {
  return (
    <ModuleShell slug="subnet-anatomy">
      <Section>
        <Lead>
          Once the boundary is set, a subnet has exactly four landmarks: the first address, the last address, and the two
          usable ends in between. Every subnetting question a device will ever ask you is one of those four.
        </Lead>
      </Section>

      <Section>
        <H2>The four landmarks</H2>
        <DataTable
          head={['Landmark', 'How it is formed', 'Can a host use it?']}
          rows={[
            [
              <Term id="network-address" />,
              'All host bits set to 0. It is the subnet’s name in every routing table.',
              'No — it identifies the subnet, not an interface.',
            ],
            [
              'First usable host',
              'Network address + 1.',
              'Yes. By convention this is often the gateway.',
            ],
            [
              'Last usable host',
              'Broadcast address − 1.',
              'Yes. Some organisations put the gateway here instead — pick one and be consistent.',
            ],
            [
              <Term id="broadcast-address" />,
              'All host bits set to 1. Reaches every host on the segment.',
              'No — it is reserved.',
            ],
          ]}
        />
        <P>
          Two addresses reserved out of every subnet is where <Mono>2^h − 2</Mono> comes from. It is a fixed tax, so it
          hurts proportionally more the smaller the subnet: a /24 loses 0.8% of its space, a /30 loses half.
        </P>
      </Section>

      <Section>
        <H2>Every address in one small subnet</H2>
        <P>
          A <Mono>/29</Mono> has three host bits, so eight addresses. Small enough to list completely, which makes the
          pattern obvious.
        </P>
        <DataTable
          dense
          head={['Address', 'Host bits', 'Role']}
          rows={Array.from({ length: 8 }, (_, offset) => {
            const address = EXAMPLE_BASE + offset
            const role =
              offset === 0
                ? 'Network address — the subnet’s identity'
                : offset === 7
                  ? 'Broadcast address — reserved'
                  : offset === 1
                    ? 'First usable host (commonly the gateway)'
                    : offset === 6
                      ? 'Last usable host'
                      : 'Usable host'
            return [
              <Mono>{formatIPv4(address)}</Mono>,
              <Mono>{offset.toString(2).padStart(3, '0')}</Mono>,
              <span className={offset === 0 || offset === 7 ? 'text-danger' : 'text-ink-2'}>{role}</span>,
            ]
          })}
        />
        <P>
          <Mono>192.168.10.64/29</Mono> therefore offers six usable addresses, from <Mono>.65</Mono> to <Mono>.70</Mono>,
          and the next subnet starts at <Mono>.72</Mono>. Note that the network address ends in 64, not 0 — a reminder
          that "the network address ends in .0" is only true for /24s.
        </P>
      </Section>

      <Section>
        <H2>Watch it change</H2>
        <AddressAnatomyExplorer
          title="One address, every possible subnet it could belong to"
          initialAddress="192.168.10.70"
          initialPrefix={29}
          initialParentPrefix={24}
          caption={
            <span>
              The stats below the scene recompute as you move the prefix. Notice that the same host address belongs to a
              different network, with a different broadcast address and a different neighbour set, at every prefix
              length.
            </span>
          }
        />
      </Section>

      <Section>
        <H2>The small-prefix edge cases</H2>
        <DataTable
          head={['Prefix', 'Addresses', 'Usable', 'What it is for']}
          rows={[
            [
              <Mono>/30</Mono>,
              '4',
              '2',
              'The traditional point-to-point link. Two addresses for the routers, two burned on network and broadcast.',
            ],
            [
              <Mono>/31</Mono>,
              '2',
              '2',
              'RFC 3021. On a point-to-point link there is nobody to broadcast to, so both addresses are usable. Halves the address cost of every router link.',
            ],
            [
              <Mono>/32</Mono>,
              '1',
              '1',
              'A host route. Used for loopback interfaces, anycast service addresses, and precise routing-policy entries.',
            ],
          ]}
        />
        <Callout kind="tip" title="Use /31s">
          <p>
            Every current router platform supports /31 on point-to-point links. A network with 400 router links saves 800
            addresses by using /31 instead of /30 — and more importantly, the /31 convention makes the link addressing
            plan half as large and twice as easy to summarize.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>Gateway conventions</H2>
        <UL>
          <li>
            <strong>First address</strong> (<Mono>.1</Mono> in a /24) is the most common. Easy to predict, easy to script.
          </li>
          <li>
            <strong>Last usable</strong> (<Mono>.254</Mono>) is preferred by some organisations because it keeps the low
            addresses free for static server assignments.
          </li>
          <li>
            <strong>Reserved band</strong>: many plans set aside the first 10–20 addresses for infrastructure — gateway,
            HSRP/VRRP peers, switches, printers — and start the DHCP pool above them.
          </li>
        </UL>
        <P>
          None of these is more correct than the others. What matters is that the convention is written down and applied
          everywhere, because half of operational troubleshooting is knowing what an address <em>should</em> be before you
          look it up.
        </P>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['network-address', 'broadcast-address', 'usable-hosts', 'host-bits', 'p2p-link', 'loopback-interface']} />
      </Section>

      <Takeaways
        items={[
          'Network address = all host bits 0. Broadcast = all host bits 1. Everything between them is usable.',
          'The “subtract 2” rule is a fixed tax that costs proportionally more the smaller the subnet gets.',
          '/31 gives two usable addresses on point-to-point links and should be the default there; /32 is a host route.',
          'The network address does not have to end in .0 — that is only true when the prefix is /24.',
        ]}
      />
    </ModuleShell>
  )
}
