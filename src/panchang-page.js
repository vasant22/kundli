// panchang-page.js — Phase 8: the full standalone /panchang/ page.
//
// Sections (mirroring the reference page's content, own styling):
//   आज का पंचांग · सूर्य और चंद्र गणना · हिंदू मास और वर्ष ·
//   अशुभ समय (मुहूर्त) · शुभ समय (अभिजीत) · दिशा शूल · चंद्रबल और ताराबल ·
//   सूर्योदय पर लग्न चार्ट (उत्तर/दक्षिण/पूर्व tabs) · सूर्योदय पर ग्रह स्थिति
//
// Place search reuses geocode.js (user-triggered only). Date picker defaults to
// today at the fixed location; "पंचांग देखें" recomputes. URL params (also used
// by the automated checks): ?lang=en&date=YYYY-MM-DD&lat=..&lon=..&tz=..&place=..

import { initEphemeris } from './astro.js'
import { computePanchang, jdToUtcParts, sunriseKundli } from './panchang.js'
import { searchPlace } from './geocode.js'
import { buildNorthChart, buildSouthChart, buildEastChart } from './charts.js'
import { WIDGET_LOCATION } from './widget-location.js'
import { todayInZone } from './timeutil.js'
import {
  t, setLang, getLang, tithiLabel, nakshatraLabel, yogaLabel, karanaLabel, vaaraLabel,
  lunarMonthLabel, pakshaLabel, rituLabel, rashiLabel, grahaLabel, MUHURAT_NAMES,
} from './i18n.js'
import { mybapujiStripHTML } from './mybapuji-strip.js'
import './style.css'
import './panchang.css'

// Re-export for tests / other callers.
export { jdToUtcParts, sunriseKundli }

const SOURCE_URL = 'https://github.com/vasant22/kundli'

const pad2 = (n) => String(n).padStart(2, '0')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
))

// JD (UT) → UTC calendar parts + "HH:MM:SS" text (for the sunrise chart) —
// implementation lives in src/panchang.js (shared with the calib scripts);
// kept re-exported above for the tests.

// Degrees-minutes-seconds within the sign: 0.5498 → 0°32'59"
export function dms(deg) {
  if (!Number.isFinite(deg)) return '—'
  let d = Math.floor(deg)
  let m = Math.floor((deg - d) * 60)
  let s = Math.round((((deg - d) * 60) - m) * 60)
  if (s === 60) { s = 0; m += 1 }
  if (m === 60) { m = 0; d += 1 }
  return `${d}°${pad2(m)}'${pad2(s)}"`
}

// The kundli cast for the moment of sunrise ("Lagna Chart at Sunrise") —
// implementation lives in src/panchang.js; re-exported above.

function uptoText(e) {
  if (e.fullNight) return t('panchang.fullNight')
  return getLang() === 'en' ? `upto ${e.endText}` : `${e.endText} तक`
}

function limbHTML(entries, nameFn) {
  if (!entries || !entries.length) return '—'
  return entries
    .map((e, i) => `${esc(nameFn(e, i))} — ${esc(uptoText(e))}`)
    .join(' · ')
}

function rangeText(w) {
  return getLang() === 'en' ? `From ${w.from} To ${w.to}` : `${w.from} से ${w.to} तक`
}

const row = (label, value) =>
  `<div class="pp-row"><div class="pp-label">${esc(label)}</div><div class="pp-value">${value}</div></div>`

function card(titleKey, rowsHTML, extra = '') {
  return `<section class="card pp-card"><h2 class="pp-h2">${esc(t(titleKey))}</h2>${rowsHTML}${extra}</section>`
}

/**
 * Render all panchang sections into `out`.
 * data = { p (computePanchang result), kundli (sunrise chart | null), place, chartStyle }
 */
