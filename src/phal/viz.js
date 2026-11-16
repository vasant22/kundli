// viz.js — फलादेश के चित्र (सब SVG, कोई external library नहीं).
//
// Design-kit का ही geometry और रंग; डेटा हमेशा buildPhalData से आता है.
// हर function एक <svg> element लौटाता है (कोई DOM lookup नहीं), इसलिए यही
// functions print-PDF, /kundli-phal/ पेज और kundli पेज के online section —
// तीनों में एक जैसे चलते हैं.

export const C = {
  nisha: '#1C2452', nisha2: '#2B3672', gold: '#E9B949', marigold: '#EF7D1A',
  dawn: '#FFF4E8', sky: '#EEF1FB', ink: '#24273A', muted: '#6B6F85', line: '#E6E2EE',
  shubh: '#2C8C5A', mishr: '#C77A0A', savdhan: '#B5522B',
  su: '#E4572E', mo: '#8E9AAF', ma: '#C62828', me: '#2E9E5B', ju: '#E0A100',
  ve: '#D0629B', sa: '#3949AB', ra: '#56657A', ke: '#8D6E63',
}

// ग्रह का हिंदी छोटा अक्षर (badge के लिए) — पूरे app में यही
export const GRAHA_AB = { sun: 'सू', moon: 'चं', mars: 'मं', mercury: 'बु', jupiter: 'गु', venus: 'शु', saturn: 'श', rahu: 'रा', ketu: 'के' }
export const GRAHA_HI = { sun: 'सूर्य', moon: 'चंद्र', mars: 'मंगल', mercury: 'बुध', jupiter: 'गुरु', venus: 'शुक्र', saturn: 'शनि', rahu: 'राहु', ketu: 'केतु' }

// /kundli-assets/rashi/rashi-05.webp — vite की base के साथ
export const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/'
export const rashiImg = (rashi) => `${BASE}rashi/rashi-${String(rashi + 1).padStart(2, '0')}.webp`

// पूरा नाम ('saturn') या छोटा ('sa') — दोनों से ग्रह-रंग
const VAR_OF = { sun: 'su', moon: 'mo', mars: 'ma', mercury: 'me', jupiter: 'ju', venus: 've', saturn: 'sa', rahu: 'ra', ketu: 'ke' }
export const colorOf = (key) => C[key] || C[VAR_OF[key]] || C.nisha

const NS = 'http://www.w3.org/2000/svg'
const HEAD = "'Baloo 2','Noto Sans Devanagari',sans-serif"
const BODY = "'Noto Sans Devanagari',system-ui,sans-serif"

export const el = (tag, attrs = {}, text = null) => {
  const node = document.createElementNS(NS, tag)
  for (const k in attrs) if (attrs[k] != null) node.setAttribute(k, attrs[k])
  if (text != null) node.textContent = text
  return node
}

// उत्तर भारतीय चार्ट: भाव 1 ऊपर का हीरा, फिर उलटी दिशा (2 ऊपर-बाएँ … 12 ऊपर-दाएँ).
export const HOUSE_POLYS = (S) => {
  const h = S / 2, q = S / 4
  return {
    1: [[h, 0], [3 * q, q], [h, h], [q, q]],
    2: [[0, 0], [h, 0], [q, q]],
    3: [[0, 0], [q, q], [0, h]],
    4: [[0, h], [q, q], [h, h], [q, 3 * q]],
    5: [[0, h], [q, 3 * q], [0, S]],
    6: [[0, S], [q, 3 * q], [h, S]],
    7: [[h, S], [q, 3 * q], [h, h], [3 * q, 3 * q]],
    8: [[h, S], [3 * q, 3 * q], [S, S]],
    9: [[S, S], [3 * q, 3 * q], [S, h]],
    10: [[S, h], [3 * q, 3 * q], [h, h], [3 * q, q]],
    11: [[S, h], [3 * q, q], [S, 0]],
    12: [[S, 0], [3 * q, q], [h, 0]],
  }
}

