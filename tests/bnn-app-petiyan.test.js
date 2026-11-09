// @vitest-environment jsdom
// tests/bnn-app-petiyan.test.js — राउंड 66 / टास्क 10-घ (9-11-2026)
// screen की दो बड़ी पेटियाँ: “परिवर्तन” (चार्ट के ऊपर-बाएँ) और “राहु-केतु मध्य बिंदु” (ऊपर-दाएँ) —
// दोनों एक जैसी, ख़ाली हों तब भी शीर्षक + “—”; ग्रह हों तो गाढ़ा पाठ; दो परिवर्तन → दो पंक्तियाँ।
// नाप (150×72 / 96×48) यहाँ नहीं जँचती (jsdom में layout नहीं होता) — वह Playwright से नापी गई है।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP_DIR, 'app.js'))
const ORDER = ['jupiter', 'sun', 'moon', 'mars', 'mercury', 'venus', 'saturn', 'rahu', 'ketu']

// एक तैयार RESULT — print के लिए जितना चाहिए उतना (कुंडली 10 जैसा)
function makeResult(opts = {}) {
  // opts.exchanges = [[a,b], …]; opts.mid = मध्य-बिंदु का डेटा
  const pos = (rashi, deg) => rashi * 30 + deg
  const P = (key, rashi, deg, retro = false) => ({ key, rashi, degInSign: deg, longitude: pos(rashi, deg), retro, nakshatra: 5, pada: 2 })
  const planets = [
    P('sun', 1, 5.17), P('moon', 11, 24.33), P('mars', 4, 20.10), P('mercury', 10, 12.40, true),
    P('jupiter', 0, 1.0), P('venus', 10, 29.05, true), P('saturn', 2, 22.36), P('rahu', 8, 21.15, true), P('ketu', 2, 21.15, true),
  ]
  const cusps = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, rashi: (11 + i) % 12, degInSign: 10 + i, longitude: pos((11 + i) % 12, 10 + i) }))
  const emptyRows = () => Object.fromEntries(ORDER.map((k) => [k, { list159: [], list1579: [] }]))
  const emptyBhava = () => Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String(i + 1), { list159: [], list1579: [] }]))
  const special = () => ({
    rows: Object.fromEntries(ORDER.map((k) => [k, { owns: [], gives: [], sitsAt: 1, starLord: null, starAt: '' }])),
    lords: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 'sun'])),
    directors: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 'moon'])),
    inBhava: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, []])),
    inStarOf: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, []])),
  })
  const r311 = opts.r311 || { jupiter: [{ key: 'saturn', gap: 0.4, side: 3 }], saturn: [{ key: 'jupiter', gap: 0.4, side: 11 }] }
  const mid = opts.mid || { points: [pos(3, 21.25), pos(9, 21.25)], members: [{ key: 'jupiter', gap: 0.3 }], effective: true }
  const maha = (lord, y) => ({ lord, startISO: `${y}-01-01`, endISO: `${y + 10}-01-01`, age: { y: 5, m: 0, d: 0 }, bhukthis: [], andhirams: [] })
  return {
    calcVersion: 1, utc: { year: 1965, month: 5, day: 20, hour: 21, minute: 22, second: 0 }, offsetText: '+05:30',
    bnn: { ascendant: { key: 'asc', rashi: 11, degInSign: 24.29, longitude: pos(11, 24.29), retro: false }, cusps, planets, tithiIndex: 20, yogaIndex: 8 },
    exchanges: opts.exchanges || [],
    tables: {
      bhava: { AP: emptyBhava(), BP: emptyBhava() },
      planet: { AP: emptyRows(), BP: emptyRows() },
      special: { AP: special(), BP: special() },
      r311: { AP: r311, BP: opts.r311BP || r311 },
    },
    midpoint: { AP: mid, BP: opts.midBP || mid },
    astro: { AP: {}, BP: {} },
    labels: { AP: Object.fromEntries(ORDER.map((k) => [k, 11])), BP: Object.fromEntries(ORDER.map((k) => [k, 11])) },
    order: ORDER,
    prsss: Object.fromEntries(ORDER.map((k) => [k, []])),
    brsss: Array.from({ length: 12 }, () => []),
    dasha: {
      mahadashas: [maha('saturn', 2025), maha('mercury', 2035), maha('ketu', 2045), maha('venus', 2052), maha('sun', 2072),
        maha('moon', 2078), maha('mars', 2088), maha('rahu', 2095), maha('jupiter', 2113)],
      running: { mahaIndex: 0, bhukthiIndex: 0, andhiramIndex: 0, bhukthis: [], andhirams: [] },
    },
  }
}

