// tests/bnn-app-mask.test.js — राउंड 65 / टास्क 09 (4-11-2026)
//
// जन्म-तारीख़/समय के खाने: **अंक दबाते ही** ग़लत जोड़ रुके (बाद में नहीं), और ढाँचा
// (DD-MM-YYYY) सदा दिखे। यहाँ असली app/app.js को jsdom में चलाकर वही टाइप-क्रम जाँचे हैं
// जो टास्क में लिखे हैं, और साथ में Backspace/ढाँचा/paste।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP, 'app.js'))

async function boot() {
  const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8')
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
  const w = dom.window
  w.BNN_PLACES = []; w.alert = () => {}; w.confirm = () => true
  w.BNNEngine = { compute: async () => { throw new Error('STUB') } }
  w.eval(fs.readFileSync(path.join(APP, 'app.js'), 'utf8'))
  await new Promise((r) => setTimeout(r, 40))
  if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 60))
  return w
}
function type(w, id, txt) {
  const el = w.document.getElementById(id)
  el.focus()
  for (const ch of txt) el.dispatchEvent(new w.KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true }))
}
const val = (w, id) => w.document.getElementById(id).value
const msg = (w, id) => (w.document.getElementById(id === 'fDate' ? 'hDate' : 'hTime') || {}).textContent || ''

