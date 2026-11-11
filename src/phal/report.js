// report.js — फलादेश report बनाने वाला हिस्सा (HTML, कोई गणना नहीं).
//
// सारा data `buildPhalData()` से आता है और सारा text `text-hi.js` से — यहाँ
// सिर्फ़ जोड़कर page बनाया जाता है. हर अध्याय नए पन्ने से शुरू होता है और उसकी
// पहली पेटी में "यह भाग क्या बताता है" होती है.

import { buildNorthChart, buildSouthChart } from '../charts.js'
import { RASHIS, GRAHAS, NAKSHATRAS } from '../i18n.js'
import * as TX from './text-hi.js'
import { ordinalHi, grahaHi, rashiHi } from './text.js'

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const KEY_BY = { sun: 'su', moon: 'mo', mars: 'ma', mercury: 'me', jupiter: 'ju', venus: 've', saturn: 'sa', rahu: 'ra', ketu: 'ke' }
const TONE_WORD = { shubh: 'शुभ', mishr: 'मिश्र', savdhan: 'सावधानी' }

function toneBadge(tone) {
  if (!tone) return ''
  return `<span class="tone tone-${tone}"><i aria-hidden="true"></i>${TONE_WORD[tone]}</span>`
}

// "चौथे भाव" — कहीं "4वें" न लिखा जाए
const H = (n) => ordinalHi(n, 'भाव')
const dateHi = (ms) => {
  const d = new Date(ms)
  const p = (x) => String(x).padStart(2, '0')
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`
}
const degStr = (d) => {
  const deg = Math.floor(d)
  const min = Math.round((d - deg) * 60)
  return `${deg}° ${String(min).padStart(2, '0')}′`
}

function chartKundli(data, vargaChart = null) {
  const planets = data.planets.map((p) => {
    const rashi = vargaChart ? vargaChart.planets[p.key] : p.rashi
    return {
      key: p.key,
      short: GRAHAS.find((g) => g.key === p.key)?.short ?? p.key,
      rashi,
      house: vargaChart
        ? ((rashi - vargaChart.lagna + 12) % 12) + 1
        : p.house,
      degInSign: vargaChart ? 0 : p.degInSign,
      retro: p.retro,
    }
  })
  return { ascendant: { rashi: vargaChart ? vargaChart.lagna : data.ascendant.rashi }, planets }
}

function chapter(id, num, title, intro) {
  return `<section class="chapter" id="${id}">
  <header class="ch-head"><span class="ch-num">${num}</span><h2>${esc(title)}</h2></header>
  <p class="ch-intro">${esc(intro)}</p>`
}
const endChapter = () => '</section>'

function table(headers, rows, cls = '') {
  return `<table class="tbl ${cls}"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
}

// --- अध्याय 1: मुखपृष्ठ ------------------------------------------------------
function cover(data) {
  const m = data.meta
  const name = m.name?.trim() || 'जातक'
  const birth = m.local
    ? `${String(birth2(m.local.day))}-${String(birth2(m.local.month))}-${m.local.year}, ${String(birth2(m.local.hour))}:${String(birth2(m.local.minute))}`
    : '—'
  const place = m.place || '—'
  const lagna = data.summary.lagnaName
  const chart = buildNorthChart(chartKundli(data), { varga: 'D1', ariaLabel: 'लग्न कुंडली' })
  return `<section class="cover">
  <div class="cover-rule"></div>
  <p class="cover-brand">mybapuji.com</p>
  <h1>जन्म कुंडली फलादेश</h1>
  <p class="cover-name">${esc(name)}</p>
  <p class="cover-birth">${esc(birth)} · ${esc(place)}</p>
  <div class="cover-chart">${chart.outerHTML}</div>
  <div class="cover-boxes">
    ${coverBox('लग्न', lagna.hi)}
    ${coverBox('राशि', data.summary.moonName.hi)}
    ${coverBox('नक्षत्र', data.summary.nakshatraName.hi)}
    ${coverBox('चल रही दशा', grahaHi(data.summary.mahadasha))}
  </div>
  <p class="cover-note">पराशरी पद्धति · लाहिरी अयनांश · पूरी गणना आपके ही browser में</p>
</section>`
}
const birth2 = (n) => String(n ?? 0).padStart(2, '0')
const coverBox = (label, value) => `<div class="cbox"><span>${esc(label)}</span><b>${esc(value)}</b></div>`

