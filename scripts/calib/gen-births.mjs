// scripts/calib/gen-births.mjs — SCRATCH calibration helper (not part of the app).
// Scans year 1995 hourly at Varanasi and picks birth datetimes whose Moon is
// closest to given target longitudes (so birth details can drive a reference
// calculator to exercise specific nakshatra/rashi combinations).
import { writeFileSync } from 'node:fs'
import { initEphemeris, computeKundli } from '../../src/astro.js'

const LAT = 25.31668
const LON = 83.01041
const TZ_OFFSET_HOURS = 5.5

const NAK = 360 / 27
const center = (n) => (n - 0.5) * NAK

const targets = []
// 27 nakshatra centers (+ split portions for the four nakshatras that straddle a rashi boundary)
for (let n = 1; n <= 27; n++) targets.push({ label: `nak${String(n).padStart(2, '0')}`, lon: center(n) })
// Krittika (3): Mesha portion / Vrishabha portion
targets.push({ label: 'nak03_mesha', lon: 28.5 })
targets.push({ label: 'nak03_vrishabha', lon: 37 })
// Punarvasu (7): Mithuna / Karka portions
targets.push({ label: 'nak07_mithuna', lon: 85 })
targets.push({ label: 'nak07_karka', lon: 91.7 })
// Uttara Ashadha (21): Dhanu / Makar portions
targets.push({ label: 'nak21_dhanu', lon: 268.4 })
targets.push({ label: 'nak21_makar', lon: 275 })
// Dhanishtha (23): Makar / Kumbha portions
targets.push({ label: 'nak23_makar', lon: 296.7 })
targets.push({ label: 'nak23_kumbha', lon: 305 })
// Vashya half-sign targets (Dhanu 1st/2nd half, Makar 1st/2nd half)
targets.push({ label: 'half_dhanu1', lon: 247.5 })
targets.push({ label: 'half_dhanu2', lon: 262.5 })
targets.push({ label: 'half_makar1', lon: 277.5 })
targets.push({ label: 'half_makar2', lon: 292.5 })

const swe = await initEphemeris()

const best = {}
const startMs = Date.UTC(1995, 0, 1)
const endMs = Date.UTC(1996, 0, 1)
for (let t = startMs; t < endMs; t += 3600 * 1000) {
  const d = new Date(t)
  const utc = {
    year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
    hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: 0,
  }
  const k = computeKundli(swe, { utc, latitude: LAT, longitude: LON })
  if (k.error) continue
  const moon = k.planets.find((p) => p.key === 'moon')
  for (const target of targets) {
    const diff = Math.abs(moon.longitude - target.lon)
    const dist = Math.min(diff, 360 - diff)
    if (!best[target.label] || dist < best[target.label].dist) {
      best[target.label] = { dist, utc, moonLon: moon.longitude, rashi: moon.rashi, nak: moon.nakshatra, pada: moon.pada }
    }
  }
}

const out = {}
for (const target of targets) {
  const b = best[target.label]
  const utcMs = Date.UTC(b.utc.year, b.utc.month - 1, b.utc.day, b.utc.hour, b.utc.minute)
  const localMs = utcMs + TZ_OFFSET_HOURS * 3600 * 1000
  const l = new Date(localMs)
  out[target.label] = {
    local: {
      day: l.getUTCDate(), month: l.getUTCMonth() + 1, year: l.getUTCFullYear(),
      hrs: l.getUTCHours(), min: l.getUTCMinutes(), sec: 0,
    },
    moonLon: Number(b.moonLon.toFixed(3)),
    rashi: b.rashi, nak: b.nak, pada: b.pada,
    dist: Number(b.dist.toFixed(3)),
  }
}

writeFileSync(new URL('./births.json', import.meta.url), JSON.stringify(out, null, 2))
console.log('Wrote births.json')
for (const [k, v] of Object.entries(out)) {
  console.log(k, JSON.stringify(v.local), `moon=${v.moonLon} rashi=${v.rashi} nak=${v.nak} dist=${v.dist}`)
}
