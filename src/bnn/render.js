// render.js — BNN chart drawing (Phase 2b).
// Text INSIDE the chart is English only (repo rule), matching the old
// software's outer face: planet codes (SUN MOO MAR …) with '#' for
// retrograde, red cusp numbers with degrees ("09 11.31"), an "ASC 12.53"
// marker, the centre panel (name / place / date+weekday / age /
// nakshatra-pada / tithi / yoga) and the exchange label (MERCURY<>SATURN).
// Two styles: south (fixed rashi grid) + north (diamond houses).
// Spec: docs/bnn-guide.txt → Phase 2; layout reference: old software outer
// face (screenshots; see docs/bnn-calib-findings.md §5).
import { GRAHAS, t } from '../i18n.js'
import { astronomyPartners, bhavaCombinations, labelSuffix, planetCombinations } from './combos.js'
import { computeBrsss, computePrsss } from './prsss.js'
import { entryColour, specialTables } from './special.js'

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

// ---------------------------------------------------------------------------
// Combination tables (Phase 5). Rendered in the old face's style (English
// codes + rounded percentages) with the R17 colour legend; the row label
// carries the closeness-to-own-bhava suffix (labelSuffix).
// ---------------------------------------------------------------------------
const ENT_CLASS = { blue: 'ent-blue', green: 'ent-green', orange: 'ent-orange' }
const hashOf = (key, retro) => (retro && key !== 'rahu' && key !== 'ketu' ? '#' : '')
const rowLabelText = (p, cusps) => `${CODE[p.key]}${hashOf(p.key, p.retro)}-${labelSuffix(p.longitude, cusps).value}`
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

function legendLine() {
  return el2('p', 'bnn-legend', t('bnn.legend'))
}

const PLANET_ORDER = ['jupiter', 'sun', 'moon', 'mars', 'mercury', 'venus', 'saturn', 'rahu', 'ketu']

/** PLANET COMBINATION table (columns: 1-5-7-9 · 1-5-9 · SPECIAL · PRSSS · ASTRONOMY). */
export function buildPlanetTables(bnn, mode) {
  const { planets, cusps } = bnn
  const pc = planetCombinations(planets, mode)
  const sp = specialTables(planets, cusps, mode)
  const astro = astronomyPartners(planets, mode)
  const byKey = Object.fromEntries(planets.map((p) => [p.key, p]))

  const section = el2('div', 'bnn-section')
  section.append(el2('h3', 'bnn-table-title', `PLANET COMBINATION — NATAL — ${mode}`))

  const max7 = Math.max(...PLANET_ORDER.map((k) => pc[k].list1579.length))
  const max9 = Math.max(...PLANET_ORDER.map((k) => pc[k].list159.length))

  const table = el2('table', 'bnn-table bnn-planet-table')
  const thead = document.createElement('thead')
  const hrow = document.createElement('tr')
  hrow.append(el2('th', null, ''), el2('th', null, '1-5-7-9'), el2('th', null, '1-5-9'), el2('th', null, 'SPECIAL'))
  const prsssTh = el2('th', null, 'PRSSS')
  prsssTh.colSpan = 5
  hrow.append(prsssTh, el2('th', null, 'ASTRONOMY'))
  thead.append(hrow)
  table.append(thead)

  const tbody = document.createElement('tbody')
  for (const key of PLANET_ORDER) {
    const p = byKey[key]
    const row = document.createElement('tr')
    row.append(el2('td', 'row-label', rowLabelText(p, cusps)))
    const l7 = pc[key].list1579
    const l9 = pc[key].list159
    for (let i = 0; i < max7; i++) row.append(entCell(l7[i], i))
    for (let i = 0; i < max9; i++) row.append(entCell(l9[i], i))
    const r = sp.rows[key]
    const spec = el2('td', 'special')
    spec.append(
      el2('div', null, `Lord ${r.owns.length ? r.owns.join(',') : '—'}`),
      el2('div', null, `${String(r.sitsAt).padStart(2, '0')} → ${r.gives.length ? r.gives.join(',') : '—'}`),
      el2('div', null, `★ ${CODE[r.starLord]}-${r.starAt}${r.starGives.length ? ' → ' + r.starGives.join(',') : ''}`)
    )
    row.append(spec)
    for (const link of computePrsss(p.longitude)) row.append(el2('td', null, CODE[link]))
    const ast = el2('td', 'ent-pink', astro[key] ? CODE[astro[key]] : '—')
    row.append(ast)
    tbody.append(row)
  }
  table.append(tbody)
  section.append(table, legendLine())
  return section
}

/** BHAVA COMBINATION table (columns: 1-5-9 · 1-5-7-9 · BRSSS · SPECIAL). */
export function buildBhavaTables(bnn, mode) {
  const { planets, cusps } = bnn
  const bc = bhavaCombinations(planets, cusps, mode)
  const sp = specialTables(planets, cusps, mode)

  const section = el2('div', 'bnn-section')
  section.append(el2('h3', 'bnn-table-title', `BHAVA COMBINATION — NATAL — ${mode}`))

  const max9 = Math.max(...Array.from({ length: 12 }, (_, i) => bc[i + 1].list159.length))
  const max7 = Math.max(...Array.from({ length: 12 }, (_, i) => bc[i + 1].list1579.length))

  const table = el2('table', 'bnn-table bnn-bhava-table')
  const thead = document.createElement('thead')
  const hrow = document.createElement('tr')
  hrow.append(el2('th', null, ''), el2('th', null, '1-5-9'), el2('th', null, '1-5-7-9'))
  const brTh = el2('th', null, 'BRSSS')
  brTh.colSpan = 5
  hrow.append(brTh, el2('th', null, 'SPECIAL'))
  thead.append(hrow)
  table.append(thead)

  const tbody = document.createElement('tbody')
  for (let n = 1; n <= 12; n++) {
    const row = document.createElement('tr')
    row.append(el2('td', 'row-label', `B${String(n).padStart(2, '0')}`))
    for (let i = 0; i < max9; i++) row.append(entCell(bc[n].list159[i], i))
    for (let i = 0; i < max7; i++) row.append(entCell(bc[n].list1579[i], i))
    for (const link of computeBrsss(cusps[n - 1].longitude)) row.append(el2('td', null, CODE[link]))
    const spec = el2('td', 'special')
    spec.append(
      el2('div', null, `Director: ${CODE[sp.directors[n]]}`),
      el2('div', null, `IN STAR OF A: ${sp.inStarOf[n].length ? sp.inStarOf[n].map((k) => CODE[k]).join(', ') : '—'}`)
    )
    row.append(spec)
    tbody.append(row)
  }
  table.append(tbody)
  section.append(table, legendLine())
  return section
}
