// One-time probe: 2026 sidereal sankranti times (Sun entering each rashi, Lahiri)
// + Delhi sunrise/sunset/moonrise/moonset, to calibrate the "Pravishte / Gate" rule
// and the rise/set definition against AstroSage values.
// Run: node scripts/panchang-calib/probe-sankranti.mjs
import SwissEph from 'swisseph-wasm'

const swe = new SwissEph()
await swe.initSwissEph()
swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0)
const F = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL
const TZ = 5.5 / 24 // IST

function jdToLocal(jd) {
  const j = jd + TZ
  const z = Math.floor(j + 0.5)
  const f = j + 0.5 - z
  let a = z
  if (z >= 2299161) { const al = Math.floor((z - 1867216.25) / 36524.25); a = z + 1 + al - Math.floor(al / 4) }
  const b = a + 1524, c = Math.floor((b - 122.1) / 365.25), d2 = Math.floor(365.25 * c), e = Math.floor((b - d2) / 30.6001)
  const day = b - d2 - Math.floor(30.6001 * e)
  const month = e < 14 ? e - 1 : e - 13
  const year = month > 2 ? c - 4716 : c - 4715
  const hraw = f * 24
  const h = Math.floor(hraw), mi = Math.floor((hraw - h) * 60), s = Math.round((((hraw - h) * 60) - mi) * 60)
  const p = (n) => String(n).padStart(2, '0')
  return `${year}-${p(month)}-${p(day)} ${p(h)}:${p(mi)}:${p(s)}`
}

function sunLon(jd) { return swe.calc_ut(jd, swe.SE_SUN, F)[0] }

function findCrossing(target, jdGuess) {
  const norm = (x) => ((x % 360) + 360) % 360
  const diff = (jd) => { let d = norm(sunLon(jd) - target); if (d > 180) d -= 360; return d }
  let lo = jdGuess
  while (diff(lo) > 0) lo -= 0.5
  let hi = lo + 0.5
  while (diff(hi) < 0) { lo = hi; hi += 0.5 }
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (diff(mid) < 0) lo = mid; else hi = mid }
  return (lo + hi) / 2
}

const SIGNS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena']
// rough 2026 dates for each sankranti (local)
const rough = {
  Mesha: [2026, 4, 14], Vrishabha: [2026, 5, 15], Mithuna: [2026, 6, 15], Karka: [2026, 7, 16],
  Simha: [2026, 8, 17], Kanya: [2026, 9, 17], Tula: [2026, 10, 17], Vrischika: [2026, 11, 16],
  Dhanu: [2026, 12, 16], Makara: [2027, 1, 14], Kumbha: [2026, 2, 13], Meena: [2026, 3, 15],
}
console.log('== 2026 Sankranti times (IST) ==')
for (let i = 0; i < 12; i++) {
  const [y, m, d] = rough[SIGNS[i]]
  const jdGuess = swe.julday(y, m, d, 0) - TZ
  const t = findCrossing(i * 30, jdGuess)
  console.log(`${SIGNS[i].padEnd(10)} → ${jdToLocal(t)}`)
}

// Rise/set variants for Delhi, 29 Sep 2026 — compare with AstroSage: rise 06:12:41, set 18:10:03, moonrise 19:40:00, moonset 08:43:59
const DELHI = [77.209, 28.6139, 216]
console.log('\n== Rise/set variants (Delhi, 2026-09-29) ==')
const jd0 = swe.julday(2026, 9, 29, 0) - TZ - 0.3
const combos = [
  ['default (upper limb + refr)', 1],
  ['disc center', 1 | 256],
  ['no refraction', 1 | 512],
  ['center + no refraction', 1 | 256 | 512],
]
for (const [label, bits] of combos) {
  const r = swe.rise_trans(jd0, swe.SE_SUN, '', swe.SEFLG_SWIEPH, bits, DELHI, 1013.25, 15)
  const s = swe.rise_trans(jd0, swe.SE_SUN, '', swe.SEFLG_SWIEPH, bits + 1, DELHI, 1013.25, 15) // set = rise+1
  const mr = swe.rise_trans(jd0, swe.SE_MOON, '', swe.SEFLG_SWIEPH, bits, DELHI, 1013.25, 15)
  const ms = swe.rise_trans(jd0, swe.SE_MOON, '', swe.SEFLG_SWIEPH, bits + 1, DELHI, 1013.25, 15)
  const f = (x) => x ? jdToLocal(x[0]) : 'N/A'
  console.log(`${label.padEnd(28)} rise=${f(r)} set=${f(s)} moonrise=${f(mr)} moonset=${f(ms)}`)
}

// Sunrises at the Pravishte boundary dates (Delhi) for rule-checking
console.log('\n== Delhi sunrise on boundary dates ==')
const bdates = [[2026,2,13],[2026,4,14],[2026,5,14],[2026,5,15],[2026,6,15],[2026,7,16],[2026,8,17],[2026,9,17],[2026,10,17],[2026,11,16],[2026,12,16],[2027,1,14],[2026,3,15]]
for (const [y, m, d] of bdates) {
  const j = swe.julday(y, m, d, 0) - TZ - 0.3
  const r = swe.rise_trans(j, swe.SE_SUN, '', swe.SEFLG_SWIEPH, 1, DELHI, 1013.25, 15)
  console.log(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} sunrise=${r ? jdToLocal(r[0]) : 'N/A'}`)
}
