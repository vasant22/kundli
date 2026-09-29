// panchang-widget.js — Phase 7: the small homepage Panchang card, embedded on
// mybapuji.com via an iframe (served at kundli.mybapuji.com/panchang-widget/).
//
// Design notes:
// - Runs on the same Swiss Ephemeris WASM core as the full site (cached by the
//   browser after first load). No geocoding calls: the fixed location comes
//   from src/widget-location.js.
// - Shows the visitor's current date in the LOCATION's timezone, refreshing
//   automatically (checked every 30 s and on tab visibility changes) — no click
//   needed, including across a real midnight.
// - Fields order: header (location + full date), Tithi, Month Amanta, Month
//   Purnimanta, Day & Samvat, Nakshatra, Yoga, Karana, and the "Today Panchang"
//   button that links to the full page.
// - url params: ?lang=en for English labels (values stay bilingual "हिंदी / English");
//   ?transparent=1 makes the page background transparent to blend with the
//   WordPress theme.

import { initEphemeris } from './astro.js'
import { computePanchang } from './panchang.js'
import { WIDGET_LOCATION } from './widget-location.js'
import {
  t, setLang, tithiLabel, nakshatraLabel, yogaLabel, karanaLabel, vaaraLabel,
  lunarMonthLabel, pakshaLabel, getLang,
} from './i18n.js'
import './fonts.css'
import './widget.css'

const FULL_PAGE_URL = 'https://kundli.mybapuji.com/panchang/'

// 'YYYY-MM-DD' for "now" in a timezone (en-CA gives the ISO-style order).
export function todayInZone(timeZone, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

function formatDateLong(isoDate, lang) {
  // format at 12:00 UTC so the calendar date cannot shift when rendered in the
  // target timezone
  const d = new Date(`${isoDate}T12:00:00Z`)
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-IN' : 'hi-IN', {
      timeZone: WIDGET_LOCATION.timeZone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(d)
  } catch {
    return isoDate
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
))

function limbText(entries, nameFn) {
  if (!entries || !entries.length) return '—'
  const lang = getLang()
  return entries.map((e, i) => {
    const end = e.fullNight ? t('panchang.fullNight') : e.endText
    // Hindi puts the particle after the time ("17:10:44 तक"), English before it
    // ("upto 17:10:44") — matching the reference layouts in both languages.
    return lang === 'en'
      ? `${nameFn(e, i)} upto ${end}`
      : `${nameFn(e, i)} — ${end} तक`
  }).join(' · ')
}

/**
 * Build the widget rows (pure; uses the currently active i18n language).
 * Returns [{ label, value }, …] in the required order.
 */
export function buildWidgetRows(p) {
  const tithi = limbText(p.tithi.entries, (e) => `${tithiLabel(e.index)} (${pakshaLabel(p.tithi.paksha)})`)
  const nakshatra = limbText(p.nakshatra.entries, (e) => nakshatraLabel(e.index))
  const yoga = limbText(p.yoga.entries, (e) => yogaLabel(e.index))
  const karana = limbText(p.karana.entries, (e, i) => karanaLabel(p.karana.numbers[i]))
  const amanta = lunarMonthLabel(p.months.amanta.index, p.months.amanta.adhika)
  const purnimanta = lunarMonthLabel(p.months.purnimanta.index, p.months.purnimanta.adhika)
  const daySamvat = `${vaaraLabel(p.vaar)} · ${t('panchang.f.vikram')} ${p.samvat.vikram}`

  return [
    { label: t('panchang.f.tithi'), value: tithi },
    { label: t('panchang.f.monthAmanta'), value: amanta },
    { label: t('panchang.f.monthPurnimanta'), value: purnimanta },
    { label: t('panchang.widget.daySamvat'), value: daySamvat },
    { label: t('panchang.f.nakshatra'), value: nakshatra },
    { label: t('panchang.f.yoga'), value: yoga },
    { label: t('panchang.f.karana'), value: karana },
  ]
}

/** Render the card into `root`. `p` = computePanchang() result. */
export function renderWidget(root, p, lang = 'hi') {
  setLang(lang)
  const dateStr = formatDateLong(
    `${p.date.year}-${String(p.date.month).padStart(2, '0')}-${String(p.date.day).padStart(2, '0')}`,
    lang
  )
  const rows = buildWidgetRows(p)
  root.innerHTML = `
    <div class="pw-card" role="region" aria-label="${esc(t('panchang.widget.title'))}">
      <div class="pw-head">
        <div class="pw-title">${esc(t('panchang.widget.title'))}</div>
        <div class="pw-loc">${esc(WIDGET_LOCATION.name[lang] ?? WIDGET_LOCATION.name.hi)}</div>
        <div class="pw-date">${esc(dateStr)}</div>
      </div>
      <dl class="pw-rows">
        ${rows.map((r) => `<div class="pw-row"><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`).join('')}
      </dl>
      <a class="pw-btn" href="${FULL_PAGE_URL}">${esc(t('panchang.widget.button'))}</a>
    </div>`
}

/** Boot the widget (called from the page; kept separate for testability). */
export async function startWidget(root, { lang = 'hi', now = () => new Date() } = {}) {
  let swe
  try {
    swe = await initEphemeris()
  } catch (err) {
    console.error(err)
    setLang(lang)
    root.innerHTML = `<div class="pw-card"><p class="pw-err">${esc(t('panchang.engineError'))}</p></div>`
    return
  }
  let lastDate = null
  const refresh = () => {
    const iso = todayInZone(WIDGET_LOCATION.timeZone, now())
    if (iso === lastDate) return
    lastDate = iso
    const [y, m, d] = iso.split('-').map(Number)
    const p = computePanchang(swe, {
      year: y, month: m, day: d,
      latitude: WIDGET_LOCATION.latitude,
      longitude: WIDGET_LOCATION.longitude,
      timeZone: WIDGET_LOCATION.timeZone,
    })
    renderWidget(root, p, lang)
  }
  refresh()
  // Auto-refresh: cheap date check every 30 s + when the tab becomes visible.
  setInterval(refresh, 30 * 1000)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh()
  })
  // tiny debug handle (used by the Phase-10 midnight check)
  window.__panchangWidget = { getDate: () => lastDate, refresh: () => { lastDate = null; refresh() } }
}

// Auto-start when embedded (skipped in unit tests — no #widget root there).
if (typeof document !== 'undefined') {
  const root = document.getElementById('widget')
  if (root) {
    const params = new URLSearchParams(window.location.search)
    if (params.get('transparent') === '1') document.body.classList.add('pw-transparent')
    startWidget(root, { lang: params.get('lang') === 'en' ? 'en' : 'hi' })
  }
}
