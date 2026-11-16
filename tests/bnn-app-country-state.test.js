// tests/bnn-app-country-state.test.js — 1.0.4 / टास्क 03 (16-11-2026)
//
// असली bug: देश का dropdown चुपचाप बदल जाता था (खोज-खाना सूची दोबारा बनाता था और
// change नहीं भेजता), इसलिए राज्य-खाना भारत का ही रहता था — और "Arlington, Maharashtra"
// जैसा राज्य सहेज लिया जाता था। अब एक ही देश-खाना है और राज्य सदा उसी देश का।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP, 'app.js')) && fs.existsSync(path.join(APP, 'tz.js'))

// देश-फ़ाइलें jsdom में लोड नहीं होतीं — इसलिए वही ढाँचा पहले से रख देते हैं जो ऐप लोड करता है
const GEO_SEED = {
  PK: { s: [['PK-BA', 'Balochistan'], ['PK-KP', 'Khyber Pakhtunkhwa'], ['PK-PB', 'Punjab'], ['PK-SD', 'Sindh'], ['PK-JK', 'Azad Kashmir'], ['PK-GB', 'Gilgit-Baltistan'], ['PK-IS', 'Islamabad']], p: [] },
  US: { s: [['TX', 'Texas'], ['NY', 'New York'], ['CA', 'California']], p: [] },
  NP: { s: [['3', 'Bagmati Province'], ['4', 'Gandaki Pradesh']], p: [] },
}

async function boot(seed) {
  const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8')
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
  const w = dom.window
  w.alert = () => {}; w.confirm = () => true
  w.BNNEngine = { compute: async () => { throw new Error('STUB') } }
  if (seed) w.localStorage.setItem('bnn_kundli_v1', JSON.stringify({ records: seed, groups: ['परिवार'], nextRef: 99 }))
  for (const f of ['tz.js', 'geo.js', 'places.js']) {
    const fp = path.join(APP, f)
    if (fs.existsSync(fp)) w.eval(fs.readFileSync(fp, 'utf8'))
  }
  w.BNN_GEO_PLACES = JSON.parse(JSON.stringify(GEO_SEED))
  w.eval(fs.readFileSync(path.join(APP, 'app.js'), 'utf8'))
  await new Promise((r) => setTimeout(r, 40))
  if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 90))
  return w
}
const $ = (w, id) => w.document.getElementById(id)
const stateVals = (w) => [...w.document.querySelectorAll('#fState option')].map((o) => o.value)
// देश चुनना — असली रास्ता: खाने में टाइप + पहला सुझाव (माउस)
function pickCountry(w, text, how) {
  const t = $(w, 'fCountryTxt'), box = $(w, 'countrySugg')
  t.focus()
  if (how === 'type') {
    t.value = text
    t.dispatchEvent(new w.Event('input', { bubbles: true }))
    t.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    return
  }
  t.value = text
  t.dispatchEvent(new w.Event('input', { bubbles: true }))
  const it = box.querySelector('.sItem[data-ci]')
  if (it) it.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true }))
}

