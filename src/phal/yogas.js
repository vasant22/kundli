// yogas.js — the classical yogas, dosha-flavoured combinations and the
// aspect (दृष्टि) table.
//
// Every yoga carries a label:
//   शास्त्रीय   = in BPHS / Phaladeepika as stated
//   परवर्ती     = a later-tradition rule (stated as such in the report)
//   आधुनिक     = a modern (20th-century) notion
// so a reader always knows how much weight a line has.

import { RASHI_LORDS } from '../astro.js'
import { SEVEN_KEYS, houseOf, isWaxingMoon } from './frame.js'
import { effectiveBenefics, effectiveMalefics } from './frame.js'
import { EXALTATION, combustionOf } from './dignity.js'

// Graha drishti (whole-sign aspects) — the special aspects of Mars, Jupiter,
// Saturn and (in the later tradition) the nodes.
export const ASPECT_HOUSES = {
  sun: [7],
  moon: [7],
  mars: [4, 7, 8],
  mercury: [7],
  jupiter: [5, 7, 9],
  venus: [7],
  saturn: [3, 7, 10],
  rahu: [5, 7, 9], // परवर्ती
  ketu: [5, 7, 9], // परवर्ती
}

export const KENDRA = [1, 4, 7, 10]
export const TRIKONA = [5, 9]
export const DUSTHANA = [6, 8, 12]

export function aspectedRashis(key, rashi) {
  return ASPECT_HOUSES[key].map((h) => (rashi + h - 1) % 12)
}

export function aspects(frame, from, to) {
  return aspectedRashis(from, frame.rashiOf[from]).includes(frame.rashiOf[to])
}

export function mutualAspect(frame, a, b) {
  return aspects(frame, a, b) && aspects(frame, b, a)
}

export function anyAspect(frame, a, b) {
  return aspects(frame, a, b) || aspects(frame, b, a)
}

export const conjunct = (frame, a, b) => frame.rashiOf[a] === frame.rashiOf[b]

// Exchange (परिवर्तन): each graha sits in a sign owned by the other.
export function exchange(frame, a, b) {
  return RASHI_LORDS[frame.rashiOf[a]] === b && RASHI_LORDS[frame.rashiOf[b]] === a
}

// Which grahas own each of the given houses (nodes excluded — they own none).
function lordsOf(frame, houses) {
  const out = []
  for (const p of SEVEN_KEYS) if (frame.owns[p].some((h) => houses.includes(h))) out.push(p)
  return out
}

const benign = (frame) => effectiveBenefics(frame)
const malefic = (frame) => effectiveMalefics(frame)

function yoga(id, hi, en, label, present, text, extra = {}) {
  return { id, hi, en, label, present, text, ...extra }
}

// --- individual yoga tests --------------------------------------------------
function gajakesari(frame) {
  const fromMoon = houseOf(frame.byKey.jupiter.rashi, frame.byKey.moon.rashi)
  const present = KENDRA.includes(fromMoon)
  return yoga(
    'gajakesari', 'गजकेसरी योग', 'Gajakesari Yoga', 'शास्त्रीय', present,
    present
      ? `गुरु चंद्र से ${fromMoon}वें भाव में — गजकेसरी योग बनता है।`
      : `गुरु चंद्र से ${fromMoon}वें भाव में — केंद्र (1/4/7/10) में नहीं, इसलिए योग नहीं बनता।`,
    { detail: { houseFromMoon: fromMoon } }
  )
}

function budhaditya(frame) {
  const present = conjunct(frame, 'sun', 'mercury')
  const merc = frame.byKey.mercury
  const sun = frame.byKey.sun
  const comb = combustionOf('mercury', sun.longitude, merc.longitude, merc.retro)
  return yoga(
    'budhaditya', 'बुधादित्य योग', 'Budhaditya Yoga', 'शास्त्रीय', present,
    present
      ? `सूर्य और बुध एक ही राशि में${comb.combust ? ' — पर बुध अस्त है, इसलिए योग कमज़ोर है' : ''}।`
      : 'सूर्य और बुध अलग-अलग राशियों में — योग नहीं बनता।',
    { detail: { mercuryCombust: comb.combust } }
  )
}

