import { Link } from 'react-router-dom'
import { AddressAnatomyExplorer } from '../components/three/AddressAnatomy'
import { MODULES, PARTS, TOOLS } from '../lib/curriculum'
import { Callout, Card, Legend, P } from '../components/ui'
import { useScenePalette } from '../theme'

export function Home() {
  const palette = useScenePalette()
  const totalMinutes = MODULES.reduce((sum, module) => sum + module.minutes, 0)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12">
      <header className="flex flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-network">
          {MODULES.length} modules · about {Math.round(totalMinutes / 60)} hours · IPv4 and IPv6
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Subnetting, taken apart one bit at a time.
        </h1>
        <p className="text-lg leading-relaxed text-ink-2">
          Subnetting is not arithmetic you memorise — it is a boundary you move through a 32- or 128-bit field, and every
          consequence follows from where you put it. This course shows that field as a physical object you can pull apart,
          then walks the same idea up through VLSM, summarization, IPv6, and a real production address plan.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={MODULES[0].path}
            className="rounded-lg bg-network px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Start module 1 →
          </Link>
          <Link
            to="/tools/calculator"
            className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-network"
          >
            Open the calculator
          </Link>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <AddressAnatomyExplorer
          title="Try it now — an IPv4 address, exploded"
          initialAddress="192.168.10.37"
          initialPrefix={26}
          initialParentPrefix={24}
          caption={
            <span>
              Drag to orbit, scroll to zoom, click a cube to flip that bit. Slide the prefix and watch the network/host
              boundary — the violet plane — move through the address. Everything else on this page is a consequence of
              where that plane sits.
            </span>
          }
        />
        <Legend
          items={[
            { color: palette.network, label: 'Network bits' },
            { color: palette.subnet, label: 'Borrowed subnet bits' },
            { color: palette.host, label: 'Host bits' },
          ]}
        />
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">The course</h2>
        {PARTS.map((part) => (
          <div key={part.title} className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-3">{part.title}</h3>
              <P>{part.summary}</P>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {part.modules.map((module) => (
                <Link
                  key={module.slug}
                  to={module.path}
                  className="group flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-network"
                >
                  <span className="font-mono text-xs text-ink-3">
                    {String(module.number).padStart(2, '0')} · {module.minutes} min
                  </span>
                  <span className="font-medium text-ink group-hover:text-network">{module.title}</span>
                  <span className="text-sm leading-6 text-ink-2">{module.blurb}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Design tools</h2>
        <P>
          The same engines that drive the lessons, unwrapped for real work. Nothing is sent anywhere — every calculation
          runs in your browser.
        </P>
        <div className="grid gap-3 sm:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-network"
            >
              <span className="font-medium text-ink group-hover:text-network">{tool.title}</span>
              <span className="text-sm leading-6 text-ink-2">{tool.blurb}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">If you are teaching from this</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold text-ink">Lecture</p>
            <p className="mt-1.5 text-sm leading-6 text-ink-2">
              Each module opens with one 3D figure that answers a single question. Project it, drag the prefix slider, and
              let the class predict what the host count does before you release the mouse. The dark-mode toggle in the
              header is there because projectors are unforgiving.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-ink">Lab</p>
            <p className="mt-1.5 text-sm leading-6 text-ink-2">
              Give the class a host-requirement table and the VLSM designer, then have them defend their allocation order.
              The summarizer makes the cost of a scattered plan visible immediately: same addresses, four routes instead of
              one.
            </p>
          </Card>
        </div>
        <Callout kind="tip" title="Recommended order">
          <p>
            Modules 1–2 can be skipped for a class that is already comfortable with binary, but do not skip module 4 —
            almost every subnetting mistake in production traces back to a shaky grasp of what the mask actually does.
          </p>
        </Callout>
      </section>
    </div>
  )
}
