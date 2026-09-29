// scripts/calib/analyze.mjs — compares collected AstroSage results against the
// proposed Ashtakoot formulas/tables and prints any mismatches per koota.
import { readFileSync } from 'node:fs'

const BASE = new URL('.', import.meta.url)
const births = JSON.parse(readFileSync(new URL('./births.json', BASE), 'utf8'))
const results = JSON.parse(readFileSync(new URL('./results.json', BASE), 'utf8'))

// ---- proposed tables (from Saravali.de / PyJHora / calibration so far) ----

const VARNA_OF_RASHI = ['K', 'V', 'S', 'B', 'K', 'V', 'S', 'B', 'K', 'V', 'S', 'B'] // K-V-S-B rotation (calibrated)
const VASHYA_OF = (rashi, deg) => {
  if (rashi === 0 || rashi === 1) return 'C'
  if ([2, 5, 6, 10].includes(rashi)) return 'M'
  if (rashi === 3 || rashi === 11) return 'J'
  if (rashi === 4) return 'V'
  if (rashi === 7) return 'K'
  if (rashi === 8) return deg < 15 ? 'M' : 'C'
  if (rashi === 9) return deg < 15 ? 'C' : 'J'
  return '?'
}
const VASHYA = {
  C: { C: 2, M: 1, J: 1, V: 0, K: 1 },
  M: { C: 1, M: 2, J: 0.5, V: 0, K: 0 },
  J: { C: 1, M: 0.5, J: 2, V: 1, K: 1 },
  V: { C: 0.5, M: 0, J: 1, V: 2, K: 0 },
  K: { C: 1, M: 1, J: 1, V: 0, K: 2 },
}
const GANA_OF = (nak) => {
  if ([1, 5, 7, 8, 13, 15, 17, 22, 27].includes(nak)) return 'D'
  if ([2, 4, 6, 11, 12, 20, 21, 25, 26].includes(nak)) return 'M'
  return 'R'
}
const GANA = { D: { D: 6, M: 6, R: 0 }, M: { D: 5, M: 6, R: 0 }, R: { D: 1, M: 0, R: 6 } }
const YONI_OF = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1]
// provisional matrix [girl][boy] observed from calibration (filled partially)
const YONI = [
  [4, 2, 3, 2, 2, 3, 3, 1, 0, 1, 3, 3, 2, 1],
  [2, 4, 3, 3, 2, 3, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [1, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],
]
const LORD_OF = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju']
const LORDS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
const MAITRI = [
  [5, 5, 5, 4, 5, 0, 0],
  [5, 5, 4, 1, 4, 0.5, 0.5],
  [5, 4, 5, 0.5, 5, 3, 0.5],
  [4, 1, 0.5, 5, 0.5, 5, 4],
  [5, 4, 5, 0.5, 5, 0.5, 3],
  [0, 0.5, 3, 5, 0.5, 5, 5],
  [0, 0.5, 0.5, 4, 3, 5, 5],
] // [girl][boy]
const NADI_OF = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2]
const TARA_NAMES = ['Sampat', 'Janma', 'Ati Mitra', 'Mitra', 'Vadha', 'Saadhak', 'Pratyari', 'Kshema', 'Vipat']

const mod9 = (a, b) => ((b - a + 27) % 27) % 9
const d27 = (a, b) => (b - a + 27) % 27

function dina(boyNak, girlNak) {
  let pts = 0
  const bA = mod9(girlNak, boyNak) // boy's tara (from girl)
  if (![3, 5, 7].includes(bA)) pts += 1.5
  const gA = mod9(boyNak, girlNak)
  if (![3, 5, 7].includes(gA)) pts += 1.5
  return pts
}

function varnaOf(nak, rashi) {
  return VARNA_OF_RASHI[rashi]
}
const VRANK = { B: 4, K: 3, V: 2, S: 1 }

function varna(boy, girl) {
  return VRANK[VARNA_OF_RASHI[boy.rashi]] >= VRANK[VARNA_OF_RASHI[girl.rashi]] ? 1 : 0
}

function bhakoot(boy, girl) {
  const d = ((girl.rashi - boy.rashi + 12) % 12) + 1
  const dosha = [2, 5, 6, 8, 9, 12].includes(d)
  return dosha ? 0 : 7
}

// ---- compare ----

let checked = 0
const mismatches = []

function birthInfo(label) {
  const b = births[label]
  return { ...b, deg: b.moonLon % 30, rashi: b.rashi, nak: b.nak }
}

for (const [tag, r] of Object.entries(results)) {
  const boy = birthInfo(r.a)
  const girl = birthInfo(r.b)
  const rows = r.rows
  const checks = {
    Varna: varna(boy, girl),
    Vasya: VASHYA[VASHYA_OF(boy.rashi, boy.deg)][VASHYA_OF(girl.rashi, girl.deg)],
    Tara: dina(boy.nak, girl.nak),
    Yoni: YONI[YONI_OF[girl.nak - 1]][YONI_OF[boy.nak - 1]],
    Maitri: MAITRI[LORDS.indexOf(LORD_OF[girl.rashi])][LORDS.indexOf(LORD_OF[boy.rashi])],
    Gana: GANA[GANA_OF(boy.nak)][GANA_OF(girl.nak)],
    Bhakoot: bhakoot(boy, girl),
    Nadi: NADI_OF[boy.nak - 1] === NADI_OF[girl.nak - 1] ? 0 : 8,
  }
  for (const [k, v] of Object.entries(checks)) {
    checked++
    const got = rows[k]?.obtained
    if (got !== undefined && got !== v) {
      mismatches.push(`${tag} ${k}: ours=${v} astrosage=${got} (boy ${boy.nak}/${boy.rashi}, girl ${girl.nak}/${girl.rashi})`)
    }
  }
}

console.log(`checked ${checked} koota values across ${Object.keys(results).length} pairs`)
console.log(`mismatches: ${mismatches.length}`)
for (const m of mismatches.slice(0, 80)) console.log(' ', m)