describe.runIf(hasApp)('तारीख़/समय के खाने — ग़लत अंक दबाते ही रुकते हैं (टास्क 09)', () => {
  it('51112011 → दिन 5 पर ही रुकता है (51 नहीं बनता)', async () => {
    const w = await boot()
    type(w, 'fDate', '51112011')
    expect(val(w, 'fDate')).toBe('5')
    expect(msg(w, 'fDate')).toContain('31')
    w.close()
  })

  it('3104 → 04 का 4 रुकता है (अप्रैल में 31 दिन नहीं)', async () => {
    const w = await boot()
    type(w, 'fDate', '3104')
    expect(val(w, 'fDate')).toBe('31-0')          // महीने का दूसरा अंक नहीं लिया
    expect(msg(w, 'fDate')).toContain('अप्रैल')   // "अप्रैल में 30 दिन होते हैं"
    w.close()
  })

  it('2902 + 2021 → लीप-वर्ष न होने से आख़िरी 1 रुकता है; 2020 चलता है', async () => {
    const w = await boot()
    type(w, 'fDate', '29022021')
    expect(val(w, 'fDate')).toBe('29-02-202')
    expect(msg(w, 'fDate')).toContain('लीप')
    w.close()
    const w2 = await boot()
    type(w2, 'fDate', '29022020')
    expect(val(w2, 'fDate')).toBe('29-02-2020')
    w2.close()
  })

  it('3012 ठीक चलता है; 00 महीना/दिन नहीं बनते', async () => {
    const w = await boot()
    type(w, 'fDate', '3012')
    expect(val(w, 'fDate')).toBe('30-12-')
    w.close()
    const w2 = await boot()
    type(w2, 'fDate', '00')
    expect(val(w2, 'fDate')).toBe('0')
    expect(msg(w2, 'fDate')).toContain('00')
    w2.close()
  })

  it('वर्ष की सीमा: 17xx नहीं बनता (1800 से शुरू), 2401 नहीं, 2400 चलता है', async () => {
    const w = await boot()
    type(w, 'fDate', '01011799')
    // पहला अंक 1 → दूसरा 8/9 ही: '7' रुकता है, फिर 9,9 से साल '199' बनता है
    expect(val(w, 'fDate')).toBe('01-01-199')
    w.close()
    const w2 = await boot()
    type(w2, 'fDate', '01012401')
    expect(val(w2, 'fDate')).toBe('01-01-240')     // 2401 का 1 रुके (2400 अधिकतम)
    w2.close()
    const w3 = await boot()
    type(w3, 'fDate', '01012400')
    expect(val(w3, 'fDate')).toBe('01-01-2400')
    w3.close()
  })

  it('समय: 2460 → 4 रुकता है, 2359 ठीक, 12:6 → 6 रुकता है', async () => {
    const w = await boot()
    type(w, 'fTime', '2460')
    expect(val(w, 'fTime')).toMatch(/^2[0-3]/)      // 24 नहीं बनता
    w.close()
    const w2 = await boot()
    type(w2, 'fTime', '2359')
    expect(val(w2, 'fTime')).toBe('23:59:')
    w2.close()
    const w3 = await boot()
    type(w3, 'fTime', '126')
    expect(val(w3, 'fTime')).toBe('12:')
    expect(msg(w3, 'fTime')).toContain('59')
    w3.close()
  })

  it('Backspace से अंक हटता है और ढाँचा लौट आता है', async () => {
    const w = await boot()
    type(w, 'fDate', '3112')
    expect(val(w, 'fDate')).toBe('31-12-')
    const el = w.document.getElementById('fDate')
    el.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }))
    expect(val(w, 'fDate')).toBe('31-1')
    w.close()
  })

  it('खाना ख़ाली हो तब भी ढाँचा अक्षरों में दिखता है (DD-MM-YYYY), aria-label + aria-describedby', async () => {
    const w = await boot()
    await new Promise((r) => setTimeout(r, 50))
    const skel = w.document.querySelector('.mskel')
    expect(skel).toBeTruthy()
    expect(skel.textContent).toBe('DD-MM-YYYY')
    const el = w.document.getElementById('fDate')
    expect(el.getAttribute('aria-label') || '').toMatch(/दिन-महीना-वर्ष|DD-MM-YYYY/)
    expect(el.placeholder).toBe('')                 // पुराना लंबा placeholder हटा
    // सहायता-पंक्ति सदा दिखे और खाने से जुड़ी हो
    const hint = w.document.getElementById('hDate')
    expect(hint.textContent).toBe('दिन-महीना-वर्ष · जैसे 18-06-1995')
    expect(el.getAttribute('aria-describedby')).toBe('hDate')
    w.close()
  })

  it('टाइप करते ही अक्षर की जगह अंक आते हैं — 05-1 पर ढाँचा M-YYYY रह जाता है', async () => {
    const w = await boot()
    const skel = () => w.document.querySelector('.mskel').textContent
    type(w, 'fDate', '0')
    expect(skel()).toBe('D-MM-YYYY')
    type(w, 'fDate', '5')
    expect(skel()).toBe('MM-YYYY')
    type(w, 'fDate', '1')
    expect(skel()).toBe('M-YYYY')                    // 05-1 के बाद सिर्फ़ M बाक़ी (टास्क 09-ग)
    type(w, 'fDate', '2')
    expect(skel()).toBe('YYYY')
    w.close()
  })

  it('Backspace पर अक्षर लौट आते हैं', async () => {
    const w = await boot()
    type(w, 'fDate', '051')
    expect(w.document.querySelector('.mskel').textContent).toBe('M-YYYY')
    const el = w.document.getElementById('fDate')
    el.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }))
    expect(el.value).toBe('05-')
    expect(w.document.querySelector('.mskel').textContent).toBe('MM-YYYY')   // M लौटा
    w.close()
  })

  it('ग़लत अंक पर सहायता-पंक्ति लाल संदेश बने, ठीक होते ही सहायता लौटे', async () => {
    const w = await boot()
    const hint = w.document.getElementById('hDate')
    const help = hint.textContent
    type(w, 'fDate', '511')
    expect(hint.textContent).toBe('दिन 31 से अधिक नहीं हो सकता')
    expect(hint.className).toContain('err')
    type(w, 'fDate', '2')                            // ग़लत '1' रुका था; अब 2 लेते हैं (52? नहीं — '5' के बाद 2 = 52 > 31 → रुकेगा)
    expect(hint.className).toContain('err')
    const w2 = await boot()
    const h2 = w2.document.getElementById('hDate')
    type(w2, 'fDate', '3')                          // ठीक अंक — पंक्ति सहायता पर लौटे
    expect(h2.textContent).toBe('दिन-महीना-वर्ष · जैसे 18-06-1995')
    expect(h2.className).not.toContain('err')
    w.close(); w2.close()
  })

  it('समय के खाने में HH:MM ढाँचा और सेकंड शुरू होने पर :SS', async () => {
    const w = await boot()
    const skel = () => w.document.querySelectorAll('.mskel')[1].textContent
    await new Promise((r) => setTimeout(r, 40))
    expect(skel()).toBe('HH:MM')
    type(w, 'fTime', '14')
    expect(w.document.getElementById('fTime').value).toBe('14:')   // विभाजक खाने में ही है
    expect(skel()).toBe('MM')
    type(w, 'fTime', '47')
    expect(w.document.getElementById('fTime').value).toBe('14:47:')
    expect(skel()).toBe('SS')                        // मिनट पूरा → सेकंड की जगह दिखे
    type(w, 'fTime', '32')
    expect(skel()).toBe('')                          // सब भर गया — ढाँचा ख़त्म
    expect(w.document.getElementById('hTime').textContent).toContain('सेकंड वैकल्पिक')
    expect(w.document.getElementById('fTime').getAttribute('aria-describedby')).toBe('hTime')
    w.close()
  })

  it('ग़लत paste नहीं लिया जाता, सही paste चलता है', async () => {
    const w = await boot()
    const el = w.document.getElementById('fDate')
    // jsdom में clipboardData नहीं होता — सीधा event बनाकर दो
    const paste = (text) => {
      const ev = new w.Event('paste', { bubbles: true, cancelable: true })
      ev.clipboardData = { getData: () => text }
      el.dispatchEvent(ev)
    }
    paste('31-04-2020')
    expect(val(w, 'fDate')).toBe('')                 // अप्रैल में 31 नहीं → नहीं लिया
    paste('15-08-1990')
    expect(val(w, 'fDate')).toBe('15-08-1990')
    w.close()
  })
})
