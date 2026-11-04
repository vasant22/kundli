// tests/bnn-app-mask.test.js — राउंड 65 / टास्क 09, 09-ख, 09-ग, 09-घ (4-11-2026)
//
// जन्म-तारीख़/समय और गोचर/स्पेशल-ट्रांज़िट के खाने: **अंक दबाते ही** ग़लत जोड़ रुके,
// ढाँचा (DD-MM-YYYY) सदा दिखे, और (टास्क 09-घ) किसी हिस्से में पहला अंक दबाते ही वह
// हिस्सा ख़ाली होकर बाएँ से भरे — `2D` → `25`, `0M` → `09`; बाक़ी हिस्से अपने मान पर।
// अधूरा मान कभी बचे नहीं (गोचर/स्पेशल-ट्रांज़िट में पिछला सही मान लौटता है)।
// यहाँ असली app/app.js को jsdom में चलाकर वही टाइप-क्रम जाँचे हैं जो टास्क में लिखे हैं।
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
function type(w, id, txt) {
  const el = w.document.getElementById(id)
  el.focus()
  for (const ch of txt) el.dispatchEvent(new w.KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true }))
}
const val = (w, id) => w.document.getElementById(id).value
const msg = (w, id) => (w.document.getElementById(id === 'fDate' ? 'hDate' : 'hTime') || {}).textContent || ''
const skel = (w, n) => w.document.querySelectorAll('.mskel')[n].textContent
const mark = (w, id) => w.document.getElementById(id).getAttribute('data-badseg')
// खाने में किसी हिस्से पर click (mask का mouseup → पूरा हिस्सा चुना जाता है)
async function clickAt(w, id, pos) {
  const el = w.document.getElementById(id)
  el.focus(); el.setSelectionRange(pos, pos)
  el.dispatchEvent(new w.MouseEvent('mouseup', { bubbles: true }))
  await sleep(12)
}
async function setVal(w, id, v) {
  const el = w.document.getElementById(id)
  el.value = v
  el.dispatchEvent(new w.Event('input', { bubbles: true }))
  await sleep(5)
}

