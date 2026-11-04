// tests/bnn-offset-seconds.test.js — राउंड 65 / टास्क 08 (4-11-2026)
//
// GMT-offset में **सेकंड** (जैसे 1906 से पहले का LMT +05:31:57)। 30 सेकंड का फ़र्क़
// लग्न में ~7.5 कला (0.125°) है — इसलिए भाव-संधियाँ और भाव-सीमा का नतीजा भी बदल सकता है।
// यहाँ: offset पढ़ना/लिखना, UTC में बदलना (हाथ के हिसाब से), लग्न, और app का GMT-खाना।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { beforeAll, describe, expect, it } from 'vitest'
import { formatUtcOffset, parseUtcOffset, wallTimeToUtc } from '../src/timeutil.js'
import { initEphemeris } from '../src/astro.js'
import { computeBhavaChalit } from '../src/bnn/kp.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP, 'app.js'))
const VNS = { latitude: 25.3176, longitude: 82.9739 }

describe('offset में सेकंड — पढ़ना/लिखना', () => {
  it('±HH:MM:SS पढ़ता है, ±HH:MM पहले जैसा', () => {
    expect(parseUtcOffset('+05:30')).toBe(330)
    expect(parseUtcOffset('+05:31:57')).toBeCloseTo(331.95, 6)
    expect(parseUtcOffset('-04:00:30')).toBeCloseTo(-240.5, 6)
    expect(parseUtcOffset('5:30')).toBe(330)
  })
  it('ग़लत input पर null (साफ़ संदेश app में)', () => {
    for (const bad of ['+05:61', '+05:30:75', '+15:00', '-12:01', 'abc', '', '+5:3:7']) expect(parseUtcOffset(bad), bad).toBeNull()
  })
  it('पूरे मिनट पर वही +05:30, सेकंड हों तो +05:31:57', () => {
    expect(formatUtcOffset(330)).toBe('+05:30')
    expect(formatUtcOffset(-480)).toBe('-08:00')
    expect(formatUtcOffset(331.95)).toBe('+05:31:57')
    expect(formatUtcOffset(-240.5)).toBe('-04:00:30')
  })
})

describe('1875 वाराणसी — सेकंड वाला LMT', () => {
  let swe
  beforeAll(async () => { swe = await initEphemeris() }, 30000)

  it('वाराणसी का LMT +05:31:54 — UTC ठीक 6 सेकंड खिसकता है (हाथ का हिसाब)', () => {
    const a = wallTimeToUtc({ year: 1875, month: 9, day: 12, hour: 4, minute: 50, second: 0 }, '+05:32')
    const b = wallTimeToUtc({ year: 1875, month: 9, day: 12, hour: 4, minute: 50, second: 0 }, '+05:31:54')
    // 04:50:00 − 05:31:54 = 23:18:06 (पिछली रात) · और −05:32 = 23:18:00
    expect(a.utc).toEqual({ year: 1875, month: 9, day: 11, hour: 23, minute: 18, second: 0 })
    expect(b.utc).toEqual({ year: 1875, month: 9, day: 11, hour: 23, minute: 18, second: 6 })
    expect(b.offsetText).toBe('+05:31:54')
    expect(parseUtcOffset('+05:31:54')).toBeCloseTo(331.9, 6)
  })

  it('लग्न में फ़र्क़ 6 सेकंड के हिसाब से (≈0.25 कला/सेकंड ⇒ ~1.5 कला)', () => {
    const a = computeBhavaChalit(swe, wallTimeToUtc({ year: 1875, month: 9, day: 12, hour: 4, minute: 50, second: 0 }, '+05:32').utc, VNS)
    const b = computeBhavaChalit(swe, wallTimeToUtc({ year: 1875, month: 9, day: 12, hour: 4, minute: 50, second: 0 }, '+05:31:54').utc, VNS)
    const arcmin = (b.cusps[0].longitude - a.cusps[0].longitude) * 60
    expect(arcmin).toBeGreaterThan(1.0)
    expect(arcmin).toBeLessThan(2.0)          // 6 सेकंड × ~0.25 कला = ~1.5
    // निरपेक्ष जाँच: सेकंड वाला लग्न 133.62° (सिंह 13°37′) के आसपास
    expect(b.cusps[0].longitude).toBeGreaterThan(133.6)
    expect(b.cusps[0].longitude).toBeLessThan(133.65)
  })
})

