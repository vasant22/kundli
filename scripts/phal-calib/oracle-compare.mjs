// scripts/phal-calib/oracle-compare.mjs — फलादेश की गणना-परत की oracle से तुलना.
//
// यह script किसी भी proprietary code को नहीं पढ़ता — केवल oracle के **JSON output**
// (जो .openclaw-tmp/phal-oracle/ में रहता है) और अपने `buildPhalData` के नतीजे
// मिलाता है. इस्तेमाल:
//
//   node scripts/phal-calib/oracle-compare.mjs            # सारांश + JSON
//   node scripts/phal-calib/oracle-compare.mjs --markdown # रिपोर्ट के लिए markdown
//
// Oracle की JSON फ़ाइलें पहले बनानी पड़ती हैं (टास्क 04 §1 का तरीक़ा); न मिलें तो
// वह कुंडली "skipped" दिखती है.

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { initEphemeris } from '../../src/astro.js'
import { buildPhalData } from '../../src/phal/index.js'
import { CHARTS, NOW_MS } from './phal-charts.mjs'

const ORACLE_DIR = path.join(process.env.HOME, '.openclaw-autoclaw/workspace/projects/kundli/.openclaw-tmp/phal-oracle')
const OUT_JSON = path.join(process.env.HOME, '.openclaw-autoclaw/workspace/projects/kundli/.openclaw-tmp/phal-oracle/compare.json')

const MAPNAME = {
  sun: 'Sun', moon: 'Moon', mars: 'Mars', mercury: 'Mercury', jupiter: 'Jupiter',
  venus: 'Venus', saturn: 'Saturn', rahu: 'Rahu', ketu: 'Ketu',
}
const SEVEN = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']

// हमारे स्तर → oracle के शब्द (जो "… राशि" के रूप में लिखता है)
const DIGNITY_WORDS = {
  exalted: 'उच्च',
  debilitated: 'नीच',
  own: 'स्वराशि',
  moolatrikona: 'मूलत्रिकोण',
  adhimitra: 'अधिमित्र',
  mitra: 'मित्र',
  sama: 'सम',
  shatru: 'शत्रु',
  adhishatru: 'अधिशत्रु',
}
// oracle "स्वगृही" कहता है, हम "स्वराशि" — एक ही बात
const DIGNITY_ALIAS = { 'स्वगृही': 'स्वराशि' }
const normDignity = (s) => {
  const w = String(s ?? '').normalize('NFC').replace(/\s*राशि\s*$/, '').trim()
  // 'स्वगृही' की matra-वर्तनी बाइट-दर-बाइट अलग हो सकती है — शुरुआत से पहचानो
  if (/^स्व/.test(w)) return 'स्वराशि'
  return DIGNITY_ALIAS[w] ?? w
}

// oracle के योग-नाम → हमारे id
const YOGA_MAP = {
  'Adhi yoga': 'adhi',
  'Anapha yoga': 'anapha',
  'Budhaditya yoga': 'budhaditya',
  'Chandra-Mangala yoga': 'chandra-mangal',
  'Dainya Parivartana yoga': 'parivartana',
  'Dhana yoga': 'dhana',
  'Durudhara yoga': 'durudhara',
  'Gajakesari yoga': 'gajakesari',
  'Hamsa yoga (Pancha Mahapurusha)': 'hamsa',
  'Harsha Viparita Raja yoga': 'harsha',
  'Kemadruma yoga': 'kemadruma',
  'Malavya yoga (Pancha Mahapurusha)': 'malavya',
  'Raja yoga': 'rajayoga',
  'Sarala Viparita Raja yoga': 'sarala',
  'Shakata yoga': 'shakata',
  'Sunapha yoga': 'sunapha',
  'Ubhayachari yoga': 'ubhayachari',
  'Vasi yoga': 'vashi',
  'Vesi yoga': 'veshi',
  'Vimala Raja yoga': 'vimala',
  'Vimala Viparita Raja yoga': 'vimala',
}
// oracle में हैं, हमारे पास जान-बूझकर नहीं (रिपोर्ट में "नहीं मिलाया")
const NOT_COMPARED = new Set([
  'Lakshmi yoga', 'Saraswati yoga', 'Yogakaraka planet', 'Venus debilitated',
  'Bhadra yoga (Pancha Mahapurusha)', 'Ruchaka yoga (Pancha Mahapurusha)', 'Shasha yoga (Pancha Mahapurusha)',
])

const DAY = 86400000
const round2 = (x) => Math.round(x * 100) / 100

