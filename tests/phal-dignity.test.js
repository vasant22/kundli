// tests/phal-dignity.test.js — ग्रह-स्थिति: उच्च/नीच/मूलत्रिकोण/पंचधा मैत्री,
// अस्त, दिग्बल, वर्गोत्तम और कार्येश स्वभाव (योगकारक/मारक)।
import { describe, expect, it } from 'vitest'
import {
  DIGNITY_LABELS,
  NATURAL_FRIENDS,
  DIGBALA_HOUSE,
  MOOLATRIKONA,
  EXALTATION,
  DEBILITATION,
  combustionOf,
  dignityIn,
  dignitySummary,
  isVargottama,
  karakaNature,
  naturalRelation,
  panchadha,
  planetPositions,
  temporaryRelation,
} from '../src/phal/dignity.js'
import { makeFrame } from '../src/phal/frame.js'

// A rashi map for panchadha: only the two grahas that matter.
const map = (a, ra, b, rb) => ({ [a]: ra, [b]: rb })

describe('exaltation and debilitation', () => {
  it('every classical exaltation sign, and its opposite for debilitation', () => {
    expect(EXALTATION.sun.rashi).toBe(0) // Mesha
    expect(EXALTATION.moon.rashi).toBe(1) // Vrishabha
    expect(EXALTATION.mars.rashi).toBe(9) // Makara
    expect(EXALTATION.mercury.rashi).toBe(5) // Kanya
    expect(EXALTATION.jupiter.rashi).toBe(3) // Karka
    expect(EXALTATION.venus.rashi).toBe(11) // Meena
    expect(EXALTATION.saturn.rashi).toBe(6) // Tula
    expect(DEBILITATION.sun.rashi).toBe(6)
    expect(DEBILITATION.moon.rashi).toBe(7)
    expect(DEBILITATION.saturn.rashi).toBe(0)
  })

  it('labels a graha as उच्च / नीच by sign, not by degree', () => {
    expect(dignityIn('sun', 0, 0.1, { sun: 0 }).level).toBe('exalted')
    expect(dignityIn('sun', 0, 29.9, { sun: 0 }).level).toBe('exalted')
    expect(dignityIn('sun', 6, 15, { sun: 6 }).level).toBe('debilitated')
    expect(dignityIn('saturn', 6, 20, { saturn: 6 }).level).toBe('exalted')
    expect(dignityIn('saturn', 0, 10, { saturn: 0 }).level).toBe('debilitated')
  })
})

describe('moolatrikona — the exaltation sign is split', () => {
  it('Moon: 0–4 Vrishabha उच्च, 4–30 मूलत्रिकोण', () => {
    expect(dignityIn('moon', 1, 3.9, { moon: 1 }).level).toBe('exalted')
    expect(dignityIn('moon', 1, 4.0, { moon: 1 }).level).toBe('moolatrikona')
    expect(dignityIn('moon', 1, 29.9, { moon: 1 }).level).toBe('moolatrikona')
  })

  it('Mercury: Kanya 16–20 मूलत्रिकोण, बाकी Kanya उच्च', () => {
    expect(dignityIn('mercury', 5, 15.9, { mercury: 5 }).level).toBe('exalted')
    expect(dignityIn('mercury', 5, 16, { mercury: 5 }).level).toBe('moolatrikona')
    expect(dignityIn('mercury', 5, 19.99, { mercury: 5 }).level).toBe('moolatrikona')
    expect(dignityIn('mercury', 5, 20, { mercury: 5 }).level).toBe('exalted')
  })

  it('the other moolatrikona ranges', () => {
    expect(MOOLATRIKONA.sun).toEqual({ rashi: 4, from: 0, to: 20 })
    expect(dignityIn('sun', 4, 10, { sun: 4 }).level).toBe('moolatrikona')
    expect(dignityIn('sun', 4, 25, { sun: 4 }).level).toBe('own')
    expect(dignityIn('mars', 0, 11.9, { mars: 0 }).level).toBe('moolatrikona')
    expect(dignityIn('mars', 0, 12.1, { mars: 0 }).level).toBe('own')
    expect(dignityIn('jupiter', 8, 5, { jupiter: 8 }).level).toBe('moolatrikona')
    expect(dignityIn('jupiter', 8, 15, { jupiter: 8 }).level).toBe('own')
    expect(dignityIn('venus', 6, 14.9, { venus: 6 }).level).toBe('moolatrikona')
    expect(dignityIn('venus', 6, 15.1, { venus: 6 }).level).toBe('own')
    expect(dignityIn('saturn', 10, 19.9, { saturn: 10 }).level).toBe('moolatrikona')
    expect(dignityIn('saturn', 10, 20.1, { saturn: 10 }).level).toBe('own')
  })

  it('giving results in शुभ labels', () => {
    const d = dignityIn('jupiter', 3, 5, { jupiter: 3 })
    expect(d.hi).toBe(DIGNITY_LABELS.exalted.hi)
    expect(d.en).toBe('Exalted')
  })
})

