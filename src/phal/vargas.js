// vargas.js — the sixteen divisional charts (षोडशवर्ग, BPHS ch.6).
//
// Every varga is a pure function of a sidereal longitude: no ephemeris call,
// no chart state. `vargaRashi(lon, n)` returns the 0-11 rashi of the division
// `n` (1 = D1, 2 = D2, … 60 = D60).
//
// Rule sources (all BPHS ch.6 "Ṣoḍaśavarga"):
//   D1  rashi as it is.
//   D2  Parashari hora: odd sign 1st half → Simha, 2nd → Karka; even sign the
//       other way round.
//   D3  drekkana: from the sign itself, then the 5th, then the 9th.
//   D4  chaturthamsha: 1st, 4th, 7th, 10th from the sign.
//   D7  saptamsha: odd → from the sign itself; even → from the 7th.
//   D9  navamsha: the running 9-fold count (identical to astro.navamsaOf).
//   D10 dashamsha: odd → from the sign itself; even → from the 9th.
//   D12 dwadashamsha: from the sign itself.
//   D16 shodashamsha: movable → Mesha, fixed → Simha, dual → Dhanu.
//   D20 vimshamsha:   movable → Mesha, fixed → Dhanu, dual → Simha.
//   D24 chaturvimshamsha: odd → from Simha, even → from Karka.
//   D27 saptavimshamsha (bhamsha): fire → Mesha, earth → Karka, air → Tula,
//       water → Makara.
//   D30 trimshamsha: the unequal Parashari split (see TRIMSHAMSA below).
//   D40 khavedamsha:  odd → Mesha, even → Tula.
//   D45 akshavedamsha: movable → Mesha, fixed → Simha, dual → Dhanu.
//   D60 shashtiamsha: amsha number = floor(deg × 2) + 1, then count that many
//       signs from the sign itself; the 60 deities run in direct order in odd
//       signs and in reverse in even signs.

import { navamsaOf } from '../astro.js'

export const VARGA_ORDERS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]

export const VARGA_INFO = {
  1: { hi: 'राशि (D1)', en: 'Rashi (D1)' },
  2: { hi: 'होरा (D2)', en: 'Hora (D2)' },
  3: { hi: 'द्रेक्काण (D3)', en: 'Drekkana (D3)' },
  4: { hi: 'चतुर्थांश (D4)', en: 'Chaturthamsha (D4)' },
  7: { hi: 'सप्तांश (D7)', en: 'Saptamsha (D7)' },
  9: { hi: 'नवांश (D9)', en: 'Navamsha (D9)' },
  10: { hi: 'दशांश (D10)', en: 'Dashamsha (D10)' },
  12: { hi: 'द्वादशांश (D12)', en: 'Dwadashamsha (D12)' },
  16: { hi: 'षोडशांश (D16)', en: 'Shodashamsha (D16)' },
  20: { hi: 'विंशांश (D20)', en: 'Vimshamsha (D20)' },
  24: { hi: 'चतुर्विंशांश (D24)', en: 'Chaturvimshamsha (D24)' },
  27: { hi: 'सप्तविंशांश / भांश (D27)', en: 'Saptavimshamsha (D27)' },
  30: { hi: 'त्रिंशांश (D30)', en: 'Trimshamsha (D30)' },
  40: { hi: 'खवेदांश (D40)', en: 'Khavedamsha (D40)' },
  45: { hi: 'अक्षवेदांश (D45)', en: 'Akshavedamsha (D45)' },
  60: { hi: 'षष्ट्यंश (D60)', en: 'Shashtiamsha (D60)' },
}

// Sign classes used by several vargas (0 = Mesha … 11 = Meena).
const MOVABLE = [0, 3, 6, 9] // चर
const FIXED = [1, 4, 7, 10] // स्थिर
const DUAL = [2, 5, 8, 11] // द्विस्वभाव

export function signClass(rashi) {
  if (MOVABLE.includes(rashi)) return 'movable'
  if (FIXED.includes(rashi)) return 'fixed'
  return 'dual'
}

