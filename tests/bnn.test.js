// @vitest-environment jsdom
// tests/bnn.test.js — BNN (भृगु नंदी नाड़ी) chart page (/bnn/).
// Phase 1: page shell + form. Phase 2b: the chart is drawn on submit — the
// heavy engine is mocked here (real maths are covered by tests/bnn-kp.test.js
// and tests/bnn-render.test.js).
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../src/astro.js', () => ({
  initEphemeris: vi.fn(async () => ({})),
  RASHI_LORDS: ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'],
}))

vi.mock('../src/bnn/kp.js', () => {
  const cusp = (n, rashi, deg) => ({ n, rashi, degInSign: deg, longitude: rashi * 30 + deg })
  return {
    findExchanges: vi.fn(() => [['mercury', 'saturn']]),
    computeBhavaChalit: vi.fn(() => ({
      ayanamsa: 23.585,
      ascendant: { key: 'asc', short: 'Asc', rashi: 4, degInSign: 12.8835 },
      cusps: [
        cusp(1, 4, 12.8835), cusp(2, 5, 10.9), cusp(3, 6, 11.5167), cusp(4, 7, 12.8667),
        cusp(5, 8, 13.6), cusp(6, 9, 13.6333), cusp(7, 10, 12.8833), cusp(8, 11, 10.9),
        cusp(9, 0, 11.5167), cusp(10, 1, 12.8667), cusp(11, 2, 13.6), cusp(12, 3, 13.6333),
      ],
      planets: [
        { key: 'sun', rashi: 9, degInSign: 8.15, retro: false, longitude: 278.15 },
        { key: 'moon', rashi: 11, degInSign: 12.5, retro: false, longitude: 342.5, nakshatra: 26, pada: 3 },
        { key: 'mars', rashi: 4, degInSign: 21.5, retro: true, longitude: 141.5 },
        { key: 'mercury', rashi: 9, degInSign: 8.9833, retro: false, longitude: 278.9833 },
        { key: 'jupiter', rashi: 4, degInSign: 15.5, retro: true, longitude: 135.5 },
        { key: 'venus', rashi: 10, degInSign: 14.3, retro: false, longitude: 314.3 },
        { key: 'saturn', rashi: 5, degInSign: 3.2, retro: true, longitude: 153.2 },
        { key: 'rahu', rashi: 4, degInSign: 7.1667, retro: true, longitude: 127.1667 },
        { key: 'ketu', rashi: 10, degInSign: 7.1667, retro: true, longitude: 307.1667 },
      ],
      tithiIndex: 6,
      yogaIndex: 20,
    })),
  }
})

vi.mock('../src/bnn/dasha.js', () => {
  const maha = (lord, endISO) => ({ lord, startISO: '1980-01-22', endISO, age: { y: 5, m: 11, d: 1 } })
  const rows = [
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
  const an = [
    { lord: 'mercury', startISO: '2026-01-04', endISO: '2026-05-30', age: { y: 46, m: 4, d: 8 } },
    { lord: 'ketu', startISO: '2026-05-30', endISO: '2026-07-29', age: { y: 46, m: 6, d: 7 } },
    { lord: 'venus', startISO: '2026-07-29', endISO: '2027-01-17', age: { y: 46, m: 11, d: 26 } },
  ]
  return {
    computeDashaTree: vi.fn(() => ({
      moonLon: 342.5, nakshatra: 26, lord: 'saturn', balance: { y: 5, m: 11, d: 1 },
      mahadashas: [
        maha('saturn', '1985-12-23'), maha('mercury', '2002-12-23'), maha('ketu', '2009-12-23'),
        { lord: 'venus', startISO: '2009-12-23', endISO: '2029-12-23', age: { y: 49, m: 11, d: 1 } },
        maha('sun', '2035-12-23'), maha('moon', '2045-12-23'), maha('mars', '2052-12-23'),
        maha('rahu', '2070-12-23'), maha('jupiter', '2086-12-23'),
      ],
      running: { mahaIndex: 3, bhukthiIndex: 7, andhiramIndex: 2, bhukthis: rows, andhirams: an },
    })),
    fmtDMY: (isoStr) => {
      const [y, m, d] = isoStr.split('-')
      return `${d}-${m}-${y}`
    },
  }
})

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>'
  await import('../src/bnn/main.js')
})

