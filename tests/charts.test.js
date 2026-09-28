// @vitest-environment jsdom
// tests/charts.test.js — Phase 7 verification of the SVG chart builders.
// Run with: npm test
import { describe, expect, it } from 'vitest'
import { buildNorthChart, buildSouthChart } from '../src/charts.js'

// Sample-chart fixture (same values as tests/astro.test.js).
const KUNDLI = {
  ayanamsa: 23.72255,
  ascendant: { key: 'asc', short: 'Asc', rashi: 5, degInSign: 7.02 },
  planets: [
    { key: 'sun', short: 'Su', rashi: 1, house: 9, retro: false },
    { key: 'moon', short: 'Mo', rashi: 9, house: 5, retro: false },
    { key: 'mars', short: 'Ma', rashi: 10, house: 6, retro: false },
    { key: 'mercury', short: 'Me', rashi: 0, house: 8, retro: true },
    { key: 'jupiter', short: 'Ju', rashi: 2, house: 10, retro: false },
    { key: 'venus', short: 'Ve', rashi: 11, house: 7, retro: false },
    { key: 'saturn', short: 'Sa', rashi: 9, house: 5, retro: true },
    { key: 'rahu', short: 'Ra', rashi: 9, house: 5, retro: true },
    { key: 'ketu', short: 'Ke', rashi: 3, house: 11, retro: true },
  ],
}

const META = {
  name: 'Radha',
  dateText: '15 May 1990',
  timeText: '14:30:00',
  placeText: 'Varanasi',
}

describe('North Indian chart (SVG)', () => {
  const svg = buildNorthChart(KUNDLI)

  it('builds a responsive svg with 12 houses', () => {
    expect(svg.getAttribute('viewBox')).toBe('0 0 360 360')
    expect(svg.getAttribute('data-chart')).toBe('north')
    expect(svg.querySelectorAll('[data-house]')).toHaveLength(12)
  })

  it('puts planets in the right houses (rashi numbers follow the lagna)', () => {
    const house = (n) => svg.querySelector(`[data-house="${n}"]`).textContent
    expect(house(1)).toContain('Asc')
    expect(house(1)).toContain('6') // lagna Kanya = rashi 6
    expect(house(9)).toContain('Su')
    expect(house(9)).toContain('2') // house 9 → Vrishabha (rashi 2)
    expect(house(5)).toContain('Mo')
    expect(house(5)).toContain('Sa(R)')
    expect(house(5)).toContain('Ra(R)')
    expect(house(12).trim()).toBe('5') // only the rashi number, nothing else
  })

  it('marks retrogrades with (R) — four of them in this chart', () => {
    const text = svg.textContent
    const count = (text.match(/\(R\)/g) ?? []).length
    expect(count).toBe(4) // Me, Sa, Ra, Ke
  })
})

describe('South Indian chart (SVG)', () => {
  const svg = buildSouthChart(KUNDLI, META)

  it('builds the fixed 4×4 rashi grid', () => {
    expect(svg.getAttribute('data-chart')).toBe('south')
    expect(svg.querySelectorAll('[data-rashi]')).toHaveLength(12)
    // Fixed positions: Pisces top-left, Aries 2nd cell top row, Sagittarius bottom-left.
    expect(svg.querySelector('[data-rashi="11"]').getAttribute('transform')).toBe('translate(0, 0)')
    expect(svg.querySelector('[data-rashi="0"]').getAttribute('transform')).toBe('translate(90, 0)')
    expect(svg.querySelector('[data-rashi="8"]').getAttribute('transform')).toBe('translate(0, 270)')
  })

  it('places planets in their rashi cells and marks the lagna', () => {
    expect(svg.querySelector('[data-rashi="1"]').textContent).toContain('Su')
    expect(svg.querySelector('[data-rashi="9"]').textContent).toContain('Sa(R)')
    const lagnaCell = svg.querySelector('[data-rashi="5"]')
    expect(lagnaCell.textContent).toContain('Asc')
    expect(lagnaCell.querySelector('.lagna-mark')).toBeTruthy()
  })

  it('shows the birth details in the centre box', () => {
    const center = svg.querySelector('.center-info').textContent
    expect(center).toContain('Radha')
    expect(center).toContain('15 May 1990')
    expect(center).toContain('14:30:00')
    expect(center).toContain('Varanasi')
  })
})