// D30 — unequal trimshamsha degrees (BPHS ch.6). Each entry: [upTo, rashi].
export const TRIMSHAMSA_ODD = [
  [5, 0], // 0–5 Mesha
  [10, 10], // 5–10 Kumbha
  [18, 8], // 10–18 Dhanu
  [25, 2], // 18–25 Mithuna
  [30, 6], // 25–30 Tula
]
export const TRIMSHAMSA_EVEN = [
  [5, 1], // 0–5 Vrishabha
  [12, 5], // 5–12 Kanya
  [20, 11], // 12–20 Meena
  [25, 9], // 20–25 Makara
  [30, 7], // 25–30 Vrishchika
]

// The sixty shashtiamsha deities — BPHS ch.6, shlokas 34-39 (the list begins
// "घोरश्च राक्षसो देवः कुबेरो यक्षकिन्नरौ…" and ends "…चन्द्ररेखा त्वयुग्मपाः";
// "अयुग्मपाः" means "lords of the odd signs", not a 61st name).
//
// `shubha`: BPHS 6.41 only says that a graha in a शुभ shashtiamsa gives good
// results and in a क्रूर one destroys them — it does not classify each name.
// The split below therefore follows the meaning of the name; where the later
// lists disagree the entry stays `null` (मिश्र) instead of being guessed.
export const SHASHTIAMSA_DEITIES = [
  { hi: 'घोर', en: 'Ghora', shubha: false }, // 1
  { hi: 'राक्षस', en: 'Rakshasa', shubha: false }, // 2
  { hi: 'देव', en: 'Deva', shubha: true }, // 3
  { hi: 'कुबेर', en: 'Kubera', shubha: true }, // 4
  { hi: 'यक्ष', en: 'Yaksha', shubha: true }, // 5
  { hi: 'किन्नर', en: 'Kinnara', shubha: true }, // 6
  { hi: 'भ्रष्ट', en: 'Bhrashta', shubha: false }, // 7
  { hi: 'कुलघ्न', en: 'Kulaghna', shubha: false }, // 8
  { hi: 'गरल', en: 'Garala', shubha: false }, // 9
  { hi: 'वह्नि', en: 'Vahni', shubha: false }, // 10
  { hi: 'माया', en: 'Maya', shubha: false }, // 11
  { hi: 'पुरीषक', en: 'Purishaka', shubha: false }, // 12
  { hi: 'अपांपति', en: 'Apampati', shubha: null }, // 13
  { hi: 'मरुत्वान्', en: 'Marutvan', shubha: null }, // 14
  { hi: 'काल', en: 'Kaala', shubha: false }, // 15
  { hi: 'सर्प', en: 'Sarpa', shubha: false }, // 16
  { hi: 'अमृत', en: 'Amrita', shubha: true }, // 17
  { hi: 'इन्दु', en: 'Indu', shubha: true }, // 18
  { hi: 'मृदु', en: 'Mridu', shubha: true }, // 19
  { hi: 'कोमल', en: 'Komala', shubha: true }, // 20
  { hi: 'हेरम्ब', en: 'Heramba', shubha: true }, // 21
  { hi: 'ब्रह्मा', en: 'Brahma', shubha: true }, // 22
  { hi: 'विष्णु', en: 'Vishnu', shubha: true }, // 23
  { hi: 'महेश्वर', en: 'Maheshwara', shubha: true }, // 24
  { hi: 'देव', en: 'Deva', shubha: true }, // 25
  { hi: 'आर्द्र', en: 'Ardra', shubha: null }, // 26
  { hi: 'कलिनाश', en: 'Kalinasha', shubha: true }, // 27
  { hi: 'क्षितीश', en: 'Kshitisa', shubha: null }, // 28
  { hi: 'कमलाकर', en: 'Kamalakara', shubha: true }, // 29
  { hi: 'गुलिक', en: 'Gulika', shubha: false }, // 30
  { hi: 'मृत्यु', en: 'Mrityu', shubha: false }, // 31
  { hi: 'काल', en: 'Kaala', shubha: false }, // 32
  { hi: 'दावाग्नि', en: 'Davagni', shubha: false }, // 33
  { hi: 'घोर', en: 'Ghora', shubha: false }, // 34
  { hi: 'यम', en: 'Yama', shubha: false }, // 35
  { hi: 'कंटक', en: 'Kantaka', shubha: false }, // 36
  { hi: 'सुधा', en: 'Sudha', shubha: true }, // 37
  { hi: 'अमृत', en: 'Amrita', shubha: true }, // 38
  { hi: 'पूर्णचंद्र', en: 'Poornachandra', shubha: true }, // 39
  { hi: 'विषदग्ध', en: 'Vishadagdha', shubha: false }, // 40
  { hi: 'कुलनाश', en: 'Kulanasha', shubha: false }, // 41
  { hi: 'वंशक्षय', en: 'Vamsakshaya', shubha: false }, // 42
  { hi: 'उत्पात', en: 'Utpata', shubha: false }, // 43
  { hi: 'काल', en: 'Kaala', shubha: false }, // 44
  { hi: 'सौम्य', en: 'Saumya', shubha: true }, // 45
  { hi: 'कोमल', en: 'Komala', shubha: true }, // 46
  { hi: 'शीतल', en: 'Sheetala', shubha: true }, // 47
  { hi: 'करालदंष्ट्र', en: 'Karaladamshtra', shubha: false }, // 48
  { hi: 'चंद्रमुखी', en: 'Chandramukhi', shubha: true }, // 49
  { hi: 'प्रवीण', en: 'Praveena', shubha: true }, // 50
  { hi: 'कालपावक', en: 'Kaalapavaka', shubha: false }, // 51
  { hi: 'दण्डायुध', en: 'Dandayudha', shubha: false }, // 52
  { hi: 'निर्मल', en: 'Nirmala', shubha: true }, // 53
  { hi: 'सौम्य', en: 'Saumya', shubha: true }, // 54
  { hi: 'क्रूर', en: 'Kroora', shubha: false }, // 55
  { hi: 'अतिशीतल', en: 'Atisheetala', shubha: true }, // 56
  { hi: 'अमृत', en: 'Amrita', shubha: true }, // 57
  { hi: 'पयोधि', en: 'Payodhi', shubha: true }, // 58
  { hi: 'भ्रमण', en: 'Bhramana', shubha: null }, // 59
  { hi: 'चंद्ररेखा', en: 'Chandrarekha', shubha: true }, // 60
]

