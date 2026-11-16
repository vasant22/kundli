// report.js — फलादेश का HTML (design-kit संस्करण 3).
//
// सारा data buildPhalData() से और सारा text text-hi.js से — यहाँ सिर्फ़ जोड़कर
// page बनाया जाता है. दो रूप:
//   renderReport(data)      → /kundli-phal/ का पूरा पन्ना (print/PDF)
//   renderOnline(data)      → kundli पेज का "विस्तृत फलादेश" section (details)

import * as TX from './text-hi.js'
import { ordinalHi, grahaHi, rashiHi, grahaList, degMinHi } from './text.js'
import { GRAHA_AB, rashiImg, northChart, southChart, vimshopakaBars, dashaTimeline, savBars, bavHeatmap, sadesatiChart, starfield } from './viz.js'
import { TITHIS, YOGAS, KARANAS, VAARAS, NAKSHATRAS } from '../i18n.js'

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const VAR = { sun: 'su', moon: 'mo', mars: 'ma', mercury: 'me', jupiter: 'ju', venus: 've', saturn: 'sa', rahu: 'ra', ketu: 'ke' }
const DEV = '०१२३४५६७८९'
const dev = (n) => String(n).replace(/\d/g, (d) => DEV[+d])
const H = (n) => ordinalHi(n, 'भाव')
const TONE_WORD = { shubh: 'शुभ', mishr: 'मिश्र', savdhan: 'सावधानी' }
const TONE_CLS = { shubh: 's', mishr: 'm', savdhan: 'c' }

const tone = (t) => (t && TONE_WORD[t] ? `<span class="tone ${TONE_CLS[t]}">${TONE_WORD[t]}</span>` : '')
const gb = (key) => `<span class="gb" style="background:var(--${VAR[key] || 'nisha'})">${GRAHA_AB[key] || '—'}</span>`

const dateHi = (ms) => {
  const d = new Date(ms)
  const p = (x) => String(x).padStart(2, '0')
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`
}
const dateLong = (ms) => {
  const d = new Date(ms)
  const p = (x) => String(x).padStart(2, '0')
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`
}
const year = (ms) => new Date(ms).getUTCFullYear()

// चार्ट के लिए ग्रह-सूची
function vizPlanets(planets, { degrees = false } = {}) {
  return planets.map((p) => ({
    key: p.key, ab: GRAHA_AB[p.key], rashi: p.rashi, retro: p.retro,
    degStr: degrees ? degMinHi(p.degInSign).replace(' ', '') : undefined,
  }))
}

// --- अध्याय 1: विषय-सूची ---------------------------------------------------
const TOC = [
  ['s2', 'आपकी कुंडली एक नज़र में'],
  ['s3', 'जन्म-विवरण, पंचांग और अवकहड़ा'],
  ['s4', 'मुख्य कुंडलियाँ'],
  ['s5', 'ग्रह और उनकी स्थिति'],
  ['s6', 'बारह भाव'],
  ['s7', 'षोडश वर्ग'],
  ['s8', 'षष्ट्यंश (D60)'],
  ['s9', 'योग और दोष'],
  ['s10', 'विंशोत्तरी दशा'],
  ['s11', 'साढ़ेसाती, ढैया और आज का गोचर'],
  ['s12', 'अष्टकवर्ग'],
  ['s13', 'उपाय और रत्न'],
  ['s14', 'शब्दकोश और गणना-पद्धति'],
]

function contents() {
  return `<section class="ch" id="s1"><header class="chap"><div class="num">${dev(1)}</div><h2>विषय-सूची</h2>
  <p class="intro">यह फलादेश चौदह भागों में है — हर भाग नए पन्ने से शुरू होता है।</p></header>
  <ol class="toc">${TOC.map(([id, t], i) => `<li><a href="#${id}"><span>${dev(i + 2)}</span>${esc(t)}</a></li>`).join('')}</ol></section>`
}

