// dasha.js — Vimshottari Dhasa / Bhukthi / Andhiram (Project BNN — Phase 6).
//
// Guide R14 + calibration (2026-10-07, reference chart 22-01-1980 20:30 बैतूल;
// see NOTES.md "Phase 6" + scripts/bnn-calib/dasha-check.mjs):
//  • the traditional format's dasha runs on the Moon computed at UT + ΔT (+0.5 s —
//    the same convention as its Placidus cusps; kp.js). With plain UT the
//    first dasha end is 28-12-1985; with ΔT it is 23-12-1985 — exactly the
//    reference. All nine mahadasha end dates then match to the day.
//  • Balance of the first dasha from birth in calendar years-months-days
//    (year = 365.25 days; month fraction = yearDays/12; days rounded).
//  • Mahadasha end dates by whole calendar years (each end = previous + the
//    lord's full years, calendar-wise).
//  • Bhukthi length = floor(dasha_years × 366 × bhukthi_years / 120) days — the old
//    software's integer division (user 2026-10-13: the MER-dasha chain matches to the
//    day; round() matched only its integer-safe rows); the LAST bhukthi ends exactly
//    on the mahadasha end.
//  • Andhiram length = floor(bhukthi_length × andhiram_years / 120) days over the
//    FULL bhukthi period; the LAST andhiram ends exactly on the bhukthi end.
//    (The guide says "~364-day year within 1 day"; re-fit against the reference:
//    the 366-based proportional floors reproduce every readable reference date
//    to the day — kept as settings, residuals reported.)
//  • राउंड 65-ख (4-11-2026): जन्म पर कटी पहली महादशा में अंतर पूरी अवधि पर बनकर
//    [जन्म, भुक्ति-अंत] में काटे जाते हैं (जन्म से पहले ख़त्म → खाली पंक्ति,
//    भुक्ति के अंत से आगे → पंक्ति हट जाती है)। इससे पहले जन्म-तारीख़ से बनते थे,
//    इसलिए आख़िरी पंक्ति उलटी पड़ जाती थी। देखें andhiramList().
//  • Ages are calendar differences from the birth date (Y-M-D).
//
// Spec: docs/bnn-guide.txt → Phase 6. Check: node scripts/bnn-calib/dasha-check.mjs
import { setBnnAyanamsa } from './kp.js'

export const DASHA_SETTINGS = Object.freeze({
  useDeltaT: true, // dasha Moon computed at UT + ΔT (+ the cusp fine-tune below)
  deltaTFineTune: 0.5, // seconds — same convention as kp.js cusp computation
  balanceYearDays: 365.25, // calendar balance conversion (see mukhya टिप्पणी)
  bhukthiYearDays: 366, // reproduces the reference bhukthi dates exactly
})

// Vimshottari: nakshatra order + years (total 120).
const ORDER = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury']
const YEARS = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 }
const NAK_SPAN = 360 / 27

const day = 86400000
const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
const iso = (dt) => dt.toISOString().slice(0, 10)
export const fmtDMY = (isoStr) => {
  const [y, m, d] = isoStr.split('-')
  return `${d}-${m}-${y}`
}

// Calendar add (years/months/days), method pinned by the scratch calibration.
function addYMD(dt, y, m, d) {
  const x = new Date(dt.getTime())
  x.setUTCFullYear(x.getUTCFullYear() + y)
  x.setUTCMonth(x.getUTCMonth() + m)
  x.setUTCDate(x.getUTCDate() + d)
  return x
}
const addDays = (dt, n) => new Date(dt.getTime() + n * day)

// Calendar difference (Y-M-D) — same convention as render.ageYMD.
function ymdDiff(a, b) {
  const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate()
  let y = b.y - a.y
  let m = b.m - a.m
  let d = b.d - a.d
  if (d < 0) {
    m -= 1
    const pm = b.m - 1 === 0 ? 12 : b.m - 1
    const py = b.m - 1 === 0 ? b.y - 1 : b.y
    d += daysIn(py, pm)
  }
  if (m < 0) {
    y -= 1
    m += 12
  }
  return { y, m, d }
}

const ymdOf = (dt) => ({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() })
const birthYMD = (birth) => ({ y: birth.year, m: birth.month, d: birth.day })

