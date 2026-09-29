// panchang-multicity.test.js — Phase 9: multi-city panchang cross-check.
// 12 combos (4 cities × 3 dates across the year) vs Drik Panchang's published
// values: tithi/nakshatra/yoga/karana names + end times and 5 muhurat windows.
// (Element end times are global instants — identical across Indian cities;
// the muhurat windows are sunrise-based and differ per city.)
// Tolerance: 120 s (measured deltas are ≤ ~90 s; Drik displays minutes only).
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { computePanchang } from '../src/panchang.js'
import { TITHIS, YOGAS, KARANAS, NAKSHATRAS } from '../src/i18n.js'
import refs from '../scripts/panchang-calib/drik-panchang.json'

const TOL = 120

const CITIES = {
  Varanasi: { latitude: 25.3176, longitude: 82.9739 },
  Mumbai: { latitude: 19.076, longitude: 72.8777 },
  Chennai: { latitude: 13.0827, longitude: 80.2707 },
  'New Delhi': { latitude: 28.6139, longitude: 77.209 },
}

let swe
beforeAll(async () => {
  swe = await initEphemeris()
}, 30000)

const toSec = (t) => { const [h, m, s] = t.split(':').map(Number); return h * 3600 + m * 60 + (s || 0) }
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const norm = (s) => clean(s).toLowerCase()
const NAME_ALIAS = { dvitiya: 'dwitiya', dvadashi: 'dwadashi', vyagatha: 'vyaghata' }
const canon = (s) => NAME_ALIAS[norm(s)] ?? norm(s)

function drikEndSeconds(row) {
  const m = String(row).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/)
  if (!m) return null
  let h = Number(m[1]) % 12
  if (m[3] === 'PM') h += 12
  let secs = h * 3600 + Number(m[2]) * 60
  if (/,\s*[A-Z][a-z]{2} \d+/.test(row)) secs += 86400 // next-day marker
  return secs
}

function drikRange(row) {
  const m = String(row).match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*to\s*(\d{1,2}):(\d{2})\s*(AM|PM)/)
  if (!m) return null
  const t = (h, mi, ap) => { let hh = Number(h) % 12; if (ap === 'PM') hh += 12; return hh * 3600 + Number(mi) * 60 }
  return [t(m[1], m[2], m[3]), t(m[4], m[5], m[6])]
}

const within = (ours, theirs, tol, ctx) => {
  const diff = Math.abs(toSec(ours) - theirs)
  expect(diff, `${ctx}: ${ours} vs ${theirs}s`).toBeLessThanOrEqual(tol)
}

describe('multi-city panchang vs Drik (12 city×date combos)', () => {
  for (const ref of refs) {
    it(`${ref.city} ${ref.date}`, () => {
      const [d, m, y] = ref.date.split('-').map(Number)
      const place = CITIES[ref.city]
      const p = computePanchang(swe, { year: y, month: m, day: d, ...place, timeZone: 'Asia/Kolkata' })
      const rows = ref.rows

      // tithi (name + end)
      const tName = clean(rows.Tithi.split(/\s+upto/)[0])
      expect(canon(TITHIS[p.tithi.index - 1].en), `tithi name ${tName}`).toBe(canon(tName))
      within(p.tithi.entries[0].endText, drikEndSeconds(rows.Tithi), TOL, `${ref.city} ${ref.date} tithi`)

      // nakshatra
      const nName = clean(rows.Nakshatra.split(/\s+upto/)[0])
      expect(canon(NAKSHATRAS[p.nakshatra.index - 1].en), `nak name ${nName}`).toBe(canon(nName))
      within(p.nakshatra.entries[0].endText, drikEndSeconds(rows.Nakshatra), TOL, `${ref.city} ${ref.date} nakshatra`)

      // yoga
      const yName = clean(rows.Yoga.split(/\s+upto/)[0])
      expect(canon(YOGAS[p.yoga.index - 1].en), `yoga name ${yName}`).toBe(canon(yName))
      within(p.yoga.entries[0].endText, drikEndSeconds(rows.Yoga), TOL, `${ref.city} ${ref.date} yoga`)

      // karana
      const kName = clean(rows.Karana.split(/\s+upto/)[0])
      expect(canon(KARANAS[p.karana.numbers[0]].en), `karana name ${kName}`).toBe(canon(kName))
      within(p.karana.entries[0].endText, drikEndSeconds(rows.Karana), TOL, `${ref.city} ${ref.date} karana`)

      // muhurat windows (sunrise-based → city-specific)
      const checks = [
        ['Rahu Kalam', p.muhurats.rahu],
        ['Yamaganda', p.muhurats.yamaganda],
        ['Gulikai Kalam', p.muhurats.gulika],
        ['Abhijit', p.muhurats.abhijit],
      ]
      for (const [label, ours] of checks) {
        const [from, to] = drikRange(rows[label])
        within(ours.from, from, TOL, `${ref.city} ${ref.date} ${label} from`)
        within(ours.to, to, TOL, `${ref.city} ${ref.date} ${label} to`)
      }

      // Dur Muhurtam (first range)
      const [durFrom, durTo] = drikRange(rows['Dur Muhurtam'])
      within(p.muhurats.dushta[0].from, durFrom, TOL, `${ref.city} ${ref.date} dur from`)
      within(p.muhurats.dushta[0].to, durTo, TOL, `${ref.city} ${ref.date} dur to`)
    })
  }
})
