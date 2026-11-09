// @vitest-environment jsdom
// tests/bnn-print.test.js — BNN print sheet (user request 2026-10-07).
import { describe, expect, it } from 'vitest'
import { buildPrintSheet } from '../src/bnn/print.js'

const cusp = (n, rashi, deg) => ({ n, rashi, degInSign: deg, longitude: rashi * 30 + deg })
const P = (key, rashi, deg, retro = false) => ({ key, rashi, degInSign: deg, longitude: rashi * 30 + deg, retro })
const BNN = {
  ascendant: { key: 'asc', rashi: 4, degInSign: 12.8835, retro: false },
  cusps: [
    cusp(1, 4, 12.8835), cusp(2, 5, 10.9), cusp(3, 6, 11.5167), cusp(4, 7, 12.8667),
    cusp(5, 8, 13.6), cusp(6, 9, 13.6333), cusp(7, 10, 12.8833), cusp(8, 11, 10.9),
    cusp(9, 0, 11.5167), cusp(10, 1, 12.8667), cusp(11, 2, 13.6), cusp(12, 3, 13.6333),
  ],
  planets: [
    P('sun', 9, 8.15), P('moon', 11, 12.5), P('mars', 4, 21.5, true),
    P('mercury', 9, 8.9833), P('jupiter', 4, 15.5, true), P('venus', 10, 14.3),
    P('saturn', 5, 3.2, true), P('rahu', 4, 7.1667, true), P('ketu', 10, 7.1667, true),
  ],
  tithiIndex: 6,
  yogaIndex: 20,
}
const maha = (lord, endISO) => ({ lord, startISO: '1980-01-22', endISO, age: { y: 5, m: 11, d: 1 } })
const VALUES = {
  name: 'Test Chart', gender: 'male', day: '22', month: '1', year: '1980',
  hour: '20', minute: '30', second: '0', place: 'Betul',
  bnn: BNN,
  bnnMeta: {
    name: 'Test Chart', placeText: 'Betul', dateTimeText: '22-01-1980 - 20:30:00', weekday: 'TUESDAY',
    ageText: 'AGE : 46Y-8M-15D MALE', nakText: 'UTTARA BHADRAPADA - 3',
    tithiText: 'SHUKLA - SHASHTHI', yogaText: 'SHIVA YOGA',
  },
  bnnDasha: {
    mahadashas: [
      maha('saturn', '1985-12-23'), maha('mercury', '2002-12-23'), maha('ketu', '2009-12-23'),
      { lord: 'venus', startISO: '2009-12-23', endISO: '2029-12-23', age: { y: 49, m: 11, d: 1 } },
      maha('sun', '2035-12-23'), maha('moon', '2045-12-23'), maha('mars', '2052-12-23'),
      maha('rahu', '2070-12-23'), maha('jupiter', '2086-12-23'),
    ],
    running: {
      mahaIndex: 3, bhukthiIndex: 0, andhiramIndex: 0,
      bhukthis: [{ lord: 'mercury', startISO: '2026-01-04', endISO: '2028-11-06', age: { y: 48, m: 9, d: 15 } }],
      andhirams: [
        { lord: 'mercury', startISO: '2026-01-04', endISO: '2026-05-30', age: { y: 46, m: 4, d: 8 } },
        { lord: 'ketu', startISO: '2026-05-30', endISO: '2026-07-29', age: { y: 46, m: 6, d: 7 } },
        { lord: 'venus', startISO: '2026-07-29', endISO: '2027-01-17', age: { y: 46, m: 11, d: 26 } },
      ],
    },
  },
  bnnMode: 'AP',
}

