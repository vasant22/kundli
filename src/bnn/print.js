// print.js — BNN print sheet (user request 2026-10-07).
// Builds a hidden A4 sheet; the on-screen page stays as-is and @media print
// shows ONLY this sheet. Own design (saffron/cream, our page's tables and
// naming) — deliberately not a copy of any other software's output.
// Page 1: header (Ganesh left · Hari Om / name / mantra / contact · Saraswati
// right) + basic details + chart. Page 2: combination + SPECIAL tables.
// Page 3: PRSSS / BRSSS + dhasa/bhukthi/andhiram. Footer on every page.
import ganeshUrl from './assets/ganesh.png'
import saraswatiUrl from './assets/saraswati.png'
import { findExchanges } from './kp.js'
import { astronomyPartners, bhavaCombinations, labelSuffix, planetCombinations, seatPositions } from './combos.js'
import { computeBrsss, computePrsss } from './prsss.js'
import { specialTables } from './special.js'
import { buildBnnChart, planetCode } from './render.js'
import { bhukthiList, fmtDMY } from './dasha.js'

const PLANET_ORDER = ['jupiter', 'sun', 'moon', 'mars', 'mercury', 'venus', 'saturn', 'rahu', 'ketu']
const RASHI_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
const HASH = (key, retro) => (retro && key !== 'rahu' && key !== 'ketu' ? '#' : '')
const ageT = (a) => `${a.y}Y-${a.m}M-${a.d}D`

const el = (tag, cls, text) => {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text !== undefined) n.textContent = text
  return n
}
const heading = (text) => el('h2', 'bp-h', text)

function simpleTable(headers, rows, cls = '') {
  const tbl = el('table', `bp-table ${cls}`.trim())
  if (headers) {
    const hr = el('tr')
    for (const h of headers) hr.append(el('th', null, h))
    tbl.append(hr)
  }
  for (const row of rows) {
    const tr = el('tr')
    for (const cell of row) {
      if (cell && typeof cell === 'object') tr.append(cell)
      else tr.append(el('td', null, cell == null ? '' : String(cell)))
    }
    tbl.append(tr)
  }
  return tbl
}

const footer = () => {
  const f = el('div', 'bp-foot')
  f.append(
    el('div', 'bp-foot-main', '🌿 mybapuji.com · info@mybapuji.com'),
    el('div', 'bp-foot-sub', 'निःशुल्क ज्योतिष साधन: कुंडली · कुंडली मिलान · पंचांग · BNN चार्ट')
  )
  return f
}

