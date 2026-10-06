// render.js — BNN chart drawing (Phase 2b).
// Text INSIDE the chart is English only (repo rule), matching the old
// software's outer face: planet codes (SUN MOO MAR …) with '#' for
// retrograde, red cusp numbers with degrees ("09 11.31"), an "ASC 12.53"
// marker, the centre panel (name / place / date+weekday / age /
// nakshatra-pada / tithi / yoga) and the exchange label (MERCURY<>SATURN).
// Two styles: south (fixed rashi grid) + north (diamond houses).
// Spec: docs/bnn-guide.txt → Phase 2; layout reference: old software outer
// face (screenshots; see docs/bnn-calib-findings.md §5).
import { GRAHAS } from '../i18n.js'

const NS = 'http://www.w3.org/2000/svg'
const SIZE = 360 // svg viewBox is 0 0 360 360; CSS scales it responsively
const RED = '#c62828'
const INK = '#3a2410'
const ACC = '#a94f05'

// South-Indian fixed layout: rashi index (0 = Aries) → [col, row] in the 4×4 grid.
const S_CELLS = [
  [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3],
  [2, 3], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0],
]

// North-Indian house centres (house 1 top-centre, going anti-clockwise).
const N_CENTERS = [
  [0.5, 0.25], [0.25, 0.12], [0.12, 0.25], [0.25, 0.5],
  [0.12, 0.75], [0.25, 0.88], [0.5, 0.75], [0.75, 0.88],
  [0.88, 0.75], [0.75, 0.5], [0.88, 0.25], [0.75, 0.12],
]

// 3-letter codes like the old software's chart face: "MAR# 21.30".
const CODE = {
  sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER',
  jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET',
}

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
  return node
}

function textNode(x, y, content, { size = 12, weight = 400, anchor = 'middle', fill = INK } = {}) {
  const node = el('text', { x, y, 'text-anchor': anchor, 'font-size': size, 'font-weight': weight })
  node.setAttribute('fill', fill)
  node.textContent = content
  return node
}

// Lay a block of lines out vertically centred on (cx, cy).
function layoutLines(parent, cx, cy, lines) {
  const heights = lines.map((line) => line.size * 1.2)
  const total = heights.reduce((a, b) => a + b, 0)
  let y = cy - total / 2
  lines.forEach((line, i) => {
    y += heights[i]
    parent.append(
      textNode(cx, y - line.size * 0.3, line.text, {
        size: line.size,
        weight: line.weight ?? 400,
        fill: line.fill,
      })
    )
  })
}

