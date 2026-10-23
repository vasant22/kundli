// pcp-check.mjs — Special-Transit engine regression check.
// Expected rows live in ./snapshots/pcp.json — produced by THIS engine
// (`node scripts/bnn-calib/pcp-check.mjs --update`), so the file guards
// against future regressions only; it carries no external table.
// Run: node scripts/bnn-calib/pcp-check.mjs
import fs from 'node:fs'
import SwissEph from 'swisseph-wasm'
import { computeRowsForPlanet, stepFor, preRollFor, midFor, leadFor, PCP_COPEN_MIN, PCP_DEEP_A, PCP_FIRE_FLOOR, PCP_FIRE_CEIL, PCP_NO_RISE_BAND } from '../../src/bnn/pcp.js'

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
const R = [t(2026, 1, 7), t(2031, 6, 7)]

// Case metadata only — no expected values here.
const CASES = [
  { name: 'MARS', prefix: 'MAR', zSign: 4, zDeg: 21.5017, leads: { jupiter: 5, saturn: 5 }, tStart: t(2026, 10, 7), tEnd: t(2040, 1, 7) },
  { name: 'SUN', prefix: 'SUN', birth: 'sun', zSign: 9, zDeg: 8.164, dipX: -8.364, leads: { jupiter: 4.05, saturn: 4.05 }, tStart: R[0], tEnd: R[1] },
  { name: 'VENUS', prefix: 'VEN', birth: 'venus', zSign: 10, zDeg: 14.2986, dipX: 12.9, leads: { jupiter: 6.2, saturn: 6.2 }, tStart: R[0], tEnd: R[1] },
  { name: 'MOON', prefix: 'MOO', birth: 'moon', zSign: 11, zDeg: 12.512, dipX: 11.188, leads: { jupiter: 2.44, saturn: 8.29 }, tStart: R[0], tEnd: R[1] },
  { name: 'JUPITER', prefix: 'JUP', zSign: 4, zDeg: 15.5, leads: { jupiter: 0.17, saturn: 5.36 }, tStart: R[0], tEnd: R[1] },
  { name: 'SATURN-1579', prefix: 'SAT', birth: 'saturn', zSign: 5, zDeg: 3.2137, dipX: 0.7, tStart: R[0], tEnd: R[1] },
  { name: 'SATURN-159', prefix: 'SAT', birth: 'saturn', zSign: 5, zDeg: 3.2137, dipX: 0.7, mode: '159', tStart: Date.UTC(2026, 9, 8, 18, 30, 0), tEnd: Date.UTC(2048, 9, 9, 18, 29, 59) },
  { name: 'RAHU-159', prefix: 'RAH', birth: 'rahu', zSign: 4, zDeg: 7.167, dipX: 0.193, mode: '159', tStart: Date.UTC(2026, 9, 8, 18, 30, 0), tEnd: Date.UTC(2048, 9, 9, 18, 29, 59) },
  { name: 'KETU-159', prefix: 'KET', birth: 'ketu', zSign: 10, zDeg: 7.167, dipX: 0.133, mode: '159', tStart: Date.UTC(2026, 9, 8, 18, 30, 0), tEnd: Date.UTC(2048, 9, 9, 18, 29, 59) },
  { name: 'MERCURY-159', prefix: 'MER', birth: 'mercury', zSign: 9, zDeg: 8.9899, dipX: 18.16, mode: '159', tStart: Date.UTC(2026, 9, 8, 18, 30, 0), tEnd: Date.UTC(2048, 9, 9, 18, 29, 59) },
  { name: 'SUN-159', prefix: 'SUN', birth: 'sun', zSign: 9, zDeg: 8.164, dipX: -8.364, mode: '159', tStart: Date.UTC(2026, 9, 8, 18, 30, 0), tEnd: Date.UTC(2048, 9, 9, 18, 29, 59) },
  { name: 'MOON-159', prefix: 'MOO', birth: 'moon', zSign: 11, zDeg: 12.512, dipX: 11.188, mode: '159', tStart: Date.UTC(2026, 9, 8, 18, 30, 0), tEnd: Date.UTC(2048, 9, 9, 18, 29, 59) },
  { name: 'VENUS-159', prefix: 'VEN', birth: 'venus', zSign: 10, zDeg: 14.2986, dipX: 12.9, mode: '159', tStart: Date.UTC(2026, 9, 8, 18, 30, 0), tEnd: Date.UTC(2048, 9, 9, 18, 29, 59) },
]

function computeCase(c) {
  const mode = c.mode || (c.name.includes('159') ? '159' : '1579')
  const out = {}
  for (const key of ['jupiter', 'saturn']) {
    const lonAt = makeLonAt(key)
    const leadDeg = c.leads ? c.leads[key] : leadFor(c.birth ?? 'saturn', key)
    const b = c.birth ?? 'saturn'
    const rows = computeRowsForPlanet(lonAt, c.tStart, c.tEnd, c.zSign, c.zDeg, mode, {
      stepMs: stepFor(key),
      preRollMs: preRollFor(key),
      leadDeg,
      midDeg: midFor(key),
      dipX: c.dipX ?? null,
      cOpenMin: PCP_COPEN_MIN[b] != null ? PCP_COPEN_MIN[b] : null,
      deepA: PCP_DEEP_A[b] != null ? PCP_DEEP_A[b] : null,
      fireFloor: PCP_FIRE_FLOOR[b] != null ? PCP_FIRE_FLOOR[b] : null,
      fireCeil: PCP_FIRE_CEIL[b] != null ? PCP_FIRE_CEIL[b] : null,
      riseBand: PCP_NO_RISE_BAND[b] ? false : null,
    })
    out[key] = rows.map((r) => [`${c.prefix}-${r.k}`, dispIST(r.startMs, r.clippedStart), dispIST(r.endMs, r.clippedEnd)])
  }
  return out
}

const SNAP = new URL('./snapshots/pcp.json', import.meta.url)
if (process.argv.includes('--update')) {
  const data = {}
  for (const c of CASES) data[c.name] = computeCase(c)
  fs.mkdirSync(new URL('./snapshots/', import.meta.url), { recursive: true })
  fs.writeFileSync(SNAP, JSON.stringify(data, null, 1))
  console.log('snapshot लिखा —', Object.values(data).reduce((n, v) => n + v.jupiter.length + v.saturn.length, 0), 'rows')
  process.exit(0)
}

const data = JSON.parse(fs.readFileSync(SNAP, 'utf8'))
let pass = 0
let fail = 0
for (const c of CASES) {
  console.log(`\n===== ${c.name} =====`)
  const got = computeCase(c)
  for (const key of ['jupiter', 'saturn']) {
    const exp = (data[c.name] || {})[key] || []
    const g = got[key]
    for (const w of exp) {
      const hit = g.some((x) => x[0] === w[0] && x[1] === w[1] && x[2] === w[2])
      if (hit) { pass++; console.log(`   ✅ ${w[0]} ${w[1]} -> ${w[2]}`) }
      else { fail++; console.log(`   ❌ ${w[0]} ${w[1]} -> ${w[2]}`) }
    }
    for (const x of g) {
      if (!exp.some((w) => w[0] === x[0] && w[1] === x[1] && w[2] === x[2])) { fail++; console.log(`   ➕ नई पंक्ति: ${x[0]} ${x[1]} -> ${x[2]}`) }
    }
  }
}
console.log(`\nTOTAL: ${pass} PASS / ${fail} FAIL`)
process.exit(fail ? 1 : 0)
