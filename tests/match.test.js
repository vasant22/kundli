// @vitest-environment jsdom
// tests/match.test.js — Kundli Matching page (/match/).
// Phase 1: page shell + site navigation.
// Phase 2: two-step boy → girl form — validation, Back, place search, and
// both charts calculated on "Get Match Report".
import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest'

// The heavy WASM chart engine is mocked in these UI tests (the real maths are
// covered by tests/astro.test.js + tests/accuracy.test.js).
vi.mock('../src/astro.js', () => ({
  initEphemeris: vi.fn(async () => ({})),
  computeKundli: vi.fn(() => ({
    jd: 2448026.875,
    ayanamsa: 23.72255,
    ascendant: {
      key: 'asc', name: 'Ascendant', short: 'Asc', longitude: 157.037, rashi: 5,
      degInSign: 7.037, nakshatra: 12, pada: 3, speed: 0, retro: false, rashiLord: 'mercury', house: 1,
    },
    planets: [
      { key: 'sun', name: 'Sun', short: 'Su', longitude: 30.5498, rashi: 1, degInSign: 0.5498, nakshatra: 3, pada: 2, speed: 0.96, retro: false, rashiLord: 'venus', house: 9 },
      { key: 'moon', name: 'Moon', short: 'Mo', longitude: 271.8937, rashi: 9, degInSign: 1.89, nakshatra: 21, pada: 2, speed: 12.3, retro: false, rashiLord: 'saturn', house: 5 },
      { key: 'mars', name: 'Mars', short: 'Ma', longitude: 300.1, rashi: 10, degInSign: 0.1, nakshatra: 23, pada: 1, speed: 0.5, retro: false, rashiLord: 'saturn', house: 6 },
    ],
  })),
}))

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>'
  await import('../src/match.js')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => document.querySelectorAll(sel)
const setValue = (id, value) => {
  $(id).value = value
}
const setMonth = (p, value) => {
  document.querySelector(`input[name="${p}-month"][value="${value}"]`).checked = true
}

const VARANASI = {
  name: 'Varanasi',
  admin1: 'Uttar Pradesh',
  country: 'India',
  latitude: 25.31668,
  longitude: 83.01041,
  timezone: 'Asia/Kolkata',
}

describe('Phase 1 — Kundli Matching page shell', () => {
  it('renders the heading and intro in Hindi by default', () => {
    expect($('#app h1').textContent).toBe('कुंडली मिलान')
    expect($('.match-intro-card').textContent).toContain('अष्टकूट')
    expect(document.documentElement.lang).toBe('hi')
  })

  it('has the site navigation (कुंडली / कुंडली मिलान / पंचांग / BNN)', () => {
    const links = document.querySelectorAll('.site-nav a')
    expect(links.length).toBe(4)
    expect(links[0].textContent).toBe('कुंडली')
    expect(links[0].getAttribute('href')).toBe('../')
    expect(links[1].textContent).toBe('कुंडली मिलान')
    expect(links[1].classList.contains('active')).toBe(true)
    expect(links[2].textContent).toBe('पंचांग')
    expect(links[2].getAttribute('href')).toBe('../panchang/')
    expect(links[3].textContent).toBe('Free BNN चार्ट')
    expect(links[3].getAttribute('href')).toBe('../bnn/')
    // MyBapuji मुख्य-साइट पट्टी भी मौजूद
    expect(document.querySelector('.mb-strip .brand').textContent).toContain('MyBapuji')
  })

  it('switches to English with the language toggle and back', () => {
    $('#lang-toggle').click()
    expect(document.documentElement.lang).toBe('en')
    expect($('#app h1').textContent).toBe('Kundli Matching')
    expect(document.title).toContain('Kundli Matching')
    $('#lang-toggle').click()
    expect($('#app h1').textContent).toBe('कुंडली मिलान')
  })

  it('keeps the shared footer (privacy note + credits)', () => {
    const footer = document.querySelector('.site-footer')
    expect(footer.textContent).toContain('ब्राउज़र में ही रहता है')
    expect(footer.querySelector('.footer-source').getAttribute('href')).toContain('github.com')
    expect(footer.querySelector('a[href*="astro.com"]').textContent).toBe('Swiss Ephemeris')
  })
})

