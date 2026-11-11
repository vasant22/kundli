// tests/phal-strength.test.js — विंशोपक बल (BPHS ch.7).
import { beforeAll, describe, expect, it } from 'vitest'
import { computeKundli, initEphemeris } from '../src/astro.js'
import {
  DIGNITY_POINTS,
  VIMSHOPAKA_WEIGHTS,
  strengthBand,
  vargaScore,
  vimshopakaBala,
} from '../src/phal/strength.js'
import { VARGA_ORDERS } from '../src/phal/vargas.js'

describe('weights', () => {
  it('the sixteen weights add up to exactly 20', () => {
    const sum = Object.values(VIMSHOPAKA_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBe(20)
    expect(Object.keys(VIMSHOPAKA_WEIGHTS).length).toBe(16)
  })

  it('the BPHS ch.7 special weights', () => {
    expect(VIMSHOPAKA_WEIGHTS[1]).toBe(3.5) // D1
    expect(VIMSHOPAKA_WEIGHTS[2]).toBe(1) // D2
    expect(VIMSHOPAKA_WEIGHTS[3]).toBe(1) // D3
    expect(VIMSHOPAKA_WEIGHTS[9]).toBe(3) // D9
    expect(VIMSHOPAKA_WEIGHTS[16]).toBe(2) // D16
    expect(VIMSHOPAKA_WEIGHTS[30]).toBe(1) // D30
    expect(VIMSHOPAKA_WEIGHTS[60]).toBe(4) // D60
    for (const n of [4, 7, 10, 12, 20, 24, 27, 40, 45]) expect(VIMSHOPAKA_WEIGHTS[n]).toBe(0.5)
  })
})

describe('vargaScore — the twenty-point scale', () => {
  const own = { sun: 4, moon: 3, mars: 0, mercury: 5, jupiter: 8, venus: 6, saturn: 10, rahu: 10, ketu: 7 }

  it('own sign and exaltation both score 20', () => {
    expect(DIGNITY_POINTS.own).toBe(20)
    expect(DIGNITY_POINTS.exalted).toBe(20)
    expect(vargaScore('sun', 1, 4, own)).toBe(20) // Sun in Simha
    expect(vargaScore('sun', 1, 0, own)).toBe(20) // Sun in Mesha (exalted)
    expect(vargaScore('saturn', 1, 6, own)).toBe(20) // Saturn in Tula (exalted)
  })

  it('the friendship bands: 18 / 15 / 10 / 7 / 5', () => {
    // The score depends on the relation to the LORD OF THE SIGN the graha sits
    // in — so these cases place the Sun in a sign and its lord somewhere.
    // Sun in Dhanu (lord Jupiter, a natural friend), Jupiter in the 2nd → 18
    expect(vargaScore('sun', 1, 8, { sun: 8, jupiter: 9 })).toBe(18)
    // same pair with Jupiter in the 8th (temporary enemy) → neutral 10
    expect(vargaScore('sun', 1, 8, { sun: 8, jupiter: 3 })).toBe(10)
    // Sun in Mithuna (lord Mercury, neutral), Mercury in the 2nd → friend 15
    expect(vargaScore('sun', 1, 2, { sun: 2, mercury: 3 })).toBe(15)
    // Sun in Vrishabha (lord Venus, an enemy), Venus in the 2nd → enemy 7
    expect(vargaScore('sun', 1, 1, { sun: 1, venus: 2 })).toBe(7)
    // same but Venus in the 8th → bitter enemy 5
    expect(vargaScore('sun', 1, 1, { sun: 1, venus: 8 })).toBe(5)
    expect(DIGNITY_POINTS.adhimitra).toBe(18)
    expect(DIGNITY_POINTS.mitra).toBe(15)
    expect(DIGNITY_POINTS.sama).toBe(10)
    expect(DIGNITY_POINTS.shatru).toBe(7)
    expect(DIGNITY_POINTS.adhishatru).toBe(5)
  })

  it('a varga-nicha is scored by its panchadha relation, not a made-up number', () => {
    // BPHS ch.7 gives no separate value for नीच, so there is no
    // DIGNITY_POINTS.debilitated entry at all.
    expect('debilitated' in DIGNITY_POINTS).toBe(false)
    // Sun नीच in Tula (lord Venus, a natural enemy): Venus in the 2nd → 7
    expect(vargaScore('sun', 1, 6, { sun: 6, venus: 7 })).toBe(7)
    // same नीच Sun, Venus in the 8th (temporary enemy) → 5
    expect(vargaScore('sun', 1, 6, { sun: 6, venus: 2 })).toBe(5)
    // ...and with a friendly lord placed well a नीच graha scores higher:
    // Venus नीच in Kanya (lord Mercury, a natural friend), Mercury in the 2nd → 18
    expect(vargaScore('venus', 1, 5, { venus: 5, mercury: 6 })).toBe(18)
  })

  it('D2 hora: सूर्य/मंगल/गुरु Simha में, चंद्र/शुक्र/शनि Karka में, बुध दोनों में', () => {
    const any = {}
    expect(vargaScore('sun', 2, 4, any)).toBe(20) // Simha hora
    expect(vargaScore('mars', 2, 4, any)).toBe(20)
    expect(vargaScore('jupiter', 2, 4, any)).toBe(20)
    expect(vargaScore('moon', 2, 3, any)).toBe(20) // Karka hora
    expect(vargaScore('venus', 2, 3, any)).toBe(20)
    expect(vargaScore('saturn', 2, 3, any)).toBe(20)
    expect(vargaScore('mercury', 2, 4, any)).toBe(20)
    expect(vargaScore('mercury', 2, 3, any)).toBe(20)
    // wrong hora → weak
    expect(vargaScore('sun', 2, 3, any)).toBe(5)
    expect(vargaScore('moon', 2, 4, any)).toBe(5)
    // nodes are neutral in the hora
    expect(vargaScore('rahu', 2, 3, any)).toBe(10)
  })
})

describe('strength bands', () => {
  it('≥15 पूर्ण, 10–15 मध्यम, 5–10 अल्प, <5 क्षीण', () => {
    expect(strengthBand(20).hi).toBe('पूर्ण')
    expect(strengthBand(15).hi).toBe('पूर्ण')
    expect(strengthBand(14.99).hi).toBe('मध्यम')
    expect(strengthBand(10).hi).toBe('मध्यम')
    expect(strengthBand(9.99).hi).toBe('अल्प')
    expect(strengthBand(5).hi).toBe('अल्प')
    expect(strengthBand(4.99).hi).toBe('क्षीण')
  })
})

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

const BIRTH = {
  utc: { year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 },
  latitude: 25.31668,
  longitude: 83.01041,
}

describe('vimshopakaBala', () => {
  it('produces a 0–20 figure for every graha, matching its own weighted sum', () => {
    const k = computeKundli(swe, BIRTH)
    const res = vimshopakaBala(k)
    expect(Object.keys(res.planets).length).toBe(9)
    for (const [key, p] of Object.entries(res.planets)) {
      expect(Number.isFinite(p.total)).toBe(true)
      expect(p.total).toBeGreaterThanOrEqual(5)
      expect(p.total).toBeLessThanOrEqual(20)
      expect(p.perVarga.length).toBe(16)
      const sum = p.perVarga.reduce((acc, v) => acc + v.weight * v.score, 0) / 20
      expect(Math.abs(sum - p.total)).toBeLessThan(0.011)
      expect(p.perVarga.map((v) => v.varga)).toEqual(VARGA_ORDERS)
      expect(['full', 'medium', 'little', 'weak']).toContain(p.band)
      expect(key).toBe(p.key)
    }
  })
})
