// panchang.js — Phase 3: Panchang core calculation.
//
// Implements (for a place + local date, sidereal Lahiri, sunrise-anchored):
//   - Tithi, Nakshatra, Yoga, Karana with exact end moments (bisection) and the
//     reference display rules: the element(s) running from today's sunrise,
//     one or two entries; ends after midnight but before the next sunrise are
//     written in "hours past midnight" notation (e.g. 27:20:03 — see
//     formatLocalTimeSlipped); if the first entry's end lies past the next
//     sunrise the reference shows "upto Full Night" (fullNight flag).
//   - Vaar (from the civil weekday of the sunrise date).
//   - Vikram / Shaka / Kali Samvat + Samvatsara name (60-year cycle).
//   - Pravishte / Gate (Bengali solar day-count; rule in the formulas doc §8).
//   - Amanta & Purnimanta lunar months (incl. Adhika) + Ritu.
//   - Moon sign and day duration.
//
// All formulas + sources: docs/PANCHANG_FORMULAS.md. Hindi/English labels are
// applied by the UI via i18n (Panchang Phase 6).

import { computeDayTimes, formatLocalTime, formatLocalTimeSlipped, nextRiseSet, jdToLocal } from './sunrise.js'
import { sunMoonLongitudes, sunSayanaLongitude } from './astro.js'
import { SAMVATSARA_NAMES } from './i18n.js'
import { computeMuhurats } from './muhurat.js'
import { dishaShoola, taraBala, chandraBala } from './panchang-extras.js'

const norm360 = (x) => ((x % 360) + 360) % 360
function signedDeg(x) {
  let v = norm360(x)
  if (v > 180) v -= 360
  return v
}

// --- angle functions (sidereal, evaluated at a UT Julian Day) ---------------
export const angles = {
  tithi: (swe, jd) => { const { sunLon, moonLon } = sunMoonLongitudes(swe, jd); return norm360(moonLon - sunLon) },
  moon: (swe, jd) => sunMoonLongitudes(swe, jd).moonLon,
  yoga: (swe, jd) => { const { sunLon, moonLon } = sunMoonLongitudes(swe, jd); return norm360(sunLon + moonLon) },
  conjunction: (swe, jd) => { const { sunLon, moonLon } = sunMoonLongitudes(swe, jd); return norm360(moonLon - sunLon) },
  sun: (swe, jd) => sunMoonLongitudes(swe, jd).sunLon,
}

// First crossing of `fn` (degrees) past `target` after fromJD (dir=1) or the
// latest crossing before fromJD (dir=−1). Returns JD (UT) or null.
// `s = signedDeg(fn − target)` runs −ε → +ε through an upward crossing; the
// scan skips at most one ±180 discontinuity (angle wrap) before bisecting.
export function findCrossing(swe, fn, target, fromJD, dir = 1) {
  const s = (jd) => signedDeg(fn(swe, jd) - target)
  const step = 0.5 * dir
  const ITER = 32
  let a = fromJD
  let sa = s(a)

  // If we start on the already-crossed side, skip over the wrap first.
  if (dir === 1 ? sa >= 0 : sa <= 0) {
    let guard = 0
    while (guard++ < 200) {
      const b = a + step
      const sb = s(b)
      if (Math.abs(sb - sa) > 180) { a = b; sa = sb; break }
      a = b; sa = sb
    }
  }
  // Scan (bounded) for the crossing of s through 0.
  let guard = 0
  while (guard++ < 200) {
    const b = a + step
    const sb = s(b)
    if (Math.abs(sb - sa) > 180) { a = b; sa = sb; continue }
    const crossed = dir === 1 ? (sa < 0 && sb >= 0) : (sa > 0 && sb <= 0)
    if (crossed) {
      let lo = a
      let hi = b
      for (let k = 0; k < ITER; k++) {
        const m = (lo + hi) / 2
        const sm = s(m)
        if (dir === 1 ? sm < 0 : sm > 0) lo = m
        else hi = m
      }
      return (lo + hi) / 2
    }
    a = b
    sa = sb
  }
  return null
}

// End moment of the element (arc-sized division) containing `jd`.
function elementEnd(swe, fn, arc, jd) {
  const boundary = arc * (Math.floor(fn(swe, jd) / arc) + 1)
  return findCrossing(swe, fn, boundary, jd, 1)
}