const MAHAPURUSHA = [
  { key: 'mars', id: 'ruchaka', hi: 'रुचक योग', en: 'Ruchaka Yoga' },
  { key: 'mercury', id: 'bhadra', hi: 'भद्र योग', en: 'Bhadra Yoga' },
  { key: 'jupiter', id: 'hamsa', hi: 'हंस योग', en: 'Hamsa Yoga' },
  { key: 'venus', id: 'malavya', hi: 'मालव्य योग', en: 'Malavya Yoga' },
  { key: 'saturn', id: 'shasha', hi: 'शश योग', en: 'Shasha Yoga' },
]

function mahapurusha(frame) {
  return MAHAPURUSHA.map(({ key, id, hi, en }) => {
    const p = frame.byKey[key]
    const inKendra = KENDRA.includes(p.house)
    const strong = p.rashi === EXALTATION[key].rashi || RASHI_LORDS[p.rashi] === key
    const present = inKendra && strong
    const why = present
      ? `${p.house}वें केंद्र में ${strong ? (p.rashi === EXALTATION[key].rashi ? 'उच्च' : 'स्वराशि') : ''}`
      : inKendra
        ? `${p.house}वें केंद्र में है, पर स्वराशि/उच्च में नहीं`
        : `${p.house}वें भाव में — केंद्र में नहीं`
    return yoga(id, hi, en, 'शास्त्रीय', present, `${why} — ${present ? 'योग बनता है।' : 'योग नहीं बनता।'}`, {
      detail: { planet: key, house: p.house, ownOrExalted: strong },
    })
  })
}

// Rajayoga: a kendra lord joined to a trikona lord by conjunction, aspect or
// exchange (a single yogakaraka counts on its own).
function rajaYoga(frame) {
  const kendraLords = lordsOf(frame, KENDRA)
  const trikonaLords = lordsOf(frame, TRIKONA)
  const found = []
  for (const a of kendraLords) {
    for (const b of trikonaLords) {
      if (a === b) continue
      const by = conjunct(frame, a, b) ? 'युति' : anyAspect(frame, a, b) ? 'दृष्टि' : exchange(frame, a, b) ? 'परिवर्तन' : null
      if (by) found.push({ a, b, by })
    }
  }
  const yogakaraka = SEVEN_KEYS.filter(
    (k) => frame.owns[k].some((h) => [4, 7, 10].includes(h)) && frame.owns[k].some((h) => TRIKONA.includes(h))
  )
  return yoga(
    'rajayoga', 'राजयोग', 'Raja Yoga', 'शास्त्रीय', found.length > 0 || yogakaraka.length > 0,
    found.length || yogakaraka.length
      ? [
          ...found.map((f) => `${f.a} + ${f.b} (${f.by})`),
          ...yogakaraka.map((k) => `${k} योगकारक`),
        ].join(' · ') + ' — राजयोग बनता है।'
      : 'केंद्रेश और त्रिकोणेश में कोई युति/दृष्टि/परिवर्तन नहीं — राजयोग नहीं बनता।',
    { detail: { pairs: found, yogakaraka }, planets: [...new Set([...found.flatMap((f) => [f.a, f.b]), ...yogakaraka])] }
  )
}

function dhanaYoga(frame) {
  const dhanaLords = lordsOf(frame, [2, 11])
  const lakshmiLords = lordsOf(frame, [1, 5, 9])
  const found = []
  for (const a of dhanaLords) {
    for (const b of lakshmiLords) {
      if (a === b) continue
      const by = conjunct(frame, a, b) ? 'युति' : anyAspect(frame, a, b) ? 'दृष्टि' : exchange(frame, a, b) ? 'परिवर्तन' : null
      if (by) found.push({ a, b, by })
    }
  }
  // A single graha owning both a dhana and a lakshmi house also counts.
  const single = SEVEN_KEYS.filter(
    (k) => frame.owns[k].some((h) => [2, 11].includes(h)) && frame.owns[k].some((h) => [1, 5, 9].includes(h))
  )
  return yoga(
    'dhana', 'धनयोग', 'Dhana Yoga', 'शास्त्रीय', found.length > 0 || single.length > 0,
    found.length || single.length
      ? [...found.map((f) => `${f.a} + ${f.b} (${f.by})`), ...single.map((k) => `${k} (2/11 + 1/5/9 का स्वामी)`)].join(' · ') +
        ' — धनयोग बनता है।'
      : 'धनेश और लक्ष्मी-स्थान के स्वामियों का संबंध नहीं — धनयोग नहीं बनता।',
    { detail: { pairs: found, single }, planets: [...new Set([...found.flatMap((f) => [f.a, f.b]), ...single])] }
  )
}