// --- विषय-सूची ---------------------------------------------------------------
function contents() {
  const items = [
    ['s2', 'एक नज़र में'], ['s3', 'जन्म-विवरण और अवकहड़ा'], ['s4', 'मुख्य कुंडलियाँ'],
    ['s5', 'ग्रह और उनकी स्थिति'], ['s6', 'बारह भाव'], ['s7', 'षोडश वर्ग'], ['s8', 'षष्ट्यंश (D60)'],
    ['s9', 'योग और दोष'], ['s10', 'विंशोत्तरी दशा'], ['s11', 'साढ़ेसाती और गोचर'],
    ['s12', 'अष्टकवर्ग'], ['s13', 'उपाय और रत्न'], ['s14', 'शब्दकोश और पद्धति'],
  ]
  return `<section class="chapter contents">
  <header class="ch-head"><span class="ch-num">1</span><h2>विषय-सूची</h2></header>
  <p class="ch-intro">यह फलादेश चौदह भागों में है — हर भाग नए पन्ने से शुरू होता है।</p>
  <ol class="toc">${items.map(([id, t], i) => `<li><span>${i + 2}</span> ${esc(t)}</li>`).join('')}</ol>
</section>`
}

// --- अध्याय 2: एक नज़र में ---------------------------------------------------
function glance(data) {
  const st = data.strength.planets
  const sorted = Object.entries(st).sort((a, b) => b[1].total - a[1].total)
  const strong = sorted.slice(0, 2).map(([k, v]) => `${grahaHi(k)} (${v.total})`).join(', ')
  const weak = sorted.slice(-2).map(([k, v]) => `${grahaHi(k)} (${v.total})`).join(', ')
  const cur = data.dasha.current
  const yogas = data.yogas.present.slice(0, 4).map((y) => y.hi).join(', ') || '—'
  const doshas = [
    data.doshas.mangal?.present ? 'मंगल दोष' : null,
    data.doshas.kaalSarpa.present ? 'कालसर्प' : null,
    data.doshas.guruChandal.present ? 'गुरु-चांडाल' : null,
    data.sadesati.current ? data.sadesati.current.label : null,
  ].filter(Boolean).join(', ') || 'कोई विशेष दोष नहीं'
  return chapter('s2', '2', 'एक नज़र में', 'इस भाग में पूरी कुंडली का सार है — लग्न, राशि, नक्षत्र, बलवान और कमज़ोर ग्रह, चल रही दशा और मुख्य योग-दोष।') +
    table(['विषय', 'संक्षेप'], [
      ['लग्न', `${esc(data.summary.lagnaName.hi)}${toneBadge('mishr')}`],
      ['चंद्र-राशि', esc(data.summary.moonName.hi)],
      ['जन्म-नक्षत्र', `${esc(data.summary.nakshatraName.hi)} (${esc(ordinalHi(data.summary.pada, 'पाद'))})`],
      ['बलवान ग्रह', esc(strong)],
      ['अपेक्षाकृत कमज़ोर', esc(weak)],
      ['चल रही दशा', `${esc(grahaHi(cur.maha.key))} — ${esc(grahaHi(cur.antar.key))} — ${esc(grahaHi(cur.pratyantar.key))}`],
      ['मुख्य योग', esc(yogas)],
      ['दोष / साढ़ेसाती', esc(doshas)],
    ]) + endChapter()
}

