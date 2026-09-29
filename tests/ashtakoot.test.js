// tests/ashtakoot.test.js — Ashtakoot Guna Milan (36 points).
// Part 1: unit tests for each koota's rules + edge cases.
// Part 2: full-fixture regression — every koota value and the total for ~250
// birth pairs, calibrated against the industry-standard reference calculator
// (see tests/fixtures/ashtakoot-calibration.json, generated 2026-09-29).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { areFriends, bhakootNivaran, computeAshtakoot, vashyaGroup } from '../src/ashtakoot.js'

// { rashi, degInSign, nakshatra, pada } — the fields Ashtakoot needs.
const moon = (rashi, degInSign, nakshatra, pada) => ({ rashi, degInSign, nakshatra, pada })

// A few births used as documented examples (values verified against the
// reference calculator on 2026-09-29 — see scripts/calib/).
const ASHWINI = moon(0, 6.685, 1, 1) // Mesha / Ashwini
const BHARANI = moon(0, 20.036, 2, 3) // Mesha / Bharani
const ROHINI = moon(1, 16.673, 4, 2) // Vrishabha / Rohini
const ARDRA = moon(2, 13.321, 6, 2) // Mithuna / Ardra
const PUSHYA = moon(3, 9.961, 8, 3) // Karka / Pushya
const PUNARVASU_KARKA = moon(3, 1.701, 7, 4) // Karka / Punarvasu (end)
const PURVA_PHALGUNI = moon(4, 20.022, 11, 2) // Simha / Purva Phalguni
const ANURADHA = moon(7, 9.997, 17, 2) // Vrishchika / Anuradha

// helpers to read one koota from the result
const byKey = (r) => Object.fromEntries(r.kootas.map((k) => [k.key, k.points]))
const pointsOf = (r) => r.kootas.map((k) => k.points)

