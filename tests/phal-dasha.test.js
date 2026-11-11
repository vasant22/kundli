// tests/phal-dasha.test.js — विंशोत्तरी दशा (महादशा → अंतर्दशा → प्रत्यंतर).
// The first two levels must match the kundli page *exactly* (same ms), because
// the PDF and the website are read side by side.
import { describe, expect, it } from 'vitest'
import { computeVimshottari, DASHA_SEQ, DASHA_YEARS } from '../src/astro.js'
import {
  antardashaTable,
  currentPeriods,
  mahadashaTable,
  pratyantarOf,
  vimshottariTree,
} from '../src/phal/dasha.js'

// 15 May 1990, 14:30 IST → 09:00 UT
const BIRTH_MS = Date.UTC(1990, 4, 15, 9, 0, 0)
const MOON_LON = 271.894 // the site's fixture value for this chart

describe('mahadasha / antardasha parity with the kundli page', () => {
  const tree = vimshottariTree(MOON_LON, BIRTH_MS, { years: 100 })

  it('the first mahadashas are identical to computeVimshottari', () => {
    const site = computeVimshottari(MOON_LON, BIRTH_MS, BIRTH_MS + 30 * 365.25 * 86400000)
    const n = Math.min(site.mahadashas.length, tree.mahadashas.length)
    expect(n).toBeGreaterThanOrEqual(9)
    for (let i = 0; i < n; i++) {
      expect(tree.mahadashas[i].key).toBe(site.mahadashas[i].key)
      expect(tree.mahadashas[i].fromMs).toBe(site.mahadashas[i].fromMs)
      expect(tree.mahadashas[i].toMs).toBe(site.mahadashas[i].toMs)
    }
  })

  it('the antardashas of any mahadasha are identical to the site’s', () => {
    for (const step of [0, 1, 2, 3]) {
      const nowMs = BIRTH_MS + step * 12 * 365.25 * 86400000
      const site = computeVimshottari(MOON_LON, BIRTH_MS, nowMs)
      const md = tree.mahadashas[site.currentIdx]
      expect(md.key).toBe(site.mahadashas[site.currentIdx].key)
      site.antardashas.forEach((a, i) => {
        expect(md.antardashas[i].key).toBe(a.key)
        expect(md.antardashas[i].fromMs).toBe(a.fromMs)
        expect(md.antardashas[i].toMs).toBe(a.toMs)
      })
      expect(md.antardashas[site.currentAdIdx].key).toBe(site.antardashas[site.currentAdIdx].key)
    }
  })

  it('the first period starts at the birth moment, the rest are contiguous', () => {
    expect(tree.mahadashas[0].fromMs).toBe(BIRTH_MS)
    for (let i = 1; i < tree.mahadashas.length; i++) {
      expect(tree.mahadashas[i].fromMs).toBe(tree.mahadashas[i - 1].toMs)
      expect(tree.mahadashas[i].fullStartMs).toBe(tree.mahadashas[i].fromMs)
    }
  })

  it('covers the full hundred years', () => {
    const last = tree.mahadashas[tree.mahadashas.length - 1]
    expect(last.toMs).toBeGreaterThanOrEqual(BIRTH_MS + 100 * 365.25 * 86400000)
  })
})

describe('antardasha arithmetic', () => {
  const tree = vimshottariTree(MOON_LON, BIRTH_MS, { years: 100 })
  const md = tree.mahadashas[1] // a full (not partial) mahadasha

  it('nine antardashas, in the rotated sequence from the mahadasha lord', () => {
    expect(md.antardashas.length).toBe(9)
    expect(md.antardashas[0].key).toBe(md.key)
    const start = DASHA_SEQ.indexOf(md.key)
    const expected = Array.from({ length: 9 }, (_, i) => DASHA_SEQ[(start + i) % 9])
    expect(md.antardashas.map((a) => a.key)).toEqual(expected)
  })

  it('antardasha = mahadasha × sub-lord years / 120', () => {
    const mdYears = DASHA_YEARS[md.key]
    const yearMs = 365.25 * 86400000
    for (const ad of md.antardashas) {
      expect(ad.toMs - ad.fromMs).toBeCloseTo((mdYears * DASHA_YEARS[ad.key] * yearMs) / 120, 3)
    }
    const total = md.antardashas.reduce((s, a) => s + (a.toMs - a.fromMs), 0)
    expect(total).toBeCloseTo(md.toMs - md.fromMs, 3)
  })
})

