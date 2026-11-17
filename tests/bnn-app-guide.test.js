// @vitest-environment jsdom
// tests/bnn-app-guide.test.js — 1.0.5 / बटन गाइड (Claude, 17-11-2026)
//
// (1) गाइड का हर कदम असली बटन/खाने पर टिका है (index.html में मौजूद);
// (2) ज़रूरी बटन कोई छूटा नहीं; (3) नमूना कुंडली कभी सहेजी नहीं जाती, Ref नहीं बढ़ता,
// गाइड बंद होते ही हटती है; (4) खुली असली कुंडली को गाइड नहीं छेड़ती;
// (5) सहायता में “🧭 बटन गाइड” — सूची + शुरू करने के बटन; (6) → ← Esc; (7) भाषा।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(__dirname, '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP_DIR, 'guide.js'))

const pos = (rashi, deg) => rashi * 30 + deg
const P = (key, rashi, deg, retro = false) => ({ key, rashi, degInSign: deg, longitude: pos(rashi, deg), retro, nakshatra: 5, pada: 2 })
const ORDER = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']
function makeResult() {
  const planets = [P('sun', 1, 5.17), P('moon', 11, 24.33), P('mars', 4, 20.1, true), P('mercury', 10, 12.4, true),
    P('jupiter', 0, 1.0), P('venus', 10, 29.05, true), P('saturn', 2, 22.36, true), P('rahu', 8, 21.15, true), P('ketu', 2, 21.15, true)]
  const cusps = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, rashi: (11 + i) % 12, degInSign: 10 + i, longitude: pos((11 + i) % 12, 10 + i) }))
  const row = () => ({ list159: [], list1579: [] })
  const bhava = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String(i + 1), row()]))
  const planet = Object.fromEntries(ORDER.map((k) => [k, row()]))
  return {
    utc: '1990-08-15T05:00:00Z', offsetText: '+05:30', exchanges: [],
    bnn: { ascendant: { key: 'asc', rashi: 4, degInSign: 12.88, retro: false }, planets, cusps, tithiIndex: 6, yogaIndex: 20 },
    tables: { bhava: { AP: bhava, BP: bhava }, planet: { AP: planet, BP: planet }, special: { AP: {}, BP: {} }, r311: { AP: {}, BP: {} } },
    astro: { AP: {}, BP: {} }, prsss: {}, brsss: {}, labels: { AP: {}, BP: {} },
    order: ORDER, dasha: { running: {}, mahadashas: [] }, midpoint: { AP: { points: [111, 291], members: [] }, BP: { points: [111, 291], members: [] } },
  }
}

const SAVED = {
  nextRef: 11, groups: ['जाँच'],
  records: [{ id: 10001, ref: 10, name: 'कुंडली 10', group: 'जाँच', gender: 'पुरुष', mobile: '', date: '20-05-1965', time: '02:52:00', country: 'भारत', countryEN: 'India', state: 'राजस्थान', stateEN: 'Rajasthan', place: 'जयपुर', placeEN: 'Jaipur', lat: 26.9196, lon: 75.7878, gmt: 5.5, gmtText: '+05:30', dst: 0 }],
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms))

