// render.js — BNN chart drawing (Phase 2b) + transit ring (Phase 7).
// Text INSIDE the chart is English only (repo rule), matching the old
// software's outer face: planet codes (SUN MOO MAR …) with '#' for
// retrograde, red cusp numbers with degrees ("09 11.31"), an "ASC 12.53"
// marker, the centre panel (name / place / date+weekday / age /
// nakshatra-pada / tithi / yoga) and the exchange label (MERCURY<>SATURN).
// Two styles: south (fixed rashi grid) + north (diamond houses).
// Spec: docs/bnn-guide.txt → Phase 2; layout reference: old software outer
// face (screenshots; see docs/bnn-calib-findings.md §5).
import { GRAHAS, t } from '../i18n.js'
import { astronomyPartners, bhavaCombinations, labelSuffix, planetCombinations, seatPositions } from './combos.js'
import { fmtDMY } from './dasha.js'
import { computeBrsss, computePrsss } from './prsss.js'
import { entryColour, specialTables } from './special.js'

const NS = 'http://www.w3.org/2000/svg'
const SIZE = 360 // svg viewBox is 0 0 360 360; CSS scales it responsively
const RED = '#c62828'
const INK = '#3a2410'
const ACC = '#a94f05'
const TRANSIT_RED = '#700000' // transit ring text (old-software colour)
const RING_MARGIN = 64 // extra viewBox space around the chart for the transit ring

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
const hashOf = (key, retro) => (retro && key !== 'rahu' && key !== 'ketu' ? '#' : '')

/** Uppercase code for display (centre panel lines etc.). */
export const planetCode = (key) => CODE[key] || String(key).toUpperCase()

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

