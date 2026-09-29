// tests/mangaldosha.test.js — Mangal Dosha (Kuja Dosha) checks.
// Verified against the reference calculator on calibrated charts (2026-09-29):
// houses 1,4,7,8,12 from Lagna and from Moon; "low" when one chart, "high"
// when both; no 2nd house.
import { beforeAll, describe, expect, it } from 'vitest'
import { checkMangalDosha, mangalPairNotes, MANGLIK_HOUSES } from '../src/mangaldosha.js'
import { computeKundli, initEphemeris } from '../src/astro.js'

const mockKundli = (marsHouse, marsRashi, moonRashi) => ({
  planets: [
    { key: 'mars', house: marsHouse, rashi: marsRashi },
    { key: 'moon', rashi: moonRashi },
  ],
})

describe('Mangal Dosha — logic (mocks)', () => {
  it('flags houses 1/4/7/8/12 from Lagna and from the Moon', () => {
    expect(MANGLIK_HOUSES).toEqual([1, 4, 7, 8, 12])
    // 4th from lagna, 9th from moon → low, from lagna only
    const a = checkMangalDosha(mockKundli(4, 1, 5))
    expect(a).toMatchObject({ present: true, fromLagna: true, fromMoon: false, severity: 'low' })
    // 2nd from lagna is NOT a dosha house (verified against the reference)
    const b = checkMangalDosha(mockKundli(2, 0, 10))
    expect(b.present).toBe(false)
    // both charts hit → high
    const c = checkMangalDosha(mockKundli(7, 0, 6)) // moon: (0-6+12)%12+1 = 7
    expect(c).toMatchObject({ present: true, fromLagna: true, fromMoon: true, severity: 'high' })
    // neither chart → not present (3rd from lagna; 2nd from moon)
    const d = checkMangalDosha(mockKundli(3, 0, 11))
    expect(d.present).toBe(false)
    expect(d.fromLagna).toBe(false)
    expect(d.fromMoon).toBe(false)
  })

  it('notes: mutual cancellation + own sign / exaltation', () => {
    const boy = checkMangalDosha(mockKundli(7, 7, 0)) // Mars Vrishchik (own), 7th
    const girl = checkMangalDosha(mockKundli(1, 9, 3)) // Mars Makar (exalted), 1st
    const notes = mangalPairNotes(boy, girl)
    expect(notes.map((n) => n.key)).toEqual(['mutual', 'ownSign-वर', 'exalted-वधू'])
  })
})

describe('Mangal Dosha — real calibrated charts (engine)', () => {
  let swe
  beforeAll(async () => {
    swe = await initEphemeris()
  }, 30000)

  // local (IST) birth → kundli, matching scripts/calib/births.json
  const kundliOf = (y, mo, d, h, mi) => {
    const ms = Date.UTC(y, mo - 1, d, h, mi, 0) - 5.5 * 3600 * 1000
    const u = new Date(ms)
    return computeKundli(swe, {
      utc: { year: u.getUTCFullYear(), month: u.getUTCMonth() + 1, day: u.getUTCDate(), hour: u.getUTCHours(), minute: u.getUTCMinutes(), second: 0 },
      latitude: 25.31668,
      longitude: 83.01041,
    })
  }

  // expected values from the reference calculator (mangal.json)
  const cases = [
    // [y, mo, d, h, mi, fromLagna, fromMoon, severity, label]
    [1995, 10, 10, 2, 30, false, true, 'low', 'Ashi: 3rd/7th → low'],
    [1995, 2, 9, 15, 30, false, true, 'low', 'Rohini birth: 3rd/4th → low'],
    [1995, 4, 7, 13, 30, true, false, 'low', 'Ardra: 1st/2nd → low'],
    [1995, 11, 16, 8, 30, true, true, 'high', 'Magha: 1st/4th → high'],
    [1995, 1, 11, 1, 30, false, false, null, 'Bharani: 11th/5th → none'],
    [1995, 2, 18, 0, 30, false, false, null, 'UPh: 9th/11th → none'],
  ]

  for (const [y, mo, d, h, mi, fl, fm, sev, label] of cases) {
    it(label, () => {
      const r = checkMangalDosha(kundliOf(y, mo, d, h, mi))
      expect(r.fromLagna).toBe(fl)
      expect(r.fromMoon).toBe(fm)
      expect(r.severity).toBe(sev)
      expect(r.present).toBe(fl || fm)
    })
  }
})
