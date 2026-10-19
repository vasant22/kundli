// tips.js — hover helpers for the /bnn/ page (user 2026-10-19):
//   • chart planet → coloured arrows to the houses it gives + ring on its own house
//   • planet popup → "STAR - house - LORDSHIP houses" (SPECIAL table values)
//   • bhava row (B01…B12) → pill with that bhava's lord + its sits → gives
// Data comes from specialTables(); nothing is recomputed here.
import { planetCode } from './render.js'

const NS = 'http://www.w3.org/2000/svg'
// वही छोटे कोड जो तालिकाओं में हैं (SUN/MOO/MAR…) — VENUS नहीं
const CODE = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' }
const COLORS = {
  sun: '#1d4ed8', moon: '#1d4ed8', jupiter: '#1d4ed8', venus: '#1d4ed8',
  mars: '#15803d', mercury: '#15803d', saturn: '#c2410c', rahu: '#c2410c', ketu: '#db2777',
}
const hashOf = (key, retro) => (retro && key !== 'rahu' && key !== 'ketu' ? '#' : '')

let DATA = null
export function setTipData(d) { DATA = d }

const pad2 = (n) => String(n).padStart(2, '0')
const num = (v) => (v == null || v === '' ? null : Number(v))

function styleOnce() {
  if (document.getElementById('bnn-tip-css')) return
  const s = document.createElement('style')
  s.id = 'bnn-tip-css'
  s.textContent = `
  [data-pl]{cursor:pointer}
  /* poore text-box par hover (sirf aksharon par nahi) */
  svg [data-pl]{pointer-events:all}
  #bnnPlTip{position:fixed;z-index:90;background:#fffdf6;border:1px solid #d9a95f;border-radius:8px;
    box-shadow:0 8px 20px rgba(45,28,0,.18);pointer-events:none;opacity:0;transform:translateY(2px);
    transition:opacity .1s ease,transform .1s ease;padding:0}
  #bnnPlTip.on{opacity:1;transform:none}
  #bnnPlTip .pt-min{display:block;padding:5px 11px;font-size:13px;font-weight:700;color:#3f3627;
    border-left:4px solid #334155;border-radius:8px;white-space:nowrap;letter-spacing:.2px}
  [data-lord]{cursor:pointer}
  #bnnBhTip{position:fixed;z-index:91;display:flex;align-items:center;gap:7px;background:#20262f;color:#fff6e2;
    border:1px solid #d9a95f;border-radius:999px;padding:4px 13px 4px 10px;font-size:13px;font-weight:800;
    letter-spacing:.4px;box-shadow:0 8px 20px rgba(20,12,0,.28);pointer-events:none;opacity:0;
    transform:translateY(2px);transition:opacity .1s ease,transform .1s ease;white-space:nowrap}
  #bnnBhTip.on{opacity:1;transform:none}
  #bnnBhTip .bdot{width:7px;height:7px;border-radius:2px;background:#d9a95f;display:inline-block;flex:none}
  #bnnBhTip .bsep{width:1px;height:13px;background:rgba(217,169,95,.45);display:inline-block;margin:0 2px}
  #bnnBhTip .bx{color:#f0d59b;font-weight:700}
  /* overlay ko page ke .chart-box svg rule (white bg / 100% width / padding) se bachao */
  .chart-box svg.bnn-hovln,svg.bnn-hovln{position:absolute;display:block;width:auto;height:auto;
    max-width:none;margin:0;padding:0;background:transparent;border:0;border-radius:0;
    pointer-events:none;overflow:visible;z-index:6}
  `
  document.head.append(s)
}

function box(id, cls) {
  let n = document.getElementById(id)
  if (!n) { n = document.createElement('div'); n.id = id; document.body.append(n) }
  return n
}

export function hideTips() {
  document.getElementById('bnnPlTip')?.classList.remove('on')
  document.getElementById('bnnBhTip')?.classList.remove('on')
  document.querySelectorAll('.bnn-hovln').forEach((n) => n.remove())
  document.querySelectorAll('.bnn-hot').forEach((n) => n.classList.remove('bnn-hot'))
}