// Collect limb entries for the window (sunrise → next sunrise).
// Rules verified against AstroSage (see header): at most TWO entries per limb
// (one or two as applicable — the reference caps it at two, e.g. three karana
// ends can fall inside a day but only the first two are shown). Returns an
// array of { index, endJd, endText, fullNight }.
function limbEntries(swe, fn, arc, sunriseJD, nextSunriseJD, offsetMinutes, dateParts, max = 2) {
  const out = []
  let from = sunriseJD
  for (let i = 0; i < max; i++) {
    if (from >= nextSunriseJD) break
    const end = elementEnd(swe, fn, arc, from)
    if (!end) break
    const index = Math.floor(fn(swe, from) / arc) + 1
    const beyond = end - nextSunriseJD > 5 / 86400 // strictly past the next sunrise (5 s float slack)
    if (i === 0) {
      if (beyond) {
        out.push({ index, endJd: end, endText: null, fullNight: true })
        break
      }
      out.push({
        index, endJd: end, fullNight: false,
        endText: formatLocalTimeSlipped(swe, end, dateParts.year, dateParts.month, dateParts.day, offsetMinutes),
      })
    } else {
      if (beyond) break // later entries ending past the next sunrise are not shown
      out.push({
        index, endJd: end, fullNight: false,
        endText: formatLocalTimeSlipped(swe, end, dateParts.year, dateParts.month, dateParts.day, offsetMinutes),
      })
    }
    from = end + 1 / 86400
  }
  return out
}

// --- karana numbering -------------------------------------------------------
// Half-tithi number n (1..60 from Shukla Pratipada 1st half) → name index.
// 0..6 = movable cycle (Bava…Vishti), 7 Shakuni, 8 Chatushpada, 9 Naga,
// 10 Kimstughna. Verified against AstroSage fixtures (e.g. #49 Vanij, #50
// Vishti, #35 Vanij, #36 Vishti).
export function karanaIndexOf(n) {
  if (n === 1) return 10
  if (n === 58) return 7
  if (n === 59) return 8
  if (n === 60) return 9
  return (n - 2) % 7
}

// --- samvat -----------------------------------------------------------------

const newMoonAfter = (swe, jd) => findCrossing(swe, angles.conjunction, 0, jd + 1e-6, 1)
const fullMoonAfter = (swe, jd) => findCrossing(swe, angles.conjunction, 180, jd + 1e-6, 1)

// First sunrise after a UT moment, for a place.
function sunriseAfter(swe, jd, opts) {
  const geopos = [opts.longitude, opts.latitude, opts.altitude ?? 0]
  return nextRiseSet(swe, jd + 1e-6, swe.SE_SUN, true, geopos)
}

// The Hindu lunar new year (Chaitra Shukla Pratipada as displayed): the first
// sunrise after the Chaitra new moon (new moon with Sun in Meena).
// Verified: 2024 → Apr 9, 2025 → Mar 30, 2026 → Mar 20 (AstroSage flips).
function hinduYearStart(swe, year, offsetMinutes, opts) {
  let jd = swe.julday(year, 2, 1, 0) - offsetMinutes / 60 / 24
  for (let i = 0; i < 5; i++) {
    const nm = newMoonAfter(swe, jd)
    if (!nm) return null
    const { sunLon } = sunMoonLongitudes(swe, nm)
    if (sunLon >= 330 && sunLon < 360) return sunriseAfter(swe, nm, opts)
    jd = nm
  }
  return null
}

function computeSamvat(swe, year, month, day, offsetMinutes, opts) {
  const start = hinduYearStart(swe, year, offsetMinutes, opts)
  const vStart = vikramYearStart(swe, year, offsetMinutes, opts)
  // NOTE: swisseph julday takes HOURS (decimal): 12 = local-noon reference.
  const dateJD = swe.julday(year, month, day, 12) - offsetMinutes / 60 / 24
  const shaka = start && dateJD >= start ? year - 78 : year - 79
  // Vikram increments on the first sunrise after the Phalguna full moon
  // (verified: 2024 Mar 26, 2025 Mar 15, 2026 Mar 4, 2027 Mar 23).
  const vikram = vStart && dateJD >= vStart ? year + 57 : year + 56
  const idx = ((shaka + 12) % 60) || 60
  return {
    shaka,
    vikram,
    kali: shaka + 3179,
    samvatsara: { index: idx, hi: SAMVATSARA_NAMES[idx - 1].hi, en: SAMVATSARA_NAMES[idx - 1].en },
  }
}

// First sunrise after the last full moon before the Chaitra new moon
// (= the first day of Purnimanta Chaitra — the Vikram new-year day shown by
// the reference; see the formulas doc §6).
function vikramYearStart(swe, year, offsetMinutes, opts) {
  const nm = chaitraNewMoon(swe, year, offsetMinutes)
  if (!nm) return null
  const fm = findCrossing(swe, angles.conjunction, 180, nm - 1e-6, -1)
  if (!fm) return null
  return sunriseAfter(swe, fm, opts)
}

