// @vitest-environment jsdom
// tests/bnn-allchart.test.js — "All Chart" PNG export sheet (user request 2026-10-07).
import { describe, expect, it } from 'vitest'
import { buildAllChartSvg } from '../src/bnn/allchart.js'

const cusp = (n, rashi, deg) => ({ n, rashi, degInSign: deg, longitude: rashi * 30 + deg })
const P = (key, rashi, deg, retro = false) => ({ key, rashi, degInSign: deg, longitude: rashi * 30 + deg, retro })
const BNN = {
  ascendant: { key: 'asc', rashi: 4, degInSign: 12.8835, retro: false },
  cusps: [
    cusp(1, 4, 12.8835), cusp(2, 5, 10.9), cusp(3, 6, 11.5167), cusp(4, 7, 12.8667),
    cusp(5, 8, 13.6), cusp(6, 9, 13.6333), cusp(7, 10, 12.8833), cusp(8, 11, 10.9),
    cusp(9, 0, 11.5167), cusp(10, 1, 12.8667), cusp(11, 2, 13.6), cusp(12, 3, 13.6333),
  ],
  planets: [
    P('sun', 9, 8.15), P('moon', 11, 12.5), P('mars', 4, 21.5, true),
    P('mercury', 9, 8.9833), P('jupiter', 4, 15.5, true), P('venus', 10, 14.3),
    P('saturn', 5, 3.2, true), P('rahu', 4, 7.1667, true), P('ketu', 10, 7.1667, true),
  ],
  tithiIndex: 6,
  yogaIndex: 20,
}
const maha = (lord, startISO, endISO) => ({ lord, startISO, endISO, age: { y: 0, m: 0, d: 0 } })
const BHUKTHIS = [
  { lord: 'venus', startISO: '2009-12-23', endISO: '2013-04-26', age: { y: 33, m: 3, d: 4 } },
  { lord: 'sun', startISO: '2013-04-26', endISO: '2014-04-27', age: { y: 34, m: 3, d: 5 } },
  { lord: 'moon', startISO: '2014-04-27', endISO: '2015-12-28', age: { y: 35, m: 11, d: 6 } },
  { lord: 'mars', startISO: '2015-12-28', endISO: '2017-02-27', age: { y: 37, m: 1, d: 5 } },
  { lord: 'rahu', startISO: '2017-02-27', endISO: '2020-03-01', age: { y: 40, m: 1, d: 8 } },
  { lord: 'jupiter', startISO: '2020-03-01', endISO: '2022-11-02', age: { y: 42, m: 9, d: 11 } },
  { lord: 'saturn', startISO: '2022-11-02', endISO: '2026-01-04', age: { y: 45, m: 11, d: 13 } },
  { lord: 'mercury', startISO: '2026-01-04', endISO: '2028-11-06', age: { y: 48, m: 9, d: 15 } },
  { lord: 'ketu', startISO: '2028-11-06', endISO: '2029-12-23', age: { y: 49, m: 11, d: 1 } },
]
const VALUES = {
  name: 'Test Chart',
  bnn: BNN,
  bnnMode: 'AP',
  bnnStyle: 'south',
  bnnBhavaTab: '1579',
  bnnPlanetTab: '159',
  bnnTransit: null,
  transitInput: '2026-10-07T09:57',
  bnnMeta: {
    name: 'Test Chart', placeText: 'Betul', dateTimeText: '22-01-1980 - 20:30:00', weekday: 'TUESDAY',
    ageText: 'AGE : 46Y-8M-15D MALE', nakText: 'UTTARA BHADRAPADA - 3',
    tithiText: 'SHUKLA - SHASHTHI', yogaText: 'SHIVA YOGA',
  },
  bnnDasha: {
    mahadashas: [
      maha('saturn', '1980-01-22', '1985-12-23'), maha('mercury', '1985-12-23', '2002-12-23'),
      maha('ketu', '2002-12-23', '2009-12-23'), maha('venus', '2009-12-23', '2029-12-23'),
      maha('sun', '2029-12-23', '2035-12-23'), maha('moon', '2035-12-23', '2045-12-23'),
      maha('mars', '2045-12-23', '2052-12-23'), maha('rahu', '2052-12-23', '2070-12-23'),
      maha('jupiter', '2070-12-23', '2086-12-23'),
    ],
    running: { mahaIndex: 3, bhukthiIndex: 7, andhiramIndex: 2, bhukthis: BHUKTHIS, andhirams: [] },
  },
}

describe('All Chart export sheet', () => {
  it('one wide SVG: header + chart + the two open tabs + running dasha', () => {
    const svg = buildAllChartSvg(VALUES)
    expect(svg.getAttribute('viewBox')).toBe('0 0 1680 1080')
    expect(svg.textContent).toContain('Test Chart — BNN ALL CHART')
    expect(svg.textContent).toContain('MERCURY<>SATURN')
    expect(svg.textContent).toContain('mybapuji.com')
    // the nested chart follows the current style
    expect(svg.querySelector('svg[data-chart="south"]')).toBeTruthy()
    // bhava tab = 1-5-7-9 (1579) and planet tab = 1-5-9 (159), as "opened"
    expect(svg.textContent).toContain('BHAVA COMBINATION — 1-5-7-9 — AP')
    expect(svg.textContent).toContain('PLANET COMBINATION — 1-5-9 — AP')
    expect(svg.textContent).toContain('VEN-95') // B01's first 1579 entry
    expect(svg.textContent).toContain('JUP#-91') // planet row label
    // running dhasa / bhukthi strip
    expect(svg.textContent).toContain('VEN DHASA: 23-12-2009 → 23-12-2029')
    expect(svg.textContent).toContain('MER BHUKTHI: 04-01-2026 → 06-11-2028')
  })

  it('follows a switched bhava tab (SPECIAL) and the north style', () => {
    const svg = buildAllChartSvg({ ...VALUES, bnnBhavaTab: 'special', bnnStyle: 'north' })
    expect(svg.textContent).toContain('BHAVA — SPECIAL — AP')
    expect(svg.textContent).toContain('LORDSHIP')
    expect(svg.querySelector('svg[data-chart="north"]')).toBeTruthy()
    expect(svg.textContent).toContain('NORTH INDIAN STYLE')
  })

  it('supports BRSSS and PRSSS open tabs too', () => {
    const svg = buildAllChartSvg({ ...VALUES, bnnBhavaTab: 'brsss', bnnPlanetTab: 'prsss' })
    expect(svg.textContent).toContain('BHAVA — BRSSS — AP')
    expect(svg.textContent).toContain('PLANET — PRSSS — AP')
  })
})