describe('pratyantardasha arithmetic', () => {
  const tree = vimshottariTree(MOON_LON, BIRTH_MS, { years: 100 })

  it('nine pratyantars inside every antardasha, exactly filling it', () => {
    for (const md of tree.mahadashas.slice(0, 3)) {
      for (const ad of md.antardashas) {
        expect(ad.sub.length).toBe(9)
        expect(ad.sub[0].key).toBe(ad.key)
        expect(ad.sub[0].fromMs).toBe(ad.fromMs)
        expect(ad.sub[8].toMs).toBeCloseTo(ad.toMs, 3)
        for (let i = 1; i < 9; i++) expect(ad.sub[i].fromMs).toBeCloseTo(ad.sub[i - 1].toMs, 6)
        const total = ad.sub.reduce((s, p) => s + (p.toMs - p.fromMs), 0)
        expect(total).toBeCloseTo(ad.toMs - ad.fromMs, 3)
      }
    }
  })

  it('pratyantar = antardasha × sub-lord years / 120', () => {
    const ad = tree.mahadashas[1].antardashas[2]
    const adYears = (DASHA_YEARS[tree.mahadashas[1].key] * DASHA_YEARS[ad.key]) / 120
    for (const pd of ad.sub) {
      expect(pd.toMs - pd.fromMs).toBeCloseTo((adYears * DASHA_YEARS[pd.key] * 365.25 * 86400000) / 120, 3)
    }
  })
})

describe('current periods', () => {
  const tree = vimshottariTree(MOON_LON, BIRTH_MS, { years: 100 })

  it('returns three nested periods that contain the given moment', () => {
    const now = Date.UTC(2026, 10, 11, 12)
    const cur = currentPeriods(tree, now)
    for (const p of [cur.maha, cur.antar, cur.pratyantar]) {
      expect(now).toBeGreaterThanOrEqual(p.fromMs)
      expect(now).toBeLessThan(p.toMs)
    }
    expect(cur.pratyantar.fromMs).toBeGreaterThanOrEqual(cur.antar.fromMs)
    expect(cur.pratyantar.toMs).toBeLessThanOrEqual(cur.antar.toMs + 1)
  })

  it('agrees with the site’s current mahadasha / antardasha', () => {
    const now = Date.UTC(2026, 10, 11, 12)
    const site = computeVimshottari(MOON_LON, BIRTH_MS, now)
    const cur = currentPeriods(tree, now)
    expect(cur.maha.key).toBe(site.mahadashas[site.currentIdx].key)
    expect(cur.antar.key).toBe(site.antardashas[site.currentAdIdx].key)
  })

  it('a moment before birth still yields a usable period object', () => {
    const cur = currentPeriods(tree, BIRTH_MS - 86400000)
    expect(typeof cur.maha.key).toBe('string')
    expect(Number.isFinite(cur.pratyantar.toMs)).toBe(true)
  })

  it('pratyantarOf lists the nine sub-periods of the running antardasha', () => {
    const now = Date.UTC(2026, 10, 11, 12)
    const list = pratyantarOf(tree, now)
    expect(list.length).toBe(9)
    expect(list[0].fromMs).toBe(currentPeriods(tree, now).antar.fromMs)
  })
})

describe('tables', () => {
  const tree = vimshottariTree(MOON_LON, BIRTH_MS, { years: 100 })

  it('mahadasha table covers birth → 100 years', () => {
    const rows = mahadashaTable(tree)
    expect(rows[0].fromMs).toBe(BIRTH_MS)
    expect(rows[rows.length - 1].toMs).toBeGreaterThanOrEqual(BIRTH_MS + 100 * 365.25 * 86400000)
    expect(rows.every((r) => DASHA_SEQ.includes(r.key))).toBe(true)
  })

  it('ten-year antardasha table is clipped to the window and ordered', () => {
    const now = Date.UTC(2026, 10, 11, 12)
    const rows = antardashaTable(tree, now, { years: 10 })
    expect(rows.length).toBeGreaterThan(4)
    expect(rows[0].fromMs).toBe(now)
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].fromMs).toBeCloseTo(rows[i - 1].toMs, 6)
    }
    expect(rows[rows.length - 1].fromMs).toBeLessThan(now + 10 * 365.25 * 86400000)
    // the last row may run past the ten-year edge — it is a real period, not clipped
    expect(rows[rows.length - 1].toMs).toBeGreaterThan(now + 9 * 365.25 * 86400000)
    expect(rows.every((r) => DASHA_SEQ.includes(r.key) && DASHA_SEQ.includes(r.mahaKey))).toBe(true)
  })
})

describe('start from the Moon’s nakshatra', () => {
  it('the first mahadasha lord follows the nakshatra lord sequence', () => {
    // Moon at 0° = Ashwini → Ketu; at 13°20′ = Bharani → Venus; at 40° = Rohini → Moon
    const t0 = vimshottariTree(0.1, BIRTH_MS)
    expect(t0.mahadashas[0].key).toBe('ketu')
    const t1 = vimshottariTree(13.5, BIRTH_MS)
    expect(t1.mahadashas[0].key).toBe('venus')
    const t2 = vimshottariTree(40, BIRTH_MS)
    expect(t2.mahadashas[0].key).toBe('moon')
  })
})
