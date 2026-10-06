// percent.js — closeness percentages (Project BNN — Phase 5, guide R11).
//
// Fitted from the reference software; kept as settings so the Phase 5 report
// can show residuals against the reference values (guide भाग 3 + R11):
//   planet↔planet / aspect point:  p = 96.65 − 3.147 × d   (d = 0…30°)
//   planet↔bhava:                  p = 100 × (1 − d / (0.942 × width))
// Do not tune these without user confirmation (guide: "पूरी तरह पक्के नहीं").

export const PERCENT_SETTINGS = Object.freeze({
  p2pBase: 96.65, // %
  p2pPerDegree: 3.147, // % per degree
  p2bWidthFactor: 0.942,
})

/** d = distance in degrees along the direction of motion (0–30). */
export function planetToPlanetPercent(_d) {
  throw new Error('BNN percent.js: not implemented yet (Phase 5 — docs/bnn-guide.txt)')
}

/** d = distance from the bhava's starting cusp; width = bhava width in degrees. */
export function planetToBhavaPercent(_d, _width) {
  throw new Error('BNN percent.js: not implemented yet (Phase 5 — docs/bnn-guide.txt)')
}