describe('Ashtakoot — individual rules', () => {
  it('same stars (Ashwini–Ashwini): per-koota and total', () => {
    const r = computeAshtakoot(ASHWINI, ASHWINI)
    expect(byKey(r)).toMatchObject({ varna: 1, vashya: 2, tara: 3, yoni: 4, maitri: 5, gana: 6, bhakoot: 7, nadi: 0 })
    expect(r.total).toBe(28)
    expect(r.verdict.key).toBe('good')
  })

  it('Ashwini boy – Bharani girl', () => {
    const r = computeAshtakoot(ASHWINI, BHARANI)
    expect(byKey(r)).toMatchObject({ varna: 1, vashya: 2, tara: 3, yoni: 2, maitri: 5, gana: 6, bhakoot: 7, nadi: 8 })
    expect(r.total).toBe(34)
    expect(r.verdict.key).toBe('excellent')
  })

  it('Bharani boy – Punarvasu (Karka) girl', () => {
    const r = computeAshtakoot(BHARANI, PUNARVASU_KARKA)
    expect(byKey(r)).toMatchObject({ varna: 0, vashya: 1, tara: 1.5, yoni: 3, maitri: 4, gana: 5, bhakoot: 7, nadi: 8 })
    expect(r.total).toBe(29.5)
    expect(r.verdict.key).toBe('good')
  })

  it('Vashya: half-sign splits (Dhanu 2nd half = Chatushpada, Makar 2nd = Jalachara)', () => {
    const dhanu2 = moon(8, 22.5, 20, 3)
    const makar1 = moon(9, 7.5, 21, 1)
    const makar2 = moon(9, 22.5, 22, 3)
    expect(vashyaGroup(dhanu2.rashi, dhanu2.degInSign)).toBe('chatushpada')
    expect(vashyaGroup(makar1.rashi, makar1.degInSign)).toBe('chatushpada')
    expect(vashyaGroup(makar2.rashi, makar2.degInSign)).toBe('jalachara')
    // Dhanu-2 (C) boy – Makar-2 (J) girl → 1 point
    expect(byKey(computeAshtakoot(dhanu2, makar2)).vashya).toBe(1)
    // Dhanu-2 (C) boy – Makar-1 (C) girl → 2 points
    expect(byKey(computeAshtakoot(dhanu2, makar1)).vashya).toBe(2)
  })

  it('Vashya: known spreadsheet cells', () => {
    expect(byKey(computeAshtakoot(ARDRA, PUSHYA)).vashya).toBe(0.5) // Manava → Jalachara
    expect(byKey(computeAshtakoot(PUSHYA, ARDRA)).vashya).toBe(0.5) // Jalachara → Manava
    expect(byKey(computeAshtakoot(PURVA_PHALGUNI, ANURADHA)).vashya).toBe(0) // Vanachara → Keeta
    expect(byKey(computeAshtakoot(ANURADHA, ASHWINI)).vashya).toBe(1) // Keeta → Chatushpada
  })

  it('Tara: bad counts {3,5,7} give 0 for that direction', () => {
    // Ashwini → Rohini = 3 steps from boy: girl side good?? verified: 1.5 total (one side bad)
    expect(byKey(computeAshtakoot(ASHWINI, ROHINI)).tara).toBe(1.5)
    // Ashwini → Ashlesha (nak 9): d = 8 (good both ways) — verified 3
    expect(byKey(computeAshtakoot(ASHWINI, moon(3, 23.343, 9, 3))).tara).toBe(3)
  })

  it('Bhakoot: dosha pairs {2/12, 5/9, 6/8} and the nivaran note', () => {
    const np = (a, b) => byKey(computeAshtakoot(a, b))
    expect(np(ASHWINI, ROHINI).bhakoot).toBe(0) // Mesha–Vrishabha 2/12
    expect(np(ASHWINI, moon(4, 6.7, 10, 1)).bhakoot).toBe(0) // Mesha–Simha 5/9
    expect(np(ASHWINI, ANURADHA).bhakoot).toBe(0) // Mesha–Vrishchika 6/8
    expect(np(ASHWINI, PUSHYA).bhakoot).toBe(7) // Mesha–Karka 4/10
    // nivaran note (informational only, score unchanged): same lord
    expect(bhakootNivaran(0, 7)).toBe('same-lord') // Mesha & Vrishchika (Mars)
    expect(bhakootNivaran(2, 1)).toBe('friend-lords') // Mithuna & Vrishabha (Mercury–Venus friends)
    expect(bhakootNivaran(4, 9)).toBe(null) // Simha–Makar (Sun–Saturn enemies)
    expect(areFriends('mercury', 'venus')).toBe(true)
    expect(areFriends('sun', 'saturn')).toBe(false)
  })

  it('Nadi: same nadi → 0 else 8', () => {
    expect(byKey(computeAshtakoot(ASHWINI, moon(2, 13.3, 6, 2))).nadi).toBe(0) // both Aadi
    expect(byKey(computeAshtakoot(ASHWINI, BHARANI)).nadi).toBe(8)
  })
})

describe('Ashtakoot — full calibration fixture (reference calculator)', () => {
  const fixtures = JSON.parse(
    readFileSync(fileURLToPath(new URL('./fixtures/ashtakoot-calibration.json', import.meta.url)), 'utf8')
  )

  it(`has a complete fixture set (${fixtures.length} pairs)`, () => {
    expect(fixtures.length).toBeGreaterThan(200)
  })

  it('matches every koota value and total for every fixture pair', () => {
    let checked = 0
    const failures = []
    for (const f of fixtures) {
      const r = computeAshtakoot(f.boy, f.girl)
      const got = byKey(r)
      for (const k of ['varna', 'vashya', 'tara', 'yoni', 'maitri', 'gana', 'bhakoot', 'nadi']) {
        checked++
        if (got[k] !== f.expected[k]) {
          failures.push(`${f.tag} ${k}: mine=${got[k]} reference=${f.expected[k]}`)
        }
      }
      if (r.total !== f.expected.total) failures.push(`${f.tag} total: mine=${r.total} reference=${f.expected.total}`)
    }
    expect(failures.slice(0, 20)).toEqual([])
    expect(checked).toBeGreaterThan(1600)
  })
})
