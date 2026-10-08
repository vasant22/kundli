// percent.js — closeness percentages (guide R11; implemented in Phase 4
// because the verification tables need them — kept as settings constants so
// residuals against the reference can be reported; do not tune without
// user confirmation: guide भाग 3 says these are fitted, ~0.3 average error).
export const PERCENT_SETTINGS = Object.freeze({
  p2pBase: 96.65, // %
  p2pPerDegree: 3.147, // % per degree
  p2bWidthFactor: 0.942,
  // Aspect point → bhava: fixed 30° span (guru rule, calibrated 2026-10-08
  // on the old reference chart + the Gudiya chart — see aspectToBhavaPercent).
  aspectSpanDeg: 30,
})

/** Planet↔planet / aspect point: d = in-direction degrees (0–30). */
export function planetToPlanetPercent(d) {
  return PERCENT_SETTINGS.p2pBase - PERCENT_SETTINGS.p2pPerDegree * d
}

/** Planet↔bhava: d = degrees from the bhava's starting cusp; width in degrees. */
export function planetToBhavaPercent(d, width) {
  return 100 * (1 - d / (PERCENT_SETTINGS.p2bWidthFactor * width))
}

/**
 * Aspect point → bhava (guru rule, 2026-10-08): closeness is counted with the
 * FIXED 30° span, not the bhava width: p = 100 × (1 − d / 30), d = degrees
 * from the landing bhava's start cusp. Verified exact on the reference chart
 * (MAR4-71, MAR8-65, SAT3-13, SAT10-6) and within ±1 on the Gudiya chart
 * (MAR8≈28, SAT3-72, SAT10-82). A point at d ≥ 30° is not listed at all.
 * (The old code wrongly used the planet form 100×(1 − d/(0.942×W)) here.)
 */
export function aspectToBhavaPercent(d) {
  return 100 * (1 - d / PERCENT_SETTINGS.aspectSpanDeg)
}

/**
 * The old face's row-label suffix (e.g. "JUP#-91"): the planet's closeness to
 * its own bhava WITHOUT the 0.942 factor — 100 × (1 − d / W). Verified 9/9
 * against the user's screenshots (JUP 91, SUN 18, MOO 95, MAR 69, MER 15,
 * VEN 95, SAT 27, RAH 20, KET 20). Used in the display only.
 */
export function planetToBhavaPlainPercent(d, width) {
  return 100 * (1 - d / width)
}