// ग्रह-समूह का केंद्र और राशि-अंक की जगह
export const HOUSE_CENTERS = (S) => {
  const h = S / 2, q = S / 4
  return {
    1: [h, q * 0.95], 2: [q, q * 0.42], 3: [q * 0.42, q], 4: [q * 0.95, h],
    5: [q * 0.42, 3 * q], 6: [q, S - q * 0.42], 7: [h, S - q * 0.95], 8: [3 * q, S - q * 0.42],
    9: [S - q * 0.42, 3 * q], 10: [S - q * 0.95, h], 11: [S - q * 0.42, q], 12: [3 * q, q * 0.42],
  }
}
export const RASHI_NUM_AT = (S) => {
  const h = S / 2, q = S / 4
  return {
    1: [h, h - q * 0.28], 2: [q, q * 0.78], 3: [q * 0.78, q], 4: [h - q * 0.28, h],
    5: [q * 0.78, 3 * q], 6: [q, S - q * 0.78], 7: [h, h + q * 0.28], 8: [3 * q, S - q * 0.78],
    9: [S - q * 0.78, 3 * q], 10: [h + q * 0.28, h], 11: [S - q * 0.78, q], 12: [3 * q, q * 0.78],
  }
}

const houseOfRashi = (rashi, lagnaRashi) => ((rashi - lagnaRashi + 12) % 12) + 1

// किस भाव में कौन-से ग्रह, और badge किस जगह पर — test भी यही इस्तेमाल करता है
export function chartLayout({ size = 300, lagnaRashi, planets, theme = 'light' }) {
  const S = size
  const R = S * 0.032
  const centers = HOUSE_CENTERS(S)
  const VERT = [3, 5, 9, 11], HORZ = [2, 6, 8, 12]
  const byHouse = {}
  for (const p of planets) {
    const hs = houseOfRashi(p.rashi, lagnaRashi)
    ;(byHouse[hs] = byHouse[hs] || []).push(p)
  }
  const out = []
  for (const hs of Object.keys(byHouse)) {
    const list = byHouse[hs]
    const [cx, cy] = centers[hs]
    const n = list.length
    // अंश (degrees) सिर्फ़ खुले भावों में — 3+ ग्रह हों तो सिर्फ़ badge (वरना
    // अंश पड़ोसी badge/राशि-अंक से टकराते हैं; अंश तालिका में हमेशा है).
    const withDeg = theme !== 'dark' && n <= 2
    // 5 या अधिक ग्रह: badge 80% — भाव की रेखा/राशि-अंक को न छुए
    const r = n >= 5 ? R * 0.8 : R
    const gapX = r * (withDeg ? 3.6 : theme === 'dark' ? 2.2 : 2.45)
    const gapY = r * (withDeg ? 3.6 : theme === 'dark' ? 2.2 : 2.45)
    const cols = VERT.includes(+hs) ? (n > 3 ? 2 : 1) : HORZ.includes(+hs) ? Math.min(n, 3) : (n > 2 ? 2 : n)
    const rows = Math.ceil(n / cols)
    list.forEach((p, i) => {
      const c = i % cols, rw = Math.floor(i / cols)
      out.push({
        key: p.key, ab: p.ab, house: +hs, withDeg,
        x: cx + (c - (cols - 1) / 2) * gapX,
        y: cy + (rw - (rows - 1) / 2) * gapY,
        r,
      })
    })
  }
  return out
}

