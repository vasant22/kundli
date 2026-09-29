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
    expect($('#err-time').textContent).toContain('जन्म समय भरें')
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

  it('selecting a result shows the confirmation line and hides the list', () => {
    document.querySelector('.result-item').click()
    expect($('#place-confirm').hidden).toBe(false)
    expect($('#place-confirm').textContent).toContain('चुना गया')
    expect($('#place-confirm').textContent).toContain('Varanasi, Uttar Pradesh, India')
    expect($('#place-confirm').textContent).toContain('Asia/Kolkata')
    expect(document.querySelector('.result-item').classList.contains('selected')).toBe(true)
    expect($('#results').hidden).toBe(true) // suggestion list hides after picking
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
      expect(document.querySelector('.kundli-table')).toBeTruthy()
    })

    const values = ddTexts()
    expect(values).toContain("कन्या / Virgo · 7°02'") // lagna: Kanya/Virgo
    expect(values).toContain("23°43'") // Lahiri ayanamsa

    const table = document.querySelector('.kundli-table').textContent
    expect(table).toContain('लग्न / Ascendant')
    expect(table).toContain('सूर्य / Sun')
    expect(table).toContain('वृषभ / Taurus')
    expect(table).toContain(`0°32'59"`)
    expect(table).toContain('कृत्तिका / Krittika')
    expect(table).toContain('वक्री') // Mercury (and Rahu/Ketu) are retrograde
  })
})

describe('Phase 7 — charts in the summary', () => {
  it('draws the North chart by default and toggles to South without recalculating', async () => {
    setValue('#f-offset', '')
    setValue('#f-tz', 'Asia/Kolkata')
    submitForm()

    await vi.waitFor(() => {
      expect(document.querySelector('[data-varga="D1"]')).toBeTruthy()
    })

    let svg = document.querySelector('[data-varga="D1"]')
    expect(svg.getAttribute('data-chart')).toBe('north')
    expect(svg.getAttribute('data-varga')).toBe('D1')
    expect(svg.querySelectorAll('[data-house]')).toHaveLength(12)
    expect(svg.querySelector('[data-house="1"]').textContent).toContain('Asc')
    // D9 + Bhava Chalit drawn beside the main chart:
    expect(document.querySelector('[data-varga="D9"]')).toBeTruthy()
    expect(document.querySelector('[data-varga="CHALIT"]')).toBeTruthy()

    const { computeKundli } = await import('../src/astro.js')
    const callsBefore = computeKundli.mock.calls.length

    document.querySelector('.chart-toggle button[data-style="south"]').click()
    svg = document.querySelector('[data-varga="D1"]')
    expect(svg.getAttribute('data-chart')).toBe('south')
    expect(svg.querySelector('.lagna-mark')).toBeTruthy()
    expect(computeKundli.mock.calls.length).toBe(callsBefore) // no recalculation
  })
})

describe('Phase 8 — results table, actions & instant language switching', () => {
  it('shows the full bilingual planet table and the action buttons', async () => {
    setValue('#f-offset', '')
    setValue('#f-year', '1990')
    setValue('#f-tz', 'Asia/Kolkata')
    submitForm()

    await vi.waitFor(() => {
      expect(document.querySelector('.kundli-table')).toBeTruthy()
    })

    const headers = Array.from(document.querySelectorAll('.planet-table th')).map((th) => th.textContent)
    expect(headers).toEqual(['ग्रह', 'राशि', 'अंश', 'नक्षत्र', 'भाव', 'वक्री'])

    const text = document.querySelector('.planet-table').textContent
    expect(text).toContain('लग्न / Ascendant')
    expect(text).toContain(`7°02'13"`) // lagna degree
    expect(text).toContain('सूर्य / Sun')
    expect(text).toContain(`0°32'59"`)
    expect(text).toContain('कृत्तिका / Krittika')
    expect(text).toContain('वक्री')

    expect(document.querySelector('.actions [data-action="png"]')).toBeTruthy()
    expect(document.querySelector('.actions [data-action="print"]')).toBeTruthy()
    expect(document.querySelector('.actions [data-action="copy"]')).toBeTruthy()
  })

  it('switches the table headers instantly with the language toggle', () => {
    $('#lang-toggle').click()
    const headers = Array.from(document.querySelectorAll('.planet-table th')).map((th) => th.textContent)
    expect(headers).toEqual(['Planet', 'Rashi', 'Degree', 'Nakshatra', 'House', 'Retro'])
    // Values stay bilingual in both languages:
    expect(document.querySelector('.planet-table').textContent).toContain('सूर्य / Sun')
    $('#lang-toggle').click() // back to Hindi
  })

  it('copies the details via the Copy button', async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    document.querySelector('.actions [data-action="copy"]').click()
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalled()
    })

    const copied = writeText.mock.calls[0][0]
    expect(copied).toContain('कुंडली / Kundli')
    expect(copied).toContain('सूर्य / Sun')
    expect(copied).toContain('कन्या / Virgo')
    expect(copied).toContain('कृत्तिका / Krittika पद 2')

    await vi.waitFor(() => {
      expect(document.querySelector('.actions .note').textContent).toBe('✓ कॉपी हो गया')
    })
  })
})

