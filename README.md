# Subnetting in 3D

An interactive course on IPv4 and IPv6 subnetting, built for teaching network engineering to
new graduates. Addresses are rendered as 3D objects you can pull apart bit by bit, octet by
octet, so the network/host boundary is something you watch move rather than something you
memorise.

**Live site:** https://subnetting.akhtar.app/

## What is in it

**Twelve modules, in four parts**

| Part | Modules |
| --- | --- |
| Foundations | Why networks get divided · Bits, bytes, and base-2 |
| IPv4 | Address anatomy · Masks, prefixes, and CIDR · Inside a single subnet · Subnetting by hand · VLSM · Summarization |
| IPv6 | Address anatomy · Subnetting IPv6 |
| Production | Designing an address plan · When subnetting goes wrong |

**Four 3D views**

- **Address anatomy** — 32 bit-cubes grouped into octets; the mask plane slides through them,
  and clicking a cube flips that bit.
- **Subnet hierarchy** — a parent block that separates into its children, with a third tier for
  the block you select.
- **IPv6 structure** — 128 bits as eight hextets of four nibbles, banded into routing prefix,
  subnet ID, and interface ID.
- **Production topology** — a reference enterprise where every tier is clickable and shows its
  allocation and the reasoning behind its size.

**Three design tools** — a subnet calculator (IPv4 and IPv6), a VLSM designer, and a route
summarizer. All calculation happens in the browser; nothing is sent anywhere.

**A glossary** of every component named in the course, reachable from the dotted terms inline.

## Running it locally

```bash
npm install
npm run dev        # http://localhost:5173/
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

Node 20 or newer.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes
`dist/` to GitHub Pages. Enable it once under **Settings → Pages → Source → GitHub Actions**.

The site is served from a repository subpath, so `vite.config.ts` sets
`base: '/'`, matching the custom domain in `public/CNAME`, which serves the site from the root.
To build for the bare `github.io/<repo>/` URL instead, use
`BASE_PATH=/Learn-Network-Subnetting/ npm run build`. Routing uses `HashRouter` so deep links survive a page refresh
without any server-side rewrite.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · react-three-fiber / three.js.

Light theme by default with a light/dark toggle in the header; the choice is stored in
`localStorage` and applied before first paint so the page never flashes the wrong theme. The
3D scenes take their palette from the same theme.

## Layout

```
src/
  lib/          address math — ipv4, ipv6, vlsm, summarize — plus glossary and curriculum data
  components/
    three/      the four 3D scenes and the shared canvas shell
    tools/      calculator, VLSM designer, summarizer
    ui.tsx      typography, tables, callouts, definition cards
  pages/
    modules/    one file per module
    tools/      one page per tool
```

All examples use RFC 1918 private space and the RFC 5737 / RFC 3849 documentation ranges, so
nothing in the material can collide with a real network.
