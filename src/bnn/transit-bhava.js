// transit-bhava.js — राउंड 64, गोचर की BHAVA COMBINATION (गोचर-ग्रह, जन्म-भाव)।
//
// यह `combos.js` के `bhavaCombinations()` का गोचर-वाला रूप है — नियम वही, बस एक
// अंतर, जो सर के software के transit screenshot से निकला (31-10-2026, Vas22 जी):
//
//   **संधि से पीछे वाला ग्रह:** जिस ग्रह का `planetToBhavaPercent()` (यानी
//   100×(1 − d/(0.942×चौड़ाई)) ) ऋणात्मक आता है — यानी वह अपने भाव की अगली संधि से
//   बहुत थोड़ा पहले है — वह **अगले भाव** में गिना जाता है, और उसकी दूरी ऋणात्मक (−)
//   ली जाती है। ऋणात्मक दूरी से प्रतिशत 100 से ऊपर आता है, इसलिए वह पंक्ति में
//   सबसे पहले दिखता है। (उदाहरण: Coimbatore 31-12-1977 का गोचर-सूर्य तुला 13.25,
//   8वीं संधि 14.58 से 1.55° पहले → भाव 8 में, और B04/B08/B12 में सबसे पहले।)
//
// यह file NATAL को छूती नहीं — `combos.js` में कुछ नहीं बदला। नियम सिर्फ़ यहाँ है,
// इसलिए नियम बदलना हो तो बस यही file बदलेगी।
import { aspectPoints, bhavaIndexOf, seatPositions } from './combos.js'
import { aspectToBhavaPercent, planetToBhavaPercent } from './percent.js'

const norm = (x) => ((x % 360) + 360) % 360
const isNode = (key) => key === 'rahu' || key === 'ketu'

/**
 * BHAVA rows for transiting planets against the natal bhava cusps.
 * Same shape as combos.js → { [n]: { list159, list1579 } }.
 */
export function bhavaCombinationsTransit(planets, cusps, mode = 'AP') {
  const seats = seatPositions(planets, mode)
  const cuspList = cusps.map((c) => c.longitude)
  const bhavaOf = (lon) => bhavaIndexOf(lon, cusps)

  const perBhava = Array.from({ length: 13 }, () => [])
  for (const other of Object.values(seats)) {
    let b = bhavaOf(other.lon)
    const d = norm(other.lon - cuspList[b - 1])
    const w = norm(cuspList[b % 12] - cuspList[b - 1]) || 360
    let dist = d
    let pct = planetToBhavaPercent(d, w)
    if (pct < 0) {
      // संधि से पीछे → अगला भाव। प्रतिशत वही सूत्र, पर दूरी = अगली (नई भाव की) संधि तक,
      // और चौड़ाई = पुरानी भाव की (सुधार-3: सर के software से — शनि 0.517°/30.03° → 98.2)।
      b = (b % 12) + 1
      dist = w - d
      pct = planetToBhavaPercent(dist, w)
    }
    perBhava[b].push({
      type: 'planet',
      key: other.key,
      distance: dist,
      percent: pct,
      natalRetro: other.natalRetro,
    })
  }
  // दृष्टि-बिंदु: वही नियम जो natal में — सिर्फ़ 30° के भीतर, प्रतिशत 100×(1−d/30)
  for (const caster of Object.values(seats)) {
    for (const ap of aspectPoints(caster)) {
      const b = bhavaOf(ap.point)
      const d = norm(ap.point - cuspList[b - 1])
      if (d >= 30) continue
      perBhava[b].push({
        type: 'aspect',
        label: ap.label,
        from: ap.from,
        distance: d,
        percent: aspectToBhavaPercent(d),
      })
    }
  }
  for (const list of perBhava) list.sort((a, b) => b.percent - a.percent)

  const bh = (n) => ((n - 1) % 12) + 1
  const planetsOf = (set) => set.flatMap((b) => perBhava[b]).filter((e) => e.type === 'planet')
  const aspectsOf = (n) => perBhava[n].filter((e) => e.type === 'aspect')
  const out = {}
  for (let n = 1; n <= 12; n++) {
    const set159 = [n, bh(n + 4), bh(n + 8)]
    const extra = bh(n + 6)
    const base = [...planetsOf(set159), ...aspectsOf(n)]
    const list159 = base.slice().sort((a, b) => b.percent - a.percent)
    const list1579 = [...base, ...planetsOf([extra]).filter((e) => !isNode(e.key))]
    list1579.sort((a, b) => b.percent - a.percent)
    out[n] = { list159, list1579 }
  }
  return out
}
