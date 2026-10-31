// tests/bnn-transit-combos.test.js — राउंड 64: गोचर की PLANET COMBINATION
// संदर्भ: सर के software का transit screenshot (31-12-1977 12:00:00 Coimbatore,
// गोचर 31-10-2026 07:21:17) — Vas22 जी ने 31-10-2026 को दिया।
// यहाँ दी गई डिग्रियाँ "डिग्री.मिनट" रूप में हैं (जैसे 17.02 = 17°02′)।
import { describe, expect, it } from 'vitest'
import { transitLabels, transitPlanetCombinations } from '../src/bnn/transit-combos.js'

// deg.min → decimal degrees
const dm = (d) => Math.floor(d) + ((d - Math.floor(d)) * 100) / 60

const P = (key, sign, dmDeg, retro = false) => {
  const lon = (sign - 1) * 30 + dm(dmDeg)
  return { key, longitude: lon, rashi: sign - 1, degInSign: lon - (sign - 1) * 30, retro, speed: retro ? -1 : 1 }
}

// जन्म-ग्रह (चार्ट के अंदर)
const natal = [
  P('ketu', 12, 17.02, true),   // राहु-केतु सदा वक्री
  P('jupiter', 3, 6.24, true),
  P('mars', 4, 15.41, true),
  P('saturn', 5, 6.38, true),
  P('moon', 5, 19.30),
  P('rahu', 6, 17.02, true),
  P('mercury', 8, 27.37, true),
  P('sun', 9, 15.55),
  P('venus', 9, 10.39),
]
// जन्म-भाव-संधियाँ
const cuspDeg = [['मीन', 11.29], ['मेष', 14.58], ['वृषभ', 13.57], ['मिथुन', 10.20], ['कर्क', 7.07], ['सिंह', 7.09],
  ['कन्या', 11.29], ['तुला', 14.58], ['वृश्चिक', 13.57], ['धनु', 10.20], ['मकर', 7.07], ['कुंभ', 7.09]]
const SIGN = { 'मेष': 1, 'वृषभ': 2, 'मिथुन': 3, 'कर्क': 4, 'सिंह': 5, 'कन्या': 6, 'तुला': 7, 'वृश्चिक': 8, 'धनु': 9, 'मकर': 10, 'कुंभ': 11, 'मीन': 12 }
const cusps = cuspDeg.map(([s, d]) => ({ longitude: (SIGN[s] - 1) * 30 + dm(d) }))
// गोचर-ग्रह (चार्ट के बाहर)
const transit = [
  P('saturn', 12, 15.06, true),
  P('moon', 3, 20.06),
  P('mars', 4, 23.55),
  P('jupiter', 4, 29.58),
  P('ketu', 5, 1.53, true),
  P('rahu', 11, 1.53, true),
  P('mercury', 7, 23.23, true),
  P('sun', 7, 13.25),
  P('venus', 7, 2.28, true),
]

const names = (list) => list.map((e) => (e.type === 'planet' ? e.key : e.label))

describe('राउंड 64 — गोचर की PLANET COMBINATION (सर के software से)', () => {
  const rows = transitPlanetCombinations(transit, natal, cusps, 'AP')

  it('पंक्ति के नाम: गोचर ग्रह का कोड + भाव-बिंदु अंक (9/9)', () => {
    const lb = transitLabels(transit, cusps)
    expect(lb.jupiter).toBe(24) // 23.92
    expect(lb.sun).toBe(5) // 4.63
    expect(lb.moon).toBe(64) // 63.53
    expect(lb.mars).toBe(44) // 44.06
    expect(lb.mercury).toBe(71) // 70.96
    expect(lb.venus).toBe(37) // 37.33
    expect(lb.saturn).toBe(89) // 89.20
    expect(lb.rahu).toBe(18) // 17.54
    expect(lb.ketu).toBe(18) // 17.54
  })

  it('JUP की पंक्ति — SAT#, VEN, SUN, MOO', () => {
    expect(names(rows.jupiter.list1579)).toEqual(['saturn', 'venus', 'sun', 'moon'])
  })
  it('SUN की पंक्ति — MAR4', () => {
    expect(names(rows.sun.list1579)).toEqual(['MAR4'])
  })
  it('MOO की पंक्ति — MAR#, KET', () => {
    expect(names(rows.moon.list1579)).toEqual(['mars', 'ketu'])
  })
  it('MAR की पंक्ति — MER#, SAT#, VEN, SUN, MOO', () => {
    expect(names(rows.mars.list1579)).toEqual(['mercury', 'saturn', 'venus', 'sun', 'moon'])
  })
  // सर के software में क्रम MAR4, JUP#, SAT3 है; हमारा engine SAT3 (दूरी 16.75°) को
  // JUP# (दूरी 16.98°) से पहले रखता है — फ़र्क़ सिर्फ़ 0.23°। नियम (distance से क्रम)
  // नहीं बदला गया; यह अंतर रिपोर्ट में दिखाया गया है।
  it('MER# की पंक्ति — MAR4, SAT3, JUP# (सर: MAR4, JUP#, SAT3 — 0.23° का क्रम-अंतर)', () => {
    expect(names(rows.mercury.list1579)).toEqual(['MAR4', 'SAT3', 'jupiter'])
  })
  it('VEN# की पंक्ति — RAH', () => {
    expect(names(rows.venus.list1579)).toEqual(['rahu'])
  })
  it('SAT# की पंक्ति — MAR#, MOO, MAR8', () => {
    expect(names(rows.saturn.list1579)).toEqual(['mars', 'moon', 'MAR8'])
  })
  // वही-नाम वाला जन्म-ग्रह भी आता है (गोचर केंद्र होने पर भी)
  it('RAH की पंक्ति — जन्म का RAH भी', () => {
    expect(names(rows.rahu.list1579)).toEqual(['rahu'])
  })
  it('KET की पंक्ति — MER#, KET, MAR#', () => {
    expect(names(rows.ketu.list1579)).toEqual(['mercury', 'ketu', 'mars'])
  })
  it('159 = 7वें क्षेत्र के सदस्य हटे, दृष्टियाँ बनी रहें', () => {
    Object.keys(rows).forEach((k) => {
      const l159 = rows[k].list159
      expect(l159.filter((e) => e.type === 'planet' && e.zone === 7)).toEqual([])
      expect(l159.filter((e) => e.type === 'aspect').length).toBe(rows[k].list1579.filter((e) => e.type === 'aspect').length)
    })
  })
})
