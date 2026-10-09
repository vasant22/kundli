// tests/bnn-pcp.test.js — "Special Transit" (PCP) engine — Project BNN.
// The engine is pure: ephemeris access is injected as `lonAt(tMs)`, so the
// tests drive it with synthetic, exactly-known motions. The real-ephemeris
// calibration lives in scripts/bnn-calib/pcp-check.mjs (15/15 vs the legacy
// Mars table, 2026-10-07).
import { describe, expect, it } from 'vitest'
import { backCount, frameSigns, fwdCount, computeRowsForPlanet, PCP_LEADS, leadFor, midFor } from '../src/bnn/pcp.js'

const D = (n) => n * 86400000
const T0 = Date.UTC(2030, 0, 1)

// Linear-interpolated keyframes: [[tMs, lon, speedDegPerDay], ...]
function keyedLonAt(keyframes) {
  return (t) => {
    if (t <= keyframes[0][0]) return { lon: keyframes[0][1], speed: keyframes[0][2] }
    for (let i = 1; i < keyframes.length; i++) {
      const [t1, l1, s1] = keyframes[i]
      const [t0, l0, s0] = keyframes[i - 1]
      if (t <= t1) {
        const f = (t - t0) / (t1 - t0)
        return { lon: l0 + (l1 - l0) * f, speed: s0 + (s1 - s0) * f }
      }
    }
    const last = keyframes[keyframes.length - 1]
    return { lon: last[1], speed: last[2] }
  }
}

const days = (ms) => (ms - T0) / D(1)

describe('pcp engine — counts & frames', () => {
  it('position counts (fwd/back)', () => {
    expect(fwdCount(4, 4)).toBe(1)
    expect(fwdCount(0, 4)).toBe(5)
    expect(fwdCount(10, 4)).toBe(7)
    expect(fwdCount(8, 4)).toBe(9)
    expect(backCount(0, 4)).toBe(9)
    expect(backCount(8, 4)).toBe(5)
  })
  it('four frame signs for Leo', () => {
    expect(frameSigns(4)).toEqual([4, 8, 10, 0])
  })
})

describe('pcp engine — direct pass', () => {
  it('one direct row for a clean ascent through the window (mode 1579)', () => {
    // zSign = Leo (4), zDeg = 21.5. Motion inside Leo (120..150):
    // 130° → 150° at 0.5°/day → crosses −5 (136.5) at 13d, +1 (142.5) at 25d.
    const lonAt = keyedLonAt([[T0, 130, 0.5], [T0 + D(40), 150, 0.5]])
    const rows = computeRowsForPlanet(lonAt, T0, T0 + D(40), 4, 21.5, '1579', { stepMs: D(1), preRollMs: D(2) })
    expect(rows.length).toBe(1)
    expect(rows[0].k).toBe(1)
    expect(rows[0].kind).toBe('dir')
    expect(days(rows[0].startMs)).toBeGreaterThan(12)
    expect(days(rows[0].startMs)).toBeLessThan(15)
    expect(days(rows[0].endMs)).toBeGreaterThan(23.5)
    expect(days(rows[0].endMs)).toBeLessThan(26.5)
  })

  it('k=7 rows exist in 1579 but not in 159 (Aquarius frame)', () => {
    // Leo's frame set includes Aquarius (10) where the forward count is 7.
    const lonAt = keyedLonAt([[T0, 310, 0.5], [T0 + D(40), 330, 0.5]])
    const r1579 = computeRowsForPlanet(lonAt, T0, T0 + D(40), 4, 21.5, '1579', { stepMs: D(1), preRollMs: D(2) })
    const r159 = computeRowsForPlanet(lonAt, T0, T0 + D(40), 4, 21.5, '159', { stepMs: D(1), preRollMs: D(2) })
    expect(r1579.some((r) => r.k === 7 && r.kind === 'dir')).toBe(true)
    expect(r159.some((r) => r.k === 7)).toBe(false)
  })

  it('a segment open at the range start is clipped to the range', () => {
    // The −5 crossing (A) happened before the range; the +1 crossing (B)
    // lands inside the range → one row, clipped start.
    const lonAt = keyedLonAt([[T0 - D(10), 135.5, 0.25], [T0 + D(40), 148, 0.25]])
    const rows = computeRowsForPlanet(lonAt, T0, T0 + D(40), 4, 21.5, '1579', { stepMs: D(1), preRollMs: D(30) })
    expect(rows.length).toBe(1)
    expect(rows[0].clippedStart).toBe(true)
    expect(rows[0].startMs).toBe(T0)
    expect(days(rows[0].endMs)).toBeGreaterThan(16)
    expect(days(rows[0].endMs)).toBeLessThan(20)
  })
})

