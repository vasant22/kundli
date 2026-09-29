// birthvalidate.js — the shared birth-detail validation rules.
//
// One copy of the rules used by three places:
//   1. the full Kundli form (src/main.js),
//   2. the Kundli-Matching form (/match/, src/match.js — gender not asked
//      there, so it passes requireGender: false),
//   3. the homepage Kundli mini-widget (src/kundli-widget.js).
//
// `v` is the plain object built by each page's form reader:
//   { gender?, day, month, year, hour, minute, second, offset,
//     place, selectedPlace, manual }
// Returns { fieldKey: message } — an empty object when everything is valid.
//
// Extracted from main.js during the Homepage Widgets project (the rules
// themselves are unchanged — the existing tests still pin the behaviour).

import { t } from './i18n.js'
import { isValidTimeZone, parseUtcOffset } from './timeutil.js'

const toInt = (s) => (s === '' ? NaN : Number(s))

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

/**
 * Check one person's birth details.
 * @param {object} v — the values object (see above).
 * @param {object} [opts]
 * @param {boolean} [opts.requireGender=true] — the main form & widget ask
 *   for gender; the matching form does not.
 * @param {string} [opts.placeSelectKey='place.errSelect'] — message key for
 *   "typed a place but didn't pick it from the results"; the widget passes a
 *   variant without the manual-entry sentence (it has no manual fallback).
 */
export function validateBirth(v, { requireGender = true, placeSelectKey = 'place.errSelect' } = {}) {
  const errors = {}

  if (requireGender && !v.gender) errors.gender = t('err.gender')

  // Date: full date required, year 1800–2400, real calendar day.
  const d = toInt(v.day)
  const m = toInt(v.month)
  const y = toInt(v.year)
  if (v.day === '' || v.month === '' || v.year === '') {
    errors.date = t('err.dateRequired')
  } else if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) {
    errors.date = t('err.dateInvalid')
  } else if (y < 1800 || y > 2400) {
    errors.date = t('err.yearRange')
  } else if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) {
    errors.date = t('err.dateInvalid')
  }

  // Time: 24-hour clock, hour 0–23, minute 0–59; empty seconds are taken as 0.
  const h = toInt(v.hour)
  const mi = toInt(v.minute)
  const s = v.second === '' ? 0 : toInt(v.second)
  if (v.hour === '' || v.minute === '') {
    errors.time = t('err.timeRequired')
  } else if (!Number.isInteger(h) || h < 0 || h > 23) {
    errors.time = t('err.hour')
  } else if (!Number.isInteger(mi) || mi < 0 || mi > 59) {
    errors.time = t('err.minute')
  } else if (!Number.isInteger(s) || s < 0 || s > 59) {
    errors.time = t('err.second')
  }

  // Optional manual UTC offset override (e.g. +05:30).
  if (v.offset !== '' && parseUtcOffset(v.offset) === null) {
    errors.offset = t('err.offsetInvalid')
  }

  // Place: either picked from the search results, or filled in manually.
  // (If any manual field is filled, the manual values win — user was explicit.)
  const manualAny = v.manual.lat !== '' || v.manual.lon !== '' || v.manual.tz !== ''
  if (manualAny) {
    const lat = Number(v.manual.lat)
    const lon = Number(v.manual.lon)
    if (v.manual.lat === '' || v.manual.lon === '' || v.manual.tz === '') {
      errors.manual = t('err.latlonRequired')
    } else if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.manual = t('err.latRange')
    } else if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      errors.manual = t('err.lonRange')
    } else if (parseUtcOffset(v.manual.tz) === null && !isValidTimeZone(v.manual.tz)) {
      errors.manual = t('err.tzInvalid')
    }
  } else if (!v.selectedPlace) {
    errors.place = v.place === '' ? t('err.place') : t(placeSelectKey)
  }

  return errors
}
