// @vitest-environment jsdom
// tests/match-widget.test.js — Homepage Widgets Phase 3: the Kundli-Matching
// mini-widget (widgets/match/).
// Unit: the link it builds (buildMatchParams / buildOpenUrl) — the exact
// prefill format the full /match/ page understands (src/prefill.js).
// Integration: the two-step card renders, validates both sides with the same
// rules as the full tool, and opens /match/ in a NEW tab with both people.
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setLang } from '../src/i18n.js'
import { buildMatchParams, buildOpenUrl, renderMatchWidget } from '../src/match-widget.js'

const VARANASI = {
  name: 'Varanasi',
  admin1: 'Uttar Pradesh',
  country: 'India',
  latitude: 25.31668,
  longitude: 83.01041,
  timezone: 'Asia/Kolkata',
}

const BOY = { name: 'राम', day: '11', month: '1', year: '1995', hour: '1', minute: '30', second: '0', selectedPlace: VARANASI }
const GIRL = { name: 'सीता', day: '2', month: '6', year: '1995', hour: '16', minute: '0', second: '0', selectedPlace: VARANASI }

afterEach(() => {
  setLang('hi')
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('buildMatchParams — the link the widget opens', () => {
  it('carries both people with the picked places (prefill format of /match/)', () => {
    const p = buildMatchParams(BOY, GIRL)
    expect(p.get('b_name')).toBe('राम')
    expect(p.get('b_day')).toBe('11')
    expect(p.get('b_min')).toBe('30')
    expect(p.get('b_place')).toBe('Varanasi, Uttar Pradesh, India')
    expect(p.get('b_lat')).toBe('25.31668')
    expect(p.get('b_lng')).toBe('83.01041')
    expect(p.get('b_tz')).toBe('Asia/Kolkata')
    expect(p.get('g_name')).toBe('सीता')
    expect(p.get('g_hour')).toBe('16')
    expect(p.get('g_place')).toBe('Varanasi, Uttar Pradesh, India')
    expect(p.get('g_tz')).toBe('Asia/Kolkata')
    expect(p.get('lang')).toBeNull() // Hindi is the default
  })

  it('passes lang=en when the widget is in English; empty names are omitted', () => {
    const p = buildMatchParams({ ...BOY, name: '' }, { ...GIRL, name: '' }, 'en')
    expect(p.get('b_name')).toBeNull()
    expect(p.get('g_name')).toBeNull()
    expect(p.get('lang')).toBe('en')
  })
})

describe('buildOpenUrl', () => {
  it('opens the matching tool at /match/ (production path)', () => {
    const url = buildOpenUrl('https://kundli.mybapuji.com/widgets/match/', BOY, GIRL)
    expect(url.startsWith('https://kundli.mybapuji.com/match/?')).toBe(true)
  })

  it('works the same on the dev server', () => {
    const url = buildOpenUrl('http://localhost:5173/widgets/match/', BOY, GIRL)
    expect(url.startsWith('http://localhost:5173/match/?')).toBe(true)
  })
})

describe('the Matching mini-widget card', () => {
  const render = (lang = 'hi') => {
    // Clear the previous card first — jsdom mis-scopes '#id' queries when the
    // same id exists twice in the document (real browsers don't).
    document.body.replaceChildren()
    const root = document.createElement('div')
    document.body.append(root)
    renderMatchWidget(root, lang)
    return root
  }
  const submit = (root) =>
    root.querySelector('#mw-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  const fill = (root, p, v) => {
    root.querySelector(`#mw-${p}-name`).value = v.name
    root.querySelector(`#mw-${p}-day`).value = v.day
    root.querySelector(`#mw-${p}-month`).value = v.month
    root.querySelector(`#mw-${p}-year`).value = v.year
    root.querySelector(`#mw-${p}-hour`).value = v.hour
    root.querySelector(`#mw-${p}-minute`).value = v.minute
  }
  const pick = async (root, p) => {
    root.querySelector(`#mw-${p}-place`).value = 'Varanasi'
    root.querySelector(`#mw-${p}-search-btn`).click()
    await vi.waitFor(() => {
      expect(root.querySelectorAll(`#mw-${p}-results .kw-result`).length).toBe(1)
    })
    root.querySelector(`#mw-${p}-results .kw-result`).click()
  }

  it('renders the card: title, boy step visible, girl step hidden (Hindi)', () => {
    const root = render()
    expect(root.querySelector('.pw-title').textContent).toBe('कुंडली मिलान / Kundli Matching')
    expect(root.querySelector('#mw-step-b').hidden).toBe(false)
    expect(root.querySelector('#mw-step-g').hidden).toBe(true)
    expect(root.querySelector('.mw-step-heading').textContent).toBe('लड़के का विवरण')
    expect(root.querySelector('#mw-continue').textContent).toBe('आगे बढ़ें')
    expect(root.querySelector('#mw-report').textContent).toBe('मिलान रिपोर्ट देखें')
    // the note asked for in the reference
    expect(root.querySelector('.mw-next-note').textContent).toBe('लड़की का विवरण अगले पन्ने पर डालें।')
  })

  it('English render switches title and buttons', () => {
    const root = render('en')
    expect(root.querySelector('.pw-title').textContent).toBe('Kundli Matching')
    expect(root.querySelector('#mw-continue').textContent).toBe('Continue')
    expect(root.querySelector('#mw-report').textContent).toBe('Get Match Report')
  })

  it('continue with empty boy details shows errors (no gender asked, no tab)', () => {
    const root = render()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    submit(root)
    expect(root.querySelector('#mw-b-err-date').textContent).toContain('जन्म तिथि पूरी भरें')
    expect(root.querySelector('#mw-b-err-time').textContent).toContain('जन्म समय भरें')
    expect(root.querySelector('#mw-b-err-place').textContent).toContain('जन्म स्थान भरें')
    expect(root.querySelector('#mw-step-g').hidden).toBe(true)
    expect(openSpy).not.toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('full journey: both sides + two searches → opens /match/ with b_/g_ in a NEW tab', async () => {
    window.history.pushState({}, '', '/widgets/match/')
    const mock = vi.fn(async () => ({ ok: true, json: async () => ({ results: [VARANASI] }) }))
    vi.stubGlobal('fetch', mock)
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const root = render()

    // Step 1 — boy
    fill(root, 'b', BOY)
    await pick(root, 'b')
    expect(root.querySelector('#mw-b-results').hidden).toBe(true) // suggestions hide once picked
    expect(root.querySelector('#mw-b-place-confirm').hidden).toBe(false)
    submit(root) // Continue
    expect(root.querySelector('#mw-step-b').hidden).toBe(true)
    expect(root.querySelector('#mw-step-g').hidden).toBe(false)

    // Step 2 — girl
    fill(root, 'g', GIRL)
    await pick(root, 'g')
    submit(root) // Get Match Report

    expect(openSpy).toHaveBeenCalledTimes(1)
    const [url, target] = openSpy.mock.calls[0]
    expect(target).toBe('_blank')
    const u = new URL(url)
    expect(u.pathname).toBe('/match/')
    expect(u.searchParams.get('b_name')).toBe('राम')
    expect(u.searchParams.get('b_lat')).toBe('25.31668')
    expect(u.searchParams.get('g_name')).toBe('सीता')
    expect(u.searchParams.get('g_tz')).toBe('Asia/Kolkata')
    expect(root.querySelector('#mw-open-note').hidden).toBe(false)
    expect(root.querySelector('#mw-open-note').textContent).toContain('मिलान रिपोर्ट नई tab')
    openSpy.mockRestore()
  })

  it('Back returns to the boy step with the values kept', async () => {
    const mock = vi.fn(async () => ({ ok: true, json: async () => ({ results: [VARANASI] }) }))
    vi.stubGlobal('fetch', mock)
    const root = render()
    fill(root, 'b', BOY)
    await pick(root, 'b')
    submit(root)
    expect(root.querySelector('#mw-step-g').hidden).toBe(false)

    root.querySelector('#mw-back').click()
    expect(root.querySelector('#mw-step-b').hidden).toBe(false)
    expect(root.querySelector('#mw-step-g').hidden).toBe(true)
    expect(root.querySelector('#mw-b-name').value).toBe('राम') // kept without re-entering
  })
})
