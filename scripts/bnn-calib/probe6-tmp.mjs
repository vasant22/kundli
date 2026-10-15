// probe6: alignment — sun-chart के हर transition को 36 नाल-पॉइंट crossings से मिलाओ (exact)।
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'

const swe = new SwissEph(); await swe.initSwissEph()
const k = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
const NATAL = {}; k.planets.forEach((p) => { NATAL[p.key] = p.longitude })

function sunLon(ms) {
  const d = new Date(ms)
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
  const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour)
  const jdt = jd + swe.deltat(jd) + 0.5 / 86400
  const r = swe.calc_ut(jdt, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED)
  return r[0]
}
const msOf = (dd, mm, yyyy, HH, MM) => Date.UTC(yyyy, mm - 1, dd, HH - 5, MM - 30)
const near = (x) => ((x % 360) + 540) % 360 - 180
const fmt = (ms) => { const d = new Date(ms); const p = (n) => String(n).padStart(2, '0'); return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}Z` }

const PTS = []
for (const [key, lon] of Object.entries(NATAL)) for (const [add, sfx] of [[0, '1'], [120, '5'], [180, '7'], [240, '9']]) PTS.push({ owner: key, add, val: (((lon + add) % 360) + 360) % 360 })

// crossings of each point by the sun, 2026-10 → 2029-02
function crossings(pt, t0, t1) {
  const out = []
  let s = sunLon(t0)
  let cur = t0
  // coarse scan 1d
  let prevLon = s
  let prevT = t0
  for (let t = t0 + 86400000; t <= t1; t += 86400000) {
    const L = sunLon(t)
    const d = near(L - prevLon)
    const off = near(pt.val - prevLon)
    if (d > 0 && off >= 0 && off <= d + 1e-9) {
      // bisect within [prevT, t]
      let lo = prevT, hi = t
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2
        if (near(pt.val - sunLon(mid)) > 0) lo = mid; else hi = mid
      }
      out.push((lo + hi) / 2)
    }
    prevLon = L; prevT = t
  }
  return out
}

const EV = [
  ['ketu', '14-10-2026 07:20'], ['venus', '26-10-2026 00:56'], ['moon', '02-11-2026 04:32'],
  ['rahu', '30-11-2026 04:32'], ['jupiter', '24-12-2026 10:56'], ['mars', '01-01-2027 15:20'],
  ['saturn', '07-01-2027 12:32'], ['sun', '19-01-2027 00:32'], ['mercury', '23-01-2027 21:04'],
  ['ketu', '24-01-2027 16:40'], ['venus', '21-02-2027 12:16'], ['jupiter', '28-02-2027 14:40'],
  ['jupiter', '01-03-2027 11:04'], ['mars', '01-03-2027 19:28'], ['saturn', '07-03-2027 18:40'],
  ['moon', '19-03-2027 12:16'], ['rahu', '28-03-2027 21:28'], ['jupiter', '22-04-2027 23:52'],
  ['mars', '01-05-2027 13:28'], ['saturn', '07-05-2027 17:52'], ['sun', '19-05-2027 21:04'],
  ['mercury', '25-05-2027 00:40'], ['ketu', '25-05-2027 21:28'], ['venus', '24-06-2027 08:16'],
  ['sun', '01-07-2027 19:52'], ['mercury', '26-07-2027 20:16'], ['moon', '27-07-2027 17:04'],
  ['rahu', '31-07-2027 09:28'], ['venus', '26-08-2027 01:52'], ['jupiter', '02-09-2027 11:04'],
  ['mars', '03-09-2027 16:40'], ['saturn', '09-09-2027 21:04'], ['sun', '21-09-2027 21:28'],
  ['mercury', '26-09-2027 23:04'], ['moon', '27-09-2027 19:04'], ['ketu', '01-10-2027 09:28'],
  ['venus', '26-10-2027 07:04'], ['moon', '02-11-2027 10:40'], ['rahu', '30-11-2027 10:40'],
  ['jupiter', '24-12-2027 17:04'], ['mars', '01-01-2028 21:28'], ['saturn', '07-01-2028 18:40'],
  ['sun', '19-01-2028 06:40'], ['mercury', '24-01-2028 03:28'], ['ketu', '24-01-2028 22:40'],
  ['venus', '21-02-2028 18:16'], ['jupiter', '28-02-2028 20:40'], ['mars', '01-03-2028 01:28'],
  ['saturn', '07-03-2028 01:04'], ['moon', '18-03-2028 18:40'], ['rahu', '28-03-2028 03:28'],
  ['jupiter', '22-04-2028 06:16'], ['mars', '30-04-2028 19:52'], ['saturn', '07-05-2028 00:16'],
  ['sun', '19-05-2028 03:28'], ['mercury', '24-05-2028 07:04'], ['ketu', '25-05-2028 03:28'],
  ['venus', '23-06-2028 14:16'], ['sun', '01-07-2028 02:16'], ['mercury', '26-07-2028 02:16'],
  ['moon', '26-07-2028 23:04'], ['rahu', '30-07-2028 15:28'], ['venus', '25-08-2028 07:52'],
  ['jupiter', '01-09-2028 17:28'], ['mars', '02-09-2028 23:03'], ['saturn', '09-09-2028 03:27'],
  ['sun', '21-09-2028 03:51'], ['mercury', '26-09-2028 05:03'], ['moon', '27-09-2028 01:27'],
  ['ketu', '30-09-2028 15:27'], ['venus', '25-10-2028 13:03'], ['moon', '01-11-2028 17:03'],
  ['rahu', '29-11-2028 16:39'],
].map(([p, w]) => { const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/.exec(w); return { pair: p, ms: msOf(+m[1], +m[2], +m[3], +m[4], +m[5]) } })

// सब crossings (2026-09 → 2029-03)
const allC = []
for (const pt of PTS) for (const c of crossings(pt, msOf(1, 9, 2026, 0, 0), msOf(31, 3, 2029, 0, 0))) allC.push({ ...pt, t: c })
allC.sort((a, b) => a.t - b.t)

console.log('transitions (sun-chart): नज़दीक़ी crossing (रह गया अंतर)')
for (const ev of EV) {
  let best = null
  for (const c of allC) { const d = ev.ms - c.t; if (!best || Math.abs(d) < Math.abs(best.d)) best = { ...c, d } }
  console.log(`${ev.pair.padEnd(8)} ${fmt(ev.ms)}  ←  ${best.owner.padEnd(7)}+${String(best.add).padStart(3)} @${fmt(best.t)}  Δ=${(best.d / 3600000).toFixed(1)}h`)
}
console.log('\n--- सूर्य-वर्ष 2027 के सारे crossings (क्रम से) ---')
let line = []
for (const c of allC) { if (c.t >= msOf(1, 1, 2027, 0, 0) && c.t <= msOf(1, 1, 2028, 0, 0)) line.push(`${c.owner}+${c.add}@${fmt(c.t)}`) }
console.log(line.join('\n'))
console.log('DONE-PROBE6')
