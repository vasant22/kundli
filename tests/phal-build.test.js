// tests/phal-build.test.js — buildPhalData: पाँच अलग जन्म-विवरण, बिना error,
// बिना NaN/undefined (टास्क 01 की पूरी-होने की कसौटी)।
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris, computeKundli } from '../src/astro.js'
import { buildPhalData } from '../src/phal/index.js'

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

const NOW = Date.UTC(2026, 10, 11, 12) // 11-11-2026

const CHARTS = [
  {
    id: 'varanasi-1990',
    utc: { year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 },
    latitude: 25.31668,
    longitude: 83.01041,
    local: { year: 1990, month: 5, day: 15, hour: 14, minute: 30, second: 0 },
    timeZone: 'Asia/Kolkata',
  },
  {
    id: 'kolkata-1943',
    utc: { year: 1943, month: 3, day: 3, hour: 0, minute: 45, second: 0 },
    latitude: 22.5726,
    longitude: 88.3639,
    local: { year: 1943, month: 3, day: 3, hour: 6, minute: 15, second: 0 },
    timeZone: 'Asia/Kolkata',
  },
  {
    id: 'delhi-1975-near-midnight',
    utc: { year: 1975, month: 12, day: 25, hour: 18, minute: 25, second: 0 },
    latitude: 28.6139,
    longitude: 77.209,
    local: { year: 1975, month: 12, day: 25, hour: 23, minute: 55, second: 0 },
    timeZone: 'Asia/Kolkata',
  },
  {
    id: 'mumbai-2020',
    utc: { year: 2020, month: 1, day: 24, hour: 6, minute: 30, second: 0 },
    latitude: 19.076,
    longitude: 72.8777,
    local: { year: 2020, month: 1, day: 24, hour: 12, minute: 0, second: 0 },
    timeZone: 'Asia/Kolkata',
  },
  {
    id: 'guwahati-2010-leap-year',
    utc: { year: 2010, month: 8, day: 14, hour: 22, minute: 35, second: 0 },
    latitude: 26.1445,
    longitude: 91.7362,
    local: { year: 2010, month: 8, day: 15, hour: 4, minute: 5, second: 0 },
    timeZone: 'Asia/Kolkata',
  },
]

// Walk the object and collect anything that is not JSON-representable.
function scan(value, path, bad) {
  if (value === undefined) bad.push(`${path} = undefined`)
  else if (typeof value === 'function') bad.push(`${path} = function`)
  else if (typeof value === 'number' && !Number.isFinite(value)) bad.push(`${path} = ${value}`)
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) scan(v, `${path}.${k}`, bad)
  }
}

describe('buildPhalData over five charts', () => {
  for (const birth of CHARTS) {
    it(`${birth.id}: complete object, no NaN and no undefined`, () => {
      const data = buildPhalData(swe, birth, { nowMs: NOW })
      expect(data.error).toBeUndefined()

      const bad = []
      scan(data, birth.id, bad)
      expect(bad).toEqual([])

      // every section exists with the right shape
      expect(data.planets.length).toBe(9)
      expect(data.houses.length).toBe(12)
      expect(Object.keys(data.vargas.charts).length).toBe(16)
      expect(data.yogas.list.length).toBeGreaterThan(20)
      expect(data.yogas.drishti.length).toBe(9)
      expect(data.ashtakavarga.sav.bySign.length).toBe(12)
      expect(data.ashtakavarga.sav.byHouse.length).toBe(12)
      expect(data.ashtakavarga.sav.total).toBe(337)
      expect(data.dasha.mahadashas.length).toBeGreaterThanOrEqual(8)
      const lastMd = data.dasha.mahadashas[data.dasha.mahadashas.length - 1]
      expect(lastMd.toMs).toBeGreaterThanOrEqual(data.meta.birthMs + 100 * 365.25 * 86400000 - 1)
      expect(data.dasha.antardashas10y.length).toBeGreaterThan(0)
      expect(data.avakahada.karakas.length).toBe(7)
      // D60 देवता हर ग्रह और लग्न के लिए (टास्क 01-ग)
      expect(Object.keys(data.vargas.d60.planets).length).toBe(9)
      expect(data.vargas.d60.lagna.number).toBeGreaterThanOrEqual(1)
      expect(data.vargas.d60.lagna.number).toBeLessThanOrEqual(60)
      expect(typeof data.vargas.d60.lagna.hi).toBe('string')
      // विंशोपक सिर्फ़ सात ग्रहों का — राहु/केतु पर null
      const rahuRow = data.planets.find((r) => r.key === 'rahu')
      expect(rahuRow.vimshopaka).toBe(null)
      expect(typeof data.planets.find((r) => r.key === 'sun').vimshopaka).toBe('number')
      // संवेदनशीलता की सीमा output में
      expect(data.vargas.sensitivityLimitSec).toBe(600)
      expect(data.avakahada.sudarshan.length).toBe(12)
      expect(data.sadesati.scannedUntilMs).toBeGreaterThan(data.meta.birthMs)
      expect(data.karakaNature.lagna).toBe(data.summary.lagnaRashi)
      expect(typeof data.ratna.jeevan.planet).toBe('string')
      expect(data.ratna.jeevan.gem.hi.length).toBeGreaterThan(0)

      // the summary is filled in
      const s = data.summary
      expect(typeof s.lagnaRashi).toBe('number')
      expect(s.lagnaName.hi.length).toBeGreaterThan(0)
      expect(typeof s.mahadasha).toBe('string')
      expect(typeof s.antardasha).toBe('string')
      expect(typeof s.pratyantardasha).toBe('string')
      expect(s.pada).toBeGreaterThanOrEqual(1)
      expect(s.pada).toBeLessThanOrEqual(4)

      // serialisable as-is
      const json = JSON.stringify(data)
      expect(json.length).toBeGreaterThan(2000)
      expect(() => JSON.parse(json)).not.toThrow()
    }, 120000)
  }

  it('is deterministic for the same inputs', () => {
    const a = JSON.stringify(buildPhalData(swe, CHARTS[0], { nowMs: NOW }))
    const b = JSON.stringify(buildPhalData(swe, CHARTS[0], { nowMs: NOW }))
    expect(a).toBe(b)
  }, 120000)

  it('agrees with computeKundli for the lagna, the grahas and the dasha start', () => {
    const birth = CHARTS[0]
    const k = computeKundli(swe, birth)
    const data = buildPhalData(swe, birth, { nowMs: NOW })
    expect(data.summary.lagnaRashi).toBe(k.ascendant.rashi)
    expect(data.summary.moonRashi).toBe(k.planets.find((p) => p.key === 'moon').rashi)
    for (const p of k.planets) {
      const row = data.planets.find((x) => x.key === p.key)
      expect(row.rashi).toBe(p.rashi)
      expect(row.house).toBe(p.house)
      expect(row.nakshatra).toBe(p.nakshatra)
      expect(Math.abs(row.degInSign - p.degInSign)).toBeLessThan(1e-9)
    }
  }, 120000)

  it('a polar latitude is refused cleanly instead of crashing', () => {
    const res = buildPhalData(
      swe,
      {
        utc: { year: 1990, month: 6, day: 21, hour: 12, minute: 0, second: 0 },
        latitude: 89.9,
        longitude: 20,
      },
      { nowMs: NOW }
    )
    expect(res.error === 'polar' || res.planets?.length === 9).toBe(true)
  }, 120000)
})
