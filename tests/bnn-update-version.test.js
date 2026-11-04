// tests/bnn-update-version.test.js — राउंड 65 / टास्क 03 (4-11-2026)
//
// "नया संस्करण उपलब्ध है" वाली सूचना की दो चीज़ें जाँचता है:
//   1. संस्करण की तुलना (app/version.js — desktop + web दोनों में वही file):
//      1.0.10 > 1.0.9 (अंकों से, अक्षरों से नहीं), 1.0 = 1.0.0, बड़ा/बराबर/छोटा।
//   2. version.json लाने वाला छोटा मॉड्यूल (desktop/update-check.js) — नकली local server से:
//      ठीक 1.0.1 → ठीक; 1.0.0 → ठीक (तुलना बाद में होती है); गलत JSON / 404 / बहुत धीमा
//      → चुपचाप { ok:false } (कोई throw नहीं, कोई popup नहीं)।
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '../../../bnn-kundli-windows')
const require = createRequire(import.meta.url)
const hasApp = fs.existsSync(path.join(APP, 'app/version.js'))

// app/version.js एक classic script है — उसे नक़ली window पर चलाकर देखते हैं
function loadSemver() {
  const code = fs.readFileSync(path.join(APP, 'app/version.js'), 'utf8')
  const fakeWindow = {}
  // eslint-disable-next-line no-new-func
  new Function('window', code)(fakeWindow)
  return fakeWindow.BNNSemver
}

describe.runIf(hasApp)('नया संस्करण — तुलना (app/version.js)', () => {
  const semver = hasApp ? loadSemver() : null

  it('1.0.10, 1.0.9 से बड़ा है (अंकों से तुलना, अक्षरों से नहीं)', () => {
    expect(semver.compare('1.0.10', '1.0.9')).toBe(1)
    expect(semver.compare('1.0.9', '1.0.10')).toBe(-1)
  })

  it('बराबर, छोटा, बड़ा और अधूरे हिस्से (1.0 = 1.0.0)', () => {
    expect(semver.compare('1.0.0', '1.0.0')).toBe(0)
    expect(semver.compare('1.0', '1.0.0')).toBe(0)
    expect(semver.compare('2', '1.9.9')).toBe(1)
    expect(semver.compare('1.0.1', '1.0.0')).toBe(1)
    expect(semver.compare('1.0.0', '1.0.1')).toBe(-1)
    expect(semver.compare('v1.0.2', '1.0.1')).toBe(1) // आगे 'v' हो तो भी चले
    expect(semver.compare('', '1.0.0')).toBe(-1)      // ख़ाली = सबसे छोटा
  })
})

describe.runIf(hasApp)('नया संस्करण — version.json लाना (desktop/update-check.js)', () => {
  let server
  let base
  const mod = hasApp ? require(path.join(APP, 'desktop/update-check.js')) : null

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/ok.json') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ version: '1.0.1', date: '2026-11-04', note: 'सुधार', url: 'https://mybapuji.com/x/' }))
      } else if (req.url === '/course.json') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ version: '1.0.1', note: '', url: '', courseUrl: 'https://mybapuji.com/bnn-jyotish-course/' }))
      } else if (req.url === '/same.json') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ version: '1.0.0', note: '', url: '' }))
      } else if (req.url === '/bad.json') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end('{ version: 1.0.1, ')            // टूटा JSON
      } else if (req.url === '/nover.json') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ date: '2026-11-04' }))   // version ही नहीं
      } else if (req.url === '/slow.json') {
        setTimeout(() => { try { res.writeHead(200); res.end('{"version":"1.0.9"}') } catch (e) {} }, 1500)
      } else {
        res.writeHead(404); res.end('नहीं मिला')
      }
    })
    await new Promise((r) => server.listen(0, '127.0.0.1', r))
    base = 'http://127.0.0.1:' + server.address().port
  }, 20000)

  afterAll(() => { try { server.close() } catch (e) {} })

  it('ठीक file (1.0.1) → ok:true और साफ़ data', async () => {
    const r = await mod.fetchVersionInfo(base + '/ok.json')
    expect(r.ok).toBe(true)
    expect(r.data.version).toBe('1.0.1')
    expect(r.data.note).toBe('सुधार')
    expect(r.data.url).toMatch(/^https:\/\/mybapuji\.com\//)
  })

  it('courseUrl version.json से आता है; न हो तो ख़ाली', async () => {
    const r = await mod.fetchVersionInfo(base + '/course.json')
    expect(r.ok).toBe(true)
    expect(r.data.courseUrl).toBe('https://mybapuji.com/bnn-jyotish-course/')
    const r2 = await mod.fetchVersionInfo(base + '/same.json')   // इसमें courseUrl नहीं है
    expect(r2.ok).toBe(true)
    expect(r2.data.courseUrl).toBe('')
  })

  it('पुराना/वही संस्करण (1.0.0) → ok:true (दिखाना-न-दिखाना तुलना से तय होगा)', async () => {
    const r = await mod.fetchVersionInfo(base + '/same.json')
    expect(r.ok).toBe(true)
    expect(r.data.version).toBe('1.0.0')
  })

  it('टूटा JSON / version नहीं / 404 / ग़लत url → चुपचाप ok:false (कोई throw नहीं)', async () => {
    for (const u of ['/bad.json', '/nover.json', '/nope.json']) {
      const r = await mod.fetchVersionInfo(base + u)
      expect(r.ok, u).toBe(false)
    }
    const r2 = await mod.fetchVersionInfo('file:///etc/passwd')
    expect(r2.ok).toBe(false)
  })

  it('धीमा server → तय समय पर छोड़ देता है (ok:false, timeout)', async () => {
    const t0 = Date.now()
    const r = await mod.fetchVersionInfo(base + '/slow.json', { timeoutMs: 300 })
    const ms = Date.now() - t0
    expect(r.ok).toBe(false)
    expect(ms).toBeLessThan(1400)
  })

  it('internet न हो (बंद port) → ok:false, कोई throw नहीं', async () => {
    const r = await mod.fetchVersionInfo('http://127.0.0.1:1/version.json', { timeoutMs: 400 })
    expect(r.ok).toBe(false)
  })
})
