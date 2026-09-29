// scratch: print ours vs refs for all sunrise fixtures
import SwissEph from 'swisseph-wasm'
import { computeDayTimes } from '../../src/sunrise.js'
import { readFileSync } from 'node:fs'

const swe = new SwissEph()
await swe.initSwissEph()
const data = JSON.parse(readFileSync(new URL('../../tests/fixtures/sunrise-refs.json', import.meta.url)))
const sec = (s) => { if (!s) return null; const [h, m, x] = s.split(':').map(Number); return h * 3600 + m * 60 + (x || 0) }
for (const r of data.refs) {
  const [y, m, d] = r.date.split('-').map(Number)
  const c = computeDayTimes(swe, { year: y, month: m, day: d, latitude: r.latitude, longitude: r.longitude, timeZone: r.tz })
  const diffs = ['sunrise', 'sunset', 'moonrise', 'moonset'].map((k) => {
    if (r[k] == null) return `${k}: ref -`
    if (c[k] == null) return `${k}: ours NULL`
    return `${k}: ${(sec(c[k]) - sec(r[k]))}s`
  })
  console.log(r.city.padEnd(10), r.date, '|', diffs.join(' | '))
}
