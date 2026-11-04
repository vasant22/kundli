// tests/bnn-app-upgrade.test.js — राउंड 65 / टास्क 06-क (4-11-2026)
//
// 1.0.0 वाले users के पास सहेजी कुंडलियाँ/settings/भाषा हैं। 1.0.1 में आते ही वे **एक भी**
// न खोएँ — इसकी जाँच असली `app/app.js` को ज्सDOM में चलाकर:
//   1. पुराने localStorage (bnn_kundli_v1, bnn_settings_v1, bnn_lang_v1) से सब उठता है;
//   2. बैकअप फ़ाइल बनती है और उसी से (नई ख़ाली अवस्था में) पूरी सूची व हर खेत लौटते हैं
//      (round-trip: records, groups, nextRef, gender, सेकंड वाला समय, mobile);
//   3. settings (ज्योतिषी विवरण, autoBackupDays, डिफ़ॉल्ट चार्ट) भी बैकअप से वापस?
//      — नहीं: बैकअप में `state` जाता है, settings नहीं (यह जान-बूझकर है, रिपोर्ट में लिखा)।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP, 'app.js'))

const RECS = [
  { id: 1, ref: 1, name: 'basant', group: 'परिवार', gender: 'पुरुष', mobile: '9999900001', date: '22-01-1980', time: '20:30:00', country: 'भारत', countryEN: 'India', state: 'मध्य प्रदेश', stateEN: 'Madhya Pradesh', place: 'बेतूल', placeEN: 'Betul', lat: 21.9006, lon: 77.9023, gmt: 5.5, dst: 0 },
  { id: 2, ref: 2, name: 'prabha', group: 'ग्राहक', gender: 'स्त्री', mobile: '', date: '19-12-1989', time: '15:20:00', country: 'भारत', countryEN: 'India', state: 'तमिलनाडु', stateEN: 'Tamil Nadu', place: 'कोयंबटूर', placeEN: 'Coimbatore', lat: 11.0055, lon: 76.9661, gmt: 5.5, dst: 0 },
  { id: 3, ref: 3, name: 'david', group: 'मित्र', gender: 'पुरुष', mobile: '9999900003', date: '04-07-1985', time: '12:00:30', country: 'अमेरिका', countryEN: 'USA', state: 'New York', stateEN: 'New York', place: 'न्यूयॉर्क', placeEN: 'New York', lat: 40.7128, lon: -74.006, gmt: -5, dst: 1 },
  { id: 4, ref: 4, name: 'अनिल', group: 'परिवार', gender: 'पुरुष', mobile: '', date: '15-03-1996', time: '23:59:00', country: 'भारत', countryEN: 'India', state: 'मध्य प्रदेश', stateEN: 'Madhya Pradesh', place: 'बेतूल', placeEN: 'Betul', lat: 21.9006, lon: 77.9023, gmt: 5.5, dst: 0 },
  { id: 5, ref: 5, name: 'sarita', group: 'मित्र', gender: 'स्त्री', mobile: '9999900005', date: '19-07-1997', time: '07:51:56', country: 'भारत', countryEN: 'India', state: 'मध्य प्रदेश', stateEN: 'Madhya Pradesh', place: 'बेतूल', placeEN: 'Betul', lat: 21.9006, lon: 77.9023, gmt: 5.5, dst: 0 }
]
const STATE_100 = { nextRef: 6, groups: ['परिवार', 'मित्र', 'ग्राहक'], records: RECS }
const SETTINGS_100 = { slogan: '॥ श्री गणेशाय नमः ॥', astroName: 'ज्योतिषी जी', astroAddr: 'बेतूल', astroPhone: '12345', chartDefault: 'south', autoBackupDays: 15, prsssMarks: true }

async function boot(storage) {
  // असली index.html + runScripts 'outside-only' → w.eval से app.js चलेगा, <script src> नहीं
  const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8')
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
  const w = dom.window
  for (const [k, v] of Object.entries(storage || {})) w.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
  // बैकअप-डाउनलोड पकड़ो (data: URL पर जाता है)
  w.__downloads = []
  const origClick = w.HTMLAnchorElement.prototype.click
  w.HTMLAnchorElement.prototype.click = function () {
    if (this.download && /^data:/.test(this.href)) {
      w.__downloads.push({ name: this.download, text: decodeURIComponent(this.href.replace(/^data:[^,]*,/, '')) })
      return
    }
    return origClick ? origClick.call(this) : undefined
  }
  w.BNN_PLACES = []
  w.alert = () => {}; w.confirm = () => true
  w.BNNEngine = { compute: async () => { throw new Error('STUB') } }
  const code = fs.readFileSync(path.join(APP, 'app.js'), 'utf8')
  w.eval(code)
  // jsdom ख़ुद भी DOMContentLoaded भेजता है (थोड़ी देर बाद) — दो बार init न हो, इसलिए
  // पहले उसका इंतज़ार, और अगर ऐप नहीं खुला तो हम ख़ुद घटना भेजते हैं।
  await new Promise((r) => setTimeout(r, 40))
  if (w.document.querySelectorAll('#fGroup option').length === 0) {
    w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  }
  await new Promise((r) => setTimeout(r, 40))
  return w
}

const listCount = (w) => w.document.querySelectorAll('#list .li').length
// थोड़ी देर में शर्त पूरी होने तक रुकना (FileReader/promise के लिए)
async function waitFor(fn, ms = 3000, step = 30) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    try { if (fn()) return true } catch (e) {}
    await new Promise((r) => setTimeout(r, step))
  }
  return false
}

