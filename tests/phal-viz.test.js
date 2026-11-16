// @vitest-environment jsdom
// tests/phal-viz.test.js — चित्र (viz.js) और design की पक्की बातें (टास्क 05)
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { buildPhalData } from '../src/phal/index.js'
import { renderReport, renderOnline } from '../src/phal/report.js'
import { chartLayout, northChart, southChart, southLayout, dashaTimeline, savBars, bavHeatmap, vimshopakaBars, HOUSE_POLYS, RASHI_NUM_AT, GRAHA_AB, sadesatiChart } from '../src/phal/viz.js'
import { CHARTS as CALIB_CHARTS } from '../scripts/phal-calib/phal-charts.mjs'

let swe, data
beforeAll(async () => {
  swe = await initEphemeris()
  data = buildPhalData(swe, {
    utc: { year: 1985, month: 8, day: 15, hour: 2, minute: 0, second: 0 },
    latitude: 19.0728, longitude: 72.8826,
    local: { year: 1985, month: 8, day: 15, hour: 7, minute: 30, second: 0 },
    timeZone: 'Asia/Kolkata', name: 'जातक', gender: 'male', place: 'Mumbai',
  }, { nowMs: Date.UTC(2026, 11, 14) })
}, 30000)

const planetsForChart = (d) => d.planets.map((p) => ({ key: p.key, ab: GRAHA_AB[p.key], rashi: p.rashi, retro: p.retro }))

// बिंदु से रेखा-खंड की लंबवत दूरी (टास्क 05-ग §3)
function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// दक्षिण चार्ट की कोशिका (4×4, मीन से शुरू)
const SOUTH_CELLS = [11, 0, 1, 2, 10, -1, -1, 3, 9, -1, -1, 4, 8, 7, 6, 5]
function SOUTH_CELL_OF(rashi, S) {
  const i = SOUTH_CELLS.indexOf(rashi)
  const c = S / 4
  const x = (i % 4) * c, y = Math.floor(i / 4) * c
  return [[x, y], [x + c, y], [x + c, y + c], [x, y + c]]
}

function pointInPoly(x, y, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside
  }
  return inside
}

describe('northChart — kit वाला geometry', () => {
  it('1985: सू/चं/मं/बु बारहवें में, श/के तीसरे में', () => {
    const list = chartLayout({ size: 300, lagnaRashi: data.summary.lagnaRashi, planets: planetsForChart(data) })
    const house = Object.fromEntries(list.map((b) => [b.key, b.house]))
    expect(house.sun).toBe(12)
    expect(house.moon).toBe(12)
    expect(house.mars).toBe(12)
    expect(house.mercury).toBe(12)
    expect(house.saturn).toBe(3)
    expect(house.ketu).toBe(3)
    expect(house.jupiter).toBe(6)
    expect(house.venus).toBe(11)
  })

  it('हर badge अपने भाव के अंदर है, और राशि-अंक से नहीं टकराता', () => {
    const S = 300
    const polys = HOUSE_POLYS(S)
    const list = chartLayout({ size: S, lagnaRashi: data.summary.lagnaRashi, planets: planetsForChart(data) })
    // राशि-अंक की जगह — report.js के northChart जैसी (viz के RASHI_NUM_AT से)
    const nums = RASHI_NUM_AT(S)
    for (const b of list) {
      expect(pointInPoly(b.x, b.y, polys[b.house]), `${b.key} in house ${b.house}`).toBe(true)
      const [nx, ny] = nums[b.house]
      const dist = Math.hypot(b.x - nx, b.y - ny)
      expect(dist, `${b.key} vs rashi-अंक`).toBeGreaterThan(b.r * 1.1)
    }
  })

  it('dark और light दोनों बनते हैं; अंश सिर्फ़ light में', () => {
    const p = data.planets.map((x) => ({ key: x.key, ab: GRAHA_AB[x.key], rashi: x.rashi, retro: x.retro, degStr: '12° 34′' }))
    const light = northChart({ size: 300, lagnaRashi: data.summary.lagnaRashi, planets: p })
    const dark = northChart({ size: 300, lagnaRashi: data.summary.lagnaRashi, planets: p, theme: 'dark' })
    expect(light.outerHTML).toContain('12° 34′')
    expect(dark.outerHTML).not.toContain('12° 34′')
    expect(dark.outerHTML).toContain('#E9B949') // सुनहरी रेखाएँ
  })
})

