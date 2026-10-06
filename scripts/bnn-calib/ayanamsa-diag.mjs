// scripts/bnn-calib/ayanamsa-diag.mjs — BNN Phase 2, step 3 diagnostics.
// Question: can a small time correction (+ small lat/lon) make the reference
// chart consistent — asc + all 12 cusps + planets within ~1 arc-minute?
// Prints: (A) deltas vs dt for Placidus & Topocentric; (B) best house system
// scan at the ayanamsa-consistent point; (C) width sensitivity to latitude.
// Run: node scripts/bnn-calib/ayanamsa-diag.mjs
import SwissEph from 'swisseph-wasm'

const LAT = 21.9019
const LON = 77.9032
const sign = (r, d, m = 0) => r * 30 + d + m / 60
const REF = [
  sign(4, 12, 53), sign(5, 10, 54), sign(6, 11, 31), sign(7, 12, 52),
  sign(8, 13, 36), sign(9, 13, 38), sign(10, 12, 53), sign(11, 10, 54),
  sign(0, 11, 31), sign(1, 12, 52), sign(2, 13, 36), sign(3, 13, 38),
]
const wrap = (d) => ((d + 540) % 360) - 180
const f1 = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x).toFixed(1)}`
const f2 = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x).toFixed(2)}`

const swe = new SwissEph()
await swe.initSwissEph()
const jd0 = swe.julday(1980, 1, 22, 15.0)

swe.set_sid_mode(44, 0, 0)
const ayan44 = swe.get_ayanamsa(jd0) * 60 // arcmin
swe.set_sid_mode(1, 0, 0)
const ayanLahiri = swe.get_ayanamsa(jd0) * 60
console.log(`ayan44=${ayan44.toFixed(2)}' ayanLahiri=${ayanLahiri.toFixed(2)}'`)

const cuspsAt = (sys, lat, lon, dt) => {
  const jd = jd0 + dt / 86400
  const h = swe.houses_ex(jd, swe.SEFLG_SWIEPH, lat, lon, sys)
  return Array.from({ length: 12 }, (_, i) => h.cusps[i + 1])
}

const stats = (sys, lat, lon, dt) => {
  const cs = cuspsAt(sys, lat, lon, dt)
  const d = cs.map((c, i) => wrap(c - REF[i]) * 60)
  const mean = d.reduce((a, b) => a + b, 0) / 12
  const spread = Math.max(...d.map((x) => Math.abs(x - mean)))
  const max44 = Math.max(...d.map((x) => Math.abs(x - ayan44)))
  const maxL = Math.max(...d.map((x) => Math.abs(x - ayanLahiri)))
  return { mean, spread, max44, maxL, d }
}

console.log('\n(A) dt table — sys P, lat 21.9019:')
console.log('  dt |  mean   | spread | maxΔ@44 | maxΔ@Lahiri')
for (let dt = -120; dt <= 480; dt += 60) {
  const s = stats('P', LAT, LON, dt)
  console.log(`${String(dt).padStart(4)}s | ${f1(s.mean).padStart(7)} | ${f2(s.spread).padStart(6)} | ${f2(s.max44).padStart(7)} | ${f2(s.maxL).padStart(8)}`)
}
console.log('\n(A2) dt table — sys T, lat 21.9019:')
for (let dt = -120; dt <= 480; dt += 60) {
  const s = stats('T', LAT, LON, dt)
  console.log(`${String(dt).padStart(4)}s | ${f1(s.mean).padStart(7)} | ${f2(s.spread).padStart(6)} | ${f2(s.max44).padStart(7)} | ${f2(s.maxL).padStart(8)}`)
}

console.log('\n(B) per-system best dt (fine, -600..+900s step 5) — minimizing maxΔ@44:')
const SYSTEMS = ['P', 'K', 'O', 'R', 'C', 'B', 'T', 'M', 'E', 'W', 'V', 'U', 'A', 'G', 'X', 'D', 'F', 'H']
for (const sys of SYSTEMS) {
  let best = null
  try {
    for (let dt = -600; dt <= 900; dt += 5) {
      const s = stats(sys, LAT, LON, dt)
      if (!best || s.max44 < best.s.max44) best = { dt, s }
    }
    console.log(
      `${sys}: dt=${String(best.dt).padStart(4)}s maxΔ@44=${f2(best.s.max44).padStart(7)}' spread=${f2(best.s.spread).padStart(6)}' mean=${f1(best.s.mean)}'`
    )
  } catch (err) {
    console.log(`${sys}: unsupported`)
  }
}

console.log('\n(C) width Δ vs reference by latitude (sys P, dt=0), arcmin:')
for (const lat of [20.5, 21.0, 21.5, 21.9019, 22.3, 22.8, 23.3]) {
  const cs = cuspsAt('P', lat, LON, 0)
  const w = []
  for (let i = 0; i < 6; i++) w.push((cs[(i + 1) % 12] + (i === 5 ? 360 : 0) - cs[i]) * 60 - [1681, 1837, 1881, 1844, 1802, 1755][i])
  console.log(`lat=${lat}: ` + w.map((x) => f1(x).padStart(7)).join(' '))
}
console.log('(ref widths arcmin: 1681, 1837, 1881, 1844, 1802, 1755)')

console.log('\n(D) per-cusp detail at the best P dt found in (B):')
{
  let best = null
  for (let dt = -600; dt <= 900; dt += 5) {
    const s = stats('P', LAT, LON, dt)
    if (!best || s.max44 < best.s.max44) best = { dt, s }
  }
  console.log(`P dt=${best.dt}s: ` + best.s.d.map((x) => f1(x - ayan44).padStart(7)).join(' '))
}
process.exit(0)
