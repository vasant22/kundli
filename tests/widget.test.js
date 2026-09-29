// @vitest-environment jsdom
// widget.test.js — Phase 7: homepage widget (pure helpers + rendering).
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { computePanchang } from '../src/panchang.js'
import { todayInZone, buildWidgetRows, renderWidget } from '../src/panchang-widget.js'
import { setLang } from '../src/i18n.js'

let swe
let sep29

beforeAll(async () => {
  swe = await initEphemeris()
  sep29 = computePanchang(swe, {
    year: 2026, month: 9, day: 29,
    latitude: 28.6139, longitude: 77.209, timeZone: 'Asia/Kolkata', // fixture day; renderer uses location only for the date header
  })
}, 30000)

describe('todayInZone (fixed-location date, across midnights)', () => {
  it('Kolkata: 18:35 UTC = next day 00:05 IST', () => {
    expect(todayInZone('Asia/Kolkata', new Date('2026-09-29T18:35:00Z'))).toBe('2026-09-30')
  })
  it('Kolkata: 18:25 UTC = same day 23:55 IST', () => {
    expect(todayInZone('Asia/Kolkata', new Date('2026-09-29T18:25:00Z'))).toBe('2026-09-29')
  })
  it('New York: 02:00 UTC = previous evening there', () => {
    expect(todayInZone('America/New_York', new Date('2026-09-29T02:00:00Z'))).toBe('2026-09-28')
  })
})

describe('buildWidgetRows — required fields & order', () => {
  it('Hindi labels with bilingual values (2026-09-29 sample)', () => {
    setLang('hi')
    const rows = buildWidgetRows(sep29)
    expect(rows.map((r) => r.label)).toEqual([
      'तिथि', 'मास अमांत', 'मास पूर्णिमांत', 'दिन और संवत्', 'नक्षत्र', 'योग', 'करण',
    ])
    const v = rows.map((r) => r.value)
    expect(v[0]).toContain('तृतीया / Tritiya')
    expect(v[0]).toContain('कृष्ण')
    expect(v[0]).toMatch(/17:1\d:\d\d/) // ≈ 17:11:53 reference (site math differs ~1 min)
    expect(v[0]).toContain('तक')
    expect(v[1]).toBe('भाद्रपद / Bhadrapada')
    expect(v[2]).toBe('आश्विन / Ashwin')
    expect(v[3]).toContain('मंगलवार / Mangalavara')
    expect(v[3]).toContain('2083')
    expect(v[4]).toContain('अश्विनी / Ashwini')
    expect(v[5]).toContain('व्याघात / Vyaghata')
    expect(v[5]).toContain('हर्षण / Harshana')
    expect(v[6]).toContain('वणिज / Vanija')
    expect(v[6]).toContain('विष्टि / Vishti')
  })

  it('English labels when language switched', () => {
    setLang('en')
    const rows = buildWidgetRows(sep29)
    expect(rows.map((r) => r.label)).toEqual([
      'Tithi', 'Month Amanta', 'Month Purnimanta', 'Day & Samvat', 'Nakshatra', 'Yoga', 'Karana',
    ])
    setLang('hi')
  })
})

describe('renderWidget', () => {
  it('renders the card with header, rows and the Today Panchang button', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    renderWidget(root, sep29, 'hi')
    const html = root.innerHTML
    expect(html).toContain('आज का पंचांग')
    expect(html).toContain('मंगलवार, 29 सितंबर 2026')
    expect(html).toContain('तिथि')
    expect(html).toContain('तृतीया / Tritiya')
    expect(html).toContain('href="https://kundli.mybapuji.com/panchang/"')
    expect(root.querySelectorAll('.pw-row').length).toBe(7)
    expect(root.querySelector('.pw-btn').textContent).toBe('आज का पंचांग')
  })

  it('English render switches labels and button', () => {
    const root = document.createElement('div')
    renderWidget(root, sep29, 'en')
    expect(root.innerHTML).toContain('Tithi')
    expect(root.innerHTML).toContain('Day &amp; Samvat')
    expect(root.innerHTML).toContain('Today Panchang')
    expect(root.innerHTML).toContain('upto 17:10:44')
    setLang('hi')
  })
})