// --- अध्याय 2: एक नज़र में -------------------------------------------------
function glance(data) {
  const st = data.strength.planets
  const sorted = Object.entries(st).sort((a, b) => b[1].total - a[1].total)
  const strongest = sorted[0]
  const strongPlanet = data.planets.find((p) => p.key === strongest[0])
  const cur = data.dasha.current
  const md = data.dasha.mahadashas.find((m) => m.key === cur.maha.key && m.fromMs === cur.maha.fromMs) ?? { fromMs: cur.maha.fromMs, toMs: cur.maha.toMs }
  const pct = Math.max(0, Math.min(100, Math.round((data.meta.nowMs - md.fromMs) / (md.toMs - md.fromMs) * 100)))
  const lagna = data.summary.lagnaRashi
  const moon = data.summary.moonRashi
  const lagnaLord = data.houses[0].lord
  const yogas = data.yogas.list.filter((y) => y.present || (y.id === 'adhi' && y.partial)).slice(0, 6)
  const vim = sorted.map(([k, v]) => ({ key: k, hi: grahaHi(k), value: v.total }))
  const lagnaLordPlanet = data.planets.find((p) => p.key === lagnaLord)
  return `<div class="tiles">
    <div class="tile has-img"><div class="k">लग्न</div><div class="v">${esc(rashiHi(lagna))}</div>
      <div class="d">स्वामी ${esc(grahaHi(lagnaLord))}, ${H(lagnaLordPlanet.house)} में</div>
      <img class="rimg" src="${rashiImg(lagna)}" alt="" width="57" height="57"></div>
    <div class="tile has-img"><div class="k">चंद्र राशि</div><div class="v">${esc(rashiHi(moon))}</div>
      <div class="d">चंद्र ${H(data.planets.find((p) => p.key === 'moon').house)} में</div>
      <img class="rimg" src="${rashiImg(moon)}" alt="" width="57" height="57"></div>
    <div class="tile"><div class="k">जन्म-नक्षत्र</div><div class="v">${esc(data.summary.nakshatraName.hi)}</div>
      <div class="d">${esc(ordinalHi(data.summary.pada, 'चरण'))} · स्वामी ${esc(grahaHi(data.avakahada.nakshatra.lord))}</div>
      ${gb(data.avakahada.nakshatra.lord).replace('class="gb"', 'class="gb" style="position:absolute;right:1mm;top:1.5mm;background:var(--' + VAR[data.avakahada.nakshatra.lord] + ')"')}</div>
    <div class="tile"><div class="k">सबसे बलवान ग्रह</div><div class="v">${esc(grahaHi(strongest[0]))}</div>
      <div class="d">विंशोपक ${strongest[1].total} / 20 · ${esc(strongest[1].bandHi)}</div>
      <span class="bg" style="background:var(--${VAR[strongest[0]]})">${GRAHA_AB[strongest[0]]}</span></div>
  </div>

  <div class="dashcard">
    <div class="orb" style="background:var(--${VAR[cur.maha.key]})">${GRAHA_AB[cur.maha.key]}</div>
    <div>
      <div class="t">अभी ${esc(grahaHi(cur.maha.key))} की महादशा, ${esc(grahaHi(cur.antar.key))} की अंतर्दशा</div>
      <div class="saransh">${dashaPersonalLine(cur.maha.key, dashaInfo(data, cur.maha.key))} ${tone(dashaInfo(data, cur.maha.key).cell?.tone ?? 'mishr')}</div>
      <div class="bar"><i style="width:${pct}%;background:var(--${VAR[cur.maha.key]})"></i></div>
      <div class="meta"><span>${dateHi(md.fromMs)} से</span><span>${dev(pct)}% बीती</span><span>${dateHi(md.toMs)} तक</span></div>
    </div>
  </div>

  <div class="two">
    <div><h3>ग्रहों का बल (विंशोपक, 20 में से)</h3>${vimshopakaBars(vim).outerHTML}
      <div class="legend"><span>रेखाएँ: 5 क्षीण · 10 मध्यम · 15 पूर्ण</span></div></div>
    <div><h3>मुख्य योग</h3><div class="yogas">${yogas.map((y) => {
      const parts = yogaTextParts(y)
      const head = parts[0]?.t ?? ''
      const extra = parts.slice(1).map((p) => p.t).join(' ')
      const cls = y.id === 'adhi' && y.partial ? 'm' : (parts[0]?.tone === 'savdhan' ? 'c' : parts[0]?.tone === 'mishr' ? 'm' : 's')
      return `<div class="yoga ${cls}"><b>${esc(y.hi)}</b>${esc(head)}${extra ? ' ' + esc(extra) : ''}</div>`
    }).join('') || '<p class="muted">इस कुंडली में कोई विशेष योग नहीं बनता।</p>'}</div></div>
  </div>`
}

// --- अध्याय 3: जन्म-विवरण, पंचांग, अवकहड़ा ---------------------------------
function details(data) {
  const m = data.meta
  const av = data.avakahada
  const p = av.panchang
  const tiles = `<div class="tiles">
    <div class="tile"><div class="k">जन्म तिथि</div><div class="v">${m.local ? `${birth2(m.local.day)}-${birth2(m.local.month)}-${m.local.year}` : '—'}</div><div class="d">${esc(m.place || '—')}</div></div>
    <div class="tile"><div class="k">जन्म समय</div><div class="v">${m.local ? `${birth2(m.local.hour)}:${birth2(m.local.minute)}` : '—'}</div><div class="d">${esc(m.timeZone || '')}</div></div>
    <div class="tile"><div class="k">अयनांश</div><div class="v">${data.meta.ayanamsa.toFixed(2)}°</div><div class="d">लाहिरी</div></div>
    <div class="tile"><div class="k">आत्मकारक</div><div class="v">${esc(grahaHi(av.atmakaraka.key))}</div><div class="d">कारकांश ${esc(rashiHi(av.karakamsha))}</div></div>
  </div>`
  const rows = []
  if (p && !p.error) {
    rows.push(['वार', esc(VAARAS[p.vaar]?.hi ?? '—')])
    rows.push(['तिथि', esc(`${p.tithi?.paksha === 'krishna' ? 'कृष्ण' : 'शुक्ल'} ${TITHIS[(p.tithi?.index ?? 1) - 1]?.hi ?? '—'}`)])
    rows.push(['नक्षत्र', esc(NAKSHATRAS[(p.nakshatra?.index ?? 1) - 1]?.hi ?? '—')])
    rows.push(['योग', esc(YOGAS[(p.yoga?.index ?? 1) - 1]?.hi ?? '—')])
    rows.push(['करण', esc(KARANAS[p.karana?.numbers?.[0] ?? 0]?.hi ?? '—')])
    rows.push(['सूर्योदय', esc(p.sunrise || '—')])
  }
  rows.push(['वर्ण · वश्य', esc(`${av.varna.hi} · ${av.vashya.hi}`)])
  rows.push(['योनि · गण · नाड़ी', esc(`${av.yoni.hi} · ${av.gana.hi} · ${av.nadi.hi}`)])
  rows.push(['नाम-अक्षर', esc(`${av.nakshatra.letter} (${av.nakshatra.name.hi}, ${ordinalHi(av.nakshatra.pada, 'चरण')})`)])
  rows.push(['राशि-स्वामी', esc(av.rashi.lordLabel.hi)])
  rows.push(['नक्षत्र-स्वामी', esc(av.nakshatra.lordLabel.hi)])
  const swabhav = [TX.LAGNA[data.summary.lagnaRashi + 1], TX.MOON_RASHI[data.summary.moonRashi + 1], TX.NAKSHATRA[data.summary.nakshatra]]
    .filter(Boolean)
    .map((e) => `<p class="saransh">${esc(e.t)} ${tone(e.tone)}</p>`).join('')
  return `${tiles}<h3>पंचांग और अवकहड़ा</h3><table><tbody>${rows.map(([a, b]) => `<tr><th style="width:34%">${a}</th><td>${b}</td></tr>`).join('')}</tbody></table>
    <h3>स्वभाव</h3>${swabhav}`
}
const birth2 = (n) => String(n ?? 0).padStart(2, '0')

