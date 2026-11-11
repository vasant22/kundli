// tests/phal-text.test.js — हिंदी क्रम-वाचक (ordinalHi) और text की सफ़ाई।
//
// टास्क 01-ग की शर्त: किसी text में "7वें" जैसा अंक-रूप नहीं, और ग्रहों के
// अंग्रेज़ी keys ("venus", "sun + mars") नहीं — हर जगह हिंदी नाम।
import { describe, expect, it } from 'vitest'
import { grahaBoth, grahaHi, grahaList, houseHi, ordinalHi, rashiHi } from '../src/phal/text.js'
import { makeFrame } from '../src/phal/frame.js'
import { detectYogas } from '../src/phal/yogas.js'
import { detectDoshas } from '../src/phal/doshas.js'

describe('ordinalHi', () => {
  it('1..12 सब शब्दों में', () => {
    expect(ordinalHi(1)).toBe('पहले')
    expect(ordinalHi(2)).toBe('दूसरे')
    expect(ordinalHi(3)).toBe('तीसरे')
    expect(ordinalHi(4)).toBe('चौथे')
    expect(ordinalHi(5)).toBe('पाँचवें')
    expect(ordinalHi(6)).toBe('छठे')
    expect(ordinalHi(7)).toBe('सातवें')
    expect(ordinalHi(8)).toBe('आठवें')
    expect(ordinalHi(9)).toBe('नौवें')
    expect(ordinalHi(10)).toBe('दसवें')
    expect(ordinalHi(11)).toBe('ग्यारहवें')
    expect(ordinalHi(12)).toBe('बारहवें')
  })

  it('houseHi / grahaHi / rashiHi', () => {
    expect(houseHi(4)).toBe('चौथे भाव')
    expect(grahaHi('sun')).toBe('सूर्य')
    expect(grahaHi('jupiter')).toBe('गुरु')
    expect(grahaBoth('venus')).toBe('शुक्र / Venus')
    expect(grahaList(['sun', 'mars'])).toBe('सूर्य, मंगल')
    expect(rashiHi(9)).toBe('मकर')
  })
})

const ALL = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']
function chart(lagnaRashi, positions) {
  const planets = ALL.map((key) => {
    const rashi = positions[key]
    return {
      key, rashi, degInSign: 10, house: ((rashi - lagnaRashi + 12) % 12) + 1,
      longitude: rashi * 30 + 10, nakshatra: 1, pada: 1, speed: 1, retro: false, navamsaRashi: rashi,
    }
  })
  return makeFrame({ ascendant: { rashi: lagnaRashi, longitude: 5 }, planets })
}
const SPREAD = { sun: 10, moon: 3, mars: 5, mercury: 5, jupiter: 1, venus: 11, saturn: 9, rahu: 6, ketu: 0 }

describe('text में अंक-रूप या अंग्रेज़ी key नहीं', () => {
  it('हर योग के text में "Nवें" जैसा कुछ नहीं', () => {
    const res = detectYogas(chart(0, SPREAD))
    for (const y of res.list) {
      expect(y.text, y.id).not.toMatch(/[०-९0-9]\s*वें/)
    }
  })

  it('हर योग के text में ग्रह का अंग्रेज़ी key नहीं', () => {
    const res = detectYogas(chart(0, SPREAD))
    const keys = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']
    for (const y of res.list) {
      for (const k of keys) {
        expect(y.text.toLowerCase(), `${y.id}/${k}`).not.toContain(k)
      }
    }
  })

  it('दोषों के text भी साफ़', () => {
    const d = detectDoshas(chart(0, SPREAD))
    expect(d.mangal.present).toBe(false)
    for (const note of d.mangal.notes ?? []) {
      expect(note.hi).not.toMatch(/[०-९0-9]\s*वें/)
    }
  })
})
