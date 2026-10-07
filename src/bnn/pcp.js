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
//   गुरु 0.17° · शनि 0.89° · राहु 14.42° · केतु 13.94° (गुरु-गोचर)
// कुछ leads गोचर-ग्रह के हिसाब से भी अलग दिखे (चंद्र: शनि-गोचर 8.29°) —
// इसलिए मान दो स्तरों में: पहले (birth × transit), फिर (birth) का default।
export const PCP_LEADS = Object.freeze({
  sun: 3.86,
  moon: 2.44,
  mars: 5,
  mercury: 0.15,
  jupiter: 0.17,
  venus: 6,
  saturn: 0.89,
  rahu: 14.42,
  ketu: 13.94,
})

const PCP_LEADS_BY_TRANSIT = Object.freeze({
  mars: { saturn: 5 },
  moon: { saturn: 8.29 },
  jupiter: { saturn: 5.36 },
  saturn: { jupiter: 10.75 },
  rahu: { saturn: 10.4 },
})

export function leadFor(key, transitKey) {
  if (transitKey && PCP_LEADS_BY_TRANSIT[key] && PCP_LEADS_BY_TRANSIT[key][transitKey] != null) {
    return PCP_LEADS_BY_TRANSIT[key][transitKey]
  }
  return PCP_LEADS[key] ?? PCP_SETTINGS.startDeg * -1
}

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
// Types: A (rv=−5↑), B (rv=+1↑), E (rv=+10°40′↓), F (rv=−1↓),
//        C (station retrograde, carries `rv`), D (station direct).
export function collectEvents(lonAt, samples, rv, frameSign, zDeg, opts = {}) {
  const S = PCP_SETTINGS
  const startLine = opts.startLine ?? S.startDeg
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
      events.push({ t: bisectSpeed(lonAt, s0.t, s1.t, false), type: 'D' })
    }

    // rv crossings (shortest-path fractions; refine with bisection)
    const chk = (type, level, dir) => {
      const f = crossingFraction(a, b, level, dir)
      if (f >= 0) {
        events.push({ t: bisectCrossing(lonAt, frameSign, zDeg, s0.t, s1.t, level, dir), type })
      }
    }
    chk('A', startLine, +1)
    chk('B', S.endDeg, +1)
    chk('E', S.dipStartDeg, -1)
    chk('F', S.midDeg, -1)
  }
  return events.sort((x, y) => x.t - y.t)
}

// ---------------------------------------------------------------------------
// Assembly (per frame) + label filter
// ---------------------------------------------------------------------------
export function assembleSegments(events) {
  const S = PCP_SETTINGS
  const out = []
  let open = null
  const close = (e, evt) => {
    out.push({ kind: open.kind, startMs: open.startMs, endMs: e.t, startEvent: open.startEvent, endEvent: evt })
    open = null
  }
  for (const e of events) {
    if (e.type === 'A') {
      if (!open) open = { kind: 'dir', startMs: e.t, startEvent: 'A' }
    } else if (e.type === 'E') {
      if (!open) open = { kind: 'dip', startMs: e.t, startEvent: 'E' }
    } else if (e.type === 'B') {
      if (open && open.kind === 'dir') close(e, 'B')
    } else if (e.type === 'F') {
      if (open) close(e, 'F')
    } else if (e.type === 'C') {
      if (open && open.kind === 'dir' && typeof e.rv === 'number' && e.rv < S.midDeg) {
        close(e, 'C')
      } else if (!open && typeof e.rv === 'number' && e.rv > S.endDeg && e.rv <= S.dipStartDeg) {
        open = { kind: 'dip', startMs: e.t, startEvent: 'C' }
      }
    } else if (e.type === 'D') {
      if (open && open.kind === 'dip') close(e, 'D')
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
  const t0 = tStartMs - preRoll
  const samples = samplePlanet(lonAt, t0, tEndMs, stepMs)
  const rows = []
  for (const F of frameSigns(zSign)) {
    const rv = rvSeries(samples, F, zDeg)
    const events = collectEvents(lonAt, samples, rv, F, zDeg, { startLine })
    for (const seg of assembleSegments(events)) {
      const k = seg.kind === 'dir' ? fwdCount(F, zSign) : backCount(F, zSign)
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
    const segments = computeRowsForPlanet(lonAt, tStartMs, tEndMs, zSign, zDeg, mode, {
      stepMs: stepFor(key),
      preRollMs: preRollFor(key),
      leadDeg,
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
