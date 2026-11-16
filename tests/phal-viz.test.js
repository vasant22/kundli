// @vitest-environment jsdom
// tests/phal-viz.test.js — चित्र (viz.js) और design की पक्की बातें (टास्क 05)
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { buildPhalData } from '../src/phal/index.js'
import { renderReport, renderOnline } from '../src/phal/report.js'
import { chartLayout, northChart, dashaTimeline, savBars, bavHeatmap, vimshopakaBars, HOUSE_POLYS, RASHI_NUM_AT, GRAHA_AB } from '../src/phal/viz.js'

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