// Amsha number (1..60) inside a sign, from the degrees already elapsed there.
export function shashtiamsaNumber(degInSign) {
  const n = Math.floor(degInSign * 2) + 1
  return Math.min(60, Math.max(1, n))
}

// The deity of a shashtiamsa: direct order in odd signs, reverse in even ones.
export function shashtiamsaDeity(rashi, degInSign) {
  const num = shashtiamsaNumber(degInSign)
  const idx = ((rashi + 1) % 2 === 1 ? num : 61 - num) - 1
  const deity = SHASHTIAMSA_DEITIES[idx]
  return { number: num, index: idx, ...deity }
}

// Main entry: the rashi (0-11) of division `n` for a sidereal longitude.
export function vargaRashi(longitude, n) {
  const lon = ((longitude % 360) + 360) % 360
  const rashi = Math.floor(lon / 30) % 12
  const deg = lon - rashi * 30
  const partSize = 30 / n
  const part = Math.min(n - 1, Math.floor(deg / partSize)) // 0-based

  switch (n) {
    case 1:
      return rashi
    case 2: {
      // odd sign (rashi even in 0-based) → Simha first, Karka second
      const oddSign = (rashi + 1) % 2 === 1
      if (oddSign) return part === 0 ? 4 : 3
      return part === 0 ? 3 : 4
    }
    case 3:
      return (rashi + 4 * part) % 12
    case 4:
      return (rashi + 3 * part) % 12
    case 7:
      return (rashi + (rashi % 2 === 0 ? part : 6 + part)) % 12
    case 9:
      return navamsaOf(lon).rashi
    case 10:
      return (rashi + (rashi % 2 === 0 ? part : 8 + part)) % 12
    case 12:
      return (rashi + part) % 12
    case 16: {
      const start = signClass(rashi) === 'movable' ? 0 : signClass(rashi) === 'fixed' ? 4 : 8
      return (start + part) % 12
    }
    case 20: {
      const start = signClass(rashi) === 'movable' ? 0 : signClass(rashi) === 'fixed' ? 8 : 4
      return (start + part) % 12
    }
    case 24: {
      const start = rashi % 2 === 0 ? 4 : 3 // odd sign (0-based even) → Simha
      return (start + part) % 12
    }
    case 27: {
      const start = rashi % 4 === 0 ? 0 : rashi % 4 === 1 ? 3 : rashi % 4 === 2 ? 6 : 9
      return (start + part) % 12
    }
    case 30: {
      const table = rashi % 2 === 0 ? TRIMSHAMSA_ODD : TRIMSHAMSA_EVEN
      for (const [upTo, r] of table) if (deg < upTo) return r
      return table[table.length - 1][1]
    }
    case 40:
      return ((rashi % 2 === 0 ? 0 : 6) + part) % 12
    case 45: {
      const start = signClass(rashi) === 'movable' ? 0 : signClass(rashi) === 'fixed' ? 4 : 8
      return (start + part) % 12
    }
    case 60: {
      const num = shashtiamsaNumber(deg)
      return (rashi + num - 1) % 12
    }
    default:
      throw new Error(`unknown varga D${n}`)
  }
}

