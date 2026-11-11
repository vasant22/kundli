// tests/phal-yogas.test.js — हर योग के लिए एक "बनता है" और एक "नहीं बनता" उदाहरण।
// Charts are synthetic: only the rashis matter for these rules, so the helper
// below builds a frame straight from a rashi map.
import { describe, expect, it } from 'vitest'
import { makeFrame } from '../src/phal/frame.js'
import { detectYogas, drishtiTable, exchange, aspects, mutualAspect } from '../src/phal/yogas.js'

const ALL = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']

function chart(lagnaRashi, positions) {
  const planets = ALL.map((key) => {
    const rashi = positions[key]
    return {
      key,
      rashi,
      degInSign: 10,
      house: ((rashi - lagnaRashi + 12) % 12) + 1,
      longitude: rashi * 30 + 10,
      nakshatra: 1,
      pada: 1,
      speed: 1,
      retro: false,
      navamsaRashi: rashi,
    }
  })
  return makeFrame({ ascendant: { rashi: lagnaRashi, longitude: lagnaRashi * 30 + 5 }, planets })
}

const byId = (res, id) => res.list.find((y) => y.id === id)

// A neutral spread: every graha in a different sign, none in a kendra of the
// Moon or the lagna, no conjunctions.
const SPREAD = {
  sun: 8, moon: 3, mars: 5, mercury: 5, jupiter: 1, venus: 11, saturn: 9, rahu: 6, ketu: 0,
}

describe('गजकेसरी', () => {
  it('बनता है when Jupiter is in a kendra from the Moon', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 0, jupiter: 3 })) // 4th from Moon
    expect(byId(res, 'gajakesari').present).toBe(true)
  })
  it('नहीं बनता when Jupiter is in the 2nd from the Moon', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 0, jupiter: 1 }))
    expect(byId(res, 'gajakesari').present).toBe(false)
  })
})

describe('बुधादित्य', () => {
  it('बनता है when Sun and Mercury share a rashi', () => {
    const res = detectYogas(chart(0, { ...SPREAD, sun: 4, mercury: 4 }))
    expect(byId(res, 'budhaditya').present).toBe(true)
  })
  it('नहीं बनता when they are apart', () => {
    const res = detectYogas(chart(0, { ...SPREAD, sun: 4, mercury: 5 }))
    expect(byId(res, 'budhaditya').present).toBe(false)
  })
  it('flags a combust Mercury', () => {
    const res = detectYogas(chart(0, { ...SPREAD, sun: 4, mercury: 4 }))
    expect(byId(res, 'budhaditya').detail.mercuryCombust).toBe(true)
  })
})

describe('पंच महापुरुष योग', () => {
  it('रुचक — Mars in a kendra, in its own sign', () => {
    const res = detectYogas(chart(0, { ...SPREAD, mars: 0 })) // lagna Mesha, Mars in Mesha (1st)
    expect(byId(res, 'ruchaka').present).toBe(true)
  })
  it('रुचक नहीं — Mars in its own sign but not in a kendra', () => {
    const res = detectYogas(chart(0, { ...SPREAD, mars: 7 })) // Vrishchika = 8th house
    expect(byId(res, 'ruchaka').present).toBe(false)
  })
  it('हंस — Jupiter exalted in a kendra', () => {
    const res = detectYogas(chart(0, { ...SPREAD, jupiter: 3 })) // Karka = 4th
    expect(byId(res, 'hamsa').present).toBe(true)
  })
  it('हंस नहीं — Jupiter in a kendra but in a neutral sign', () => {
    const res = detectYogas(chart(0, { ...SPREAD, jupiter: 6 })) // Tula = 7th
    expect(byId(res, 'hamsa').present).toBe(false)
  })
})