function vipareeta(frame) {
  const step = []
  for (const h of DUSTHANA) {
    const lord = frame.houseLord[h - 1]
    if (DUSTHANA.includes(frame.houseOfPlanet[lord])) step.push({ house: h, lord, placedIn: frame.houseOfPlanet[lord] })
  }
  const named = []
  if (frame.houseOfPlanet[frame.houseLord[5]] === 6) named.push({ id: 'harsha', hi: 'हर्ष योग', en: 'Harsha Yoga', lord: frame.houseLord[5] })
  if (frame.houseOfPlanet[frame.houseLord[7]] === 8) named.push({ id: 'sarala', hi: 'सरल योग', en: 'Sarala Yoga', lord: frame.houseLord[7] })
  if (frame.houseOfPlanet[frame.houseLord[11]] === 12) named.push({ id: 'vimala', hi: 'विमल योग', en: 'Vimala Yoga', lord: frame.houseLord[11] })
  return yoga(
    'vipareeta', 'विपरीत राजयोग', 'Vipareeta Raja Yoga', 'शास्त्रीय', step.length > 0,
    step.length
      ? step.map((s) => `${s.house}वें का स्वामी ${s.placedIn}वें में`).join(' · ') + ' — विपरीत राजयोग बनता है।'
      : '6/8/12 के स्वामी 6/8/12 में नहीं — योग नहीं बनता।',
    { detail: { steps: step, named } }
  )
}

function neechabhanga(frame) {
  const found = []
  for (const key of SEVEN_KEYS) {
    const p = frame.byKey[key]
    const deb = (EXALTATION[key].rashi + 6) % 12
    if (p.rashi !== deb) continue
    const debLord = RASHI_LORDS[deb]
    const exLord = RASHI_LORDS[EXALTATION[key].rashi]
    const kendraFromLagna = (k) => KENDRA.includes(frame.byKey[k].house)
    const kendraFromMoon = (k) => KENDRA.includes(houseOf(frame.rashiOf[k], frame.byKey.moon.rashi))
    const exaltedInD9 = p.navamsaRashi === EXALTATION[key].rashi
    const byLord = [debLord, exLord].filter((k) => k !== key && (kendraFromLagna(k) || kendraFromMoon(k)))
    if (byLord.length || exaltedInD9) {
      found.push({ planet: key, byLord, exaltedInD9 })
    }
  }
  return yoga(
    'neechabhanga', 'नीचभंग', 'Neechabhanga', 'शास्त्रीय', found.length > 0,
    found.length
      ? found.map((f) => `${f.planet}${f.byLord.length ? ` (${f.byLord.join(', ')} केंद्र में)` : ''}${f.exaltedInD9 ? ' (D9 में उच्च)' : ''}`).join(' · ') +
        ' — नीचभंग बनता है।'
      : 'कोई नीच ग्रह भंग-नियम पूरा नहीं करता।',
    { detail: { planets: found } }
  )
}

