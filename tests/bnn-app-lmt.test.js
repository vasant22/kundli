// tests/bnn-app-lmt.test.js — राउंड 65 / टास्क 07-ग (4-11-2026)
//
// भारत में 1906 से पहले समय स्थानीय (LMT) था। जन्म-तारीख़ 01-01-1906 से पहले + स्थान भारत
// + offset हमारा (user ने ख़ुद नहीं लिखा) → GMT खाना देशांतर/15 से भर जाए और सूचना दिखे।
// user ने offset ख़ुद लिखा हो तो **कभी** न बदले। बॉम्बे/कलकत्ता पर सिर्फ़ सूचना (बदलाव नहीं)।
// 1.0.4 / टास्क 02 (16-11-2026): अब हर देश के लिए offset टाइम-ज़ोन से अपने-आप तय होता है।
//   • भारत: 1906 से पहले LMT, उसके बाद +05:30 — यही पहले भी था।
//   • भारत से बाहर: जिस तारीख़ का IANA offset 15 मिनट का गुणज न हो (LMT-युग) → देशांतर से LMT।
//     इसलिए “भारत के बाहर → LMT नहीं” वाली पुरानी जाँच अब उलट गई है (नीचे)।
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
  w.BNN_PLACES = []
  w.alert = () => {}; w.confirm = () => true
  w.BNNEngine = { compute: async () => { throw new Error('STUB') } }
  // 1.0.4 / टास्क 02: offset का हिसाब tz.js + देश-सूची geo.js से (jsdom <script src> नहीं चलाता)
  for (const f of ['tz.js', 'geo.js', 'places.js']) {
    const fp = path.join(APP, f)
    if (fs.existsSync(fp)) w.eval(fs.readFileSync(fp, 'utf8'))
  }
  w.eval(fs.readFileSync(path.join(APP, 'app.js'), 'utf8'))
  await new Promise((r) => setTimeout(r, 40))
  if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 60))
  return w
}
const $ = (w, id) => w.document.getElementById(id)
function setDate(w, v) { $(w, 'fDate').value = v; $(w, 'fDate').dispatchEvent(new w.Event('change', { bubbles: true })) }
function setGeo(w, lat, lon) {
  $(w, 'fLat').value = String(lat); $(w, 'fLon').value = String(lon)
  $(w, 'fLon').dispatchEvent(new w.Event('input', { bubbles: true }))
}
function typeGmt(w, v) { $(w, 'fGmt').value = String(v); $(w, 'fGmt').dispatchEvent(new w.Event('input', { bubbles: true })) }

describe.runIf(hasApp)('1906 से पहले का जन्म — स्थानीय समय (LMT)', () => {
  it('1875 वाराणसी (82.97°E) → GMT अपने-आप +05:31:54 (पूरे सेकंड), सूचना में वही LMT', async () => {
    const w = await boot()
    setGeo(w, 25.3176, 82.9739)
    setDate(w, '12-09-1875')
    expect($(w, 'fGmt').value).toBe('+05:31:54')               // 19914 सेकंड = 5:31:54
    const hint = $(w, 'hGmt').textContent
    expect(hint).toContain('LMT')
    expect(hint).toContain('+05:31:54')
    w.close()
  })

  it('सीमा: 31-12-1905 पर LMT लगता है, 01-01-1906 पर नहीं', async () => {
    const w = await boot()
    setGeo(w, 25.3176, 82.9739)
    typeGmt(w, 5.5)                        // user ने ख़ुद भरा → अब कभी न बदले (नीचे अलग जाँच)
    const w2 = await boot()
    setGeo(w2, 25.3176, 82.9739)
    setDate(w2, '31-12-1905')
    expect($(w2, 'fGmt').value).toBe('+05:31:54')              // सेकंड सहित LMT
    expect($(w2, 'hGmt').textContent).toContain('LMT')
    setDate(w2, '01-01-1906')
    expect($(w2, 'hGmt').textContent).toBe('')                 // 1906 से सूचना नहीं
    expect($(w2, 'fGmt').value).toBe('+05:30')                 // 1.0.4: अब साल का सही मानक offset
    w.close(); w2.close()
  })

  it('user ने offset ख़ुद लिखा हो तो कभी नहीं बदलता', async () => {
    const w = await boot()
    setGeo(w, 25.3176, 82.9739)
    typeGmt(w, 5.25)                        // ख़ुद लिखा
    setDate(w, '12-09-1875')
    expect(Number($(w, 'fGmt').value)).toBe(5.25)              // अछूता
    expect($(w, 'hGmt').textContent).toBe('')
    w.close()
  })

  it('भारत के बाहर 1875 — जहाँ उस समय मानक समय नहीं था वहाँ भी LMT (1.0.4)', async () => {
    const w = await boot()
    setGeo(w, 40.7128, -74.006)
    $(w, 'fCountry').value = 'USA'
    $(w, 'fCountry').dispatchEvent(new w.Event('change', { bubbles: true }))
    setDate(w, '12-09-1875')
    // न्यूयॉर्क 1875 में घड़ी स्थानीय समय पर थी (IANA: −04:56:02) → देशांतर से LMT −04:56:01
    expect($(w, 'fGmt').value).toBe('-04:56:01')
    expect($(w, 'hGmt').textContent).toContain('LMT')
    // लंदन 1875 में GMT पहले से चलता था (offset 15 मिनट का गुणज) → LMT नहीं
    const w2 = await boot()
    setGeo(w2, 51.5074, -0.1278)
    $(w2, 'fCountry').value = 'UK'
    $(w2, 'fCountry').dispatchEvent(new w2.Event('change', { bubbles: true }))
    setDate(w2, '12-09-1875')
    expect($(w2, 'fGmt').value).toBe('+00:00')
    expect($(w2, 'hGmt').textContent).toBe('')
    w2.close()
    w.close()
  })

  it('बॉम्बे 1940 → सिर्फ़ सूचना (offset अपने-आप नहीं बदलता); कलकत्ता 1940 → वही', async () => {
    const w = await boot()
    $(w, 'fPlace').value = 'Mumbai'
    setGeo(w, 19.0728, 72.8826)
    setDate(w, '10-10-1940')
    expect($(w, 'fGmt').value).toBe('+05:30')                  // 1.0.4: टाइम-ज़ोन से +05:30
    expect($(w, 'hGmt').textContent).toContain('बॉम्बे')
    $(w, 'fPlace').value = 'Kolkata'
    $(w, 'fPlace').dispatchEvent(new w.Event('change', { bubbles: true }))
    expect($(w, 'hGmt').textContent).toContain('कलकत्ता')
    expect($(w, 'fGmt').value).toBe('+05:30')
    w.close()
  })
})