describe('pcp engine — retro dip', () => {
  it('dip opens at station-R (between +1 and +10°40′) and closes at the −1 line', () => {
    // In the Aries frame (back count 9 for Leo). Rise to Ari 28.8 (rv +7.3),
    // station-R, fall through the −1 line (Ari 20.5), then station-D.
    const lonAt = keyedLonAt([
      [T0, 24, 0.24],            // rising toward the station
      [T0 + D(20), 28.8, 0.0],   // station-R at rv = +7.3
      [T0 + D(30), 28.8, -0.28], // retro begins
      [T0 + D(60), 20.6, -0.28], // passes the −1 line (20.5) around here
      [T0 + D(90), 17.0, -0.12],
      [T0 + D(120), 17.0, 0.0],  // station-D
    ])
    const rows = computeRowsForPlanet(lonAt, T0, T0 + D(140), 4, 21.5, '1579', { stepMs: D(1), preRollMs: D(5) })
    const dip = rows.find((r) => r.kind === 'dip')
    expect(dip).toBeTruthy()
    expect(dip.k).toBe(9) // back count from Aries = 9
    expect(days(dip.startMs)).toBeGreaterThan(17)
    expect(days(dip.startMs)).toBeLessThan(23)
    expect(days(dip.endMs)).toBeGreaterThan(58)
    expect(days(dip.endMs)).toBeLessThan(63)
  })
})

describe('pcp engine — rise rows & Saturn dip X', () => {
  it('a station-D between the start line and +1 opens a rise row closing at +1', () => {
    // Leo frame (k=1). Retro into the station at rv −3.1, then direct climb to +1.
    const lonAt = keyedLonAt([
      [T0 - D(10), 137.5, -0.1], // retro leg (rv −4.0 … −3.1)
      [T0, 138.4, 0.0],          // station-D (rv −3.1)
      [T0 + D(30), 142.6, 0.14], // climbs through the +1 line (142.5)
      [T0 + D(60), 145, 0.1],
    ])
    const rows = computeRowsForPlanet(lonAt, T0 - D(5), T0 + D(50), 4, 21.5, '1579', { stepMs: D(1), preRollMs: D(20) })
    const rise = rows.find((r) => r.kind === 'rise')
    expect(rise).toBeTruthy()
    expect(rise.k).toBe(1)
    expect(days(rise.startMs)).toBeGreaterThan(-1.5)
    expect(days(rise.startMs)).toBeLessThan(1.5)
    expect(days(rise.endMs)).toBeGreaterThan(27)
    expect(days(rise.endMs)).toBeLessThan(32)
  })

  it('no rise row when the station sits below the start line (the later A crossing makes the normal row)', () => {
    const lonAt = keyedLonAt([
      [T0 - D(10), 132.0, -0.2],  // deep: rv −9.5 … −11.5
      [T0, 130.0, 0.0],           // station-D at rv −11.5 (below the −5 start line)
      [T0 + D(40), 137.0, 0.175], // climbs: crosses −5 (~+38d), then +1
      [T0 + D(95), 146, 0.1],
    ])
    const rows = computeRowsForPlanet(lonAt, T0 - D(5), T0 + D(95), 4, 21.5, '1579', { stepMs: D(1), preRollMs: D(20) })
    expect(rows.some((r) => r.kind === 'rise')).toBe(false)
    expect(rows.some((r) => r.kind === 'dir')).toBe(true)
  })

  it('Saturn dip X line: the dip opens at the X crossing, not at the +10°40′ line', () => {
    // Leo frame, zDeg 21.5. Saturn mode dipLine = zDeg + 0.7 = rv 22.2.
    // Station-R at rv +26 (> both dip lines) — falls through rv 22.2, then
    // rv 10°40′ (10.667), then the −1 line (lon 140.5).
    const lonAt = keyedLonAt([
      [T0 - D(20), 165.0, 0.125],
      [T0, 167.5, 0.0],           // station-R at rv +26
      [T0 + D(5), 167.0, -0.25],
      [T0 + D(125), 137.0, -0.25],
    ])
    const plain = computeRowsForPlanet(lonAt, T0 - D(5), T0 + D(125), 4, 21.5, '1579', { stepMs: D(1), preRollMs: D(30) })
    const dipPlain = plain.find((r) => r.kind === 'dip')
    expect(dipPlain).toBeTruthy()
    expect(days(dipPlain.startMs)).toBeGreaterThan(61) // opens at the +10°40′ crossing (~+64d)
    expect(days(dipPlain.startMs)).toBeLessThan(68)
    const saturn = computeRowsForPlanet(lonAt, T0 - D(5), T0 + D(125), 4, 21.5, '1579', { stepMs: D(1), preRollMs: D(30), dipX: 0.7 })
    const dip = saturn.find((r) => r.kind === 'dip')
    expect(dip).toBeTruthy()
    expect(dip.k).toBe(1)
    expect(days(dip.startMs)).toBeGreaterThan(15) // opens at the X crossing (~+18d)
    expect(days(dip.startMs)).toBeLessThan(21)
    expect(days(dip.endMs)).toBeGreaterThan(108)  // closes at F (~+111d)
    expect(days(dip.endMs)).toBeLessThan(114)
  })

  it('lead/mid constants', () => {
    expect(PCP_LEADS.saturn).toBe(10.667)
    expect(leadFor('saturn', 'jupiter')).toBe(10.72)
    expect(leadFor('saturn', 'saturn')).toBe(10.667)
    expect(midFor('jupiter')).toBe(-1.02)
    expect(midFor('saturn')).toBe(-1)
  })
})
