// ashtakavarga.js — भिन्नाष्टकवर्ग (BAV) and सर्वाष्टकवर्ग (SAV), BPHS ch.66.
//
// Each of the seven grahas contributes bindus to certain houses counted from
// every graha AND from the lagna. The classical totals are the check-sum of the
// whole system:
//   सूर्य 48 · चंद्र 49 · मंगल 39 · बुध 54 · गुरु 56 · शुक्र 52 · शनि 39
//   सर्वाष्टकवर्ग = 337
// tests/phal-ashtakavarga.test.js asserts both — a typo in any table breaks it.

import { ALL_KEYS, SEVEN_KEYS } from './frame.js'

const V = {
  sun: [1, 2, 4, 7, 8, 9, 10, 11],
  moon: [3, 6, 10, 11],
  mars: [1, 2, 4, 7, 8, 9, 10, 11],
  mercury: [3, 5, 6, 9, 10, 11, 12],
  jupiter: [5, 6, 9, 11],
  venus: [6, 7, 12],
  saturn: [1, 2, 4, 7, 8, 9, 10, 11],
  lagna: [3, 4, 6, 10, 11, 12],
}
const M = {
  sun: [3, 6, 7, 8, 10, 11],
  moon: [1, 3, 6, 7, 10, 11],
  mars: [2, 3, 5, 6, 9, 10, 11],
  mercury: [1, 3, 4, 5, 7, 8, 10, 11],
  jupiter: [1, 4, 7, 8, 10, 11, 12], // 2026-11-11 सुधार (टास्क 01-ग): 2 की जगह 12
  venus: [3, 4, 5, 7, 9, 10, 11],
  saturn: [3, 5, 6, 11],
  lagna: [3, 6, 10, 11],
}
const MA = {
  sun: [3, 5, 6, 10, 11],
  moon: [3, 6, 11],
  mars: [1, 2, 4, 7, 8, 10, 11],
  mercury: [3, 5, 6, 11],
  jupiter: [6, 10, 11, 12],
  venus: [6, 8, 11, 12],
  saturn: [1, 4, 7, 8, 9, 10, 11],
  lagna: [1, 3, 6, 10, 11],
}
const ME = {
  sun: [5, 6, 9, 11, 12],
  moon: [2, 4, 6, 8, 10, 11],
  mars: [1, 2, 4, 7, 8, 9, 10, 11],
  mercury: [1, 3, 5, 6, 9, 10, 11, 12],
  jupiter: [6, 8, 11, 12],
  venus: [1, 2, 3, 4, 5, 8, 9, 11],
  saturn: [1, 2, 4, 7, 8, 9, 10, 11],
  lagna: [1, 2, 4, 6, 8, 10, 11],
}
const J = {
  sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
  moon: [2, 5, 7, 9, 11],
  mars: [1, 2, 4, 7, 8, 10, 11],
  mercury: [1, 2, 4, 5, 6, 9, 10, 11],
  jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
  venus: [2, 5, 6, 9, 10, 11],
  saturn: [3, 5, 6, 12],
  lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
}
const VE = {
  sun: [8, 11, 12],
  moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  mars: [3, 5, 6, 9, 11, 12],
  mercury: [3, 5, 6, 9, 11],
  jupiter: [5, 8, 9, 10, 11],
  venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
  saturn: [3, 4, 5, 8, 9, 10, 11],
  lagna: [1, 2, 3, 4, 5, 8, 9, 11],
}
const S = {
  sun: [1, 2, 4, 7, 8, 10, 11],
  moon: [3, 6, 11],
  mars: [3, 5, 6, 10, 11, 12],
  mercury: [6, 8, 9, 10, 11, 12],
  jupiter: [5, 6, 11, 12],
  venus: [6, 11, 12],
  saturn: [3, 5, 6, 11],
  lagna: [1, 3, 4, 6, 10, 11],
}

// BAV tables: the contributing graha → houses counted from it.
export const ASHTAKAVARGA = {
  sun: V, moon: M, mars: MA, mercury: ME, jupiter: J, venus: VE, saturn: S,
}

export const ASHTAKAVARGA_TOTALS = {
  sun: 48, moon: 49, mars: 39, mercury: 54, jupiter: 56, venus: 52, saturn: 39,
}

export const SAV_TOTAL = 337

export const ASHTAKAVARGA_REFS = [...SEVEN_KEYS, 'lagna']

// The bindus one graha receives in each of the twelve houses.
//
// Two orders are returned, because the two are easy to confuse:
//   bySign  — index 0 = Mesha … 11 = Meena (the order the classical tables and
//             the reference software print)
//   byHouse — index 0 = the lagna's sign, 1 = the 2nd house … (the order the
//             report's house table uses)
export function bhinnashtakavarga(frame, key) {
  const table = ASHTAKAVARGA[key]
  const refRashi = (ref) => (ref === 'lagna' ? frame.lagnaRashi : frame.rashiOf[ref])
  const countIn = (rashi) => {
    let n = 0
    for (const ref of ASHTAKAVARGA_REFS) {
      const house = ((rashi - refRashi(ref) + 12) % 12) + 1
      if (table[ref].includes(house)) n += 1
    }
    return n
  }
  const bySign = []
  for (let r = 0; r < 12; r++) bySign.push(countIn(r))
  const byHouse = []
  for (let h = 1; h <= 12; h++) byHouse.push(bySign[frame.houseRashi[h - 1]])
  const rows = ASHTAKAVARGA_REFS.map((ref) => ({
    ref,
    houses: table[ref],
    rashi: refRashi(ref),
  }))
  return {
    key,
    rows,
    bySign,
    byHouse,
    total: bySign.reduce((a, b) => a + b, 0),
  }
}

export function computeAshtakavarga(frame) {
  const bav = {}
  for (const key of SEVEN_KEYS) bav[key] = bhinnashtakavarga(frame, key)
  const savBySign = []
  for (let r = 0; r < 12; r++) {
    savBySign.push(SEVEN_KEYS.reduce((sum, k) => sum + bav[k].bySign[r], 0))
  }
  const savByHouse = []
  for (let h = 1; h <= 12; h++) savByHouse.push(savBySign[frame.houseRashi[h - 1]])
  return {
    bav,
    sav: { bySign: savBySign, byHouse: savByHouse, total: savBySign.reduce((a, b) => a + b, 0) },
    // convenience for the report's "कौन-से भाव में कितने बिंदु" line
    houseRashi: frame.houseRashi,
    keys: ALL_KEYS,
  }
}
