// dasha.js — Vimshottari Dhasa / Bhukthi / Andhiram (Project BNN — Phase 6).
//
// Guide R14 + calibration (2026-10-07, reference chart 22-01-1980 20:30 बैतूल;
// see NOTES.md "Phase 6" + scripts/bnn-calib/dasha-check.mjs):
//  • The old software's dasha runs on the Moon computed at UT + ΔT (+0.5 s —
//    the same convention as its Placidus cusps; kp.js). With plain UT the
//    first dasha end is 28-12-1985; with ΔT it is 23-12-1985 — exactly the
//    reference. All nine mahadasha end dates then match to the day.
//  • Balance of the first dasha from birth in calendar years-months-days
//    (year = 365.25 days; month fraction = yearDays/12; days rounded).
//  • Mahadasha end dates by whole calendar years (each end = previous + the
//    lord's full years, calendar-wise).
//  • Bhukthi length = round(dasha_years × 366 × bhukthi_years / 120) days;
//    the LAST bhukthi ends exactly on the mahadasha end.
//  • Andhiram length = floor(bhukthi_length × andhiram_years / 120) days;
//    the LAST andhiram ends exactly on the bhukthi end. (The guide says
//    "~364-day year within 1 day"; re-fit against the reference: the
//    366-based proportional floors reproduce every readable reference date
//    to the day — kept as settings, residuals reported.)
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
 * Length = round(Y × 366 × b / 120) days; the last one ends on the maha end.
 */
export function bhukthiList(maha, birth, settings = DASHA_SETTINGS) {
  const b0 = birthYMD(birth)
  const rows = []
  let start = parseISO(maha.startISO)
  const end = parseISO(maha.endISO)
  const lordIdx = ORDER.indexOf(maha.lord)
  for (let i = 0; i < 9; i++) {
    const lord = ORDER[(lordIdx + i) % 9]
    const last = i === 8
    const e = last
      ? end
      : addDays(start, Math.round((YEARS[maha.lord] * settings.bhukthiYearDays * YEARS[lord]) / 120))
    rows.push({ lord, startISO: iso(start), endISO: iso(e), age: ymdDiff(b0, ymdOf(e)) })
    start = e
  }
  return rows
}

/**
 * The nine andhirams inside a bhukthi (sequence starts from the bhukthi lord).
 * Length = floor(bhukthi_length × a / 120) days; the last ends on the bhukthi end.
 */
export function andhiramList(mahaLord, bhukthi, birth, settings = DASHA_SETTINGS) {
  const b0 = birthYMD(birth)
  const bhukthiLen = Math.round((YEARS[mahaLord] * settings.bhukthiYearDays * YEARS[bhukthi.lord]) / 120)
  const rows = []
  let start = parseISO(bhukthi.startISO)
  const end = parseISO(bhukthi.endISO)
  const lordIdx = ORDER.indexOf(bhukthi.lord)
  for (let i = 0; i < 9; i++) {
    const lord = ORDER[(lordIdx + i) % 9]
    const last = i === 8
    const e = last ? end : addDays(start, Math.floor((bhukthiLen * YEARS[lord]) / 120))
    rows.push({ lord, startISO: iso(start), endISO: iso(e), age: ymdDiff(b0, ymdOf(e)) })
    start = e
  }
  return rows
}

/** Index of the row running at `now` ({y,m,d}); -1 when outside the list. */
export function runningIndex(rows, now) {
  const nowISO = `${now.y}-${String(now.m).padStart(2, '0')}-${String(now.d).padStart(2, '0')}`
  for (let i = 0; i < rows.length; i++) {
    if (nowISO >= rows[i].startISO && nowISO < rows[i].endISO) return i
  }
  return -1
}

const todayYMD = () => {
  const d = new Date()
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
}

/**
 * Full tree for the BNN page: balance + mahadashas + (for the running maha)
 * the bhukthis + (for the running bhukthi) the andhirams.
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
  const now = opts.now || todayYMD()
  const mahaIndex = runningIndex(mahadashas, now)
  let bhukthis = null
  let andhirams = null
  let bhukthiIndex = -1
  let andhiramIndex = -1
  if (mahaIndex >= 0) {
    bhukthis = bhukthiList(mahadashas[mahaIndex], birth, settings)
    bhukthiIndex = runningIndex(bhukthis, now)
    if (bhukthiIndex >= 0) {
      andhirams = andhiramList(mahadashas[mahaIndex].lord, bhukthis[bhukthiIndex], birth, settings)
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
