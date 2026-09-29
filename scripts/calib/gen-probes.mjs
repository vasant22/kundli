// scripts/calib/gen-probes.mjs — find births where Mars sits in the 2nd (or
// 10th) house from the Lagna while it is NOT in a dosha house from the Moon —
// to pin down AstroSage's exact lagna house set.
import { initEphemeris, computeKundli, RASHI_LORDS } from '../../src/astro.js'

const LAT = 25.31668
const LON = 83.01041
const S_M = [1, 4, 7, 8, 12]

const swe = await initEphemeris()

const found = {}
const wanted = [2, 10] // houses from lagna to probe
for (let t = Date.UTC(1995, 0, 1); t < Date.UTC(1996, 6, 1); t += 3600 * 1000) {
  const d = new Date(t)
  const utc = {
    year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
    hour: d.getUTCHours(), minute: 0, second: 0,
  }
  const k = computeKundli(swe, { utc, latitude: LAT, longitude: LON })
  if (k.error) continue
  const mars = k.planets.find((p) => p.key === 'mars')
  const moon = k.planets.find((p) => p.key === 'moon')
  const marsFromMoon = ((mars.rashi - moon.rashi + 12) % 12) + 1
  if (S_M.includes(marsFromMoon)) continue
  for (const H of wanted) {
    if (found[H]) continue
    const lagnaTarget = (mars.rashi - (H - 1) + 144) % 12
    if (k.ascendant.rashi === lagnaTarget) {
      // IST local time = utc + 5:30
      const l = new Date(t + 5.5 * 3600 * 1000)
      found[H] = {
        label: `probe_lagna${H}`,
        local: { day: l.getUTCDate(), month: l.getUTCMonth() + 1, year: l.getUTCFullYear(), hrs: l.getUTCHours(), min: l.getUTCMinutes(), sec: 0 },
        marsRashi: mars.rashi, marsHouseLagna: H, marsFromMoon,
        moonRashi: moon.rashi, lagnaRashi: k.ascendant.rashi,
      }
    }
  }
  if (found[2] && found[10]) break
}

console.log(JSON.stringify(found, null, 2))
