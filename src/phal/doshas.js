// doshas.js — मंगल दोष, कालसर्प और गुरु-चांडाल.
//
// मंगल दोष comes straight from mangaldosha.js (the same function the
// kundli-milan page uses) — the PDF must never contradict the matching page.
// कालसर्प and गुरु-चांडाल are labelled as modern / later-tradition notions,
// because BPHS does not carry them.

import { checkMangalDosha, MANGLIK_HOUSES } from '../mangaldosha.js'
import { SEVEN_KEYS, norm360 } from './frame.js'

const AXIS_TOLERANCE = 1e-6

export function mangalDosha(frame) {
  const d = checkMangalDosha(frame.kundli)
  if (!d) return null
  const notes = []
  if (d.present && d.ownSign) {
    notes.push({ key: 'ownSign', hi: 'मंगल अपनी राशि (मेष/वृश्चिक) में है — कुछ परंपराओं में दोष का निवारण माना जाता है।' })
  }
  if (d.present && d.exalted) {
    notes.push({ key: 'exalted', hi: 'मंगल उच्च राशि (मकर) में है — कुछ परंपराओं में दोष का निवारण माना जाता है।' })
  }
  return {
    present: d.present,
    severity: d.severity, // 'low' | 'high' | null
    fromLagna: d.fromLagna,
    fromMoon: d.fromMoon,
    marsHouse: d.lagnaHouse,
    marsHouseFromMoon: d.moonHouse,
    houses: MANGLIK_HOUSES,
    notes,
  }
}

// कालसर्प: all seven grahas on one side of the Rahu–Ketu axis.
export function kaalSarpa(frame) {
  const rahuLon = frame.byKey.rahu.longitude
  const arc = (key) => norm360(frame.byKey[key].longitude - rahuLon)
  const values = SEVEN_KEYS.map((k) => ({ key: k, arc: arc(k) }))
  const onAxis = values.filter((v) => v.arc <= AXIS_TOLERANCE || Math.abs(v.arc - 180) <= AXIS_TOLERANCE)
  if (onAxis.length) {
    return { present: false, label: 'आधुनिक मान्यता', side: null, reason: 'on-axis', planets: values }
  }
  const firstHalf = values.every((v) => v.arc < 180)
  const secondHalf = values.every((v) => v.arc > 180)
  const present = firstHalf || secondHalf
  return {
    present,
    label: 'आधुनिक मान्यता',
    side: firstHalf ? 'rahu-to-ketu' : secondHalf ? 'ketu-to-rahu' : null,
    reason: present ? 'one-side' : 'both-sides',
    planets: values.map((v) => ({ key: v.key, arc: Math.round(v.arc * 100) / 100 })),
  }
}

// गुरु-चांडाल: Jupiter in the same rashi as Rahu.
export function guruChandal(frame) {
  const present = frame.byKey.jupiter.rashi === frame.byKey.rahu.rashi
  return {
    present,
    label: 'परवर्ती मान्यता',
    house: present ? frame.byKey.jupiter.house : null,
  }
}

export function detectDoshas(frame) {
  return {
    mangal: mangalDosha(frame),
    kaalSarpa: kaalSarpa(frame),
    guruChandal: guruChandal(frame),
  }
}