// The Chaitra new moon: new moon with the Sun in Meena.
function chaitraNewMoon(swe, year, offsetMinutes) {
  let jd = swe.julday(year, 2, 1, 0) - offsetMinutes / 60 / 24
  for (let i = 0; i < 5; i++) {
    const nm = newMoonAfter(swe, jd)
    if (!nm) return null
    const { sunLon } = sunMoonLongitudes(swe, nm)
    if (sunLon >= 330 && sunLon < 360) return nm
    jd = nm
  }
  return null
}

// --- months -----------------------------------------------------------------

export const MONTH_KEYS = ['chaitra', 'vaishakha', 'jyeshtha', 'ashadha', 'shravana',
  'bhadrapada', 'ashwin', 'kartika', 'margashirsha', 'pausha', 'magha', 'phalguna']

function monthsFor(swe, dateJD, sankrantiAfterJD) {
  // dateJD = the moment of evaluation (sunrise of the date) — the current
  // amanta month = [nmPrev, nmNext) containing it.
  let nm = newMoonAfter(swe, dateJD - 32)
  let nmPrev = null
  while (nm && nm <= dateJD) {
    nmPrev = nm
    nm = newMoonAfter(swe, nm + 1e-4)
  }
  if (!nmPrev) return { amanta: 0, purnimanta: 0, adhika: false }
  const nmNext = nm
  // name: sidereal sign of the Sun at the month's starting new moon
  const sunAtStart = sunMoonLongitudes(swe, nmPrev).sunLon
  let amanta = (Math.floor(sunAtStart / 30) + 1) % 12 // Meena→Chaitra, Mesha→Vaishakha, …
  // Adhika: no sankranti inside the month → takes the NEXT month's name
  let adhika = false
  const sank = sankrantiAfterJD(nmPrev + 1e-5)
  if (sank && nmNext && sank > nmNext) {
    adhika = true
    amanta = (Math.floor(sunMoonLongitudes(swe, nmNext).sunLon / 30) + 1) % 12
  }
  // Purnimanta: same name until the month's full moon, next name after.
  // (During an Adhika month the adhika name is kept throughout.)
  let purnimanta = amanta
  if (!adhika) {
    const fm = fullMoonAfter(swe, nmPrev + 1e-5)
    if (fm && fm < dateJD) purnimanta = (amanta + 1) % 12
  }
  return { amanta, purnimanta, adhika }
}

// --- pravishte --------------------------------------------------------------

// Bengali solar day-count ("Pravishte / Gate"). Smooth counting rule:
//   Δ = sankranti-date − previous-sankranti-date (whole local days)
//   Δ ≥ 31 → the sankranti date shows day 1 (values may reach 32)
//   Δ ≤ 30 → the sankranti date continues the old count (Δ+1, usually 30/31);
//            the next day is 2, then 3, 4, …
// Verified against Drik 2026–2027 (incl. the 32-day months). AstroSage shows
// the same content except a one-day "2" repeat (2026 Srabon) and a glitch on
// 16–17 Jul 2027 — documented in docs/PANCHANG_FORMULAS.md §8.
export function computePravishte(swe, year, month, day, offsetMinutes) {
  const dayNum = (jd) => {
    const d = jdToLocal(swe, jd, offsetMinutes)
    return swe.julday(d.year, d.month, d.day, 0) // X.5 — integer day index (diffs are whole days)
  }
  const D = dayNum(swe.julday(year, month, day, 12) - offsetMinutes / 60 / 24)
  // End of local day D — search backwards for the sankranti whose DATE ≤ D.
  const endOfDay = swe.julday(year, month, day, 0) - offsetMinutes / 60 / 24 + 1 - 1e-6
  const sunFn = angles.sun
  const b0 = 30 * (Math.floor(sunFn(swe, endOfDay) / 30))
  const sk = findCrossing(swe, sunFn, b0, endOfDay, -1)
  if (!sk) return null
  const s = dayNum(sk)
  const skPrev = findCrossing(swe, sunFn, b0 - 30, sk - 1e-5, -1)
  const skNext = findCrossing(swe, sunFn, b0 + 30, sk + 1e-5, 1)
  const delta = skPrev ? Math.round(s - dayNum(skPrev)) : 30
  const value = delta >= 31 ? Math.round(D - s) + 1 : (D === s ? delta + 1 : Math.round(D - s) + 1)
  return {
    value,
    mode: delta >= 31 ? 'A' : 'B',
    sankrantiDayNum: s,
    delta,
    nextSankrantiDayNum: skNext ? dayNum(skNext) : null,
  }
}

// --- main API ---------------------------------------------------------------

