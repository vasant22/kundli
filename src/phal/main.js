// main.js — फलादेश page का entry (`/kundli-phal/`).
//
// URL के params कुंडली पेज के prefill format में ही हैं (prefill.js). यहाँ सिर्फ़
// पढ़ना, गिनना और report बनाना है — कोई network call नहीं, कोई tracker नहीं.

import './phal.css'
import { initEphemeris } from '../astro.js'
import { parseBirthParams } from '../prefill.js'
import { wallTimeToUtc } from '../timeutil.js'
import { buildPhalData } from './index.js'
import { renderReport } from './report.js'

const app = document.querySelector('#phal-app')
const report = document.querySelector('#report')
const bar = document.querySelector('#bar')
const printBtn = document.querySelector('#print-btn')

function message(html) {
  app.innerHTML = `<div class="phal-msg">${html}</div>`
}

function readParams(search) {
  const p = parseBirthParams(search)
  const need = ['day', 'month', 'year', 'hour', 'minute', 'lat', 'lng', 'tz']
  const missing = need.filter((k) => p[k] === '' || p[k] === undefined)
  if (missing.length) return { error: 'missing' }
  const birth = {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second || 0),
  }
  if (!Number.isFinite(birth.year) || birth.year < 1800 || birth.year > 2100) return { error: 'bad' }
  if (!Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng))) return { error: 'bad' }
  return { p, birth }
}

async function main() {
  const parsed = readParams(window.location.search)
  if (parsed.error === 'missing' || parsed.error === 'bad') {
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

  report.innerHTML = renderReport(data)
  const name = (p.name || '').trim() || 'जातक'
  document.title = `${name} — जन्म कुंडली फलादेश | mybapuji.com`
  document.body.classList.add('ready')
  bar.hidden = false
  printBtn.addEventListener('click', () => window.print())
}

main().catch((err) => {
  console.error(err)
  message(`<h1>फलादेश नहीं बन सका</h1><p>${String(err?.message ?? err)}</p>
    <p><a class="btn" href="../">कुंडली पेज पर जाएँ</a></p>`)
})
