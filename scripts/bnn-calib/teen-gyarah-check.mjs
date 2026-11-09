// teen-gyarah-check.mjs — राउंड 66 / टास्क 10: 3-11 और राहु-केतु मध्य बिंदु की
// जाँच सर के software की 16 कुंडलियों से (अपेक्षित परिणाम TASK.md में)।
import { initEphemeris } from '../../src/astro.js'
import { computeBhavaChalit } from '../../src/bnn/kp.js'
import { seatPositions } from '../../src/bnn/combos.js'
import { wallTimeToUtc } from '../../src/timeutil.js'

const swe = await initEphemeris()
const P = { Boisar: [19.8036, 72.756], Gwalior: [26.2298, 78.1734], Mumbai: [19.076, 72.8777], Mapuca: [15.5937, 73.8142], Pune: [18.5204, 73.8567], Varanasi: [25.3176, 82.9739], Jaipur: [26.9124, 75.7873], Bhopal: [23.2599, 77.4126], Nagpur: [21.1458, 79.0882] }
const C = [
  [1, '13-11-1997', '19:45', 'Boisar', 'm'], [2, '11-06-1985', '05:15', 'Gwalior', 'm'], [3, '12-04-1989', '15:05', 'Mumbai', 'm'],
  [4, '03-10-1996', '11:30', 'Mapuca', 'f'], [5, '18-08-1992', '09:12', 'Pune', 'm'], [6, '18-07-1975', '09:06', 'Varanasi', 'm'],
  [7, '09-07-1970', '20:57', 'Jaipur', 'm'], [8, '25-03-1969', '05:54', 'Jaipur', 'm'], [9, '27-09-1986', '16:20', 'Jaipur', 'm'],
  [10, '20-05-1965', '02:52', 'Jaipur', 'm'], [11, '27-07-1969', '05:21', 'Bhopal', 'm'], [12, '05-10-1984', '00:29', 'Nagpur', 'm'],
  [13, '06-12-1978', '05:07', 'Bhopal', 'm'], [14, '08-05-1978', '05:39', 'Pune', 'm'], [15, '24-06-1980', '23:13', 'Jaipur', 'm'],
  [16, '14-05-1964', '10:38', 'Pune', 'm'],
]
const SEVEN = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']
const ORD = { m: ['jupiter', 'sun', 'moon', 'mars', 'mercury', 'venus', 'saturn', 'rahu', 'ketu'], f: ['venus', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'saturn', 'rahu', 'ketu'] }
const SH = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' }
const norm = (x) => ((x % 360) + 360) % 360
const fmt = (d) => { const g = Math.floor(d / 30), r = d - g * 30; let dd = Math.floor(r), mm = Math.round((r - dd) * 60); if (mm === 60) { dd++; mm = 0; } return ['मेष', 'वृष', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन'][g] + ' ' + dd + '°' + String(mm).padStart(2, '0') + '′' }

function chart(dmy, hm, place) {
  const [d, m, y] = dmy.split('-').map(Number)
  const [h, mi] = hm.split(':').map(Number)
  const utc = wallTimeToUtc({ year: y, month: m, day: d, hour: h, minute: mi, second: 0 }, '+05:30').utc
  return computeBhavaChalit(swe, utc, { latitude: P[place][0], longitude: P[place][1] })
}

function r311(planets, mode, order) {
  const seats = seatPositions(planets, mode)
  const out = {}
  for (const p of planets) out[p.key] = []
  for (const a of SEVEN) {
    for (const b of SEVEN) {
      if (a === b) continue
      const d = norm(seats[b].lon - seats[a].lon)
      let side = 0, gap = 0
      if (d >= 57 && d <= 63) { side = 3; gap = Math.abs(d - 60) }
      else if (d >= 297 && d <= 303) { side = 11; gap = Math.abs(360 - d - 60) }
      if (side) out[a].push({ key: b, gap, side, deg: seats[b].degInSign })
    }
    out[a].sort((x, y) => (y.deg - x.deg) || (order.indexOf(x.key) - order.indexOf(y.key)))
  }
  return out
}

function mid(planets, mode, order) {
  const seats = seatPositions(planets, mode)
  const rahu = planets.find((p) => p.key === 'rahu').longitude
  const pts = [norm(rahu + 90), norm(rahu + 270)]
  const mem = []
  for (const k of SEVEN) {
    let bestGap = 999
    for (const pt of pts) { let d = Math.abs(norm(seats[k].lon - pt)); if (d > 180) d = 360 - d; if (d < bestGap) bestGap = d }
    if (bestGap <= 3) mem.push({ key: k, gap: bestGap, deg: seats[k].degInSign })
  }
  mem.sort((x, y) => order.indexOf(x.key) - order.indexOf(y.key))
  return { pts, mem }
}

for (const [n, dmy, hm, place, g] of C) {
  const b = chart(dmy, hm, place)
  const order = ORD[g]
  const ap = r311(b.planets, 'AP', order), bp = r311(b.planets, 'BP', order)
  const ma = mid(b.planets, 'AP', order), mb = mid(b.planets, 'BP', order)
  const ff = (t) => SEVEN.filter((k) => t[k].length).map((k) => SH[k] + '→' + t[k].map((e) => SH[e.key] + (e.side === 3 ? '³' : '¹¹')).join(' ')).join(' ; ') || '—'
  console.log('\n#' + n + ' ' + dmy + ' ' + hm + ' ' + place + (g === 'f' ? ' (स्त्री)' : ''))
  console.log('  AP 3-11: ' + ff(ap))
  console.log('  BP 3-11: ' + ff(bp))
  console.log('  midpoint AP: ' + (ma.mem.map((e) => SH[e.key]).join(' . ') || '—') + '  [' + ma.mem.map((e) => SH[e.key] + ' ' + e.gap.toFixed(2) + '°').join(', ') + '] points ' + ma.pts.map(fmt).join(' · '))
  console.log('  midpoint BP: ' + (mb.mem.map((e) => SH[e.key]).join(' . ') || '—') + '  [' + mb.mem.map((e) => SH[e.key] + ' ' + e.gap.toFixed(2) + '°').join(', ') + ']')
}

// हर कुंडली के वक्री-चिह्न (पेटी में '#' के लिए)
console.log('\n=== वक्री ===')
for (const [n, dmy, hm, place] of C) {
  const b = chart(dmy, hm, place)
  console.log('#' + n + ' ' + SEVEN.map((k) => SH[k] + (b.planets.find((p) => p.key === k).retro ? '#' : '')).join(' '))
}
