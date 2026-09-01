/**
 * Self-checks for the address-math libraries. These back every number the site
 * shows a student, so they are worth keeping honest.
 *
 * Run with: npm test
 */

import { parseIPv4, formatIPv4, networkOf, broadcastOf, usableHosts, maskToPrefix, parseCidr, subnetsOf, magicNumber, specialRangeOf, prefixToMask } from '../src/lib/ipv4'
import { parseIPv6, formatIPv6, formatIPv6Full, networkOf6, lastAddressOf6, eui64FromMac, scopeOf6, solicitedNodeMulticast } from '../src/lib/ipv6'
import { planVlsm, rangeToCidrs, prefixForHosts } from '../src/lib/vlsm'
import { aggregate, commonSupernet } from '../src/lib/summarize'

let fails = 0
const eq = (label: string, actual: unknown, expected: unknown) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected)
  if (a !== e) { fails++; console.log(`FAIL ${label}: got ${a}, want ${e}`) }
}

const ip = (s: string) => { const r = parseIPv4(s); if (!r.ok) throw new Error(r.error); return r.value }

// --- IPv4
eq('parse/format roundtrip', formatIPv4(ip('255.255.255.255')), '255.255.255.255')
eq('high bit safe', formatIPv4(ip('192.168.10.37')), '192.168.10.37')
eq('network /26', formatIPv4(networkOf(ip('192.168.10.37'), 26)), '192.168.10.0')
eq('network /20 high', formatIPv4(networkOf(ip('10.55.83.17'), 20)), '10.55.80.0')
eq('broadcast /20', formatIPv4(broadcastOf(ip('10.55.83.17'), 20)), '10.55.95.255')
eq('broadcast /0', formatIPv4(broadcastOf(ip('1.2.3.4'), 0)), '255.255.255.255')
eq('network /0', formatIPv4(networkOf(ip('200.1.2.3'), 0)), '0.0.0.0')
eq('usable /24', usableHosts(24), 254)
eq('usable /31', usableHosts(31), 2)
eq('usable /32', usableHosts(32), 1)
eq('usable /0', usableHosts(0), 4294967294)
eq('mask->prefix', maskToPrefix(ip('255.255.255.192')), { ok: true, value: 26 })
eq('bad mask rejected', maskToPrefix(ip('255.255.0.255')).ok, false)
eq('mask /0', formatIPv4(prefixToMask(0)), '0.0.0.0')
eq('parse cidr', parseCidr('10.0.0.0/8').ok, true)
eq('reject /33', parseCidr('10.0.0.0/33').ok, false)
eq('reject 256', parseIPv4('10.0.0.256').ok, false)
eq('reject 3 octets', parseIPv4('10.0.1').ok, false)
eq('subnets of /24 into /26', subnetsOf({ address: ip('192.168.10.0'), prefix: 24 }, 26).subnets.map((s) => formatIPv4(s.address)),
   ['192.168.10.0', '192.168.10.64', '192.168.10.128', '192.168.10.192'])
eq('subnet count /8 -> /16', subnetsOf({ address: ip('10.0.0.0'), prefix: 8 }, 16, 4).total, 256)
eq('magic /27', magicNumber(27), { increment: 32, octetIndex: 3 })
eq('magic /20', magicNumber(20), { increment: 16, octetIndex: 2 })
eq('magic /8', magicNumber(8), { increment: 1, octetIndex: 0 })
eq('special 169.254', specialRangeOf(ip('169.254.10.1'))?.label, 'Link-local (APIPA)')
eq('special 8.8.8.8', specialRangeOf(ip('8.8.8.8')), null)
eq('special 172.20', specialRangeOf(ip('172.20.1.1'))?.label, 'Private use')
eq('special 172.32 not private', specialRangeOf(ip('172.32.1.1')), null)

