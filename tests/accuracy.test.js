// tests/accuracy.test.js — Phase 9 accuracy fixtures (known birth charts).
// Reference values were generated with pyswisseph 2.10.03 — the canonical
// Python binding of Swiss Ephemeris, the same library version this app
// compiles to WebAssembly. Regenerate with:
//   python3 -m venv .venv && .venv/bin/pip install pyswisseph
//   .venv/bin/python scripts/gen-fixtures.py --compact
// Run with: npm test
import { beforeAll, describe, expect, it } from 'vitest'
import { computeKundli, initEphemeris } from '../src/astro.js'

// utc: the birth instant in Universal Time; rashi: 0-11 (0 = Mesha);
// lon: sidereal longitude in degrees (reference engine values).
const CASES = [
  {
    id: 'varanasi-1990 — 15 May 1990, 14:30 IST',
    utc: { year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 },
    latitude: 25.31668,
    longitude: 83.01041,
    ayanamsa: 23.7225,
    lagna: { rashi: 5, lon: 157.037 },
    planets: [
      { key: 'sun', rashi: 1, lon: 30.55 },
      { key: 'moon', rashi: 9, lon: 271.894 },
      { key: 'mars', rashi: 10, lon: 324.515 },
      { key: 'mercury', rashi: 0, lon: 14.302 },
      { key: 'jupiter', rashi: 2, lon: 75.792 },
      { key: 'venus', rashi: 11, lon: 348.95 },
      { key: 'saturn', rashi: 9, lon: 271.526 },
      { key: 'rahu', rashi: 9, lon: 287.62 },
      { key: 'ketu', rashi: 3, lon: 107.62 },
    ],
  },
  {
    id: 'kolkata-1943 — 3 Mar 1943, 06:15 IST (wartime +06:30)',
    utc: { year: 1943, month: 3, day: 2, hour: 23, minute: 45, second: 0 },
    latitude: 22.5726,
    longitude: 88.3639,
    ayanamsa: 23.0633,
    lagna: { rashi: 10, lon: 303.931 },
    planets: [
      { key: 'sun', rashi: 10, lon: 318.464 },
      { key: 'moon', rashi: 9, lon: 271.332 },
      { key: 'mars', rashi: 9, lon: 272.812 },
      { key: 'mercury', rashi: 9, lon: 294.783 },
      { key: 'jupiter', rashi: 2, lon: 82.248 },
      { key: 'venus', rashi: 11, lon: 343.715 },
      { key: 'saturn', rashi: 1, lon: 43.093 },
      { key: 'rahu', rashi: 4, lon: 121.223 },
      { key: 'ketu', rashi: 10, lon: 301.223 },
    ],
  },
  {
    id: 'delhi-1975 — 25 Dec 1975, 23:55 IST (near midnight)',
    utc: { year: 1975, month: 12, day: 25, hour: 18, minute: 25, second: 0 },
    latitude: 28.6139,
    longitude: 77.209,
    ayanamsa: 23.5216,
    lagna: { rashi: 5, lon: 153.921 },
    planets: [
      { key: 'sun', rashi: 8, lon: 249.813 },
      { key: 'moon', rashi: 5, lon: 161.754 },
      { key: 'mars', rashi: 1, lon: 55.713 },
      { key: 'mercury', rashi: 8, lon: 264.632 },
      { key: 'jupiter', rashi: 11, lon: 351.622 },
      { key: 'venus', rashi: 6, lon: 208.416 },
      { key: 'saturn', rashi: 3, lon: 97.974 },
      { key: 'rahu', rashi: 6, lon: 206.072 },
      { key: 'ketu', rashi: 0, lon: 26.072 },
    ],
  },
  {
    id: 'nairobi-1980 — 20 Jun 1980, 18:45 EAT (southern hemisphere)',
    utc: { year: 1980, month: 6, day: 20, hour: 15, minute: 45, second: 0 },
    latitude: -1.2921,
    longitude: 36.8219,
    ayanamsa: 23.5843,
    lagna: { rashi: 8, lon: 248.837 },
    planets: [
      { key: 'sun', rashi: 2, lon: 65.861 },
      { key: 'moon', rashi: 5, lon: 157.323 },
      { key: 'mars', rashi: 4, lon: 145.741 },
      { key: 'mercury', rashi: 2, lon: 89.232 },
      { key: 'jupiter', rashi: 4, lon: 130.903 },
      { key: 'venus', rashi: 1, lon: 57.507 },
      { key: 'saturn', rashi: 4, lon: 147.329 },
      { key: 'rahu', rashi: 3, lon: 119.224 },
      { key: 'ketu', rashi: 9, lon: 299.224 },
    ],
  },
  {
    id: 'newyork-1976 — 4 Jul 1976, 09:30 EDT (US daylight saving)',
    utc: { year: 1976, month: 7, day: 4, hour: 13, minute: 30, second: 0 },
    latitude: 40.7128,
    longitude: -74.006,
    ayanamsa: 23.5289,
    lagna: { rashi: 4, lon: 125.799 },
    planets: [
      { key: 'sun', rashi: 2, lon: 79.15 },
      { key: 'moon', rashi: 5, lon: 166.973 },
      { key: 'mars', rashi: 4, lon: 125.012 },
      { key: 'mercury', rashi: 2, lon: 66.402 },
      { key: 'jupiter', rashi: 0, lon: 29.252 },
      { key: 'venus', rashi: 2, lon: 83.654 },
      { key: 'saturn', rashi: 3, lon: 99.837 },
      { key: 'rahu', rashi: 6, lon: 195.909 },
      { key: 'ketu', rashi: 0, lon: 15.909 },
    ],
  },
  {
    id: 'chennai-2005 — 10 Aug 2005, 03:05 IST',
    utc: { year: 2005, month: 8, day: 9, hour: 21, minute: 35, second: 0 },
    latitude: 13.0827,
    longitude: 80.2707,
    ayanamsa: 23.9354,
    lagna: { rashi: 2, lon: 73.613 },
    planets: [
      { key: 'sun', rashi: 3, lon: 113.444 },
      { key: 'moon', rashi: 5, lon: 165.906 },
      { key: 'mars', rashi: 0, lon: 13.12 },
      { key: 'mercury', rashi: 3, lon: 106.91 },
      { key: 'jupiter', rashi: 5, lon: 170.718 },
      { key: 'venus', rashi: 4, lon: 147.465 },
      { key: 'saturn', rashi: 3, lon: 99.201 },
      { key: 'rahu', rashi: 11, lon: 352.692 },
      { key: 'ketu', rashi: 5, lon: 172.692 },
    ],
  },
]

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

describe('accuracy fixtures vs pyswisseph 2.10.03', () => {
  for (const chart of CASES) {
    it(chart.id, () => {
      const kundli = computeKundli(swe, {
        utc: chart.utc,
        latitude: chart.latitude,
        longitude: chart.longitude,
      })

      expect(kundli.error).toBeUndefined()
      expect(kundli.ayanamsa).toBeCloseTo(chart.ayanamsa, 2)

      // Lagna rashi + degree
      expect(kundli.ascendant.rashi).toBe(chart.lagna.rashi)
      expect(kundli.ascendant.longitude).toBeCloseTo(chart.lagna.lon, 2)

      // Every planet: rashi + degree
      for (const expected of chart.planets) {
        const ours = kundli.planets.find((p) => p.key === expected.key)
        expect(ours, expected.key).toBeTruthy()
        expect(ours.rashi, `${expected.key} rashi`).toBe(expected.rashi)
        expect(ours.longitude, `${expected.key} longitude`).toBeCloseTo(expected.lon, 2)
      }
    })
  }
})
