// panchang-extras.js — Phase 5: Disha Shoola, Tara Bala, Chandra Bala.
//
// All three are "for today" lookups relative to the Moon's position at sunrise:
//   - Disha Shoola: fixed weekday direction (do not travel this way today).
//   - Tara Bala: the janma-nakshatras whose 9-fold Tara group (counted from the
//     janma star to today's Moon star) is favourable — Vipat (3), Pratyari (5)
//     and Vadha (7) are excluded; Janma (1) is kept (verified against the
//     reference's lists on multiple days).
//   - Chandra Bala: the janma-rashis whose Moon-distance from today's Moon sign
//     is in {1, 3, 6, 7, 10, 11}.
//
// The 9-Tara grouping is the same system used by src/ashtakoot.js (Tara koota);
// NOTE: the two modules use different index bases for the *names* (Ashtakoot's
// display table is indexed for its own score calibration — verified separately);
// favourability here follows the Panchang side, verified against the reference
// list output. Do not re-derive; keep these fixtures (tests/panchang-extras).

import { NAKSHATRAS, RASHIS, DIRECTIONS } from './i18n.js'

// Weekday → direction key. 0=Sunday … 6=Saturday.
// Verified against AstroSage on every fixture date: Sun West · Mon East ·
// Tue North · Wed North · Thu South · Fri West · Sat East.
const DISHA_SHOOLA = ['west', 'east', 'north', 'north', 'south', 'west', 'east']

export function dishaShoola(weekday) {
  const key = DISHA_SHOOLA[weekday]
  const d = DIRECTIONS.find((x) => x.key === key)
  return { key, hi: d.hi, en: d.en }
}

// The 9 Taras in classical order (count = steps from janma star + 1).
export const TARA_SEQUENCE = ['janma', 'sampat', 'vipat', 'kshema', 'pratyari', 'sadhaka', 'vadha', 'mitra', 'paramaMitra']
const TARA_FAVORABLE = new Set([1, 2, 4, 6, 8, 9]) // excludes Vipat/Pratyari/Vadha

/**
 * List of janma nakshatras (in zodiacal order) for which TODAY is favourable.
 * moonNak1 = today's Moon nakshatra number (1..27).
 */
export function taraBala(moonNak1) {
  const out = []
  for (let j = 1; j <= 27; j++) {
    const steps = (moonNak1 - j + 27) % 27 // 0-based steps from janma to today's star
    const tara = (steps % 9) + 1
    if (TARA_FAVORABLE.has(tara)) {
      out.push({ index: j, tara, key: TARA_SEQUENCE[tara - 1], hi: NAKSHATRAS[j - 1].hi, en: NAKSHATRAS[j - 1].en })
    }
  }
  return out
}

const CHANDRA_FAVORABLE = new Set([1, 3, 6, 7, 10, 11])

/**
 * List of janma rashis (in zodiacal order) that are favourable today.
 * moonSign0 = today's Moon rashi (0=Mesha … 11=Meena).
 */
export function chandraBala(moonSign0) {
  const out = []
  for (let i = 0; i < 12; i++) {
    const dist = ((moonSign0 - i + 12) % 12) + 1
    if (CHANDRA_FAVORABLE.has(dist)) {
      out.push({ index: i, hi: RASHIS[i].hi, en: RASHIS[i].en })
    }
  }
  return out
}
