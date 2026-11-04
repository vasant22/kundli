// tests/bnn-dasha-continuity.test.js — राउंड 65-ग (4-11-2026)
//
// गड़बड़ जो यह पकड़ता है: `bhukthiList()` जन्म से पहले बीता हिस्सा सिर्फ़ तब निकालता था
// जब वह 366 दिन से ज़्यादा हो (`if (sum - span > 366)`), वरना भुक्तियाँ **जन्म से** पूरी
// लंबाई के साथ बिछ जाती थीं और आख़िरी भुक्ति महादशा-अंत पर बुरी तरह कटती थी (कभी-कभी
// उलटी — आरंभ > अंत)। नतीजा: जन्म की तारीख़ एक दिन इधर-उधर होने से पहली महादशा की सारी
// भुक्ति-तारीख़ें ~1 साल (या सालों) उछल जाती थीं।
//
// यहाँ जाँच (एक ही स्थान/समय, जन्म-तारीख़ रोज़ एक दिन आगे, महादशा की असली शुरुआत से
// 0–450 दिन तक, दो अलग दौर)। **मुख्य जाँच नाममात्र लंबाई वाली है** (2), क्योंकि यही
// सीधे गड़बड़ पकड़ती है; उछाल वाली (3) पहरेदार है:
//   1. कोई भुक्ति उलटी नहीं (आरंभ ≤ अंत) — हर पंक्ति पर।
//   2. **मुख्य:** पहली महादशा की आख़िरी भुक्ति की लंबाई = उसकी नाममात्र लंबाई (±2 दिन)
//      और भुक्ति-ढाँचा जन्म की तारीख़ पर निर्भर न हो (हर भुक्ति का अंत = महादशा-अंत −
//      आगे की नाममात्र लंबाइयाँ) — यानी आख़िरी भुक्ति अंत में कटी हुई न हो।
//   3. लगातार दो जन्म-तारीख़ों में (जब पहली महादशा वही हो) किसी भी भुक्ति-अंत का
//      उछाल ≤ 2 दिन। (ध्यान: पुराने bug में भुक्तियाँ जन्म के साथ 1 दिन/दिन खिसकती थीं,
//      इसलिए यह जाँच अकेले उस bug को नहीं पकड़ती — (2) पकड़ती है।)
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { wallTimeToUtc } from '../src/timeutil.js'
import { computeDashaTree } from '../src/bnn/dasha.js'

// Vimshottari (हमेशा यही — दशा.js का ORDER/YEARS)
const YEARS = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 }
const ORDER = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury']
const BHU_YEAR_DAYS = 366 // DASHA_SETTINGS.bhukthiYearDays

const OFFSET = '+05:30'
const CLOCK = { hour: 12, minute: 0, second: 0 }
const SPAN_DAYS = 450
const ROUNDS = [
  { y: 2000, m: 1, d: 1, label: 'दौर 1 — जन्म 01-01-2000 12:00 (बेतूल)' },
  { y: 1991, m: 6, d: 15, label: 'दौर 2 — जन्म 15-06-1991 12:00 (बेतूल)' }
]

const dayNum = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000) }
const isoOfNum = (n) => new Date(n * 86400000).toISOString().slice(0, 10)
const pad = (n) => String(n).padStart(2, '0')

let swe

function chartAt(y, m, d) {
  const conv = wallTimeToUtc({ year: y, month: m, day: d, ...CLOCK }, OFFSET)
  const u = conv.utc
  const jd = swe.julday(u.year, u.month, u.day, u.hour + u.minute / 60 + u.second / 3600)
  // birth = इलाक़े की तारीख़ (ऐप भी यही देता है)
  return computeDashaTree(swe, jd, { year: y, month: m, day: d }, { now: { y: 2026, m: 11, d: 4 } })
}

// महादशा की असली शुरुआत = अंत से उस महादशा के पूरे वर्ष पीछे (महादशा जिस तरह बनती है उसी से)
function trueStartOf(mahaLord, endISO) {
  const [y, m, d] = endISO.split('-').map(Number)
  const ty = y - YEARS[mahaLord]
  const dim = new Date(Date.UTC(ty, m, 0)).getUTCDate()
  return `${ty}-${pad(m)}-${pad(Math.min(d, dim))}`
}