describe('पंचधा मैत्री (five-fold friendship)', () => {
  it('natural relations follow BPHS ch.3', () => {
    expect(naturalRelation('sun', 'moon')).toBe('friend')
    expect(naturalRelation('sun', 'venus')).toBe('enemy')
    expect(naturalRelation('moon', 'mars')).toBe('neutral')
    expect(naturalRelation('mercury', 'moon')).toBe('enemy')
    expect(naturalRelation('saturn', 'jupiter')).toBe('neutral')
  })

  it('temporary friendship: 2,3,4,10,11,12 from a graha are friends', () => {
    expect(temporaryRelation(0, 1)).toBe('friend') // 2nd
    expect(temporaryRelation(0, 3)).toBe('friend') // 4th
    expect(temporaryRelation(0, 9)).toBe('friend') // 10th
    expect(temporaryRelation(0, 4)).toBe('enemy') // 5th
    expect(temporaryRelation(0, 6)).toBe('enemy') // 7th
    expect(temporaryRelation(0, 8)).toBe('enemy') // 9th
  })

  // BPHS अ.3 की पूरी छह-कोठरी तालिका (टास्क 01-घ का truth-table test).
  it('छहों संयोजन — पूरी पंचधा तालिका', () => {
    const CASES = [
      // [from, to, to-rashi, नैसर्गिक, तात्कालिक, अपेक्षित]
      ['sun', 'jupiter', 1, 'friend', 'friend', 'adhimitra'],
      ['sun', 'jupiter', 6, 'friend', 'enemy', 'sama'],
      ['moon', 'jupiter', 1, 'neutral', 'friend', 'mitra'],
      ['moon', 'jupiter', 6, 'neutral', 'enemy', 'shatru'],
      ['sun', 'venus', 1, 'enemy', 'friend', 'sama'], // ← टास्क 01-घ का सुधार
      ['sun', 'venus', 6, 'enemy', 'enemy', 'adhishatru'],
    ]
    for (const [from, to, rTo, nat, tmp, want] of CASES) {
      expect(naturalRelation(from, to), `${from}→${to} natural`).toBe(nat)
      expect(temporaryRelation(0, rTo), `${from}→${to} temporary`).toBe(tmp)
      expect(panchadha(from, to, map(from, 0, to, rTo)), `${from}→${to} (${nat}+${tmp})`).toBe(want)
    }
    // एक भी ग़लत कोठरी न बचे — तीनों नैसर्गिक × दोनों तात्कालिक
    expect(CASES.length).toBe(6)
  })

  it('नैसर्गिक शत्रु + तात्कालिक मित्र = सम (पहले ग़लती से शत्रु आता था)', () => {
    expect(panchadha('sun', 'venus', map('sun', 0, 'venus', 1))).toBe('sama')
    expect(panchadha('mars', 'mercury', map('mars', 0, 'mercury', 1))).toBe('sama')
  })

  it('a graha in its own sign is स्वराशि, not a friendship band', () => {
    expect(panchadha('mars', 'mars', map('mars', 0, 'mars', 0))).toBe('own')
    expect(dignityIn('mars', 7, 10, { mars: 7 }).level).toBe('own')
  })
})