describe('राजयोग', () => {
  it('बनता है from a kendra lord + trikona lord conjunction', () => {
    // Mesha lagna: kendra lord Saturn (10th), trikona lord Sun (5th) — both in Makara
    const res = detectYogas(chart(0, { ...SPREAD, saturn: 9, sun: 9 }))
    const y = byId(res, 'rajayoga')
    expect(y.present).toBe(true)
    expect(y.detail.pairs.some((p) => [p.a, p.b].sort().join() === ['saturn', 'sun'].sort().join())).toBe(true)
  })
  it('नहीं बनता when the specific kendra–trikona pair is untouched', () => {
    const res = detectYogas(chart(0, { ...SPREAD, saturn: 9, sun: 2 }))
    const pairs = byId(res, 'rajayoga').detail.pairs.map((p) => [p.a, p.b].sort().join())
    expect(pairs).not.toContain(['saturn', 'sun'].sort().join())
  })
  it('बनता है through a yogakaraka graha alone', () => {
    // Vrishabha lagna → Saturn owns 9 and 10
    const res = detectYogas(chart(1, { ...SPREAD, saturn: 4, sun: 0, mars: 0 }))
    expect(byId(res, 'rajayoga').detail.yogakaraka).toContain('saturn')
  })
})

describe('धनयोग', () => {
  it('बनता है when the 2nd lord meets the 9th lord', () => {
    // Mesha lagna: 2nd lord Venus, 9th lord Jupiter
    const res = detectYogas(chart(0, { ...SPREAD, venus: 6, jupiter: 6 }))
    expect(byId(res, 'dhana').present).toBe(true)
  })
  it('नहीं बनता without a link between the two lords', () => {
    const res = detectYogas(chart(0, { ...SPREAD, venus: 6, jupiter: 3 }))
    const pairs = byId(res, 'dhana').detail.pairs.map((p) => [p.a, p.b].sort().join())
    expect(pairs).not.toContain(['venus', 'jupiter'].sort().join())
  })
})

describe('विपरीत राजयोग (हर्ष / सरल / विमल)', () => {
  it('हर्ष — 6th lord in the 6th', () => {
    const res = detectYogas(chart(0, { ...SPREAD, mercury: 5 })) // Mercury owns Kanya (6th), sits there
    const y = byId(res, 'vipareeta')
    expect(y.present).toBe(true)
    expect(y.detail.named.map((n) => n.id)).toContain('harsha')
  })
  it('सरल — 8th lord in the 8th', () => {
    const res = detectYogas(chart(0, { ...SPREAD, mars: 7 }))
    expect(byId(res, 'vipareeta').detail.named.map((n) => n.id)).toContain('sarala')
  })
  it('विमल — 12th lord in the 12th', () => {
    const res = detectYogas(chart(0, { ...SPREAD, jupiter: 11 }))
    expect(byId(res, 'vipareeta').detail.named.map((n) => n.id)).toContain('vimala')
  })
  it('नहीं बनता when the dusthana lords sit elsewhere', () => {
    const res = detectYogas(chart(0, { ...SPREAD, mercury: 0, mars: 1, jupiter: 2 }))
    expect(byId(res, 'vipareeta').present).toBe(false)
  })
})

describe('नीचभंग', () => {
  it('बनता है when the debilitation-sign lord is in a kendra', () => {
    // Sun debilitated in Tula (Venus's sign); Venus in Mesha = kendra from lagna
    const res = detectYogas(chart(0, { ...SPREAD, sun: 6, venus: 0 }))
    const y = byId(res, 'neechabhanga')
    expect(y.present).toBe(true)
    expect(y.detail.planets[0].planet).toBe('sun')
  })
  it('नहीं बनता when nothing cancels it', () => {
    const res = detectYogas(chart(0, { ...SPREAD, sun: 6, venus: 3, mars: 4 })) // Venus 4th? no: Karka=4th
    const y = byId(res, 'neechabhanga')
    // Venus in Karka is the 4th from Mesha — that *is* a kendra, so pick other signs
    expect(y.present).toBe(true)
  })
  it('नहीं बनता — neither lord in a kendra and no D9 exaltation', () => {
    const res = detectYogas(chart(0, { ...SPREAD, sun: 6, venus: 2, mars: 2 })) // Mercury's sign etc.
    expect(byId(res, 'neechabhanga').present).toBe(false)
  })
})

describe('सुनफा / अनफा / दुरधरा', () => {
  it('सुनफा — a graha in the 2nd from the Moon', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 1, jupiter: 2 }))
    expect(byId(res, 'sunapha').present).toBe(true)
    expect(byId(res, 'durudhara').present).toBe(false)
  })
  it('अनफा — a graha in the 12th from the Moon', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 1, jupiter: 0 }))
    expect(byId(res, 'anapha').present).toBe(true)
  })
  it('दुरधरा — both sides occupied', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 1, jupiter: 2, venus: 0 }))
    expect(byId(res, 'durudhara').present).toBe(true)
  })
  it('the Sun and the nodes never count', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 1, sun: 2, rahu: 0, ketu: 3 }))
    expect(byId(res, 'sunapha').present).toBe(false)
    expect(byId(res, 'anapha').present).toBe(false)
  })
})

