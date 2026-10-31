// tests/bnn-special-coimbatore.test.js — राउंड 64 चरण 1 (31-10-2026)
// सर के software की Coimbatore (31-12-1977 12:00, AP) SPECIAL तालिकाएँ।
// भाव SPECIAL 12/12 हूबहू; ग्रह SPECIAL में सिर्फ़ शुक्र का "देता" अलग है (नीचे KNOWN)।
import { describe, expect, it } from 'vitest'
import { specialTables } from '../src/bnn/special.js'

const dm = (d) => Math.floor(d) + ((d - Math.floor(d)) * 100) / 60
const P = (key, sign, deg, retro = false) => {
  const lon = (sign - 1) * 30 + dm(deg)
  return { key, longitude: lon, rashi: sign - 1, degInSign: lon - (sign - 1) * 30, retro, speed: retro ? -1 : 1 }
}
const S = { मेष: 1, वृषभ: 2, मिथुन: 3, कर्क: 4, सिंह: 5, कन्या: 6, तुला: 7, वृश्चिक: 8, धनु: 9, मकर: 10, कुंभ: 11, मीन: 12 }
// ग्रह engine के क्रम में (सूर्य → केतु) — इसी क्रम से SPECIAL की सूचियाँ बनती हैं
const natal = [
  P('sun', 9, 15.55), P('moon', 5, 19.30), P('mars', 4, 15.41, true), P('mercury', 8, 27.37, true),
  P('jupiter', 3, 6.24, true), P('venus', 9, 10.39), P('saturn', 5, 6.38, true),
  P('rahu', 6, 17.02, true), P('ketu', 12, 17.02, true),
]
const cuspDeg = [['मीन', 11.29], ['मेष', 14.58], ['वृषभ', 13.57], ['मिथुन', 10.20], ['कर्क', 7.07], ['सिंह', 7.09],
  ['कन्या', 11.29], ['तुला', 14.58], ['वृश्चिक', 13.57], ['धनु', 10.20], ['मकर', 7.07], ['कुंभ', 7.09]]
const cusps = cuspDeg.map(([s, d]) => ({ longitude: (S[s] - 1) * 30 + dm(d) }))
const sp = specialTables(natal, cusps, 'AP')

describe('SPECIAL — भाव (सर के software से, 12/12)', () => {
  const EXP = {
    1: ['jupiter', ['ketu'], ['venus', 'saturn'], 'ketu'],
    2: ['mars', [], ['jupiter'], 'mars'],
    3: ['venus', ['jupiter'], [], 'venus'],
    4: ['mercury', [], ['mercury', 'ketu'], 'mercury'],
    5: ['moon', ['mars', 'saturn'], ['mars', 'jupiter'], 'mars'],
    6: ['sun', ['moon'], ['rahu'], 'moon'],
    7: ['mercury', ['rahu'], [], 'rahu'],
    8: ['venus', [], ['sun', 'moon'], 'venus'],
    9: ['mars', ['mercury'], ['mercury', 'ketu'], 'mercury'],
    10: ['jupiter', ['venus', 'sun'], ['sun', 'moon'], 'venus'],
    11: ['saturn', [], ['mars'], 'saturn'],
    12: ['saturn', [], ['mars'], 'saturn'],
  }
  for (let n = 1; n <= 12; n++) {
    it('B' + String(n).padStart(2, '0') + ' — LORD/PLANETS(A)/IN STAR OF A/फलदाता', () => {
      const e = EXP[n]
      expect(sp.lords[n]).toBe(e[0])
      expect((sp.inBhava[n] || []).map((x) => x.key)).toEqual(e[1])
      expect(sp.inStarOf[n] || []).toEqual(e[2])
      expect(sp.directors[n]).toBe(e[3])
    })
  }
})

describe('SPECIAL — ग्रह (सर के software से)', () => {
  const EXP = {
    jupiter: [[1, 10], 3, 'mars', 5, [2, 5]],
    sun: [[6], 10, 'venus', 10, [3, 8, 10]],
    moon: [[5], 6, 'venus', 10, [3, 8, 10]],
    mars: [[2, 9], 5, 'saturn', 5, [11, 12]],
    mercury: [[4, 7], 9, 'mercury', 9, [4, 9]],
    venus: [[3, 8], 10, 'ketu', 1, [1]],
    saturn: [[11, 12], 5, 'ketu', 1, [1]],
    rahu: [[], 7, 'moon', 6, [6]],
    ketu: [[], 1, 'mercury', 9, [4, 9]],
  }
  Object.keys(EXP).forEach((k) => {
    it(k + ' — स्वामी · बैठा · तारा · फलदाता', () => {
      const r = sp.rows[k]
      const e = EXP[k]
      expect(r.owns || []).toEqual(e[0])
      expect(r.sitsAt).toBe(e[1])
      expect(r.starLord).toBe(e[2])
      expect(r.starAt).toBe(e[3])
      expect(r.starGives || []).toEqual(e[4])
    })
  })
  it('शुक्र का "देता" — हमारा 3,8,10 (सर: 3,8) — गणना नहीं बदली, सर से पूछना बाक़ी', () => {
    expect(sp.rows.venus.gives).toEqual([3, 8, 10])
  })
  it.todo('शुक्र का देता: सर 3,8 — भाव 10 (जहाँ शुक्र बैठा है) हमारे में भी जुड़ता है; नियम सर से पूछना')
})
