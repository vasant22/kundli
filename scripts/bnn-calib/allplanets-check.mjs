// allplanets-check.mjs — "All Planets" chain engine vs owner's captured tables (2026-10-14/15).
// Captures: docs/pcp-research.md §5–§6; screenshots .openclaw-tmp/bnn-ref/pcp/allplanets-*.
// Rule (decoded 2026-10-15): row opens when the CHART planet's transit crosses a natal
// frame-position of ANY planet (34 points); label = owner of the NEXT point; display =
// crossing + C° of the traveler (sun 0.988°, mars 0.8°). Compare owner + IST time (±tol).
// Run: node scripts/bnn-calib/allplanets-check.mjs
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'
import { computeAllPlanetsChain } from '../../src/bnn/pcp.js'

const swe = new SwissEph()
await swe.initSwissEph()
swe.set_sid_mode(44, 0, 0)
const FLAGS = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED
const CONST = { sun: swe.SE_SUN, moon: swe.SE_MOON, mars: swe.SE_MARS, mercury: swe.SE_MERCURY, jupiter: swe.SE_JUPITER, venus: swe.SE_VENUS, saturn: swe.SE_SATURN, rahu: swe.SE_MEAN_NODE, ketu: swe.SE_MEAN_NODE }
const makeLonAt = (key) => (ms) => {
  const d = new Date(ms)
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
  const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour)
  const jdt = jd + swe.deltat(jd) + 0.5 / 86400
  const r = swe.calc_ut(jdt, CONST[key], FLAGS)
  let lon = r[0]
  if (key === 'ketu') lon += 180
  return { lon: ((lon % 360) + 360) % 360, speed: r[3] }
}
const chart = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
const NATAL = {}
chart.planets.forEach((p) => { NATAL[p.key] = p.longitude })