describe('दशा-पट्टी, अष्टकवर्ग के ग्राफ़', () => {
  it('पट्टी की चौड़ाई समय के अनुपात में', () => {
    const from = Date.UTC(2000, 0, 1)
    const to = Date.UTC(2010, 0, 1)
    const rows = [
      { key: 'sa', hi: 'शनि', ab: 'श', fromMs: from, toMs: Date.UTC(2005, 0, 1) },
      { key: 've', hi: 'शुक्र', ab: 'शु', fromMs: Date.UTC(2005, 0, 1), toMs: to },
    ]
    const svg = dashaTimeline(rows, { fromMs: from, toMs: to, nowMs: Date.UTC(2003, 0, 1) })
    const rects = [...svg.querySelectorAll('rect')]
    expect(rects).toHaveLength(2)
    const w1 = +rects[0].getAttribute('width')
    const w2 = +rects[1].getAttribute('width')
    expect(Math.abs(w1 - w2)).toBeLessThan(1)
    // "आप यहाँ हैं" रेखा 30% पर
    const line = svg.querySelector('line')
    expect(Math.abs(+line.getAttribute('x1') - 178 * 0.3)).toBeLessThan(1)
  })

  it('SAV की छड़ों की ऊँचाई बिंदुओं के अनुपात में', () => {
    const svg = savBars([12, 24, 36, 20, 20, 20, 20, 20, 20, 20, 20, 20], { lagnaRashi: 4 })
    const rects = [...svg.querySelectorAll('rect')]
    const h = rects.map((r) => +r.getAttribute('height'))
    expect(h[1] / h[0]).toBeCloseTo(2, 1)
    expect(h[2] / h[0]).toBeCloseTo(3, 1)
    // हर भाव के नीचे राशि-चित्र
    expect(svg.getElementsByTagName('image')).toHaveLength(12)
  })

  it('BAV heatmap: 0 सबसे हल्का, 8 सबसे गहरा', () => {
    const svg = bavHeatmap([{ key: 'su', hi: 'सूर्य', values: [0, 4, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0] }])
    const rects = [...svg.querySelectorAll('rect')]
    const op = rects.map((r) => +r.getAttribute('fill-opacity'))
    expect(op[0]).toBeCloseTo(0.08, 2)
    expect(op[2]).toBeCloseTo(0.93, 2)
    expect(op[1]).toBeGreaterThan(op[0])
    expect(op[1]).toBeLessThan(op[2])
  })

  it('विंशोपक पट्टियाँ 20 के पैमाने पर', () => {
    const svg = vimshopakaBars([{ key: 'sa', hi: 'शनि', value: 16.85 }, { key: 'ju', hi: 'गुरु', value: 10 }])
    const rects = [...svg.querySelectorAll('rect')].filter((r) => r.getAttribute('rx') === '2.2' && r.getAttribute('fill') !== '#F2F0F7')
    const w = rects.map((r) => +r.getAttribute('width'))
    expect(w[0] / w[1]).toBeCloseTo(16.85 / 10, 1)
  })
})

describe('design की पक्की बातें', () => {
  it('कहीं Western चिह्न (U+2609–2653) नहीं', () => {
    const html = renderReport(data) + renderOnline(data)
    const found = html.match(/[\u2609-\u2653]/g) ?? []
    expect(found).toEqual([])
  })

  it('राशि-चित्र: 12 files, हर img पर alt="" और width/height', () => {
    for (let i = 1; i <= 12; i++) {
      const f = path.resolve(__dirname, `../public/rashi/rashi-${String(i).padStart(2, '0')}.webp`)
      expect(fs.existsSync(f), f).toBe(true)
    }
    const html = renderReport(data)
    const imgs = html.match(/<img[^>]*>/g) ?? []
    expect(imgs.length).toBeGreaterThan(10)
    for (const tag of imgs) {
      expect(tag, tag).toContain('alt=""')
      expect(tag, tag).toMatch(/width="\d+"/)
      expect(tag, tag).toMatch(/height="\d+"/)
    }
  })

  it('D9/वर्ग-चार्ट में अंश नहीं (कोई "0°00′" नहीं)', () => {
    const html = renderReport(data)
    expect(html).not.toContain('0° 00′')
  })

  it('online section: 13 अध्याय details में, पहले दो खुले, chips भी 13', () => {
    const html = renderOnline(data)
    expect((html.match(/<details/g) ?? []).length).toBe(13)
    expect((html.match(/<details[^>]*open/g) ?? []).length).toBe(2)
    expect((html.match(/class="po-chip"/g) ?? []).length).toBe(13)
  })
})