describe('राहु/केतु — BPHS में मैत्री-तालिका नहीं (टास्क 01-घ)', () => {
  it('NATURAL_FRIENDS में राहु/केतु नहीं हैं', () => {
    expect(NATURAL_FRIENDS.rahu).toBeUndefined()
    expect(NATURAL_FRIENDS.ketu).toBeUndefined()
    expect(naturalRelation('rahu', 'mars')).toBe('none')
  })

  it('राहु-केतु की स्थिति सिर्फ़ उच्च/नीच, बाक़ी "—"', () => {
    expect(dignityIn('rahu', 1, 10, { rahu: 1 }).level).toBe('exalted') // वृषभ
    expect(dignityIn('rahu', 7, 10, { rahu: 7 }).level).toBe('debilitated') // वृश्चिक
    expect(dignityIn('ketu', 7, 10, { ketu: 7 }).level).toBe('exalted')
    expect(dignityIn('ketu', 1, 10, { ketu: 1 }).level).toBe('debilitated')
    const none = dignityIn('rahu', 4, 10, { rahu: 4 }) // सिंह
    expect(none.level).toBe('none')
    expect(none.hi).toBe('—')
    expect(panchadha('rahu', 'sun', { rahu: 4, sun: 0 })).toBe('none')
  })

  it('dignitySummary में नोड्स पर सिर्फ़ दूसरी बातें दिखें, "—" नहीं', () => {
    const pos = { dignity: { level: 'none', hi: '—' }, retro: true, combustion: { combust: false }, vargottama: false, digbala: false }
    expect(dignitySummary('rahu', pos)).toBe('वक्री')
  })
})

describe('अस्त (combustion)', () => {
  it('uses the classical orbs, tighter for retrograde Mercury/Venus', () => {
    expect(combustionOf('mercury', 0, 10, false).combust).toBe(true)
    expect(combustionOf('mercury', 0, 13.9, false).combust).toBe(true)
    expect(combustionOf('mercury', 0, 14.1, false).combust).toBe(false)
    expect(combustionOf('mercury', 0, 13, true).combust).toBe(false) // retro orb 12
    expect(combustionOf('venus', 0, 9, false).combust).toBe(true) // orb 10
    expect(combustionOf('venus', 0, 9, true).combust).toBe(false) // retro orb 8
    expect(combustionOf('moon', 0, 5, false).combust).toBe(true) // orb 12
    expect(combustionOf('jupiter', 0, 180, false).combust).toBe(false) // separation wraps to 180
    expect(combustionOf('jupiter', 0, 350, false).combust).toBe(true) // 10° behind the Sun
  })

  it('the Sun itself is never combust', () => {
    expect(combustionOf('sun', 100, 100, false).combust).toBe(false)
  })
})

describe('दिग्बल and वर्गोत्तम', () => {
  it('digbala houses', () => {
    expect(DIGBALA_HOUSE.jupiter).toBe(1)
    expect(DIGBALA_HOUSE.mercury).toBe(1)
    expect(DIGBALA_HOUSE.sun).toBe(10)
    expect(DIGBALA_HOUSE.mars).toBe(10)
    expect(DIGBALA_HOUSE.saturn).toBe(7)
    expect(DIGBALA_HOUSE.moon).toBe(4)
    expect(DIGBALA_HOUSE.venus).toBe(4)
  })

  it('vargottama = same rashi in D1 and D9', () => {
    expect(isVargottama({ rashi: 3, navamsaRashi: 3 })).toBe(true)
    expect(isVargottama({ rashi: 3, navamsaRashi: 4 })).toBe(false)
  })
})

// --- functional nature ------------------------------------------------------
// Synthetic frames: only the rashi map matters for lordship maths.
function frameFor(lagnaRashi, positions = {}) {
  const planets = Object.entries(positions).map(([key, rashi]) => ({
    key, rashi, house: ((rashi - lagnaRashi + 12) % 12) + 1,
  }))
  return makeFrame({ ascendant: { rashi: lagnaRashi }, planets })
}

