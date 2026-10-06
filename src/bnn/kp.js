// kp.js — KP New ayanamsa + Bhava Chalit for the BNN chart (Phase 2).
//
// Calibration (2026-10-07, see docs/bnn-calib-findings.md):
//  • Ayanamsa = sweph sidereal mode 44 — name string in the wasm package:
//    "Lahiri VP285"; value at the reference chart (22-01-1980): 23°35'06".
//    Only built-in that reproduces the reference within ~1′ (the
//    KP/Krishnamurti built-ins are 5–7′ away).
//  • Houses: the old software's bhava cusps equal Placidus computed at
//    UT + ΔT (+50.6 s for 1980 — matches ΔT exactly). See BNN_SETTINGS
//    .housesAtDeltaT. With both, every reference value is within ~0.9′.
//
// Guide refs: भाग 2 "भावचलित" + R9 — Placidus cusps with this ayanamsa;
// house n runs from cusp n to cusp n+1; the drawn chart stays the Lagna
// (rashi) chart, while every table is computed from this placement.
//
// Calibration scripts: scripts/bnn-calib/ (check · fit · diag · final).
import { describeLongitude, RASHI_LORDS } from '../astro.js'

export const BNN_SETTINGS = Object.freeze({
  // swisseph sidereal-mode id — reference-matched (docs/bnn-calib-findings.md §1–2).
  ayanamsaMode: 44,
  // The old software's cusps = Placidus at UT + ΔT (findings §3).
  housesAtDeltaT: true,
})

// The grahas, same order as the main app (Rahu/Ketu appended around the node).
const GRAHAS = [
  { key: 'sun', name: 'Sun', short: 'Su', constName: 'SE_SUN' },
  { key: 'moon', name: 'Moon', short: 'Mo', constName: 'SE_MOON' },
  { key: 'mars', name: 'Mars', short: 'Ma', constName: 'SE_MARS' },
  { key: 'mercury', name: 'Mercury', short: 'Me', constName: 'SE_MERCURY' },
  { key: 'jupiter', name: 'Jupiter', short: 'Ju', constName: 'SE_JUPITER' },
  { key: 'venus', name: 'Venus', short: 'Ve', constName: 'SE_VENUS' },
  { key: 'saturn', name: 'Saturn', short: 'Sa', constName: 'SE_SATURN' },
]

const norm = (x) => ((x % 360) + 360) % 360

/** Set the BNN ayanamsa on a Swiss-Ephemeris instance (call before calc). */
export function setBnnAyanamsa(swe) {
  swe.set_sid_mode(BNN_SETTINGS.ayanamsaMode, 0, 0)
}

/**
 * Bhava-chalit frame + planet positions for the BNN chart.
 * @param {object} swe — initialised SwissEph instance.
 * @param {object} utc — { year, month, day, hour, minute, second } (UT).
 * @param {object} place — { latitude, longitude }.
 * @returns {{ jd, ayanamsa, cusps, ascendant, planets, tithiIndex, yogaIndex }}
 *   cusps: 12 entries { n, longitude, rashi, degInSign, … } (Placidus, KP New).
 *   planets: 9 entries; each also carries `bhava` (1–12, from the cusp ranges).
 */
export function computeBhavaChalit(swe, utc, place) {
  setBnnAyanamsa(swe)
  const hourDecimal = utc.hour + utc.minute / 60 + utc.second / 3600
  const jd = swe.julday(utc.year, utc.month, utc.day, hourDecimal)
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED

  // Placidus cusps (sidereal). The old software's cusps sit at UT + ΔT plus a
  // ~+0.5 s fine-tune (verified so every displayed arcminute matches its face;
  // docs/bnn-calib-findings.md §3 · scripts/bnn-calib/chart-texts.mjs).
  const jdHouses = BNN_SETTINGS.housesAtDeltaT ? jd + swe.deltat(jd) + 0.5 / 86400 : jd
  const h = swe.houses_ex(jdHouses, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL, place.latitude, place.longitude, 'P')
  const cusps = []
  for (let i = 1; i <= 12; i++) {
    cusps.push({
      n: i,
      ...describeLongitude(h.cusps[i], 0, { key: `cusp${i}`, name: `Cusp ${i}`, short: String(i) }),
    })
  }
  const ascendant = { ...cusps[0], key: 'asc', name: 'Ascendant', short: 'Asc' }

  const planets = GRAHAS.map((g) => {
    const r = swe.calc_ut(jd, swe[g.constName], flags)
    return describeLongitude(r[0], r[3], g)
  })
  const node = swe.calc_ut(jd, swe.SE_MEAN_NODE, flags)
  planets.push(
    describeLongitude(node[0], node[3], { key: 'rahu', name: 'Rahu', short: 'Ra' }),
    describeLongitude(node[0] + 180, node[3], { key: 'ketu', name: 'Ketu', short: 'Ke' })
  )

  // Bhava of each planet: house n = from cusp n to cusp n+1 (cusp values may
  // wrap through 0°, hence the +360 normalisation on both sides).
  const bhavaOf = (lon) => {
    for (let i = 0; i < 12; i++) {
      let a = cusps[i].longitude
      let b = cusps[(i + 1) % 12].longitude
      if (b <= a) b += 360
      let x = lon
      if (x < a) x += 360
      if (x >= a && x < b) return i + 1
    }
    return 12
  }
  for (const p of planets) p.bhava = bhavaOf(p.longitude)

  const sunLon = planets.find((p) => p.key === 'sun').longitude
  const moonLon = planets.find((p) => p.key === 'moon').longitude

  return {
    jd,
    ayanamsa: swe.get_ayanamsa(jd),
    cusps,
    ascendant,
    planets,
    tithiIndex: tithiIndexOf(sunLon, moonLon),
    yogaIndex: yogaIndexOf(sunLon, moonLon),
  }
}

/** Tithi 1–30 from sidereal Sun/Moon longitudes (1–15 शुक्ल, 16–30 कृष्ण). */
export function tithiIndexOf(sunLon, moonLon) {
  return Math.floor(norm(moonLon - sunLon) / 12) + 1
}

/** Yoga 1–27 from sidereal Sun+Moon longitudes. */
export function yogaIndexOf(sunLon, moonLon) {
  return Math.floor(norm(sunLon + moonLon) / (360 / 27)) + 1
}

/**
 * R6 parivartana pairs: two planets sitting in each other's sign
 * (owner-wise, so Rahu/Ketu can never take part).
 * Returns e.g. [['mercury', 'saturn']].
 */
export function findExchanges(planets) {
  const out = []
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i]
      const b = planets[j]
      if (RASHI_LORDS[a.rashi] === b.key && RASHI_LORDS[b.rashi] === a.key) {
        out.push([a.key, b.key])
      }
    }
  }
  return out
}
