import { ModuleShell } from '../../components/ModuleShell'
import { BinaryOctet } from '../../components/BinaryOctet'
import { AddressAnatomyExplorer } from '../../components/three/AddressAnatomy'
import { Callout, DataTable, DefList, H2, H3, Lead, Mono, OL, P, Section, Takeaways, UL } from '../../components/ui'
import { Term } from '../../components/Term'

const POWERS = Array.from({ length: 17 }, (_, exponent) => exponent)

export function Binary() {
  return (
    <ModuleShell slug="binary">
      <Section>
        <Lead>
          Everything in subnetting is a power of two, and every shortcut you will ever use is a memory of the same eight
          numbers. Twenty minutes here removes the need for a calculator later.
        </Lead>
        <P>
          Addresses are binary. Dotted decimal is a display format, nothing more — the moment a mask lands anywhere other
          than a dot, the decimal view stops helping and you have to see the bits. This module makes that view automatic.
        </P>
      </Section>

      <Section>
        <H2>Place values</H2>
        <P>
          In base 10 the columns are 1, 10, 100, 1000. In base 2 they are 1, 2, 4, 8, 16, 32, 64, 128. An{' '}
          <Term id="octet" /> is eight of those columns, so it runs from 0 (all off) to 255 (all on) — 256 distinct
          values, which is 2<sup>8</sup>.
        </P>
        <BinaryOctet initial={192} />
        <Callout kind="note" title="The eight numbers">
          <p>
            128, 64, 32, 16, 8, 4, 2, 1. Read them left to right and you can convert any octet by subtraction: 200 has a
            128 in it (72 left), a 64 (8 left), and an 8 — so <Mono>11001000</Mono>.
          </p>
        </Callout>
      </Section>

      <Section>
        <H2>Powers of two</H2>
        <P>
          Two questions come up constantly: <em>how many subnets do I get from n borrowed bits</em> (2<sup>n</sup>) and{' '}
          <em>how many addresses are in a subnet with h host bits</em> (2<sup>h</sup>). Both are the same table.
        </P>
        <DataTable
          dense
          head={['n', '2ⁿ', 'As a subnet size', 'Prefix that leaves n host bits']}
          rows={POWERS.map((exponent) => [
            <Mono>{exponent}</Mono>,
            <Mono>{Math.pow(2, exponent).toLocaleString()}</Mono>,
            exponent === 0 ? '1 address (a host route)' : `${Math.pow(2, exponent).toLocaleString()} addresses`,
            <Mono>/{32 - exponent}</Mono>,
          ])}
        />
      </Section>

      <Section>
        <H2>Converting without thinking about it</H2>
        <H3>Decimal to binary</H3>
        <OL>
          <li>
            Write the eight place values: <Mono>128 64 32 16 8 4 2 1</Mono>.
          </li>
          <li>Walk left to right. If the place value fits in what is left, write 1 and subtract it; otherwise write 0.</li>
          <li>Stop when you reach zero; pad the rest with zeros.</li>
        </OL>
        <P>
          <Mono>172</Mono> → 128 fits (44 left) → 64 does not → 32 fits (12 left) → 16 does not → 8 fits (4 left) → 4 fits
          (0 left) → <Mono>10101100</Mono>.
        </P>

        <H3>Binary to decimal</H3>
        <P>Add the place values wherever there is a 1. That is the whole method.</P>

        <H3>Binary to hexadecimal</H3>
        <P>
          Split into groups of four bits — <Term id="nibble">nibbles</Term> — and convert each to one hex digit. This
          matters for IPv6, where the address is written entirely in hex and each digit is exactly four bits.
        </P>
        <DataTable
          dense
          head={['Binary', 'Hex', 'Decimal', 'Binary', 'Hex', 'Decimal']}
          rows={Array.from({ length: 8 }, (_, index) => [
            <Mono>{index.toString(2).padStart(4, '0')}</Mono>,
            <Mono>{index.toString(16)}</Mono>,
            <Mono>{index}</Mono>,
            <Mono>{(index + 8).toString(2).padStart(4, '0')}</Mono>,
            <Mono>{(index + 8).toString(16)}</Mono>,
            <Mono>{index + 8}</Mono>,
          ])}
        />
      </Section>

      <Section>
        <H2>Seeing all 32 bits at once</H2>
        <P>
          The figure below is the same address in three views at the same time: the cubes are the raw bits, the plates
          underneath group them into octets, and the numbers below those are the dotted decimal you would type. Flip a bit
          and watch which octet changes — and by how much, depending on which column you hit.
        </P>
        <AddressAnatomyExplorer
          title="One address, 32 bits"
          initialAddress="172.20.130.9"
          initialPrefix={16}
          initialParentPrefix={16}
          caption={
            <span>
              Flipping the leftmost bit of an octet changes it by 128; flipping the rightmost changes it by 1. The dots
              between octets are punctuation for humans — the hardware sees one continuous 32-bit field.
            </span>
          }
        />
      </Section>

      <Section>
        <H2>Two habits worth building</H2>
        <UL>
          <li>
            <strong>Recognise mask octets on sight.</strong> Only nine values are legal in a mask octet: 0, 128, 192, 224,
            240, 248, 252, 254, 255. Anything else means someone typed a mask that is not a contiguous run of ones.
          </li>
          <li>
            <strong>Read prefix lengths as "bits left".</strong> A /26 is not "26"; it is "6 host bits, so 64 addresses".
            Making that translation instant is most of what fast subnetting is.
          </li>
        </UL>
      </Section>

      <Section>
        <H2>The vocabulary</H2>
        <DefList ids={['bit', 'octet', 'nibble', 'dotted-decimal', 'hextet']} />
      </Section>

      <Takeaways
        items={[
          'The eight place values 128 64 32 16 8 4 2 1 are the entire conversion method in both directions.',
          '2ⁿ answers "how many subnets"; 2ʰ answers "how many addresses". They are the same table read from different ends.',
          'Four bits make one hex digit — the reason IPv6 prefixes are far easier to read when they land on a nibble boundary.',
          'Only nine octet values can legally appear in a subnet mask; memorising them catches typos instantly.',
        ]}
      />
    </ModuleShell>
  )
}