// ms → 'YYYY-MM-DD' उसी समय-क्षेत्र में जो oracle को दिया गया था
function dateIn(ms, tzHours) {
  const d = new Date(ms + tzHours * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}
// "Maheshwara" और "Maheshvara", "Kaala" और "Kala" — एक ही नाम की दो वर्तनियाँ
const translit = (name) => String(name ?? '')
  .toLowerCase()
  .replace(/chandramukha$/, 'chandramukhi') // एक ही देवता, दो रूप
  .replace(/aa/g, 'a')
  .replace(/ee/g, 'i')
  .replace(/oo/g, 'u')
  .replace(/sh/g, 's')
  .replace(/w/g, 'v')
  .replace(/th/g, 't')
  .replace(/kh/g, 'k')
  .replace(/gh/g, 'g')
  .replace(/bh/g, 'b')
  .replace(/dh/g, 'd')
  .replace(/ph/g, 'p')
  .replace(/h/g, '')

const dateDiffDays = (aMs, bStr, tzHours) =>
  Math.abs(Math.round((Date.parse(dateIn(aMs, tzHours)) - Date.parse(bStr)) / DAY))

function addMismatch(section, item, ours, theirs) {
  section.mismatches.push({ item, ours, theirs })
}

function compareChart(data, oracle, chart) {
  const sections = {}
  const sec = (name) => (sections[name] ??= { checked: 0, matched: 0, mismatches: [] })
  const check = (name, item, ok, ours, theirs) => {
    const s = sec(name)
    s.checked += 1
    if (ok) s.matched += 1
    else addMismatch(s, item, ours, theirs)
  }

  // --- 1. ग्रह-स्थिति --------------------------------------------------------
  for (const key of Object.keys(MAPNAME)) {
    const ours = data.planets.find((p) => p.key === key)
    const theirs = oracle.planets[MAPNAME[key]]
    if (!ours || !theirs) continue
    const lonDiff = Math.abs((((ours.rashi * 30 + ours.degInSign) - theirs.lon + 540) % 360) - 180)
    check('planets', `${key}.lon`, lonDiff <= 1 / 60, round2(ours.rashi * 30 + ours.degInSign), round2(theirs.lon))
    check('planets', `${key}.rashi`, ours.rashi === theirs.sign, ours.rashi, theirs.sign)
    check('planets', `${key}.house`, ours.house === theirs.house, ours.house, theirs.house)
    // oracle का nakshatra 0-आधारित है (0..26); हमारा 1..27 — दोनों सही, बस गिनती का फ़र्क़
    check('planets', `${key}.nakshatra`, ours.nakshatra === theirs.nakshatra + 1, ours.nakshatra, theirs.nakshatra + 1)
    check('planets', `${key}.pada`, ours.pada === theirs.pada, ours.pada, theirs.pada)
    // राहु/केतु सदा वक्री (मध्यम नोड पीछे चलता है) — oracle उन पर false रखता है,
    // इसलिए सिर्फ़ सात ग्रहों का वक्री-भाव मिलाते हैं
    if (!['rahu', 'ketu'].includes(key)) {
      check('planets', `${key}.retro`, Boolean(ours.retro) === Boolean(theirs.retro), Boolean(ours.retro), Boolean(theirs.retro))
    }
    if (key !== 'sun' && key !== 'rahu' && key !== 'ketu') {
      check('planets', `${key}.combust`, Boolean(data.positions[key].combustion.combust) === Boolean(theirs.combust), Boolean(data.positions[key].combustion.combust), Boolean(theirs.combust))
    }
    // राहु/केतु: BPHS में मैत्री-तालिका नहीं, इसलिए हम "—" दिखाते हैं — तुलना से बाहर
    if (!['rahu', 'ketu'].includes(key)) {
      check(
        'planets', `${key}.dignity`,
        normDignity(DIGNITY_WORDS[data.positions[key].dignity.level]) === normDignity(theirs.dignity),
        DIGNITY_WORDS[data.positions[key].dignity.level], theirs.dignity
      )
    }
  }

  // --- 2. सोलह वर्ग ----------------------------------------------------------
  for (const n of [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]) {
    const theirs = oracle.vargas[String(n)]
    if (!theirs) continue
    check('vargas', `D${n}.lagna`, data.vargas.charts[n].lagna === theirs.lagna, data.vargas.charts[n].lagna, theirs.lagna)
    for (const key of Object.keys(MAPNAME)) {
      const ours = data.vargas.charts[n].planets[key]
      const t = theirs.planets[MAPNAME[key]]
      check('vargas', `D${n}.${key}`, ours === t, ours, t)
    }
  }

  // --- 3. D60 देवता ----------------------------------------------------------
  for (const key of Object.keys(MAPNAME)) {
    const ours = data.vargas.d60.planets[key]
    const theirs = oracle.d60[MAPNAME[key]]
    check('d60', `${key}.part`, ours.number === theirs.part, ours.number, theirs.part)
    check('d60', `${key}.name`, translit(ours.en) === translit(theirs.name), ours.en, theirs.name)
  }
  check('d60', 'lagna.part', data.vargas.d60.lagna.number === oracle.d60.Lagna.part, data.vargas.d60.lagna.number, oracle.d60.Lagna.part)
  check('d60', 'lagna.name', translit(data.vargas.d60.lagna.en) === translit(oracle.d60.Lagna.name), data.vargas.d60.lagna.en, oracle.d60.Lagna.name)

  // --- 4. विंशोपक -----------------------------------------------------------
  for (const key of SEVEN) {
    const ours = data.strength.planets[key].total
    const theirs = oracle.vimshopaka[MAPNAME[key]]
    check('vimshopaka', key, Math.abs(ours - theirs) <= 0.1, ours, theirs)
  }

  // --- 5. विंशोत्तरी दशा ------------------------------------------------------
  const mdRows = data.dasha.mahadashas
  const orPeriods = oracle.dasha.periods ?? []
  for (let i = 0; i < Math.min(mdRows.length, orPeriods.length); i++) {
    const ours = mdRows[i]
    const t = orPeriods[i]
    check('dasha', `MD${i + 1}.lord`, MAPNAME[ours.key] === t.lord, MAPNAME[ours.key], t.lord)
    check('dasha', `MD${i + 1}.start`, dateDiffDays(ours.fromMs, t.start, chart.tz) <= 1, dateIn(ours.fromMs, chart.tz), t.start)
  }
  const cur = data.dasha.current
  if (oracle.dasha.current && oracle.dasha.current.maha) {
    check('dasha', 'current.maha', MAPNAME[cur.maha.key] === oracle.dasha.current.maha, MAPNAME[cur.maha.key], oracle.dasha.current.maha)
    check('dasha', 'current.antar', MAPNAME[cur.antar.key] === oracle.dasha.current.antar, MAPNAME[cur.antar.key], oracle.dasha.current.antar)
    check('dasha', 'current.pratyantar', MAPNAME[cur.pratyantar.key] === oracle.dasha.current.pratyantar, MAPNAME[cur.pratyantar.key], oracle.dasha.current.pratyantar)
  }

  // --- 6. अष्टकवर्ग ---------------------------------------------------------
  for (const key of SEVEN) {
    const ours = data.ashtakavarga.bav[key].bySign
    const theirs = oracle.bav[MAPNAME[key]]
    check('bav', key, JSON.stringify(ours) === JSON.stringify(theirs), ours.join(','), (theirs ?? []).join(','))
  }
  check('sav', 'sav', JSON.stringify(data.ashtakavarga.sav.bySign) === JSON.stringify(oracle.sav), data.ashtakavarga.sav.bySign.join(','), (oracle.sav ?? []).join(','))

  // --- 7. साढ़ेसाती / ढैया ---------------------------------------------------
  const ourCycles = [...(data.sadesati.sadesatiCycles ?? data.sadesati.sadesati)]
  for (const c of oracle.sade_sati.cycles ?? []) {
    const near = ourCycles.find((p) => dateDiffDays(p.fromMs, c.start, chart.tz) <= 3)
    check('sadesati', `cycle ${c.start}`, Boolean(near), near ? dateIn(near.fromMs, chart.tz) : '—', c.start)
    if (near) check('sadesati', `cycle ${c.start} end`, dateDiffDays(near.toMs, c.end, chart.tz) <= 3, dateIn(near.toMs, chart.tz), c.end)
  }
  // oracle ढैया को टुकड़ों में देता है (साढ़ेसाती को एक चक्र में) — वैसे ही मिलाओ
  const ourDhaiya = data.sadesati.dhaiya
  for (const c of oracle.sade_sati.dhaiya ?? []) {
    const near = ourDhaiya.find((p) => dateDiffDays(p.fromMs, c.start, chart.tz) <= 3)
    check('sadesati', `dhaiya ${c.start}`, Boolean(near), near ? dateIn(near.fromMs, chart.tz) : '—', c.start)
    if (near) check('sadesati', `dhaiya ${c.start} end`, dateDiffDays(near.toMs, c.end, chart.tz) <= 3, dateIn(near.toMs, chart.tz), c.end)
  }

  // --- 8. आत्मकारक ----------------------------------------------------------
  const ak = (oracle.chara_karakas ?? []).find((k) => k.code === 'AK')
  if (ak) check('karaka', 'atmakaraka', MAPNAME[data.avakahada.atmakaraka.key] === ak.planet, MAPNAME[data.avakahada.atmakaraka.key], ak.planet)

  // --- 9. योग --------------------------------------------------------------
  const oursPresent = new Set(data.yogas.present.map((y) => y.id))
  const theirsPresent = new Set()
  for (const y of oracle.yogas ?? []) {
    if (NOT_COMPARED.has(y.name)) continue
    const id = YOGA_MAP[y.name]
    if (!id) continue
    theirsPresent.add(id)
  }
  // 'vipareeta' हमारा समेटा हुआ योग है — oracle उसे हर्ष/सरल/विमल में अलग देता है,
  // इसलिए समेटे हुए id को 1:1 नहीं मिलाते.
  const allIds = new Set([...oursPresent, ...theirsPresent, 'adhi', 'anapha', 'budhaditya', 'chandra-mangal', 'dhana', 'durudhara', 'gajakesari', 'hamsa', 'harsha', 'kemadruma', 'malavya', 'parivartana', 'rajayoga', 'sarala', 'shakata', 'sunapha', 'ubhayachari', 'vashi', 'veshi', 'vimala'])
  allIds.delete('vipareeta')
  for (const id of allIds) {
    check('yogas', id, oursPresent.has(id) === theirsPresent.has(id), oursPresent.has(id), theirsPresent.has(id))
  }

  // --- 10. कालसर्प ----------------------------------------------------------
  check('kaalsarpa', 'kaalsarpa', Boolean(data.doshas.kaalSarpa.present) === Boolean(oracle.doshas.kaal_sarp?.present), data.doshas.kaalSarpa.present, oracle.doshas.kaal_sarp?.present)

  return sections
}

function summarize(sections) {
  const out = {}
  let checked = 0
  let matched = 0
  for (const [name, s] of Object.entries(sections)) {
    out[name] = { checked: s.checked, matched: s.matched, mismatches: s.mismatches }
    checked += s.checked
    matched += s.matched
  }
  return { sections: out, checked, matched }
}

async function main() {
  const swe = await initEphemeris()
  const results = []
  for (const chart of CHARTS) {
    const file = path.join(ORACLE_DIR, `${chart.id}.json`)
    if (!fs.existsSync(file)) {
      results.push({ id: chart.id, note: chart.note, skipped: true })
      continue
    }
    const oracle = JSON.parse(fs.readFileSync(file, 'utf8'))
    const data = buildPhalData(swe, {
      utc: chart.utc,
      latitude: chart.lat,
      longitude: chart.lon,
      timeZone: 'Asia/Kolkata',
      local: { year: Number(chart.dob.slice(0, 4)), month: Number(chart.dob.slice(5, 7)), day: Number(chart.dob.slice(8, 10)) },
    }, { nowMs: NOW_MS })
    const sections = compareChart(data, oracle, chart)
    const sum = summarize(sections)
    results.push({ id: chart.id, note: chart.note, ...sum })
  }

  const totals = results.filter((r) => !r.skipped).reduce((acc, r) => ({ checked: acc.checked + r.checked, matched: acc.matched + r.matched }), { checked: 0, matched: 0 })
  const payload = { generatedAt: new Date().toISOString(), nowMs: NOW_MS, totals, charts: results }
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2))

  // console summary
  console.log('कुंडली'.padEnd(20), 'मेल/जाँचे', '  %')
  for (const r of results) {
    if (r.skipped) { console.log(r.id.padEnd(20), 'skipped'); continue }
    const pct = ((r.matched / r.checked) * 100).toFixed(1)
    console.log(r.id.padEnd(20), `${r.matched}/${r.checked}`.padEnd(10), pct)
  }
  console.log('—'.repeat(40))
  console.log('कुल'.padEnd(20), `${totals.matched}/${totals.checked}`, ((totals.matched / totals.checked) * 100).toFixed(1) + '%')

  if (process.argv.includes('--markdown')) {
    const lines = []
    lines.push('| कुंडली | मेल / जाँचे | % | जिन खंडों में अंतर |')
    lines.push('|---|---|---|---|')
    for (const r of results) {
      if (r.skipped) { lines.push(`| ${r.id} | — | — | oracle नहीं चला |`); continue }
      const bad = Object.entries(r.sections).filter(([, s]) => s.mismatches.length).map(([n, s]) => `${n} (${s.mismatches.length})`)
      lines.push(`| ${r.id} | ${r.matched}/${r.checked} | ${((r.matched / r.checked) * 100).toFixed(1)}% | ${bad.join(', ') || '—'} |`)
    }
    lines.push('')
    lines.push(`**कुल: ${totals.matched}/${totals.checked} (${((totals.matched / totals.checked) * 100).toFixed(1)}%)**`)
    console.log('\n' + lines.join('\n'))
  }
  console.log('\nJSON →', OUT_JSON)
}

main().catch((err) => { console.error(err); process.exit(1) })
