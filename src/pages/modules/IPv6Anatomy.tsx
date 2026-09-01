import { ModuleShell } from '../../components/ModuleShell'
import { IPv6StructureExplorer } from '../../components/three/IPv6Structure'
import { Callout, DataTable, DefList, H2, H3, Lead, Mono, OL, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'
import { IPV6_SCOPES } from '../../lib/ipv6'

export function IPv6Anatomy() {
  return (
    <ModuleShell slug="ipv6-anatomy">
      <Section>
        <Lead>
          128 bits is not "IPv4 with more digits". The arithmetic is the same, but the abundance changes what good design
          looks like: you stop counting hosts and start designing a readable hierarchy.
        </Lead>
        <P>
          2<sup>128</sup> is roughly 3.4 × 10<sup>38</sup>. A single <Mono>/64</Mono> subnet contains 18 quintillion
          addresses — more than the entire IPv4 internet, squared. The practical consequence is that in IPv6 you never
          size a subnet to its host count.
        </P>
      </Section>

      <Section>
        <H2>The object itself</H2>
        <IPv6StructureExplorer
          caption={
            <span>
              Eight <Term id="hextet">hextets</Term> of 16 bits, each shown as four <Term id="nibble">nibbles</Term> with
              its hex digit underneath. Purple is the <Term id="global-routing-prefix" /> your provider gave you, teal is
              the <Term id="subnet-id" /> you design, amber is the <Term id="interface-id" />. Drag the routing-prefix
              slider to see what a /56 delegation leaves you compared with a /48.
            </span>
          }
        />
      </Section>

      <Section>
        <H2>Notation</H2>
        <P>
          An IPv6 address is eight 16-bit groups written in hexadecimal and separated by colons. Two rules compress it,
          and <a className="text-network hover:underline" href="https://www.rfc-editor.org/rfc/rfc5952" target="_blank" rel="noreferrer">RFC 5952</a>{' '}
          makes them mandatory for anything a machine emits:
        </P>
        <OL>
          <li>Drop leading zeros inside each hextet: <Mono>0db8</Mono> → <Mono>db8</Mono>.</li>
          <li>
            Replace the single longest run of all-zero hextets with <Mono>::</Mono> — once per address, and only for a run
            of two or more. Ties go to the leftmost run.
          </li>
        </OL>
        <DataTable
          dense
          head={['Full form', 'Canonical form', 'Note']}
          rows={[
            [<Mono>2001:0db8:0000:0000:0000:0000:0000:0001</Mono>, <Mono>2001:db8::1</Mono>, 'Six zero hextets collapse'],
            [<Mono>2001:0db8:0000:0012:0000:0000:0000:0034</Mono>, <Mono>2001:db8:0:12::34</Mono>, 'The longer run wins; the single zero stays'],
            [<Mono>fe80:0000:0000:0000:1a2b:3cff:fe4d:5e6f</Mono>, <Mono>fe80::1a2b:3cff:fe4d:5e6f</Mono>, 'A typical link-local from EUI-64'],
            [<Mono>0000:0000:0000:0000:0000:0000:0000:0001</Mono>, <Mono>::1</Mono>, 'Loopback'],
            [<Mono>ff02:0000:0000:0000:0000:0001:ff4d:5e6f</Mono>, <Mono>ff02::1:ff4d:5e6f</Mono>, 'Solicited-node multicast'],
          ]}
        />
        <Callout kind="warn" title="Only one ::">
          <p>
            <Mono>2001:db8::1::2</Mono> is invalid. With two of them there is no way to know how many zero groups each one
            stands for. Address parsers reject it, and so should you when reviewing a config.
          </p>
        </Callout>
        <P>
          Addresses in URLs are wrapped in brackets — <Mono>https://[2001:db8::1]:8443/</Mono> — because the colon
          already means "port". Link-local addresses carry a zone index naming the interface:{' '}
          <Mono>fe80::1%eth0</Mono>, because the same link-local address can exist on every interface you have.
        </P>
      </Section>

      <Section>
        <H2>Inside a global unicast address</H2>
        <P>A routable IPv6 address has three fields, and the boundaries are conventional rather than encoded:</P>
        <DataTable
          head={['Field', 'Typical size', 'Who controls it']}
          rows={[
            [
              <Term id="global-routing-prefix" />,
              <Mono>/48 (site) or /56 (small site)</Mono>,
              'Your RIR or ISP. This is what the internet routes on.',
            ],
            [
              <Term id="subnet-id" />,
              <Mono>16 bits with a /48, 8 with a /56</Mono>,
              'You. This is the entire IPv6 address-design job.',
            ],
            [
              <Term id="interface-id" />,
              <Mono>64 bits</Mono>,
              'The host, via SLAAC, DHCPv6, privacy extensions, or static configuration.',
            ],
          ]}
        />
        <P>
          A /48 gives 65,536 subnets. Not "65,536 addresses" — 65,536 whole <Mono>/64</Mono> networks, each effectively
          unlimited. Even a large enterprise struggles to use a meaningful fraction, which is why IPv6 plans are designed
          for legibility rather than density.
        </P>
      </Section>

      <Section>
        <H2>Address types and scopes</H2>
        <DataTable
          dense
          head={['Range', 'Name', 'What it does']}
          rows={IPV6_SCOPES.map((scope) => [<Mono>{scope.cidr}</Mono>, scope.name, scope.description])}
        />

        <H3>There is no broadcast</H3>
        <P>
          IPv6 removed broadcast entirely and replaced it with scoped <Term id="multicast" />.{' '}
          <Mono>ff02::1</Mono> is all nodes on the link, <Mono>ff02::2</Mono> is all routers.{' '}
          <Term id="nd">Neighbor Discovery</Term> — the ARP replacement — uses a solicited-node group derived from the
          last 24 bits of the target address, so a neighbour lookup interrupts a handful of hosts instead of all of them.
        </P>

        <H3>Every interface has several addresses</H3>
        <UL>
          <li>
            A <Term id="link-local" /> address (<Mono>fe80::/10</Mono>), always, generated automatically. Routing
            protocols and next-hops use it.
          </li>
          <li>One or more global addresses from the prefixes the router advertises.</li>
          <li>Often a temporary privacy address (RFC 8981) used for outbound connections.</li>
          <li>Possibly a <Term id="ula" /> address for internal-only services.</li>
          <li>Membership in several multicast groups, including its solicited-node group.</li>
        </UL>
        <P>
          "What is this host's IPv6 address?" usually has four answers. Which one is used depends on the destination and
          on source-address selection rules (RFC 6724) — a genuinely new thing to reason about compared with IPv4.
        </P>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['hextet', 'nibble', 'zero-compression', 'gua', 'ula', 'link-local', 'multicast', 'nd']} />
      </Section>

      <Takeaways
        items={[
          'Eight hextets, 128 bits; each hex digit is exactly four bits, which makes nibble-aligned prefixes readable at a glance.',
          'Compression rules: drop leading zeros, and collapse the single longest zero run with :: — never more than once.',
          'A global unicast address is routing prefix + subnet ID + 64-bit interface ID; you design only the middle field.',
          'There is no broadcast in IPv6, and every interface holds several addresses at once, starting with a link-local.',
        ]}
      />
    </ModuleShell>
  )
}