// --- अध्याय 3: जन्म-विवरण, पंचांग, अवकहड़ा ---------------------------------
function details(data) {
  const m = data.meta
  const av = data.avakahada
  const p = av.panchang
  const rows = [
    ['नाम', esc(m.name || '—')],
    ['जन्म तिथि', m.local ? `${birth2(m.local.day)}-${birth2(m.local.month)}-${m.local.year}` : '—'],
    ['जन्म समय', m.local ? `${birth2(m.local.hour)}:${birth2(m.local.minute)}` : '—'],
    ['जगह', esc(m.place || '—')],
    ['अयनांश (लाहिरी)', `${data.meta.ayanamsa.toFixed(3)}°`],
  ]
  if (p && !p.error) {
    rows.push(['तिथि', esc(`${p.tithi?.paksha === 'krishna' ? 'कृष्ण' : 'शुक्ल'} ${p.tithi?.index ?? '—'}`)])
    rows.push(['नक्षत्र / योग', esc(`${p.nakshatra?.index ?? '—'} / ${p.yoga?.index ?? '—'}`)])
    rows.push(['सूर्योदय', esc(p.sunrise || '—')])
  }
  rows.push(['वर्ण · वश्य', esc(`${av.varna.hi} · ${av.vashya.hi}`)])
  rows.push(['योनि · गण · नाड़ी', esc(`${av.yoni.hi} · ${av.gana.hi} · ${av.nadi.hi}`)])
  rows.push(['नाम-अक्षर', esc(`${av.nakshatra.letter} (${av.nakshatra.name.hi}, ${ordinalHi(av.nakshatra.pada, 'पाद')})`)])
  rows.push(['राशि-स्वामी', esc(av.rashi.lordLabel.hi)])
  rows.push(['नक्षत्र-स्वामी', esc(av.nakshatra.lordLabel.hi)])
  rows.push(['आत्मकारक', esc(`${grahaHi(av.atmakaraka.key)} · कारकांश ${rashiHi(av.karakamsha)}`)])
  return chapter('s3', '3', 'जन्म-विवरण और अवकहड़ा', TX.CHAPTER_INTRO.panchang) +
    table(['विवरण', 'मान'], rows) + endChapter()
}

// --- अध्याय 4: कुंडलियाँ ----------------------------------------------------
function charts(data) {
  const d1 = chartKundli(data)
  const d9 = chartKundli(data, data.vargas.charts[9])
  const north = buildNorthChart(d1, { varga: 'D1', ariaLabel: 'लग्न कुंडली (D1)' })
  const nav = buildNorthChart(d9, { varga: 'D9', ariaLabel: 'नवांश (D9)' })
  const south = buildSouthChart(d1, {}, { varga: 'D1', ariaLabel: 'दक्षिण भारतीय कुंडली' })
  const sud = table(['भाव', 'लग्न से', 'चंद्र से', 'सूर्य से'],
    data.avakahada.sudarshan.map((r) => [
      H(r.house), esc(rashiHi(r.fromLagna)), esc(rashiHi(r.fromMoon)), esc(rashiHi(r.fromSun)),
    ]))
  return chapter('s4', '4', 'मुख्य कुंडलियाँ', TX.CHAPTER_INTRO.sudarshan) +
    `<div class="chart-grid">
      <figure class="phal-chart"><figcaption>लग्न कुंडली (D1)</figcaption>${north.outerHTML}</figure>
      <figure class="phal-chart"><figcaption>नवांश (D9)</figcaption>${nav.outerHTML}</figure>
    </div>
    <figure class="phal-chart wide"><figcaption>दक्षिण भारतीय शैली (D1)</figcaption>${south.outerHTML}</figure>
    <h3>सुदर्शन दृष्टि</h3>${sud}` + endChapter()
}

