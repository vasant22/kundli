// dasha.js — विंशोत्तरी दशा down to प्रत्यंतर (third level).
//
// The mahadasha/antardasha maths is *exactly* astro.computeVimshottari's: the
// year is 365.25 days, the sequence starts from the Moon's nakshatra, and the
// first period may start before birth. This module only extends the same
// arithmetic one level further (antardasha × sub-lord-years / 120) so the
// printed report and the kundli page can never disagree.
//
// BPHS ch.46-47: the antardasha of a mahadasha lasts
//   mahadasha years × antardasha lord's years / 120
// and the pratyantardasha follows the identical rule inside an antardasha.

import { YEAR_DAYS, DASHA_SEQ, DASHA_YEARS, computeVimshottari } from '../astro.js'

const YEAR_MS = YEAR_DAYS * 24 * 3600 * 1000

const orderFrom = (key) => DASHA_SEQ.indexOf(key)

function subPeriods(lordKey, fromMs, totalMs, depth) {
  const out = []
  const base = orderFrom(lordKey)
  let cursor = fromMs
  for (let n = 0; n < 9; n++) {
    const key = DASHA_SEQ[(base + n) % 9]
    const dur = (totalMs * DASHA_YEARS[key]) / 120
    const item = { key, fromMs: cursor, toMs: cursor + dur }
    if (depth > 1) item.sub = subPeriods(key, cursor, dur, depth - 1)
    out.push(item)
    cursor += dur
  }
  return out
}

// The whole tree from birth to `years` (default 100): mahadasha → antardasha →
// pratyantardasha. Sizes are tiny (≈11 × 9 × 9), so the report can hold it all.
export function vimshottariTree(moonLon, birthMs, { years = 100 } = {}) {
  const nakSpan = 360 / 27
  const lon = ((moonLon % 360) + 360) % 360
  const nakIndex = Math.floor(lon / nakSpan)
  const frac = (lon % nakSpan) / nakSpan
  const start = nakIndex % 9

  let cursor = birthMs - frac * DASHA_YEARS[DASHA_SEQ[start]] * YEAR_MS
  const until = birthMs + years * YEAR_MS

  const mahadashas = []
  for (let n = 0; cursor < until; n++) {
    const key = DASHA_SEQ[(start + n) % 9]
    const fullStartMs = cursor
    const toMs = fullStartMs + DASHA_YEARS[key] * YEAR_MS
    mahadashas.push({
      key,
      fromMs: n === 0 ? birthMs : fullStartMs,
      fullStartMs,
      toMs,
      antardashas: subPeriods(key, fullStartMs, toMs - fullStartMs, 2),
    })
    cursor = toMs
  }
  return { birthMs, years, mahadashas }
}

// Which mahadasha / antardasha / pratyantardasha runs at `nowMs`.
export function currentPeriods(tree, nowMs) {
  const inside = (p) => nowMs >= p.fromMs && nowMs < p.toMs
  let md = tree.mahadashas.find(inside)
  if (!md) md = nowMs < tree.mahadashas[0].fromMs ? tree.mahadashas[0] : tree.mahadashas[tree.mahadashas.length - 1]
  const ad = md.antardashas.find(inside) ?? md.antardashas[md.antardashas.length - 1]
  const pd = ad.sub.find(inside) ?? ad.sub[ad.sub.length - 1]
  return {
    maha: { key: md.key, fromMs: md.fromMs, toMs: md.toMs },
    antar: { key: ad.key, fromMs: ad.fromMs, toMs: ad.toMs },
    pratyantar: { key: pd.key, fromMs: pd.fromMs, toMs: pd.toMs },
  }
}

// The mahadasha list (birth → 100 years) as plain rows.
export function mahadashaTable(tree) {
  return tree.mahadashas.map((m) => ({ key: m.key, fromMs: m.fromMs, toMs: m.toMs }))
}

// All antardashas that touch the next `years` years — the "आगे 10 वर्ष" table.
export function antardashaTable(tree, nowMs, { years = 10 } = {}) {
  const until = nowMs + years * YEAR_MS
  const out = []
  for (const md of tree.mahadashas) {
    if (md.toMs <= nowMs) continue
    if (md.fromMs >= until) break
    for (const ad of md.antardashas) {
      if (ad.toMs <= nowMs) continue
      if (ad.fromMs >= until) break
      out.push({
        mahaKey: md.key,
        key: ad.key,
        fromMs: Math.max(ad.fromMs, nowMs),
        toMs: ad.toMs,
      })
    }
  }
  return out
}

// The pratyantardashas of one specific antardasha (report drill-down).
export function pratyantarOf(tree, nowMs) {
  const { maha, antar } = currentPeriods(tree, nowMs)
  const md = tree.mahadashas.find((m) => m.key === maha.key && m.fromMs === maha.fromMs)
  const ad = md?.antardashas.find((a) => a.key === antar.key && a.fromMs === antar.fromMs)
  return (ad?.sub ?? []).map((p) => ({ key: p.key, fromMs: p.fromMs, toMs: p.toMs }))
}

// Cross-check helper: the same numbers the kundli page shows.
export function matchesSiteDasha(moonLon, birthMs, nowMs) {
  return computeVimshottari(moonLon, birthMs, nowMs)
}

export { YEAR_MS, DASHA_SEQ, DASHA_YEARS }
