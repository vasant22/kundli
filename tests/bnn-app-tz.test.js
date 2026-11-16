// tests/bnn-app-tz.test.js — 1.0.4 / टास्क 02 (16-11-2026)
//
// देश + राज्य + शहर + टाइम-ज़ोन: offset अपने-आप, DST चेकबॉक्स हटा।
// यहाँ असली app/app.js + tz.js + geo.js + places.js को jsdom में चलाकर वही 19 पंक्तियाँ
// जाँची जाती हैं जो टास्क में लिखी हैं, और पुरानी (बिना tz वाली) कुंडली अछूती रहने की जाँच।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '../../../bnn-kundli-windows/app')
const hasApp = fs.existsSync(path.join(APP, 'app.js')) && fs.existsSync(path.join(APP, 'tz.js'))

async function boot(seedRecords) {
  const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8')
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' })
  const w = dom.window
  w.alert = () => {}; w.confirm = () => true; w.print = () => {}
  w.BNNEngine = { compute: async () => { throw new Error('STUB') } }
  if (seedRecords) w.localStorage.setItem('bnn_kundli_v1', JSON.stringify({ records: seedRecords, groups: ['परिवार'], nextRef: 99 }))
  for (const f of ['tz.js', 'geo.js', 'places.js']) {
    const fp = path.join(APP, f)
    if (fs.existsSync(fp)) w.eval(fs.readFileSync(fp, 'utf8'))
  }
  w.eval(fs.readFileSync(path.join(APP, 'app.js'), 'utf8'))
  await new Promise((r) => setTimeout(r, 40))
  if (w.document.querySelectorAll('#fGroup option').length === 0) w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 80))
  return w
}
const $ = (w, id) => w.document.getElementById(id)
function setCountry(w, val) { $(w, 'fCountry').value = val; $(w, 'fCountry').dispatchEvent(new w.Event('change', { bubbles: true })) }
function setGeo(w, lat, lon) {
  $(w, 'fLat').value = String(lat); $(w, 'fLon').value = String(lon)
  $(w, 'fLon').dispatchEvent(new w.Event('input', { bubbles: true }))
}
function setDate(w, v) { $(w, 'fDate').value = v; $(w, 'fDate').dispatchEvent(new w.Event('change', { bubbles: true })) }
function setTime(w, v) { $(w, 'fTime').value = v; $(w, 'fTime').dispatchEvent(new w.Event('change', { bubbles: true })) }
function setTz(w, tz) { $(w, 'fTz').value = tz; $(w, 'fTz').dispatchEvent(new w.Event('input', { bubbles: true })) }
function eff(w) { const o = w.BNN_offNow(); return o ? Math.round((o.gmt + o.dst) * 60) : null }

