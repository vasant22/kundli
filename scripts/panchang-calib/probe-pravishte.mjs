// Brute-force the "Pravishte / Gate" display rule against observed AstroSage values.
// Run: node scripts/panchang-calib/probe-pravishte.mjs
import SwissEph from 'swisseph-wasm'
import fs from 'node:fs'

const swe = new SwissEph()
await swe.initSwissEph()
swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0)
const F = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL
const TZ = 5.5

// Compute all sankranti moments (Sun crossing 30° multiples, Lahiri) around the window,
// by binary search — no hardcoded ephemeris values.
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
function jdToLocalDate(jd) {
  const j = jd + TZ / 24
  const z = Math.floor(j + 0.5), f = j + 0.5 - z
  let a = z; if (z >= 2299161) { const al = Math.floor((z - 1867216.25) / 36524.25); a = z + 1 + al - Math.floor(al / 4) }
  const b = a + 1524, c = Math.floor((b - 122.1) / 365.25), d2 = Math.floor(365.25 * c), e = Math.floor((b - d2) / 30.6001)
  const day = b - d2 - Math.floor(30.6001 * e), month = e < 14 ? e - 1 : e - 13, year = month > 2 ? c - 4716 : c - 4715
  const p = (n) => String(n).padStart(2, '0')
  return `${year}-${p(month)}-${p(day)}`
}
const SANKRANTI = []
for (let k = 0; k < 14; k++) {
  // guess dates: Jan14, Feb13, Mar15, Apr14, May15, Jun15, Jul16, Aug17, Sep17, Oct17, Nov16, Dec16, Jan14'27, Feb13'27
  const guess = [
    [2026, 1, 14], [2026, 2, 13], [2026, 3, 15], [2026, 4, 14], [2026, 5, 15], [2026, 6, 15],
    [2026, 7, 16], [2026, 8, 17], [2026, 9, 17], [2026, 10, 17], [2026, 11, 16], [2026, 12, 16],
    [2027, 1, 14], [2027, 2, 13],
  ][k]
  const target = (270 + 30 * k) % 360 // Makara, Kumbha, Meena, Mesha, …
  const jdG = swe.julday(guess[0], guess[1], guess[2], 0) - TZ / 24
  const t = findCrossing(target, jdG)
  SANKRANTI.push({ jd: t, date: jdToLocalDate(t) })
}

// observed AstroSage values (date → value)
const OBS = [
  ['2026-02-11', 29], ['2026-02-12', 30], ['2026-02-13', 31], ['2026-02-14', 2],
  ['2026-03-13', 29], ['2026-03-14', 30], ['2026-03-15', 31], ['2026-03-16', 2], ['2026-03-20', 6], ['2026-03-23', 9],
  ['2026-04-13', 30], ['2026-04-14', 31], ['2026-04-15', 2], ['2026-04-16', 3], ['2026-04-17', 4], ['2026-04-20', 7],
  ['2026-05-13', 30], ['2026-05-14', 31], ['2026-05-15', 1], ['2026-05-16', 2],
  ['2026-06-13', 30], ['2026-06-14', 31], ['2026-06-15', 1], ['2026-06-16', 2],
  ['2026-07-14', 30], ['2026-07-15', 31], ['2026-07-16', 1], ['2026-07-17', 2],
  ['2026-08-15', 30], ['2026-08-16', 31], ['2026-08-17', 1], ['2026-08-18', 2],
  ['2026-09-16', 31], ['2026-09-17', 1], ['2026-09-18', 2], ['2026-09-24', 8], ['2026-09-25', 9],
  ['2026-09-26', 10], ['2026-09-27', 11], ['2026-09-28', 12], ['2026-09-29', 13], ['2026-09-30', 14],
  ['2026-10-16', 30], ['2026-10-17', 31], ['2026-10-18', 2], ['2026-10-19', 3],
  ['2026-11-14', 29], ['2026-11-15', 30], ['2026-11-16', 31], ['2026-11-17', 2],
  ['2026-12-14', 29], ['2026-12-15', 30], ['2026-12-16', 31], ['2026-12-17', 2],
  ['2027-01-13', 29], ['2027-01-14', 30], ['2027-01-15', 2], ['2027-01-16', 3],
  ['2027-03-26', 12],
]
const DELHI = [77.209, 28.6139, 216]

