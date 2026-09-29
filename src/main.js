// main.js — Kundli app entry point: header + birth-details form.
// Coming phases: full bilingual data (6), charts (7), results page (8).
import './style.css'
import { t, getLang, setLang, months, rashiLabel, grahaLabel, nakshatraLabel, monthEn } from './i18n.js'
import { searchPlace } from './geocode.js'
import { formatUtcOffset, isValidTimeZone, parseUtcOffset, wallTimeToUtc } from './timeutil.js'
import { computeKundli, initEphemeris, navamsaKundli, computeVimshottari } from './astro.js'
import { buildNorthChart, buildSouthChart } from './charts.js'

// Where the public source code lives — confirmed/adjusted when the GitHub
// repo is created (deploy phase).
const SOURCE_URL = 'https://github.com/vasant22/kundli'

const app = document.querySelector('#app')

// ---------------------------------------------------------------------------
// App shell — header + form + output area
// ---------------------------------------------------------------------------
app.innerHTML = `
  <div class="wrap">
    <header class="site-header">
      <div>
        <h1 data-i18n="app.title"></h1>
        <p class="sub" data-i18n="app.subtitle"></p>
        <nav class="site-nav">
          <a href="./" class="active" data-i18n="nav.home"></a>
          <a href="./match/" data-i18n="nav.match"></a>
          <a href="./panchang/" data-i18n="nav.panchang"></a>
        </nav>
      </div>
      <button id="lang-toggle" class="lang-toggle" type="button"></button>
    </header>

    <main>
      <form id="kundli-form" class="card" novalidate>
        <h2 class="form-heading" data-i18n="form.heading"></h2>

        <div class="field">
          <label for="f-name" data-i18n="form.name"></label>
          <input id="f-name" type="text" autocomplete="name" data-i18n-placeholder="form.namePh" />
        </div>

        <fieldset class="field">
          <legend data-i18n="form.gender"></legend>
          <div class="radio-row">
            <label><input type="radio" name="gender" value="male" /> <span data-i18n="gender.male"></span></label>
            <label><input type="radio" name="gender" value="female" /> <span data-i18n="gender.female"></span></label>
            <label><input type="radio" name="gender" value="other" /> <span data-i18n="gender.other"></span></label>
          </div>
          <p class="err" id="err-gender" aria-live="polite"></p>
        </fieldset>

        <div class="field">
          <span class="group-label" data-i18n="form.dob"></span>
          <div class="mini">
            <span class="mini-label" data-i18n="date.month"></span>
            <div id="f-month" class="chips"></div>
          </div>
          <div class="row-2">
            <div class="mini">
              <label for="f-day" data-i18n="date.day"></label>
              <input id="f-day" type="number" inputmode="numeric" min="1" max="31" placeholder="1–31" />
            </div>
            <div class="mini">
              <label for="f-year" data-i18n="date.year"></label>
              <input id="f-year" type="number" inputmode="numeric" min="1800" max="2400" placeholder="1990" />
            </div>
          </div>
          <p class="err" id="err-date" aria-live="polite"></p>
        </div>

        <div class="field">
          <span class="group-label"><span data-i18n="form.tob"></span> <span class="muted" data-i18n="form.tobNote"></span></span>
          <div class="row-3">
            <div class="mini">
              <label for="f-hour" data-i18n="time.hour"></label>
              <input id="f-hour" type="number" inputmode="numeric" min="0" max="23" placeholder="0–23" />
            </div>
            <div class="mini">
              <label for="f-minute" data-i18n="time.minute"></label>
              <input id="f-minute" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" />
            </div>
            <div class="mini">
              <label for="f-second" data-i18n="time.second"></label>
              <input id="f-second" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" value="0" />
            </div>
          </div>
          <p class="err" id="err-time" aria-live="polite"></p>
          <div class="mini offset-mini">
            <label for="f-offset" data-i18n="time.offset"></label>
            <input id="f-offset" type="text" placeholder="+05:30" />
            <p class="note" data-i18n="time.offsetHint"></p>
          </div>
          <p class="err" id="err-offset" aria-live="polite"></p>
        </div>

        <div class="field">
          <label for="f-place" data-i18n="form.place"></label>
          <div class="search-row">
            <input id="f-place" type="text" data-i18n-placeholder="form.placePh" />
            <button id="search-btn" class="secondary" type="button" data-i18n="form.search"></button>
          </div>
          <p class="note" id="search-note" hidden></p>
          <div id="results" class="results" hidden></div>
          <p class="note ok" id="place-confirm" hidden></p>
          <p class="err" id="err-place" aria-live="polite"></p>
          <details id="manual-box" class="manual">
            <summary class="manual-summary" data-i18n="manual.summary"></summary>
            <div class="row-3 manual-row">
              <div class="mini">
                <label for="f-lat" data-i18n="manual.lat"></label>
                <input id="f-lat" type="number" step="0.0001" inputmode="decimal" placeholder="25.3176" />
              </div>
              <div class="mini">
                <label for="f-lon" data-i18n="manual.lon"></label>
                <input id="f-lon" type="number" step="0.0001" inputmode="decimal" placeholder="82.9739" />
              </div>
              <div class="mini">
                <label for="f-tz" data-i18n="manual.tz"></label>
                <input id="f-tz" type="text" placeholder="Asia/Kolkata" />
              </div>
            </div>
            <p class="note" data-i18n="manual.hint"></p>
            <p class="err" id="err-manual" aria-live="polite"></p>
          </details>
          <p class="note credit">Geocoding by <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo.com</a></p>
        </div>

        <button class="primary" type="submit" id="get-btn" data-i18n="btn.get"></button>
      </form>

      <section id="output" aria-live="polite" hidden></section>
    </main>

    <footer class="site-footer">
      <p class="note" data-i18n="footer.privacy"></p>
      <p class="note footer-credit-line">
        <span data-i18n="footer.poweredBy"></span><a href="https://www.astro.com/swisseph/" target="_blank" rel="noopener">Swiss Ephemeris</a> (Astrodienst AG) ·
        <a class="footer-source" href="${SOURCE_URL}" target="_blank" rel="noopener" data-i18n="footer.source"></a>
      </p>
    </footer>
  </div>
`

