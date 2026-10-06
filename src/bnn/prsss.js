// prsss.js — PRSSS / BRSSS sub-lord chains (Phase 3 — implemented).
//
// Guide R10: five levels — rashi lord, star lord, sub, sub-sub, sub-sub-sub —
// by Vimshottari proportions (Ke 7, Ve 20, Su 6, Mo 10, Ma 7, Ra 18, Ju 16,
// Sa 19, Me 17 / 120), each level dividing the CURRENT span and starting
// from its own lord. PRSSS uses a planet's own natal longitude (both BP/AP);
// BRSSS uses the bhava cusp's longitude — same maths, different input.
// Use exact fractions throughout (no rounding of intermediate values).
//
// Spec: docs/bnn-guide.txt → Phase 3 / R10. Verification (PASS/FAIL) is in
// tests/bnn-prsss.test.js; the B11 surprise is reported there per the guide.

import { RASHI_LORDS } from '../astro.js'

// The Vimshottari order with years (sum 120).
const SEQ = [
  ['ketu', 7], ['venus', 20], ['sun', 6], ['moon', 10], ['mars', 7],
  ['rahu', 18], ['jupiter', 16], ['saturn', 19], ['mercury', 17],
]

// One subdivision: given the starting lord index and the fraction (0..1)
// inside the current span, return the sub lord and the fraction inside it.
function nextLevel(startIdx, frac) {
  let acc = 0
  for (let i = 0; i < SEQ.length; i++) {
    const idx = (startIdx + i) % SEQ.length
    const w = SEQ[idx][1] / 120
    if (frac < acc + w || i === SEQ.length - 1) {
      return { idx, key: SEQ[idx][0], inner: Math.min(1, (frac - acc) / w) }
    }
    acc += w
  }
}

const norm = (x) => ((x % 360) + 360) % 360

/**
 * The full five-level chain for one longitude:
 * [rashi lord, star lord, sub, sub-sub, sub-sub-sub].
 */
export function prsssChain(longitude) {
  const lon = norm(longitude)
  const rashiLord = RASHI_LORDS[Math.floor(lon / 30) % 12]
  const NAK = 360 / 27
  const nakIndex = Math.floor(lon / NAK) // 0..26
  const nakLordIdx = nakIndex % 9
  const frac = (lon % NAK) / NAK
  const l2 = nextLevel(nakLordIdx, frac) // sub
  const l3 = nextLevel(l2.idx, l2.inner) // sub-sub
  const l4 = nextLevel(l3.idx, l3.inner) // sub-sub-sub
  return [rashiLord, SEQ[nakLordIdx][0], l2.key, l3.key, l4.key]
}

/** PRSSS — for a planet's own natal longitude. */
export function computePrsss(longitude) {
  return prsssChain(longitude)
}

/** BRSSS — for a bhava cusp longitude (same five levels). */
export function computeBrsss(longitude) {
  return prsssChain(longitude)
}
