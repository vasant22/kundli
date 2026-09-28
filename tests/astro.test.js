// tests/astro.test.js — Phase 5 verification of the Vedic calculations.
// Uses the REAL Swiss Ephemeris WASM in Node. Run with: npm test
import { beforeAll, describe, expect, it } from 'vitest'
import { describeLongitude, initEphemeris, computeKundli } from '../src/astro.js'

// Sample chart: 15 May 1990, 14:30 IST (09:00 UT), Varanasi.
const SAMPLE = {
  utc: { year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 },
  latitude: 25.31668,
  longitude: 83.01041,
}

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

const planetOf = (kundli, key) => kundli.planets.find((p) => p.key === key)

describe('describeLongitude (pure helper)', () => {
  const def = { key: 'x', name: 'X', short: 'X' }

  it('handles exact sign boundaries', () => {
    expect(describeLongitude(30, 1, def)).toMatchObject({ rashi: 1, degInSign: 0 })
    expect(describeLongitude(0, 1, def)).toMatchObject({ rashi: 0, degInSign: 0 })
    expect(describeLongitude(360, 1, def)).toMatchObject({ rashi: 0, degInSign: 0 })
    expect(describeLongitude(359.9999999, 1, def)).toMatchObject({ rashi: 11 })
  })

  it('computes nakshatras and padas (27 nakshatras of 13°20′)', () => {
    expect(describeLongitude(0, 1, def)).toMatchObject({ nakshatra: 1, pada: 1 })
    // Start of the 2nd nakshatra (13°20′) = start of its 1st pada
    expect(describeLongitude(360 / 27, 1, def)).toMatchObject({ nakshatra: 2, pada: 1 })
    // Clearly inside the 3rd pada of the 2nd nakshatra (20°–23°20′)
    expect(describeLongitude(22, 1, def)).toMatchObject({ nakshatra: 2, pada: 3 })
    expect(describeLongitude(359.9999999, 1, def)).toMatchObject({ nakshatra: 27, pada: 4 })
  })

  it('flags retrograde from negative speed', () => {
    expect(describeLongitude(10, 1.2, def).retro).toBe(false)
    expect(describeLongitude(10, -0.2, def).retro).toBe(true)
  })
})

describe('computeKundli (sample chart, Lahiri sidereal)', () => {
  let kundli
  beforeAll(() => {
    kundli = computeKundli(swe, SAMPLE)
  })

  it('returns the expected structure', () => {
    expect(kundli.error).toBeUndefined()
    expect(kundli.ascendant).toBeTruthy()
    expect(kundli.planets.map((p) => p.key)).toEqual([
      'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu',
    ])
    kundli.planets.forEach((p) => {
      expect(p.rashi).toBeGreaterThanOrEqual(0)
      expect(p.rashi).toBeLessThanOrEqual(11)
      expect(p.house).toBeGreaterThanOrEqual(1)
      expect(p.house).toBeLessThanOrEqual(12)
      expect(p.nakshatra).toBeGreaterThanOrEqual(1)
      expect(p.nakshatra).toBeLessThanOrEqual(27)
      expect(p.pada).toBeGreaterThanOrEqual(1)
      expect(p.pada).toBeLessThanOrEqual(4)
    })
  })

  it('Lahiri ayanamsa matches the standard values', () => {
    expect(kundli.ayanamsa).toBeCloseTo(23.7225, 2) // 1990 ≈ 23°43′
    const j2000 = computeKundli(swe, {
      utc: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 },
      latitude: 0,
      longitude: 0,
    })
    expect(j2000.ayanamsa).toBeCloseTo(23.8571, 2) // Swiss Ephemeris: ≈ 23°51′25.5″ at J2000
  })

  it('finds the right lagna and whole-sign house frame', () => {
    // Ascendant ≈ 7°02′ Kanya (Virgo); house 1 by definition.
    expect(kundli.ascendant.rashi).toBe(5)
    expect(kundli.ascendant.degInSign).toBeCloseTo(7.04, 1)
    expect(kundli.ascendant.house).toBe(1)

    // Whole-sign houses counted from the lagna:
    expect(planetOf(kundli, 'sun').house).toBe(9)
    expect(planetOf(kundli, 'moon').house).toBe(5)
    expect(planetOf(kundli, 'saturn').house).toBe(5)
    expect(planetOf(kundli, 'venus').house).toBe(7)
  })

  it('matches a known solar position (sidereal)', () => {
    const sun = planetOf(kundli, 'sun')
    expect(sun.longitude).toBeCloseTo(30.55, 1) // 0°33′ Vrishabha
    expect(sun.nakshatra).toBe(3) // Krittika
    expect(sun.pada).toBe(2)
  })

  it('flags retrogrades and Rahu/Ketu correctly', () => {
    expect(planetOf(kundli, 'mercury').retro).toBe(true)
    expect(planetOf(kundli, 'saturn').retro).toBe(true)
    expect(planetOf(kundli, 'sun').retro).toBe(false)
    expect(planetOf(kundli, 'venus').retro).toBe(false)

    const rahu = planetOf(kundli, 'rahu')
    const ketu = planetOf(kundli, 'ketu')
    expect(rahu.retro).toBe(true)
    expect(ketu.retro).toBe(true)
    expect(ketu.longitude).toBeCloseTo((rahu.longitude + 180) % 360, 9)
  })

  it('sidereal = tropical − ayanamsa (flag plumbing check)', () => {
    const u = SAMPLE.utc
    const jd = swe.julday(u.year, u.month, u.day, u.hour + u.minute / 60)
    const tropical = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED)
    const delta = tropical[0] - planetOf(kundli, 'sun').longitude
    expect(delta).toBeCloseTo(kundli.ayanamsa, 1)
  })

  it('supports True Node as an option', () => {
    const withTrue = computeKundli(swe, { ...SAMPLE, nodeType: 'true' })
    const mean = planetOf(kundli, 'rahu')
    const trueNode = planetOf(withTrue, 'rahu')
    expect(trueNode.longitude).toBeCloseTo(286.54, 1)
    expect(Math.abs(trueNode.longitude - mean.longitude)).toBeGreaterThan(0.5)
  })

  it('handles polar latitudes gracefully', () => {
    const polar = computeKundli(swe, { ...SAMPLE, latitude: 89.9, longitude: 0 })
    expect(polar).toBeTruthy()
    if (!polar.error) {
      expect(Number.isFinite(polar.ascendant.longitude)).toBe(true)
    } else {
      expect(polar.error).toBe('polar')
    }
  })
})