describe.skipIf(!hasApp)('देश बदलने पर राज्य सदा उसी देश का (1.0.4 / टास्क 03)', () => {
  it('भारत → भारतीय राज्य; पाकिस्तान → उसके ही प्रांत (कोई भारतीय राज्य नहीं)', async () => {
    const w = await boot()
    expect($(w, 'fState').value).toBe('Maharashtra')          // शुरू में भारत
    pickCountry(w, 'Pakistan', 'mouse')
    expect($(w, 'fCountry').value).toBe('Pakistan')
    const vals = stateVals(w)
    expect(vals).toContain('Sindh')
    expect(vals).not.toContain('Maharashtra')
    expect($(w, 'fState').value).toBe('')                    // कोई भारतीय राज्य पहले से चुना नहीं
    expect($(w, 'fCountryTxt').value).toBe('Pakistan')       // खाने में अंग्रेज़ी नाम
    w.close()
  })

  it('टाइप करके (Enter) देश बदलना — वही नतीजा', async () => {
    const w = await boot()
    pickCountry(w, 'usa', 'type')
    expect($(w, 'fCountry').value).toBe('USA')
    expect(stateVals(w)).toContain('Texas')
    expect(stateVals(w)).not.toContain('Maharashtra')
    expect($(w, 'fTz').value).toBe('America/New_York')     // देश का डिफ़ॉल्ट ज़ोन भी बदला
    w.close()
  })

  it('अमेरिका + Arlington → राज्य ख़ाली/अमेरिकी ही; “महाराष्ट्र” कभी नहीं (रिफ़ 29 वाला bug)', async () => {
    const w = await boot()
    pickCountry(w, 'USA', 'mouse')
    $(w, 'fPlace').value = 'Arlington'
    $(w, 'fLat').value = '32.7357'; $(w, 'fLon').value = '-97.1081'
    $(w, 'fLon').dispatchEvent(new w.Event('input', { bubbles: true }))
    const d = $(w, 'fDate'); d.value = '15-06-1990'; d.dispatchEvent(new w.Event('change', { bubbles: true }))
    const t = $(w, 'fTime'); t.value = '10:00:00'; t.dispatchEvent(new w.Event('change', { bubbles: true }))
    w.document.querySelector('input[name=gender][value="पुरुष"]').checked = true
    const g = w.BNN_gather()
    expect(g.rec.countryEN).toBe('USA')
    expect(g.rec.stateEN).not.toBe('Maharashtra')
    expect(g.rec.stateEN === '' || ['Texas', 'New York', 'California'].indexOf(g.rec.stateEN) > -1).toBe(true)
    w.close()
  })

  it('सिंगापुर → राज्य-खाना बंद; “Other” → ख़ुद लिखें', async () => {
    const w = await boot()
    pickCountry(w, 'Singapore', 'mouse')
    expect($(w, 'fState').disabled).toBe(true)
    expect(stateVals(w)).toEqual([''])
    expect($(w, 'fStateTxt').hidden).toBe(true)
    pickCountry(w, 'Other', 'mouse')
    expect($(w, 'fStateTxt').hidden).toBe(false)
    $(w, 'fStateTxt').value = 'Sindh (manual)'
    $(w, 'fPlace').value = 'Karachi'
    $(w, 'fLat').value = '24.86'; $(w, 'fLon').value = '67.01'
    $(w, 'fLon').dispatchEvent(new w.Event('input', { bubbles: true }))
    const d = $(w, 'fDate'); d.value = '15-06-1990'; d.dispatchEvent(new w.Event('change', { bubbles: true }))
    const t = $(w, 'fTime'); t.value = '10:00:00'; t.dispatchEvent(new w.Event('change', { bubbles: true }))
    w.document.querySelector('input[name=gender][value="पुरुष"]').checked = true
    const g = w.BNN_gather()
    expect(g.rec.stateEN).toBe('Sindh (manual)')
    w.close()
  })

  it('सहेजी कुंडली (अमेरिका + Texas) खोलकर भारत पर लौटना और फिर अमेरिका', async () => {
    const rec = {
      id: 'r1', ref: 29, name: 'om', group: 'परिवार', gender: 'पुरुष', mobile: '',
      date: '15-06-1990', time: '10:00:00', country: 'अमेरिका', countryEN: 'USA',
      state: 'Texas', stateEN: 'Texas', place: 'Arlington', placeEN: 'Arlington',
      lat: 32.7357, lon: -97.1081, gmt: -5, gmtText: '-05:00', dst: 1,
    }
    const w = await boot([rec])
    w.document.querySelector('.li').dispatchEvent(new w.MouseEvent('click', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 80))
    expect($(w, 'fCountry').value).toBe('USA')
    expect($(w, 'fState').value).toBe('Texas')
    expect(stateVals(w)).not.toContain('Maharashtra')
    pickCountry(w, 'India', 'mouse')                       // भारत
    expect($(w, 'fState').value).toBe('Maharashtra')
    pickCountry(w, 'Pakistan', 'mouse')                    // फिर पाकिस्तान
    expect(stateVals(w)).not.toContain('Maharashtra')
    expect($(w, 'fState').value).toBe('')
    w.close()
  })

  it('नेपाल: राज्य-सूची नेपाल की; सहेजने पर वही राज्य जाता है', async () => {
    const w = await boot()
    pickCountry(w, 'Nepal', 'mouse')
    expect(stateVals(w)).toContain('Bagmati Province')
    $(w, 'fState').value = 'Bagmati Province'
    $(w, 'fState').dispatchEvent(new w.Event('change', { bubbles: true }))
    $(w, 'fPlace').value = 'Kathmandu'
    $(w, 'fLat').value = '27.7017'; $(w, 'fLon').value = '85.3206'
    $(w, 'fLon').dispatchEvent(new w.Event('input', { bubbles: true }))
    const d = $(w, 'fDate'); d.value = '01-01-1990'; d.dispatchEvent(new w.Event('change', { bubbles: true }))
    const t = $(w, 'fTime'); t.value = '10:00:00'; t.dispatchEvent(new w.Event('change', { bubbles: true }))
    w.document.querySelector('input[name=gender][value="स्त्री"]').checked = true
    const g = w.BNN_gather()
    expect(g.rec.countryEN).toBe('Nepal')
    expect(g.rec.stateEN).toBe('Bagmati Province')
    expect(g.rec.gmt).toBe(5.75)
    w.close()
  })
})
