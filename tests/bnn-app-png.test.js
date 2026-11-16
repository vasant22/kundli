// tests/bnn-app-png.test.js — 1.0.4 / टास्क 04 (16-11-2026)
//
// “All Charts (PNG)” का ढाँचा: चार्ट में गोचर-ग्रह नहीं, 3-11 तालिका नहीं, और
// लेबल-खाना सबसे चौड़े लेबल + 16px (ताकि “JUP#-20” पहले सदस्य से न टकराए)।
// canvas jsdom में नहीं बनता, इसलिए जाँच उन helpers पर है जिनसे PNG बनता है।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(__dirname, '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP_DIR, 'app.js'))

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
  bhava['1'].list159 = [{ type: 'planet', key: 'mercury', percent: 97, natalRetro: true }]
  planet.jupiter.list1579 = [{ type: 'planet', key: 'venus', percent: 95 }]
  planet.mars.list1579 = [{ type: 'planet', key: 'jupiter', percent: 78 }]
  return {
    utc: '1980-01-22T15:00:00Z', offsetText: '+05:30', exchanges: [{ 0: 'mercury', 1: 'saturn' }],
    bnn: { ascendant: { key: 'asc', rashi: 4, degInSign: 12.88, retro: false }, planets, cusps, tithiIndex: 6, yogaIndex: 20 },
    tables: { bhava: { AP: bhava, BP: bhava }, planet: { AP: planet, BP: planet }, special: { AP: {}, BP: {} }, r311: { AP: {}, BP: {} } },
    astro: { AP: {}, BP: {} }, prsss: {}, brsss: {}, labels: { AP: { jupiter: 90, mars: 98, saturn: 45 }, BP: {} },
    order: ORDER, dasha: { running: {}, mahadashas: [] }, midpoint: { AP: { points: [111, 291], members: [] }, BP: { points: [111, 291], members: [] } },
  }
}

async function boot(res) {
  const html = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8')
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
  const w = dom.window
  w.alert = () => {}; w.confirm = () => true; w.print = () => {}
  w.BNNEngine = {
    compute: async () => JSON.parse(JSON.stringify(res)),
    transitNow: async () => ({ snapshot: { planets: [], ascendant: { rashi: 0, degInSign: 0 } }, wall: { y: 2026, m: 11, d: 9, h: 12, mi: 0, s: 0 }, offsetText: '+05:30' }),
    specialTransit: async () => [],
  }
  w.localStorage.setItem('bnn_kundli_v1', JSON.stringify({
    nextRef: 11, groups: ['जाँच'],
    records: [{ id: 10001, ref: 10, name: 'कुंडली 10', group: 'जाँच', gender: 'पुरुष', mobile: '', date: '20-05-1965', time: '02:52', country: 'भारत', countryEN: 'India', state: 'राजस्थान', stateEN: 'Rajasthan', place: 'जयपुर', placeEN: 'Jaipur', lat: 26.9124, lon: 75.7873, gmt: 5.5, gmtText: '+05:30', dst: 0 }],
  }))
  for (const f of ['tz.js', 'geo.js', 'places.js']) {
    const fp = path.join(APP_DIR, f)
    if (fs.existsSync(fp)) w.eval(fs.readFileSync(fp, 'utf8'))
  }
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

describe.skipIf(!hasApp)('All Charts PNG का ढाँचा (1.0.4 / टास्क 04)', () => {
  it('लेबल-खाना = सबसे चौड़ा लेबल + 16px (दोनों तालिकाओं के लिए एक ही)', async () => {
    const w = await boot(makeResult())
    // नक़ली नाप: हर अक्षर 12px (असली canvas से अलग, पर तुलना के लिए काफ़ी)
    const measure = (t) => String(t).length * 12
    const plan = w.BNN_pngLabelPlan(measure)
    const widest = 'MAR#-98'
    expect(plan.widest).toBe(widest)
    expect(plan.widestW).toBe(measure(widest))
    expect(plan.labW).toBe(measure(widest) + 16)      // सबसे चौड़ा + 16, कम नहीं
    expect(plan.labW).toBeGreaterThan(measure('B12') + 16)
    w.close()
  })

  it('PNG के चार्ट में गोचर-ग्रह नहीं — स्क्रीन/print वाले चार्ट में हैं (उत्तर + दक्षिण)', async () => {
    const w = await boot(makeResult())
    const northNo = w.BNN_svgStr.north(null, { noTransit: true })
    const northYes = w.BNN_svgStr.north(null)
    expect(northNo).not.toContain('data-tr="1"')
    expect(northYes).toContain('data-tr="1"')
    expect(northNo.length).toBeLessThan(northYes.length)
    const southNo = w.BNN_svgStr.south(null, { noTransit: true })
    const southYes = w.BNN_svgStr.south(null)
    expect(southNo).not.toContain('data-tr="1"')
    expect(southYes).toContain('data-tr="1"')
    // चार्ट का बाक़ी सब वैसा ही (घर, ग्रह, पेटी-चिह्न)
    expect(northNo).toContain('class="house"')
    w.close()
  })

  it('PNG के कोड में 3-11 तालिका और गोचर-पंक्ति नहीं (स्क्रीन व print में बनी रहती है)', () => {
    const src = fs.readFileSync(path.join(APP_DIR, 'app.js'), 'utf8')
    const a = src.indexOf('async function exportAllChartPng')
    const b = src.indexOf('// ---------- भरने की सुविधाएँ + सेटिंग्स', a)
    const body = src.slice(a, b)
    expect(a).toBeGreaterThan(0)
    expect(b).toBeGreaterThan(a)
    // (टिप्पणी में “3-11” लिखा जा सकता है — इसलिए सिर्फ़ तालिका का शीर्षक/कोड देखते हैं)
    expect(body).not.toContain('PLANET COMBINATION — NATAL — 3-11')
    expect(body).not.toContain('tg3')           // 3-11 का डेटा भी नहीं उठाया जाता
    expect(body).not.toContain('transitWall')   // “गोचर / Transit” पंक्ति नहीं
    expect(body).toContain('noTransit: true')   // चार्ट गोचर-रहित
    expect(body).toContain('W = 2000')          // कैनवास चौड़ा
    expect(body).toContain('CH = 900')          // चार्ट बड़ा
    expect(body).toContain('pngLabelPlan')      // लेबल-खाना नापकर
    // और 3-11 स्क्रीन/print में मौजूद रहे (सिर्फ़ PNG से हटी)
    expect(src).toContain('printPlanetBlock311')       // print/PDF में 3-11 ब्लॉक
    expect(src).toContain("RPLANET_TAB === 'r311'")    // स्क्रीन का 3-11 tab
  })
})
