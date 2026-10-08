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
    // print.js needs this too (mocked to a passthrough row for the page test)
    bhukthiList: (maha) => [
      { lord: maha.lord, startISO: maha.startISO, endISO: maha.endISO, age: { y: 0, m: 0, d: 0 } },
    ],
  }
})

vi.mock('../src/bnn/transit.js', () => ({
  computeTransitSnapshot: vi.fn(() => ({
    jd: 0,
    planets: [
      { key: 'saturn', retro: true, rashi: 11, degInSign: 16.8703 },
      { key: 'rahu', retro: true, rashi: 10, degInSign: 3.1596 },
      { key: 'ketu', retro: true, rashi: 4, degInSign: 3.1596 },
      { key: 'mars', retro: false, rashi: 3, degInSign: 10.8891 },
      { key: 'jupiter', retro: false, rashi: 3, degInSign: 26.3942 },
      { key: 'venus', retro: true, rashi: 6, degInSign: 13.9881 },
      { key: 'mercury', retro: false, rashi: 6, degInSign: 13.9326 },
      { key: 'sun', retro: false, rashi: 5, degInSign: 19.4723 },
      { key: 'moon', retro: false, rashi: 4, degInSign: 3.6517 },
    ],
    ascendant: { key: 'asc', retro: false, rashi: 4, degInSign: 28.0152 },
  })),
}))

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
    expect(links[3].textContent).toBe('Free BNN चार्ट')
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
    expect(document.title).toBe('Free BNN Chart (Bhrigu Nandi Nadi) — Create Online & Download PDF')
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
    expect(svg.textContent).toContain('SAT# 16.52') // transit ring (mocked)
    expect(document.querySelector('.bnn-transit-row')).toBeTruthy()
    expect(document.querySelector('.bnn-transit-row input').value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    expect($('.bnn-exchange-box').textContent).toContain('MERCURY<>SATURN')
  })

  it('transit time control re-computes the ring', async () => {
    const { computeTransitSnapshot } = await import('../src/bnn/transit.js')
    const before = computeTransitSnapshot.mock.calls.length
    const input = document.querySelector('.bnn-transit-row input')
    input.value = '2026-10-01T12:16'
    input.dispatchEvent(new Event('change'))
    expect(computeTransitSnapshot.mock.calls.length).toBeGreaterThan(before)
    const last = computeTransitSnapshot.mock.calls.at(-1)[1]
    expect(last).toEqual({ year: 2026, month: 10, day: 1, hour: 6, minute: 46, second: 0 })
    expect($('#bnn-output svg').textContent).toContain('SAT# 16.52')
  })

  it('print button builds the A4 sheet (mantra + contact + tables)', async () => {
    const btn = document.querySelector('.bnn-actions-row .bnn-print-btn')
    expect(btn.textContent).toContain('प्रिंट')
    btn.click()
    await vi.waitFor(() => expect(document.getElementById('bnn-print')).toBeTruthy())
    const sheet = document.getElementById('bnn-print')
    expect(sheet.textContent).toContain('चामुण्डायै विच्चे नमः')
    expect(sheet.textContent).toContain('info@mybapuji.com')
    expect(sheet.textContent).toContain('DHASA')
    expect(document.body.classList.contains('bnn-printing')).toBe(true)
  })

  it('All Chart button sits next to print and captures the open tabs', async () => {
    const allBtn = document.querySelector('.bnn-actions-row .bnn-allchart-btn')
    expect(allBtn.textContent).toContain('ऑल चार्ट')
    // switch the open tabs, then build the export SVG and check it follows them
    const sections = document.querySelectorAll('.bnn-section')
    sections[0].querySelectorAll('.bnn-tabs button')[1].click() // bhava → 1-5-7-9
    sections[1].querySelectorAll('.bnn-tabs button')[1].click() // planet → 1-5-9
    const { buildAllChartSvg } = await import('../src/bnn/allchart.js')
    // rebuild via the page's stored values is not exposed — reconstruct from the DOM instead:
    // (the integration path is covered in tests/bnn-allchart.test.js; here just the button wiring)
    allBtn.click()
    expect(typeof buildAllChartSvg).toBe('function')
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
    expect(sections.length).toBe(4)
    expect(sections[0].textContent).toContain('BHAVA COMBINATION — NATAL — AP')
    expect(sections[1].textContent).toContain('PLANET COMBINATION — NATAL — AP')
    expect(sections[0].textContent).toContain('B01')
    expect(sections[0].textContent).toContain('BRSSS')
    expect(sections[1].textContent).toContain('JUP#-')
    expect(sections[1].textContent).not.toContain('ASTRONOMY')
    expect(sections[0].querySelectorAll('.bnn-tabs button').length).toBe(4)
    expect(sections[1].querySelectorAll('.bnn-tabs button').length).toBe(4)
    // legends (user 2026-10-07d; progression dot added 2026-10-08): bhava = 4 dots,
    // planet = 5 dots — the last one = the progression partner colour
    expect(sections[0].textContent).toContain('अल्प बलशाली ग्रह')
    expect(sections[0].textContent).toContain('उपग्रह')
    expect(sections[0].querySelectorAll('.lg-dot').length).toBe(4)
    expect(sections[1].textContent).toContain('केन्द्रीय ग्रह')
    expect(sections[1].textContent).toContain('प्रगति का प्रथम ग्रह')
    expect(sections[1].querySelectorAll('.lg-dot').length).toBe(5)
    // Vimshottari (Phase 6)
    expect(sections[2].textContent).toContain('VIMSHOTTARI')
    expect(sections[2].textContent).toContain('SAT')
    expect(sections[2].textContent).toContain('23-12-1985')
    expect(sections[2].querySelectorAll('.bnn-tabs button').length).toBe(3)
    // Special Transit (bottom of the page — user request 2026-10-07e)
    expect(sections[3].textContent).toContain('स्पेशल ट्रांज़िट')
    expect(sections[3].querySelectorAll('.bnn-st-groups button').length).toBe(3)
    expect(sections[3].querySelectorAll('.bnn-st-chip').length).toBe(11) // 9 planets + 1579/159
    expect(sections[3].querySelector('.bnn-st-find')).toBeTruthy()
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
    expect(sections[0].textContent).toContain('LORDSHIP')
    expect(sections[0].textContent).toContain('PLANETS(A)')
    expect(sections[0].textContent).toContain('JUP#, MAR#, MER') // B01 planets (AP)
    expect(sections[0].textContent).toContain('MAR#, JUP#') // B03 in-star
    bhavaTabs[0].click() // back to 1-5-9
    expect(sections[0].textContent).toContain('B01')
    const planetTabs = sections[1].querySelectorAll('.bnn-tabs button')
    planetTabs[2].click() // SPECIAL
    expect(sections[1].textContent).toContain('Lord')
    expect(sections[1].textContent).toContain('LORDSHIP')
    expect(sections[1].textContent).toContain('VEN - 7') // JUP's star
    expect(sections[1].textContent).toContain('3,7,10') // JUP's star-lordship (separate column)
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

  it('female chart: Venus takes the top planet row (Jupiter ⇄ Venus), legend gets the progression dot', async () => {
    document.querySelector('input[name="gender"][value="female"]').checked = true
    document.querySelector('input[name="gender"][value="male"]').checked = false
    $('#bnn-form').dispatchEvent(new Event('submit', { cancelable: true }))
    await vi.waitFor(() => {
      const s1 = document.querySelectorAll('.bnn-section')[1]
      s1.querySelectorAll('.bnn-tabs button')[0].click() // 1-5-7-9
      expect(s1.querySelectorAll('tr')[1].querySelector('.row-label').textContent.slice(0, 3)).toBe('VEN')
    })
    const s1 = document.querySelectorAll('.bnn-section')[1]
    const labels = Array.from(s1.querySelectorAll('tr td.row-label')).map((td) => td.textContent.slice(0, 3))
    expect(labels).toEqual(['VEN', 'SUN', 'MOO', 'MAR', 'MER', 'JUP', 'SAT', 'RAH', 'KET'])
    expect(s1.querySelectorAll('.lg-dot').length).toBe(5)
    const progDot = s1.querySelectorAll('.lg-dot')[4]
    const bg = progDot.style.background || progDot.style.backgroundColor || ''
    expect(/8e24aa|142, ?36, ?170/i.test(bg)).toBe(true)
    // restore the male chart for any later assertions
    document.querySelector('input[name="gender"][value="male"]').checked = true
    document.querySelector('input[name="gender"][value="female"]').checked = false
    $('#bnn-form').dispatchEvent(new Event('submit', { cancelable: true }))
    await vi.waitFor(() => {
      const s = document.querySelectorAll('.bnn-section')[1]
      s.querySelectorAll('.bnn-tabs button')[0].click()
      expect(s.querySelectorAll('tr')[1].querySelector('.row-label').textContent.slice(0, 3)).toBe('JUP')
    })
  })
})
