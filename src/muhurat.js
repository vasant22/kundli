// muhurat.js — Phase 4: inauspicious & auspicious time windows (kaal/muhurta).
//
// All windows divide the sunrise→sunset daytime (D) of the day:
//   - 8 equal parts  : Rahu Kaal, Yamaganda, Gulika Kaal  (weekday part tables)
//   - 15 equal parts : Kulika, Kantaka/Mrityu, Kalavela/Ardhayaam, Yamaghanta,
//                      Dushta Muhurtas (1–2 parts), Abhijit (8th part)
//
// Tables verified empirically against both reference sites on all 7 weekdays
// (see docs/PANCHANG_FORMULAS.md §11) — do not change a number without a
// published source. Times are plain local wall clock ("From … To …" windows
// shown by the reference).
//
// NOTE on naming: "Dushta Muhurtas" = the classical Durmuhūrta muhūrtas;
// "Kalavela / Ardhayaam" and "Kantaka / Mrityu" are single rows on the
// reference and kept that way here.

import { formatLocalTime } from './sunrise.js'
import { MUHURAT_NAMES } from './i18n.js'

// Part number (1-based) within the 8-part daytime division, per weekday.
// Index: 0=Sunday … 6=Saturday.
export const PART8 = {
  rahu: [8, 2, 7, 5, 6, 4, 3],
  yamaganda: [5, 4, 3, 2, 1, 7, 6],
  gulika: [7, 6, 5, 4, 3, 2, 1],
}

// Part number within the 15-part division, per weekday.
export const PART15 = {
  kulika: [14, 12, 10, 8, 6, 4, 2],
  kantaka: [6, 4, 2, 14, 12, 10, 8],
  kalavela: [8, 6, 4, 2, 14, 12, 10],
  yamaghanta: [10, 8, 6, 4, 2, 14, 12],
  abhijit: [8, 8, 8, 8, 8, 8, 8],
}

// Dushta Muhurtas: one or two parts per weekday (classical Durmuhūrta table).
export const DUSHTA_PARTS = [
  [14], [9, 12], [4], [8], [6, 12], [4, 9], [1, 2],
] // index 0=Sunday … 6=Saturday

function windowOf(sunriseJD, D, n, parts, date) {
  const from = sunriseJD + ((n - 1) * D) / parts
  const to = sunriseJD + (n * D) / parts
  return { fromJd: from, toJd: to }
}

function withText(swe, win, key, offsetMinutes, date) {
  const names = MUHURAT_NAMES[key]
  return {
    key,
    hi: names.hi,
    en: names.en,
    fromJd: win.fromJd,
    toJd: win.toJd,
    from: formatLocalTime(swe, win.fromJd, offsetMinutes),
    to: formatLocalTime(swe, win.toJd, offsetMinutes),
  }
}

/**
 * Compute all muhurat windows for a day.
 * Requires { sunriseJd, sunsetJd, weekday, offsetMinutes, date: {year, month, day} }.
 * Returns null when there is no sunrise/sunset (polar).
 */
export function computeMuhurats(swe, { sunriseJd, sunsetJd, weekday, offsetMinutes, date }) {
  if (!sunriseJd || !sunsetJd) return null
  const D = sunsetJd - sunriseJd

  const w8 = (n) => windowOf(sunriseJd, D, n, 8)
  const w15 = (n) => windowOf(sunriseJd, D, n, 15)

  const out = {
    rahu: withText(swe, w8(PART8.rahu[weekday]), 'rahu', offsetMinutes, date),
    yamaganda: withText(swe, w8(PART8.yamaganda[weekday]), 'yamaganda', offsetMinutes, date),
    gulika: withText(swe, w8(PART8.gulika[weekday]), 'gulika', offsetMinutes, date),
    kulika: withText(swe, w15(PART15.kulika[weekday]), 'kulika', offsetMinutes, date),
    kantaka: withText(swe, w15(PART15.kantaka[weekday]), 'kantaka', offsetMinutes, date),
    kalavela: withText(swe, w15(PART15.kalavela[weekday]), 'kalavela', offsetMinutes, date),
    yamaghanta: withText(swe, w15(PART15.yamaghanta[weekday]), 'yamaghanta', offsetMinutes, date),
    abhijit: withText(swe, w15(PART15.abhijit[weekday]), 'abhijit', offsetMinutes, date),
    dushta: DUSHTA_PARTS[weekday].map((n) => withText(swe, w15(n), 'dushta', offsetMinutes, date)),
  }
  return out
}
