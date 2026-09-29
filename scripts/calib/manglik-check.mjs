// scripts/calib/manglik-check.mjs — SCRATCH: fetch AstroSage Mangal-dosha
// details for every calibrated birth chart and parse the house placements.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const BASE = new URL('.', import.meta.url)
const births = JSON.parse(readFileSync(new URL('./births.json', BASE), 'utf8'))

const OUT = new URL('./mangal.json', BASE)
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const jar = new Map()
const cookieHeader = () => Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
function storeCookies(res) {
  const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : []
  for (const c of sc) {
    const [pair] = c.split(';')
    const i = pair.indexOf('=')
    jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim())
  }
}
async function req(url) {
  const headers = { 'User-Agent': UA, Accept: 'text/html,*/*' }
  if (jar.size) headers.Cookie = cookieHeader()
  const res = await fetch(url, { headers, redirect: 'follow' })
  storeCookies(res)
  return res
}

function htmlToText(raw) {
  let t = raw.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  t = t.replace(/<[^>]+>/g, ' ')
  t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  return t.replace(/\s+/g, ' ')
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let done = 0
for (const [label, b] of Object.entries(births)) {
  if (out[label]) continue
  if (label.startsWith('half_')) continue // half-sign probe births: mangal not needed
  const l = b.local
  const q = new URLSearchParams({
    methodName: 'createsessionOfMatchmaking', name: 'R', place: 'Varanasi', timezone: '5.5',
    sex: 'M', sec: l.sec, min: l.min, hrs: l.hrs, day: l.day, month: l.month, year: l.year,
    latdeg: 25, longdeg: 83, latmin: 19, longmin: 0, longew: 'E', latns: 'N', dst: 0,
    languagecode: 0, ayanamsa: 0, kphn: 0, charting: 0, referrer: 'manglikdetails.asp',
  })
  try {
    const res = await req('https://ascloud.astrosage.com/cloud/ChartServlet?' + q.toString())
    const txt = htmlToText(await res.text())
    const notManglik = /Person is not Manglik/.test(txt)
    const lagna = txt.match(/Mangal is placed in (?:the )?([A-Za-z]+) house from Lagna/)
    const moon = txt.match(/Moon chart Mangal is placed in (?:the )?([A-Za-z]+) house/)
    out[label] = {
      notManglik,
      lagnaHouse: lagna ? lagna[1] : null,
      moonHouse: moon ? moon[1] : null,
      raw: !lagna ? txt.slice(txt.indexOf('Mangal Dosha'), txt.indexOf('Mangal Dosha') + 420) : undefined,
    }
    writeFileSync(OUT, JSON.stringify(out, null, 1))
    done++
    console.log(`${label}: notManglik=${out[label].notManglik} lagna=${out[label].lagnaHouse} moon=${out[label].moonHouse}`)
  } catch (err) {
    console.error(`${label}: FAILED ${err.message}`)
  }
  await sleep(1500 + Math.random() * 1200)
}
console.log(`done — ${done} fetched, ${Object.keys(out).length} stored`)
