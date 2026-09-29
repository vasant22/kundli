// scripts/calib/gen-pairs2.mjs — builds pairs-batch2.json: systematic Yoni matrix
// coverage (all ordered animal pairs, skipping ones already sampled), remaining
// Maitri lords cells, Varna probes for Aquarius/Pisces, extra Bhakoot checks.
import { readFileSync, writeFileSync } from 'node:fs'

const BASE = new URL('.', import.meta.url)
const births = JSON.parse(readFileSync(new URL('./births.json', BASE), 'utf8'))
const results = JSON.parse(readFileSync(new URL('./results.json', BASE), 'utf8'))

// animal -> representative nakshatra label
const ANIMALS = [
  ['Horse', 'nak01'], ['Elephant', 'nak02'], ['Sheep', 'nak03'], ['Serpent', 'nak04'],
  ['Dog', 'nak06'], ['Cat', 'nak09'], ['Rat', 'nak10'], ['Cow', 'nak12'],
  ['Buffalo', 'nak13'], ['Tiger', 'nak14'], ['Deer', 'nak17'], ['Monkey', 'nak20'],
  ['Mongoose', 'nak21'], ['Lion', 'nak23'],
]

// lords -> representative birth labels (rashi lords)
const LORDS = [
  ['Sun', 'nak11'], ['Moon', 'nak08'], ['Mars', 'nak01'], ['Mercury', 'nak06'],
  ['Jupiter', 'nak19'], ['Venus', 'nak15'], ['Saturn', 'nak21'],
]

// already-sampled nak pairs (any direction)
const sampled = new Set()
for (const r of Object.values(results)) sampled.add(`${r.a}|${r.b}`)

const pairs = []
const generated = new Set()
const push = (tag, a, b) => {
  if (sampled.has(`${a}|${b}`) || generated.has(`${a}|${b}`)) return
  generated.add(`${a}|${b}`)
  pairs.push({ tag, a, b })
}

// 1) full ordered yoni matrix
for (const [an, a] of ANIMALS) {
  for (const [gn, g] of ANIMALS) {
    push(`yoni_${an}_${gn}`, a, g)
  }
}

// 2) maitri remaining: all 7x7 ordered lord combos
for (const [bl, b] of LORDS) {
  for (const [gl, g] of LORDS) {
    push(`maitri_${bl}_${gl}`, b, g)
  }
}

// 3) varna probes for Aquarius & Pisces (via Moon in those signs)
push('varna_aquarius_boy', 'nak23_kumbha', 'nak01')
push('varna_aquarius_girl', 'nak01', 'nak23_kumbha')
push('varna_pisces_boy', 'nak26', 'nak01')
push('varna_pisces_girl', 'nak01', 'nak26')

// 4) extra bhakoot: 5/9 with friend lords + another 2/12
push('bhakoot_venus_saturn', 'nak15', 'nak23_kumbha') // Tula-Kumbha 5/9 (Ve-Sa)
push('bhakoot_merc_saturn', 'nak13', 'nak21') // Kanya-Makar 5/9 (Me-Sa)
push('bhakoot_mars_jupiter', 'nak17', 'nak27') // Vrishchika-Meena 5/9 (Ma-Ju)
push('bhakoot_sun_venus', 'nak10', 'nak15') // Simha-Tula 2/12 (Sun-Ve)

writeFileSync(new URL('./pairs-batch2.json', BASE), JSON.stringify(pairs, null, 1))
console.log(`wrote ${pairs.length} pairs to pairs-batch2.json`)
const byType = {}
for (const p of pairs) {
  const k = p.tag.split('_')[0]
  byType[k] = (byType[k] ?? 0) + 1
}
console.log(byType)
