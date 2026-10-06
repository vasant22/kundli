// transit.js — transit ring + PCP special-transit windows (Project BNN — Phase 7).
//
// Guide R15: transit planets grouped by sign with degree.minute (+ '#' for
// retrograde), and the transit ascendant for a selectable date-time & place.
// Guide R18: PCP — for a natal planet N and set 1579 / 159, find when
// transiting Jupiter / Saturn reach 'Start' (degree − 4°) and 'End'
// (degree + 1°) for each position. Rows that do not fit the preliminary
// rule (7th position, retrograde/station) must be reported, not guessed.
//
// Spec: docs/bnn-guide.txt → Phase 7 / 7b.

/** Transit snapshot for the chart's outside ring. */
export function computeTransitSnapshot(_swe, _whenUtc, _place) {
  throw new Error('BNN transit.js: not implemented yet (Phase 7 — docs/bnn-guide.txt)')
}

/** PCP Start/End windows for one natal planet + set. */
export function computePcpWindows(_ctx, _planetKey, _set, _fromUtc, _toUtc) {
  throw new Error('BNN transit.js: not implemented yet (Phase 7b — docs/bnn-guide.txt)')
}
