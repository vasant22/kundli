// tests/bnn-places.test.js — राउंड 65 / टास्क 06-ख (4-11-2026)
//
// स्थान-सूची (app/places.js) की जाँच — ग़लत अक्षांश/देशांतर/राज्य = ग़लत कुंडली।
// सूची केवल भारत की है (GeoNames से, 11-10-2026), इसलिए हर स्थान भारत के दायरे में
// होना चाहिए और **हर राज्य/केंद्रशासित प्रदेश** का कम-से-कम एक स्थान होना चाहिए
// (वरना form में राज्य चुनकर कुछ नहीं मिलता — यही गड़बड़ 06-ख में मिली थी)।
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const W = path.resolve(__dirname, '../../../bnn-kundli-windows')
const hasApp = fs.existsSync(path.join(W, 'app/places.js'))

function loadPlaces() {
  const w = {}
  new Function('window', fs.readFileSync(path.join(W, 'app/places.js'), 'utf8'))(w)
  return w.BNN_PLACES
}
function appStates() {
  const js = fs.readFileSync(path.join(W, 'app/app.js'), 'utf8')
  const m = /var STATES = \[([\s\S]*?)\];/.exec(js)
  return [...m[1].matchAll(/\['([^']+)',\s*'[^']*'\]/g)].map((x) => x[1])
}

describe.runIf(hasApp)('स्थान-सूची (places.js) — भरोसे की जाँच', () => {
  const P = hasApp ? loadPlaces() : []

  it('सूची में 6500+ स्थान हैं और हर प्रविष्टि में नाम/राज्य/अक्षांश/देशांतर है', () => {
    expect(P.length).toBeGreaterThan(6500)
    for (const p of P) {
      expect(typeof p[0], 'नाम').toBe('string')
      expect(p[0].trim().length, 'ख़ाली नाम').toBeGreaterThan(0)
      expect(typeof p[2], 'राज्य').toBe('string')
      expect(Number.isFinite(p[3]) && Number.isFinite(p[4]), p[0] + ' के निर्देशांक').toBe(true)
    }
  })

  it('हर स्थान भारत के दायरे में है (lat 6–37, lon 68–98) और अक्षांश/देशांतर की सीमा में', () => {
    const bad = P.filter((p) => !(p[3] >= -90 && p[3] <= 90 && p[4] >= -180 && p[4] <= 180))
    expect(bad, 'सीमा से बाहर: ' + bad.slice(0, 5).map((p) => p[0]).join(', ')).toEqual([])
    const outside = P.filter((p) => !(p[3] >= 6 && p[3] <= 37.2 && p[4] >= 68 && p[4] <= 97.5))
    expect(outside, 'भारत से बाहर: ' + outside.slice(0, 5).map((p) => p[0] + ' ' + p[3] + ',' + p[4]).join(' | ')).toEqual([])
  })

  it('form का हर राज्य/केंद्रशासित प्रदेश data में मौजूद है (कम-से-कम एक स्थान)', () => {
    const states = appStates()
    expect(states.length).toBeGreaterThanOrEqual(36)
    const have = new Set(P.map((p) => p[2]))
    const missing = states.filter((s) => !have.has(s))
    expect(missing, 'इन राज्यों का कोई स्थान नहीं: ' + missing.join(', ')).toEqual([])
  })

  it('data में कोई ऐसा राज्य नहीं जो form की सूची में ही न हो', () => {
    const states = new Set(appStates())
    const extra = [...new Set(P.map((p) => p[2]))].filter((s) => !states.has(s))
    expect(extra).toEqual([])
  })

  it('एक ही निर्देशांक पर दो अलग नाम — केवल जाने-पहचाने जोड़े (Daman/Nani Daman)', () => {
    const seen = new Map()
    const dups = []
    for (const p of P) {
      const k = p[3].toFixed(4) + ',' + p[4].toFixed(4)
      if (seen.has(k)) dups.push(p[0] + ' = ' + seen.get(k))
      else seen.set(k, p[0])
    }
    expect(dups).toEqual(['Daman = Nani Daman'])
  })

  it('बड़े शहरों के निर्देशांक ठीक हैं (±0.5°)', () => {
    const want = { Mumbai: [19.07, 72.88], Delhi: [28.65, 77.23], Chennai: [13.08, 80.27], Kolkata: [22.57, 88.36], Bengaluru: [12.97, 77.59] }
    for (const [name, [lat, lon]] of Object.entries(want)) {
      const p = P.find((x) => x[0] === name)
      expect(p, name + ' सूची में नहीं').toBeTruthy()
      expect(Math.abs(p[3] - lat), name + ' अक्षांश').toBeLessThan(0.5)
      expect(Math.abs(p[4] - lon), name + ' देशांतर').toBeLessThan(0.5)
      expect(p[2], name + ' राज्य').toBeTruthy()
    }
  })

  it('ज़िला-मुख्यालय मौजूद हैं (07-ख में जोड़े गए): Tawang, Champhai, Dharwad, Mangaldoi, Golaghat', () => {
    for (const n of ['Tawang', 'Champhai', 'Dharwad', 'Mangaldoi', 'Golaghat', 'Sarupathar']) {
      const p = P.find((x) => x[0] === n)
      expect(p, n + ' सूची में नहीं').toBeTruthy()
      expect(p[3] > 6 && p[3] < 37 && p[4] > 68 && p[4] < 98, n + ' के निर्देशांक').toBe(true)
    }
    // Sarupathar असम में, गोलाघाट के पास (26.0–26.3, 93.7–94.1) — 96.81 वाली ग़लत प्रविष्टि नहीं
    const sar = P.filter((x) => x[0] === 'Sarupathar')
    expect(sar.length).toBe(1)
    expect(sar[0][2]).toBe('Assam')
    expect(sar[0][3]).toBeGreaterThan(26.0)
    expect(sar[0][3]).toBeLessThan(26.3)
    expect(sar[0][4]).toBeGreaterThan(93.7)
    expect(sar[0][4]).toBeLessThan(94.1)
  })

  it('राज्य-नाम की जाँच: Daman & Diu के स्थान अब उसी राज्य में हैं, Dadra & Nagar Haveli में नहीं', () => {
    const diu = P.find((p) => p[0] === 'Diu')
    expect(diu[2]).toBe('Daman & Diu')
    const daman = P.find((p) => p[0] === 'Daman')
    expect(daman[2]).toBe('Daman & Diu')
    // असाम की सीमा से बाहर वाली "Sarupathar" प्रविष्टि नहीं होनी चाहिए (96.81E असाम में नहीं)
    const bad = P.filter((p) => p[0] === 'Sarupathar' && p[2] === 'Assam' && p[4] > 95.5)
    expect(bad).toEqual([])
  })
})