/**
 * Full panchang for a place + local date.
 * opts = { year, month, day, latitude, longitude, altitude?, timeZone, offsetMinutes? }
 */
export function computePanchang(swe, opts) {
  const { year, month, day } = opts
  const times = computeDayTimes(swe, opts)
  const offsetMinutes = times.offsetMinutes
  const notes = []

  if (!times.sunriseJd || times.note === 'polar') {
    return { date: { year, month, day }, times, note: times.note ?? 'no-sunrise', notes }
  }

  const sunriseJD = times.sunriseJd
  const sunsetJD = times.sunsetJd
  const nextSunriseJD = sunriseAfter(swe, sunsetJD + 0.01, opts)

  const dateParts = { year, month, day }

  const tithiList = limbEntries(swe, angles.tithi, 12, sunriseJD, nextSunriseJD, offsetMinutes, dateParts)
  const nakList = limbEntries(swe, angles.moon, 360 / 27, sunriseJD, nextSunriseJD, offsetMinutes, dateParts)
  const yogaList = limbEntries(swe, angles.yoga, 360 / 27, sunriseJD, nextSunriseJD, offsetMinutes, dateParts)
  const karanaList = limbEntries(swe, angles.tithi, 6, sunriseJD, nextSunriseJD, offsetMinutes, dateParts)

  const tithiIndex = tithiList[0]?.index ?? null
  const vaar = new Date(Date.UTC(year, month - 1, day)).getUTCDay() // 0 = Sunday

  const sankrantiAfter = (jd) =>
    findCrossing(swe, angles.sun, 30 * (Math.floor(angles.sun(swe, jd) / 30) + 1), jd, 1)

  const samvat = computeSamvat(swe, year, month, day, offsetMinutes, opts)
  const pravishte = computePravishte(swe, year, month, day, offsetMinutes)
  // Month naming is evaluated at SUNRISE (sunrise-anchored, matches the
  // reference: e.g. 15-Jun-2026 still shows the Adhika month although the new
  // moon falls later that morning).
  const months = monthsFor(swe, sunriseJD, sankrantiAfter)

  // ritu — tropical (sayana) Sun at sunrise; boundaries at 330°/30°/…° (60° steps).
  // Verified against the reference on 12 boundary dates in 2026 (doc §10).
  const sayana = sunSayanaLongitude(swe, sunriseJD)
  const ritu = Math.floor(((sayana + 30) % 360) / 60)
  const moonSign = Math.floor(angles.moon(swe, sunriseJD) / 30)

  const muhurats = computeMuhurats(swe, {
    sunriseJd: sunriseJD,
    sunsetJd: sunsetJD,
    weekday: vaar,
    offsetMinutes,
    date: dateParts,
  })

  const extras = {
    dishaShoola: dishaShoola(vaar),
    taraBala: taraBala(nakList[0].index),
    chandraBala: chandraBala(moonSign),
  }

  return {
    date: { year, month, day },
    offsetMinutes,
    vaar, // 0=Sunday … 6=Saturday
    sunrise: times.sunrise,
    sunset: times.sunset,
    nextSunrise: formatLocalTime(swe, nextSunriseJD, offsetMinutes),
    dayDurationSeconds: times.dayDurationSeconds,
    dayDuration: formatSeconds(times.dayDurationSeconds),
    tithi: {
      index: tithiIndex,
      paksha: tithiIndex && tithiIndex > 15 ? 'krishna' : 'shukla',
      entries: tithiList,
    },
    nakshatra: { index: nakList[0]?.index ?? null, entries: nakList },
    yoga: { index: yogaList[0]?.index ?? null, entries: yogaList },
    karana: { numbers: karanaList.map((e) => karanaIndexOf(e.index)), entries: karanaList },
    samvat, // { shaka, vikram, kali, samvatsara: {index, hi, en} }
    pravishte, // { value, mode, delta, … }
    months: {
      amanta: { index: months.amanta, adhika: months.adhika, key: MONTH_KEYS[months.amanta] },
      purnimanta: {
        index: months.purnimanta,
        adhika: months.adhika && months.purnimanta === months.amanta,
        key: MONTH_KEYS[months.purnimanta],
      },
    },
    ritu, // 0=Vasanta, 1=Grishma, 2=Varsha, 3=Sharad, 4=Hemanta, 5=Shishira
    moonSign, // 0=Mesha … 11=Meena
    muhurats, // Phase 4: rahu/yamaganda/gulika/kulika/kantaka/kalavela/yamaghanta/dushta[]/abhijit
    extras, // Phase 5: dishaShoola, taraBala[], chandraBala[]
    notes,
  }
}

function formatSeconds(total) {
  if (total == null) return null
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const p = (n) => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}`
}
