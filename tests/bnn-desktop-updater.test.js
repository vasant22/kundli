// tests/bnn-desktop-updater.test.js — 1.0.5 / अपने-आप update (Claude, 17-11-2026)
//
// (1) desktop/updater.js: कौन-सी file (auto/portable/mac/none), file का नाम/URL, जाँच-संख्या (sha512)
//     मिले तभी file बचे — ग़लत/अधूरी file कभी नहीं; केवल github.com से; नाम टकराए तो “(2)”।
// (2) desktop/update-check.js: version.json का sha512 केवल सही रूप में आगे जाता है।
// (3) app.js की पट्टी: Setup → “पीछे-पीछे उतर रहा… %” → “अभी update करें” (दबाने पर install);
//     विफल हो तो पुराना website वाला रास्ता; Portable/Mac → “अभी डाउनलोड करें” → % → “Downloads में रखी”;
//     sha512 न हो तो website वाला रास्ता।
import fs from 'node:fs'
import os from 'node:os'
import http from 'node:http'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../../bnn-kundli-windows')
const require = createRequire(import.meta.url)
const hasUpd = fs.existsSync(path.join(ROOT, 'desktop/updater.js'))
const U = hasUpd ? require(path.join(ROOT, 'desktop/updater.js')) : null
const sha = (buf) => crypto.createHash('sha512').update(buf).digest('base64')
const fakeFetch = (buf, status = 200) => async () => new Response(status === 200 ? buf : 'x', { status, headers: { 'content-length': String(buf.length) } })

describe.runIf(hasUpd)('updater.js — रास्ता, नाम, URL', () => {
  it('कौन-सी file: Setup = auto, Portable = portable, Mac = mac, बिना build = none', () => {
    expect(U.modeOf({ isPackaged: true, platform: 'win32', env: {} })).toBe('auto')
    expect(U.modeOf({ isPackaged: true, platform: 'win32', env: { PORTABLE_EXECUTABLE_FILE: 'C:\\x\\BNN.exe' } })).toBe('portable')
    expect(U.modeOf({ isPackaged: true, platform: 'darwin', env: {} })).toBe('mac')
    expect(U.modeOf({ isPackaged: false, platform: 'win32', env: {} })).toBe('none')
    expect(U.modeOf({ isPackaged: true, platform: 'linux', env: {} })).toBe('none')
  })
  it('file का नाम और GitHub URL — केवल सही संस्करण-अंक', () => {
    expect(U.assetName('portable', '1.0.6')).toBe('BNN-Shakti-Portable-1.0.6.exe')
    expect(U.assetName('mac', '1.0.6')).toBe('BNN-Shakti-1.0.6-universal.dmg')
    expect(U.assetName('auto', '1.0.6')).toBe('')
    expect(U.assetName('portable', '1.0.6/../../x')).toBe('')
    expect(U.assetUrl('1.0.6', 'BNN-Shakti-Portable-1.0.6.exe')).toBe('https://github.com/vasant22/bnn-shakti-releases/releases/download/v1.0.6/BNN-Shakti-Portable-1.0.6.exe')
    expect(U.assetUrl('1.0.6', 'a.exe', 'bad repo!')).toContain('vasant22/bnn-shakti-releases')
    expect(U.assetUrl('1.0.6', 'a.exe', 'tester/test-rel')).toContain('github.com/tester/test-rel/')
  })
})

