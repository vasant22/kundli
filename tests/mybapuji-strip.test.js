// @vitest-environment jsdom
// tests/mybapuji-strip.test.js — ऊपर की MyBapuji (मुख्य साइट) menu-पट्टी की जाँच।
import { describe, expect, it } from 'vitest'
import { mybapujiStripHTML } from '../src/mybapuji-strip.js'
import { t, setLang } from '../src/i18n.js'

describe('MyBapuji strip', () => {
  it('has the brand link + 5 main-site links with correct URLs', () => {
    const el = document.createElement('div')
    el.innerHTML = mybapujiStripHTML()
    const brand = el.querySelector('.mb-strip .brand')
    expect(brand.textContent).toContain('MyBapuji')
    expect(brand.getAttribute('href')).toBe('https://mybapuji.com/')
    const links = [...el.querySelectorAll('.mb-strip .mb-link')]
    expect(links.length).toBe(5)
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://mybapuji.com/',
      'https://mybapuji.com/hindi-pdf-e-book-download-for-free/',
      'https://mybapuji.com/blog/',
      'https://mybapuji.com/category/disease_diagnostics/',
      'https://mybapuji.com/video/',
    ])
  })

  it('labels are Hindi by default and switch to English', () => {
    setLang('hi')
    const el = document.createElement('div')
    el.innerHTML = mybapujiStripHTML()
    const fill = () =>
      el.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n) })
    fill()
    expect([...el.querySelectorAll('.mb-link')].map((a) => a.textContent)).toEqual([
      'होम', 'किताबें', 'ब्लॉग', 'इलाज', 'वीडियो',
    ])
    setLang('en')
    fill()
    expect([...el.querySelectorAll('.mb-link')].map((a) => a.textContent)).toEqual([
      'Home', 'Books', 'Blog', 'Treatment', 'Videos',
    ])
    setLang('hi') // बाक़ी tests के लिए वापस हिंदी
  })
})
