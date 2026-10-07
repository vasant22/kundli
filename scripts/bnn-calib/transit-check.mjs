// transit-check.mjs — BNN Phase 7 PASS/FAIL: the outside transit ring vs the
// reference snapshots (guide भाग 5 · outer-face screenshot, user 2026-10-07).
// Calibration 2026-10-07: transit = planets & ascendant at UT + ΔT (+0.5 s),
// arcminutes ROUNDED (verified "ASC 28.01"); inner chart text truncates.
// Run: node scripts/bnn-calib/transit-check.mjs
import SwissEph from 'swisseph-wasm'
import { computeTransitSnapshot } from '../../src/bnn/transit.js'

const swe = new SwissEph()
await swe.initSwissEph()
const PLACE = { latitude: 21.4833, longitude: 78.25 }
const CODE = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' }

const roundMin = (deg) => {
  const d = Math.floor(deg)
  let m = Math.round((deg - d) * 60)
  let dd = d
  if (m === 60) { dd += 1; m = 0 }
  return `${String(dd).padStart(2, '0')}.${String(m).padStart(2, '0')}`
}
const label = (p) => `${CODE[p.key]}${p.retro && p.key !== 'rahu' && p.key !== 'ketu' ? '#' : ''} ${roundMin(p.degInSign)}`

let pass = 0
let fail = 0
const cmp = (name, got, want, note = '') => {
  const ok = got === want
  if (ok) pass++
  else fail++
  console.log(`  ${ok ? '✅' : '❌'} ${name}: ${got}${ok ? '' : `  (want ${want})`}${note}`)
}

// ---------- Reference 1: 01-10-2026 ≈12:16 IST (guide भाग 5) ----------
console.log('===== 01-10-2026 ≈12:16 IST — guide भाग 5 =====')
{
  const when = { year: 2026, month: 10, day: 1, hour: 6, minute: 46, second: 0 }
  const t = computeTransitSnapshot(swe, when, PLACE)
  const by = Object.fromEntries(t.planets.map((p) => [p.key, p]))
  const WANT = { moon: '13.42', saturn: '17.19', rahu: '03.28', mars: '07.37', jupiter: '25.24', sun: '13.52', venus: '14.10', mercury: '06.49', ketu: '03.28' }
  const RASHI_WANT = { moon: 1, saturn: 11, rahu: 10, mars: 3, jupiter: 3, sun: 5, venus: 6, mercury: 6, ketu: 4 }
  for (const [key, want] of Object.entries(WANT)) {
    const [wd, wm] = want.split('.').map(Number)
    const diff = by[key].degInSign * 60 - (wd * 60 + wm)
    const ok = Math.abs(diff) < 1 && by[key].rashi === RASHI_WANT[key]
    if (ok) { pass++; console.log(`  ✅ ${key}: ${label(by[key])} (want ${CODE[key]} ${want}, Δ ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}′)`) }
    else { fail++; console.log(`  ❌ ${key}: ${label(by[key])} (want ${CODE[key]} ${want}; sign ${by[key].rashi} vs ${RASHI_WANT[key]}; Δ ${diff.toFixed(2)}′)`) }
  }
  // The guide's time is approximate ("लगभग"). Report the time offset that puts
  // the transit ascendant exactly on 5°46′ and confirm the planets stay within 1′.
  const ascAt = (secOffset) => {
    const base = 6 * 3600 + 46 * 60 // 06:46:00 UT in seconds
    const s = base + secOffset
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60
    return computeTransitSnapshot(swe, { year: 2026, month: 10, day: 1, hour: hh, minute: mm, second: ss }, PLACE)
  }
  let found = null
  for (let off = -120; off <= 120; off += 1) {
    const snap = ascAt(off)
    const d = snap.ascendant.degInSign * 60 - (5 * 60 + 46)
    if (Math.abs(d) < 0.5) { found = { off, snap, d }; break }
  }
  if (found) {
    const hh = Math.floor((6 * 3600 + 46 * 60 + found.off) / 3600)
    const mm = Math.floor(((6 * 3600 + 46 * 60 + found.off) % 3600) / 60)
    const ss = (6 * 3600 + 46 * 60 + found.off) % 60
    const worst = Math.max(...Object.keys(WANT).map((k) => {
      const [wd, wm] = WANT[k].split('.').map(Number)
      const p = found.snap.planets.find((x) => x.key === k)
      return Math.abs(p.degInSign * 60 - (wd * 60 + wm))
    }))
    const ok = worst < 1
    if (ok) pass++
    else fail++
    console.log(`  ${ok ? '✅' : '❌'} ASC: 05.46 at ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')} UT (Δ ${found.off}s from 12:16:00 IST; guide time is approximate) — planets stay within ${worst.toFixed(2)}′`)
  } else {
    fail++
    console.log('  ❌ ASC: no time within ±2 min puts the ascendant on 5°46′')
  }
}

// ---------- Reference 2: 07-10-2026 04:40:03 IST (outer-face screenshot) ----------
console.log('===== 07-10-2026 04:40:03 IST — outer-face screenshot =====')
{
  // 04:40:03 IST = 2026-10-06 23:10:03 UT
  const t = computeTransitSnapshot(swe, { year: 2026, month: 10, day: 6, hour: 23, minute: 10, second: 3 }, PLACE)
  const by = Object.fromEntries(t.planets.map((p) => [p.key, p]))
  const WANT = {
    saturn: 'SAT# 16.52', rahu: 'RAH 03.09', ketu: 'KET 03.09', mars: 'MAR 10.53',
    jupiter: 'JUP 26.24', venus: 'VEN# 13.59', mercury: 'MER 13.56', sun: 'SUN 19.28', moon: 'MOO 03.39',
  }
  for (const [key, want] of Object.entries(WANT)) {
    const wd2 = Number(want.split(' ')[1].split('.')[0])
    const wm2 = Number(want.split(' ')[1].split('.')[1])
    const diff = by[key].degInSign * 60 - (wd2 * 60 + wm2)
    const ok = Math.abs(diff) < 1
    if (ok) pass++
    else fail++
    const note = Math.abs(diff) >= 0.2 ? `  (Δ ${diff >= 0 ? '+' : ''}${diff.toFixed(3)}′ — node-model residual)` : ''
    console.log(`  ${ok ? '✅' : '❌'} ${key}: ${label(by[key])} vs ${want}${note}`)
  }
  cmp('ascendant', `ASC ${roundMin(t.ascendant.degInSign)}`, 'ASC 28.01')
}

console.log(`\nTOTAL: ${pass} PASS / ${fail} FAIL`)
process.exit(0)