/** Build the whole print sheet for the current values (mode-aware). */
export function buildPrintSheet(values) {
  const { bnn, bnnMeta, bnnDasha } = values
  const mode = values.bnnMode === 'BP' ? 'BP' : 'AP'
  const pairs = findExchanges(bnn.planets)
  const birth = { year: Number(values.year), month: Number(values.month), day: Number(values.day) }
  const moon = bnn.planets.find((p) => p.key === 'moon')
  const byKey = Object.fromEntries(bnn.planets.map((p) => [p.key, p]))

  const sheet = el('div')
  sheet.id = 'bnn-print'

  // ---------------- page 1 — header · details · chart ----------------
  const p1 = el('section', 'bp-page bp-break')

  const head = el('div', 'bp-head')
  const left = el('div', 'bp-head-img')
  const gimg = el('img'); gimg.src = ganeshUrl; gimg.alt = 'भगवान गणपति'; left.append(gimg)
  const right = el('div', 'bp-head-img')
  const simg = el('img'); simg.src = saraswatiUrl; simg.alt = 'माँ सरस्वती'; right.append(simg)
  const mid = el('div', 'bp-head-mid')
  mid.append(
    el('div', 'bp-hariom', 'हरि ॐ'),
    el('div', 'bp-name', String(bnnMeta.name || '')),
    el('div', 'bp-mantra', 'ॐ ऐं ह्रीं श्रीं क्लीं चामुण्डायै विच्चे नमः'),
    el('div', 'bp-contact', 'info@mybapuji.com  ·  mybapuji.com')
  )
  head.append(left, mid, right)
  p1.append(head)

  p1.append(heading('BASIC DETAILS'))
  const details = el('div', 'bp-details')
  const colL = [
    ['Name', bnnMeta.name],
    ['Age', String(bnnMeta.ageText || '').replace(/^AGE : /, '')],
    ['Date of Birth', `${String(values.day).padStart(2, '0')}-${String(values.month).padStart(2, '0')}-${values.year}`],
    ['Time of Birth', `${String(values.hour).padStart(2, '0')}:${String(values.minute).padStart(2, '0')}:${String(values.second === '' ? 0 : values.second).padStart(2, '0')}`],
    ['Place of Birth', bnnMeta.placeText],
  ]
  const colR = [
    ['Lagna', RASHI_EN[bnn.ascendant.rashi]],
    ['Sign', RASHI_EN[moon.rashi]],
    ['Star', bnnMeta.nakText],
    ['Tithi', bnnMeta.tithiText],
    ['Yoga', bnnMeta.yogaText],
  ]
  for (let i = 0; i < 5; i++) {
    const row = el('div', 'bp-detail-row')
    row.append(
      el('span', 'bp-dl', `${colL[i][0]} :`), el('span', 'bp-dv', String(colL[i][1] ?? '')),
      el('span', 'bp-dl', `${colR[i][0]} :`), el('span', 'bp-dv', String(colR[i][1] ?? ''))
    )
    details.append(row)
  }
  p1.append(details)

  const chartWrap = el('div', 'bp-chart')
  chartWrap.append(buildBnnChart(bnn, { style: 'south', meta: bnnMeta }))
  p1.append(chartWrap)
  if (pairs.length > 0) {
    const label = pairs.map(([a, b]) => `${a.toUpperCase()}<>${b.toUpperCase()}`).join('   ')
    p1.append(el('p', 'bp-note', `${label} — ${mode === 'AP' ? 'AFTER' : 'BEFORE'} PARIVARDHANAI (${mode})`))
  } else {
    p1.append(el('p', 'bp-note', `PARIVARDHANAI (${mode})`))
  }
  p1.append(footer())
  sheet.append(p1)

  // ---------------- page 2 — combination + SPECIAL tables ----------------
  // Order (user 2026-10-07c): BHAVA first, then PLANET — and colorful like the
  // web page (blue = first entry, green ≥20 %, orange <20 %, Saturn always
  // green, pink = progression).
  const p2 = el('section', 'bp-page')
  const pc = planetCombinations(bnn.planets, mode, { cusps: bnn.cusps })
  const astro = astronomyPartners(bnn.planets, mode)
  const seats = seatPositions(bnn.planets, mode)
  const entText = (e) => (e.type === 'planet'
    ? `${planetCode(e.key)}${HASH(e.key, e.natalRetro)}-${Math.round(e.percent)}`
    : `${e.label}-${Math.round(e.percent)}`)
  const colourOf = (e, i) => {
    if (i === 0) return 'ent-blue'
    if (e.type === 'planet' && e.key === 'saturn') return 'ent-green'
    return Math.round(e.percent) >= 20 ? 'ent-green' : 'ent-orange'
  }
  const entCell = (e, i) => el('td', colourOf(e, i), entText(e))

  p2.append(heading(`BHAVA COMBINATION (1-5-7-9) — ${mode}`))
  {
    const bc = bhavaCombinations(bnn.planets, bnn.cusps, mode)
    const rows = []
    for (let n = 1; n <= 12; n++) {
      const cells = [el('td', 'bp-lab', `B${String(n).padStart(2, '0')}`)]
      bc[n].list1579.forEach((e, i) => cells.push(entCell(e, i)))
      while (cells.length < 9) cells.push(el('td', null, ''))
      rows.push(cells)
    }
    p2.append(simpleTable(null, rows, 'bp-bhava'))
  }

  p2.append(heading(`PLANET COMBINATION (1-5-7-9) — ${mode}`))
  {
    const maxLen = Math.max(...Object.values(pc).map((v) => v.list1579.length))
    const rows = []
    for (const pkey of PLANET_ORDER) {
      const list = pc[pkey].list1579
      const cells = [el('td', 'bp-lab', `${planetCode(pkey)}${HASH(pkey, byKey[pkey].retro)}-${labelSuffix(seats[pkey].lon, bnn.cusps).value}`)]
      for (let i = 0; i < maxLen; i++) cells.push(list[i] ? entCell(list[i], i) : el('td', null, ''))
      const partner = astro[pkey]
      cells.push(el('td', 'bp-prog', partner ? `${planetCode(partner)}${HASH(partner, byKey[partner].retro)}` : ''))
      rows.push(cells)
    }
    p2.append(simpleTable(null, rows, 'bp-planet'))
  }

  const sp = specialTables(bnn.planets, bnn.cusps, mode)
  p2.append(heading(`BHAVA — SPECIAL — ${mode}`))
  {
    const rows = []
    for (let n = 1; n <= 12; n++) {
      rows.push([
        el('td', 'bp-lab', `B${String(n).padStart(2, '0')}`),
        el('td', null, planetCode(sp.lords[n])),
        el('td', null, sp.inBhava[n].length ? sp.inBhava[n].map((e) => `${planetCode(e.key)}${HASH(e.key, e.natalRetro)}`).join(', ') : '—'),
        el('td', null, sp.inStarOf[n].length ? sp.inStarOf[n].map((k) => `${planetCode(k)}${HASH(k, byKey[k].retro)}`).join(', ') : '—'),
        el('td', null, `${planetCode(sp.directors[n])}${HASH(sp.directors[n], byKey[sp.directors[n]].retro)}`),
      ])
    }
    p2.append(simpleTable(['BHAVA', 'LORD', 'PLANETS(A)', 'IN STAR OF A', 'LORDSHIP'], rows, 'bp-special'))
  }

  p2.append(heading(`PLANET — SPECIAL — ${mode}`))
  {
    const rows = []
    for (const pkey of PLANET_ORDER) {
      const r = sp.rows[pkey]
      rows.push([
        el('td', 'bp-lab', `${planetCode(pkey)}${HASH(pkey, byKey[pkey].retro)}-${labelSuffix(seats[pkey].lon, bnn.cusps).value}`),
        el('td', null, r.owns.length ? r.owns.join(',') : '—'),
        el('td', null, `${String(r.sitsAt).padStart(2, '0')} → ${r.gives.length ? r.gives.join(',') : '—'}`),
        el('td', null, `${planetCode(r.starLord)} - ${r.starAt}`),
        el('td', null, r.starGives.length ? r.starGives.join(',') : '—'),
      ])
    }
    p2.append(simpleTable(['PLANET', 'LORD', 'LORDSHIP', 'STAR', 'LORDSHIP'], rows, 'bp-special'))
  }
  p2.append(footer())
  sheet.append(p2)

  // ---------------- page 3 — PRSSS / BRSSS + Vimshottari ----------------
  const p3 = el('section', 'bp-page')
  p3.append(heading('PRSSS (P · R · S · S · S)'))
  {
    const rows = []
    for (const pkey of PLANET_ORDER) {
      const links = computePrsss(byKey[pkey].longitude)
      rows.push([el('td', 'bp-lab', `${planetCode(pkey)}${HASH(pkey, byKey[pkey].retro)}`), ...links.map((k) => el('td', null, planetCode(k)))])
    }
    p3.append(simpleTable(null, rows, 'bp-prsss'))
  }
  p3.append(heading('BRSSS (B · R · S · S · S)'))
  {
    const rows = []
    for (let n = 1; n <= 12; n++) {
      const links = computeBrsss(bnn.cusps[n - 1].longitude)
      rows.push([el('td', 'bp-lab', `B${String(n).padStart(2, '0')}`), ...links.map((k) => el('td', null, planetCode(k)))])
    }
    p3.append(simpleTable(null, rows, 'bp-brsss'))
  }

  p3.append(heading('DHASA / BHUKTHI'))
  {
    const rows = []
    for (const m of bnnDasha.mahadashas) {
      rows.push([el('td', 'bp-lab', planetCode(m.lord)), el('td', null, fmtDMY(m.endISO)), el('td', null, ageT(m.age))])
    }
    p3.append(simpleTable(['DHASA', 'End Date', 'Age'], rows, 'bp-dasha'))
  }
  // every mahadasha's bhukthis (like the sample's all-dasha listing; the
  // first dasha shows its elapsed bhukthis as blank rows)
  {
    const blocks = []
    for (const m of bnnDasha.mahadashas) {
      const bh = bhukthiList(m, birth)
      const rows = bh.map((b) => (b.blank
        ? [el('td'), el('td'), el('td'), el('td')]
        : [el('td', null, planetCode(m.lord)), el('td', null, planetCode(b.lord)), el('td', null, fmtDMY(b.endISO)), el('td', null, ageT(b.age))]))
      blocks.push(simpleTable(['Dhasa', 'Bhukthi', 'End Date', 'Age'], rows, 'bp-bhukthi'))
    }
    const wrap = el('div', 'bp-bhukthi-grid')
    for (const b of blocks) wrap.append(b)
    p3.append(wrap)
  }

  if (bnnDasha.running.andhirams) {
    const m = bnnDasha.mahadashas[bnnDasha.running.mahaIndex]
    const b = bnnDasha.running.bhukthis[bnnDasha.running.bhukthiIndex]
    p3.append(heading(`ANDHIRAM — ${planetCode(m.lord)} DHASA · ${planetCode(b.lord)} BHUKTHI`))
    const rows = bnnDasha.running.andhirams.map((a) => [el('td', 'bp-lab', planetCode(a.lord)), el('td', null, fmtDMY(a.endISO)), el('td', null, ageT(a.age))])
    p3.append(simpleTable(['Andhiram', 'End Date', 'Age'], rows, 'bp-andhiram'))
  }
  p3.append(footer())
  sheet.append(p3)

  return sheet
}