// --- IPv6
const v6 = (s: string) => { const r = parseIPv6(s); if (!r.ok) throw new Error(`${s}: ${r.error}`); return r.value }
eq('v6 compress', formatIPv6(v6('2001:0db8:0000:0000:0000:0000:0000:0001')), '2001:db8::1')
eq('v6 longest run', formatIPv6(v6('2001:db8:0:12:0:0:0:34')), '2001:db8:0:12::34')
eq('v6 loopback', formatIPv6(v6('::1')), '::1')
eq('v6 unspecified', formatIPv6(v6('::')), '::')
eq('v6 all ones', formatIPv6Full(v6('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')), 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')
eq('v6 embedded v4', formatIPv6(v6('::ffff:192.0.2.1')), '::ffff:c000:201')
eq('v6 zone stripped', formatIPv6(v6('fe80::1%eth0')), 'fe80::1')
eq('v6 double :: rejected', parseIPv6('2001::1::2').ok, false)
eq('v6 too many groups', parseIPv6('1:2:3:4:5:6:7:8:9').ok, false)
eq('v6 bad group', parseIPv6('2001:zzzz::1').ok, false)
eq('v6 network /64', formatIPv6(networkOf6(v6('2001:db8:acad:12:dead:beef:1:2'), 64)), '2001:db8:acad:12::')
eq('v6 last /64', formatIPv6(lastAddressOf6(v6('2001:db8:acad:12::'), 64)), '2001:db8:acad:12:ffff:ffff:ffff:ffff')
eq('v6 network /0', formatIPv6(networkOf6(v6('2001:db8::1'), 0)), '::')
eq('v6 scope ULA', scopeOf6(v6('fd00::1'))?.name, 'Unique local (ULA)')
eq('v6 scope link-local', scopeOf6(v6('fe80::1'))?.name, 'Link-local')
eq('v6 scope loopback', scopeOf6(v6('::1'))?.name, 'Loopback')
eq('v6 scope GUA', scopeOf6(v6('2606:4700::1111'))?.name, 'Global unicast')
const eui = eui64FromMac('00:1a:2b:3c:4d:5e')
eq('eui64 id', eui.ok ? eui.value.interfaceId.toString(16) : 'err', '21a2bfffe3c4d5e')
eq('eui64 step', eui.ok ? eui.value.steps[3] : 'err', 'Interface ID = 021a:2bff:fe3c:4d5e')
eq('v6 embedded v4 full', formatIPv6Full(v6('2001:db8::192.0.2.1')), '2001:0db8:0000:0000:0000:0000:c000:0201')
eq('v6 embedded v4 uncompressed', formatIPv6(v6('0:0:0:0:0:ffff:203.0.113.9')), '::ffff:cb00:7109')
eq('solicited node', formatIPv6(solicitedNodeMulticast(v6('2001:db8::1a2b:3c4d'))), 'ff02::1:ff2b:3c4d')

// --- VLSM
eq('prefixForHosts 500', prefixForHosts(500), 23)
eq('prefixForHosts 254', prefixForHosts(254), 24)
eq('prefixForHosts 255', prefixForHosts(255), 23)
eq('prefixForHosts 2', prefixForHosts(2), 31)
eq('prefixForHosts 1', prefixForHosts(1), 32)
const plan = planVlsm({ address: ip('10.20.0.0'), prefix: 22 }, [
  { id: 'a', name: 'Users 1', hosts: 500 }, { id: 'b', name: 'Users 2', hosts: 220 },
  { id: 'c', name: 'Wireless', hosts: 120 }, { id: 'd', name: 'Voice', hosts: 60 },
  { id: 'e', name: 'Servers', hosts: 25 }, { id: 'f', name: 'Mgmt', hosts: 12 },
  { id: 'g', name: 'WAN A', hosts: 2 }, { id: 'h', name: 'WAN B', hosts: 2 },
])
eq('vlsm placements', plan.allocations.map((a) => `${formatIPv4(a.cidr.address)}/${a.prefix}`),
   ['10.20.0.0/23','10.20.2.0/24','10.20.3.0/25','10.20.3.128/26','10.20.3.192/27','10.20.3.224/28','10.20.3.240/31','10.20.3.242/31'])
eq('vlsm no errors', plan.errors, [])
eq('vlsm free', plan.free.map((f) => `${formatIPv4(f.address)}/${f.prefix}`), ['10.20.3.244/30','10.20.3.248/29'])
eq('vlsm overflow errors', planVlsm({ address: ip('10.0.0.0'), prefix: 29 }, [{ id: 'x', name: 'Big', hosts: 300 }]).errors.length, 1)
eq('rangeToCidrs exact', rangeToCidrs(ip('10.0.0.0'), ip('10.0.0.255')).map((c) => `${formatIPv4(c.address)}/${c.prefix}`), ['10.0.0.0/24'])
eq('rangeToCidrs ragged', rangeToCidrs(ip('10.0.0.4'), ip('10.0.0.10')).map((c) => `${formatIPv4(c.address)}/${c.prefix}`), ['10.0.0.4/30','10.0.0.8/31','10.0.0.10/32'])
eq('rangeToCidrs whole space', rangeToCidrs(0, 4294967295).map((c) => `${formatIPv4(c.address)}/${c.prefix}`), ['0.0.0.0/0'])

// --- summarization
const cidr = (s: string) => { const r = parseCidr(s); if (!r.ok) throw new Error(s); return r.value }
eq('aggregate four', aggregate(['10.1.0.0/24','10.1.1.0/24','10.1.2.0/24','10.1.3.0/24'].map(cidr)).map((c) => `${formatIPv4(c.address)}/${c.prefix}`), ['10.1.0.0/22'])
eq('aggregate gap', aggregate(['10.1.0.0/24','10.1.1.0/24','10.1.2.0/24','10.1.3.0/24','10.1.8.0/24'].map(cidr)).map((c) => `${formatIPv4(c.address)}/${c.prefix}`), ['10.1.0.0/22','10.1.8.0/24'])
eq('aggregate contained', aggregate(['10.0.0.0/8','10.1.2.0/24'].map(cidr)).map((c) => `${formatIPv4(c.address)}/${c.prefix}`), ['10.0.0.0/8'])
eq('aggregate unsorted', aggregate(['10.1.3.0/24','10.1.0.0/24','10.1.2.0/24','10.1.1.0/24'].map(cidr)).map((c) => `${formatIPv4(c.address)}/${c.prefix}`), ['10.1.0.0/22'])
const sn = commonSupernet(['10.1.0.0/24','10.1.8.0/24'].map(cidr))!
eq('supernet prefix', `${formatIPv4(sn.cidr.address)}/${sn.cidr.prefix}`, '10.1.0.0/20')
eq('supernet extra', sn.extraAddresses, 4096 - 512)
const sn2 = commonSupernet(['10.1.0.0/24','10.1.1.0/24'].map(cidr))!
eq('supernet exact extra', sn2.extraAddresses, 0)
const sn3 = commonSupernet(['0.0.0.0/1','128.0.0.0/1'].map(cidr))!
eq('supernet whole space', `${formatIPv4(sn3.cidr.address)}/${sn3.cidr.prefix}`, '0.0.0.0/0')

if (fails === 0) {
  console.log('All library checks passed.')
} else {
  console.log(`${fails} failing check(s).`)
  process.exitCode = 1
}
