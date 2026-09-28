// @vitest-environment jsdom
// tests/form.test.js — Phase 2 + 3 verification.
// Runs the real src/main.js in jsdom and checks the whole form journey:
// default render, validation errors, valid submit (summary), the
// Hindi ⇄ English toggle, and the Phase 3 place search + manual fallback.
// Run with: npm test
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

// The heavy WASM chart engine is mocked in these UI tests — the real
// calculations are covered by tests/astro.test.js (Node + real WASM).
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
  })),
}))

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>'
  await import('../src/main.js')
})

afterEach(() => {
  vi.unstubAllGlobals()
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

const stubSearchResults = (results) => {
  const mock = vi.fn(async () => ({ ok: true, json: async () => ({ results }) }))
  vi.stubGlobal('fetch', mock)
  return mock
}

const VARANASI = {
  name: 'Varanasi',
  admin1: 'Uttar Pradesh',
  country: 'India',
  latitude: 25.31668,
  longitude: 83.01041,
  timezone: 'Asia/Kolkata',
}

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

  it('shows the summary on a valid submit (manual location)', () => {
    setValue('#f-name', 'राधा शर्मा')
    setMonth('5')
    setValue('#f-day', '15')
    setValue('#f-year', '1990')
    setValue('#f-hour', '14')
    setValue('#f-minute', '30')
    setValue('#f-second', '0')
    setValue('#f-place', 'Varanasi')
    setValue('#f-lat', '25.31668')
    setValue('#f-lon', '83.01041')
    setValue('#f-tz', 'Asia/Kolkata')
    submitForm()

    expect($('#output').hidden).toBe(false)
    expect($('.summary h2').textContent).toBe('✅ जानकारी सही है')

    const values = ddTexts()
    expect(values).toContain('राधा शर्मा')
    expect(values).toContain('पुरुष')
    expect(values).toContain('15 मई 1990')
    expect(values).toContain('14:30:00')
    expect(values).toContain('Varanasi')
    expect(values).toContain('25.31668, 83.01041 · Asia/Kolkata')
    expect(values).toContain('Asia/Kolkata (UTC+05:30)')
    expect(values).toContain('15 मई 1990, 09:00:00 UTC')
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

describe('Phase 3 — place search & manual fallback', () => {
  it('searches and shows result buttons (single API call per press)', async () => {
    const mock = stubSearchResults([VARANASI, { ...VARANASI, name: 'Vāranāsi', admin1: 'Odisha' }])
    setValue('#f-place', 'Varanasi')
    $('#search-btn').click()

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.result-item').length).toBe(2)
    })
    expect($('#results').hidden).toBe(false)
    expect(document.querySelector('.result-item').textContent).toBe('Varanasi, Uttar Pradesh, India')
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock.mock.calls[0][0]).toContain('name=Varanasi')
  })

  it('selecting a result shows the confirmation line', () => {
    document.querySelector('.result-item').click()
    expect($('#place-confirm').hidden).toBe(false)
    expect($('#place-confirm').textContent).toContain('चुना गया')
    expect($('#place-confirm').textContent).toContain('Varanasi, Uttar Pradesh, India')
    expect($('#place-confirm').textContent).toContain('Asia/Kolkata')
    expect(document.querySelector('.result-item').classList.contains('selected')).toBe(true)
  })

  it('submit uses the selected place (with coordinates) in the summary', () => {
    setValue('#f-lat', '')
    setValue('#f-lon', '')
    setValue('#f-tz', '')
    submitForm()

    expect($('#output').hidden).toBe(false)
    const values = ddTexts()
    expect(values).toContain('Varanasi, Uttar Pradesh, India')
    expect(values).toContain('25.31668, 83.01041 · Asia/Kolkata')
  })

  it('asks for a name, and shows friendly no-result / network messages', async () => {
    // empty query
    setValue('#f-place', '')
    $('#search-btn').click()
    expect($('#search-note').hidden).toBe(false)
    expect($('#search-note').textContent).toBe('पहले जगह का नाम लिखें।')

    // network failure (console.error expected — silence it)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    setValue('#f-place', 'Nowhere')
    $('#search-btn').click()
    await vi.waitFor(() => {
      expect($('#search-note').textContent).toContain('खोज पूरी नहीं हो सकी')
    })
    errSpy.mockRestore()

    // zero results
    stubSearchResults([])
    setValue('#f-place', 'Xyzzy')
    $('#search-btn').click()
    await vi.waitFor(() => {
      expect($('#search-note').textContent).toContain('यह जगह नहीं मिली')
    })
  })

  it('validates the manual fields and uses them when complete', () => {
    // clear any picked place first
    setValue('#f-place', '')
    $('#f-place').dispatchEvent(new Event('input'))
    expect($('#place-confirm').hidden).toBe(true)

    // partial fill → error, and the section opens itself
    setValue('#f-lat', '25.3')
    submitForm()
    expect($('#err-manual').textContent).toBe('तीनों भरें — अक्षांश, देशांतर और समय क्षेत्र।')
    expect($('#manual-box').open).toBe(true)

    // out-of-range latitude
    setValue('#f-lat', '99')
    setValue('#f-lon', '83')
    setValue('#f-tz', '+05:30')
    submitForm()
    expect($('#err-manual').textContent).toBe('अक्षांश -90 से 90 के बीच हो।')

    // valid manual values → summary uses them
    setValue('#f-lat', '25.3')
    submitForm()
    expect($('#output').hidden).toBe(false)
    expect(ddTexts()).toContain('25.3, 83 · +05:30')
  })

  it('editing the place text clears a previously picked place', async () => {
    stubSearchResults([VARANASI])
    setValue('#f-place', 'varanasi')
    $('#search-btn').click()
    await vi.waitFor(() => {
      expect(document.querySelectorAll('.result-item').length).toBe(1)
    })
    document.querySelector('.result-item').click()
    expect($('#place-confirm').hidden).toBe(false)

    setValue('#f-place', 'Var')
    $('#f-place').dispatchEvent(new Event('input'))
    expect($('#place-confirm').hidden).toBe(true)
  })
})

describe('Phase 4 — time conversion in the summary', () => {
  it('manual UTC offset override wins and is shown', () => {
    setValue('#f-offset', '+02:00')
    submitForm()
    expect($('#output').hidden).toBe(false)
    const values = ddTexts()
    expect(values).toContain('+02:00 (हाथ से भरा)')
    expect(values).toContain('15 मई 1990, 12:30:00 UTC')
    setValue('#f-offset', '')
  })

  it('rejects a bad offset', () => {
    setValue('#f-offset', 'abc')
    submitForm()
    expect($('#err-offset').textContent).toBe('ऑफ़सेट ठीक नहीं लगा — जैसे +05:30 या -08:00 लिखें।')
    expect($('#output').hidden).toBe(true)
    setValue('#f-offset', '')
  })

  it('uses historical timezone rules (1943 India wartime +06:30)', () => {
    setValue('#f-tz', 'Asia/Kolkata')
    setValue('#f-year', '1943')
    submitForm()
    expect($('#output').hidden).toBe(false)
    const values = ddTexts()
    expect(values).toContain('Asia/Kolkata (UTC+06:30)')
    expect(values).toContain('15 मई 1943, 08:00:00 UTC')
  })
})

describe('Phase 5 — calculated chart in the summary', () => {
  it('shows lagna, ayanamsa and planet positions after submit', async () => {
    setValue('#f-offset', '')
    setValue('#f-year', '1990')
    setValue('#f-tz', 'Asia/Kolkata')
    submitForm()

    await vi.waitFor(() => {
      expect(document.querySelector('.kundli-mini')).toBeTruthy()
    })

    const values = ddTexts()
    expect(values).toContain("राशि 6 · 7°02'") // lagna: Kanya/Virgo
    expect(values).toContain("23°43'") // Lahiri ayanamsa

    const mini = document.querySelector('.kundli-mini').textContent
    expect(mini).toContain("Su · राशि 2 · 0°33' · भाव 9")
    expect(mini).toContain('वक्री') // Rahu/Ketu are retrograde
  })
})