const $ = (sel) => document.querySelector(sel)

describe('BNN page — shell', () => {
  it('renders the heading + intro in Hindi by default', () => {
    expect($('#app h1').textContent).toBe('भृगु नंदी नाड़ी चार्ट')
    expect(document.documentElement.lang).toBe('hi')
    expect($('.bnn-intro-card').textContent).toContain('ब्राउज़र')
  })

  it('has the site navigation with BNN active', () => {
    const links = document.querySelectorAll('.site-nav a')
    expect(links.length).toBe(4)
    expect(links[0].getAttribute('href')).toBe('../')
    expect(links[1].getAttribute('href')).toBe('../match/')
    expect(links[2].getAttribute('href')).toBe('../panchang/')
    expect(links[3].textContent).toBe('BNN चार्ट')
    expect(links[3].getAttribute('href')).toBe('./')
    expect(links[3].classList.contains('active')).toBe(true)
    // MyBapuji मुख्य-साइट पट्टी भी मौजूद
    expect(document.querySelector('.mb-strip .brand').textContent).toContain('MyBapuji')
  })

  it('has the same birth-details form as the Kundli page', () => {
    expect($('#bnn-form')).toBeTruthy()
    expect($('#f-name')).toBeTruthy()
    expect(document.querySelectorAll('input[name="gender"]').length).toBe(3)
    expect(document.querySelectorAll('#f-month input[type="radio"]').length).toBe(12)
    for (const id of ['f-day', 'f-year', 'f-hour', 'f-minute', 'f-second', 'f-offset', 'f-place', 'f-lat', 'f-lon', 'f-tz']) {
      expect($(`#${id}`)).toBeTruthy()
    }
    expect($('#search-btn')).toBeTruthy()
    expect($('#bnn-btn')).toBeTruthy()
    expect($('#bnn-output')).toBeTruthy()
  })

  it('switches to English and back', () => {
    $('#lang-toggle').click()
    expect(document.documentElement.lang).toBe('en')
    expect($('#app h1').textContent).toBe('Bhrigu Nandi Nadi Chart')
    expect(document.title).toBe('Bhrigu Nandi Nadi (BNN) Chart')
    $('#lang-toggle').click()
    expect($('#app h1').textContent).toBe('भृगु नंदी नाड़ी चार्ट')
  })

  it('shows inline errors on an empty submit', () => {
    $('#bnn-form').dispatchEvent(new Event('submit', { cancelable: true }))
    expect($('#err-gender').textContent).not.toBe('')
    expect($('#err-date').textContent).not.toBe('')
    expect($('#err-time').textContent).not.toBe('')
    expect($('#bnn-output').hidden).toBe(true)
  })
})

