// dasha.js — Vimshottari Dhasa / Bhukthi / Andhiram (Project BNN — Phase 6).
//
// Guide R14: from the Moon's KP New longitude; mahadasha end dates by whole
// calendar years + age (Y-M-D); bhukthi length = dasha_years × 366 ×
// bhukthi_years / 120; the andhiram year ≈ 364 days (best fit — report day
// differences, never force the reference numbers).
//
// Spec: docs/bnn-guide.txt → Phase 6.

export const DASHA_SETTINGS = Object.freeze({
  bhukthiYearDays: 366, // reproduces the reference bhukthi dates exactly
  andhiramYearDays: 364, // best fit (within ~1 day) — report residuals
})

/** Full dasha tree for the chart (+ the running dhasa/bhukthi/andhiram). */
export function computeDashaTree(_ctx, _birth, _settings = DASHA_SETTINGS) {
  throw new Error('BNN dasha.js: not implemented yet (Phase 6 — docs/bnn-guide.txt)')
}
