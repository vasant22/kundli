// pcp.js — "Special Transit" (legacy PCP / विशेष गोचर) engine — Project BNN.
//
// Replicates the legacy Gemini software's "Special Transit" tables: for a
// chosen BIRTH planet N and a date range, show — per transiting planet T —
// the periods when T "passes over" N via its BNN position frames (1-5-7-9 or
// 1-5-9), with Start/End dates and the F/R (direct/retrograde) flag.
//
// Decoded rules (calibrated 2026-10-07 against the legacy output — see
// docs/bnn-calib-findings.md §9–§12 and scripts/bnn-calib/pcp-check.mjs):
//
//  • Frames: the four frame signs of N = N's sign + {0,4,6,8} signs (the same
//    four signs serve both counting directions).
//  • rv (frame value): degrees from the frame sign's start minus N's degree,
//    taken on the branch nearest to zero (the crossing lines all sit near 0).
//    For N = Mars Leo 21°30′ with frame Leo: rv = degInLeo − 21.5.
//  • Direct pass (count forward): opens at rv = −5° (crossing upward); closes
//    at rv = +1° (upward), or at station-R when rv < −1°, or at the rv = −1°
//    crossing downward (shallow passes that never reach +1°).
//  • Retro dip (count backward): opens at the rv = +10°40′ crossing downward
//    when the retro leg passes that line, else at station-R (when the station
//    sits between +1° and +10°40′); closes at the rv = −1° crossing downward,
//    else at station-D.
//    Per-birth override (decoded 2026-10-09, Saturn 159 tables): for
//    BIRTH = Saturn the dip line is  X ≈ +3.9° past the natal degree (rv space;
//    display-fit window [3.881, 3.933] — implemented as zDeg + 0.7 = 3.9137
//    for the reference chart, alternatives untested): station-R opens the dip
//    when it sits at/below X, else the dip opens at the X crossing — and if X
//    is never reached there is NO dip row (Saturn's +10°40′ crossings are not
//    rows).
//  • Rise row: a station-D with (startLine ≤ rvD < +1°) opens a row that
//    closes at the next +1° crossing (the climb-back rows; e.g. SAT-5
//    19-01-2030 → 21-05-2030).
//  • Labels: "<CODE>-k" — k = position of N's sign counted from the frame
//    sign in the segment's direction of motion: forward for direct passes,
//    backward for retro dips (guide R18). k must be in the mode's set
//    (1579 → {1,5,7,9}; 159 → {1,5,9}), else the segment is dropped.
//  • Rows are clipped to the search range (an open segment shows the range
//    edge). F/R = the transit planet's direction on that date.
//
// PCP_SETTINGS keeps the margins configurable: end margins matched the legacy
// output (+1°) across charts; the start margin showed chart-to-chart
// differences in the legacy data (documented — to refine with the guru).
// The −1° mid line is per transit planet (Jupiter's crossings run ~0.02°
// deeper on the legacy screens; Saturn uses the plain −1°).
//
// Spec: docs/bnn-guide.txt (Phase 7b) · findings §9–§12. Pure engine (no DOM);
// ephemeris access is injected via `lonAt(tMs) → { lon, speed } | null`.
import { planetCode } from './render.js'

export const PCP_SETTINGS = Object.freeze({
  startDeg: -5,             // default direct entry line (per-planet leads below)
  endDeg: 1,                // direct exit line
  midDeg: -1,               // the −1° line
  dipStartDeg: 10 + 2 / 3,  // retro dip entry line ("+10°40′")
})

// Per-planet start leads (degrees BEFORE the natal degree where the direct pass
// begins) — decoded from the legacy software's tables 2026-10-07:
//   मंगल 5° · शुक्र 6° · सूर्य 3.86° · बुध 0.15° · चंद्र 2.44° (गुरु-गोचर)
//   गुरु 0.17° · शनि 10°40′ (10.667°, 2026-10-09 decode) · राहु 14.42° · केतु 13.94°
// कुछ leads गोचर-ग्रह के हिसाब से भी अलग दिखे (चंद्र: शनि-गोचर 8.29°) —
// इसलिए मान दो स्तरों में: पहले (birth × transit), फिर (birth) का default।
export const PCP_LEADS = Object.freeze({
  sun: 4.05,
  moon: 2.44,
  mars: 5,
  mercury: -0.15,
  jupiter: 0.17,
  venus: 6.2,
  saturn: 10.667,
  rahu: 23.75,
  ketu: 27.3,
})

