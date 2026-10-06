// scripts/bnn-calib/ayanamsa-diag2.mjs — BNN Phase 2, step 4 diagnostics.
// Two more hypotheses for the ±4' cusp-shape residual:
//  H1: latitude of the old software's "Betul" was slightly different.
//  H2: the old software computed the cusps with a *sidereal-time* style
//      convention: RAMC shifted by the ayanamsa (in degrees), effectively
//      emulated here by shifting the geographic longitude by −ayan×k.
// Run: node scripts/bnn-calib/ayanamsa-diag2.mjs
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
const f2 = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x).toFixed(2)}`
const f1 = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x).toFixed(1)}`

const swe = new SwissEph()
await swe.initSwissEph()
const jd0 = swe.julday(1980, 1, 22, 15.0)
swe.set_sid_mode(44, 0, 0)
const ayan44 = swe.get_ayanamsa(jd0) // degrees
const TARGET = ayan44 * 60

const cuspsAt = (sys, lat, lon, dt) => {
  const jd = jd0 + dt / 86400
  const h = swe.houses_ex(jd, swe.SEFLG_SWIEPH, lat, lon, sys)
  return Array.from({ length: 12 }, (_, i) => h.cusps[i + 1])
}
const resid = (sys, lat, lon, dt) => {
  const cs = cuspsAt(sys, lat, lon, dt)
  const d = cs.map((c, i) => wrap(c - REF[i]) * 60)
  const mean = d.reduce((a, b) => a + b, 0) / 12
  const spread = Math.max(...d.map((x) => Math.abs(x - mean)))
  return { mean, spread, d }
}
// dt that makes mean = TARGET (secant)
const solveDt = (sys, lat, lon) => {
  let dt = 120
  for (let it = 0; it < 8; it++) {
    const r1 = resid(sys, lat, lon, dt)
    const err = TARGET - r1.mean
    const slope = 0.235 // arcmin per second
    dt += err / slope
    if (Math.abs(err) < 0.02) break
  }
  return Math.round(dt)
}

console.log('(H1) latitude scan: dt solved so mean=ayan44, spread at that point:')
for (let lat = 21.0; lat <= 22.25; lat += 0.1) {
  const dt = solveDt('P', lat, LON)
  const r = resid('P', lat, LON, dt)
  console.log(`lat=${lat.toFixed(2)} dt=${String(dt).padStart(4)}s spread=${f2(r.spread)}`)
}

console.log('\n(H2) RAMC-shift scan: effective lon shift = -ayan×k, fine dt solved:')
for (const k of [0.5, 0.7, 0.85, 0.9, 0.917, 0.95, 1.0, 1.02, 1.05, 1.09, 1.1, 1.15, 1.2]) {
  const lon2 = LON - ayan44 * k
  const dt = solveDt('P', LAT, lon2)
  const r = resid('P', LAT, lon2, dt)
  console.log(`k=${k.toFixed(3)} lon=${lon2.toFixed(4)} dt=${String(dt).padStart(4)}s spread=${f2(r.spread)}`)
}

console.log('\n(H2b) raw deltas (no ayan subtraction) for a few k at dt=0:')
for (const k of [0.917, 1.0, 1.09]) {
  const lon2 = LON - ayan44 * k
  const cs = cuspsAt('P', LAT, lon2, 0)
  const d = cs.map((c, i) => wrap(c - REF[i]) * 60)
  const mean = d.reduce((a, b) => a + b, 0) / 12
  console.log(`k=${k}: mean=${f1(mean)} deltas: ` + d.map((x) => f1(x - mean).padStart(7)).join(' '))
}
process.exit(0)