function firstMaha(tree) {
  const md = tree.mahadashas[0]
  const ends = {}
  const lenByLord = {}
  let negative = 0
  for (const b of md.bhukthis) {
    if (b.blank) continue
    ends[b.lord] = b.endISO
    lenByLord[b.lord] = dayNum(b.endISO) - dayNum(b.startISO)
    if (lenByLord[b.lord] < 0) negative++
  }
  const real = md.bhukthis.filter((b) => !b.blank)
  const last = real[real.length - 1]
  return {
    lord: md.lord, startISO: md.startISO, endISO: md.endISO, ends, lenByLord, negative,
    trueStart: trueStartOf(md.lord, md.endISO),
    // क्रम से हर भुक्ति (blank भी) — नीचे "जन्म पर निर्भर न हो" वाली जाँच के लिए
    ordered: md.bhukthis.map((b) => ({ lord: b.lord, blank: !!b.blank, startISO: b.startISO, endISO: b.endISO })),
    // जन्म पहली भुक्ति के अंदर है? (तभी आख़िरी भुक्ति पूरी नाममात्र लंबी होनी चाहिए;
    // अगर जन्म आख़िरी भुक्ति के अंदर है तो उसका दिखने वाला हिस्सा [जन्म, अंत] ही सही है)
    birthInFirstBhukti: !md.bhukthis[0].blank,
    lastLord: last ? last.lord : null, lastLen: last ? lenByLord[last.lord] : null,
    // पूरी महादशाओं की आख़िरी भुक्ति कितनी छोटी पड़ती है (366-दिन की गोलाई) — वही सीमा
    fullShortfall: (() => {
      let worst = 0
      for (const m of tree.mahadashas.slice(1)) {
        const r = m.bhukthis.filter((b) => !b.blank)
        const lb = r[r.length - 1]
        if (!lb) continue
        const nom = Math.floor((YEARS[m.lord] * BHU_YEAR_DAYS * YEARS[lb.lord]) / 120)
        worst = Math.max(worst, nom - (dayNum(lb.endISO) - dayNum(lb.startISO)))
      }
      return worst
    })()
  }
}

const nominalBhuktiDays = (mahaLord, bhuktiLord) =>
  Math.floor((YEARS[mahaLord] * BHU_YEAR_DAYS * YEARS[bhuktiLord]) / 120)

