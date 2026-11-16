// tests/phal-online.test.js — online section की लागत और print=1 का व्यवहार (टास्क 05)
//
// jsdom में asli WASM/IntersectionObserver नहीं चलते, इसलिए यहाँ source-स्तर की
// पक्की जाँच है: chunk तभी load हो, print=1 पर print खुले, और styles उसी chunk के साथ आएँ.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')
const main = read('src/main.js')
const phalMain = read('src/phal/main.js')
const online = read('src/phal/online.js')

describe('lazy-load — section तक scroll से पहले कुछ नहीं', () => {
  it('main.js में फलादेश का कोई static import नहीं', () => {
    expect(main).not.toMatch(/from ['"]\.\/phal\//)
    expect(main).toContain("import('./phal/online.js')")
  })

  it('कुंडली बनते ही फलादेश load — scroll का इंतज़ार नहीं (टास्क 06-ख)', () => {
    // अब observer नहीं: beginPhalOnline का अंत सीधे start() से होता है
    expect(main).not.toContain('IntersectionObserver')
    expect(main).not.toContain('rootMargin')
    expect(main).toMatch(/\/\/ टास्क 06-ख[\s\S]*start\(\)\n\}/)
  })

  it('तीनों PDF बटन एक ही फलादेश-PDF देते हैं (print=1)', () => {
    // (क) पहला बटन (window.open) (ख) phal-btn का link (ग) online section का pdfHref
    const hits = (main.match(/&print=1/g) ?? []).length
    expect(hits).toBeGreaterThanOrEqual(2)
    expect(main).toContain("window.open(`${phalUrl(values, phalConv, phalCoords)}&print=1`")
    expect(main).toContain('phalLink.href = `${phalUrl(values, phalConv, phalCoords)}&print=1`')
    expect(main).toContain("pdfHref: `${phalUrl(values, conversion, coords)}&print=1`")
    expect(main).toContain("t('btn.phalPdfSave')")
  })

  it('/kundli-phal/ पर report बनते ही "तैयार हो रहा है…" छिपता है', () => {
    const css = read('src/phal/phal.css')
    expect(css).toContain('.phal-doc.ready .loading { display: none; }')
  })

  it('report/viz/text का भारी code online chunk में ही है', () => {
    expect(online).toContain("from './report.js'")
    expect(online).toContain("from './index.js'")
    expect(online).toContain("import './phal.css'")
    // main.js में buildPhalData कहीं नहीं
    expect(main).not.toContain('buildPhalData')
  })
})

describe('PDF बटन और print=1', () => {
  it('बटन का link print=1 के साथ बनता है', () => {
    expect(main).toContain('&print=1')
    expect(online).toContain('pdfHref')
    expect(online).toContain('target="_blank"')
  })

  it('print=1 पर fonts/चित्र तैयार होने के बाद print ख़ुद खुलता है', () => {
    expect(phalMain).toContain("params.get('print') === '1'")
    expect(phalMain).toContain('await waitForAssets()')
    expect(phalMain).toContain('window.print()')
    // print=1 में ऊपर की पट्टी नहीं दिखती
    expect(phalMain).toContain('bar.hidden = wantsPrint')
  })

  it('fonts तैयार होने का इंतज़ार + सारे चित्र', () => {
    expect(phalMain).toContain('document.fonts.ready')
    expect(phalMain).toContain('document.images')
  })
})

describe('English mode की सूचना', () => {
  it('i18n में नोट मौजूद है और online.js उसे दिखाता है', () => {
    const i18n = read('src/i18n.js')
    expect(i18n).toContain('phal.englishNote')
    expect(i18n).toContain('विस्तृत फलादेश अभी केवल हिंदी में उपलब्ध है।')
    expect(online).toContain('hindiOnlyNote')
  })
})
