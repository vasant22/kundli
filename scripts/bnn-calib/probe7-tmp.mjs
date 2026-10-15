// probe7: mars-chart verification — मंगल की 36 नाल-पॉइंट crossings ↔ mars-chart chain transitions।
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'

const swe = new SwissEph(); await swe.initSwissEph()
const k = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
const NATAL = {}; k.planets.forEach((p) => { NATAL[p.key] = p.longitude })
const CONST = { sun: 'SE_SUN', moon: 'SE_MOON', mars: 'SE_MARS', mercury: 'SE_MERCURY', jupiter: 'SE_JUPITER', venus: 'SE_VENUS', saturn: 'SE_SATURN' }
function bodyLon(key, ms) {
  const d = new Date(ms)
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
  const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour)
  const jdt = jd + swe.deltat(jd) + 0.5 / 86400
  const r = swe.calc_ut(jdt, swe[CONST[key]], swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED)
  return r[0]
}
const msOf = (dd, mm, yyyy, HH, MM) => Date.UTC(yyyy, mm - 1, dd, HH - 5, MM - 30)
const near = (x) => ((x % 360) + 540) % 360 - 180
const fmt = (ms) => { const d = new Date(ms); const p = (n) => String(n).padStart(2, '0'); return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}Z` }

const PTS = []
for (const [key, lon] of Object.entries(NATAL)) for (const add of [0, 120, 180, 240]) PTS.push({ owner: key, add, val: (((lon + add) % 360) + 360) % 360 })

// generic crossing finder with 6h scan + bisect
function crossings(val, t0, t1) {
  const out = []
  let prevT = t0
  let prevF = near(bodyLon('mars', t0) - val)
  for (let t = t0 + 21600000; t <= t1; t += 21600000) {
    const F = near(bodyLon('mars', t) - val)
    if (prevF === 0 || (prevF < 0 && F >= 0) || (prevF > 0 && F <= 0)) {
      if (Math.abs(F - prevF) < 90) {
        let lo = prevT, hi = t
        const s0 = prevF < 0 ? -1 : 1
        for (let i = 0; i < 36; i++) {
          const mid = (lo + hi) / 2
          const f = near(bodyLon('mars', mid) - val)
          if ((f < 0 ? -1 : 1) === s0 && f !== 0) lo = mid; else hi = mid
        }
        out.push((lo + hi) / 2)
      }
    }
    prevF = F; prevT = t
  }
  return out
}

const EV = [
  ['rahu', '14-10-2026 07:27'], ['venus', '02-12-2026 11:43'], ['jupiter', '29-12-2026 15:27'],
  ['venus', '26-01-2027 21:19'], ['rahu', '31-01-2027 19:11'], ['moon', '20-02-2027 20:15'],
  ['rahu', '01-04-2027 19:43'], ['venus', '21-05-2027 01:35'], ['jupiter', '06-06-2027 10:39'],
  ['jupiter', '08-06-2027 23:27'], ['venus', '05-09-2027 23:27'], ['moon', '16-09-2027 17:03'],
  ['rahu', '26-10-2027 23:59'], ['jupiter', '29-11-2027 04:47'], ['mars', '10-12-2027 02:39'],
  ['saturn', '17-12-2027 21:19'], ['sun', '01-01-2028 22:23'], ['mercury', '08-01-2028 05:51'],
  ['ketu', '09-01-2028 06:55'],
].map(([p, w]) => { const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/.exec(w); return { pair: p, ms: msOf(+m[1], +m[2], +m[3], +m[4], +m[5]) } })

const allC = []
for (const pt of PTS) for (const c of crossings(pt.val, msOf(20, 8, 2026, 0, 0), msOf(20, 1, 2028, 0, 0))) allC.push({ ...pt, t: c })
allC.sort((a, b) => a.t - b.t)

console.log('mars-chart transitions ↔ नज़दीक़ी मंगल-crossing (Δ = transition − crossing):')
for (const ev of EV) {
  let best = null
  for (const c of allC) { const d = ev.ms - c.t; if (Math.abs(d) < Math.abs(best ? best.d : Infinity)) best = { ...c, d } }
  console.log(`${ev.pair.padEnd(8)} ${fmt(ev.ms)}  ←  ${best.owner.padEnd(7)}+${String(best.add).padStart(3)} @${fmt(best.t)}  Δ=${(best.d / 3600000).toFixed(1)}h`)
}
console.log('\nसारे mars-crossings 2026-10 → 2028-01 (क्रम से):')
for (const c of allC) { if (c.t >= msOf(1, 10, 2026, 0, 0) && c.t <= msOf(15, 1, 2028, 0, 0)) console.log(`${c.owner}+${String(c.add).padStart(3)} @${fmt(c.t)}`) }
console.log('DONE-PROBE7')