describe('BNN print sheet', () => {
  it('builds the header (Ganesh · Hari Om · mantra · contact · Saraswati)', () => {
    const sheet = buildPrintSheet(VALUES)
    expect(sheet.id).toBe('bnn-print')
    expect(sheet.textContent).toContain('हरि ॐ')
    expect(sheet.textContent).toContain('ॐ ऐं ह्रीं श्रीं क्लीं चामुण्डायै विच्चे नमः')
    expect(sheet.textContent).toContain('info@mybapuji.com')
    expect(sheet.textContent).toContain('mybapuji.com')
    const imgs = sheet.querySelectorAll('.bp-head img')
    expect(imgs.length).toBe(2)
    expect(imgs[0].getAttribute('src')).toContain('ganesh')
    expect(imgs[1].getAttribute('src')).toContain('saraswati')
  })

  it('holds the details, chart, tables and vimshottari sections', () => {
    const sheet = buildPrintSheet(VALUES)
    expect(sheet.textContent).toContain('BASIC DETAILS')
    expect(sheet.textContent).toContain('UTTARA BHADRAPADA - 3')
    expect(sheet.textContent).toContain('Leo') // lagna rashi name
    expect(sheet.querySelector('.bp-chart svg')).toBeTruthy()
    expect(sheet.textContent).toContain('AFTER PARIVARDHANAI (AP)')
    expect(sheet.textContent).toContain('PLANET COMBINATION (1-5-7-9) — AP')
    expect(sheet.textContent).toContain('SUN-97') // the guru catch, printed too
    expect(sheet.textContent).toContain('B01')
    expect(sheet.textContent).toContain('PLANET — SPECIAL')
    expect(sheet.textContent).toContain('LORDSHIP')
    expect(sheet.textContent).toContain('BHAVA — SPECIAL')
    // BHAVA first, then PLANET (user 2026-10-07c)
    expect(sheet.textContent.indexOf('BHAVA COMBINATION')).toBeLessThan(sheet.textContent.indexOf('PLANET COMBINATION'))
    // colorful combo cells like the web page
    expect(sheet.querySelectorAll('td.ent-blue').length).toBeGreaterThan(0)
    expect(sheet.querySelectorAll('td.ent-green').length).toBeGreaterThan(0)
    // the parivartana box rides inside the printed chart
    expect(sheet.textContent).toContain('MERCURY<>SATURN')
    expect(sheet.textContent).toContain('PRSSS')
    expect(sheet.textContent).toContain('BRSSS')
    expect(sheet.textContent).toContain('DHASA')
    expect(sheet.textContent).toContain('23-12-1985')
    expect(sheet.textContent).toContain('ANDHIRAM')
    // footer on the sheet
    expect(sheet.textContent).toContain('निःशुल्क ज्योतिष साधन')
  })
})