/** Balance of the first dasha from the Moon's sidereal longitude. */
export function dashaBalance(moonLon, settings = DASHA_SETTINGS) {
  const idx = Math.floor(moonLon / NAK_SPAN) // 0..26
  const nakshatra = idx + 1
  const lord = ORDER[idx % 9]
  const frac = (moonLon - idx * NAK_SPAN) / NAK_SPAN
  const remYears = YEARS[lord] * (1 - frac)
  const y = Math.floor(remYears)
  const mf = (remYears - y) * 12
  const m = Math.floor(mf)
  const d = Math.round((mf - m) * (settings.balanceYearDays / 12))
  return { nakshatra, lord, remYears, ymd: { y, m, d } }
}

/**
 * The nine mahadashas. First end = birth + balance (calendar y-m-d); every
 * later end = previous end + the lord's whole years.
 * @returns [{ lord, startISO, endISO, age: {y,m,d} }]
 */
export function mahadashaList(balance, birth, settings = DASHA_SETTINGS) {
  const b0 = birthYMD(birth)
  const start0 = parseISO(`${birth.year}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')}`)
  const rows = []
  let start = start0
  let end = addYMD(start0, balance.ymd.y, balance.ymd.m, balance.ymd.d)
  let lordIdx = ORDER.indexOf(balance.lord)
  for (let i = 0; i < 9; i++) {
    const lord = ORDER[(lordIdx + i) % 9]
    if (i > 0) end = addYMD(start, YEARS[lord], 0, 0)
    rows.push({ lord, startISO: iso(start), endISO: iso(end), age: ymdDiff(b0, ymdOf(end)) })
    start = end
  }
  return rows
}

/**
 * The nine bhukthis inside a mahadasha (sequence starts from the maha lord).
 * Length = floor(Y × 366 × b / 120) days; the last one ends on the maha end.
 * The FIRST mahadasha is partial (it began before birth): its earlier bhukthis
 * are returned as `blank` rows and the first visible one keeps only its
 * remaining part — the traditional format's print shows exactly this shape
 * (sample PDF, user 2026-10-07; the elapsed part is shown as empty rows).
 */
export function bhukthiList(maha, birth, settings = DASHA_SETTINGS) {
  const b0 = birthYMD(birth)
  const birthISO = `${b0.y}-${String(b0.m).padStart(2, '0')}-${String(b0.d).padStart(2, '0')}`
  const birthDate = parseISO(birthISO)
  const start0 = parseISO(maha.startISO)
  const end = parseISO(maha.endISO)
  const lordIdx = ORDER.indexOf(maha.lord)
  const nominal = (lord) => Math.floor((YEARS[maha.lord] * settings.bhukthiYearDays * YEARS[lord]) / 120)
  // राउंड 65-ग (4-11-2026): पहली महादशा जन्म पर कटी होती है — सूची में उसका startISO
  // जन्म-तारीख़ है। उसकी **असली** शुरुआत अंत से उस महादशा के पूरे वर्ष पीछे है (महादशा
  // जिस तरह बनती है उसी से: end = start + YEARS[lord] वर्ष)। पहले यहाँ "बीता हिस्सा" सिर्फ़
  // 366 दिन से ज़्यादा होने पर निकाला जाता था, इसलिए कम बीते होने पर भुक्तियाँ जन्म से
  // पूरी लंबाई के साथ बिछ जाती थीं और आख़िरी भुक्ति अंत पर कटती (कभी उलटी भी) थी।
  // अब पहली और बाक़ी महादशाओं का गणित एक ही है: असली शुरुआत से नाममात्र लंबाई,
  // आख़िरी भुक्ति महादशा-अंत पर, और फिर [जन्म, अंत] में कटाई।
  const partial = iso(start0) === birthISO
  // पहली (जन्म पर कटी) महादशा की असली शुरुआत: नौ नाममात्र भुक्तियों का जोड़ अंत से पीछे
  // (यही वह ढंग है जो सर के sample PDF की तारीख़ें हूबहू देता है — 22-01-1980 की
  // भुक्ति मंगल 01-08-1980)। बाक़ी महादशाओं में startISO ही असली शुरुआत है।
  const sum9 = ORDER.reduce((a, l) => a + nominal(l), 0)
  const fullStart = partial ? addDays(end, -sum9) : start0
  const rows = []
  let cur = fullStart
  for (let i = 0; i < 9; i++) {
    const lord = ORDER[(lordIdx + i) % 9]
    let e = i === 8 ? end : addDays(cur, nominal(lord))
    if (e.getTime() > end.getTime()) e = end
    const blank = (why) => { rows.push({ lord, blank: true, startISO: null, endISO: null, age: null }); cur = e }
    // (क) पूरी तरह जन्म से पहले ख़त्म → तारीख़ें नहीं
    if (e.getTime() <= birthDate.getTime()) { blank(); continue }
    // (ख) जन्म के आर-पार → आरंभ = जन्म-तारीख़
    const s1 = cur.getTime() < birthDate.getTime() ? birthDate : cur
    // (ग) जगह ही नहीं बची (गोलाई से सिकुड़ गई) → खाली पंक्ति (9 पंक्तियाँ बनी रहें)
    if (e.getTime() <= s1.getTime()) { blank(); continue }
    rows.push({ lord, startISO: iso(s1), endISO: iso(e), age: ymdDiff(b0, ymdOf(e)) })
    cur = e
  }
  return rows
}

