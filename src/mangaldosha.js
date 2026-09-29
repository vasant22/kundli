// mangaldosha.js — Mangal Dosha (Kuja Dosha) check.
//
// Rules calibrated (2026-09-29) against the reference calculator on ~35
// person-charts (all house positions cross-checked with our own engine):
//   • Mars in houses 1, 4, 7, 8, 12 counted from the Lagna → dosha from Lagna;
//     counted from the Moon → dosha from the Moon.
//   • The 2nd house is NOT counted by the reference implementation (verified
//     with dedicated probe charts) although some traditions include it —
//     documented in tests/MATCH_VALIDATION.md.
//   • Severity: "Low" when present in only one of the two charts (Lagna or
//     Moon), "High" when present in both. "Not manglik" otherwise.
//   • Cancellations are surfaced as NOTES (the status itself stays as-is,
//     exactly like the reference calculator):
//       – both partners having the dosha (traditional mutual cancellation);
//       – Mars in its own sign (Mesha/Vrishchik) or exaltation (Makar) —
//         shown as a traditional nivaran note only.

export const MANGLIK_HOUSES = [1, 4, 7, 8, 12]

// Check one person (needs a computed kundli with planets + ascendant).
export function checkMangalDosha(kundli) {
  const mars = kundli.planets.find((p) => p.key === 'mars')
  const moon = kundli.planets.find((p) => p.key === 'moon')
  if (!mars || !moon) return null

  const lagnaHouse = mars.house // house from the Lagna (computed in astro.js)
  const moonHouse = ((mars.rashi - moon.rashi + 12) % 12) + 1

  const fromLagna = MANGLIK_HOUSES.includes(lagnaHouse)
  const fromMoon = MANGLIK_HOUSES.includes(moonHouse)
  const present = fromLagna || fromMoon
  const severity = fromLagna && fromMoon ? 'high' : present ? 'low' : null

  const ownSign = mars.rashi === 0 || mars.rashi === 7 // Mesha / Vrishchik
  const exalted = mars.rashi === 9 // Makar

  return {
    present,
    fromLagna,
    fromMoon,
    lagnaHouse,
    moonHouse,
    severity, // 'low' | 'high' | null
    ownSign,
    exalted,
    marsRashi: mars.rashi,
    marsHouseFromLagna: lagnaHouse,
  }
}

// Traditional notes for the pair (informational; do NOT change `present`).
export function mangalPairNotes(boy, girl) {
  const notes = []
  if (boy?.present && girl?.present) {
    notes.push({
      key: 'mutual',
      hi: 'दोनों में मंगल दोष है — परंपरा में परस्पर निवारण (दोनों मांगलिक) माना जाता है।',
      en: 'Both have Mangal Dosha — tradition treats this as mutual cancellation.',
    })
  }
  for (const [label, who] of [['वर', boy], ['वधू', girl]]) {
    if (!who?.present) continue
    if (who.ownSign) {
      notes.push({
        key: `ownSign-${label}`,
        hi: `${label}: मंगल अपनी राशि में — कुछ परंपराओं में दोष का निवारण माना जाता है।`,
        en: `${label === 'वर' ? 'Boy' : 'Girl'}: Mars is in its own sign — many traditions consider the dosha cancelled.`,
      })
    } else if (who.exalted) {
      notes.push({
        key: `exalted-${label}`,
        hi: `${label}: मंगल उच्च राशि में — कुछ परंपराओं में दोष का निवारण माना जाता है।`,
        en: `${label === 'वर' ? 'Boy' : 'Girl'}: Mars is exalted — many traditions consider the dosha cancelled.`,
      })
    }
  }
  return notes
}
