// pcp-check.mjs — Special Transit engine vs the legacy software's tables.
// Reference: the Mars chart (N = Mars, Leo 21°30′), tab Saturn Guru, mode 1579,
// range 07-10-2026 → 07-01-2040 — dates captured from the legacy output on
// 2026-10-07 (docs/bnn-calib-findings.md §10).
// Run: node scripts/bnn-calib/pcp-check.mjs
import SwissEph from 'swisseph-wasm'
import { computeRowsForPlanet, stepFor, preRollFor, fmtISO } from '../../src/bnn/pcp.js'

const swe = new SwissEph()
await swe.initSwissEph()
swe.set_sid_mode(44, 0, 0)
const FLAGS = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED
const CONST = { jupiter: swe.SE_JUPITER, saturn: swe.SE_SATURN }

// lonAt for a planet at a JS ms instant (UT + ΔT + 0.5 s — app convention).
function makeLonAt(key) {
  const c = CONST[key]
  return (ms) => {
    const d = new Date(ms)
    const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
    const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour)
    const jdt = jd + swe.deltat(jd) + 0.5 / 86400
    const r = swe.calc_ut(jdt, c, FLAGS)
    return { lon: r[0], speed: r[3] }
  }
}

// IST date string (legacy tables show Indian dates).
const fmtIST = (ms) => {
  const d = new Date(ms + 5.5 * 3600 * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`
}

const t = (y, m, d) => Date.UTC(y, m - 1, d)
const tStart = t(2026, 10, 7)
const tEnd = t(2040, 1, 7)

// N = Mars: sign 4 (Leo), deg 21.5017
const ZSIGN = 4
const ZDEG = 21.5017
const MODE = '1579'

const EXPECTED = {
  jupiter: [
    ['MAR-1', '15-09-2027', '13-10-2027'],
    ['MAR-1', '08-02-2028', '14-05-2028'],
    ['MAR-9', '03-01-2032', '29-01-2032'],
    ['MAR-5', '25-07-2032', '18-09-2032'],
    ['MAR-7', '30-01-2034', '25-02-2034'],
    ['MAR-5', '17-06-2035', '22-07-2035'],
    ['MAR-9', '10-09-2035', '14-11-2035'],
    ['MAR-5', '15-01-2036', '09-03-2036'],
    ['MAR-1', '31-08-2039', '27-09-2039'],
  ],
  saturn: [
    ['MAR-5', '29-07-2028', '23-08-2028'],
    ['MAR-5', '05-04-2029', '23-05-2029'],
    ['MAR-9', '07-09-2029', '19-01-2030'],
    ['MAR-1', '06-10-2037', '04-02-2038'],
    ['MAR-1', '23-06-2038', '22-08-2038'],
    ['MAR-1', '08-03-2039', '25-05-2039'],
  ],
}

const dayDiff = (a, b) => {
  const [da, ma, ya] = a.split('-').map(Number)
  const [db, mb, yb] = b.split('-').map(Number)
  return Math.abs((Date.UTC(ya, ma - 1, da) - Date.UTC(yb, mb - 1, db)) / 86400000)
}

let pass = 0
let fail = 0
for (const key of ['jupiter', 'saturn']) {
  const lonAt = makeLonAt(key)
  const rows = computeRowsForPlanet(lonAt, tStart, tEnd, ZSIGN, ZDEG, MODE, {
    stepMs: stepFor(key),
    preRollMs: preRollFor(key),
  })
  const got = rows.map((r) => ({
    label: `MAR-${r.k}`,
    start: fmtIST(r.startMs),
    end: fmtIST(r.endMs),
  }))
  console.log(`\n===== TRANSIT ${key.toUpperCase()} (${MODE}) =====`)
  console.log('computed:')
  for (const g of got) console.log(`  ${g.label}  ${g.start} -> ${g.end}`)
  console.log('expected (legacy):')
  for (const [l, s, e] of EXPECTED[key]) console.log(`  ${l}  ${s} -> ${e}`)
  // compare
  const exp = EXPECTED[key]
  if (got.length !== exp.length) {
    fail += Math.abs(got.length - exp.length)
    console.log(`  ⚠️ count mismatch: got ${got.length}, want ${exp.length}`)
  }
  for (let i = 0; i < Math.max(got.length, exp.length); i++) {
    const g = got[i]
    const w = exp[i]
    if (!g || !w) {
      console.log(`  ❌ row ${i + 1}: ${g ? 'extra' : 'missing'}`)
      continue
    }
    const okLabel = g.label === w[0]
    const okStart = dayDiff(g.start, w[1]) <= 1
    const okEnd = dayDiff(g.end, w[2]) <= 1
    if (okLabel && okStart && okEnd) {
      pass++
      console.log(`  ✅ row ${i + 1}: ${g.label} ${g.start} -> ${g.end}`)
    } else {
      fail++
      console.log(
        `  ❌ row ${i + 1}: got ${g.label} ${g.start} -> ${g.end} | want ${w[0]} ${w[1]} -> ${w[2]}` +
          ` [label ${okLabel ? 'ok' : 'X'}, start ${okStart ? 'ok' : 'X'}, end ${okEnd ? 'ok' : 'X'}]`
      )
    }
  }
}
console.log(`\nTOTAL: ${pass} PASS / ${fail} FAIL`)
process.exit(0)