// ---------------------------------------------------------------------------
// Element references & small state
// ---------------------------------------------------------------------------
const form = document.querySelector('#kundli-form')
const output = document.querySelector('#output')
const langToggle = document.querySelector('#lang-toggle')
const searchBtn = document.querySelector('#search-btn')
const searchNote = document.querySelector('#search-note')
const placeInput = document.querySelector('#f-place')
const resultsBox = document.querySelector('#results')
const placeConfirm = document.querySelector('#place-confirm')
const manualBox = document.querySelector('#manual-box')

let lastValues = null // last successfully validated form values
let lastErrors = {} // last validation errors (to re-render on language switch)
let selectedPlace = null // place picked from search results: {name, admin1, country, latitude, longitude, timezone}
let lastResults = [] // current search results (array of places)
let lastNoteKey = null // key of the currently shown search note (for language switching)
let lastSearch = { at: 0, query: '' } // tiny cooldown so rapid repeats don't hit the free API

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const toInt = (s) => (s === '' ? NaN : Number(s))

// 7.037 → "7°02'" (degrees + arcminutes within the sign)
function formatDegMin(deg) {
  let d = Math.floor(deg)
  let m = Math.floor((deg - d) * 60 + 0.5)
  if (m === 60) {
    d += 1
    m = 0
  }
  return `${d}°${String(m).padStart(2, '0')}'`
}

// 0.5498 → "0°32'59\"" (degrees + minutes + seconds within the sign)
function formatDegMinSec(deg) {
  let d = Math.floor(deg)
  let m = Math.floor((deg - d) * 60)
  let s = Math.round(((deg - d) * 60 - m) * 60)
  if (s === 60) {
    s = 0
    m += 1
  }
  if (m === 60) {
    m = 0
    d += 1
  }
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

// Where will the birth time be converted from? (override > picked place > manual tz)
function resolveZone(values) {
  if (values.offset !== '') return values.offset
  if (values.selectedPlace && values.selectedPlace.timezone) return values.selectedPlace.timezone
  if (values.manual.tz !== '') return values.manual.tz
  return null
}

// Local birth time → UTC + the offset that was applied (null if impossible).
function computeConversion(values) {
  const zone = resolveZone(values)
  if (!zone) return null
  try {
    const birth = {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day),
      hour: Number(values.hour),
      minute: Number(values.minute),
      second: values.second === '' ? 0 : Number(values.second),
    }
    return { zone, ...wallTimeToUtc(birth, zone) }
  } catch (err) {
    console.error('Time conversion failed:', err)
    return null
  }
}

