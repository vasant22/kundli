// allchart.js — "All Chart" PNG export (user request 2026-10-07).
// Builds ONE wide SVG (1680×1080): the chart the user is viewing (current
// north/south style, with the transit ring) on the left; on the right the two
// combination views currently open in the browser (bhava tab + planet tab) and
// the running dhasa/bhukthi/andhiram strip. The page rasterizes this SVG to a
// PNG download (see main.js) — handy for phaladesh work on a single sheet.
import { findExchanges } from './kp.js'
import { astronomyPartners, bhavaCombinations, labelSuffix, planetCombinations, seatPositions } from './combos.js'
import { computeBrsss, computePrsss } from './prsss.js'
import { specialTables } from './special.js'
import { buildBnnChart, planetCode, planetRowOrder } from './render.js'
import { fmtDMY } from './dasha.js'

const NS = 'http://www.w3.org/2000/svg'
const HASH = (key, retro) => (retro && key !== 'rahu' && key !== 'ketu' ? '#' : '')
const INK = '#3a2410'
const RED = '#b3261e'
const ORANGE = '#b0470a'
const GREY = '#6b5b3a'

function el(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

function text(parent, x, y, str, { size = 15, weight = 400, anchor = 'start', fill = INK } = {}) {
  const t = el('text', { x, y, 'font-size': size, 'font-weight': weight, 'text-anchor': anchor, fill })
  t.textContent = String(str)
  parent.append(t)
  return t
}

// A bordered grid drawn directly in SVG. `rows` = array of cell arrays;
// each cell: { t, color?, bold?, fill?, align? }.
function tableBlock(parent, x, y, { title, colWidths, rows, rowH = 27, fontSize = 14.5 }) {
  if (title) text(parent, x + 1, y - 9, title, { size: 16.5, weight: 700, fill: ORANGE })
  let cy = y
  for (const row of rows) {
    let cx = x
    row.forEach((cell, i) => {
      const w = colWidths[i]
      parent.append(el('rect', {
        x: cx, y: cy, width: w, height: rowH,
        fill: cell.fill || '#fffdf7', stroke: '#cbb98d', 'stroke-width': 1,
      }))
      const cxx = cell.align === 'left' ? cx + 7 : cx + w / 2
      text(parent, cxx, cy + rowH * 0.68, cell.t ?? '', {
        size: fontSize,
        weight: cell.bold ? 700 : 400,
        anchor: cell.align === 'left' ? 'start' : 'middle',
        fill: cell.color || INK,
      })
      cx += w
    })
    cy += rowH
  }
  return cy
}

const entText = (e) => (e.type === 'planet'
  ? `${planetCode(e.key)}${HASH(e.key, e.natalRetro)}-${Math.round(e.percent)}`
  : `${e.label}-${Math.round(e.percent)}`)
const entColor = (e, i, saturnRule) => {
  if (i === 0) return '#1565c0'
  if (saturnRule && e.type === 'planet' && e.key === 'saturn') return '#2e7d32'
  return Math.round(e.percent) >= 20 ? '#2e7d32' : '#ef6c00'
}

/** Build the full "All Chart" SVG element (current views + running dasha). */
export function buildAllChartSvg(values) {
  const { bnn, bnnDasha, bnnMeta } = values
  const mode = values.bnnMode === 'BP' ? 'BP' : 'AP'
  const order = planetRowOrder(values.gender)
  const bhavaTab = values.bnnBhavaTab || '159'
  const planetTab = values.bnnPlanetTab || '1579'
  const pairs = findExchanges(bnn.planets)
  const byKey = Object.fromEntries(bnn.planets.map((p) => [p.key, p]))
  const seats = seatPositions(bnn.planets, mode)
  const suffixOf = (key) => `${planetCode(key)}${HASH(key, byKey[key].retro)}-${labelSuffix(seats[key].lon, bnn.cusps).value}`

  const W = 1680
  const H = 1080
  const svg = el('svg', {
    xmlns: NS,
    viewBox: `0 0 ${W} ${H}`,
    width: W,
    height: H,
    style: "font-family: 'Noto Sans Devanagari', -apple-system, 'Segoe UI', Roboto, sans-serif",
  })
  svg.append(el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fffdf7' }))

  // ---- header ----
  text(svg, 30, 44, `${bnnMeta?.name || ''} — BNN ALL CHART`, { size: 26, weight: 700 })
  if (pairs.length > 0) {
    const label = pairs.map(([a, b]) => `${a.toUpperCase()}<>${b.toUpperCase()}`).join('  ')
    text(svg, 30, 74, `${label} — ${mode === 'AP' ? 'AFTER' : 'BEFORE'} PARIVARDHANAI (${mode})`, { size: 16, fill: GREY })
  } else {
    text(svg, 30, 74, `PARIVARDHANAI (${mode})`, { size: 16, fill: GREY })
  }
  text(svg, W - 30, 40, 'mybapuji.com · BNN चार्ट', { size: 19, weight: 700, anchor: 'end', fill: ORANGE })
  if (values.transitInput) {
    text(svg, W - 30, 66, `गोचर / Transit: ${String(values.transitInput).replace('T', '  ')}`, { size: 13.5, anchor: 'end', fill: GREY })
  }

  // ---- left: the chart being viewed (with transit ring if present) ----
  const chart = buildBnnChart(bnn, { style: values.bnnStyle === 'north' ? 'north' : 'south', meta: bnnMeta, transit: values.bnnTransit })
  chart.setAttribute('x', 34)
  chart.setAttribute('y', 120)
  chart.setAttribute('width', 748)
  chart.setAttribute('height', 748)
  svg.append(chart)
  text(svg, 408, 902, values.bnnStyle === 'north' ? 'NORTH INDIAN STYLE' : 'SOUTH INDIAN STYLE', { size: 14, anchor: 'middle', fill: GREY })

  // ---- right: the two views currently open + running dasha ----
  const RX = 820
  let ty = 120

  // bhava side
  const bc = bhavaCombinations(bnn.planets, bnn.cusps, mode)
  if (bhavaTab === 'brsss') {
    const rows = []
    for (let n = 1; n <= 12; n++) {
      rows.push([{ t: `B${String(n).padStart(2, '0')}`, bold: true, color: RED, align: 'left', fill: '#faf6ea' },
        ...computeBrsss(bnn.cusps[n - 1].longitude).map((k) => ({ t: planetCode(k), bold: true }))])
    }
    ty = tableBlock(svg, RX, ty, { title: `BHAVA — BRSSS — ${mode}`, colWidths: [58, ...Array(5).fill(100)], rows })
  } else if (bhavaTab === 'special') {
    const sp = specialTables(bnn.planets, bnn.cusps, mode)
    const rows = [[
      { t: 'BHAVA', bold: true, fill: '#f7ecd5' }, { t: 'LORD', bold: true, fill: '#f7ecd5' },
      { t: 'PLANETS(A)', bold: true, fill: '#f7ecd5' }, { t: 'IN STAR OF A', bold: true, fill: '#f7ecd5' },
      { t: 'LORDSHIP', bold: true, fill: '#f7ecd5' },
    ]]
    for (let n = 1; n <= 12; n++) {
      rows.push([
        { t: `B${String(n).padStart(2, '0')}`, bold: true, color: RED, fill: '#faf6ea' },
        { t: planetCode(sp.lords[n]) },
        { t: sp.inBhava[n].length ? sp.inBhava[n].map((e) => `${planetCode(e.key)}${HASH(e.key, e.natalRetro)}`).join(', ') : '—' },
        { t: sp.inStarOf[n].length ? sp.inStarOf[n].map((k) => `${planetCode(k)}${HASH(k, byKey[k].retro)}`).join(', ') : '—' },
        { t: `${planetCode(sp.directors[n])}${HASH(sp.directors[n], byKey[sp.directors[n]].retro)}` },
      ])
    }
    ty = tableBlock(svg, RX, ty, { title: `BHAVA — SPECIAL — ${mode}`, colWidths: [58, 82, 218, 218, 100], rows })
  } else {
    const key = bhavaTab === '1579' ? 'list1579' : 'list159'
    const maxLen = Math.max(...Array.from({ length: 12 }, (_, i) => bc[i + 1][key].length))
    const rows = []
    for (let n = 1; n <= 12; n++) {
      const cells = [{ t: `B${String(n).padStart(2, '0')}`, bold: true, color: RED, align: 'left', fill: '#faf6ea' }]
      bc[n][key].forEach((e, i) => cells.push({ t: entText(e), color: entColor(e, i), bold: true }))
      while (cells.length < 1 + maxLen) cells.push({ t: '' })
      rows.push(cells)
    }
    // combo tables enlarged (user 2026-10-07e): use the right-hand space, easier to read
    const colW = Math.min(150, Math.floor((800 - 58) / maxLen))
    ty = tableBlock(svg, RX, ty, { title: `BHAVA COMBINATION — ${bhavaTab === '1579' ? '1-5-7-9' : '1-5-9'} — ${mode}`, colWidths: [58, ...Array(maxLen).fill(colW)], rows, rowH: 31, fontSize: 16 })
  }

  ty += 34

  // planet side
  const pc = planetCombinations(bnn.planets, mode, { cusps: bnn.cusps })
  if (planetTab === 'prsss') {
    const rows = []
    for (const pkey of order) {
      rows.push([{ t: suffixOf(pkey), bold: true, color: RED, align: 'left', fill: '#faf6ea' },
        ...computePrsss(byKey[pkey].longitude).map((k) => ({ t: planetCode(k), bold: true }))])
    }
    ty = tableBlock(svg, RX, ty, { title: `PLANET — PRSSS — ${mode}`, colWidths: [112, ...Array(5).fill(100)], rows })
  } else if (planetTab === 'special') {
    const sp = specialTables(bnn.planets, bnn.cusps, mode)
    const rows = [[
      { t: 'PLANET', bold: true, fill: '#f7ecd5' }, { t: 'LORD', bold: true, fill: '#f7ecd5' },
      { t: 'LORDSHIP', bold: true, fill: '#f7ecd5' }, { t: 'STAR', bold: true, fill: '#f7ecd5' },
      { t: 'LORDSHIP', bold: true, fill: '#f7ecd5' },
    ]]
    for (const pkey of order) {
      const r = sp.rows[pkey]
      rows.push([
        { t: suffixOf(pkey), bold: true, color: RED, fill: '#faf6ea' },
        { t: r.owns.length ? r.owns.join(',') : '—' },
        { t: `${String(r.sitsAt).padStart(2, '0')} → ${r.gives.length ? r.gives.join(',') : '—'}` },
        { t: `${planetCode(r.starLord)} - ${r.starAt}` },
        { t: r.starGives.length ? r.starGives.join(',') : '—' },
      ])
    }
    ty = tableBlock(svg, RX, ty, { title: `PLANET — SPECIAL — ${mode}`, colWidths: [112, 80, 140, 108, 120], rows })
  } else {
    const key = planetTab === '159' ? 'list159' : 'list1579'
    const maxLen = Math.max(...order.map((k) => pc[k][key].length))
    const astro = astronomyPartners(bnn.planets, mode)
    const rows = []
    for (const pkey of order) {
      const cells = [{ t: suffixOf(pkey), bold: true, color: RED, align: 'left', fill: '#faf6ea' }]
      pc[pkey][key].forEach((e, i) => cells.push({ t: entText(e), color: entColor(e, i), bold: true }))
      while (cells.length < 1 + maxLen) cells.push({ t: '' })
      const partner = astro[pkey]
      cells.push({ t: partner ? `${planetCode(partner)}${HASH(partner, byKey[partner].retro)}` : '—', color: '#8e24aa', bold: true })
      rows.push(cells)
    }
    const colW = Math.min(140, Math.floor((800 - 130 - 110) / maxLen))
    ty = tableBlock(svg, RX, ty, { title: `PLANET COMBINATION — ${planetTab === '159' ? '1-5-9' : '1-5-7-9'} — ${mode}`, colWidths: [130, ...Array(maxLen).fill(colW), 110], rows, rowH: 31, fontSize: 16 })
  }

  ty += 36

  // running dhasa / bhukthi strip
  if (bnnDasha && bnnDasha.running && bnnDasha.running.mahaIndex >= 0) {
    const m = bnnDasha.mahadashas[bnnDasha.running.mahaIndex]
    const b = bnnDasha.running.bhukthis ? bnnDasha.running.bhukthis[bnnDasha.running.bhukthiIndex] : null
    const a = bnnDasha.running.andhirams ? bnnDasha.running.andhirams[bnnDasha.running.andhiramIndex] : null
    const lines = [`${planetCode(m.lord)} DHASA: ${fmtDMY(m.startISO)} → ${fmtDMY(m.endISO)}`]
    if (b) lines.push(`${planetCode(b.lord)} BHUKTHI: ${fmtDMY(b.startISO)} → ${fmtDMY(b.endISO)}`)
    if (a) lines.push(`${planetCode(a.lord)} ANDHIRAM: ${fmtDMY(a.startISO)} → ${fmtDMY(a.endISO)}`)
    const boxH = 22 + lines.length * 24
    svg.append(el('rect', { x: RX, y: ty, width: 700, height: boxH, fill: '#fff8e1', stroke: '#e8cfa0' }))
    text(svg, RX + 10, ty + 20, 'चल रही दशा / RUNNING', { size: 14.5, weight: 700, fill: ORANGE })
    lines.forEach((line, i) => text(svg, RX + 10, ty + 44 + i * 24, line, { size: 15.5, weight: 600 }))
    ty += boxH + 10
  }

  // footer
  text(svg, W / 2, H - 16, 'mybapuji.com · निःशुल्क ज्योतिष साधन: कुंडली · कुंडली मिलान · पंचांग · BNN चार्ट', { size: 13.5, anchor: 'middle', fill: GREY })

  return svg
}

/** Rasterize a built sheet to a PNG download (browser only). */
export async function downloadAllChartPng(svg, name = 'chart') {
  const xml = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('SVG raster failed'))
      img.src = url
    })
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = 1680 * scale
    canvas.height = 1080 * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unavailable')
    ctx.fillStyle = '#fffdf7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `BNN-All-Chart-${String(name || 'chart').replace(/\s+/g, '-')}.png`
    document.body.append(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}