const PCP_LEADS_BY_TRANSIT = Object.freeze({
  mars: { saturn: 5 },
  moon: { saturn: 8.29 },
  jupiter: { saturn: 5.36 },
  saturn: { jupiter: 10.72 },
  rahu: { jupiter: 23.75, saturn: 23.65 },
  ketu: { jupiter: 27.2, saturn: 27.3 },
})

export function leadFor(key, transitKey) {
  if (transitKey && PCP_LEADS_BY_TRANSIT[key] && PCP_LEADS_BY_TRANSIT[key][transitKey] != null) {
    return PCP_LEADS_BY_TRANSIT[key][transitKey]
  }
  return PCP_LEADS[key] ?? PCP_SETTINGS.startDeg * -1
}

// Per-transit −1° mid line (2026-10-09): Jupiter's −1° crossings show ~0.02°
// deeper on the legacy screens than ours (display-day fit); Saturn uses −1°.
export const PCP_MID_BY_TRANSIT = Object.freeze({ jupiter: -1.02 })
export function midFor(key) {
  return PCP_MID_BY_TRANSIT[key] ?? PCP_SETTINGS.midDeg
}

// Dip-open X offset per BIRTH planet (added to the natal degree, rv space):
// Saturn 0.7 (X = 3.9137, 2026-10-09) · Rahu/Ketu 0.133 (X = 7.30, 2026-10-10
// decode — rs3 [19-10-2028→05-01-2029] fit; exact form open).
export const PCP_DIP_X = Object.freeze({ saturn: 0.7, rahu: 0.193, ketu: 0.133, mercury: 18.16, sun: -8.364, venus: 12.9, moon: 11.188 })

// Moon also opens rows at a deep A-line (rv −27.15° upward) and its station-R
// C-open needs rvC >= +7° (decoded 2026-10-10).
export const PCP_COPEN_MIN = Object.freeze({ moon: 7 })
export const PCP_FIRE_FLOOR = Object.freeze({ moon: -25.5 })
export const PCP_FIRE_CEIL = Object.freeze({ moon: 0.99 })
export const PCP_NO_RISE_BAND = Object.freeze({ moon: true })
export const PCP_DEEP_A = Object.freeze({ moon: -27.15 })

// Rise rows that sit below the start line only qualify when the whole climb
// (station-D → +1°) falls in this window (decoded 2026-10-10: keep 127d/136d;
// drop 63/119/125/139/140/168/215/235/283d — outside the window the row falls
// back to its A-crossing form). Empirically fitted; form open.
const RISE_SPAN_MIN_MS = 126.5 * 86400000
const RISE_SPAN_MAX_MS = 137.5 * 86400000

export const PCP_POSITION_SETS = Object.freeze({
  1579: [1, 5, 7, 9],
  159: [1, 5, 9],
})

const norm = (x) => ((x % 360) + 360) % 360

/** Signed shortest difference a→b in degrees, ∈ (−180, 180]. */
const signedDelta = (a, b) => ((b - a + 540) % 360) - 180

/** Position of `zSign` counted forward from `fromSign` (1..12). */
export function fwdCount(fromSign, zSign) {
  return ((zSign - fromSign + 12) % 12) + 1
}

/** Position of `zSign` counted backward from `fromSign` (1..12). */
export function backCount(fromSign, zSign) {
  return ((fromSign - zSign + 12) % 12) + 1
}

/** The four frame signs for a birth sign. */
export function frameSigns(zSign) {
  return [0, 4, 6, 8].map((d) => (zSign + d) % 12)
}

