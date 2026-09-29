// sunrise.js — Sunrise, sunset, moonrise, moonset via the Swiss Ephemeris
// `rise_trans` function (available in the swisseph-wasm build).
//
// Definitions chosen to match the reference panchang sites (AstroSage / Drik):
// - Event definition: Swiss Ephemeris default = UPPER limb of the disc with
//   standard refraction (atpress 1013.25 mbar, attemp 15°C). Verified vs
//   AstroSage New Delhi 2026-09-29: our sunrise/sunset within ~20 s, and the
//   day length identical to the second (11:57:22) — well inside the ±1 min
//   target the Panchang spec requires.
// - "The date's" sunrise = first sunrise at/after local midnight; sunset =
//   first sunset at/after local noon. Moonrise/moonset = first event after the
//   date's SUNRISE (verified: both reference sites select it this way). The
//   event may fall on the next calendar date; it is then rendered in extended
//   hours notation — "24:33:59" = 00:33:59 next day, and the count continues
//   past 25/26/27 h (verified against AstroSage Oct 4–7, 2026: 24:33, 25:41,
//   26:45, 27:48). If the event is absent for ~36 h (rare, high latitudes),
//   we return null ("N/A").
// - Disc convention: Sun AND Moon use Swiss Ephemeris default (upper limb +
//   refraction) — this matches AstroSage (the target reference). NOTE: Drik
//   Panchang uses center-of-disc without refraction for the MOON (~4 min
//   difference); that divergence is documented, not a bug.
// - Polar cases (no rise/set): returns null with a `note` flag; callers show a
//   friendly message instead of crashing.
//
// All times are computed on the UT timeline; conversion to the place's local
// wall clock uses `timeutil.offsetAt` (IANA zones, historical rules included).

import { offsetAt } from './timeutil.js'

// SE constants (literal fallbacks in case a build doesn't expose them).
const SE_CALC_RISE = 1
const SE_CALC_SET = 2
const SE_GREG_CAL = 1

// IANA zone name → offset (minutes east of UTC) at the local noon of the given
// date (noon keeps us away from DST transitions at midnight).
export function zoneOffsetMinutesAtNoon(year, month, day, timeZone) {
  const guessMs = Date.UTC(year, month - 1, day, 12, 0, 0)
  return offsetAt(guessMs, timeZone)
}

// JD (UT) of local 00:00 for the place's calendar date.
export function localMidnightJD(swe, year, month, day, offsetMinutes) {
  return swe.julday(year, month, day, 0) - offsetMinutes / 60 / 24
}

// JD (UT) → { year, month, day, hour } local wall clock (Gregorian).
export function jdToLocal(swe, jdUT, offsetMinutes) {
  return swe.revjul(jdUT + offsetMinutes / 60 / 24, SE_GREG_CAL)
}

// "HH:MM:SS" from a JD, in the place's zone.
export function formatLocalTime(swe, jdUT, offsetMinutes) {
  const d = jdToLocal(swe, jdUT, offsetMinutes)
  const hraw = d.hour
  let h = Math.floor(hraw)
  const mraw = (hraw - h) * 60
  let m = Math.floor(mraw)
  let s = Math.round((mraw - m) * 60)
  if (s === 60) { s = 0; m += 1 }
  if (m === 60) { m = 0; h += 1 }
  const p = (n) => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}`
}

// Is `jdUT` on the requested local calendar date?
export function isOnLocalDate(swe, jdUT, year, month, day, offsetMinutes) {
  const d = jdToLocal(swe, jdUT, offsetMinutes)
  return d.year === year && d.month === month && d.day === day
}

// "HH:MM:SS", but if the event falls on the NEXT local date it is rendered in
// the panchang's extended notation (e.g. 00:33:59 next day → "24:33:59").
// This is how the reference shows a moonrise/moonset that spills past midnight
// but still belongs to the reported day (same convention as tithi end-times).
export function formatLocalTimeSlipped(swe, jdUT, year, month, day, offsetMinutes) {
  const local = jdToLocal(swe, jdUT, offsetMinutes)
  const baseJD = swe.julday(year, month, day, 0)
  const localJD = swe.julday(local.year, local.month, local.day, 0)
  const dayDelta = Math.round(localJD - baseJD)
  const hraw = local.hour + dayDelta * 24
  let h = Math.floor(hraw)
  const mraw = (hraw - h) * 60
  let m = Math.floor(mraw)
  let s = Math.round((mraw - m) * 60)
  if (s === 60) { s = 0; m += 1 }
  const p = (n) => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}`
}