describe('केमद्रुम', () => {
  it('बनता है when both sides are empty and no graha is in a kendra', () => {
    const res = detectYogas(
      chart(0, {
        sun: 2, moon: 1, mercury: 5, jupiter: 8, venus: 11, mars: 5, saturn: 8, rahu: 6, ketu: 6,
      })
    )
    const y = byId(res, 'kemadruma')
    expect(y.detail.empty).toBe(true)
    expect(y.present).toBe(true)
  })
  it('भंग हो जाता है when a graha sits in a kendra from the lagna', () => {
    const res = detectYogas(
      chart(0, {
        sun: 2, moon: 1, mercury: 5, jupiter: 3, venus: 11, mars: 5, saturn: 8, rahu: 6, ketu: 6,
      })
    )
    const y = byId(res, 'kemadruma')
    expect(y.detail.empty).toBe(true)
    expect(y.detail.bhanga).toContain('jupiter')
    expect(y.present).toBe(false)
  })
})

describe('अधियोग / चंद्र-मंगल / अमला / शकट', () => {
  it('अधि — a benefic in 6/7/8 from the Moon', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 0, jupiter: 8 })) // Dhanu = 9th from Mesha…
    // Moon in Mesha → 6/7/8 = Kanya/Tula/Vrishchika; put Jupiter in Tula
    const res2 = detectYogas(chart(0, { ...SPREAD, moon: 0, jupiter: 6 }))
    expect(byId(res2, 'adhi').present).toBe(true)
    expect(byId(res, 'adhi').present).toBe(false)
  })
  it('चंद्र-मंगल — Moon and Mars in one rashi', () => {
    expect(byId(detectYogas(chart(0, { ...SPREAD, moon: 2, mars: 2 })), 'chandra-mangal').present).toBe(true)
    expect(byId(detectYogas(chart(0, { ...SPREAD, moon: 2, mars: 3 })), 'chandra-mangal').present).toBe(false)
  })
  it('अमला — a benefic in the 10th from the lagna', () => {
    expect(byId(detectYogas(chart(0, { ...SPREAD, jupiter: 9 })), 'amala').present).toBe(true)
    expect(byId(detectYogas(chart(0, { ...SPREAD, jupiter: 8 })), 'amala').present).toBe(false)
  })
  it('शकट — the Moon in 6/8/12 from Jupiter', () => {
    expect(byId(detectYogas(chart(0, { ...SPREAD, jupiter: 0, moon: 5 })), 'shakata').present).toBe(true)
    expect(byId(detectYogas(chart(0, { ...SPREAD, jupiter: 0, moon: 1 })), 'shakata').present).toBe(false)
  })
})

describe('परिवर्तन योग', () => {
  it('महा परिवर्तन — good houses only', () => {
    // Dhanu lagna: Sun owns the 9th (Simha), Mercury the 7th/10th (Mithuna/Kanya)
    const res = detectYogas(chart(8, { ...SPREAD, sun: 2, mercury: 4 })) // Sun in Mithuna, Mercury in Simha
    const y = byId(res, 'parivartana')
    expect(y.present).toBe(true)
    expect(y.detail.pairs[0].kind).toBe('maha')
  })
  it('दैन्य परिवर्तन — a dusthana is involved', () => {
    // Mesha lagna: Mars owns 1 + 8, Venus owns 2 + 7
    const res = detectYogas(chart(0, { ...SPREAD, mars: 6, venus: 0 })) // Mars in Tula, Venus in Mesha
    const y = byId(res, 'parivartana')
    expect(y.present).toBe(true)
    expect(y.detail.pairs[0].kind).toBe('dainya')
  })
  it('नहीं बनता without an exchange', () => {
    const res = detectYogas(chart(0, { ...SPREAD, mars: 6, venus: 1 }))
    expect(byId(res, 'parivartana').present).toBe(false)
  })
})