// Sunapha / Anapha / Durudhara / Kemadruma — from the Moon, Sun and the nodes
// are not counted.
function chandraYogas(frame) {
  const moonRashi = frame.byKey.moon.rashi
  const second = (moonRashi + 1) % 12
  const twelfth = (moonRashi + 11) % 12
  const excluded = ['sun', 'rahu', 'ketu', 'moon']
  const inSecond = SEVEN_KEYS.filter((k) => !excluded.includes(k) && frame.rashiOf[k] === second)
  const inTwelfth = SEVEN_KEYS.filter((k) => !excluded.includes(k) && frame.rashiOf[k] === twelfth)
  const sunapha = inSecond.length > 0
  const anapha = inTwelfth.length > 0
  const durudhara = sunapha && anapha
  const kemadruma = !sunapha && !anapha

  const kendraFrom = (baseRashi) =>
    SEVEN_KEYS.filter((k) => k !== 'moon' && k !== 'sun' && KENDRA.includes(houseOf(frame.rashiOf[k], baseRashi)))
  const bhangaPlanets = [...new Set([...kendraFrom(frame.lagnaRashi), ...kendraFrom(moonRashi)])]

  return [
    yoga('sunapha', 'सुनफा योग', 'Sunapha Yoga', 'शास्त्रीय', sunapha,
      sunapha ? `चंद्र से दूसरे भाव में ${inSecond.join(', ')} — सुनफा योग।` : 'चंद्र से दूसरे भाव में कोई ग्रह नहीं — सुनफा नहीं।',
      { planets: inSecond }),
    yoga('anapha', 'अनफा योग', 'Anapha Yoga', 'शास्त्रीय', anapha,
      anapha ? `चंद्र से बारहवें भाव में ${inTwelfth.join(', ')} — अनफा योग।` : 'चंद्र से बारहवें भाव में कोई ग्रह नहीं — अनफा नहीं।',
      { planets: inTwelfth }),
    yoga('durudhara', 'दुरधरा योग', 'Durudhara Yoga', 'शास्त्रीय', durudhara,
      durudhara ? 'चंद्र के दोनों ओर (2रे और 12वें) ग्रह — दुरधरा योग।' : 'दोनों ओर ग्रह नहीं — दुरधरा नहीं।',
      {}),
    yoga('kemadruma', 'केमद्रुम दोष', 'Kemadruma Dosha', 'शास्त्रीय', kemadruma && bhangaPlanets.length === 0,
      kemadruma
        ? bhangaPlanets.length
          ? `चंद्र के दोनों ओर कोई ग्रह नहीं, पर ${bhangaPlanets.join(', ')} केंद्र में है — केमद्रुम का भंग हो जाता है।`
          : 'चंद्र से दूसरे और बारहवें भाव ख़ाली, केंद्र में भी कोई ग्रह नहीं — केमद्रुम बनता है।'
        : 'चंद्र के आगे या पीछे ग्रह है — केमद्रुम नहीं।',
      { detail: { empty: kemadruma, bhanga: bhangaPlanets }, planets: bhangaPlanets }),
  ]
}

function adhiYoga(frame) {
  const moonRashi = frame.byKey.moon.rashi
  const ben = [...benign(frame)]
  const spots = [6, 7, 8].map((h) => (moonRashi + h - 1) % 12)
  const found = ben.filter((k) => spots.includes(frame.rashiOf[k]))
  return yoga('adhi', 'अधियोग', 'Adhi Yoga', 'शास्त्रीय', found.length > 0,
    found.length
      ? `चंद्र से 6/7/8 में ${found.join(', ')} — अधियोग बनता है।`
      : 'चंद्र से 6/7/8 में कोई शुभ ग्रह नहीं — अधियोग नहीं।',
    { planets: found })
}

function chandraMangal(frame) {
  const present = conjunct(frame, 'moon', 'mars')
  return yoga('chandra-mangal', 'चंद्र-मंगल योग', 'Chandra-Mangal Yoga', 'शास्त्रीय', present,
    present ? 'चंद्र और मंगल एक ही राशि में — चंद्र-मंगल योग।' : 'चंद्र और मंगल अलग — योग नहीं।', {})
}

function amala(frame) {
  const ben = [...benign(frame)]
  const lagna10 = (frame.lagnaRashi + 9) % 12
  const moon10 = (frame.byKey.moon.rashi + 9) % 12
  const found = ben.filter((k) => frame.rashiOf[k] === lagna10 || frame.rashiOf[k] === moon10)
  return yoga('amala', 'अमला योग', 'Amala Yoga', 'शास्त्रीय', found.length > 0,
    found.length ? `${found.join(', ')} लग्न या चंद्र से दसवें में — अमला योग।` : 'दसवें में कोई शुभ ग्रह नहीं — अमला नहीं।',
    { planets: found })
}

function parivartana(frame) {
  const pairs = []
  for (let i = 0; i < SEVEN_KEYS.length; i++) {
    for (let j = i + 1; j < SEVEN_KEYS.length; j++) {
      const a = SEVEN_KEYS[i]
      const b = SEVEN_KEYS[j]
      if (!exchange(frame, a, b)) continue
      const houses = [...frame.owns[a], ...frame.owns[b]]
      const kind = houses.some((h) => DUSTHANA.includes(h)) ? 'dainya' : houses.includes(3) ? 'khala' : 'maha'
      const hiName = { maha: 'महा परिवर्तन', khala: 'खल परिवर्तन', dainya: 'दैन्य परिवर्तन' }[kind]
      pairs.push({ a, b, kind, hiName, houses })
    }
  }
  const present = pairs.length > 0
  return yoga('parivartana', 'परिवर्तन योग', 'Parivartana Yoga', 'शास्त्रीय', present,
    present ? pairs.map((p) => `${p.a} ↔ ${p.b} (${p.hiName})`).join(' · ') : 'किसी दो ग्रहों का राशि-परिवर्तन नहीं।',
    { detail: { pairs } })
}

