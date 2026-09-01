import { ModuleShell } from '../../components/ModuleShell'
import { SubnetSplitExplorer } from '../../components/three/SubnetHierarchy'
import { Callout, DataTable, DefList, H2, H3, Lead, Mono, OL, P, Section, Takeaways } from '../../components/ui'
import { Term } from '../../components/Term'
import { blockSize, formatIPv4, prefixToMask, usableHosts } from '../../lib/ipv4'

const BORROW_ROWS = [1, 2, 3, 4, 5, 6, 7, 8]

export function SubnettingPractice() {
  return (
    <ModuleShell slug="subnetting-practice">
      <Section>
        <Lead>
          Subnetting by hand is one decision repeated: take a bit from the host side, give it to the network side. Borrow
          s bits and you get 2<sup>s</sup> subnets, each 2<sup>s</sup> times smaller. Everything below is bookkeeping.
        </Lead>
      </Section>

      <Section>
        <H2>Borrowing bits</H2>
        <P>
          Start with a block — say <Mono>192.168.10.0/24</Mono>, 256 addresses. Move the boundary one bit right and you
          have two /25s of 128 addresses. Move it again and you have four /26s of 64. The bits you moved are the{' '}
          <Term id="borrowed-bits" />, and their value in each subnet is what distinguishes one subnet from the next.
        </P>
        <SubnetSplitExplorer
          initialBase="192.168.10.0/24"
          caption={
            <span>
              The wide blue slab is the parent block; the pieces above it are the subnets you get by borrowing bits. Click
              any subnet to split it one level further — that third row is exactly what <Term id="vlsm" /> does, and it is
              the subject of module 7.
            </span>
          }
        />
      </Section>

      <Section>
        <H2>Borrowing from a /24, in one table</H2>
        <DataTable
          dense
          head={['Borrowed bits', 'New prefix', 'Mask', 'Subnets', 'Addresses each', 'Usable each', 'Increment']}
          rows={BORROW_ROWS.map((borrowed) => {
            const prefix = 24 + borrowed
            return [
              <Mono>{borrowed}</Mono>,
              <Mono>/{prefix}</Mono>,
              <Mono>{formatIPv4(prefixToMask(prefix))}</Mono>,
              Math.pow(2, borrowed).toLocaleString(),
              blockSize(prefix).toLocaleString(),
              usableHosts(prefix).toLocaleString(),
              <Mono>{blockSize(prefix)}</Mono>,
            ]
          })}
        />
        <P>
          The last two columns are the same number, and that is the point: the size of a subnet and the distance between
          consecutive subnets are identical, because the subnets are packed with no gaps.
        </P>
      </Section>

      <Section>
        <H2>The magic-number method</H2>
        <P>
          This is how experienced engineers subnet in their heads. It avoids binary entirely by exploiting the fact that
          only one octet of the mask is ever "interesting".
        </P>
        <OL>
          <li>
            Find the interesting octet — the one in the mask that is neither 255 nor 0. For <Mono>/27</Mono> the mask is{' '}
            <Mono>255.255.255.224</Mono>, so it is the fourth.
          </li>
          <li>
            Subtract it from 256: <Mono>256 − 224 = 32</Mono>. That is the <Term id="magic-number" />.
          </li>
          <li>
            Subnets begin at multiples of the magic number in that octet: <Mono>.0, .32, .64, .96, …</Mono>
          </li>
          <li>
            Each subnet ends one below the next one's start, and that last address is the broadcast.
          </li>
        </OL>

        <H3>Worked example</H3>
        <P>
          <strong>Which subnet is 172.20.137.200/26 in?</strong>
        </P>
        <OL>
          <li>
            /26 → mask <Mono>255.255.255.192</Mono> → interesting octet is the fourth → magic number 256 − 192 = 64.
          </li>
          <li>
            Multiples of 64: 0, 64, 128, 192. The largest one not above 200 is <strong>192</strong>.
          </li>
          <li>
            Network address: <Mono>172.20.137.192/26</Mono>.
          </li>
          <li>
            Next subnet would start at 256, so the broadcast is <Mono>172.20.137.255</Mono>.
          </li>
          <li>
            Usable range: <Mono>172.20.137.193</Mono> – <Mono>172.20.137.254</Mono>. 62 hosts.
          </li>
        </OL>

        <H3>When the boundary is in the third octet</H3>
        <P>
          <strong>Which subnet is 10.55.83.17/20 in?</strong> /20 → mask <Mono>255.255.240.0</Mono> → interesting octet is
          the third → magic number 256 − 240 = 16. Multiples of 16: 0, 16, 32, 48, 64, 80, 96. The largest not above 83 is
          80, so the network is <Mono>10.55.80.0/20</Mono>, the broadcast is <Mono>10.55.95.255</Mono>, and the range runs
          from <Mono>10.55.80.1</Mono> to <Mono>10.55.95.254</Mono>.
        </P>
        <Callout kind="note" title="The octet the boundary lands in">
          <p>
            /1–/8 → first octet. /9–/16 → second. /17–/24 → third. /25–/32 → fourth. Everything to the left of the
            interesting octet is copied unchanged; everything to the right is 0 in the network address and 255 in the
            broadcast.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>Practice set</H2>
        <P>Work these with the magic-number method, then check them in the calculator.</P>
        <DataTable
          dense
          head={['Question', 'Answer']}
          rows={[
            ['Network of 192.168.4.130/25?', <Mono>192.168.4.128/25 · broadcast .255 · hosts .129–.254</Mono>],
            ['Network of 10.0.13.200/28?', <Mono>10.0.13.192/28 · broadcast .207 · hosts .193–.206</Mono>],
            ['Network of 172.16.200.5/21?', <Mono>172.16.200.0/21 · broadcast 172.16.207.255</Mono>],
            ['How many /26s fit in a /22?', <Mono>2^(26−22) = 16</Mono>],
            ['Smallest prefix holding 300 hosts?', <Mono>/23 — 510 usable; a /24 only gives 254</Mono>],
            ['Smallest prefix holding 2 hosts?', <Mono>/31 with RFC 3021, otherwise /30</Mono>],
            ['Is 10.1.1.63 a host address in 10.1.1.0/26?', <Mono>No — it is that subnet’s broadcast</Mono>],
            ['Is 10.1.1.63 a host address in 10.1.0.0/16?', <Mono>Yes — ordinary host address</Mono>],
          ]}
        />
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['borrowed-bits', 'magic-number', 'host-bits', 'subnet']} />
      </Section>

      <Takeaways
        items={[
          'Borrowing s bits gives 2ˢ subnets, each 2ˢ times smaller. That single trade is all of subnetting.',
          'Subnet size and the increment between subnets are the same number — subnets pack with no gaps.',
          'The magic number (256 minus the interesting mask octet) lets you subnet in your head, in any octet.',
          'Whether an address is a host, a network, or a broadcast address is entirely a function of the prefix applied to it.',
        ]}
      />
    </ModuleShell>
  )
}