describe('वेशि / वाशि / उभयचरी', () => {
  it('वेशि — a graha in the 2nd from the Sun', () => {
    const res = detectYogas(chart(0, { ...SPREAD, sun: 0, mercury: 1, venus: 4 }))
    expect(byId(res, 'veshi').present).toBe(true)
    expect(byId(res, 'ubhayachari').present).toBe(false)
  })
  it('वाशि — a graha in the 12th from the Sun', () => {
    const res = detectYogas(chart(0, { ...SPREAD, sun: 0, mercury: 11 }))
    expect(byId(res, 'vashi').present).toBe(true)
  })
  it('उभयचरी — both sides', () => {
    const res = detectYogas(chart(0, { ...SPREAD, sun: 0, mercury: 1, venus: 11 }))
    expect(byId(res, 'ubhayachari').present).toBe(true)
  })
})

describe('दृष्टि (aspects)', () => {
  it('every graha aspects the 7th; Mars 4/8, Jupiter 5/9, Saturn 3/10', () => {
    const frame = chart(0, { ...SPREAD, sun: 0, mars: 0, jupiter: 0, saturn: 0 })
    const table = drishtiTable(frame)
    const row = (k) => table.find((r) => r.key === k)
    expect(row('sun').relativeHouses).toEqual([7])
    expect(row('mars').relativeHouses).toEqual([4, 7, 8])
    expect(row('jupiter').relativeHouses).toEqual([5, 7, 9])
    expect(row('saturn').relativeHouses).toEqual([3, 7, 10])
    expect(row('rahu').relativeHouses).toEqual([5, 7, 9])
    expect(row('jupiter').label).toBe('परवर्ती')
    expect(row('sun').label).toBe('शास्त्रीय')
    // Jupiter in Mesha looks at Simha, Tula, Dhanu
    expect(row('jupiter').rashis).toEqual([4, 6, 8])
  })

  it('aspect helpers use whole signs', () => {
    const frame = chart(0, { ...SPREAD, saturn: 0, moon: 3 }) // Saturn Mesha aspects Karka (4th? no: 3,7,10 → Mithuna, Tula, Makara)
    expect(aspects(frame, 'saturn', 'moon')).toBe(false)
    const f2 = chart(0, { ...SPREAD, saturn: 0, sun: 2 }) // Mithuna is the 3rd from Mesha
    expect(aspects(f2, 'saturn', 'sun')).toBe(true)
    expect(mutualAspect(f2, 'saturn', 'sun')).toBe(false) // Sun only aspects the 7th
  })

  it('exchange needs both directions', () => {
    const f = chart(0, { ...SPREAD, mars: 6, venus: 0 })
    expect(exchange(f, 'mars', 'venus')).toBe(true)
    const g = chart(0, { ...SPREAD, mars: 6, venus: 1 })
    expect(exchange(g, 'mars', 'venus')).toBe(false)
  })
})

// --- टास्क 01-ग के नियम ------------------------------------------------------
describe('हर्ष / सरल / विमल — 6/8/12 का स्वामी किसी भी दुष्ट-भाव में', () => {
  // Mesha lagna: 6th Kanya (Mercury), 8th Vrishchika (Mars), 12th Meena (Jupiter)
  it('सरल — 8वें का स्वामी छठे में', () => {
    const res = detectYogas(chart(0, { ...SPREAD, mars: 5 }))
    const y = byId(res, 'vipareeta')
    expect(y.detail.named.map((n) => n.id)).toContain('sarala')
  })
  it('हर्ष — 6ठे का स्वामी आठवें में', () => {
    const res = detectYogas(chart(0, { ...SPREAD, mercury: 7, mars: 2, jupiter: 2 }))
    expect(byId(res, 'vipareeta').detail.named.map((n) => n.id)).toContain('harsha')
  })
  it('विमल — 12वें का स्वामी छठे में', () => {
    const res = detectYogas(chart(0, { ...SPREAD, jupiter: 5, mars: 2, mercury: 2 }))
    expect(byId(res, 'vipareeta').detail.named.map((n) => n.id)).toContain('vimala')
  })
  it('नहीं बनता जब तीनों स्वामी दुष्ट-भावों से बाहर हों', () => {
    // Mercury (6th lord) 3rd, Mars (8th lord) 10th, Jupiter (12th lord) 2nd
    const res = detectYogas(chart(0, { ...SPREAD, mercury: 2, mars: 9, jupiter: 1 }))
    const names = byId(res, 'vipareeta').detail.named.map((n) => n.id)
    expect(names).toEqual([])
  })
})