describe.runIf(hasApp)('तारीख़/समय के खाने — अंक दबाते ही रुकते हैं (टास्क 09)', () => {
  it('51112011 → दिन 5 पर ही रुकता है (51 नहीं बनता)', async () => {
    const w = await boot()
    type(w, 'fDate', '51112011')
    expect(val(w, 'fDate')).toBe('5')
    expect(msg(w, 'fDate')).toContain('31')
    w.close()
  })

  it('3104 → महीना 04 लिया जाता है, दिन 31 लाल + "अप्रैल में 30 दिन" (09-घ)', async () => {
    const w = await boot()
    type(w, 'fDate', '3104')
    expect(val(w, 'fDate')).toBe('31-04-')          // महीने का अंक रुका नहीं
    expect(msg(w, 'fDate')).toContain('अप्रैल')
    expect(mark(w, 'fDate')).toBe('0')   // दिन वाला हिस्सा लाल
    w.close()
  })

  it('29-02-2021 पूरा लिखा जाता है और दिन लाल + लीप-वर्ष संदेश; 29-02-2020 ठीक', async () => {
    const w = await boot()
    type(w, 'fDate', '29022021')
    expect(val(w, 'fDate')).toBe('29-02-2021')
    expect(msg(w, 'fDate')).toContain('लीप')
    expect(mark(w, 'fDate')).toBe('0')
    w.close()
    const w2 = await boot()
    type(w2, 'fDate', '29022020')
    expect(val(w2, 'fDate')).toBe('29-02-2020')
    expect(msg(w2, 'fDate')).toContain('दिन-महीना-वर्ष')   // सहायता-पंक्ति लौट आई
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
    expect(skel(w, 0)).toBe('DD-MM-YYYY')                  // fDate
    const el = w.document.getElementById('fDate')
    expect(el.getAttribute('aria-label') || '').toMatch(/दिन-महीना-वर्ष|DD-MM-YYYY/)
    expect(el.placeholder).toBe('')                        // पुराना लंबा placeholder हटा
    const hint = w.document.getElementById('hDate')
    expect(hint.textContent).toBe('दिन-महीना-वर्ष · जैसे 18-06-1995')
    expect(el.getAttribute('aria-describedby')).toBe('hDate')
    w.close()
  })

  it('टाइप करते ही अक्षर की जगह अंक आते हैं — 05-1 पर ढाँचा M-YYYY रह जाता है', async () => {
    const w = await boot()
    type(w, 'fDate', '0')
    expect(skel(w, 0)).toBe('D-MM-YYYY')
    type(w, 'fDate', '5')
    expect(skel(w, 0)).toBe('MM-YYYY')
    type(w, 'fDate', '1')
    expect(skel(w, 0)).toBe('M-YYYY')                      // 05-1 के बाद सिर्फ़ M बाक़ी
    type(w, 'fDate', '2')
    expect(skel(w, 0)).toBe('YYYY')
    w.close()
  })

  it('ग़लत अंक पर सहायता-पंक्ति लाल संदेश बने, ठीक होते ही सहायता लौटे', async () => {
    const w = await boot()
    const hint = w.document.getElementById('hDate')
    type(w, 'fDate', '511')
    expect(hint.textContent).toBe('दिन 31 से अधिक नहीं हो सकता')
    expect(hint.className).toContain('err')
    const w2 = await boot()
    const h2 = w2.document.getElementById('hDate')
    type(w2, 'fDate', '3')                                 // ठीक अंक — सहायता लौटे
    expect(h2.textContent).toBe('दिन-महीना-वर्ष · जैसे 18-06-1995')
    expect(h2.className).not.toContain('err')
    w.close(); w2.close()
  })

  it('समय के खाने में HH:MM ढाँचा और सेकंड शुरू होने पर :SS', async () => {
    const w = await boot()
    await new Promise((r) => setTimeout(r, 40))
    expect(skel(w, 1)).toBe('HH:MM')                        // fTime
    type(w, 'fTime', '14')
    expect(val(w, 'fTime')).toBe('14:')                     // विभाजक खाने में ही है
    expect(skel(w, 1)).toBe('MM')
    type(w, 'fTime', '47')
    expect(val(w, 'fTime')).toBe('14:47:')
    expect(skel(w, 1)).toBe('SS')                           // मिनट पूरा → सेकंड की जगह दिखे
    type(w, 'fTime', '32')
    expect(skel(w, 1)).toBe('')                             // सब भर गया — ढाँचा ख़त्म
    expect(w.document.getElementById('hTime').textContent).toContain('सेकंड वैकल्पिक')
    w.close()
  })

  it('ग़लत paste नहीं लिया जाता, सही paste चलता है', async () => {
    const w = await boot()
    const el = w.document.getElementById('fDate')
    const paste = (text) => {
      const ev = new w.Event('paste', { bubbles: true, cancelable: true })
      ev.clipboardData = { getData: () => text }
      el.dispatchEvent(ev)
    }
    paste('31-04-2020')
    expect(el.value).toBe('')
    paste('15-08-1990')
    expect(el.value).toBe('15-08-1990')
    w.close()
  })
})