// Low-level: first rise/set of `planet` at/after jdStartUT. JD (UT) or null
// (polar day/night — the event simply doesn't happen).
export function nextRiseSet(swe, jdStartUT, planet, rise, geopos, pressure = 1013.25, temp = 15) {
  const rsmi = rise ? SE_CALC_RISE : SE_CALC_SET
  // SEFLG_SWIEPH = 2 (plain ephemeris — rise/set is a horizon event, no
  // sidereal flag needed).
  const res = swe.rise_trans(jdStartUT, planet, '', swe.SEFLG_SWIEPH ?? 2, rsmi, geopos, pressure, temp)
  if (!res || !Number.isFinite(res[0])) return null
  return res[0]
}

/**
 * Compute all four events for a place + local date.
 *
 * opts = {
 *   year, month, day,            // the place's LOCAL calendar date
 *   latitude, longitude,         // degrees (north/east positive)
 *   altitude = 0,                // metres above sea level (small effect)
 *   timeZone,                    // IANA name, e.g. "Asia/Kolkata"
 *   offsetMinutes?,              // optional override (wins over timeZone)
 * }
 *
 * Returns {
 *   offsetMinutes,
 *   sunriseJd, sunsetJd, moonriseJd, moonsetJd,   // JD (UT) | null
 *   sunrise, sunset, moonrise, moonset,           // "HH:MM:SS" | null
 *   dayDurationSeconds,                           // sunset − sunrise | null
 *   note,                                         // 'polar' | null
 * }
 */
export function computeDayTimes(swe, opts) {
  const { year, month, day, latitude, longitude, altitude = 0 } = opts
  const offsetMinutes = Number.isFinite(opts.offsetMinutes)
    ? opts.offsetMinutes
    : zoneOffsetMinutesAtNoon(year, month, day, opts.timeZone)

  const geopos = [longitude, latitude, altitude]
  const midnight = localMidnightJD(swe, year, month, day, offsetMinutes)
  const noonish = midnight + 0.5

  const sunriseJd = nextRiseSet(swe, midnight, swe.SE_SUN, true, geopos)
  const sunsetJd = nextRiseSet(swe, noonish, swe.SE_SUN, false, geopos)

  // Moon: take the FIRST event after the date's SUNRISE (the convention both
  // reference sites use); it may spill onto the next date — see header notes.
  const moonBase = sunriseJd ?? midnight
  const mrRaw = nextRiseSet(swe, moonBase, swe.SE_MOON, true, geopos)
  const msRaw = nextRiseSet(swe, moonBase, swe.SE_MOON, false, geopos)
  const withinWindow = (x) => x && x - moonBase <= 1.5
  const moonriseJd = withinWindow(mrRaw) ? mrRaw : null
  const moonsetJd = withinWindow(msRaw) ? msRaw : null

  // If neither sun event exists for the date, check whether ANY rise/set
  // occurs within the next two days. None → polar day/night (flag for the UI).
  let note = null
  if (!sunriseJd && !sunsetJd) {
    const probeRise = nextRiseSet(swe, midnight + 1, swe.SE_SUN, true, geopos)
    const probeSet = nextRiseSet(swe, midnight + 1, swe.SE_SUN, false, geopos)
    const soon = (x) => x && x - midnight <= 2.2
    if (!soon(probeRise) && !soon(probeSet)) note = 'polar'
  }

  return {
    offsetMinutes,
    sunriseJd,
    sunsetJd,
    moonriseJd,
    moonsetJd,
    sunrise: sunriseJd ? formatLocalTime(swe, sunriseJd, offsetMinutes) : null,
    sunset: sunsetJd ? formatLocalTime(swe, sunsetJd, offsetMinutes) : null,
    moonrise: moonriseJd ? formatLocalTimeSlipped(swe, moonriseJd, year, month, day, offsetMinutes) : null,
    moonset: moonsetJd ? formatLocalTimeSlipped(swe, moonsetJd, year, month, day, offsetMinutes) : null,
    dayDurationSeconds: sunriseJd && sunsetJd ? Math.round((sunsetJd - sunriseJd) * 86400) : null,
    note,
  }
}
