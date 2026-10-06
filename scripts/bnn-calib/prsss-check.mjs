// scripts/bnn-calib/prsss-check.mjs — BNN Phase 3 PASS/FAIL check.
// Runs the five-level chains on the reference chart and compares with the
// guide's expected rows (भाग 5). Levels 1–4 must match; level 5 may differ
// from the minute-rounded reference degrees. B11 is reported separately.
// Run: node scripts/bnn-calib/prsss-check.mjs
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'
import { computeBrsss, computePrsss } from '../../src/bnn/prsss.js'

const PRSSS_EXPECTED = {
  jupiter: ['sun', 'venus', 'venus', 'ketu', 'jupiter'],
  sun: ['saturn', 'sun', 'venus', 'sun', 'mars'],
  moon: ['jupiter', 'saturn', 'mars', 'mercury', 'mercury'],
  mars: ['sun', 'venus', 'jupiter', 'moon', 'venus'],
  mercury: ['saturn', 'sun', null, 'jupiter', 'saturn'], // 3rd hidden in the guide
  venus: ['saturn', 'rahu', 'mercury', 'saturn', 'sun'],
  saturn: ['mercury', 'sun', 'saturn', 'saturn', 'moon'],
  rahu: ['sun', 'ketu', 'rahu', 'venus', 'ketu'],
  ketu: ['saturn', 'rahu', 'rahu', 'jupiter', 'moon'],
}
// बी 01…12 (B11 deliberately absent — the guide expects it not to match).
const BRSSS_EXPECTED = {
  1: ['sun', 'ketu', 'mercury', 'jupiter', 'mercury'],
  2: ['mercury', 'moon', 'moon', 'venus', 'sun'],
  3: ['venus', 'rahu', 'saturn', 'venus', 'mercury'],
  4: ['mars', 'saturn', 'mars', 'moon', 'mercury'],
  5: ['jupiter', 'venus', 'venus', 'venus', 'saturn'],
  6: ['saturn', 'moon', 'rahu', 'moon', 'rahu'],
  7: ['saturn', 'rahu', 'mercury', 'ketu', 'rahu'],
  8: ['jupiter', 'saturn', 'sun', 'venus', 'sun'],
  9: ['mars', 'ketu', 'mercury', 'mercury', 'venus'],
  10: ['venus', 'moon', 'rahu', 'mercury', 'venus'],
  12: ['moon', 'saturn', 'rahu', 'saturn', 'moon'],
}

const swe = new SwissEph()
await swe.initSwissEph()
const k = computeBhavaChalit(
  swe,
  { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 },
  { latitude: 21.4833, longitude: 78.25 }
)

console.log('== PRSSS (planet अपनी longitude से) ==')
let pass14 = 0
let diff5 = 0
for (const p of k.planets) {
  const chain = computePrsss(p.longitude)
  const exp = PRSSS_EXPECTED[p.key]
  const l14 = exp.slice(0, 4).every((e, i) => e === null || e === chain[i])
  const l5 = exp[4] === chain[4]
  if (l14) pass14 += 1
  if (!l5) diff5 += 1
  console.log(
    `${p.key.padEnd(8)} ${chain.join(', ').padEnd(34)} L1-4 ${l14 ? 'PASS' : 'FAIL'} | L5 ${l5 ? 'PASS' : 'DIFF'}`
  )
}
console.log(`PRSSS: L1-4 ${pass14}/${k.planets.length} PASS · L5 differences: ${diff5}`)

console.log('\n== BRSSS (भाव-संधि longitude से) ==')
let pass14b = 0
let diff5b = 0
for (let n = 1; n <= 12; n++) {
  const chain = computeBrsss(k.cusps[n - 1].longitude)
  if (n === 11) {
    console.log(`B11      ${chain.join(', ').padEnd(34)} → report only (reference में गायब)`)
    continue
  }
  const exp = BRSSS_EXPECTED[n]
  const l14 = exp.slice(0, 4).every((e, i) => e === chain[i])
  const l5 = exp[4] === chain[4]
  if (l14) pass14b += 1
  if (!l5) diff5b += 1
  console.log(
    `B${String(n).padStart(2, '0')}     ${chain.join(', ').padEnd(34)} L1-4 ${l14 ? 'PASS' : 'FAIL'} | L5 ${l5 ? 'PASS' : 'DIFF'}`
  )
}
console.log(`BRSSS: L1-4 ${pass14b}/11 PASS · L5 differences: ${diff5b}`)
process.exit(0)
