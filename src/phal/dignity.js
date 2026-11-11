// dignity.js — a graha's position-quality (स्थिति): exaltation, moolatrikona,
// own sign, the five-fold friendship (पंचधा मैत्री), combustion (अस्त),
// retrogression (वक्री), vargottama (वर्गोत्तम) and digbala (दिग्बल).
//
// Classical sources: BPHS ch.3 (exaltation / friend-enemy tables),
// BPHS ch.7 (digbala), BPHS ch.34 (combustion orbs). The moolatrikona degrees
// are the ones given in the task sheet and in BPHS ch.3.

import { RASHI_LORDS } from '../astro.js'
import { SEVEN_KEYS, houseOf, norm360 } from './frame.js'

// Deep exaltation point (rashi + degrees). The rashi alone decides the label;
// the degree is kept so the report can show "उच्च (10° पर सर्वोच्च)".
export const EXALTATION = {
  sun: { rashi: 0, deg: 10 },
  moon: { rashi: 1, deg: 3 },
  mars: { rashi: 9, deg: 28 },
  mercury: { rashi: 5, deg: 15 },
  jupiter: { rashi: 3, deg: 5 },
  venus: { rashi: 11, deg: 27 },
  saturn: { rashi: 6, deg: 20 },
  rahu: { rashi: 1, deg: 20 }, // परवर्ती (BPHS ch.3 does not give the nodes)
  ketu: { rashi: 7, deg: 20 }, // परवर्ती
}

export const DEBILITATION = Object.fromEntries(
  Object.entries(EXALTATION).map(([k, v]) => [k, { rashi: (v.rashi + 6) % 12 }])
)

// Moolatrikona: [rashi, from-degree, to-degree). Nodes have none.
export const MOOLATRIKONA = {
  sun: { rashi: 4, from: 0, to: 20 },
  moon: { rashi: 1, from: 4, to: 30 },
  mars: { rashi: 0, from: 0, to: 12 },
  mercury: { rashi: 5, from: 16, to: 20 },
  jupiter: { rashi: 8, from: 0, to: 10 },
  venus: { rashi: 6, from: 0, to: 15 },
  saturn: { rashi: 10, from: 0, to: 20 },
}

// Natural (naisargika) friendship — BPHS ch.3.
export const NATURAL_FRIENDS = {
  sun: { friends: ['moon', 'mars', 'jupiter'], neutral: ['mercury'], enemies: ['venus', 'saturn'] },
  moon: { friends: ['sun', 'mercury'], neutral: ['mars', 'jupiter', 'venus', 'saturn'], enemies: [] },
  mars: { friends: ['sun', 'moon', 'jupiter'], neutral: ['venus', 'saturn'], enemies: ['mercury'] },
  mercury: { friends: ['sun', 'venus'], neutral: ['mars', 'jupiter', 'saturn'], enemies: ['moon'] },
  jupiter: { friends: ['sun', 'moon', 'mars'], neutral: ['saturn'], enemies: ['mercury', 'venus'] },
  venus: { friends: ['mercury', 'saturn'], neutral: ['mars', 'jupiter'], enemies: ['sun', 'moon'] },
  saturn: { friends: ['mercury', 'venus'], neutral: ['jupiter'], enemies: ['sun', 'moon', 'mars'] },
  // The nodes have no naisargika table in BPHS; the usual later convention is
  // used and labelled as परवर्ती wherever it is shown.
  rahu: { friends: ['venus', 'saturn', 'mercury'], neutral: ['jupiter'], enemies: ['sun', 'moon', 'mars'] },
  ketu: { friends: ['venus', 'saturn', 'mercury'], neutral: ['jupiter'], enemies: ['sun', 'moon', 'mars'] },
}

export const DIGNITY_LABELS = {
  exalted: { hi: 'उच्च', en: 'Exalted' },
  moolatrikona: { hi: 'मूलत्रिकोण', en: 'Moolatrikona' },
  own: { hi: 'स्वराशि', en: 'Own sign' },
  adhimitra: { hi: 'अतिमित्र', en: 'Great friend' },
  mitra: { hi: 'मित्र', en: 'Friend' },
  sama: { hi: 'सम', en: 'Neutral' },
  shatru: { hi: 'शत्रु', en: 'Enemy' },
  adhishatru: { hi: 'अधिशत्रु', en: 'Bitter enemy' },
  debilitated: { hi: 'नीच', en: 'Debilitated' },
}