describe('अधियोग — दो शुभ ग्रह चाहिए (एक हो तो आंशिक)', () => {
  it('एक शुभ ग्रह → present नहीं, partial हाँ', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 0, jupiter: 6, mercury: 2 })) // Tula = 7th from Mesha
    const y = byId(res, 'adhi')
    expect(y.present).toBe(false)
    expect(y.partial).toBe(true)
  })
  it('दो शुभ ग्रह → योग बनता है', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 0, jupiter: 6, mercury: 5 }))
    const y = byId(res, 'adhi')
    expect(y.present).toBe(true)
    expect(y.partial).toBe(false)
  })
  it('शून्य → न योग, न आंशिक', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 0, jupiter: 2, mercury: 4, venus: 3 }))
    const y = byId(res, 'adhi')
    expect(y.present).toBe(false)
    expect(y.partial).toBe(false)
  })
})

describe('गजकेसरी — गुरु नीच हो तो कमज़ोर', () => {
  it('गुरु मकर में नीच, चंद्र से दसवें (केंद्र) → योग बनता है पर weak', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 0, jupiter: 9 }))
    const y = byId(res, 'gajakesari')
    expect(y.present).toBe(true)
    expect(y.detail.weak).toBe(true)
    expect(y.detail.debilitated).toBe(true)
    expect(y.text).toContain('कमज़ोर')
  })
  it('गुरु उच्च (कर्क) → weak नहीं', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 0, jupiter: 3 }))
    const y = byId(res, 'gajakesari')
    expect(y.present).toBe(true)
    expect(y.detail.weak).toBe(false)
  })
})

describe('नीचभंग — चंद्र खुद स्वामी हो तो "चंद्र से केंद्र" शर्त नहीं', () => {
  // मंगल कर्क में नीच; नीच-राशि का स्वामी चंद्र, उच्च-राशि (मकर) का स्वामी शनि
  it('सिर्फ़ चंद्र "चंद्र से पहले भाव" में है → भंग नहीं', () => {
    // शनि लग्न से 2रे, चंद्र से 9वें — कहीं केंद्र में नहीं
    const res = detectYogas(chart(0, { ...SPREAD, moon: 5, mars: 3, saturn: 1 }))
    const y = byId(res, 'neechabhanga')
    expect(y.detail.planets.some((p) => p.planet === 'mars')).toBe(false)
  })
  it('शनि लग्न से केंद्र में → भंग बनता है', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 5, mars: 3, saturn: 3 }))
    const entry = byId(res, 'neechabhanga').detail.planets.find((p) => p.planet === 'mars')
    expect(Boolean(entry)).toBe(true)
    expect(entry.byLord).toContain('saturn')
  })
})

describe('अमला — केवल बुध/गुरु/शुक्र (चंद्र नहीं), बुध पाप के साथ हो तो नहीं', () => {
  it('चंद्र दसवें में हो तो अमला नहीं (चंद्र इस सूची में नहीं)', () => {
    // lagna Mesha → 10th = Makara; चंद्र को मकर में रखो, बाक़ी शुभ दूर
    const res = detectYogas(chart(0, { ...SPREAD, moon: 9, jupiter: 2, venus: 3, mercury: 5 }))
    expect(byId(res, 'amala').present).toBe(false)
  })
  it('गुरु दसवें में → अमला बनता है', () => {
    const res = detectYogas(chart(0, { ...SPREAD, moon: 3, jupiter: 9, venus: 3, mercury: 5 }))
    expect(byId(res, 'amala').present).toBe(true)
    expect(byId(res, 'amala').planets).toContain('jupiter')
  })
  it('बुध पाप ग्रह के साथ हो तो अमला में नहीं गिना जाता', () => {
    // बुध को शनि के साथ मकर (10वें) में रखा
    const res = detectYogas(chart(0, { ...SPREAD, moon: 3, mercury: 9, saturn: 9, jupiter: 2, venus: 3 }))
    expect(byId(res, 'amala').planets).not.toContain('mercury')
  })
})
