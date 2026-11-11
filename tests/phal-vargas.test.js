// tests/phal-vargas.test.js — षोडशवर्ग (16 divisional charts).
// Values below are hand-worked from the BPHS ch.6 rules (see the header of
// src/phal/vargas.js) — each `it` names the rule it pins down.
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris, navamsaOf, computeKundli } from '../src/astro.js'
import {
  SHASHTIAMSA_DEITIES,
  VARGA_ORDERS,
  vargaRashi,
  vargaChart,
  allVargas,
  vargaLagnaSensitivity,
  shashtiamsaNumber,
  shashtiamsaDeity,
  signClass,
} from '../src/phal/vargas.js'

// longitude of a degree inside a rashi (0 = Mesha)
const L = (rashi, deg) => rashi * 30 + deg

describe('vargaRashi — rule by rule', () => {
  it('D1 is the rashi itself', () => {
    expect(vargaRashi(L(0, 0), 1)).toBe(0)
    expect(vargaRashi(L(11, 29.999), 1)).toBe(11)
  })

  it('D2 hora — odd signs Simha→Karka, even signs the other way', () => {
    expect(vargaRashi(L(0, 10), 2)).toBe(4) // Mesha 1st half → Simha
    expect(vargaRashi(L(0, 20), 2)).toBe(3) // Mesha 2nd half → Karka
    expect(vargaRashi(L(1, 10), 2)).toBe(3) // Vrishabha 1st half → Karka
    expect(vargaRashi(L(1, 20), 2)).toBe(4) // Vrishabha 2nd half → Simha
  })

  it('D3 drekkana — same, 5th, 9th', () => {
    expect(vargaRashi(L(0, 0), 3)).toBe(0)
    expect(vargaRashi(L(0, 5), 3)).toBe(0) // 1st third
    expect(vargaRashi(L(0, 10), 3)).toBe(4) // 2nd third → 5th from Mesha
    expect(vargaRashi(L(0, 25), 3)).toBe(8) // 3rd third → 9th from Mesha
    expect(vargaRashi(L(5, 15), 3)).toBe(9) // Kanya → 5th = Makara
  })

  it('D4 chaturthamsha — 1st, 4th, 7th, 10th', () => {
    expect(vargaRashi(L(0, 5), 4)).toBe(0)
    expect(vargaRashi(L(0, 10), 4)).toBe(3)
    expect(vargaRashi(L(0, 20), 4)).toBe(6)
    expect(vargaRashi(L(0, 28), 4)).toBe(9)
    expect(vargaRashi(L(1, 10), 4)).toBe(4) // Vrishabha 2nd part → 4th = Simha
  })

  it('D7 saptamsha — odd from itself, even from the 7th', () => {
    expect(vargaRashi(L(0, 2), 7)).toBe(0) // 1st saptamsha
    expect(vargaRashi(L(0, 20), 7)).toBe(4) // 5th saptamsha
    expect(vargaRashi(L(1, 2), 7)).toBe(7) // Vrishabha → 7th = Vrishchika
    expect(vargaRashi(L(1, 24), 7)).toBe(0) // 6 parts on from Vrishchika
  })

  it('D9 navamsha matches astro.navamsaOf for the whole zodiac', () => {
    for (let lon = 0; lon < 360; lon += 0.37) {
      expect(vargaRashi(lon, 9)).toBe(navamsaOf(lon).rashi)
    }
    // boundary: last second of Mesha
    expect(vargaRashi(L(0, 29.9997), 9)).toBe(8)
    expect(vargaRashi(L(1, 0), 9)).toBe(9)
  })

  it('D10 dashamsha — odd from itself, even from the 9th', () => {
    expect(vargaRashi(L(0, 2), 10)).toBe(0) // 1st dashamsha
    expect(vargaRashi(L(0, 20), 10)).toBe(6) // 7th
    expect(vargaRashi(L(1, 20), 10)).toBe(3) // Vrishabha: 9th = Makara + 6
  })

  it('D12 dwadashamsha — from the sign itself', () => {
    expect(vargaRashi(L(0, 2), 12)).toBe(0)
    expect(vargaRashi(L(0, 20), 12)).toBe(8)
    expect(vargaRashi(L(11, 29), 12)).toBe(10) // Meena + 11 → Makara
  })

  it('D16 shodashamsha — movable Mesha, fixed Simha, dual Dhanu', () => {
    expect(vargaRashi(L(0, 10), 16)).toBe(5) // Mesha + 5 → Kanya
    expect(vargaRashi(L(1, 10), 16)).toBe(9) // Vrishabha (fixed) Simha + 5 → Makara
    expect(vargaRashi(L(2, 10), 16)).toBe(1) // Mithuna (dual) Dhanu + 5 → Vrishabha
  })

  it('D20 vimshamsha — movable Mesha, fixed Dhanu, dual Simha', () => {
    expect(vargaRashi(L(0, 10), 20)).toBe(6)
    expect(vargaRashi(L(1, 10), 20)).toBe(2) // Dhanu + 6 → Mithuna
    expect(vargaRashi(L(2, 10), 20)).toBe(10) // Simha + 6 → Kumbha
  })

  it('D24 chaturvimshamsha — odd from Simha, even from Karka', () => {
    expect(vargaRashi(L(0, 0.5), 24)).toBe(4) // 1st → Simha
    expect(vargaRashi(L(1, 0.5), 24)).toBe(3) // 1st → Karka
    expect(vargaRashi(L(0, 10), 24)).toBe(0) // Simha + 8 → Mesha
    expect(vargaRashi(L(1, 10), 24)).toBe(11) // Karka + 8 → Meena
  })

  it('D27 saptavimshamsha — fire Mesha, earth Karka, air Tula, water Makara', () => {
    expect(vargaRashi(L(0, 10), 27)).toBe(9) // Mesha + 9 → Makara
    expect(vargaRashi(L(1, 10), 27)).toBe(0) // Vrishabha (earth) Karka + 9 → Mesha
    expect(vargaRashi(L(2, 10), 27)).toBe(3) // Mithuna (air) Tula + 9 → Karka
    expect(vargaRashi(L(3, 10), 27)).toBe(6) // Karka (water) Makara + 9 → Tula
  })

  it('D30 trimshamsha — the unequal Parashari split (odd sign)', () => {
    expect(vargaRashi(L(0, 3), 30)).toBe(0) // 0–5 Mesha
    expect(vargaRashi(L(0, 7), 30)).toBe(10) // 5–10 Kumbha
    expect(vargaRashi(L(0, 15), 30)).toBe(8) // 10–18 Dhanu
    expect(vargaRashi(L(0, 20), 30)).toBe(2) // 18–25 Mithuna
    expect(vargaRashi(L(0, 27), 30)).toBe(6) // 25–30 Tula
  })

  it('D30 trimshamsha — even sign', () => {
    expect(vargaRashi(L(1, 3), 30)).toBe(1) // 0–5 Vrishabha
    expect(vargaRashi(L(1, 8), 30)).toBe(5) // 5–12 Kanya
    expect(vargaRashi(L(1, 15), 30)).toBe(11) // 12–20 Meena
    expect(vargaRashi(L(1, 22), 30)).toBe(9) // 20–25 Makara
    expect(vargaRashi(L(1, 27), 30)).toBe(7) // 25–30 Vrishchika
  })

  it('D40 khavedamsha — odd Mesha, even Tula', () => {
    expect(vargaRashi(L(0, 0.5), 40)).toBe(0) // 1st khavedamsha
    expect(vargaRashi(L(0, 8.25), 40)).toBe(11) // 12th → Meena
    expect(vargaRashi(L(1, 0.5), 40)).toBe(6) // Vrishabha 1st → Tula
  })

  it('D45 akshavedamsha — movable Mesha, fixed Simha, dual Dhanu', () => {
    expect(vargaRashi(L(0, 0.5), 45)).toBe(0) // Mesha → 1st from Mesha
    expect(vargaRashi(L(1, 0.5), 45)).toBe(4) // Vrishabha (fixed) → 1st from Simha
    expect(vargaRashi(L(2, 0.5), 45)).toBe(8) // Mithuna (dual) → 1st from Dhanu
  })

  it('D60 shashtiamsha — count the amsha number from the sign itself', () => {
    expect(vargaRashi(L(0, 0.1), 60)).toBe(0) // amsha 1
    expect(vargaRashi(L(0, 29.983), 60)).toBe(11) // amsha 60 → 59 signs on = Meena
    expect(vargaRashi(L(1, 0.667), 60)).toBe(2) // amsha 2 from Vrishabha → Mithuna
  })

  it('every varga returns a valid rashi for the whole zodiac', () => {
    for (const n of VARGA_ORDERS) {
      for (let lon = 0; lon < 360; lon += 7.13) {
        const r = vargaRashi(lon, n)
        expect(Number.isInteger(r)).toBe(true)
        expect(r).toBeGreaterThanOrEqual(0)
        expect(r).toBeLessThanOrEqual(11)
      }
    }
  })

  it('unknown varga throws instead of returning a silent wrong value', () => {
    expect(() => vargaRashi(10, 5)).toThrow(/unknown varga/)
  })
})

