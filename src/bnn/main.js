// main.js — भृगु नंदी नाड़ी (BNN) चार्ट page, served at /bnn/.
// Phase 1: page shell + the same birth-details form as the Kundli page
// (shared modules only — geocode / prefill / birthvalidate / timeutil / i18n).
// The BNN maths live in the sibling modules:
//   kp.js (Ph 2) · prsss.js (Ph 3) · combos.js (Ph 4) · percent.js +
//   special.js (Ph 5) · dasha.js (Ph 6) · transit.js (Ph 7) · render.js (2b).
// On submit: KP New bhava chalit → the Lagna chart with the north/south toggle.
// Spec: docs/bnn-guide.txt.
import '../style.css'
import { t, getLang, setLang, months, NAKSHATRAS, TITHIS, YOGAS } from '../i18n.js'
import { searchPlace } from '../geocode.js'
import { parseBirthParams } from '../prefill.js'
import { validateBirth } from '../birthvalidate.js'
import { wallTimeToUtc } from '../timeutil.js'
import { initEphemeris } from '../astro.js'
import { computeBhavaChalit, findExchanges } from './kp.js'
import { computeDashaTree, fmtDMY } from './dasha.js'
import { computeTransitSnapshot } from './transit.js'
import { buildPrintSheet } from './print.js'
import { buildAllChartSvg, downloadAllChartPng } from './allchart.js'
import { ageYMD, buildBhavaTables, buildBnnChart, buildDashaTables, buildPlanetTables, exchangeLabel, planetCode, weekdayEN } from './render.js'
import { mybapujiStripHTML } from '../mybapuji-strip.js'

// Where the public source code lives (same repo as the other pages).
const SOURCE_URL = 'https://github.com/vasant22/kundli'

const app = document.querySelector('#app')