// --- अध्याय 5: ग्रह ---------------------------------------------------------
function planets(data) {
  const rows = data.planets.map((p) => [
    `${esc(p.name.hi)}${p.retro ? ' <small>(व)</small>' : ''}${data.positions[p.key].combustion.combust ? ' <small>(अ)</small>' : ''}`,
    esc(p.rashiName.hi),
    esc(degStr(p.degInSign)),
    esc(`${p.nakshatraName.hi}-${p.pada}`),
    H(p.house),
    esc(p.summary),
    p.vimshopaka == null ? '—' : `${p.vimshopaka} <small>${esc(p.vimshopakaBand)}</small>`,
  ])
  let html = chapter('s5', '5', 'ग्रह और उनकी स्थिति', TX.CHAPTER_INTRO.grahas) +
    table(['ग्रह', 'राशि', 'अंश', 'नक्षत्र-पाद', 'भाव', 'स्थिति', 'विंशोपक'], rows)

  for (const p of data.planets) {
    const k = KEY_BY[p.key]
    const inHouse = TX.PLANET_IN_HOUSE[k][p.house]
    const lordTx = TX.LORD_IN_HOUSE[p.house][p.house] // स्वामी अपने भाव में (संदर्भ)
    const dig = data.positions[p.key].dignity
    const digTx = TX.DIGNITY_NOTES[dig.level]
    html += `<div class="pblock">
      <h3>${esc(p.name.hi)} — ${H(p.house)}, ${esc(p.rashiName.hi)}</h3>
      <p class="muted">${esc(TX.KARAKATVA[k].t)}</p>
      <p>${esc(inHouse.t)} ${toneBadge(inHouse.tone)}</p>
      ${digTx ? `<p class="muted">${esc(digTx.t)} ${toneBadge(digTx.tone)}</p>` : ''}
      ${p.key === 'rahu' || p.key === 'ketu' ? '' : `<p class="muted">स्वामी ${H(p.house)} का फल: ${esc(lordTx.t)}</p>`}
    </div>`
  }
  // विंशोपक बल की तालिका (20 में से)
  const st = data.strength.planets
  const powerRows = Object.entries(st).sort((a, b) => b[1].total - a[1].total).map(([k, v]) => [
    esc(grahaHi(k)), `${v.total} / 20`, esc(v.bandHi),
  ])
  html += `<h3>विंशोपक बल</h3>` + table(['ग्रह', 'बल', 'श्रेणी'], powerRows) +
    `<p class="muted">15 से अधिक पूर्ण, 10–15 मध्यम, 5–10 अल्प, 5 से कम क्षीण। यह अंक सोलहों वर्गों से बनता है।</p>`

  // दृष्टि (aspects)
  const dr = data.yogas.drishti.map((r) => [
    esc(grahaHi(r.key)),
    r.relativeHouses.map((h) => ordinalHi(h)).join(', '),
    r.housesFromLagna.map((h) => ordinalHi(h)).join(', '),
    r.planets.length ? esc(r.planets.map(grahaHi).join(', ')) : '—',
    esc(r.label),
  ])
  html += `<h3>दृष्टि</h3>` + table(['ग्रह', 'अपने भाव से', 'लग्न से', 'जिन पर दृष्टि', 'मान्यता'], dr)

  return html + endChapter()
}

// --- अध्याय 6: बारह भाव -----------------------------------------------------
function houses(data) {
  const av = data.ashtakavarga
  const rows = data.houses.map((h) => {
    const lordHouse = data.planets.find((p) => p.key === h.lord)?.house ?? 1
    const lordTx = TX.LORD_IN_HOUSE[h.house][lordHouse]
    const bav = av.sav.byHouse[h.house - 1]
    return [
      H(h.house),
      esc(h.rashiName.hi),
      `${esc(h.lordName.hi)} → ${H(lordHouse)}`,
      h.planets.length ? esc(h.planets.map(grahaHi).join(', ')) : '—',
      `${bav}`,
      `${esc(lordTx.t)} ${toneBadge(lordTx.tone)}`,
    ]
  })
  return chapter('s6', '6', 'बारह भाव', TX.CHAPTER_INTRO.bhav) +
    table(['भाव', 'राशि', 'स्वामी', 'बैठे ग्रह', 'सर्वाष्टक', 'भाव-फल'], rows, 'wide-last') +
    `<p class="muted">सर्वाष्टक बिंदु: 12 से अधिक = मज़बूत, 25 से अधिक = बहुत मज़बूत; 8 से कम = कमज़ोर माना जाता है।</p>` +
    endChapter()
}

