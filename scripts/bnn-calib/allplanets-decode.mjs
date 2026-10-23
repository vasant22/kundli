// allplanets-decode.mjs — पारंपरिक Special-Transit "All-Planets" chain के openings का research tool.
//
// दोनों captured charts (जन्म-सूर्य, जन्म-मंगल) की chain-rows (HH:MM-सहित, screenshots से) पर
// हर opening के समय गोचर-ग्रह की चाल + चारों frames पर rv निकालता है (nearest branch),
// और ±12h display-shift variants भी। मक़सद: per-pair opening-lines decode करना।
//
// चलाएँ:  node scripts/bnn-calib/allplanets-decode.mjs
// पूरा ब्यौरा: docs/pcp-research.md §5–§6 (capture-gaps व open items वहीं)।
import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'

const swe = new SwissEph(); await swe.initSwissEph()
const k = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
const NATAL = {}; k.planets.forEach((p) => { NATAL[p.key] = p.longitude })

const CONST = { sun: 'SE_SUN', moon: 'SE_MOON', mars: 'SE_MARS', mercury: 'SE_MERCURY', jupiter: 'SE_JUPITER', venus: 'SE_VENUS', saturn: 'SE_SATURN', rahu: 'SE_MEAN_NODE', ketu: 'SE_MEAN_NODE' }
function bodyAt(key, ms) {
  const d = new Date(ms)
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
  const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour)
  const jdt = jd + swe.deltat(jd) + 0.5 / 86400
  const r = swe.calc_ut(jdt, swe[CONST[key]], swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED)
  let lon = r[0]; if (key === 'ketu') lon += 180
  return { lon: ((lon % 360) + 360) % 360, speed: r[3] }
}
const msOf = (dd, mm, yyyy, HH, MM) => Date.UTC(yyyy, mm - 1, dd, HH - 5, MM - 30) // IST
const near = (x) => ((x % 360) + 540) % 360 - 180

