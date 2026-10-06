// tests/bnn-kp.test.js — BNN kp.js: ayanamsa + bhava chalit (Phase 2).
// Uses the REAL Swiss Ephemeris WASM in Node (like tests/astro.test.js).
//
// Reference chart (docs/bnn-guide.txt भाग 5): 22-01-1980, 20:30, Betul.
// Exact inputs confirmed from the old software's own screenshots (2026-10-07
// user message; ref no 58): lat 21.4833, lon 78.25, 20:30:00 IST. Its cusps
// correspond to UT + ΔT — see BNN_SETTINGS.housesAtDeltaT; with that every
// reference value matches within ~0.9′ (values are whole-arcminute rounded).
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { BNN_SETTINGS, computeBhavaChalit, findExchanges, tithiIndexOf, yogaIndexOf } from '../src/bnn/kp.js'
import { cuspText, planetText } from '../src/bnn/render.js'

const BIRTH = {
  // Exact inputs from the old software (user screenshots, 2026-10-07):
  utc: { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, // 20:30:00 IST
  place: { latitude: 21.4833, longitude: 78.25 }, // Betul per the old software
}

// Absolute longitudes from the guide's reference values.
const REF_CUSPS = [
  132.88333, 160.9, 191.51667, 222.86667, 253.6, 283.63333,
  312.88333, 340.9, 11.51667, 42.86667, 73.6, 103.63333,
]
const REF_PLANETS = {
  sun: 278.15, moon: 342.5, mars: 141.5, mercury: 278.98333, jupiter: 135.5,
  venus: 314.3, saturn: 153.2, rahu: 127.16667, ketu: 307.16667,
}

const circDelta = (a, b) => Math.abs(((a - b + 540) % 360) - 180)
const ARCMIN = 1 / 60

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

describe('BNN Phase 2 — ayanamsa + bhava chalit', () => {
  it('uses the reference-matched ayanamsa (mode 44 ≈ 23°35.1′ at 1980)', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    expect(BNN_SETTINGS.ayanamsaMode).toBe(44)
    expect(Math.abs(k.ayanamsa - 23.585)).toBeLessThan(0.002) // 23°35.10′ ± 0.1′
  })

  it('reproduces all 12 cusps within 1 arc-minute', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    k.cusps.forEach((c, i) => {
      expect(circDelta(c.longitude, REF_CUSPS[i])).toBeLessThan(ARCMIN)
      expect(c.n).toBe(i + 1)
    })
    expect(k.ascendant.longitude).toBe(k.cusps[0].longitude)
    expect(k.ascendant.rashi).toBe(4) // Leo
  })

  it('reproduces the planets within 1′ (values are arcminute-rounded)', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    for (const p of k.planets) {
      expect(circDelta(p.longitude, REF_PLANETS[p.key]), p.key).toBeLessThan(1.0 * ARCMIN)
    }
    const mars = k.planets.find((p) => p.key === 'mars')
    const sun = k.planets.find((p) => p.key === 'sun')
    const rahu = k.planets.find((p) => p.key === 'rahu')
    expect(mars.retro).toBe(true) // मंगल# वक्री
    expect(sun.retro).toBe(false)
    expect(rahu.retro).toBe(true) // राहु सदैव वक्री
  })

  it('matches the old face’s displayed arcminutes exactly (truncated)', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    expect(k.cusps.map((c) => cuspText(c)).slice(0, 6)).toEqual([
      '01 12.53', '02 10.54', '03 11.31', '04 12.52', '05 13.36', '06 13.38',
    ])
    const byKey = Object.fromEntries(k.planets.map((p) => [p.key, planetText(p)]))
    expect(byKey.sun).toBe('SUN 08.09')
    expect(byKey.moon).toBe('MOO 12.30')
    expect(byKey.venus).toBe('VEN 14.18')
    expect(byKey.saturn).toBe('SAT# 03.12')
    expect(byKey.jupiter).toBe('JUP# 15.30')
    expect(byKey.mars).toBe('MAR# 21.30')
    expect(byKey.mercury).toBe('MER 08.59')
    expect(byKey.rahu).toBe('RAH 07.10')
    expect(byKey.ketu).toBe('KET 07.10')
  })

  it('places planets into the cusp-based bhavas (wrap through 0° included)', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    const moon = k.planets.find((p) => p.key === 'moon')
    const sun = k.planets.find((p) => p.key === 'sun')
    expect(moon.bhava).toBe(8) // Pis 12°31′ → cusp8..cusp9
    expect(sun.bhava).toBe(5) // Cap 8°10′ → cusp5..cusp6
  })

  it('computes tithi, yoga and the exchange pair (guide checks)', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    expect(k.tithiIndex).toBe(6) // शुक्ल षष्ठी
    expect(k.yogaIndex).toBe(20) // शिव योग
    const moon = k.planets.find((p) => p.key === 'moon')
    expect(moon.nakshatra).toBe(26) // उत्तरा भाद्रपद
    expect(moon.pada).toBe(3)
    expect(findExchanges(k.planets)).toEqual([['mercury', 'saturn']]) // MERCURY<>SATURN
  })

  it('tithi/yoga helpers are plain arithmetic', () => {
    expect(tithiIndexOf(0, 0)).toBe(1)
    expect(tithiIndexOf(0, 60)).toBe(6)
    expect(tithiIndexOf(0, 350)).toBe(30)
    expect(yogaIndexOf(0, 0)).toBe(1)
    expect(yogaIndexOf(180, 180)).toBe(1) // 360° → wraps to 0
  })
})
