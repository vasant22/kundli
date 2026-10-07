// tests/bnn-transit.test.js — BNN transit ring (Phase 7).
// References: 01-10-2026 ≈12:16 IST (guide भाग 5) and the old software's outer
// face at 07-10-2026 04:40:03 IST (user screenshot). Calibration: planets &
// ascendant at UT + ΔT (+0.5 s); ring numbers round to the arcminute.
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { computeTransitSnapshot } from '../src/bnn/transit.js'

const PLACE = { latitude: 21.4833, longitude: 78.25 }
const CODE = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' }
const roundMin = (deg) => {
  const total = Math.round(deg * 60)
  const d = Math.floor(total / 60)
  const m = total % 60
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`
}
const label = (p) => `${CODE[p.key]}${p.retro && p.key !== 'rahu' && p.key !== 'ketu' ? '#' : ''} ${roundMin(p.degInSign)}`
const byKey = (t) => Object.fromEntries(t.planets.map((p) => [p.key, p]))

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

describe('BNN Phase 7 — transit snapshot', () => {
  it('01-10-2026 ≈12:16 IST matches guide भाग 5 (≤1′ per value)', () => {
    const t = computeTransitSnapshot(swe, { year: 2026, month: 10, day: 1, hour: 6, minute: 46, second: 0 }, PLACE)
    const by = byKey(t)
    // Exact display matches (rounded arcminutes, truncation-free)
    expect(label(by.moon)).toBe('MOO 13.42')
    expect(label(by.saturn)).toBe('SAT# 17.19')
    expect(label(by.rahu)).toBe('RAH 03.28')
    expect(label(by.mars)).toBe('MAR 07.37')
    expect(label(by.jupiter)).toBe('JUP 25.24')
    expect(label(by.venus)).toBe('VEN 14.10')
    expect(label(by.mercury)).toBe('MER 06.49')
    expect(label(by.ketu)).toBe('KET 03.28')
    // Sun sits on a rounding boundary → assert the 1′ tolerance instead
    expect(Math.abs(by.sun.degInSign * 60 - (13 * 60 + 52))).toBeLessThan(1)
    // Signs
    expect(by.moon.rashi).toBe(1) // Taurus
    expect(by.saturn.rashi).toBe(11) // Pisces
    expect(by.rahu.rashi).toBe(10) // Aquarius
    expect(t.ascendant.rashi).toBe(8) // Sagittarius (5°46′ ≈ a minute before 12:16)
  })

  it('07-10-2026 04:40:03 IST matches the outer-face screenshot (≤1′ per value)', () => {
    // 04:40:03 IST = 2026-10-06 23:10:03 UT
    const t = computeTransitSnapshot(swe, { year: 2026, month: 10, day: 6, hour: 23, minute: 10, second: 3 }, PLACE)
    const by = byKey(t)
    expect(label(by.saturn)).toBe('SAT# 16.52')
    expect(label(by.mars)).toBe('MAR 10.53')
    expect(label(by.jupiter)).toBe('JUP 26.24')
    expect(label(by.venus)).toBe('VEN# 13.59')
    expect(label(by.mercury)).toBe('MER 13.56')
    expect(label(by.sun)).toBe('SUN 19.28')
    expect(label(by.moon)).toBe('MOO 03.39')
    expect(`ASC ${roundMin(t.ascendant.degInSign)}`).toBe('ASC 28.01')
    expect(t.ascendant.rashi).toBe(4) // Leo
    // The nodes sit ~0.6′ from the software's printed value (their node model)
    expect(Math.abs(by.rahu.degInSign * 60 - (3 * 60 + 9))).toBeLessThan(1)
    expect(Math.abs(by.ketu.degInSign * 60 - (3 * 60 + 9))).toBeLessThan(1)
  })

  it('retrograde flags come from the ephemeris speed (SAT#/VEN# on 07-10)', () => {
    const t = computeTransitSnapshot(swe, { year: 2026, month: 10, day: 6, hour: 23, minute: 10, second: 3 }, PLACE)
    const by = byKey(t)
    expect(by.saturn.retro).toBe(true)
    expect(by.venus.retro).toBe(true)
    expect(by.jupiter.retro).toBe(false)
    expect(by.moon.retro).toBe(false)
  })
})
