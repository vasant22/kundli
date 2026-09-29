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

// Navamsa (D9): each 3°20' of a sign maps into the 9-fold division; the
// resulting sign simply continues the zodiac sequence (movable: from the same
// sign, fixed: from the 9th, dual: from the 5th — the running count handles it).
// Returns the navamsa rashi (0-11) and the degree within it (0-30).
export function navamsaOf(longitude) {
  const span = 30 / 9 // 3°20′
  const lon = ((longitude % 360) + 360) % 360
  const rashi = Math.floor(lon / span) % 12
  const degInSign = (lon % span) * 9
  return { rashi, degInSign }
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
  ;(() => {
    const nv = navamsaOf(ascLon)
    ascendant.navamsaRashi = nv.rashi
    ascendant.navamsaDeg = nv.degInSign
  })()
  const ascRashi = ascendant.rashi

  // Whole-sign houses: the house number simply counts rashis from the lagna.
  const withHouse = (body) => ({ ...body, house: ((body.rashi - ascRashi + 12) % 12) + 1 })

  const planets = GRAHAS.map((g) => {
    const r = swe.calc_ut(jd, swe[g.constName], flags)
    const body = withHouse(describeLongitude(r[0], r[3], g))
    const nv = navamsaOf(body.longitude)
    body.navamsaRashi = nv.rashi
    body.navamsaDeg = nv.degInSign
    return body
  })

  // Rahu (mean node by default — True Node optional) and Ketu = Rahu + 180°.
  const nodeIpl = birth.nodeType === 'true' ? swe.SE_TRUE_NODE : swe.SE_MEAN_NODE
  const node = swe.calc_ut(jd, nodeIpl, flags)
  const rahu = withHouse(describeLongitude(node[0], node[3], { key: 'rahu', name: 'Rahu', short: 'Ra' }))
  const ketu = withHouse(describeLongitude(node[0] + 180, node[3], { key: 'ketu', name: 'Ketu', short: 'Ke' }))
  for (const body of [rahu, ketu]) {
    const nv = navamsaOf(body.longitude)
    body.navamsaRashi = nv.rashi
    body.navamsaDeg = nv.degInSign
  }
  planets.push(rahu, ketu)

  // Bhava Chalit (cusp-based houses, Placidus) — for the chalit chart.
  let chalit = null
  try {
    const hp = swe.houses_ex(jd, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL, birth.latitude, birth.longitude, 'P')
    const cusps = []
    for (let i = 1; i <= 12; i++) cusps.push(((hp.cusps[i] % 360) + 360) % 360)
    const houses = {}
    for (const p of planets) {
      let house = 12
      for (let i = 0; i < 12; i++) {
        const a = cusps[i]
        const b = i === 11 ? cusps[0] + 360 : cusps[i + 1]
        let x = p.longitude
        if (x < a) x += 360
        if (x >= a && x < b) {
          house = i + 1
          break
        }
      }
      houses[p.key] = house
    }
    chalit = { houseSigns: cusps.map((c) => Math.floor(c / 30) % 12), houses }
  } catch (err) {
    console.error('Chalit (Placidus) failed:', err)
  }

  return {
    jd,
    ayanamsa: swe.get_ayanamsa(jd),
    ascendant,
    planets,
    chalit,
  }
}

// The Navamsa (D9) chart frame, derived from a D1 kundli — same shape so the
// chart builders can draw it directly.
export function navamsaKundli(kundli) {
  const j = (body) => ({ ...body, rashi: body.navamsaRashi, degInSign: body.navamsaDeg })
  const ascendant = { ...j(kundli.ascendant), house: 1 }
  const ascRashi = ascendant.rashi
  const planets = kundli.planets.map((p) => {
    const q = j(p)
    return { ...q, house: ((q.rashi - ascRashi + 12) % 12) + 1 }
  })
  return { ascendant, planets }
}

// Vimshottari Dasha, from the Moon's nakshatra. Solar year = 365.25 days.
const DASHA_SEQ = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury']
const DASHA_YEARS = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 }
export const YEAR_DAYS = 365.25
const YEAR_MS = YEAR_DAYS * 24 * 3600 * 1000

// Returns 10 mahadashas (first may be partial, then a full cycle) plus the
// antardashas of the period running at `nowMs`.
export function computeVimshottari(moonLon, birthMs, nowMs = Date.now()) {
  const nakSpan = 360 / 27
  const lon = ((moonLon % 360) + 360) % 360
  const nakIndex = Math.floor(lon / nakSpan)
  const frac = (lon % nakSpan) / nakSpan
  const start = nakIndex % 9

  let cursor = birthMs - frac * DASHA_YEARS[DASHA_SEQ[start]] * YEAR_MS
  const mahadashas = []
  for (let n = 0; n < 10; n++) {
    const key = DASHA_SEQ[(start + n) % 9]
    const fullFrom = cursor
    const toMs = fullFrom + DASHA_YEARS[key] * YEAR_MS
    mahadashas.push({ key, fromMs: n === 0 ? birthMs : fullFrom, toMs, fullStartMs: fullFrom })
    cursor = toMs
  }
  let currentIdx = mahadashas.findIndex((m) => nowMs >= m.fromMs && nowMs < m.toMs)
  if (currentIdx === -1) currentIdx = mahadashas.length - 1

  const md = mahadashas[currentIdx]
  const mdYears = DASHA_YEARS[md.key]
  const antardashas = []
  let c = md.fullStartMs
  for (let n = 0; n < 9; n++) {
    const key = DASHA_SEQ[(DASHA_SEQ.indexOf(md.key) + n) % 9]
    const durMs = (mdYears * DASHA_YEARS[key] * YEAR_MS) / 120
    antardashas.push({ key, fromMs: c, toMs: c + durMs })
    c += durMs
  }
  let currentAdIdx = antardashas.findIndex((a) => nowMs >= a.fromMs && nowMs < a.toMs)
  if (currentAdIdx === -1) currentAdIdx = antardashas.length - 1

  return { mahadashas, currentIdx, antardashas, currentAdIdx }
}
