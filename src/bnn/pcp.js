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
export function computeSpecialTransit(lonAtFor, opts) {
  const { tStartMs, tEndMs, zSign, zDeg, mode, group, birthKey } = opts
  const out = []
  for (const key of groupPlanets(group)) {
    const lonAt = lonAtFor(key)
    if (!lonAt) continue
    const leadDeg = opts.leadDeg ?? leadFor(birthKey, key)
    const dipX = birthKey && PCP_DIP_X[birthKey] != null ? PCP_DIP_X[birthKey] : null
    const segments = computeRowsForPlanet(lonAt, tStartMs, tEndMs, zSign, zDeg, mode, {
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
