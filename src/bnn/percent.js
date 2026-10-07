// percent.js — closeness percentages (guide R11; implemented in Phase 4
// because the verification tables need them — kept as settings constants so
// residuals against the reference can be reported; do not tune without
// user confirmation: guide भाग 3 says these are fitted, ~0.3 average error).
export const PERCENT_SETTINGS = Object.freeze({
  p2pBase: 96.65, // %
  p2pPerDegree: 3.147, // % per degree
  p2bWidthFactor: 0.942,
})

/** Planet↔planet / aspect point: d = in-direction degrees (0–30). */
export function planetToPlanetPercent(d) {
  return PERCENT_SETTINGS.p2pBase - PERCENT_SETTINGS.p2pPerDegree * d
}

/** Planet↔bhava: d = degrees from the bhava's starting cusp; width in degrees. */
export function planetToBhavaPercent(d, width) {
  return 100 * (1 - d / (PERCENT_SETTINGS.p2bWidthFactor * width))
}
