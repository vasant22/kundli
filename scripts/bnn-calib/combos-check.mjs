// combos-check.mjs — BNN Phase 4 PASS/FAIL: combination engine vs the
// guide's AP tables (भाग 5) and the old software's BP screenshots.
// Run: node scripts/bnn-calib/combos-check.mjs
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'
import { astronomyPartners, bhavaCombinations, planetCombinations } from '../../src/bnn/combos.js'

const CODE = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' }
const lab = (e) => {
  const name = e.type === 'planet' ? `${CODE[e.key]}${e.natalRetro && e.key !== 'rahu' && e.key !== 'ketu' ? '#' : ''}` : e.label
  return `${name}-${Math.round(e.percent)}`
}
const seq = (list) => list.map((e) => (e.type === 'planet' ? e.key : e.label.toLowerCase()))

const swe = new SwissEph()
await swe.initSwissEph()
const k = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
const planets = k.planets

// ---- expected (guide भाग 5, AP) ----
const AP_PLANETS = {
  jupiter: ['venus', 'rahu'], sun: ['saturn', 'ketu'], moon: ['mar8', 'rahu'],
  mars: ['jupiter', 'venus', 'rahu'], mercury: ['mars', 'jupiter', 'venus', 'rahu'],
  venus: ['jupiter', 'mars', 'mercury', 'sat3', 'moon'],
  saturn: ['ketu'], // + SUN in the software = the known open quirk (not implemented)
  rahu: ['moon'], ketu: ['saturn', 'sun'],
}
const AP_BHAVA = {
  1: ['venus', 'jupiter', 'mars', 'mercury', 'sun', 'saturn'],
  2: ['moon', 'ketu', 'sat10'], 3: ['venus'], 4: ['moon', 'mar4', 'rahu'],
  5: ['jupiter', 'mars', 'mercury', 'sun', 'saturn'], 6: ['ketu'],
  7: ['venus', 'jupiter', 'mars', 'mercury', 'sat3'], 8: ['moon', 'mar8', 'rahu'],
  9: ['jupiter', 'mars', 'mercury', 'sun', 'saturn'], 10: ['ketu'],
  11: ['venus', 'sun', 'saturn'], 12: ['moon', 'rahu'],
}
// ---- expected (old software screenshots, BP) ----
const BP_PLANETS = {
  jupiter: ['venus', 'rahu'], sun: ['mercury', 'ketu'], moon: ['mar8', 'rahu'],
  mars: ['jupiter', 'venus', 'rahu'], mercury: ['ketu'],
  venus: ['jupiter', 'mars', 'saturn', 'moon'],
  saturn: ['mars', 'jupiter', 'venus', 'rahu'], rahu: ['moon'], ketu: ['mercury', 'sun'],
}
const BP_BHAVA = {
  1: ['jupiter', 'mars', 'saturn', 'sun', 'mercury'], 2: ['ketu'], 3: ['venus', 'sat3'],
  4: ['moon', 'mar4', 'rahu'], 5: ['jupiter', 'mars', 'saturn', 'sun', 'mercury'], 6: ['ketu'],
  7: ['venus'], 8: ['moon', 'mar8', 'rahu'], 9: ['jupiter', 'mars', 'saturn', 'sun', 'mercury'],
  10: ['sat10', 'ketu'], 11: ['venus'], 12: ['moon', 'rahu'],
}
const BP_ASTRO = { jupiter: 'rahu', sun: 'mercury', moon: 'rahu', mars: 'jupiter', mercury: 'ketu', venus: 'moon', saturn: 'mars', rahu: 'moon', ketu: 'mercury' }

let pass = 0; let fail = 0
const check = (name, got, want) => {
  const ok = want.every((w, i) => w === null || w === got[i]) && got.length === want.filter((w) => w !== null).length + (want.includes(null) ? 0 : 0) || (want.filter((w) => w !== null).every((w) => got.includes(w)) && got.length <= want.length + 1)
  const strict = JSON.stringify(got) === JSON.stringify(want.filter((w) => w !== null))
  if (strict) { pass++; console.log(`  ✅ ${name}: ${got.join(', ')}`) }
  else { fail++; console.log(`  ❌ ${name}: got [${got.join(', ')}] want [${want.filter((w) => w !== null).join(', ')}]`) }
}

for (const mode of ['AP', 'BP']) {
  console.log(`===== ${mode} — PLANETS =====`)
  const pc = planetCombinations(planets, mode)
  for (const p of planets) {
    console.log(`  ${CODE[p.key].padEnd(4)} ${pc[p.key].map(lab).join(' | ')}`)
  }
  const wantP = mode === 'AP' ? AP_PLANETS : BP_PLANETS
  for (const p of planets) {
    const got = seq(pc[p.key])
    const want = wantP[p.key]
    const strictWant = want.filter((w) => w !== null)
    if (JSON.stringify(got) === JSON.stringify(strictWant)) { pass++; }
    else if (want.includes(null) && want.filter((w) => w !== null).every((w) => got.includes(w))) { pass++; console.log(`  ~ ${p.key}: [${got.join(', ')}] (vs loose [${strictWant.join(', ')}])`) }
    else { fail++; console.log(`  ❌ planet ${p.key}: got [${got.join(', ')}] want [${strictWant.join(', ')}]`) }
  }
  console.log(`===== ${mode} — BHAVA (list159) =====`)
  const bc = bhavaCombinations(planets, k.cusps, mode)
  for (let n = 1; n <= 12; n++) {
    console.log(`  B${String(n).padStart(2, '0')} ${bc[n].list159.map(lab).join(' | ')}${mode === 'AP' ? '   [1579] ' + bc[n].list1579.map(lab).join(' | ') : ''}`)
  }
  const wantB = mode === 'AP' ? null : BP_BHAVA
  if (wantB) for (let n = 1; n <= 12; n++) {
    const got = seq(bc[n].list159)
    const want = wantB[n]
    if (JSON.stringify(got) === JSON.stringify(want)) pass++
    else { fail++; console.log(`  ❌ bhava B${n}: got [${got.join(', ')}] want [${want.join(', ')}]`) }
  }
  if (mode === 'AP') for (let n = 1; n <= 12; n++) {
    const got = seq(bc[n].list1579)
    const want = AP_BHAVA[n]
    if (JSON.stringify(got) === JSON.stringify(want)) pass++
    else { fail++; console.log(`  ❌ AP bhava B${n}: got [${got.join(', ')}] want [${want.join(', ')}]`) }
  }
  console.log(`===== ${mode} — ASTRONOMY =====`)
  const ap = astronomyPartners(planets, mode)
  console.log('  ' + Object.entries(ap).map(([p, q]) => `${CODE[p]}→${CODE[q]}`).join('  '))
  if (mode === 'BP') {
    for (const [p, q] of Object.entries(BP_ASTRO)) {
      if (ap[p] === q) pass++
      else { fail++; console.log(`  ❌ astro ${p}: got ${ap[p]} want ${q}`) }
    }
  }
}
console.log(`\nTOTAL: ${pass} PASS / ${fail} FAIL`)
process.exit(0)
