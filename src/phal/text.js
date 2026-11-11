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
// दूसरा argument देने पर वह शब्द जुड़ जाता है: ordinalHi(4, 'भाव') → 'चौथे भाव'.
export function ordinalHi(n, unit = null) {
  const word = ORDINALS[n - 1] ?? `${n}`
  return unit ? `${word} ${unit}` : word
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

// अंश-मिनट (राशि के भीतर). पहले कुल मिनट गोल होते हैं, फिर अंश और मिनट बनते हैं,
// इसलिए "20° 60′" जैसा कभी नहीं छपता:
//   20.9999 → "21° 00′" · 0.004 → "0° 00′"
// राशि-सीमा (30°00′) कभी नहीं लाँघी जाती — 29.9999 → "29° 59′" (आख़िरी मिनट नीचे).
export function degMinHi(deg) {
  if (!Number.isFinite(deg)) return '—'
  const total = Math.min(Math.round(Math.abs(deg) * 60), 30 * 60 - 1)
  const d = Math.floor(total / 60)
  const m = total % 60
  return `${d}° ${String(m).padStart(2, '0')}′`
}
