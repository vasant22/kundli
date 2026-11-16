// main.js — फलादेश page का entry (`/kundli-phal/`).
//
// URL के params कुंडली पेज के prefill format में ही हैं (prefill.js). सारी गणना
// browser में होती है — कोई network call नहीं, कोई tracker नहीं.
// `?print=1` आए तो report बनने और fonts/चित्र तैयार होने पर print ख़ुद खुलता है.

import './phal.css'
import { initEphemeris } from '../astro.js'
import { parseBirthParams } from '../prefill.js'
import { wallTimeToUtc } from '../timeutil.js'
import { buildPhalData } from './index.js'
import { renderReport } from './report.js'

document.body.classList.add('phal-doc')

const app = document.querySelector('#phal-app')
const report = document.querySelector('#report')
const bar = document.querySelector('#bar')
const printBtn = document.querySelector('#print-btn')
const params = new URLSearchParams(window.location.search)
const wantsPrint = params.get('print') === '1'

function message(html) {
  app.innerHTML = `<div class="msg">${html}</div>`
}

function readParams(search) {
  const p = parseBirthParams(search)
  const need = ['day', 'month', 'year', 'hour', 'lat', 'lng', 'tz']
  const missing = need.filter((k) => p[k] === '' || p[k] === undefined)
  if (missing.length) return { error: 'missing' }
  const birth = {
    year: Number(p.year), month: Number(p.month), day: Number(p.day),
    hour: Number(p.hour), minute: Number(p.minute || 0), second: Number(p.second || 0),
  }
  if (!Number.isFinite(birth.year) || birth.year < 1800 || birth.year > 2100) return { error: 'bad' }
  if (!Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng))) return { error: 'bad' }
  return { p, birth }
}

// fonts + सारे चित्र तैयार होने का इंतज़ार (वरना PDF में ख़ाली जगह आती है)
async function waitForAssets() {
  try { await document.fonts.ready } catch { /* पुराने browser */ }
  // print में lazy-चित्र नहीं चाहिए — सबको eager करके load शुरू कराएँ
  for (const img of document.images) {
    if (img.loading === 'lazy') {
      img.loading = 'eager'
      const src = img.getAttribute('src')
      img.setAttribute('src', src)
    }
  }
  const loaded = Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true })
    img.addEventListener('error', resolve, { once: true })
  }))))
  // किसी चित्र में अटकें नहीं — 5 सेकंड बाद चलें
  await Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, 5000))])
  await new Promise((resolve) => setTimeout(resolve, 150))
}

async function main() {
  const parsed = readParams(window.location.search)
  if (parsed.error) {
    message(`<h1>जन्म-विवरण नहीं मिला</h1>
      <p>यह पेज कुंडली पेज से खुलता है, जहाँ जन्म-तिथि, समय और जगह भरनी होती है।</p>
      <p><a class="btn" href="../">कुंडली पेज पर जाएँ</a></p>`)
    return
  }
  const { p, birth } = parsed
  let conversion
  try {
    conversion = wallTimeToUtc(birth, p.tz)
  } catch (err) {
    message(`<h1>समय-क्षेत्र ठीक नहीं</h1><p>${String(err?.message ?? err)}</p>
      <p><a class="btn" href="../">कुंडली पेज पर जाएँ</a></p>`)
    return
  }

  const data = buildPhalData(await initEphemeris(), {
    utc: conversion.utc,
    latitude: Number(p.lat),
    longitude: Number(p.lng),
    timeZone: p.tz,
    local: birth,
    name: p.name || '',
    gender: p.gender || '',
    place: p.place || '',
  })

  report.className = 'phal'
  report.innerHTML = renderReport(data, { lazyImages: !wantsPrint })
  const name = (p.name || '').trim() || 'जातक'
  document.title = `${name} — जन्म कुंडली फलादेश | mybapuji.com`
  document.body.classList.add('ready')
  bar.hidden = wantsPrint
  printBtn.addEventListener('click', () => window.print())

  if (wantsPrint) {
    await waitForAssets()
    window.print()
  }
}

main().catch((err) => {
  console.error(err)
  message(`<h1>फलादेश नहीं बन सका</h1><p>${String(err?.message ?? err)}</p>
    <p><a class="btn" href="../">कुंडली पेज पर जाएँ</a></p>`)
})
