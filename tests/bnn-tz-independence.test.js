// tests/bnn-tz-independence.test.js — राउंड 65 / टास्क 06-ग (4-11-2026)
//
// computer का timezone बदलने से कुंडली **नहीं** बदलनी चाहिए। यह जाँच engine को अलग-अलग
// TZ (Asia/Kolkata · UTC · America/New_York) में अलग process में चलाकर नतीजे का hash मिलाती है।
// (Date/local-time वाली गड़बड़ियाँ ठीक यहीं पकड़ी जाती हैं।)
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENGINE = path.resolve(__dirname, '../../../bnn-kundli-windows/app/engine/bnn-engine.js')
const CHARTS = path.resolve(__dirname, '../../../bnn-kundli-windows/.openclaw-tmp/baseline-r65/charts.cjs')
const hasEngine = fs.existsSync(ENGINE) && fs.existsSync(CHARTS)

// इंजन को दिए गए TZ में चलाकर हर कुंडली के नतीजे का hash
const RUNNER = `
const path = require('node:path'), crypto = require('node:crypto')
globalThis.window = globalThis; globalThis.self = globalThis
try { Object.defineProperty(process, 'type', { value: 'renderer', configurable: true }) } catch (e) {}
if (!globalThis.location) globalThis.location = { pathname: '/' }
require(process.argv[2])
const { CHARTS } = require(process.argv[3])
;(async () => {
  const out = []
  for (const rec of CHARTS) {
    const o = await globalThis.BNNEngine.compute(rec)
    const slim = JSON.stringify([o.utc, o.offsetText, o.bnn, o.tables, o.astro, o.prsss, o.brsss, o.dasha.mahadashas, o.order])
    out.push(rec.ref + ':' + crypto.createHash('sha1').update(slim).digest('hex').slice(0, 12))
  }
  console.log(JSON.stringify(out))
})().catch((e) => { console.error(e); process.exit(1) })
`

function runInTz(tz) {
  const script = path.join(require('node:os').tmpdir(), 'bnn-tz-runner-' + process.pid + '.cjs')
  fs.writeFileSync(script, RUNNER)
  const out = execFileSync(process.execPath, [script, ENGINE, CHARTS], {
    env: { ...process.env, TZ: tz },
    encoding: 'utf8',
    timeout: 120000
  })
  return JSON.parse(out.trim())
}

describe.runIf(hasEngine)('timezone बदलने से कुंडली नहीं बदलती (25 कुंडली)', () => {
  it('Asia/Kolkata · UTC · America/New_York — तीनों में हर कुंडली का नतीजा एक जैसा', () => {
    const a = runInTz('Asia/Kolkata')
    const b = runInTz('UTC')
    const c = runInTz('America/New_York')
    expect(a.length).toBe(25)
    expect(b).toEqual(a)
    expect(c).toEqual(a)
  }, 180000)

  it('offsetText और UTC समय भी एक जैसे रहते हैं (स्थानीय समय से गणना)', () => {
    // ऊपर के hash में utc व offsetText भी शामिल हैं — इसलिए यह जाँच उन्हीं पर है।
    const a = runInTz('Pacific/Kiritimati')   // +14 (सबसे आगे)
    const b = runInTz('Pacific/Midway')       // −11 (सबसे पीछे)
    expect(a).toEqual(b)
  }, 180000)
})
