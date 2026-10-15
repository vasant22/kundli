import SwissEph from 'swisseph-wasm'
import { computeBhavaChalit } from '../../src/bnn/kp.js'
import { computeAllPlanetsChain } from '../../src/bnn/pcp.js'
const swe = new SwissEph(); await swe.initSwissEph(); swe.set_sid_mode(44, 0, 0)
const CONST = { sun: swe.SE_SUN, moon: swe.SE_MOON, mars: swe.SE_MARS, mercury: swe.SE_MERCURY, jupiter: swe.SE_JUPITER, venus: swe.SE_VENUS, saturn: swe.SE_SATURN, rahu: swe.SE_MEAN_NODE, ketu: swe.SE_MEAN_NODE }
const makeLonAt = (key) => (ms) => { const d = new Date(ms); const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600; const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour); const jdt = jd + swe.deltat(jd) + 0.5 / 86400; const r = swe.calc_ut(jdt, CONST[key], swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED); let lon = r[0]; if (key === 'ketu') lon += 180; return { lon: ((lon % 360) + 360) % 360, speed: r[3] } }
const chart = computeBhavaChalit(swe, { year: 1980, month: 1, day: 22, hour: 15, minute: 0, second: 0 }, { latitude: 21.4833, longitude: 78.25 })
const NATAL = {}; chart.planets.forEach((p) => { NATAL[p.key] = p.longitude })
const fmt = (ms) => { const d = new Date(ms + 5.5 * 3600000); const p = (n) => String(n).padStart(2, '0'); return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` }
for (const key of ['mars', 'sun']) {
  const rows = computeAllPlanetsChain(makeLonAt(key), { tStartMs: Date.UTC(2026, 9, 1), tEndMs: Date.UTC(2028, 0, 15), natalLons: NATAL, birthKey: key })
  console.log('\n=== ' + key.toUpperCase() + ' chain (IST) ===')
  for (const r of rows) console.log(`${fmt(r.startMs)}  ${r.clippedStart ? '(clip)' : '      '}  ${key}-${r.ownerKey.toUpperCase()}  k=${r.k}`)
}
console.log('DONE-DBG2')