export function northChart({ size = 300, lagnaRashi, planets, theme = 'light', centerLabel = 'लग्न' }) {
  const S = size
  const dark = theme === 'dark'
  const line = dark ? C.gold : C.nisha
  const num = dark ? C.gold : C.marigold
  const svg = el('svg', { viewBox: `0 0 ${S} ${S}`, width: '100%', class: 'phal-chart-svg', 'data-theme': theme })
  const P = HOUSE_POLYS(S)
  svg.appendChild(el('rect', {
    x: 1, y: 1, width: S - 2, height: S - 2, rx: 6,
    fill: dark ? 'rgba(255,255,255,.04)' : '#fff', stroke: line, 'stroke-width': 2,
  }))
  svg.appendChild(el('polygon', { points: P[1].map((p) => p.join(',')).join(' '), fill: dark ? 'rgba(239,125,26,.22)' : C.dawn }))
  const h = S / 2
  ;[[0, 0, S, S], [S, 0, 0, S], [h, 0, S, h], [S, h, h, S], [h, S, 0, h], [0, h, h, 0]]
    .forEach(([a, b, c, d]) => svg.appendChild(el('line', { x1: a, y1: b, x2: c, y2: d, stroke: line, 'stroke-width': 1.4 })))
  const N = RASHI_NUM_AT(S)
  for (let hs = 1; hs <= 12; hs++) {
    const r = (lagnaRashi + hs - 1) % 12
    const [nx, ny] = N[hs]
    svg.appendChild(el('text', {
      x: nx, y: ny + 4, 'text-anchor': 'middle', 'font-size': S * 0.042,
      'font-weight': 700, fill: num, 'font-family': HEAD,
    }, String(r + 1)))
  }
  const [ltx, lty] = HOUSE_CENTERS(S)[1]
  svg.appendChild(el('text', {
    x: ltx, y: lty - S * 0.105, 'text-anchor': 'middle', 'font-size': S * 0.033,
    'font-weight': 700, fill: C.marigold, 'font-family': HEAD,
  }, centerLabel))

  for (const b of chartLayout({ size, lagnaRashi, planets, theme })) {
    svg.appendChild(el('circle', { cx: b.x, cy: b.y, r: b.r, fill: colorOf(b.key), stroke: dark ? '#fff' : 'none', 'stroke-width': 1 }))
    svg.appendChild(el('text', {
      x: b.x, y: b.y + b.r * 0.42, 'text-anchor': 'middle', 'font-size': b.r * 1.05,
      'font-weight': 800, fill: '#fff', 'font-family': HEAD,
    }, b.ab))
    if (planets.find((p) => p.key === b.key)?.retro) {
      svg.appendChild(el('text', {
        x: b.x + b.r * 0.52, y: b.y - b.r * 0.42, 'text-anchor': 'middle', 'font-size': b.r * 0.6,
        'font-weight': 700, fill: '#fff', 'font-family': HEAD,
      }, 'व'))
    }
    // अंदर के पन्नों में अंश भी (badge के नीचे छोटा)
    if (b.withDeg && typeof planets.find((p) => p.key === b.key)?.degStr === 'string') {
      svg.appendChild(el('text', {
        x: b.x, y: b.y + b.r * 1.55, 'text-anchor': 'middle', 'font-size': b.r * 0.85,
        'font-weight': 600, fill: C.ink, 'font-family': BODY,
      }, planets.find((p) => p.key === b.key).degStr))
    }
  }
  return svg
}

// दक्षिण भारतीय चार्ट — वही रंग-भाषा (राशि-अंक + ग्रह-badge)
const SOUTH_CELLS = [11, 0, 1, 2, 10, -1, -1, 3, 9, -1, -1, 4, 8, 7, 6, 5] // 4×4, मीन से शुरू
export function southChart({ size = 300, planets, theme = 'light' }) {
  const S = size
  const dark = theme === 'dark'
  const line = dark ? C.gold : C.nisha
  const num = dark ? C.gold : C.marigold
  const svg = el('svg', { viewBox: `0 0 ${S} ${S}`, width: '100%', class: 'phal-chart-svg', 'data-theme': theme })
  const c = S / 4
  svg.appendChild(el('rect', { x: 1, y: 1, width: S - 2, height: S - 2, rx: 6, fill: dark ? 'rgba(255,255,255,.04)' : '#fff', stroke: line, 'stroke-width': 2 }))
  for (let i = 0; i < 4; i++) {
    for (const f of [0, 1]) {
      svg.appendChild(el('line', { x1: 0, y1: c * (i + 1), x2: f ? S : c * 3, y2: c * (i + 1), stroke: line, 'stroke-width': 1.3 }))
      svg.appendChild(el('line', { x1: c * (i + 1), y1: 0, x2: c * (i + 1), y2: f ? c * 3 : S, stroke: line, 'stroke-width': 1.3 }))
    }
  }
  SOUTH_CELLS.forEach((rashi, i) => {
    if (rashi < 0) return
    const cx = (i % 4) * c, cy = Math.floor(i / 4) * c
    svg.appendChild(el('text', {
      x: cx + c * 0.82, y: cy + c * 0.22, 'text-anchor': 'middle', 'font-size': S * 0.032,
      'font-weight': 700, fill: num, 'font-family': HEAD,
    }, String(rashi + 1)))
    const list = planets.filter((p) => p.rashi === rashi)
    const cols = Math.min(list.length, 2)
    list.forEach((p, j) => {
      const col = j % (cols || 1), row = Math.floor(j / (cols || 1))
      const R = S * 0.028
      const x = cx + c * 0.5 + (col - ((cols || 1) - 1) / 2) * R * 2.3
      const y = cy + c * 0.52 + (row - 0.5) * R * 2.3
      svg.appendChild(el('circle', { cx: x, cy: y, r: R, fill: colorOf(p.key), stroke: dark ? '#fff' : 'none', 'stroke-width': 1 }))
      svg.appendChild(el('text', { x, y: y + R * 0.42, 'text-anchor': 'middle', 'font-size': R * 1.05, 'font-weight': 800, fill: '#fff', 'font-family': HEAD }, p.ab))
    })
  })
  return svg
}

