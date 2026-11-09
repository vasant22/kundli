// tests/bnn-help-course.test.js — राउंड 65 / टास्क 04-ख (4-11-2026)
//
// सहायता की खिड़की में "BNN ज्योतिष सीखें — निःशुल्क course" का link **ऐप में तय नहीं** है;
// वह server की version.json के `courseUrl` खेत से आता है। नियम: ख़ाली/ग़ैर-मौजूद/ग़लत
// domain → link नहीं दिखता; ठीक `https://mybapuji.com/…` → दिखता है; version.json न मिले
// (fetch विफल) → कुछ नहीं होता (link नहीं)। यहाँ असली app/help.js को jsdom में चलाकर
// चारों हालतें जाँची जाती हैं।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const HELP = path.resolve(__dirname, '../../../bnn-kundli-windows/app/help.js')
const hasHelp = fs.existsSync(HELP)

function boot() {
  const dom = new JSDOM('<!doctype html><html><body><button id="btnHelp">? सहायता</button></body></html>', { url: 'http://localhost/' })
  const w = dom.window
  const code = fs.readFileSync(HELP, 'utf8')
  // help.js एक classic script है — नक़ली window/document पर चलाओ
  new Function('window', 'document', code)(w, w.document)
  w.BNNHelp.open()
  return w
}

function renderCase(courseUrl) {
  const w = boot()
  w.BNNHelp.setCourseUrl(courseUrl)
  w.BNNHelp.refresh()
  const pane = w.document.getElementById('helpPane')
  const link = w.document.getElementById('helpCourseLink')
  const out = { hasLink: !!link, href: link ? link.getAttribute('href') : null, html: pane.innerHTML }
  w.close()
  return out
}

describe.runIf(hasHelp)('सहायता — course link (version.json से)', () => {
  it('ख़ाली / न हो → link नहीं दिखता', () => {
    expect(renderCase('').hasLink).toBe(false)
    expect(renderCase(null).hasLink).toBe(false)
    expect(renderCase(undefined).hasLink).toBe(false)
  })

  it('ठीक https://mybapuji.com/… → link दिखता है, वही URL', () => {
    const r = renderCase('https://mybapuji.com/bnn-jyotish-course/')
    expect(r.hasLink).toBe(true)
    expect(r.href).toBe('https://mybapuji.com/bnn-jyotish-course/')
  })

  it('ग़लत domain / http / जगह-जगह → link नहीं दिखता', () => {
    for (const u of ['https://evil.com/x', 'http://mybapuji.com/x', 'https://mybapuji.com.evil.com/x', 'javascript:alert(1)', 'mybapuji.com/x']) {
      expect(renderCase(u).hasLink, u).toBe(false)
    }
  })

  it('fetch विफल (कुछ न आया) → link नहीं, बाक़ी सहायता पूरी', () => {
    const w = boot()
    // कुछ भी set किए बिना — जैसे version.json न मिला हो
    const pane = w.document.getElementById('helpPane')
    expect(w.document.getElementById('helpCourseLink')).toBeNull()
    // राउंड 67 / टास्क 12: सूची में सबसे ऊपर “इस संस्करण में नया” आ गया — बाक़ी सहायता वैसी ही है
    expect(w.document.getElementById('helpT_naya')).toBeTruthy()
    w.document.getElementById('helpT_naya').click()
    expect(pane.textContent).toContain('नई कुंडली बनाना')      // सामग्री दिख रही है
    expect(pane.textContent).toContain('info@mybapuji.com')    // संपर्क तो रहता ही है
    w.close()
  })

  it('बाद में link आ जाए (खिड़की खुली हो) तो तुरंत दिख जाता है', () => {
    const w = boot()
    expect(w.document.getElementById('helpCourseLink')).toBeNull()
    w.BNNHelp.setCourseUrl('https://mybapuji.com/bnn-jyotish-course/')
    expect(w.document.getElementById('helpCourseLink')).not.toBeNull()
    w.close()
  })
})

describe.runIf(hasHelp)('सहायता — फ़ोकस खिड़की के अंदर ही घूमता है', () => {
  it('Tab आख़िरी से पहले पर, Shift+Tab पहले से आख़िरी पर (Esc से बंद)', () => {
    const w = boot()
    const doc = w.document
    const modal = doc.getElementById('helpModal')
    const focusables = [...modal.querySelectorAll('button, a[href]')].filter((e) => !e.disabled)
    expect(focusables.length).toBeGreaterThan(3)
    const first = focusables[0], last = focusables[focusables.length - 1]
    // पहले पर Shift+Tab → आख़िरी
    first.focus()
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    expect(doc.activeElement).toBe(last)
    // आख़िरी पर Tab → पहला
    last.focus()
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(doc.activeElement).toBe(first)
    // Esc → बंद, और फ़ोकस "? सहायता" बटन पर
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(doc.getElementById('helpModal').hidden).toBe(true)
    expect(doc.activeElement.id).toBe('btnHelp')
    w.close()
  })
})
