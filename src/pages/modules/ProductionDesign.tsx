import { ModuleShell } from '../../components/ModuleShell'
import { TopologyExplorer } from '../../components/three/Topology'
import { VlsmDesigner } from '../../components/tools/VlsmDesigner'
import { Callout, DataTable, DefList, H2, H3, Lead, Mono, OL, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'

export function ProductionDesign() {
  return (
    <ModuleShell slug="production-design">
      <Section>
        <Lead>
          An address plan is a hierarchy chosen once and lived with for a decade. The arithmetic is the easy part; the
          judgement is deciding what each level of the hierarchy means before anything is deployed.
        </Lead>
        <P>
          The test of a plan is simple: can someone who has never seen this network look at{' '}
          <Mono>10.10.33.14</Mono> and say which site, which function, and which tier it belongs to? If yes, the plan will
          summarize, the policy will be readable, and the on-call engineer will find the rack. If no, everything else gets
          harder forever.
        </P>
      </Section>

      <Section>
        <H2>The reference design</H2>
        <TopologyExplorer
          title="One /16 and one /48, allocated top-down"
          caption={
            <span>
              Click through the tiers. Each block's allocation is chosen so that its parent can advertise a single
              prefix: the campus is one /20, the datacenter is one /20, the cloud is one /20, and the whole site is one
              /16.
            </span>
          }
        />
      </Section>

      <Section>
        <H2>Design top-down, allocate bottom-up</H2>
        <OL>
          <li>
            <strong>Start from the largest container you control.</strong> A private /8, an RIR allocation, or a /48 of
            IPv6. Never start from the first VLAN somebody needs.
          </li>
          <li>
            <strong>Choose the levels.</strong> Typically region → site → function → segment. Each level should be a thing
            that has an owner and rarely changes.
          </li>
          <li>
            <strong>Give each level a fixed number of bits</strong> and stick to it, even where it looks wasteful. A
            uniform hierarchy is what makes an address readable and a summary possible.
          </li>
          <li>
            <strong>Reserve before you allocate.</strong> Mark half of every level as reserved on day one; growth always
            arrives in a shape you did not predict.
          </li>
          <li>
            <strong>Only then size individual subnets</strong> using VLSM within each function block.
          </li>
        </OL>
        <Callout kind="warn" title="The mistake that cannot be undone cheaply">
          <p>
            Allocating the first site as 10.0.0.0/16, the second as 10.1.0.0/16, and the third as 10.5.0.0/16 "because it
            was free" costs nothing on the day and everything for the next ten years. Contiguity is the whole asset.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>A worked enterprise plan</H2>
        <P>
          Estate: <Mono>10.0.0.0/8</Mono>. Second octet is the site, so 256 sites; each site gets a /16.
        </P>
        <DataTable
          dense
          head={['Block', 'Level', 'Meaning']}
          rows={[
            [<Mono>10.0.0.0/8</Mono>, 'Estate', 'Everything the organisation owns internally'],
            [<Mono>10.10.0.0/16</Mono>, 'Site', 'One campus, datacenter, or region — 65,536 addresses'],
            [<Mono>10.10.0.0/20</Mono>, 'Function: infrastructure', 'Router links, loopbacks, management, out-of-band'],
            [<Mono>10.10.16.0/20</Mono>, 'Function: campus access', 'User, voice, wireless, printer, IoT VLANs'],
            [<Mono>10.10.32.0/20</Mono>, 'Function: datacenter', 'Application, database, storage, backup segments'],
            [<Mono>10.10.48.0/20</Mono>, 'Function: cloud', 'VPC / VNet CIDRs reachable over the interconnect'],
            [<Mono>10.10.64.0/18</Mono>, 'Reserved', 'Untouched — the next thing nobody planned for'],
            [<Mono>10.10.255.0/24</Mono>, 'Function: DMZ', 'Placed at the very top so it is unmistakable in policy'],
          ]}
        />
        <P>
          Inside the campus /20, the individual VLANs are sized with VLSM. Inside the infrastructure /20, links come from
          one /24 as /31s and loopbacks from another as /32s — keeping them separate is what lets you write "permit
          management to 10.10.1.0/24" and mean exactly the loopbacks.
        </P>
        <H3>The IPv6 half of the same plan</H3>
        <DataTable
          dense
          head={['IPv4', 'IPv6', 'Segment']}
          rows={[
            [<Mono>10.10.0.0/20</Mono>, <Mono>2001:db8:acad:0000::/60</Mono>, 'Infrastructure'],
            [<Mono>10.10.16.0/22</Mono>, <Mono>2001:db8:acad:0110::/64</Mono>, 'Users, VLAN 110'],
            [<Mono>10.10.20.0/23</Mono>, <Mono>2001:db8:acad:0120::/64</Mono>, 'Voice, VLAN 120'],
            [<Mono>10.10.24.0/22</Mono>, <Mono>2001:db8:acad:0130::/64</Mono>, 'Wireless, VLAN 130'],
            [<Mono>10.10.32.0/24</Mono>, <Mono>2001:db8:acad:0210::/64</Mono>, 'App tier, VLAN 210'],
            [<Mono>10.10.33.0/24</Mono>, <Mono>2001:db8:acad:0220::/64</Mono>, 'Database tier, VLAN 220'],
          ]}
        />
        <P>
          The VLAN number is embedded in the IPv6 subnet ID, so the two plans read as one. That single choice removes most
          of the cognitive cost of running <Term id="dual-stack" />.
        </P>
      </Section>

      <Section>
        <H2>Cloud changes the constraints</H2>
        <UL>
          <li>
            <strong>The <Term id="vpc" /> CIDR is close to permanent.</strong> Providers let you add secondary ranges but
            not shrink the primary. Choose it for the five-year plan.
          </li>
          <li>
            <strong>Subnets do not span <Term id="availability-zone">availability zones</Term>.</strong> A three-zone,
            three-tier application needs nine subnets, not three. Multiply your subnet count accordingly.
          </li>
          <li>
            <strong>The provider reserves addresses in every subnet.</strong> AWS takes five per subnet — network,
            router, DNS, future use, broadcast — so a /28 yields 11 usable addresses, not 14.
          </li>
          <li>
            <strong>Overlap blocks peering.</strong> Two VPCs with the same CIDR cannot be peered or attached to the same
            transit gateway. This is the single most common cause of forced renumbering in cloud environments.
          </li>
          <li>
            <strong>Managed services consume space invisibly.</strong> Load balancers, NAT gateways, managed databases,
            and Kubernetes pod networks all take addresses from your subnets, often far more than the instance count
            suggests.
          </li>
        </UL>
        <Callout kind="tip" title="Reserve cloud space out of the on-premises plan">
          <p>
            Carve the cloud blocks from the same estate as everything else, before the first VPC is created. It costs a
            /20 of a private /8 and it permanently removes the class of problem where a VPN to a newly acquired
            environment cannot be built because both sides use 10.0.0.0/16.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>Size a site with the designer</H2>
        <P>
          Take the campus /20 from the plan above and lay out its VLANs. Try setting the user VLAN to 900 hosts and watch
          the block sizes and the leftover space respond.
        </P>
        <VlsmDesigner />
      </Section>

      <Section>
        <H2>Documentation is part of the design</H2>
        <UL>
          <li>
            <strong>Record allocations in <Term id="ipam" />, not a spreadsheet.</strong> The plan is only as reliable as
            the system that says what is already used.
          </li>
          <li>
            <strong>Document the intent, not just the assignments.</strong> "Second octet is the site" is the fact that
            keeps the plan intact when the original architects have left.
          </li>
          <li>
            <strong>Name conventions should match address conventions.</strong> If VLAN 110 is users, it should be VLAN
            110 at every site.
          </li>
          <li>
            <strong>Mark reserved space as reserved.</strong> An unlabelled free block will be consumed by the first
            person in a hurry.
          </li>
        </UL>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['address-plan', 'ipam', 'vpc', 'availability-zone', 'svi', 'ip-helper', 'dual-stack', 'loopback-interface']} />
      </Section>

      <Takeaways
        items={[
          'Design the hierarchy top-down from the largest block you control; allocate individual subnets last.',
          'Give every level of the hierarchy a fixed bit width, and reserve at least half of each level on day one.',
          'Embed the IPv4 VLAN or site number in the IPv6 subnet ID so a dual-stack estate reads as a single plan.',
          'Cloud subnets are per-availability-zone, lose extra reserved addresses, and cannot overlap if you ever want to peer — reserve their space up front.',
        ]}
      />
    </ModuleShell>
  )
}