describe('Phase 2 — two-step boy → girl form', () => {
  it('shows the boy errors when Continue is pressed empty; step 2 stays hidden', () => {
    $('#continue-btn').click()
    expect($('#b-err-date').textContent).toContain('जन्म तिथि पूरी भरें')
    expect($('#b-err-time').textContent).toContain('जन्म समय भरें')
    expect($('#b-err-place').textContent).toContain('जन्म स्थान भरें')
    expect($('#step-b').hidden).toBe(false)
    expect($('#step-g').hidden).toBe(true)
  })

  it('searches a place inside the boy form and picks it (girl list untouched)', async () => {
    const mock = vi.fn(async () => ({ ok: true, json: async () => ({ results: [VARANASI] }) }))
    vi.stubGlobal('fetch', mock)
    setValue('#b-place', 'Varanasi')
    $('#b-search-btn').click()

    await vi.waitFor(() => {
      expect($$('#b-results .result-item').length).toBe(1)
    })
    expect(mock.mock.calls[0][0]).toContain('name=Varanasi')

    $('#b-results .result-item').click()
    expect($('#b-place-confirm').hidden).toBe(false)
    expect($('#b-place-confirm').textContent).toContain('Varanasi, Uttar Pradesh, India')
    expect($('#g-place-confirm').hidden).toBe(true)
  })

  it('Continue shows step 2; Back returns with everything kept', () => {
    setValue('#b-name', 'राम कुमार')
    setMonth('b', '5')
    setValue('#b-day', '15')
    setValue('#b-year', '1990')
    setValue('#b-hour', '14')
    setValue('#b-minute', '30')
    setValue('#b-second', '0')
    $('#continue-btn').click()

    expect($('#step-b').hidden).toBe(true)
    expect($('#step-g').hidden).toBe(false)
    expect($('#g-name').value).toBe('')

    $('#back-btn').click()
    expect($('#step-b').hidden).toBe(false)
    expect($('#step-g').hidden).toBe(true)
    expect($('#b-name').value).toBe('राम कुमार') // kept without re-entering
    $('#continue-btn').click()
    expect($('#step-g').hidden).toBe(false)
  })

  it('fills the girl and Get Match Report calculates BOTH charts', async () => {
    setValue('#g-name', 'सीता देवी')
    setMonth('g', '6')
    setValue('#g-day', '20')
    setValue('#g-year', '1992')
    setValue('#g-hour', '10')
    setValue('#g-minute', '0')
    setValue('#g-second', '0')
    setValue('#g-lat', '26.85')
    setValue('#g-lon', '80.95')
    setValue('#g-tz', 'Asia/Kolkata')
    $('#report-btn').click()

    await vi.waitFor(() => {
      expect($$('.match-person').length).toBe(2)
    })

    const { computeKundli } = await import('../src/astro.js')
    expect(computeKundli.mock.calls.length).toBe(2)
    // Boy: picked Varanasi — 14:30 IST → 09:00 UTC.
    const boyBirth = computeKundli.mock.calls[0][1]
    expect(boyBirth.utc).toEqual({ year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 })
    expect(boyBirth.latitude).toBeCloseTo(25.31668)
    // Girl: manual coordinates — 10:00 IST → 04:30 UTC.
    const girlBirth = computeKundli.mock.calls[1][1]
    expect(girlBirth.utc).toEqual({ year: 1992, month: 6, day: 20, hour: 4, minute: 30, second: 0 })
    expect(girlBirth.latitude).toBeCloseTo(26.85)

    const text = $('.match-summary').textContent
    expect(text).toContain('राम कुमार')
    expect(text).toContain('सीता देवी')
    expect(text).toContain('चंद्र राशि')
    expect(text).toContain('मकर / Capricorn')
    expect(text).toContain('उत्तराषाढ़ा / Uttara Ashadha')
  })

  it('points at the missing girl field when Get Match Report is pressed with one empty', () => {
    setValue('#g-day', '')
    $('#report-btn').click()
    expect($('#g-err-date').textContent).toContain('जन्म तिथि पूरी भरें')
    expect($('#step-g').hidden).toBe(false)
    expect($('#match-output').hidden).toBe(true)
    setValue('#g-day', '20')
  })

  it('language toggle switches the whole two-step form', () => {
    $('#lang-toggle').click()
    expect($('#continue-btn').textContent).toBe('Continue')
    expect($('#report-btn').textContent).toBe('Get Match Report')
    expect($('#back-btn').textContent).toContain('Back')
    expect($('#step-g h2').textContent).toBe("Enter Girl's Details")
    expect($('.match-summary').textContent).toContain('Ashtakoot Guna Milan result')
    $('#lang-toggle').click()
    expect($('#report-btn').textContent).toBe('मिलान रिपोर्ट देखें')
    expect($('#step-g h2').textContent).toBe('लड़की का विवरण')
  })
})

describe('Phase 5 — full match report', () => {
  it('shows the Ashtakoot table (8 kootas + total) with reasons and the verdict band', () => {
    const table = $('.match-table')
    expect(table).toBeTruthy()
    const rows = table.querySelectorAll('tbody tr')
    expect(rows.length).toBe(9) // 8 kootas + total
    const headers = Array.from(table.querySelectorAll('th')).map((th) => th.textContent)
    expect(headers).toEqual(['कूट', 'अंक', 'कारण'])
    const text = table.textContent
    for (const name of [
      'वर्ण / Varna',
      'वश्य / Vashya',
      'तारा / Tara',
      'योनि / Yoni',
      'ग्रह मैत्री / Graha Maitri',
      'गण / Gana',
      'भकूट / Bhakoot',
      'नाड़ी / Nadi',
    ]) {
      expect(text).toContain(name)
    }
    // mock returns the same Moon for both people → 28/36, verdict 'good'
    expect(table.querySelector('.total-row td').textContent).toBe('कुल योग')
    expect(table.querySelector('.total-row').textContent).toContain('28 / 36')
    const band = $('.verdict-band')
    expect(band.classList.contains('good')).toBe(true)
    expect(band.textContent).toContain('24–32')
  })

  it('shows the Mangal Dosha section, disclaimer and action buttons', () => {
    const text = $('.match-summary').textContent
    expect(text).toContain('मंगल दोष जाँच')
    expect(text).toContain('मंगल दोष नहीं') // mock: Mars 6th from Lagna, 2nd from Moon → none
    expect(text).toContain('परंपरागत अष्टकूट')
    expect(document.querySelector('.actions [data-action="png"]')).toBeTruthy()
    expect(document.querySelector('.actions [data-action="print"]')).toBeTruthy()
    expect(document.querySelector('.actions [data-action="copy"]')).toBeTruthy()
  })

  it('copies the full report text', async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    document.querySelector('.actions [data-action="copy"]').click()
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled())
    const copied = writeText.mock.calls[0][0]
    expect(copied).toContain('कुंडली मिलान / Kundli Matching')
    expect(copied).toContain('वर्ण / Varna')
    expect(copied).toContain('कुल योग: 28 / 36')
  })
})