describe('साढ़ेसाती की पट्टी (टास्क 05-ख)', () => {
  const ctx = () => ({ cycleData: data.sadesati.sadesatiCycles, birth: data.meta.birthMs, end: data.meta.birthMs + 100 * 365.25 * 86400000 })

  it('1985 में ठीक 3 चक्र — 2002–2009, 2032–2039, 2061–2068', () => {
    const { cycleData } = ctx()
    const years = cycleData.map((c) => [new Date(c.fromMs).getUTCFullYear(), new Date(c.toMs).getUTCFullYear()])
    expect(years).toEqual([[2002, 2009], [2032, 2039], [2061, 2068]])
  })

  it('चक्र के भीतर वक्री से लौटना नोट में आता है (05-ग §0)', () => {
    const { cycleData } = ctx()
    const notes = cycleData[0].notes ?? []
    const retro = notes.filter((n) => n.dir === 'retro')
    // 1985: 2005 में शनि फिर मिथुन (2) में, 2007 में फिर कर्क (3) में लौटा
    expect(retro.some((n) => n.rashi === 2)).toBe(true)
    expect(retro.some((n) => n.rashi === 3)).toBe(true)
    // चरणों की तारीख़ें नहीं बदलीं (पहला प्रवेश वाला नियम)
    expect(cycleData[0].phases.map((ph) => ph.phase)).toEqual([12, 1, 2])
  })

  it('12mm से छोटे हिस्से पर कोई अक्षर नहीं', () => {
    const { cycleData, birth, end } = ctx()
    const svg = sadesatiChart({ cycles: cycleData, dhaiya: data.sadesati.dhaiyaCycles, fromMs: birth, toMs: end, nowMs: data.meta.nowMs })
    // पट्टी की चौड़ाई 178 इकाई = 178mm; 12mm = 12 इकाई
    const W = 178
    const x = (ms) => (ms - birth) / (end - birth) * W
    let wide = 0
    for (const c of cycleData) {
      for (const ph of c.phases) {
        const w = Math.min(W, x(ph.toMs)) - Math.max(0, x(ph.fromMs))
        if (w > 12) wide++
      }
    }
    const labels = [...svg.querySelectorAll('text')].filter((t) => ['१', '२', '३', 'ढैया'].includes(t.textContent))
    expect(labels.length).toBeLessThanOrEqual(wide + data.sadesati.dhaiyaCycles.filter((d) => x(d.toMs) - x(d.fromMs) > 12).length)
  })

  it('पट्टी में हर चक्र एक ही लगातार पट्टी है (वक्री के टुकड़े जुड़े)', () => {
    const { cycleData, birth, end } = ctx()
    const svg = sadesatiChart({ cycles: cycleData, dhaiya: [], fromMs: birth, toMs: end, nowMs: data.meta.nowMs })
    const bars = [...svg.querySelectorAll('rect')].filter((r) => r.getAttribute('height') === '10')
    // हर चक्र के लिए: पृष्ठभूमि 1 + चरण 3 + वक्री-भराव (यदि कोई) — कुल 4 या अधिक
    expect(bars.length).toBeGreaterThanOrEqual(cycleData.length * 4)
  })
})

describe('चार्ट के बीच का label', () => {
  it('D1 = लग्न, चंद्र = चंद्र, D9 = नवांश लग्न', () => {
    const p = planetsForChart(data)
    const d1 = northChart({ size: 300, lagnaRashi: data.summary.lagnaRashi, planets: p })
    const ch = northChart({ size: 300, lagnaRashi: data.summary.moonRashi, planets: p, centerLabel: 'चंद्र' })
    const d9 = northChart({ size: 300, lagnaRashi: data.summary.lagnaRashi, planets: p, centerLabel: 'नवांश लग्न' })
    expect(d1.textContent).toContain('लग्न')
    expect(ch.textContent).toContain('चंद्र')
    expect(ch.textContent).not.toContain('लग्न')
    expect(d9.textContent).toContain('नवांश लग्न')
  })
})

