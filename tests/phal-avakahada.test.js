// tests/phal-avakahada.test.js — अवकहड़ा, कारक, कारकांश, सुदर्शन दृष्टि।
import { describe, expect, it } from 'vitest'
import { makeFrame } from '../src/phal/frame.js'
import {
  PADA_LETTERS,
  avakahada,
  karakas,
  nakshatraLord,
  padaLetter,
  sudarshanTable,
} from '../src/phal/avakahada.js'

const ALL = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']

// Build a kundli-shaped object with chosen degrees (for the karaka order).
function kundli({ lagnaRashi = 0, degrees = {}, nakshatra = {}, pada = {} } = {}) {
  const rashis = {}
  const planets = ALL.map((key, i) => {
    const deg = degrees[key] ?? 10 + i
    const rashi = Math.floor(deg / 30)
    const degInSign = deg - rashi * 30
    rashis[key] = rashi
    return {
      key,
      rashi,
      degInSign,
      house: ((rashi - lagnaRashi + 12) % 12) + 1,
      longitude: deg,
      nakshatra: nakshatra[key] ?? 1,
      pada: pada[key] ?? 1,
      speed: 1,
      retro: false,
      navamsaRashi: (rashi + 2) % 12,
    }
  })
  const ascendant = {
    key: 'asc',
    rashi: lagnaRashi,
    degInSign: 12.5,
    longitude: lagnaRashi * 30 + 12.5,
    nakshatra: 4,
    pada: 2,
    navamsaRashi: (lagnaRashi + 1) % 12,
  }
  return { ascendant, planets }
}

describe('नक्षत्र-पाद अक्षर', () => {
  it('27 nakshatras, four padas each', () => {
    expect(PADA_LETTERS.length).toBe(27)
    for (const row of PADA_LETTERS) {
      expect(row.length).toBe(4)
      for (const l of row) expect(typeof l).toBe('string')
    }
  })

  it('spot checks of the classical list', () => {
    expect(padaLetter(1, 1)).toBe('चु') // Ashwini
    expect(padaLetter(1, 4)).toBe('ला')
    expect(padaLetter(10, 1)).toBe('मा') // Magha
    expect(padaLetter(19, 1)).toBe('ये') // Mula
    expect(padaLetter(27, 4)).toBe('ची') // Revati
    expect(padaLetter(27, 5)).toBe(null)
  })
})

describe('नक्षत्र-स्वामी', () => {
  it('follows the Vimshottari order from Ketu', () => {
    expect(nakshatraLord(1)).toBe('ketu') // Ashwini
    expect(nakshatraLord(2)).toBe('venus') // Bharani
    expect(nakshatraLord(3)).toBe('sun') // Krittika
    expect(nakshatraLord(9)).toBe('mercury') // Ashlesha
    expect(nakshatraLord(10)).toBe('ketu') // Magha — the cycle repeats
    expect(nakshatraLord(27)).toBe('mercury') // Revati
  })
})

describe('सात कारक', () => {
  it('orders the seven grahas by degrees crossed, highest = आत्मकारक', () => {
    const k = kundli({ degrees: { sun: 29, moon: 5, mars: 12, mercury: 25, jupiter: 8, venus: 18, saturn: 2 } })
    const list = karakas(k)
    expect(list.length).toBe(7)
    expect(list[0].key).toBe('sun')
    expect(list[0].karaka).toBe('atma')
    expect(list[1].key).toBe('mercury')
    expect(list[6].key).toBe('saturn')
    expect(list[6].karaka).toBe('dara')
    // descending
    for (let i = 1; i < 7; i++) expect(list[i].degInSign).toBeLessThanOrEqual(list[i - 1].degInSign)
  })

  it('कारकांश = the आत्मकारक’s navamsha rashi', () => {
    const k = kundli({ degrees: { sun: 29, moon: 5, mars: 12, mercury: 25, jupiter: 8, venus: 18, saturn: 2 } })
    const frame = makeFrame(k)
    const av = avakahada(frame)
    expect(av.atmakaraka.key).toBe('sun')
    expect(av.karakamsha).toBe(k.planets.find((p) => p.key === 'sun').navamsaRashi)
  })
})

describe('सुदर्शन दृष्टि', () => {
  it('twelve houses seen from the lagna, the Moon and the Sun', () => {
    const frame = makeFrame(kundli({ lagnaRashi: 4 }))
    const rows = sudarshanTable(frame)
    expect(rows.length).toBe(12)
    expect(rows[0].fromLagna).toBe(4)
    expect(rows[0].fromMoon).toBe(frame.byKey.moon.rashi)
    expect(rows[0].fromSun).toBe(frame.byKey.sun.rashi)
    expect(rows[11].fromLagna).toBe((4 + 11) % 12)
    expect(rows[0].lord).toBe(frame.houseLord[0])
  })
})

describe('avakahada', () => {
  it('reads the five kootas from the matching page’s tables', () => {
    // Moon in Mesha, Ashwini pada 1
    const k = kundli({ lagnaRashi: 0, degrees: { moon: 5 }, nakshatra: { moon: 1 }, pada: { moon: 1 } })
    const av = avakahada(makeFrame(k))
    expect(av.varna.key).toBe('kshatriya') // Mesha = Kshatriya
    expect(av.varna.hi).toBe('क्षत्रिय')
    expect(av.yoni.hi).toBe('अश्व') // Ashwini = horse
    expect(av.gana.hi).toBe('देव') // Ashwini = Deva
    expect(av.nadi.hi).toBe('आदि') // Ashwini = Aadi
    expect(av.vashya.key).toBe('chatushpada') // Mesha
    expect(av.nakshatra.name.en).toBe('Ashwini')
    expect(av.nakshatra.letter).toBe('चु')
    expect(av.nakshatra.lord).toBe('ketu')
    expect(av.rashi.lord).toBe('mars')
  })

  it('keeps the lagna details (nakshatra, pada, letter)', () => {
    const av = avakahada(makeFrame(kundli({ lagnaRashi: 3 })))
    expect(av.lagna.rashi).toBe(3)
    expect(av.lagna.nakshatra).toBe(4)
    expect(av.lagna.pada).toBe(2)
    expect(av.lagna.letter).toBe('वा') // Rohini pada 2
  })

  it('carries the panchang through untouched', () => {
    const av = avakahada(makeFrame(kundli()), { panchang: { tithi: { index: 5 } } })
    expect(av.panchang.tithi.index).toBe(5)
  })
})
