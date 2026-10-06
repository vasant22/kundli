// kp.js — KP New ayanamsa + Bhava Chalit (Project BNN — Phase 2).
//
// Guide: भाग 2 "भावचलित" + R9 — Placidus cusps with the KP New ayanamsa;
// house n runs from cusp n to cusp n+1; the drawn chart stays the Lagna
// (rashi) chart, but every table is computed from this placement
// (user-confirmed 2026-10-07). Phase 2 first lists the swisseph
// KP / Krishnamurti sidereal-mode candidates, computes the reference chart
// (22-01-1980 20:30 Betul) with each, and picks the variant that matches
// within 1 arc-minute.
//
// Spec: docs/bnn-guide.txt → Phase 2.

/** Bhava-chalit positions: { cusps, houses, ascendant, ayanamsa, variant }. */
export function computeBhavaChalit(_swe, _utc, _place, _options = {}) {
  throw new Error('BNN kp.js: not implemented yet (Phase 2 — docs/bnn-guide.txt)')
}

/** The verified KP New ayanamsa selection (set in Phase 2). */
export function resolveKpAyanamsa(_swe) {
  throw new Error('BNN kp.js: not implemented yet (Phase 2 — docs/bnn-guide.txt)')
}
