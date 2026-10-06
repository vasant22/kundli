// @vitest-environment jsdom
// tests/bnn.test.js — BNN (भृगु नंदी नाड़ी) chart page (/bnn/).
// BNN Phase 1: page shell + the same birth-details form as the Kundli page.
import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>'
  await import('../src/bnn/main.js')
})

const $ = (sel) => document.querySelector(sel)

describe('BNN Phase 1 — page shell', () => {
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

  it('accepts a valid birth (manual place) and shows the Phase-1 note', () => {
    const set = (id, value) => {
      $(`#${id}`).value = value
    }
    document.querySelector('input[name="gender"][value="male"]').checked = true
    document.querySelector('input[name="month"][value="1"]').checked = true
    set('f-day', '22')
    set('f-year', '1980')
    set('f-hour', '20')
    set('f-minute', '30')
    set('f-lat', '21.9019')
    set('f-lon', '77.9032')
    set('f-tz', 'Asia/Kolkata')
    $('#bnn-form').dispatchEvent(new Event('submit', { cancelable: true }))
    expect($('#bnn-output').hidden).toBe(false)
    expect($('#bnn-output').textContent).toContain('जन्म विवरण')
  })
})
