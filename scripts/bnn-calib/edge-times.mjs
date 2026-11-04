// अस्थायी: राउंड 65 baseline-r65 के लिए edge-समय ढूँढना (काम ख़त्म होने पर हटेगी)
import { initEphemeris } from '../src/astro.js'
import { computeBhavaChalit } from '../src/bnn/kp.js'
import { wallTimeToUtc } from '../src/timeutil.js'

const swe = await initEphemeris()
const utcOf = (ms) => { const d = new Date(ms); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds() } }
function fmt(h) { const t = Math.round(h * 60), s = t < 0 ? '-' : '+', a = Math.abs(t); return s + String(Math.floor(a / 60)).padStart(2, '0') + ':' + String(a % 60).padStart(2, '0') }
const wallToMs = (wall, offH) => { const r = wallTimeToUtc(wall, fmt(offH)).utc; return Date.UTC(r.year, r.month - 1, r.day, r.hour, r.minute, r.second) }
const ascAt = (ms, place) => computeBhavaChalit(swe, utcOf(ms), place).cusps[0].longitude
const FLAGS = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED
const C = { sun: 'SE_SUN', moon: 'SE_MOON', mars: 'SE_MARS', mercury: 'SE_MERCURY', jupiter: 'SE_JUPITER', venus: 'SE_VENUS', saturn: 'SE_SATURN' }
function bodyAt(ms, key) {
  const u = utcOf(ms)
  const jd = swe.julday(u.year, u.month, u.day, u.hour + u.minute / 60 + u.second / 3600)
  const r = swe.calc_ut(jd, swe[C[key]], FLAGS)
  return ((r[0] % 360) + 360) % 360
}
const diff = (x, t) => { let d = x - t; while (d > 180) d -= 360; while (d < -180) d += 360; return d }
const SHOWIST = (ms) => new Date(ms + 5.5 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' IST'

// fn का लक्ष्य-पार खोजो: पहले दर निकालो, फिर सीधे पहुँचकर 1-सेकंड तक सटीक करो
function crossing(fn, guessMs, target, beforeSec = 1) {
  let t = guessMs
  for (let it = 0; it < 6; it++) {                 // दर बदलती है, इसलिए दो-तीन बार सुधारो
    const rate = diff(fn(t + 600000), fn(t)) / 600 // डिग्री/सेकंड
    const need = diff(target, fn(t))
    t = t + Math.round(need / rate) * 1000
    if (Math.abs(need) < 1e-6) break
  }
  const rate = diff(fn(t + 600000), fn(t)) / 600
  // ±300 सेकंड में पार खोजो (5 सेकंड क़दम)
  let pair = null
  for (let s = -1800; s <= 1800; s += 15) {
    const a = t + (s - 15) * 1000, b = t + s * 1000
    const da = diff(fn(a), target), db = diff(fn(b), target)
    if (da < 0 && db >= 0 && db < 1) { pair = [a, b]; break }
  }
  if (!pair) return null
  let lo = pair[0], hi = pair[1]
  for (let i = 0; i < 40; i++) { const mid = Math.floor((lo + hi) / 2); if (diff(fn(mid), target) < 0) lo = mid; else hi = mid }
  // सीमा पार का पहला सेकंड = hi; उससे पहले वाला सेकंड चुनो जो लक्ष्य के सबसे नज़दीक हो
  let best = null
  for (let s = 1; s <= Math.max(6, beforeSec + 6); s++) {
    const ms = hi - s * 1000
    const gap = -diff(fn(ms), target)
    if (gap > 0 && (!best || gap < best.gap)) best = { ms, gap }
  }
  return best
}

const betul = { latitude: 21.9006, longitude: 77.9023 }
const pune = { latitude: 18.5196, longitude: 73.8554 }

// क) लग्न-संधि — बेतूल, 19-07-1997 सुबह
{
  const g = wallToMs({ year: 1997, month: 7, day: 19, hour: 6, minute: 30, second: 0 }, 5.5)
  const asc = ascAt(g, betul)
  const target = Math.floor(asc / 30) * 30 + 30
  const r = crossing((ms) => ascAt(ms, betul), g, target)
  console.log('क) लग्न अभी', asc.toFixed(4), 'लक्ष्य', target, '→', r && SHOWIST(r.ms), 'सीमा से पहले', r && r.gap.toFixed(6), 'डिग्री')
}
// ख) चंद्र की राशि-संधि — पुणे, 14-03-2009 शाम
{
  const g = wallToMs({ year: 2009, month: 3, day: 14, hour: 20, minute: 0, second: 0 }, 5.5)
  const m = bodyAt(g, 'moon')
  const target = Math.floor(m / 30) * 30 + 30
  const r = crossing((ms) => bodyAt(ms, 'moon'), g, target)
  console.log('ख) चंद्र अभी', m.toFixed(4), 'लक्ष्य', target, '→', r && SHOWIST(r.ms), 'पहले', r && r.gap.toFixed(6))
}
// ग) दशा-संधि: चंद्र नक्षत्र के अंत से ठीक पहले — बेतूल, 07-02-2004 सुबह
{
  const g = wallToMs({ year: 2004, month: 2, day: 7, hour: 9, minute: 0, second: 0 }, 5.5)
  const m = bodyAt(g, 'moon')
  const NAK = 360 / 27
  const target = Math.floor(m / NAK) * NAK + NAK
  const r = crossing((ms) => bodyAt(ms, 'moon'), g, target)
  console.log('ग) चंद्र', m.toFixed(4), 'नक्षत्र-अंत', target.toFixed(4), '→', r && SHOWIST(r.ms), 'पहले', r && r.gap.toFixed(6), 'डिग्री')
}
// घ) वक्री ग्रह: किस दिन सबसे ज़्यादा ग्रह वक्री हैं
{
  let best = null
  for (let y = 1975; y <= 2035; y += 1) {
    for (const [mo, d] of [[3, 20], [7, 20], [11, 20]]) {
      const g = wallToMs({ year: y, month: mo, day: d, hour: 12, minute: 0, second: 0 }, 5.5)
      const u = utcOf(g)
      const jd = swe.julday(u.year, u.month, u.day, u.hour + u.minute / 60)
      const retro = ['mars', 'mercury', 'jupiter', 'venus', 'saturn'].filter((k) => swe.calc_ut(jd, swe[C[k]], FLAGS)[3] < 0)
      if (retro.length >= 4) { best = { y, mo, d, retro }; break }
    }
    if (best) break
  }
  console.log('घ) 4+ वक्री:', JSON.stringify(best))
}
