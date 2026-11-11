// tests/phal-sadesati.test.js — साढ़ेसाती / ढैया की तारीख़ें Swiss Ephemeris से।
// Reference ingresses (Lahiri sidereal, the dates Indian panchangs print):
//   शनि → मकर 24-01-2020 · → कुंभ 29-04-2022 (वक्री होकर 12-07-2022 को मकर लौटा,
//   17-01-2023 को फिर कुंभ) · → मीन 29-03-2025. Tolerance ±2 days.
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import {
  DHAIYA_HOUSES,
  SADESATI_HOUSES,
  computeSadesati,
  jdToMs,
  msToJd,
  saturnPhase,
  saturnRashiAt,
} from '../src/phal/sadesati.js'

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

const DAY = 86400000
const BIRTH_MS = Date.UTC(1990, 4, 15, 9, 0, 0)
const MOON_RASHI = 9 // Makara — the 15-05-1990 fixture's Moon

const near = (ms, isoDate, days = 2) =>
  Math.abs(ms - Date.UTC(...isoDate)) <= days * DAY

describe('saturnPhase', () => {
  it('12th / 1st / 2nd from the Moon are the three साढ़ेसाती phases', () => {
    expect(SADESATI_HOUSES).toEqual([12, 1, 2])
    const moon = 5 // Kanya
    expect(saturnPhase(4, moon)).toMatchObject({ key: 'sadesati', phase: 12, phaseIndex: 1 }) // Simha
    expect(saturnPhase(5, moon)).toMatchObject({ key: 'sadesati', phase: 1, phaseIndex: 2 })
    expect(saturnPhase(6, moon)).toMatchObject({ key: 'sadesati', phase: 2, phaseIndex: 3 })
  })
  it('4th and 8th from the Moon are ढैया', () => {
    expect(DHAIYA_HOUSES).toEqual([4, 8])
    expect(saturnPhase(8, 5)).toMatchObject({ key: 'dhaiya', phase: 4 })
    expect(saturnPhase(0, 5)).toMatchObject({ key: 'dhaiya', phase: 8 })
  })
  it('any other house is no dosha', () => {
    expect(saturnPhase(7, 5).key).toBe('none')
    expect(saturnPhase(9, 5).key).toBe('none')
  })
})

describe('saturnRashiAt — known sidereal ingresses', () => {
  it('शनि मकर में 25-01-2020, कुंभ में 01-05-2022, धनु में 10-01-2020', () => {
    expect(saturnRashiAt(swe, msToJd(Date.UTC(2020, 0, 25)))).toBe(9) // Makara
    expect(saturnRashiAt(swe, msToJd(Date.UTC(2022, 4, 1)))).toBe(10) // Kumbha
    expect(saturnRashiAt(swe, msToJd(Date.UTC(2020, 0, 10)))).toBe(8) // Dhanu
    expect(saturnRashiAt(swe, msToJd(Date.UTC(2025, 4, 1)))).toBe(11) // Meena
  })

  it('jd ↔ ms round-trips', () => {
    const ms = Date.UTC(1990, 4, 15, 9)
    expect(jdToMs(msToJd(ms))).toBeCloseTo(ms, 3)
  })
})

describe('computeSadesati — the 2017–2025 साढ़ेसाती for a Makara Moon', () => {
  let res
  beforeAll(() => {
    res = computeSadesati(swe, { moonRashi: MOON_RASHI, birthMs: BIRTH_MS, years: 100, nowMs: Date.UTC(2026, 10, 11) })
  }, 60000)

  it('finds at least one साढ़ेसाती period covering 2020', () => {
    const p = res.sadesati.find((x) => Date.UTC(2020, 6, 1) >= x.fromMs && Date.UTC(2020, 6, 1) < x.toMs)
    expect(Boolean(p)).toBe(true)
  })

  it('the birth chart opens inside a साढ़ेसाती (शनि जन्म के समय मकर में था)', () => {
    const p = res.sadesati.find((x) => x.fromMs === BIRTH_MS)
    expect(Boolean(p)).toBe(true)
    expect(p.phases[0].phase).toBe(1)
  })

  it('phase 2 starts with Saturn’s entry into Makara (24-01-2020 ±2 दिन)', () => {
    const starts = res.sadesati.flatMap((x) => x.phases).filter((ph) => ph.phase === 1).map((ph) => ph.fromMs)
    expect(starts.some((ms) => near(ms, [2020, 0, 24]))).toBe(true)
  })

  it('phase 3 starts with Saturn’s entry into Kumbha (29-04-2022 ±2 दिन)', () => {
    const starts = res.sadesati.flatMap((x) => x.phases).filter((ph) => ph.phase === 2).map((ph) => ph.fromMs)
    expect(starts.some((ms) => near(ms, [2022, 3, 29]))).toBe(true)
  })

  it('the 2022 retrograde loop shows up as an extra phase (साढ़ेसाती में लौटना)', () => {
    const p = res.sadesati.find((x) => Date.UTC(2022, 5, 1) >= x.fromMs && Date.UTC(2022, 5, 1) < x.toMs)
    expect(p.phases.length).toBeGreaterThanOrEqual(4)
    // ...and there is a phase-2 run again after the first phase-3 run
    const seq = p.phases.map((ph) => ph.phase)
    expect(seq.indexOf(2)).toBeLessThan(seq.lastIndexOf(2))
    expect(seq.lastIndexOf(2) > seq.indexOf(2)).toBe(true)
  })

  it('phases are ordered, contiguous and inside the period', () => {
    for (const p of [...res.sadesati, ...res.dhaiya]) {
      expect(p.toMs).toBeGreaterThan(p.fromMs)
      expect(p.phases[0].fromMs).toBe(p.fromMs)
      expect(p.phases[p.phases.length - 1].toMs).toBe(p.toMs)
      for (let i = 1; i < p.phases.length; i++) {
        expect(p.phases[i].fromMs).toBeCloseTo(p.phases[i - 1].toMs, 3)
        expect(p.phases[i].phase).not.toBe(p.phases[i - 1].phase)
      }
      for (const ph of p.phases) {
        if (p.kind === 'sadesati') expect(SADESATI_HOUSES).toContain(ph.phase)
        else expect(DHAIYA_HOUSES).toContain(ph.phase)
      }
    }
  })

  it('periods never overlap and are in chronological order', () => {
    const all = [...res.sadesati, ...res.dhaiya].sort((a, b) => a.fromMs - b.fromMs)
    for (let i = 1; i < all.length; i++) {
      expect(all[i].fromMs).toBeGreaterThanOrEqual(all[i - 1].toMs - 1)
    }
  })

  it('reports what is running now and what comes next', () => {
    expect(res.current === null || res.current.kind === 'sadesati' || res.current.kind === 'dhaiya').toBe(true)
    if (res.next) expect(res.next.fromMs).toBeGreaterThan(Date.UTC(2026, 10, 11))
  })

  it('covers birth → 100 years', () => {
    expect(res.scannedUntilMs).toBeGreaterThan(BIRTH_MS + 99 * 365.25 * DAY)
  })

  it('a different Moon sign gives a different आरंभ (no hard-coded dates)', () => {
    const other = computeSadesati(swe, { moonRashi: 0, birthMs: BIRTH_MS, years: 30, nowMs: Date.UTC(2026, 10, 11) })
    const first = other.sadesati[0] ?? other.dhaiya[0]
    const mine = res.sadesati[0]
    expect(first.fromMs).not.toBe(mine.fromMs)
  })
})
