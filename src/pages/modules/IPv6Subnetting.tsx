import { ModuleShell } from '../../components/ModuleShell'
import { IPv6StructureExplorer } from '../../components/three/IPv6Structure'
import { SubnetCalculator } from '../../components/tools/SubnetCalculator'
import { Callout, DataTable, DefList, H2, H3, Lead, Mono, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'

export function IPv6Subnetting() {
  return (
    <ModuleShell slug="ipv6-subnetting">
      <Section>
        <Lead>
          IPv6 subnetting is easier than IPv4 subnetting, and most of the difficulty people have with it comes from
          applying IPv4 habits — sizing to host counts, conserving addresses, avoiding "waste". Drop those and the design
          becomes a naming exercise.
        </Lead>
      </Section>

      <Section>
        <H2>Rule one: every LAN is a /64</H2>
        <P>
          The <Term id="interface-id" /> is defined as 64 bits. <Term id="slaac" /> depends on that, and so do EUI-64,
          privacy addresses, and a number of other mechanisms. A /80 or /112 LAN will forward packets, but SLAAC stops
          working and you have inherited a permanent footnote in your documentation.
        </P>
        <UL>
          <li>
            <strong>A LAN with 4 hosts gets a /64.</strong> So does a LAN with 4,000.
          </li>
          <li>
            <strong>Point-to-point links:</strong> allocate a /64 and configure a <Mono>/127</Mono> from it (RFC 6164) if
            you want to avoid the neighbour-cache exhaustion attack surface. Reserving the whole /64 keeps the plan
            uniform.
          </li>
          <li>
            <strong>Loopbacks:</strong> <Mono>/128</Mono>, taken from a dedicated /64 so that all loopbacks summarize
            together.
          </li>
        </UL>
        <Callout kind="note" title="“That wastes so many addresses”">
          <p>
            A /64 per LAN is not waste; it is the unit. If every human on earth ran a network with a million subnets,
            we would still have used a rounding error of the space. Optimising IPv6 for address conservation trades a
            resource you have in unimaginable surplus for one you do not: operational clarity.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>Rule two: design the subnet ID on nibble boundaries</H2>
        <P>
          Each hex digit is four bits. If your internal boundaries land on multiples of four, every field is readable
          straight off the address; if they do not, you are back to binary every time you read a config.
        </P>
        <DataTable
          dense
          head={['Prefix', 'Subnets from a /48', 'Reads as', 'Comment']}
          rows={[
            [<Mono>/52</Mono>, '16', 'one hex digit', 'Region or major site group'],
            [<Mono>/56</Mono>, '256', 'two hex digits', 'The standard site or branch allocation'],
            [<Mono>/60</Mono>, '4,096', 'three hex digits', 'A building, floor, or pod'],
            [<Mono>/64</Mono>, '65,536', 'four hex digits', 'The LAN itself — always the final boundary'],
          ]}
        />
        <IPv6StructureExplorer
          initialAddress="2001:db8:acad:1234::1"
          initialRouting={48}
          initialSubnetEnd={64}
          caption={
            <span>
              With a /48 delegation the fourth hextet is entirely yours — four hex digits of{' '}
              <Term id="subnet-id" />. Give each digit a meaning (site, building, function, VLAN) and the address
              documents itself.
            </span>
          }
        />
      </Section>

      <Section>
        <H2>A worked /48 plan</H2>
        <P>
          Given <Mono>2001:db8:acad::/48</Mono>, split the 16 subnet-ID bits as{' '}
          <Mono>[site: 1 digit][function: 1 digit][segment: 2 digits]</Mono>.
        </P>
        <DataTable
          dense
          head={['Prefix', 'Meaning', 'Example segment']}
          rows={[
            [<Mono>2001:db8:acad:0xxx::/52</Mono>, 'Site 0 — headquarters', <Mono>2001:db8:acad:0110::/64</Mono>],
            [<Mono>2001:db8:acad:1xxx::/52</Mono>, 'Site 1 — datacenter', <Mono>2001:db8:acad:1201::/64</Mono>],
            [<Mono>2001:db8:acad:2xxx::/52</Mono>, 'Site 2 — branch offices', <Mono>2001:db8:acad:2301::/64</Mono>],
            [<Mono>2001:db8:acad:fxxx::/52</Mono>, 'Reserved — infrastructure and DMZ', <Mono>2001:db8:acad:ff00::/64</Mono>],
          ]}
        />
        <P>
          Within a site, the second digit is the function — <Mono>1</Mono> users, <Mono>2</Mono> servers,{' '}
          <Mono>3</Mono> wireless, <Mono>9</Mono> management — and the last two digits are the segment number, chosen to
          match the IPv4 VLAN ID wherever possible. <Mono>2001:db8:acad:0110::/64</Mono> then reads as "HQ, users, VLAN
          10", and it sits alongside <Mono>10.10.16.0/22</Mono> on the same wire.
        </P>
        <Callout kind="tip" title="Align IPv6 with the IPv4 plan you already have">
          <p>
            In a <Term id="dual-stack" /> network the fastest way to make IPv6 legible is to encode the existing VLAN or
            site number into a hex digit of the subnet ID. Engineers then read one plan instead of two, and mistakes
            during an incident drop sharply.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>Delegation sizes you will meet</H2>
        <DataTable
          head={['Allocation', 'Who gets it', 'Subnets it contains']}
          rows={[
            [<Mono>/32</Mono>, 'An ISP, from its RIR', '65,536 × /48'],
            [<Mono>/48</Mono>, 'An enterprise site — the default recommendation', '65,536 × /64'],
            [<Mono>/56</Mono>, 'A small business or residential customer', '256 × /64'],
            [<Mono>/60</Mono>, 'A constrained residential delegation', '16 × /64'],
            [<Mono>/64</Mono>, 'A single LAN — never subdivide it', '1'],
            [<Mono>/128</Mono>, 'A loopback or a single host route', '—'],
          ]}
        />
        <P>
          Home and branch routers obtain these through <Term id="prefix-delegation">DHCPv6-PD</Term>. A delegation that
          is only a /64 is a problem: the router cannot then give a different prefix to its own LANs, which is why a /56
          is the usual minimum a serious provider offers.
        </P>
      </Section>

      <Section>
        <H2>How hosts get their addresses</H2>
        <H3>SLAAC</H3>
        <P>
          The router advertises a /64; the host appends its own <Term id="interface-id" /> and, after duplicate address
          detection, starts using it. No server, no state, no lease. The router's advertisement also carries flags that
          tell the host whether to also ask DHCPv6 for other information such as DNS.
        </P>
        <H3>Modified EUI-64</H3>
        <P>
          The classical way to build that interface ID from a MAC address: split the MAC, insert{' '}
          <Mono>ff:fe</Mono> in the middle, flip the universal/local bit. The calculator below shows each step. Modern
          hosts prefer RFC 7217 stable-opaque or RFC 8981 temporary identifiers instead, because EUI-64 exposes the
          hardware address in every packet — but router interfaces still commonly use it, and it appears in every
          certification exam.
        </P>
        <SubnetCalculator />
      </Section>

      <Section>
        <H2>IPv4 habits to unlearn</H2>
        <DataTable
          head={['IPv4 habit', 'IPv6 reality']}
          rows={[
            ['Size the subnet to the host count', 'Every LAN is a /64 regardless of host count'],
            ['Conserve addresses', 'Conserve legibility instead — allocate on nibble boundaries and leave gaps'],
            ['Subtract 2 for network and broadcast', 'No broadcast address; only the all-zeros subnet-router anycast address is reserved'],
            ['NAT is normal', 'End-to-end addressing is the point; use ULAs plus firewall policy for internal-only space'],
            ['One address per interface', 'Several per interface: link-local, global, temporary, possibly ULA'],
            ['ARP', 'Neighbor Discovery over ICMPv6 multicast — and blocking ICMPv6 breaks the network'],
          ]}
        />
        <Callout kind="warn" title="Do not filter ICMPv6">
          <p>
            IPv6 depends on ICMPv6 for Neighbor Discovery, Router Advertisements, and Path MTU Discovery. A firewall rule
            copied from an IPv4 policy that drops ICMP will produce a network where addresses resolve intermittently and
            large transfers hang. RFC 4890 lists what must be permitted.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['interface-id', 'subnet-id', 'global-routing-prefix', 'slaac', 'eui-64', 'prefix-delegation', 'dual-stack']} />
      </Section>

      <Takeaways
        items={[
          'Every LAN is a /64 — SLAAC and the 64-bit interface ID depend on it, and there is no address-conservation reason to deviate.',
          'Design the subnet ID on nibble (4-bit) boundaries so each hex digit carries one meaning.',
          'A /48 gives 65,536 subnets; a /56 gives 256. Plan for legibility and leave deliberate gaps.',
          'Mirror the IPv4 VLAN or site numbering inside the subnet ID so a dual-stack network reads as one plan, not two.',
        ]}
      />
    </ModuleShell>
  )
}
