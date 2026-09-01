import { useState } from 'react'
import { Card } from './ui'

const PLACES = [128, 64, 32, 16, 8, 4, 2, 1]

/** A single octet you can click bit by bit — the cheapest way to internalise place values. */
export function BinaryOctet({ initial = 192 }: { initial?: number }) {
  const [value, setValue] = useState(initial)
  const bits = PLACES.map((place) => (value & place ? 1 : 0))

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">Build an octet</p>
          <p className="mt-0.5 text-sm text-ink-2">Click the bits. The decimal value is just the places that are on, added up.</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl font-semibold text-network">{value}</div>
          <div className="bits text-xs text-ink-3">{value.toString(2).padStart(8, '0')}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-8 gap-1.5">
        {PLACES.map((place, index) => (
          <button
            key={place}
            type="button"
            onClick={() => setValue((current) => current ^ place)}
            aria-pressed={bits[index] === 1}
            className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 transition-colors ${
              bits[index] === 1
                ? 'border-network bg-network/10 text-network'
                : 'border-line bg-surface-2 text-ink-3 hover:border-line-strong'
            }`}
          >
            <span className="font-mono text-lg font-semibold">{bits[index]}</span>
            <span className="font-mono text-[0.6rem]">{place}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 font-mono text-xs text-ink-2">
        {bits.some((bit) => bit === 1)
          ? `${PLACES.filter((_, index) => bits[index] === 1).join(' + ')} = ${value}`
          : 'all bits off = 0'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {[255, 192, 224, 240, 248, 252, 254, 0].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setValue(preset)}
            className="rounded-full border border-line px-2.5 py-1 font-mono text-xs text-ink-2 hover:border-network hover:text-network"
          >
            {preset}
          </button>
        ))}
        <span className="self-center text-xs text-ink-3">← every legal mask octet</span>
      </div>
    </Card>
  )
}
