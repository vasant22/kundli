// tests/phal-text-hi.test.js — फलादेश का हिंदी text: पूरा, साफ़ और सुरक्षित.
//
// जाँच के तीन स्तर:
//   1. ढाँचा — हर ग्रह × हर भाव, हर भावेश × हर भाव, 27 नक्षत्र, 16 वर्ग, 12 राशि…
//   2. भाषा — "1वें/2वें" जैसा अंक-रूप नहीं, संख्यावाचक शब्द सही।
//   3. सुरक्षा — डराने वाले शब्द नहीं, किसी व्यक्ति/software/website का नाम नहीं,
//      निश्चित भविष्यवाणी ("ज़रूर होगा") नहीं।
import { describe, expect, it } from 'vitest'
import * as T from '../src/phal/text-hi.js'
import { ordinalHi } from '../src/phal/text.js'
import { ALL_KEYS, SEVEN_KEYS } from '../src/phal/frame.js'
import { VARGA_ORDERS } from '../src/phal/vargas.js'

const KEYS = { sun: 'su', moon: 'mo', mars: 'ma', mercury: 'me', jupiter: 'ju', venus: 've', saturn: 'sa', rahu: 'ra', ketu: 'ke' }
const H = Array.from({ length: 12 }, (_, i) => i + 1)

