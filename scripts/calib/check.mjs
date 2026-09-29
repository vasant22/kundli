// scripts/calib/check.mjs — SCRATCH calibration helper (not part of the app).
// Drives the AstroSage matchmaking POST flow for a list of birth pairs and
// records its per-koota points, so our Ashtakoot tables can be cross-checked
// against the industry-standard calculator the user will verify with.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const BASE = new URL('.', import.meta.url)
const births = JSON.parse(readFileSync(new URL('./births.json', BASE), 'utf8'))
const pairs = JSON.parse(readFileSync(new URL(process.argv[2] ?? './pairs.json', BASE), 'utf8'))
const MAX = Number(process.argv[3] ?? 0) || Infinity

const RESULTS_FILE = new URL('./results.json', BASE)
const results = existsSync(RESULTS_FILE) ? JSON.parse(readFileSync(RESULTS_FILE, 'utf8')) : {}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const jar = new Map()

function cookieHeader() {
  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}
function storeCookies(res) {
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : []
  for (const c of setCookies) {
    const [pair] = c.split(';')
    const idx = pair.indexOf('=')
    jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim())
  }
}

async function req(url, opts = {}) {
  const headers = {
    'User-Agent': UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(opts.headers ?? {}),
  }
  if (jar.size > 0) headers.Cookie = cookieHeader()
  const res = await fetch(url, { ...opts, headers, redirect: 'follow' })
  storeCookies(res)
  return res
}

function formBody(fields) {
  return new URLSearchParams(fields).toString()
}

function birthFields(person, n) {
  const l = person.local
  return {
    [`name${n}`]: n === 1 ? 'Ram' : 'Sita',
    [`sex${n}`]: n === 1 ? 'Male' : 'Female',
    [`day${n}`]: l.day, [`month${n}`]: l.month, [`year${n}`]: l.year,
    [`hrs${n}`]: l.hrs, [`min${n}`]: l.min, [`sec${n}`]: l.sec,
    [`place${n}`]: 'Varanasi',
    [`latdeg${n}`]: 25, [`latmin${n}`]: 19, [`latns${n}`]: 'N',
    [`longdeg${n}`]: 83, [`longmin${n}`]: 0, [`longew${n}`]: 'E',
    [`timezone${n}`]: '5.5', [`dst${n}`]: 0,
  }
}

function parseAutoForm(html) {
  const formMatch = html.match(/<form[^>]*id='frmpost'[^>]*>([\s\S]*?)<\/form>/i)
  if (!formMatch) return null
  const fields = {}
  const inputs = formMatch[1].match(/<input[^>]*>/gi) ?? []
  for (const input of inputs) {
    const name = input.match(/name=["']([^"']+)["']/i)
    const value = input.match(/value=["']([^"']*)["']/i)
    if (name) fields[name[1]] = value ? value[1] : ''
  }
  if (!('sex1' in fields)) return null
  const action = (html.match(/action=["']([^"']+matchmakingoutput[^"']*)["']/i) ?? [])[1]
  if (!action) return null
  return { action, fields }
}

function htmlToText(raw) {
  let txt = raw.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  txt = txt.replace(/<\/t[dh]>/gi, ' | ').replace(/<\/tr>/gi, ' #ROW# ')
  txt = txt.replace(/<[^>]+>/g, ' ')
  txt = txt.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  txt = txt.replace(/[ \t\r\n]+/g, ' ')
  return txt
}

function parseResult(html) {
  const txt = htmlToText(html)
  const out = { rows: {} }
  const total = txt.match(/Ashtakoot Matching between boy and girl is ([\d.]+)\s*\/\s*36/)
  if (total) out.total = Number(total[1])
  const mangal = txt.match(/has\s+'([^']+)'|have\s+'([^']+)'/)
  if (mangal) out.mangal = (mangal[1] || mangal[2]).trim()

  const seg = txt.slice(txt.indexOf('Guna Milan'), txt.indexOf('Horoscope Matching Results'))
  const rows = seg.split('#ROW#')
  for (const row of rows) {
    const cells = row.split('|').map((s) => s.trim()).filter((s, i, arr) => !(s === '' && (i === 0 || i === arr.length - 1)))
    if (cells.length < 5) continue
    const [koota, boy, girl, max, obtained] = cells
    if (!['Varna', 'Vasya', 'Tara', 'Yoni', 'Maitri', 'Gana', 'Bhakoot', 'Nadi'].includes(koota)) continue
    out.rows[koota] = { boy, girl, max: Number(max), obtained: Number(obtained) }
  }
  return out
}

async function runPair(pair) {
  const a = births[pair.a]
  const b = births[pair.b]
  if (!a || !b) throw new Error(`unknown birth label in ${pair.tag}`)

  // 1) Fresh session for this pair (mirrors the browser flow).
  await req('https://www.astrosage.com/freechart/matchmaking.asp')

  // 2) Submit the matchmaking form.
  const fields = { ...birthFields(a, 1), ...birthFields(b, 2), submit: 'Submit', swa: '', vfd: '1' }
  const res1 = await req('https://www.astrosage.com/freechart/confirmMatchMaking.asp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.astrosage.com/freechart/matchmaking.asp' },
    body: formBody(fields),
  })
  const html1 = await res1.text()
  const auto = parseAutoForm(html1)
  if (!auto) {
    writeFileSync(new URL(`./fail-${pair.tag}-step1.html`, BASE), html1)
    throw new Error('no auto-form in step 1 response')
  }

  // 3) Post the auto-form to the result page.
  const res2 = await req('https://ascloud.astrosage.com' + auto.action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://ascloud.astrosage.com/cloud/createsession-matchmaking.asp' },
    body: formBody(auto.fields),
  })
  const html2 = await res2.text()
  const parsed = parseResult(html2)
  if (Object.keys(parsed.rows).length < 8) {
    writeFileSync(new URL(`./fail-${pair.tag}-step2.html`, BASE), html2)
    throw new Error(`expected 8 koota rows, got ${Object.keys(parsed.rows).length} (saved fail-${pair.tag}-step2.html)`)
  }
  return parsed
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let count = 0
for (const pair of pairs) {
  if (results[pair.tag]) continue
  if (count >= MAX) break
  count++
  try {
    const parsed = await runPair(pair)
    results[pair.tag] = { ...parsed, a: pair.a, b: pair.b }
    writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2))
    const r = parsed.rows
    console.log(
      `${pair.tag}: ${parsed.total}/36 | V:${r.Varna.obtained} Va:${r.Vasya.obtained} T:${r.Tara.obtained} Y:${r.Yoni.obtained} M:${r.Maitri.obtained} G:${r.Gana.obtained} B:${r.Bhakoot.obtained} N:${r.Nadi.obtained} | ${parsed.mangal ?? ''}`
    )
  } catch (err) {
    console.error(`${pair.tag}: FAILED — ${err.message}`)
    try {
      const parsed = await runPair(pair) // one retry
      results[pair.tag] = { ...parsed, a: pair.a, b: pair.b }
      writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2))
      console.log(`${pair.tag}: (retry ok) ${parsed.total}/36`)
    } catch (err2) {
      console.error(`${pair.tag}: RETRY FAILED — ${err2.message}`)
    }
  }
  await sleep(2800 + Math.random() * 1700)
}

console.log(`done — ${count} attempted this run, ${Object.keys(results).length} total stored`)
