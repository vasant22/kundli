// scripts/bnn-calib/ayanamsa-fit.mjs — BNN Phase 2, step 2.
// The planets already match within ~1' (Lahiri family) but the reference
// cusps are 20–35' away from plain Placidus. This search finds WHICH house
// system + small time offset + latitude reproduces the reference cusp SHAPE,
// and what ayanamsa the cusps themselves imply.
//
// Method: sidereal values differ from tropical by the ayanamsa (a constant
// shift for every cusp), so the ayanamsa cannot change the SPREAD of the
// deltas. For every candidate we compute d_i = tropical_i − reference_i
// (arcminutes), take the mean, and score the residual max|d_i − mean|.
// After a good shape is found, mean(d) = the ayanamsa that zeroes the deltas.
// Run: node scripts/bnn-calib/ayanamsa-fit.mjs
import SwissEph from 'swisseph-wasm'

const LAT_BASE = 21.9019 // (unused except as fallback label)
const LON = 77.9032
const sign = (r, d, m = 0) => r * 30 + d + m / 60
const REF = [
  sign(4, 12, 53), sign(5, 10, 54), sign(6, 11, 31), sign(7, 12, 52),
  sign(8, 13, 36), sign(9, 13, 38), sign(10, 12, 53), sign(11, 10, 54),
  sign(0, 11, 31), sign(1, 12, 52), sign(2, 13, 36), sign(3, 13, 38),
]

const wrap = (d) => ((d + 540) % 360) - 180
const fmtArc = (m) => `${m >= 0 ? '+' : '−'}${Math.floor(Math.abs(m))}'${String(Math.round((Math.abs(m) % 1) * 60)).padStart(2, '0')}''`
const degMinAbs = (x) => {
  const deg = ((x % 360) + 360) % 360
  const d = Math.floor(deg)
  const m = (deg - d) * 60
  return `${d}°${m.toFixed(2).padStart(5, '0')}'`
}

const swe = new SwissEph()
await swe.initSwissEph()
const jdBase = swe.julday(1980, 1, 22, 15.0)

const SYSTEMS = ['P', 'K', 'O', 'R', 'C', 'B', 'T', 'M', 'E', 'W']
const LATS = [21.80, 21.9019, 22.00]
const DTS = []
for (let dt = -300; dt <= 300; dt += 15) DTS.push(dt)

const rows = []
for (const sys of SYSTEMS) {
  for (const lat of LATS) {
    for (const dt of DTS) {
      try {
        const jd = jdBase + dt / 86400
        const h = swe.houses_ex(jd, swe.SEFLG_SWIEPH, lat, LON, sys)
        const cusps = Array.from({ length: 12 }, (_, i) => h.cusps[i + 1])
        const d = cusps.map((c, i) => wrap(c - REF[i]) * 60) // arcminutes
        const mean = d.reduce((a, b) => a + b, 0) / 12
        const spread = Math.max(...d.map((x) => Math.abs(x - mean)))
        rows.push({ sys, lat, dt, mean, spread })
      } catch (err) {
        /* house code not supported — skip */
      }
    }
  }
}

rows.sort((a, b) => a.spread - b.spread)
console.log('Top shapes (house-system, lat, dt-seconds | shape spread | ayanamsa that zeroes deltas):')
for (const r of rows.slice(0, 15)) {
  console.log(
    `${r.sys} lat=${r.lat} dt=${String(r.dt).padStart(4)}s | spread=${r.spread.toFixed(2)}' | ayanNeeded=${degMinAbs(r.mean / 60)}`
  )
}

// Detail on the winner.
const best = rows[0]
console.log(`\n=== Winner: system=${best.sys} lat=${best.lat} dt=${best.dt}s ===`)
const jd = jdBase + best.dt / 86400
const h = swe.houses_ex(jd, swe.SEFLG_SWIEPH, best.lat, LON, best.sys)
const cusps = Array.from({ length: 12 }, (_, i) => h.cusps[i + 1])
const d = cusps.map((c, i) => wrap(c - REF[i]) * 60)

console.log('cusp | d = tropical−ref (arcmin) | resid-vs-mean')
for (let i = 0; i < 12; i++) {
  console.log(`${String(i + 1).padStart(2)} | ${fmtArc(d[i]).padStart(10)} | ${fmtArc(d[i] - best.mean).padStart(10)}`)
}

const ayanCand = {}
for (const mode of [1, 5, 43, 44, 45, 46]) {
  try {
    swe.set_sid_mode(mode, 0, 0)
    ayanCand[mode] = swe.get_ayanamsa(jd)
  } catch { /* skip */ }
}
console.log('\ncandidate ayanamsas:', Object.entries(ayanCand).map(([m, v]) => `${m}=${degMinAbs(v)}`).join('  '))
for (const [m, a] of Object.entries(ayanCand)) {
  const deltas = d.map((x) => x - a * 60)
  const maxAbs = Math.max(...deltas.map(Math.abs))
  const meanAbs = deltas.reduce((s, x) => s + Math.abs(x), 0) / 12
  console.log(`candidate ${m}: max|Δ|=${maxAbs.toFixed(2)}' mean|Δ|=${meanAbs.toFixed(2)}'`)
}
process.exit(0)
