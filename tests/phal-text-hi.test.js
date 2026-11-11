// tests/phal-text-hi.test.js — फलादेश का हिंदी text: ढाँचा, tone और सुरक्षा.
//
// टास्क 02-ख के बाद हर फल-entry { t, tone } है। यहाँ तीन स्तर की जाँच:
//   1. ढाँचा — हर ग्रह × हर भाव, हर भावेश × हर भाव, 27 नक्षत्र, 16 वर्ग…
//   2. tone — ग्रह-भाव की तालिका, भावेश का नियम, गोचर की शुभ-भाव सूची
//   3. भाषा/सुरक्षा — अंक-रूप नहीं, डराने वाले शब्द नहीं, पश्चिमी शब्द नहीं,
//      किसी व्यक्ति/software/website का नाम नहीं, निश्चित भविष्यवाणी नहीं
import { describe, expect, it } from 'vitest'
import * as T from '../src/phal/text-hi.js'
import { ordinalHi } from '../src/phal/text.js'
import { ALL_KEYS } from '../src/phal/frame.js'
import { VARGA_ORDERS } from '../src/phal/vargas.js'
import { GOCHAR_SHUBHA } from '../src/phal/gochar.js'

const KEYS = { sun: 'su', moon: 'mo', mars: 'ma', mercury: 'me', jupiter: 'ju', venus: 've', saturn: 'sa', rahu: 'ra', ketu: 'ke' }
const H = Array.from({ length: 12 }, (_, i) => i + 1)
const TONES = ['shubh', 'mishr', 'savdhan']

// टास्क 02-ख की ग्रह-भाव tone तालिका
const PLANET_TONE = {
  su: ['M', 'C', 'S', 'C', 'M', 'S', 'C', 'C', 'M', 'S', 'S', 'C'],
  mo: ['M', 'S', 'M', 'S', 'S', 'C', 'S', 'C', 'S', 'S', 'S', 'C'],
  ma: ['C', 'C', 'S', 'C', 'C', 'S', 'C', 'C', 'M', 'S', 'S', 'C'],
  me: ['S', 'S', 'M', 'S', 'S', 'M', 'S', 'M', 'S', 'S', 'S', 'M'],
  ju: ['S', 'S', 'C', 'S', 'M', 'M', 'S', 'M', 'S', 'S', 'S', 'M'],
  ve: ['S', 'S', 'M', 'S', 'S', 'C', 'M', 'M', 'S', 'S', 'S', 'S'],
  sa: ['C', 'C', 'S', 'C', 'C', 'S', 'C', 'M', 'C', 'S', 'S', 'C'],
  ra: ['C', 'C', 'S', 'C', 'C', 'S', 'C', 'C', 'C', 'M', 'S', 'C'],
  ke: ['C', 'C', 'S', 'C', 'C', 'S', 'C', 'C', 'M', 'M', 'S', 'M'],
}
const TONE = { S: 'shubh', M: 'mishr', C: 'savdhan' }

// भावेश का tone-नियम (टास्क 02-ख §2)
function lordTone(l, h) {
  const DUST = [6, 8, 12]
  if (DUST.includes(l) && DUST.includes(h)) return 'shubh'
  if ([1, 4, 5, 7, 9, 10].includes(l) && ([1, 4, 7, 10].includes(h) || [1, 5, 9].includes(h))) return 'shubh'
  if (l === h) return 'shubh'
  if (DUST.includes(h)) return 'savdhan'
  if ([3, 6, 11].includes(l) && ([1, 4, 7, 10].includes(h) || [1, 5, 9].includes(h))) return 'mishr'
  if ([2, 11].includes(l) && [2, 11].includes(h)) return 'shubh'
  return 'mishr'
}