// --- अध्याय 4: मुख्य कुंडलियाँ ---------------------------------------------
function charts(data) {
  const p = vizPlanets(data.planets, { degrees: true })
  const d1 = northChart({ size: 300, lagnaRashi: data.summary.lagnaRashi, planets: p, centerLabel: 'लग्न' })
  // चंद्र-कुंडली: चंद्र-राशि को लग्न मानकर वही ग्रह
  const chandra = northChart({ size: 300, lagnaRashi: data.summary.moonRashi, planets: p, centerLabel: 'चंद्र' })
  const d9rashi = data.vargas.charts[9]
  const d9planets = data.planets.map((x) => ({ key: x.key, ab: GRAHA_AB[x.key], rashi: d9rashi.planets[x.key], retro: x.retro }))
  const d9 = northChart({ size: 300, lagnaRashi: d9rashi.lagna, planets: d9planets, centerLabel: 'नवांश लग्न' })
  const south = southChart({ size: 300, planets: p })
  // सुदर्शन दृष्टि — दो हिस्सों में साथ-साथ (6+6 पंक्तियाँ), ताकि अध्याय एक पन्ने पर रहे
  const sudRows = data.avakahada.sudarshan
  const half = Math.ceil(sudRows.length / 2)
  const sudTable = (rows) => table(['भाव', 'लग्न से', 'चंद्र से', 'सूर्य से'],
    rows.map((r) => [esc(ordinalHi(r.house)), esc(rashiHi(r.fromLagna)), esc(rashiHi(r.fromMoon)), esc(rashiHi(r.fromSun))]))
  const sud = `<div class="split-tables">${sudTable(sudRows.slice(0, half))}${sudTable(sudRows.slice(half))}</div>`
  return `<div class="chartrow">
      <figure class="chartbox"><figcaption>लग्न कुंडली (D1)</figcaption>${d1.outerHTML}</figure>
      <figure class="chartbox"><figcaption>चंद्र कुंडली</figcaption>${chandra.outerHTML}</figure>
      <figure class="chartbox"><figcaption>नवांश (D9)</figcaption>${d9.outerHTML}</figure>
      <figure class="chartbox"><figcaption>दक्षिण भारतीय (D1)</figcaption>${south.outerHTML}</figure>
    </div>
    <h3>सुदर्शन दृष्टि</h3>${sud}`
}

// --- अध्याय 5: ग्रह -------------------------------------------------------
function planets(data) {
  const rows = data.planets.map((p) => {
    const dig = data.positions[p.key].dignity
    const cls = digWordCls(dig.level)
    const extra = [p.retro ? 'वक्री' : null, data.positions[p.key].combustion.combust ? 'अस्त' : null].filter(Boolean).join(' · ')
    return `<tr>
      <td><span class="gname">${gb(p.key)}${esc(p.name.hi)}</span></td>
      <td><img class="ri" src="${rashiImg(p.rashi)}" alt="" width="24" height="24"${LAZY}>${esc(p.rashiName.hi)}</td>
      <td>${esc(degMinHi(p.degInSign))}</td>
      <td>${esc(p.nakshatraName.hi)}-${p.pada}</td>
      <td>${H(p.house)}</td>
      <td><span class="dig ${cls}">${esc(digWord(dig.level))}</span>${extra ? `<br><small>${esc(extra)}</small>` : ''}</td>
      <td>${p.vimshopaka == null ? '—' : `${p.vimshopaka} <small>${esc(p.vimshopakaBand)}</small>`}</td>
    </tr>`
  }).join('')
  const cards = data.planets.map((p) => {
    const k = VAR[p.key]
    const inHouse = TX.PLANET_IN_HOUSE[k][p.house]
    const dig = data.positions[p.key].dignity
    const digTx = TX.DIGNITY_NOTES[dig.level]
    const lordLines = lordPlacements(p).map((lp) =>
      `<li><span class="lbl">${esc(`${ordinalHi(lp.own)} भाव का स्वामी होकर ${H(lp.inHouse)} में:`)}</span> ${esc(lp.tx.t)} ${tone(lp.tx.tone)}</li>`).join('')
    const comb = data.positions[p.key].combustion.combust
    return `<div class="pcard"><div class="rail" style="background:var(--${k})"><span class="ab">${GRAHA_AB[p.key]}</span><small>${esc(p.name.hi)}</small></div>
      <div class="body"><div class="hd"><b>${esc(p.name.hi)}</b><span>${H(p.house)} · ${esc(p.rashiName.hi)} · ${esc(p.nakshatraName.hi)}-${p.pada}</span>
        <span class="dig ${digWordCls(dig.level)}">${esc(digWord(dig.level))}</span></div>
        <div class="kar">${esc(TX.KARAKATVA[k].t)}</div>
        <ul><li>${esc(inHouse.t)} ${tone(inHouse.tone)}</li>
          ${digTx ? `<li><span class="lbl">स्थिति:</span> ${esc(digTx.t)} ${tone(digTx.tone)}</li>` : ''}
          ${comb ? `<li><span class="lbl">अस्त:</span> ${esc(TX.DIGNITY_NOTES.combust.t)} ${tone('savdhan')}</li>` : ''}
          ${lordLines}</ul></div></div>`
  }).join('')
  const dr = data.yogas.drishti.map((r) => `<tr>
      <td><span class="gname">${gb(r.key)}${esc(grahaHi(r.key))}</span></td>
      <td>${r.relativeHouses.map((h) => ordinalHi(h)).join(', ')}</td>
      <td>${r.housesFromLagna.map((h) => ordinalHi(h)).join(', ')}</td>
      <td>${r.planets.length ? esc(r.planets.map(grahaHi).join(', ')) : '—'}</td></tr>`).join('')
  return `<table><thead><tr><th>ग्रह</th><th>राशि</th><th>अंश</th><th>नक्षत्र</th><th>भाव</th><th>स्थिति</th><th>विंशोपक</th></tr></thead><tbody>${rows}</tbody></table>
    <h3>ग्रह-वार फल</h3>${cards}
    <h3>दृष्टि</h3><table><thead><tr><th>ग्रह</th><th>अपने भाव से</th><th>लग्न से</th><th>जिन पर दृष्टि</th></tr></thead><tbody>${dr}</tbody></table>`
}

