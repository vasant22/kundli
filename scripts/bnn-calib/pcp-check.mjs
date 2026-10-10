// pcp-check.mjs — Special Transit engine vs the legacy software's tables.
// All captured from the legacy software on 2026-10-07 (owner's screenshots);
// settings: Saturn Guru · 1579 · 07-01-2026 → 07-06-2031 (Mars case wider).
// The SATURN-b 159 wide case captured 2026-10-09 (same chart, 09-10-2026 →
// 09-10-2048). Dates compared in the legacy display form: date(crossing+12h)
// IST (range-clipped edges show the range date).
// Run: node scripts/bnn-calib/pcp-check.mjs
import SwissEph from 'swisseph-wasm'
import { computeRowsForPlanet, stepFor, preRollFor, midFor, leadFor } from '../../src/bnn/pcp.js'

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

const SHIFT = 12 * 3600 * 1000
const fmtIST = (ms) => {
  const d = new Date(ms + 5.5 * 3600 * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`
}
const dispIST = (ms, clipped) => fmtIST(clipped ? ms : ms + SHIFT)
const t = (y, m, d) => Date.UTC(y, m - 1, d)
const dayDiff = (a, b) => {
  const [da, ma, ya] = a.split('-').map(Number)
  const [db, mb, yb] = b.split('-').map(Number)
  return Math.abs((Date.UTC(ya, ma - 1, da) - Date.UTC(yb, mb - 1, db)) / 86400000)
}

const R = [t(2026, 1, 7), t(2031, 6, 7)] // standard range for the 2026 tests

const CASES = [
  {
    name: 'MARS (must pass)', zSign: 4, zDeg: 21.5017, leads: { jupiter: 5, saturn: 5 },
    tStart: t(2026, 10, 7), tEnd: t(2040, 1, 7),
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
    name: 'SUN', birth: 'sun', zSign: 9, zDeg: 8.164, dipX: -8.364, leads: { jupiter: 4.05, saturn: 4.05 },
    tStart: R[0], tEnd: R[1],
    expected: {
      jupiter: [['SUN-7', '11-03-2026', '16-07-2026'], ['SUN-5', '17-08-2028', '10-09-2028']],
      saturn: [['SUN-9', '21-05-2030', '29-06-2030'], ['SUN-5', '16-01-2031', '14-03-2031']],
    },
  },
  {
    name: 'VENUS', zSign: 10, zDeg: 14.2986, leads: { jupiter: 6, saturn: 6 },
    tStart: R[0], tEnd: R[1],
    expected: {
      jupiter: [
        ['VEN-5', '07-01-2026', '11-03-2026'], ['VEN-7', '07-08-2027', '09-09-2027'],
        ['VEN-5', '06-10-2029', '08-11-2029'], ['VEN-9', '14-03-2030', '15-07-2030'],
      ],
      saturn: [],
    },
  },
  {
    name: 'MOON', zSign: 11, zDeg: 12.512, leads: { jupiter: 2.44, saturn: 8.29 },
    tStart: R[0], tEnd: R[1],
    expected: {
      jupiter: [
        ['MOO-9', '20-07-2026', '05-08-2026'], ['MOO-5', '13-12-2026', '13-04-2027'],
        ['MOO-7', '14-09-2028', '30-09-2028'], ['MOO-7', '11-02-2029', '14-06-2029'],
        ['MOO-5', '08-11-2029', '14-03-2030'], ['MOO-5', '15-07-2030', '28-11-2030'],
      ],
      saturn: [
        ['MOO-1', '30-01-2026', '19-04-2026'], ['MOO-1', '27-07-2026', '11-12-2026'],
        ['MOO-1', '10-08-2027', '24-12-2027'],
      ],
    },
  },
  {
    name: 'JUPITER', zSign: 4, zDeg: 15.5, leads: { jupiter: 0.17, saturn: 5.36 },
    tStart: R[0], tEnd: R[1],
    expected: {
      jupiter: [['JUP-1', '09-09-2027', '15-09-2027']],
      saturn: [
        ['JUP-5', '02-05-2028', '29-07-2028'], ['JUP-9', '23-08-2028', '19-10-2028'],
        ['JUP-5', '06-01-2029', '05-04-2029'],
      ],
    },
  },
  {
    // Leads now come from the engine tables (jup×sat 10.7635, sat×sat 10.667);
    // Saturn dips open at X = natal + 0.7° (dipX), no +10°40′ rows.
    name: 'SATURN (1579)', birth: 'saturn', zSign: 5, zDeg: 3.2137, dipX: 0.7,
    tStart: R[0], tEnd: R[1],
    expected: {
      jupiter: [['SAT-1', '13-10-2027', '08-02-2028'], ['SAT-1', '14-05-2028', '17-08-2028']],
      saturn: [
        ['SAT-7', '07-01-2026', '30-01-2026'], ['SAT-5', '23-05-2029', '07-09-2029'],
        ['SAT-5', '19-01-2030', '21-05-2030'],
      ],
    },
  },
  {
    // 2026-10-09 owner's screens: Saturn · 159 · 09-10-2026 → 09-10-2048.
    // Matched EXACTLY (all visible rows); dates via the +12h display rule.
    name: 'SATURN-159 (2026-10-09)', birth: 'saturn', zSign: 5, zDeg: 3.2137, dipX: 0.7, exact: true,
    tStart: Date.UTC(2026, 9, 8, 18, 30, 0),
    tEnd: Date.UTC(2048, 9, 9, 18, 29, 59),
    expected: {
      jupiter: [
        ['SAT-1', '13-10-2027', '08-02-2028'], ['SAT-1', '14-05-2028', '17-08-2028'],
        ['SAT-9', '29-01-2032', '31-03-2032'], ['SAT-5', '10-06-2032', '25-07-2032'],
        ['SAT-9', '18-09-2032', '22-11-2032'], ['SAT-5', '22-07-2035', '10-09-2035'],
        ['SAT-5', '09-03-2036', '04-05-2036'], ['SAT-1', '27-09-2039', '01-12-2039'],
        ['SAT-1', '30-01-2040', '20-03-2040'],
      ],
      saturn: [
        ['SAT-5', '23-05-2029', '07-09-2029'], ['SAT-5', '19-01-2030', '21-05-2030'],
        ['SAT-1', '22-08-2038', '12-12-2038'], ['SAT-1', '09-01-2039', '08-03-2039'],
        ['SAT-1', '25-05-2039', '25-08-2039'],
      ],
    },
  },
  {
    // 2026-10-10 owner's screens: Rahu · 159 · 09-10-2026 → 09-10-2048.
    // ±1-day display tolerance (their station/noon-boundary jitter).
    name: 'RAHU (159)', birth: 'rahu', zSign: 4, zDeg: 7.167, dipX: 0.193,
    tStart: Date.UTC(2026, 9, 8, 18, 30, 0),
    tEnd: Date.UTC(2048, 9, 9, 18, 29, 59),
    expected: {
      jupiter: [
        ['RAH-1', '09-10-2026', '13-12-2026'], ['RAH-1', '13-04-2027', '07-08-2027'],
        ['RAH-9', '28-11-2030', '15-04-2031'], ['RAH-9', '16-08-2031', '27-11-2031'],
        ['RAH-5', '30-05-2034', '03-08-2034'], ['RAH-5', '17-01-2035', '10-05-2035'],
        ['RAH-1', '20-07-2038', '10-01-2039'], ['RAH-1', '18-04-2039', '21-07-2039'],
        ['RAH-9', '13-11-2042', '26-03-2043'],
      ],
      saturn: [
        ['RAH-5', '11-12-2026', '10-08-2027'], ['RAH-5', '24-12-2027', '02-05-2028'],
        ['RAH-9', '19-10-2028', '05-01-2029'], ['RAH-1', '24-07-2035', '30-11-2035'],
        ['RAH-1', '13-04-2036', '23-11-2036'], ['RAH-1', '13-12-2036', '04-02-2037'],
        ['RAH-1', '27-04-2037', '30-07-2037'], ['RAH-9', '10-01-2045', '21-03-2045'],
        ['RAH-9', '09-10-2045', '02-04-2046'],
      ],
    },
  },
  {
    // 2026-10-10 owner's screens: Ketu · 159 · 09-10-2026 → 09-10-2048.
    name: 'KETU (159)', birth: 'ketu', zSign: 10, zDeg: 7.167, dipX: 0.133,
    tStart: Date.UTC(2026, 9, 8, 18, 30, 0),
    tEnd: Date.UTC(2048, 9, 9, 18, 29, 59),
    expected: {
      jupiter: [
        ['KET-5', '14-09-2028', '10-02-2029'], ['KET-5', '14-06-2029', '06-10-2029'],
        ['KET-1', '21-12-2032', '29-04-2033'], ['KET-1', '26-06-2033', '09-09-2033'],
        ['KET-1', '23-10-2033', '19-12-2033'], ['KET-9', '28-05-2036', '14-10-2036'],
        ['KET-9', '09-02-2037', '05-06-2037'], ['KET-5', '29-08-2040', '14-03-2041'],
        ['KET-5', '18-06-2041', '20-09-2041'],
      ],
      saturn: [
        ['KET-9', '06-07-2030', '21-09-2030'], ['KET-9', '25-03-2031', '05-10-2031'],
        ['KET-9', '16-02-2032', '04-08-2032'], ['KET-5', '19-10-2032', '13-02-2033'],
        ['KET-9', '02-03-2033', '21-04-2033'], ['KET-5', '11-10-2039', '21-01-2040'],
        ['KET-5', '07-06-2040', '02-02-2041'], ['KET-5', '20-06-2041', '05-12-2041'],
        ['KET-9', '14-02-2042', '03-06-2042'],
      ],
    },
  },
  {
    // 2026-10-10 owner's screens: Mercury · 159 · 09-10-2026 → 09-10-2048.
    // (±1-day tolerance: station/noon-boundary display jitter.)
    name: 'MERCURY (159)', birth: 'mercury', zSign: 9, zDeg: 8.9899, dipX: 18.16,
    tStart: Date.UTC(2026, 9, 8, 18, 30, 0),
    tEnd: Date.UTC(2048, 9, 9, 18, 29, 59),
    expected: {
      jupiter: [
        ['MER-5', '10-09-2028', '14-09-2028'], ['MER-9', '10-02-2029', '14-06-2029'],
        ['MER-1', '17-12-2032', '21-12-2032'], ['MER-1', '09-09-2033', '23-10-2033'],
        ['MER-9', '25-05-2036', '28-05-2036'], ['MER-5', '14-10-2036', '09-02-2037'],
        ['MER-5', '25-08-2040', '29-08-2040'], ['MER-9', '14-03-2041', '18-06-2041'],
        ['MER-1', '07-04-2044', '14-04-2044'],
      ],
      saturn: [
        ['MER-9', '29-06-2030', '06-07-2030'], ['MER-5', '21-09-2030', '16-01-2031'],
        ['MER-9', '14-03-2031', '25-03-2031'], ['MER-5', '05-10-2031', '16-02-2032'],
        ['MER-5', '13-02-2033', '02-03-2033'], ['MER-5', '05-10-2039', '11-10-2039'],
        ['MER-9', '21-01-2040', '07-06-2040'], ['MER-9', '02-02-2041', '20-06-2041'],
        ['MER-9', '03-06-2042', '03-07-2042'],
      ],
    },
  },
  {
    // 2026-10-10 owner's screens: Sun · 159 · 09-10-2026 → 09-10-2048.
    name: 'SUN (159)', birth: 'sun', zSign: 9, zDeg: 8.164, dipX: -8.364,
    tStart: Date.UTC(2026, 9, 8, 18, 30, 0),
    tEnd: Date.UTC(2048, 9, 9, 18, 29, 59),
    expected: {
      jupiter: [
        ['SUN-5', '16-08-2028', '10-09-2028'], ['SUN-1', '31-03-2032', '09-06-2032'],
        ['SUN-1', '22-11-2032', '17-12-2032'], ['SUN-9', '03-05-2036', '25-05-2036'],
        ['SUN-5', '01-12-2039', '29-01-2040'], ['SUN-5', '29-07-2040', '25-08-2040'],
        ['SUN-1', '08-03-2044', '07-04-2044'], ['SUN-1', '21-07-2044', '27-07-2044'],
        ['SUN-1', '24-10-2044', '28-11-2044'],
      ],
      saturn: [
        ['SUN-9', '20-05-2030', '29-06-2030'], ['SUN-5', '16-01-2031', '14-03-2031'],
        ['SUN-5', '12-12-2038', '08-01-2039'], ['SUN-5', '25-08-2039', '05-10-2039'],
      ],
    },
  },
]

let pass = 0
let fail = 0
for (const c of CASES) {
  console.log(`\n===== ${c.name} =====`)
  for (const key of ['jupiter', 'saturn']) {
    const lonAt = makeLonAt(key)
    const mode = c.name.includes('159') ? '159' : '1579'
    const leadDeg = c.leads ? c.leads[key] : leadFor(c.birth ?? 'saturn', key)
    const rows = computeRowsForPlanet(lonAt, c.tStart, c.tEnd, c.zSign, c.zDeg, mode, {
      stepMs: stepFor(key),
      preRollMs: preRollFor(key),
      leadDeg,
      midDeg: midFor(key),
      dipX: c.dipX ?? null,
    })
    const prefix = (c.expected.jupiter[0] || c.expected.saturn[0] || ['X'])[0].split('-')[0]
    const got = rows.map((r) => ({ label: `${prefix}-${r.k}`, start: dispIST(r.startMs, r.clippedStart), end: dispIST(r.endMs, r.clippedEnd) }))
    const exp = c.expected[key] || []
    for (const w of exp) {
      const tol = c.exact ? 0 : 1
      const g = got.find((x) => x.label === w[0] && dayDiff(x.start, w[1]) <= tol && dayDiff(x.end, w[2]) <= tol)
      if (g) {
        pass++
        console.log(`   ✅ ${w[0]} ${w[1]} -> ${w[2]}`)
      } else {
        fail++
        const near = got.find((x) => x.label === w[0])
        console.log(`   ❌ ${w[0]} ${w[1]} -> ${w[2]}   (nearest: ${near ? near.start + ' -> ' + near.end : 'none'})`)
      }
    }
  }
}
console.log(`\nTOTAL: ${pass} PASS / ${fail} FAIL`)
process.exit(0)