const msOf = (dd, mm, yyyy, HH, MM) => Date.UTC(yyyy, mm - 1, dd, HH - 5, MM - 30)
const fmtIST = (ms) => {
  const d = new Date(ms + 5.5 * 3600 * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

// captured rows: [owner, 'dd-mm-yyyy HH:MM' IST, clipped?]
const SUN_EV = [
  ['ketu', '14-10-2026 07:20', 1], ['venus', '26-10-2026 00:56'], ['moon', '02-11-2026 04:32'],
  ['rahu', '30-11-2026 04:32'], ['jupiter', '24-12-2026 10:56'], ['mars', '01-01-2027 15:20'],
  ['saturn', '07-01-2027 12:32'], ['sun', '19-01-2027 00:32', 1], ['mercury', '23-01-2027 21:04'],
  ['ketu', '24-01-2027 16:40'], ['venus', '21-02-2027 12:16'], ['jupiter', '28-02-2027 14:40'],
  ['mars', '01-03-2027 19:28'], ['saturn', '07-03-2027 18:40'], ['moon', '19-03-2027 12:16'],
  ['rahu', '28-03-2027 21:28'], ['jupiter', '22-04-2027 23:52'], ['mars', '01-05-2027 13:28'],
  ['saturn', '07-05-2027 17:52'], ['sun', '19-05-2027 21:04'], ['mercury', '25-05-2027 00:40'],
  ['ketu', '25-05-2027 21:28'], ['venus', '24-06-2027 08:16'], ['sun', '01-07-2027 19:52'],
  ['mercury', '26-07-2027 20:16'], ['moon', '27-07-2027 17:04'], ['rahu', '31-07-2027 09:28'],
  ['venus', '26-08-2027 01:52'], ['jupiter', '02-09-2027 11:04'], ['mars', '03-09-2027 16:40'],
  ['saturn', '09-09-2027 21:04'], ['sun', '21-09-2027 21:28'], ['mercury', '26-09-2027 23:04'],
  ['moon', '27-09-2027 19:04'], ['ketu', '01-10-2027 09:28'], ['venus', '26-10-2027 07:04'],
  ['moon', '02-11-2027 10:40'], ['rahu', '30-11-2027 10:40'], ['jupiter', '24-12-2027 17:04'],
  ['mars', '01-01-2028 21:28'], ['saturn', '07-01-2028 18:40'], ['sun', '19-01-2028 06:40'],
  ['mercury', '24-01-2028 03:28'], ['ketu', '24-01-2028 22:40'], ['venus', '21-02-2028 18:16'],
  ['jupiter', '28-02-2028 20:40'], ['mars', '01-03-2028 01:28'], ['saturn', '07-03-2028 01:04'],
  ['moon', '18-03-2028 18:40'], ['rahu', '28-03-2028 03:28'], ['jupiter', '22-04-2028 06:16'],
  ['mars', '30-04-2028 19:52'], ['saturn', '07-05-2028 00:16'], ['sun', '19-05-2028 03:28'],
  ['mercury', '24-05-2028 07:04'], ['ketu', '25-05-2028 03:28'], ['venus', '23-06-2028 14:16'],
  ['sun', '01-07-2028 02:16'], ['mercury', '26-07-2028 02:16'], ['moon', '26-07-2028 23:04'],
  ['rahu', '30-07-2028 15:28'], ['venus', '25-08-2028 07:52'], ['jupiter', '01-09-2028 17:28'],
  ['mars', '02-09-2028 23:03'], ['saturn', '09-09-2028 03:27'], ['sun', '21-09-2028 03:51'],
  ['mercury', '26-09-2028 05:03'], ['moon', '27-09-2028 01:27'], ['ketu', '30-09-2028 15:27'],
  ['venus', '25-10-2028 13:03'], ['moon', '01-11-2028 17:03'], ['rahu', '29-11-2028 16:39'],
]
const MARS_EV = [
  ['rahu', '14-10-2026 07:27', 1], ['venus', '02-12-2026 11:43'], ['jupiter', '29-12-2026 15:27'],
  ['venus', '26-01-2027 21:19'], ['rahu', '31-01-2027 19:11'], ['moon', '20-02-2027 20:15'],
  ['rahu', '01-04-2027 19:43'], ['venus', '21-05-2027 01:35'], ['jupiter', '06-06-2027 10:39'],
  ['venus', '05-09-2027 23:27'], ['moon', '16-09-2027 17:03'], ['rahu', '26-10-2027 23:59'],
  ['jupiter', '29-11-2027 04:47'], ['mars', '10-12-2027 02:39'], ['saturn', '17-12-2027 21:19'],
  ['sun', '01-01-2028 22:23'], ['mercury', '08-01-2028 05:51'], ['ketu', '09-01-2028 06:55'],
]

const TOL_H = { sun: 3, mars: 5 }
// windows where the captures tile continuously (extras counted only inside)
const SUN_WINDOWS = [[msOf(14, 10, 2026, 0, 0), msOf(23, 12, 2028, 22, 0)]]
const MARS_WINDOWS = [[msOf(14, 10, 2026, 0, 0), msOf(8, 6, 2027, 23, 59)], [msOf(5, 9, 2027, 0, 0), msOf(9, 1, 2028, 23, 59)]]

let grand = { pass: 0, total: 0, extra: 0 }
for (const [birthKey, EV, windows, range] of [
  ['sun', SUN_EV, SUN_WINDOWS, [msOf(14, 10, 2026, 0, 0), msOf(31, 12, 2028, 0, 0)]],
  ['mars', MARS_EV, MARS_WINDOWS, [msOf(14, 10, 2026, 0, 0), msOf(15, 1, 2028, 0, 0)]],
]) {
  const rows = computeAllPlanetsChain(makeLonAt(birthKey), { tStartMs: range[0], tEndMs: range[1], natalLons: NATAL, birthKey })
  const used = new Array(rows.length).fill(false)
  let pass = 0
  const fails = []
  for (const [owner, when, clipped] of EV) {
    const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/.exec(when)
    const wantMs = msOf(+m[1], +m[2], +m[3], +m[4], +m[5])
    // a range-clipped first row shows the run-time in the legacy capture — any
    // clipped row of the same owner satisfies it
    let best = -1
    let bestD = Infinity
    for (let i = 0; i < rows.length; i++) {
      if (used[i] || rows[i].ownerKey !== owner) continue
      const d = clipped && rows[i].clippedStart ? 0 : Math.abs(rows[i].startMs - wantMs)
      if (d < bestD) { bestD = d; best = i }
    }
    const tol = TOL_H[birthKey] * 3600000
    if (best >= 0 && bestD <= tol) { used[best] = true; pass++ } else {
      fails.push(`${owner} ${when}${best >= 0 ? ' (closest ' + Math.round(bestD / 3600000) + 'h)' : ' (none)'}`)
    }
  }
  let inWin = 0
  let extra = 0
  for (let i = 0; i < rows.length; i++) {
    if (used[i] || rows[i].clippedStart) continue
    if (windows.some(([a, b]) => rows[i].startMs >= a && rows[i].startMs <= b)) { extra++; if (extra <= 6) fails.push('EXTRA ' + rows[i].ownerKey + ' ' + fmtIST(rows[i].startMs)) }
  }
  console.log(`\n[${birthKey.toUpperCase()} chart] ${pass}/${EV.length} matched (±${TOL_H[birthKey]}h) · extra rows in verified windows: ${extra}`)
  for (const f of fails) console.log('   ✗ ' + f)
  grand.pass += pass
  grand.total += EV.length
  grand.extra += extra
}
console.log(`\nALLPLANETS TOTAL: ${grand.pass}/${grand.total} PASS · extras ${grand.extra}  (target: all PASS, extras 0 except documented quirks)`)
console.log('DONE-ALLPLANETS-CHECK')
