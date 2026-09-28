// tests/timeutil.test.js — Phase 4 unit tests for local→UTC conversion,
// historical timezone rules, and Julian Day (via the Swiss Ephemeris).
// Run with: npm test
import { describe, expect, it } from 'vitest'
import SwissEph from 'swisseph-wasm'
import {
  formatUtcOffset,
  isValidTimeZone,
  parseUtcOffset,
  toJulianDay,
  wallTimeToUtc,
} from '../src/timeutil.js'

const conv = (y, mo, d, h, mi, s, zone) =>
  wallTimeToUtc({ year: y, month: mo, day: d, hour: h, minute: mi, second: s }, zone)

describe('offset parsing/formatting', () => {
  it('parses common offset spellings', () => {
    expect(parseUtcOffset('+05:30')).toBe(330)
    expect(parseUtcOffset('-8')).toBe(-480)
    expect(parseUtcOffset('5:30')).toBe(330)
    expect(parseUtcOffset('+14:00')).toBe(840)
    expect(parseUtcOffset('-12:00')).toBe(-720)
    expect(parseUtcOffset('+15:00')).toBeNull()
    expect(parseUtcOffset('abc')).toBeNull()
    expect(parseUtcOffset('')).toBeNull()
  })

  it('formats minutes as ±HH:MM', () => {
    expect(formatUtcOffset(330)).toBe('+05:30')
    expect(formatUtcOffset(-480)).toBe('-08:00')
    expect(formatUtcOffset(0)).toBe('+00:00')
  })

  it('validates IANA names with Intl', () => {
    expect(isValidTimeZone('Asia/Kolkata')).toBe(true)
    expect(isValidTimeZone('UTC')).toBe(true)
    expect(isValidTimeZone('Not/AZone')).toBe(false)
  })
})

describe('local birth time → UTC', () => {
  it('India 2000 (IST +05:30)', () => {
    const r = conv(2000, 5, 15, 10, 30, 0, 'Asia/Kolkata')
    expect(r.utc).toEqual({ year: 2000, month: 5, day: 15, hour: 5, minute: 0, second: 0 })
    expect(r.offsetMinutes).toBe(330)
    expect(r.offsetText).toBe('+05:30')
  })

  it('India 1943 (wartime +06:30, historical rule)', () => {
    const r = conv(1943, 5, 15, 10, 0, 0, 'Asia/Kolkata')
    expect(r.offsetMinutes).toBe(390)
    expect(r.utc.hour).toBe(3)
    expect(r.utc.minute).toBe(30)
    expect(r.utc.day).toBe(15)
  })

  it('US daylight saving: summer vs winter (America/New_York)', () => {
    const summer = conv(1990, 7, 4, 12, 0, 0, 'America/New_York')
    expect(summer.offsetMinutes).toBe(-240) // EDT
    expect(summer.utc.hour).toBe(16)

    const winter = conv(1990, 1, 4, 12, 0, 0, 'America/New_York')
    expect(winter.offsetMinutes).toBe(-300) // EST
    expect(winter.utc.hour).toBe(17)
  })

  it('midnight edges (crossing into the previous UTC day)', () => {
    const justBefore = conv(1999, 12, 31, 23, 59, 59, 'Asia/Kolkata')
    expect(justBefore.utc).toEqual({
      year: 1999,
      month: 12,
      day: 31,
      hour: 18,
      minute: 29,
      second: 59,
    })

    const midnight = conv(2000, 1, 1, 0, 0, 0, 'Asia/Kolkata')
    expect(midnight.utc).toEqual({ year: 1999, month: 12, day: 31, hour: 18, minute: 30, second: 0 })

    const after = conv(2000, 1, 1, 0, 0, 1, 'Asia/Kolkata')
    expect(after.utc).toEqual({ year: 1999, month: 12, day: 31, hour: 18, minute: 30, second: 1 })
  })

  it('accepts a fixed offset as the zone (manual override style)', () => {
    const r = conv(1990, 5, 15, 10, 0, 0, '+05:30')
    expect(r.utc.hour).toBe(4)
    expect(r.utc.minute).toBe(30)
    expect(r.offsetText).toBe('+05:30')
  })
})

describe('Julian Day via Swiss Ephemeris', () => {
  it('matches known values', async () => {
    const swe = new SwissEph()
    await swe.initSwissEph()
    const julday = swe.julday.bind(swe)

    const j2000 = conv(2000, 1, 1, 12, 0, 0, 'UTC')
    expect(toJulianDay(j2000.utc, julday)).toBeCloseTo(2451545.0, 6)

    const c1990 = conv(1990, 5, 15, 14, 30, 0, 'Asia/Kolkata') // → 09:00 UT
    expect(toJulianDay(c1990.utc, julday)).toBeCloseTo(2448026.875, 6)

    const c1943 = conv(1943, 5, 15, 14, 30, 0, 'Asia/Kolkata') // wartime → 08:00 UT
    expect(toJulianDay(c1943.utc, julday)).toBeCloseTo(2430859.833333, 5)

    swe.close()
  }, 30000)
})
