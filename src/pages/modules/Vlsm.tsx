import { ModuleShell } from '../../components/ModuleShell'
import { VlsmDesigner } from '../../components/tools/VlsmDesigner'
import { Callout, DataTable, DefList, H2, H3, Lead, Mono, OL, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'

export function Vlsm() {
  return (
    <ModuleShell slug="vlsm">
      <Section>
        <Lead>
          Fixed-size subnetting forces every segment to be as big as the biggest one. VLSM lets each segment be exactly
          the size it needs — and the only rule you have to respect is alignment.
        </Lead>
        <P>
          A campus with a 500-host user VLAN and eight two-address router links does not want nine /23s. It wants one /23
          and eight /31s, and it wants them packed so that the whole set still summarizes into one prefix. That is{' '}
          <Term id="vlsm" />.
        </P>
      </Section>

      <Section>
        <H2>The cost of one-size-fits-all</H2>
        <P>Take a real requirement list and give every segment the same mask:</P>
        <DataTable
          head={['Segment', 'Hosts needed', 'Fixed /23 each', 'Right-sized', 'Wasted by fixed sizing']}
          rows={[
            ['Users — floor 1', '500', <Mono>512</Mono>, <Mono>/23 · 512</Mono>, '0'],
            ['Users — floor 2', '220', <Mono>512</Mono>, <Mono>/24 · 256</Mono>, '256'],
            ['Wireless', '120', <Mono>512</Mono>, <Mono>/25 · 128</Mono>, '384'],
            ['Voice', '60', <Mono>512</Mono>, <Mono>/26 · 64</Mono>, '448'],
            ['Servers', '25', <Mono>512</Mono>, <Mono>/27 · 32</Mono>, '480'],
            ['Management', '12', <Mono>512</Mono>, <Mono>/28 · 16</Mono>, '496'],
            ['WAN link A', '2', <Mono>512</Mono>, <Mono>/31 · 2</Mono>, '510'],
            ['WAN link B', '2', <Mono>512</Mono>, <Mono>/31 · 2</Mono>, '510'],
          ]}
        />
        <P>
          Fixed sizing needs 4,096 addresses — a whole /20 — for a network that fits comfortably in a /22 with room to
          spare. On IPv4 that difference is the difference between a plan that survives a decade and one that runs out
          next year.
        </P>
      </Section>

      <Section>
        <H2>The alignment rule</H2>
        <P>
          A subnet of size <Mono>N</Mono> can only start at an address that is a multiple of <Mono>N</Mono>. A /26 (64
          addresses) can begin at .0, .64, .128 or .192 — never at .32. This is not a convention; it is a consequence of
          the mask being a run of leading 1 bits. There is no way to express "the 64 addresses starting at .32" as a
          prefix.
        </P>
        <Callout kind="note" title="Why largest first">
          <p>
            Hand out the biggest blocks first and every later, smaller block lands on a boundary that is still free.
            Hand out a /30 first and the next /26 has to skip to the following 64-boundary, stranding the 60 addresses in
            between. Allocating in descending size order is what makes VLSM lossless.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>The method</H2>
        <OL>
          <li>List every segment with the number of hosts it needs, including a growth allowance.</li>
          <li>
            Convert each to the smallest prefix that fits: find the smallest <Mono>h</Mono> where{' '}
            <Mono>2^h − 2 ≥ hosts</Mono>, then the prefix is <Mono>32 − h</Mono>. (Point-to-point links get a /31.)
          </li>
          <li>Sort the list from largest block to smallest.</li>
          <li>Allocate from the bottom of the parent block upward, with no gaps.</li>
          <li>Record what is left over as explicitly reserved, not as "spare" — spare space always gets taken.</li>
        </OL>

        <H3>Worked example</H3>
        <P>
          Parent block <Mono>10.20.0.0/22</Mono> (1,024 addresses). Requirements as in the table above.
        </P>
        <DataTable
          dense
          head={['Order', 'Segment', 'Size', 'Subnet', 'Range']}
          rows={[
            ['1', 'Users — floor 1', '512', <Mono>10.20.0.0/23</Mono>, <Mono>10.20.0.1 – 10.20.1.254</Mono>],
            ['2', 'Users — floor 2', '256', <Mono>10.20.2.0/24</Mono>, <Mono>10.20.2.1 – 10.20.2.254</Mono>],
            ['3', 'Wireless', '128', <Mono>10.20.3.0/25</Mono>, <Mono>10.20.3.1 – 10.20.3.126</Mono>],
            ['4', 'Voice', '64', <Mono>10.20.3.128/26</Mono>, <Mono>10.20.3.129 – 10.20.3.190</Mono>],
            ['5', 'Servers', '32', <Mono>10.20.3.192/27</Mono>, <Mono>10.20.3.193 – 10.20.3.222</Mono>],
            ['6', 'Management', '16', <Mono>10.20.3.224/28</Mono>, <Mono>10.20.3.225 – 10.20.3.238</Mono>],
            ['7', 'WAN link A', '2', <Mono>10.20.3.240/31</Mono>, <Mono>10.20.3.240 – 10.20.3.241</Mono>],
            ['8', 'WAN link B', '2', <Mono>10.20.3.242/31</Mono>, <Mono>10.20.3.242 – 10.20.3.243</Mono>],
          ]}
        />
        <P>
          Twelve addresses remain (<Mono>10.20.3.244</Mono> – <Mono>10.20.3.255</Mono>), and the whole design still
          summarizes as a single <Mono>10.20.0.0/22</Mono> to the rest of the network.
        </P>
      </Section>

      <Section>
        <H2>Do it yourself</H2>
        <P>
          The designer below runs the same algorithm. Change a host count and watch a subnet change size; add a segment
          and watch where it lands. The dim grey blocks at the right are what is left.
        </P>
        <VlsmDesigner />
      </Section>

      <Section>
        <H2>Sizing judgement</H2>
        <UL>
          <li>
            <strong>Size for the lifetime, not for today.</strong> Renumbering a live segment costs an outage; spare
            addresses cost nothing on a private /8.
          </li>
          <li>
            <strong>But do not round everything up to /24.</strong> Reflexive /24s in a datacenter with hundreds of
            segments exhaust a /16 quickly and destroy the summarization story.
          </li>
          <li>
            <strong>Wireless needs more than the client count.</strong> DHCP leases outlive the clients that hold them;
            two to three times the concurrent client count is normal.
          </li>
          <li>
            <strong>Point-to-point links are always /31.</strong> Sizing them by "hosts needed" is the one place where the
            answer is fixed in advance.
          </li>
        </UL>
        <Callout kind="warn" title="VLSM needs a classless routing protocol">
          <p>
            Because each subnet has a different mask, the mask has to travel with the route. OSPF, IS-IS, EIGRP and BGP
            all carry it. The truly classful protocols (RIPv1, IGRP) do not, which is why VLSM was impossible before them
            — and why "does this protocol carry the mask?" is still the first question when you meet an unfamiliar one.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['vlsm', 'borrowed-bits', 'address-plan', 'p2p-link', 'usable-hosts']} />
      </Section>

      <Takeaways
        items={[
          'A subnet of size N can only start on a multiple of N — alignment is a consequence of the mask, not a convention.',
          'Allocate largest block first; that ordering is what keeps every later block aligned and gap-free.',
          'Size for the segment’s lifetime, but do not default everything to /24 — that destroys both space and summarization.',
          'VLSM requires a routing protocol that carries the mask with each route.',
        ]}
      />
    </ModuleShell>
  )
}