// --- अध्याय 6: बारह भाव ----------------------------------------------------
function houses(data) {
  const av = data.ashtakavarga
  const cards = data.houses.map((h) => {
    const lordHouse = data.planets.find((p) => p.key === h.lord)?.house ?? 1
    const lordTx = TX.LORD_IN_HOUSE[h.house][lordHouse]
    const sav = av.sav.byHouse[h.house - 1]
    const pips = h.planets.length
      ? h.planets.map((k) => `<span class="gb" style="background:var(--${VAR[k]});width:5.2mm;height:5.2mm;font-size:7.4pt" title="${esc(grahaHi(k))}">${GRAHA_AB[k]}</span>`).join('')
      : '<span class="muted">कोई ग्रह नहीं</span>'
    return `<div class="bcard">
      <div class="hd"><span class="bno">${dev(h.house)}</span><span class="rashi">${esc(h.rashiName.hi)} (${h.rashi + 1})</span>
        <img class="ri" src="${rashiImg(h.rashi)}" alt="" width="24" height="24"${LAZY} style="margin-left:auto"></div>
      <div class="pips"><span class="sav lord">स्वामी <span class="gb" style="background:var(--${VAR[h.lord]});width:4.6mm;height:4.6mm;font-size:6.8pt">${GRAHA_AB[h.lord]}</span></span><span class="sav">सर्वाष्टक ${sav}</span>${pips}</div>
      <p>${esc(lordTx.t)} ${tone(lordTx.tone)}</p>
    </div>`
  }).join('')
  return `<div class="bhavgrid">${cards}</div>
    <p class="muted" style="margin-top:2mm">सर्वाष्टक बिंदु: 12 से अधिक = मज़बूत, 25 से अधिक = बहुत मज़बूत; 8 से कम = कमज़ोर माना जाता है।</p>`
}

// --- अध्याय 7: षोडश वर्ग ---------------------------------------------------
function vargas(data) {
  const cells = data.vargas.order.map((n) => {
    const ch = data.vargas.charts[n]
    const info = data.vargas.info[n]
    const tx = TX.VARGA_TEXT[n]
    const sens = data.vargas.sensitivity[n]
    const sensTxt = sens && (sens.backSec !== null || sens.forwardSec !== null)
      ? `जन्म-समय ${Math.min(...[sens.backSec, sens.forwardSec].filter((x) => x !== null))} सेकंड आगे-पीछे होने पर यह वर्ग बदल सकता है।`
      : `जन्म-समय ${data.vargas.sensitivityLimitSec / 60} मिनट आगे-पीछे होने पर भी यह वर्ग नहीं बदलता।`
    const pl = data.planets.map((x) => ({ key: x.key, ab: GRAHA_AB[x.key], rashi: ch.planets[x.key], retro: x.retro }))
    const svg = northChart({ size: 240, lagnaRashi: ch.lagna, planets: pl, centerLabel: `D${n} लग्न` })
    return `<div class="varga"><div>${svg.outerHTML}</div><div>
      <div class="vh">${esc(info.hi)}</div><p>${esc(tx.t)}</p><p class="muted">${esc(sensTxt)}</p></div></div>`
  }).join('')
  return `<div class="vargagrid">${cells}</div>`
}

// --- अध्याय 8: D60 ---------------------------------------------------------
function d60(data) {
  const row = (label, v, key) => `<tr><td>${key ? `<span class="gname">${gb(key)}${esc(label)}</span>` : esc(label)}</td>
    <td>#${v.number}</td><td>${esc(v.hi)}</td>
    <td>${v.shubha === true ? '<span class="tone s">शुभ</span>' : v.shubha === false ? '<span class="tone c">अशुभ</span>' : '<span class="tone m">मिश्र</span>'}</td></tr>`
  const rows = Object.entries(data.vargas.d60.planets).map(([key, v]) => row(grahaHi(key), v, key)).join('')
  return `<table><thead><tr><th>ग्रह</th><th>क्रमांक</th><th>देवता</th><th>भाव</th></tr></thead><tbody>${rows}${row('लग्न', data.vargas.d60.lagna, null)}</tbody></table>
    <p class="muted" style="margin-top:2mm">${esc(TX.D60_NOTE.shubha.t)}</p>
    <p class="muted">${esc(TX.D60_NOTE.ashubha.t)}</p>`
}

// --- अध्याय 9: योग और दोष --------------------------------------------------
export function yogaTextParts(y) {
  const tx = TX.YOGA_TEXT[y.id]
  if (!tx) return [{ t: y.text, tone: null }]
  if (tx.t) return [{ t: tx.t, tone: tx.tone ?? null }]
  const parts = [{ ...tx.base }]
  const d = y.detail ?? {}
  if (tx.ifWeak && d.weak) {
    const why = [d.debilitated ? 'नीच' : null, d.combust ? 'अस्त' : null].filter(Boolean).join(' और ')
    parts.push({ t: tx.ifWeak.t.replace('{why}', why), tone: tx.ifWeak.tone })
  }
  if (tx.ifCombust && d.mercuryCombust) parts.push({ ...tx.ifCombust })
  if (tx.ifBhanga && d.bhanga?.length) {
    parts.push({ t: tx.ifBhanga.t.replace('{planets}', grahaList(d.bhanga)), tone: tx.ifBhanga.tone })
  }
  return parts
}

export function yogaShown(y) {
  if (y.present) return true
  if (y.id === 'adhi' && y.partial) return true
  if (y.id === 'kemadruma' && y.detail?.empty) return true
  return false
}

function yogaStatus(y) {
  if (y.id === 'adhi' && y.partial && !y.present) return 'आंशिक'
  if (y.id === 'kemadruma' && !y.present && y.detail?.empty) return 'बनता है, पर भंग'
  return ''
}

