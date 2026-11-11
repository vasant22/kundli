// tests/phal-strength.test.js — विंशोपक बल (BPHS ch.7).
//
// टास्क 01-ग के दो बदलाव यहाँ पक्के हैं:
//   • तात्कालिक मैत्री जन्म-कुंडली (D1) की स्थितियों से — सोलहों वर्गों में वही
//   • विंशोपक सिर्फ़ सात ग्रहों का (राहु/केतु का कोई अंक नहीं)
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
import { dignityIn, panchadha } from '../src/phal/dignity.js'

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
    expect(vargaScore('saturn', 1, 6, own)).toBe(20)
  })

  it('the friendship bands: 18 / 15 / 10 / 7 / 5', () => {
    // Sun in Dhanu (lord Jupiter, a natural friend), Jupiter in the 2nd → 18
    expect(vargaScore('sun', 1, 8, { sun: 8, jupiter: 9 })).toBe(18)
    expect(vargaScore('sun', 1, 8, { sun: 8, jupiter: 3 })).toBe(10) // 8th → neutral
    expect(vargaScore('sun', 1, 2, { sun: 2, mercury: 3 })).toBe(15) // friend
    expect(vargaScore('sun', 1, 1, { sun: 1, venus: 2 })).toBe(7) // enemy
    expect(vargaScore('sun', 1, 1, { sun: 1, venus: 8 })).toBe(5) // bitter enemy
    expect(DIGNITY_POINTS.adhimitra).toBe(18)
    expect(DIGNITY_POINTS.mitra).toBe(15)
    expect(DIGNITY_POINTS.sama).toBe(10)
    expect(DIGNITY_POINTS.shatru).toBe(7)
    expect(DIGNITY_POINTS.adhishatru).toBe(5)
  })

  it('a varga-nicha is scored by its panchadha relation, not a made-up number', () => {
    expect('debilitated' in DIGNITY_POINTS).toBe(false)
    expect(vargaScore('sun', 1, 6, { sun: 6, venus: 7 })).toBe(7) // Sun नीच in Tula
    expect(vargaScore('sun', 1, 6, { sun: 6, venus: 2 })).toBe(5)
    expect(vargaScore('venus', 1, 5, { venus: 5, mercury: 6 })).toBe(18) // नीच but friendly lord
  })

  it('D2 hora: सूर्य/मंगल/गुरु Simha में, चंद्र/शुक्र/शनि Karka में, बुध दोनों में', () => {
    const any = {}
    expect(vargaScore('sun', 2, 4, any)).toBe(20)
    expect(vargaScore('mars', 2, 4, any)).toBe(20)
    expect(vargaScore('jupiter', 2, 4, any)).toBe(20)
    expect(vargaScore('moon', 2, 3, any)).toBe(20)
    expect(vargaScore('venus', 2, 3, any)).toBe(20)
    expect(vargaScore('saturn', 2, 3, any)).toBe(20)
    expect(vargaScore('mercury', 2, 4, any)).toBe(20)
    expect(vargaScore('mercury', 2, 3, any)).toBe(20)
    expect(vargaScore('sun', 2, 3, any)).toBe(5)
    expect(vargaScore('moon', 2, 4, any)).toBe(5)
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

const BIRTH_1985 = {
  utc: { year: 1985, month: 8, day: 15, hour: 2, minute: 0, second: 0 },
  latitude: 19.0728,
  longitude: 72.8826,
}
const BIRTH_1990 = {
  utc: { year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 },
  latitude: 25.31668,
  longitude: 83.01041,
}

describe('vimshopakaBala', () => {
  it('सिर्फ़ सात ग्रहों का अंक — राहु/केतु नहीं (टास्क 01-ग)', () => {
    const res = vimshopakaBala(computeKundli(swe, BIRTH_1985))
    expect(Object.keys(res.planets).sort()).toEqual(
      ['jupiter', 'mars', 'mercury', 'moon', 'saturn', 'sun', 'venus']
    )
    expect(res.planets.rahu).toBeUndefined()
    expect(res.planets.ketu).toBeUndefined()
  })

  it('0–20 के भीतर, और अपने ही भारित योग से मेल', () => {
    const res = vimshopakaBala(computeKundli(swe, BIRTH_1990))
    for (const p of Object.values(res.planets)) {
      expect(Number.isFinite(p.total)).toBe(true)
      expect(p.total).toBeGreaterThanOrEqual(5)
      expect(p.total).toBeLessThanOrEqual(20)
      expect(p.perVarga.length).toBe(16)
      const sum = p.perVarga.reduce((acc, v) => acc + v.weight * v.score, 0) / 20
      expect(Math.abs(sum - p.total)).toBeLessThan(0.011)
      expect(p.perVarga.map((v) => v.varga)).toEqual(VARGA_ORDERS)
    }
  })

  it('तात्कालिक मैत्री D1 से — हर वर्ग का अंक D1 की स्थिति से ही बनता है', () => {
    const k = computeKundli(swe, BIRTH_1985)
    const res = vimshopakaBala(k)
    const d1 = Object.fromEntries(k.planets.map((p) => [p.key, p.rashi]))
    for (const key of Object.keys(res.planets)) {
      for (const row of res.planets[key].perVarga) {
        if (row.varga === 2) continue // D2 का अपना होरा-नियम है
        const dig = dignityIn(key, row.rashi, 15, d1)
        const expected = dig.level === 'debilitated'
          ? DIGNITY_POINTS[panchadha(key, dig.lord, d1)] ?? 10
          : DIGNITY_POINTS[dig.level] ?? 10
        expect(row.score, `${key} D${row.varga}`).toBe(expected)
      }
    }
  })

  it('15-08-1985 की कुंडली — हमारे अंक (regression pin)', () => {
    const res = vimshopakaBala(computeKundli(swe, BIRTH_1985))
    const got = Object.fromEntries(Object.entries(res.planets).map(([k, v]) => [k, v.total]))
    expect(got).toEqual({
      sun: 12.45, moon: 15.23, mars: 12.88, mercury: 11.9, jupiter: 11.88, venus: 14.75, saturn: 16.25,
    })
  })

  it('D1-मैत्री और वर्ग-चार्ट-मैत्री में फ़र्क़ आता है (यानी नियम सचमुच बदला)', () => {
    const k = computeKundli(swe, BIRTH_1985)
    const d1 = Object.fromEntries(k.planets.map((p) => [p.key, p.rashi]))
    const vargaMap = Object.fromEntries(k.planets.map((p) => [p.key, p.vargottama ?? null]))
    // D1 और किसी वर्ग की स्थितियाँ अलग हैं — इसलिए दोनों तरीक़ों के अंक अलग आते हैं
    let differs = 0
    for (const key of ['sun', 'moon', 'mars']) {
      for (const n of [3, 9, 30]) {
        const r = vimshopakaBala(k).planets[key].perVarga.find((v) => v.varga === n).rashi
        if (r !== d1[key]) differs++
      }
    }
    expect(differs).toBeGreaterThan(0)
    expect(vargaMap).toBeTruthy()
  })
})
