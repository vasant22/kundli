// gochar.js — आज का गोचर (transits) + अगले दो वर्षों के राशि-परिवर्तन।
//
// The "which house is good" table is Phaladeepika's gochara chapter (from the
// natal Moon): the standard list every Indian panchang prints. Rahu/Ketu follow
// Saturn's list — a later-tradition convention, labelled as such.

import { ALL_KEYS, norm360 } from './frame.js'
import { msToJd, jdToMs, MS_DAY } from './sadesati.js'

export const GOCHAR_SHUBHA = {
  sun: [3, 6, 10, 11],
  moon: [1, 3, 6, 7, 10, 11],
  mars: [3, 6, 11],
  mercury: [2, 4, 6, 8, 10, 11],
  jupiter: [2, 5, 7, 9, 11],
  venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  saturn: [3, 6, 11],
  rahu: [3, 6, 11], // परवर्ती (शनि की सूची)
  ketu: [3, 6, 11], // परवर्ती
}

const SWE_KEY = {
  sun: 'SE_SUN', moon: 'SE_MOON', mars: 'SE_MARS', mercury: 'SE_MERCURY',
  jupiter: 'SE_JUPITER', venus: 'SE_VENUS', saturn: 'SE_SATURN',
  rahu: 'SE_MEAN_NODE', ketu: 'SE_MEAN_NODE',
}

// Sidereal longitude of a graha at a Julian Day (mean node for Rahu/Ketu, as
// everywhere else in this app).
export function longitudeAt(swe, key, jd) {
  return positionAt(swe, key, jd).longitude
}

// Longitude + speed (speed decides वक्री). Ketu is the node + 180°, so its
// speed is the node's speed unchanged.
export function positionAt(swe, key, jd) {
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED
  const r = swe.calc_ut(jd, swe[SWE_KEY[key]], flags)
  const lon = norm360(r[0] + (key === 'ketu' ? 180 : 0))
  return { longitude: lon, speed: r[3] }
}

const rashiAt = (swe, key, jd) => Math.floor(longitudeAt(swe, key, jd) / 30) % 12

// Next sign changes of one graha inside the window, bisected to the minute.
export function nextSignChanges(swe, key, fromMs, { years = 2, stepDays = 5 } = {}) {
  const endMs = fromMs + years * 365.25 * MS_DAY
  const endJd = msToJd(endMs)
  let jd = msToJd(fromMs)
  let prev = rashiAt(swe, key, jd)
  const out = []
  while (jd < endJd) {
    const nextJd = Math.min(jd + stepDays, endJd)
    const r = rashiAt(swe, key, nextJd)
    if (r !== prev) {
      let lo = jd
      let hi = nextJd
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2
        if (rashiAt(swe, key, mid) === prev) lo = mid
        else hi = mid
      }
      out.push({ key, atMs: jdToMs((lo + hi) / 2), fromRashi: prev, toRashi: r })
      prev = r
    }
    jd = nextJd
  }
  return out
}

export function computeGochar(swe, frame, { nowMs = Date.now(), years = 2 } = {}) {
  const jd = msToJd(nowMs)
  const moonRashi = frame.byKey.moon.rashi
  const lagnaRashi = frame.lagnaRashi

  const positions = {}
  for (const key of ALL_KEYS) {
    const { longitude: lon, speed } = positionAt(swe, key, jd)
    const rashi = Math.floor(lon / 30) % 12
    const houseFromMoon = ((rashi - moonRashi + 12) % 12) + 1
    positions[key] = {
      key,
      longitude: lon,
      speed,
      rashi,
      degInSign: lon - rashi * 30,
      retro: speed < 0,
      houseFromMoon,
      houseFromLagna: ((rashi - lagnaRashi + 12) % 12) + 1,
      shubhaFromMoon: GOCHAR_SHUBHA[key].includes(houseFromMoon),
    }
  }

  const jupiter = nextSignChanges(swe, 'jupiter', nowMs, { years })
  const saturn = nextSignChanges(swe, 'saturn', nowMs, { years })

  return {
    nowMs,
    moonRashi,
    lagnaRashi,
    positions,
    // the four the task sheet asks for by name
    main: {
      jupiter: positions.jupiter,
      saturn: positions.saturn,
      rahu: positions.rahu,
      ketu: positions.ketu,
    },
    nextChanges: { jupiter, saturn },
    shubhaHouses: GOCHAR_SHUBHA,
  }
}