describe('पहली (कटी) महादशा की भुक्तियाँ — तारीख़ें नहीं उछलतीं (राउंड 65-ग)', () => {
  const scans = []

  beforeAll(async () => {
    swe = await initEphemeris()
    for (const R of ROUNDS) {
      const base = firstMaha(chartAt(R.y, R.m, R.d))
      const t0 = dayNum(trueStartOf(base.lord, base.endISO))
      const days = []
      for (let k = 0; k <= SPAN_DAYS; k++) {
        const iso = isoOfNum(t0 + k)
        const [y, m, d] = iso.split('-').map(Number)
        const info = firstMaha(chartAt(y, m, d))
        // जन्म महादशा की असली शुरुआत से कितने दिन बाद है
        const elapsed = dayNum(iso) - dayNum(trueStartOf(info.lord, info.endISO))
        days.push({ iso, elapsed, ...info })
      }
      scans.push({ round: R, days })
    }
  }, 240000)

  // 3) असली जाँच: भुक्ति का ढाँचा **जन्म की तारीख़ पर निर्भर ही नहीं** होना चाहिए — हर भुक्ति
  // का अंत = महादशा का अंत − उसके बाद वाली भुक्तियों की नाममात्र लंबाई। (पुराने कोड में
  // 366 दिन की सीमा से यह टूटता था: भुक्तियाँ जन्म से बिछती थीं और आख़िरी कट जाती थी।)
  for (const [i, R] of ROUNDS.entries()) {
  }

  // ---- (मुख्य) 1-2) कोई भुक्ति उलटी नहीं + आख़िरी भुक्ति = नाममात्र लंबाई ----
  for (const [i, R] of ROUNDS.entries()) {
    it('(मुख्य) ' + R.label + ' — कोई भुक्ति उलटी नहीं, और आख़िरी भुक्ति अपनी नाममात्र लंबाई की हो', () => {
      const bad = []
      for (const d of scans[i].days) {
        if (d.negative) bad.push(`${d.iso} (${d.lord} दशा): ${d.negative} भुक्ति उलटी`)
        // आख़िरी भुक्ति की लंबाई = उसकी नाममात्र लंबाई (गोलाई ± 2 दिन) — बशर्ते जन्म पहली
        // भुक्ति के अंदर हो (अगर जन्म आख़िरी भुक्ति के अंदर है तो उसका दिखने वाला हिस्सा
        // [जन्म, भुक्ति-अंत] ही सही है, और वह जाँच यहाँ नहीं होती)।
        if (d.elapsed >= 30 && d.lastLord && d.birthInFirstBhukti) {
          const nom = nominalBhuktiDays(d.lord, d.lastLord)
          if (Math.abs(d.lastLen - nom) > 2) {
            bad.push(`${d.iso} (${d.lord} दशा, ${d.elapsed} दिन बीते): आख़िरी भुक्ति ${d.lastLord} ${d.lastLen} दिन, नाममात्र ${nom}`)
          }
        }
      }
      expect(bad, 'गड़बड़:\n' + bad.slice(0, 10).join('\n')).toEqual([])
    })
  }

  // ---- (मुख्य) 3) भुक्ति-ढाँचा जन्म की तारीख़ पर निर्भर न हो ----
  // असली जाँच: हर भुक्ति का अंत = महादशा का अंत − उसके बाद वाली भुक्तियों की नाममात्र
  // लंबाई। (पुराने कोड में 366 दिन की सीमा से यह टूटता था: भुक्तियाँ जन्म से बिछती थीं
  // और आख़िरी कट जाती थी।)
  for (const [i, R] of ROUNDS.entries()) {
    it('(मुख्य) ' + R.label + ' — भुक्ति-ढाँचा जन्म की तारीख़ पर निर्भर नहीं (महादशा-अंत से नापा हुआ)', () => {
      const bad = []
      for (const d of scans[i].days) {
        const n = d.ordered.length
        for (let k = 0; k < n; k++) {
          const row = d.ordered[k]
          if (row.blank) continue
          let after = 0
          for (let j = k + 1; j < n; j++) after += nominalBhuktiDays(d.lord, d.ordered[j].lord)
          const expected = dayNum(d.endISO) - after
          const got = dayNum(row.endISO)
          // आख़िरी भुक्ति के अंत पर कुछ नहीं घटता; और जिस भुक्ति में जन्म पड़ता है उसका
          // आरंभ जन्म से कटता है (पर अंत वही रहता है) — इसलिए हर अंत की तुलना हो सकती है।
          if (Math.abs(got - expected) > 2) bad.push(`${d.iso} (${d.lord} दशा, ${d.elapsed} दिन बीते): ${row.lord} भुक्ति का अंत ${row.endISO}, चाहिए ${isoOfNum(expected)}`)
        }
      }
      expect(bad, 'भुक्ति-ढाँचा जन्म पर निर्भर है:\n' + bad.slice(0, 8).join('\n')).toEqual([])
    })
  }

  // ---- 4) पहरेदार: लगातार दिनों में भुक्ति-अंत का उछाल ≤ 2 दिन ----
  for (const [i, R] of ROUNDS.entries()) {
    it(R.label + ' — लगातार दिनों में भुक्ति-अंत का उछाल ≤ 2 दिन', () => {
      const days = scans[i].days
      const jumps = []
      for (let k = 1; k < days.length; k++) {
        const a = days[k - 1], b = days[k]
        // महादशा बदली तो भुक्ति-सूची ही बदल जाती है — तुलना नहीं।
        // वही नाम (जैसे शनि) 9 नक्षत्र बाद लौटता है, इसलिए महादशा की शुरुआत भी एक-सी होनी चाहिए।
        if (a.lord !== b.lord) continue
        if (Math.abs(dayNum(a.trueStart) - dayNum(b.trueStart)) > 2) continue
        for (const l of Object.keys(b.ends)) {
          if (!a.ends[l]) continue
          const j = Math.abs(dayNum(b.ends[l]) - dayNum(a.ends[l]))
          if (j > 2) jumps.push(`${a.iso} → ${b.iso} (${b.lord} दशा, ${l} भुक्ति का अंत ${a.ends[l]} → ${b.ends[l]} = ${j} दिन)`)
        }
      }
      expect(jumps, 'भुक्ति-अंत में उछाल:\n' + jumps.slice(0, 8).join('\n')).toEqual([])
    })
  }
})
