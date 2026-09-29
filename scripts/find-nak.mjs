// scripts/find-nak.mjs — scratch helper (NOT part of the app).
// Finds a datetime when the Moon sits in the middle of a target nakshatra,
// so the same birth details can be cross-checked on reference sites.
// Usage: node scripts/find-nak.mjs 2 7   (nakshatra numbers, 1..27)
import { initEphemeris, computeKundli } from '../src/astro.js'

const targets = process.argv.slice(2).map((s) => {
  const [nak, rashi] = s.split(':').map(Number)
  return { nak, rashi: Number.isFinite(rashi) ? rashi : null }
})

const swe = await initEphemeris()

const LAT = 25.31668
const LON = 83.01041
const PLACE = 'Varanasi, India'

// Scan hourly over ~1 year of 1995 for each target: keep the moment with the
// Moon closest to the middle of that nakshatra.
const found = {}
for (let t = Date.UTC(1995, 0, 1, 0, 0, 0); t < Date.UTC(1996, 0, 1); t += 3600 * 1000) {
  const d = new Date(t)
  const utc = {
    year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
    hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: 0,
  }
  const k = computeKundli(swe, { utc, latitude: LAT, longitude: LON })
  if (k.error) continue
  const moon = k.planets.find((p) => p.key === 'moon')
  const span = 360 / 27
  const off = Math.abs(((moon.longitude % span) + span) % span - span / 2) // distance from middle
  for (const target of targets) {
    if (moon.nakshatra === target.nak && (target.rashi === null || moon.rashi === target.rashi)) {
      if (!found[String(target.nak)] || off < found[String(target.nak)].off) {
        found[String(target.nak)] = { off, utc, moonLon: moon.longitude, rashi: moon.rashi, pada: moon.pada }
      }
    }
  }
}

for (const target of targets) {
  const f = found[String(target.nak)]
  if (!f) {
    console.log(`nak ${target}: not found`)
    continue
  }
  const u = f.utc
  console.log(
    `nak ${target.nak}${target.rashi !== null ? '/' + target.rashi : ''}: ${u.year}-${String(u.month).padStart(2, '0')}-${String(u.day).padStart(2, '0')} ` +
      `${String(u.hour).padStart(2, '0')}:${String(u.minute).padStart(2, '0')} UTC at ${PLACE} ` +
      `(Moon lon ${f.moonLon.toFixed(3)}, rashi ${f.rashi}, pada ${f.pada}, centre-offset ${f.off.toFixed(3)}°)`
  )
}