// The WASM ephemeris is heavy; load it once, on the first calculation.
let swePromise = null
function ensureEphemeris() {
  if (!swePromise) swePromise = initEphemeris()
  return swePromise
}

// Latitude/longitude for the chart (manual fields win — same as validation).
function resolveCoordinates(values) {
  const manualUsed =
    values.manual.lat !== '' && values.manual.lon !== '' && values.manual.tz !== ''
  if (manualUsed) {
    return { latitude: Number(values.manual.lat), longitude: Number(values.manual.lon) }
  }
  if (values.selectedPlace) {
    return { latitude: values.selectedPlace.latitude, longitude: values.selectedPlace.longitude }
  }
  return null
}

// Little info lines for the South chart's centre box (English chart text).
function chartMeta(values) {
  const pad = (n) => String(n).padStart(2, '0')
  return {
    name: values.name,
    dateText: `${Number(values.day)} ${monthEn(Number(values.month))} ${Number(values.year)}`,
    timeText: `${pad(Number(values.hour))}:${pad(Number(values.minute))}:${pad(values.second === '' ? 0 : Number(values.second))}`,
    placeText: values.selectedPlace ? values.selectedPlace.name : values.place,
  }
}

// The Bhava Chalit chart frame — planets placed in cusp-based (Placidus) houses.
function chalitChartFrame(kundli) {
  if (!kundli.chalit) return null
  return {
    ascendant: kundli.ascendant,
    planets: kundli.planets.map((p) => ({ ...p, house: kundli.chalit.houses[p.key] || p.house })),
  }
}

// Date (UTC parts) in the active language, e.g. "12 मई 2027".
function fmtDate(ms) {
  const d = new Date(ms)
  return `${d.getUTCDate()} ${t('month.' + (d.getUTCMonth() + 1))} ${d.getUTCFullYear()}`
}

// A small dasha table: [Lord, From, To, now-marker].
function dashaTable(rows, currentIdx, firstHeader) {
  const table = document.createElement('table')
  table.className = 'kundli-table dasha-table'
  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  for (const text of [firstHeader, t('dasha.from'), t('dasha.to'), '']) {
    const th = document.createElement('th')
    th.textContent = text
    headerRow.append(th)
  }
  thead.append(headerRow)
  table.append(thead)
  const tbody = document.createElement('tbody')
  rows.forEach((row, i) => {
    const tr = document.createElement('tr')
    if (i === currentIdx) tr.className = 'current'
    const cells = [grahaLabel(row.key), fmtDate(row.fromMs), fmtDate(row.toMs), i === currentIdx ? t('dasha.now') : '']
    for (const text of cells) {
      const td = document.createElement('td')
      td.textContent = text
      tr.append(td)
    }
    tbody.append(tr)
  })
  table.append(tbody)
  return table
}

