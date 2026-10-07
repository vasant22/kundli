// tests/bnn-combos.test.js — BNN combination engine (Phase 4, rules R1–R7).
// Part 1: the guide's worked rule examples (pure, no ephemeris).
// Part 2: the reference chart — AP vs guide भाग 5; BP vs the old software's
// screenshots (user, 2026-10-07). Known open quirks (guide: report, don't
// implement): the old software also lists a planet sitting ≲1° behind another
// in that planet's row (SUN in MER's BP row / SUN-97 in SAT's AP row).
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { computeBhavaChalit } from '../src/bnn/kp.js'
import { astronomyPartners, bhavaCombinations, planetCombinations, seatPositions } from '../src/bnn/combos.js'

const P = (key, lon, retro = false) => ({
  key,
  longitude: lon,
  rashi: Math.floor(lon / 30) % 12,
  degInSign: lon % 30,
  retro,
})
const seq = (list) => list.map((e) => (e.type === 'planet' ? e.key : e.label.toLowerCase()))
const combosOf = (planets, mode) => planetCombinations(planets, mode)

describe('BNN Phase 4 — rule examples (guide कक्षा)', () => {
  it('(a) direct Jupiter Aries 12° → SUN, MOO, RAH, SAT, VEN', () => {
    const planets = [
      P('sun', 135), P('moon', 268), P('mars', 290), P('mercury', 122), P('jupiter', 12),
      P('venus', 156), P('saturn', 214), P('rahu', 272), P('ketu', 92),
    ]
    // The guide lists the planet members; verified aspect entries (R5) may be
    // added silently by the engine, so compare the planet members here.
    const planetsOnly = (list) => list.filter((e) => e.type === 'planet').map((e) => e.key)
    expect(planetsOnly(combosOf(planets, 'BP').jupiter.list1579)).toEqual(['sun', 'moon', 'rahu', 'saturn', 'venus'])
  })

  it('(b) retrograde Jupiter Taurus 2° → VEN, KET, MER (Rahu skipped in a 7th zone)', () => {
    const planets = [
      P('jupiter', 32, true), P('ketu', 20), P('mars', 290), P('moon', 241),
      P('saturn', 214), P('rahu', 200), P('mercury', 130), P('venus', 151), P('sun', 165),
    ]
    expect(seq(combosOf(planets, 'BP').jupiter.list1579)).toEqual(['venus', 'ketu', 'mercury'])
  })

  it('(c) direct Sun Cancer 12° → MOO, RAH', () => {
    const planets = [P('sun', 102), P('rahu', 122), P('mars', 144), P('moon', 301)]
    expect(seq(combosOf(planets, 'BP').sun.list1579)).toEqual(['moon', 'rahu'])
  })

  it('parivartana (R6): AP swaps the pair seats, BP keeps natal places', () => {
    const planets = [P('mars', 290, true), P('saturn', 214, true), P('sun', 10)]
    const bp = seatPositions(planets, 'BP')
    expect(bp.mars.lon).toBe(290)
    expect(bp.saturn.lon).toBe(214)
    const ap = seatPositions(planets, 'AP')
    expect(ap.mars.lon).toBe(214)
    expect(ap.saturn.lon).toBe(290)
    expect(ap.sun.lon).toBe(10) // not in the pair — untouched
  })

  it('aspect influence window (R5): included ≤30° ahead / ≤2° behind the point', () => {
    // Mars retro at Leo 21.5° → MAR8 point at Pisces 21.5° (351.5°).
    const planets = [
      P('mars', 141.5, true),
      P('jupiter', 342.5), // 8.99° ahead of… inside the window → MAR8 included
      P('venus', 320), // 31.5° behind the point → outside
      P('saturn', 353), // 1.5° ahead of the point (≈ behind window edge) → included
    ]
    const j = seq(combosOf(planets, 'BP').jupiter.list1579)
    expect(j).toContain('mar8')
    expect(seq(combosOf(planets, 'BP').venus.list1579)).not.toContain('mar8')
    expect(seq(combosOf(planets, 'BP').saturn.list1579)).toContain('mar8')
  })
})

// ---------------------------------------------------------------------------
const BIRTH = {
  utc: { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 },
  place: { latitude: 21.4833, longitude: 78.25 },
}

