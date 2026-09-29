// scripts/calib/build-yoni.mjs — extracts the full 14x14 Yoni points matrix
// from the calibrated AstroSage results and patches src/ashtakoot.js.
import { readFileSync, writeFileSync } from 'node:fs'

const BASE = new URL('.', import.meta.url)
const births = JSON.parse(readFileSync(new URL('./births.json', BASE), 'utf8'))
const results = JSON.parse(readFileSync(new URL('./results.json', BASE), 'utf8'))
const APP = new URL('../../src/ashtakoot.js', BASE)

const YONI_OF = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1]
const N = 14

// cell data: (girl, boy) -> value
const cell = {}
const conflicts = []
for (const [tag, r] of Object.entries(results)) {
  const b = births[r.a], g = births[r.b]
  const ba = YONI_OF[b.nak - 1], ga = YONI_OF[g.nak - 1]
  const v = r.rows.Yoni?.obtained
  if (v === undefined) continue
  const key = `${ga}|${ba}`
  if (cell[key] !== undefined && cell[key] !== v) conflicts.push(`${tag}: (girl ${ga}, boy ${ba}) had ${cell[key]} now ${v}`)
  cell[key] = v
}

let missing = 0
for (let g = 0; g < N; g++) {
  for (let b = 0; b < N; b++) {
    if (cell[`${g}|${b}`] === undefined) {
      missing++
      // console.log('missing', g, b)
    }
  }
}
console.log(`cells known: ${Object.keys(cell).length}/${N * N}; missing ${missing}; conflicts ${conflicts.length}`)
for (const c of conflicts.slice(0, 10)) console.log(' conflict:', c)

// asymmetries (girl,boy) vs (boy,girl)
let asym = 0
for (let a = 0; a < N; a++) {
  for (let b = a + 1; b < N; b++) {
    const v1 = cell[`${a}|${b}`], v2 = cell[`${b}|${a}`]
    if (v1 !== undefined && v2 !== undefined && v1 !== v2) {
      asym++
      console.log(`asymmetric: girl=${a} boy=${b} -> ${v1} ; girl=${b} boy=${a} -> ${v2}`)
    }
  }
}
console.log('asymmetric cells:', asym)

if (missing > 0) {
  console.log('not patching yet — still missing cells')
  process.exit(1)
}

// build matrix [girl][boy]
const rows = []
for (let g = 0; g < N; g++) {
  const row = []
  for (let b = 0; b < N; b++) row.push(cell[`${g}|${b}`])
  rows.push(row)
}

const code = `const YONI_POINTS = [\n${rows.map((r) => '  [' + r.join(', ') + '],').join('\n')}\n]`
let src = readFileSync(APP, 'utf8')
const start = src.indexOf('const YONI_POINTS = [')
const end = src.indexOf(']', src.indexOf('[', start + 20)) // closing of outer array? careful
// safer: replace between 'const YONI_POINTS = [' and the next '\n]' after it
const endIdx = src.indexOf('\n]', start)
const replaced = src.slice(0, start) + code + src.slice(endIdx + 2)
writeFileSync(APP, replaced)
console.log('patched src/ashtakoot.js with the full calibrated Yoni matrix')