// --- अध्याय 7: षोडश वर्ग ----------------------------------------------------
function vargas(data) {
  let html = chapter('s7', '7', 'षोडश वर्ग', TX.CHAPTER_INTRO.vargas)
  for (const n of data.vargas.order) {
    const ch = data.vargas.charts[n]
    const info = data.vargas.info[n]
    const tx = TX.VARGA_TEXT[n]
    const sens = data.vargas.sensitivity[n]
    const sensTxt = sens && (sens.backSec !== null || sens.forwardSec !== null)
      ? `जन्म-समय ${Math.min(...[sens.backSec, sens.forwardSec].filter((x) => x !== null))} सेकंड आगे-पीछे होने पर यह वर्ग बदल सकता है।`
      : `जन्म-समय ${data.vargas.sensitivityLimitSec / 60} मिनट आगे-पीछे होने पर भी यह वर्ग नहीं बदलता।`
    const svg = buildNorthChart(chartKundli(data, ch), { varga: `D${n}`, showDegrees: false, ariaLabel: info.hi })
    html += `<div class="varga-row">
      <figure class="phal-chart small">${svg.outerHTML}</figure>
      <div><h3>${esc(info.hi)}</h3><p>${esc(tx.t)}</p><p class="muted">${esc(sensTxt)}</p></div>
    </div>`
  }
  const rows = data.vargas.order.map((n) => [
    `D${n}`, esc(data.vargas.info[n].hi.replace(/ \(D\d+\)/, '')), esc(rashiHi(data.vargas.charts[n].lagna)),
  ])
  html += `<h3>सोलहों वर्ग — लग्न</h3>` + table(['वर्ग', 'नाम', 'लग्न'], rows)
  return html + endChapter()
}

// --- अध्याय 8: D60 ----------------------------------------------------------
function d60(data) {
  const rows = Object.entries(data.vargas.d60.planets).map(([key, v]) => [
    esc(grahaHi(key)), `#${v.number}`, esc(v.hi), v.shubha === false ? 'अशुभ' : v.shubha === true ? 'शुभ' : 'मिश्र',
  ])
  rows.push(['लग्न', `#${data.vargas.d60.lagna.number}`, esc(data.vargas.d60.lagna.hi),
    data.vargas.d60.lagna.shubha === false ? 'अशुभ' : data.vargas.d60.lagna.shubha === true ? 'शुभ' : 'मिश्र'])
  return chapter('s8', '8', 'षष्ट्यंश (D60) और जन्म-समय की सूक्ष्मता', TX.CHAPTER_INTRO.d60) +
    table(['ग्रह', 'क्रमांक', 'देवता', 'भाव'], rows) +
    `<p>${esc(TX.D60_NOTE.shubha.t)}</p><p>${esc(TX.D60_NOTE.ashubha.t)}</p>` + endChapter()
}

// --- अध्याय 9: योग और दोष ---------------------------------------------------
function yogas(data) {
  const rows = data.yogas.list.map((y) => {
    const tx = TX.YOGA_TEXT[y.id]
    return [
      esc(y.hi),
      `<span class="lbl">${esc(y.label)}</span>`,
      y.present ? 'बनता है' : 'नहीं बनता',
      esc(tx?.t ?? y.text),
    ]
  })
  let html = chapter('s9', '9', 'योग और दोष', TX.CHAPTER_INTRO.yogas) +
    table(['योग', 'मान्यता', 'स्थिति', 'फल'], rows, 'wide-last')

  html += `<h3>दोष</h3>`
  const d = data.doshas
  const items = []
  if (d.mangal) items.push([d.mangal.present ? 'मंगल दोष — है' : 'मंगल दोष — नहीं', TX.DOSHA_TEXT.mangal.t])
  items.push([d.kaalSarpa.present ? 'कालसर्प — है' : 'कालसर्प — नहीं', TX.DOSHA_TEXT.kaalSarpa.t])
  items.push([d.guruChandal.present ? 'गुरु-चांडाल — है' : 'गुरु-चांडाल — नहीं', TX.DOSHA_TEXT.guruChandal.t])
  if (d.mangal) items.push(['मंगल दोष — नोट', TX.DOSHA_TEXT.mangalNote.t])
  html += table(['दोष', 'अर्थ'], items.map(([a, b]) => [esc(a), esc(b)]), 'wide-last')
  return html + endChapter()
}