// Save the current chart as a PNG (SVG → canvas → PNG download, Phase 8).
function downloadChartPng(values, onError) {
  const svg = document.querySelector('.chart-box svg')
  if (!svg) {
    if (onError) onError()
    return
  }
  const clone = svg.cloneNode(true)
  clone.setAttribute('font-family', "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif")
  const xml = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  const img = new Image()
  img.onload = () => {
    try {
      const size = 1080 // 3× for a crisp PNG
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      canvas.toBlob((blob) => {
        if (!blob) {
          if (onError) onError()
          return
        }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = values.chartStyle === 'south' ? 'kundli-south.png' : 'kundli-north.png'
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 5000)
      }, 'image/png')
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  img.onerror = () => {
    console.error('Chart PNG export failed')
    URL.revokeObjectURL(url)
    if (onError) onError()
  }
  img.src = url
}

// Plain-text version of the results (for the Copy button, Phase 8).
function buildDetailsText(values) {
  const k = values.kundli
  const meta = chartMeta(values)
  const lines = ['कुंडली / Kundli', '']
  if (values.name) lines.push(`${t('summary.name')}: ${values.name}`)
  lines.push(`${t('summary.date')}: ${meta.dateText}`)
  lines.push(`${t('summary.time')}: ${meta.timeText}`)
  lines.push(`${t('summary.place')}: ${meta.placeText}`)
  lines.push(`${t('summary.lagna')}: ${rashiLabel(k.ascendant.rashi)}`)
  lines.push(`${t('summary.ayanamsa')}: ${formatDegMin(k.ayanamsa)}`)
  lines.push('')
  k.planets.forEach((p) => {
    lines.push(
      `${grahaLabel(p.key)} — ${rashiLabel(p.rashi)} — ${formatDegMinSec(p.degInSign)} — ` +
        `${nakshatraLabel(p.nakshatra)} ${t('table.pada')} ${p.pada} — ${t('table.house')} ${p.house}` +
        (p.retro ? ` — ${t('k.retro')}` : '')
    )
  })
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Language (Hindi default ⇄ English)
// ---------------------------------------------------------------------------
// 12 month chips (a radio group) — easier to tap on phones than a dropdown.
function buildMonthChips() {
  const wrap = document.querySelector('#f-month')
  wrap.replaceChildren()
  months().forEach((name, i) => {
    const label = document.createElement('label')
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'month'
    input.value = String(i + 1)
    const span = document.createElement('span')
    span.textContent = name
    label.append(input, span)
    wrap.append(label)
  })
}

// Re-label the chips in the current language (the chosen month is kept).
function updateMonthLabels() {
  const names = months()
  document.querySelectorAll('#f-month label span').forEach((span, i) => {
    span.textContent = names[i]
  })
}

function applyLanguage() {
  document.documentElement.lang = getLang()
  document.title = t('app.docTitle')

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n)
  })
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder)
  })

  updateMonthLabels()
  langToggle.textContent = t('lang.switchTo')
  if (!searchNote.hidden && lastNoteKey) searchNote.textContent = t(lastNoteKey)
  renderConfirm()

  // Keep visible errors / summary in the current language as well.
  if (Object.keys(lastErrors).length > 0) showErrors(lastErrors)
  if (lastValues) showSummary(lastValues, false)
}

// ---------------------------------------------------------------------------
// Read + validate the form
// ---------------------------------------------------------------------------
function readForm() {
  const raw = (id) => document.getElementById(id).value.trim()
  const checkedGender = document.querySelector('input[name="gender"]:checked')
  return {
    name: raw('f-name'),
    gender: checkedGender ? checkedGender.value : '',
    day: raw('f-day'),
    month: document.querySelector('input[name="month"]:checked')?.value ?? '',
    year: raw('f-year'),
    hour: raw('f-hour'),
    minute: raw('f-minute'),
    second: raw('f-second'),
    offset: raw('f-offset'),
    place: raw('f-place'),
    selectedPlace,
    manual: { lat: raw('f-lat'), lon: raw('f-lon'), tz: raw('f-tz') },
  }
}

function validate(v) {
  const errors = {}

  if (!v.gender) errors.gender = t('err.gender')

  // Date: full date required, year 1800–2400, real calendar day.
  const d = toInt(v.day)
  const m = toInt(v.month)
  const y = toInt(v.year)
  if (v.day === '' || v.month === '' || v.year === '') {
    errors.date = t('err.dateRequired')
  } else if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) {
    errors.date = t('err.dateInvalid')
  } else if (y < 1800 || y > 2400) {
    errors.date = t('err.yearRange')
  } else if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) {
    errors.date = t('err.dateInvalid')
  }

  // Time: 24-hour clock, hour 0–23, minute 0–59; empty seconds are taken as 0.
  const h = toInt(v.hour)
  const mi = toInt(v.minute)
  const s = v.second === '' ? 0 : toInt(v.second)
  if (v.hour === '' || v.minute === '') {
    errors.time = t('err.timeRequired')
  } else if (!Number.isInteger(h) || h < 0 || h > 23) {
    errors.time = t('err.hour')
  } else if (!Number.isInteger(mi) || mi < 0 || mi > 59) {
    errors.time = t('err.minute')
  } else if (!Number.isInteger(s) || s < 0 || s > 59) {
    errors.time = t('err.second')
  }

  // Optional manual UTC offset override (e.g. +05:30).
  if (v.offset !== '' && parseUtcOffset(v.offset) === null) {
    errors.offset = t('err.offsetInvalid')
  }

  // Place: either picked from the search results, or filled in manually.
  // (If any manual field is filled, the manual values win — user was explicit.)
  const manualAny = v.manual.lat !== '' || v.manual.lon !== '' || v.manual.tz !== ''
  if (manualAny) {
    const lat = Number(v.manual.lat)
    const lon = Number(v.manual.lon)
    if (v.manual.lat === '' || v.manual.lon === '' || v.manual.tz === '') {
      errors.manual = t('err.latlonRequired')
    } else if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.manual = t('err.latRange')
    } else if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      errors.manual = t('err.lonRange')
    } else if (parseUtcOffset(v.manual.tz) === null && !isValidTimeZone(v.manual.tz)) {
      errors.manual = t('err.tzInvalid')
    }
  } else if (!v.selectedPlace) {
    errors.place = v.place === '' ? t('err.place') : t('place.errSelect')
  }

  return errors
}