describe('10 कुंडलियों में badge कहीं नहीं टकराता (टास्क 05-ख §4)', () => {
  it('हर badge भाव के अंदर, राशि-अंक से कम से कम 1 त्रिज्या दूर, और 5+ में छोटा', async () => {
    const SIZE = 300
    const polys = HOUSE_POLYS(SIZE)
    const nums = RASHI_NUM_AT(SIZE)
    // 1985 (जहाँ बु का badge दिखा था) + कैलिबरेशन की 9 (कालसर्प सहित) = 10 कुंडलियाँ
    const charts = [null, ...CALIB_CHARTS.slice(0, 9)]
    for (const c of charts) {
      if (!c) {
        // 1985 वाली कुंडली (data ऊपर से)
        const list85 = chartLayout({ size: SIZE, lagnaRashi: data.summary.lagnaRashi, planets: planetsForChart(data) })
        for (const b of list85) {
          const poly85 = polys[b.house]
          for (let k = 0; k < poly85.length; k++) {
            const dd = distToSegment(b.x, b.y, poly85[k], poly85[(k + 1) % poly85.length])
            expect(dd, `1985/${b.key} रेखा ${k}`).toBeGreaterThanOrEqual(b.r + 1.5)
          }
          const [nx5, ny5] = nums[b.house]
          expect(Math.hypot(b.x - nx5, b.y - ny5), `1985/${b.key} अंक`).toBeGreaterThanOrEqual(b.r)
        }
        continue
      }
      const d = buildPhalData(swe, {
        utc: c.utc, latitude: c.lat, longitude: c.lon,
        local: { year: +c.dob.slice(0, 4), month: +c.dob.slice(5, 7), day: +c.dob.slice(8, 10), hour: +c.tob.slice(0, 2), minute: +c.tob.slice(3, 5), second: 0 },
        timeZone: 'Asia/Kolkata',
      }, { nowMs: Date.UTC(2026, 11, 14) })
      const list = chartLayout({ size: SIZE, lagnaRashi: d.summary.lagnaRashi, planets: planetsForChart(d) })
      for (const b of list) {
        expect(pointInPoly(b.x, b.y, polys[b.house]), `${c.id}/${b.key}`).toBe(true)
        // badge के केंद्र से भाव की हर रेखा की लंबवत दूरी ≥ त्रिज्या + 1.5
        const poly = polys[b.house]
        for (let k = 0; k < poly.length; k++) {
          const a = poly[k]
          const bb = poly[(k + 1) % poly.length]
          const d = distToSegment(b.x, b.y, a, bb)
          expect(d, `${c.id}/${b.key} रेखा ${k}`).toBeGreaterThanOrEqual(b.r + 1.5)
        }
        const [nx, ny] = nums[b.house]
        expect(Math.hypot(b.x - nx, b.y - ny), `${c.id}/${b.key} अंक`).toBeGreaterThanOrEqual(b.r)
      }
      // दक्षिण चार्ट: हर badge अपनी कोशिका में, किनारों से r+1.5 दूर
      const south = southLayout({ size: SIZE, planets: planetsForChart(d) })
      for (const b of south) {
        const cell = SOUTH_CELL_OF(b.rashi, SIZE)
        for (let k = 0; k < 4; k++) {
          const dd = distToSegment(b.x, b.y, cell[k], cell[(k + 1) % 4])
          expect(dd, `${c.id}/${b.key} दक्षिण रेखा ${k}`).toBeGreaterThanOrEqual(b.r + 1.5)
        }
      }
      // सोलहों वर्ग: वही नियम
      for (const n of d.vargas.order) {
        const vh = d.vargas.charts[n]
        const vp = d.planets.map((x) => ({ key: x.key, ab: GRAHA_AB[x.key], rashi: vh.planets[x.key] }))
        const vl = chartLayout({ size: SIZE, lagnaRashi: vh.lagna, planets: vp })
        for (const b of vl) {
          const poly = HOUSE_POLYS(SIZE)[b.house]
          for (let k = 0; k < poly.length; k++) {
            const dd = distToSegment(b.x, b.y, poly[k], poly[(k + 1) % poly.length])
            expect(dd, `${c.id}/D${n}/${b.key}`).toBeGreaterThanOrEqual(b.r + 1.5)
          }
        }
      }

      // एक ही भाव के badges एक-दूसरे से न टकराएँ
      const byHouse = {}
      for (const b of list) (byHouse[b.house] = byHouse[b.house] || []).push(b)
      for (const [hs, arr] of Object.entries(byHouse)) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            const dd = Math.hypot(arr[i].x - arr[j].x, arr[i].y - arr[j].y)
            expect(dd, `${c.id}/भाव ${hs}`).toBeGreaterThanOrEqual(arr[i].r + arr[j].r - 0.5)
          }
        }
        if (arr.length >= 5) expect(arr[0].r).toBeLessThan(SIZE * 0.032)
      }
    }
  }, 40000)
})
