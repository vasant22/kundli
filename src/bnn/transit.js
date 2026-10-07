// transit.js — transit ring + PCP special-transit windows (Project BNN — Phase 7).
//
// Guide R15: transit planets grouped by sign with degree.minute (+ '#' for
// retrograde), and the transit ascendant for a selectable date-time & place.
//
// Calibration (2026-10-07, findings §8): the old software computes the transit
// like its natal chart — planets and the Placidus ascendant at UT + ΔT (+0.5 s
// fine-tune) — but the OUTER transit numbers are ROUNDED to the arcminute
// (verified: its "ASC 28.01" at 07-10-2026 04:40:03 IST = our 28°00.9′; the
// inner chart text truncates instead — two different code paths).
// References: 01-10-2026 ≈12:16 IST snapshot (guide भाग 5) + the outer-face
// screenshot at 07-10-2026 04:40:03 (user). Check: scripts/bnn-calib/transit-check.mjs
//
// Guide R18: PCP — Phase 7b (stub below).
// Spec: docs/bnn-guide.txt → Phase 7 / 7b.
import { describeLongitude } from '../astro.js'
import { setBnnAyanamsa } from './kp.js'

const GRAHAS_T = [
  { key: 'sun', name: 'Sun', short: 'Su', constName: 'SE_SUN' },
  { key: 'moon', name: 'Moon', short: 'Mo', constName: 'SE_MOON' },
  { key: 'mars', name: 'Mars', short: 'Ma', constName: 'SE_MARS' },
  { key: 'mercury', name: 'Mercury', short: 'Me', constName: 'SE_MERCURY' },
  { key: 'jupiter', name: 'Jupiter', short: 'Ju', constName: 'SE_JUPITER' },
  { key: 'venus', name: 'Venus', short: 'Ve', constName: 'SE_VENUS' },
  { key: 'saturn', name: 'Saturn', short: 'Sa', constName: 'SE_SATURN' },
]

/**
 * Transit snapshot for the chart's outside ring.
 * @param swe — initialised SwissEph instance
 * @param whenUtc — { year, month, day, hour, minute, second } (UT)
 * @param place — { latitude, longitude }
 * @returns { jd, planets: [9 × describeLongitude], ascendant }
 */
export function computeTransitSnapshot(swe, whenUtc, place) {
  setBnnAyanamsa(swe)
  const hourDecimal = whenUtc.hour + whenUtc.minute / 60 + whenUtc.second / 3600
  const jd = swe.julday(whenUtc.year, whenUtc.month, whenUtc.day, hourDecimal)
  const jdT = jd + swe.deltat(jd) + 0.5 / 86400 // same convention as the natal chart
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED

  const planets = GRAHAS_T.map((g) => {
    const r = swe.calc_ut(jdT, swe[g.constName], flags)
    return describeLongitude(r[0], r[3], g)
  })
  const node = swe.calc_ut(jdT, swe.SE_MEAN_NODE, flags)
  planets.push(
    describeLongitude(node[0], node[3], { key: 'rahu', name: 'Rahu', short: 'Ra' }),
    describeLongitude(node[0] + 180, node[3], { key: 'ketu', name: 'Ketu', short: 'Ke' })
  )

  const h = swe.houses_ex(jdT, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL, place.latitude, place.longitude, 'P')
  const ascendant = describeLongitude(h.ascmc[0], 0, { key: 'asc', name: 'Ascendant', short: 'Asc' })

  return { jd, planets, ascendant }
}

/** PCP Start/End windows for one natal planet + set. */
export function computePcpWindows(_ctx, _planetKey, _set, _fromUtc, _toUtc) {
  throw new Error('BNN transit.js: not implemented yet (Phase 7b — docs/bnn-guide.txt)')
}
