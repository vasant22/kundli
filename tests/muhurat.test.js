// muhurat.test.js — Phase 4: muhurat windows vs AstroSage fixtures.
// All 7 weekdays are covered by the Sep 24–30, 2026 sample; every fixture date
// that carries muhurat fields is asserted. Tolerance: 180 s (the reference's
// own window times sit up to ~90 s away from Drik; ours track Drik closely).
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { computePanchang } from '../src/panchang.js'
import fixtures from '../scripts/panchang-calib/astrosage.json'

let swe

beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

const DELHI = { latitude: 28.6139, longitude: 77.209, timeZone: 'Asia/Kolkata' }
function compute(dateKey) {
  const [dd, mm, yyyy] = dateKey.split('-').map(Number)
  return computePanchang(swe, { year: yyyy, month: mm, day: dd, ...DELHI })
}

const TOL = 180

const toSec = (t) => { const [h, m, s] = t.split(':').map(Number); return h * 3600 + m * 60 + (s || 0) }
const withinSec = (a, b, tol) => Math.abs(toSec(a) - toSec(b)) <= tol

function ranges(s) {
  return [...String(s ?? '').matchAll(/From (\d{1,2}:\d{2}:\d{2}) To (\d{1,2}:\d{2}:\d{2})/g)]
    .map((m) => [m[1], m[2]])
}

const FIELDS = [
  ['rahu', 'Rahu Kaal'], ['yamaganda', 'Yamaganda'], ['gulika', 'Gulika Kaal'],
  ['kulika', 'Kulika'], ['kantaka', 'Kantaka / Mrityu'], ['kalavela', 'Kalavela / Ardhayaam'],
  ['yamaghanta', 'Yamaghanta'], ['abhijit', 'Abhijit'],
]

describe('muhurat windows vs AstroSage fixtures', () => {
  for (const [key, rec] of Object.entries(fixtures)) {
    if (key.startsWith('_') || !rec['Rahu Kaal']) continue

    it(`${key}: all muhurat windows within ${TOL}s`, () => {
      const p = compute(key)
      expect(p.note).toBeUndefined()
      const m = p.muhurats
      expect(m).toBeTruthy()

      for (const [field, label] of FIELDS) {
        const ref = ranges(rec[label])
        if (!ref.length) continue
        expect(withinSec(m[field].from, ref[0][0], TOL), `${label} from ${m[field].from} vs ${ref[0][0]}`).toBe(true)
        expect(withinSec(m[field].to, ref[0][1], TOL), `${label} to ${m[field].to} vs ${ref[0][1]}`).toBe(true)
      }

      // Dushta Muhurtas: 1 or 2 ranges, same count and order
      const refD = ranges(rec['Dushta Muhurtas'])
      if (refD.length) {
        expect(m.dushta.length).toBe(refD.length)
        refD.forEach((r, i) => {
          expect(withinSec(m.dushta[i].from, r[0], TOL)).toBe(true)
          expect(withinSec(m.dushta[i].to, r[1], TOL)).toBe(true)
        })
      }
    })
  }
})

describe('muhurat focused checks', () => {
  it('2026-09-29 (Tuesday): exact windows incl. both Dushta ranges on Monday', () => {
    const tue = compute('29-09-2026').muhurats
    expect(withinSec(tue.rahu.from, '15:10:42', TOL)).toBe(true)
    expect(withinSec(tue.rahu.to, '16:40:22', TOL)).toBe(true)
    expect(withinSec(tue.gulika.from, '12:11:22', TOL)).toBe(true)
    expect(withinSec(tue.yamaganda.from, '09:12:01', TOL)).toBe(true)
    // Abhijit centered on the arithmetic midday
    const day = compute('29-09-2026')
    const mid = (toSec(day.sunrise) + toSec(day.sunset)) / 2
    const center = (toSec(tue.abhijit.from) + toSec(tue.abhijit.to)) / 2
    expect(Math.abs(center - mid)).toBeLessThanOrEqual(120)

    const mon = compute('28-09-2026').muhurats
    expect(mon.dushta.length).toBe(2)
    expect(withinSec(mon.dushta[0].from, '12:35:40', TOL)).toBe(true)
    expect(withinSec(mon.dushta[1].from, '14:59:28', TOL)).toBe(true)
  })

  it('window lengths are exactly D/8 and D/15', () => {
    const p = compute('29-09-2026')
    const D = p.dayDurationSeconds
    const len = (w) => toSec(w.to) - toSec(w.from)
    expect(Math.abs(len(p.muhurats.rahu) - D / 8)).toBeLessThanOrEqual(2)
    expect(Math.abs(len(p.muhurats.kulika) - D / 15)).toBeLessThanOrEqual(2)
    expect(Math.abs(len(p.muhurats.dushta[0]) - D / 15)).toBeLessThanOrEqual(2)
  })
})