async function boot(opts = {}) {
  const html = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8')
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true })
  const w = dom.window
  w.alert = () => {}; w.confirm = () => true; w.print = () => {}
  w.fetch = async () => ({ ok: false, json: async () => null })
  const calls = []
  w.BNNEngine = {
    compute: async (rec) => { calls.push(rec); return JSON.parse(JSON.stringify(makeResult())) },
    transitNow: async () => ({ snapshot: { planets: [], ascendant: { rashi: 0, degInSign: 0 } }, wall: { y: 2026, m: 11, d: 17, h: 12, mi: 0, s: 0 }, offsetText: '+05:30' }),
    specialTransit: async () => [],
  }
  // jsdom में layout नहीं — दिखती हर चीज़ को एक नाप दो (छिपी चीज़ें [hidden] से छँटती हैं)
  w.Element.prototype.getBoundingClientRect = function () { return { left: 40, top: 60, right: 200, bottom: 92, width: 160, height: 32, x: 40, y: 60 } }
  w.Element.prototype.scrollIntoView = function () {}
  w.localStorage.setItem('bnn_kundli_v1', JSON.stringify(SAVED))
  if (opts.lang) w.localStorage.setItem('bnn_lang_v1', opts.lang)
  for (const f of ['tz.js', 'geo.js', 'places.js', 'version.js', 'help.js', 'guide.js']) {
    const fp = path.join(APP_DIR, f)
    if (fs.existsSync(fp)) w.eval(fs.readFileSync(fp, 'utf8'))
  }
  w.eval(fs.readFileSync(path.join(APP_DIR, 'app.js'), 'utf8'))
  await tick(40)
  if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  await tick(80)
  return { w, calls }
}
const stored = (w) => JSON.parse(w.localStorage.getItem('bnn_kundli_v1'))

