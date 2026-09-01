import { useState } from 'react'
import { Card, Field, inputClass } from './ui'
import { binaryIPv4, formatIPv4, networkOf, parseIPv4, prefixToMask } from '../lib/ipv4'

function BitRow({ label, value, prefix, tone }: { label: string; value: number; prefix: number; tone: string }) {
  const binary = binaryIPv4(value, '')
  return (
    <tr>
      <td className="py-1 pr-4 text-xs whitespace-nowrap text-ink-3">{label}</td>
      <td className="bits py-1 text-sm">
        {binary.split('').map((bit, index) => (
          <span key={index} className={index < prefix ? tone : 'text-ink-3'}>
            {bit}
            {index % 8 === 7 && index < 31 ? <span className="text-ink-3">.</span> : null}
          </span>
        ))}
      </td>
      <td className="py-1 pl-4 font-mono text-xs whitespace-nowrap text-ink-2">{formatIPv4(value)}</td>
    </tr>
  )
}

/**
 * The forwarding decision, made visible: AND both addresses with the mask and
 * compare. Same answer means "same subnet, deliver directly".
 */
export function MaskAndDemo({
  initialSource = '10.42.18.77',
  initialDestination = '10.42.18.130',
  initialPrefix = 26,
}: {
  initialSource?: string
  initialDestination?: string
  initialPrefix?: number
}) {
  const [sourceText, setSourceText] = useState(initialSource)
  const [destinationText, setDestinationText] = useState(initialDestination)
  const [prefix, setPrefix] = useState(initialPrefix)

  const source = parseIPv4(sourceText)
  const destination = parseIPv4(destinationText)
  const mask = prefixToMask(prefix)

  const sourceNetwork = source.ok ? networkOf(source.value, prefix) : null
  const destinationNetwork = destination.ok ? networkOf(destination.value, prefix) : null
  const local = sourceNetwork !== null && sourceNetwork === destinationNetwork

  return (
    <Card>
      <p className="text-sm font-semibold text-ink">The forwarding decision</p>
      <p className="mt-1 text-sm text-ink-2">
        A host does exactly this before sending every packet: AND its own address with the mask, AND the destination with
        the same mask, compare.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="My address" error={source.ok ? null : source.error}>
          <input className={inputClass} value={sourceText} onChange={(event) => setSourceText(event.target.value)} spellCheck={false} />
        </Field>
        <Field label="Destination" error={destination.ok ? null : destination.error}>
          <input
            className={inputClass}
            value={destinationText}
            onChange={(event) => setDestinationText(event.target.value)}
            spellCheck={false}
          />
        </Field>
        <Field label={`Mask /${prefix}`} hint={formatIPv4(mask)}>
          <input type="range" min={8} max={32} value={prefix} onChange={(event) => setPrefix(Number(event.target.value))} />
        </Field>
      </div>

      {source.ok && destination.ok ? (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem]">
              <tbody>
                <BitRow label="my address" value={source.value} prefix={prefix} tone="text-network" />
                <BitRow label="mask" value={mask} prefix={prefix} tone="text-accent" />
                <tr className="border-t border-line">
                  <td />
                  <td />
                  <td />
                </tr>
                <BitRow label="= my network" value={sourceNetwork!} prefix={prefix} tone="text-network" />
                <tr>
                  <td colSpan={3} className="pt-3" />
                </tr>
                <BitRow label="destination" value={destination.value} prefix={prefix} tone="text-host" />
                <BitRow label="= its network" value={destinationNetwork!} prefix={prefix} tone="text-host" />
              </tbody>
            </table>
          </div>

          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              local ? 'border-ok/40 bg-ok/5 text-ink-2' : 'border-network/40 bg-network/5 text-ink-2'
            }`}
          >
            {local ? (
              <>
                <span className="font-semibold text-ok">Same network.</span> The host ARPs for the destination and sends
                the frame directly — no router involved.
              </>
            ) : (
              <>
                <span className="font-semibold text-network">Different networks.</span> The host ARPs for its default
                gateway instead and hands the packet to the router.
              </>
            )}
          </div>
        </>
      ) : null}
    </Card>
  )
}