// --- shashtiamsha helpers ---------------------------------------------------
describe('shashtiamsa number and deity', () => {
  it('number: floor(deg × 2) + 1, bounded to 1..60', () => {
    expect(shashtiamsaNumber(0)).toBe(1)
    expect(shashtiamsaNumber(0.4)).toBe(1)
    expect(shashtiamsaNumber(0.5)).toBe(2)
    expect(shashtiamsaNumber(29.99)).toBe(60)
  })

  // BPHS 6.40: "समे भे व्यत्ययाज्ज्ञेयाः षष्ट्यंशेशाः" — in an even sign only the
  // deity order reverses; the sign itself is still counted forwards.
  it('deity: direct order in odd signs, reverse in even signs', () => {
    expect(shashtiamsaDeity(0, 0.1).en).toBe('Ghora') // Mesha, amsha 1
    expect(shashtiamsaDeity(0, 29.99).en).toBe('Chandrarekha') // Mesha, amsha 60
    expect(shashtiamsaDeity(1, 0.1).en).toBe('Chandrarekha') // Vrishabha → reversed
    expect(shashtiamsaDeity(1, 29.99).en).toBe('Ghora')
  })

  it('odd signs: amsha 5 = यक्ष, amsha 52 = दण्डायुध, amsha 56 = अतिशीतल', () => {
    expect(shashtiamsaDeity(0, 2.1)).toMatchObject({ number: 5, hi: 'यक्ष', en: 'Yaksha' })
    expect(shashtiamsaDeity(0, 25.6)).toMatchObject({ number: 52, hi: 'दण्डायुध', en: 'Dandayudha' })
    expect(shashtiamsaDeity(0, 27.6)).toMatchObject({ number: 56, hi: 'अतिशीतल', en: 'Atisheetala' })
  })

  it('even signs: Vrishabha 2.1° is amsha 5 → the 56th name (अतिशीतल)', () => {
    // reverse order: index = 61 − amsha number = 56
    expect(shashtiamsaDeity(1, 2.1)).toMatchObject({ number: 5, hi: 'अतिशीतल', en: 'Atisheetala' })
  })

  it('exactly sixty deities — BPHS अ.6 श्लोक 34–39, कोई गढ़ा हुआ नाम नहीं', () => {
    expect(SHASHTIAMSA_DEITIES.length).toBe(60)
    expect(SHASHTIAMSA_DEITIES.some((d) => d.en === 'Sama' || d.hi === 'सम')).toBe(false)
    expect(SHASHTIAMSA_DEITIES[4]).toMatchObject({ hi: 'यक्ष' }) // #5
    expect(SHASHTIAMSA_DEITIES[29]).toMatchObject({ hi: 'गुलिक' }) // #30
    expect(SHASHTIAMSA_DEITIES[51]).toMatchObject({ hi: 'दण्डायुध' }) // #52
    expect(SHASHTIAMSA_DEITIES[59]).toMatchObject({ hi: 'चंद्ररेखा' }) // #60
    for (const d of SHASHTIAMSA_DEITIES) {
      expect(typeof d.hi).toBe('string')
      expect(d.hi.length).toBeGreaterThan(0)
      expect(typeof d.en).toBe('string')
      expect([true, false, null]).toContain(d.shubha)
    }
  })

  it('the whole list, in BPHS order (snapshot)', () => {
    expect(SHASHTIAMSA_DEITIES.map((d) => `${d.hi} · ${d.en} · ${d.shubha}`)).toEqual([
      'घोर · Ghora · false',
      'राक्षस · Rakshasa · false',
      'देव · Deva · true',
      'कुबेर · Kubera · true',
      'यक्ष · Yaksha · true',
      'किन्नर · Kinnara · true',
      'भ्रष्ट · Bhrashta · false',
      'कुलघ्न · Kulaghna · false',
      'गरल · Garala · false',
      'वह्नि · Vahni · false',
      'माया · Maya · false',
      'पुरीषक · Purishaka · false',
      'अपांपति · Apampati · null',
      'मरुत्वान् · Marutvan · null',
      'काल · Kaala · false',
      'सर्प · Sarpa · false',
      'अमृत · Amrita · true',
      'इन्दु · Indu · true',
      'मृदु · Mridu · true',
      'कोमल · Komala · true',
      'हेरम्ब · Heramba · true',
      'ब्रह्मा · Brahma · true',
      'विष्णु · Vishnu · true',
      'महेश्वर · Maheshwara · true',
      'देव · Deva · true',
      'आर्द्र · Ardra · null',
      'कलिनाश · Kalinasha · true',
      'क्षितीश · Kshitisa · null',
      'कमलाकर · Kamalakara · true',
      'गुलिक · Gulika · false',
      'मृत्यु · Mrityu · false',
      'काल · Kaala · false',
      'दावाग्नि · Davagni · false',
      'घोर · Ghora · false',
      'यम · Yama · false',
      'कंटक · Kantaka · false',
      'सुधा · Sudha · true',
      'अमृत · Amrita · true',
      'पूर्णचंद्र · Poornachandra · true',
      'विषदग्ध · Vishadagdha · false',
      'कुलनाश · Kulanasha · false',
      'वंशक्षय · Vamsakshaya · false',
      'उत्पात · Utpata · false',
      'काल · Kaala · false',
      'सौम्य · Saumya · true',
      'कोमल · Komala · true',
      'शीतल · Sheetala · true',
      'करालदंष्ट्र · Karaladamshtra · false',
      'चंद्रमुख · Chandramukha · true',
      'प्रवीण · Praveena · true',
      'कालपावक · Kaalapavaka · false',
      'दण्डायुध · Dandayudha · false',
      'निर्मल · Nirmala · true',
      'सौम्य · Saumya · true',
      'क्रूर · Kroora · false',
      'अतिशीतल · Atisheetala · true',
      'अमृत · Amrita · true',
      'पयोधि · Payodhi · true',
      'भ्रमण · Bhramana · null',
      'चंद्ररेखा · Chandrarekha · true',
    ])
  })

  it('every amsha 1..60 maps to a name, and the mapping is one-to-one per sign', () => {
    const odd = []
    for (let i = 0; i < 60; i++) odd.push(shashtiamsaDeity(0, i * 0.5 + 0.01).en)
    expect(odd.length).toBe(60)
    expect(odd[0]).toBe('Ghora')
    expect(odd[59]).toBe('Chandrarekha')
    // an even sign must produce the exact reverse of the odd-sign order
    const even = []
    for (let i = 0; i < 60; i++) even.push(shashtiamsaDeity(1, i * 0.5 + 0.01).en)
    expect(even).toEqual([...odd].reverse())
  })
})

