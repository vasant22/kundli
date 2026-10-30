// tests/bnn-vishesh-drishti.test.js — मंगल-शनि की विशेष दृष्टि (राउंड 61)
// नियम-पुस्तिका: अध्याय-12 (नियम 2–11), अध्याय-07 (नियम 9, 13), अध्याय-32 (नियम 39, 42)
import { describe, expect, it } from 'vitest'
import { aspectPoints, planetCombinations, COMBO_SETTINGS } from '../src/bnn/combos.js'
import { transitSpecialAspects } from '../src/bnn/transit.js'

const P = (key, lon, retro = false) => ({
  key, longitude: lon, rashi: Math.floor(lon / 30) % 12, degInSign: lon % 30, retro,
})
const labels = (list) => list.filter((e) => e.type === 'aspect').map((e) => e.label)

describe('विशेष दृष्टि — बिंदु (अध्याय-12 नियम 2, 5)', () => {
  it('शनि वृश्चिक 4° (214°): SAT3 = मकर 4° (274°), SAT10 = सिंह 4° (124°)', () => {
    const pts = aspectPoints({ key: 'saturn', lon: 214 })
    expect(pts.map((p) => [p.label, Math.round(p.point * 100) / 100])).toEqual([
      ['SAT3', 274], ['SAT10', 124],
    ])
  })
  it('मंगल 20°: MAR4 = +90°, MAR8 = +210°', () => {
    const pts = aspectPoints({ key: 'mars', lon: 50 })
    expect(pts.map((p) => [p.label, p.point])).toEqual([['MAR4', 140], ['MAR8', 260]])
  })
  it('वक्री शनि पर भी बिंदु वही (दिशा सदा सीधी — अध्याय-07 नियम 9)', () => {
    const a = aspectPoints({ key: 'saturn', lon: 214, retro: false })
    const b = aspectPoints({ key: 'saturn', lon: 214, retro: true })
    expect(b).toEqual(a)
  })
})

describe('विशेष दृष्टि — क्षेत्र [बिंदु − 30°, बिंदु + 2°]', () => {
  const seats = (moonLon, jupLon, extra = []) => {
    const planets = [
      P('saturn', 214), // SAT3 बिंदु 274°, क्षेत्र 244–276
      P('moon', moonLon), P('jupiter', jupLon), ...extra,
    ]
    return planetCombinations(planets, 'AP')
  }
  it('चंद्र धनु 28° (268°) — क्षेत्र में, SAT3 मिले', () => {
    expect(labels(seats(268, 250).moon.list1579)).toContain('SAT3')
  })
  it('गुरु धनु 10° (250°) — क्षेत्र में, SAT3 मिले', () => {
    expect(labels(seats(268, 250).jupiter.list1579)).toContain('SAT3')
  })
  it('केतु धनु 3° (243°) — सीमा से बाहर (4° से कम)', () => {
    const r = seats(268, 250, [P('ketu', 243)])
    expect(labels(r.ketu.list1579)).not.toContain('SAT3')
  })
  it('सूर्य मकर 7° (277°) — छूट से आगे, बाहर', () => {
    const r = seats(268, 250, [P('sun', 277)])
    expect(labels(r.sun.list1579)).not.toContain('SAT3')
  })
  it('सीमा ठीक +1° (275°) — शामिल (राउंड 62: सर के software में 1°)', () => {
    const r = seats(268, 250, [P('sun', 275)])
    expect(labels(r.sun.list1579)).toContain('SAT3')
  })
  it('छूट config से आती है (hard-code नहीं) — राउंड 62 में 1°', () => {
    expect(COMBO_SETTINGS.aspectForwardDeg).toBe(1)
  })
})

describe('विशेष दृष्टि — एक-तरफ़ा (अध्याय-12 नियम 4, 8)', () => {
  it('चंद्र के संयोजन में SAT3, पर शनि के संयोजन में चंद्र दृष्टि से नहीं', () => {
    const planets = [P('saturn', 214), P('moon', 268), P('jupiter', 250)]
    const r = planetCombinations(planets, 'AP')
    expect(labels(r.moon.list1579)).toContain('SAT3')
    const satMoons = r.saturn.list1579.filter((e) => e.type === 'planet' && e.key === 'moon')
    // चंद्र शनि से 54° आगे = 2रा भाव — 1-5-7-9 में नहीं, इसलिए किसी भी हालत में नहीं
    expect(satMoons.length).toBe(0)
  })
})

describe('गोचर की विशेष दृष्टि (अध्याय-32 नियम 39)', () => {
  it('गोचर शनि से नेटल चंद्र पर SAT3', () => {
    const t = [P('saturn', 214)]
    const natal = [{ key: 'moon', longitude: 268 }]
    const out = transitSpecialAspects(t, natal)
    expect(out).toEqual([{ natalKey: 'moon', label: 'SAT3', from: 'saturn', distance: 6 }])
  })
  it('गोचर मंगल से नेटल सूर्य पर MAR4 (क्षेत्र में)', () => {
    const t = [P('mars', 50)] // MAR4 बिंदु 140, क्षेत्र 110–142
    const natal = [{ key: 'sun', longitude: 120 }]
    const out = transitSpecialAspects(t, natal)
    expect(out.some((x) => x.label === 'MAR4' && x.natalKey === 'sun')).toBe(true)
  })
})
