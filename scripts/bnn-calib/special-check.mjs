// special-check.mjs — BNN Phase 5 PASS/FAIL: SPECIAL (R13) + label suffix (R11b) + colours (R17).
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'
import { labelSuffix, seatPositions } from '../../src/bnn/combos.js'
import { entryColour, specialTables } from '../../src/bnn/special.js'

const CODE = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' }
const swe = new SwissEph()
await swe.initSwissEph()
const k = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
const sp = specialTables(k.planets, k.cusps, 'AP')

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) { pass++; console.log(`  ✅ ${name}: ${g}`) } else { fail++; console.log(`  ❌ ${name}: got ${g} want ${w}`) }
}

console.log('== Directors (AP) ==')
const DIR = { 1: 'jupiter', 2: 'mercury', 3: 'venus', 4: 'mars', 5: 'jupiter', 6: 'ketu', 7: 'venus', 8: 'moon', 9: 'mars', 10: 'venus', 11: 'mercury', 12: 'moon' }
eq('directors', Object.values(sp.directors), Object.values(DIR))
console.log('== Planet rows (AP) ==')
const R = sp.rows
eq('JUP', [R.jupiter.owns, R.jupiter.sitsAt, R.jupiter.gives, R.jupiter.starLord, R.jupiter.starAt, R.jupiter.starGives], [[5, 8], 1, [1, 5], 'venus', 7, [3, 7, 10]])
eq('SUN', [R.sun.owns, R.sun.sitsAt, R.sun.gives, R.sun.starLord, R.sun.starAt, R.sun.starGives], [[1], 5, [], 'sun', 5, []])
eq('MOO', [R.moon.owns, R.moon.sitsAt, R.moon.gives, R.moon.starLord, R.moon.starAt, R.moon.starGives], [[12], 8, [8, 12], 'saturn', 5, []])
eq('MAR', [R.mars.owns, R.mars.sitsAt, R.mars.gives, R.mars.starLord, R.mars.starAt, R.mars.starGives], [[4, 9], 1, [4, 9], 'venus', 7, [3, 7, 10]])
eq('MER', [R.mercury.owns, R.mercury.sitsAt, R.mercury.gives, R.mercury.starLord, R.mercury.starAt, R.mercury.starGives], [[2, 11], 1, [2, 11], 'sun', 5, []])
eq('VEN', [R.venus.owns, R.venus.sitsAt, R.venus.gives, R.venus.starLord, R.venus.starAt, R.venus.starGives], [[3, 10], 7, [3, 7, 10], 'rahu', 12, []])
eq('SAT', [R.saturn.owns, R.saturn.sitsAt, R.saturn.gives, R.saturn.starLord, R.saturn.starAt, R.saturn.starGives], [[6, 7], 5, [], 'sun', 5, []])
eq('RAH', [R.rahu.owns, R.rahu.sitsAt, R.rahu.gives, R.rahu.starLord, R.rahu.starAt, R.rahu.starGives], [[], 12, [], 'ketu', 6, [6]])
eq('KET', [R.ketu.owns, R.ketu.sitsAt, R.ketu.gives, R.ketu.starLord, R.ketu.starAt, R.ketu.starGives], [[], 6, [6], 'rahu', 12, []])
console.log('== IN STAR OF A ==')
const STAR = { 3: ['mars', 'jupiter'], 5: ['sun', 'moon', 'mercury', 'saturn'], 6: ['rahu'], 7: ['mars', 'jupiter'], 10: ['mars', 'jupiter'], 12: ['venus', 'ketu'] }
for (let b = 1; b <= 12; b++) eq(`B${String(b).padStart(2, '0')}`, sp.inStarOf[b], STAR[b] || [])
console.log('== bhava LORD + PLANETS(A) (guru software layout, AP) ==')
const LORDS = { 1: 'sun', 2: 'mercury', 3: 'venus', 4: 'mars', 5: 'jupiter', 6: 'saturn', 7: 'saturn', 8: 'jupiter', 9: 'mars', 10: 'venus', 11: 'mercury', 12: 'moon' }
for (let b = 1; b <= 12; b++) eq(`LORD B${String(b).padStart(2, '0')}`, sp.lords[b], LORDS[b])
const INB = { 1: ['jupiter', 'mars', 'mercury'], 5: ['sun', 'saturn'], 6: ['ketu'], 7: ['venus'], 8: ['moon'], 12: ['rahu'] }
for (let b = 1; b <= 12; b++) eq(`PLANETS(A) B${String(b).padStart(2, '0')}`, sp.inBhava[b].map((e) => e.key), INB[b] || [])
console.log('== label suffixes (seat-based, both modes) ==')
const SUF = {
  AP: { sun: 18, moon: 95, mars: 69, mercury: 27, jupiter: 91, venus: 95, saturn: 15, rahu: 20, ketu: 20 },
  BP: { sun: 18, moon: 95, mars: 69, mercury: 15, jupiter: 91, venus: 95, saturn: 27, rahu: 20, ketu: 20 },
}
for (const mode of ['AP', 'BP']) {
  const seats = seatPositions(k.planets, mode)
  for (const p of k.planets) {
    const ls = labelSuffix(seats[p.key].lon, k.cusps)
    if (ls.value === SUF[mode][p.key]) { pass++; console.log(`  \u2705 ${mode} ${p.key}-${ls.value}`) }
    else { fail++; console.log(`  \u274c ${mode} ${p.key}: got ${ls.value} (bhava ${ls.bhava}) want ${SUF[mode][p.key]}`) }
  }
}
console.log('== colours (spot) ==')
eq('SAT rule', entryColour(11, false, 'saturn'), 'green')
eq('first', entryColour(94, true, 'venus'), 'blue')
eq('orange', entryColour(13, false, 'sun'), 'orange')
eq('green', entryColour(23, false, 'mercury'), 'green')
eq('aspect 17', entryColour(17, false, null), 'orange')
console.log(`\nTOTAL: ${pass} PASS / ${fail} FAIL`)
process.exit(fail ? 1 : 0)