function place(node, el, side = 'left') {
  const r = el.getBoundingClientRect()
  const tw = node.offsetWidth, th = node.offsetHeight
  let left, top
  if (side === 'right') { left = r.right + 12; top = r.top + r.height / 2 - th / 2 }
  else if (side === 'up') { left = r.left + r.width / 2 - tw / 2; top = r.top - th - 10 }
  else if (side === 'down') { left = r.left + r.width / 2 - tw / 2; top = r.bottom + 10 }
  else { left = r.left - tw - 12; top = r.top + r.height / 2 - th / 2 }
  if (left < 8) left = r.right + 12
  if (left + tw > window.innerWidth - 8) left = Math.max(8, r.left - tw - 12)
  top = Math.max(8, Math.min(top, window.innerHeight - th - 8))
  node.style.left = `${Math.round(left)}px`
  node.style.top = `${Math.round(top)}px`
}

/** window.__plSide jaise: box hamesha teer ki ulti dishа me (teer/bhav-ank na dhake). */
function tipSide(el, key) {
  const svg = el.closest('svg[data-chart]')
  const row = DATA?.special?.rows?.[key]
  if (!svg || !row) return 'left'
  const houses = []
  const sits = num(row.sitsAt)
  if (sits != null) houses.push(sits)
  for (const h of row.gives || []) { const v = Number(h); if (!houses.includes(v)) houses.push(v) }
  const labels = [...svg.querySelectorAll('[data-bh]')].filter((n) => houses.includes(Number(n.getAttribute('data-bh'))))
  if (!labels.length) return 'left'
  let sx = 0, sy = 0
  for (const n of labels) { const r = n.getBoundingClientRect(); sx += r.left + r.width / 2; sy += r.top + r.height / 2 }
  const r = el.getBoundingClientRect()
  const dx = sx / labels.length - (r.left + r.width / 2)
  const dy = sy / labels.length - (r.top + r.height / 2)
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'right' : 'left'
  return dy < 0 ? 'down' : 'up'
}

/** Planet popup: STAR - house - LORDSHIP (the SPECIAL table's two right cells). */
export function showPlanetTip(el, key) {
  if (!DATA?.special?.rows) return
  const r = DATA.special.rows[key]
  if (!r) return
  const slKey = r.starLord ? String(r.starLord) : ''
  const sl = slKey ? `${CODE[slKey] || slKey.toUpperCase()}${hashOf(slKey, DATA.retro?.[slKey])}` : ''
  const st = num(r.starAt)
  const sg = (r.starGives || []).map(String).join(',')
  let inner = '—'
  if (sl) {
    inner = `<b style="color:${COLORS[slKey] || '#334155'}">${sl}</b>`
    if (st != null) inner += ` - ${pad2(st)}`
    if (sg) inner += ` - ${sg}`
  }
  const t = box('bnnPlTip')
  t.innerHTML = `<span class="pt-min" style="border-left-color:${COLORS[key] || '#334155'}">${inner}</span>`
  t.classList.add('on')
  place(t, el, tipSide(el, key))
}

/** Bhava pill: the bhava's LORDSHIP planet + its sits → gives. */
export function showBhavaTip(el, n) {
  const sp = DATA?.special
  if (!sp?.directors) return
  const lord = sp.directors[n]
  if (!lord) return
  const row = sp.rows?.[lord] || {}
  const sits = num(row.sitsAt)
  const gives = (row.gives || []).map(String).join(',')
  const t = box('bnnBhTip')
  t.innerHTML =
    `<span class="bdot"></span><span>${CODE[lord] || lord}${hashOf(lord, DATA.retro?.[lord])}</span>` +
    `<span class="bsep"></span><span class="bx">${sits != null ? pad2(sits) : '—'} → ${gives || '—'}</span>`
  t.classList.add('on')
  place(t, el)
}