// हर text इकट्ठा करो (जाँच के लिए)
function allTexts() {
  const out = []
  const walk = (node, path) => {
    if (typeof node === 'string') { out.push([path, node]); return }
    if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`)
  }
  for (const [k, v] of Object.entries(T)) walk(v, k)
  return out
}

describe('ढाँचा — सब entries मौजूद और ख़ाली नहीं', () => {
  it('ग्रह भाव में: 9 × 12 = 108', () => {
    let n = 0
    for (const key of ALL_KEYS) {
      const row = T.PLANET_IN_HOUSE[KEYS[key]]
      expect(row, KEYS[key]).toBeTruthy()
      for (const h of H) {
        expect(typeof row[h], `${KEYS[key]}/${h}`).toBe('string')
        expect(row[h].length).toBeGreaterThan(15)
        n++
      }
    }
    expect(n).toBe(108)
  })

  it('भावेश भाव में: 12 × 12 = 144', () => {
    let n = 0
    for (const lord of H) {
      for (const placed of H) {
        expect(typeof T.LORD_IN_HOUSE[lord][placed], `${lord}/${placed}`).toBe('string')
        expect(T.LORD_IN_HOUSE[lord][placed].length).toBeGreaterThan(15)
        n++
      }
    }
    expect(n).toBe(144)
  })

  it('लग्न 12 · राशि 12 · नक्षत्र 27', () => {
    expect(Object.keys(T.LAGNA).length).toBe(12)
    expect(Object.keys(T.MOON_RASHI).length).toBe(12)
    expect(Object.keys(T.NAKSHATRA).length).toBe(27)
    for (const i of H) expect(T.LAGNA[i].length).toBeGreaterThan(20)
    for (let i = 1; i <= 27; i++) expect(T.NAKSHATRA[i].length).toBeGreaterThan(15)
  })

  it('कारकत्व 9 · भाव-विषय 12 · स्थिति-टिप्पणी', () => {
    expect(Object.keys(T.KARAKATVA).length).toBe(9)
    expect(Object.keys(T.HOUSE_TOPICS).length).toBe(12)
    for (const level of ['exalted', 'moolatrikona', 'own', 'adhimitra', 'mitra', 'sama', 'shatru', 'adhishatru', 'debilitated', 'combust', 'retrograde', 'vargottama', 'digbala']) {
      expect(typeof T.DIGNITY_NOTES[level], level).toBe('string')
      expect(T.DIGNITY_NOTES[level].length).toBeGreaterThan(20)
    }
  })

  it('दशा 9 + template', () => {
    expect(Object.keys(T.DASHA).length).toBe(9)
    expect(T.DASHA_TEMPLATE.hi).toContain('{owner}')
    expect(T.DASHA_TEMPLATE.hi).toContain('{sitHouse}')
    expect(T.DASHA_TEMPLATE.antar).toContain('{antar}')
  })

  it('योग — टास्क 01 के सारे id मौजूद', () => {
    const ids = ['gajakesari', 'budhaditya', 'ruchaka', 'bhadra', 'hamsa', 'malavya', 'shasha',
      'rajayoga', 'dhana', 'vipareeta', 'harsha', 'sarala', 'vimala', 'neechabhanga',
      'sunapha', 'anapha', 'durudhara', 'kemadruma', 'adhi', 'chandra-mangal', 'amala',
      'parivartana', 'veshi', 'vashi', 'ubhayachari', 'shakata']
    for (const id of ids) {
      expect(typeof T.YOGA_TEXT[id], id).toBe('string')
      expect(T.YOGA_TEXT[id].length).toBeGreaterThan(30)
    }
    expect(Object.keys(T.YOGA_TEXT).length).toBe(ids.length)
  })

  it('दोष — मंगल, कालसर्प, गुरु-चांडाल, साढ़ेसाती के तीन चरण, ढैया', () => {
    for (const k of ['mangal', 'kaalSarpa', 'guruChandal', 'sadesati1', 'sadesati2', 'sadesati3', 'dhaiya']) {
      expect(typeof T.DOSHA_TEXT[k], k).toBe('string')
      expect(T.DOSHA_TEXT[k].length).toBeGreaterThan(40)
    }
    // "आधुनिक/परवर्ती" वाले दोषों में यह बात text में भी होनी चाहिए
    expect(T.DOSHA_TEXT.kaalSarpa).toMatch(/आधुनिक/)
    expect(T.DOSHA_TEXT.guruChandal).toMatch(/परवर्ती/)
  })

  it('गोचर: 4 ग्रह × 12 भाव = 48', () => {
    let n = 0
    for (const key of ['ju', 'sa', 'ra', 'ke']) {
      for (const h of H) {
        expect(typeof T.GOCHAR[key][h], `${key}/${h}`).toBe('string')
        expect(T.GOCHAR[key][h].length).toBeGreaterThan(15)
        n++
      }
    }
    expect(n).toBe(48)
  })

  it('षोडश वर्ग — ठीक 16 keys, वही जो गणना में हैं', () => {
    expect(Object.keys(T.VARGA_TEXT).map(Number).sort((a, b) => a - b)).toEqual(VARGA_ORDERS)
    for (const n of VARGA_ORDERS) expect(T.VARGA_TEXT[n].length).toBeGreaterThan(15)
    expect(T.D60_NOTE.shubha.length).toBeGreaterThan(20)
    expect(T.D60_NOTE.ashubha.length).toBeGreaterThan(20)
  })

  it('उपाय: 9 ग्रह (निःशुल्क + रत्न) और एक सामान्य सावधानी', () => {
    for (const key of ALL_KEYS) {
      const u = T.UPAYA[KEYS[key]]
      expect(typeof u.free, KEYS[key]).toBe('string')
      expect(typeof u.gem, KEYS[key]).toBe('string')
      expect(u.free.length).toBeGreaterThan(20)
    }
    expect(T.UPAYA.caution).toContain('ज्योतिषी')
    expect(T.UPAYA.caution).toContain('परखकर')
  })

  it('अध्याय-परिचय, शब्दकोश और अंतिम नोट', () => {
    expect(Object.keys(T.CHAPTER_INTRO).length).toBeGreaterThanOrEqual(12)
    expect(Object.keys(T.GLOSSARY).length).toBeGreaterThanOrEqual(28)
    expect(T.CLOSING_NOTE).toContain('मार्गदर्शन')
    expect(T.CLOSING_NOTE).toContain('विवेक')
  })
})

describe('भाषा — अंक-रूप नहीं, शब्द सही', () => {
  it('कहीं "1वें / 2वें / 12वें" जैसा नहीं', () => {
    for (const [path, text] of allTexts()) {
      expect(text, path).not.toMatch(/[०-९0-9]\s*वें/)
    }
  })

  it('ordinalHi(n, "भाव") शब्दों में देता है', () => {
    expect(ordinalHi(1, 'भाव')).toBe('पहले भाव')
    expect(ordinalHi(4, 'भाव')).toBe('चौथे भाव')
    expect(ordinalHi(7, 'भाव')).toBe('सातवें भाव')
    expect(ordinalHi(12, 'भाव')).toBe('बारहवें भाव')
    // बिना unit पर पुराना व्यवहार वैसा ही
    expect(ordinalHi(9)).toBe('नौवें')
  })

  it('हर entry में devanagari है (कोई खाली/अंग्रेज़ी-only नहीं)', () => {
    for (const [path, text] of allTexts()) {
      expect(text, path).toMatch(/[\u0900-\u097F]/)
    }
  })
})

describe('सुरक्षा — डराने वाले शब्द, नाम और निश्चित भविष्यवाणी नहीं', () => {
  const SCARY = ['बर्बाद', 'भयंकर', 'मृत्यु-योग', 'मौत', 'अकाल', 'नष्ट हो जाए', 'सब कुछ खो', 'ज़रूर होगा', 'निश्चित रूप से होगा', 'श्राप', 'अभिशाप']
  it('डराने वाले शब्द कहीं नहीं', () => {
    for (const [path, text] of allTexts()) {
      for (const w of SCARY) expect(text.includes(w), `${path}: ${w}`).toBe(false)
    }
  })

  it('किसी व्यक्ति, software या website का नाम नहीं', () => {
    const NAMES = ['astrosage', 'astro sage', 'drik', 'prokerala', 'jhora', 'parashara light', 'makemykundli', 'clickastro', 'ganeshaspeaks', 'vas22', 'claude', 'chatgpt', 'openclaw', 'mybapuji.com']
    for (const [path, text] of allTexts()) {
      const low = text.toLowerCase()
      for (const n of NAMES) expect(low.includes(n), `${path}: ${n}`).toBe(false)
    }
  })

  it('रत्न की सावधानी हर उपाय-खंड में दिखती है', () => {
    expect(T.UPAYA.caution).toMatch(/अनुभवी ज्योतिषी/)
    expect(T.UPAYA.caution).toMatch(/निःशुल्क/)
  })
})

describe('data-only file', () => {
  it('text-hi.js में कोई function नहीं (सिर्फ़ data)', async () => {
    for (const [k, v] of Object.entries(T)) {
      expect(typeof v, k).not.toBe('function')
    }
  })
})
