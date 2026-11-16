// online.js — kundli पेज का "विस्तृत फलादेश" section (लगभग 100 KB अलग chunk).
//
// यह तभी load होता है जब जातक उस section तक scroll करे (main.js का
// IntersectionObserver, rootMargin 600px). इसलिए जो वहाँ तक नहीं जाता, उसके लिए
// एक byte भी अतिरिक्त नहीं जाता.

import './phal.css'
import { initEphemeris } from '../astro.js'
import { parseBirthParams } from '../prefill.js'
import { wallTimeToUtc } from '../timeutil.js'
import { buildPhalData } from './index.js'
import { renderOnline } from './report.js'

function readBirth(search) {
  const p = parseBirthParams(search)
  const need = ['day', 'month', 'year', 'hour', 'lat', 'lng', 'tz']
  if (need.some((k) => p[k] === '' || p[k] === undefined)) return null
  const birth = {
    year: Number(p.year), month: Number(p.month), day: Number(p.day),
    hour: Number(p.hour), minute: Number(p.minute || 0), second: Number(p.second || 0),
  }
  if (!Number.isFinite(birth.year) || birth.year < 1800 || birth.year > 2100) return null
  return { p, birth }
}

export async function mountPhalOnline(host, { search, pdfHref, name = '', hindiOnlyNote = '', hint = '' }) {
  const parsed = readBirth(search)
  if (!parsed) {
    host.innerHTML = '<p class="po-note">फलादेश के लिए जन्म-विवरण पूरा भरें।</p>'
    return
  }
  const { p, birth } = parsed
  const conversion = wallTimeToUtc(birth, p.tz)
  if (!host.isConnected) return
  const data = buildPhalData(await initEphemeris(), {
    utc: conversion.utc,
    latitude: Number(p.lat),
    longitude: Number(p.lng),
    timeZone: p.tz,
    local: birth,
    name: p.name || name,
    gender: p.gender || '',
    place: p.place || '',
  })
  if (!host.isConnected) return
  host.innerHTML = `<div class="phal">
    <div class="po-head">
      <div><h2 class="po-title">विस्तृत फलादेश</h2>
        <p class="po-sub">${hint}</p></div>
      <a class="po-pdf" href="${pdfHref}" target="_blank" rel="noopener">📄 PDF सहेजें</a>
    </div>
    ${hindiOnlyNote ? `<p class="po-note">${hindiOnlyNote}</p>` : ''}
    ${renderOnline(data)}
  </div>`
}
