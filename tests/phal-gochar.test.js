// tests/phal-gochar.test.js — आज का गोचर + अगले 2 वर्ष के राशि-परिवर्तन।
import { beforeAll, describe, expect, it } from 'vitest'
import { computeKundli, initEphemeris } from '../src/astro.js'
import { makeFrame } from '../src/phal/frame.js'
import { GOCHAR_SHUBHA, computeGochar, longitudeAt, nextSignChanges } from '../src/phal/gochar.js'
import { msToJd } from '../src/phal/sadesati.js'

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

const BIRTH = {
  utc: { year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 },
  latitude: 25.31668,
  longitude: 83.01041,
}
const NOW = Date.UTC(2026, 10, 11, 12) // 11-11-2026
const DAY = 86400000

describe('the Phaladeepika gochara table', () => {
  it('matches the classical benefic houses from the Moon', () => {
    expect(GOCHAR_SHUBHA.sun).toEqual([3, 6, 10, 11])
    expect(GOCHAR_SHUBHA.moon).toEqual([1, 3, 6, 7, 10, 11])
    expect(GOCHAR_SHUBHA.mars).toEqual([3, 6, 11])
    expect(GOCHAR_SHUBHA.mercury).toEqual([2, 4, 6, 8, 10, 11])
    expect(GOCHAR_SHUBHA.jupiter).toEqual([2, 5, 7, 9, 11])
    expect(GOCHAR_SHUBHA.venus).toEqual([1, 2, 3, 4, 5, 8, 9, 11, 12])
    expect(GOCHAR_SHUBHA.saturn).toEqual([3, 6, 11])
    expect(GOCHAR_SHUBHA.rahu).toEqual([3, 6, 11])
  })
})

describe('longitudeAt', () => {
  it('Ketu is always 180° from Rahu (mean node)', () => {
    const jd = msToJd(NOW)
    const rahu = longitudeAt(swe, 'rahu', jd)
    const ketu = longitudeAt(swe, 'ketu', jd)
    expect(Math.abs(((ketu - rahu + 360) % 360) - 180)).toBeLessThan(1e-6)
  })

  it('gives a sidereal longitude in 0..360 for every graha', () => {
    const jd = msToJd(NOW)
    for (const key of Object.keys(GOCHAR_SHUBHA)) {
      const lon = longitudeAt(swe, key, jd)
      expect(lon).toBeGreaterThanOrEqual(0)
      expect(lon).toBeLessThan(360)
    }
  })
})

describe('computeGochar', () => {
  let frame
  let res
  beforeAll(() => {
    frame = makeFrame(computeKundli(swe, BIRTH))
    res = computeGochar(swe, frame, { nowMs: NOW, years: 2 })
  })

  it('reports all nine grahas with both house counts', () => {
    expect(Object.keys(res.positions).length).toBe(9)
    for (const [key, p] of Object.entries(res.positions)) {
      expect(p.rashi).toBeGreaterThanOrEqual(0)
      expect(p.rashi).toBeLessThanOrEqual(11)
      expect(p.houseFromMoon).toBe(((p.rashi - frame.byKey.moon.rashi + 12) % 12) + 1)
      expect(p.houseFromLagna).toBe(((p.rashi - frame.lagnaRashi + 12) % 12) + 1)
      expect(p.shubhaFromMoon).toBe(GOCHAR_SHUBHA[key].includes(p.houseFromMoon))
      expect(key).toBe(p.key)
    }
    // the four the report names explicitly
    expect(res.main.jupiter.key).toBe('jupiter')
    expect(res.main.saturn.key).toBe('saturn')
    expect(res.main.rahu.key).toBe('rahu')
    expect(res.main.ketu.key).toBe('ketu')
  })

  it('Jupiter and Saturn both change sign at least once in two years', () => {
    expect(res.nextChanges.jupiter.length).toBeGreaterThanOrEqual(1)
    expect(res.nextChanges.saturn.length).toBeGreaterThanOrEqual(1)
  })

  it('every reported ingress really is a sign change', () => {
    for (const list of [res.nextChanges.jupiter, res.nextChanges.saturn]) {
      for (const ch of list) {
        expect(ch.atMs).toBeGreaterThan(NOW)
        expect(ch.atMs).toBeLessThan(NOW + 2 * 365.25 * DAY)
        const before = Math.floor(longitudeAt(swe, ch.key, msToJd(ch.atMs - DAY)) / 30) % 12
        const after = Math.floor(longitudeAt(swe, ch.key, msToJd(ch.atMs + DAY)) / 30) % 12
        expect(before).toBe(ch.fromRashi)
        // a retrograde loop can bring the graha back, so check "after" only
        // when the ingress is not immediately followed by a return
        expect([ch.toRashi, ch.fromRashi]).toContain(after)
        expect(after).not.toBe(before)
      }
    }
  })

  it('ingresses are chronological', () => {
    for (const list of [res.nextChanges.jupiter, res.nextChanges.saturn]) {
      for (let i = 1; i < list.length; i++) expect(list[i].atMs).toBeGreaterThan(list[i - 1].atMs)
    }
  })

  it('a different moment gives a different snapshot', () => {
    const later = computeGochar(swe, frame, { nowMs: NOW + 400 * DAY, years: 1 })
    expect(later.positions.jupiter.rashi === res.positions.jupiter.rashi &&
      later.positions.saturn.rashi === res.positions.saturn.rashi).toBe(false)
  })
})

describe('nextSignChanges', () => {
  it('is empty when the window is too short to hold an ingress', () => {
    expect(nextSignChanges(swe, 'saturn', NOW, { years: 0.05 })).toEqual([])
  })
})
