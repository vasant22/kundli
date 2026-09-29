// @vitest-environment jsdom
// tests/prefill.test.js — URL pre-fill (the homepage-widget round trip).
// Unit: src/prefill.js parameter parsing (good + bad values).
// Integration: opening /?… or /match/?… fills the forms and auto-runs the
// calculation when all required values arrived.
// Run with: npm test
import { describe, expect, it, vi } from 'vitest'

// Same engine mock as the other UI tests — the real calculations are covered
// by tests/astro.test.js (Node + real WASM) and tests/accuracy.test.js.
vi.mock('../src/astro.js', () => ({
  initEphemeris: vi.fn(async () => ({})),
  computeKundli: vi.fn(() => ({
    jd: 2448026.875,
    ayanamsa: 23.72255,
    ascendant: {
      key: 'asc', name: 'Ascendant', short: 'Asc', longitude: 157.037, rashi: 5,
      degInSign: 7.037, nakshatra: 12, pada: 3, speed: 0, retro: false,
      rashiLord: 'mercury', house: 1,
    },
    planets: [
      { key: 'sun', name: 'Sun', short: 'Su', longitude: 30.5498, rashi: 1, degInSign: 0.5498, nakshatra: 3, pada: 2, speed: 0.96, retro: false, rashiLord: 'venus', house: 9 },
      { key: 'moon', name: 'Moon', short: 'Mo', longitude: 271.8937, rashi: 9, degInSign: 1.8937, nakshatra: 21, pada: 2, speed: 12.3, retro: false, rashiLord: 'saturn', house: 5 },
      { key: 'rahu', name: 'Rahu', short: 'Ra', longitude: 287.62, rashi: 9, degInSign: 17.62, nakshatra: 22, pada: 1, speed: -0.053, retro: true, rashiLord: 'saturn', house: 5 },
      { key: 'ketu', name: 'Ketu', short: 'Ke', longitude: 107.62, rashi: 3, degInSign: 17.62, nakshatra: 9, pada: 1, speed: -0.053, retro: true, rashiLord: 'moon', house: 11 },
    ],
    chalit: {
      houseSigns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      houses: { sun: 9, moon: 5, rahu: 5, ketu: 11 },
    },
  })),
  navamsaKundli: vi.fn((k) => ({
    ascendant: { ...k.ascendant, rashi: 11, degInSign: 17.04, house: 1 },
    planets: k.planets.map((p) => ({
      ...p,
      rashi: (p.rashi + 1) % 12,
      degInSign: (p.degInSign * 9) % 30,
      house: ((p.rashi + 1 - 11 + 12) % 12) + 1,
    })),
  })),
  computeVimshottari: vi.fn(() => {
    const Y = 365.25 * 86400000
    const seq = ['sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury', 'ketu', 'venus']
    let t = Date.UTC(1990, 4, 15, 9, 0, 0)
    const mahadashas = []
    for (let n = 0; n < 10; n++) {
      const key = seq[n % 9]
      const next = t + (n === 0 ? 3.65 : 10) * Y
      mahadashas.push({ key, fromMs: t, toMs: next, fullStartMs: t })
      t = next
    }
    const antardashas = seq.map((key, i) => ({
      key,
      fromMs: Date.UTC(2000 + i, 0, 1),
      toMs: Date.UTC(2001 + i, 0, 1),
    }))
    return { mahadashas, currentIdx: 1, antardashas, currentAdIdx: 0 }
  }),
}))

import { parseBirthParams, parseMatchParams } from '../src/prefill.js'

const $ = (sel) => document.querySelector(sel)

describe('src/prefill.js — parameter parsing', () => {
  it('reads a complete Kundli widget link', () => {
    const q = new URLSearchParams({
      name: 'राधा', gender: 'female', day: '15', month: '05', year: '1990',
      hour: '14', min: '30', sec: '0',
      place: 'Varanasi, Uttar Pradesh, India',
      lat: '25.31668', lng: '83.01041', tz: 'Asia/Kolkata', lang: 'hi',
    })
    const parsed = parseBirthParams('?' + q.toString())
    expect(parsed.name).toBe('राधा')
    expect(parsed.gender).toBe('female')
    expect(parsed.month).toBe('5') // "05" → chip value "5"
    expect(parsed.hour).toBe('14')
    expect(parsed.minute).toBe('30')
    expect(parsed.place).toBe('Varanasi, Uttar Pradesh, India')
    expect(parsed.lat).toBe('25.31668')
    expect(parsed.lng).toBe('83.01041')
    expect(parsed.tz).toBe('Asia/Kolkata')
    expect(parsed.lang).toBe('hi')
    expect(parsed.any).toBe(true)
  })

  it('accepts lon as an alias of lng', () => {
    const parsed = parseBirthParams('?lon=83.01')
    expect(parsed.lng).toBe('83.01')
    expect(parsed.any).toBe(true)
  })

  it('ignores junk (month/gender/lang) instead of carrying it into the form', () => {
    const parsed = parseBirthParams('?month=13&gender=x&lang=fr')
    expect(parsed.month).toBe('')
    expect(parsed.gender).toBe('')
    expect(parsed.lang).toBe('')
  })

  it('lang alone does not count as "something to fill"', () => {
    const parsed = parseBirthParams('?lang=en')
    expect(parsed.lang).toBe('en')
    expect(parsed.any).toBe(false)
  })

  it('reads both people (b_/g_) on the match page', () => {
    const parsed = parseMatchParams('?b_name=Ram&g_name=Sita&b_lat=25.31&g_lat=25.32')
    expect(parsed.b.name).toBe('Ram')
    expect(parsed.g.name).toBe('Sita')
    expect(parsed.b.lat).toBe('25.31')
    expect(parsed.g.lat).toBe('25.32')
    expect(parsed.any).toBe(true)
  })

  it('empty search → nothing to fill', () => {
    expect(parseBirthParams('').any).toBe(false)
    expect(parseMatchParams('').any).toBe(false)
  })
})