/** Coloured arrows from a chart planet to its result houses (own house = ring). */
export function drawChartArrows(svg, plEl, key) {
  const sp = DATA?.special
  const row = sp?.rows?.[key]
  if (!row) return
  svg.querySelectorAll('g.bnn-hovln-g').forEach((n) => n.remove())
  document.querySelectorAll('.bnn-hot').forEach((n) => n.classList.remove('bnn-hot'))
  const houses = []
  const sits = num(row.sitsAt)
  if (sits != null) houses.push(sits)
  for (const h of row.gives || []) {
    const v = Number(h)
    if (!houses.includes(v)) houses.push(v)
  }
  if (!houses.length) return
  const ctm = svg.getScreenCTM()
  if (!ctm) return
  const inv = ctm.inverse()
  const col = COLORS[key] || '#334155'
  const toUser = (x, y) => {
    const p = svg.createSVGPoint()
    p.x = x; p.y = y
    return p.matrixTransform(inv)
  }
  const center = (node) => {
    const r = node.getBoundingClientRect()
    return toUser(r.left + r.width / 2, r.top + r.height / 2)
  }
  const g = document.createElementNS(NS, 'g')
  g.setAttribute('class', 'bnn-hovln-g')
  g.setAttribute('pointer-events', 'none')
  const sPt = center(plEl)
  const sRect = plEl.getBoundingClientRect()
  const unit = Math.max(Math.abs(inv.a), 1e-6)      // svg user-units per screen px
  for (const el of svg.querySelectorAll('[data-bh]')) {
    const h = Number(el.getAttribute('data-bh'))
    if (!houses.includes(h)) continue
    const tr = el.getBoundingClientRect()
    if (String(h) === String(plEl.getAttribute('data-phouse'))) {
      const a = toUser(tr.left, tr.top)
      const b = toUser(tr.right, tr.bottom)
      const rect = document.createElementNS(NS, 'rect')
      rect.setAttribute('x', (a.x - 2).toFixed(1)); rect.setAttribute('y', (a.y - 1).toFixed(1))
      rect.setAttribute('width', (b.x - a.x + 4).toFixed(1)); rect.setAttribute('height', (b.y - a.y + 2).toFixed(1))
      rect.setAttribute('rx', '3'); rect.setAttribute('fill', 'none')
      rect.setAttribute('stroke', col); rect.setAttribute('stroke-width', '1.1')
      g.append(rect)
      el.classList.add('bnn-hot')
      continue
    }
    const tPt = center(el)
    const dx = tPt.x - sPt.x
    const dy = tPt.y - sPt.y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len
    const t1 = (sRect.height / 2) * unit + 2
    const t2 = (tr.height / 2) * unit + 3
    const x1 = sPt.x + ux * t1, y1 = sPt.y + uy * t1
    const x2 = tPt.x - ux * t2, y2 = tPt.y - uy * t2
    const line = document.createElementNS(NS, 'line')
    line.setAttribute('x1', x1.toFixed(1)); line.setAttribute('y1', y1.toFixed(1))
    line.setAttribute('x2', x2.toFixed(1)); line.setAttribute('y2', y2.toFixed(1))
    line.setAttribute('stroke', col); line.setAttribute('stroke-width', '1.1')
    line.setAttribute('stroke-linecap', 'round')
    g.append(line)
    const ah = 4
    const head = document.createElementNS(NS, 'polygon')
    head.setAttribute('points', [
      `${x2.toFixed(1)},${y2.toFixed(1)}`,
      `${(x2 - ux * ah - uy * ah * 0.55).toFixed(1)},${(y2 - uy * ah + ux * ah * 0.55).toFixed(1)}`,
      `${(x2 - ux * ah + uy * ah * 0.55).toFixed(1)},${(y2 - uy * ah - ux * ah * 0.55).toFixed(1)}`,
    ].join(' '))
    head.setAttribute('fill', col)
    g.append(head)
    el.classList.add('bnn-hot')
  }
  if (g.childElementCount) svg.append(g)
}

let wired = false
export function wireTips() {
  if (wired) return
  wired = true
  styleOnce()
  document.addEventListener('mouseover', (e) => {
    const t = e.target
    if (!(t instanceof Element)) return
    const lordCell = t.closest('[data-lord]')
    if (lordCell) {
      document.__bnnKey = null
      hideTips()
      showBhavaTip(lordCell, Number(lordCell.dataset.lord))
      return
    }
    const plEl = t.closest('[data-pl]')
    const inChart = t.closest('svg[data-chart]')
    // चार्ट के अंदर खाली जगह (अक्षरों के बीच) पर आने से कुछ न हटे
    if (!plEl) { if (!inChart) { document.__bnnKey = null; hideTips() } ; return }
    if (document.__bnnKey === plEl.dataset.pl && plEl.dataset.pl) return
    document.__bnnKey = plEl.dataset.pl
    hideTips()
    showPlanetTip(plEl, plEl.dataset.pl)
    if (inChart) drawChartArrows(inChart, plEl, plEl.dataset.pl)
  })
  document.addEventListener('mouseout', (e) => {
    const t = e.target
    if (!(t instanceof Element)) return
    if (!t.closest('[data-pl],[data-lord]')) return
    const to = e.relatedTarget
    if (to instanceof Element && to.closest('[data-pl],[data-lord]')) return
    if (to instanceof Element && to.closest('svg[data-chart]')) return   // चार्ट के अंदर ही रहे तो टिका रहे
    document.__bnnKey = null
    hideTips()
  })
  document.addEventListener('scroll', hideTips, true)
  window.addEventListener('resize', hideTips)
}