describe('BNN page — chart (Phase 2b)', () => {
  it('draws the chart on a valid submit (engine mocked)', async () => {
    const set = (id, value) => {
      $(`#${id}`).value = value
    }
    document.querySelector('input[name="gender"][value="male"]').checked = true
    document.querySelector('input[name="month"][value="1"]').checked = true
    set('f-day', '22')
    set('f-year', '1980')
    set('f-hour', '20')
    set('f-minute', '30')
    set('f-lat', '21.4833')
    set('f-lon', '78.25')
    set('f-tz', 'Asia/Kolkata')
    $('#bnn-form').dispatchEvent(new Event('submit', { cancelable: true }))

    await vi.waitFor(() => {
      expect($('#bnn-output').hidden).toBe(false)
      expect($('#bnn-output svg')).toBeTruthy()
    })
    const svg = $('#bnn-output svg')
    expect(svg.getAttribute('data-chart')).toBe('south')
    expect(svg.textContent).toContain('MAR# 21.30') // मंगल# सिंह में
    expect(svg.textContent).toContain('ASC 12.53')
    expect(svg.textContent).toContain('UTTARA BHADRAPADA - 3')
    expect($('.bnn-exchange-box').textContent).toContain('MERCURY<>SATURN')
  })

  it('switches the chart style with the toggle', () => {
    const buttons = document.querySelectorAll('.chart-toggle:not(.bnn-mode-toggle) button')
    expect(buttons.length).toBe(2)
    buttons[0].click() // उत्तर भारतीय
    expect($('#bnn-output svg').getAttribute('data-chart')).toBe('north')
    expect(buttons[0].classList.contains('active')).toBe(true)
    buttons[1].click() // दक्षिण भारतीय
    expect($('#bnn-output svg').getAttribute('data-chart')).toBe('south')
    expect(buttons[1].classList.contains('active')).toBe(true)
  })

  it('renders the tabbed combination tables (bhava first) + dasha tables', () => {
    expect(document.querySelectorAll('.bnn-table').length).toBe(3)
    const sections = document.querySelectorAll('.bnn-section')
    expect(sections.length).toBe(3)
    expect(sections[0].textContent).toContain('BHAVA COMBINATION — NATAL — AP')
    expect(sections[1].textContent).toContain('PLANET COMBINATION — NATAL — AP')
    expect(sections[0].textContent).toContain('B01')
    expect(sections[0].textContent).toContain('BRSSS')
    expect(sections[1].textContent).toContain('JUP#-')
    expect(sections[1].textContent).not.toContain('ASTRONOMY')
    expect(sections[0].querySelectorAll('.bnn-tabs button').length).toBe(4)
    expect(sections[1].querySelectorAll('.bnn-tabs button').length).toBe(4)
    // Vimshottari (Phase 6)
    expect(sections[2].textContent).toContain('VIMSHOTTARI')
    expect(sections[2].textContent).toContain('SAT')
    expect(sections[2].textContent).toContain('23-12-1985')
    expect(sections[2].querySelectorAll('.bnn-tabs button').length).toBe(3)
  })

  it('dasha tabs switch views and the centre panel shows running lines', () => {
    const sections = document.querySelectorAll('.bnn-section')
    const tabs = sections[2].querySelectorAll('.bnn-tabs button')
    tabs[1].click() // BHUKTHI
    expect(sections[2].textContent).toContain('26-04-2013')
    tabs[2].click() // ANDHIRAM
    expect(sections[2].textContent).toContain('30-05-2026')
    tabs[0].click() // back to DHASA
    expect(sections[2].textContent).toContain('23-12-1985')
    const svg = $('#bnn-output svg')
    expect(svg.textContent).toContain('VEN DHASA: 23-12-2009 -> 23-12-2029')
    expect(svg.textContent).toContain('MER BHUKTI: 04-01-2026 -> 06-11-2028')
  })

  it('table tabs switch the view (SPECIAL, PRSSS)', () => {
    const sections = document.querySelectorAll('.bnn-section')
    const bhavaTabs = sections[0].querySelectorAll('.bnn-tabs button')
    bhavaTabs[3].click() // SPECIAL
    expect(sections[0].textContent).toContain('Director')
    bhavaTabs[0].click() // back to 1-5-9
    expect(sections[0].textContent).toContain('B01')
    const planetTabs = sections[1].querySelectorAll('.bnn-tabs button')
    planetTabs[2].click() // SPECIAL
    expect(sections[1].textContent).toContain('Lord')
    planetTabs[3].click() // PRSSS
    expect(sections[1].textContent).toContain('VEN')
  })

  it('BP / AP mode toggle re-renders the tables', () => {
    const modeButtons = document.querySelectorAll('.bnn-mode-toggle button')
    expect(modeButtons.length).toBe(2)
    modeButtons[0].click() // BP
    expect(document.querySelector('.bnn-planet-table').closest('.bnn-section').textContent).toContain('NATAL — BP')
    modeButtons[1].click() // AP
    expect(document.querySelector('.bnn-planet-table').closest('.bnn-section').textContent).toContain('NATAL — AP')
  })
})
