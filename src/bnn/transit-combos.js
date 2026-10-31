// transit-combos.js — राउंड 64 (31-10-2026, Vas22 जी + सर के software के transit screenshot).
//
// गोचर की PLANET COMBINATION। यह NATAL वाली `planetCombinations()` से उलटी तरह काम
// करती है:
//   • पंक्ति का केंद्र ग्रह = **गोचर-ग्रह** (गोचर डिग्री, गोचर वक्री-स्थिति) — उसी से
//     उसके 1-5-7-9 क्षेत्र बनते हैं (राहु-केतु के 1-5-9)।
//   • पंक्ति में आने वाले = **जन्म-कुंडली के ग्रह** (जन्म स्थिति; AP में जन्म का
//     परिवर्तन लगा हुआ — वही `seatPositions(natal, mode)`), और वही-नाम वाला ग्रह भी
//     (गोचर KET की पंक्ति में जन्म का KET)।
//   • दृष्टि-बिंदु जन्म के मंगल (MAR4/MAR8) और शनि (SAT3/SAT10) के; नियम वही R5 वाला
//     (बिंदु केंद्र के अपने पहले 30° क्षेत्र में, केंद्र की दिशा से, aspectForwardDeg छूट;
//     अपना ही बिंदु नहीं — जैसे गोचर शनि की पंक्ति में SAT3/SAT10 नहीं)।
//   • गोचर केंद्र पर परिवर्तन (R6) नहीं लगता और "returned degree" वाला गुरु-नियम भी नहीं।
//   • पंक्ति का नाम `JUP-24` / `MER#-71`: गोचर ग्रह का कोड (+ गोचर वक्री पर '#'), फिर
//     '-' और भाव-बिंदु अंक = `labelSuffix(गोचर डिग्री, जन्म-भाव-संधियाँ).value` — वही
//     सूत्र जो website के पंक्ति-नाम में पहले से जाँचा हुआ है (`transitLabels`)।
//
// पुरानी files (`combos.js`, `percent.js`) में कुछ नहीं बदला — सिर्फ़ उनके exported
// functions import किए हैं। NATAL का output इससे ज़रा भी नहीं बदलता।
import { COMBO_SETTINGS, aspectPoints, labelSuffix, memberOf, seatPositions } from './combos.js'
import { planetToPlanetPercent } from './percent.js'

const norm = (x) => ((x % 360) + 360) % 360
const isNode = (key) => key === 'rahu' || key === 'ketu'

/**
 * One transit planet's row: the transit planet is the centre, the natal planets
 * are the members. Returns [{ type, key|label, zone?, distance, percent }]
 * ordered by distance (same order rule as the natal engine).
 */
export function transitPlanetCombination(transitPlanet, natalSeats) {
  const center = {
    key: transitPlanet.key,
    lon: transitPlanet.longitude,
    retro: !!transitPlanet.retro,
    exchanged: false, // गोचर केंद्र पर परिवर्तन नहीं
  }
  const deltaTo = (x) => (center.retro ? norm(center.lon - x) : norm(x - center.lon))
  const entries = []

  // 1) सदस्य — जन्म के ग्रह
  for (const other of Object.values(natalSeats)) {
    const m = memberOf(center, other.lon)
    if (!m) continue
    if (isNode(other.key) && m.zone === 7) continue // R3
    entries.push({
      type: 'planet',
      key: other.key,
      zone: m.zone,
      distance: m.key < 0 ? -m.key : m.key,
      percent: planetToPlanetPercent(Math.max(0, m.key)),
      natalRetro: other.natalRetro,
    })
  }

  // 2) विशेष दृष्टि — बिंदु जन्म के मंगल/शनि के (R5)
  for (const caster of Object.values(natalSeats)) {
    for (const ap of aspectPoints(caster)) {
      if (ap.from === center.key) continue // अपना ही दृष्टि-बिंदु नहीं
      const d = deltaTo(ap.point)
      let key
      if (d <= 30) key = d
      else if (d >= 360 - COMBO_SETTINGS.aspectForwardDeg) key = d - 360 // पास की ओर छूट
      else continue
      entries.push({
        type: 'aspect',
        label: ap.label,
        from: ap.from,
        distance: key,
        percent: planetToPlanetPercent(Math.max(0, key)),
      })
    }
  }

  entries.sort((a, b) => a.distance - b.distance)
  return entries
}

/**
 * All nine transit rows for a mode.
 * @param transitPlanets — computeTransitSnapshot().planets (longitude/retro)
 * @param natalPlanets   — natal planets (born positions; AP applies here)
 * @param natalCusps     — natal bhava cusps (reserved for future rows; not used
 *                         by the row members — the label suffix uses them, see
 *                         transitLabels())
 * @param mode           — 'AP' | 'BP'
 * @returns { [transitKey]: { list1579, list159 } } — 159 drops 7th-zone members
 *          (aspect entries stay), exactly like the natal engine.
 */
export function transitPlanetCombinations(transitPlanets, natalPlanets, natalCusps, mode = 'AP') {
  const natalSeats = seatPositions(natalPlanets, mode)
  const out = {}
  for (const t of transitPlanets) {
    const full = transitPlanetCombination(t, natalSeats)
    out[t.key] = {
      list1579: full,
      list159: full.filter((e) => e.type === 'aspect' || e.zone !== 7),
    }
  }
  return out
}

/** Row-label numbers for the transit rows: `JUP-24` → 24. */
export function transitLabels(transitPlanets, natalCusps) {
  const out = {}
  for (const t of transitPlanets) out[t.key] = labelSuffix(t.longitude, natalCusps).value
  return out
}