// ---------------------------------------------------------------------------
// Page shell — header + form + output area. The form markup is intentionally
// the same as the Kundli page (same ids, same shared validation/search).
// ---------------------------------------------------------------------------
app.innerHTML = mybapujiStripHTML() + `
  <div class="wrap">
    <header class="site-header">
      <div>
        <h1 data-i18n="bnn.title"></h1>
        <p class="sub" data-i18n="bnn.subtitle"></p>
        <p class="free-badge" data-i18n="bnn.badge"></p>
        <nav class="site-nav">
          <a href="../" data-i18n="nav.home"></a>
          <a href="../match/" data-i18n="nav.match"></a>
          <a href="../panchang/" data-i18n="nav.panchang"></a>
          <a href="./" class="active" data-i18n="nav.bnn"></a>
        </nav>
      </div>
      <button id="lang-toggle" class="lang-toggle" type="button"></button>
    </header>

    <main>
      <section class="card bnn-intro-card">
        <p class="note" data-i18n="bnn.intro"></p>
      </section>

      <form id="bnn-form" class="card" novalidate>
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

        <button class="primary" type="submit" id="bnn-btn" data-i18n="bnn.btn"></button>
      </form>

      <section id="bnn-output" aria-live="polite" hidden></section>
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
// Elements & small state
// ---------------------------------------------------------------------------
const form = document.querySelector('#bnn-form')
const output = document.querySelector('#bnn-output')
const langToggle = document.querySelector('#lang-toggle')
const searchBtn = document.querySelector('#search-btn')
const searchNote = document.querySelector('#search-note')
const placeInput = document.querySelector('#f-place')
const resultsBox = document.querySelector('#results')
const placeConfirm = document.querySelector('#place-confirm')
const manualBox = document.querySelector('#manual-box')

let lastValues = null // last successfully validated form values
let lastErrors = {} // last validation errors (re-rendered on language switch)
let selectedPlace = null // picked search result: {name, admin1, country, latitude, longitude, timezone}
let lastResults = [] // current search results
let lastNoteKey = null // key of the shown search note (for language switching)
let lastSearch = { at: 0, query: '' } // cooldown so rapid repeats don't hit the free API

const toInt = (s) => (s === '' ? NaN : Number(s))

// ---------------------------------------------------------------------------
// Helpers (same rules as the Kundli page)
// ---------------------------------------------------------------------------
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
let sweRef = null // the loaded instance (used by the transit re-compute)
function ensureEphemeris() {
  if (!swePromise) {
    swePromise = initEphemeris().then((swe) => {
      sweRef = swe
      return swe
    })
  }
  return swePromise
}

// Current wall-clock components in a zone (IANA name or "+05:30").
function nowWallInZone(zone) {
  const now = new Date()
  if (/^[+-]\d{2}:\d{2}$/.test(zone)) {
    const sign = zone[0] === '-' ? -1 : 1
    const [hh, mm] = zone.slice(1).split(':').map(Number)
    const shifted = new Date(now.getTime() + sign * (hh * 60 + mm) * 60000)
    return {
      year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate(),
      hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes(), second: shifted.getUTCSeconds(),
    }
  }
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(now)
    const g = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0)
    return { year: g('year'), month: g('month'), day: g('day'), hour: g('hour') % 24, minute: g('minute'), second: g('second') }
  } catch {
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() }
  }
}

const fmtInputValue = (w) =>
  `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}T${String(w.hour).padStart(2, '0')}:${String(w.minute).padStart(2, '0')}`

// Latitude/longitude for the chart (manual fields win — same as validation).
function resolveCoordinates(values) {
  const manualUsed = values.manual.lat !== '' && values.manual.lon !== '' && values.manual.tz !== ''
  if (manualUsed) {
    return { latitude: Number(values.manual.lat), longitude: Number(values.manual.lon) }
  }
  if (values.selectedPlace) {
    return { latitude: values.selectedPlace.latitude, longitude: values.selectedPlace.longitude }
  }
  return null
}

// ---------------------------------------------------------------------------
// Language (Hindi default ⇄ English)
// ---------------------------------------------------------------------------
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

function updateMonthLabels() {
  const names = months()
  document.querySelectorAll('#f-month label span').forEach((span, i) => {
    span.textContent = names[i]
  })
}

function applyLanguage() {
  document.documentElement.lang = getLang()
  document.title = t('bnn.docTitle')

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
  if (Object.keys(lastErrors).length > 0) showErrors(lastErrors)
  if (lastValues && lastValues.bnn) showReport(lastValues, false)
}

// ---------------------------------------------------------------------------
// Read the form (the shared validation rules live in src/birthvalidate.js —
// one copy used by the Kundli page, /match/ and the homepage mini-widget)
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
// Report card — the Lagna (rashi) chart drawn from the KP New bhava-chalit
// data, with the north/south style toggle under it (Phase 2b).
// ---------------------------------------------------------------------------
function buildBnnMeta(values) {
  const bnn = values.bnn
  const moon = bnn.planets.find((p) => p.key === 'moon')
  const now = new Date()
  const age = ageYMD(
    { year: Number(values.year), month: Number(values.month), day: Number(values.day) },
    { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
  )
  const pad = (n) => String(n).padStart(2, '0')
  const gender = values.gender ? ` ${values.gender.toUpperCase()}` : ''

  // Running dhasa / bhukthi lines (Phase 6 — same as the old face's centre).
  let dashaText = ''
  let bhuktiText = ''
  const d = values.bnnDasha
  if (d && d.running && d.running.mahaIndex >= 0) {
    const m = d.mahadashas[d.running.mahaIndex]
    dashaText = `${planetCode(m.lord)} DHASA: ${fmtDMY(m.startISO)} -> ${fmtDMY(m.endISO)}`
    const b = d.running.bhukthis ? d.running.bhukthis[d.running.bhukthiIndex] : null
    if (b) bhuktiText = `${planetCode(b.lord)} BHUKTI: ${fmtDMY(b.startISO)} -> ${fmtDMY(b.endISO)}`
  }

  return {
    name: values.name,
    placeText: values.selectedPlace ? displayName(values.selectedPlace) : values.place,
    dateTimeText: `${pad(Number(values.day))}-${pad(Number(values.month))}-${values.year} - ${pad(Number(values.hour))}:${pad(Number(values.minute))}:${pad(values.second === '' ? 0 : Number(values.second))}`,
    weekday: weekdayEN(Number(values.year), Number(values.month), Number(values.day)),
    ageText: `AGE : ${age.y}Y-${age.m}M-${age.d}D${gender}`,
    ageY: age.y,
    nakText: `${NAKSHATRAS[moon.nakshatra - 1].en.toUpperCase()} - ${moon.pada}`,
    tithiText: `${bnn.tithiIndex <= 15 ? 'SHUKLA' : 'KRISHNA'} - ${TITHIS[bnn.tithiIndex - 1].en.toUpperCase()}`,
    yogaText: `${YOGAS[bnn.yogaIndex - 1].en.toUpperCase()} YOGA`,
    dashaText,
    bhuktiText,
  }
}

function showReport(values, scroll) {
  output.hidden = false
  output.replaceChildren()

  const card = document.createElement('div')
  card.className = 'card summary bnn-card'

  const exchangeBox = document.createElement('div')
  exchangeBox.className = 'bnn-exchange-box'
  const pairs = findExchanges(values.bnn.planets)
  if (pairs.length > 0) {
    exchangeBox.textContent = exchangeLabel(pairs)
  } else {
    exchangeBox.hidden = true
  }

  const chartBox = document.createElement('div')
  chartBox.className = 'chart-box'

  const toggleBar = document.createElement('div')
  toggleBar.className = 'chart-toggle'
  const northBtn = document.createElement('button')
  northBtn.type = 'button'
  northBtn.textContent = t('chart.north')
  const southBtn = document.createElement('button')
  southBtn.type = 'button'
  southBtn.textContent = t('chart.south')
  toggleBar.append(northBtn, southBtn)

  const modeBar = document.createElement('div')
  modeBar.className = 'chart-toggle bnn-mode-toggle'
  const bpBtn = document.createElement('button')
  bpBtn.type = 'button'
  bpBtn.textContent = t('bnn.bp')
  const apBtn = document.createElement('button')
  apBtn.type = 'button'
  apBtn.textContent = t('bnn.ap')
  modeBar.append(bpBtn, apBtn)

  const tablesBox = document.createElement('div')
  tablesBox.className = 'bnn-tables'

  // Transit time controls (Phase 7) — default "now", computed in the chart's
  // time zone for the chart's place (the old face's transit location).
  const transitRow = document.createElement('div')
  transitRow.className = 'bnn-transit-row'
  const transitLabel = document.createElement('span')
  transitLabel.textContent = `${t('bnn.transitTime')}:`
  const transitInput = document.createElement('input')
  transitInput.type = 'datetime-local'
  transitInput.step = '60'
  transitInput.value = values.transitInput || ''
  transitInput.setAttribute('aria-label', t('bnn.transitTime'))
  const transitNow = document.createElement('button')
  transitNow.type = 'button'
  transitNow.textContent = t('bnn.transitNow')
  const transitPlace = document.createElement('span')
  transitPlace.className = 'muted'
  transitPlace.textContent = `${t('bnn.transitPlace')}: ${values.selectedPlace ? values.selectedPlace.name : values.place}`
  transitRow.append(transitLabel, transitInput, transitNow, transitPlace)

  const applyTransitInput = () => {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(transitInput.value)
    if (!m || !sweRef || !values.bnnZone || !values.bnnCoords) return
    const whenWall = { year: +m[1], month: +m[2], day: +m[3], hour: +m[4], minute: +m[5], second: 0 }
    try {
      const conv = wallTimeToUtc(whenWall, values.bnnZone)
      values.bnnTransit = computeTransitSnapshot(sweRef, conv.utc, values.bnnCoords)
      values.transitInput = transitInput.value
      paint()
    } catch (err) {
      console.error('Transit re-compute failed:', err)
    }
  }
  transitInput.addEventListener('change', applyTransitInput)
  transitNow.addEventListener('click', () => {
    transitInput.value = fmtInputValue(nowWallInZone(values.bnnZone))
    applyTransitInput()
  })

  // Actions live at the BOTTOM of the page (user request 2026-10-07b):
  // 🖨️ print/PDF (src/bnn/print.js) + 📄 All Chart PNG (src/bnn/allchart.js).
  const actionsRow = document.createElement('div')
  actionsRow.className = 'bnn-actions-row'
  const printBtn = document.createElement('button')
  printBtn.type = 'button'
  printBtn.className = 'bnn-print-btn'
  printBtn.textContent = t('bnn.print')
  const allBtn = document.createElement('button')
  allBtn.type = 'button'
  allBtn.className = 'bnn-allchart-btn'
  allBtn.textContent = t('bnn.allChart')
  actionsRow.append(printBtn, allBtn)
  printBtn.addEventListener('click', async () => {
    document.getElementById('bnn-print')?.remove()
    document.body.append(buildPrintSheet(values))
    document.body.classList.add('bnn-printing')
    const imgs = [...document.querySelectorAll('#bnn-print img')]
    await Promise.all(imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve())))
    try {
      if (typeof window.print === 'function') window.print()
    } catch {
      /* test environments */
    }
  })
  allBtn.addEventListener('click', async () => {
    try {
      await downloadAllChartPng(buildAllChartSvg(values), values.name)
    } catch (err) {
      console.error('All Chart export failed:', err)
    }
  })

  const paint = () => {
    const style = values.bnnStyle === 'north' ? 'north' : 'south'
    chartBox.replaceChildren(buildBnnChart(values.bnn, { style, meta: values.bnnMeta, transit: values.bnnTransit }))
    northBtn.classList.toggle('active', style === 'north')
    southBtn.classList.toggle('active', style === 'south')
    northBtn.setAttribute('aria-pressed', String(style === 'north'))
    southBtn.setAttribute('aria-pressed', String(style === 'south'))
  }

  const paintTables = () => {
    const mode = values.bnnMode === 'BP' ? 'BP' : 'AP'
    const sections = [
      buildBhavaTables(values.bnn, mode, {
        active: values.bnnBhavaTab,
        onTab: (k) => { values.bnnBhavaTab = k },
      }),
      buildPlanetTables(values.bnn, mode, {
        active: values.bnnPlanetTab,
        onTab: (k) => { values.bnnPlanetTab = k },
      }),
    ]
    if (values.bnnDasha) sections.push(buildDashaTables(values.bnnDasha))
    tablesBox.replaceChildren(...sections)
    if (pairs.length > 0) {
      exchangeBox.textContent = `${exchangeLabel(pairs)} — ${mode === 'AP' ? 'AFTER' : 'BEFORE'} PARIVARDHANAI (${mode})`
    }
    bpBtn.classList.toggle('active', mode === 'BP')
    apBtn.classList.toggle('active', mode === 'AP')
    bpBtn.setAttribute('aria-pressed', String(mode === 'BP'))
    apBtn.setAttribute('aria-pressed', String(mode === 'AP'))
  }

  northBtn.addEventListener('click', () => {
    values.bnnStyle = 'north'
    paint()
  })
  southBtn.addEventListener('click', () => {
    values.bnnStyle = 'south'
    paint()
  })
  bpBtn.addEventListener('click', () => {
    values.bnnMode = 'BP'
    paintTables()
  })
  apBtn.addEventListener('click', () => {
    values.bnnMode = 'AP'
    paintTables()
  })

  card.append(exchangeBox, chartBox, toggleBar, modeBar, transitRow, tablesBox, actionsRow)
  output.append(card)
  paint()
  paintTables()

  // scrollIntoView is not available in every environment (e.g. test runners)
  if (scroll && typeof output.scrollIntoView === 'function') {
    output.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// A small single-note card (calculating… / engine error).
function showNotice(text) {
  output.hidden = false
  output.replaceChildren()
  const card = document.createElement('div')
  card.className = 'card summary'
  const note = document.createElement('p')
  note.className = 'note'
  note.textContent = text
  card.append(note)
  output.append(card)
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

// ---------------------------------------------------------------------------
// Submit — validate → convert the birth time → KP New bhava chalit → draw.
// ---------------------------------------------------------------------------
async function submitForm() {
  const values = readForm()
  const errors = validateBirth(values)
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
  const coords = resolveCoordinates(values)
  lastValues = values
  showNotice(t('bnn.calculating'))

  try {
    if (!values.converted || !coords) throw new Error('birth data incomplete')
    const swe = await ensureEphemeris()
    values.bnn = computeBhavaChalit(swe, values.converted.utc, coords)
    values.bnnDasha = computeDashaTree(swe, values.bnn.jd, {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day),
    })
    // Transit (Phase 7): default "now" in the chart's zone, at the chart's place.
    values.bnnZone = resolveZone(values)
    values.bnnCoords = coords
    const nowW = nowWallInZone(values.bnnZone)
    values.transitInput = fmtInputValue(nowW)
    values.bnnTransit = computeTransitSnapshot(swe, wallTimeToUtc({ ...nowW, second: 0 }, values.bnnZone).utc, coords)
    values.bnnMeta = buildBnnMeta(values)
    values.bnnStyle = 'south'
    values.bnnMode = values.bnnMeta.ageY >= 30 ? 'AP' : 'BP' // guide: default AP when 30+
    if (lastValues === values) showReport(values, true)
  } catch (err) {
    console.error('BNN calculation failed:', err)
    swePromise = null // allow a retry on the next attempt
    if (lastValues === values) showNotice(t('bnn.calcError'))
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  submitForm()
})

// ---------------------------------------------------------------------------
// URL pre-fill — same query format as the Kundli page (one shared parser in
// src/prefill.js), so links can hand birth details to /bnn/ the same way.
// ---------------------------------------------------------------------------
function applyBirthPrefill(parsed) {
  const setVal = (id, value) => {
    if (value !== '') document.getElementById(id).value = value
  }
  setVal('f-name', parsed.name)
  if (parsed.gender) {
    const el = document.querySelector(`input[name="gender"][value="${parsed.gender}"]`)
    if (el) el.checked = true
  }
  if (parsed.month) {
    const el = document.querySelector(`input[name="month"][value="${parsed.month}"]`)
    if (el) el.checked = true
  }
  setVal('f-day', parsed.day)
  setVal('f-year', parsed.year)
  setVal('f-hour', parsed.hour)
  setVal('f-minute', parsed.minute)
  setVal('f-second', parsed.second)

  // A place arrived as a picked search result: name + coordinates + timezone.
  const lat = Number(parsed.lat)
  const lng = Number(parsed.lng)
  if (parsed.place && parsed.lat !== '' && parsed.lng !== '' && parsed.tz && Number.isFinite(lat) && Number.isFinite(lng)) {
    setVal('f-place', parsed.place)
    selectedPlace = { name: parsed.place, latitude: lat, longitude: lng, timezone: parsed.tz }
    renderConfirm()
  } else if (parsed.place) {
    setVal('f-place', parsed.place)
  }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const prefill = parseBirthParams(window.location.search)
if (prefill.lang) setLang(prefill.lang)

buildMonthChips()
applyLanguage()

if (prefill.any) {
  applyBirthPrefill(prefill)
  // Auto-run only when every required value arrived — nothing left to type.
  if (Object.keys(validateBirth(readForm())).length === 0) submitForm()
}