// विंशोपक बल की पट्टियाँ — हर ग्रह अपने रंग में
export function vimshopakaBars(items, { max = 20 } = {}) {
  const w = 96, rowH = 8.4, lab = 17, h = items.length * rowH + 6
  const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%', class: 'phal-viz phal-viz-bars', role: 'img', 'aria-label': 'विंशोपक बल' })
  const x = (v) => lab + (w - lab - 14) * v / max
  for (const t of [5, 10, 15]) {
    svg.appendChild(el('line', { x1: x(t), x2: x(t), y1: 0, y2: h - 4, stroke: '#D8D5E3', 'stroke-width': 0.25, 'stroke-dasharray': '1 1' }))
    svg.appendChild(el('text', { x: x(t), y: h - 0.5, 'text-anchor': 'middle', 'font-size': 2.6, fill: C.muted }, String(t)))
  }
  items.forEach((it, i) => {
    const y = i * rowH + 1
    svg.appendChild(el('text', { x: 0, y: y + 4.6, 'font-size': 3.4, fill: C.ink, 'font-weight': 700, 'font-family': HEAD }, it.hi))
    svg.appendChild(el('rect', { x: lab, y: y + 1.2, width: x(max) - lab, height: 4.4, rx: 2.2, fill: '#F2F0F7' }))
    svg.appendChild(el('rect', { x: lab, y: y + 1.2, width: Math.max(0, x(it.value) - lab), height: 4.4, rx: 2.2, fill: colorOf(it.key) }))
    svg.appendChild(el('text', { x: x(it.value) + 1.5, y: y + 4.7, 'font-size': 3, fill: C.ink }, Number(it.value).toFixed(2)))
  })
  return svg
}

// दशा-पट्टी: हर अवधि अपने ग्रह के रंग में, "आप यहाँ हैं" चिह्न के साथ
export function dashaTimeline(rows, { fromMs, toMs, nowMs, label = 'आप यहाँ हैं' }) {
  const W = 178, H = 30
  const x = (ms) => (ms - fromMs) / (toMs - fromMs) * W
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', class: 'phal-viz', role: 'img', 'aria-label': 'दशा-पट्टी' })
  rows.forEach((r) => {
    const x1 = Math.max(0, x(r.fromMs)), x2 = Math.min(W, x(r.toMs))
    if (x2 <= x1) return
    svg.appendChild(el('rect', { x: x1 + 0.25, y: 6, width: Math.max(0.6, x2 - x1 - 0.5), height: 10, rx: 1.4, fill: r.color || colorOf(r.key) }))
    const wide = x2 - x1 > 9
    svg.appendChild(el('text', {
      x: (x1 + x2) / 2, y: 12.9, 'text-anchor': 'middle', 'font-size': wide ? 3.5 : 3.2,
      fill: '#fff', 'font-weight': 800, 'font-family': HEAD,
    }, wide ? r.hi : r.ab))
    if (wide) {
      svg.appendChild(el('text', { x: x1 + 0.4, y: 20.5, 'font-size': 2.5, fill: C.muted }, String(new Date(r.fromMs).getUTCFullYear())))
    }
  })
  const nx = x(nowMs)
  svg.appendChild(el('line', { x1: nx, x2: nx, y1: 2, y2: 18, stroke: C.nisha, 'stroke-width': 0.6 }))
  svg.appendChild(el('path', { d: `M${nx - 1.6},1 L${nx + 1.6},1 L${nx},3.2 Z`, fill: C.marigold }))
  svg.appendChild(el('text', { x: nx, y: H - 1, 'text-anchor': 'middle', 'font-size': 3, fill: C.marigold, 'font-weight': 800, 'font-family': HEAD }, label))
  return svg
}