// ---------------------------------------------------------------------------
// Text helpers (exported — formats pinned by tests)
// ---------------------------------------------------------------------------
// "03.12" — degree padded to two digits, minutes 2-digit (old-software
// style). Minutes are TRUNCATED: the old face shows 13°36.69′ as "13.36"
// and 8°09.87′ as "08.09" (checked against its screenshot values).
export function degDot(deg) {
  const totalSec = Math.floor(deg * 3600 + 1e-7)
  const d = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`
}

// "MAR# 21.30" (or "SUN 08.09"). Rahu/Ketu are always retrograde but the
// old face never marks them with '#' (guide भाग 5 shows plain RAH/KET).
export function planetText(p) {
  const hash = p.retro && p.key !== 'rahu' && p.key !== 'ketu' ? '#' : ''
  return `${CODE[p.key] || p.short.toUpperCase()}${hash} ${degDot(p.degInSign)}`
}

// "09 11.31"
export function cuspText(c) {
  return `${String(c.n).padStart(2, '0')} ${degDot(c.degInSign)}`
}

// "MERCURY<>SATURN" for [[key, key]…] pairs.
const EN_NAME = Object.fromEntries(GRAHAS.map((g) => [g.key, g.en.toUpperCase()]))
export function exchangeLabel(pairs) {
  return pairs.map(([a, b]) => `${EN_NAME[a]}<>${EN_NAME[b]}`).join('  ')
}

// Calendar age (Y-M-D) between two dates: { y, m, d }.
export function ageYMD(birth, ref) {
  const daysIn = (y, m) => new Date(y, m, 0).getDate()
  let y = ref.year - birth.year
  let m = ref.month - birth.month
  let d = ref.day - birth.day
  if (d < 0) {
    m -= 1
    const pm = ref.month - 1 === 0 ? 12 : ref.month - 1
    const py = ref.month - 1 === 0 ? ref.year - 1 : ref.year
    d += daysIn(py, pm)
  }
  if (m < 0) {
    y -= 1
    m += 12
  }
  return { y, m, d }
}

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
export function weekdayEN(y, m, d) {
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

// Wrap a piece of text at ~`max` characters (centre panel lines).
function wrapText(text, max = 26) {
  const out = []
  let line = ''
  for (const word of String(text).split(' ')) {
    if ((line + ' ' + word).trim().length > max) {
      if (line) out.push(line.trim())
      line = word
    } else {
      line = `${line} ${word}`
    }
  }
  if (line.trim()) out.push(line.trim())
  return out
}

const gray = (count) => (count >= 5 ? 9 : count >= 3 ? 10 : 11)

// The centre-panel text lines (English; the dasha lines join in Phase 6).
function metaLines(meta) {
  const raw = [
    { text: meta.name, size: 11.5, weight: 600 },
    { text: meta.placeText, size: 10.5 },
    { text: `${meta.dateTimeText} ${meta.weekday}`, size: 10 },
    { text: meta.ageText, size: 10 },
    { text: meta.nakText, size: 10 },
    { text: meta.tithiText, size: 10 },
    { text: meta.yogaText, size: 10 },
  ].filter((l) => l.text)
  const lines = []
  for (const l of raw) {
    if (l.size >= 11) {
      for (const piece of wrapText(l.text)) lines.push({ ...l, text: piece })
    } else {
      lines.push(l)
    }
  }
  return lines
}

// Shared per-cell block: red cusp lines first, then entries (planets + the
// ASC marker) sorted by degree — the old face shows them in that order.
function cellBlock(cusps, planets, includeAsc, asc) {
  const block = cusps.map((c) => ({ text: cuspText(c), size: 10, weight: 600, fill: RED }))
  const entries = planets.map((p) => ({ deg: p.degInSign, text: planetText(p), fill: INK }))
  if (includeAsc) {
    entries.push({ deg: asc.degInSign, text: `ASC ${degDot(asc.degInSign)}`, fill: ACC, weight: 600 })
  }
  entries.sort((a, b) => a.deg - b.deg)
  const size = gray(entries.length)
  for (const e of entries) block.push({ text: e.text, size, weight: e.weight ?? 400, fill: e.fill })
  return block
}

// ---------------------------------------------------------------------------
// SOUTH style — fixed 4×4 rashi grid (same geometry as the main app's chart)
// ---------------------------------------------------------------------------
export function buildSouthBnn(bnn, meta = {}) {
  const S = SIZE
  const C = S / 4
  const svg = el('svg', {
    viewBox: `0 0 ${S} ${S}`,
    class: 'chart chart-south',
    'data-chart': 'south',
    role: 'img',
    'aria-label': 'BNN lagna chart (south Indian style)',
  })

  const grid = el('g', { stroke: '#5a3410', 'stroke-width': 1.4, fill: 'none' })
  grid.append(el('rect', { x: 0, y: 0, width: S, height: S }))
  for (const k of [1, 2, 3]) {
    grid.append(el('line', { x1: k * C, y1: 0, x2: k * C, y2: C }))
    grid.append(el('line', { x1: k * C, y1: 3 * C, x2: k * C, y2: 4 * C }))
    grid.append(el('line', { x1: 0, y1: k * C, x2: C, y2: k * C }))
    grid.append(el('line', { x1: 3 * C, y1: k * C, x2: 4 * C, y2: k * C }))
  }
  grid.append(el('rect', { x: C, y: C, width: 2 * C, height: 2 * C }))
  svg.append(grid)

  // Centre panel background (drawn before the cells, text goes on top later).
  const centreBg = el('g', { class: 'center-bg' })
  centreBg.append(el('rect', { x: C + 1, y: C + 1, width: 2 * C - 2, height: 2 * C - 2, fill: '#fffdf3' }))
  svg.append(centreBg)

  const ascRashi = bnn.ascendant.rashi
  const cuspsByRashi = Array.from({ length: 12 }, () => [])
  for (const c of bnn.cusps) cuspsByRashi[c.rashi].push(c)

  for (let rashi = 0; rashi < 12; rashi++) {
    const [col, row] = S_CELLS[rashi]
    const group = el('g', {
      class: 'cell',
      'data-rashi': String(rashi),
      transform: `translate(${col * C}, ${row * C})`,
    })
    const block = cellBlock(
      cuspsByRashi[rashi],
      bnn.planets.filter((p) => p.rashi === rashi),
      rashi === ascRashi,
      bnn.ascendant
    )
    if (block.length > 0) layoutLines(group, C / 2, C / 2, block)
    svg.append(group)
  }

  const panel = el('g', { class: 'center-panel' })
  layoutLines(panel, S / 2, S / 2, metaLines(meta))
  svg.append(panel)

  return svg
}

// ---------------------------------------------------------------------------
// NORTH style — diamond (fixed houses; region n = the ascendant's nth sign)
// ---------------------------------------------------------------------------
export function buildNorthBnn(bnn, meta = {}) {
  const S = SIZE
  const svg = el('svg', {
    viewBox: `0 0 ${S} ${S}`,
    class: 'chart chart-north',
    'data-chart': 'north',
    role: 'img',
    'aria-label': 'BNN lagna chart (north Indian style)',
  })

  const lines = el('g', { stroke: '#5a3410', 'stroke-width': 1.4, fill: 'none' })
  lines.append(el('rect', { x: 0, y: 0, width: S, height: S }))
  lines.append(el('line', { x1: 0, y1: 0, x2: S, y2: S }))
  lines.append(el('line', { x1: S, y1: 0, x2: 0, y2: S }))
  lines.append(el('polygon', { points: `${S / 2},0 ${S},${S / 2} ${S / 2},${S} 0,${S / 2}` }))
  svg.append(lines)

  // Centre panel background (before the cells; the text goes on top later).
  const centreBg = el('g', { class: 'center-bg' })
  centreBg.append(
    el('rect', {
      x: S / 2 - 83, y: S / 2 - 83, width: 166, height: 166,
      rx: 10, fill: '#fffdf3', stroke: '#e3d2a6',
    })
  )
  svg.append(centreBg)

  const ascRashi = bnn.ascendant.rashi
  const regionOf = (rashi) => ((rashi - ascRashi + 12) % 12) + 1
  const cuspsByRegion = Array.from({ length: 12 }, () => [])
  for (const c of bnn.cusps) cuspsByRegion[regionOf(c.rashi) - 1].push(c)
  const planetsByRegion = Array.from({ length: 12 }, () => [])
  for (const p of bnn.planets) planetsByRegion[regionOf(p.rashi) - 1].push(p)

  for (let house = 1; house <= 12; house++) {
    const [fx, fy] = N_CENTERS[house - 1]
    const group = el('g', { class: 'house', 'data-house': String(house) })
    const block = cellBlock(
      cuspsByRegion[house - 1],
      planetsByRegion[house - 1],
      house === 1,
      bnn.ascendant
    )
    if (block.length > 0) layoutLines(group, fx * S, fy * S, block)
    svg.append(group)
  }

  const panel = el('g', { class: 'center-panel' })
  layoutLines(panel, S / 2, S / 2, metaLines(meta))
  svg.append(panel)

  return svg
}

/** Draw the BNN chart in the given style ('south' default — the old face). */
export function buildBnnChart(bnn, opts = {}) {
  const style = opts.style === 'north' ? 'north' : 'south'
  return style === 'north' ? buildNorthBnn(bnn, opts.meta) : buildSouthBnn(bnn, opts.meta)
}