function showErrors(errors) {
  document.querySelectorAll('.err').forEach((el) => {
    el.textContent = ''
  })
  document.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'))

  Object.entries(errors).forEach(([key, message]) => {
    const errEl = document.getElementById(`err-${key}`)
    if (!errEl) return
    errEl.textContent = message
    const field = errEl.closest('.field')
    if (field) field.classList.add('has-error')
  })
}

// ---------------------------------------------------------------------------
// Summary card (temporary until real results arrive in phases 5–8)
// ---------------------------------------------------------------------------
function showSummary(values, scroll) {
  const pad = (n) => String(n).padStart(2, '0')
  const dateText = `${toInt(values.day)} ${t('month.' + toInt(values.month))} ${toInt(values.year)}`
  const timeText = `${pad(toInt(values.hour))}:${pad(toInt(values.minute))}:${pad(values.second === '' ? 0 : toInt(values.second))}`

  output.hidden = false
  output.replaceChildren()

  const card = document.createElement('div')
  card.className = 'card summary'
  if (values.kundli && !values.kundli.error) {
    // Print/PDF letter-head: title + both site links inside a neat box.
    const printHead = document.createElement('div')
    printHead.className = 'print-only print-head'
    const printTitle = document.createElement('p')
    printTitle.className = 'print-title'
    printTitle.textContent = 'कुंडली / Kundli'
    const printLinks = document.createElement('p')
    printLinks.className = 'print-links'
    const siteLink = document.createElement('a')
    siteLink.href = 'https://www.mybapuji.com'
    siteLink.target = '_blank'
    siteLink.rel = 'noopener'
    siteLink.textContent = 'mybapuji.com'
    const linksSep = document.createElement('span')
    linksSep.className = 'print-links-sep'
    linksSep.textContent = '·'
    const kundliLink = document.createElement('a')
    kundliLink.href = 'https://kundli.mybapuji.com'
    kundliLink.target = '_blank'
    kundliLink.rel = 'noopener'
    kundliLink.textContent = 'kundli.mybapuji.com'
    printLinks.append(siteLink, linksSep, kundliLink)
    printHead.append(printTitle, printLinks)
    card.append(printHead)
  }

  const heading = document.createElement('h2')
  heading.className = 'summary-title'
  heading.textContent = t('summary.title')
  card.append(heading)

  const list = document.createElement('dl')
  const addRow = (label, value) => {
    const dt = document.createElement('dt')
    dt.textContent = label
    const dd = document.createElement('dd')
    dd.textContent = value
    list.append(dt, dd)
  }
  addRow(t('summary.name'), values.name || '—')
  addRow(t('summary.gender'), t(`gender.${values.gender}`))
  addRow(t('summary.date'), dateText)
  addRow(t('summary.time'), timeText)

  // UTC conversion details (Phase 4).
  const conv = values.converted
  if (conv) {
    let tzText
    if (values.offset !== '') {
      tzText = `${conv.offsetText} (${t('summary.manualOffset')})`
    } else if (parseUtcOffset(conv.zone) !== null) {
      tzText = `UTC${conv.offsetText}`
    } else {
      tzText = `${conv.zone} (UTC${conv.offsetText})`
    }
    addRow(t('summary.tz'), tzText)
    const u = conv.utc
    addRow(
      t('summary.utc'),
      `${u.day} ${t('month.' + u.month)} ${u.year}, ${pad(u.hour)}:${pad(u.minute)}:${pad(u.second)} UTC`
    )
  }

  // Location row(s): the picked place if any, plus coordinates + timezone.
  const place = values.selectedPlace
  const placeLabel = place
    ? [place.name, place.admin1, place.country].filter(Boolean).join(', ')
    : values.place
  addRow(t('summary.place'), placeLabel || '—')

  const manualUsed =
    values.manual && values.manual.lat !== '' && values.manual.lon !== '' && values.manual.tz !== ''
  if (manualUsed) {
    addRow(t('summary.coords'), `${values.manual.lat}, ${values.manual.lon} · ${values.manual.tz}`)
  } else if (place) {
    addRow(t('summary.coords'), `${place.latitude}, ${place.longitude} · ${place.timezone}`)
  }
  card.append(list)

  // The calculated chart (Phase 5): lagna, ayanamsa + a compact planet list.
  const kundli = values.kundli
  if (kundli && !kundli.error) {
    const asc = kundli.ascendant
    addRow(t('summary.lagna'), `${rashiLabel(asc.rashi)} · ${formatDegMin(asc.degInSign)}`)
    addRow(t('summary.ayanamsa'), formatDegMin(kundli.ayanamsa))

    // Charts: D1 + Navamsa (D9) side by side, plus Bhava Chalit.
    const chartWrap = document.createElement('div')
    chartWrap.className = 'chart-wrap'
    const toggleBar = document.createElement('div')
    toggleBar.className = 'chart-toggle'
    const northBtn = document.createElement('button')
    northBtn.type = 'button'
    northBtn.dataset.style = 'north'
    northBtn.textContent = t('chart.north')
    const southBtn = document.createElement('button')
    southBtn.type = 'button'
    southBtn.dataset.style = 'south'
    southBtn.textContent = t('chart.south')
    const chartGrid = document.createElement('div')
    chartGrid.className = 'chart-grid'
    const d9 = navamsaKundli(kundli)
    const chalitFrame = chalitChartFrame(kundli)
    const makeCell = (captionKey, build) => {
      const cell = document.createElement('div')
      cell.className = 'chart-cell'
      const caption = document.createElement('p')
      caption.className = 'chart-caption'
      caption.textContent = t(captionKey)
      const box = document.createElement('div')
      box.className = 'chart-box'
      box.append(build())
      cell.append(caption, box)
      return cell
    }
    const paintChart = () => {
      const south = values.chartStyle === 'south'
      chartGrid.replaceChildren()
      chartGrid.append(
        makeCell('chart.d1', () =>
          south ? buildSouthChart(kundli, chartMeta(values), { varga: 'D1' }) : buildNorthChart(kundli, { varga: 'D1' })
        ),
        makeCell('chart.d9', () =>
          south ? buildSouthChart(d9, chartMeta(values), { varga: 'D9' }) : buildNorthChart(d9, { varga: 'D9' })
        )
      )
      if (chalitFrame) {
        chartGrid.append(
          makeCell('chart.chalit', () =>
            buildNorthChart(chalitFrame, {
              houseRashis: kundli.chalit.houseSigns,
              ascMarker: false,
              varga: 'CHALIT',
            })
          )
        )
      }
      northBtn.classList.toggle('active', !south)
      southBtn.classList.toggle('active', south)
      northBtn.setAttribute('aria-pressed', String(!south))
      southBtn.setAttribute('aria-pressed', String(south))
    }
    northBtn.addEventListener('click', () => {
      values.chartStyle = 'north'
      paintChart()
    })
    southBtn.addEventListener('click', () => {
      values.chartStyle = 'south'
      paintChart()
    })
    toggleBar.append(northBtn, southBtn)
    chartWrap.append(toggleBar, chartGrid)
    card.append(chartWrap)
    paintChart()

    // Full bilingual planet table (Phase 8).
    const tableTitle = document.createElement('p')
    tableTitle.className = 'kundli-table-title'
    tableTitle.textContent = t('summary.planets')
    const tableWrap = document.createElement('div')
    tableWrap.className = 'table-wrap'
    const table = document.createElement('table')
    table.className = 'kundli-table planet-table'
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    for (const key of ['table.planet', 'table.rashi', 'table.degree', 'table.nakshatra', 'table.house', 'table.retro']) {
      const th = document.createElement('th')
      th.textContent = t(key)
      headerRow.append(th)
    }
    thead.append(headerRow)
    table.append(thead)
    const tbody = document.createElement('tbody')
    const addPlanetRow = (nameText, body) => {
      const tr = document.createElement('tr')
      const cells = [
        nameText,
        rashiLabel(body.rashi),
        formatDegMinSec(body.degInSign),
        `${nakshatraLabel(body.nakshatra)} · ${t('table.pada')} ${body.pada}`,
        String(body.house),
        body.retro ? t('k.retro') : '—',
      ]
      for (const cellText of cells) {
        const td = document.createElement('td')
        td.textContent = cellText
        tr.append(td)
      }
      return tr
    }
    tbody.append(addPlanetRow(t('table.asc'), kundli.ascendant))
    kundli.planets.forEach((p) => tbody.append(addPlanetRow(grahaLabel(p.key), p)))
    table.append(tbody)
    tableWrap.append(table)
    card.append(tableTitle, tableWrap)

    // Vimshottari Dasha (from the Moon's nakshatra).
    const moon = kundli.planets.find((p) => p.key === 'moon')
    if (moon && values.converted) {
      const u = values.converted.utc
      const birthMs = Date.UTC(u.year, u.month - 1, u.day, u.hour, u.minute, u.second)
      const dasha = computeVimshottari(moon.longitude, birthMs)
      const dashaTitle = document.createElement('p')
      dashaTitle.className = 'kundli-table-title'
      dashaTitle.textContent = t('summary.dasha')
      const dashaWrap = document.createElement('div')
      dashaWrap.className = 'table-wrap'
      dashaWrap.append(dashaTable(dasha.mahadashas, dasha.currentIdx, t('dasha.md')))
      const md = dasha.mahadashas[dasha.currentIdx]
      const ad = dasha.antardashas[dasha.currentAdIdx]
      const nowLine = document.createElement('p')
      nowLine.className = 'note dasha-now'
      nowLine.textContent = `${t('dasha.nowLine')}${grahaLabel(md.key)} ${t('dasha.md')} / ${grahaLabel(ad.key)} ${t('dasha.ad')} (${fmtDate(ad.toMs)} ${t('dasha.till')})`
      const adTitle = document.createElement('p')
      adTitle.className = 'kundli-table-title'
      adTitle.textContent = `${t('dasha.ad')} — ${grahaLabel(md.key)} ${t('dasha.md')}`
      const adWrap = document.createElement('div')
      adWrap.className = 'table-wrap'
      adWrap.append(dashaTable(dasha.antardashas, dasha.currentAdIdx, t('dasha.ad')))
      const dashaBasis = document.createElement('p')
      dashaBasis.className = 'note'
      dashaBasis.textContent = t('dasha.basis')
      card.append(dashaTitle, dashaWrap, nowLine, adTitle, adWrap, dashaBasis)
    }

    // Actions: PNG / Print / Copy details (Phase 8).
    const actions = document.createElement('div')
    actions.className = 'actions'
    const actionMsg = document.createElement('p')
    actionMsg.className = 'note'
    actionMsg.setAttribute('aria-live', 'polite')
    actionMsg.hidden = true
    const pngBtn = document.createElement('button')
    pngBtn.type = 'button'
    pngBtn.className = 'secondary'
    pngBtn.dataset.action = 'png'
    pngBtn.textContent = t('btn.downloadPng')
    pngBtn.addEventListener('click', () =>
      downloadChartPng(values, () => {
        actionMsg.textContent = t('msg.pngFailed')
        actionMsg.hidden = false
      })
    )
    const printBtn = document.createElement('button')
    printBtn.type = 'button'
    printBtn.className = 'secondary'
    printBtn.dataset.action = 'print'
    printBtn.textContent = t('btn.print')
    printBtn.addEventListener('click', () => window.print())
    const copyBtn = document.createElement('button')
    copyBtn.type = 'button'
    copyBtn.className = 'secondary'
    copyBtn.dataset.action = 'copy'
    copyBtn.textContent = t('btn.copy')
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(buildDetailsText(values))
        actionMsg.textContent = t('msg.copied')
      } catch (err) {
        console.error('Copy failed:', err)
        actionMsg.textContent = t('msg.copyFailed')
      }
      actionMsg.hidden = false
    })
    const pdfHint = document.createElement('p')
    pdfHint.className = 'note pdf-hint'
    pdfHint.textContent = t('actions.pdfHint')
    actions.append(pngBtn, printBtn, copyBtn, actionMsg, pdfHint)
    card.append(actions)
  }

  const note = document.createElement('p')
  note.className = 'note summary-note'
  if (values.kundliError) {
    note.textContent = t('summary.engineError')
  } else if (kundli && kundli.error === 'polar') {
    note.textContent = t('err.polar')
  } else if (values.kundliPending) {
    note.textContent = t('summary.calculating')
  } else {
    note.textContent = t('summary.note')
    note.classList.add('summary-note-ok') // print/PDF में यह लाइन छिपती है
  }
  card.append(note)

  output.append(card)
  // scrollIntoView is not available in every environment (e.g. test runners)
  if (scroll && typeof output.scrollIntoView === 'function') {
    output.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
langToggle.addEventListener('click', () => {
  setLang(getLang() === 'hi' ? 'en' : 'hi')
  applyLanguage()
})

function setNote(key) {
  lastNoteKey = key
  searchNote.hidden = !key
  searchNote.textContent = key ? t(key) : ''
}

function displayName(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ')
}

function renderResults() {
  resultsBox.replaceChildren()
  resultsBox.hidden = lastResults.length === 0
  lastResults.forEach((place) => {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'result-item' + (place === selectedPlace ? ' selected' : '')
    item.textContent = displayName(place)
    item.addEventListener('click', () => {
      selectedPlace = place
      setNote(null)
      renderConfirm()
      renderResults()
      resultsBox.hidden = true // hide the suggestion list once picked
    })
    resultsBox.append(item)
  })
}

function renderConfirm() {
  placeConfirm.hidden = !selectedPlace
  if (selectedPlace) {
    const p = selectedPlace
    placeConfirm.textContent =
      `✔ ${t('search.selected')}: ${displayName(p)} · ${p.latitude}, ${p.longitude} · ${p.timezone}`
  }
}

async function runSearch() {
  const query = placeInput.value.trim()
  if (!query) {
    setNote('search.enterName')
    return
  }

  // Small cooldown between identical searches — polite to the free API.
  const now = Date.now()
  if (query === lastSearch.query && now - lastSearch.at < 300) return
  lastSearch = { at: now, query }

  searchBtn.disabled = true
  setNote('search.busy')
  try {
    lastResults = await searchPlace(query, 8)
    if (lastResults.length === 0) {
      resultsBox.hidden = true
      setNote('search.none')
    } else {
      setNote(null)
      renderResults()
    }
  } catch (err) {
    console.error(err)
    resultsBox.hidden = true
    setNote('search.error')
  } finally {
    searchBtn.disabled = false
  }
}

searchBtn.addEventListener('click', runSearch)

// Enter in the place field runs the search (instead of submitting the form).
placeInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    runSearch()
  }
})