describe('Kundli page — widget link auto-runs', () => {
  it('fills the form and runs the calculation without a click', async () => {
    const q = new URLSearchParams({
      name: 'राधा', gender: 'female', day: '15', month: '5', year: '1990',
      hour: '14', min: '30', sec: '0',
      place: 'Varanasi, Uttar Pradesh, India',
      lat: '25.31668', lng: '83.01041', tz: 'Asia/Kolkata',
    })
    window.history.pushState({}, '', '/?' + q.toString())
    vi.resetModules()
    document.body.innerHTML = '<div id="app"></div>'
    await import('../src/main.js')

    expect($('#f-name').value).toBe('राधा')
    expect($('input[name="gender"]:checked')?.value).toBe('female')
    expect($('input[name="month"]:checked')?.value).toBe('5')
    expect($('#f-day').value).toBe('15')
    expect($('#f-place').value).toBe('Varanasi, Uttar Pradesh, India')
    expect($('#place-confirm').hidden).toBe(false)
    expect($('#place-confirm').textContent).toContain('25.31668, 83.01041 · Asia/Kolkata')

    // The auto-run: the summary appears without anyone pressing the button.
    expect($('#output').hidden).toBe(false)
    expect($('.summary h2').textContent).toBe('✅ जानकारी सही है')
    await vi.waitFor(() => expect($('.chart-box svg')).toBeTruthy())
  })

  it('fills what arrived but does NOT auto-run when something is missing', async () => {
    window.history.pushState({}, '', '/?name=Radha&day=15&month=5&year=1990')
    vi.resetModules()
    document.body.innerHTML = '<div id="app"></div>'
    await import('../src/main.js')
    expect($('#f-name').value).toBe('Radha')
    expect($('input[name="month"]:checked')?.value).toBe('5')
    expect($('#output').hidden).toBe(true)
  })

  it('?lang=en renders the page in English (and does not auto-run alone)', async () => {
    window.history.pushState({}, '', '/?lang=en&name=Radha')
    vi.resetModules()
    document.body.innerHTML = '<div id="app"></div>'
    await import('../src/main.js')
    expect(document.documentElement.lang).toBe('en')
    expect($('#f-name').value).toBe('Radha')
    expect($('#output').hidden).toBe(true)
  })
})

describe('Match page — widget link auto-runs', () => {
  it('fills both people and runs the report without a click', async () => {
    const q = new URLSearchParams({
      b_name: 'राम कुमार', b_day: '11', b_month: '1', b_year: '1995',
      b_hour: '1', b_min: '30', b_sec: '0',
      b_place: 'Varanasi', b_lat: '25.31668', b_lng: '83.01041', b_tz: 'Asia/Kolkata',
      g_name: 'सीता देवी', g_day: '2', g_month: '6', g_year: '1995',
      g_hour: '16', g_min: '0', g_sec: '0',
      g_place: 'Varanasi', g_lat: '25.31668', g_lng: '83.01041', g_tz: 'Asia/Kolkata',
    })
    window.history.pushState({}, '', '/match/?' + q.toString())
    vi.resetModules()
    document.body.innerHTML = '<div id="app"></div>'
    await import('../src/match.js')

    expect($('#b-name').value).toBe('राम कुमार')
    expect($('#g-name').value).toBe('सीता देवी')
    expect($('input[name="b-month"]:checked')?.value).toBe('1')
    expect($('#b-place-confirm').hidden).toBe(false)
    expect($('#g-place-confirm').hidden).toBe(false)

    // The auto-run: the full report appears with both people's cards.
    await vi.waitFor(() => expect(document.querySelectorAll('.match-person').length).toBe(2))
    expect($('#match-output').hidden).toBe(false)
    expect($('#match-output').textContent).toMatch(/\d+\s*\/\s*36/)
  })
})