describe('कार्येश स्वभाव — योगकारक / मारक / पाप-शुभ', () => {
  const cases = [
    [1, 'saturn'], // Vrishabha lagna → शनि (9 + 10)
    [6, 'saturn'], // Tula lagna → शनि (4 + 5)
    [3, 'mars'], // Karka lagna → मंगल (5 + 10)
    [4, 'mars'], // Simha lagna → मंगल (4 + 9)
    [9, 'venus'], // Makara lagna → शुक्र (5 + 10)
    [10, 'venus'], // Kumbha lagna → शुक्र (4 + 9)
  ]
  for (const [lagna, karaka] of cases) {
    it(`lagna ${lagna} → योगकारक ${karaka}`, () => {
      const kn = karakaNature(frameFor(lagna))
      expect(kn.yogakaraka).toEqual([karaka])
    })
  }

  it('yogakaraka is not claimed for a lagna where no single graha owns both', () => {
    // Mesha lagna: 4th Karka (Moon), 7th Tula (Venus), 10th Makara (Saturn),
    // 5th Simha (Sun), 9th Dhanu (Jupiter) — no single graha owns both groups.
    expect(karakaNature(frameFor(0)).yogakaraka).toEqual([])
  })

  it('maraka = owners of the 2nd and 7th; both at once is flagged', () => {
    const kn = karakaNature(frameFor(0)) // Mesha: 2nd Vrishabha (Venus), 7th Tula (Venus)
    expect(kn.maraka2).toBe('venus')
    expect(kn.maraka7).toBe('venus')
    expect(kn.maraka).toEqual(['venus'])
    expect(kn.strongMaraka).toBe('venus')
  })

  it('trikona lords are शुभ, 3/6/11 lords are पाप', () => {
    const kn = karakaNature(frameFor(0)) // Mesha
    expect(kn.trikonaLords.sort()).toEqual(['jupiter', 'sun']) // 9th Dhanu, 5th Simha
    expect(kn.papaLords).toContain('mercury') // 3rd Mithuna + 6th Kanya
    expect(kn.papaLords).toContain('saturn') // 11th Kumbha
  })

  it('kendradhipati dosha is noted for a benefic owning only a kendra', () => {
    // Vrishabha lagna: 7th Vrishchika (Mars, malefic → no dosha),
    // 4th Simha (Sun), 10th Kumbha (Saturn) — no benefic kendra owner without
    // a trikona. Karka lagna: 7th Makara (Saturn), 10th Mesha (Mars)…
    // Vrishabha's Shukra owns 6 and 11 only, so nothing trips.
    expect(karakaNature(frameFor(1)).kendraBeneficDosha).toEqual([])
    // Dhanu lagna: 1st Dhanu (Jupiter, also 4th Meena) → owns a kendra
    // without a trikona → dosha.
    expect(karakaNature(frameFor(8)).kendraBeneficDosha).toContain('jupiter')
  })
})

describe('planetPositions', () => {
  it('reads retrograde, combustion, vargottama and digbala off a kundli', () => {
    const frame = makeFrame({
      ascendant: { rashi: 0 },
      planets: [
        { key: 'sun', rashi: 0, degInSign: 10, house: 1, longitude: 10, nakshatra: 1, pada: 1, speed: 1, retro: false, navamsaRashi: 0 },
        { key: 'moon', rashi: 3, degInSign: 5, house: 4, longitude: 95, nakshatra: 7, pada: 2, speed: 13, retro: false, navamsaRashi: 3 },
        { key: 'mars', rashi: 9, degInSign: 28, house: 10, longitude: 298, nakshatra: 22, pada: 1, speed: 0.5, retro: false, navamsaRashi: 9 },
        { key: 'mercury', rashi: 0, degInSign: 12, house: 1, longitude: 12, nakshatra: 1, pada: 2, speed: 1.2, retro: false, navamsaRashi: 2 },
        { key: 'jupiter', rashi: 3, degInSign: 5, house: 4, longitude: 95.5, nakshatra: 7, pada: 2, speed: 0.1, retro: false, navamsaRashi: 3 },
        { key: 'venus', rashi: 11, degInSign: 27, house: 12, longitude: 357, nakshatra: 27, pada: 4, speed: 1, retro: true, navamsaRashi: 11 },
        { key: 'saturn', rashi: 6, degInSign: 20, house: 7, longitude: 200, nakshatra: 15, pada: 1, speed: 0.05, retro: false, navamsaRashi: 6 },
        { key: 'rahu', rashi: 1, degInSign: 10, house: 2, longitude: 40, nakshatra: 3, pada: 2, speed: -0.05, retro: true, navamsaRashi: 1 },
        { key: 'ketu', rashi: 7, degInSign: 10, house: 8, longitude: 220, nakshatra: 16, pada: 4, speed: -0.05, retro: true, navamsaRashi: 7 },
      ],
    })
    const pos = planetPositions(frame.kundli, frame)
    expect(pos.mars.dignity.level).toBe('exalted')
    expect(pos.mars.digbala).toBe(true) // Mars in the 10th
    expect(pos.saturn.digbala).toBe(true) // Saturn in the 7th
    expect(pos.mercury.combustion.combust).toBe(true) // 2° from the Sun
    expect(pos.jupiter.vargottama).toBe(true)
    expect(pos.venus.retro).toBe(true)
    expect(pos.rahu.dignity.level).toBe('exalted')
    expect(pos.ketu.dignity.level).toBe('exalted')
    expect(pos.venus.owns).toEqual([2, 7]) // Mesha lagna → 2nd Vrishabha, 7th Tula
  })
})