const AP_PLANETS = {
  jupiter: ['venus', 'rahu'],
  sun: ['saturn', 'ketu'],
  moon: ['mar8', 'rahu'],
  mars: ['jupiter', 'venus', 'rahu'],
  mercury: ['mars', 'jupiter', 'venus', 'rahu'],
  venus: ['jupiter', 'mars', 'mercury', 'sat3', 'moon'],
  saturn: ['ketu'], // software also shows SUN-97 — the known open quirk
  rahu: ['moon'],
  ketu: ['saturn', 'sun'],
}
const AP_BHAVA = {
  1: ['venus', 'jupiter', 'mars', 'mercury', 'sun', 'saturn'],
  2: ['moon', 'ketu', 'sat10'],
  3: ['venus'],
  4: ['moon', 'mar4', 'rahu'],
  5: ['jupiter', 'mars', 'mercury', 'sun', 'saturn'],
  6: ['ketu'],
  7: ['venus', 'jupiter', 'mars', 'mercury', 'sat3'],
  8: ['moon', 'mar8', 'rahu'],
  9: ['jupiter', 'mars', 'mercury', 'sun', 'saturn'],
  10: ['ketu'],
  11: ['venus', 'sun', 'saturn'],
  12: ['moon', 'rahu'],
}
const BP_PLANETS = {
  jupiter: ['venus', 'rahu'],
  sun: ['mercury', 'ketu'],
  moon: ['mar8', 'rahu'],
  mars: ['jupiter', 'venus', 'rahu'],
  mercury: ['ketu'], // software also shows SUN — same quirk as above
  venus: ['jupiter', 'mars', 'saturn', 'moon'],
  saturn: ['mars', 'jupiter', 'venus', 'rahu'],
  rahu: ['moon'],
  ketu: ['mercury', 'sun'],
}
const BP_BHAVA = {
  1: ['jupiter', 'mars', 'saturn', 'sun', 'mercury'],
  2: ['ketu'],
  3: ['venus', 'sat3'],
  4: ['moon', 'mar4', 'rahu'],
  5: ['jupiter', 'mars', 'saturn', 'sun', 'mercury'],
  6: ['ketu'],
  7: ['venus'],
  8: ['moon', 'mar8', 'rahu'],
  9: ['jupiter', 'mars', 'saturn', 'sun', 'mercury'],
  10: ['sat10', 'ketu'],
  11: ['venus'],
  12: ['moon', 'rahu'],
}
const BP_ASTRO = {
  jupiter: 'rahu', sun: 'mercury', moon: 'rahu', mars: 'jupiter', mercury: 'ketu',
  venus: 'moon', saturn: 'mars', rahu: 'moon', ketu: 'mercury',
}
// 159-column (drops 7th-zone members) — verified from the user's screenshots
// (2026-10-07, later message).
const BP_PLANETS_159 = {
  jupiter: ['rahu'],
  mars: ['jupiter', 'rahu'],
  venus: ['moon'],
  saturn: ['mars', 'jupiter', 'rahu'],
  moon: ['mar8', 'rahu'],
  sun: ['mercury', 'ketu'],
  rahu: ['moon'],
  ketu: ['mercury', 'sun'],
}

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

describe('BNN Phase 4 — reference chart (AP = guide, BP = software)', () => {
  it('AP planet combinations match the guide', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    const pc = combosOf(k.planets, 'AP')
    for (const [key, want] of Object.entries(AP_PLANETS)) {
      expect(seq(pc[key].list1579), key).toEqual(want)
    }
    // A few percentages (fitted constants; ±2 tolerance reported in the check)
    const pct = (list, key) => list.find((e) => e.type === 'planet' && e.key === key)?.percent
    expect(Math.abs(pct(pc.jupiter.list1579, 'venus') - 93)).toBeLessThan(2.5)
    expect(Math.abs(pct(pc.moon.list1579, 'rahu') - 19)).toBeLessThan(2.5)
  })

  it('AP bhava rows (1-5-7-9) match the guide', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    const bc = bhavaCombinations(k.planets, k.cusps, 'AP')
    for (let n = 1; n <= 12; n++) {
      expect(seq(bc[n].list1579), `B${n}`).toEqual(AP_BHAVA[n])
    }
  })

  it('BP planet combinations match the software screenshots', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    const pc = combosOf(k.planets, 'BP')
    for (const [key, want] of Object.entries(BP_PLANETS)) {
      expect(seq(pc[key].list1579), key).toEqual(want)
    }
    for (const [key, want] of Object.entries(BP_PLANETS_159)) {
      expect(seq(pc[key].list159), `${key} (159)`).toEqual(want)
    }
  })

  it('BP bhava rows (1-5-9) match the software screenshots', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    const bc = bhavaCombinations(k.planets, k.cusps, 'BP')
    for (let n = 1; n <= 12; n++) {
      expect(seq(bc[n].list159), `B${n}`).toEqual(BP_BHAVA[n])
    }
  })

  it('Astronomy column (R7) matches the software screenshots (BP)', () => {
    const k = computeBhavaChalit(swe, BIRTH.utc, BIRTH.place)
    const astro = astronomyPartners(k.planets, 'BP')
    for (const [key, want] of Object.entries(BP_ASTRO)) {
      expect(astro[key], key).toBe(want)
    }
  })
})
