// index.js — buildPhalData(): the ONE object the फलादेश report is drawn from.
//
// Everything is computed in the browser from the same computeKundli() result
// the kundli page shows; no server, no API, no storage. Each section comes from
// its own small module (vargas, dignity, strength, dasha, yogas, doshas,
// sadesati, ashtakavarga, gochar, avakahada, ratna) so every rule has its own
// test file.
//
// buildPhalData(swe, birth, opts)
//   birth = {
//     utc: {year, month, day, hour, minute, second},   // the birth instant in UT
//     latitude, longitude,
//     nodeType: 'mean' | 'true',                       // optional
//     local: {year, month, day, hour, minute, second},  // optional, for the panchang
//     timeZone: 'Asia/Kolkata',                        // optional, for the panchang
//     name, gender, place,                             // optional labels
//   }
//   opts = { nowMs }   // "today" for गोचर / साढ़ेसाती (tests pass it explicitly)

import { computeKundli } from '../astro.js'
import { computePanchang } from '../panchang.js'
import { RASHIS, GRAHAS, NAKSHATRAS } from '../i18n.js'
import { ALL_KEYS, SEVEN_KEYS, makeFrame } from './frame.js'
import { VARGA_INFO, VARGA_ORDERS, allVargas, shashtiamsaDeity, vargaLagnaSensitivity } from './vargas.js'
import { dignitySummary, karakaNature, planetPositions } from './dignity.js'
import { vimshopakaBala } from './strength.js'
import { antardashaTable, currentPeriods, mahadashaTable, vimshottariTree } from './dasha.js'
import { detectYogas, drishtiTable } from './yogas.js'
import { detectDoshas } from './doshas.js'
import { computeSadesati } from './sadesati.js'
import { computeAshtakavarga } from './ashtakavarga.js'
import { computeGochar } from './gochar.js'
import { avakahada } from './avakahada.js'
import { ratnaFor } from './ratna.js'

const DEFAULT_NOW = () => Date.now()

function birthMsOf(utc) {
  return Date.UTC(utc.year, utc.month - 1, utc.day, utc.hour, utc.minute, utc.second || 0)
}

// The twelve-house table the report prints.
function houseTable(frame) {
  const rows = []
  for (let h = 1; h <= 12; h++) {
    const occupants = frame.planetsIn(h)
    rows.push({
      house: h,
      rashi: frame.houseRashi[h - 1],
      rashiName: RASHIS[frame.houseRashi[h - 1]],
      lord: frame.houseLord[h - 1],
      lordName: GRAHAS.find((g) => g.key === frame.houseLord[h - 1]),
      planets: occupants,
    })
  }
  return rows
}

// D60 deities for every graha and the lagna (टास्क 01-ग: अब output में भी).
function d60Table(kundli) {
  const entry = (rashi, degInSign) => {
    const d = shashtiamsaDeity(rashi, degInSign)
    return { number: d.number, hi: d.hi, en: d.en, shubha: d.shubha, rashi }
  }
  const planets = {}
  for (const p of kundli.planets) planets[p.key] = entry(p.rashi, p.degInSign)
  return {
    planets,
    lagna: entry(kundli.ascendant.rashi, kundli.ascendant.degInSign),
  }
}

// The nine-graha table: sign, degree, house, nakshatra/pada, state, strength.
function planetTable(frame, positions, strength) {
  return ALL_KEYS.map((key) => {
    const p = frame.byKey[key]
    return {
      key,
      name: GRAHAS.find((g) => g.key === key),
      rashi: p.rashi,
      rashiName: RASHIS[p.rashi],
      degInSign: p.degInSign,
      house: p.house,
      nakshatra: p.nakshatra,
      nakshatraName: NAKSHATRAS[p.nakshatra - 1],
      pada: p.pada,
      retro: Boolean(p.retro),
      dignity: positions[key].dignity,
      summary: dignitySummary(key, positions[key]),
      // विंशोपक सिर्फ़ सात ग्रहों का है — राहु/केतु पर null (रिपोर्ट में "—")
      vimshopaka: strength.planets[key]?.total ?? null,
      vimshopakaBand: strength.planets[key]?.bandHi ?? null,
      owns: frame.housesOwned(key),
    }
  })
}

