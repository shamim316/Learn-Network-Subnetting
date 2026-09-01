import { ModuleShell } from '../../components/ModuleShell'
import { MaskAndDemo } from '../../components/MaskAnd'
import { Callout, DataTable, DefList, H2, H3, Lead, Mono, OL, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'

export function Operations() {
  return (
    <ModuleShell slug="operations">
      <Section>
        <Lead>
          Subnetting faults have distinctive signatures. Learning to recognise five or six of them turns a long
          investigation into a two-minute one, because each signature points at a specific misconfigured field.
        </Lead>
      </Section>

      <Section>
        <H2>The signatures</H2>
        <DataTable
          head={['Symptom', 'Most likely cause', 'What to check']}
          rows={[
            [
              'Host reaches everything except a few addresses on its own wire',
              'Mask too long — those addresses look remote, so traffic goes to the gateway and comes back or is dropped',
              'Compare the prefix length on both hosts, not just the failing one',
            ],
            [
              'Host reaches nothing off-subnet, local traffic fine',
              'Gateway address is outside the host’s own subnet, or no default route',
              'AND the gateway with the host’s mask — it must equal the host’s network',
            ],
            [
              'Traffic works one direction only',
              'Asymmetric mask or a missing return route',
              'Check the mask at both ends and the return path in the routing table',
            ],
            [
              'Interface has a 169.254 address',
              'DHCP failed — no server, no relay, or an exhausted scope',
              'DHCP relay (ip helper-address) on the SVI, scope utilisation, VLAN mapping',
            ],
            [
              'Intermittent duplicate-address or ARP flapping',
              'Two subnets overlapping on the same VLAN, or a duplicated static assignment',
              'ARP table for two MACs on one IP; overlapping allocations in IPAM',
            ],
            [
              'A site is unreachable but its neighbours are fine',
              'A summary route covering space that is not all yours — a black hole',
              'Compare the advertised summary with what is actually allocated',
            ],
            [
              'New cloud subnet cannot be created',
              'VPC CIDR exhausted, or the requested range overlaps an existing subnet',
              'Free space in the VPC CIDR; secondary CIDR options',
            ],
            [
              'VPN or peering to a partner will not come up',
              'Overlapping RFC 1918 space on both sides',
              'Both sides’ allocations; NAT is usually the only quick fix',
            ],
            [
              'IPv6 resolves intermittently, big transfers hang',
              'ICMPv6 filtered — Neighbor Discovery and PMTUD both broken',
              'Firewall policy against RFC 4890',
            ],
          ]}
        />
      </Section>

      <Section>
        <H2>Mask mismatch, in detail</H2>
        <P>
          This is the most common single fault, and the demo below reproduces it exactly. Set the source and destination
          to two addresses that belong together, then shorten and lengthen the prefix and watch the verdict flip.
        </P>
        <MaskAndDemo initialSource="10.42.18.77" initialDestination="10.42.18.130" initialPrefix={26} />
        <P>
          With a /24 both addresses are local and the hosts talk directly. With a /26 they are in different subnets and
          the traffic must be routed. If one host is configured /24 and the other /26, the /24 host sends directly while
          the /26 host replies via the gateway — the packets take different paths, and any stateful device in between
          drops the asymmetric flow.
        </P>
      </Section>

      <Section>
        <H2>Overlapping address space</H2>
        <P>
          <Term id="rfc1918" /> overlap is the defining operational hazard of IPv4. Two companies merge; both used
          10.0.0.0/16 for their headquarters. The options are all bad:
        </P>
        <OL>
          <li>
            <strong>Renumber one side.</strong> Correct, expensive, and slow — every DHCP scope, firewall rule, DNS
            record, hard-coded address, and certificate SAN.
          </li>
          <li>
            <strong>Double NAT across the boundary.</strong> Fast, and permanently confusing: addresses now mean
            different things depending on which side you are standing on.
          </li>
          <li>
            <strong>Keep the environments separate</strong> and integrate at the application layer instead.
          </li>
        </OL>
        <P>
          The IPv6 answer is structural: a <Term id="ula" /> prefix contains a random 40-bit global ID, so two
          independently generated ULA prefixes essentially never collide. This is a real, if unglamorous, argument for
          deploying IPv6 internally.
        </P>
      </Section>

      <Section>
        <H2>Running out</H2>
        <H3>The DHCP scope fills</H3>
        <UL>
          <li>Short-term: shorten the lease time so abandoned leases return faster.</li>
          <li>Medium: reclaim the static range if it is oversized.</li>
          <li>Real fix: extend the subnet, which means renumbering — so the real real fix is sizing it correctly at design time.</li>
        </UL>
        <H3>The VPC fills</H3>
        <P>
          Cloud providers allow secondary CIDR blocks, and those are usually the escape hatch. But secondary blocks are
          often non-contiguous with the primary, which means the elegant single summary over the interconnect becomes two
          or three routes — and, if space was taken from elsewhere in the estate, possibly a collision later.
        </P>
        <Callout kind="warn" title="Watch for silent consumers">
          <p>
            Kubernetes pod CIDRs, service meshes, container bridges (Docker's default <Mono>172.17.0.0/16</Mono>), and VPN
            client pools all consume address space that rarely appears in the network team's plan. They are also a frequent
            source of overlap with RFC 1918 space already in use elsewhere.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>A method for diagnosis</H2>
        <OL>
          <li>
            <strong>Get the address and the mask.</strong> Not the address alone — half the faults in this module are
            invisible without the mask.
          </li>
          <li>
            <strong>Compute the network address yourself.</strong> Do not trust what the device reports it thinks it is
            in.
          </li>
          <li>
            <strong>Check the gateway is inside that network.</strong> One AND operation eliminates a whole class of
            faults.
          </li>
          <li>
            <strong>Compare with the plan.</strong> If the configured subnet is not what IPAM says it should be, you have
            found the change that caused this.
          </li>
          <li>
            <strong>Then look at routing.</strong> Longest-prefix match means a stray more-specific route beats your
            carefully designed summary — check for one before assuming the summary is wrong.
          </li>
        </OL>
      </Section>

      <Section>
        <H2>Habits that prevent most of this</H2>
        <UL>
          <li>Never assign an address without recording it, and never record it anywhere but the system of record.</li>
          <li>Keep one convention for gateway placement across the entire estate.</li>
          <li>Reserve space explicitly; unlabelled free space is not reserved, it is bait.</li>
          <li>Review summaries whenever an allocation changes — the summary is a promise about what you own.</li>
          <li>Test IPv6 policy separately from IPv4. A dual-stack network fails over to the other family silently, and hides the fault until it cannot.</li>
        </UL>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['ipam', 'longest-prefix-match', 'nat', 'ula', 'dhcp', 'ip-helper', 'acl', 'mtu']} />
      </Section>

      <Takeaways
        items={[
          'Always collect the mask with the address — most subnetting faults are invisible without it.',
          'A gateway outside the host’s own subnet, and a mask mismatch between two hosts on one wire, cause the two most common failure signatures.',
          'Overlapping RFC 1918 space has no cheap fix; ULA’s random global ID is IPv6’s structural answer to it.',
          'Silent consumers — container networks, VPN pools, managed cloud services — exhaust address space that never appears in the plan.',
        ]}
      />
    </ModuleShell>
  )
}