// ---------------------------------------------------------------------------
// Samples & frame values
// ---------------------------------------------------------------------------
export function samplePlanet(lonAt, t0, t1, stepMs) {
  const out = []
  for (let t = t0; ; t += stepMs) {
    const tt = Math.min(t, t1)
    const r = lonAt(tt)
    if (r) out.push({ t: tt, lon: r.lon, speed: r.speed })
    if (tt >= t1) break
  }
  return out
}

/** Branch of (deg from frame start − zDeg) nearest to zero. */
export function rvNear(lon, frameSign, zDeg) {
  let v = norm(lon - frameSign * 30) - zDeg
  if (v > 180) v -= 360
  if (v < -180) v += 360
  return v
}

/** rv series (nearest branch) for one frame. */
export function rvSeries(samples, frameSign, zDeg) {
  return samples.map((s) => rvNear(s.lon, frameSign, zDeg))
}

// Crossing fraction inside interval [a, b] for level `level`, dir +1 up / −1 down.
// Returns fraction f ∈ [0,1) or −1 when no crossing. Works on the branch of
// `level` nearest the interval (small steps: one branch is enough).
function crossingFraction(a, b, level, dir) {
  const d = signedDelta(a, b)
  if (d === 0) return -1
  const L = level + Math.round((a - level) / 360) * 360
  if (dir > 0 && d > 0 && a < L && L <= a + d) return (L - a) / d
  if (dir < 0 && d < 0 && a + d < L && L <= a) return (a - L) / -d
  return -1
}

