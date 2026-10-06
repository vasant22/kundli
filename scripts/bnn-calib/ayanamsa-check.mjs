// scripts/bnn-calib/ayanamsa-check.mjs — BNN Phase 2 calibration.
// Question: which Swiss Ephemeris sidereal mode (Krishnamurti / KP family)
// reproduces the reference chart within 1 arc-minute?
//   Reference: 22-01-1980, 20:30 IST, Betul (M.P.) — docs/bnn-guide.txt भाग 5.
//   Candidates: whatever the wasm build accepts — LAHIRI(1) + KRISHNAMURTI(5)
//   are documented; newer sweph modes (43 LAHIRI_1940, 44 LAHIRI_VP285,
//   45 KRISHNAMURTI_VP291, 46 LAHIRI_ICRC) are tried numerically.
// Run: node scripts/bnn-calib/ayanamsa-check.mjs
import SwissEph from 'swisseph-wasm'

const LAT = 21.9019 // Betul (M.P.)
const LON = 77.9032

// Reference values from the guide, "degrees within sign" → absolute longitude.
const sign = (r, d, m = 0) => r * 30 + d + m / 60
const REF = {
  asc: sign(4, 12, 53),
  cusps: [
    sign(4, 12, 53), sign(5, 10, 54), sign(6, 11, 31), sign(7, 12, 52),
    sign(8, 13, 36), sign(9, 13, 38), sign(10, 12, 53), sign(11, 10, 54),
    sign(0, 11, 31), sign(1, 12, 52), sign(2, 13, 36), sign(3, 13, 38),
  ],
  planets: [
    ['sun', sign(9, 8, 9)], ['moon', sign(11, 12, 30)], ['mars', sign(4, 21, 30)],
    ['mercury', sign(9, 8, 59)], ['jupiter', sign(4, 15, 30)], ['venus', sign(10, 14, 18)],
    ['saturn', sign(5, 3, 12)], ['rahu(mean)', sign(4, 7, 10)], ['ketu', sign(10, 7, 10)],
  ],
}

const CANDIDATES = [
  [1, 'LAHIRI (mode 1)'],
  [5, 'KRISHNAMURTI (mode 5)'],
  [43, 'mode 43 (LAHIRI_1940?)'],
  [44, 'mode 44 (LAHIRI_VP285?)'],
  [45, 'mode 45 (KRISHNAMURTI_VP291?)'],
  [46, 'mode 46 (LAHIRI_ICRC?)'],
]

// Signed difference a→b in arcminutes, wrapped to ±180°.
const dArcmin = (a, b) => ((((a - b + 540) % 360) - 180) * 60)
const degMin = (x) => {
  let deg = x
  while (deg < 0) deg += 360
  const d = Math.floor(deg % 30)
  const m = (deg % 30 - d) * 60
  return `${d}°${m.toFixed(2).padStart(5, '0')}'`
}
const rashiName = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis']

const swe = new SwissEph()
await swe.initSwissEph()
const jd = swe.julday(1980, 1, 22, 15.0) // 20:30 IST = 15:00 UT

const results = []
for (const [mode, label] of CANDIDATES) {
  try {
    swe.set_sid_mode(mode, 0, 0)
    const ayan = swe.get_ayanamsa(jd)
    const h = swe.houses_ex(jd, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL, LAT, LON, 'P')
    const asc = h.ascmc[0]
    const cusps = []
    for (let i = 1; i <= 12; i++) cusps.push(((h.cusps[i] % 360) + 360) % 360)

    const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL
    const PL = {
      sun: swe.SE_SUN, moon: swe.SE_MOON, mars: swe.SE_MARS, mercury: swe.SE_MERCURY,
      jupiter: swe.SE_JUPITER, venus: swe.SE_VENUS, saturn: swe.SE_SATURN,
      'rahu(mean)': swe.SE_MEAN_NODE,
    }
    const planets = {}
    for (const [key, ipl] of Object.entries(PL)) planets[key] = swe.calc_ut(jd, ipl, flags)[0]
    planets.ketu = planets['rahu(mean)'] + 180

    const ascD = dArcmin(asc, REF.asc)
    const cuspD = cusps.map((c, i) => dArcmin(c, REF.cusps[i]))
    const planD = REF.planets.map(([key, ref]) => [key, dArcmin(planets[key], ref)])
    const maxPlan = Math.max(...planD.map(([, d]) => Math.abs(d)))
    const maxCusp = Math.max(...cuspD.map(Math.abs))
    const ok = Math.abs(ascD) <= 1 && maxPlan <= 1 && maxCusp <= 1

    results.push({ mode, label, ayan, ascD, cuspD, planD, maxPlan, maxCusp, ok, asc, cusps, planets })
  } catch (err) {
    results.push({ mode, label, error: String(err && err.message || err) })
  }
}

console.log('Reference: 22-01-1980 20:30 IST, Betul (21.9019, 77.9032) — JD', jd)
console.log('')
for (const r of results) {
  if (r.error) {
    console.log(`❌ ${r.label}: not supported — ${r.error}`)
    continue
  }
  console.log(
    `${r.ok ? '✅' : '—'} ${r.label}: ayan=${degMin(r.ayan)} | ascΔ=${r.ascD.toFixed(2)}' | max planetΔ=${r.maxPlan.toFixed(2)}' | max cuspΔ=${r.maxCusp.toFixed(2)}'`
  )
}

// Detail for the best (smallest worst-case delta) candidate.
const valid = results.filter((r) => !r.error)
valid.sort((a, b) => Math.max(Math.abs(a.ascD), a.maxPlan, a.maxCusp) - Math.max(Math.abs(b.ascD), b.maxPlan, b.maxCusp))
const best = valid[0]
if (best) {
  console.log('\n=== Best candidate detail:', best.label, '===')
  console.log('Ayanamsa:', degMin(best.ayan))
  console.log(`Asc: ${rashiName[Math.floor(best.asc / 30) % 12]} ${degMin(best.asc)}  (Δ ${best.ascD.toFixed(2)}')`)
  for (const [key, ref] of REF.planets) {
    const v = best.planets[key]
    const d = ((((v - ref + 540) % 360) - 180) * 60).toFixed(2)
    console.log(`${key.padEnd(11)}: ${rashiName[Math.floor(v / 30) % 12]} ${degMin(v)}  (Δ ${d}')`)
  }
  console.log('Cusps:')
  best.cusps.forEach((c, i) => {
    console.log(`  ${String(i + 1).padStart(2)}: ${rashiName[Math.floor(c / 30) % 12]} ${degMin(c)}  (Δ ${best.cuspD[i].toFixed(2)}')`)
  })
}

process.exit(0)