// Transit-ring variant: arcminutes ROUNDED (calibrated against the old face's
// outside numbers, e.g. its "ASC 28.01" = 28°00.9′ — findings §8).
export function degDotR(deg) {
  const total = Math.round(deg * 60)
  const d = Math.floor(total / 60)
  const m = total % 60
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

// ---------------------------------------------------------------------------
// Keep a north-style house block OUT of the centre panel (user correction
// 2026-10-07 — bhava name & planets were spilling into the panel). Estimated
// text box (jsdom-safe char-count approximation), pushed along the shortest
// axis that clears the panel.
// ---------------------------------------------------------------------------
const PANEL_HALF = 83 // the centre panel rect: 180 ± 83, both axes
function estimateBlockBox(lines, cx, cy) {
  const h = lines.reduce((a, l) => a + l.size * 1.2, 0)
  const w = Math.max(16, ...lines.map((l) => l.text.length * l.size * 0.62))
  return { l: cx - w / 2, r: cx + w / 2, t: cy - h / 2, b: cy + h / 2 }
}
function avoidCentrePanel(lines, cx, cy) {
  const m = 6
  const P = { l: 180 - PANEL_HALF, t: 180 - PANEL_HALF, r: 180 + PANEL_HALF, b: 180 + PANEL_HALF }
  const box = estimateBlockBox(lines, cx, cy)
  if (box.r <= P.l - m || box.l >= P.r + m || box.b <= P.t - m || box.t >= P.b + m) return { cx, cy }
  const options = [
    { cx: cx - (box.r - (P.l - m)), cy },
    { cx: cx + ((P.r + m) - box.l), cy },
    { cx, cy: cy - (box.b - (P.t - m)) },
    { cx, cy: cy + ((P.b + m) - box.t) },
  ]
  let best = null
  for (const o of options) {
    const b2 = estimateBlockBox(lines, o.cx, o.cy)
    const clear = b2.r <= P.l - m || b2.l >= P.r + m || b2.b <= P.t - m || b2.t >= P.b + m
    if (!clear) continue
    const d = Math.hypot(o.cx - cx, o.cy - cy)
    if (!best || d < best.d) best = { cx: o.cx, cy: o.cy, d }
  }
  return best || { cx, cy }
}

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
    { text: meta.dashaText, size: 9.5 },
    { text: meta.bhuktiText, size: 9.5 },
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
// Transit ring (Phase 7) — the old face shows the transit planets and the
// transit ascendant OUTSIDE the chart, next to their sign's side (left / right
// / top / bottom), stacked and sorted by degree. Numbers round to the
// arcminute (degDotR — calibrated). Hidden when no transit is provided.
// ---------------------------------------------------------------------------
function transitGroups(transit, sideOf) {
  const byRashi = new Map()
  for (const p of [...transit.planets, transit.ascendant]) {
    if (!byRashi.has(p.rashi)) byRashi.set(p.rashi, [])
    byRashi.get(p.rashi).push(p)
  }
  const groups = []
  for (const [rashi, list] of byRashi) {
    list.sort((a, b) => a.degInSign - b.degInSign)
    const { side, u } = sideOf(rashi)
    groups.push({ side, u, list })
  }
  return groups
}

const southSideOf = (rashi) => {
  const [col, row] = S_CELLS[rashi]
  const side = col === 0 ? 'left' : col === 3 ? 'right' : row === 0 ? 'top' : 'bottom'
  const u = side === 'top' || side === 'bottom' ? (col + 0.5) * 90 : (row + 0.5) * 90
  return { side, u }
}
const northSideOf = (ascRashi) => (rashi) => {
  const region = ((rashi - ascRashi + 12) % 12) + 1
  const [fx, fy] = N_CENTERS[region - 1]
  const side = fx <= 0.3 ? 'left' : fx >= 0.7 ? 'right' : fy < 0.5 ? 'top' : 'bottom'
  const u = side === 'top' || side === 'bottom' ? fx * 360 : fy * 360
  return { side, u }
}

function drawTransitRing(svg, bnn, transit, style) {
  if (!transit) return
  const sideOf = style === 'north' ? northSideOf(bnn.ascendant.rashi) : southSideOf
  const ring = el('g', { class: 'transit-ring' })
  for (const g of transitGroups(transit, sideOf)) {
    const n = g.list.length
    g.list.forEach((p, i) => {
      const code = p.key === 'asc' ? 'ASC' : CODE[p.key]
      const text = `${code}${hashOf(p.key, p.retro)} ${degDotR(p.degInSign)}`
      let x
      let y
      let anchor = 'middle'
      if (g.side === 'left' || g.side === 'right') {
        x = g.side === 'left' ? -6 : 366
        y = g.u + (i - (n - 1) / 2) * 11.5
        anchor = g.side === 'left' ? 'end' : 'start'
      } else if (g.side === 'top') {
        x = g.u
        y = -10 - (n - 1 - i) * 11.5
      } else {
        x = g.u
        y = 371 + i * 11.5
      }
      ring.append(textNode(x, y, text, { size: 10, weight: 600, anchor, fill: TRANSIT_RED }))
    })
  }
  svg.append(ring)
}

// ---------------------------------------------------------------------------
// SOUTH style — fixed 4×4 rashi grid (same geometry as the main app's chart)
// ---------------------------------------------------------------------------
export function buildSouthBnn(bnn, meta = {}, transit = null) {
  const S = SIZE
  const C = S / 4
  const svg = el('svg', {
    viewBox: transit
      ? `${-RING_MARGIN} ${-RING_MARGIN} ${S + 2 * RING_MARGIN} ${S + 2 * RING_MARGIN}`
      : `0 0 ${S} ${S}`,
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

  // Lagna mark (user request 2026-10-07): two short horizontal bars at the
  // top-left inside edge of the ascendant's cell — the lagua reads at a
  // glance (in addition to the "ASC …" text).
  {
    const [lagnaCol, lagnaRow] = S_CELLS[ascRashi]
    const marks = el('g', { class: 'lagna-mark' })
    const x0 = lagnaCol * C + 7
    const y0 = lagnaRow * C + 8
    for (const dy of [0, 6]) {
      marks.append(el('line', {
        x1: x0, y1: y0 + dy, x2: x0 + C * 0.3, y2: y0 + dy,
        stroke: '#5a3410', 'stroke-width': 2.4, 'stroke-linecap': 'round',
      }))
    }
    svg.append(marks)
  }

  const panel = el('g', { class: 'center-panel' })
  layoutLines(panel, S / 2, S / 2, metaLines(meta))
  svg.append(panel)

  drawTransitRing(svg, bnn, transit, 'south')
  return svg
}

// ---------------------------------------------------------------------------
// NORTH style — diamond (fixed houses; region n = the ascendant's nth sign)
// ---------------------------------------------------------------------------
export function buildNorthBnn(bnn, meta = {}, transit = null) {
  const S = SIZE
  const svg = el('svg', {
    viewBox: transit
      ? `${-RING_MARGIN} ${-RING_MARGIN} ${S + 2 * RING_MARGIN} ${S + 2 * RING_MARGIN}`
      : `0 0 ${S} ${S}`,
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
    if (block.length > 0) {
      const { cx, cy } = avoidCentrePanel(block, fx * S, fy * S)
      layoutLines(group, cx, cy, block)
    }
    svg.append(group)
  }

  const panel = el('g', { class: 'center-panel' })
  layoutLines(panel, S / 2, S / 2, metaLines(meta))
  svg.append(panel)

  drawTransitRing(svg, bnn, transit, 'north')
  return svg
}

/** Draw the BNN chart in the given style ('south' default — the old face). */
export function buildBnnChart(bnn, opts = {}) {
  const style = opts.style === 'north' ? 'north' : 'south'
  const transit = opts.transit || null
  return style === 'north' ? buildNorthBnn(bnn, opts.meta, transit) : buildSouthBnn(bnn, opts.meta, transit)
}

// ---------------------------------------------------------------------------
// Combination tables (Phase 5 — tabbed view; corrected 2026-10-07 per user).
// Two tables — BHAVA first, then PLANET. Each shows ONE tab at a time:
//   bhava tabs:  1-5-9 · 1-5-7-9 · BRSSS · SPECIAL (LORD · PLANETS(A) ·
//   IN STAR OF A · LORDSHIP — the guru-software layout, user 2026-10-07)
//   planet tabs: 1-5-7-9 · 1-5-9 · SPECIAL · PRSSS
// Colours per R17; labels carry the seat-based closeness suffix; the planet
// views' last column = the progression partner (first met, no header label —
// the word "ASTRONOMY" is not used).
// ---------------------------------------------------------------------------
const ENT_CLASS = { blue: 'ent-blue', green: 'ent-green', orange: 'ent-orange' }
const rowLabel = (p, seatLon, cusps) => `${CODE[p.key]}${hashOf(p.key, p.retro)}-${labelSuffix(seatLon, cusps).value}`
const entText = (e) =>
  e.type === 'planet'
    ? `${CODE[e.key]}${hashOf(e.key, e.natalRetro)}-${Math.round(e.percent)}`
    : `${e.label}-${Math.round(e.percent)}`
const entClass = (e, i) => ENT_CLASS[entryColour(e.percent, i === 0, e.type === 'planet' ? e.key : null)]

function el2(tag, cls, text) {
  const node = document.createElement(tag)
  if (cls) node.className = cls
  if (text !== undefined) node.textContent = text
  return node
}

function entCell(e, i) {
  const td = el2('td')
  if (e) {
    td.textContent = entText(e)
    td.className = entClass(e, i)
  }
  return td
}

const cell = (text, cls) => el2('td', cls, text)
const th = (text) => el2('th', null, text)

function legendLine() {
  return el2('p', 'bnn-legend', t('bnn.legend'))
}

function tabBar(defs, onSelect) {
  const bar = el2('div', 'bnn-tabs')
  const buttons = new Map()
  for (const d of defs) {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = d.label
    b.addEventListener('click', () => onSelect(d.key))
    buttons.set(d.key, b)
    bar.append(b)
  }
  return {
    bar,
    setActive: (key) => {
      for (const [k, b] of buttons) b.classList.toggle('active', k === key)
    },
  }
}

const PLANET_ORDER = ['jupiter', 'sun', 'moon', 'mars', 'mercury', 'venus', 'saturn', 'rahu', 'ketu']
const B_ORDER = Array.from({ length: 12 }, (_, i) => i + 1)
const bLabel = (n) => `B${String(n).padStart(2, '0')}`

/** BHAVA COMBINATION table (tabs: 1-5-9 · 1-5-7-9 · BRSSS · SPECIAL). */
export function buildBhavaTables(bnn, mode) {
  const { planets, cusps } = bnn
  const bc = bhavaCombinations(planets, cusps, mode)
  const sp = specialTables(planets, cusps, mode)

  const section = el2('div', 'bnn-section')
  section.append(el2('h3', 'bnn-table-title', `BHAVA COMBINATION — NATAL — ${mode}`))
  const content = el2('div', 'bnn-tab-content')

  const max9 = Math.max(...B_ORDER.map((n) => bc[n].list159.length))
  const max7 = Math.max(...B_ORDER.map((n) => bc[n].list1579.length))

  const listView = (key, max) => () => {
    const tbl = el2('table', 'bnn-table bnn-bhava-table')
    for (const n of B_ORDER) {
      const row = document.createElement('tr')
      row.append(el2('td', 'row-label', bLabel(n)))
      for (let i = 0; i < max; i++) row.append(entCell(bc[n][key][i], i))
      tbl.append(row)
    }
    return tbl
  }
  const brsssView = () => {
    const tbl = el2('table', 'bnn-table bnn-bhava-table')
    for (const n of B_ORDER) {
      const row = document.createElement('tr')
      row.append(el2('td', 'row-label', bLabel(n)))
      for (const link of computeBrsss(cusps[n - 1].longitude)) row.append(cell(CODE[link]))
      tbl.append(row)
    }
    return tbl
  }
  const specialView = () => {
    // Guru's software layout (user correction 2026-10-07): BHAVA · LORD ·
    // PLANETS(A) · IN STAR OF A · LORDSHIP (= the planet giving the result).
    const tbl = el2('table', 'bnn-table bnn-bhava-table')
    const hr = document.createElement('tr')
    hr.append(th(''), th('LORD'), th('PLANETS(A)'), th('IN STAR OF A'), th('LORDSHIP'))
    tbl.append(hr)
    const retroOf = Object.fromEntries(planets.map((p) => [p.key, p.retro]))
    const ent = (k) => `${CODE[k]}${hashOf(k, retroOf[k])}`
    for (const n of B_ORDER) {
      const row = document.createElement('tr')
      row.append(el2('td', 'row-label', bLabel(n)))
      row.append(cell(CODE[sp.lords[n]]))
      row.append(cell(sp.inBhava[n].length ? sp.inBhava[n].map((e) => `${CODE[e.key]}${hashOf(e.key, e.natalRetro)}`).join(', ') : '—'))
      row.append(cell(sp.inStarOf[n].length ? sp.inStarOf[n].map(ent).join(', ') : '—'))
      row.append(cell(ent(sp.directors[n])))
      tbl.append(row)
    }
    return tbl
  }

  const views = { '159': listView('list159', max9), '1579': listView('list1579', max7), brsss: brsssView, special: specialView }
  let active = '159'
  const bar = tabBar(
    [
      { key: '159', label: '1-5-9' },
      { key: '1579', label: '1-5-7-9' },
      { key: 'brsss', label: 'BRSSS' },
      { key: 'special', label: 'SPECIAL' },
    ],
    (k) => {
      active = k
      render()
    }
  )
  const render = () => {
    content.replaceChildren(views[active]())
    bar.setActive(active)
  }
  section.append(bar.bar, content)
  render()
  section.append(legendLine())
  return section
}

/** PLANET COMBINATION table (tabs: 1-5-7-9 · 1-5-9 · SPECIAL · PRSSS). */
export function buildPlanetTables(bnn, mode) {
  const { planets, cusps } = bnn
  const pc = planetCombinations(planets, mode, { cusps })
  const sp = specialTables(planets, cusps, mode)
  const astro = astronomyPartners(planets, mode)
  const seats = seatPositions(planets, mode)
  const byKey = Object.fromEntries(planets.map((p) => [p.key, p]))

  const section = el2('div', 'bnn-section')
  section.append(el2('h3', 'bnn-table-title', `PLANET COMBINATION — NATAL — ${mode}`))
  const content = el2('div', 'bnn-tab-content')

  const max7 = Math.max(...PLANET_ORDER.map((k) => pc[k].list1579.length))
  const max9 = Math.max(...PLANET_ORDER.map((k) => pc[k].list159.length))

  const listView = (key, max) => () => {
    // Fixed frame (user, 2026-10-07): seven combination columns + the
    // progression planet ALWAYS in the 9th column — so it can never be
    // mistaken for a combination member, in both the 1-5-9 and 1-5-7-9 tabs.
    const cols = Math.max(7, max)
    const tbl = el2('table', 'bnn-table bnn-planet-table')
    const hr = document.createElement('tr')
    for (let i = 0; i < cols + 2; i++) hr.append(th('')) // label + combos + progression (no header labels)
    tbl.append(hr)
    for (const pkey of PLANET_ORDER) {
      const p = byKey[pkey]
      const row = document.createElement('tr')
      row.append(el2('td', 'row-label', rowLabel(p, seats[pkey].lon, cusps)))
      const list = pc[pkey][key]
      for (let i = 0; i < cols; i++) row.append(entCell(list[i], i))
      const partner = astro[pkey] ? byKey[astro[pkey]] : null
      row.append(partner ? el2('td', 'ent-pink', `${CODE[partner.key]}${hashOf(partner.key, partner.retro)}`) : el2('td', null, '—'))
      tbl.append(row)
    }
    return tbl
  }
  const specialView = () => {
    // Guru-software layout (user correction, 2026-10-07): the star's lordship
    // (star के फल) is its own column — [Lord · sits → gives · STAR · LORDSHIP].
    const tbl = el2('table', 'bnn-table bnn-planet-table')
    const hr = document.createElement('tr')
    hr.append(th(''), th('Lord'), th('sits → gives'), th('STAR'), th('LORDSHIP'))
    tbl.append(hr)
    for (const pkey of PLANET_ORDER) {
      const p = byKey[pkey]
      const r = sp.rows[pkey]
      const row = document.createElement('tr')
      row.append(el2('td', 'row-label', rowLabel(p, seats[pkey].lon, cusps)))
      row.append(cell(r.owns.length ? r.owns.join(',') : '—'))
      row.append(cell(`${String(r.sitsAt).padStart(2, '0')} → ${r.gives.length ? r.gives.join(',') : '—'}`))
      row.append(cell(`${CODE[r.starLord]} - ${r.starAt}`))
      row.append(cell(r.starGives.length ? r.starGives.join(',') : '—'))
      tbl.append(row)
    }
    return tbl
  }
  const prsssView = () => {
    const tbl = el2('table', 'bnn-table bnn-planet-table')
    for (const pkey of PLANET_ORDER) {
      const p = byKey[pkey]
      const row = document.createElement('tr')
      row.append(el2('td', 'row-label', rowLabel(p, seats[pkey].lon, cusps)))
      for (const link of computePrsss(p.longitude)) row.append(cell(CODE[link]))
      tbl.append(row)
    }
    return tbl
  }

  const views = { '1579': listView('list1579', max7), '159': listView('list159', max9), special: specialView, prsss: prsssView }
  let active = '1579'
  const bar = tabBar(
    [
      { key: '1579', label: '1-5-7-9' },
      { key: '159', label: '1-5-9' },
      { key: 'special', label: 'SPECIAL' },
      { key: 'prsss', label: 'PRSSS' },
    ],
    (k) => {
      active = k
      render()
    }
  )
  const render = () => {
    content.replaceChildren(views[active]())
    bar.setActive(active)
  }
  section.append(bar.bar, content)
  render()
  section.append(legendLine())
  return section
}

// ---------------------------------------------------------------------------
// Vimshottari tables (Phase 6): DHASA (nine end dates + age), BHUKTHI (of the
// running dasha), ANDHIRAM (of the running bhukthi). The running row is
// tinted. Values come from dasha.js (computed in main.js with the ephemeris).
// ---------------------------------------------------------------------------
const ageText = (a) => `${a.y}Y-${a.m}M-${a.d}D`

/** DHASA / BHUKTHI / ANDHIRAM tables (tabs). */
export function buildDashaTables(dasha) {
  const section = el2('div', 'bnn-section')
  section.append(el2('h3', 'bnn-table-title', 'VIMSHOTTARI — DHASA / BHUKTHI / ANDHIRAM'))
  const content = el2('div', 'bnn-tab-content')

  const listTable = (rows, runningIdx) => {
    const tbl = el2('table', 'bnn-table bnn-dasha-table')
    rows.forEach((r, i) => {
      const row = document.createElement('tr')
      if (i === runningIdx) row.className = 'row-running'
      if (r.blank) {
        row.className = `${row.className} row-blank`.trim()
        row.append(el2('td', 'dasha-lord', CODE[r.lord]), el2('td'), el2('td'))
      } else {
        row.append(el2('td', 'dasha-lord', CODE[r.lord]))
        row.append(el2('td', null, fmtDMY(r.endISO)))
        row.append(el2('td', null, ageText(r.age)))
      }
      tbl.append(row)
    })
    return tbl
  }
  const empty = () => {
    const p = el2('p', 'bnn-legend', '—')
    return p
  }

  const views = {
    dhasa: () => listTable(dasha.mahadashas, dasha.running.mahaIndex),
    bhukthi: () => (dasha.running.bhukthis ? listTable(dasha.running.bhukthis, dasha.running.bhukthiIndex) : empty()),
    andhiram: () => (dasha.running.andhirams ? listTable(dasha.running.andhirams, dasha.running.andhiramIndex) : empty()),
  }
  let active = 'dhasa'
  const bar = tabBar(
    [
      { key: 'dhasa', label: 'DHASA' },
      { key: 'bhukthi', label: 'BHUKTHI' },
      { key: 'andhiram', label: 'ANDHIRAM' },
    ],
    (k) => {
      active = k
      render()
    }
  )
  const render = () => {
    content.replaceChildren(views[active]())
    bar.setActive(active)
  }
  section.append(bar.bar, content)
  render()
  section.append(el2('p', 'bnn-legend', t('bnn.dashaNote')))
  return section
}