describe.skipIf(!hasApp)('बटन गाइड (1.0.5)', () => {
  it('हर कदम index.html के असली बटन/खाने पर टिका है', async () => {
    const { w } = await boot()
    const S = w.BNNGuide.steps
    expect(S.form.length).toBeGreaterThanOrEqual(25)
    expect(S.result.length).toBeGreaterThanOrEqual(15)
    for (const k of ['form', 'result']) {
      for (const st of S[k]) {
        const ok = st.s.split(',').some((q) => w.document.querySelector(q.trim()))
        expect(ok, k + ' → ' + st.s).toBe(true)
        expect(st.hi.length).toBe(3); expect(st.en.length).toBe(3)
        for (const x of st.hi.concat(st.en)) expect(String(x).trim().length).toBeGreaterThan(1)
      }
    }
  })

  it('कोई ज़रूरी बटन छूटा नहीं', async () => {
    const { w } = await boot()
    const all = w.BNNGuide.steps.form.concat(w.BNNGuide.steps.result).map((s) => s.s).join(' ')
    for (const id of ['btnPng', 'btnPrint', 'btnPdf', 'btnHelp', 'btnLang', 'btnSettings', 'btnBrowse', 'btnDelList', 'btnBackup', 'btnRestore',
      'fName', 'fGroup', 'fDate', 'fTime', 'fCountryTxt', 'fState', 'fPlace', 'fLat', 'fGmt', 'btnNew', 'btnSave', 'btnDelete', 'btnShow',
      'btnBack', 'btnRPrint', 'pPariv', 'pMid', 'rChart', 'gocharTime', 'btnGocharNow', 'btnTransitMode', 'rStGroups', 'rStBirth', 'rStMode',
      'rBhavaTabs', 'rPlanetTabs', 'rDashaTabs']) expect(all, id).toContain('#' + id)
    expect(all).toContain('.chartctrl')
  })

  it('नमूना कुंडली: खुलती है, सहेजी नहीं जाती, Ref नहीं बढ़ता, बंद होते ही हटती है', async () => {
    const { w, calls } = await boot()
    const before = w.localStorage.getItem('bnn_kundli_v1')
    expect(w.BNNApp.hasResult()).toBe(false)
    const ok = await w.BNNGuide.start('result')
    await tick(80)
    expect(ok).toBe(true)
    expect(calls.length).toBe(1)
    expect(calls[0].guideDemo).toBe(true)
    expect(w.document.getElementById('viewResult').hidden).toBe(false)
    const s = w.BNNGuide.state()
    expect(s.demo).toBe(true); expect(s.screen).toBe('result'); expect(s.n).toBeGreaterThanOrEqual(15)
    expect(w.document.getElementById('gdWrap').hidden).toBe(false)
    expect(w.document.getElementById('gdCard').textContent).toContain('नमूना')
    w.BNNGuide.stop()
    expect(w.BNNGuide.isOpen()).toBe(false)
    expect(w.document.getElementById('gdWrap').hidden).toBe(true)
    expect(w.BNNApp.hasResult()).toBe(false)
    expect(w.document.getElementById('viewResult').hidden).toBe(true)
    expect(w.localStorage.getItem('bnn_kundli_v1')).toBe(before)
    expect(stored(w).records.length).toBe(1)
    expect(stored(w).nextRef).toBe(11)
    expect(w.document.getElementById('fRef').value).toBe('11')
  })

  it('खुली असली कुंडली पर गाइड नमूना नहीं खोलती और बंद होने पर कुंडली वैसी ही रहती है', async () => {
    const { w, calls } = await boot()
    w.document.getElementById('btnFolder').click(); await tick(40)
    w.document.querySelector('#openModal tr[data-id] td:nth-child(3)').click(); await tick(650)
    ;['fDate', 'fTime'].forEach((id) => w.document.getElementById(id).dispatchEvent(new w.Event('blur', { bubbles: true })))
    await tick(150)
    w.document.getElementById('btnShow').click(); await tick(200)
    const ow = w.document.getElementById('owNew'); if (ow) ow.click()
    await tick(400)
    expect(w.BNNApp.hasResult()).toBe(true)
    const n = calls.length
    await w.BNNGuide.start('result')
    expect(calls.length).toBe(n)
    expect(w.BNNGuide.state().demo).toBe(false)
    w.BNNGuide.stop()
    expect(w.BNNApp.hasResult()).toBe(true)
    expect(w.document.getElementById('viewResult').hidden).toBe(false)
  })

  it('→ ← Esc और अगला/पिछला', async () => {
    const { w } = await boot()
    await w.BNNGuide.start('form')
    expect(w.BNNGuide.state().i).toBe(0)
    expect(w.document.getElementById('gdPrev').disabled).toBe(true)
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(w.BNNGuide.state().i).toBe(1)
    w.document.getElementById('gdNext').click()
    expect(w.BNNGuide.state().i).toBe(2)
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(w.BNNGuide.state().i).toBe(1)
    expect(w.document.getElementById('gdNum').textContent).toMatch(/^2 \/ \d+$/)
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(w.BNNGuide.isOpen()).toBe(false)
    // आख़िरी कदम पर “पूरा ✓” → बंद
    await w.BNNGuide.start('form')
    const n = w.BNNGuide.state().n
    for (let i = 1; i < n; i++) w.BNNGuide.next()
    expect(w.document.getElementById('gdNext').textContent).toContain('पूरा')
    w.document.getElementById('gdNext').click()
    expect(w.BNNGuide.isOpen()).toBe(false)
  })

  it('सहायता: दूसरा विषय “🧭 बटन गाइड” — पूरी सूची और शुरू करने के बटन', async () => {
    const { w } = await boot()
    w.document.getElementById('btnHelp').click(); await tick(60)
    const topics = w.document.querySelectorAll('#helpList .helpTopic')
    expect(topics[0].textContent).toContain('इस संस्करण में नया')
    expect(topics[1].textContent).toContain('बटन गाइड')
    topics[1].click(); await tick(30)
    const pane = w.document.getElementById('helpPane')
    const rows = pane.querySelectorAll('.gdTbl tbody tr').length
    expect(rows).toBe(w.BNNGuide.steps.form.length + w.BNNGuide.steps.result.length)
    expect(pane.querySelector('#gdStartForm')).toBeTruthy()
    pane.querySelector('#gdStartForm').click(); await tick(30)
    expect(w.document.getElementById('helpModal').hidden).toBe(true)
    expect(w.BNNGuide.isOpen()).toBe(true)
    expect(w.BNNGuide.state().screen).toBe('form')
    w.BNNGuide.stop()
  })

  it('English में गाइड English में', async () => {
    const { w } = await boot({ lang: 'en' })
    await w.BNNGuide.start('form')
    const card = w.document.getElementById('gdCard').textContent
    expect(card).toContain('Next')
    expect(card).toContain(w.BNNGuide.steps.form[0].en[0])
    w.BNNGuide.stop()
  })
})