// Editing the place text invalidates a previously picked place.
placeInput.addEventListener('input', () => {
  if (selectedPlace) {
    selectedPlace = null
    renderConfirm()
  }
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const values = readForm()
  const errors = validate(values)
  lastErrors = errors
  showErrors(errors)

  if (Object.keys(errors).length > 0) {
    lastValues = null
    output.hidden = true
    if (errors.manual) manualBox.open = true // make sure the error is visible
    const firstInvalid = form.querySelector('.has-error input, .has-error select')
    if (firstInvalid) firstInvalid.focus()
    return
  }

  values.converted = computeConversion(values)
  values.kundli = null
  values.kundliPending = true
  lastValues = values
  showSummary(values, true)

  // The chart itself: loads the WASM engine on first use, then calculates.
  try {
    const swe = await ensureEphemeris()
    const coords = resolveCoordinates(values)
    if (coords && values.converted) {
      values.kundli = computeKundli(swe, {
        utc: values.converted.utc,
        ...coords,
        nodeType: 'mean',
      })
    }
  } catch (err) {
    console.error('Chart calculation failed:', err)
    swePromise = null // allow a retry on the next attempt
    values.kundliError = true
  } finally {
    values.kundliPending = false
    if (lastValues === values) showSummary(values, false)
  }
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
buildMonthChips()
applyLanguage()