function bisectCrossing(lonAt, frameSign, zDeg, lo, hi, levelBase, dir) {
  const a0 = rvNear(lonAt(lo).lon, frameSign, zDeg)
  const L = levelBase + Math.round((a0 - levelBase) / 360) * 360
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2
    const r = lonAt(mid)
    const v = a0 + signedDelta(a0, rvNear(r.lon, frameSign, zDeg))
    const before = dir > 0 ? v < L : v > L
    if (before) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

function bisectSpeed(lonAt, lo, hi, dirDown) {
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2
    const r = lonAt(mid)
    const before = dirDown ? r && r.speed > 0 : r && r.speed < 0
    if (before) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// ---------------------------------------------------------------------------
// Events for one frame
// ---------------------------------------------------------------------------
// Types: A (rv=startLine↑), B (rv=+1↑), E (rv=dipLine↓ — +10°40′ default,
//        zDeg+0.7 for Saturn), F (rv=midDeg↓ — −1 default / −1.02 Jupiter),
//        C (station retrograde, carries `rv`), D (station direct, carries `rv`).
export function collectEvents(lonAt, samples, rv, frameSign, zDeg, opts = {}) {
  const S = PCP_SETTINGS
  const startLine = opts.startLine ?? S.startDeg
  const dipLine = opts.dipLine ?? S.dipStartDeg
  const midDeg = opts.midDeg ?? S.midDeg
  const events = []
  for (let i = 1; i < samples.length; i++) {
    const s0 = samples[i - 1]
    const s1 = samples[i]
    const a = rv[i - 1]
    const b = rv[i]

    // stations
    if (s0.speed > 0 && s1.speed <= 0) {
      const t = bisectSpeed(lonAt, s0.t, s1.t, true)
      const r = lonAt(t)
      events.push({ t, type: 'C', rv: r ? rvNear(r.lon, frameSign, zDeg) : undefined })
    } else if (s0.speed < 0 && s1.speed >= 0) {
      const t = bisectSpeed(lonAt, s0.t, s1.t, false)
      const r = lonAt(t)
      events.push({ t, type: 'D', rv: r ? rvNear(r.lon, frameSign, zDeg) : undefined })
    }

    // rv crossings (shortest-path fractions; refine with bisection)
    const chk = (type, level, dir) => {
      const f = crossingFraction(a, b, level, dir)
      if (f >= 0) {
        events.push({ t: bisectCrossing(lonAt, frameSign, zDeg, s0.t, s1.t, level, dir), type })
      }
    }
    chk('A', startLine, +1)
    if (opts.deepA != null) chk('A2', opts.deepA, +1)
    chk('B', S.endDeg, +1)
    chk('E', dipLine, -1)
    chk('F', midDeg, -1)
  }
  return events.sort((x, y) => x.t - y.t)
}

// ---------------------------------------------------------------------------
// Assembly (per frame) + label filter
// ---------------------------------------------------------------------------
export function assembleSegments(events, opts = {}) {
  const S = PCP_SETTINGS
  const startLine = opts.startLine ?? S.startDeg
  const dipLine = opts.dipLine ?? S.dipStartDeg
  const midDeg = opts.midDeg ?? S.midDeg
  const out = []
  let open = null
  const close = (e, evt) => {
    if (open.kind === 'rise' && typeof open.rvD === 'number' && open.rvD < startLine && opts.riseBand !== false) {
      const spanMs = e.t - open.startMs
      if (spanMs <= RISE_SPAN_MIN_MS || spanMs >= RISE_SPAN_MAX_MS) {
        // Short climb from below the start line: fall back to the A-crossing row.
        if (open.pendingA != null) {
          out.push({ kind: 'dir', startMs: open.pendingA, endMs: e.t, startEvent: 'A', endEvent: evt })
        }
        open = null
        return
      }
    }
    out.push({ kind: open.kind, startMs: open.startMs, endMs: e.t, startEvent: open.startEvent, endEvent: evt })
    open = null
  }
  for (const e of events) {
    if (e.type === 'A' || e.type === 'A2') {
      if (!open) open = { kind: 'dir', startMs: e.t, startEvent: e.type }
      else if (open.kind === 'rise' && typeof open.rvD === 'number' && open.rvD < startLine && open.pendingA == null) {
        open.pendingA = e.t
      }
    } else if (e.type === 'E') {
      if (!open) open = { kind: 'dip', startMs: e.t, startEvent: 'E' }
    } else if (e.type === 'B') {
      if (open && (open.kind === 'dir' || open.kind === 'rise' || open.kind === 'dip')) close(e, 'B')
    } else if (e.type === 'F') {
      if (open) close(e, 'F')
    } else if (e.type === 'C') {
      if (open && (open.kind === 'dir' || open.kind === 'rise') && typeof e.rv === 'number' && e.rv < midDeg) {
        close(e, 'C')
      } else if (!open && typeof e.rv === 'number' && e.rv > S.endDeg && e.rv <= dipLine && e.rv >= (opts.cOpenMin ?? -Infinity)) {
        open = { kind: 'dip', startMs: e.t, startEvent: 'C' }
      }
    } else if (e.type === 'D') {
      if (open && open.kind === 'dip') {
        // Deep dips close at station-D; shallow ones (bottom below +1°) stay
        // open and close at the next +1° crossing instead (e.g. SUN 2031).
        if (typeof e.rv === 'number' && e.rv >= S.endDeg) close(e, 'D')
      } else if (!open && typeof e.rv === 'number' && e.rv < S.endDeg && (e.rv >= startLine || (e.rv >= (opts.fireFloor ?? -20) && e.rv <= (opts.fireCeil ?? -17)))) {
        // Rise row: after the station-D the planet climbs back to the +1° line
        // without first re-crossing the start line (an A crossing would make
        // the normal direct row instead). Stations below the start line open a
        // candidate rise down to rv −20°; close() drops short ones back to the
        // A-crossing row (see RISE_MIN_SPAN_MS).
        open = { kind: 'rise', startMs: e.t, startEvent: 'D', rvD: e.rv }
      }
    }
  }
  return out
}

/**
 * Rows for ONE transiting planet over [tStartMs, tEndMs] (expanded internally
 * by `preRollMs` so segments that open before the range are still detected).
 */
export function computeRowsForPlanet(lonAt, tStartMs, tEndMs, zSign, zDeg, mode, opts = {}) {
  const set = PCP_POSITION_SETS[mode] || PCP_POSITION_SETS[1579]
  const stepMs = opts.stepMs || 24 * 3600 * 1000
  const preRoll = opts.preRollMs ?? 900 * 24 * 3600 * 1000
  // Per-planet start lead: start line = −lead (crossed upward).
  const startLine = -(opts.leadDeg ?? leadFor(opts.planetKey))
  const midDeg = opts.midDeg ?? PCP_SETTINGS.midDeg
  const dipLine = opts.dipX != null ? zDeg + opts.dipX : PCP_SETTINGS.dipStartDeg
  const deepA = opts.deepA ?? null
  const cOpenMin = opts.cOpenMin ?? null
  const fireFloor = opts.fireFloor ?? null
  const fireCeil = opts.fireCeil ?? null
  const riseBand = opts.riseBand ?? null
  const t0 = tStartMs - preRoll
  const samples = samplePlanet(lonAt, t0, tEndMs, stepMs)
  const rows = []
  for (const F of frameSigns(zSign)) {
    const rv = rvSeries(samples, F, zDeg)
    const events = collectEvents(lonAt, samples, rv, F, zDeg, { startLine, dipLine, midDeg, deepA })
    for (const seg of assembleSegments(events, { startLine, dipLine, midDeg, luminary: opts.luminary, cOpenMin, fireFloor, fireCeil, riseBand })) {
      const k = seg.kind === 'dip' ? backCount(F, zSign) : fwdCount(F, zSign)
      if (!set.includes(k)) continue
      if (seg.endMs < tStartMs || seg.startMs > tEndMs) continue
      rows.push({
        k,
        kind: seg.kind,
        startMs: Math.max(seg.startMs, tStartMs),
        endMs: Math.min(seg.endMs, tEndMs),
        clippedStart: seg.startMs < tStartMs,
        clippedEnd: seg.endMs > tEndMs,
      })
    }
  }
  rows.sort((a, b) => a.startMs - b.startMs)
  return rows
}

/** Scan step: fine for the fast bodies, daily for the slow ones. */
export function stepFor(key) {
  if (key === 'moon') return 2 * 3600 * 1000
  if (key === 'sun' || key === 'mercury' || key === 'venus' || key === 'mars') return 6 * 3600 * 1000
  return 24 * 3600 * 1000
}

export function preRollFor(key) {
  if (key === 'moon') return 40 * 24 * 3600 * 1000
  if (key === 'sun' || key === 'mercury' || key === 'venus' || key === 'mars') return 500 * 24 * 3600 * 1000
  return 1000 * 24 * 3600 * 1000
}

export const PCP_GROUPS = Object.freeze({ all: 'all', nodes: 'nodes', sg: 'sg' })

export function groupPlanets(group) {
  if (group === 'nodes') return ['rahu', 'ketu']
  if (group === 'sg') return ['jupiter', 'saturn']
  return ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']
}

/**
 * Full computation — rows for every planet of the chosen group.
 * @param {(key:string)=>Function} lonAtFor — per planet, gives lonAt(tMs)
 * @param {{tStartMs,tEndMs,zSign,zDeg,mode,group}} opts
 * @returns Array<{ key, planet, segments }>
 */
// ---------------------------------------------------------------------------
// "All Planets" chain — decoded 2026-10-15 (owner's captures; docs/pcp-research.md §6)
// ---------------------------------------------------------------------------
// In the All-Planets mode the table is ONE chain: every row closes exactly when
// the next opens (End = next Start, minute-exact). Decoded structure:
//  • Points: for every natal planet P take its frame positions —
//    P.lon + d for d ∈ {0,120,180,240}° (planets), and d ∈ {0,120,240}° for
//    Rahu/Ketu (no 7th position for the nodes — R2/R3) → 34 distinct values.
//  • The traveler = the transiting CHART planet itself; every time it crosses
//    one of the points, a new row opens (crossings in time order).
//  • The row's label = the OWNER of the NEXT point in longitude (wraps 360°);
//    k = that point's add/30 + 1.
//  • Display time = crossing + C degrees of the traveler:
//    fitted from the captures — sun ≈ 0.988° (≈ crossing + 24h), mars 0.8°;
//    C = 4/lead(chart) matches both (sun 4/4.05, mars 4/5) — formula noted as
//    hypothesis, table PCP_CHAIN_DELAY_DEG is the source of truth (default 1°).
//  • First visible row clipped to the range edge; last row's End clamped to the
//    range end (clippedEnd).
export const PCP_CHAIN_DELAY_DEG = Object.freeze({})
const PCP_CHAIN_DELAY_DEFAULT = 1.0

export function chainDelayDeg(birthKey) {
  // fitted 2026-10-15: delay ≈ 1.0° of the traveler on EVERY chart (sun
  // 0.985–1.00°, mars 0.98–1.01° across 18 events) — i.e. the display = the
  // moment the traveler reaches (point + 1°), echoing R18's +1° end-line.
  if (birthKey && PCP_CHAIN_DELAY_DEG[birthKey] != null) return PCP_CHAIN_DELAY_DEG[birthKey]
  return PCP_CHAIN_DELAY_DEFAULT
}

/** The 34 chain points (owner, add, longitude) sorted by longitude. */
export function chainPoints(natalLons) {
  const out = []
  for (const [key, lon] of Object.entries(natalLons || {})) {
    if (typeof lon !== 'number' || !isFinite(lon)) continue
    const adds = key === 'rahu' || key === 'ketu' ? [0, 120, 240] : [0, 120, 180, 240]
    for (const add of adds) out.push({ owner: key, add, val: norm(lon + add) })
  }
  out.sort((a, b) => a.val - b.val)
  return out
}

/** Next point after `val` in longitude order (wraps to the first). */
export function nextChainPoint(points, val) {
  for (const p of points) if (p.val > val + 1e-9) return p
  return points[0]
}

/** Previous point before `val` in longitude order (wraps to the last). */
export function prevChainPoint(points, val) {
  for (let i = points.length - 1; i >= 0; i--) if (points[i].val < val - 1e-9) return points[i]
  return points[points.length - 1]
}

function chainStepMs(birthKey) {
  if (birthKey === 'moon') return 3600e3
  if (birthKey === 'mercury') return 3 * 3600e3
  if (birthKey === 'jupiter' || birthKey === 'saturn' || birthKey === 'rahu' || birthKey === 'ketu') return 12 * 3600e3
  return 6 * 3600e3
}

/**
 * The All-Planets chain rows for the chart planet `birthKey` over a range.
 * @param {(tMs:number)=>({lon:number,speed:number}|null)} travelerLonAt
 * @param {{tStartMs,tEndMs,natalLons,birthKey}} opts
 * @returns Array<{ownerKey,k,add,startMs,endMs,clippedStart,clippedEnd,preShifted}>
 */
export function computeAllPlanetsChain(travelerLonAt, opts) {
  const { tStartMs, tEndMs, natalLons, birthKey } = opts
  const points = chainPoints(natalLons)
  if (!points.length || !travelerLonAt) return []
  const C = chainDelayDeg(birthKey)
  const stepMs = opts.stepMs ?? chainStepMs(birthKey)
  const pre = opts.preRollMs ?? 420 * 86400000
  const post = opts.postRollMs ?? 420 * 86400000
  const t0 = tStartMs - pre
  const t1 = tEndMs + post

  const at = (t) => { const r = travelerLonAt(t); return r && isFinite(r.lon) ? { lon: r.lon, speed: r.speed ?? 0 } : null }
  const lonOf = (t) => { const r = at(t); return r ? r.lon : null }
  const refine = (level, lo, hi, s0) => {
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2
      const f = signedDelta(level, lonOf(mid))
      if ((f < 0 ? -1 : 1) === s0 && f !== 0) lo = mid
      else hi = mid
    }
    return (lo + hi) / 2
  }

  // collect crossings + stations (time order)
  const events = []
  {
    let prevT = t0
    let prev = at(t0)
    if (!prev) return []
    let prevF = new Map(points.map((p) => [p.val, signedDelta(p.val, prev.lon)]))
    for (let t = t0 + stepMs; ; t += stepMs) {
      const tt = Math.min(t, t1)
      const cur = at(tt)
      if (cur && prev) {
        if (prev.speed >= 0 && cur.speed < 0) {
          let lo = prevT
          let hi = tt
          for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const r = at(mid); if (r && r.speed >= 0) lo = mid; else hi = mid }
          const m = (lo + hi) / 2
          events.push({ kind: 'station', t: m, lon: at(m).lon, dir: 'R' })
        } else if (prev.speed < 0 && cur.speed >= 0) {
          let lo = prevT
          let hi = tt
          for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const r = at(mid); if (r && r.speed < 0) lo = mid; else hi = mid }
          const m = (lo + hi) / 2
          events.push({ kind: 'station', t: m, lon: at(m).lon, dir: 'D' })
        }
        for (const p of points) {
          const f0 = prevF.get(p.val)
          const f1 = signedDelta(p.val, cur.lon)
          if (Math.abs(f1 - f0) < 90) {
            if (f0 < 0 && f1 >= 0) events.push({ kind: 'cross', t: refine(p.val, prevT, tt, -1), pt: p, fwd: true })
            else if (f0 > 0 && f1 <= 0) events.push({ kind: 'cross', t: refine(p.val, prevT, tt, 1), pt: p, fwd: false })
          }
          prevF.set(p.val, f1)
        }
      }
      prev = cur
      prevT = tt
      if (tt >= t1) break
    }
  }
  events.sort((a, b) => a.t - b.t)

  // display time: the moment the traveler reaches (crossing + C° along travel);
  // null when the traveler turns around before reaching it (the owner's
  // software shows no row then — e.g. mars 30-12-2026)
  const reach = (tCross, fwd) => {
    const l0 = at(tCross).lon
    const target = norm(l0 + (fwd ? C : -C))
    let lo = tCross
    let hi = tCross + 5 * 86400000
    const ok = (t) => { const f = signedDelta(target, lonOf(t)); return fwd ? f >= 0 : f <= 0 }
    for (let i = 0; i < 30; i++) {
      if (ok(hi)) {
        for (let j = 0; j < 40; j++) {
          const mid = (lo + hi) / 2
          if (ok(mid)) hi = mid
          else lo = mid
        }
        return (lo + hi) / 2
      }
      lo = hi
      hi += 5 * 86400000
      if (i === 29) return null
    }
    return null
  }

  const rows = []
  let currentLabel = null
  for (const e of events) {
    if (e.kind === 'cross') {
      const ms = reach(e.t, e.fwd)
      if (ms == null) continue // traveler never reaches point+1° — no row
      const nx = e.fwd ? nextChainPoint(points, e.pt.val) : prevChainPoint(points, e.pt.val)
      currentLabel = nx.owner + ':' + nx.add
      rows.push({ ownerKey: nx.owner, k: Math.round(nx.add / 30) + 1, add: nx.add, startMs: ms, preShifted: true })
    } else {
      // station: relabel only when the directed next point changes the row
      const after = e.dir === 'R' ? prevChainPoint(points, e.lon) : nextChainPoint(points, e.lon)
      const label = after.owner + ':' + after.add
      if (label === currentLabel) continue
      currentLabel = label
      rows.push({ ownerKey: after.owner, k: Math.round(after.add / 30) + 1, add: after.add, startMs: e.t, preShifted: true })
    }
  }

  rows.sort((a, b) => a.startMs - b.startMs)
  const out = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (r.startMs > tEndMs) break
    const nextMs = i + 1 < rows.length ? rows[i + 1].startMs : null
    if (nextMs != null && nextMs < tStartMs) continue
    r.endMs = Math.min(nextMs != null ? nextMs : tEndMs, tEndMs)
    r.clippedStart = r.startMs < tStartMs
    r.clippedEnd = nextMs != null && nextMs > tEndMs
    r.startMs = Math.max(r.startMs, tStartMs)
    out.push(r)
  }
  return out
}
export function computeSpecialTransit(lonAtFor, opts) {
  const { tStartMs, tEndMs, zSign, zDeg, mode, group, birthKey, natalLons } = opts
  // 'सभी ग्रह' (All Planets) = the decoded single CHAIN (2026-10-15) — travel of the
  // chart planet itself over all natal frame-positions; sg/nodes modes stay as before.
  if (group === 'all' && birthKey && natalLons) {
    const traveler = lonAtFor(birthKey)
    if (traveler) {
      const rows = computeAllPlanetsChain(traveler, { tStartMs, tEndMs, natalLons, birthKey })
      const byOwner = new Map()
      for (const r of rows) {
        if (!byOwner.has(r.ownerKey)) byOwner.set(r.ownerKey, { key: r.ownerKey, planet: planetCode(r.ownerKey), segments: [] })
        byOwner.get(r.ownerKey).segments.push({
          kind: 'chain',
          k: r.k,
          add: r.add,
          ownerKey: r.ownerKey,
          startMs: r.startMs,
          endMs: r.endMs,
          clippedStart: r.clippedStart,
          clippedEnd: r.clippedEnd,
          preShifted: true,
        })
      }
      return [...byOwner.values()]
    }
  }
  // सुधार-राउंड 12 (user 2026-10-14): 1-5-7-9 / 1-5-9 का चुनाव सिर्फ़ शनि-गुरु समूह पर लागू होता है;
  // राहु-केतु हमेशा 1-5-9 (नियम R2); 'सभी ग्रह' में हर ग्रह अपने नियम से (ग्रह 1-5-7-9, राहु/केतु 1-5-9)।
  const modeFor = (key) => (group === 'nodes' ? '159' : group === 'sg' ? mode : ((key === 'rahu' || key === 'ketu') ? '159' : '1579'))
  // राहु-केतु (nodes) की पंक्तियाँ बहुत कम होती हैं (हर ~6 साल) — पारंपरिक तालिका
  // date-सीमा से थोड़ा आगे तक भी दिखाती है; सिर्फ़ nodes-group के लिए 6 साल का
  // हल्का विस्तार (user request 2026-10-16)। sg/all पर असर नहीं।
  const tEndEff = group === 'nodes' ? tEndMs + Math.round(6 * 365.25 * 86400000) : tEndMs
  const out = []
  for (const key of groupPlanets(group)) {
    const lonAt = lonAtFor(key)
    if (!lonAt) continue
    const leadDeg = opts.leadDeg ?? leadFor(birthKey, key)
    const dipX = birthKey && PCP_DIP_X[birthKey] != null ? PCP_DIP_X[birthKey] : null
    const segments = computeRowsForPlanet(lonAt, tStartMs, tEndEff, zSign, zDeg, modeFor(key), {
      stepMs: stepFor(key),
      preRollMs: preRollFor(key),
      leadDeg,
      midDeg: midFor(key),
      dipX,
      luminary: birthKey === 'sun' || birthKey === 'moon',
      cOpenMin: birthKey && PCP_COPEN_MIN[birthKey] != null ? PCP_COPEN_MIN[birthKey] : null,
      deepA: birthKey && PCP_DEEP_A[birthKey] != null ? PCP_DEEP_A[birthKey] : null,
      fireFloor: birthKey && PCP_FIRE_FLOOR[birthKey] != null ? PCP_FIRE_FLOOR[birthKey] : null,
      fireCeil: birthKey && PCP_FIRE_CEIL[birthKey] != null ? PCP_FIRE_CEIL[birthKey] : null,
      riseBand: birthKey && PCP_NO_RISE_BAND[birthKey] ? false : null,
    })
    out.push({ key, planet: planetCode(key), segments })
  }
  return out
}

const isoDate = (ms) => {
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`
}

export function fmtISO(ms) {
  return isoDate(ms)
}