// sun event (rise=1/set=2) as IST hour-of-day on a Gregorian date, searching that local date
function sunEventIST(y, mo, d, rise) {
  const jd0 = swe.julday(y, mo, d, 0) - TZ / 24 - 0.35
  const r = swe.rise_trans(jd0, swe.SE_SUN, '', swe.SEFLG_SWIEPH, rise ? 1 : 2, DELHI, 1013.25, 15)
  if (!r) return null
  const jdIst = r[0] + TZ / 24
  const dayPart = jdIst - Math.floor(jdIst - 0.5) - 0.5 // hours within local day
  let hrs = (jdIst % 1) * 24
  // normalize to the local calendar day we asked for
  const jdLocalNoon = swe.julday(y, mo, d, 12 / 24)
  hrs = (jdIst - jdLocalNoon + 0.5) * 24
  return hrs
}

function parseDate(str) { const [y, m, d] = str.split('-').map(Number); return { y, m, d } }
function sankrantiBefore(strDate) {
  const { y, m, d } = parseDate(strDate)
  const jd = swe.julday(y, m, d, 0)
  let latest = null
  for (const s of SANKRANTI) if (s.jd <= jd) latest = s
  return latest
}
function daysBetween(dateA, dateB) {
  const a = parseDate(dateA), b = parseDate(dateB)
  return swe.julday(b.y, b.m, b.d, 0) - swe.julday(a.y, a.m, a.d, 0)
}

// candidate rules: value = roundMode( (refMoment(t) - S) / day ) + K
// refMoment: hours before/after local midnight; S = sankranti moment jd
const REFS = [
  ['prev midnight (00:00)', -0.0001], ['06:00', 0.25], ['sunrise', 'sunrise'], ['noon', 0.5],
  ['sunset', 'sunset'], ['next midnight (24:00)', 0.9999],
]
const ROUNDS = [['floor', Math.floor], ['ceil', Math.ceil], ['round', Math.round]]

let results = []
for (const [refName, refVal] of REFS) {
  for (const [rName, rFn] of ROUNDS) {
    for (let K = 0; K <= 3; K++) {
      let bad = []
      for (const [dstr, want] of OBS) {
        const s = sankrantiBefore(dstr)
        const { y, m, d } = parseDate(dstr)
        let tjd
        if (refVal === 'sunrise' || refVal === 'sunset') {
          const h = sunEventIST(y, m, d, refVal === 'sunrise')
          if (h == null) { bad.push([dstr, want, 'N/A']); continue }
          tjd = swe.julday(y, m, d, 0) + (h - TZ + 24) % 24 / 24
        } else {
          tjd = swe.julday(y, m, d, 0) + refVal
        }
        const deltaDays = (tjd - s.jd)
        const val = rFn(deltaDays) + K
        if (val !== want) bad.push([dstr, want, val])
      }
      results.push({ rule: `${rName}((${refName}) - S) + ${K}`, badCount: bad.length, bad: bad.slice(0, 6) })
    }
  }
}
// date-difference rules (integer dates, no times)
for (let K = 0; K <= 3; K++) {
  const bad = []
  for (const [dstr, want] of OBS) {
    const s = sankrantiBefore(dstr)
    const val = daysBetween(s.date, dstr) + K
    if (val !== want) bad.push([dstr, want, val])
  }
  results.push({ rule: `dateDiff(S.date, t) + ${K}`, badCount: bad.length, bad: bad.slice(0, 6) })
}

results.sort((a, b) => a.badCount - b.badCount)
for (const r of results.slice(0, 12)) {
  console.log(`${String(r.badCount).padStart(3)} bad  ${r.rule}   e.g. ${JSON.stringify(r.bad)}`)
}
