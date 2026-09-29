// panchang-extras.test.js — Phase 5: Disha Shoola, Tara Bala, Chandra Bala
// vs AstroSage fixtures (every fixture date that carries these fields).
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { computePanchang } from '../src/panchang.js'
import fixtures from '../scripts/panchang-calib/astrosage.json'

let swe

beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

const DELHI = { latitude: 28.6139, longitude: 77.209, timeZone: 'Asia/Kolkata' }
function compute(dateKey) {
  const [dd, mm, yyyy] = dateKey.split('-').map(Number)
  return computePanchang(swe, { year: yyyy, month: mm, day: dd, ...DELHI })
}

const clean = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

// Reference nakshatra spellings → canonical index (1..27).
const NAK_ALIASES = [
  ['ashwini'], ['bharani'], ['kritika', 'krittika'], ['rohini'], ['mrigashirsha', 'mrigashira'], ['ardra'],
  ['punarvasu'], ['pushya'], ['ashlesha'], ['magha'], ['poorva phalguni', 'purva phalguni'], ['uttara phalguni'],
  ['hasta'], ['chitra'], ['swati', 'swaati'], ['vishakha'], ['anuradha'], ['jyeshta', 'jyeshtha'], ['moola', 'mula'],
  ['poorva ashadha', 'purva ashadha'], ['uttara ashadha'], ['shravana'], ['dhanishta'], ['satabisha', 'shatabhisha'],
  ['poorva bhadrapada', 'purva bhadrapada'], ['uttara bhadrapada'], ['revati'],
]
const RASHI_ALIASES = [
  ['mesha', 'aries'], ['vrishabha', 'taurus'], ['mithuna', 'gemini'], ['karka', 'cancer'], ['simha', 'leo'],
  ['kanya', 'virgo'], ['tula', 'libra'], ['vrishchika', 'scorpio'], ['dhanu', 'sagittarius'],
  ['makara', 'capricorn'], ['kumbha', 'aquarius'], ['meena', 'pisces'],
]
function mapName(aliasRows, name) {
  const n = clean(name)
  for (let i = 0; i < aliasRows.length; i++) if (aliasRows[i].includes(n)) return i
  return -1
}
const listToIndexes = (s, aliasRows) =>
  String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean).map((x) => mapName(aliasRows, x))

const sortNums = (a) => [...a].sort((x, y) => x - y)

describe('panchang extras vs AstroSage fixtures', () => {
  for (const [key, rec] of Object.entries(fixtures)) {
    if (key.startsWith('_')) continue

    it(`${key}: disha shoola / tara bala / chandra bala`, () => {
      const p = compute(key)

      if (rec['Disha Shoola']) {
        expect(p.extras.dishaShoola.en.toLowerCase()).toBe(clean(rec['Disha Shoola']))
      }

      if (rec['Tara Bala']) {
        const refIdx = listToIndexes(rec['Tara Bala'], NAK_ALIASES)
        expect(refIdx.every((i) => i >= 0), `unknown nakshatra token in ${rec['Tara Bala']}`).toBe(true)
        const ourIdx = p.extras.taraBala.map((x) => x.index - 1)
        expect(sortNums(ourIdx)).toEqual(sortNums(refIdx))
      }

      if (rec['Chandra Bala']) {
        const refIdx = listToIndexes(rec['Chandra Bala'], RASHI_ALIASES)
        expect(refIdx.every((i) => i >= 0), `unknown rashi token in ${rec['Chandra Bala']}`).toBe(true)
        const ourIdx = p.extras.chandraBala.map((x) => x.index)
        expect(sortNums(ourIdx)).toEqual(sortNums(refIdx))
      }
    })
  }
})

describe('panchang extras focused checks', () => {
  it('2026-09-29: Moon in Ashwini / Mesha — exact lists', () => {
    const p = compute('29-09-2026')
    expect(p.extras.dishaShoola).toMatchObject({ key: 'north', en: 'North' })
    // 18 janma nakshatras favourable (excludes Vipat/Pratyari/Vadha)
    expect(p.extras.taraBala.length).toBe(18)
    const taraEn = p.extras.taraBala.map((x) => x.en)
    expect(taraEn).toContain('Ashwini')
    expect(taraEn).not.toContain('Rohini') // Vadha group
    expect(taraEn).not.toContain('Ardra') // Pratyari group
    expect(taraEn).not.toContain('Pushya') // Vipat group
    // Chandra bala: Mesha, Mithuna, Karka, Tula, Vrischika, Kumbha
    expect(p.extras.chandraBala.map((x) => x.en)).toEqual(['Aries', 'Gemini', 'Cancer', 'Libra', 'Scorpio', 'Aquarius'])
  })

  it('tara group boundary: same star = Janma (included), 3rd ahead excluded', () => {
    const p = compute('29-09-2026')
    const byEn = Object.fromEntries(p.extras.taraBala.map((x) => [x.en, x.tara]))
    expect(byEn['Ashwini']).toBe(1) // Janma
    expect(byEn['Bharani']).toBe(9) // Parama Mitra
    expect(byEn['Krittika']).toBe(8) // Mitra
    expect(byEn['Mrigashira']).toBe(6) // Sadhaka
  })
})
