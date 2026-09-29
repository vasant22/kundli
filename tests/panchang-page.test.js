// @vitest-environment jsdom
// panchang-page.test.js — Phase 8: full /panchang/ page sections & chart tabs.
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { computePanchang } from '../src/panchang.js'
import { renderSections, sunriseKundli, dms, jdToUtcParts } from '../src/panchang-page.js'
import { setLang } from '../src/i18n.js'

let swe
let p
let kundli
const PLACE = { name: 'New Delhi, India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' }

beforeAll(async () => {
  swe = await initEphemeris()
  p = computePanchang(swe, { year: 2026, month: 9, day: 29, ...PLACE })
  kundli = sunriseKundli(swe, p, PLACE)
}, 30000)

function render(lang = 'hi') {
  setLang(lang)
  const out = document.createElement('div')
  document.body.appendChild(out)
  renderSections(out, { p, kundli, place: PLACE })
  return out
}

const rowValue = (out, label) =>
  [...out.querySelectorAll('.pp-row')]
    .find((r) => r.querySelector('.pp-label')?.textContent === label)
    ?.querySelector('.pp-value')?.textContent

describe('helpers', () => {
  it('dms formats degrees/minutes/seconds', () => {
    expect(dms(0.5498)).toBe('0°32\'59"')
    expect(dms(7.0333)).toBe('7°02\'00"') // 59.88" rounds up and carries
  })
  it('jdToUtcParts converts sunrise UT correctly', () => {
    const u = jdToUtcParts(swe, p.sunriseJd)
    expect(u.year).toBe(2026)
    expect(u.month).toBe(9)
    expect(u.day).toBe(29)
    expect(u.text).toMatch(/^00:4\d:\d\d$/) // ≈ 06:13 IST minus 5:30
  })
})

describe('renderSections (Hindi, 2026-09-29)', () => {
  let out
  beforeAll(() => {
    out = render('hi')
  })

  it('renders all nine section cards in order', () => {
    const titles = [...out.querySelectorAll('.pp-h2')].map((h) => h.textContent)
    expect(titles).toEqual([
      'आज का पंचांग',
      'सूर्य और चंद्र गणना',
      'हिंदू मास और वर्ष',
      'अशुभ समय (अशुभ मुहूर्त)',
      'शुभ समय (शुभ मुहूर्त)',
      'दिशा शूल',
      'चंद्रबल और ताराबल',
      'सूर्योदय पर लग्न चार्ट',
      'सूर्योदय पर ग्रह स्थिति',
    ])
  })

  it('today section values', () => {
    expect(rowValue(out, 'तिथि')).toContain('तृतीया / Tritiya')
    expect(rowValue(out, 'तिथि')).toContain('तक')
    expect(rowValue(out, 'नक्षत्र')).toContain('अश्विनी / Ashwini')
    expect(rowValue(out, 'करण')).toContain('वणिज / Vanija')
    expect(rowValue(out, 'पक्ष')).toBe('कृष्ण / Krishna')
    expect(rowValue(out, 'योग')).toContain('व्याघात / Vyaghata')
    expect(rowValue(out, 'वार')).toBe('मंगलवार / Mangalavara')
  })

  it('sun/moon + month/year sections', () => {
    expect(rowValue(out, 'चन्द्र राशि')).toBe('मेष / Aries')
    expect(rowValue(out, 'ऋतु')).toBe('शरद / Sharad')
    expect(rowValue(out, 'शक सम्वत')).toContain('1948')
    expect(rowValue(out, 'शक सम्वत')).toContain('पराभव')
    expect(rowValue(out, 'विक्रम सम्वत')).toBe('2083')
    expect(rowValue(out, 'काली सम्वत')).toBe('5127')
    expect(rowValue(out, 'प्रविष्टे / गत्ते')).toBe('13')
    expect(rowValue(out, 'मास पूर्णिमांत')).toBe('आश्विन / Ashwin')
    expect(rowValue(out, 'मास अमांत')).toBe('भाद्रपद / Bhadrapada')
  })

  it('muhurat sections (labels bilingual, reference values)', () => {
    expect(rowValue(out, 'राहु काल / Rahu Kaal')).toMatch(/15:10:\d\d से 16:40:\d\d तक/)
    expect(rowValue(out, 'गुलिक काल / Gulika Kaal')).toMatch(/12:11:\d\d से 13:4\d:\d\d तक/)
    expect(rowValue(out, 'कंटक / मृत्यु / Kantaka / Mrityu')).toMatch(/07:00:\d\d से 07:48:\d\d तक/)
    expect(rowValue(out, 'अभिजीत / Abhijit')).toMatch(/11:47:\d\d से 12:35:\d\d तक/)
  })

  it('disha + bala sections', () => {
    expect(rowValue(out, 'दिशा शूल')).toBe('उत्तर / North')
    const tara = rowValue(out, 'ताराबल')
    expect(tara).toContain('अश्विनी / Ashwini')
    expect(tara).toContain('रेवती / Revati')
    expect(tara).not.toContain('रोहिणी / Rohini')
    const chandra = rowValue(out, 'चन्द्रबल')
    expect(chandra).toContain('मेष / Aries')
    expect(chandra).toContain('कुंभ / Aquarius')
    expect(chandra).not.toContain('वृषभ / Taurus')
  })

  it('lagna chart at sunrise: north default + tab switching to south/east', () => {
    let svg = out.querySelector('#pp-lagna-card svg')
    expect(svg.getAttribute('data-chart')).toBe('north')
    expect(out.querySelectorAll('.pp-tab')).toHaveLength(3)
    out.querySelector('.pp-tab[data-style="south"]').click()
    svg = out.querySelector('#pp-lagna-card svg')
    expect(svg.getAttribute('data-chart')).toBe('south')
    out.querySelector('.pp-tab[data-style="east"]').click()
    svg = out.querySelector('#pp-lagna-card svg')
    expect(svg.getAttribute('data-chart')).toBe('east')
    expect(svg.querySelector('[data-rashi="5"]').textContent).toContain('Asc') // sunrise lagna Kanya
  })

  it('planetary table: header + 9 grahas with dms/nakshatra/pada', () => {
    const rows = out.querySelectorAll('.pp-table tbody tr')
    expect(rows).toHaveLength(9)
    const headCols = out.querySelectorAll('.pp-table thead th')
    expect(headCols).toHaveLength(5)
    const first = rows[0].textContent
    expect(first).toContain('सूर्य / Sun')
    expect(first).toContain('कन्या / Virgo') // Sun in Kanya at sunrise
    expect(first).toMatch(/\d+°\d\d'\d\d"/)
  })

  it('English render switches labels', () => {
    const en = render('en')
    const titles = [...en.querySelectorAll('.pp-h2')].map((h) => h.textContent)
    expect(titles[0]).toBe('Panchang For Today')
    expect(rowValue(en, 'Tithi')).toContain('Tritiya')
    expect(rowValue(en, 'Day')).toContain('Mangalavara')
    setLang('hi')
  })
})