describe('sign classes', () => {
  it('movable / fixed / dual', () => {
    expect(signClass(0)).toBe('movable')
    expect(signClass(1)).toBe('fixed')
    expect(signClass(2)).toBe('dual')
    expect(signClass(9)).toBe('movable')
    expect(signClass(11)).toBe('dual')
  })
})

// --- charts from a real kundli ---------------------------------------------
let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

const BIRTH = {
  utc: { year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 },
  latitude: 25.31668,
  longitude: 83.01041,
  timeZone: 'Asia/Kolkata',
  local: { year: 1990, month: 5, day: 15, hour: 14, minute: 30, second: 0 },
}

describe('vargaChart / allVargas', () => {
  it('gives every graha and the lagna a rashi in all 16 vargas', () => {
    const k = computeKundli(swe, BIRTH)
    const all = allVargas(k)
    expect(Object.keys(all).length).toBe(16)
    for (const n of VARGA_ORDERS) {
      const chart = all[n]
      expect(chart.lagna).toBeGreaterThanOrEqual(0)
      expect(chart.lagna).toBeLessThanOrEqual(11)
      for (const p of k.planets) {
        expect(Number.isInteger(chart.planets[p.key])).toBe(true)
      }
    }
    // D1 must be the natal chart itself
    expect(all[1].lagna).toBe(k.ascendant.rashi)
    for (const p of k.planets) expect(all[1].planets[p.key]).toBe(p.rashi)
    // D9 must match the navamsa already shown on the site
    for (const p of k.planets) expect(all[9].planets[p.key]).toBe(p.navamsaRashi)
    expect(vargaChart(k, 9).lagna).toBe(k.ascendant.navamsaRashi)
  })
})

describe('vargaLagnaSensitivity', () => {
  it('D60 lagna changes within minutes, D1 does not change within 10 minutes', () => {
    const s = vargaLagnaSensitivity(swe, BIRTH, { maxSec: 600, stepSec: 10 })
    expect(s[60].forwardSec === null && s[60].backSec === null).toBe(false)
    for (const n of [2, 3, 9, 30, 60]) {
      const v = s[n]
      for (const sec of [v.backSec, v.forwardSec]) {
        if (sec !== null) {
          expect(sec).toBeGreaterThan(0)
          expect(sec).toBeLessThanOrEqual(600)
        }
      }
    }
    expect(s[1].forwardSec).toBe(null)
    expect(s[1].backSec).toBe(null)
    // null का अर्थ: सीमा के भीतर नहीं बदलता — limitSec output में आता है
    expect(s[60].limitSec).toBe(600)
    expect(s[1].limitSec).toBe(600)
  })
})
