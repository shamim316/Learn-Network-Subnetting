import { ModuleShell } from '../../components/ModuleShell'
import { Summarizer } from '../../components/tools/Summarizer'
import { Callout, DataTable, DefList, H2, H3, Lead, Mono, OL, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'

export function Summarization() {
  return (
    <ModuleShell slug="summarization">
      <Section>
        <Lead>
          Summarization is subnetting run backwards: instead of moving the boundary right to make more networks, you move
          it left to describe many networks as one. It is the payoff for allocating contiguously, and it is impossible
          without that.
        </Lead>
      </Section>

      <Section>
        <H2>The mechanism</H2>
        <P>
          To summarize a set of prefixes, write them in binary and keep the bits every one of them shares. The count of
          shared leading bits is the summary's prefix length; the shared bits themselves are its network address.
        </P>
        <DataTable
          dense
          head={['Prefix', 'Binary (first 24 bits)']}
          rows={[
            [<Mono>10.1.0.0/24</Mono>, <span className="bits">00001010 00000001 000000<span className="text-host">00</span></span>],
            [<Mono>10.1.1.0/24</Mono>, <span className="bits">00001010 00000001 000000<span className="text-host">01</span></span>],
            [<Mono>10.1.2.0/24</Mono>, <span className="bits">00001010 00000001 000000<span className="text-host">10</span></span>],
            [<Mono>10.1.3.0/24</Mono>, <span className="bits">00001010 00000001 000000<span className="text-host">11</span></span>],
            [
              <Mono>= 10.1.0.0/22</Mono>,
              <span className="bits text-network">00001010 00000001 000000<span className="text-ink-3">xx</span></span>,
            ],
          ]}
        />
        <P>
          The first 22 bits are identical; the last two differ. So four /24s become one /22 — one route instead of four,
          advertising exactly the same address space.
        </P>
      </Section>

      <Section>
        <H2>Try it on any set</H2>
        <Summarizer />
      </Section>

      <Section>
        <H2>Why it matters at scale</H2>
        <UL>
          <li>
            <strong>Routing table size.</strong> Every prefix costs memory in the <Term id="routing-table" /> of every
            router that carries it. A 2,000-subnet enterprise that summarizes per site might advertise 40 prefixes into
            its core instead of 2,000.
          </li>
          <li>
            <strong>Convergence.</strong> Fewer prefixes means less to recompute and flood when something changes.
          </li>
          <li>
            <strong>Stability.</strong> A link that flaps inside a summarized region does not change the summary, so the
            flap never propagates outward. This is often the strongest argument: summarization is a fault-containment
            tool, not just a memory optimisation.
          </li>
          <li>
            <strong>Policy.</strong> One summarized prefix per site turns a firewall policy from a list into a sentence.
          </li>
        </UL>
      </Section>

      <Section>
        <H2>Exact versus convenient</H2>
        <P>
          <Mono>10.1.0.0/24</Mono> through <Mono>10.1.3.0/24</Mono> summarize perfectly. Add{' '}
          <Mono>10.1.8.0/24</Mono> and the shared-bit count drops to /20 — a summary that also covers{' '}
          <Mono>10.1.4.0</Mono> – <Mono>10.1.7.255</Mono> and <Mono>10.1.9.0</Mono> – <Mono>10.1.15.255</Mono>, which you
          do not own.
        </P>
        <OL>
          <li>
            If nobody else uses that space, advertising the /20 is fine and is what most designs do.
          </li>
          <li>
            If another site owns <Mono>10.1.9.0/24</Mono>, your /20 competes with their /24. Yours loses at that address
            thanks to <Term id="longest-prefix-match" />, but traffic for <Mono>10.1.5.x</Mono> — which nobody owns —
            still arrives at your router and is dropped. That is a black hole.
          </li>
          <li>
            The safe answer is the exact aggregation: <Mono>10.1.0.0/22</Mono> plus <Mono>10.1.8.0/24</Mono>. Two routes,
            zero over-advertising.
          </li>
        </OL>
        <Callout kind="warn" title="Summarization is a design decision made years earlier">
          <p>
            You cannot summarize your way out of a scattered allocation. If site A holds 10.1.0.0/24, 10.7.3.0/24 and
            10.19.8.0/24, no summary shorter than 10.0.0.0/11 covers them — and that swallows every other site. The
            hierarchy has to exist in the allocation before the routing protocol can exploit it.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>Where summaries are configured</H2>
        <DataTable
          head={['Place', 'What happens there']}
          rows={[
            [
              <Term id="ospf-area">OSPF area border</Term>,
              'An ABR summarizes the area’s internal prefixes into the backbone. Areas exist largely so this is possible.',
            ],
            ['EIGRP interface', 'Summaries are configured per interface, so a summary can be advertised in one direction only.'],
            ['BGP aggregation', 'An aggregate route replaces its more-specific components, usually at an AS edge, with the option to suppress or leak the specifics.'],
            ['Static summary', 'A single static route to a next hop covering many internal subnets — common on stub and branch routers.'],
            ['Cloud route tables', 'A VPC route or transit gateway attachment usually carries one summarized prefix per environment rather than per subnet.'],
          ]}
        />

        <H3>The discard route</H3>
        <P>
          When a router advertises a summary, it should also install a route for that summary pointing to null. Otherwise
          a packet for an address inside the summary but not inside any specific subnet can be forwarded back toward the
          default route and loop. Most implementations create this discard route automatically — it is worth knowing why
          it is there.
        </P>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['summarization', 'routing-table', 'longest-prefix-match', 'ospf-area', 'default-route', 'address-plan']} />
      </Section>

      <Takeaways
        items={[
          'A summary keeps the bits every member shares; the first bit where members disagree is where it has to stop.',
          'Summarization shrinks routing tables, speeds convergence, and — most valuably — stops link flaps from propagating.',
          'A summary that covers space you do not own is a potential black hole; prefer exact aggregation when the space is shared.',
          'Summarization is only possible if the address plan was allocated hierarchically in the first place.',
        ]}
      />
    </ModuleShell>
  )
}
