import { ModuleShell } from '../../components/ModuleShell'
import { TopologyExplorer } from '../../components/three/Topology'
import { Callout, DataTable, DefList, H2, Lead, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'

export function WhySubnet() {
  return (
    <ModuleShell slug="why-subnet">
      <Section>
        <Lead>
          A flat network is the simplest thing that works, and it keeps working right up until it does not. Understanding
          the three specific ways it fails is what turns subnetting from an arithmetic exercise into a design decision.
        </Lead>
        <P>
          Put two hundred machines on one switched network and everything is fine. Put two thousand on it and you have a
          different animal: a broadcast that every host must interrupt itself to process, a misconfigured NIC that nobody
          can locate, a security policy that can only be expressed as "everyone can reach everyone". Dividing the network
          fixes all three, and it costs you addresses, routing configuration, and operational overhead. That trade is the
          entire subject.
        </P>
      </Section>

      <Section>
        <H2>Where subnets actually live</H2>
        <P>
          Before the bit arithmetic, it helps to see the shape of the answer. Below is a small but complete enterprise:
          one private IPv4 block, one delegated IPv6 prefix, and every segment carved so that each tier can be summarized
          into the tier above it. Click any block to see what it holds and why it is sized that way.
        </P>
        <TopologyExplorer
          caption={
            <span>
              Every coloured block is one subnet — one <Term id="broadcast-domain">broadcast domain</Term>, one{' '}
              <Term id="vlan" />, one line in the routing table. The tiers exist so that the core carries a handful of
              prefixes instead of a hundred.
            </span>
          }
        />
      </Section>

      <Section>
        <H2>Reason one: broadcast traffic does not scale</H2>
        <P>
          Every host in a broadcast domain receives every broadcast frame sent in it, and must process the frame far
          enough to decide it is uninteresting. <Term id="arp" /> requests, <Term id="dhcp" /> discovers, Windows name
          resolution, mDNS, and printer discovery all use broadcast. The traffic grows with the square of the host count,
          because more hosts both send more broadcasts and receive everyone else's.
        </P>
        <P>
          Switches do not help. A switch breaks up <Term id="collision-domain">collision domains</Term>, but it floods
          broadcasts out every port in the VLAN by design. The only device that stops a broadcast is a router — which is
          to say, the only thing that bounds broadcast traffic is a subnet boundary.
        </P>
        <Callout kind="tip" title="How big is too big?">
          <p>
            Common practice caps a user subnet at a /23 or /22 — roughly 500 to 1000 hosts. Wireless networks often go
            smaller because clients join and leave constantly. Datacenter segments are frequently /24s not because 254 is
            a magic number, but because it is small enough that a broadcast storm stays contained and large enough that
            nobody renumbers every quarter.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>Reason two: failures spread as far as the domain does</H2>
        <P>
          A duplicate IP address, a looped cable, a host answering DHCP that should not be, a spanning-tree
          reconvergence — each of these is contained by the boundary of the broadcast domain it happens in. On a flat
          network of two thousand hosts, all two thousand are affected and the search space for the cause is two thousand
          machines. Split into ten subnets, the blast radius is a tenth of that, and the subnet number itself tells you
          which switch closet to walk to.
        </P>
        <P>
          This is why the physical topology and the address plan should agree. If subnet{' '}
          <span className="font-mono">10.10.20.0/24</span> lives on three different floors, the address gives you nothing
          during an incident.
        </P>
      </Section>

      <Section>
        <H2>Reason three: policy needs a boundary to attach to</H2>
        <P>
          Firewall rules, <Term id="acl">ACLs</Term>, cloud security groups, QoS markings, and routing policy all match on
          address ranges. If everything shares one subnet there is no range that means "the finance team" or "the database
          tier", and policy degrades into per-host rules that nobody maintains.
        </P>
        <P>
          A well-chosen subnet turns a paragraph of intent into one line of configuration. That is the practical reason
          voice and data live on separate VLANs even when they share the same physical switch: the separation is what
          makes "prioritise voice, and never let it reach the internet" expressible.
        </P>
      </Section>

      <Section>
        <H2>What it costs</H2>
        <DataTable
          head={['Cost', 'What it means in practice']}
          rows={[
            [
              'Reserved addresses',
              'Each IPv4 subnet loses two addresses to the network and broadcast address. Ten /24s cost 20 addresses that ten times as many hosts could otherwise have used.',
            ],
            [
              'Routing',
              'Every subnet is a route. A poorly aggregated plan puts thousands of prefixes in the core, which costs memory and convergence time on every router.',
            ],
            [
              'Operational surface',
              'Each subnet is a DHCP scope, a gateway address, a monitoring target, and a line in every firewall policy that touches it.',
            ],
            [
              'Renumbering risk',
              'Subnets that are too small have to be replaced when they fill, and renumbering a live segment is one of the most disruptive changes a network team can make.',
            ],
          ]}
        />
        <P>
          The design goal is not "as many subnets as possible". It is the smallest number of boundaries that gives you the
          containment and the policy hooks you need, laid out so that they aggregate cleanly upward.
        </P>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['subnet', 'broadcast-domain', 'collision-domain', 'vlan', 'default-gateway', 'arp']} />
      </Section>

      <Section>
        <H2>Where this is going</H2>
        <UL>
          <li>
            Modules 2–4 build the mechanism: how a 32-bit address is split, and how a router decides "local" from
            "remote" in a single operation.
          </li>
          <li>Modules 5–8 turn the mechanism into a plan: sizing, allocating, and then aggregating it back up.</li>
          <li>Modules 9–10 do the same in 128 bits, where scarcity disappears and the design habits change.</li>
          <li>Modules 11–12 put it on a real network and then break it, on purpose.</li>
        </UL>
      </Section>

      <Takeaways
        items={[
          'Switches break collision domains; only routers break broadcast domains. A subnet boundary is a router boundary.',
          'Subnets exist for three reasons: to bound broadcast traffic, to bound failures, and to give policy something to match on.',
          'Every subnet costs two IPv4 addresses, a routing entry, and a piece of operational surface — so subnet deliberately, not reflexively.',
          'The address plan should mirror the physical and organisational topology, or the address stops telling you anything during an outage.',
        ]}
      />
    </ModuleShell>
  )
}
