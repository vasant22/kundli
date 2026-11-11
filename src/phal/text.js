// text.js — the tiny text helpers every phal module uses, so a Hindi sentence
// never prints a raw English key or a digit-form ordinal ("7वें").
//
// The word forms are the ones an Indian jyotish reader expects:
// पहले, दूसरे, तीसरे … बारहवें.

import { GRAHAS, RASHIS } from '../i18n.js'

const ORDINALS = [
  'पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पाँचवें', 'छठे',
  'सातवें', 'आठवें', 'नौवें', 'दसवें', 'ग्यारहवें', 'बारहवें',
]

// 1 → 'पहले', 12 → 'बारहवें' (house numbers are always 1..12 here).
export function ordinalHi(n) {
  return ORDINALS[n - 1] ?? `${n}`
}

// "4th house" → "चौथे भाव"
export function houseHi(n) {
  return `${ordinalHi(n)} भाव`
}

// "in the 4th from the Moon" → "चंद्र से चौथे"
export function fromHi(n) {
  return `${ordinalHi(n)}`
}

// A graha's Hindi name (with the English after it, like the rest of the app).
export function grahaHi(key) {
  const g = GRAHAS.find((x) => x.key === key)
  return g ? g.hi : String(key)
}

// A graha as a full bilingual label — used in tables.
export function grahaBoth(key) {
  const g = GRAHAS.find((x) => x.key === key)
  return g ? `${g.hi} / ${g.en}` : String(key)
}

export function rashiHi(index) {
  return RASHIS[index]?.hi ?? String(index)
}

export function rashiBoth(index) {
  const r = RASHIS[index]
  return r ? `${r.hi} / ${r.en}` : String(index)
}

// "सूर्य, मंगल" from ['sun','mars']
export function grahaList(keys) {
  return keys.map(grahaHi).join(', ')
}