// Digbala houses (BPHS ch.7): the house in which each graha is strongest.
export const DIGBALA_HOUSE = {
  sun: 10, mars: 10, jupiter: 1, mercury: 1, saturn: 7, moon: 4, venus: 4,
}

// Combustion orbs in degrees (BPHS ch.34; retrograde Mercury/Venus have a
// smaller orb).
export const COMBUSTION_ORB = {
  moon: 12, mars: 17, mercury: 14, jupiter: 11, venus: 10, saturn: 15,
}
export const COMBUSTION_ORB_RETRO = { mercury: 12, venus: 8 }

export function naturalRelation(from, to) {
  const t = NATURAL_FRIENDS[from]
  if (!t) return 'neutral'
  if (t.friends.includes(to)) return 'friend'
  if (t.enemies.includes(to)) return 'enemy'
  return 'neutral'
}

// Temporary (tatkalika) friendship: a graha in the 2nd, 3rd, 4th, 10th, 11th
// or 12th from another is a temporary friend — anywhere else an enemy.
export const TEMPORARY_FRIEND_HOUSES = [2, 3, 4, 10, 11, 12]

export function temporaryRelation(fromRashi, toRashi) {
  return TEMPORARY_FRIEND_HOUSES.includes(houseOf(toRashi, fromRashi)) ? 'friend' : 'enemy'
}

// The five-fold (panchadha) relation of `from` towards `to`, from their
// rashis in the chart being examined (D1 or a varga chart).
export function panchadha(from, to, rashiOf) {
  if (from === to) return 'own'
  const nat = naturalRelation(from, to)
  const rFrom = rashiOf[from]
  const rTo = rashiOf[to]
  if (rFrom == null || rTo == null) return nat === 'friend' ? 'mitra' : nat === 'enemy' ? 'shatru' : 'sama'
  const tmp = temporaryRelation(rFrom, rTo)
  if (nat === 'friend') return tmp === 'friend' ? 'adhimitra' : 'sama'
  if (nat === 'neutral') return tmp === 'friend' ? 'mitra' : 'shatru'
  return tmp === 'friend' ? 'shatru' : 'adhishatru'
}

// The dignity of `key` sitting in `rashi`, given the chart's rashi map.
// Order: मूलत्रिकोण → उच्च → स्वराशि → पंचधा → नीच. Moolatrikona comes FIRST
// because BPHS splits the exaltation sign itself: Moon 4–30 Vrishabha and
// Mercury 16–20 Kanya are moolatrikona, the rest of those signs exaltation.
export function dignityIn(key, rashi, degInSign, rashiOf) {
  const lord = RASHI_LORDS[rashi]
  const mt = MOOLATRIKONA[key]
  if (mt && mt.rashi === rashi && degInSign >= mt.from && degInSign < mt.to) {
    return { level: 'moolatrikona', lord, ...DIGNITY_LABELS.moolatrikona }
  }
  const ex = EXALTATION[key]
  if (ex && ex.rashi === rashi) {
    return { level: 'exalted', lord, ...DIGNITY_LABELS.exalted }
  }
  if (lord === key) {
    return { level: 'own', lord, ...DIGNITY_LABELS.own }
  }
  const deb = DEBILITATION[key]
  if (deb && deb.rashi === rashi) {
    return { level: 'debilitated', lord, ...DIGNITY_LABELS.debilitated }
  }
  const rel = panchadha(key, lord, rashiOf)
  const level = rel === 'own' ? 'own' : rel
  return { level, lord, ...(DIGNITY_LABELS[level] ?? DIGNITY_LABELS.sama) }
}