function yogas(data) {
  const shown = data.yogas.list.filter(yogaShown)
  const absent = data.yogas.list.filter((y) => !yogaShown(y)).map((y) => y.hi)
  const cards = shown.map((y) => {
    const parts = yogaTextParts(y)
    const head = parts[0]?.t ?? ''
    const extra = parts.slice(1).map((p) => p.t).join(' ')
    const t = parts[0]?.tone
    const cls = y.id === 'adhi' && !y.present ? 'm' : (t === 'savdhan' ? 'c' : t === 'mishr' ? 'm' : 's')
    return `<div class="yoga ${cls}"><b>${esc(y.hi)}${yogaStatus(y) ? ` <small>(${esc(yogaStatus(y))})</small>` : ''}</b>${esc(head)}${extra ? ' ' + esc(extra) : ''}</div>`
  }).join('') || '<p class="muted">इस कुंडली में कोई विशेष योग नहीं बनता।</p>'
  const d = data.doshas
  const doshaCards = []
  if (d.mangal) {
    doshaCards.push(`<div class="rcard" style="border-top-color:var(--ma)"><div class="h">${gb('mars')} मंगल दोष — ${d.mangal.present ? 'है' : 'नहीं'}</div>
      <p>${esc(TX.DOSHA_TEXT.mangal.t)} ${tone(TX.DOSHA_TEXT.mangal.tone)}</p>
      <p class="muted">${esc(TX.DOSHA_TEXT.mangalNote.t)}</p></div>`)
  }
  doshaCards.push(`<div class="rcard" style="border-top-color:var(--ra)"><div class="h">${gb('rahu')} कालसर्प — ${d.kaalSarpa.present ? 'है' : 'नहीं'}</div>
    <p>${esc(TX.DOSHA_TEXT.kaalSarpa.t)} ${tone(TX.DOSHA_TEXT.kaalSarpa.tone)}</p></div>`)
  doshaCards.push(`<div class="rcard" style="border-top-color:var(--ju)"><div class="h">${gb('jupiter')} गुरु-चांडाल — ${d.guruChandal.present ? 'है' : 'नहीं'}</div>
    <p>${esc(TX.DOSHA_TEXT.guruChandal.t)} ${tone(TX.DOSHA_TEXT.guruChandal.tone)}</p></div>`)
  return `<div class="yogas">${cards}</div>
    ${absent.length ? `<p class="muted" style="margin-top:3mm">इस कुंडली में ये योग नहीं बनते: ${esc(absent.join(', '))}।</p>` : ''}
    <h3>दोष</h3><div class="remedy">${doshaCards.join('')}</div>`
}

// --- अध्याय 10: दशा -------------------------------------------------------
function dashaInfo(data, key) {
  const p = data.planets.find((x) => x.key === key)
  const owns = p?.owns ?? []
  const house = p?.house ?? null
  const cell = owns.length && house ? TX.LORD_IN_HOUSE[owns[0]][house] : null
  const pos = data.positions[key]
  return { owns, house, cell, dig: pos?.dignity ?? null, combust: Boolean(pos?.combustion?.combust) }
}
const topicOf = (h) => TX.HOUSE_TOPICS[h].t.replace(/।\s*$/, '')
const ownerPhrase = (owns) => (owns.length === 1 ? H(owns[0]) : `${ordinalHi(owns[0])} और ${H(owns[owns.length - 1])}`)
export function dashaPersonalLine(key, info) {
  const tpl = TX.DASHA_TEMPLATE
  if (!info.owns.length) {
    return tpl.noOwn.replace('{owner}', grahaHi(key)).replace('{sitHouse}', H(info.house)).replace('{sitTopic}', topicOf(info.house))
  }
  return tpl.hi.replace('{owner}', grahaHi(key)).replace('{ownHouse}', ownerPhrase(info.owns))
    .replace('{sitHouse}', H(info.house)).replace('{ownTopic}', info.owns.map(topicOf).join(' तथा ')).replace('{sitTopic}', topicOf(info.house))
}
export function dashaAntarLine(key, info) {
  return TX.DASHA_TEMPLATE.antar.replace('{antar}', grahaHi(key)).replace('{antarHouse}', H(info.house)).replace('{antarTopic}', topicOf(info.house))
}

function dasha(data) {
  const cur = data.dasha.current
  const birthMs = data.meta.birthMs
  const endMs = data.dasha.mahadashas[data.dasha.mahadashas.length - 1]?.toMs ?? birthMs
  const mdRows = data.dasha.mahadashas.map((m) => ({ key: m.key, hi: grahaHi(m.key), ab: GRAHA_AB[m.key], fromMs: m.fromMs, toMs: m.toMs }))
  const md = data.dasha.mahadashas.find((m) => m.key === cur.maha.key && m.fromMs === cur.maha.fromMs) ?? data.dasha.mahadashas.find((m) => m.key === cur.maha.key)
  const adRows = (data.dasha.tree?.mahadashas ?? []).find((m) => m.key === cur.maha.key && m.fromMs === cur.maha.fromMs)?.antardashas?.map((a) => ({ key: a.key, hi: grahaHi(a.key), ab: GRAHA_AB[a.key], fromMs: a.fromMs, toMs: a.toMs })) ?? []
  const curTx = TX.DASHA[VAR[cur.maha.key]]
  const mi = dashaInfo(data, cur.maha.key)
  const ai = dashaInfo(data, cur.antar.key)
  const rows = data.dasha.mahadashas.map((m) => {
    const i = dashaInfo(data, m.key)
    const ownLabel = i.owns.length ? `स्वामी: ${i.owns.map((h) => ordinalHi(h)).join(', ')} भाव · बैठा: ${H(i.house)}` : `स्वामी: — · बैठा: ${H(i.house)}`
    const running = cur.maha.key === m.key && cur.maha.fromMs === m.fromMs
    return `<tr><td><span class="gname">${gb(m.key)}${esc(grahaHi(m.key))}${running ? ' <span class="tone m">चल रही</span>' : ''}</span></td>
      <td>${dateHi(m.fromMs)}</td><td>${dateHi(m.toMs)}</td><td class="muted">${esc(ownLabel)}</td></tr>`
  }).join('')
  return `<h3>जीवन-पट्टी: जन्म से 100 वर्ष</h3>${dashaTimeline(mdRows, { fromMs: birthMs, toMs: endMs, nowMs: data.meta.nowMs }).outerHTML}
    ${adRows.length ? `<h3>${esc(grahaHi(cur.maha.key))} महादशा के भीतर की अंतर्दशाएँ</h3>${dashaTimeline(adRows, { fromMs: md.fromMs, toMs: md.toMs, nowMs: data.meta.nowMs }).outerHTML}` : ''}
    <div class="dashcard" style="margin-top:5mm">
      <div class="orb" style="background:var(--${VAR[cur.maha.key]})">${GRAHA_AB[cur.maha.key]}</div>
      <div><div class="t">अभी ${esc(grahaHi(cur.maha.key))} की महादशा · ${esc(grahaHi(cur.antar.key))} की अंतर्दशा</div>
        <div class="saransh">${esc(dashaPersonalLine(cur.maha.key, mi))} ${tone(mi.cell?.tone ?? 'mishr')}</div>
        <div class="saransh">${esc(dashaAntarLine(cur.antar.key, ai))} ${tone(ai.cell?.tone ?? 'mishr')}</div>
        ${curTx ? `<div class="muted" style="margin-top:1mm">${esc(curTx.t)} ${tone(curTx.tone)}</div>` : ''}</div>
    </div>
    <h3>महादशाएँ (जन्म से 100 वर्ष)</h3>
    <table><thead><tr><th>महादशा</th><th>से</th><th>तक</th><th>स्वामी · बैठा</th></tr></thead><tbody>${rows}</tbody></table>`
}

