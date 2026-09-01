import { ModuleShell } from '../../components/ModuleShell'
import { MaskAndDemo } from '../../components/MaskAnd'
import { AddressAnatomyExplorer } from '../../components/three/AddressAnatomy'
import { Callout, DataTable, DefList, H2, H3, Lead, Mono, OL, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'
import { blockSize, formatIPv4, prefixToMask, usableHosts, wildcardOf } from '../../lib/ipv4'

const COMMON_PREFIXES = [8, 12, 16, 20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]

export function MasksAndCidr() {
  return (
    <ModuleShell slug="masks-and-cidr">
      <Section>
        <Lead>
          The mask is the other half of every address assignment. It answers one question — where does the network part
          end? — and from that single answer, every other property of the subnet follows mechanically.
        </Lead>
        <P>
          An address without a mask is genuinely ambiguous. <Mono>10.1.2.3</Mono> could be a host in a network of sixteen
          million or in a network of two. Configuration that omits the mask is not shorthand; it is incomplete.
        </P>
      </Section>

      <Section>
        <H2>What the mask is</H2>
        <P>
          A <Term id="subnet-mask" /> is a 32-bit value whose bits are 1 for every position belonging to the network and
          0 for every position belonging to the host. The 1 bits are always contiguous and always left-aligned, which is
          why the mask can be written as a simple count — the <Term id="prefix-length" />.
        </P>
        <AddressAnatomyExplorer
          title="Moving the boundary"
          initialAddress="10.42.18.77"
          initialPrefix={20}
          initialParentPrefix={20}
          caption={
            <span>
              Drag the prefix slider. The violet plane is the boundary; blue cubes to its left are network bits, amber
              cubes to its right are host bits. Nothing about the address changes — only where you declare the split to
              be, and every number underneath follows from that.
            </span>
          }
        />
      </Section>

      <Section>
        <H2>The one operation that matters</H2>
        <P>
          Bitwise AND: a bit in the result is 1 only if it is 1 in both inputs. AND an address with its mask and every
          host bit is forced to zero, leaving the <Term id="network-address" />. That is the entire calculation a host or
          router performs to decide whether a destination is local.
        </P>
        <MaskAndDemo />
        <Callout kind="warn" title="Mismatched masks">
          <p>
            If two hosts on the same wire are configured with different prefix lengths, each computes a different answer
            to "is this local?". The classic symptom is asymmetric: A can reach B, but B's replies go to the router and
            get dropped or take a strange path. Always check both ends' masks, not just the one that is failing.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>Prefix, mask, size — one table, three views</H2>
        <P>
          These are the same fact written three ways. With practice you read across this table without looking it up; the
          middle column is the one people memorise last and need most.
        </P>
        <DataTable
          dense
          head={['Prefix', 'Dotted mask', 'Wildcard', 'Addresses', 'Usable hosts', 'Typical use']}
          rows={COMMON_PREFIXES.map((prefix) => [
            <Mono>/{prefix}</Mono>,
            <Mono>{formatIPv4(prefixToMask(prefix))}</Mono>,
            <Mono>{formatIPv4(wildcardOf(prefix))}</Mono>,
            blockSize(prefix).toLocaleString(),
            usableHosts(prefix).toLocaleString(),
            prefix === 8
              ? 'A whole private /8 estate'
              : prefix === 12
                ? '172.16.0.0/12 private block'
                : prefix === 16
                  ? 'A site or a cloud VPC'
                  : prefix === 20
                    ? 'A campus or a datacenter pod'
                    : prefix === 22
                      ? 'A large user or wireless VLAN'
                      : prefix === 23
                        ? 'A user VLAN with headroom'
                        : prefix === 24
                          ? 'The default server or access VLAN'
                          : prefix === 25 || prefix === 26
                            ? 'A right-sized user segment'
                            : prefix === 27 || prefix === 28
                              ? 'Small server or management segment'
                              : prefix === 29
                                ? 'A handful of appliances'
                                : prefix === 30
                                  ? 'Point-to-point link (legacy)'
                                  : prefix === 31
                                    ? 'Point-to-point link (RFC 3021)'
                                    : 'Loopback or host route',
          ])}
        />
      </Section>

      <Section>
        <H2>Two shortcuts worth internalising</H2>
        <H3>Every prefix is a doubling</H3>
        <P>
          Going from /24 to /25 halves the subnet: 256 addresses become 128. Going the other way doubles it. If you know
          one row of the table you can walk to any other by halving or doubling — no arithmetic needed.
        </P>
        <H3>The interesting octet</H3>
        <P>
          A mask has at most one octet that is neither 255 nor 0. That octet is where the boundary falls, and{' '}
          <Mono>256 − value</Mono> gives the <Term id="magic-number" />: both the size of each subnet and the increment
          between them. A /26 has mask <Mono>255.255.255.192</Mono>, so 256 − 192 = 64, so subnets begin at .0, .64, .128,
          .192.
        </P>
      </Section>

      <Section>
        <H2>Wildcard masks</H2>
        <P>
          A <Term id="wildcard-mask" /> is the mask with every bit flipped: 0 means "this bit must match" and 1 means
          "ignore it". Cisco ACLs and OSPF network statements use them.
        </P>
        <OL>
          <li>
            Take the mask: <Mono>255.255.255.192</Mono>
          </li>
          <li>
            Subtract each octet from 255: <Mono>0.0.0.63</Mono>
          </li>
          <li>
            That is the wildcard for a /26 — matching 64 consecutive addresses.
          </li>
        </OL>
        <UL>
          <li>
            <Mono>0.0.0.0</Mono> matches exactly one host.
          </li>
          <li>
            <Mono>255.255.255.255</Mono> matches everything — the wildcard equivalent of <Mono>any</Mono>.
          </li>
        </UL>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['subnet-mask', 'prefix-length', 'cidr', 'network-address', 'wildcard-mask', 'magic-number']} />
      </Section>

      <Takeaways
        items={[
          'The mask is a contiguous run of 1 bits; its length is the only thing that distinguishes one subnet size from another.',
          'AND the address with the mask to get the network address. Hosts do this for every packet to decide local versus gateway.',
          'Each extra prefix bit halves the subnet and doubles the subnet count — there is no other trade-off to learn.',
          'A mask mismatch between two hosts on the same wire produces asymmetric, confusing failures. Check both ends.',
        ]}
      />
    </ModuleShell>
  )
}
