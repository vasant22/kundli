// @vitest-environment jsdom
// tests/match.test.js — Kundli Matching page (/match/).
// Phase 1: page shell + site navigation. Extended in later phases
// (two-step form, Ashtakoot table, Mangal Dosha, report).
import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>'
  await import('../src/match.js')
})

const $ = (sel) => document.querySelector(sel)

describe('Phase 1 — Kundli Matching page shell', () => {
  it('renders the heading and intro in Hindi by default', () => {
    expect($('#app h1').textContent).toBe('कुंडली मिलान')
    expect($('.match-intro-card').textContent).toContain('अष्टकूट')
    expect(document.documentElement.lang).toBe('hi')
  })

  it('has the site navigation (कुंडली ⇄ कुंडली मिलान)', () => {
    const links = document.querySelectorAll('.site-nav a')
    expect(links.length).toBe(2)
    expect(links[0].textContent).toBe('कुंडली')
    expect(links[0].getAttribute('href')).toBe('../')
    expect(links[1].textContent).toBe('कुंडली मिलान')
    expect(links[1].classList.contains('active')).toBe(true)
  })

  it('switches to English with the language toggle and back', () => {
    $('#lang-toggle').click()
    expect(document.documentElement.lang).toBe('en')
    expect($('#app h1').textContent).toBe('Kundli Matching')
    expect(document.title).toContain('Kundli Matching')
    $('#lang-toggle').click()
    expect($('#app h1').textContent).toBe('कुंडली मिलान')
  })

  it('keeps the shared footer (privacy note + credits)', () => {
    const footer = document.querySelector('.site-footer')
    expect(footer.textContent).toContain('ब्राउज़र में ही रहता है')
    expect(footer.querySelector('.footer-source').getAttribute('href')).toContain('github.com')
    expect(footer.querySelector('a[href*="astro.com"]').textContent).toBe('Swiss Ephemeris')
  })
})