// Is the graha combust (अस्त)? `sep` = angular distance from the Sun (0–180).
export function combustionOf(key, sunLon, planetLon, retro) {
  const orb = COMBUSTION_ORB[key]
  if (!orb) return { combust: false, separation: null, limit: null }
  let sep = Math.abs(norm360(planetLon - sunLon))
  if (sep > 180) sep = 360 - sep
  const limit = retro && COMBUSTION_ORB_RETRO[key] ? COMBUSTION_ORB_RETRO[key] : orb
  return { combust: sep <= limit, separation: sep, limit }
}

// Vargottama: the same rashi in D1 and D9.
export function isVargottama(planet) {
  return planet.rashi === planet.navamsaRashi
}

// Everything the report needs about one graha's *position* (no strength here).
export function planetPositions(kundli, frame) {
  const sun = frame.byKey.sun
  const out = {}
  for (const key of Object.keys(frame.byKey)) {
    const p = frame.byKey[key]
    const dig = dignityIn(key, p.rashi, p.degInSign, frame.rashiOf)
    const comb = key === 'sun' ? { combust: false, separation: 0, limit: null } : combustionOf(key, sun.longitude, p.longitude, p.retro)
    out[key] = {
      key,
      rashi: p.rashi,
      degInSign: p.degInSign,
      house: p.house,
      nakshatra: p.nakshatra,
      pada: p.pada,
      retro: Boolean(p.retro),
      dignity: dig,
      combustion: comb,
      vargottama: isVargottama(p),
      digbala: DIGBALA_HOUSE[key] === p.house,
      owns: frame.housesOwned(key),
      navamsaRashi: p.navamsaRashi,
    }
  }
  return out
}

// Functional nature by house ownership (कार्येश स्वभाव):
//   त्रिकोणेश (5, 9) शुभ · 3/6/11 का स्वामी पाप · योगकारक · मारक · केन्द्राधिपत्य दोष।
export function karakaNature(frame) {
  const lagna = frame.lagnaRashi
  const keyThatOwns = (houses) => {
    const out = []
    for (const k of Object.keys(frame.owns)) {
      if (frame.owns[k].some((h) => houses.includes(h))) out.push(k)
    }
    return out
  }
  const trikonaLords = keyThatOwns([5, 9])
  const papaLords = keyThatOwns([3, 6, 11])

  // योगकारक = one graha owning both a kendra other than the lagna (4/7/10) and
  // a trikona (5/9).
  const yogakaraka = Object.keys(frame.owns).filter(
    (k) => frame.owns[k].some((h) => [4, 7, 10].includes(h)) && frame.owns[k].some((h) => [5, 9].includes(h))
  )

  // मारक = owner of the 2nd or the 7th (both = the classic strong maraka).
  const maraka2 = frame.houseLord[1]
  const maraka7 = frame.houseLord[6]
  const maraka = [...new Set([maraka2, maraka7])]
  const strongMaraka = maraka2 === maraka7 ? maraka2 : null

  // केन्द्राधिपत्य दोष: a natural benefic owning the 4th, 7th or 10th without
  // also owning a trikona (then it is a yogakaraka instead). The lagna lord is
  // exempt — the classical doctrine counts 4/7/10, not the 1st.
  const kendraBenefics = Object.keys(frame.owns).filter(
    (k) =>
      ['jupiter', 'venus', 'mercury', 'moon'].includes(k) &&
      frame.owns[k].some((h) => [4, 7, 10].includes(h)) &&
      !frame.owns[k].some((h) => [5, 9].includes(h))
  )

  return {
    lagna,
    trikonaLords,
    papaLords,
    yogakaraka,
    maraka,
    maraka2,
    maraka7,
    strongMaraka,
    kendraBeneficDosha: kendraBenefics,
  }
}

// A plain-language one-liner per graha, for the "ग्रह-स्थिति" table.
export function dignitySummary(key, pos) {
  const parts = [pos.dignity.hi]
  if (pos.retro) parts.push('वक्री')
  if (pos.combustion.combust) parts.push('अस्त')
  if (pos.vargottama) parts.push('वर्गोत्तम')
  if (pos.digbala) parts.push('दिग्बली')
  return parts.join(' · ')
}

export { SEVEN_KEYS, houseOf, norm360 }
