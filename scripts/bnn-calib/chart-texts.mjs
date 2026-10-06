// scripts/bnn-calib/chart-texts.mjs — fine-check the chart DISPLAY texts
// (truncated arcminutes) against the old software's outer face, and find the
// smallest house-time fine-tune that makes every cusp display identical.
// Reference face (user screenshot): 12.53 10.54 11.31 12.52 13.36 13.38 (×2).
// Run: node scripts/bnn-calib/chart-texts.mjs
import SwissEph from 'swisseph-wasm'
import { cuspText } from '../../src/bnn/render.js'

const EXPECTED = ['12.53', '10.54', '11.31', '12.52', '13.36', '13.38', '12.53', '10.54', '11.31', '12.52', '13.36', '13.38']

const swe = new SwissEph()
await swe.initSwissEph()
const jd0 = swe.julday(1980, 1, 22, 15.0)
swe.set_sid_mode(44, 0, 0)
const dtBase = swe.deltat(jd0) * 86400
console.log('sweph ΔT =', dtBase.toFixed(2), 's')

for (const extra of [0, 0.25, 0.41, 0.5, 0.75, 1.0, 1.5, 2.0]) {
  const jd = jd0 + (dtBase + extra) / 86400
  const h = swe.houses_ex(jd, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL, 21.4833, 78.25, 'P')
  const texts = []
  for (let i = 1; i <= 12; i++) {
    const lon = ((h.cusps[i] % 360) + 360) % 360
    texts.push(cuspText({ n: i, degInSign: lon % 30 }))
  }
  const ok = texts.slice(0, 6).every((t, i) => t === EXPECTED[i])
  console.log(`extra=+${extra}s → ${texts.join(' ')} ${ok ? ' ✅ matches' : ''}`)
}
process.exit(0)