function veshiVashi(frame) {
  const sunRashi = frame.byKey.sun.rashi
  const excluded = ['sun', 'moon', 'rahu', 'ketu']
  const second = (sunRashi + 1) % 12
  const twelfth = (sunRashi + 11) % 12
  const inSecond = SEVEN_KEYS.filter((k) => !excluded.includes(k) && frame.rashiOf[k] === second)
  const inTwelfth = SEVEN_KEYS.filter((k) => !excluded.includes(k) && frame.rashiOf[k] === twelfth)
  const veshi = inSecond.length > 0
  const vashi = inTwelfth.length > 0
  return [
    yoga('veshi', 'वेशि योग', 'Veshi Yoga', 'शास्त्रीय', veshi,
      veshi ? `सूर्य से दूसरे में ${inSecond.join(', ')} — वेशि योग।` : 'सूर्य से दूसरे में कोई ग्रह नहीं।', { planets: inSecond }),
    yoga('vashi', 'वाशि योग', 'Vashi Yoga', 'शास्त्रीय', vashi,
      vashi ? `सूर्य से बारहवें में ${inTwelfth.join(', ')} — वाशि योग।` : 'सूर्य से बारहवें में कोई ग्रह नहीं।', { planets: inTwelfth }),
    yoga('ubhayachari', 'उभयचरी योग', 'Ubhayachari Yoga', 'शास्त्रीय', veshi && vashi,
      veshi && vashi ? 'सूर्य के दोनों ओर ग्रह — उभयचरी योग।' : 'दोनों ओर ग्रह नहीं — उभयचरी नहीं।', {}),
  ]
}

function shakata(frame) {
  const fromJupiter = houseOf(frame.byKey.moon.rashi, frame.byKey.jupiter.rashi)
  const present = [6, 8, 12].includes(fromJupiter)
  return yoga('shakata', 'शकट योग', 'Shakata Yoga', 'शास्त्रीय', present,
    present
      ? `चंद्र गुरु से ${fromJupiter}वें भाव में — शकट योग बनता है।`
      : `चंद्र गुरु से ${fromJupiter}वें भाव में — 6/8/12 में नहीं, योग नहीं।`,
    { detail: { houseFromJupiter: fromJupiter } })
}

// The whole list, in a stable order.
export function detectYogas(frame) {
  const sun = frame.byKey.sun
  const mercury = frame.byKey.mercury
  const list = [
    gajakesari(frame),
    budhaditya(frame),
    ...mahapurusha(frame),
    rajaYoga(frame),
    dhanaYoga(frame),
    vipareeta(frame),
    neechabhanga(frame),
    ...chandraYogas(frame),
    adhiYoga(frame),
    chandraMangal(frame),
    amala(frame),
    parivartana(frame),
    ...veshiVashi(frame),
    shakata(frame),
  ]
  // the named vipareeta yogas ride along as their own rows
  const named = (list.find((y) => y.id === 'vipareeta')?.detail?.named) ?? []
  for (const n of named) {
    list.push(yoga(n.id, n.hi, n.en, 'शास्त्रीय', true, `${n.lord} — ${n.hi} बनता है।`, { detail: { lord: n.lord } }))
  }
  return { list, sunCombustionOfMercury: combustionOf('mercury', sun.longitude, mercury.longitude, mercury.retro) }
}

// The दृष्टि table the report prints: for every graha, the houses it looks at
// (counted from its own place) and the grahas standing there.
export function drishtiTable(frame) {
  return Object.keys(ASPECT_HOUSES).map((key) => {
    const rashi = frame.rashiOf[key]
    const houses = ASPECT_HOUSES[key].map((h) => ((rashi + h - 1) % 12))
    const planets = Object.keys(ASPECT_HOUSES).filter((k) => k !== key && houses.includes(frame.rashiOf[k]))
    return {
      key,
      relativeHouses: ASPECT_HOUSES[key],
      rashis: houses,
      housesFromLagna: houses.map((r) => houseOf(r, frame.lagnaRashi)),
      planets,
      label: ASPECT_HOUSES[key].length > 1 ? 'परवर्ती' : 'शास्त्रीय',
    }
  })
}

export { isWaxingMoon, effectiveBenefics, effectiveMalefics, benign, malefic }
