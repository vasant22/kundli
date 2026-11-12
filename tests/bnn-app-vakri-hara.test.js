// @vitest-environment jsdom
// tests/bnn-app-vakri-hara.test.js — Claude, 12-11-2026 (पाठ 24 सूत्र 6; Vas22 के कहने पर, AutoClaw की जगह)
// PLANET तालिका: वक्री मंगल/बुध/गुरु/शुक्र सदस्य 20% से कम (0% तक) हो तब भी हरा (ceg); पहला सदा नीला;
// शनि पहले जैसा सदा हरा; राहु-केतु और दृष्टि-बिंदु पर नियम नहीं; AP में कुर्सी की चाल; BHAVA तालिका अपरिवर्तित।
// sir के software से प्रमाण: ex, 16-07-1996 19:00 Nagpur — VEN = MAR·70, JUP#·15 (हरा); RAH = MAR4·39, JUP#·0 (हरा)।
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

const PE = (key, percent, natalRetro = false) => ({ type: 'planet', key, zone: 1, distance: 1, percent, natalRetro })
const AE = (label, percent) => ({ type: 'aspect', label, from: label.startsWith('MAR') ? 'mars' : 'saturn', distance: 1, percent })
function withRows(res, rows, bhava1) {
  for (const m of ['AP', 'BP']) {
    for (const [k, list] of Object.entries(rows)) res.tables.planet[m][k] = { list1579: list, list159: list }
    if (bhava1) res.tables.bhava[m]['1'] = { list1579: bhava1, list159: bhava1 }
  }
  return res
}
// makeResult में बुध (कुंभ) और शुक्र (कुंभ) वक्री हैं; गुरु, मंगल मार्गी
const cellsOf = (w, sel, k) => [...w.document.querySelectorAll(sel + ' tr')].find((tr) => tr.querySelector('.rlab[data-pl="' + k + '"]'))
const cls = (td) => (td.className.match(/ce[bgo]/) || [''])[0]

describe.skipIf(!hasApp)('वक्री सदस्य सदा हरा (पाठ 24 सूत्र 6)', () => {
  it('20% से कम वक्री शुक्र/बुध हरा, मार्गी मंगल नारंगी, पहला नीला', async () => {
    const res = withRows(makeResult(), {
      jupiter: [PE('sun', 80), PE('venus', 15, true), PE('mars', 12)],
      rahu: [AE('MAR4', 39), PE('mercury', 0, true)],
    })
    const w = await boot(res)
    const j = [...cellsOf(w, '#rPlanet', 'jupiter').querySelectorAll('td.entc')]
    expect(cls(j[0])).toBe('ceb'); expect(cls(j[1])).toBe('ceg'); expect(cls(j[2])).toBe('ceo')
    const r = [...cellsOf(w, '#rPlanet', 'rahu').querySelectorAll('td.entc')]
    expect(cls(r[0])).toBe('ceb'); expect(cls(r[1])).toBe('ceg')
  })

  it('शनि पहले जैसा हरा; दृष्टि-बिंदु और राहु-केतु पर नियम नहीं', async () => {
    const res = withRows(makeResult(), { sun: [PE('moon', 80), PE('saturn', 5), AE('SAT3', 12), PE('rahu', 10, true), PE('ketu', 8, true)] })
    const w = await boot(res)
    const s = [...cellsOf(w, '#rPlanet', 'sun').querySelectorAll('td.entc')]
    expect(cls(s[1])).toBe('ceg'); expect(cls(s[2])).toBe('ceo'); expect(cls(s[3])).toBe('ceo'); expect(cls(s[4])).toBe('ceo')
  })

  it('AP में कुर्सी की चाल: वक्री बुध मार्गी गुरु से परिवर्तन में हो, तो AP में नारंगी', async () => {
    const res = withRows(makeResult({ exchanges: [['mercury', 'jupiter']] }), { sun: [PE('moon', 80), PE('mercury', 10, true)] })
    const w = await boot(res)
    const s = [...cellsOf(w, '#rPlanet', 'sun').querySelectorAll('td.entc')]
    expect(cls(s[1])).toBe('ceo')
  })

  it('BHAVA तालिका अपरिवर्तित: वक्री शुक्र 5% वहाँ नारंगी ही', async () => {
    const res = withRows(makeResult(), {}, [PE('sun', 90), PE('venus', 5, true)])
    const w = await boot(res)
    const tr = [...w.document.querySelectorAll('#rBhava tr')].find((t) => t.querySelector('.rlab[data-lord="1"]'))
    const b = [...tr.querySelectorAll('td.entc')]
    expect(cls(b[0])).toBe('ceb'); expect(cls(b[1])).toBe('ceo')
  })
})
