// scripts/bnn-calib/ayanamsa-confirm.mjs — BNN Phase 2a confirmation.
// Coordinates from the old software itself (user screenshots, 2026-10-07):
//   Betul — Latitude 21.4833 N, Longitude 78.25 E; birth 22-01-1980 20:30:00 IST.
// Finds the residual time offset (expected ≈ +ΔT 1980 ≈ 50.5 s) and prints the
// final comparison table against the reference values (guide भाग 5).
// Run: node scripts/bnn-calib/ayanamsa-confirm.mjs
import SwissEph from 'swisseph-wasm'

const LAT = 21.4833
const LON = 78.25
const sign = (r, d, m = 0) => r * 30 + d + m / 60
const REF_CUSPS = [
  sign(4, 12, 53), sign(5, 10, 54), sign(6, 11, 31), sign(7, 12, 52),
  sign(8, 13, 36), sign(9, 13, 38), sign(10, 12, 53), sign(11, 10, 54),
  sign(0, 11, 31), sign(1, 12, 52), sign(2, 13, 36), sign(3, 13, 38),
]
const REF_PLANETS = {
  sun: sign(9, 8, 9), moon: sign(11, 12, 30), mars: sign(4, 21, 30),
  mercury: sign(9, 8, 59), jupiter: sign(4, 15, 30), venus: sign(10, 14, 18),
  saturn: sign(5, 3, 12), rahu: sign(4, 7, 10), ketu: sign(10, 7, 10),
}
const wrap = (d) => ((d + 540) % 360) - 180
const f2 = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x).toFixed(2)}`
const dm = (x) => {
  const v = ((x % 30) + 30) % 30
  const d = Math.floor(v)
  const m = (v - d) * 60
  return `${d}°${m.toFixed(2).padStart(5, '0')}'`
}
const rashi = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis']

const swe = new SwissEph()
await swe.initSwissEph()
const jd0 = swe.julday(1980, 1, 22, 15.0)
swe.set_sid_mode(44, 0, 0)
const dts = swe.deltat(jd0) * 86400
console.log(`ΔT from swisseph = ${dts.toFixed(2)} s`)

const cuspsAt = (dt) => {
  const jd = jd0 + dt / 86400
  const h = swe.houses_ex(jd, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL, LAT, LON, 'P')
  return Array.from({ length: 12 }, (_, i) => h.cusps[i + 1])
}
const cuspMax = (dt) => {
  const cs = cuspsAt(dt)
  return Math.max(...cs.map((c, i) => Math.abs(wrap(c - REF_CUSPS[i]) * 60)))
}

console.log('\nscan dt (seconds) → max |cusp Δ| (arcmin):')
let best = { dt: 0, score: Infinity }
for (let dt = -20; dt <= 90; dt += 1) {
  const s = cuspMax(dt)
  if (s < best.score) best = { dt, score: s }
  if (dt % 10 === 0) console.log(`  dt=${String(dt).padStart(3)}s → ${s.toFixed(2)}'`)
}
console.log(`BEST: dt = ${best.dt}s → max cusp Δ = ${best.score.toFixed(2)}'`)

const detail = (dt) => {
  const cs = cuspsAt(dt)
  console.log(`\n=== dt = ${dt}s ===`)
  console.log('cusps:')
  cs.forEach((c, i) => {
    console.log(`  ${String(i + 1).padStart(2)}: ${rashi[Math.floor(c / 30) % 12]} ${dm(c)}  (Δ ${f2(wrap(c - REF_CUSPS[i]) * 60)}')`)
  })
  const jd = jd0 + dt / 86400
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL
  const PL = { sun: 'SE_SUN', moon: 'SE_MOON', mars: 'SE_MARS', mercury: 'SE_MERCURY', jupiter: 'SE_JUPITER', venus: 'SE_VENUS', saturn: 'SE_SATURN', rahu: 'SE_MEAN_NODE' }
  let maxP = 0
  console.log('planets:')
  for (const [key, cname] of Object.entries(PL)) {
    const v = swe.calc_ut(jd, swe[cname], flags)[0]
    const d = wrap(v - REF_PLANETS[key]) * 60
    maxP = Math.max(maxP, Math.abs(d))
    console.log(`  ${key.padEnd(8)}: ${rashi[Math.floor(v / 30) % 12]} ${dm(v)}  (Δ ${f2(d)}')`)
    if (key === 'rahu') {
      const k = v + 180
      const dk = wrap(k - REF_PLANETS.ketu) * 60
      maxP = Math.max(maxP, Math.abs(dk))
      console.log(`  ketu    : ${rashi[Math.floor(k / 30) % 12]} ${dm(k)}  (Δ ${f2(dk)}')`)
    }
  }
  console.log(`max planet |Δ| = ${f2(maxP)}' | max cusp |Δ| = ${best.dt === dt ? best.score.toFixed(2) : cuspMax(dt).toFixed(2)}'`)
}

detail(best.dt)
detail(0)
if (Math.abs(dts - best.dt) > 0.5) detail(Math.round(dts))
process.exit(0)
