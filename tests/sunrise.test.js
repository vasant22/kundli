// sunrise.test.js — Phase 2: sunrise/sunset/moonrise/moonset accuracy vs
// published references (tests/fixtures/sunrise-refs.json).
// Tolerances:
// - Sun events: ±60 s (the spec's "about a minute") against both references.
// - Moon events vs AstroSage: ±150 s — their lunar parameters differ slightly
//   from Swiss Ephemeris defaults (observed +0…+2 min drift on 2026-10 events).
// - Drik's moon values use a different disc convention (center/no-refraction)
//   and are NOT asserted; Drik sun values are.
import { describe, it, expect, beforeAll } from 'vitest'
import SwissEph from 'swisseph-wasm'
import { computeDayTimes, zoneOffsetMinutesAtNoon } from '../src/sunrise.js'
import data from './fixtures/sunrise-refs.json'

let swe

beforeAll(async () => {
  swe = new SwissEph()
  await swe.initSwissEph()
})

// "HH:MM[:SS]" (hours may exceed 24 for spilled moon events) → seconds
function hmsToSeconds(s) {
  const [h, m, sec] = s.split(':').map(Number)
  return (h || 0) * 3600 + (m || 0) * 60 + (sec || 0)
}

function timeDiffSeconds(a, b) {
  return Math.abs(hmsToSeconds(a) - hmsToSeconds(b))
}

const TOL_SUN = 60
const TOL_MOON = 150

function compute(ref) {
  return computeDayTimes(swe, {
    year: Number(ref.date.slice(0, 4)),
    month: Number(ref.date.slice(5, 7)),
    day: Number(ref.date.slice(8, 10)),
    latitude: ref.latitude, longitude: ref.longitude, timeZone: ref.tz,
  })
}

describe('sunrise/sunset/moonrise/moonset vs published references', () => {
  for (const ref of data.refs) {
    it(`${ref.kind} ${ref.city} ${ref.date}: sun events within ${TOL_SUN}s${ref.kind === 'astrosage' && (ref.moonrise || ref.moonset) ? `, moon within ${TOL_MOON}s` : ''}`, () => {
      const r = compute(ref)
      if (ref.sunrise != null) expect(timeDiffSeconds(r.sunrise, ref.sunrise)).toBeLessThanOrEqual(TOL_SUN)
      if (ref.sunset != null) expect(timeDiffSeconds(r.sunset, ref.sunset)).toBeLessThanOrEqual(TOL_SUN)
      // Drik reference: moon convention differs — documented, skip assertions.
      if (ref.kind === 'astrosage') {
        if (ref.moonrise != null) expect(timeDiffSeconds(r.moonrise, ref.moonrise)).toBeLessThanOrEqual(TOL_MOON)
        if (ref.moonset != null) expect(timeDiffSeconds(r.moonset, ref.moonset)).toBeLessThanOrEqual(TOL_MOON)
      }
    })

    if (ref.dayDuration) {
      it(`${ref.kind} ${ref.city} ${ref.date}: day duration within ${TOL_SUN}s`, () => {
        const r = compute(ref)
        const h = Math.floor(r.dayDurationSeconds / 3600)
        const m = Math.floor((r.dayDurationSeconds % 3600) / 60)
        const s = r.dayDurationSeconds % 60
        expect(timeDiffSeconds(`${h}:${m}:${s}`, ref.dayDuration)).toBeLessThanOrEqual(TOL_SUN)
      })
    }
  }

  it('moon spill uses extended hours notation (AstroSage Oct 4–6 series)', () => {
    const expectFor = (day, rise) => {
      const r = compute({ date: `2026-10-0${day}`, latitude: 28.6139, longitude: 77.209, tz: 'Asia/Kolkata' })
      expect(r.moonrise).toMatch(/^2\d:/) // extended notation, e.g. 24:33:59
      expect(timeDiffSeconds(r.moonrise, rise)).toBeLessThanOrEqual(TOL_MOON)
    }
    expectFor(4, '24:33:59')
    expectFor(5, '25:41:00')
    expectFor(6, '26:45:59')
  })

  it('AstroSage 2026-09-29 (second-precision) — all four events', () => {
    const r = compute({ date: '2026-09-29', latitude: 28.6139, longitude: 77.209, tz: 'Asia/Kolkata' })
    expect(timeDiffSeconds(r.sunrise, '06:12:41')).toBeLessThanOrEqual(TOL_SUN)
    expect(timeDiffSeconds(r.sunset, '18:10:03')).toBeLessThanOrEqual(TOL_SUN)
    expect(timeDiffSeconds(r.moonrise, '19:40:00')).toBeLessThanOrEqual(TOL_MOON)
    expect(timeDiffSeconds(r.moonset, '08:43:59')).toBeLessThanOrEqual(TOL_MOON)
  })

  it('timezone: Asia/Kolkata resolves to +05:30', () => {
    expect(zoneOffsetMinutesAtNoon(2026, 9, 29, 'Asia/Kolkata')).toBe(330)
  })
})

describe('polar cases (no sunrise/sunset)', () => {
  it('Tromsø 2026-06-21 (polar day): events absent, note=polar', () => {
    const r = computeDayTimes(swe, {
      year: 2026, month: 6, day: 21,
      latitude: 69.6492, longitude: 18.9553,
      timeZone: 'Europe/Oslo',
    })
    expect(r.sunriseJd).toBeNull()
    expect(r.sunsetJd).toBeNull()
    expect(r.note).toBe('polar')
  })

  it('Tromsø 2026-12-21 (polar night): events absent, note=polar', () => {
    const r = computeDayTimes(swe, {
      year: 2026, month: 12, day: 21,
      latitude: 69.6492, longitude: 18.9553,
      timeZone: 'Europe/Oslo',
    })
    expect(r.sunriseJd).toBeNull()
    expect(r.sunsetJd).toBeNull()
    expect(r.note).toBe('polar')
  })
})
