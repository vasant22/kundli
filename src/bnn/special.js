// special.js — SPECIAL tables (Phase 5, guide R13) + table colours (R17).
//
// R13: per bhava, the Director = a planet sitting in the bhava that also sits
// in the bhava's sign (or in a sign owned by the same lord); if several, the
// one nearest the bhava's starting cusp; otherwise the bhava's lord. Per
// planet: houses owned / house sat in → the houses whose results it gives /
// star lord + house it sits in / the results the star lord gives. Per bhava:
// "IN STAR OF A" = planets whose star lord sits in A (A = a planet of the
// bhava; if empty, the bhava's lord).
// R17: first entry blue; ≥20% green; <20% orange; Saturn always green when
// not first. (Astronomy column colour is a renderer concern.)
// Verified against the guide's AP expectations — scripts/bnn-calib/special-check.mjs
import { RASHI_LORDS } from '../astro.js'
import { bhavaIndexOf, seatPositions } from './combos.js'
import { computePrsss } from './prsss.js'

const norm = (x) => ((x % 360) + 360) % 360

/** Star lord (nakshatra lord) of a natal longitude. */
export function starLordOf(longitude) {
  return computePrsss(longitude)[1]
}

/** Full SPECIAL data for one mode. */
export function specialTables(planets, cusps, mode = 'AP') {
  const seats = seatPositions(planets, mode)
  const cuspLons = cusps.map((c) => c.longitude)
  const signs = cusps.map((c) => Math.floor(c.longitude / 30) % 12)
  const bhavaLord = signs.map((s) => RASHI_LORDS[s])

  // Director per bhava.
  const directors = {}
  for (let b = 1; b <= 12; b++) {
    const cusp = cuspLons[b - 1]
    const occupants = Object.values(seats).filter((p) => bhavaIndexOf(p.lon, cusps) === b)
    const qualified = occupants.filter(
      (p) => p.rashi === signs[b - 1] || RASHI_LORDS[p.rashi] === bhavaLord[b - 1]
    )
    if (qualified.length > 0) {
      qualified.sort((p, q) => norm(p.lon - cusp) - norm(q.lon - cusp))
      directors[b] = qualified[0].key
    } else {
      directors[b] = bhavaLord[b - 1]
    }
  }

  // Per-planet rows.
  const rows = {}
  for (const p of planets) {
    const seat = seats[p.key]
    const sitsAt = bhavaIndexOf(seat.lon, cusps)
    const owns = []
    const gives = []
    for (let b = 1; b <= 12; b++) {
      if (bhavaLord[b - 1] === p.key) owns.push(b)
      if (directors[b] === p.key) gives.push(b)
    }
    const starLord = starLordOf(p.longitude)
    const starAt = bhavaIndexOf(seats[starLord].lon, cusps)
    const starGives = []
    for (let b = 1; b <= 12; b++) if (directors[b] === starLord) starGives.push(b)
    rows[p.key] = { owns, sitsAt, gives, starLord, starAt, starGives }
  }

  // IN STAR OF A per bhava (planet order kept).
  const inStarOf = {}
  for (let b = 1; b <= 12; b++) {
    let aSet = Object.values(seats)
      .filter((p) => bhavaIndexOf(p.lon, cusps) === b)
      .map((p) => p.key)
    if (aSet.length === 0) aSet = [bhavaLord[b - 1]]
    inStarOf[b] = planets.filter((p) => aSet.includes(starLordOf(p.longitude))).map((p) => p.key)
  }

  // Bhava side of the SPECIAL tab (guru's software layout — user 2026-10-07):
  // LORD = the bhava's rashi lord; PLANETS(A) = planets sitting in the bhava
  // (nearest the cusp first — the order the reference screenshots show).
  const lords = {}
  const inBhava = {}
  for (let b = 1; b <= 12; b++) {
    lords[b] = bhavaLord[b - 1]
    const occupants = Object.values(seats).filter((p) => bhavaIndexOf(p.lon, cusps) === b)
    occupants.sort((p, q) => norm(p.lon - cuspLons[b - 1]) - norm(q.lon - cuspLons[b - 1]))
    inBhava[b] = occupants.map((p) => ({ key: p.key, natalRetro: p.natalRetro }))
  }

  return { directors, lords, inBhava, rows, inStarOf }
}

/** R17 entry colour class: 'blue' | 'green' | 'orange'. */
export function entryColour(percent, isFirst, planetKey) {
  if (isFirst) return 'blue'
  if (planetKey === 'saturn') return 'green' // guru's rule — SAT always acts
  return percent >= 20 ? 'green' : 'orange'
}
