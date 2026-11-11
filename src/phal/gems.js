// gems.js — the graha → gem table and the "is this gem safe to wear" check.
//
// Kept separate from ratna.js so the table can be tested on its own
// (tests/phal-ratna.test.js) and reused by the उपाय text in task 02.

export const GEMS = {
  sun: { hi: 'माणिक्य', en: 'Ruby' },
  moon: { hi: 'मोती', en: 'Pearl' },
  mars: { hi: 'मूंगा', en: 'Red Coral' },
  mercury: { hi: 'पन्ना', en: 'Emerald' },
  jupiter: { hi: 'पुखराज', en: 'Yellow Sapphire' },
  venus: { hi: 'हीरा (विकल्प ओपल)', en: 'Diamond (or Opal)' },
  saturn: { hi: 'नीलम', en: 'Blue Sapphire' },
  rahu: { hi: 'गोमेद', en: 'Hessonite' },
  ketu: { hi: 'लहसुनिया', en: "Cat's Eye" },
}

export function gemFor(planet) {
  return GEMS[planet] ?? null
}

// The classical caution: a gem for a graha that owns a dusthana (6/8/12) but
// no good house (1/5/9) is flagged instead of recommended.
export function ownsDusthanaOnly(frame, planet) {
  const houses = frame.housesOwned(planet)
  const bad = houses.some((h) => [6, 8, 12].includes(h))
  const good = houses.some((h) => [1, 5, 9].includes(h))
  return bad && !good
}

// Weak grahas for the उपाय section: debilitated, combust, or vimshopaka < 10.
export function weakPlanetList({ frame, positions = null, strength = null }) {
  const out = []
  for (const key of Object.keys(frame.owns)) {
    const reasons = []
    if (positions?.[key]) {
      if (positions[key].dignity?.level === 'debilitated') reasons.push('नीच')
      if (positions[key].combustion?.combust) reasons.push('अस्त')
    }
    if (strength?.planets?.[key] && strength.planets[key].total < 10) reasons.push('विंशोपक बल 10 से कम')
    if (reasons.length) out.push({ key, reasons })
  }
  return out
}
