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

function place(node, el, preferLeft = true) {
  const r = el.getBoundingClientRect()
  const tw = node.offsetWidth, th = node.offsetHeight
  let left = preferLeft ? r.left - tw - 12 : r.right + 12
  if (left < 8) left = r.right + 12
  if (left + tw > window.innerWidth - 8) left = Math.max(8, r.left - tw - 12)
  let top = r.top + r.height / 2 - th / 2
  top = Math.max(8, Math.min(top, window.innerHeight - th - 8))
  node.style.left = `${Math.round(left)}px`
  node.style.top = `${Math.round(top)}px`
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
  place(t, el)
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
  svg.parentElement.querySelectorAll('.bnn-hovln').forEach((n) => n.remove())
  document.querySelectorAll('.bnn-hot').forEach((n) => n.classList.remove('bnn-hot'))
  const houses = []
  const sits = num(row.sitsAt)
  if (sits != null) houses.push(sits)
  ;(row.gives || []).forEach((h) => { const v = Number(h); if (!houses.includes(v)) houses.push(v) })
  if (!houses.length) return
  const host = svg.parentElement
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative'
  const br = host.getBoundingClientRect(), sr = svg.getBoundingClientRect()
  const col = COLORS[key] || '#334155'
  const ov = document.createElementNS(NS, 'svg')
  ov.setAttribute('class', 'bnn-hovln')
  ov.setAttribute('width', Math.round(sr.width))
  ov.setAttribute('height', Math.round(sr.height))
  ov.style.left = `${sr.left - br.left}px`
  ov.style.top = `${sr.top - br.top}px`
  const defs = document.createElementNS(NS, 'defs')
  const mk = document.createElementNS(NS, 'marker')
  mk.setAttribute('id', 'bnnArr')
  mk.setAttribute('viewBox', '0 0 10 10')
  mk.setAttribute('refX', '9'); mk.setAttribute('refY', '5')
  mk.setAttribute('markerWidth', '7'); mk.setAttribute('markerHeight', '7')
  mk.setAttribute('orient', 'auto')
  const mp = document.createElementNS(NS, 'path')
  mp.setAttribute('d', 'M0,0 L10,5 L0,10 Z'); mp.setAttribute('fill', col)
  mk.append(mp); defs.append(mk); ov.append(defs)
  const sRect = plEl.getBoundingClientRect()
  const sx = sRect.left - sr.left + sRect.width / 2
  const sy = sRect.top - sr.top + sRect.height / 2
  for (const el of svg.querySelectorAll('[data-bh]')) {
    const h = Number(el.getAttribute('data-bh'))
    if (!houses.includes(h)) continue
    const tr = el.getBoundingClientRect()
    if (String(h) === String(plEl.getAttribute('data-phouse'))) {
      const rg = document.createElementNS(NS, 'rect')
      rg.setAttribute('x', tr.left - sr.left - 3); rg.setAttribute('y', tr.top - sr.top - 2)
      rg.setAttribute('width', tr.width + 6); rg.setAttribute('height', tr.height + 4)
      rg.setAttribute('rx', '4'); rg.setAttribute('fill', 'none')
      rg.setAttribute('stroke', col); rg.setAttribute('stroke-width', '1.6')
      ov.append(rg); el.classList.add('bnn-hot')
      continue
    }
    const tx = tr.left - sr.left + tr.width / 2
    const ty = tr.top - sr.top + tr.height / 2
    const dx = tx - sx, dy = ty - sy
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len
    let t1 = Math.min(sRect.width / 2 / (Math.abs(ux) || 1e-6), sRect.height / 2 / (Math.abs(uy) || 1e-6)) + 4
    let t2 = Math.min(tr.width / 2 / (Math.abs(ux) || 1e-6), tr.height / 2 / (Math.abs(uy) || 1e-6)) + 2
    if (t1 + t2 + 6 > len) { t1 = len * 0.35; t2 = len * 0.35 }
    const ln = document.createElementNS(NS, 'line')
    ln.setAttribute('x1', (sx + ux * t1).toFixed(1)); ln.setAttribute('y1', (sy + uy * t1).toFixed(1))
    ln.setAttribute('x2', (tx - ux * t2).toFixed(1)); ln.setAttribute('y2', (ty - uy * t2).toFixed(1))
    ln.setAttribute('stroke', col); ln.setAttribute('stroke-width', '1.8')
    ln.setAttribute('stroke-linecap', 'round')
    if (len > 34) ln.setAttribute('marker-end', 'url(#bnnArr)')
    ov.append(ln)
    el.classList.add('bnn-hot')
  }
  if (ov.childElementCount > 1) host.append(ov)
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
    if (lordCell) { hideTips(); showBhavaTip(lordCell, Number(lordCell.dataset.lord)); return }
    const plEl = t.closest('[data-pl]')
    if (!plEl) { hideTips(); return }
    hideTips()
    showPlanetTip(plEl, plEl.dataset.pl)
    const svg = plEl.closest('svg[data-chart]')
    if (svg) drawChartArrows(svg, plEl, plEl.dataset.pl)
  })
  document.addEventListener('mouseout', (e) => {
    const t = e.target
    if (!(t instanceof Element)) return
    if (!t.closest('[data-pl],[data-lord]')) return
    const to = e.relatedTarget
    if (to instanceof Element && to.closest('[data-pl],[data-lord]')) return
    hideTips()
  })
  document.addEventListener('scroll', hideTips, true)
  window.addEventListener('resize', hideTips)
}