export function renderSections(out, data, opts = {}) {
  const { p, kundli, place } = data
  let chartStyle = opts.chartStyle || data.chartStyle || 'north'

  // 1 — Panchang For Today
  const rowsToday = [
    row(t('panchang.f.tithi'), limbHTML(p.tithi.entries, (e) => `${tithiLabel(e.index)} (${pakshaLabel(p.tithi.paksha)})`)),
    row(t('panchang.f.nakshatra'), limbHTML(p.nakshatra.entries, (e) => nakshatraLabel(e.index))),
    row(t('panchang.f.karana'), limbHTML(p.karana.entries, (e, i) => karanaLabel(p.karana.numbers[i]))),
    row(t('panchang.f.paksha'), esc(pakshaLabel(p.tithi.paksha))),
    row(t('panchang.f.yoga'), limbHTML(p.yoga.entries, (e) => yogaLabel(e.index))),
    row(t('panchang.f.vaar'), esc(vaaraLabel(p.vaar))),
  ]

  // 2 — Sun & Moon
  const rowsSunMoon = [
    row(t('panchang.f.sunrise'), esc(p.sunrise ?? t('panchang.na'))),
    row(t('panchang.f.sunset'), esc(p.sunset ?? t('panchang.na'))),
    row(t('panchang.f.moonSign'), esc(rashiLabel(p.moonSign))),
    row(t('panchang.f.moonrise'), esc(p.moonrise ?? t('panchang.na'))),
    row(t('panchang.f.moonset'), esc(p.moonset ?? t('panchang.na'))),
    row(t('panchang.f.ritu'), esc(rituLabel(p.ritu))),
  ]

  // 3 — Hindu Month & Year
  const rowsMonthYear = [
    row(t('panchang.f.shaka'), `${p.samvat.shaka} · ${esc(p.samvat.samvatsara.hi)} / ${esc(p.samvat.samvatsara.en)}`),
    row(t('panchang.f.vikram'), String(p.samvat.vikram)),
    row(t('panchang.f.kali'), String(p.samvat.kali)),
    row(t('panchang.f.pravishte'), p.pravishte ? String(p.pravishte.value) : esc(t('panchang.na'))),
    row(t('panchang.f.monthPurnimanta'), esc(lunarMonthLabel(p.months.purnimanta.index, p.months.purnimanta.adhika))),
    row(t('panchang.f.monthAmanta'), esc(lunarMonthLabel(p.months.amanta.index, p.months.amanta.adhika))),
    row(t('panchang.f.dayDuration'), esc(p.dayDuration ?? t('panchang.na'))),
  ]

  // 4 — Inauspicious timings (labels from MUHURAT_NAMES, bilingual)
  const m = p.muhurats
  const mn = (key) => `${MUHURAT_NAMES[key].hi} / ${MUHURAT_NAMES[key].en}`
  const rowsAshubha = m
    ? [
        row(mn('dushta'), esc(m.dushta.map(rangeText).join(', '))),
        row(mn('kulika'), esc(rangeText(m.kulika))),
        row(mn('kantaka'), esc(rangeText(m.kantaka))),
        row(mn('rahu'), esc(rangeText(m.rahu))),
        row(mn('kalavela'), esc(rangeText(m.kalavela))),
        row(mn('yamaghanta'), esc(rangeText(m.yamaghanta))),
        row(mn('yamaganda'), esc(rangeText(m.yamaganda))),
        row(mn('gulika'), esc(rangeText(m.gulika))),
      ]
    : [row('—', esc(t('panchang.na')))]

  // 5 — Abhijit
  const rowsShubha = m ? [row(mn('abhijit'), esc(rangeText(m.abhijit)))] : []

  // 6 — Disha Shoola
  const rowsDisha = [row(t('panchang.section.disha'), `${esc(p.extras.dishaShoola.hi)} / ${esc(p.extras.dishaShoola.en)}`)]

  // 7 — Chandra/Tara bala
  const rowsBala = [
    row(t('panchang.f.taraBala'), p.extras.taraBala.map((x) => esc(`${x.hi} / ${x.en}`)).join(', ')),
    row(t('panchang.f.chandraBala'), p.extras.chandraBala.map((x) => esc(`${x.hi} / ${x.en}`)).join(', ')),
  ]

  // 8 — Lagna chart at sunrise (tabs)
  let chartHTML = ''
  if (kundli && !kundli.error) {
    const meta = {
      dateText: `${pad2(p.date.day)} ${new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(Date.UTC(p.date.year, p.date.month - 1, p.date.day)))} ${p.date.year}`,
      timeText: p.sunrise,
      placeText: place.name,
    }
    const build = (style) => {
      if (style === 'south') return buildSouthChart(kundli, meta)
      if (style === 'east') return buildEastChart(kundli, meta)
      return buildNorthChart(kundli)
    }
    const host = document.createElement('div')
    host.className = 'pp-chart-host'
    host.id = 'pp-chart-host'
    chartHTML = `
      <div class="pp-chart-tabs" role="tablist">
        ${['north', 'south', 'east'].map((s) => `<button type="button" class="pp-tab${s === chartStyle ? ' active' : ''}" data-style="${s}">${esc(t(`panchang.chart.${s}`))}</button>`).join('')}
      </div>`
    // (chart svg appended below after innerHTML assembly)
    data.__chartResolve = { build, host }
  }

  // 9 — Planetary table (9 grahas at sunrise)
  let planetsHTML = ''
  if (kundli && !kundli.error && kundli.planets) {
    const head = `<tr><th>${esc(t('panchang.f.graha'))}</th><th>${esc(t('panchang.f.rashi'))}</th><th>${esc(t('panchang.f.degree'))}</th><th>${esc(t('panchang.f.nakshatra'))}</th><th>${esc(t('panchang.f.pada'))}</th></tr>`
    const body = kundli.planets
      .map((g) => `<tr><td>${esc(grahaLabel(g.key))}${g.retro ? ' (R)' : ''}</td><td>${esc(rashiLabel(g.rashi))}</td><td>${dms(g.degInSign)}</td><td>${esc(nakshatraLabel(g.nakshatra))}</td><td>${g.pada}</td></tr>`)
      .join('')
    planetsHTML = card('panchang.section.planets', '', `<div class="pp-table-wrap"><table class="pp-table"><thead>${head}</thead><tbody>${body}</tbody></table></div><p class="note">${esc(t('panchang.planets.modernNote'))}</p>`)
  }

  out.innerHTML = [
    card('panchang.section.today', rowsToday.join('')),
    card('panchang.section.sunMoon', rowsSunMoon.join('')),
    card('panchang.section.monthYear', rowsMonthYear.join('')),
    card('panchang.section.ashubha', rowsAshubha.join('')),
    card('panchang.section.shubha', rowsShubha.join('')),
    card('panchang.section.disha', rowsDisha.join('')),
    card('panchang.section.bala', rowsBala.join('')),
    chartHTML ? `<section class="card pp-card" id="pp-lagna-card"><h2 class="pp-h2">${esc(t('panchang.section.lagna'))}</h2>${chartHTML}</section>` : '',
    planetsHTML,
  ].join('')

  // wire the chart tabs (re-draw from the same kundli, no recalculation)
  if (data.__chartResolve) {
    const { build, host } = data.__chartResolve
    delete data.__chartResolve
    const tabHost = out.querySelector('.pp-chart-tabs')
    const mount = (style) => {
      host.replaceChildren(build(style))
      tabHost?.querySelectorAll('.pp-tab').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.style === style)
        btn.setAttribute('aria-pressed', String(btn.dataset.style === style))
      })
    }
    tabHost?.querySelectorAll('.pp-tab').forEach((btn) => {
      btn.addEventListener('click', () => mount(btn.dataset.style))
    })
    mount(chartStyle)
    out.querySelector('#pp-lagna-card')?.append(host)
  }

  return out
}