async function boot(res) {
  const html = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8')
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
  const w = dom.window
  w.BNN_PLACES = []; w.alert = () => {}; w.confirm = () => true; w.print = () => {}
  w.BNNEngine = {
    compute: async () => JSON.parse(JSON.stringify(res)),
    transitNow: async () => ({ snapshot: { planets: [], ascendant: { rashi: 0, degInSign: 0 } }, wall: { y: 2026, m: 11, d: 9, h: 12, mi: 0, s: 0 }, offsetText: '+05:30' }),
    specialTransit: async () => [],
  }
  w.localStorage.setItem('bnn_kundli_v1', JSON.stringify({
    nextRef: 11, groups: ['जाँच'],
    records: [{ id: 10001, ref: 10, name: 'कुंडली 10', group: 'जाँच', gender: 'पुरुष', mobile: '', date: '20-05-1965', time: '02:52', country: 'भारत', countryEN: 'India', state: 'राजस्थान', stateEN: 'Rajasthan', place: 'जयपुर', placeEN: 'Jaipur', lat: 26.9124, lon: 75.7873, gmt: 5.5, gmtText: '+05:30', dst: 0 }],
  }))
  w.eval(fs.readFileSync(path.join(APP_DIR, 'app.js'), 'utf8'))
  await new Promise((r) => setTimeout(r, 40))
  if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 80))
  w.document.getElementById('btnFolder').click()
  await new Promise((r) => setTimeout(r, 40))
  w.document.querySelector('#openModal tr[data-id] td:nth-child(3)').click()
  await new Promise((r) => setTimeout(r, 650))
  ;['fDate', 'fTime'].forEach((id) => w.document.getElementById(id).dispatchEvent(new w.Event('blur', { bubbles: true })))
  await new Promise((r) => setTimeout(r, 150))
  w.document.getElementById('btnShow').click()
  await new Promise((r) => setTimeout(r, 200))
  const ow = w.document.getElementById('owNew')
  if (ow) ow.click()
  await new Promise((r) => setTimeout(r, 400))
  return w
}

describe.skipIf(!hasApp)('screen की दोनों पेटियाँ (राउंड 66 / टास्क 10-घ)', () => {
  it('दोनों पेटियाँ मौजूद, एक जैसी जगह पर, और हिंदी/English में शीर्षक बदलते हैं', async () => {
    const w = await boot(makeResult())
    const par = w.document.getElementById('pPariv')
    const mid = w.document.getElementById('pMid')
    expect(par).toBeTruthy(); expect(mid).toBeTruthy()
    expect(par.querySelector('.petiT').textContent).toBe('परिवर्तन')
    expect(mid.querySelector('.petiT').textContent).toBe('राहु-केतु मध्य बिंदु')
    expect(par.className).toContain('peti'); expect(mid.className).toContain('peti')
    // पेटियाँ चार्ट से बाहर हैं (चार्ट के अंदर नहीं)
    expect(w.document.querySelector('#rChart .peti')).toBeNull()
    // भाषा बदलो
    w.document.getElementById('btnLang').click()
    await new Promise((r) => setTimeout(r, 200))
    expect(par.querySelector('.petiT').textContent).toBe('Parivartan')
    expect(mid.querySelector('.petiT').textContent).toBe('Rahu-Ketu Midpoint')
  })

  it('ख़ाली हों तब भी शीर्षक और “—”, और परिवर्तन-पेटी का धड़कना बंद', async () => {
    const w = await boot(makeResult({ exchanges: [], mid: { points: [41.8, 221.8], members: [], effective: false } }))
    expect(w.document.getElementById('rParivartan').textContent).toBe('—')
    expect(w.document.getElementById('rMidV').textContent).toBe('—')
    expect(w.document.getElementById('rMidN').hidden).toBe(true)
    expect(w.document.getElementById('pPariv').className).not.toContain('on')
  })

  it('एक परिवर्तन → “बुध ⇄ गुरु” + धड़कता रंग; दो → दो पंक्तियाँ', async () => {
    let w = await boot(makeResult({ exchanges: [['mercury', 'jupiter']] }))
    expect(w.document.getElementById('rParivartan').textContent).toContain('⇄')
    expect(w.document.getElementById('pPariv').className).toContain('on')
    w = await boot(makeResult({ exchanges: [['mercury', 'jupiter'], ['mars', 'venus']] }))
    const v = w.document.getElementById('rParivartan')
    expect(v.querySelectorAll('br').length).toBe(1)      // दो पंक्तियाँ
    expect(v.textContent).toContain('⇄')
  })

  it('मध्य बिंदु: एक ग्रह → कोड; दो → “MAR . SAT” + “एक से अधिक — प्रभाव नहीं”', async () => {
    let w = await boot(makeResult({ mid: { points: [41.8, 221.8], members: [{ key: 'jupiter', gap: 0.3 }], effective: true } }))
    expect(w.document.getElementById('rMidV').textContent).toBe('JUP')
    expect(w.document.getElementById('rMidN').hidden).toBe(true)
    w = await boot(makeResult({ mid: { points: [141.25, 321.25], members: [{ key: 'mars', gap: 1.1 }, { key: 'saturn', gap: 1.4 }], effective: false } }))
    expect(w.document.getElementById('rMidV').textContent).toBe('MAR . SAT')
    const n = w.document.getElementById('rMidN')
    expect(n.hidden).toBe(false)
    expect(n.textContent).toContain('एक से अधिक')
  })

  it('पेटी पर वही hover-टिप (दोनों बिंदु राशि-डिग्री सहित)', async () => {
    const w = await boot(makeResult({ mid: { points: [141.25, 321.25], members: [{ key: 'mars', gap: 1.1 }], effective: true } }))
    const mid = w.document.getElementById('pMid')
    expect(mid.getAttribute('data-mb')).toBe('1')
    expect(mid.getAttribute('data-mbtip')).toContain('सिंह 21°15′')
    expect(mid.getAttribute('data-mbtip')).toContain('कुम्भ 21°15′')
  })
})