describe('Phase 10 — robustness, privacy note & accessibility', () => {
  it('shows a friendly message if the calculation fails, and retries work', async () => {
    const { computeKundli } = await import('../src/astro.js')
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    computeKundli.mockImplementationOnce(() => {
      throw new Error('calculation failed')
    })

    setValue('#f-offset', '')
    setValue('#f-year', '1990')
    setValue('#f-tz', 'Asia/Kolkata')
    submitForm()

    await vi.waitFor(() => {
      expect(document.querySelector('.summary-note').textContent).toContain('गणना इंजन लोड नहीं हो सका')
    })

    // Retry: after a failure the engine promise is reset, so a second attempt works.
    submitForm()
    await vi.waitFor(() => {
      expect(document.querySelector('[data-varga="D1"]')).toBeTruthy()
    })

    errSpy.mockRestore()
  })

  it('shows the bilingual privacy note and the footer links', () => {
    const footer = document.querySelector('.site-footer')
    expect(footer.textContent).toContain('ब्राउज़र में ही रहता है')

    const source = footer.querySelector('.footer-source')
    expect(source.getAttribute('href')).toContain('github.com')
    expect(source.getAttribute('target')).toBe('_blank')
    expect(source.getAttribute('rel')).toBe('noopener')

    const swissLink = footer.querySelector('a[href*="astro.com"]')
    expect(swissLink.textContent).toBe('Swiss Ephemeris')
    expect(swissLink.getAttribute('target')).toBe('_blank')
    expect(swissLink.getAttribute('rel')).toBe('noopener')

    $('#lang-toggle').click()
    expect(footer.textContent).toContain('stay in your browser')
    expect(source.textContent).toBe('Source code (GitHub)')
    $('#lang-toggle').click()
    expect(source.textContent).toBe('सोर्स कोड (GitHub)')
  })

  it('marks the charts and the toggle buttons for accessibility', async () => {
    setValue('#f-offset', '')
    submitForm()

    await vi.waitFor(() => {
      expect(document.querySelector('[data-varga="D1"]')).toBeTruthy()
    })

    const svg = document.querySelector('[data-varga="D1"]')
    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toContain('chart')

    const north = document.querySelector('.chart-toggle [data-style="north"]')
    const south = document.querySelector('.chart-toggle [data-style="south"]')
    expect(north.getAttribute('aria-pressed')).toBe('true')
    south.click()
    expect(south.getAttribute('aria-pressed')).toBe('true')
    expect(north.getAttribute('aria-pressed')).toBe('false')
    north.click()
  })
})

describe('Phase 14 — corrections & additions (D9, Chalit, Dasha, PDF)', () => {
  it('accepts an empty seconds field (taken as 00)', async () => {
    setValue('#f-offset', '')
    setValue('#f-year', '1990')
    setValue('#f-tz', 'Asia/Kolkata')
    setValue('#f-second', '')
    submitForm()
    await vi.waitFor(() => {
      expect(document.querySelector('[data-varga="D1"]')).toBeTruthy()
    })
    expect(ddTexts()).toContain('14:30:00')
    setValue('#f-second', '0')
  })

  it('shows D1, D9 and Bhava Chalit charts with captions and degrees', async () => {
    submitForm()
    await vi.waitFor(() => {
      expect(document.querySelector('[data-varga="D9"]')).toBeTruthy()
    })
    const captions = Array.from(document.querySelectorAll('.chart-caption')).map((el) => el.textContent)
    expect(captions).toContain('जन्म कुंडली (D1)')
    expect(captions).toContain('नवमांश (D9)')
    expect(captions).toContain('भाव चलित')
    // degrees are shown inside the charts (mock sun: 0°33')
    expect(document.querySelector('[data-varga="D1"]').textContent).toContain("0°33'")
  })

  it('shows the Vimshottari dasha tables and the PDF hint', async () => {
    await vi.waitFor(() => {
      expect(document.querySelectorAll('.dasha-table').length).toBe(2)
    })
    const dashaText = document.querySelector('.dasha-table').textContent
    expect(dashaText).toContain('महादशा')
    expect(dashaText).toContain('सूर्य / Sun') // first mahadasha is Sun for this chart
    expect(document.querySelector('.dasha-table tr.current')).toBeTruthy()
    expect(document.querySelector('.dasha-now').textContent).toContain('अभी चल रही')
    expect(document.querySelector('.pdf-hint').textContent).toContain('Save as PDF')

    // Print/PDF letter-head: title + both site links inside a neat box.
    const printHead = document.querySelector('.print-head')
    expect(printHead.querySelector('.print-title').textContent).toBe('कुंडली / Kundli')
    const printLinks = Array.from(printHead.querySelectorAll('.print-links a'))
    expect(printLinks.map((a) => a.textContent)).toEqual(['mybapuji.com', 'kundli.mybapuji.com'])
    expect(printLinks[0].getAttribute('href')).toBe('https://www.mybapuji.com')
    expect(printLinks[1].getAttribute('href')).toBe('https://kundli.mybapuji.com')
    // App-only lines are marked so the print stylesheet can hide them.
    expect(document.querySelector('h2.summary-title')).toBeTruthy()
    expect(document.querySelector('.summary-note.summary-note-ok')).toBeTruthy()
    expect(document.querySelector('.footer-credit-line')).toBeTruthy()
  })
})
