// scratch validation for src/sunrise.js — run: node .openclaw/tmp/check-sunrise.mjs
import SwissEph from 'swisseph-wasm'
import { computeDayTimes } from '../../src/sunrise.js'
import { formatLocalTime } from '../../src/sunrise.js'

const swe = new SwissEph()
await swe.initSwissEph()

const target = { sunrise: '06:12:41', sunset: '18:10:03', moonrise: '19:40:00', moonset: '08:43:59', day: '11:57:22' }
console.log('Target (AstroSage, New Delhi 2026-09-29):', target)

for (const alt of [0, 100, 216]) {
  const r = computeDayTimes(swe, {
    year: 2026, month: 9, day: 29,
    latitude: 28.6139, longitude: 77.209,
    altitude: alt, timeZone: 'Asia/Kolkata',
  })
  const day = r.dayDurationSeconds
  const hms = `${String(Math.floor(day / 3600)).padStart(2, '0')}:${String(Math.floor((day % 3600) / 60)).padStart(2, '0')}:${String(day % 60).padStart(2, '0')}`
  console.log(`alt=${alt}: rise=${r.sunrise} set=${r.sunset} moonrise=${r.moonrise} moonset=${r.moonset} day=${hms} offset=${r.offsetMinutes} note=${r.note}`)
}

// Also validate a couple of other spans for sanity (NYC + Sydney quick check vs known)
const nyc = computeDayTimes(swe, { year: 2026, month: 6, day: 21, latitude: 40.7128, longitude: -74.006, altitude: 0, timeZone: 'America/New_York' })
console.log('NYC 2026-06-21:', nyc.sunrise, nyc.sunset, 'day', nyc.dayDurationSeconds)
const syd = computeDayTimes(swe, { year: 2026, month: 12, day: 21, latitude: -33.8688, longitude: 151.2093, altitude: 0, timeZone: 'Australia/Sydney' })
console.log('Sydney 2026-12-21:', syd.sunrise, syd.sunset, 'day', syd.dayDurationSeconds)
// Polar check (Tromsø in June)
const tromso = computeDayTimes(swe, { year: 2026, month: 6, day: 21, latitude: 69.6492, longitude: 18.9553, altitude: 0, timeZone: 'Europe/Oslo' })
console.log('Tromsø 2026-06-21:', JSON.stringify({ rise: tromso.sunrise, set: tromso.sunset, note: tromso.note }))
// Moon N/A search: find a date where moonrise is absent for Delhi (rare-ish; try a few)
for (let d = 1; d <= 5; d++) {
  const m = computeDayTimes(swe, { year: 2026, month: 10, day: d, latitude: 28.6139, longitude: 77.209, altitude: 0, timeZone: 'Asia/Kolkata' })
  console.log(`Delhi 2026-10-0${d}: moonrise=${m.moonrise} moonset=${m.moonset}`)
}
