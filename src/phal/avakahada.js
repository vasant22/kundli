// avakahada.js — अवकहड़ा: वर्ण, वश्य, योनि, गण, नाड़ी, नक्षत्र-पाद अक्षर,
// राशि/नक्षत्र स्वामी, कारक (आत्मकारक आदि), कारकांश और सुदर्शन दृष्टि।
//
// The five koota lookups come from ashtakoot.js (the matching page's tables);
// the pada letters are the classical नाम-अक्षर list; the karakas are the
// 7-karaka scheme (Sun … Saturn, no nodes), BPHS ch.32.

import { RASHIS, GRAHAS, NAKSHATRAS } from '../i18n.js'
import { RASHI_LORDS } from '../astro.js'
import { SEVEN_KEYS } from './frame.js'
import { varnaOf, vashyaOf, yoniOf, ganaOf, nadiOf } from '../ashtakoot.js'

// 27 nakshatras × 4 padas → the birth-letter (नाम-अक्षर). Classical list.
export const PADA_LETTERS = [
  ['चु', 'चे', 'चो', 'ला'], // Ashwini
  ['ली', 'लू', 'ले', 'लो'], // Bharani
  ['अ', 'ई', 'उ', 'ए'], // Krittika
  ['ओ', 'वा', 'वी', 'वू'], // Rohini
  ['वे', 'वो', 'का', 'की'], // Mrigashira
  ['कू', 'घ', 'ङ', 'छ'], // Ardra
  ['के', 'को', 'हा', 'ही'], // Punarvasu
  ['हू', 'हे', 'हो', 'डा'], // Pushya
  ['डी', 'डू', 'डे', 'डो'], // Ashlesha
  ['मा', 'मी', 'मू', 'मे'], // Magha
  ['मो', 'टा', 'टी', 'टू'], // Purva Phalguni
  ['टे', 'टो', 'पा', 'पी'], // Uttara Phalguni
  ['पू', 'ष', 'ण', 'ठ'], // Hasta
  ['पे', 'पो', 'रा', 'री'], // Chitra
  ['रू', 'रे', 'रो', 'ता'], // Swati
  ['ती', 'तू', 'ते', 'तो'], // Vishakha
  ['ना', 'नी', 'नू', 'ने'], // Anuradha
  ['नो', 'या', 'यी', 'यू'], // Jyeshtha
  ['ये', 'यो', 'भा', 'भी'], // Mula
  ['भू', 'धा', 'फा', 'ढा'], // Purva Ashadha
  ['भे', 'भो', 'जा', 'जी'], // Uttara Ashadha
  ['खी', 'खू', 'खे', 'खो'], // Shravana
  ['गा', 'गी', 'गू', 'गे'], // Dhanishtha
  ['गो', 'सा', 'सी', 'सू'], // Shatabhisha
  ['से', 'सो', 'दा', 'दी'], // Purva Bhadrapada
  ['दू', 'थ', 'झ', 'ञ'], // Uttara Bhadrapada
  ['दे', 'दो', 'च', 'ची'], // Revati
]

const NAK_LORD_SEQ = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury']

export function padaLetter(nakshatra, pada) {
  return PADA_LETTERS[nakshatra - 1]?.[pada - 1] ?? null
}

export function nakshatraLord(nakshatra) {
  return NAK_LORD_SEQ[(nakshatra - 1) % 9]
}

export const KARAKA_NAMES = [
  { key: 'atma', hi: 'आत्मकारक', en: 'Atmakaraka' },
  { key: 'amaty', hi: 'अमात्यकारक', en: 'Amatyakaraka' },
  { key: 'bhratri', hi: 'भ्रातृकारक', en: 'Bhratrikaraka' },
  { key: 'matri', hi: 'मातृकारक', en: 'Matrikaraka' },
  { key: 'putra', hi: 'पुत्रकारक', en: 'Putrakaraka' },
  { key: 'jnati', hi: 'ज्ञातिकारक', en: 'Gnatikaraka' },
  { key: 'dara', hi: 'दारकारक', en: 'Darakaraka' },
]

// 7-karaka scheme: the seven grahas ordered by the degrees they have crossed
// inside their sign. The highest is आत्मकारक.
export function karakas(kundli) {
  const list = SEVEN_KEYS.map((key) => {
    const p = kundli.planets.find((x) => x.key === key)
    return { key, degInSign: p.degInSign, rashi: p.rashi, navamsaRashi: p.navamsaRashi }
  }).sort((a, b) => b.degInSign - a.degInSign)
  return list.map((item, i) => ({
    ...item,
    karaka: KARAKA_NAMES[i].key,
    hi: KARAKA_NAMES[i].hi,
    en: KARAKA_NAMES[i].en,
  }))
}

// सुदर्शन दृष्टि — the same twelve houses seen from the lagna, the Moon and the
// Sun (a table only, as the task sheet asks).
export function sudarshanTable(frame) {
  const out = []
  for (let h = 1; h <= 12; h++) {
    out.push({
      house: h,
      fromLagna: (frame.lagnaRashi + h - 1) % 12,
      fromMoon: (frame.byKey.moon.rashi + h - 1) % 12,
      fromSun: (frame.byKey.sun.rashi + h - 1) % 12,
      lord: frame.houseLord[h - 1],
    })
  }
  return out
}

// The whole अवकहड़ा block.
export function avakahada(frame, { panchang = null } = {}) {
  const moon = frame.byKey.moon
  const nak = moon.nakshatra
  const pada = moon.pada
  const karakaList = karakas(frame.kundli)
  const atma = karakaList[0]
  return {
    varna: varnaOf(moon.rashi),
    vashya: vashyaOf(moon.rashi, moon.degInSign),
    yoni: yoniOf(nak),
    gana: ganaOf(nak),
    nadi: nadiOf(nak),
    nakshatra: {
      number: nak,
      name: NAKSHATRAS[nak - 1],
      pada,
      letter: padaLetter(nak, pada),
      lord: nakshatraLord(nak),
      lordLabel: GRAHAS.find((g) => g.key === nakshatraLord(nak)),
    },
    rashi: {
      number: moon.rashi,
      name: RASHIS[moon.rashi],
      lord: RASHI_LORDS[moon.rashi],
      lordLabel: GRAHAS.find((g) => g.key === RASHI_LORDS[moon.rashi]),
    },
    lagna: {
      rashi: frame.lagnaRashi,
      name: RASHIS[frame.lagnaRashi],
      lord: RASHI_LORDS[frame.lagnaRashi],
      degInSign: frame.kundli.ascendant.degInSign,
      nakshatra: frame.kundli.ascendant.nakshatra,
      pada: frame.kundli.ascendant.pada,
      letter: padaLetter(frame.kundli.ascendant.nakshatra, frame.kundli.ascendant.pada),
    },
    karakas: karakaList,
    atmakaraka: atma,
    karakamsha: atma.navamsaRashi, // the आत्मकारक's navamsha rashi
    sudarshan: sudarshanTable(frame),
    panchang,
  }
}