// ---------------------------------------------------------------------------
// राउंड 66 / टास्क 10-ख — ऐप के print sheet में 3-11 तालिका + मध्य-बिंदु की पेटी।
// यहाँ असली app/app.js को jsdom में चलाया गया है (इंजन की जगह तैयार RESULT),
// क्योंकि print sheet ऐप के अंदर बनता है (buildPrintSheet), website के print.js में नहीं।
// ---------------------------------------------------------------------------
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP_DIR, 'app.js'))
const SH = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' }
const ORDER = ['jupiter', 'sun', 'moon', 'mars', 'mercury', 'venus', 'saturn', 'rahu', 'ketu']
const SIGNS = ['मेष', 'वृष', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन']

// एक तैयार RESULT — print के लिए जितना चाहिए उतना (कुंडली 10 जैसा)
function makeResult(opts = {}) {
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
    exchanges: [],
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
  w.BNN_PLACES = []; w.alert = () => {}; w.confirm = () => true
  w.print = () => {}
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
  // कुंडली खोलो → नतीजा → प्रिंट शीट
  w.document.getElementById('btnFolder').click()
  await new Promise((r) => setTimeout(r, 40))
  w.document.querySelector('#openModal tr[data-id] td:nth-child(3)').click()
  await new Promise((r) => setTimeout(r, 650))          // तारीख़/समय का ढाँचा पूरा बैठने दो
  // यूज़र की तरह खाने से बाहर क्लिक — तभी अधूरा ढाँचा पक्का मान बनता है (राउंड 65 / 09-घ)
  ;['fDate', 'fTime'].forEach((id) => w.document.getElementById(id).dispatchEvent(new w.Event('blur', { bubbles: true })))
  await new Promise((r) => setTimeout(r, 150))
  w.document.getElementById('btnShow').click()
  await new Promise((r) => setTimeout(r, 200))
  // नाम/जन्म-विवरण बदला दिखे तो ऐप पूछता है — "नई कुंडली सहेजें" दबाओ (जैसे यूज़र करता है)
  const ow = w.document.getElementById('owNew')
  if (ow) ow.click()
  await new Promise((r) => setTimeout(r, 400))
  return w
}
const printSheet = (w) => {
  w.document.getElementById('btnRPrint').click()
  return w.document.getElementById('printSheet')
}

describe.skipIf(!hasApp)('ऐप का print sheet — 3-11 + मध्य बिंदु पेटी (राउंड 66 / टास्क 10-ख)', () => {
  it('पेज 6 ही रहते हैं और 3-11 block PLANET 1579 के नीचे उसी पेज पर है', async () => {
    const w = await boot(makeResult())
    const sheet = printSheet(w)
    const pages = sheet.querySelectorAll('.pPage')
    expect(pages.length).toBe(6)
    const blocks = Array.from(sheet.querySelectorAll('.pBlock'))
    const p311 = sheet.querySelector('.p311')
    expect(p311).toBeTruthy()
    const page311 = Array.from(pages).indexOf(p311.closest('.pPage'))
    expect(page311).toBe(1)                                  // पेज 2
    // PLANET 1579 block और 3-11 एक ही पेज पर, 3-11 उसके बाद
    const planet1579 = blocks[blocks.indexOf(p311) - 1]
    expect(Array.from(pages).indexOf(planet1579.closest('.pPage'))).toBe(1)
    expect(blocks.indexOf(planet1579)).toBeLessThan(blocks.indexOf(p311))
    // शीर्षक + 9 पंक्तियाँ (राहु/केतु ख़ाली)
    expect(p311.textContent).toContain('3-11')
    expect(p311.textContent).toContain('NATAL')
    expect(p311.querySelectorAll('tr').length).toBe(9)
    const rows = p311.querySelectorAll('tr')
    expect(rows[0].textContent).toContain('JUP')
    expect(rows[0].textContent).toContain('SAT')
    expect(rows[7].textContent.replace(/\s/g, '')).toBe('RAH-11')
    expect(rows[8].textContent.replace(/\s/g, '')).toBe('KET-11')
    // कम से कम 3 खाने
    expect(rows[0].querySelectorAll('td').length).toBe(1 + 3)
    // कोई प्रतिशत नहीं
    expect(p311.textContent).not.toMatch(/\d+ · /)
  })

  it('पेटी — एक ग्रह: कोड + शीर्षक + दोनों बिंदु', async () => {
    const w = await boot(makeResult({ mid: { points: [115.5, 295.5], members: [{ key: 'jupiter', gap: 0.3 }], effective: true } }))
    const sheet = printSheet(w)
    const band = sheet.querySelector('.pMid')
    expect(band).toBeTruthy()
    const txt = band.textContent
    expect(txt).toContain('JUP')
    expect(txt).toContain('राहु-केतु मध्य बिंदु')
    expect(txt).toContain('कर्क 25°30′')      // 115.5° = कर्क 25°30′
    expect(txt).toContain('मकर 25°30′')
    expect(txt).not.toContain('एक से अधिक')
  })

  it('पेटी — दो ग्रह: "MAR . SAT" + "एक से अधिक — प्रभाव नहीं"', async () => {
    const w = await boot(makeResult({ mid: { points: [141.25, 321.25], members: [{ key: 'mars', gap: 1.1 }, { key: 'saturn', gap: 1.4 }], effective: false } }))
    const sheet = printSheet(w)
    const txt = sheet.querySelector('.pMid').textContent
    expect(txt).toContain('MAR . SAT')
    expect(txt).toContain('एक से अधिक — प्रभाव नहीं')
    expect(txt).toContain('सिंह 21°15′')
    expect(txt).toContain('कुम्भ 21°15′')
  })

  it('पेटी — कोई नहीं: ख़ाली पेटी, पर शीर्षक व दोनों बिंदु रहते हैं', async () => {
    const w = await boot(makeResult({ mid: { points: [41.8, 221.8], members: [], effective: false } }))
    const sheet = printSheet(w)
    const band = sheet.querySelector('.pMid')
    expect(band).toBeTruthy()
    const lines = Array.from(band.children).map((d) => d.textContent)
    expect(lines.length).toBe(2)                       // कोड-पंक्ति ही नहीं (ख़ाली पेटी)
    expect(lines[0]).toContain('राहु-केतु मध्य बिंदु')
    expect(lines[1]).toContain('वृष 11°48′')
    expect(lines.join(' ')).not.toContain('एक से अधिक')
  })

  it('गोचर मोड में भी print में NATAL की 3-11 और पेटी', async () => {
    const w = await boot(makeResult())
    w.document.getElementById('btnTransitMode').click()
    await new Promise((r) => setTimeout(r, 300))
    const sheet = printSheet(w)
    expect(sheet.querySelectorAll('.pPage').length).toBe(6)
    expect(sheet.querySelector('.p311').textContent).toContain('NATAL')
    expect(sheet.querySelector('.p311').textContent).toContain('SAT')
    expect(sheet.querySelector('.pMid').textContent).toContain('JUP')
  })
})