// The full varga frame for a computed kundli: lagna + every planet.
export function vargaChart(kundli, n) {
  const planets = {}
  for (const p of kundli.planets) planets[p.key] = vargaRashi(p.longitude, n)
  return { varga: n, lagna: vargaRashi(kundli.ascendant.longitude, n), planets }
}

// All sixteen vargas at once (what the report shows).
export function allVargas(kundli) {
  const out = {}
  for (const n of VARGA_ORDERS) out[n] = vargaChart(kundli, n)
  return out
}

// --- जन्म-समय संवेदनशीलता -----------------------------------------------------
// "How many minutes later does this varga's lagna change?" — computed by
// nudging the birth instant in `stepSec` steps (a real recomputation of the
// ascendant, not a linear guess) and bisecting the first change to 1 s.
//
// Returns { [varga]: { backSec, forwardSec } }; null = no change inside
// `maxSec` (D1 routinely needs hours, so it stays null there).
export function vargaLagnaSensitivity(swe, birth, { maxSec = 600, stepSec = 10 } = {}) {
  const u = birth.utc
  const hourDecimal = u.hour + u.minute / 60 + u.second / 3600
  const jd0 = swe.julday(u.year, u.month, u.day, hourDecimal)
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL

  const ascLonAt = (sec) => {
    const h = swe.houses_ex(jd0 + sec / 86400, flags, birth.latitude, birth.longitude, 'W')
    const lon = h.ascmc[0]
    return ((lon % 360) + 360) % 360
  }

  const baseLon = ascLonAt(0)
  const base = {}
  for (const n of VARGA_ORDERS) base[n] = vargaRashi(baseLon, n)

  const out = {}
  for (const n of VARGA_ORDERS) out[n] = { backSec: null, forwardSec: null }

  const findEdge = (dir) => {
    let prev = 0
    for (let sec = stepSec; sec <= maxSec; sec += stepSec) {
      const lon = ascLonAt(dir * sec)
      const changed = VARGA_ORDERS.filter((n) => vargaRashi(lon, n) !== base[n] && out[n][dir > 0 ? 'forwardSec' : 'backSec'] === null)
      if (changed.length) {
        // bisect each changed varga's first change down to 1 s
        for (const n of changed) {
          let a = prev
          let b = sec
          for (let k = 0; k < 12; k++) {
            const m = (a + b) / 2
            if (vargaRashi(ascLonAt(dir * m), n) === base[n]) a = m
            else b = m
          }
          out[n][dir > 0 ? 'forwardSec' : 'backSec'] = Math.round((a + b) / 2)
        }
      }
      prev = sec
    }
  }

  findEdge(1)
  findEdge(-1)
  return out
}
