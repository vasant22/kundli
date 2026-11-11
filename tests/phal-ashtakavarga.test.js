// tests/phal-ashtakavarga.test.js — अष्टकवर्ग के कुल योग (BPHS ch.66) + SAV 337.
import { beforeAll, describe, expect, it } from 'vitest'
import { computeKundli, initEphemeris } from '../src/astro.js'
import { makeFrame } from '../src/phal/frame.js'
import {
  ASHTAKAVARGA,
  ASHTAKAVARGA_REFS,
  ASHTAKAVARGA_TOTALS,
  SAV_TOTAL,
  bhinnashtakavarga,
  computeAshtakavarga,
} from '../src/phal/ashtakavarga.js'

describe('the classical check-sums', () => {
  it('each table adds up to its classical total', () => {
    for (const [key, total] of Object.entries(ASHTAKAVARGA_TOTALS)) {
      const sum = ASHTAKAVARGA_REFS.reduce((acc, ref) => acc + ASHTAKAVARGA[key][ref].length, 0)
      expect(sum).toBe(total)
    }
  })

  it('the seven grahas add up to 337', () => {
    const sum = Object.values(ASHTAKAVARGA_TOTALS).reduce((a, b) => a + b, 0)
    expect(sum).toBe(SAV_TOTAL)
  })

  it('no house number outside 1..12 in any row', () => {
    for (const key of Object.keys(ASHTAKAVARGA)) {
      for (const ref of ASHTAKAVARGA_REFS) {
        for (const h of ASHTAKAVARGA[key][ref]) {
          expect(h).toBeGreaterThanOrEqual(1)
          expect(h).toBeLessThanOrEqual(12)
        }
      }
    }
  })

  it('no duplicated house inside a row', () => {
    for (const key of Object.keys(ASHTAKAVARGA)) {
      for (const ref of ASHTAKAVARGA_REFS) {
        const row = ASHTAKAVARGA[key][ref]
        expect(new Set(row).size).toBe(row.length)
      }
    }
  })
})

// A frame where every graha and the lagna sit in a known rashi — makes the
// bindu-by-bindu arithmetic checkable by hand.
function plainFrame() {
  const positions = { sun: 0, moon: 1, mars: 2, mercury: 3, jupiter: 4, venus: 5, saturn: 6, rahu: 7, ketu: 8 }
  const lagna = 0
  const planets = Object.entries(positions).map(([key, rashi]) => ({
    key, rashi, degInSign: 10, house: ((rashi - lagna + 12) % 12) + 1,
    longitude: rashi * 30 + 10, nakshatra: 1, pada: 1, speed: 1, retro: false, navamsaRashi: rashi,
  }))
  return makeFrame({ ascendant: { rashi: lagna, longitude: 5 }, planets })
}

describe('bhinnashtakavarga', () => {
  it('counts exactly the houses the table marks', () => {
    const frame = plainFrame()
    const bav = bhinnashtakavarga(frame, 'sun')
    // Sun's own row: 1,2,4,7,8,9,10,11 from the Sun's rashi (Mesha)
    const sunRashi = frame.rashiOf.sun
    const fromSun = ASHTAKAVARGA.sun.sun.map((h) => (sunRashi + h - 1) % 12)
    for (const rashi of fromSun) {
      const house = frame.houseFromLagna(rashi)
      expect(bav.bindus[house - 1]).toBeGreaterThanOrEqual(1)
    }
    expect(bav.total).toBe(48)
    expect(bav.bindus.length).toBe(12)
  })

  it('bindus never exceed 8 per house', () => {
    const bav = bhinnashtakavarga(plainFrame(), 'jupiter')
    for (const n of bav.bindus) {
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(8)
    }
  })
})

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

describe('computeAshtakavarga on a real kundli', () => {
  const BIRTH = {
    utc: { year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 },
    latitude: 25.31668,
    longitude: 83.01041,
  }

  it('seven BAVs, each with its classical total, and an SAV of 337', () => {
    const frame = makeFrame(computeKundli(swe, BIRTH))
    const res = computeAshtakavarga(frame)
    for (const [key, total] of Object.entries(ASHTAKAVARGA_TOTALS)) {
      expect(res.bav[key].total).toBe(total)
    }
    expect(res.sav.bindus.length).toBe(12)
    expect(res.sav.total).toBe(SAV_TOTAL)
    expect(res.sav.bindus.reduce((a, b) => a + b, 0)).toBe(337)
  })
})