// सर्वाष्टकवर्ग की छड़ें — हर भाव के नीचे उसकी राशि का चित्र
export function savBars(values, { lagnaRashi = 0, average = 28 } = {}) {
  const W = 178, H = 66, bw = W / 12, max = 48
  const y = (v) => 50 - v / max * 44
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', class: 'phal-viz', role: 'img', 'aria-label': 'सर्वाष्टकवर्ग' })
  values.forEach((v, i) => {
    const strong = v > average
    const x = i * bw + 2.2
    svg.appendChild(el('rect', { x, y: y(v), width: bw - 4.4, height: 50 - y(v), rx: 1.5, fill: strong ? C.shubh : '#C9CCD9' }))
    svg.appendChild(el('text', {
      x: x + (bw - 4.4) / 2, y: y(v) - 1.4, 'text-anchor': 'middle', 'font-size': 3.6,
      'font-weight': 800, 'font-family': HEAD, fill: strong ? C.shubh : C.muted,
    }, String(v)))
    svg.appendChild(el('text', { x: x + (bw - 4.4) / 2, y: 55, 'text-anchor': 'middle', 'font-size': 3, 'font-weight': 700, fill: C.ink }, `भाव ${i + 1}`))
    svg.appendChild(el('image', {
      href: rashiImg((lagnaRashi + i) % 12), x: x + (bw - 4.4) / 2 - 4, y: 56.5, width: 8, height: 8,
    }))
  })
  svg.appendChild(el('line', { x1: 0, x2: W, y1: y(average), y2: y(average), stroke: C.marigold, 'stroke-width': 0.4, 'stroke-dasharray': '1.5 1' }))
  svg.appendChild(el('line', { x1: 0, x2: W, y1: 50, y2: 50, stroke: '#D8D5E3', 'stroke-width': 0.3 }))
  return svg
}

// भिन्नाष्टकवर्ग heatmap — जितने बिंदु, उतना गहरा रंग
export function bavHeatmap(rows) {
  const W = 178, cw = (W - 16) / 12, ch = 6.4, H = rows.length * ch + 8
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', class: 'phal-viz', role: 'img', 'aria-label': 'भिन्नाष्टकवर्ग' })
  for (let i = 0; i < 12; i++) {
    svg.appendChild(el('text', { x: 16 + i * cw + cw / 2, y: 3.6, 'text-anchor': 'middle', 'font-size': 2.8, fill: C.muted }, `भाव ${i + 1}`))
  }
  rows.forEach((row, r) => {
    const y = 5 + r * ch
    svg.appendChild(el('text', { x: 0, y: y + 4.4, 'font-size': 3.2, 'font-weight': 700, 'font-family': HEAD, fill: C.ink }, row.hi))
    row.values.forEach((v, i) => {
      svg.appendChild(el('rect', {
        x: 16 + i * cw + 0.4, y: y + 0.4, width: cw - 0.8, height: ch - 0.8, rx: 1,
        fill: colorOf(row.key), 'fill-opacity': (0.08 + v / 8 * 0.85).toFixed(2),
      }))
      svg.appendChild(el('text', {
        x: 16 + i * cw + cw / 2, y: y + 4.3, 'text-anchor': 'middle', 'font-size': 3,
        'font-weight': 600, fill: v >= 5 ? '#fff' : C.ink,
      }, String(v)))
    })
  })
  return svg
}

// मुखपृष्ठ का तारा-समूह (हर बार एक जैसा — कोई random नहीं)
export function starfield(w = 210, h = 297, count = 150) {
  const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'none', class: 'phal-stars', 'aria-hidden': 'true' })
  let seed = 7
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  for (let i = 0; i < count; i++) {
    svg.appendChild(el('circle', {
      cx: (rnd() * w).toFixed(2), cy: (rnd() * h).toFixed(2), r: (rnd() * 0.45 + 0.08).toFixed(2),
      fill: '#fff', opacity: (rnd() * 0.6 + 0.15).toFixed(2),
    }))
  }
  return svg
}

// साढ़ेसाती / ढैया की पट्टी — हर चक्र एक लगातार पट्टी, भीतर तीन चरण शनि-रंग के
// तीन shade में; वक्री से आए छोटे अंतराल पिछले चरण के हल्के रंग से भरे रहते हैं।
// पट्टी पर अक्षर सिर्फ़ तब, जब हिस्सा 12mm से चौड़ा हो (viewBox की 1 इकाई ≈ 1mm)।
const SA_SHADE = { 12: '#8E9AC9', 1: '#3949AB', 2: '#5C6BC0' }
const SA_SOFT = { 12: '#D3D9EE', 1: '#B7BFE4', 2: '#C4CCEB' }
const SA_LABEL = { 12: '१', 1: '२', 2: '३' }

