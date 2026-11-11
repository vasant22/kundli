// tests/phal-ratna.test.js — रत्न-तालिका और "किसे नहीं पहनना" की चेतावनी।
import { describe, expect, it } from 'vitest'
import { makeFrame } from '../src/phal/frame.js'
import { GEMS, gemFor, ownsDusthanaOnly, weakPlanetList } from '../src/phal/gems.js'
import { ratnaFor } from '../src/phal/ratna.js'

const ALL = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']

function chart(lagnaRashi, positions) {
  const planets = ALL.map((key) => {
    const rashi = positions[key]
    return {
      key, rashi, degInSign: 10, house: ((rashi - lagnaRashi + 12) % 12) + 1,
      longitude: rashi * 30 + 10, nakshatra: 1, pada: 1, speed: 1, retro: false, navamsaRashi: rashi,
    }
  })
  return makeFrame({ ascendant: { rashi: lagnaRashi, longitude: 5 }, planets })
}

const SPREAD = { sun: 10, moon: 3, mars: 5, mercury: 5, jupiter: 1, venus: 11, saturn: 9, rahu: 6, ketu: 0 }

describe('the gem table', () => {
  it('has the nine classical gems', () => {
    expect(Object.keys(GEMS).length).toBe(9)
    expect(GEMS.sun.hi).toBe('माणिक्य')
    expect(GEMS.moon.hi).toBe('मोती')
    expect(GEMS.mars.hi).toBe('मूंगा')
    expect(GEMS.mercury.hi).toBe('पन्ना')
    expect(GEMS.jupiter.hi).toBe('पुखराज')
    expect(GEMS.venus.hi).toContain('हीरा')
    expect(GEMS.venus.hi).toContain('ओपल')
    expect(GEMS.saturn.hi).toBe('नीलम')
    expect(GEMS.rahu.hi).toBe('गोमेद')
    expect(GEMS.ketu.hi).toBe('लहसुनिया')
    expect(gemFor('sun').en).toBe('Ruby')
    expect(gemFor('nope')).toBe(null)
  })
})

describe('ownsDusthanaOnly', () => {
  it('flags a graha owning 6/8/12 without 1/5/9', () => {
    // Mesha lagna: Mercury owns 3 and 6
    expect(ownsDusthanaOnly(chart(0, SPREAD), 'mercury')).toBe(true)
    // Saturn owns 10 and 11 — clean
    expect(ownsDusthanaOnly(chart(0, SPREAD), 'saturn')).toBe(false)
  })
  it('does not flag a graha that also owns a good house', () => {
    // Mesha lagna: Mars owns 1 and 8 → 8 is a dusthana but 1 is good
    expect(ownsDusthanaOnly(chart(0, SPREAD), 'mars')).toBe(false)
    // Jupiter owns 9 and 12 → 9 is good
    expect(ownsDusthanaOnly(chart(0, SPREAD), 'jupiter')).toBe(false)
  })
})

describe('ratnaFor', () => {
  it('picks the lagnesh, the 9th lord and the 5th lord', () => {
    const frame = chart(0, SPREAD) // Mesha lagna
    const res = ratnaFor(frame)
    expect(res.lagnesh).toBe('mars')
    expect(res.ninthLord).toBe('jupiter')
    expect(res.fifthLord).toBe('sun')
    expect(res.jeevan.planet).toBe('mars')
    expect(res.jeevan.gem.hi).toBe('मूंगा')
    expect(res.jeevan.roleHi).toContain('जीवन रत्न')
    expect(res.bhagya.gem.hi).toBe('पुखराज')
    expect(res.karak.gem.hi).toBe('माणिक्य')
    expect(res.jeevan.houses).toEqual([1, 8])
  })

  it('carries the warning flag together with the houses', () => {
    // Simha lagna → 6th lord Saturn (Makara) — warned
    const res = ratnaFor(chart(4, SPREAD))
    expect(res.jeevan.warning).toBe(false) // Sun owns only the 1st
    expect(res.lagnesh).toBe('sun')
  })
})

describe('weakPlanetList', () => {
  it('collects debilitated / combust / low-strength grahas with reasons', () => {
    const frame = chart(0, SPREAD)
    const positions = {
      sun: { dignity: { level: 'debilitated' }, combustion: { combust: false } },
      moon: { dignity: { level: 'sama' }, combustion: { combust: true } },
      mars: { dignity: { level: 'own' }, combustion: { combust: false } },
    }
    const strength = { planets: { mars: { total: 8 } } }
    const list = weakPlanetList({ frame, positions, strength })
    expect(list.find((w) => w.key === 'sun').reasons).toContain('नीच')
    expect(list.find((w) => w.key === 'moon').reasons).toContain('अस्त')
    expect(list.find((w) => w.key === 'mars').reasons[0]).toContain('विंशोपक')
  })

  it('is empty when nothing is weak', () => {
    const frame = chart(0, SPREAD)
    expect(weakPlanetList({ frame, positions: {}, strength: { planets: {} } })).toEqual([])
  })
})