// ---------------------------------------------------------------------------
// App shell + form wiring (skipped in unit tests — no #app there)
// ---------------------------------------------------------------------------

export function bootPage() {
  const app = document.querySelector('#app')
  if (!app) return

  const params = new URLSearchParams(window.location.search)
  const lang = params.get('lang') === 'en' ? 'en' : 'hi'
  setLang(lang)

  const state = {
    place: {
      name: WIDGET_LOCATION.name.en,
      label: WIDGET_LOCATION.name,
      latitude: WIDGET_LOCATION.latitude,
      longitude: WIDGET_LOCATION.longitude,
      timezone: WIDGET_LOCATION.timeZone,
    },
    date: todayInZone(WIDGET_LOCATION.timeZone),
    swe: null,
    last: null,
  }
  if (params.get('lat') && params.get('lon') && params.get('tz')) {
    const name = params.get('place') || `${params.get('lat')}, ${params.get('lon')}`
    state.place = { name, label: { hi: name, en: name }, latitude: Number(params.get('lat')), longitude: Number(params.get('lon')), timezone: params.get('tz') }
  }
  if (params.get('date')) state.date = params.get('date')

  app.innerHTML = mybapujiStripHTML() + `
    <div class="wrap">
      <header class="site-header">
        <div>
          <h1 data-i18n="panchang.title"></h1>
          <p class="sub" data-i18n="panchang.subtitle"></p>
          <p class="free-badge" data-i18n="panchang.badge"></p>
          <nav class="site-nav">
            <a href="../" data-i18n="nav.home"></a>
            <a href="../match/" data-i18n="nav.match"></a>
            <a href="./" class="active" data-i18n="nav.panchang"></a>
          </nav>
        </div>
        <button id="lang-toggle" class="lang-toggle" type="button" data-i18n="lang.switchTo"></button>
      </header>

      <main>
        <form id="pp-form" class="card" novalidate>
          <h2 class="form-heading" data-i18n="panchang.title"></h2>
          <div class="field">
            <label for="pp-place" data-i18n="panchang.placeLabel"></label>
            <div class="search-row">
              <input id="pp-place" type="text" data-i18n-placeholder="panchang.searchPlace" autocomplete="off" />
              <button type="button" id="pp-search" class="secondary" data-i18n="form.search"></button>
            </div>
            <div id="pp-results" class="results"></div>
            <p class="muted" id="pp-selected"></p>
          </div>
          <div class="field">
            <label for="pp-date" data-i18n="panchang.dateLabel"></label>
            <input id="pp-date" type="date" />
          </div>
          <div class="actions">
            <button type="submit" id="pp-go" class="primary" data-i18n="panchang.getPanchang"></button>
          </div>
          <p class="err" id="pp-err" aria-live="polite"></p>
        </form>

        <div id="pp-out" class="results" aria-live="polite"></div>
      </main>

      <footer class="site-footer">
        <p class="note" data-i18n="footer.privacy"></p>
        <p class="note footer-credit-line">
          <span data-i18n="footer.poweredBy"></span><a href="https://www.astro.com/swisseph/" target="_blank" rel="noopener">Swiss Ephemeris</a> (Astrodienst AG) ·
          <a class="footer-source" href="${SOURCE_URL}" target="_blank" rel="noopener" data-i18n="footer.source"></a>
        </p>
      </footer>
    </div>`

  const applyStatic = () => {
    app.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n) })
    app.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder) })
  }
  applyStatic()

  const $ = (sel) => app.querySelector(sel)
  const placeInput = $('#pp-place')
  const resultsBox = $('#pp-results')
  const selectedLine = $('#pp-selected')
  const dateInput = $('#pp-date')
  const errLine = $('#pp-err')
  const goBtn = $('#pp-go')

  dateInput.value = state.date
  const showSelected = () => {
    selectedLine.textContent = `${t('search.selected')}: ${state.place.label?.[getLang()] ?? state.place.name}`
  }
  showSelected()
  $('#lang-toggle').addEventListener('click', () => {
    setLang(getLang() === 'hi' ? 'en' : 'hi')
    const btn = $('#lang-toggle')
    btn.textContent = t('lang.switchTo')
    applyStatic()
    showSelected()
    if (state.last) {
      const style = $('#pp-out').querySelector('.pp-tab.active')?.dataset.style
      renderSections($('#pp-out'), state.last, { chartStyle: style })
    }
  })

  let lastSearch = 0
  const doSearch = async () => {
    const q = placeInput.value.trim()
    errLine.textContent = ''
    if (!q) { errLine.textContent = t('search.enterName'); return }
    const now = Date.now()
    if (now - lastSearch < 800) return
    lastSearch = now
    resultsBox.innerHTML = `<p class="muted">${esc(t('search.busy'))}</p>`
    try {
      const list = await searchPlace(q)
      if (!list.length) { resultsBox.innerHTML = `<p class="muted">${esc(t('search.none'))}</p>`; return }
      resultsBox.innerHTML = ''
      list.forEach((r) => {
        const item = document.createElement('button')
        item.type = 'button'
        item.className = 'result-item'
        item.textContent = `${r.name}, ${r.admin1}, ${r.country}`
        item.addEventListener('click', () => {
          state.place = {
            name: `${r.name}, ${r.country}`,
            label: { hi: `${r.name}, ${r.country}`, en: `${r.name}, ${r.country}` },
            latitude: r.latitude, longitude: r.longitude, timezone: r.timezone,
          }
          resultsBox.innerHTML = ''
          showSelected()
          errLine.textContent = ''
        })
        resultsBox.append(item)
      })
    } catch (err) {
      console.error(err)
      resultsBox.innerHTML = `<p class="err">${esc(t('search.error'))}</p>`
    }
  }
  $('#pp-search').addEventListener('click', doSearch)
  placeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch() } })

  const computeNow = async () => {
    errLine.textContent = ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) { errLine.textContent = t('panchang.errDate'); return }
    goBtn.disabled = true
    const label = goBtn.textContent
    goBtn.textContent = t('panchang.calculating')
    try {
      if (!state.swe) state.swe = await initEphemeris()
      const [y, m, d] = dateInput.value.split('-').map(Number)
      const p = computePanchang(state.swe, {
        year: y, month: m, day: d,
        latitude: state.place.latitude,
        longitude: state.place.longitude,
        timeZone: state.place.timezone,
      })
      const out = $('#pp-out')
      if (p.note === 'polar') {
        out.innerHTML = `<p class="note">${esc(t('panchang.na'))}</p>`
        state.last = null
        return
      }
      const kundli = sunriseKundli(state.swe, p, state.place)
      state.last = { p, kundli: kundli.error ? null : kundli, place: state.place }
      renderSections(out, state.last)
    } catch (err) {
      console.error(err)
      errLine.textContent = t('panchang.engineError')
    } finally {
      goBtn.disabled = false
      goBtn.textContent = label ? t('panchang.getPanchang') : goBtn.textContent
    }
  }

  $('#pp-form').addEventListener('submit', (e) => { e.preventDefault(); computeNow() })

  // First load: compute immediately for the default place & date.
  computeNow()
}

if (typeof document !== 'undefined' && document.querySelector('#app')) bootPage()