/**
 * The nine andhirams inside a bhukthi (sequence starts from the bhukthi lord).
 *
 * राउंड 65-ख (4-11-2026) — काटने का नियम (Vas22 जी की हाँ):
 * पहले यह सूची भुक्ति की **दिखने वाली** शुरुआत से बनती थी, पर लंबाई **पूरी भुक्ति** की
 * ली जाती थी। इसलिए जन्म पर कटी पहली महादशा की भुक्तियों में नीचे की पंक्तियाँ भुक्ति के
 * अंत से आगे निकल जाती थीं और आख़िरी पंक्ति उलटी (आरंभ > अंत) दिखती थी — जैसे
 * बेतूल 22-01-1980: भुक्ति मंगल 22-01-1980→01-08-1980 का अंतर चंद्र 24-01-1981→01-08-1980
 * (हर कुंडली में ठीक एक ऐसी पंक्ति)।
 *
 * अब: अंतर पूरी भुक्ति-अवधि पर वैसे ही बनते हैं, फिर [जन्म, भुक्ति-अंत] की सीमा में काटे जाते हैं —
 *  • पूरी तरह जन्म से पहले ख़त्म होने वाला अंतर → `blank` पंक्ति (तारीख़ें नहीं दिखतीं;
 *    वही ढंग जो पहली महादशा की बीती भुक्तियों में पहले से है)
 *  • जन्म के आर-पार वाला अंतर → आरंभ = जन्म-तारीख़
 *  • भुक्ति के अंत से आगे कुछ नहीं जाता → उससे आगे की पंक्तियाँ हट जाती हैं और
 *    आख़िरी पंक्ति का अंत = भुक्ति का अंत
 *  • किसी पंक्ति का आरंभ > अंत नहीं होता
 * जिन भुक्तियों में कुछ नहीं कटता (सामान्य भुक्तियाँ), उनका output पहले जैसा ही रहता है।
 */
