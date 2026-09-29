// scripts/calib/build-fixtures.mjs — builds tests/fixtures/ashtakoot-calibration.json
// from the collected AstroSage results: input Moon data + expected koota points.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const BASE = new URL('.', import.meta.url)
const births = JSON.parse(readFileSync(new URL('./births.json', BASE), 'utf8'))
const results = JSON.parse(readFileSync(new URL('./results.json', BASE), 'utf8'))

const KEEP = ['Varna', 'Vasya', 'Tara', 'Yoni', 'Maitri', 'Gana', 'Bhakoot', 'Nadi']
const KEYMAP = { Varna: 'varna', Vasya: 'vashya', Tara: 'tara', Yoni: 'yoni', Maitri: 'maitri', Gana: 'gana', Bhakoot: 'bhakoot', Nadi: 'nadi' }

const fixtures = []
for (const [tag, r] of Object.entries(results)) {
  const b = births[r.a], g = births[r.b]
  if (!b || !g) continue
  const moon = (x) => ({
    rashi: x.rashi,
    degInSign: Number((x.moonLon % 30).toFixed(4)),
    nakshatra: x.nak,
    pada: x.pada,
  })
  const expected = {}
  let ok = true
  for (const k of KEEP) {
    const v = r.rows[k]?.obtained
    if (v === undefined) { ok = false; break }
    expected[KEYMAP[k]] = v
  }
  if (!ok || r.total === undefined) continue
  expected.total = r.total
  fixtures.push({ tag, boy: moon(b), girl: moon(g), expected })
}

fixtures.sort((a, b) => a.tag.localeCompare(b.tag))
const outDir = new URL('../../tests/fixtures/', BASE)
mkdirSync(outDir, { recursive: true })
writeFileSync(new URL('ashtakoot-calibration.json', outDir), JSON.stringify(fixtures, null, 1))
console.log(`wrote ${fixtures.length} calibration fixtures`)
