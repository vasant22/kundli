// pcp-check.mjs — Special Transit engine vs the legacy software's tables.
// Cases captured from the legacy software on 2026-10-07 (owner's screenshots):
//  1. MARS    — Saturn Guru, 1579, 07-10-2026 → 07-01-2040   (must pass: 15 rows)
//  2. SUN     — Saturn Guru, 1579, 07-01-2026 → 07-06-2031   (informational)
//  3. VENUS   — Saturn Guru, 1579, 07-01-2026 → 07-06-2031   (informational)
// Per-planet start leads: मंगल 5° · शुक्र 6° · सूर्य 3.86° · बुध 0.15° (findings §14–15).
// Run: node scripts/bnn-calib/pcp-check.mjs
import SwissEph from 'swisseph-wasm'
import { computeRowsForPlanet, stepFor, preRollFor } from '../../src/bnn/pcp.js'

const swe = new SwissEph()
await swe.initSwissEph()
swe.set_sid_mode(44, 0, 0)
const FLAGS = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED

function makeLonAt(key) {
  const c = { jupiter: swe.SE_JUPITER, saturn: swe.SE_SATURN }[key]
  return (ms) => {
    const d = new Date(ms)
    const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
    const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour)
    const jdt = jd + swe.deltat(jd) + 0.5 / 86400
    const r = swe.calc_ut(jdt, c, FLAGS)
    return { lon: r[0], speed: r[3] }
  }
}

const fmtIST = (ms) => {
  const d = new Date(ms + 5.5 * 3600 * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`
}
const t = (y, m, d) => Date.UTC(y, m - 1, d)
const dayDiff = (a, b) => {
  const [da, ma, ya] = a.split('-').map(Number)
  const [db, mb, yb] = b.split('-').map(Number)
  return Math.abs((Date.UTC(ya, ma - 1, da) - Date.UTC(yb, mb - 1, db)) / 86400000)
}

const CASES = [
  {
    name: 'MARS (must pass)',
    zSign: 4, zDeg: 21.5017, lead: 5, tStart: t(2026, 10, 7), tEnd: t(2040, 1, 7),
    expected: {
      jupiter: [
        ['MAR-1', '15-09-2027', '13-10-2027'], ['MAR-1', '08-02-2028', '14-05-2028'],
        ['MAR-9', '03-01-2032', '29-01-2032'], ['MAR-5', '25-07-2032', '18-09-2032'],
        ['MAR-7', '30-01-2034', '25-02-2034'], ['MAR-5', '17-06-2035', '22-07-2035'],
        ['MAR-9', '10-09-2035', '14-11-2035'], ['MAR-5', '15-01-2036', '09-03-2036'],
        ['MAR-1', '31-08-2039', '27-09-2039'],
      ],
      saturn: [
        ['MAR-5', '29-07-2028', '23-08-2028'], ['MAR-5', '05-04-2029', '23-05-2029'],
        ['MAR-9', '07-09-2029', '19-01-2030'], ['MAR-1', '06-10-2037', '04-02-2038'],
        ['MAR-1', '23-06-2038', '22-08-2038'], ['MAR-1', '08-03-2039', '25-05-2039'],
      ],
    },
  },
  {
    name: 'SUN (informational)',
    zSign: 9, zDeg: 8.145, lead: 3.86, tStart: t(2026, 1, 7), tEnd: t(2031, 6, 7),
    expected: {
      jupiter: [
        ['SUN-7', '11-03-2026', '16-07-2026'], ['SUN-5', '17-08-2028', '10-09-2028'],
      ],
      saturn: [
        ['SUN-9', '21-05-2030', '29-06-2030'], ['SUN-5', '16-01-2031', '14-03-2031'],
      ],
    },
  },
  {
    name: 'VENUS (informational)',
    zSign: 10, zDeg: 14.2986, lead: 6, tStart: t(2026, 1, 7), tEnd: t(2031, 6, 7),
    expected: {
      jupiter: [
        ['VEN-5', '07-01-2026', '11-03-2026'], ['VEN-7', '07-08-2027', '09-09-2027'],
        ['VEN-5', '06-10-2029', '08-11-2029'], ['VEN-9', '14-03-2030', '15-07-2030'],
      ],
      saturn: [],
    },
  },
]

let pass = 0
let fail = 0
for (const c of CASES) {
  console.log(`\n===== ${c.name} =====`)
  for (const key of ['jupiter', 'saturn']) {
    const lonAt = makeLonAt(key)
    const rows = computeRowsForPlanet(lonAt, c.tStart, c.tEnd, c.zSign, c.zDeg, '1579', {
      stepMs: stepFor(key),
      preRollMs: preRollFor(key),
      leadDeg: c.lead,
    })
    const got = rows.map((r) => ({
      label: `${c.expected.jupiter[0] ? c.expected.jupiter[0][0].split('-')[0] : 'X'}-${r.k}`,
      start: fmtIST(r.startMs),
      end: fmtIST(r.endMs),
    }))
    const exp = c.expected[key] || []
    console.log(`-- ${key.toUpperCase()}: got ${got.length}, expected ${exp.length}`)
    for (const g of got) console.log(`   got: ${g.label}  ${g.start} -> ${g.end}`)
    for (let i = 0; i < exp.length; i++) {
      const w = exp[i]
      const g = got.find((x) => x.label === w[0] && dayDiff(x.start, w[1]) <= 1 && dayDiff(x.end, w[2]) <= 1)
      if (g) {
        pass++
        console.log(`   ✅ ${w[0]} ${w[1]} -> ${w[2]}`)
      } else {
        fail++
        const near = got.find((x) => x.label === w[0])
        console.log(`   ❌ ${w[0]} ${w[1]} -> ${w[2]}   (nearest: ${near ? near.start + ' -> ' + near.end : 'none'})`)
      }
    }
    // extra rows (informational)
    for (const g of got) {
      const m = exp.find((w) => w[0] === g.label && dayDiff(g.start, w[1]) <= 1 && dayDiff(g.end, w[2]) <= 1)
      if (!m) console.log(`   ➕ extra: ${g.label}  ${g.start} -> ${g.end}`)
    }
  }
}
console.log(`\nTOTAL: ${pass} PASS / ${fail} FAIL`)
process.exit(0)
