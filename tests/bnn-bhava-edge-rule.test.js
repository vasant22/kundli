// tests/bnn-bhava-edge-rule.test.js — राउंड 64 / सुधार-3 भाग 5 (31-10-2026)
// भाव-सीमा का नियम अब BNN का सामान्य नियम है (`COMBO_SETTINGS.bhavaEdgeRule`):
// जिस ग्रह का भाव-प्रतिशत (0.942 वाला) ऋणात्मक हो, वह BHAVA तालिका में अगले भाव में —
// प्रतिशत = 100 × (1 − |d|/(0.942 × W_पुराना)), |d| = अगली संधि तक की दूरी।
// सर के software की Natal BHAVA (Coimbatore 31-12-1977 12:00) से 12/12 पक्का।
// SPECIAL और PLANET तालिकाओं पर यह नियम नहीं लगता — नीचे उसकी भी जाँच है।
import { describe, expect, it } from 'vitest'
import { COMBO_SETTINGS, bhavaCombinations, planetCombinations } from '../src/bnn/combos.js'
import { specialTables } from '../src/bnn/special.js'

const dm = (d) => Math.floor(d) + ((d - Math.floor(d)) * 100) / 60
const P = (key, sign, deg, retro = false) => {
  const lon = (sign - 1) * 30 + dm(deg)
  return { key, longitude: lon, rashi: sign - 1, degInSign: lon - (sign - 1) * 30, retro, speed: retro ? -1 : 1 }
}
const S = { मेष: 1, वृषभ: 2, मिथुन: 3, कर्क: 4, सिंह: 5, कन्या: 6, तुला: 7, वृश्चिक: 8, धनु: 9, मकर: 10, कुंभ: 11, मीन: 12 }
const natal = [
  P('ketu', 12, 17.02, true), P('jupiter', 3, 6.24, true), P('mars', 4, 15.41, true),
  P('saturn', 5, 6.38, true), P('moon', 5, 19.30), P('rahu', 6, 17.02, true),
  P('mercury', 8, 27.37, true), P('sun', 9, 15.55), P('venus', 9, 10.39),
]
const cuspDeg = [['मीन', 11.29], ['मेष', 14.58], ['वृषभ', 13.57], ['मिथुन', 10.20], ['कर्क', 7.07], ['सिंह', 7.09],
  ['कन्या', 11.29], ['तुला', 14.58], ['वृश्चिक', 13.57], ['धनु', 10.20], ['मकर', 7.07], ['कुंभ', 7.09]]
const cusps = cuspDeg.map(([s, d]) => ({ longitude: (S[s] - 1) * 30 + dm(d) }))
const SH = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' }
const names = (list) => list.map((e) => (e.type === 'aspect' ? e.label : SH[e.key] + (e.natalRetro && e.key !== 'rahu' && e.key !== 'ketu' ? '#' : '')))

describe('राउंड 64 — भाव-सीमा का नियम (Natal BHAVA, सर के software से)', () => {
  it('COMBO_SETTINGS.bhavaEdgeRule चालू है', () => {
    expect(COMBO_SETTINGS.bhavaEdgeRule).toBe(true)
  })

  const rows = bhavaCombinations(natal, cusps, 'AP')
  const EXPECT = {
    1: ['KET', 'MAR#', 'MER#'],
    2: ['VEN', 'SAT#', 'SUN', 'MOO', 'SAT10'],
    3: ['RAH', 'JUP#'],
    4: [],
    5: ['KET', 'MAR#', 'MER#'],
    6: ['VEN', 'SAT#', 'SUN', 'MOO'],
    7: ['RAH', 'SAT3', 'JUP#'],
    8: ['MAR4'],
    9: ['KET', 'MAR#', 'MER#'],
    10: ['VEN', 'SAT#', 'SUN', 'MOO'],
    11: ['RAH', 'JUP#'],
    12: ['MAR8'],
  }
  for (let n = 1; n <= 12; n++) {
    it('B' + String(n).padStart(2, '0') + ' — ' + (EXPECT[n].join(' · ') || 'ख़ाली'), () => {
      expect(names(rows[n].list159)).toEqual(EXPECT[n])
    })
  }

  it('शनि# भाव 6 में, VEN के बाद — प्रतिशत 98.2 (|d| 0.52° / W5 30.03°)', () => {
    const ven = rows[6].list159.find((e) => e.key === 'venus')
    const sat = rows[6].list159.find((e) => e.key === 'saturn')
    expect(ven.percent).toBeGreaterThan(sat.percent)
    expect(Math.abs(sat.percent - 98.2)).toBeLessThan(0.4)
    expect(sat.distance).toBeCloseTo(0.52, 1)
  })

  it('SPECIAL तालिका अब भी शनि को भाव 5 में दिखाती है (नियम वहाँ नहीं — सर से मिलान बाक़ी)', () => {
    const sp = specialTables(natal, cusps, 'AP')
    expect(sp.rows.saturn.sitsAt).toBe(5)
  })

  it('PLANET तालिका भी नहीं बदली: गुरु# की पंक्ति में SAT10 अब भी (29.77° पीछे)', () => {
    const pc = planetCombinations(natal, 'AP', { cusps })
    const labels = pc.jupiter.list1579.map((e) => (e.type === 'aspect' ? e.label : SH[e.key]))
    expect(labels).toContain('SAT10')
  })
})