// --- अध्याय 10: दशा ---------------------------------------------------------
function dasha(data) {
  const md = data.dasha.mahadashas.map((m) => [
    esc(grahaHi(m.key)), dateHi(m.fromMs), dateHi(m.toMs),
    data.dasha.current.maha.key === m.key ? '<b>चल रही</b>' : '',
  ])
  const cur = data.dasha.current
  const curTx = TX.DASHA[KEY_BY[cur.maha.key]]
  const ad = data.dasha.antardashas10y.map((a) => [
    esc(`${grahaHi(a.mahaKey)} — ${grahaHi(a.key)}`), dateHi(a.fromMs), dateHi(a.toMs),
  ])
  return chapter('s10', '10', 'विंशोत्तरी दशा', TX.CHAPTER_INTRO.dasha) +
    `<div class="nowbox"><b>अभी:</b> ${esc(grahaHi(cur.maha.key))} महादशा · ${esc(grahaHi(cur.antar.key))} अंतर्दशा · ${esc(grahaHi(cur.pratyantar.key))} प्रत्यंतर</div>
     <p>${esc(curTx.t)} ${toneBadge(curTx.tone)}</p>
     <h3>महादशा (जन्म से 100 वर्ष)</h3>` +
    table(['महादशा', 'से', 'तक', ''], md) +
    `<h3>अगले 10 वर्ष की अंतर्दशाएँ</h3>` + table(['महादशा — अंतर्दशा', 'से', 'तक'], ad) +
    endChapter()
}

// --- अध्याय 11: साढ़ेसाती और गोचर -------------------------------------------
function sadesati(data) {
  const cyc = (data.sadesati.sadesatiCycles ?? []).map((c) => ['साढ़ेसाती', dateHi(c.fromMs), dateHi(c.toMs)])
  const dha = (data.sadesati.dhaiya ?? []).map((c) => [c.label, dateHi(c.fromMs), dateHi(c.toMs)])
  const now = data.sadesati.current
  const curTx = now
    ? (now.kind === 'sadesati'
      ? TX.DOSHA_TEXT[`sadesati${now.runningPhase?.phase === 12 ? 1 : now.runningPhase?.phase === 1 ? 2 : 3}`]
      : TX.DOSHA_TEXT.dhaiya)
    : null
  const g = data.gochar
  const grow = Object.keys(g.main).map((k) => {
    const p = g.main[k]
    return [esc(grahaHi(k)), esc(rashiHi(p.rashi)), H(p.houseFromMoon), H(p.houseFromLagna),
      p.shubhaFromMoon ? 'शुभ' : 'सावधानी']
  })
  return chapter('s11', '11', 'साढ़ेसाती, ढैया और आज का गोचर', TX.CHAPTER_INTRO.gochar) +
    (now
      ? `<p><b>अभी ${esc(now.label)} चल रही है।</b> ${esc(curTx?.t ?? '')}</p>`
      : `<p><b>अभी साढ़ेसाती या ढैया नहीं चल रही।</b></p>`) +
    table(['अवधि', 'से', 'तक'], [...cyc, ...dha]) +
    `<h3>आज का गोचर (जन्म-चंद्र से)</h3>` +
    table(['ग्रह', 'राशि', 'चंद्र से', 'लग्न से', 'भाव-फल'], grow) +
    endChapter()
}

