// tests/phal-doshas.test.js — मंगल दोष, कालसर्प, गुरु-चांडाल.
// मंगल दोष must agree with mangaldosha.js (the matching page's function).
import { describe, expect, it } from 'vitest'
import { makeFrame } from '../src/phal/frame.js'
import { checkMangalDosha } from '../src/mangaldosha.js'
import { detectDoshas, guruChandal, kaalSarpa, mangalDosha } from '../src/phal/doshas.js'

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

const SPREAD = {
  sun: 10, moon: 3, mars: 5, mercury: 5, jupiter: 1, venus: 11, saturn: 9, rahu: 6, ketu: 0,
}

describe('मंगल दोष — the five houses of mangaldosha.js', () => {
  const houseOfMars = (house) => {
    const rashi = (0 + house - 1) % 12 // Mesha lagna
    return chart(0, { ...SPREAD, mars: rashi })
  }

  it('counts houses 1, 4, 7, 8 and 12 from the lagna', () => {
    for (const h of [1, 4, 7, 8, 12]) {
      expect(mangalDosha(houseOfMars(h)).fromLagna).toBe(true)
    }
    for (const h of [2, 3, 5, 6, 9, 10, 11]) {
      expect(mangalDosha(houseOfMars(h)).fromLagna).toBe(false)
    }
  })

  it('never disagrees with mangaldosha.js', () => {
    for (const h of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const frame = houseOfMars(h)
      const site = checkMangalDosha(frame.kundli)
      const ours = mangalDosha(frame)
      expect(ours.present).toBe(site.present)
      expect(ours.severity).toBe(site.severity)
      expect(ours.fromLagna).toBe(site.fromLagna)
      expect(ours.fromMoon).toBe(site.fromMoon)
      expect(ours.marsHouse).toBe(site.lagnaHouse)
    }
  })

  it('severity low from one chart, high when both lagna and Moon agree', () => {
    // Mars in the 4th from the lagna and the Moon both in Mesha → both true
    const both = chart(0, { ...SPREAD, moon: 0, mars: 3 })
    expect(mangalDosha(both).severity).toBe('high')
    const one = chart(0, { ...SPREAD, moon: 7, mars: 3 }) // Mars is the 9th from the Moon
    expect(mangalDosha(one).severity).toBe('low')
  })

  it('adds the traditional nivaran notes for own sign / exaltation', () => {
    const own = mangalDosha(chart(0, { ...SPREAD, mars: 0 })) // Mars in Mesha, house 1
    expect(own.notes.map((n) => n.key)).toContain('ownSign')
    const ex = mangalDosha(chart(0, { ...SPREAD, moon: 0, mars: 9 })) // Makara — the 10th from both, so no dosha
    expect(ex.notes.length).toBe(0)
    const exDosha = mangalDosha(chart(9, { ...SPREAD, mars: 9 })) // Makara lagna → Mars in the 1st
    expect(exDosha.notes.map((n) => n.key)).toContain('exalted')
  })
})

describe('कालसर्प', () => {
  it('बनता है when all seven grahas are on one side', () => {
    const frame = chart(0, { ...SPREAD, rahu: 0, ketu: 6, sun: 1, moon: 2, mars: 2, mercury: 3, jupiter: 4, venus: 5, saturn: 5 })
    const res = kaalSarpa(frame)
    expect(res.present).toBe(true)
    expect(res.side).toBe('rahu-to-ketu')
    expect(res.label).toBe('आधुनिक मान्यता')
  })

  it('नहीं बनता when a graha is on the other side', () => {
    const frame = chart(0, { ...SPREAD, rahu: 0, ketu: 6, sun: 1, moon: 2, mars: 2, mercury: 3, jupiter: 7, venus: 5, saturn: 5 })
    expect(kaalSarpa(frame).present).toBe(false)
    expect(kaalSarpa(frame).reason).toBe('both-sides')
  })

  it('a graha exactly on the axis disables the yoga', () => {
    const frame = chart(0, { ...SPREAD, rahu: 0, ketu: 6, sun: 1, moon: 2, mars: 2, mercury: 3, jupiter: 6, venus: 4, saturn: 5 })
    const res = kaalSarpa(frame)
    expect(res.present).toBe(false)
    expect(res.reason).toBe('on-axis')
  })
})

describe('गुरु-चांडाल', () => {
  it('बनता है when Jupiter and Rahu share a rashi', () => {
    const res = guruChandal(chart(0, { ...SPREAD, jupiter: 4, rahu: 4 }))
    expect(res.present).toBe(true)
    expect(res.label).toBe('परवर्ती मान्यता')
    expect(res.house).toBe(5)
  })
  it('नहीं बनता otherwise', () => {
    expect(guruChandal(chart(0, { ...SPREAD, jupiter: 4, rahu: 5 })).present).toBe(false)
  })
})

describe('detectDoshas', () => {
  it('returns all three blocks', () => {
    const res = detectDoshas(chart(0, SPREAD))
    expect(Object.keys(res).sort()).toEqual(['guruChandal', 'kaalSarpa', 'mangal'])
    expect(res.mangal.houses).toEqual([1, 4, 7, 8, 12])
  })
})
