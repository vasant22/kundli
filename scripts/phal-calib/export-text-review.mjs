// scripts/phal-calib/export-text-review.mjs — फलादेश के हर text को एक पढ़ने लायक
// फ़ाइल में निकालता है, ताकि Claude शास्त्रीय शुद्धता जाँच सके (टास्क 02).
//
// हर पंक्ति में: key · text · शास्त्रीय आधार (ग्रंथ, अध्याय).
//   node scripts/phal-calib/export-text-review.mjs > <out.md>

import * as T from '../../src/phal/text-hi.js'

const OUT = []
const w = (s = '') => OUT.push(s)
const txt = (v) => (v && typeof v === 'object' ? v.t : v)
const toneOf = (v) => (v && typeof v === 'object' ? v.tone : '—')
const TONE_HI = { shubh: 'शुभ', mishr: 'मिश्र', savdhan: 'सावधानी' }

const SRC = {
  PLANET_IN_HOUSE: 'फलदीपिका अ.8 (भावगत ग्रहफल)',
  LORD_IN_HOUSE: 'BPHS अ.24 (भावेश का फल)',
  LAGNA: 'फलदीपिका अ.6 (लग्न-स्वभाव)',
  MOON_RASHI: 'फलदीपिका अ.7 (चंद्र-राशि)',
  NAKSHATRA: 'फलदीपिका अ.7 + नक्षत्र-स्वभाव परंपरा',
  KARAKATVA: 'BPHS अ.3 (कारकत्व)',
  HOUSE_TOPICS: 'BPHS अ.24 / फलदीपिका अ.8 (भाव-विषय)',
  DIGNITY_NOTES: 'BPHS अ.3 (मैत्री) · अ.7 (दिग्बल) · अ.34 (अस्त)',
  DASHA: 'BPHS अ.46–47 (विंशोत्तरी) + फलदीपिका दशाफल',
  DASHA_TEMPLATE: 'BPHS अ.46–47 (दशा-स्वामी का भाव-संबंध)',
  YOGA_TEXT: 'फलदीपिका अ.6–7 + BPHS (योग-फल)',
  DOSHA_TEXT: 'परंपरा (मंगल दोष) · आधुनिक/परवर्ती (कालसर्प, गुरु-चांडाल) · शनि-गोचर (साढ़ेसाती)',
  GOCHAR: 'फलदीपिका का गोचर अध्याय (जन्म-चंद्र से)',
  VARGA_TEXT: 'BPHS अ.6 (षोडशवर्ग — कौन-सा वर्ग क्या दिखाता है)',
  D60_NOTE: 'BPHS अ.6.41 (शुभ/क्रूर षष्ट्यंश का फल)',
  UPAYA: 'परंपरागत उपाय-विधान (मंत्र/दान/सेवा; रत्न-विधान)',
  CHAPTER_INTRO: '— (परिचय)',
  GLOSSARY: 'प्रचलित ज्योतिष-परिभाषाएँ',
  CLOSING_NOTE: '— (अस्वीकरण/नोट)',
}

const LABEL = {
  PLANET_IN_HOUSE: 'ग्रह भाव में (9 × 12)',
  LORD_IN_HOUSE: 'भावेश भाव में (12 × 12)',
  LAGNA: 'लग्न-स्वभाव (12)',
  MOON_RASHI: 'चंद्र-राशि स्वभाव (12)',
  NAKSHATRA: 'जन्म-नक्षत्र स्वभाव (27)',
  KARAKATVA: 'ग्रह के कारकत्व (9)',
  HOUSE_TOPICS: 'भावों के विषय (12)',
  DIGNITY_NOTES: 'ग्रह की स्थिति पर टिप्पणी',
  DASHA: 'महादशा-स्वभाव (9)',
  DASHA_TEMPLATE: 'दशा-फल का template',
  YOGA_TEXT: 'योग (26)',
  DOSHA_TEXT: 'दोष (8)',
  GOCHAR: 'गोचर (4 × 12)',
  VARGA_TEXT: 'षोडश वर्ग (16)',
  D60_NOTE: 'D60 देवता का अर्थ',
  UPAYA: 'उपाय (9 + सावधानी)',
  CHAPTER_INTRO: 'अध्याय-परिचय',
  GLOSSARY: 'शब्दकोश',
  CLOSING_NOTE: 'अंतिम पृष्ठ का नोट',
}

const PLANET_HI = { su: 'सूर्य', mo: 'चंद्र', ma: 'मंगल', me: 'बुध', ju: 'गुरु', ve: 'शुक्र', sa: 'शनि', ra: 'राहु', ke: 'केतु' }

w('# फलादेश text — Claude के लिए review-पत्र')
w()
w('**तारीख़:** 11-11-2026 · **file:** `src/phal/text-hi.js` · **कुल entries:** नीचे हर अध्याय में')
w()
w('हर पंक्ति में: **key** → text → *शास्त्रीय आधार*. सुधार के लिए सिर्फ़ key बताइए, text बदल दिया जाएगा।')
w('सारा text मूल लेखन है (किसी किताब/अनुवाद/website से नहीं); स्वर संतुलित — न डराने वाला, न निश्चित भविष्यवाणी।')
w()

