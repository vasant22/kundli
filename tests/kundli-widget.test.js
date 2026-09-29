// @vitest-environment jsdom
// tests/kundli-widget.test.js — Homepage Widgets Phase 2: the Kundli
// mini-widget (widgets/kundli/).
// Unit: the link the widget builds (buildKundliParams / buildOpenUrl) — the
// exact format the full page pre-fills (src/prefill.js, tested there).
// Integration: the card renders in the reference order, validates with the
// same rules as the full form, searches + picks a place, and opens the full
// tool in a NEW tab with every detail.
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setLang } from '../src/i18n.js'
import { buildKundliParams, buildOpenUrl, renderKundliWidget } from '../src/kundli-widget.js'

const VARANASI = {
  name: 'Varanasi',
  admin1: 'Uttar Pradesh',
  country: 'India',
  latitude: 25.31668,
  longitude: 83.01041,
  timezone: 'Asia/Kolkata',
}

const FILLED = {
  name: 'राधा',
  gender: 'female',
  day: '15',
  month: '5',
  year: '1990',
  hour: '14',
  minute: '30',
  second: '0',
  selectedPlace: VARANASI,
}

afterEach(() => {
  setLang('hi')
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('buildKundliParams — the link the widget opens', () => {
  it('carries every field + the picked place (prefill format of the full page)', () => {
    const p = buildKundliParams(FILLED)
    expect(p.get('name')).toBe('राधा')
    expect(p.get('gender')).toBe('female')
    expect(p.get('day')).toBe('15')
    expect(p.get('month')).toBe('5')
    expect(p.get('year')).toBe('1990')
    expect(p.get('hour')).toBe('14')
    expect(p.get('min')).toBe('30')
    expect(p.get('sec')).toBe('0')
    expect(p.get('place')).toBe('Varanasi, Uttar Pradesh, India')
    expect(p.get('lat')).toBe('25.31668')
    expect(p.get('lng')).toBe('83.01041')
    expect(p.get('tz')).toBe('Asia/Kolkata')
    expect(p.get('lang')).toBeNull() // Hindi is the default — no lang param
  })

  it('passes lang=en when the widget is in English; empty name is omitted', () => {
    const p = buildKundliParams({ ...FILLED, name: '' }, 'en')
    expect(p.get('name')).toBeNull()
    expect(p.get('lang')).toBe('en')
  })
})

describe('buildOpenUrl', () => {
  it('opens the full tool at the site root (production path)', () => {
    const url = buildOpenUrl('https://kundli.mybapuji.com/widgets/kundli/', FILLED)
    expect(url.startsWith('https://kundli.mybapuji.com/?')).toBe(true)
    expect(new URL(url).searchParams.get('lat')).toBe('25.31668')
  })

  it('works the same on the dev server', () => {
    const url = buildOpenUrl('http://localhost:5173/widgets/kundli/', FILLED)
    expect(url.startsWith('http://localhost:5173/?')).toBe(true)
  })
})

describe('the Kundli mini-widget card', () => {
  const render = (lang = 'hi') => {
    // Clear the previous card first — jsdom mis-scopes '#id' queries when the
    // same id exists twice in the document (real browsers don't).
    document.body.replaceChildren()
    const root = document.createElement('div')
    document.body.append(root)
    renderKundliWidget(root, lang)
    return root
  }
  const submit = (root) =>
    root.querySelector('#kw-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))

  it('renders the reference card: title, sub-heading, field order, orange button (Hindi)', () => {
    const root = render()
    expect(root.querySelector('.pw-title').textContent).toBe('कुंडली / Birth Chart')
    expect(root.querySelector('.pw-sub').textContent).toBe('जन्म विवरण भरें')
    // Field order (radii = gender, no id): name → date → time → place → button.
    const ids = [...root.querySelectorAll('#kw-form input, #kw-submit')].map((el) => el.id).filter(Boolean)
    expect(ids).toEqual([
      'kw-name', 'kw-day', 'kw-month', 'kw-year',
      'kw-hour', 'kw-minute', 'kw-second', 'kw-place', 'kw-submit',
    ])
    expect(root.querySelector('#kw-submit').textContent).toBe('कुंडली बनाएँ')
    expect(root.querySelectorAll('input[name="kw-gender"]').length).toBe(3)
    // the Open-Meteo attribution stays as a tiny footnote at the card bottom
    expect(root.querySelector('.kw-credit').textContent).toContain('Open-Meteo.com')
  })

  it('English render switches title, sub-heading and button', () => {
    const root = render('en')
    expect(root.querySelector('.pw-title').textContent).toBe('Kundli / Birth Chart')
    expect(root.querySelector('.pw-sub').textContent).toBe('Enter birth details')
    expect(root.querySelector('#kw-submit').textContent).toBe('Get Kundli')
  })

  it('empty submit shows the same validation messages as the full form — no link opened', () => {
    const root = render()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    submit(root)
    expect(root.querySelector('#kw-err-gender').textContent).toBe('कृपया लिंग चुनें।')
    expect(root.querySelector('#kw-err-date').textContent).toContain('जन्म तिथि पूरी भरें')
    expect(root.querySelector('#kw-err-time').textContent).toContain('जन्म समय भरें')
    expect(root.querySelector('#kw-err-place').textContent).toContain('जन्म स्थान भरें')
    expect(openSpy).not.toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('place typed but not picked → the widget-specific pick message', () => {
    const root = render()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    root.querySelector('#kw-name').value = 'राधा'
    root.querySelector('input[name="kw-gender"][value="female"]').checked = true
    root.querySelector('#kw-day').value = '15'
    root.querySelector('#kw-month').value = '5'
    root.querySelector('#kw-year').value = '1990'
    root.querySelector('#kw-hour').value = '14'
    root.querySelector('#kw-minute').value = '30'
    root.querySelector('#kw-place').value = 'Varanasi'
    submit(root)
    expect(root.querySelector('#kw-err-place').textContent).toBe('खोजें दबाकर सूची में से सही जगह चुनें।')
    expect(openSpy).not.toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('search + pick a place, submit → opens the full tool in a NEW tab with all details', async () => {
    window.history.pushState({}, '', '/widgets/kundli/')
    const mock = vi.fn(async () => ({ ok: true, json: async () => ({ results: [VARANASI] }) }))
    vi.stubGlobal('fetch', mock)
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const root = render()
    root.querySelector('#kw-name').value = 'राधा'
    root.querySelector('input[name="kw-gender"][value="female"]').checked = true
    root.querySelector('#kw-day').value = '15'
    root.querySelector('#kw-month').value = '5'
    root.querySelector('#kw-year').value = '1990'
    root.querySelector('#kw-hour').value = '14'
    root.querySelector('#kw-minute').value = '30'
    root.querySelector('#kw-place').value = 'Varanasi'
    root.querySelector('#kw-search-btn').click()

    await vi.waitFor(() => {
      expect(root.querySelectorAll('#kw-results .kw-result').length).toBe(1)
    })
    expect(mock.mock.calls[0][0]).toContain('name=Varanasi')
    root.querySelector('#kw-results .kw-result').click()
    expect(root.querySelector('#kw-results').hidden).toBe(true) // suggestions hide once picked
    expect(root.querySelector('#kw-place-confirm').hidden).toBe(false)
    expect(root.querySelector('#kw-place-confirm').textContent).toContain('Varanasi, Uttar Pradesh, India')

    submit(root)

    expect(openSpy).toHaveBeenCalledTimes(1)
    const [url, target] = openSpy.mock.calls[0]
    expect(target).toBe('_blank')
    const u = new URL(url)
    expect(u.pathname).toBe('/') // ../.. from /widgets/kundli/ = the full tool
    expect(u.searchParams.get('name')).toBe('राधा')
    expect(u.searchParams.get('gender')).toBe('female')
    expect(u.searchParams.get('lat')).toBe('25.31668')
    expect(u.searchParams.get('lng')).toBe('83.01041')
    expect(u.searchParams.get('tz')).toBe('Asia/Kolkata')
    expect(u.searchParams.get('place')).toBe('Varanasi, Uttar Pradesh, India')
    expect(root.querySelector('#kw-open-note').hidden).toBe(false)
    openSpy.mockRestore()
  })
})
