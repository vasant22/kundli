// astro.js — Vedic (sidereal) calculations with the Swiss Ephemeris WASM.
// Phase 5: Lahiri ayanamsa, whole-sign houses, mean Rahu (True Node optional).
// Returns ONE clean data object that both North & South Indian charts (Phase 7)
// are drawn from.
import SwissEph from 'swisseph-wasm'

// The grahas we calculate (Rahu/Ketu are added around the node).
const GRAHAS = [
  { key: 'sun', name: 'Sun', short: 'Su', constName: 'SE_SUN' },
  { key: 'moon', name: 'Moon', short: 'Mo', constName: 'SE_MOON' },
  { key: 'mars', name: 'Mars', short: 'Ma', constName: 'SE_MARS' },
  { key: 'mercury', name: 'Mercury', short: 'Me', constName: 'SE_MERCURY' },
  { key: 'jupiter', name: 'Jupiter', short: 'Ju', constName: 'SE_JUPITER' },
  { key: 'venus', name: 'Venus', short: 'Ve', constName: 'SE_VENUS' },
  { key: 'saturn', name: 'Saturn', short: 'Sa', constName: 'SE_SATURN' },
]

const ASC_DEF = { key: 'asc', name: 'Ascendant', short: 'Asc' }

// Rashi (0 = Mesha/Aries … 11 = Meena/Pisces) → ruling graha key.
export const RASHI_LORDS = [
  'mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
  'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter',
]

// Load the WASM engine and set Lahiri sidereal mode. Call once; reuse `swe`.
export async function initEphemeris() {
  const swe = new SwissEph()
  await swe.initSwissEph()
  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0)
  return swe
}

// A raw longitude + speed → the fields every chart needs.
// (Pure helper, exported for tests; also used for the Ascendant itself.)
export function describeLongitude(longitude, speed, def) {
  // Normalise to 0–360 while preserving precision (important for values that
  // land exactly ON a sign/nakshatra boundary — see tests).
  let lon = longitude % 360
  if (lon < 0) lon += 360
  const rashi = Math.floor(lon / 30) % 12
  const degInSign = lon - rashi * 30
  const NAK = 360 / 27 // 13°20' each
  const PADA = 360 / 108 // 3°20' each
  const nakshatra = Math.floor(lon / NAK) + 1 // 1..27
  const pada = Math.floor((lon - (nakshatra - 1) * NAK) / PADA) + 1 // 1..4
  return {
    key: def.key,
    name: def.name,
    short: def.short,
    longitude: lon,
    rashi, // 0-11 (0 = Mesha/Aries) — the UI adds +1 for display
    degInSign, // 0..30
    nakshatra, // 1..27
    pada, // 1..4
    speed,
    retro: speed < 0,
    rashiLord: RASHI_LORDS[rashi],
  }
}

// Compute the full kundli data object.
// birth: { utc: {year,month,day,hour,minute,second}, latitude, longitude,
//          nodeType?: 'mean' | 'true' }
export function computeKundli(swe, birth) {
  const u = birth.utc
  const hourDecimal = u.hour + u.minute / 60 + u.second / 3600
  const jd = swe.julday(u.year, u.month, u.day, hourDecimal)
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED

  // Ascendant + whole-sign house frame. Near the poles this can fail.
  let ascLon = NaN
  try {
    const h = swe.houses_ex(
      jd,
      swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL,
      birth.latitude,
      birth.longitude,
      'W'
    )
    ascLon = h.ascmc[0]
  } catch (err) {
    console.error('House calculation failed:', err)
  }
  if (!Number.isFinite(ascLon)) return { error: 'polar' }

  const ascendant = { ...describeLongitude(ascLon, 0, ASC_DEF), house: 1 }
  const ascRashi = ascendant.rashi

  // Whole-sign houses: the house number simply counts rashis from the lagna.
  const withHouse = (body) => ({ ...body, house: ((body.rashi - ascRashi + 12) % 12) + 1 })

  const planets = GRAHAS.map((g) => {
    const r = swe.calc_ut(jd, swe[g.constName], flags)
    return withHouse(describeLongitude(r[0], r[3], g))
  })

  // Rahu (mean node by default — True Node optional) and Ketu = Rahu + 180°.
  const nodeIpl = birth.nodeType === 'true' ? swe.SE_TRUE_NODE : swe.SE_MEAN_NODE
  const node = swe.calc_ut(jd, nodeIpl, flags)
  planets.push(withHouse(describeLongitude(node[0], node[3], { key: 'rahu', name: 'Rahu', short: 'Ra' })))
  planets.push(withHouse(describeLongitude(node[0] + 180, node[3], { key: 'ketu', name: 'Ketu', short: 'Ke' })))

  return {
    jd,
    ayanamsa: swe.get_ayanamsa(jd),
    ascendant,
    planets,
  }
}