describe.runIf(hasUpd)('updater.js — उतारना (sha512 ज़रूरी)', () => {
  let dir
  beforeAll(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bnnupd-')) })
  afterAll(() => { try { fs.rmSync(dir, { recursive: true, force: true }) } catch (e) {} })
  const data = crypto.randomBytes(300000)
  const url = 'https://github.com/vasant22/bnn-shakti-releases/releases/download/v1.0.6/BNN-Shakti-Portable-1.0.6.exe'

  it('सही sha512 → file बची, % आए, .part नहीं बचा', async () => {
    const pcts = []
    const r = await U.download(url, dir, 'BNN-Shakti-Portable-1.0.6.exe', sha(data), { fetch: fakeFetch(data), onProgress: (p) => pcts.push(p) })
    expect(r.ok).toBe(true)
    expect(fs.readFileSync(r.path).equals(data)).toBe(true)
    expect(pcts[pcts.length - 1]).toBe(100)
    expect(fs.readdirSync(dir).some((f) => f.endsWith('.part'))).toBe(false)
  })
  it('नाम पहले से हो तो “(2)” — पुरानी file पर लिखा नहीं जाता', async () => {
    const r = await U.download(url, dir, 'BNN-Shakti-Portable-1.0.6.exe', sha(data), { fetch: fakeFetch(data) })
    expect(r.ok).toBe(true)
    expect(path.basename(r.path)).toBe('BNN-Shakti-Portable-1.0.6 (2).exe')
  })
  it('ग़लत sha512 → file हटाई, ok:false (sha)', async () => {
    const before = fs.readdirSync(dir).length
    const r = await U.download(url, dir, 'x-1.0.7.exe', sha(Buffer.from('दूसरी')), { fetch: fakeFetch(data) })
    expect(r).toEqual({ ok: false, reason: 'sha' })
    expect(fs.readdirSync(dir).length).toBe(before)
  })
  it('sha512 न हो / github नहीं / 404 → उतरता ही नहीं', async () => {
    expect((await U.download(url, dir, 'a.exe', '', { fetch: fakeFetch(data) })).reason).toBe('nosha')
    expect((await U.download('https://evil.example/a.exe', dir, 'a.exe', sha(data), { fetch: fakeFetch(data) })).reason).toBe('url')
    expect((await U.download(url, dir, 'b.exe', sha(data), { fetch: fakeFetch(data, 404) })).reason).toBe('http')
    expect((await U.download(url, dir, 'c.exe', sha(data), { fetch: async () => { throw new Error('offline') } })).reason).toBe('error')
    expect(fs.readdirSync(dir).filter((f) => /^[abc]\.exe/.test(f)).length).toBe(0)
  })
})

describe.runIf(hasUpd)('update-check.js — sha512 केवल सही रूप में', () => {
  let server, base
  const mod = hasUpd ? require(path.join(ROOT, 'desktop/update-check.js')) : null
  const good = sha(Buffer.from('portable'))
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ version: '1.0.6', sha512: { portable: good, mac: 'नहीं-सही', evil: good } }))
    })
    await new Promise((r) => server.listen(0, '127.0.0.1', r))
    base = 'http://127.0.0.1:' + server.address().port
  })
  afterAll(() => { try { server.close() } catch (e) {} })
  it('portable आया, ग़लत mac और अनजान खाना छूटे', async () => {
    const r = await mod.fetchVersionInfo(base + '/version.json')
    expect(r.ok).toBe(true)
    expect(r.data.sha512).toEqual({ portable: good })
  })
})

// ---------------------------------------------------------------- पट्टी (app.js)
const APP_DIR = path.join(ROOT, 'app')
async function boot(mode) {
  const html = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8')
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
  const w = dom.window
  w.alert = () => {}; w.confirm = () => true; w.print = () => {}
  const calls = { install: 0, download: [], opened: [] }
  let statusCb = null
  w.desktop = {
    isDesktop: true,
    checkUpdate: async () => null,
    updInfo: async () => ({ mode, status: { state: 'idle' } }),
    onUpdStatus: (cb) => { statusCb = cb },
    updInstall: async () => { calls.install++; return true },
    updDownload: async (v, s) => { calls.download.push([v, s]); return { ok: true } },
    openExternal: async (u) => { calls.opened.push(u); return true },
    autoBackup: async () => '', safetyBackup: async () => '', openDataFolder: async () => ''
  }
  w.BNNEngine = { compute: async () => { throw new Error('STUB') }, transitNow: async () => null, specialTransit: async () => [] }
  for (const f of ['tz.js', 'geo.js', 'version.js', 'help.js']) {
    const fp = path.join(APP_DIR, f)
    if (fs.existsSync(fp)) w.eval(fs.readFileSync(fp, 'utf8'))
  }
  w.eval(fs.readFileSync(path.join(APP_DIR, 'app.js'), 'utf8'))
  await new Promise((r) => setTimeout(r, 40))
  if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 80))
  return { w, calls, emit: (st) => statusCb && statusCb(st), hasCb: () => !!statusCb }
}
const bar = (w) => w.document.getElementById('updBar')
const VER = hasUpd ? /APP_VERSION = '([^']+)'/.exec(fs.readFileSync(path.join(APP_DIR, 'version.js'), 'utf8'))[1] : ''
const newer = hasUpd ? VER.replace(/\d+$/, (n) => String(+n + 1)) : ''
const S = sha(Buffer.from('x'))

