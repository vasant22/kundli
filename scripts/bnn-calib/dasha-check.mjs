// dasha-check.mjs — BNN Phase 6 PASS/FAIL: Vimshottari Dhasa / Bhukthi /
// Andhiram vs the guide's reference dates (भाग 5, user 2026-10-07).
// Run: node scripts/bnn-calib/dasha-check.mjs
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'
import { computeDashaTree, fmtDMY } from '../../src/bnn/dasha.js'

const swe = new SwissEph()
await swe.initSwissEph()
const k = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
const tree = computeDashaTree(swe, k.jd, { year: 1980, month: 1, day: 22 }, { now: { y: 2026, m: 10, d: 7 } })

let pass = 0
let fail = 0
const cmp = (name, gotISO, wantISO) => {
  const ok = gotISO === wantISO
  if (ok) pass++
  else fail++
  console.log(`  ${ok ? '✅' : '❌'} ${name}: ${fmtDMY(gotISO)}${ok ? '' : `  (want ${fmtDMY(wantISO)})`}`)
}

console.log('===== DHASA (9 end dates) =====')
console.log(`  moon(ΔT) = ${tree.moonLon.toFixed(5)} · balance ${tree.lord} ${tree.balance.y}Y-${tree.balance.m}M-${tree.balance.d}D`)
const DHASA_WANT = [
  ['saturn', '1985-12-23'], ['mercury', '2002-12-23'], ['ketu', '2009-12-23'],
  ['venus', '2029-12-23'], ['sun', '2035-12-23'], ['moon', '2045-12-23'],
  ['mars', '2052-12-23'], ['rahu', '2070-12-23'], ['jupiter', '2086-12-23'],
]
tree.mahadashas.forEach((r, i) => cmp(r.lord, r.endISO, DHASA_WANT[i][1]))

console.log('===== BHUKTHI (running VEN dhasa) =====')
const BH_WANT = ['2013-04-26', '2014-04-27', '2015-12-28', '2017-02-27', '2020-03-01', '2022-11-02', '2026-01-04', '2028-11-06', '2029-12-23']
tree.running.bhukthis.forEach((r, i) => cmp(r.lord, r.endISO, BH_WANT[i]))

console.log('===== ANDHIRAM (running VEN-MER bhukthi) =====')
// Guide-readable rows: MER 30-05-2026 · KET 29-07-2026 · VEN 17-01-2027 ·
// SUN 09-03-2027 · MOO 03-06-2027 · MAR 02-08-2027 · JUP 21-05-2028 ·
// SAT 06-11-2028 (last = bhukthi end). RAH's row was cut in the screenshot.
const AN_WANT = ['2026-05-30', '2026-07-29', '2027-01-17', '2027-03-09', '2027-06-03', '2027-08-02', '2028-01-04', '2028-05-21', '2028-11-06']
tree.running.andhirams.forEach((r, i) => cmp(r.lord, r.endISO, AN_WANT[i]))

console.log(`\nTOTAL: ${pass} PASS / ${fail} FAIL`)
process.exit(0)