export function sadesatiChart({ cycles = [], dhaiya = [], fromMs, toMs, nowMs, label = 'आप यहाँ हैं' }) {
  const W = 178, H = 44
  const x = (ms) => (ms - fromMs) / (toMs - fromMs) * W
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', class: 'phal-viz', role: 'img', 'aria-label': 'साढ़ेसाती और ढैया की पट्टी' })

  // साढ़ेसाती: हर चक्र की पूरी पट्टी (6 → 16)
  for (const c of cycles) {
    const x1 = Math.max(0, x(c.fromMs)), x2 = Math.min(W, x(c.toMs))
    if (x2 <= x1) continue
    svg.appendChild(el('rect', { x: x1, y: 6, width: Math.max(0.8, x2 - x1), height: 10, rx: 1.4, fill: '#EEF1FB' }))
    const phases = [...(c.phases ?? [])].sort((a, b) => a.fromMs - b.fromMs)
    let prev = null
    for (const ph of phases) {
      // वक्री का अंतराल: पिछले चरण के हल्के रंग से भरा (ख़ाली नहीं)
      if (prev && ph.fromMs > prev.toMs) {
        const gx1 = x(prev.toMs), gx2 = x(ph.fromMs)
        if (gx2 > gx1) svg.appendChild(el('rect', { x: gx1, y: 6, width: gx2 - gx1, height: 10, fill: SA_SOFT[prev.phase] ?? SA_SOFT[1] }))
      }
      const px1 = Math.max(0, x(ph.fromMs)), px2 = Math.min(W, x(ph.toMs))
      if (px2 > px1) {
        svg.appendChild(el('rect', { x: px1, y: 6, width: px2 - px1, height: 10, fill: SA_SHADE[ph.phase] ?? SA_SHADE[1] }))
        if (px2 - px1 > 12) {
          svg.appendChild(el('text', {
            x: (px1 + px2) / 2, y: 13, 'text-anchor': 'middle', 'font-size': 3.4, fill: '#fff',
            'font-weight': 800, 'font-family': HEAD,
          }, SA_LABEL[ph.phase] ?? ''))
        }
      }
      prev = ph
    }
  }
  // ढैया: पतली, हल्की पट्टी (21 → 25)
  for (const d of dhaiya) {
    const x1 = Math.max(0, x(d.fromMs)), x2 = Math.min(W, x(d.toMs))
    if (x2 <= x1) continue
    svg.appendChild(el('rect', { x: x1, y: 21, width: Math.max(0.6, x2 - x1), height: 4, rx: 1, fill: '#C3CAE8' }))
    if (x2 - x1 > 12) {
      svg.appendChild(el('text', { x: (x1 + x2) / 2, y: 24, 'text-anchor': 'middle', 'font-size': 2.6, fill: C.nisha, 'font-weight': 700, 'font-family': HEAD }, 'ढैया'))
    }
  }
  // वर्ष: पट्टी के नीचे (साढ़ेसाती के चक्रों की सीमाएँ)
  const marks = []
  for (const c of cycles) { marks.push(c.fromMs, c.toMs) }
  marks.sort((a, b) => a - b)
  let lastX = -100
  for (const ms of marks) {
    const mx = x(ms)
    if (mx < 4 || mx > W - 4) continue
    if (mx - lastX < 10) continue
    svg.appendChild(el('line', { x1: mx, x2: mx, y1: 16, y2: 18, stroke: '#D8D5E3', 'stroke-width': 0.3 }))
    svg.appendChild(el('text', { x: mx, y: 33, 'text-anchor': 'middle', 'font-size': 2.7, fill: C.muted }, String(new Date(ms).getUTCFullYear())))
    lastX = mx
  }
  // "आप यहाँ हैं"
  const nx = x(nowMs)
  if (nx >= 0 && nx <= W) {
    svg.appendChild(el('line', { x1: nx, x2: nx, y1: 2, y2: 38, stroke: C.nisha, 'stroke-width': 0.6 }))
    svg.appendChild(el('path', { d: `M${nx - 1.6},1 L${nx + 1.6},1 L${nx},3.2 Z`, fill: C.marigold }))
    svg.appendChild(el('text', { x: nx, y: 43, 'text-anchor': 'middle', 'font-size': 2.9, fill: C.marigold, 'font-weight': 800, 'font-family': HEAD }, label))
  }
  svg.appendChild(el('line', { x1: 0, x2: W, y1: 39.5, y2: 39.5, stroke: '#E6E2EE', 'stroke-width': 0.3 }))
  return svg
}
