// frame.js — the small helper layer every phal (फलादेश) module sits on.
//
// One computed kundli (see astro.js) is turned into a "frame": whole-sign
// houses, the lordship maps and the planet→house lookups. Nothing here
// computes an ephemeris value — it only reads what computeKundli() returned,
// so the report and the kundli page can never disagree.
//
// House frame (same as the site): whole-sign, house 1 = the lagna's rashi.

import { RASHI_LORDS } from '../astro.js'

export const ALL_KEYS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']
// The seven "physical" grahas (nodes excluded) — used where the classics speak
// of सात ग्रह (karakas, ashtakavarga, kaal-sarpa, …).
export const SEVEN_KEYS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']

// Natural benefics / malefics (BPHS ch.34 & the usual pañcha-dhā table).
export const NATURAL_BENEFICS = ['jupiter', 'venus', 'mercury', 'moon']
export const NATURAL_MALEFICS = ['sun', 'mars', 'saturn', 'rahu', 'ketu']

export const norm360 = (x) => ((x % 360) + 360) % 360

// House number of `rashi` counted from `fromRashi` (1..12).
export function houseOf(rashi, fromRashi) {
  return ((rashi - fromRashi + 12) % 12) + 1
}

// The n-th sign counted from `base` (n = 1 → base itself).
export function signAt(base, n) {
  return (((base + n - 1) % 12) + 12) % 12
}

export function makeFrame(kundli) {
  const byKey = {}
  for (const p of kundli.planets) byKey[p.key] = p
  const lagnaRashi = kundli.ascendant.rashi

  const houseRashi = []
  for (let h = 1; h <= 12; h++) houseRashi.push(signAt(lagnaRashi, h))

  const houseLord = houseRashi.map((r) => RASHI_LORDS[r])

  const owns = {}
  for (const k of ALL_KEYS) owns[k] = []
  for (let h = 1; h <= 12; h++) owns[houseLord[h - 1]].push(h)

  const inHouse = Array.from({ length: 12 }, () => [])
  for (const p of kundli.planets) inHouse[p.house - 1].push(p.key)

  const inRashi = Array.from({ length: 12 }, () => [])
  for (const p of kundli.planets) inRashi[p.rashi].push(p.key)

  const houseOfPlanet = {}
  const rashiOf = {}
  for (const p of kundli.planets) {
    houseOfPlanet[p.key] = p.house
    rashiOf[p.key] = p.rashi
  }

  return {
    kundli,
    byKey,
    lagnaRashi,
    houseRashi,
    houseLord,
    owns,
    inHouse,
    inRashi,
    houseOfPlanet,
    rashiOf,
    // Convenience: the houses owned by a planet (always an array).
    housesOwned: (key) => owns[key] ?? [],
    // Does `key` own any of the given houses?
    ownsAny: (key, houses) => (owns[key] ?? []).some((h) => houses.includes(h)),
    // Planets sitting in a given house (house keys only, nodes included).
    planetsIn: (house) => inHouse[house - 1] ?? [],
    planetsInRashi: (rashi) => inRashi[rashi] ?? [],
    houseFromLagna: (rashi) => houseOf(rashi, lagnaRashi),
    houseFromMoon: (rashi) => houseOf(rashi, byKey.moon.rashi),
    houseFromSun: (rashi) => houseOf(rashi, byKey.sun.rashi),
  }
}

// Is the Moon waxing (शुक्ल पक्ष)? Moon ahead of the Sun by 0–180°.
export function isWaxingMoon(kundli) {
  const sun = kundli.planets.find((p) => p.key === 'sun')
  const moon = kundli.planets.find((p) => p.key === 'moon')
  return norm360(moon.longitude - sun.longitude) < 180
}

// Benefics as *effective* in this chart: Mercury is a benefic unless it sits
// with a natural malefic (a standard qualifier); the Moon counts as a benefic
// in the waxing half only, as a mild malefic when waning.
export function effectiveBenefics(frame) {
  const out = new Set(['jupiter', 'venus'])
  const merc = frame.byKey.mercury
  const mercWithMalefic = NATURAL_MALEFICS.some(
    (k) => k !== 'rahu' && k !== 'ketu' && frame.rashiOf[k] === merc.rashi
  )
  if (!mercWithMalefic) out.add('mercury')
  if (isWaxingMoon(frame.kundli)) out.add('moon')
  return out
}

export function effectiveMalefics(frame) {
  const out = new Set(['sun', 'mars', 'saturn', 'rahu', 'ketu'])
  const merc = frame.byKey.mercury
  const mercWithMalefic = NATURAL_MALEFICS.some(
    (k) => k !== 'rahu' && k !== 'ketu' && frame.rashiOf[k] === merc.rashi
  )
  if (mercWithMalefic) out.add('mercury')
  if (!isWaxingMoon(frame.kundli)) out.add('moon')
  return out
}
