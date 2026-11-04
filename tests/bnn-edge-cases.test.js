// tests/bnn-edge-cases.test.js — राउंड 65 (4-11-2026), टास्क 01-ग
//
// मक़सद सिर्फ़ एक: "कुंडली किनारे के समय/जगह पर भी टूटे नहीं" — गणना का कोई
// नियम यहाँ तय नहीं होता (वे सर के software से पहले ही पक्के हैं, दस्तावेज़:
// docs/bnn-guide.txt + BNN-Niyam-Granthi)। जाँचें:
//   1. हर तालिका मौजूद और भरी (9 ग्रह × PLANET/SPECIAL, 12 भाव × 1-5-9/1-5-7-9)
//   2. कोई NaN / Infinity / undefined नहीं
//   3. 12 संधियाँ बढ़ते क्रम में
//   4. दशा की तारीख़ें लगातार (महादशा → भुक्ति → अंतर), और उलटी नहीं
//
// 25 कुंडलियाँ: tests/fixtures/bnn-edge-charts.js (आधी रात, सूर्योदय, DST,
// दक्षिणी गोलार्ध, ऊँचा अक्षांश, 1900 से पहले, 1947, 2030 के बाद, लग्न-संधि,
// ग्रह राशि-संधि, वक्री ग्रह, दशा-संधि)।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { wallTimeToUtc } from '../src/timeutil.js'
import { computeBhavaChalit, findExchanges } from '../src/bnn/kp.js'
import { astronomyPartners, bhavaCombinations, labelSuffix, planetCombinations, seatPositions } from '../src/bnn/combos.js'
import { specialTables } from '../src/bnn/special.js'
import { andhiramList, bhukthiList, computeDashaTree } from '../src/bnn/dasha.js'
import { EDGE_CHARTS } from './fixtures/bnn-edge-charts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODES = ['AP', 'BP']
const PLANETS = ['jupiter', 'sun', 'moon', 'mars', 'mercury', 'venus', 'saturn', 'rahu', 'ketu']

// engine (build/entry.js) का वही नियम: offset = gmt + dst, मिनट तक गोल
function offsetText(hours) {
  const t = Math.round(hours * 60)
  const sign = t < 0 ? '-' : '+'
  const a = Math.abs(t)
  return sign + String(Math.floor(a / 60)).padStart(2, '0') + ':' + String(a % 60).padStart(2, '0')
}
function splitDate(s) {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(s || '').trim())
  return m ? { d: +m[1], m: +m[2], y: +m[3] } : null
}
function splitTime(s) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(s || '').trim())
  return m ? { h: +m[1], mi: +m[2], s: +(m[3] || 0) } : null
}

// build/entry.js के compute() का वही ढाँचा (website/ऐप दोनों इसी से चलते हैं)
async function computeRecord(swe, rec) {
  const d = splitDate(rec.date), t = splitTime(rec.time)
  if (!d || !t) throw new Error('तिथि/समय पढ़ा नहीं गया: ' + rec.date + ' ' + rec.time)
  const conv = wallTimeToUtc(
    { year: d.y, month: d.m, day: d.d, hour: t.h, minute: t.mi, second: t.s },
    offsetText(Number(rec.gmt) + Number(rec.dst || 0))
  )
  const coords = { latitude: Number(rec.lat), longitude: Number(rec.lon) }
  const bnn = computeBhavaChalit(swe, conv.utc, coords)
  const tables = { bhava: {}, planet: {}, special: {} }
  const astro = {}
  for (const m of MODES) {
    tables.bhava[m] = bhavaCombinations(bnn.planets, bnn.cusps, m)
    tables.planet[m] = planetCombinations(bnn.planets, m, { cusps: bnn.cusps })
    tables.special[m] = specialTables(bnn.planets, bnn.cusps, m)
    astro[m] = astronomyPartners(bnn.planets, m)
  }
  const dasha = computeDashaTree(swe, bnn.jd, { year: d.y, month: d.m, day: d.d }, { now: { y: d.y, m: d.m, d: d.d } })
  dasha.mahadashas.forEach((mr) => {
    mr.bhukthis = bhukthiList(mr, { year: d.y, month: d.m, day: d.d })
    mr.bhukthis.forEach((br) => { br.andhirams = br.blank ? [] : andhiramList(mr.lord, br, { year: d.y, month: d.m, day: d.d }) })
  })
  const labels = {}
  for (const lm of MODES) {
    const seats = seatPositions(bnn.planets, lm)
    labels[lm] = {}
    for (const p of bnn.planets) labels[lm][p.key] = labelSuffix(seats[p.key].lon, bnn.cusps).value
  }
  return {
    utc: conv.utc, offsetText: conv.offsetText, bnn, exchanges: findExchanges(bnn.planets),
    birthISO: `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`,
    tables, astro, labels, dasha,
    order: rec.gender === 'स्त्री'
      ? ['venus', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'saturn', 'rahu', 'ketu']
      : PLANETS
  }
}

