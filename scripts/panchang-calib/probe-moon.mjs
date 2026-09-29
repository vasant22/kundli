// scratch: moon event conventions probe
import SwissEph from 'swisseph-wasm'
const swe = new SwissEph()
await swe.initSwissEph()
const TZ = 5.5 / 24
function fmt(jd) {
  const d = swe.revjul(jd + TZ, 1)
  const h = d.hour, hh = Math.floor(h), mm = Math.floor((h - hh) * 60), ss = Math.round((((h - hh) * 60) - mm) * 60)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.year}-${p(d.month)}-${p(d.day)} ${p(hh)}:${p(mm)}:${p(ss)}`
}
const VAR = [
  ['default upper+refr', 1],
  ['center', 1 | 256],
  ['noRefr', 1 | 512],
  ['center+noRefr', 1 | 256 | 512],
]
function jd0(y, m, d) { return swe.julday(y, m, d, 0) - TZ }

console.log('== Varanasi 2026-03-20: moonrise ref 06:39, moonset ref 19:31 ==')
for (const [name, bits] of VAR) {
  const r = swe.rise_trans(jd0(2026, 3, 20), swe.SE_MOON, '', 2, bits, [82.9739, 25.3176, 0], 1013.25, 15)
  const s = swe.rise_trans(jd0(2026, 3, 20), swe.SE_MOON, '', 2, bits + 1, [82.9739, 25.3176, 0], 1013.25, 15)
  console.log(`  ${name}: rise=${fmt(r[0])} set=${fmt(s[0])}`)
}

console.log('\n== Mumbai: all moon events 2026-06-20 → 2026-06-23 (default) ==')
let jd = jd0(2026, 6, 20)
for (let i = 0; i < 8; i++) {
  const r = swe.rise_trans(jd, swe.SE_MOON, '', 2, 1, [72.8777, 19.076, 0], 1013.25, 15)
  const s = swe.rise_trans(jd, swe.SE_MOON, '', 2, 2, [72.8777, 19.076, 0], 1013.25, 15)
  const next = Math.min(r?.[0] ?? Infinity, s?.[0] ?? Infinity)
  const which = (r && r[0] === next) ? 'RISE' : 'SET'
  console.log(' ', fmt(next), which)
  jd = next + 1e-6
}

console.log('\n== Varanasi: moon events 2026-12-20 → 2026-12-22 (default) ==')
jd = jd0(2026, 12, 20)
for (let i = 0; i < 6; i++) {
  const r = swe.rise_trans(jd, swe.SE_MOON, '', 2, 1, [82.9739, 25.3176, 0], 1013.25, 15)
  const s = swe.rise_trans(jd, swe.SE_MOON, '', 2, 2, [82.9739, 25.3176, 0], 1013.25, 15)
  const next = Math.min(r?.[0] ?? Infinity, s?.[0] ?? Infinity)
  const which = (r && r[0] === next) ? 'RISE' : 'SET'
  console.log(' ', fmt(next), which)
  jd = next + 1e-6
}

console.log('\n== Delhi 2026-10-04 (AS spill case): moon events Oct 4-5 ==')
jd = jd0(2026, 10, 4)
for (let i = 0; i < 5; i++) {
  const r = swe.rise_trans(jd, swe.SE_MOON, '', 2, 1, [77.209, 28.6139, 0], 1013.25, 15)
  const s = swe.rise_trans(jd, swe.SE_MOON, '', 2, 2, [77.209, 28.6139, 0], 1013.25, 15)
  const next = Math.min(r?.[0] ?? Infinity, s?.[0] ?? Infinity)
  const which = (r && r[0] === next) ? 'RISE' : 'SET'
  console.log(' ', fmt(next), which)
  jd = next + 1e-6
}
