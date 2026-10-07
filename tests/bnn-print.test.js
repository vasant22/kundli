// @vitest-environment jsdom
// tests/bnn-print.test.js — BNN print sheet (user request 2026-10-07).
import { describe, expect, it } from 'vitest'
import { buildPrintSheet } from '../src/bnn/print.js'

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
const maha = (lord, endISO) => ({ lord, startISO: '1980-01-22', endISO, age: { y: 5, m: 11, d: 1 } })
const VALUES = {
  name: 'Test Chart', gender: 'male', day: '22', month: '1', year: '1980',
  hour: '20', minute: '30', second: '0', place: 'Betul',
  bnn: BNN,
  bnnMeta: {
    name: 'Test Chart', placeText: 'Betul', dateTimeText: '22-01-1980 - 20:30:00', weekday: 'TUESDAY',
    ageText: 'AGE : 46Y-8M-15D MALE', nakText: 'UTTARA BHADRAPADA - 3',
    tithiText: 'SHUKLA - SHASHTHI', yogaText: 'SHIVA YOGA',
  },
  bnnDasha: {
    mahadashas: [
      maha('saturn', '1985-12-23'), maha('mercury', '2002-12-23'), maha('ketu', '2009-12-23'),
      { lord: 'venus', startISO: '2009-12-23', endISO: '2029-12-23', age: { y: 49, m: 11, d: 1 } },
      maha('sun', '2035-12-23'), maha('moon', '2045-12-23'), maha('mars', '2052-12-23'),
      maha('rahu', '2070-12-23'), maha('jupiter', '2086-12-23'),
    ],
    running: {
      mahaIndex: 3, bhukthiIndex: 0, andhiramIndex: 0,
      bhukthis: [{ lord: 'mercury', startISO: '2026-01-04', endISO: '2028-11-06', age: { y: 48, m: 9, d: 15 } }],
      andhirams: [
        { lord: 'mercury', startISO: '2026-01-04', endISO: '2026-05-30', age: { y: 46, m: 4, d: 8 } },
        { lord: 'ketu', startISO: '2026-05-30', endISO: '2026-07-29', age: { y: 46, m: 6, d: 7 } },
        { lord: 'venus', startISO: '2026-07-29', endISO: '2027-01-17', age: { y: 46, m: 11, d: 26 } },
      ],
    },
  },
  bnnMode: 'AP',
}

describe('BNN print sheet', () => {
  it('builds the header (Ganesh · Hari Om · mantra · contact · Saraswati)', () => {
    const sheet = buildPrintSheet(VALUES)
    expect(sheet.id).toBe('bnn-print')
    expect(sheet.textContent).toContain('हरि ॐ')
    expect(sheet.textContent).toContain('ॐ ऐं ह्रीं श्रीं क्लीं चामुण्डायै विच्चे नमः')
    expect(sheet.textContent).toContain('info@mybapuji.com')
    expect(sheet.textContent).toContain('mybapuji.com')
    const imgs = sheet.querySelectorAll('.bp-head img')
    expect(imgs.length).toBe(2)
    expect(imgs[0].getAttribute('src')).toContain('ganesh')
    expect(imgs[1].getAttribute('src')).toContain('saraswati')
  })

  it('holds the details, chart, tables and vimshottari sections', () => {
    const sheet = buildPrintSheet(VALUES)
    expect(sheet.textContent).toContain('BASIC DETAILS')
    expect(sheet.textContent).toContain('UTTARA BHADRAPADA - 3')
    expect(sheet.textContent).toContain('Leo') // lagna rashi name
    expect(sheet.querySelector('.bp-chart svg')).toBeTruthy()
    expect(sheet.textContent).toContain('AFTER PARIVARDHANAI (AP)')
    expect(sheet.textContent).toContain('PLANET COMBINATION (1-5-7-9) — AP')
    expect(sheet.textContent).toContain('SUN-97') // the guru catch, printed too
    expect(sheet.textContent).toContain('B01')
    expect(sheet.textContent).toContain('PLANET — SPECIAL')
    expect(sheet.textContent).toContain('LORDSHIP')
    expect(sheet.textContent).toContain('BHAVA — SPECIAL')
    // BHAVA first, then PLANET (user 2026-10-07c)
    expect(sheet.textContent.indexOf('BHAVA COMBINATION')).toBeLessThan(sheet.textContent.indexOf('PLANET COMBINATION'))
    // colorful combo cells like the web page
    expect(sheet.querySelectorAll('td.ent-blue').length).toBeGreaterThan(0)
    expect(sheet.querySelectorAll('td.ent-green').length).toBeGreaterThan(0)
    // the parivartana box rides inside the printed chart
    expect(sheet.textContent).toContain('MERCURY<>SATURN')
    expect(sheet.textContent).toContain('PRSSS')
    expect(sheet.textContent).toContain('BRSSS')
    expect(sheet.textContent).toContain('DHASA')
    expect(sheet.textContent).toContain('23-12-1985')
    expect(sheet.textContent).toContain('ANDHIRAM')
    // footer on the sheet
    expect(sheet.textContent).toContain('निःशुल्क ज्योतिष साधन')
  })
})
