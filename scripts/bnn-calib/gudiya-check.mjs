// gudiya-check.mjs — BNN aspect-percentage check on the Gudiya chart
// (user, 2026-10-08): "B01 का MAR4 और B05 का MAR8 guru-reference से मेल नहीं
// खा रहा (3% vs 0%, 4% vs 28%)".
//
// What it tests — ONE spot of combos.js: the aspect entries of the bhava rows
// (bhavaCombinations()). The guru's software counts an aspect point's
// closeness with a FIXED 30° span — p = 100×(1 − d/30), d = degrees from the
// landing bhava's start cusp — and does not list the aspect at all when the
// point sits ≥ 30° past that cusp. The old code wrongly used the planet form
// 100×(1 − d/(0.942×W)) on it. Evidence used by this check:
//   • old reference chart: MAR4-71 · MAR8-65 · SAT3-13 · SAT10-6 (guru values;
//     the last two were the "do not fit yet" open items — now they must fit)
//   • Gudiya: B01 must show NO MAR4 (guru: RAH-99 VEN-81 SAT-43 only);
//     B05 MAR8 ≈ 28; B03 SAT3 ≈ 72; B10 SAT10 ≈ 82.
// Run: node scripts/bnn-calib/gudiya-check.mjs   (fails on the pre-fix code —
// that is the point: it localises the bug; passes after the combos.js fix).
//
// NOTE on inputs: the user-side screenshot of OUR software matches our app run
// at ~10:45:00 (mera screenshot: RAH-98 VEN-80 SAT-41 … MAR8-4). The birth
// time to use per the user is 10:45:50 — the check uses that (UT 05:15:50).
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'
import { bhavaCombinations } from '../../src/bnn/combos.js'
import { planetToBhavaPercent } from '../../src/bnn/percent.js'

const norm = (x) => ((x % 360) + 360) % 360
let pass = 0
let fail = 0
const eq = (name, got, want, tol = 0) => {
  const ok = typeof want === 'number' && Math.abs(got - want) <= tol
    ? true
    : JSON.stringify(got) === JSON.stringify(want)
  const g = typeof got === 'number' ? got : JSON.stringify(got)
  if (ok) {
    pass++
    console.log(`  ✅ ${name}: ${g}${tol ? ` (±${tol} बाँटें)` : ''}`)
  } else {
    fail++
    console.log(`  ❌ ${name}: got ${g} want ${typeof want === 'number' ? `${want}${tol ? `±${tol}` : ''}` : JSON.stringify(want)}`)
  }
}

const swe = new SwissEph()
await swe.initSwissEph()

// ---------------------------------------------------------------------------
// GUDIYA — 08-11-1991, 10:45:50 IST (UT 05:15:50), Raisen MP (Open-Meteo coords)
// ---------------------------------------------------------------------------
const g = computeBhavaChalit(swe, { year: 1991, month: 11, day: 8, hour: 5, minute: 15, second: 50 }, { latitude: 23.33033, longitude: 77.7811 })
const gCusps = g.cusps.map((c) => c.longitude)
const spanOf = (n) => norm(gCusps[n % 12] - gCusps[n - 1]) || 360

const findAspect = (bc, n, label) => bc[n].list1579.find((e) => e.type === 'aspect' && e.label === label)

console.log('== GUDIYA — bhava rows × aspect cells (both modes) ==')
for (const mode of ['AP', 'BP']) {
  const bc = bhavaCombinations(g.planets, g.cusps, mode)
  const mar4 = findAspect(bc, 1, 'MAR4')
  if (!mar4) { pass++; console.log(`  ✅ ${mode} B01: MAR4 absent (guru: 0%)`) } else {
    fail++; console.log(`  ❌ ${mode} B01: MAR4-${Math.round(mar4.percent)} present (guru: absent)`)
  }
  const mar8 = findAspect(bc, 5, 'MAR8')
  if (mar8 && Math.abs(mar8.percent - 28) <= 1) { pass++; console.log(`  ✅ ${mode} B05: MAR8-${Math.round(mar8.percent)} (guru 28)`) } else {
    fail++; console.log(`  ❌ ${mode} B05: ${mar8 ? `MAR8-${Math.round(mar8.percent)}` : 'MAR8 missing'} (guru 28)`)
  }
  const sat3 = findAspect(bc, 3, 'SAT3')
  if (sat3 && Math.abs(sat3.percent - 72) <= 1) { pass++; console.log(`  ✅ ${mode} B03: SAT3-${Math.round(sat3.percent)} (guru 72)`) } else {
    fail++; console.log(`  ❌ ${mode} B03: ${sat3 ? `SAT3-${Math.round(sat3.percent)}` : 'SAT3 missing'} (guru 72)`)
  }
  const sat10 = findAspect(bc, 10, 'SAT10')
  if (sat10 && Math.abs(sat10.percent - 82) <= 1) { pass++; console.log(`  ✅ ${mode} B10: SAT10-${Math.round(sat10.percent)} (guru 82)`) } else {
    fail++; console.log(`  ❌ ${mode} B10: ${sat10 ? `SAT10-${Math.round(sat10.percent)}` : 'SAT10 missing'} (guru 82)`)
  }
}

// raw data for the two cells the user flagged (self-documenting diagnosis)
console.log('\n-- raw d / width vs both formulas (diagnosis trail) --')
{
  const bc = bhavaCombinations(g.planets, g.cusps, 'AP')
  const rows = [
    ['B01', 1, 'MAR4'], ['B05', 5, 'MAR8'], ['B03', 3, 'SAT3'], ['B10', 10, 'SAT10'],
  ]
  for (const [lab, n, label] of rows) {
    const e = findAspect(bc, n, label)
    // find the aspect even if dropped (recompute the point straight from mars/saturn)
    const caster = label.startsWith('MAR') ? 'mars' : 'saturn'
    const lon = g.planets.find((p) => p.key === caster).longitude
    const off = label === 'MAR4' ? 90 : label === 'MAR8' ? 210 : label === 'SAT3' ? 60 : 270
    const point = norm(lon + off)
    const d = norm(point - gCusps[n - 1])
    const w = spanOf(n)
    const oldF = Math.round(planetToBhavaPercent(d, w))
    const fixed = d >= 30 ? '— (d ≥ 30 → not listed)' : Math.round(100 * (1 - d / 30))
    console.log(`  ${lab} ${label}: point ${point.toFixed(2)} → d=${d.toFixed(3)} W=${w.toFixed(2)} | old-formula ${oldF} | fixed ${fixed} | shown ${e ? Math.round(e.percent) : 'nothing'}`)
  }
}

// ---------------------------------------------------------------------------
// OLD reference chart (1980-01-22) — the guide's four aspect values
// ---------------------------------------------------------------------------
console.log('\n== OLD chart — guide values (should ALL be exact after fix) ==')
{
  const k = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
  const bc = bhavaCombinations(k.planets, k.cusps, 'AP')
  const a = (n, label) => findAspect(bc, n, label)
  eq('B04 MAR4', Math.round(a(4, 'MAR4').percent), 71)
  eq('B08 MAR8', Math.round(a(8, 'MAR8').percent), 65)
  eq('B07 SAT3', Math.round(a(7, 'SAT3').percent), 13)
  eq('B02 SAT10', Math.round(a(2, 'SAT10').percent), 6)
}

console.log(`\nTOTAL: ${pass} PASS / ${fail} FAIL`)
process.exit(fail ? 1 : 0)
