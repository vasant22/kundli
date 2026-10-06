// scripts/bnn-calib/ayanamsa-final.mjs — BNN Phase 2, step 5: final report data.
// 1) List every sidereal mode's ayanamsa at the reference date (find any ≈23°35').
// 2) Fine joint fit: for the shortlisted ayanamsas, scan lat & solve dt so the
//    12 cusp deltas have zero mean; report the spread (shape match).
// 3) At the best point print the full cusp + planet comparison table.
// Run: node scripts/bnn-calib/ayanamsa-final.mjs
import SwissEph from 'swisseph-wasm'

const LON = 77.9032
const sign = (r, d, m = 0) => r * 30 + d + m / 60
const REF = {
  cusps: [
    sign(4, 12, 53), sign(5, 10, 54), sign(6, 11, 31), sign(7, 12, 52),
    sign(8, 13, 36), sign(9, 13, 38), sign(10, 12, 53), sign(11, 10, 54),
    sign(0, 11, 31), sign(1, 12, 52), sign(2, 13, 36), sign(3, 13, 38),
  ],
  sun: sign(9, 8, 9), moon: sign(11, 12, 30), mars: sign(4, 21, 30),
  mercury: sign(9, 8, 59), jupiter: sign(4, 15, 30), venus: sign(10, 14, 18),
  saturn: sign(5, 3, 12), rahu: sign(4, 7, 10), ketu: sign(10, 7, 10),
}
const wrap = (d) => ((d + 540) % 360) - 180
const f1 = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x).toFixed(1)}`
const f2 = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x).toFixed(2)}`
const dm = (x) => {
  let v = ((x % 30) + 30) % 30
  const d = Math.floor(v)
  const m = (v - d) * 60
  return `${d}°${m.toFixed(2).padStart(5, '0')}'`
}
const rashi = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis']

const swe = new SwissEph()
await swe.initSwissEph()
const jd0 = swe.julday(1980, 1, 22, 15.0)

console.log('== ayanamsa of every sidereal mode at the reference date ==')
const interesting = []
for (let mode = 0; mode <= 46; mode++) {
  try {
    swe.set_sid_mode(mode, 0, 0)
    const a = swe.get_ayanamsa(jd0) * 60
    if (!Number.isFinite(a)) continue
    const flag = a > 1413 && a < 1417.5 ? '  <<< 23°34–36 (Lahiri family)' : ''
    console.log(`mode ${String(mode).padStart(2)}: ${dm(a / 60)} (${a.toFixed(2)}')${flag}`)
    if (flag) interesting.push([mode, a])
  } catch { /* unsupported */ }
}

// Fine joint fit for the shortlist: lat scan × dt solved for zero-mean.
const cuspsAt = (sys, lat, lon, dt) => {
  const jd = jd0 + dt / 86400
  const h = swe.houses_ex(jd, swe.SEFLG_SWIEPH, lat, lon, sys)
  return Array.from({ length: 12 }, (_, i) => h.cusps[i + 1])
}
const fitFor = (sys, lat, ayanArc) => {
  let dt = 133
  for (let it = 0; it < 10; it++) {
    const cs = cuspsAt(sys, lat, LON, dt)
    const d = cs.map((c, i) => wrap(c - REF.cusps[i]) * 60)
    const mean = d.reduce((a, b) => a + b, 0) / 12
    const err = ayanArc - mean
    dt += err / 0.235
    if (Math.abs(err) < 0.01) break
  }
  const cs = cuspsAt(sys, lat, LON, dt)
  const d = cs.map((c, i) => wrap(c - REF.cusps[i]) * 60)
  const deltas = d.map((x) => x - ayanArc)
  const maxAbs = Math.max(...deltas.map(Math.abs))
  return { dt: Math.round(dt), deltas, maxAbs }
}

console.log('\n== fine lat/dt fit (cusps, zero-mean, ayan fixed) ==')
for (const [mode, a] of interesting) {
  let best = null
  for (let lat = 21.30; lat <= 21.70; lat += 0.01) {
    const f = fitFor('P', lat, a)
    if (!best || f.maxAbs < best.maxAbs) best = { lat, ...f }
  }
  console.log(`mode ${mode} (ayan ${a.toFixed(2)}'): best lat=${best.lat.toFixed(2)} dt=${best.dt}s maxCuspΔ=${f2(best.maxAbs)}'`)
}

// Winner detail: mode with smallest maxCuspΔ (expected 44) — print everything.
let winner = null
for (const [mode, a] of interesting) {
  for (let lat = 21.30; lat <= 21.70; lat += 0.01) {
    const f = fitFor('P', lat, a)
    const score = f.maxAbs
    if (!winner || score < winner.score) winner = { mode, a, lat, ...f, score }
  }
}

console.log(`\n== DETAIL — mode ${winner.mode}, ayan=${dm(winner.a / 60)} (=${winner.a.toFixed(2)}'), lat=${winner.lat.toFixed(2)}, dt=${winner.dt}s (time ≈ 20:30 + ${winner.dt}s) ==`)
console.log('cusp |  computed   | delta')
for (let i = 0; i < 12; i++) {
  const val = REF.cusps[i] + winner.deltas[i] / 60
  console.log(`${String(i + 1).padStart(2)} | ${rashi[Math.floor(val / 30) % 12]} ${dm(val)} | ${f2(winner.deltas[i])}'`)
}

// Planets at the winner's dt.
const jd = jd0 + winner.dt / 86400
swe.set_sid_mode(winner.mode, 0, 0)
const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL
const PL = { sun: 'SE_SUN', moon: 'SE_MOON', mars: 'SE_MARS', mercury: 'SE_MERCURY', jupiter: 'SE_JUPITER', venus: 'SE_VENUS', saturn: 'SE_SATURN', rahu: 'SE_MEAN_NODE' }
console.log('\nplanet | computed | delta')
let maxP = 0
for (const [key, cname] of Object.entries(PL)) {
  const v = swe.calc_ut(jd, swe[cname], flags)[0]
  const dlt = wrap(v - REF[key]) * 60
  if (key !== 'rahu') maxP = Math.max(maxP, Math.abs(dlt))
  console.log(`${key.padEnd(8)} | ${rashi[Math.floor(v / 30) % 12]} ${dm(v)} | ${f2(dlt)}'`)
  if (key === 'rahu') {
    const k = v + 180
    console.log(`ketu     | ${rashi[Math.floor(k / 30) % 12]} ${dm(k)} | ${f2(wrap(k - REF.ketu) * 60)}'`)
  }
}
console.log(`\nmax planet |Δ| = ${f2(maxP)}' ; max cusp |Δ| = ${f2(winner.maxAbs)}'`)
process.exit(0)
