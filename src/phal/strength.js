// strength.js — विंशोपक बल (vimshopaka bala), BPHS ch.7.
//
// Each of the sixteen vargas carries a fixed weight; inside a varga a graha
// scores 20 (own sign / exaltation), 18 (great friend), 15 (friend),
// 10 (neutral), 7 (enemy) or 5 (bitter enemy / debilitated). The weighted sum
// over 20 gives a 0–20 figure — deliberately NOT a 0–100 score: the classics
// only define 20.
//
// BPHS ch.7 weights: D1 3.5 · D2 1 · D3 1 · D9 3 · D16 2 · D30 1 · D60 4, and
// 0.5 for each of the other nine vargas (total exactly 20).
//
// D2 (hora) has its own rule: Sun/Mars/Jupiter are strong in the Sun's hora
// (Simha), Moon/Venus/Saturn in the Moon's hora (Karka), and Mercury in both.

import { VARGA_ORDERS, vargaRashi } from './vargas.js'
import { dignityIn } from './dignity.js'
import { ALL_KEYS } from './frame.js'

export const VIMSHOPAKA_WEIGHTS = {
  1: 3.5, 2: 1, 3: 1, 4: 0.5, 7: 0.5, 9: 3, 10: 0.5, 12: 0.5,
  16: 2, 20: 0.5, 24: 0.5, 27: 0.5, 30: 1, 40: 0.5, 45: 0.5, 60: 4,
}

export const DIGNITY_POINTS = {
  exalted: 20, own: 20, moolatrikona: 20,
  adhimitra: 18, mitra: 15, sama: 10, shatru: 7, adhishatru: 5,
  debilitated: 5, // the classics give the weakest band to a varga-nicha too
}

export const STRENGTH_BANDS = [
  { min: 15, key: 'full', hi: 'पूर्ण', en: 'Full' },
  { min: 10, key: 'medium', hi: 'मध्यम', en: 'Medium' },
  { min: 5, key: 'little', hi: 'अल्प', en: 'Little' },
  { min: -Infinity, key: 'weak', hi: 'क्षीण', en: 'Weak' },
]

export function strengthBand(total) {
  return STRENGTH_BANDS.find((b) => total >= b.min)
}

// Hora (D2) rule — the Sun's hora is Simha, the Moon's hora is Karka.
const HORA_SUN_GROUP = ['sun', 'mars', 'jupiter']
const HORA_MOON_GROUP = ['moon', 'venus', 'saturn']

export function vargaScore(key, n, rashi, rashiOf) {
  if (n === 2) {
    if (key === 'mercury') return 20 // Mercury is strong in both horas
    const wantsSun = HORA_SUN_GROUP.includes(key)
    const wantsMoon = HORA_MOON_GROUP.includes(key)
    if (wantsSun && rashi === 4) return 20
    if (wantsMoon && rashi === 3) return 20
    if (key === 'rahu' || key === 'ketu') return 10 // nodes: neutral in hora
    return 5
  }
  // Mid-sign degree: moolatrikona and own sign both score 20, so the exact
  // degree inside a *varga* sign cannot change the number.
  const dig = dignityIn(key, rashi, 15, rashiOf)
  return DIGNITY_POINTS[dig.level] ?? 10
}

// The full vimshopaka computation for one kundli.
export function vimshopakaBala(kundli) {
  // varga chart rashi maps (planet → rashi), one per division
  const charts = {}
  for (const n of VARGA_ORDERS) {
    const map = {}
    for (const p of kundli.planets) map[p.key] = vargaRashi(p.longitude, n)
    charts[n] = map
  }

  const planets = {}
  for (const key of ALL_KEYS) {
    let total = 0
    const perVarga = []
    for (const n of VARGA_ORDERS) {
      const rashi = charts[n][key]
      const score = vargaScore(key, n, rashi, charts[n])
      const weight = VIMSHOPAKA_WEIGHTS[n]
      total += weight * score
      perVarga.push({ varga: n, rashi, score, weight })
    }
    total = Math.round((total / 20) * 100) / 100 // 0–20, two decimals
    const band = strengthBand(total)
    planets[key] = {
      key,
      total,
      band: band.key,
      bandHi: band.hi,
      bandEn: band.en,
      perVarga,
    }
  }
  return { weights: VIMSHOPAKA_WEIGHTS, planets }
}
