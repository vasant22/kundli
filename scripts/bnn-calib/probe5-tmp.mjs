// probe5: हर sun-chart transition के लिए — (T−12h) पर सूर्य की लॉन्गिट्यूड, और 36 नाल-पॉइंट में सबसे नज़दीक
// पॉइंट + exact crossing से फ़र्क़ (मिनट)। Hypothesis: row बदलती है जब सूर्य नाल-पॉइंट पार करता है (display = crossing+12h)।
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'

const swe = new SwissEph(); await swe.initSwissEph()
const k = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
const NATAL = {}; k.planets.forEach((p) => { NATAL[p.key] = p.longitude })

const PTS = []
for (const [key, lon] of Object.entries(NATAL)) {
  for (const [add, sfx] of [[0, '1'], [120, '5'], [180, '7'], [240, '9']]) {
    PTS.push({ owner: key, add, val: (((lon + add) % 360) + 360) % 360 })
  }
}
function sunLon(ms) {
  const d = new Date(ms)
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
  const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour)
  const jdt = jd + swe.deltat(jd) + 0.5 / 86400
  const r = swe.calc_ut(jdt, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED)
  return { lon: r[0], spd: r[3] }
}
const msOf = (dd, mm, yyyy, HH, MM) => Date.UTC(yyyy, mm - 1, dd, HH - 5, MM - 30)
const near = (x) => ((x % 360) + 540) % 360 - 180

// पूरी chain (सूर्य-चार्ट) — दोनों दौरों से
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
]

console.log('pair      transition            T−12h_itself?  | T−12h के sun-lon से nearest point (Δt मिनट)  | T पर nearest point (Δt)')
for (const [pair, when] of EV) {
  const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/.exec(when)
  const ms = msOf(+m[1], +m[2], +m[3], +m[4], +m[5])
  const info = (at) => {
    const s = sunLon(at)
    let best = null
    for (const p of PTS) {
      const off = near(s.lon - p.val)
      const mins = (off / s.spd) * 1440
      if (!best || Math.abs(mins) < Math.abs(best.mins)) best = { ...p, off, mins }
    }
    return best
  }
  const b1 = info(ms - 43200000)
  const b2 = info(ms)
  console.log(pair.padEnd(8) + ' ' + when + '  |  ' + b1.owner.padEnd(7) + '+' + b1.add + ' Δ=' + b1.mins.toFixed(0).padStart(7) + 'min  |  ' + b2.owner.padEnd(7) + '+' + b2.add + ' Δ=' + b2.mins.toFixed(0).padStart(7) + 'min')
}
console.log('DONE-PROBE5')
