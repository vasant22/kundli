// tests/bnn-prsss.test.js — BNN PRSSS / BRSSS chains (Phase 3).
// Integration: real WASM on the reference chart (same fixture as bnn-kp).
// Expected rows: docs/bnn-guide.txt भाग 5. B11 is reported separately — the
// guide says the old software's B11 does not follow the rule (report only).
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { computeBhavaChalit } from '../src/bnn/kp.js'
import { computeBrsss, computePrsss } from '../src/bnn/prsss.js'

const BIRTH = {
  utc: { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, // 20:30:00 IST
  place: { latitude: 21.4833, longitude: 78.25 },
}

const PRSSS_EXPECTED = {
  sun: ['saturn', 'sun', 'venus', 'sun', 'mars'],
  moon: ['jupiter', 'saturn', 'mars', 'mercury', 'mercury'],
  mars: ['sun', 'venus', 'jupiter', 'moon', 'venus'],
  // 3rd level was hidden in the guide's screenshot; the rule gives 'venus'.
  mercury: ['saturn', 'sun', 'venus', 'jupiter', 'saturn'],
  jupiter: ['sun', 'venus', 'venus', 'ketu', 'jupiter'],
  venus: ['saturn', 'rahu', 'mercury', 'saturn', 'sun'],
  saturn: ['mercury', 'sun', 'saturn', 'saturn', 'moon'],
  rahu: ['sun', 'ketu', 'rahu', 'venus', 'ketu'],
  ketu: ['saturn', 'rahu', 'rahu', 'jupiter', 'moon'],
}
const BRSSS_EXPECTED = {
  1: ['sun', 'ketu', 'mercury', 'jupiter', 'mercury'],
  2: ['mercury', 'moon', 'moon', 'venus', 'sun'],
  3: ['venus', 'rahu', 'saturn', 'venus', 'mercury'],
  4: ['mars', 'saturn', 'mars', 'moon', 'mercury'],
  5: ['jupiter', 'venus', 'venus', 'venus', 'saturn'],
  6: ['saturn', 'moon', 'rahu', 'moon', 'rahu'],
  7: ['saturn', 'rahu', 'mercury', 'ketu', 'rahu'],
  8: ['jupiter', 'saturn', 'sun', 'venus', 'sun'],
  9: ['mars', 'ketu', 'mercury', 'mercury', 'venus'],
  10: ['venus', 'moon', 'rahu', 'mercury', 'venus'],
  12: ['moon', 'saturn', 'rahu', 'saturn', 'moon'],
}

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

describe('BNN Phase 3 — PRSSS / BRSSS', () => {
  it('PRSSS rows match the guide at all five levels', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    for (const p of k.planets) {
      expect(computePrsss(p.longitude), p.key).toEqual(PRSSS_EXPECTED[p.key])
    }
  })

  it('BRSSS rows match the guide (B11 aside)', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    for (let n = 1; n <= 12; n++) {
      if (n === 11) continue
      expect(computeBrsss(k.cusps[n - 1].longitude), `B${n}`).toEqual(BRSSS_EXPECTED[n])
    }
  })

  it('B11 — computed from cusp 11 and reported (not forced to match)', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    expect(computeBrsss(k.cusps[10].longitude)).toEqual(['mercury', 'rahu', 'mercury', 'rahu', 'rahu'])
  })

  it('pure checks: known longitudes & the BRSSS alias', () => {
    // Leo 15°30′ — the reference Jupiter degree → its known chain.
    expect(computePrsss(135.5)).toEqual(['sun', 'venus', 'venus', 'ketu', 'jupiter'])
    // 0° (Ashwini's start) — every level starts from Ketu.
    expect(computePrsss(0)).toEqual(['mars', 'ketu', 'ketu', 'ketu', 'ketu'])
    // BRSSS is the same chain maths applied to a cusp longitude.
    expect(computeBrsss(132.8835)).toEqual(['sun', 'ketu', 'mercury', 'jupiter', 'mercury'])
  })
})