describe.runIf(hasApp)('app का GMT-खाना — ±HH:MM:SS', () => {
  async function boot() {
    const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8')
    const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
    const w = dom.window
    w.BNN_PLACES = []; w.alert = () => {}; w.confirm = () => true
    w.BNNEngine = { compute: async () => { throw new Error('STUB') } }
    w.eval(fs.readFileSync(path.join(APP, 'app.js'), 'utf8'))
    await new Promise((r) => setTimeout(r, 40))
    if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 60))
    return w
  }
  const fillGeo = (w) => {
    const $ = (id) => w.document.getElementById(id)
    $('fDate').value = '12-09-1875'; $('fTime').value = '04:50:00'; $('fPlace').value = 'Varanasi'
    $('fLat').value = '25.3176'; $('fLon').value = '82.9739'
    for (const g of w.document.getElementsByName('gender')) g.checked = (g.value === 'पुरुष')
    $('fName').value = 'LMT जाँच'
  }

  it('खाने में +05:31:57 लिखकर सहेजें → gmt 5.5325 और gmtText +05:31:57 (सेकंड बचे)', async () => {
    const w = await boot()
    fillGeo(w)
    w.document.getElementById('fGmt').value = '+05:31:57'
    w.document.getElementById('btnSave').click()
    await new Promise((r) => setTimeout(r, 250))
    const rec = JSON.parse(w.localStorage.getItem('bnn_kundli_v1')).records[0]
    expect(rec.gmt).toBeCloseTo(5.5325, 6)
    expect(rec.gmtText).toBe('+05:31:57')
    w.close()
  })

  it('पूरे मिनट पर gmtText +05:30 (पुराना रूप)', async () => {
    const w = await boot()
    fillGeo(w)
    w.document.getElementById('fGmt').value = '5.5'
    w.document.getElementById('btnSave').click()
    await new Promise((r) => setTimeout(r, 250))
    const rec = JSON.parse(w.localStorage.getItem('bnn_kundli_v1')).records[0]
    expect(rec.gmt).toBe(5.5)
    expect(rec.gmtText).toBe('+05:30')
    w.close()
  })

  it('ग़लत offset (+05:61 / +05:30:75 / +15:00) → साफ़ हिंदी संदेश, कुछ सहेजा नहीं', async () => {
    for (const bad of ['+05:61', '+05:30:75', '+15:00']) {
      const w = await boot()
      fillGeo(w)
      w.document.getElementById('fGmt').value = bad
      w.document.getElementById('btnSave').click()
      await new Promise((r) => setTimeout(r, 150))
      expect(w.localStorage.getItem('bnn_kundli_v1'), bad).toBeNull()
      expect(w.document.getElementById('hGmt').textContent).toContain('+05:31:57')
      w.close()
    }
  })

  it('1906 से पहले LMT अपने-आप पूरे सेकंड के साथ भरता है (+05:31:54)', async () => {
    const w = await boot()
    fillGeo(w)
    const $ = (id) => w.document.getElementById(id)
    $('fLon').dispatchEvent(new w.Event('input', { bubbles: true }))
    $('fDate').dispatchEvent(new w.Event('change', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 60))
    expect($('fGmt').value).toBe('+05:31:54')
    expect($('hGmt').textContent).toContain('+05:31:54')
    w.close()
  })

  it('पुराना रिकॉर्ड (केवल gmt, gmtText नहीं) बिना बदले खुलता है', async () => {
    const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8')
    const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
    const w = dom.window
    w.localStorage.setItem('bnn_kundli_v1', JSON.stringify({ nextRef: 2, groups: ['परिवार'], records: [{ id: 1, ref: 1, name: 'पुराना', group: 'परिवार', gender: 'पुरुष', date: '22-01-1980', time: '20:30:00', country: 'भारत', state: 'मध्य प्रदेश', place: 'बेतूल', placeEN: 'Betul', lat: 21.9006, lon: 77.9023, gmt: 5.5, dst: 0 }] }))
    w.BNN_PLACES = []; w.alert = () => {}; w.BNNEngine = { compute: async () => { throw new Error('STUB') } }
    w.eval(fs.readFileSync(path.join(APP, 'app.js'), 'utf8'))
    await new Promise((r) => setTimeout(r, 40))
    if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 60))
    w.document.querySelector('#list .li').click()
    await new Promise((r) => setTimeout(r, 80))
    expect(Number(w.document.getElementById('fGmt').value)).toBe(5.5)
    w.close()
  })
})