describe.runIf(hasApp)('टास्क 09-घ — हिस्सा-दर-हिस्सा भराई (पहला अंक → हिस्सा ख़ाली)', () => {
  it('22-06-2000 में दिन पर click → 1,5 → 15-06-2000, cursor महीने पर', async () => {
    const w = await boot()
    await setVal(w, 'fDate', '22-06-2000')
    await clickAt(w, 'fDate', 0)                            // दिन
    type(w, 'fDate', '1')
    expect(val(w, 'fDate')).toBe('1')                       // दिन ख़ाली हुआ, सिर्फ़ 1
    expect(skel(w, 0)).toBe('D-06-2000')                    // बाक़ी मान जहाँ के तहाँ (हल्के)
    type(w, 'fDate', '5')
    expect(val(w, 'fDate')).toBe('15-06-2000')
    expect(skel(w, 0)).toBe('')
    const el = w.document.getElementById('fDate')
    expect(el.selectionStart).toBe(3)                       // महीने की शुरुआत
    expect(el.selectionEnd).toBe(5)                         // महीना पूरा चुना
    w.close()
  })

  it('महीने में 0 → 0M दिखे, 9 → 09 (दूसरे अंक की जगह नज़र आए)', async () => {
    const w = await boot()
    await setVal(w, 'fDate', '22-06-2000')
    await clickAt(w, 'fDate', 0)
    type(w, 'fDate', '15')
    await clickAt(w, 'fDate', 3)                            // महीना
    type(w, 'fDate', '0')
    expect(val(w, 'fDate')).toBe('15-0')
    expect(skel(w, 0)).toBe('M-2000')                       // यानी 15-0M-2000
    type(w, 'fDate', '9')
    expect(val(w, 'fDate')).toBe('15-09-2000')
    w.close()
  })

  it('वर्ष 2000 → 1980 बिना किसी error के (पहला अंक 1 दबाने पर 1000 नहीं बनता)', async () => {
    const w = await boot()
    await setVal(w, 'fDate', '22-06-2000')
    await clickAt(w, 'fDate', 6)                            // वर्ष
    type(w, 'fDate', '1')
    expect(val(w, 'fDate')).toBe('22-06-1')
    expect(skel(w, 0)).toBe('YYY')
    expect(msg(w, 'fDate')).toContain('दिन-महीना-वर्ष')    // कोई error नहीं
    type(w, 'fDate', '980')
    expect(val(w, 'fDate')).toBe('22-06-1980')
    expect(msg(w, 'fDate')).toContain('दिन-महीना-वर्ष')
    w.close()
  })

  it('वर्ष में 17 रुकता है, 24 के बाद 1 रुकता है', async () => {
    const w = await boot()
    await setVal(w, 'fDate', '22-06-2000')
    await clickAt(w, 'fDate', 6)
    type(w, 'fDate', '1')
    type(w, 'fDate', '7')                                   // 17 नहीं बनता
    expect(val(w, 'fDate')).toBe('22-06-1')
    expect(msg(w, 'fDate')).toContain('वर्ष')
    w.close()
    const w2 = await boot()
    await setVal(w2, 'fDate', '22-06-2000')
    await clickAt(w2, 'fDate', 6)
    type(w2, 'fDate', '241')                                // 241 नहीं बनता
    expect(val(w2, 'fDate')).toBe('22-06-24')
    w2.close()
  })

  it('31-?? पर महीना 04 → दिन लाल + संदेश, महीना लिया गया (09-घ का उदाहरण)', async () => {
    const w = await boot()
    type(w, 'fDate', '31')
    expect(val(w, 'fDate')).toBe('31-')                     // दिन पूरा, विभाजक दिखा
    type(w, 'fDate', '04')
    expect(val(w, 'fDate')).toBe('31-04-')
    expect(msg(w, 'fDate')).toContain('अप्रैल')
    expect(mark(w, 'fDate')).toBe('0')
    w.close()
  })

  it('गोचर का खाना अधूरा छोड़ने पर पिछला सही मान लौटता है + संदेश', async () => {
    const w = await boot()
    await setVal(w, 'gocharTime', '22-06-2000 15:06:43')
    await clickAt(w, 'gocharTime', 6)                       // वर्ष
    type(w, 'gocharTime', '1')
    expect(val(w, 'gocharTime')).toBe('22-06-1')
    w.document.getElementById('gocharTime').dispatchEvent(new w.Event('blur', { bubbles: true }))
    await sleep(10)
    expect(val(w, 'gocharTime')).toBe('22-06-2000 15:06:43')
    const fm = w.document.querySelectorAll('.fmsg')
    expect([...fm].map((x) => x.textContent).join(' ')).toContain('लौटा')
    w.close()
  })

  it('स्पेशल ट्रांज़िट Start अधूरा → Find से पहले पुराना सही मान लौटे', async () => {
    const w = await boot()
    await setVal(w, 'stStart', '04-11-2026')
    await clickAt(w, 'stStart', 6)
    type(w, 'stStart', '1')
    expect(val(w, 'stStart')).toBe('04-11-1')
    const ok = w.document.getElementById('stStart').__mask.commit({ requireFull: true })
    expect(ok).toBe(false)
    expect(val(w, 'stStart')).toBe('04-11-2026')
    w.close()
  })

  it('जन्म-समय 14:4 अधूरा छोड़कर कुंडली देखें → कुंडली नहीं बनती, संदेश', async () => {
    const w = await boot()
    type(w, 'fTime', '144')
    expect(val(w, 'fTime')).toBe('14:4')
    w.document.getElementById('btnShow').click()
    await sleep(30)
    expect(w.document.getElementById('toast').textContent).toContain('कृपया पहले ठीक करें')
    expect(w.document.getElementById('hTime').textContent).toContain('अधूरा')
    expect(w.document.getElementById('hTime').className).toContain('err')
    expect(w.document.getElementById('fTime').className).toContain('err')
    w.close()
  })
})