// --- अध्याय 12: अष्टकवर्ग ---------------------------------------------------
function ashtakavarga(data) {
  const av = data.ashtakavarga
  const keys = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']
  const rows = keys.map((k) => [
    esc(grahaHi(k)), ...av.bav[k].byHouse.map((b) => String(b)), `<b>${av.bav[k].total}</b>`,
  ])
  rows.push(['<b>सर्वाष्टक</b>', ...av.sav.byHouse.map((b) => `<b>${b}</b>`), `<b>${av.sav.total}</b>`])
  return chapter('s12', '12', 'अष्टकवर्ग', TX.CHAPTER_INTRO.ashtakavarga) +
    table(['ग्रह', ...Array.from({ length: 12 }, (_, i) => `भा${i + 1}`), 'कुल'], rows) +
    `<p class="muted">हर भाव के बिंदु (भाव 1 से 12 तक)। कुल योग सूर्य 48, चंद्र 49, मंगल 39, बुध 54, गुरु 56, शुक्र 52, शनि 39 — सर्वाष्टक 337।</p>` +
    endChapter()
}

// --- अध्याय 13: उपाय और रत्न -------------------------------------------------
function upaya(data) {
  const st = data.strength.planets
  const weak = Object.entries(st).sort((a, b) => a[1].total - b[1].total).slice(0, 2).map(([k]) => k)
  const rows = weak.map((k) => [esc(grahaHi(k)), esc(TX.UPAYA[KEY_BY[k]].free)])
  const r = data.ratna
  const gems = [
    [r.jeevan.roleHi, grahaHi(r.jeevan.planet), r.jeevan.gem.hi, r.jeevan.warning ? 'सावधानी' : 'ठीक'],
    [r.bhagya.roleHi, grahaHi(r.bhagya.planet), r.bhagya.gem.hi, r.bhagya.warning ? 'सावधानी' : 'ठीक'],
    [r.karak.roleHi, grahaHi(r.karak.planet), r.karak.gem.hi, r.karak.warning ? 'सावधानी' : 'ठीक'],
  ]
  return chapter('s13', '13', 'उपाय और रत्न', TX.CHAPTER_INTRO.upaya) +
    `<h3>पहले निःशुल्क उपाय</h3>` + table(['ग्रह', 'उपाय'], rows, 'wide-last') +
    `<h3>रत्न</h3>` + table(['रत्न', 'ग्रह', 'रत्न', 'स्थिति'], gems.map((g) => [esc(g[0]), esc(g[1]), esc(g[2]), esc(g[3])])) +
    `<p class="note">${esc(TX.UPAYA.caution)}</p>` + endChapter()
}

// --- अध्याय 14: शब्दकोश और पद्धति -------------------------------------------
function glossary(data) {
  const rows = Object.entries(TX.GLOSSARY).map(([, v]) => [esc(v)])
  const terms = Object.entries(TX.GLOSSARY).map(([, v]) => esc(v))
  return chapter('s14', '14', 'शब्दकोश और गणना-पद्धति', TX.CHAPTER_INTRO.shabdkosh) +
    `<dl class="glossary">${terms.map((t) => `<dd>${t}</dd>`).join('')}</dl>
     <h3>गणना-पद्धति</h3>
     <p>लाहिरी अयनांश, whole-sign भाव, mean राहु, Swiss Ephemeris (WASM)। साढ़ेसाती और गोचर उसी ephemeris से दिन-प्रतिदिन गिनकर निकाले गए हैं।
     यह सब आपके ही browser में बनता है — कोई server, कोई tracker नहीं।</p>
     <p class="closing">॥ शुभमस्तु ॥</p>
     <p>${esc(TX.CLOSING_NOTE)}</p>
     <p class="links">mybapuji.com/kundli · mybapuji.com/kundli-milan · mybapuji.com की मुफ़्त ज्योतिष किताबें</p>`
    + endChapter()
}

// --- पूरा report -------------------------------------------------------------
export function renderReport(data) {
  if (!data || data.error) return `<p class="err">कुंडली नहीं बन सकी — जन्म-विवरण जाँचें।</p>`
  return [
    cover(data), contents(), glance(data), details(data), charts(data), planets(data), houses(data),
    vargas(data), d60(data), yogas(data), dasha(data), sadesati(data), ashtakavarga(data),
    upaya(data), glossary(data),
  ].join('\n')
}
