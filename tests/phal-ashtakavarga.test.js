// tests/phal-ashtakavarga.test.js — अष्टकवर्ग (BPHS अ.66).
//
// दो स्तर की जाँच:
//   1. हर ग्रह की आठों पंक्तियाँ (7 × 8 = 56) — snapshot, ताकि एक भी स्थान
//      बदले तो test पकड़ ले. (कुल-योग वाले test पंक्ति की गलती नहीं पकड़ते —
//      यही टास्क 01-ग की सीख है.)
//   2. एक पक्की कुंडली (15-08-1985, 07:30 IST, मुंबई) के चंद्र-BAV और SAV के
//      अंक, जो oracle से भी मेल खाते हैं.
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

// BPHS अ.66 — हर ग्रह के भिन्नाष्टकवर्ग की आठ पंक्तियाँ (योग देने वाला → भाव).
const BPHS_TABLE = {
  sun: {
    sun: [1, 2, 4, 7, 8, 9, 10, 11],
    moon: [3, 6, 10, 11],
    mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [3, 5, 6, 9, 10, 11, 12],
    jupiter: [5, 6, 9, 11],
    venus: [6, 7, 12],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    lagna: [3, 4, 6, 10, 11, 12],
  },
  moon: {
    sun: [3, 6, 7, 8, 10, 11],
    moon: [1, 3, 6, 7, 10, 11],
    mars: [2, 3, 5, 6, 9, 10, 11],
    mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    jupiter: [1, 4, 7, 8, 10, 11, 12],
    venus: [3, 4, 5, 7, 9, 10, 11],
    saturn: [3, 5, 6, 11],
    lagna: [3, 6, 10, 11],
  },
  mars: {
    sun: [3, 5, 6, 10, 11],
    moon: [3, 6, 11],
    mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [3, 5, 6, 11],
    jupiter: [6, 10, 11, 12],
    venus: [6, 8, 11, 12],
    saturn: [1, 4, 7, 8, 9, 10, 11],
    lagna: [1, 3, 6, 10, 11],
  },
  mercury: {
    sun: [5, 6, 9, 11, 12],
    moon: [2, 4, 6, 8, 10, 11],
    mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    jupiter: [6, 8, 11, 12],
    venus: [1, 2, 3, 4, 5, 8, 9, 11],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  jupiter: {
    sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    moon: [2, 5, 7, 9, 11],
    mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    venus: [2, 5, 6, 9, 10, 11],
    saturn: [3, 5, 6, 12],
    lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  venus: {
    sun: [8, 11, 12],
    moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    mars: [3, 5, 6, 9, 11, 12],
    mercury: [3, 5, 6, 9, 11],
    jupiter: [5, 8, 9, 10, 11],
    venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    saturn: [3, 4, 5, 8, 9, 10, 11],
    lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  saturn: {
    sun: [1, 2, 4, 7, 8, 10, 11],
    moon: [3, 6, 11],
    mars: [3, 5, 6, 10, 11, 12],
    mercury: [6, 8, 9, 10, 11, 12],
    jupiter: [5, 6, 11, 12],
    venus: [6, 11, 12],
    saturn: [3, 5, 6, 11],
    lagna: [1, 3, 4, 6, 10, 11],
  },
}

describe('हर पंक्ति अलग — 7 ग्रह × 8 संदर्भ = 56', () => {
  for (const key of Object.keys(BPHS_TABLE)) {
    it(`${key}: आठों पंक्तियाँ BPHS अ.66 के अनुसार`, () => {
      for (const ref of ASHTAKAVARGA_REFS) {
        expect(ASHTAKAVARGA[key][ref], `${key}/from-${ref}`).toEqual(BPHS_TABLE[key][ref])
      }
      expect(Object.keys(ASHTAKAVARGA[key]).length).toBe(8)
    })
  }

  it('कुल 56 पंक्तियाँ और उनके शास्त्रीय योग', () => {
    let rows = 0
    for (const key of Object.keys(BPHS_TABLE)) {
      rows += Object.keys(BPHS_TABLE[key]).length
      const sum = ASHTAKAVARGA_REFS.reduce((acc, ref) => acc + BPHS_TABLE[key][ref].length, 0)
      expect(sum).toBe(ASHTAKAVARGA_TOTALS[key])
    }
    expect(rows).toBe(56)
    expect(Object.values(ASHTAKAVARGA_TOTALS).reduce((a, b) => a + b, 0)).toBe(SAV_TOTAL)
  })

  it('हर पंक्ति में भाव 1..12 के भीतर, बिना दोहराव', () => {
    for (const key of Object.keys(BPHS_TABLE)) {
      for (const ref of ASHTAKAVARGA_REFS) {
        const row = ASHTAKAVARGA[key][ref]
        expect(new Set(row).size).toBe(row.length)
        for (const h of row) {
          expect(h).toBeGreaterThanOrEqual(1)
          expect(h).toBeLessThanOrEqual(12)
        }
      }
    }
  })

  it('चंद्र के भिन्नाष्टकवर्ग में "गुरु से" पंक्ति = 1,4,7,8,10,11,12 (टास्क 01-ग का सुधार)', () => {
    expect(ASHTAKAVARGA.moon.jupiter).toEqual([1, 4, 7, 8, 10, 11, 12])
    expect(ASHTAKAVARGA.moon.jupiter).not.toContain(2)
  })
})

// A frame where every graha and the lagna sit in a known rashi.
function plainFrame() {
  const positions = { sun: 0, moon: 1, mars: 2, mercury: 3, jupiter: 4, venus: 5, saturn: 6, rahu: 7, ketu: 8 }
  const lagna = 0
  const planets = Object.entries(positions).map(([key, rashi]) => ({
    key, rashi, degInSign: 10, house: ((rashi - lagna + 12) % 12) + 1,
    longitude: rashi * 30 + 10, nakshatra: 1, pada: 1, speed: 1, retro: false, navamsaRashi: rashi,
  }))
  return makeFrame({ ascendant: { rashi: lagna, longitude: 5 }, planets })
}

describe('bySign / byHouse', () => {
  it('bySign मेष से शुरू होता है, byHouse लग्न से — दोनों बारह के बारह', () => {
    const bav = bhinnashtakavarga(plainFrame(), 'sun')
    expect(bav.bySign.length).toBe(12)
    expect(bav.byHouse.length).toBe(12)
    // इस ढाँचे में लग्न मेष है, इसलिए दोनों एक जैसे होंगे
    expect(bav.byHouse).toEqual(bav.bySign)
    expect(bav.total).toBe(48)
  })

  it('लग्न बदलने पर bySign वही रहता है, byHouse घूम जाता है', () => {
    const a = bhinnashtakavarga(plainFrame(), 'moon')
    const shifted = plainFrame()
    const b = bhinnashtakavarga(shifted, 'moon')
    expect(a.bySign).toEqual(b.bySign)
  })

  it('bindus कभी 0..8 के बाहर नहीं', () => {
    const bav = bhinnashtakavarga(plainFrame(), 'jupiter')
    for (const n of bav.bySign) {
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(8)
    }
  })
})

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

describe('पक्की कुंडली — 15-08-1985, 07:30 IST, मुंबई (सिंह लग्न)', () => {
  const BIRTH = {
    utc: { year: 1985, month: 8, day: 15, hour: 2, minute: 0, second: 0 },
    latitude: 19.0728,
    longitude: 72.8826,
  }

  it('चंद्र-BAV (मेष से) और SAV — oracle से हूबहू', () => {
    const frame = makeFrame(computeKundli(swe, BIRTH))
    const res = computeAshtakavarga(frame)
    expect(res.bav.moon.bySign).toEqual([6, 5, 1, 3, 4, 5, 4, 3, 6, 5, 4, 3])
    expect(res.sav.bySign).toEqual([32, 44, 25, 22, 30, 25, 27, 31, 29, 26, 23, 23])
    expect(res.sav.total).toBe(337)
  })

  it('सातों BAV के कुल और SAV का कुल', () => {
    const frame = makeFrame(computeKundli(swe, BIRTH))
    const res = computeAshtakavarga(frame)
    for (const [key, total] of Object.entries(ASHTAKAVARGA_TOTALS)) {
      expect(res.bav[key].total).toBe(total)
    }
    expect(res.sav.total).toBe(337)
    expect(res.sav.byHouse.reduce((a, b) => a + b, 0)).toBe(337)
  })
})