export function andhiramList(mahaLord, bhukthi, birth, settings = DASHA_SETTINGS) {
  const b0 = birthYMD(birth)
  const birthISO = `${b0.y}-${String(b0.m).padStart(2, '0')}-${String(b0.d).padStart(2, '0')}`
  const birthDate = parseISO(birthISO)
  const fullLen = Math.floor((YEARS[mahaLord] * settings.bhukthiYearDays * YEARS[bhukthi.lord]) / 120)
  const start0 = parseISO(bhukthi.startISO)
  const end = parseISO(bhukthi.endISO)
  // जो भुक्ति जन्म-तारीख़ से ही शुरू होती है (पहली, जन्म पर कटी), उसकी पूरी अवधि जन्म से
  // पहले शुरू हुई थी — उतने दिन पीछे से बनाओ, फिर जन्म पर काटो।
  const cut = iso(start0) === birthISO
    ? Math.max(0, fullLen - Math.round((end.getTime() - start0.getTime()) / day))
    : 0
  const lordIdx = ORDER.indexOf(bhukthi.lord)
  // नौ सीमाएँ: p[0] = पूरी अवधि की शुरुआत, p[9] = भुक्ति का अंत
  const p = [addDays(start0, -cut)]
  for (let i = 1; i <= 8; i++) {
    p.push(addDays(p[i - 1], Math.floor((fullLen * YEARS[ORDER[(lordIdx + i - 1) % 9]]) / 120)))
  }
  p.push(end)
  const rows = []
  for (let i = 0; i < 9; i++) {
    const lord = ORDER[(lordIdx + i) % 9]
    let s1 = p[i]
    let e1 = p[i + 1]
    if (e1.getTime() > end.getTime()) e1 = end
    if (e1.getTime() <= s1.getTime()) continue // भुक्ति के अंत पर सिकुड़ गई — पंक्ति ही नहीं
    if (e1.getTime() <= birthDate.getTime()) {
      rows.push({ lord, blank: true, startISO: null, endISO: null, age: null })
      continue
    }
    if (s1.getTime() < birthDate.getTime()) s1 = birthDate
    rows.push({ lord, startISO: iso(s1), endISO: iso(e1), age: ymdDiff(b0, ymdOf(e1)) })
  }
  return rows
}

/** Index of the row running at `now` ({y,m,d}); -1 when outside the list. */
export function runningIndex(rows, now) {
  const nowISO = `${now.y}-${String(now.m).padStart(2, '0')}-${String(now.d).padStart(2, '0')}`
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].blank) continue // खाली पंक्ति (जन्म से पहले बीती) — तारीख़ें ही नहीं
    if (nowISO >= rows[i].startISO && nowISO < rows[i].endISO) return i
  }
  return -1
}

const todayYMD = () => {
  const d = new Date()
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
}

/**
 * Full tree for the BNN page: balance + nine mahadashas. Every mahadasha
 * carries its nine `bhukthis` and every (non-blank) bhukthi its nine
 * `andhirams`, so the page can walk the tree by hand (user 2026-10-13, same
 * behaviour as the Windows app). `running` keeps pointing at the rows running
 * today — print / all-chart keep reading exactly what they read before.
 * @param swe — initialised SwissEph instance
 * @param jd — birth julian day (UT)
 * @param birth — { year, month, day } (local calendar date)
 * @param opts — { now?: {y,m,d}, settings? }
 */
export function computeDashaTree(swe, jd, birth, opts = {}) {
  const settings = { ...DASHA_SETTINGS, ...(opts.settings || {}) }
  setBnnAyanamsa(swe)
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED
  const jdDasha = settings.useDeltaT ? jd + swe.deltat(jd) + settings.deltaTFineTune / 86400 : jd
  const moonLon = swe.calc_ut(jdDasha, swe.SE_MOON, flags)[0]

  const balance = dashaBalance(moonLon, settings)
  const mahadashas = mahadashaList(balance, birth, settings)
  for (const maha of mahadashas) {
    maha.bhukthis = bhukthiList(maha, birth, settings)
    for (const bhukthi of maha.bhukthis) {
      // पहली (आधी) महादशा की बीती हुई पंक्तियाँ खाली हैं — उनके अंतर नहीं।
      bhukthi.andhirams = bhukthi.blank ? [] : andhiramList(maha.lord, bhukthi, birth, settings)
    }
  }
  const now = opts.now || todayYMD()
  const mahaIndex = runningIndex(mahadashas, now)
  let bhukthis = null
  let andhirams = null
  let bhukthiIndex = -1
  let andhiramIndex = -1
  if (mahaIndex >= 0) {
    bhukthis = mahadashas[mahaIndex].bhukthis
    bhukthiIndex = runningIndex(bhukthis, now)
    if (bhukthiIndex >= 0) {
      andhirams = bhukthis[bhukthiIndex].andhirams
      andhiramIndex = runningIndex(andhirams, now)
    }
  }
  return {
    moonLon,
    nakshatra: balance.nakshatra,
    lord: balance.lord,
    remYears: balance.remYears,
    balance: balance.ymd,
    mahadashas,
    running: { mahaIndex, bhukthiIndex, andhiramIndex, bhukthis, andhirams },
  }
}
