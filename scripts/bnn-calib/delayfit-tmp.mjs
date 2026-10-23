// delay-fit: हर captured event पर (the traditional format-time − crossing-time) → उस समय की असली speed से DEGREES में delay।
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'
import { chainPoints, nextChainPoint } from '../../src/bnn/pcp.js'
const swe = new SwissEph(); await swe.initSwissEph(); swe.set_sid_mode(44, 0, 0)
const CONST = { sun: swe.SE_SUN, mars: swe.SE_MARS }
const makeLonAt = (key) => (ms) => { const d = new Date(ms); const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600; const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour); const jdt = jd + swe.deltat(jd) + 0.5 / 86400; const r = swe.calc_ut(jdt, CONST[key], swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED); return { lon: r[0], speed: r[3] } }
const chart = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
const NATAL = {}; chart.planets.forEach((p) => { NATAL[p.key] = p.longitude })
const PTS = chainPoints(NATAL)
const msOf = (s) => { const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/.exec(s); return Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4] - 5, +m[5] - 30) }
const near = (val, lon) => ((lon - val + 540) % 360) - 180

// हर expected event: crossing-time ढूँढो (उस point पर जिसका next-owner = pair), फिर delay नापो
function findCrossing(lonAt, val, t0, t1, fwd) {
  let prevT = t0, prevF = near(val, lonAt(t0).lon)
  for (let t = t0 + 21600000; t <= t1; t += 21600000) {
    const F = near(val, lonAt(t).lon)
    if (Math.abs(F - prevF) < 90 && ((prevF < 0 && F >= 0) || (prevF > 0 && F <= 0)) && (fwd == null || (fwd ? F >= 0 && prevF < 0 : F <= 0 && prevF > 0))) {
      let lo = prevT, hi = t; const s0 = prevF < 0 ? -1 : 1
      for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const f = near(val, lonAt(mid).lon); if ((f < 0 ? -1 : 1) === s0 && f !== 0) lo = mid; else hi = mid }
      return (lo + hi) / 2
    }
    prevF = F; prevT = t
  }
  return null
}
const EVS = {
  sun: [['venus', '26-10-2026 00:56'], ['moon', '02-11-2026 04:32'], ['rahu', '30-11-2026 04:32'], ['jupiter', '24-12-2026 10:56'], ['mars', '01-01-2027 15:20'], ['saturn', '07-01-2027 12:32'], ['sun', '19-01-2027 00:32'], ['mercury', '23-01-2027 21:04'], ['venus', '24-06-2027 08:16'], ['venus', '25-08-2028 07:52'], ['jupiter', '01-09-2028 17:28']],
  mars: [['venus', '02-12-2026 11:43'], ['jupiter', '29-12-2026 15:27'], ['venus', '05-09-2027 23:27'], ['moon', '16-09-2027 17:03'], ['rahu', '26-10-2027 23:59'], ['jupiter', '29-11-2027 04:47'], ['mars', '10-12-2027 02:39'], ['saturn', '17-12-2027 21:19'], ['sun', '01-01-2028 22:23'], ['ketu', '09-01-2028 01:25']],
}
for (const key of ['sun', 'mars']) {
  console.log('\n' + key.toUpperCase() + ': pair      ref-time            crossing            delay_h   speed     delay_deg')
  const lonAt = makeLonAt(key)
  for (const [pair, when] of EVS[key]) {
    const sirMs = msOf(when)
    // पिछला crossing जिसका next-owner = pair
    let best = null
    for (const pt of PTS) {
      if (nextChainPoint(PTS, pt.val).owner !== pair) continue
      for (const fwd of [true, false]) {
        const c = findCrossing(lonAt, pt.val, sirMs - 90 * 86400000, sirMs, fwd)
        if (c == null) continue
        const d = sirMs - c
        if (d >= 0 && d < 5 * 86400000 && (!best || d < best.d)) best = { c, d, pt, fwd }
      }
    }
    if (!best) { console.log(pair.padEnd(8) + ' ' + when + '  — कोई crossing नहीं मिला'); continue }
    const spd = lonAt(best.c).speed
    console.log(pair.padEnd(8) + ' ' + when + '  ' + new Date(best.c).toISOString().slice(0, 16) + 'Z  ' + (best.d / 3600000).toFixed(1).padStart(7) + 'h  ' + spd.toFixed(4).padStart(8) + '  ' + (best.d / 86400000 * spd).toFixed(4) + (best.fwd ? '' : '  (retro)'))
  }
}
console.log('DONE-DELAYFIT')
