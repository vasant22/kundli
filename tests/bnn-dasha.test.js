// tests/bnn-dasha.test.js — BNN Vimshottari Dhasa/Bhukthi/Andhiram (Phase 6).
// Reference: docs/bnn-guide.txt भाग 5 (software dates, user 2026-10-07).
// Calibration note: the dasha uses the Moon at UT + ΔT (like the cusps) —
// this is what reproduces 23-12-1985 exactly (see dasha.js).
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { computeBhavaChalit } from '../src/bnn/kp.js'
import { computeDashaTree, dashaBalance, fmtDMY } from '../src/bnn/dasha.js'

const BIRTH = { year: 1980, month: 1, day: 22 }
const UTC = { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }
const PLACE = { latitude: 21.4833, longitude: 78.25 }
const NOW = { y: 2026, m: 10, d: 7 }

let swe
let k
beforeAll(async () => {
  swe = await initEphemeris()
  k = computeBhavaChalit(swe, UTC, PLACE)
}, 30000)

describe('BNN Phase 6 — dasha / bhukthi / andhiram', () => {
  it('balance + the nine mahadasha end dates + ages (reference भाग 5)', () => {
    const tree = computeDashaTree(swe, k.jd, BIRTH, { now: NOW })
    expect(tree.lord).toBe('saturn')
    expect(tree.balance).toEqual({ y: 5, m: 11, d: 1 })
    expect(tree.mahadashas.map((r) => r.lord)).toEqual([
      'saturn', 'mercury', 'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter',
    ])
    expect(tree.mahadashas.map((r) => r.endISO)).toEqual([
      '1985-12-23', '2002-12-23', '2009-12-23', '2029-12-23', '2035-12-23',
      '2045-12-23', '2052-12-23', '2070-12-23', '2086-12-23',
    ])
    expect(tree.mahadashas[0].age).toEqual({ y: 5, m: 11, d: 1 })
    expect(tree.mahadashas[3].age).toEqual({ y: 49, m: 11, d: 1 })
    expect(tree.mahadashas[8].age).toEqual({ y: 106, m: 11, d: 1 })
  })

  it('the VEN bhukthi list matches the reference exactly (last = maha end)', () => {
    const tree = computeDashaTree(swe, k.jd, BIRTH, { now: NOW })
    expect(tree.running.mahaIndex).toBe(3) // VEN dhasa
    const bh = tree.running.bhukthis
    expect(bh.map((r) => r.lord)).toEqual([
      'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury', 'ketu',
    ])
    expect(bh.map((r) => r.endISO)).toEqual([
      '2013-04-26', '2014-04-27', '2015-12-28', '2017-02-27', '2020-03-01',
      '2022-11-02', '2026-01-04', '2028-11-06', '2029-12-23',
    ])
  })

  it('the VEN-MER andhiram list (last = bhukthi end; readable reference rows match)', () => {
    const tree = computeDashaTree(swe, k.jd, BIRTH, { now: NOW })
    expect(tree.running.bhukthiIndex).toBe(7) // MER bhukthi
    const an = tree.running.andhirams
    expect(an.map((r) => r.lord)).toEqual([
      'mercury', 'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn',
    ])
    expect(an.map((r) => r.endISO)).toEqual([
      '2026-05-30', '2026-07-29', '2027-01-17', '2027-03-09', '2027-06-03',
      '2027-08-02', '2028-01-04', '2028-05-21', '2028-11-06',
    ])
    expect(tree.running.andhiramIndex).toBe(2) // VEN andhiram running now
  })

  it('running picks and helpers', () => {
    const tree = computeDashaTree(swe, k.jd, BIRTH, { now: NOW })
    expect(tree.running.mahaIndex).toBe(3)
    expect(tree.running.bhukthiIndex).toBe(7)
    expect(fmtDMY('1985-12-23')).toBe('23-12-1985')
    // A before-birth `now` finds nothing (guard).
    const none = computeDashaTree(swe, k.jd, BIRTH, { now: { y: 1979, m: 1, d: 1 } })
    expect(none.running.mahaIndex).toBe(-1)
  })

  it('dashaBalance: Uttara Bhadrapada-3 → Saturn, ~5.92 years left', () => {
    const b = dashaBalance(342.51216) // the ΔT Moon longitude
    expect(b.lord).toBe('saturn')
    expect(b.nakshatra).toBe(26)
    expect(b.ymd).toEqual({ y: 5, m: 11, d: 1 })
  })
})