// ---- जाँच के छोटे-छोटे टुकड़े (हर एक "समस्या" का हिंदी संदेश लौटाता है) ----
function noBadNumbers(value, at, problems) {
  if (typeof value === 'number') { if (!Number.isFinite(value)) problems.push(at + ' में NaN/Infinity'); return }
  if (typeof value === 'string') { if (value.includes('NaN') || value.includes('undefined')) problems.push(at + ' में ख़राब text: ' + value); return }
  if (Array.isArray(value)) { value.forEach((x, i) => noBadNumbers(x, at + '[' + i + ']', problems)); return }
  if (value && typeof value === 'object') { for (const k of Object.keys(value)) noBadNumbers(value[k], at + '.' + k, problems) }
}

const dmy = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''))
  return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : NaN
}

describe('BNN किनारे के मामले (राउंड 65) — 25 कुंडलियाँ टूटती नहीं', () => {
  let swe
  const results = new Map()

  beforeAll(async () => {
    swe = await initEphemeris()
    for (const rec of EDGE_CHARTS) results.set(rec.ref, await computeRecord(swe, rec))
  }, 180000)

  it('सूची में 25 कुंडलियाँ हैं (5 पुरानी + 20 नई) और ref दोहराए नहीं गए', () => {
    expect(EDGE_CHARTS.length).toBe(25)
    const refs = EDGE_CHARTS.map((c) => c.ref)
    expect(new Set(refs).size).toBe(refs.length)
    // हर कुंडली का तिथि/समय/जगह पढ़ा जा सके
    for (const c of EDGE_CHARTS) {
      expect(splitDate(c.date), c.ref + ' ' + c.date).toBeTruthy()
      expect(splitTime(c.time), c.ref + ' ' + c.time).toBeTruthy()
      expect(Number.isFinite(Number(c.lat)) && Math.abs(Number(c.lat)) <= 90, c.ref + ' अक्षांश').toBe(true)
      expect(Number.isFinite(Number(c.lon)) && Math.abs(Number(c.lon)) <= 180, c.ref + ' देशांतर').toBe(true)
    }
  })

  // 1) हर कुंडली: तालिकाएँ भरी, कोई NaN नहीं
  for (const rec of EDGE_CHARTS) {
    it('ref ' + rec.ref + ' ' + rec.name + ' (' + rec.note + ') — तालिकाएँ भरी, कोई NaN नहीं', () => {
      const r = results.get(rec.ref)
      expect(r, 'compute नहीं हुआ').toBeTruthy()
      const problems = []
      noBadNumbers({ utc: r.utc, bnn: r.bnn, tables: r.tables, astro: r.astro, labels: r.labels, dasha: r.dasha }, 'result', problems)
      // भाव तालिका: 12 भाव × दोनों सूचियाँ
      for (const m of MODES) {
        for (let n = 1; n <= 12; n++) {
          const row = r.tables.bhava[m][n]
          if (!row) { problems.push('bhava ' + m + ' B' + n + ' ग़ायब'); continue }
          for (const tab of ['list159', 'list1579']) if (!Array.isArray(row[tab])) problems.push('bhava ' + m + ' B' + n + ' ' + tab + ' ग़ायब')
        }
        // ग्रह तालिका: 9 पंक्तियाँ
        for (const k of r.order) {
          const row = r.tables.planet[m][k]
          if (!row) { problems.push('planet ' + m + ' ' + k + ' ग़ायब'); continue }
          for (const tab of ['list159', 'list1579']) if (!Array.isArray(row[tab])) problems.push('planet ' + m + ' ' + k + ' ' + tab + ' ग़ायब')
        }
        // SPECIAL: 9 पंक्तियाँ, बैठा भाव 1–12
        for (const k of r.order) {
          const row = r.tables.special[m].rows[k]
          if (!row) { problems.push('special ' + m + ' ' + k + ' ग़ायब'); continue }
          if (!Array.isArray(row.owns) || !Array.isArray(row.gives)) problems.push('special ' + m + ' ' + k + ' owns/gives ग़ायब')
          if (!(row.sitsAt >= 1 && row.sitsAt <= 12)) problems.push('special ' + m + ' ' + k + ' sitsAt=' + row.sitsAt)
          if (!r.astro[m] || r.astro[m][k] === undefined) problems.push('astro ' + m + ' ' + k + ' ग़ायब')
        }
        // नाम के आगे भाव-बिंदु अंक (राउंड 64 वाला नियम) — सबके लिए मौजूद
        for (const k of r.order) if (!Number.isFinite(r.labels[m][k])) problems.push('labels ' + m + ' ' + k + ' ग़ायब')
      }
      // 12 संधियाँ + संधि-क्रम
      expect(r.bnn.cusps.length).toBe(12)
      for (let i = 0; i < 12; i++) {
        const a = r.bnn.cusps[i].longitude, b = r.bnn.cusps[(i + 1) % 12].longitude
        let step = b - a
        while (step <= 0) step += 360
        if (!(step > 0 && step < 180)) problems.push('संधि ' + (i + 1) + ' का क्रम टूटा (अंतर ' + step.toFixed(2) + '°)')
      }
      expect(problems, rec.ref + ' में समस्याएँ:\n' + problems.slice(0, 12).join('\n')).toEqual([])
    })
  }

  // 2) दशा की तारीख़ें लगातार (महादशा → भुक्ति → अंतर, तीनों स्तर)
  //
  // राउंड 65-ख (4-11-2026) से अंतर-स्तर भी कड़ाई से जाँचा जाता है: जन्म पर कटी
  // पहली महादशा में जो अंतर जन्म से पहले ही ख़त्म हो गए थे वे `blank` पंक्तियाँ हैं,
  // और भुक्ति के अंत से आगे वाली पंक्तियाँ हट जाती हैं — इसलिए अंतर 9 से कम हो
  // सकते हैं, पर कोई पंक्ति उलटी नहीं, क्रम टूटता नहीं, और आख़िरी अंतर हमेशा
  // भुक्ति के अंत पर ख़त्म होता है।
  for (const rec of EDGE_CHARTS) {
    it('ref ' + rec.ref + ' ' + rec.name + ' — दशा/भुक्ति/अंतर की तारीख़ें लगातार', () => {
      const r = results.get(rec.ref)
      const problems = []
      const md = r.dasha.mahadashas
      expect(md.length, 'महादशा 9 नहीं').toBe(9)
      for (let i = 0; i < md.length; i++) {
        const s0 = dmy(md[i].startISO), e0 = dmy(md[i].endISO)
        if (!(e0 >= s0)) problems.push('महादशा ' + md[i].lord + ': ' + md[i].startISO + '→' + md[i].endISO + ' उलटी है')
        if (i && dmy(md[i - 1].endISO) !== s0) problems.push('महादशा संधि नहीं मिली: ' + md[i - 1].endISO + ' vs ' + md[i].startISO)
        const bh = md[i].bhukthis || []
        if (bh.length !== 9) { problems.push('महादशा ' + md[i].lord + ' की भुक्ति 9 नहीं (' + bh.length + ')'); continue }
        const real = bh.filter((x) => !x.blank)
        for (let j = 1; j < real.length; j++) {
          if (dmy(real[j].startISO) !== dmy(real[j - 1].endISO)) problems.push('भुक्ति संधि नहीं मिली: ' + md[i].lord + '/' + real[j - 1].lord + '→' + real[j].lord)
          if (!(dmy(real[j].endISO) >= dmy(real[j].startISO))) problems.push('भुक्ति ' + md[i].lord + '/' + real[j].lord + ' उलटी है')
        }
        if (real.length && dmy(real[0].startISO) !== s0) problems.push('पहली भुक्ति महादशा से नहीं जुड़ी (' + md[i].lord + ')')
        if (real.length && dmy(real[real.length - 1].endISO) !== e0) problems.push('आख़िरी भुक्ति महादशा के अंत पर नहीं (' + md[i].lord + ')')
        for (const b of real) {
          const all = b.andhirams || []
          const an = all.filter((x) => !x.blank)
          if (!an.length) { problems.push('भुक्ति ' + b.lord + ' का कोई अंतर नहीं'); continue }
          if (an.length + all.filter((x) => x.blank).length !== all.length) problems.push('अंतर की गिनती में गड़बड़ (' + b.lord + ')')
          for (let j = 0; j < an.length; j++) {
            const a = an[j]
            if (!(dmy(a.endISO) >= dmy(a.startISO))) problems.push('अंतर ' + md[i].lord + '/' + b.lord + '/' + a.lord + ' उलटी है (' + a.startISO + '→' + a.endISO + ')')
            if (j && dmy(a.startISO) !== dmy(an[j - 1].endISO)) problems.push('अंतर संधि नहीं मिली: ' + b.lord + '/' + an[j - 1].lord + '→' + a.lord)
          }
          // पहला दिखने वाला अंतर या तो भुक्ति से जुड़ा हो, या जन्म-तारीख़ से (कटी भुक्ति)
          if (dmy(an[0].startISO) !== dmy(b.startISO) && an[0].startISO !== r.birthISO) {
            problems.push('पहला अंतर न भुक्ति से जुड़ा न जन्म से (' + b.lord + ' ' + an[0].startISO + ')')
          }
          if (dmy(an[an.length - 1].endISO) !== dmy(b.endISO)) problems.push('आख़िरी अंतर भुक्ति के अंत पर नहीं (' + b.lord + ' ' + an[an.length - 1].endISO + ' vs ' + b.endISO + ')')
          if (all.length > 9) problems.push('अंतर 9 से ज़्यादा (' + b.lord + ')')
        }
      }
      expect(problems, rec.ref + ' में दशा-समस्याएँ:\n' + problems.slice(0, 12).join('\n')).toEqual([])
    })
  }

  // 2-ख) जिन दो कुंडलियों पर यह गड़बड़ सबसे साफ़ दिखती थी (Task 01-ख में नाम लिए गए हैं)
  it('बेतूल 22-01-1980 — पहली (कटी) महादशा में कोई अंतर उलटा नहीं, आख़िरी = भुक्ति का अंत', () => {
    const r = results.get(10)
    let rows = 0
    for (const md of r.dasha.mahadashas) for (const b of md.bhukthis) {
      if (b.blank) continue
      const an = b.andhirams.filter((x) => !x.blank)
      rows += an.length
      for (const a of an) expect(dmy(a.endISO), b.lord + '/' + a.lord + ' उलटी').toBeGreaterThanOrEqual(dmy(a.startISO))
      expect(an[an.length - 1].endISO).toBe(b.endISO)
    }
    expect(rows).toBeGreaterThan(40)
  })

  it('दशा-संधि वाली कुंडली (ref 39, पहली महादशा 8 दिन) — अंतर भी सीधे और भुक्ति के अंत पर', () => {
    const r = results.get(39)
    const md = r.dasha.mahadashas[0]
    expect(dmy(md.endISO) - dmy(md.startISO)).toBeLessThan(100)
    let total = 0
    for (const b of md.bhukthis) {
      if (b.blank) continue
      const an = b.andhirams.filter((x) => !x.blank)
      total += an.length
      for (const a of an) expect(dmy(a.endISO), b.lord + '/' + a.lord + ' उलटी').toBeGreaterThanOrEqual(dmy(a.startISO))
      expect(an[an.length - 1].endISO).toBe(b.endISO)
    }
    expect(total).toBeGreaterThan(0)
  })

  // 3) ये कुंडलियाँ सचमुच किनारे पर हैं (वरना baseline का दायरा झूठा होगा)
  it('लग्न-संधि वाली कुंडली: लग्न अगली राशि से 0.01° से कम पहले है', () => {
    const r = results.get(36)
    const asc = r.bnn.ascendant.longitude % 30
    expect(asc).toBeGreaterThan(29.99)
    expect(asc).toBeLessThan(30)
  })

  it('चंद्र-संधि वाली कुंडली: चंद्र राशि-सीमा से 0.01° से कम पहले है', () => {
    const r = results.get(37)
    const moon = r.bnn.planets.find((p) => p.key === 'moon').longitude % 30
    expect(moon).toBeGreaterThan(29.99)
    expect(moon).toBeLessThan(30)
  })

  it('दशा-संधि वाली कुंडली: पहली महादशा सालों नहीं, कुछ दिनों की है', () => {
    const r = results.get(39)
    expect(r.dasha.remYears).toBeGreaterThan(0)
    expect(r.dasha.remYears).toBeLessThan(0.1) // ~1 महीने से कम
    expect(r.dasha.mahadashas[0].endISO).not.toBe(r.dasha.mahadashas[0].startISO)
  })

  it('वक्री-ग्रह वाली कुंडली: कम से कम चार ग्रह वक्री हैं', () => {
    const r = results.get(38)
    const retro = r.bnn.planets.filter((p) => p.retro && p.key !== 'rahu' && p.key !== 'ketu').map((p) => p.key)
    expect(retro.length).toBeGreaterThanOrEqual(4)
  })

  it('DST वाली दो कुंडलियाँ सही offset पर हैं (−04:00 गर्मी, −05:00 सर्दी)', () => {
    expect(results.get(24).offsetText).toBe('-04:00')
    expect(results.get(25).offsetText).toBe('-05:00')
    expect(results.get(26).offsetText).toBe('+01:00')
    expect(results.get(27).offsetText).toBe('+00:00')
    expect(results.get(28).offsetText).toBe('+11:00')
    expect(results.get(31).offsetText).toBe('+05:32') // 1875 — स्थानीय समय
    expect(results.get(33).offsetText).toBe('+04:51') // 1947 — बॉम्बे समय
  })

  // 4) दोनों जगहों की कुंडली-सूची एक जैसी रहे (fixture vs baseline-r65/charts.cjs)
  it('baseline-r65/charts.cjs और fixture की सूची एक जैसी है', () => {
    const p = path.resolve(__dirname, '../../../bnn-kundli-windows/.openclaw-tmp/baseline-r65/charts.cjs')
    if (!fs.existsSync(p)) { console.warn('baseline-r65/charts.cjs नहीं मिला — यह जाँच छोड़ी'); return }
    const req = createRequire(import.meta.url)
    const { CHARTS } = req(p)
    const pick = (c) => [c.ref, c.name, c.date, c.time, c.lat, c.lon, c.gmt, c.dst, c.gender].join('|')
    expect(CHARTS.map(pick)).toEqual(EDGE_CHARTS.map(pick))
  })
})
