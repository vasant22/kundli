// charts.js — SVG birth charts (Phase 7).
// ENGLISH ONLY text inside the charts: planet abbreviations
// (Su Mo Ma Me Ju Ve Sa Ra Ke, "(R)" = retrograde), "Asc", rashi numbers 1-12.
// Both charts are drawn from the same kundli data object (src/astro.js).

const NS = 'http://www.w3.org/2000/svg'
const SIZE = 360 // svg viewBox is 0 0 360 360; CSS scales it responsively

// Precomputed centre of each of the 12 North-Indian house regions
// (fractions of the square). House 1 top-centre, going ANTI-clockwise.
const N_HOUSE_CENTERS = [
  [0.5, 0.25], // 1 — top centre
  [0.25, 0.12], // 2 — top left
  [0.12, 0.25], // 3 — left upper
  [0.25, 0.5], // 4 — left centre
  [0.12, 0.75], // 5 — left lower
  [0.25, 0.88], // 6 — bottom left
  [0.5, 0.75], // 7 — bottom centre
  [0.75, 0.88], // 8 — bottom right
  [0.88, 0.75], // 9 — right lower
  [0.75, 0.5], // 10 — right centre
  [0.88, 0.25], // 11 — right upper
  [0.75, 0.12], // 12 — top right
]

// South-Indian fixed layout: rashi index (0 = Aries) → [col, row] in the 4×4 grid.
const S_RASHI_CELLS = [
  [1, 0], // Aries
  [2, 0], // Taurus
  [3, 0], // Gemini
  [3, 1], // Cancer
  [3, 2], // Leo
  [3, 3], // Virgo
  [2, 3], // Libra
  [1, 3], // Scorpio
  [0, 3], // Sagittarius
  [0, 2], // Capricorn
  [0, 1], // Aquarius
  [0, 0], // Pisces
]

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
  return node
}

function textNode(x, y, content, { size = 13, weight = 400, anchor = 'middle', fill = '#3a2410' } = {}) {
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

// Planet labels for one body: short code + (R) when retrograde.
function labelOf(planet) {
  return planet.short + (planet.retro ? '(R)' : '')
}

const gray = (count) => (count >= 6 ? 9.5 : count >= 4 ? 11 : 13)

// ---------------------------------------------------------------------------
// NORTH INDIAN (diamond) chart
// ---------------------------------------------------------------------------
export function buildNorthChart(kundli) {
  const S = SIZE
  const svg = el('svg', {
    viewBox: `0 0 ${S} ${S}`,
    class: 'chart chart-north',
    'data-chart': 'north',
    role: 'img',
    'aria-label': 'North Indian birth chart',
  })

  const lines = el('g', { stroke: '#5a3410', 'stroke-width': 1.4, fill: 'none' })
  lines.append(el('rect', { x: 0, y: 0, width: S, height: S }))
  lines.append(el('line', { x1: 0, y1: 0, x2: S, y2: S }))
  lines.append(el('line', { x1: S, y1: 0, x2: 0, y2: S }))
  lines.append(el('polygon', { points: `${S / 2},0 ${S},${S / 2} ${S / 2},${S} 0,${S / 2}` }))
  svg.append(lines)

  const ascRashi = kundli.ascendant.rashi
  for (let house = 1; house <= 12; house++) {
    const [fx, fy] = N_HOUSE_CENTERS[house - 1]
    const cx = fx * S
    const cy = fy * S

    const rashiNumber = ((ascRashi + house - 1) % 12) + 1
    const occupants = kundli.planets.filter((p) => p.house === house).map(labelOf)

    const group = el('g', { class: 'house', 'data-house': String(house) })
    const block = [{ text: String(rashiNumber), size: 12, weight: 600 }]
    if (house === 1) block.push({ text: 'Asc', size: 10.5, weight: 600, fill: '#a94f05' })
    const size = gray(occupants.length)
    const perLine = occupants.length <= 2 ? 2 : 3
    for (let i = 0; i < occupants.length; i += perLine) {
      block.push({ text: occupants.slice(i, i + perLine).join(' '), size })
    }
    layoutLines(group, cx, cy, block)
    svg.append(group)
  }
  return svg
}

// ---------------------------------------------------------------------------
// SOUTH INDIAN (fixed rashi grid) chart
// ---------------------------------------------------------------------------
export function buildSouthChart(kundli, meta = {}) {
  const S = SIZE
  const C = S / 4
  const svg = el('svg', {
    viewBox: `0 0 ${S} ${S}`,
    class: 'chart chart-south',
    'data-chart': 'south',
    role: 'img',
    'aria-label': 'South Indian birth chart',
  })

  const grid = el('g', { stroke: '#5a3410', 'stroke-width': 1.4, fill: 'none' })
  grid.append(el('rect', { x: 0, y: 0, width: S, height: S }))
  for (const k of [1, 2, 3]) {
    grid.append(el('line', { x1: k * C, y1: 0, x2: k * C, y2: C })) // top row verticals
    grid.append(el('line', { x1: k * C, y1: 3 * C, x2: k * C, y2: 4 * C })) // bottom row verticals
    grid.append(el('line', { x1: 0, y1: k * C, x2: C, y2: k * C })) // left column horizontals
    grid.append(el('line', { x1: 3 * C, y1: k * C, x2: 4 * C, y2: k * C })) // right column horizontals
  }
  grid.append(el('rect', { x: C, y: C, width: 2 * C, height: 2 * C })) // centre box
  svg.append(grid)

  const ascRashi = kundli.ascendant.rashi
  for (let rashi = 0; rashi < 12; rashi++) {
    const [col, row] = S_RASHI_CELLS[rashi]
    const group = el('g', {
      class: 'cell',
      'data-rashi': String(rashi),
      transform: `translate(${col * C}, ${row * C})`,
    })

    const block = []
    if (rashi === ascRashi) {
      // Diagonal line in the corner + "Asc" — the lagna mark.
      group.append(
        el('line', {
          class: 'lagna-mark',
          x1: 0,
          y1: 0.32 * C,
          x2: 0.32 * C,
          y2: 0,
          stroke: '#a94f05',
          'stroke-width': 2,
        })
      )
      block.push({ text: 'Asc', size: 11, weight: 600, fill: '#a94f05' })
    }

    const occupants = kundli.planets.filter((p) => p.rashi === rashi).map(labelOf)
    const size = gray(occupants.length)
    for (let i = 0; i < occupants.length; i += 2) {
      block.push({ text: occupants.slice(i, i + 2).join(' '), size })
    }
    layoutLines(group, C / 2, C / 2, block)
    svg.append(group)
  }

  // Centre box: Name / date / time / place, in English (blank if absent).
  const info = [meta.name, meta.dateText, meta.timeText, meta.placeText].filter(Boolean)
  if (info.length > 0) {
    const wrapped = []
    for (const item of info) {
      if (item.length > 22) {
        const words = item.split(' ')
        let line = ''
        for (const word of words) {
          if ((line + ' ' + word).trim().length > 22) {
            wrapped.push(line.trim())
            line = word
          } else {
            line = `${line} ${word}`
          }
        }
        if (line.trim()) wrapped.push(line.trim())
      } else {
        wrapped.push(item)
      }
    }
    const group = el('g', { class: 'center-info' })
    layoutLines(
      group,
      S / 2,
      S / 2,
      wrapped.map((line, i) => ({ text: line, size: i === 0 && meta.name ? 12 : 11 }))
    )
    svg.append(group)
  }

  return svg
}
