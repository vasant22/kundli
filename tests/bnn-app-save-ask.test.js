// tests/bnn-app-save-ask.test.js — राउंड 65 / टास्क 07-क (4-11-2026)
//
// **data खोने वाला bug:** पुरानी कुंडली खोलकर उसमें दूसरे व्यक्ति का नाम/जन्म-विवरण भरकर
// "सहेजें" दबाने पर वह पुरानी कुंडली चुपचाप मिट जाती थी। अब ऐसे में पूछा जाता है —
// "नई कुंडली सहेजें" (default) / "पुरानी बदलें" / "रद्द"।
// यहाँ असली app/app.js को jsdom में चलाकर चारों हालतें और **रिकॉर्ड-संख्या** जाँची जाती हैं।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP, 'app.js'))

const OLD = {
  id: 1, ref: 1, name: 'basant', group: 'परिवार', gender: 'पुरुष', mobile: '9999900001',
  date: '22-01-1980', time: '20:30:00', country: 'भारत', countryEN: 'India',
  state: 'मध्य प्रदेश', stateEN: 'Madhya Pradesh', place: 'बेतूल', placeEN: 'Betul',
  lat: 21.9006, lon: 77.9023, gmt: 5.5, dst: 0
}

async function boot() {
  const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8')
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
  const w = dom.window
  w.localStorage.setItem('bnn_kundli_v1', JSON.stringify({ nextRef: 2, groups: ['परिवार', 'मित्र'], records: [OLD] }))
  w.BNN_PLACES = []
  w.alert = () => {}; w.confirm = () => true
  w.BNNEngine = { compute: async () => { throw new Error('STUB') } }
  w.eval(fs.readFileSync(path.join(APP, 'app.js'), 'utf8'))
  await new Promise((r) => setTimeout(r, 40))
  if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 60))
  return w
}
const waitFor = async (fn, ms = 3000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { try { if (fn()) return true } catch (e) {} await new Promise((r) => setTimeout(r, 25)) }
  return false
}
const recs = (w) => JSON.parse(w.localStorage.getItem('bnn_kundli_v1')).records
const openOld = async (w) => {
  w.document.querySelector('#list .li').click()      // सूची से पुरानी कुंडली खोलो
  await new Promise((r) => setTimeout(r, 80))
}
const setForm = (w, o) => {
  const $ = (id) => w.document.getElementById(id)
  if ('name' in o) $('fName').value = o.name
  if ('date' in o) $('fDate').value = o.date
  if ('time' in o) $('fTime').value = o.time
  if ('place' in o) $('fPlace').value = o.place
  if ('lat' in o) $('fLat').value = o.lat
  if ('lon' in o) $('fLon').value = o.lon
  if ('group' in o) $('fGroup').value = o.group
  if ('mobile' in o) $('fMobile').value = o.mobile
  if ('gender' in o) for (const g of w.document.getElementsByName('gender')) g.checked = (g.value === o.gender)
}

describe.runIf(hasApp)('पुरानी कुंडली का चुपचाप overwrite — अब पूछकर', () => {
  it('दूसरे व्यक्ति का विवरण भरकर सहेजें → खिड़की आती है; "नई कुंडली" से नया रिकॉर्ड बनता है, पुराना वैसा ही', async () => {
    const w = await boot()
    const n0 = recs(w).length
    await openOld(w)
    setForm(w, { name: 'दूसरा व्यक्ति', date: '15-08-1990', time: '05:10:00' })
    w.document.getElementById('btnSave').click()
    expect(await waitFor(() => w.document.getElementById('owNew')), 'पूछने वाली खिड़की नहीं आई').toBe(true)
    expect(w.document.getElementById('owModal').textContent).toContain('basant')   // पुराने का नाम दिखे
    w.document.getElementById('owNew').click()
    await waitFor(() => recs(w).length === n0 + 1)
    const r = recs(w)
    expect(r.length).toBe(n0 + 1)                       // एक नया जुड़ा
    expect(r[0].name).toBe('basant')                    // पुराना ज्यों का त्यों
    expect(r[0].date).toBe('22-01-1980')
    expect(r[1].name).toBe('दूसरा व्यक्ति')
    expect(r[1].ref).toBe(2)                            // अगला संदर्भ क्रमांक
    w.close()
  })

  it('वही हालत, "पुरानी बदलें" → रिकॉर्ड-संख्या वही, वही रिकॉर्ड नए विवरण से बदलता है', async () => {
    const w = await boot()
    const n0 = recs(w).length
    await openOld(w)
    setForm(w, { name: 'सुधरा नाम', time: '20:31:00' })
    w.document.getElementById('btnSave').click()
    expect(await waitFor(() => w.document.getElementById('owReplace'))).toBe(true)
    w.document.getElementById('owReplace').click()
    await waitFor(() => recs(w)[0].name === 'सुधरा नाम')
    const r = recs(w)
    expect(r.length).toBe(n0)                           // संख्या वही
    expect(r[0].ref).toBe(1)                            // संदर्भ वही
    expect(r[0].name).toBe('सुधरा नाम')
    expect(r[0].time).toBe('20:31:00')
    w.close()
  })

  it('"रद्द" → कुछ नहीं बदलता (संख्या और रिकॉर्ड दोनों वैसे ही)', async () => {
    const w = await boot()
    const n0 = recs(w).length
    const before = JSON.stringify(recs(w))
    await openOld(w)
    setForm(w, { name: 'रद्द वाला', date: '01-01-2000' })
    w.document.getElementById('btnSave').click()
    expect(await waitFor(() => w.document.getElementById('owCancel'))).toBe(true)
    w.document.getElementById('owCancel').click()
    await new Promise((r) => setTimeout(r, 200))
    expect(recs(w).length).toBe(n0)
    expect(JSON.stringify(recs(w))).toBe(before)
    w.close()
  })

  it('कुछ बदला ही न हो → कोई सवाल नहीं, संख्या वही', async () => {
    const w = await boot()
    const n0 = recs(w).length
    await openOld(w)
    w.document.getElementById('btnSave').click()
    await new Promise((r) => setTimeout(r, 250))
    expect(w.document.getElementById('owModal')).toBeNull()
    expect(recs(w).length).toBe(n0)
    w.close()
  })

  it('सिर्फ़ group/मोबाइल बदला हो (वही व्यक्ति) → कोई सवाल नहीं, वही रिकॉर्ड सुधरता है', async () => {
    const w = await boot()
    const n0 = recs(w).length
    await openOld(w)
    setForm(w, { group: 'मित्र', mobile: '8888800000' })
    w.document.getElementById('btnSave').click()
    await new Promise((r) => setTimeout(r, 250))
    expect(w.document.getElementById('owModal')).toBeNull()
    const r = recs(w)
    expect(r.length).toBe(n0)
    expect(r[0].group).toBe('मित्र')
    expect(r[0].mobile).toBe('8888800000')
    w.close()
  })

  it('"कुंडली देखें" (silent save) पर भी वही सवाल — और रद्द करने पर कुंडली नहीं खुलती', async () => {
    const w = await boot()
    const n0 = recs(w).length
    await openOld(w)
    setForm(w, { name: 'देखें वाला', date: '05-05-2005', time: '10:00:00' })
    w.document.getElementById('btnShow').click()
    expect(await waitFor(() => w.document.getElementById('owCancel'))).toBe(true)
    w.document.getElementById('owCancel').click()
    await new Promise((r) => setTimeout(r, 200))
    expect(recs(w).length).toBe(n0)
    expect(w.BNN_LAST).toBeUndefined()      // गणना शुरू ही नहीं हुई
    w.close()
  })
})