// बदले हुए entries (पुरानी copy से तुलना) — सबसे ऊपर
let OLD = null
try { OLD = await import('../../.openclaw-tmp/text-hi-old.mjs') } catch { OLD = null }
if (OLD) {
  const flat = (root, path = '') => {
    const out = {}
    const walk = (node, p) => {
      if (node && typeof node === 'object' && typeof node.t === 'string') { out[p] = node.t; return }
      if (typeof node === 'string') { out[p] = node; return }
      if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, p ? `${p}.${k}` : k)
    }
    for (const [k, v] of Object.entries(root)) walk(v, k)
    return out
  }
  const a = flat(OLD), b = flat(T)
  const changed = Object.keys(b).filter((k) => a[k] !== undefined && a[k] !== b[k])
  w(`## 0. बदले हुए entries (${changed.length})`)
  w('टास्क 02-ख में tone के हिसाब से ये text बदले गए — Claude सिर्फ़ इन्हें जाँचे।')
  w()
  w('| key | पुराना | नया | tone |')
  w('|---|---|---|---|')
  const toneAt = (path) => {
    const parts = path.split('.')
    let node = T
    for (const p of parts) node = node?.[p]
    return node?.tone ?? '—'
  }
  for (const k of changed) w(`| \`${k}\` | ${a[k]} | ${b[k]} | ${TONE_HI[toneAt(k)] ?? '—'} |`)
  w()
}

// ग्रह भाव में
w(`## 1. ${LABEL.PLANET_IN_HOUSE}`)
w(`*आधार: ${SRC.PLANET_IN_HOUSE}*`)
w()
w('| key | text | tone | आधार |')
w('|---|---|---|---|')
for (const [key, row] of Object.entries(T.PLANET_IN_HOUSE)) {
  for (const [h, v] of Object.entries(row)) w(`| \`PLANET_IN_HOUSE.${key}[${h}]\` | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC.PLANET_IN_HOUSE} |`)
}
w()

// भावेश भाव में
w(`## 2. ${LABEL.LORD_IN_HOUSE}`)
w(`*आधार: ${SRC.LORD_IN_HOUSE}*`)
w()
w('| key | text | tone | आधार |')
w('|---|---|---|---|')
for (const [lord, row] of Object.entries(T.LORD_IN_HOUSE)) {
  for (const [placed, v] of Object.entries(row)) w(`| \`LORD_IN_HOUSE.${lord}[${placed}]\` | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC.LORD_IN_HOUSE} |`)
}
w()

// लग्न / राशि / नक्षत्र
for (const [k, title] of [['LAGNA', LABEL.LAGNA], ['MOON_RASHI', LABEL.MOON_RASHI], ['NAKSHATRA', LABEL.NAKSHATRA]]) {
  w(`## ${title}`)
  w(`*आधार: ${SRC[k]}*`)
  w()
  w('| key | text | आधार |')
  w('|---|---|---|')
  for (const [i, v] of Object.entries(T[k])) w(`| \`${k}.${i}\` | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC[k]} |`)
  w()
}

// कारकत्व / भाव-विषय / स्थिति
for (const [k, title] of [['KARAKATVA', LABEL.KARAKATVA], ['HOUSE_TOPICS', LABEL.HOUSE_TOPICS], ['DIGNITY_NOTES', LABEL.DIGNITY_NOTES]]) {
  w(`## ${title}`)
  w(`*आधार: ${SRC[k]}*`)
  w()
  w('| key | text | आधार |')
  w('|---|---|---|')
  for (const [i, v] of Object.entries(T[k])) w(`| \`${k}.${i}\`${k === 'KARAKATVA' ? ` (${PLANET_HI[i]})` : ''} | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC[k]} |`)
  w()
}

// दशा
w(`## ${LABEL.DASHA}`)
w(`*आधार: ${SRC.DASHA}*`)
w()
w('| key | text | tone | आधार |')
w('|---|---|---|---|')
for (const [i, v] of Object.entries(T.DASHA)) w(`| \`DASHA.${i}\` (${PLANET_HI[i]}) | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC.DASHA} |`)
w()
w(`**Template** (\`DASHA_TEMPLATE\`) — *${SRC.DASHA_TEMPLATE}*`)
w()
w('```')
w(`महादशा: ${T.DASHA_TEMPLATE.hi}`)
w(`अंतर्दशा: ${T.DASHA_TEMPLATE.antar}`)
w('```')
w()

// योग
w(`## ${LABEL.YOGA_TEXT}`)
w(`*आधार: ${SRC.YOGA_TEXT}*`)
w()
w('| key | text | tone | आधार |')
w('|---|---|---|---|')
for (const [i, v] of Object.entries(T.YOGA_TEXT)) w(`| \`YOGA_TEXT.${i}\` | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC.YOGA_TEXT} |`)
w()

