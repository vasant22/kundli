// @vitest-environment jsdom
// tests/bnn.test.js — BNN (भृगु नंदी नाड़ी) chart page (/bnn/).
// Phase 1: page shell + form. Phase 2b: the chart is drawn on submit — the
// heavy engine is mocked here (real maths are covered by tests/bnn-kp.test.js
// and tests/bnn-render.test.js).
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../src/astro.js', () => ({
  initEphemeris: vi.fn(async () => ({})),
}))

vi.mock('../src/bnn/kp.js', () => {
  const cusp = (n, rashi, deg) => ({ n, rashi, degInSign: deg })
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
        { key: 'sun', rashi: 9, degInSign: 8.15, retro: false },
        { key: 'moon', rashi: 11, degInSign: 12.5, retro: false, nakshatra: 26, pada: 3 },
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
    })),
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
    expect($('.bnn-exchange-box').textContent).toBe('MERCURY<>SATURN')
  })

  it('switches the chart style with the toggle', () => {
    const buttons = document.querySelectorAll('.chart-toggle button')
    expect(buttons.length).toBe(2)
    buttons[0].click() // उत्तर भारतीय
    expect($('#bnn-output svg').getAttribute('data-chart')).toBe('north')
    expect(buttons[0].classList.contains('active')).toBe(true)
    buttons[1].click() // दक्षिण भारतीय
    expect($('#bnn-output svg').getAttribute('data-chart')).toBe('south')
    expect(buttons[1].classList.contains('active')).toBe(true)
  })
})
