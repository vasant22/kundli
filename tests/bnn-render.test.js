// @vitest-environment jsdom
// tests/bnn-render.test.js — BNN chart drawing (Phase 2b).
import { describe, expect, it } from 'vitest'
import { ageYMD, buildBnnChart, cuspText, degDot, exchangeLabel, planetText, weekdayEN } from '../src/bnn/render.js'

// The reference chart's values (docs/bnn-guide.txt भाग 5).
const CUSPS = [
  { n: 1, rashi: 4, degInSign: 12.8835 }, { n: 2, rashi: 5, degInSign: 10.9 },
  { n: 3, rashi: 6, degInSign: 11.5167 }, { n: 4, rashi: 7, degInSign: 12.8667 },
  { n: 5, rashi: 8, degInSign: 13.6 }, { n: 6, rashi: 9, degInSign: 13.6333 },
  { n: 7, rashi: 10, degInSign: 12.8833 }, { n: 8, rashi: 11, degInSign: 10.9 },
  { n: 9, rashi: 0, degInSign: 11.5167 }, { n: 10, rashi: 1, degInSign: 12.8667 },
  { n: 11, rashi: 2, degInSign: 13.6 }, { n: 12, rashi: 3, degInSign: 13.6333 },
]
const BNN = {
  ayanamsa: 23.585,
  ascendant: { key: 'asc', rashi: 4, degInSign: 12.8835 },
  cusps: CUSPS,
  planets: [
    { key: 'sun', rashi: 9, degInSign: 8.15, retro: false },
    { key: 'moon', rashi: 11, degInSign: 12.5, retro: false },
    { key: 'mars', rashi: 4, degInSign: 21.5, retro: true },
    { key: 'mercury', rashi: 9, degInSign: 8.9833, retro: false },
    { key: 'jupiter', rashi: 4, degInSign: 15.5, retro: true },
    { key: 'venus', rashi: 10, degInSign: 14.3, retro: false },
    { key: 'saturn', rashi: 5, degInSign: 3.2, retro: true },
    { key: 'rahu', rashi: 4, degInSign: 7.1667, retro: true },
    { key: 'ketu', rashi: 10, degInSign: 7.1667, retro: true },
  ],
  tithiIndex: 6,
  yogaIndex: 20,
}
const META = {
  name: 'Test Chart',
  placeText: 'Betul',
  dateTimeText: '22-01-1980 - 20:30:00',
  weekday: 'TUESDAY',
  ageText: 'AGE : 46Y-8M-15D MALE',
  nakText: 'UTTARA BHADRAPADA - 3',
  tithiText: 'SHUKLA - SHASHTHI',
  yogaText: 'SHIVA YOGA',
}

describe('BNN Phase 2b — chart drawing', () => {
  it('formats text the old-software way', () => {
    expect(degDot(3.2)).toBe('03.12')
    expect(degDot(12.8835)).toBe('12.53')
    expect(degDot(13.6117)).toBe('13.36') // truncation, not rounding
    expect(planetText({ key: 'mars', retro: true, degInSign: 21.5 })).toBe('MAR# 21.30')
    expect(planetText({ key: 'sun', retro: false, degInSign: 8.15 })).toBe('SUN 08.09')
    expect(cuspText({ n: 9, degInSign: 11.5167 })).toBe('09 11.31')
    expect(exchangeLabel([['mercury', 'saturn']])).toBe('MERCURY<>SATURN')
  })

  it('south chart: 12 rashi cells, red cusps, planets, ASC + centre panel', () => {
    const svg = buildBnnChart(BNN, { style: 'south', meta: META })
    expect(svg.getAttribute('data-chart')).toBe('south')
    expect(svg.querySelectorAll('[data-rashi]').length).toBe(12)
    // cusp 9 (Aries) sits in the Aries cell — red text "09 11.31"
    const aries = svg.querySelector('[data-rashi="0"]')
    const cusp9 = [...aries.querySelectorAll('text')].find((t) => t.textContent === '09 11.31')
    expect(cusp9).toBeTruthy()
    expect(cusp9.getAttribute('fill')).toBe('#c62828')
    // Leo cell: cusp first, then entries sorted by degree (ASC included)
    const leo = svg.querySelector('[data-rashi="4"]')
    const texts = [...leo.querySelectorAll('text')].map((t) => t.textContent)
    expect(texts).toContain('01 12.53')
    expect(texts).toContain('RAH 07.10')
    expect(texts).toContain('ASC 12.53')
    expect(texts).toContain('JUP# 15.30')
    expect(texts).toContain('MAR# 21.30')
    expect(texts.indexOf('RAH 07.10')).toBeGreaterThan(texts.indexOf('01 12.53'))
    expect(texts.indexOf('ASC 12.53')).toBeGreaterThan(texts.indexOf('RAH 07.10'))
    expect(texts.indexOf('MAR# 21.30')).toBeGreaterThan(texts.indexOf('ASC 12.53'))
    // centre panel
    expect(svg.textContent).toContain('Test Chart')
    expect(svg.textContent).toContain('UTTARA BHADRAPADA - 3')
    expect(svg.textContent).toContain('SHUKLA - SHASHTHI')
  })

  it('north chart: 12 house cells + centre panel overlay', () => {
    const svg = buildBnnChart(BNN, { style: 'north', meta: META })
    expect(svg.getAttribute('data-chart')).toBe('north')
    expect(svg.querySelectorAll('[data-house]').length).toBe(12)
    // cusp 1 ⇢ house 1 (the lagna sign's region, Leo)
    const h1 = svg.querySelector('[data-house="1"]')
    const texts = [...h1.querySelectorAll('text')].map((t) => t.textContent)
    expect(texts).toContain('01 12.53')
    expect(texts).toContain('ASC 12.53')
    expect(svg.textContent).toContain('SHUKLA - SHASHTHI')
  })

  it('age & weekday helpers', () => {
    expect(ageYMD({ year: 1980, month: 1, day: 22 }, { year: 2026, month: 10, day: 7 })).toEqual({ y: 46, m: 8, d: 15 })
    expect(ageYMD({ year: 1990, month: 5, day: 15 }, { year: 1991, month: 5, day: 14 })).toEqual({ y: 0, m: 11, d: 29 })
    expect(weekdayEN(1980, 1, 22)).toBe('TUESDAY')
  })
})