// reference chain-rows (screenshots: .openclaw-tmp/bnn-ref/pcp/allplanets-{sun,mars}-{1,2}.png)
const EV = [
  ['sun', 'ketu', '14-10-2026 07:20'], ['sun', 'venus', '26-10-2026 00:56'], ['sun', 'moon', '02-11-2026 04:32'],
  ['sun', 'rahu', '30-11-2026 04:32'], ['sun', 'jupiter', '24-12-2026 10:56'], ['sun', 'mars', '01-01-2027 15:20'],
  ['sun', 'saturn', '07-01-2027 12:32'], ['sun', 'sun', '19-01-2027 00:32'], ['sun', 'mercury', '23-01-2027 21:20'],
  ['sun', 'mars', '01-03-2027 19:27'], ['sun', 'saturn', '07-03-2027 18:39'], ['sun', 'mars', '02-09-2028 23:03'],
  ['sun', 'saturn', '09-09-2028 03:27'], ['sun', 'sun', '21-09-2028 03:51'], ['sun', 'mercury', '26-09-2028 05:03'],
  ['sun', 'moon', '27-09-2028 01:27'], ['sun', 'ketu', '30-09-2028 15:27'], ['sun', 'venus', '25-10-2028 13:03'],
  ['sun', 'moon', '01-11-2028 17:03'], ['sun', 'rahu', '29-11-2028 16:39'],
  ['mars', 'rahu', '14-10-2026 07:27'], ['mars', 'venus', '02-12-2026 11:43'], ['mars', 'jupiter', '29-12-2026 15:27'],
  ['mars', 'venus', '26-01-2027 21:19'], ['mars', 'rahu', '31-01-2027 19:11'], ['mars', 'moon', '20-02-2027 20:15'],
  ['mars', 'rahu', '01-04-2027 19:43'], ['mars', 'venus', '21-05-2027 01:35'], ['mars', 'venus', '05-09-2027 23:27'],
  ['mars', 'moon', '16-09-2027 17:03'], ['mars', 'rahu', '26-10-2027 23:59'], ['mars', 'jupiter', '29-11-2027 04:47'],
  ['mars', 'mars', '10-12-2027 02:39'], ['mars', 'saturn', '17-12-2027 21:19'], ['mars', 'sun', '01-01-2028 22:23'],
  ['mars', 'mercury', '08-01-2028 05:51'], ['mars', 'ketu', '09-01-2028 06:55'],

// ——— दौर-2 captures (2026-10-15, user): सूर्य-चार्ट 20-01-2027 → 02-09-2028 की पूरी chain ————
  ['sun', 'ketu', '24-01-2027 16:40'], ['sun', 'venus', '21-02-2027 12:16'], ['sun', 'jupiter', '28-02-2027 14:40'],
  ['sun', 'jupiter', '01-03-2027 11:04'], ['sun', 'mars', '01-03-2027 19:28'], ['sun', 'saturn', '07-03-2027 18:40'],
  ['sun', 'moon', '19-03-2027 12:16'], ['sun', 'rahu', '28-03-2027 21:28'], ['sun', 'jupiter', '22-04-2027 23:52'],
  ['sun', 'mars', '01-05-2027 13:28'], ['sun', 'saturn', '07-05-2027 17:52'], ['sun', 'sun', '19-05-2027 21:04'],
  ['sun', 'mercury', '25-05-2027 00:40'], ['sun', 'ketu', '25-05-2027 21:28'], ['sun', 'venus', '24-06-2027 08:16'],
  ['sun', 'sun', '01-07-2027 19:52'], ['sun', 'mercury', '26-07-2027 20:16'], ['sun', 'moon', '27-07-2027 17:04'],
  ['sun', 'rahu', '31-07-2027 09:28'], ['sun', 'venus', '26-08-2027 01:52'], ['sun', 'jupiter', '02-09-2027 11:04'],
  ['sun', 'mars', '03-09-2027 16:40'], ['sun', 'saturn', '09-09-2027 21:04'], ['sun', 'sun', '21-09-2027 21:28'],
  ['sun', 'mercury', '26-09-2027 23:04'], ['sun', 'moon', '27-09-2027 19:04'], ['sun', 'ketu', '01-10-2027 09:28'],
  ['sun', 'venus', '26-10-2027 07:04'], ['sun', 'moon', '02-11-2027 10:40'], ['sun', 'rahu', '30-11-2027 10:40'],
  ['sun', 'jupiter', '24-12-2027 17:04'], ['sun', 'mars', '01-01-2028 21:28'], ['sun', 'saturn', '07-01-2028 18:40'],
  ['sun', 'sun', '19-01-2028 06:40'], ['sun', 'mercury', '24-01-2028 03:28'], ['sun', 'ketu', '24-01-2028 22:40'],
  ['sun', 'venus', '21-02-2028 18:16'], ['sun', 'jupiter', '28-02-2028 20:40'], ['sun', 'mars', '01-03-2028 01:28'],
  ['sun', 'saturn', '07-03-2028 01:04'], ['sun', 'moon', '18-03-2028 18:40'], ['sun', 'rahu', '28-03-2028 03:28'],
  ['sun', 'jupiter', '22-04-2028 06:16'], ['sun', 'mars', '30-04-2028 19:52'], ['sun', 'saturn', '07-05-2028 00:16'],
  ['sun', 'sun', '19-05-2028 03:28'], ['sun', 'mercury', '24-05-2028 07:04'], ['sun', 'ketu', '25-05-2028 03:28'],
  ['sun', 'venus', '23-06-2028 14:16'], ['sun', 'sun', '01-07-2028 02:16'], ['sun', 'mercury', '26-07-2028 02:16'],
  ['sun', 'moon', '26-07-2028 23:04'], ['sun', 'rahu', '30-07-2028 15:28'], ['sun', 'venus', '25-08-2028 07:52'],
  ['sun', 'jupiter', '01-09-2028 17:28'],
]

console.log('NATAL:', Object.entries(NATAL).map(([a, b]) => a + '=' + b.toFixed(3)).join(' '))
console.log('\nbirth transit time                 spd      rv on N-chart frames (1-5-7-9)        | ±12h rv (trigger frame)')
for (const [b, t, when] of EV) {
  const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/.exec(when)
  const ms = msOf(+m[1], +m[2], +m[3], +m[4], +m[5])
  const r = bodyAt(t, ms)
  const base = NATAL[b]
  const rvOf = (vms) => {
    const rr = bodyAt(t, vms)
    return [0, 120, 180, 240].map((add) => {
      const pt = (base + add) % 360
      return near(rr.lon - pt)
    })
  }
  const f = rvOf(ms)
  const fm = rvOf(ms - 43200000)
  const fp = rvOf(ms + 43200000)
  // trigger-frame = |rv| जिसमें सबसे कम (chain-decode वही करता आया है)
  let bi = 0; for (let i = 1; i < 4; i++) if (Math.abs(f[i]) < Math.abs(f[bi])) bi = i
  console.log(
    b.padEnd(4) + '×' + t.padEnd(7) + ' ' + when + ' ' + r.speed.toFixed(3).padStart(7) + '  ' +
    f.map((x) => x.toFixed(2).padStart(7)).join(' ') + '  | ' +
    fm[bi].toFixed(2) + ' / ' + fp[bi].toFixed(2) + '   (frame ' + [1, 5, 7, 9][bi] + ')'
  )
}
console.log('\nDONE-ALLPLANETS-DECODE  (विस्तार: docs/pcp-research.md §6)')