describe.runIf(hasApp)('1.0.0 → 1.0.1: पुराना data बचता है (असली app.js)', () => {
  it('पुराने localStorage से 5 कुंडलियाँ, groups और अगला Ref उठते हैं', async () => {
    const w = await boot({ bnn_kundli_v1: STATE_100 })
    expect(listCount(w)).toBe(5)
    expect(w.document.getElementById('fRef').value).toBe('6')          // nextRef
    const groups = [...w.document.querySelectorAll('#fGroup option')].map((o) => o.value)
    expect(groups).toContain('ग्राहक')
    w.close()
  })

  it('पुरानी settings और भाषा भी उठती हैं', async () => {
    const w = await boot({ bnn_kundli_v1: STATE_100, bnn_settings_v1: SETTINGS_100, bnn_lang_v1: 'en' })
    // भाषा: 1.0.0 में सहेजी 'en' से ऐप अंग्रेज़ी में खुलता है (भाषा-बटन + lang + data-l टेक्स्ट)
    expect(w.document.documentElement.lang).toBe('en')
    expect(w.document.getElementById('btnLang').textContent).toContain('English')
    expect(w.document.getElementById('btnSettings').textContent).toContain('Settings')
    // settings: सहेजी settings localStorage में जैसी थीं, वैसी ही रहती हैं (ऐप उन्हें मिटाता नहीं)
    const st = JSON.parse(w.localStorage.getItem('bnn_settings_v1'))
    expect(st.slogan).toBe(SETTINGS_100.slogan)
    expect(st.astroName).toBe(SETTINGS_100.astroName)
    w.close()
  })

  it('बैकअप फ़ाइल → नई ख़ाली अवस्था में restore: हर खेत और हर कुंडली लौटती है (round-trip)', async () => {
    const w1 = await boot({ bnn_kundli_v1: STATE_100 })
    w1.document.getElementById('btnBackup').click()
    expect(w1.__downloads.length).toBe(1)
    const bak = w1.__downloads[0]
    expect(bak.name).toMatch(/^bnn-kundli-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const parsed = JSON.parse(bak.text)
    expect(parsed.records.length).toBe(5)
    expect(parsed.records[2].gender).toBe('पुरुष')
    expect(parsed.records[2].time).toBe('12:00:30')     // सेकंड सहित
    expect(parsed.records[2].dst).toBe(1)
    w1.close()

    // नई (ख़ाली) अवस्था में वही फ़ाइल खोलो
    const w2 = await boot({})
    expect(listCount(w2)).toBe(0)
    const file = new w2.File([bak.text], 'bnn-kundli-backup.json', { type: 'application/json' })
    const input = w2.document.getElementById('fileIn')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new w2.Event('change', { bubbles: true }))
    // Merge/Replace का चुनाव — "पूरी सूची बदलें"
    const open = await waitFor(() => w2.document.getElementById('impReplace'))
    expect(open, 'Merge/Replace की खिड़की नहीं खुली').toBe(true)
    w2.document.getElementById('impReplace').click()
    expect(await waitFor(() => listCount(w2) === 5)).toBe(true)

    // फिर से बैकअप बनाओ — मूल से हूबहू होना चाहिए (हर खेत)
    // ध्यान: restore से पहले ऐप अपने-आप "सुरक्षा-बैकअप" (bnn-before-import-…) भी डाउनलोड करता है,
    // इसलिए असली बैकअप को नाम से चुनते हैं।
    w2.document.getElementById('btnBackup').click()
    const backups = w2.__downloads.filter((d) => /^bnn-kundli-backup-/.test(d.name))
    expect(backups.length).toBe(1)
    const again = JSON.parse(backups[backups.length - 1].text)
    expect(again.records).toEqual(JSON.parse(bak.text).records)
    expect(again.nextRef).toBe(JSON.parse(bak.text).nextRef)
    expect(again.groups).toEqual(JSON.parse(bak.text).groups)
    w2.close()
  })

  it('पुरानी (1.0.0) शैली की backup फ़ाइल भी खुलती है — जिन खेतों में gender/सेकंड न हों', async () => {
    const oldStyle = {
      nextRef: 3,
      groups: ['परिवार', 'मित्र'],
      records: [
        { id: 11, ref: 1, name: 'पुराना 1', group: 'परिवार', gender: 'स्त्री', date: '01-01-1970', time: '10:00', country: 'भारत', state: 'मध्य प्रदेश', place: 'बेतूल', lat: 21.9, lon: 77.9, gmt: 5.5, dst: 0 },
        { id: 12, ref: 2, name: 'पुराना 2', group: 'मित्र', date: '02-02-1972', time: '11:30', country: 'भारत', state: 'मध्य प्रदेश', place: 'बेतूल', lat: 21.9, lon: 77.9, gmt: 5.5, dst: 0 }
      ]
    }
    const w = await boot({})
    const file = new w.File([JSON.stringify(oldStyle)], 'old.json', { type: 'application/json' })
    const input = w.document.getElementById('fileIn')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new w.Event('change', { bubbles: true }))
    expect(await waitFor(() => w.document.getElementById('impReplace'))).toBe(true)
    w.document.getElementById('impReplace').click()
    expect(await waitFor(() => listCount(w) === 2)).toBe(true)
    w.document.getElementById('btnBackup').click()
    const bks = w.__downloads.filter((d) => /^bnn-kundli-backup-/.test(d.name))
    expect(bks.length).toBe(1)
    const out = JSON.parse(bks[0].text)
    expect(out.records.length).toBe(2)
    expect(out.records[0].name).toBe('पुराना 1')
    // जिस रिकॉर्ड में gender नहीं था, वह ऐप में पुरुष माना जाता है (गणना में भी यही नियम)
    expect(out.records[1].gender === undefined || out.records[1].gender === 'पुरुष').toBe(true)
    w.close()
  })
})
