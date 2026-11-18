// @vitest-environment jsdom
// tests/bnn-app-terms.test.js — 1.0.6 / उपयोग की शर्तें (Claude, 18-11-2026)
// पहली बार खिड़की; टिक बिना आगे नहीं; स्वीकार → दर्ज + फिर नहीं; शर्तें बदलें (पुराना संस्करण) → फिर;
// English; demo पते पर नहीं; web पर “स्वीकार नहीं” से संदेश; print में छिपी।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(__dirname, '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP_DIR, 'terms.js'))
const tick = (ms) => new Promise((r) => setTimeout(r, ms))

async function boot(opts = {}) {
  const html = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8')
  const dom = new JSDOM(html, { url: 'http://localhost/' + (opts.hash || ''), runScripts: 'outside-only' })
  const w = dom.window
  w.alert = () => {}; w.confirm = () => true; w.print = () => {}
  w.fetch = async () => ({ ok: false, json: async () => null })
  w.BNNEngine = { compute: async () => { throw new Error('STUB') }, transitNow: async () => null, specialTransit: async () => [] }
  if (opts.terms) w.localStorage.setItem('bnn_terms_v1', JSON.stringify(opts.terms))
  if (opts.lang) w.localStorage.setItem('bnn_lang_v1', opts.lang)
  for (const f of ['tz.js', 'geo.js', 'version.js', 'help.js', 'terms.js', 'app.js']) {
    const fp = path.join(APP_DIR, f)
    if (fs.existsSync(fp)) w.eval(fs.readFileSync(fp, 'utf8'))
  }
  await tick(30)
  if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  await tick(60)
  return w
}
const modal = (w) => w.document.getElementById('termsModal')

describe.skipIf(!hasApp)('उपयोग की शर्तें (1.0.6)', () => {
  it('पहली बार खिड़की; टिक बिना “आगे बढ़ें” बंद; स्वीकार करने पर दर्ज और बंद', async () => {
    const w = await boot()
    expect(modal(w)).toBeTruthy(); expect(modal(w).hidden).toBe(false)
    expect(w.document.querySelectorAll('#termsModal li').length).toBe(9)
    expect(w.document.getElementById('tmFull').getAttribute('href')).toBe('https://mybapuji.com/bnn-shakti-terms/')
    const go = w.document.getElementById('tmGo')
    expect(go.disabled).toBe(true)
    go.click()
    expect(modal(w).hidden).toBe(false)                 // टिक बिना कुछ नहीं
    const chk = w.document.getElementById('tmChk')
    chk.checked = true; chk.dispatchEvent(new w.Event('change'))
    expect(go.disabled).toBe(false)
    go.click()
    expect(modal(w).hidden).toBe(true)
    const rec = JSON.parse(w.localStorage.getItem('bnn_terms_v1'))
    expect(rec.v).toBe(1)
    expect(rec.at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(w.BNNTerms.accepted()).toBe(true)
  })
  it('स्वीकार कर चुके हों तो खिड़की नहीं; पुराने संस्करण की स्वीकृति हो तो फिर आती है', async () => {
    let w = await boot({ terms: { v: 1, at: '2026-11-18T00:00:00Z' } })
    expect(modal(w)).toBeNull()
    w = await boot({ terms: { v: 0, at: '2026-01-01T00:00:00Z' } })
    expect(modal(w).hidden).toBe(false)
  })
  it('English में English; भाषा-बटन से हिंदी', async () => {
    const w = await boot({ lang: 'en' })
    expect(modal(w).textContent).toContain('Terms of Use')
    expect(w.document.getElementById('tmGo').textContent).toBe('Accept and continue')
    w.document.getElementById('tmLang').click()
    await tick(20)
    expect(w.document.getElementById('tmGo').textContent).toBe('स्वीकार करें और आगे बढ़ें')
  })
  it('टिक भाषा बदलने पर भी बना रहता है', async () => {
    const w = await boot()
    const chk = w.document.getElementById('tmChk'); chk.checked = true; chk.dispatchEvent(new w.Event('change'))
    w.document.getElementById('tmLang').click(); await tick(20)
    expect(w.document.getElementById('tmChk').checked).toBe(true)
    expect(w.document.getElementById('tmGo').disabled).toBe(false)
  })
  it('web पर “स्वीकार नहीं” → संदेश, खिड़की बनी रहती है; Esc से नहीं हटती', async () => {
    const w = await boot()
    w.document.getElementById('tmNo').click()
    expect(w.document.getElementById('tmMsg').hidden).toBe(false)
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(modal(w).hidden).toBe(false)
  })
  it('demo पते (#demo…) पर खिड़की नहीं; print में छिपाने का नियम मौजूद', async () => {
    const w = await boot({ hash: '#demo-png' })
    expect(modal(w)).toBeNull()
    const css = fs.readFileSync(path.join(APP_DIR, 'style.css'), 'utf8')
    expect(css).toContain('body.printing #termsModal{display:none!important}')
  })
})