// --- अध्याय 11: साढ़ेसाती, ढैया, गोचर --------------------------------------
function sadesati(data) {
  const s = data.sadesati
  const birthMs = data.meta.birthMs
  const endMs = birthMs + 100 * 365.25 * 86400000
  const cycles = s.sadesatiCycles ?? []
  const dhaiya = s.dhaiyaCycles ?? []
  const now = s.current
  const curTx = now
    ? (now.kind === 'sadesati'
      ? TX.DOSHA_TEXT[`sadesati${now.runningPhase?.phase === 12 ? 1 : now.runningPhase?.phase === 1 ? 2 : 3}`]
      : TX.DOSHA_TEXT.dhaiya)
    : null
  const phaseName = (ph) => (ph === 12 ? 'पहला चरण' : ph === 1 ? 'दूसरा चरण' : 'तीसरा चरण')
  const DAY = 86400000

  // हर चक्र: एक पंक्ति + तीनों चरणों की तारीख़ें + शनि के लौटने का नोट
  const noteText = (n, kindName) => {
    const r = rashiHi(n.rashi)
    if (n.dir === 'retro') return `बीच में ${dateHi(n.fromMs)} से ${dateHi(n.toMs)} शनि फिर ${r} में लौटा`
    if (n.dir === 'back') return `बीच में ${dateHi(n.fromMs)} से ${dateHi(n.toMs)} शनि पीछे ${r} में लौटा`
    if (n.dir === 'forward') return `बीच में ${dateHi(n.fromMs)} से ${dateHi(n.toMs)} शनि आगे ${r} में गया, फिर लौटा (${kindName} में थोड़ा विराम)`
    return `बीच में ${dateHi(n.fromMs)} से ${dateHi(n.toMs)} शनि ${r} में रहा (थोड़ा विराम)`
  }
  const cycleRows = cycles.map((c, i) => {
    const phaseTxt = (c.phases ?? [])
      .map((p) => `${phaseName(p.phase)} ${dateHi(p.fromMs)} – ${dateHi(p.toMs)}`).join(' · ')
    const noteTxt = (c.notes ?? []).map((n) => noteText(n, 'साढ़ेसाती')).join(' · ')
    return `<tr><td><b>साढ़ेसाती ${dev(i + 1)}</b><br><small>${dateHi(c.fromMs)} से ${dateHi(c.toMs)}</small></td>
      <td><small>${esc(phaseTxt)}</small>${noteTxt ? `<br><small class="muted">${esc(noteTxt)}</small>` : ''}</td></tr>`
  }).join('')
  // ढैया: दो-स्तंभ में (पन्ना बचे)
  const dhaiyaItems = dhaiya.map((d) => {
    const notes = (d.notes ?? []).map((n) => noteText(n, 'ढैया')).join(' · ')
    return `<div class="drow"><b>ढैया</b> <small>${dateHi(d.fromMs)} से ${dateHi(d.toMs)}</small>
      <br><small class="muted">शनि जन्म-चंद्र से ${H(d.phases?.[0]?.phase ?? 4)}${notes ? ` · ${esc(notes)}` : ''}</small></div>`
  }).join('')

  const g = data.gochar
  const cards = Object.keys(g.main).map((k) => {
    const p = g.main[k]
    const tx = TX.GOCHAR[VAR[k]]?.[p.houseFromMoon]
    return `<div class="bcard"><div class="hd">${gb(k)}<span class="rashi">${esc(grahaHi(k))} · ${esc(rashiHi(p.rashi))}</span>
        <span class="sav" style="margin-left:auto">चंद्र से ${H(p.houseFromMoon)}</span></div>
      <p>${tx ? `${esc(tx.t)} ${tone(tx.tone)}` : `<span class="muted">लग्न से ${H(p.houseFromLagna)} · </span>${tone(p.shubhaFromMoon ? 'shubh' : 'savdhan')}`}</p></div>`
  }).join('')

  return `${now ? `<p><b>अभी ${esc(now.label)} चल रही है।</b> ${esc(curTx?.t ?? '')}</p>` : '<p><b>अभी साढ़ेसाती या ढैया नहीं चल रही।</b></p>'}
    <h3>साढ़ेसाती और ढैया — पूरा जीवन</h3>
    ${sadesatiChart({ cycles, dhaiya, fromMs: birthMs, toMs: endMs, nowMs: data.meta.nowMs }).outerHTML}
    <div class="legend"><span><i style="background:#8E9AC9"></i>पहला चरण</span><span><i style="background:#3949AB"></i>दूसरा चरण</span><span><i style="background:#5C6BC0"></i>तीसरा चरण</span><span><i style="background:#C3CAE8"></i>ढैया</span></div>
    <table class="tight" style="margin-top:2mm"><tbody>${cycleRows}</tbody></table>
    ${dhaiyaItems ? `<h3 style="margin-top:3mm">ढैया</h3><div class="dhaiya-grid">${dhaiyaItems}</div>` : ''}
    <h3>आज का गोचर (जन्म-चंद्र से)</h3><div class="bhavgrid g4">${cards}</div>`
}