function allEntries() {
  const out = []
  const walk = (node, path) => {
    if (node && typeof node === 'object' && typeof node.t === 'string') { out.push([path, node]); return }
    if (typeof node === 'string') { out.push([path, { t: node, tone: null }]); return }
    if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`)
  }
  for (const [k, v] of Object.entries(T)) walk(v, k)
  return out
}

describe('ढाँचा — सब entries मौजूद, ख़ाली नहीं', () => {
  it('ग्रह भाव में: 9 × 12 = 108', () => {
    let n = 0
    for (const key of ALL_KEYS) {
      const row = T.PLANET_IN_HOUSE[KEYS[key]]
      expect(row, KEYS[key]).toBeTruthy()
      for (const h of H) {
        expect(typeof row[h].t, `${KEYS[key]}/${h}`).toBe('string')
        expect(row[h].t.length).toBeGreaterThan(15)
        n++
      }
    }
    expect(n).toBe(108)
  })

  it('भावेश भाव में: 12 × 12 = 144', () => {
    let n = 0
    for (const lord of H) for (const placed of H) {
      expect(typeof T.LORD_IN_HOUSE[lord][placed].t, `${lord}/${placed}`).toBe('string')
      expect(T.LORD_IN_HOUSE[lord][placed].t.length).toBeGreaterThan(15)
      n++
    }
    expect(n).toBe(144)
  })

  it('लग्न 12 · चंद्र-राशि 12 · नक्षत्र 27', () => {
    expect(Object.keys(T.LAGNA).length).toBe(12)
    expect(Object.keys(T.MOON_RASHI).length).toBe(12)
    expect(Object.keys(T.NAKSHATRA).length).toBe(27)
    for (let i = 1; i <= 27; i++) expect(T.NAKSHATRA[i].t.length).toBeGreaterThan(15)
  })

  it('कारकत्व 9 · भाव-विषय 12 · स्थिति-टिप्पणी 14', () => {
    expect(Object.keys(T.KARAKATVA).length).toBe(9)
    expect(Object.keys(T.HOUSE_TOPICS).length).toBe(12)
    for (const level of ['exalted', 'moolatrikona', 'own', 'adhimitra', 'mitra', 'sama', 'shatru', 'adhishatru', 'debilitated', 'combust', 'retrograde', 'vargottama', 'digbala']) {
      expect(typeof T.DIGNITY_NOTES[level].t, level).toBe('string')
    }
  })

  it('दशा 9 + template', () => {
    expect(Object.keys(T.DASHA).length).toBe(9)
    expect(T.DASHA_TEMPLATE.hi).toContain('{owner}')
    expect(T.DASHA_TEMPLATE.hi).toContain('{sitHouse}')
  })

  it('योग 26 · दोष 8 — टास्क 01 के सारे id', () => {
    const ids = ['gajakesari', 'budhaditya', 'ruchaka', 'bhadra', 'hamsa', 'malavya', 'shasha',
      'rajayoga', 'dhana', 'vipareeta', 'harsha', 'sarala', 'vimala', 'neechabhanga',
      'sunapha', 'anapha', 'durudhara', 'kemadruma', 'adhi', 'chandra-mangal', 'amala',
      'parivartana', 'veshi', 'vashi', 'ubhayachari', 'shakata']
    for (const id of ids) {
      const entry = T.YOGA_TEXT[id]
      expect(typeof (entry.t ?? entry.base?.t), id).toBe('string')
      for (const [k, v] of Object.entries(entry)) {
        if (!k.startsWith('if')) continue
        expect(typeof v?.t, `${id}.${k}`).toBe('string')
        expect(typeof v?.tone, `${id}.${k}`).toBe('string')
      }
    }
    // शर्त वाला हिस्सा base से अलग है (टास्क 03-ख §3)
    expect(T.YOGA_TEXT.gajakesari.ifWeak.t).toContain('{why}')
    expect(T.YOGA_TEXT.gajakesari.base.t).not.toContain('नीच')
    expect(T.YOGA_TEXT.budhaditya.ifCombust.t).toContain('अस्त')
    expect(T.YOGA_TEXT.budhaditya.base.t).not.toContain('अस्त')
    expect(T.YOGA_TEXT.kemadruma.ifBhanga.t).toContain('{planets}')
    expect(T.YOGA_TEXT.kemadruma.base.t).not.toContain('केंद्र')
    for (const k of ['mangal', 'kaalSarpa', 'guruChandal', 'sadesati1', 'sadesati2', 'sadesati3', 'dhaiya']) {
      expect(typeof T.DOSHA_TEXT[k].t, k).toBe('string')
    }
    expect(T.DOSHA_TEXT.kaalSarpa.t).toMatch(/आधुनिक/)
    expect(T.DOSHA_TEXT.guruChandal.t).toMatch(/परवर्ती/)
  })

  it('गोचर 48 · वर्ग 16 (गणना वाले numbers) · उपाय 10', () => {
    let n = 0
    for (const key of ['ju', 'sa', 'ra', 'ke']) for (const h of H) { expect(T.GOCHAR[key][h].t.length).toBeGreaterThan(15); n++ }
    expect(n).toBe(48)
    expect(Object.keys(T.VARGA_TEXT).map(Number).sort((a, b) => a - b)).toEqual(VARGA_ORDERS)
    for (const key of ALL_KEYS) expect(T.UPAYA[KEYS[key]].free.length).toBeGreaterThan(20)
    expect(T.UPAYA.caution).toContain('ज्योतिषी')
    expect(T.UPAYA.caution).toContain('परखकर')
  })

  it('अध्याय-परिचय · शब्दकोश · अंतिम नोट', () => {
    expect(Object.keys(T.CHAPTER_INTRO).length).toBeGreaterThanOrEqual(12)
    expect(Object.keys(T.GLOSSARY).length).toBeGreaterThanOrEqual(28)
    expect(T.CLOSING_NOTE).toContain('मार्गदर्शन')
    expect(T.CLOSING_NOTE).toContain('विवेक')
  })
})

describe('tone — तालिका और नियम से मेल', () => {
  it('ग्रह-भाव का tone स्वीकृत तालिका के बराबर', () => {
    for (const key of ALL_KEYS) {
      for (const h of H) {
        const want = TONE[PLANET_TONE[KEYS[key]][h - 1]]
        expect(T.PLANET_IN_HOUSE[KEYS[key]][h].tone, `${KEYS[key]}/${h}`).toBe(want)
      }
    }
  })

  it('भावेश-भाव का tone नियम से निकलता है', () => {
    for (const l of H) for (const h of H) {
      expect(T.LORD_IN_HOUSE[l][h].tone, `${l}/${h}`).toBe(lordTone(l, h))
    }
  })

  it('गोचर का tone शुभ-भाव सूची से निकलता है', () => {
    const map = { ju: 'jupiter', sa: 'saturn', ra: 'rahu', ke: 'ketu' }
    for (const [p, row] of Object.entries(T.GOCHAR)) {
      for (const h of H) {
        const want = GOCHAR_SHUBHA[map[p]].includes(h) ? 'shubh' : 'savdhan'
        expect(row[h].tone, `${p}/${h}`).toBe(want)
      }
    }
  })

  it('हर फल-entry का tone तीन में से एक है', () => {
    for (const [path, e] of allEntries()) {
      if (e.tone === null) continue
      expect(TONES, path).toContain(e.tone)
    }
  })

  it('savdhan entries में एक सहायक बात भी हो (सिर्फ़ डर नहीं)', () => {
    const HELP = ['ध्यान', 'सहायक', 'धैर्य', 'सतर्क', 'बचें', 'संभाल', 'नियमित', 'संवाद', 'शुभ', 'योजना', 'विश्राम', 'रखें',
    'संयम', 'बजट', 'सोच-समझकर', 'अवसर', 'सुनें', 'ज्ञान', 'अनुकूल', 'जाँच', 'परिश्रम', 'मेहनत', 'राह', 'लें', 'बनाएँ']
    for (const [path, e] of allEntries()) {
      if (e.tone !== 'savdhan') continue
      expect(HELP.some((w) => e.t.includes(w)), path).toBe(true)
    }
  })
})

describe('भाषा — अंक-रूप नहीं, शब्द सही', () => {
  it('कहीं "1वें / 2वें / 12वें" जैसा नहीं', () => {
    for (const [path, e] of allEntries()) expect(e.t, path).not.toMatch(/[०-९0-9]\s*वें/)
  })

  it('ordinalHi(n, "भाव") शब्दों में', () => {
    expect(ordinalHi(1, 'भाव')).toBe('पहले भाव')
    expect(ordinalHi(4, 'भाव')).toBe('चौथे भाव')
    expect(ordinalHi(12, 'भाव')).toBe('बारहवें भाव')
    expect(ordinalHi(9)).toBe('नौवें')
  })

  it('हर entry में देवनागरी है', () => {
    for (const [path, e] of allEntries()) expect(e.t, path).toMatch(/[\u0900-\u097F]/)
  })
})

describe('सुरक्षा — डर, नाम, पश्चिमी शब्द, निश्चित भविष्यवाणी नहीं', () => {
  const SCARY = ['बर्बाद', 'भयंकर', 'मृत्यु-योग', 'मौत', 'अकाल', 'नष्ट हो जाए', 'सब कुछ खो', 'ज़रूर होगा', 'निश्चित रूप से होगा', 'श्राप', 'अभिशाप']
  const WESTERN = ['दूसरों के संसाधन', 'बीमा', 'वित्त-क्षेत्र', 'पड़ोस', 'फ़ैशन', 'तंत्र-मंत्र', 'तांत्रिक']
  const NAMES = ['astrosage', 'astro sage', 'drik', 'prokerala', 'jhora', 'parashara light', 'makemykundli', 'clickastro', 'ganeshaspeaks', 'vas22', 'claude', 'chatgpt', 'openclaw', 'mybapuji.com']

  it('डराने वाले शब्द कहीं नहीं', () => {
    for (const [path, e] of allEntries()) for (const w of SCARY) expect(e.t.includes(w), `${path}: ${w}`).toBe(false)
  })

  it('पश्चिमी/आधुनिक शब्द नहीं (शास्त्रीय कारकत्व की जगह)', () => {
    for (const [path, e] of allEntries()) for (const w of WESTERN) expect(e.t.includes(w), `${path}: ${w}`).toBe(false)
  })

  it('किसी व्यक्ति, software या website का नाम नहीं', () => {
    for (const [path, e] of allEntries()) {
      const low = e.t.toLowerCase()
      for (const n of NAMES) expect(low.includes(n), `${path}: ${n}`).toBe(false)
    }
  })

  it('मंगल-दोष की टिप्पणी सही है (दूसरा भाव कुछ परंपराओं में)', () => {
    expect(T.DOSHA_TEXT.mangalNote.t).toMatch(/कुछ परंपराएँ/)
    expect(T.DOSHA_TEXT.mangalNote.t).toMatch(/1, 4, 7, 8 और 12/)
  })

  it('शनि का रत्न पंचधातु या चाँदी में', () => {
    expect(T.UPAYA.sa.gem).toContain('पंचधातु')
    expect(T.UPAYA.sa.gem).not.toContain('लोहे')
  })
})

describe('data-only file', () => {
  it('text-hi.js में कोई function नहीं', () => {
    for (const [k, v] of Object.entries(T)) expect(typeof v, k).not.toBe('function')
  })
})
