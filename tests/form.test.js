// @vitest-environment jsdom
// tests/form.test.js — Phase 2 verification.
// Runs the real src/main.js in jsdom and checks the whole form journey:
// default render, validation errors, a valid submit (summary), and the
// Hindi ⇄ English toggle (labels, month names, live summary).
// Run with: npm test
import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>'
  await import('../src/main.js')
})

const $ = (sel) => document.querySelector(sel)

const submitForm = () => {
  $('#kundli-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
}

const setValue = (id, value) => {
  $(id).value = value
}

const setGender = (value) => {
  document.querySelector(`input[name="gender"][value="${value}"]`).checked = true
}

const setMonth = (value) => {
  document.querySelector(`input[name="month"][value="${value}"]`).checked = true
}

const monthLabels = () =>
  Array.from(document.querySelectorAll('#f-month label span')).map((el) => el.textContent)

const ddTexts = () => Array.from(document.querySelectorAll('#output dd')).map((el) => el.textContent)

describe('Phase 2 — input form', () => {
  it('renders in Hindi by default', () => {
    expect($('#app h1').textContent).toBe('कुंडली')
    expect($('#get-btn').textContent).toBe('कुंडली बनाएँ')
    expect(document.documentElement.lang).toBe('hi')
    expect(monthLabels().length).toBe(12)
    expect(monthLabels()[0]).toBe('जनवरी')
    expect(monthLabels()[11]).toBe('दिसंबर')
  })

  it('shows all four errors when submitted empty', () => {
    submitForm()
    expect($('#err-gender').textContent).toBe('कृपया लिंग चुनें।')
    expect($('#err-date').textContent).toContain('जन्म तिथि पूरी भरें')
    expect($('#err-time').textContent).toContain('जन्म समय पूरा भरें')
    expect($('#err-place').textContent).toContain('जन्म स्थान भरें')
    expect($('#output').hidden).toBe(true)
  })

  it('rejects impossible dates, bad times and out-of-range years', () => {
    setGender('male')
    setMonth('2')
    setValue('#f-day', '32')
    setValue('#f-year', '1990')
    setValue('#f-hour', '10')
    setValue('#f-minute', '10')
    setValue('#f-second', '10')
    setValue('#f-place', 'Varanasi')
    submitForm()
    expect($('#err-date').textContent).toBe('यह तिथि मान्य नहीं है, दिन जाँचें।')

    setValue('#f-day', '10')
    setValue('#f-hour', '25')
    submitForm()
    expect($('#err-time').textContent).toBe('घंटा 0 से 23 के बीच होना चाहिए।')

    setValue('#f-hour', '10')
    setValue('#f-year', '1700')
    submitForm()
    expect($('#err-date').textContent).toBe('साल 1800 से 2400 के बीच होना चाहिए।')
  })

  it('shows the summary on a valid submit', () => {
    setValue('#f-name', 'राधा शर्मा')
    setMonth('5')
    setValue('#f-day', '15')
    setValue('#f-year', '1990')
    setValue('#f-hour', '14')
    setValue('#f-minute', '30')
    setValue('#f-second', '0')
    setValue('#f-place', 'Varanasi')
    submitForm()

    expect($('#output').hidden).toBe(false)
    expect($('.summary h2').textContent).toBe('✅ जानकारी सही है')

    const values = ddTexts()
    expect(values).toContain('राधा शर्मा')
    expect(values).toContain('पुरुष')
    expect(values).toContain('15 मई 1990')
    expect(values).toContain('14:30:00')
    expect(values).toContain('Varanasi')
  })

  it('language toggle switches labels, month names and the live summary', () => {
    $('#lang-toggle').click()
    expect(document.documentElement.lang).toBe('en')
    expect($('#get-btn').textContent).toBe('Get Kundli')
    expect(monthLabels()[0]).toBe('January')
    expect(document.querySelector('input[name="month"]:checked').value).toBe('5') // selection kept
    expect($('.summary h2').textContent).toBe('✅ Details are valid')
    expect(ddTexts()).toContain('15 May 1990')
  })

  it('can switch back to Hindi', () => {
    $('#lang-toggle').click()
    expect(document.documentElement.lang).toBe('hi')
    expect($('#get-btn').textContent).toBe('कुंडली बनाएँ')
    expect(ddTexts()).toContain('15 मई 1990')
  })
})