// --- अध्याय 12: अष्टकवर्ग ---------------------------------------------------
function ashtakavarga(data) {
  const av = data.ashtakavarga
  const keys = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']
  const rows = keys.map((k) => ({ key: k, hi: grahaHi(k), ab: GRAHA_AB[k], values: av.bav[k].byHouse }))
  return `<h3>सर्वाष्टकवर्ग: बारह भावों का बल</h3>${savBars(av.sav.byHouse, { lagnaRashi: data.summary.lagnaRashi }).outerHTML}
    <div class="legend"><span><i style="background:var(--shubh)"></i>28 से अधिक (बलवान)</span><span><i style="background:#C9CCD9"></i>28 या कम</span><span>बिंदीदार रेखा: औसत 28</span></div>
    <h3>भिन्नाष्टकवर्ग: हर ग्रह के बिंदु</h3>${bavHeatmap(rows).outerHTML}
    <div class="legend"><span>हल्का = कम बिंदु, गहरा = अधिक बिंदु (0 से 8)</span></div>
    <p class="muted" style="margin-top:2mm">कुल योग सूर्य 48, चंद्र 49, मंगल 39, बुध 54, गुरु 56, शुक्र 52, शनि 39 — सर्वाष्टक ${av.sav.total}।</p>`
}

// --- अध्याय 13: उपाय और रत्न -----------------------------------------------
function upaya(data) {
  const st = data.strength.planets
  const weak = Object.entries(st).sort((a, b) => a[1].total - b[1].total).slice(0, 3).map(([k]) => k)
  const cards = weak.map((k) => {
    const p = data.planets.find((x) => x.key === k)
    const dig = data.positions[k].dignity
    return `<div class="rcard" style="border-top-color:var(--${VAR[k]})">
      <div class="h">${gb(k)}${esc(grahaHi(k))}</div>
      <div class="meta"><span>${H(p.house)}</span><span>${esc(digWord(dig.level))}</span><span>विंशोपक ${st[k].total}</span></div>
      <p>${esc(TX.UPAYA[VAR[k]].free)}</p></div>`
  }).join('')
  const r = data.ratna
  return `<h3>पहले निःशुल्क उपाय</h3><div class="remedy">${cards}</div>
    <div class="gem"><div class="stone" style="background:linear-gradient(135deg,#FFD180,#EF7D1A)"></div>
      <div><b>जीवन रत्न: ${esc(r.jeevan.gem.hi)} (${esc(grahaHi(r.jeevan.planet))})</b>
        <div style="font-size:9pt">भाग्य रत्न: ${esc(r.bhagya.gem.hi)} (${esc(grahaHi(r.bhagya.planet))}) · कारक रत्न: ${esc(r.karak.gem.hi)} (${esc(grahaHi(r.karak.planet))})</div>
        <div style="font-size:8.5pt;color:var(--savdhan);margin-top:1mm">${esc(TX.UPAYA.caution)}</div></div></div>`
}

// --- अध्याय 14: शब्दकोश और पद्धति -----------------------------------------
function glossary() {
  const items = Object.values(TX.GLOSSARY).map((line) => {
    const [term, ...rest] = String(line).split(' — ')
    const body = rest.join(' — ')
    return `<div><b>${esc(term)}</b> — ${esc(body)}</div>`
  }).join('')
  return `<div class="glossary">${items}</div>
    <h3>गणना-पद्धति</h3>
    <p class="muted">लाहिरी अयनांश, whole-sign भाव, mean राहु, Swiss Ephemeris (WASM)। साढ़ेसाती और गोचर उसी ephemeris से दिन-प्रतिदिन गिनकर निकाले गए हैं। यह सब आपके ही browser में बनता है — कोई server, कोई tracker नहीं।</p>
    <div class="closing"><div class="om">॥ शुभमस्तु ॥</div>
      <p>${esc(TX.CLOSING_NOTE)}</p>
      <p style="color:var(--marigold);font-weight:600">mybapuji.com/kundli · कुंडली मिलान · पंचांग · मुफ़्त ज्योतिष पुस्तकें</p></div>`
}

