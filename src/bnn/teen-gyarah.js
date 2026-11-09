// teen-gyarah.js — राउंड 66 / टास्क 10: सर के software के दो हिस्से।
//   (क) 3-11 संबंध — दो ग्रहों के देशांतर का वृत्तीय अंतर 60° ± 3° (57.000…63.000,
//       दोनों सिरे शामिल) हो तो दोनों जुड़े; सदस्य केवल सात ग्रह (राहु-केतु नहीं)।
//       राशि-सीमा से फ़र्क़ नहीं पड़ता — कोण ही गिना जाता है।
//   (ख) राहु-केतु मध्य बिंदु — जन्म-राहु +90° और +270°; सात ग्रहों की उसी mode की
//       सीट (AP में परिवर्तन के बाद की कुर्सी) किसी बिंदु से ≤ 3.000° हो तो पेटी में।
// नियम-स्रोत: TASK.md (Claude, 9-11-2026; BNN-कोर्स अध्याय-11/13/14/15) —
// सर के software की 16 कुंडलियों से पक्का। यहाँ गणना के पुराने नियम नहीं छेड़े जाते;
// seatPositions (parivartana) का वही काम है जो PLANET/BHAVA तालिकाओं में।
import { seatPositions } from './combos.js'

const norm = (x) => ((x % 360) + 360) % 360

export const TG_SETTINGS = Object.freeze({
  // 3-11: वृत्तीय अंतर का लक्ष्य और छूट (डिग्री) — दोनों सिरे शामिल
  linkDeg: 60,
  linkToleranceDeg: 3,
  // मध्य बिंदु: राहु से ये दो कोण, और छूट (डिग्री)
  midOffsets: Object.freeze([90, 270]),
  midToleranceDeg: 3,
})

// सदस्य केवल सात ग्रह — राहु-केतु नहीं (पक्का: कीर्ति — बुध↔राहु 61°23′ फिर भी ख़ाली)
const SEVEN = Object.freeze(['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'])
const isSeven = (k) => SEVEN.includes(k)

/**
 * (क) 3-11 तालिका।
 * हर ग्रह की पंक्ति → [{ key, gap, side }]; gap = |कोण − 60°|, side = 3 अगर सदस्य
 * ~60° आगे, 11 अगर ~60° पीछे। राहु-केतु की पंक्तियाँ ख़ाली रहती हैं।
 * क्रम: सदस्य की उसी mode की सीट की राशि-डिग्री घटते क्रम में; बराबर हो तो
 * पुरुष/स्त्री पंक्ति-क्रम (order, न दिया जाए तो planets का क्रम)।
 */
export function threeElevenTable(planets, mode = 'AP', order = null) {
  const seats = seatPositions(planets, mode)
  const rowOrder = (order && order.length) ? order : planets.map((p) => p.key)
  const rank = (k) => { const i = rowOrder.indexOf(k); return i < 0 ? 99 : i }
  const out = {}
  for (const p of planets) out[p.key] = []
  for (const a of planets.map((p) => p.key)) {
    if (!isSeven(a) || !seats[a]) continue
    for (const b of SEVEN) {
      if (a === b || !seats[b]) continue
      const d = norm(seats[b].lon - seats[a].lon)
      let side = 0
      let gap = 0
      if (d >= TG_SETTINGS.linkDeg - TG_SETTINGS.linkToleranceDeg && d <= TG_SETTINGS.linkDeg + TG_SETTINGS.linkToleranceDeg) {
        side = 3                                  // सदस्य ~60° आगे = 3रा
        gap = Math.abs(d - TG_SETTINGS.linkDeg)
      } else if (d >= 360 - TG_SETTINGS.linkDeg - TG_SETTINGS.linkToleranceDeg && d <= 360 - TG_SETTINGS.linkDeg + TG_SETTINGS.linkToleranceDeg) {
        side = 11                                 // सदस्य ~60° पीछे = 11वाँ
        gap = Math.abs(360 - d - TG_SETTINGS.linkDeg)
      }
      if (!side) continue
      out[a].push({ key: b, gap, side })
    }
    const degOf = (k) => (seats[k] ? seats[k].degInSign : 0)
    out[a].sort((x, y) => (degOf(y.key) - degOf(x.key)) || (rank(x.key) - rank(y.key)))
  }
  return out
}

/**
 * (ख) राहु-केतु मध्य बिंदु।
 * points = [राहु+90°, राहु+270°] (राहु सदा जन्म का), members = [{ key, gap }]
 * (उसी mode की सीट, वृत्तीय अंतर ≤ 3.000°, बिंदु से पहले/बाद दोनों बराबर),
 * effective = members.length === 1 (एक फँसे ग्रह का ही कारकत्व जाता है)।
 * क्रम: पुरुष/स्त्री पंक्ति-क्रम।
 */
export function rahuKetuMidpoint(planets, mode = 'AP', order = null) {
  const seats = seatPositions(planets, mode)
  const rowOrder = (order && order.length) ? order : planets.map((p) => p.key)
  const rank = (k) => { const i = rowOrder.indexOf(k); return i < 0 ? 99 : i }
  const rahu = planets.find((p) => p.key === 'rahu')
  const points = rahu
    ? TG_SETTINGS.midOffsets.map((o) => norm(rahu.longitude + o))
    : []
  const members = []
  if (points.length) {
    for (const k of SEVEN) {
      if (!seats[k]) continue
      let best = Infinity
      for (const pt of points) {
        let d = Math.abs(norm(seats[k].lon - pt))
        if (d > 180) d = 360 - d
        if (d < best) best = d
      }
      if (best <= TG_SETTINGS.midToleranceDeg) members.push({ key: k, gap: best })
    }
  }
  members.sort((x, y) => rank(x.key) - rank(y.key))
  return { points, members, effective: members.length === 1 }
}
