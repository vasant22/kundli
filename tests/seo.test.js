// tests/seo.test.js — SEO essentials for the three tool pages (30 Sep 2026, GSC cycle).
// Guards: robots.txt + sitemap.xml + per-page title/description/keywords/canonical/JSON-LD.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

const PAGES = [
  { file: 'index.html', title: /Free कुंडली बनाएं/, canonical: 'https://kundli.mybapuji.com/' },
  { file: 'match/index.html', title: /Free कुंडली मिलान/, canonical: 'https://kundli.mybapuji.com/match/' },
  { file: 'panchang/index.html', title: /Free पंचांग/, canonical: 'https://kundli.mybapuji.com/panchang/' },
  { file: 'bnn/index.html', title: /Free BNN चार्ट/, canonical: 'https://kundli.mybapuji.com/bnn/' },
]

describe('SEO essentials — कुंडली / मिलान / पंचांग / BNN', () => {
  it('BNN FAQ स्वतंत्र description देता है — किसी व्यक्ति/क्लास का नाम नहीं (user 2026-10-07e)', () => {
    const html = read('bnn/index.html')
    expect(html).not.toMatch(/Gemini|Selvam|सुलूर|गोस्वामी|sir/i)
    expect(html).toContain('नाड़ी-परंपरा')
  })

  it('robots.txt allows crawling and points to the sitemap', () => {
    const robots = read('public/robots.txt')
    expect(robots).toMatch(/User-agent: \*/)
    expect(robots).toMatch(/Sitemap: https:\/\/kundli\.mybapuji\.com\/sitemap\.xml/)
  })

  it('sitemap.xml lists all four pages', () => {
    const sitemap = read('public/sitemap.xml')
    for (const url of PAGES.map((p) => p.canonical)) {
      expect(sitemap).toContain(`<loc>${url}</loc>`)
    }
  })

  for (const page of PAGES) {
    it(`${page.file}: title/description/keywords/canonical + valid JSON-LD`, () => {
      const html = read(page.file)
      expect(page.title.test(html)).toBe(true)
      expect(html).toContain(`rel="canonical" href="${page.canonical}"`)
      expect(html).toMatch(/name="description"/)
      expect(html).toMatch(/name="keywords"/)
      expect(html).toMatch(/name="robots"/)

      const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
      expect(m).toBeTruthy()
      const data = JSON.parse(m[1])
      const types = data['@graph'].map((x) => x['@type'])
      expect(types).toContain('WebApplication')
      expect(types).toContain('FAQPage')
    })

    it(`${page.file}: static SEO section with Free keywords (works without JS)`, () => {
      const html = read(page.file)
      expect(html).toMatch(/class="seo-info"/)
      expect(html).toMatch(/Free/)
      expect(html).toMatch(/seo-links/)
      expect((html.match(/<details class="faq-item">/g) || []).length).toBeGreaterThanOrEqual(3)
      expect((html.match(/<summary>/g) || []).length).toBeGreaterThanOrEqual(3)
      expect(html.indexOf('aria-label="और मुफ़्त टूल"')).toBeGreaterThan(html.lastIndexOf('</details>'))
    })
  }
})

describe('ज्योतिष किताबें + Amazon sponsored block (30 Sep 2026)', () => {
  for (const page of PAGES) {
    it(`${page.file}: free-books block + affiliate links`, () => {
      const html = read(page.file)
      expect(html).toContain('ज्योतिष संबंधित किताबें')
      expect(html).toContain('pdf-jyotish-books-hindi-vedic-astrology-free-download')
      expect(html).toContain('सभी हिंदी किताबें')
      expect(html).toContain('rel="nofollow sponsored noopener"')
      expect(html).toContain('tag=krishna220af-21')
      expect((html.match(/tag=krishna220af-21/g) || []).length).toBeGreaterThanOrEqual(5)
      expect(html).toContain('आपके लिए चुनी किताबें')
    })
  }
})