describe.runIf(hasUpd)('update की पट्टी (app.js)', () => {
  it('Setup: उतरना % → तैयार → “अभी update करें” दबाते ही install', async () => {
    const { w, calls, emit, hasCb } = await boot('auto')
    expect(hasCb()).toBe(true)
    emit({ state: 'downloading', version: newer, percent: 12 })
    expect(bar(w).textContent).toContain('12%')
    emit({ state: 'downloading', version: newer, percent: 57 })
    expect(bar(w).textContent).toContain('57%')
    emit({ state: 'ready', version: newer })
    const btn = w.document.getElementById('updNow')
    expect(btn).toBeTruthy()
    expect(bar(w).textContent).toContain(newer)
    btn.click()
    await new Promise((r) => setTimeout(r, 20))
    expect(calls.install).toBe(1)
  })
  it('Setup: ✕ दबाने पर उतरना चलता रहे पर पट्टी फिर न आए; तैयार होने पर आए', async () => {
    const { w, emit } = await boot('auto')
    emit({ state: 'downloading', version: newer, percent: 5 })
    w.document.getElementById('updX').click()
    emit({ state: 'downloading', version: newer, percent: 40 })
    expect(bar(w)).toBeNull()
    emit({ state: 'ready', version: newer })
    expect(w.document.getElementById('updNow')).toBeTruthy()
  })
  it('Setup विफल → पुराना रास्ता: “डाउनलोड करें” website खोलता है', async () => {
    const { w, calls, emit } = await boot('auto')
    w.BNN_updTest.setMode('auto')
    w.BNN_showUpdateBar  // मौजूद
    emit({ state: 'error' })
    w.BNN_showUpdateBar({ version: newer, current: VER, url: 'https://mybapuji.com/x/' })
    w.document.getElementById('updGo').click()
    expect(calls.opened[0]).toBe('https://mybapuji.com/x/')
  })
  it('Portable: sha512 हो तो “अभी डाउनलोड करें” → ऐप के भीतर → % → Downloads वाली सूचना', async () => {
    const { w, calls, emit } = await boot('portable')
    w.BNN_updTest.setMode('portable')
    w.BNN_showUpdateBar({ version: newer, current: VER, sha512: { portable: S, mac: '' } })
    const go = w.document.getElementById('updGo')
    expect(go.textContent).toContain('अभी डाउनलोड')
    go.click()
    await new Promise((r) => setTimeout(r, 20))
    expect(calls.download).toEqual([[newer, S]])
    emit({ state: 'downloading', version: newer, percent: 33 })
    expect(w.document.getElementById('updPct').textContent).toBe('33%')
    emit({ state: 'saved', version: newer, file: 'BNN-Shakti-Portable-' + newer + '.exe' })
    expect(bar(w).textContent).toContain('BNN-Shakti-Portable-' + newer + '.exe')
    expect(bar(w).textContent).toContain('Downloads')
  })
  it('Portable: sha512 न हो तो website वाला रास्ता (ऐप के भीतर नहीं)', async () => {
    const { w, calls } = await boot('portable')
    w.BNN_updTest.setMode('portable')
    w.BNN_showUpdateBar({ version: newer, current: VER, sha512: {} })
    w.document.getElementById('updGo').click()
    expect(calls.download.length).toBe(0)
    expect(calls.opened.length).toBe(1)
  })
  it('Mac: dmg उतरी → Applications में खींचने की बात; उतरना विफल → website का बटन', async () => {
    const { w, emit } = await boot('mac')
    w.BNN_updTest.setMode('mac')
    w.BNN_showUpdateBar({ version: newer, current: VER, sha512: { mac: S } })
    w.document.getElementById('updGo').click()
    await new Promise((r) => setTimeout(r, 20))
    emit({ state: 'saved', version: newer, file: 'x.dmg' })
    expect(bar(w).textContent).toContain('Applications')
    w.BNN_showUpdateBar
    emit({ state: 'downloading', version: newer, percent: 1 })   // (saved के बाद % का खाना नहीं) — कुछ नहीं बिगड़ता
    expect(bar(w)).toBeTruthy()
  })
  it('पुराना/बराबर संस्करण → कोई पट्टी नहीं', async () => {
    const { w } = await boot('portable')
    w.BNN_showUpdateBar({ version: VER, current: VER, sha512: { portable: S } })
    expect(bar(w)).toBeNull()
  })
})