describe.skipIf(!hasApp)('टाइम-ज़ोन से offset अपने-आप (1.0.4 / टास्क 02)', () => {
  it('देश-सूची: सारे देश, क्रम (भारत पहले → पड़ोसी/प्रवासी → बाक़ी → अन्य), पुराने मान बरकरार', async () => {
    const w = await boot()
    const opts = [...w.document.querySelectorAll('#fCountry option')]
    expect(opts.length).toBeGreaterThan(200)
    expect(opts[0].value).toBe('India')
    expect(opts[1].value).toBe('Nepal')
    expect(opts[opts.length - 1].value).toBe('Other')
    // पुरानी कुंडलियों के चार मान वैसे ही (1.0.3 तक यही सहेजे जाते थे)
    for (const v of ['USA', 'UK', 'UAE']) expect(opts.some((o) => o.value === v)).toBe(true)
    // देश खोज: 'germ' टाइप करते ही छन जाए
    $(w, 'fCountryQ').value = 'germ'
    $(w, 'fCountryQ').dispatchEvent(new w.Event('input', { bubbles: true }))
    const after = [...w.document.querySelectorAll('#fCountry option')].map((o) => o.value)
    expect(after).toContain('Germany')
    expect(after.length).toBeLessThan(5)
    w.close()
  })

  it('भारत: पहले जैसा — पहाड़ी/राज्य सूची और शहर (6,000+)', async () => {
    const w = await boot()
    expect(w.BNN_PLACES.length).toBeGreaterThan(6000)
    expect([...w.document.querySelectorAll('#fState option')].map((o) => o.value)).toContain('Maharashtra')
    w.close()
  })

  it('19 पंक्तियों की तालिका — अपेक्षित offset, gmt और dst', async () => {
    const rows = [
      // देश, दिनांक, समय, tz, lat, lon, अपेक्षित असली offset (मिनट), gmt (घंटे), dst (घंटे)
      ['India', '15-06-1990', '10:00', 'Asia/Kolkata', 19.8036, 72.756, 330, 5.5, 0],
      ['India', '10-03-1875', '10:00', 'Asia/Kolkata', 25.3176, 82.9739, 'lmt', null, 0],
      ['India', '10-03-1930', '10:00', 'Asia/Kolkata', 19.076, 72.8777, 330, 5.5, 0],
      ['India', '10-03-1943', '10:00', 'Asia/Kolkata', 22.5726, 88.3639, 390, 6.5, 0],
      ['India', '20-10-1945', '10:00', 'Asia/Kolkata', 28.6139, 77.209, 330, 5.5, 0],
      ['Nepal', '01-01-1980', '10:00', 'Asia/Kathmandu', 27.7017, 85.3206, 330, 5.5, 0],
      ['Nepal', '01-01-1990', '10:00', 'Asia/Kathmandu', 27.7017, 85.3206, 345, 5.75, 0],
      ['Sri Lanka', '01-01-2000', '10:00', 'Asia/Colombo', 6.9319, 79.8478, 360, 6, 0],
      ['Sri Lanka', '01-01-2010', '10:00', 'Asia/Colombo', 6.9319, 79.8478, 330, 5.5, 0],
      ['Bangladesh', '15-07-2009', '12:00', 'Asia/Dhaka', 23.7104, 90.4074, 420, 6, 1],
      ['USA', '15-07-1990', '14:00', 'America/New_York', 40.7143, -74.006, -240, -5, 1],
      ['USA', '15-01-1990', '14:00', 'America/New_York', 40.7143, -74.006, -300, -5, 0],
      ['UK', '15-06-2000', '12:00', 'Europe/London', 51.5074, -0.1278, 60, 0, 1],
      ['USA', '15-07-2000', '12:00', 'America/Phoenix', 33.4484, -112.074, -420, -7, 0],
      ['Australia', '15-01-2000', '12:00', 'Australia/Sydney', -33.8679, 151.2073, 660, 10, 1],
      ['UAE', '15-06-2000', '12:00', 'Asia/Dubai', 25.2582, 55.3047, 240, 4, 0],
      ['Norway', '01-07-1960', '12:00', 'Europe/Oslo', 59.9127, 10.7461, 60, 1, 0],
    ]
    const w = await boot()
    for (const [country, date, time, tz, lat, lon, expOff, expGmt, expDst] of rows) {
      setCountry(w, country)
      setTz(w, tz)
      setGeo(w, lat, lon)
      setDate(w, date); setTime(w, time)
      const o = w.BNN_offNow()
      const label = country + ' ' + date + ' ' + time
      if (expOff === 'lmt') {
        expect(o && o.kind, label).toBe('lmt')
        expect($(w, 'hGmt').textContent, label).toContain('LMT')
        continue
      }
      expect(o, label).toBeTruthy()
      expect(eff(w), label).toBe(expOff)          // gmt + dst == IANA offset, पूरा
      expect(o.gmt, label).toBe(expGmt)
      expect(o.dst, label).toBe(expDst)
      expect(o.dst >= 0, label).toBe(true)        // dst कभी ऋणात्मक नहीं
      expect($(w, 'hGmt').textContent, label).toBe('')
    }
    w.close()
  })

  it('न मिलने वाला समय (spring-forward) → लाल चेतावनी और कुंडली नहीं बनती', async () => {
    const w = await boot()
    setCountry(w, 'USA'); setTz(w, 'America/New_York'); setGeo(w, 40.7143, -74.006)
    setDate(w, '11-03-2007'); setTime(w, '02:30')
    expect(w.BNN_offNow()).toBeNull()
    expect($(w, 'tzNote').className).toContain('bad')
    expect($(w, 'tzNote').textContent).toContain('नहीं आया')
    // 03:30 उसी दिन ठीक है (घड़ी आगे बढ़ने के बाद) — DST लागू
    setTime(w, '03:30')
    expect(eff(w)).toBe(-240)
    w.close()
  })

  it('दो बार आया समय (fall-back) → पूछता है; “दूसरी बार” चुनने पर मानक offset', async () => {
    const w = await boot()
    setCountry(w, 'USA'); setTz(w, 'America/New_York'); setGeo(w, 40.7143, -74.006)
    setDate(w, '04-11-2007'); setTime(w, '01:30')
    expect(eff(w)).toBe(-240)                    // पहली बार = DST
    const btns = [...w.document.querySelectorAll('#tzNote .tzb')]
    expect(btns.length).toBe(2)
    btns[1].dispatchEvent(new w.MouseEvent('click', { bubbles: true }))
    expect(eff(w)).toBe(-300)                    // दूसरी बार = मानक
    w.close()
  })

  it('GMT ख़ुद लिखा हो तो कभी न छेड़े; DST उसी में माना जाए', async () => {
    const w = await boot()
    setCountry(w, 'USA'); setGeo(w, 40.7143, -74.006)
    $(w, 'fGmt').value = '-04:00'; $(w, 'fGmt').dispatchEvent(new w.Event('input', { bubbles: true }))
    setDate(w, '15-07-1990'); setTime(w, '14:00')
    expect($(w, 'fGmt').value).toBe('-04:00')
    expect($(w, 'tzNote').textContent).toContain('हाथ से भरा')
    const g = w.BNN_gather()
    expect(g.rec.gmt).toBe(-4)
    expect(g.rec.dst).toBe(0)                    // हाथ के offset में DST शामिल माना
    expect(g.rec.tz).toBeUndefined()             // तब tz नहीं सहेजा जाता
    w.close()
  })

  it('पुरानी (बिना tz वाली) कुंडली — खुलने पर gmt/dst ज्यों के त्यों, “सहेजे हुए मान”', async () => {
    const old = {
      id: 'r1', ref: 10, name: 'basant', group: 'परिवार', gender: 'पुरुष', mobile: '',
      date: '22-01-1980', time: '20:30:00', country: 'भारत', countryEN: 'India',
      state: 'मध्य प्रदेश', stateEN: 'Madhya Pradesh', place: 'बेतूल', placeEN: 'Betul',
      lat: 21.9006, lon: 77.9023, gmt: 5.5, gmtText: '+05:30', dst: 0,
    }
    const w = await boot([old])
    w.document.querySelector('.li').dispatchEvent(new w.MouseEvent('click', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 60))
    expect($(w, 'fGmt').value).toBe('+05:30')
    expect($(w, 'tzNote').textContent).toContain('सहेजे हुए मान')
    const g = w.BNN_gather()
    expect(g.rec.gmt).toBe(5.5)
    expect(g.rec.dst).toBe(0)
    expect(g.rec.tz).toBeUndefined()             // पुरानी कुंडली में tz नहीं जुड़ता
    w.close()
  })

  it('पुरानी कुंडली में DST सहेजा था (1) → वह भी बरकरार', async () => {
    const old = {
      id: 'r2', ref: 24, name: 'David Miller', group: 'परिवार', gender: 'पुरुष', mobile: '',
      date: '04-07-1985', time: '12:00:00', country: 'अमेरिका', countryEN: 'USA',
      state: 'New York', stateEN: 'New York', place: 'न्यूयॉर्क', placeEN: 'New York',
      lat: 40.7128, lon: -74.006, gmt: -5, gmtText: '-05:00', dst: 1,
    }
    const w = await boot([old])
    w.document.querySelector('.li').dispatchEvent(new w.MouseEvent('click', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 60))
    const g = w.BNN_gather()
    expect(g.rec.gmt).toBe(-5)
    expect(g.rec.dst).toBe(1)                    // DST खोया नहीं
    w.close()
  })

  it('नई कुंडली — tz सहेजा जाता है (भारत: Asia/Kolkata, gmt 5.5, dst 0)', async () => {
    const w = await boot()
    setCountry(w, 'India')
    $(w, 'fPlace').value = 'Mumbai'
    $(w, 'fLat').value = '19.0728'; $(w, 'fLon').value = '72.8826'
    $(w, 'fLon').dispatchEvent(new w.Event('input', { bubbles: true }))
    setDate(w, '15-06-1990'); setTime(w, '10:00')
    w.document.querySelector('input[name=gender][value="पुरुष"]').checked = true
    const g = w.BNN_gather()
    expect(g.errs.length).toBe(0)
    expect(g.rec.tz).toBe('Asia/Kolkata')
    expect(g.rec.gmt).toBe(5.5)
    expect(g.rec.dst).toBe(0)
    expect(g.rec.gmtText).toBe('+05:30')
    w.close()
  })
})