export function buildPhalData(swe, birth, opts = {}) {
  if (!swe || !birth?.utc) throw new Error('buildPhalData needs (swe, birth)')
  const nowMs = opts.nowMs ?? DEFAULT_NOW()

  const kundli = computeKundli(swe, birth)
  if (kundli.error) return { error: kundli.error }

  const frame = makeFrame(kundli)
  const birthMs = birthMsOf(birth.utc)

  // 1. positions + dignity
  const positions = planetPositions(kundli, frame)
  // 2. strength
  const strength = vimshopakaBala(kundli)
  // 3. vargas (+ how fast each varga lagna changes with the birth time)
  const vargas = allVargas(kundli)
  const sensitivity = vargaLagnaSensitivity(swe, birth)
  // 4. dasha
  const dashaTree = vimshottariTree(kundli.planets.find((p) => p.key === 'moon').longitude, birthMs)
  const dasha = {
    tree: dashaTree,
    current: currentPeriods(dashaTree, nowMs),
    mahadashas: mahadashaTable(dashaTree),
    antardashas10y: antardashaTable(dashaTree, nowMs, { years: 10 }),
  }
  // 5. yogas + drishti
  const yogaResult = detectYogas(frame)
  const yogas = {
    list: yogaResult.list,
    present: yogaResult.list.filter((y) => y.present),
    drishti: drishtiTable(frame),
  }
  // 6. doshas
  const doshas = detectDoshas(frame)
  // 7. sadesati (Saturn scan, birth → 100 years)
  const sadesati = computeSadesati(swe, {
    moonRashi: frame.byKey.moon.rashi,
    birthMs,
    years: 100,
    nowMs,
  })
  // 8. ashtakavarga
  const ashtakavarga = computeAshtakavarga(frame)
  // 9. gochar (today)
  const gochar = computeGochar(swe, frame, { nowMs, years: 2 })
  // 10. panchang at birth (only when the caller gave the local date + zone)
  let panchang = null
  if (birth.local && birth.timeZone) {
    try {
      panchang = computePanchang(swe, {
        year: birth.local.year,
        month: birth.local.month,
        day: birth.local.day,
        latitude: birth.latitude,
        longitude: birth.longitude,
        timeZone: birth.timeZone,
      })
    } catch (err) {
      panchang = { error: String(err?.message ?? err) }
    }
  }
  // 11. avakahada (with the panchang block inside)
  const ava = avakahada(frame, { panchang })
  // 12. ratna
  const ratna = ratnaFor(frame, { positions, strength })

  const activeYogas = yogas.present.map((y) => y.id)

  return {
    meta: {
      name: birth.name ?? null,
      gender: birth.gender ?? null,
      place: birth.place ?? null,
      local: birth.local ?? null,
      timeZone: birth.timeZone ?? null,
      utc: birth.utc,
      birthMs,
      jd: kundli.jd,
      ayanamsa: kundli.ayanamsa,
      nowMs,
      builtBy: 'phal-01',
    },
    summary: {
      lagnaRashi: frame.lagnaRashi,
      lagnaName: RASHIS[frame.lagnaRashi],
      lagnaDeg: kundli.ascendant.degInSign,
      moonRashi: frame.byKey.moon.rashi,
      moonName: RASHIS[frame.byKey.moon.rashi],
      sunRashi: frame.byKey.sun.rashi,
      nakshatra: frame.byKey.moon.nakshatra,
      nakshatraName: NAKSHATRAS[frame.byKey.moon.nakshatra - 1],
      pada: frame.byKey.moon.pada,
      activeYogas,
      sadesatiRunning: Boolean(sadesati.current),
      mahadasha: dasha.current.maha.key,
      antardasha: dasha.current.antar.key,
      pratyantardasha: dasha.current.pratyantar.key,
    },
    ascendant: {
      rashi: frame.lagnaRashi,
      name: RASHIS[frame.lagnaRashi],
      degInSign: kundli.ascendant.degInSign,
      nakshatra: kundli.ascendant.nakshatra,
      pada: kundli.ascendant.pada,
      navamsaRashi: kundli.ascendant.navamsaRashi,
      chalit: kundli.chalit,
    },
    houses: houseTable(frame),
    planets: planetTable(frame, positions, strength),
    positions,
    karakaNature: karakaNature(frame),
    strength,
    vargas: {
      charts: vargas,
      info: VARGA_INFO,
      order: VARGA_ORDERS,
      sensitivity,
      sensitivityLimitSec: sensitivity[VARGA_ORDERS[0]]?.limitSec ?? null,
      d60: d60Table(kundli),
    },
    dasha,
    yogas,
    doshas,
    sadesati,
    ashtakavarga,
    gochar,
    avakahada: ava,
    ratna,
  }
}

export { SEVEN_KEYS }
