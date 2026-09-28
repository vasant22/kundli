// tests/i18n.test.js — Phase 6 verification of the bilingual data lists.
// Run with: npm test
import { describe, expect, it } from 'vitest'
import { GRAHAS, NAKSHATRAS, RASHIS, grahaLabel, nakshatraLabel, rashiLabel } from '../src/i18n.js'

describe('bilingual Vedic data lists (Phase 6)', () => {
  it('has 12 rashis, Mesha → Meena', () => {
    expect(RASHIS).toHaveLength(12)
    expect(RASHIS[0]).toEqual({ hi: 'मेष', en: 'Aries' })
    expect(RASHIS[5]).toEqual({ hi: 'कन्या', en: 'Virgo' })
    expect(RASHIS[11]).toEqual({ hi: 'मीन', en: 'Pisces' })
    expect(rashiLabel(5)).toBe('कन्या / Virgo')
  })

  it('has 9 grahas with the chart abbreviations', () => {
    expect(GRAHAS).toHaveLength(9)
    expect(GRAHAS.map((g) => g.short)).toEqual(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'])
    expect(grahaLabel('sun')).toBe('सूर्य / Sun')
    expect(grahaLabel('rahu')).toBe('राहु / Rahu')
    expect(grahaLabel('ketu')).toBe('केतु / Ketu')
  })

  it('has all 27 nakshatras, Ashwini → Revati', () => {
    expect(NAKSHATRAS).toHaveLength(27)
    expect(NAKSHATRAS[0]).toEqual({ hi: 'अश्विनी', en: 'Ashwini' })
    expect(NAKSHATRAS[2]).toEqual({ hi: 'कृत्तिका', en: 'Krittika' })
    expect(NAKSHATRAS[12]).toEqual({ hi: 'हस्त', en: 'Hasta' })
    expect(NAKSHATRAS[26]).toEqual({ hi: 'रेवती', en: 'Revati' })
    expect(nakshatraLabel(1)).toBe('अश्विनी / Ashwini')
    expect(nakshatraLabel(27)).toBe('रेवती / Revati')
  })
})
