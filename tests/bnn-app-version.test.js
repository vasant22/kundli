// @vitest-environment jsdom
// tests/bnn-app-version.test.js — राउंड 67 / टास्क 12 (9-11-2026)
// संस्करण साफ़ दिखे: ऊपर की पट्टी में badge (v1.0.2), brand-डिब्बे में “संस्करण 1.0.2 · तारीख़”,
// भाषा के साथ बदले, और web पर पुरानी files दिखें तो “नया संस्करण … ताज़ा करें” की पट्टी।
// संस्करण कहीं हाथ से नहीं — सब `app/version.js` के APP_VERSION से।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP_DIR, 'app.js'))
// ⚠️ यह पंक्ति `hasApp` के बिना नहीं चलनी चाहिए — GitHub पर केवल `kundli` repo होता है,
// बगल का `bnn-kundli-windows` नहीं; वहाँ पहले ENOENT से पूरी file गिर जाती थी (CI fail, 9-11-2026)।
const VER = hasApp ? (() => {
  const s = fs.readFileSync(path.join(APP_DIR, 'version.js'), 'utf8')
  const m = /APP_VERSION = '([^']+)'/.exec(s)
  return m ? m[1] : ''
})() : ''

async function boot(opts = {}) {
  let html = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8')
  if (opts.date) html = html.replace('<meta name="bnn-build-date" content="">', `<meta name="bnn-build-date" content="${opts.date}">`)
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
  const w = dom.window
  w.BNN_PLACES = []; w.alert = () => {}; w.confirm = () => true; w.print = () => {}
  w.BNNEngine = { compute: async () => { throw new Error('STUB') }, transitNow: async () => null, specialTransit: async () => [] }
  w.fetch = async () => ({ ok: false, json: async () => null })      // version.json नहीं — चुपचाप
  w.eval(fs.readFileSync(path.join(APP_DIR, 'version.js'), 'utf8'))
  w.eval(fs.readFileSync(path.join(APP_DIR, 'help.js'), 'utf8'))       // सहायता की खिड़की (ऐप में <script> से)
  w.eval(fs.readFileSync(path.join(APP_DIR, 'app.js'), 'utf8'))
  await new Promise((r) => setTimeout(r, 40))
  if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 80))
  return w
}

describe.skipIf(!hasApp)('संस्करण दिखना (राउंड 67 / टास्क 12)', () => {
  it('ऊपर की पट्टी में badge = v + APP_VERSION (हाथ से लिखा अंक नहीं)', async () => {
    const w = await boot()
    const b = w.document.getElementById('appVerBadge')
    expect(VER).toMatch(/^\d+\.\d+\.\d+$/)
    expect(b.textContent).toBe('v' + VER)
    expect(b.hidden).toBe(false)
    expect(VER).toBe('1.0.2')                     // संस्करण-अंक इस टास्क में नहीं बदलता
    // शीर्षक (title) भी उसी स्रोत से
    expect(w.document.title).toBe('BNN Shakti ' + VER)
  })

  it('brand-डिब्बा: तारीख़ न मिले तो केवल संस्करण, मिले तो “संस्करण x · तारीख़”', async () => {
    let w = await boot()
    expect(w.document.getElementById('brandVer').textContent).toBe('संस्करण ' + VER)
    w = await boot({ date: '2026-11-09' })
    expect(w.document.getElementById('brandVer').textContent).toBe('संस्करण ' + VER + ' · 2026-11-09')
  })

  it('भाषा बदलने पर badge व brand-पंक्ति बदलती है', async () => {
    const w = await boot({ date: '2026-11-09' })
    w.document.getElementById('btnLang').click()
    await new Promise((r) => setTimeout(r, 120))
    expect(w.document.getElementById('brandVer').textContent).toBe('Version ' + VER + ' · 2026-11-09')
    expect(w.document.getElementById('appVerBadge').textContent).toBe('v' + VER)
  })

  it('पुरानी-cache की पट्टी: server का संस्करण नया हो तभी, “ताज़ा करें” बटन के साथ', async () => {
    const w = await boot()
    expect(w.document.getElementById('updBar')).toBeNull()
    w.BNN_showStaleBar('1.0.2')                    // बराबर — नहीं
    expect(w.document.getElementById('updBar')).toBeNull()
    w.BNN_showStaleBar('0.9.9')                    // पुराना — नहीं
    expect(w.document.getElementById('updBar')).toBeNull()
    const newer = VER.replace(/(\d+)$/, (m) => String(+m + 1))
    w.BNN_showStaleBar(newer)                      // नया — दिखे
    const bar = w.document.getElementById('updBar')
    expect(bar).toBeTruthy()
    expect(bar.textContent).toContain('v' + newer)
    expect(bar.textContent).toContain('ताज़ा करें')
    expect(w.document.getElementById('updReload')).toBeTruthy()
    w.BNN_showStaleBar(newer)
    expect(w.document.querySelectorAll('#updBar').length).toBe(1)   // दो बार नहीं
  })

  it('सहायता में संस्करण और “इस संस्करण में नया”', async () => {
    const w = await boot()
    w.document.getElementById('btnHelp').click()
    await new Promise((r) => setTimeout(r, 60))
    const modal = w.document.getElementById('helpModal')
    expect(modal.hidden).toBe(false)
    expect(modal.querySelector('.mtb').textContent).toContain(VER)
    const first = w.document.querySelector('#helpList .helpTopic')
    expect(first.textContent).toContain('इस संस्करण में नया')
    first.click()
    await new Promise((r) => setTimeout(r, 40))
    const pane = w.document.getElementById('helpPane').textContent
    expect(pane).toContain(VER)
    expect(pane).toContain('3-11')
  })
})