// दोष
w(`## ${LABEL.DOSHA_TEXT}`)
w(`*आधार: ${SRC.DOSHA_TEXT}*`)
w()
w('| key | text | tone | आधार |')
w('|---|---|---|---|')
for (const [i, v] of Object.entries(T.DOSHA_TEXT)) w(`| \`DOSHA_TEXT.${i}\` | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC.DOSHA_TEXT} |`)
w()

// गोचर
w(`## ${LABEL.GOCHAR}`)
w(`*आधार: ${SRC.GOCHAR}*`)
w()
w('| key | text | tone | आधार |')
w('|---|---|---|---|')
for (const [g, row] of Object.entries(T.GOCHAR)) {
  for (const [h, v] of Object.entries(row)) w(`| \`GOCHAR.${g}[${h}]\` (${PLANET_HI[g]}) | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC.GOCHAR} |`)
}
w()

// वर्ग
w(`## ${LABEL.VARGA_TEXT}`)
w(`*आधार: ${SRC.VARGA_TEXT}*`)
w()
w('| key | text | tone | आधार |')
w('|---|---|---|---|')
for (const [i, v] of Object.entries(T.VARGA_TEXT)) w(`| \`VARGA_TEXT.${i}\` | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC.VARGA_TEXT} |`)
w()
w(`**D60 का अर्थ** — *${SRC.D60_NOTE}*`)
w()
w('| key | text | tone | आधार |')
w('|---|---|---|---|')
for (const [i, v] of Object.entries(T.D60_NOTE)) w(`| \`D60_NOTE.${i}\` | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC.D60_NOTE} |`)
w()

// उपाय
w(`## ${LABEL.UPAYA}`)
w(`*आधार: ${SRC.UPAYA}*`)
w()
w('| key | text | tone | आधार |')
w('|---|---|---|---|')
for (const [g, u] of Object.entries(T.UPAYA)) {
  if (typeof u === 'string') { w(`| \`UPAYA.${g}\` | ${u} | ${SRC.UPAYA} |`); continue }
  w(`| \`UPAYA.${g}.free\` (${PLANET_HI[g]}) | ${u.free} | ${SRC.UPAYA} |`)
  w(`| \`UPAYA.${g}.gem\` (${PLANET_HI[g]}) | ${u.gem} | ${SRC.UPAYA} |`)
}
w()

// परिचय / शब्दकोश / अंतिम नोट
for (const [k, title] of [['CHAPTER_INTRO', LABEL.CHAPTER_INTRO], ['GLOSSARY', LABEL.GLOSSARY]]) {
  w(`## ${title}`)
  w(`*आधार: ${SRC[k]}*`)
  w()
  w('| key | text | आधार |')
  w('|---|---|---|')
  for (const [i, v] of Object.entries(T[k])) w(`| \`${k}.${i}\` | ${txt(v)} | ${TONE_HI[toneOf(v)]} | ${SRC[k]} |`)
  w()
}
w(`## ${LABEL.CLOSING_NOTE}`)
w()
w(`> ${T.CLOSING_NOTE}`)
w()

const counts = {
  'ग्रह भाव में': Object.values(T.PLANET_IN_HOUSE).reduce((a, r) => a + Object.keys(r).length, 0),
  'भावेश भाव में': Object.values(T.LORD_IN_HOUSE).reduce((a, r) => a + Object.keys(r).length, 0),
  'लग्न': Object.keys(T.LAGNA).length,
  'चंद्र-राशि': Object.keys(T.MOON_RASHI).length,
  'नक्षत्र': Object.keys(T.NAKSHATRA).length,
  'कारकत्व': Object.keys(T.KARAKATVA).length,
  'भाव-विषय': Object.keys(T.HOUSE_TOPICS).length,
  'स्थिति-टिप्पणी': Object.keys(T.DIGNITY_NOTES).length,
  'दशा': Object.keys(T.DASHA).length,
  'योग': Object.keys(T.YOGA_TEXT).length,
  'दोष': Object.keys(T.DOSHA_TEXT).length,
  'गोचर': Object.values(T.GOCHAR).reduce((a, r) => a + Object.keys(r).length, 0),
  'वर्ग': Object.keys(T.VARGA_TEXT).length,
  'उपाय': Object.keys(T.UPAYA).length,
  'शब्दकोश': Object.keys(T.GLOSSARY).length,
}
w('---')
w()
w('**कुल:** ' + Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ') + ` · कुल ${Object.values(counts).reduce((a, b) => a + b, 0)} entries`)
w()
w('**जाँच जो पहले से चलती है** (`tests/phal-text-hi.test.js`): हर ग्रह × हर भाव, हर भावेश × हर भाव, 27 नक्षत्र, 16 वर्ग — सब मौजूद;')
w('कोई "1वें/2वें" नहीं; डराने वाले शब्द नहीं; किसी व्यक्ति/software/website का नाम नहीं; निश्चित भविष्यवाणी नहीं।')

console.log(OUT.join('\n'))
