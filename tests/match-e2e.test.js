// @vitest-environment jsdom
// tests/match-e2e.test.js — end-to-end match-page flow with the REAL Swiss
// Ephemeris engine (no mocks): fill both birthdays → both charts computed →
// the interim card shows the same Moon/Lagna values a direct engine call gives.
// Run with: npm test
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { rashiLabel, nakshatraLabel } from '../src/i18n.js'

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>'
  await import('../src/match.js')
}, 30000)

const $ = (sel) => document.querySelector(sel)
const setValue = (id, value) => {
  $(id).value = value
}
const setMonth = (p, value) => {
  document.querySelector(`input[name="${p}-month"][value="${value}"]`).checked = true
}

describe('Match page — end-to-end with the real engine', () => {
  it('computes both charts and shows the real Moon positions', async () => {
    // Boy: 15 May 1990, 14:30 IST, Varanasi (the main app's validated sample).
    setValue('#b-name', 'राम कुमार')
    setMonth('b', '5')
    setValue('#b-day', '15')
    setValue('#b-year', '1990')
    setValue('#b-hour', '14')
    setValue('#b-minute', '30')
    setValue('#b-second', '0')
    setValue('#b-lat', '25.31668')
    setValue('#b-lon', '83.01041')
    setValue('#b-tz', 'Asia/Kolkata')
    $('#continue-btn').click()
    expect($('#step-g').hidden).toBe(false)

    // Girl: 20 Jun 1992, 10:00 IST, Lucknow.
    setValue('#g-name', 'सीता देवी')
    setMonth('g', '6')
    setValue('#g-day', '20')
    setValue('#g-year', '1992')
    setValue('#g-hour', '10')
    setValue('#g-minute', '0')
    setValue('#g-second', '0')
    setValue('#g-lat', '26.85')
    setValue('#g-lon', '80.95')
    setValue('#g-tz', 'Asia/Kolkata')
    $('#report-btn').click()

    await vi.waitFor(
      () => {
        expect(document.querySelectorAll('.match-person').length).toBe(2)
      },
      { timeout: 20000 }
    )

    // Reference values from the same engine, computed directly.
    const { computeKundli, initEphemeris } = await import('../src/astro.js')
    const swe = await initEphemeris()
    const refB = computeKundli(swe, {
      utc: { year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 },
      latitude: 25.31668,
      longitude: 83.01041,
    })
    const refG = computeKundli(swe, {
      utc: { year: 1992, month: 6, day: 20, hour: 4, minute: 30, second: 0 },
      latitude: 26.85,
      longitude: 80.95,
    })

    const text = $('.match-summary').textContent
    expect(text).toContain('राम कुमार')
    expect(text).toContain('सीता देवी')

    for (const ref of [refB, refG]) {
      const moon = ref.planets.find((p) => p.key === 'moon')
      expect(text).toContain(rashiLabel(moon.rashi))
      expect(text).toContain(nakshatraLabel(moon.nakshatra))
      expect(text).toContain(rashiLabel(ref.ascendant.rashi))
    }
  }, 40000)
})