// --- मुखपृष्ठ ---------------------------------------------------------------
function cover(data) {
  const m = data.meta
  const name = m.name?.trim() || 'जातक'
  const birth = m.local
    ? `${m.local.day} ${monthHi(m.local.month)} ${m.local.year}, ${timeWords(m.local.hour, m.local.minute)}, ${m.place || ''}`
    : (m.place || '—')
  const p = data.avakahada.panchang
  const pan = p && !p.error
    ? `<div class="pan"><span>वार <b>${esc(VAARAS[p.vaar]?.hi ?? '—')}</b></span>
        <span>तिथि <b>${esc(`${p.tithi?.paksha === 'krishna' ? 'कृष्ण' : 'शुक्ल'} ${TITHIS[(p.tithi?.index ?? 1) - 1]?.hi ?? ''}`)}</b></span>
        <span>योग <b>${esc(YOGAS[(p.yoga?.index ?? 1) - 1]?.hi ?? '')}</b></span>
        <span>करण <b>${esc(KARANAS[p.karana?.numbers?.[0] ?? 0]?.hi ?? '')}</b></span></div>`
    : ''
  const chart = northChart({ size: 320, lagnaRashi: data.summary.lagnaRashi, planets: vizPlanets(data.planets), theme: 'dark' })
  return `<section class="cover" id="cover">
    ${starfield().outerHTML}
    <div class="top"><div class="site">mybapuji.com</div><div class="om">॥ श्री गणेशाय नमः ॥</div></div>
    <div class="chart">${chart.outerHTML}</div>
    <h1>जन्म कुंडली फलादेश</h1>
    <div class="sub">पराशरी पद्धति के अनुसार</div>
    <div class="name">${esc(name)}</div>
    <div class="birth">${esc(birth)}</div>
    <div class="keys">
      <div class="key"><img src="${rashiImg(data.summary.lagnaRashi)}" alt="" width="49" height="49"><div class="v">${esc(rashiHi(data.summary.lagnaRashi))}</div><div class="k">लग्न</div></div>
      <div class="key"><img src="${rashiImg(data.summary.moonRashi)}" alt="" width="49" height="49"><div class="v">${esc(rashiHi(data.summary.moonRashi))}</div><div class="k">चंद्र राशि</div></div>
      <div class="key" style="display:flex;flex-direction:column;justify-content:flex-end"><div class="v">${esc(data.summary.nakshatraName.hi)}</div><div class="k">नक्षत्र, ${esc(ordinalHi(data.summary.pada, 'चरण'))}</div></div>
      <div class="key" style="display:flex;flex-direction:column;justify-content:flex-end"><div class="v">${esc(grahaHi(data.summary.mahadasha))}</div><div class="k">चल रही महादशा</div></div>
    </div>
    ${pan}
    <div class="foot">यह फलादेश आपके ही फ़ोन या कंप्यूटर में बना है — जन्म-विवरण कहीं भेजा या सेव नहीं हुआ</div>
  </section>`
}
const MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
const monthHi = (m) => MONTHS[(m - 1) % 12]
function timeWords(h, min) {
  const word = h < 4 ? 'रात' : h < 12 ? 'सुबह' : h < 16 ? 'दोपहर' : h < 20 ? 'शाम' : 'रात'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${word} ${h12}:${String(min).padStart(2, '0')} बजे`
}

// --- साझा ------------------------------------------------------------------
export function lordPlacements(planet) {
  if (planet.key === 'rahu' || planet.key === 'ketu') return []
  return (planet.owns ?? [])
    .map((own) => ({ own, inHouse: planet.house, tx: TX.LORD_IN_HOUSE[own]?.[planet.house] ?? null }))
    .filter((x) => x.tx)
}
const DIG_WORDS = {
  exalted: 'उच्च', debilitated: 'नीच', own: 'स्वराशि', moolatrikona: 'मूलत्रिकोण', adhimitra: 'अतिमित्र',
  mitra: 'मित्र', sama: 'सम', shatru: 'शत्रु', adhishatru: 'अधिशत्रु', none: '—',
}
const digWord = (level) => DIG_WORDS[level] ?? '—'
const digWordCls = (level) => (['exalted', 'moolatrikona', 'own', 'adhimitra', 'mitra'].includes(level) ? 'up' : ['debilitated', 'shatru', 'adhishatru'].includes(level) ? 'dn' : 'eq')

function table(headers, rows) {
  return `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
}

const CH = [
  { id: 's2', num: 2, title: 'आपकी कुंडली एक नज़र में', intro: 'पूरी report का सार एक पन्ने पर: लग्न, मन (चंद्र), चल रही दशा, ग्रहों का बल और मुख्य योग।', body: glance },
  { id: 's3', num: 3, title: 'जन्म-विवरण, पंचांग और अवकहड़ा', intro: TX.CHAPTER_INTRO.panchang, body: details },
  { id: 's4', num: 4, title: 'मुख्य कुंडलियाँ', intro: TX.CHAPTER_INTRO.sudarshan, body: charts },
  { id: 's5', num: 5, title: 'ग्रह और उनकी स्थिति', intro: 'हर ग्रह अपने रंग से पहचाना गया है। यही रंग पूरी report के चार्ट, ग्राफ़ और दशा-पट्टी में भी है।', body: planets },
  { id: 's6', num: 6, title: 'बारह भाव', intro: TX.CHAPTER_INTRO.bhav, body: houses },
  { id: 's7', num: 7, title: 'षोडश वर्ग', intro: TX.CHAPTER_INTRO.vargas, body: vargas },
  { id: 's8', num: 8, title: 'षष्ट्यंश (D60)', intro: TX.CHAPTER_INTRO.d60, body: d60 },
  { id: 's9', num: 9, title: 'योग और दोष', intro: TX.CHAPTER_INTRO.yogas, body: yogas },
  { id: 's10', num: 10, title: 'विंशोत्तरी दशा', intro: TX.CHAPTER_INTRO.dasha, body: dasha },
  { id: 's11', num: 11, title: 'साढ़ेसाती, ढैया और आज का गोचर', intro: TX.CHAPTER_INTRO.gochar, body: sadesati },
  { id: 's12', num: 12, title: 'अष्टकवर्ग', intro: TX.CHAPTER_INTRO.ashtakavarga, body: ashtakavarga },
  { id: 's13', num: 13, title: 'उपाय और रत्न', intro: TX.CHAPTER_INTRO.upaya, body: upaya },
  { id: 's14', num: 14, title: 'शब्दकोश और गणना-पद्धति', intro: TX.CHAPTER_INTRO.shabdkosh, body: glossary },
]

// पूरा पन्ना (print/PDF और /kundli-phal/)
// छवियों का loading-गुण (print में lazy नहीं, वरना print से पहले load नहीं होतीं)
let LAZY = ' loading="lazy"'

export function renderReport(data, { lazyImages = true } = {}) {
  LAZY = lazyImages ? ' loading="lazy"' : ''
  if (!data || data.error) return '<p class="msg">कुंडली नहीं बन सकी — जन्म-विवरण जाँचें।</p>'
  const chapters = CH.map((c) => `<section class="ch" id="${c.id}">
    <header class="chap"><div class="num">${dev(c.num)}</div><h2>${esc(c.title)}</h2>
      <p class="intro">${esc(c.intro)}</p></header>
    ${c.body(data)}</section>`).join('\n')
  return `${cover(data)}\n${contents()}\n${chapters}`
}

// kundli पेज का online section — अध्याय <details> में, पहले दो खुले
export function renderOnline(data) {
  if (!data || data.error) return '<p class="muted">फलादेश नहीं बन सका।</p>'
  const chips = CH.map((c) => `<a class="po-chip" href="#po-${c.id}">${esc(c.title)}</a>`).join('')
  // सब अध्याय पहले से खुले (टास्क 06-ख) — शीर्षक दबाकर बंद किए जा सकते हैं
  const body = CH.map((c, i) => `<details id="po-${c.id}" open>
      <summary><span class="n">${dev(i + 1)}</span>${esc(c.title)}<span class="arrow">›</span></summary>
      <div class="po-body"><p class="muted">${esc(c.intro)}</p>${c.body(data)}</div>
    </details>`).join('')
  return `<div class="po-chips">${chips}</div>${body}`
}

export { CH as CHAPTERS, dev }
