// match.js — Kundli Matching (कुंडली मिलान) page, served at /match/.
// Phase 1: page shell + site navigation (reuses site chrome + modules).
// Phase 2: two-step boy → girl form — the same validation, place search,
// time-conversion and astrology modules as the main app, parameterised per
// person.
// Phase 5: full report — Ashtakoot Guna Milan (36 points, src/ashtakoot.js) +
// Mangal Dosha check for both (src/mangaldosha.js), with PNG/Print/Copy.
import './style.css'
import { t, getLang, setLang, months, rashiLabel, nakshatraLabel } from './i18n.js'
import { searchPlace } from './geocode.js'
import { parseUtcOffset, isValidTimeZone, wallTimeToUtc } from './timeutil.js'
import { computeKundli, initEphemeris } from './astro.js'
import { computeAshtakoot } from './ashtakoot.js'
import { checkMangalDosha, mangalPairNotes } from './mangaldosha.js'
import { buildScorecardSvg } from './matchcard.js'

// Where the public source code lives (same repo as the main page).
const SOURCE_URL = 'https://github.com/vasant22/kundli'

const app = document.querySelector('#app')

// ---------------------------------------------------------------------------
// Helpers used to build the page
// ---------------------------------------------------------------------------
const toInt = (s) => (s === '' ? NaN : Number(s))

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

// The per-person birth-details fields — identical to the main app's form
// (name, date, time, place with search + manual fallback), IDs prefixed with
// 'b-' / 'g-' so both persons can live in one page. No gender field here —
// the step itself says boy / girl (as per the spec's field list).
function personFieldsHtml(p) {
  const id = (x) => `${p}-${x}`
  return `
    <div class="field">
      <label for="${id('name')}" data-i18n="form.name"></label>
      <input id="${id('name')}" type="text" autocomplete="off" data-i18n-placeholder="form.namePh" />
    </div>

    <div class="field">
      <span class="group-label" data-i18n="form.dob"></span>
      <div class="mini">
        <span class="mini-label" data-i18n="date.month"></span>
        <div id="${id('month-box')}" class="chips"></div>
      </div>
      <div class="row-2">
        <div class="mini">
          <label for="${id('day')}" data-i18n="date.day"></label>
          <input id="${id('day')}" type="number" inputmode="numeric" min="1" max="31" placeholder="1–31" />
        </div>
        <div class="mini">
          <label for="${id('year')}" data-i18n="date.year"></label>
          <input id="${id('year')}" type="number" inputmode="numeric" min="1800" max="2400" placeholder="1990" />
        </div>
      </div>
      <p class="err" id="${id('err-date')}" aria-live="polite"></p>
    </div>

    <div class="field">
      <span class="group-label"><span data-i18n="form.tob"></span> <span class="muted" data-i18n="form.tobNote"></span></span>
      <div class="row-3">
        <div class="mini">
          <label for="${id('hour')}" data-i18n="time.hour"></label>
          <input id="${id('hour')}" type="number" inputmode="numeric" min="0" max="23" placeholder="0–23" />
        </div>
        <div class="mini">
          <label for="${id('minute')}" data-i18n="time.minute"></label>
          <input id="${id('minute')}" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" />
        </div>
        <div class="mini">
          <label for="${id('second')}" data-i18n="time.second"></label>
          <input id="${id('second')}" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" value="0" />
        </div>
      </div>
      <p class="err" id="${id('err-time')}" aria-live="polite"></p>
      <div class="mini offset-mini">
        <label for="${id('offset')}" data-i18n="time.offset"></label>
        <input id="${id('offset')}" type="text" placeholder="+05:30" />
        <p class="note" data-i18n="time.offsetHint"></p>
      </div>
      <p class="err" id="${id('err-offset')}" aria-live="polite"></p>
    </div>

    <div class="field">
      <label for="${id('place')}" data-i18n="form.place"></label>
      <div class="search-row">
        <input id="${id('place')}" type="text" data-i18n-placeholder="form.placePh" />
        <button id="${id('search-btn')}" class="secondary" type="button" data-i18n="form.search"></button>
      </div>
      <p class="note" id="${id('search-note')}" hidden></p>
      <div id="${id('results')}" class="results" hidden></div>
      <p class="note ok" id="${id('place-confirm')}" hidden></p>
      <p class="err" id="${id('err-place')}" aria-live="polite"></p>
      <details id="${id('manual-box')}" class="manual">
        <summary class="manual-summary" data-i18n="manual.summary"></summary>
        <div class="row-3 manual-row">
          <div class="mini">
            <label for="${id('lat')}" data-i18n="manual.lat"></label>
            <input id="${id('lat')}" type="number" step="0.0001" inputmode="decimal" placeholder="25.3176" />
          </div>
          <div class="mini">
            <label for="${id('lon')}" data-i18n="manual.lon"></label>
            <input id="${id('lon')}" type="number" step="0.0001" inputmode="decimal" placeholder="82.9739" />
          </div>
          <div class="mini">
            <label for="${id('tz')}" data-i18n="manual.tz"></label>
            <input id="${id('tz')}" type="text" placeholder="Asia/Kolkata" />
          </div>
        </div>
        <p class="note" data-i18n="manual.hint"></p>
        <p class="err" id="${id('err-manual')}" aria-live="polite"></p>
      </details>
      <p class="note credit">Geocoding by <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo.com</a></p>
    </div>
  `
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------
app.innerHTML = `
  <div class="wrap">
    <header class="site-header">
      <div>
        <h1 data-i18n="match.title"></h1>
        <p class="sub" data-i18n="match.subtitle"></p>
        <nav class="site-nav">
          <a href="../" data-i18n="nav.home"></a>
          <a href="./" class="active" data-i18n="nav.match"></a>
        </nav>
      </div>
      <button id="lang-toggle" class="lang-toggle" type="button"></button>
    </header>

    <main>
      <section class="card match-intro-card">
        <p class="note" data-i18n="match.intro"></p>
      </section>

      <form id="match-form" class="card" novalidate>
        <section id="step-b" class="step">
          <p class="step-badge" data-i18n="match.step1"></p>
          <h2 class="form-heading" data-i18n="match.boysHeading"></h2>
          ${personFieldsHtml('b')}
          <p class="note" data-i18n="match.nextNote"></p>
          <button class="primary" type="button" id="continue-btn" data-i18n="match.continue"></button>
        </section>

        <section id="step-g" class="step" hidden>
          <p class="step-badge" data-i18n="match.step2"></p>
          <h2 class="form-heading" data-i18n="match.girlsHeading"></h2>
          ${personFieldsHtml('g')}
          <button class="back-btn" type="button" id="back-btn" data-i18n="match.back"></button>
          <button class="primary" type="button" id="report-btn" data-i18n="match.getReport"></button>
        </section>
      </form>

      <section id="match-output" aria-live="polite" hidden></section>
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
// State & element references
// ---------------------------------------------------------------------------
const output = document.querySelector('#match-output')
const langToggle = document.querySelector('#lang-toggle')
const reportBtn = document.querySelector('#report-btn')

// Per-person UI state (place search etc.) + the last validated values.
const persons = {
  b: { selectedPlace: null, lastResults: [], lastNoteKey: null, lastSearch: { at: 0, query: '' } },
  g: { selectedPlace: null, lastResults: [], lastNoteKey: null, lastSearch: { at: 0, query: '' } },
}
const lastErrors = { b: {}, g: {} }
let lastCalc = null // { vb, vg, kB, kG } after a successful "Get Match Report"

// ---------------------------------------------------------------------------
// Small shared helpers (same rules as the main app)
// ---------------------------------------------------------------------------
function formatTime(values) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(toInt(values.hour))}:${pad(toInt(values.minute))}:${pad(values.second === '' ? 0 : toInt(values.second))}`
}

function formatDate(values) {
  return `${toInt(values.day)} ${t('month.' + toInt(values.month))} ${toInt(values.year)}`
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
function buildMonthChips(p) {
  const wrap = document.getElementById(`${p}-month-box`)
  wrap.replaceChildren()
  months().forEach((name, i) => {
    const label = document.createElement('label')
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = `${p}-month`
    input.value = String(i + 1)
    const span = document.createElement('span')
    span.textContent = name
    label.append(input, span)
    wrap.append(label)
  })
}

function updateMonthLabels(p) {
  const names = months()
  document.querySelectorAll(`#${p}-month-box label span`).forEach((span, i) => {
    span.textContent = names[i]
  })
}

function applyLanguage() {
  document.documentElement.lang = getLang()
  document.title = t('match.docTitle')

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n)
  })
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder)
  })

  updateMonthLabels('b')
  updateMonthLabels('g')
  langToggle.textContent = t('lang.switchTo')

  // Live search notes, confirmations, errors and the interim report card.
  for (const p of ['b', 'g']) {
    const st = persons[p]
    if (st.dom) {
      if (!st.dom.searchNote.hidden && st.lastNoteKey) st.dom.searchNote.textContent = t(st.lastNoteKey)
      st.renderConfirm()
    }
    if (Object.keys(lastErrors[p]).length > 0) showErrorsFor(p, lastErrors[p])
  }
  if (lastCalc) showReport(false)
}

langToggle.addEventListener('click', () => {
  setLang(getLang() === 'hi' ? 'en' : 'hi')
  applyLanguage()
})

// ---------------------------------------------------------------------------
// Read + validate one person's form (same rules as the main app, minus gender)
// ---------------------------------------------------------------------------
function readPerson(p) {
  const raw = (x) => document.getElementById(`${p}-${x}`).value.trim()
  return {
    name: raw('name'),
    day: raw('day'),
    month: document.querySelector(`input[name="${p}-month"]:checked`)?.value ?? '',
    year: raw('year'),
    hour: raw('hour'),
    minute: raw('minute'),
    second: raw('second'),
    offset: raw('offset'),
    place: raw('place'),
    selectedPlace: persons[p].selectedPlace,
    manual: { lat: raw('lat'), lon: raw('lon'), tz: raw('tz') },
  }
}

function validatePerson(v) {
  const errors = {}

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

  // Time: 24-hour clock; empty seconds are taken as 0.
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

function showErrorsFor(p, errors) {
  const section = document.getElementById(`step-${p}`)
  section.querySelectorAll('.err').forEach((el) => {
    el.textContent = ''
  })
  section.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'))

  Object.entries(errors).forEach(([key, message]) => {
    const errEl = document.getElementById(`${p}-err-${key}`)
    if (!errEl) return
    errEl.textContent = message
    const field = errEl.closest('.field')
    if (field) field.classList.add('has-error')
  })
}

function focusFirstInvalid(p) {
  const first = document.getElementById(`step-${p}`).querySelector('.has-error input, .has-error select')
  if (first) first.focus()
}

// ---------------------------------------------------------------------------
// Place search — wired once per person (same behaviour as the main app)
// ---------------------------------------------------------------------------
function displayName(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ')
}

function setupSearch(p) {
  const st = persons[p]
  const dom = {
    searchBtn: document.getElementById(`${p}-search-btn`),
    searchNote: document.getElementById(`${p}-search-note`),
    placeInput: document.getElementById(`${p}-place`),
    resultsBox: document.getElementById(`${p}-results`),
    placeConfirm: document.getElementById(`${p}-place-confirm`),
  }
  st.dom = dom

  const setNote = (key) => {
    st.lastNoteKey = key
    dom.searchNote.hidden = !key
    dom.searchNote.textContent = key ? t(key) : ''
  }

  st.renderConfirm = () => {
    dom.placeConfirm.hidden = !st.selectedPlace
    if (st.selectedPlace) {
      dom.placeConfirm.textContent = `✔ ${t('search.selected')}: ${displayName(st.selectedPlace)} · ${st.selectedPlace.latitude}, ${st.selectedPlace.longitude} · ${st.selectedPlace.timezone}`
    }
  }

  const renderResults = () => {
    dom.resultsBox.replaceChildren()
    dom.resultsBox.hidden = st.lastResults.length === 0
    st.lastResults.forEach((place) => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'result-item' + (place === st.selectedPlace ? ' selected' : '')
      item.textContent = displayName(place)
      item.addEventListener('click', () => {
        st.selectedPlace = place
        setNote(null)
        st.renderConfirm()
        renderResults()
        dom.resultsBox.hidden = true
      })
      dom.resultsBox.append(item)
    })
  }

  const runSearch = async () => {
    const query = dom.placeInput.value.trim()
    if (!query) {
      setNote('search.enterName')
      return
    }

    // Small cooldown between identical searches — polite to the free API.
    const now = Date.now()
    if (query === st.lastSearch.query && now - st.lastSearch.at < 300) return
    st.lastSearch = { at: now, query }

    dom.searchBtn.disabled = true
    setNote('search.busy')
    try {
      st.lastResults = await searchPlace(query, 8)
      if (st.lastResults.length === 0) {
        dom.resultsBox.hidden = true
        setNote('search.none')
      } else {
        setNote(null)
        renderResults()
      }
    } catch (err) {
      console.error(err)
      dom.resultsBox.hidden = true
      setNote('search.error')
    } finally {
      dom.searchBtn.disabled = false
    }
  }

  dom.searchBtn.addEventListener('click', runSearch)

  // Enter in the place field runs the search (instead of submitting the form).
  dom.placeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      runSearch()
    }
  })

  // Editing the place text invalidates a previously picked place.
  dom.placeInput.addEventListener('input', () => {
    if (st.selectedPlace) {
      st.selectedPlace = null
      st.renderConfirm()
    }
  })
}

// ---------------------------------------------------------------------------
// The two-step flow
// ---------------------------------------------------------------------------
function showStep(step) {
  document.getElementById('step-b').hidden = step !== 'b'
  document.getElementById('step-g').hidden = step !== 'g'
  output.hidden = true
  const form = document.getElementById('match-form')
  if (typeof form.scrollIntoView === 'function') {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Step 1 → Step 2 (validate the boy's details first).
function continueToGirl() {
  const values = readPerson('b')
  const errors = validatePerson(values)
  lastErrors.b = errors
  showErrorsFor('b', errors)

  if (Object.keys(errors).length > 0) {
    if (errors.manual) document.getElementById('b-manual-box').open = true
    focusFirstInvalid('b')
    return
  }
  showStep('g')
}

// Step 2 → Step 1 ("Back" keeps everything the user typed).
function backToBoy() {
  showStep('b')
}

// A fatal message in the output area (conversion failure, engine error, …).
function showFatal(text) {
  output.hidden = false
  output.replaceChildren()
  const card = document.createElement('div')
  card.className = 'card summary match-summary'
  const note = document.createElement('p')
  note.className = 'note'
  note.textContent = text
  card.append(note)
  output.append(card)
  if (typeof output.scrollIntoView === 'function') {
    output.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ---------------------------------------------------------------------------
// Full report (Phase 5): Ashtakoot table + total + verdict + Mangal Dosha.
// ---------------------------------------------------------------------------
function personCard(personKey, values, kundli) {
  const box = document.createElement('div')
  box.className = 'match-person'

  const h3 = document.createElement('h3')
  h3.textContent = values.name ? `${t('match.' + personKey)} — ${values.name}` : t('match.' + personKey)
  box.append(h3)

  const list = document.createElement('dl')
  const addRow = (label, value) => {
    const dt = document.createElement('dt')
    dt.textContent = label
    const dd = document.createElement('dd')
    dd.textContent = value
    list.append(dt, dd)
  }
  addRow(t('summary.date'), formatDate(values))
  addRow(t('summary.time'), formatTime(values))
  const place = values.selectedPlace
  addRow(t('summary.place'), place ? displayName(place) : values.place || '—')

  const moon = kundli.planets.find((pl) => pl.key === 'moon')
  addRow(t('match.moonRashi'), rashiLabel(moon.rashi))
  addRow(t('match.moonNak'), `${nakshatraLabel(moon.nakshatra)} · ${t('table.pada')} ${moon.pada}`)
  addRow(t('summary.lagna'), rashiLabel(kundli.ascendant.rashi))
  box.append(list)
  return box
}

// One mangal line, in the active language.
function mangalLine(res) {
  if (!res || !res.present) return t('match.mangal.none')
  const parts = []
  if (res.fromLagna) parts.push(`${t('match.mangal.fromLagna')} ${res.lagnaHouse}`)
  if (res.fromMoon) parts.push(`${t('match.mangal.fromMoon')} ${res.moonHouse}`)
  const sev = t(res.severity === 'high' ? 'match.mangal.high' : 'match.mangal.low')
  return `${t('match.mangal.present')} — ${parts.join(' · ')} (${sev})`
}

// The report card (re-rendered on language switch; PNG / Print / Copy actions).
function showReport(scroll) {
  const { vb, vg, kB, kG, ashtakoot, mangalBoy, mangalGirl, mangalNotes } = lastCalc
  output.hidden = false
  output.replaceChildren()

  const card = document.createElement('div')
  card.className = 'card summary match-summary'

  // Print/PDF letter-head (mirrors the single-Kundli letter-head).
  const printHead = document.createElement('div')
  printHead.className = 'print-only print-head'
  const printTitle = document.createElement('p')
  printTitle.className = 'print-title'
  printTitle.textContent = 'कुंडली मिलान / Kundli Matching'
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

  const heading = document.createElement('h2')
  heading.className = 'summary-title'
  heading.textContent = t('match.report.title')
  card.append(heading)

  const grid = document.createElement('div')
  grid.className = 'match-pair'
  grid.append(personCard('boy', vb, kB), personCard('girl', vg, kG))
  card.append(grid)

  // Ashtakoot table: 8 koota rows + a total row.
  const tableWrap = document.createElement('div')
  tableWrap.className = 'table-wrap'
  const table = document.createElement('table')
  table.className = 'kundli-table match-table'
  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  for (const key of ['match.table.koota', 'match.table.points', 'match.table.reason']) {
    const th = document.createElement('th')
    th.textContent = t(key)
    headRow.append(th)
  }
  thead.append(headRow)
  table.append(thead)
  const tbody = document.createElement('tbody')
  for (const k of ashtakoot.kootas) {
    const tr = document.createElement('tr')
    const cells = [`${k.hi} / ${k.en}`, `${k.points} / ${k.max}`, getLang() === 'hi' ? k.reason.hi : k.reason.en]
    for (const text of cells) {
      const td = document.createElement('td')
      td.textContent = text
      tr.append(td)
    }
    tbody.append(tr)
  }
  const totalRow = document.createElement('tr')
  totalRow.className = 'total-row'
  for (const text of [t('match.totalRow'), `${ashtakoot.total} / ${ashtakoot.max}`, '']) {
    const td = document.createElement('td')
    td.textContent = text
    totalRow.append(td)
  }
  tbody.append(totalRow)
  table.append(tbody)
  tableWrap.append(table)
  card.append(tableWrap)

  // Verdict band (classical thresholds: <18 / 18–24 / 24–32 / 32–36).
  const verdict = document.createElement('div')
  verdict.className = `verdict-band ${ashtakoot.verdict.key}`
  verdict.textContent = getLang() === 'hi' ? ashtakoot.verdict.hi : ashtakoot.verdict.en
  card.append(verdict)

  // Mangal Dosha section for both persons + traditional notes.
  const mangalTitle = document.createElement('p')
  mangalTitle.className = 'kundli-table-title'
  mangalTitle.textContent = t('match.mangal.title')
  const mangalList = document.createElement('ul')
  mangalList.className = 'match-mangal'
  for (const [personKey, res] of [['boy', mangalBoy], ['girl', mangalGirl]]) {
    const li = document.createElement('li')
    li.textContent = `${t('match.' + personKey)}: ${mangalLine(res)}`
    mangalList.append(li)
  }
  for (const note of mangalNotes) {
    const li = document.createElement('li')
    li.textContent = getLang() === 'hi' ? note.hi : note.en
    mangalList.append(li)
  }
  card.append(mangalTitle, mangalList)

  const disclaimer = document.createElement('p')
  disclaimer.className = 'note match-disclaimer'
  disclaimer.textContent = t('match.disclaimer')
  card.append(disclaimer)

  // Actions: PNG (scorecard) / PDF (print) / copy details.
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
    downloadScorecardPng(() => {
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
      await navigator.clipboard.writeText(buildMatchText())
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

  output.append(card)
  if (scroll && typeof output.scrollIntoView === 'function') {
    output.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// PNG export of the scorecard (SVG → canvas → PNG download).
function downloadScorecardPng(onError) {
  const { vb, vg, ashtakoot } = lastCalc
  const shortPlace = (v) => (v.selectedPlace ? v.selectedPlace.name : v.place || '—')
  const svgStr = buildScorecardSvg({
    names: { boy: vb.name || '—', girl: vg.name || '—' },
    lines: {
      boy: `${formatDate(vb)} · ${formatTime(vb)} · ${shortPlace(vb)}`,
      girl: `${formatDate(vg)} · ${formatTime(vg)} · ${shortPlace(vg)}`,
    },
    rows: ashtakoot.kootas.map((k) => ({ hi: k.hi, en: k.en, points: k.points, max: k.max })),
    total: ashtakoot.total,
    maxTotal: ashtakoot.max,
    verdict: { hi: ashtakoot.verdict.hi, en: ashtakoot.verdict.en },
    footer: 'kundli.mybapuji.com · mybapuji.com',
  })
  const url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }))
  const img = new Image()
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 1010
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 1200, 1010)
      ctx.drawImage(img, 0, 0, 1200, 1010)
      canvas.toBlob((blob) => {
        if (!blob) {
          if (onError) onError()
          return
        }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'kundli-match.png'
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 5000)
      }, 'image/png')
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  img.onerror = () => {
    console.error('Scorecard PNG export failed')
    URL.revokeObjectURL(url)
    if (onError) onError()
  }
  img.src = url
}

// Plain-text version of the report (for the Copy button).
function buildMatchText() {
  const { vb, vg, ashtakoot, mangalBoy, mangalGirl, mangalNotes } = lastCalc
  const lang = getLang()
  const lines = ['कुंडली मिलान / Kundli Matching', '']
  const personLine = (labelKey, v) => {
    const place = v.selectedPlace ? displayName(v.selectedPlace) : v.place || '—'
    return `${t(labelKey)}: ${[v.name, formatDate(v), formatTime(v), place].filter(Boolean).join(' · ')}`
  }
  lines.push(personLine('match.boy', vb), personLine('match.girl', vg), '')
  for (const k of ashtakoot.kootas) {
    lines.push(`${k.hi} / ${k.en} — ${k.points}/${k.max} — ${lang === 'hi' ? k.reason.hi : k.reason.en}`)
  }
  lines.push(`${t('match.totalRow')}: ${ashtakoot.total} / ${ashtakoot.max}`)
  lines.push(lang === 'hi' ? ashtakoot.verdict.hi : ashtakoot.verdict.en)
  lines.push('')
  lines.push(t('match.mangal.title'))
  lines.push(`${t('match.boy')}: ${mangalLine(mangalBoy)}`)
  lines.push(`${t('match.girl')}: ${mangalLine(mangalGirl)}`)
  for (const note of mangalNotes) lines.push(lang === 'hi' ? note.hi : note.en)
  lines.push('')
  lines.push(t('match.disclaimer'))
  return lines.join('\n')
}

// "Get Match Report": re-validate both people (the boy's fields may have been
// edited after going back), then calculate BOTH charts with the existing
// astro.js engine.
async function runReport() {
  const vb = readPerson('b')
  const errorsB = validatePerson(vb)
  lastErrors.b = errorsB
  showErrorsFor('b', errorsB)
  if (Object.keys(errorsB).length > 0) {
    if (errorsB.manual) document.getElementById('b-manual-box').open = true
    showStep('b')
    focusFirstInvalid('b')
    return
  }

  const vg = readPerson('g')
  const errorsG = validatePerson(vg)
  lastErrors.g = errorsG
  showErrorsFor('g', errorsG)
  if (Object.keys(errorsG).length > 0) {
    if (errorsG.manual) document.getElementById('g-manual-box').open = true
    output.hidden = true
    focusFirstInvalid('g')
    return
  }

  vb.converted = computeConversion(vb)
  vg.converted = computeConversion(vg)
  if (!vb.converted || !vg.converted) {
    showFatal(t('match.errConv'))
    return
  }

  reportBtn.disabled = true
  showFatal(t('match.calculating'))
  try {
    const swe = await ensureEphemeris()
    const cB = resolveCoordinates(vb)
    const cG = resolveCoordinates(vg)
    const kB = computeKundli(swe, { utc: vb.converted.utc, ...cB, nodeType: 'mean' })
    const kG = computeKundli(swe, { utc: vg.converted.utc, ...cG, nodeType: 'mean' })
    if ((kB && kB.error) || (kG && kG.error)) {
      showFatal(t('err.polar'))
      return
    }
    const moonOf = (k) => k.planets.find((pl) => pl.key === 'moon')
    const ashtakoot = computeAshtakoot(moonOf(kB), moonOf(kG))
    const mangalBoy = checkMangalDosha(kB)
    const mangalGirl = checkMangalDosha(kG)
    lastCalc = {
      vb,
      vg,
      kB,
      kG,
      ashtakoot,
      mangalBoy,
      mangalGirl,
      mangalNotes: mangalPairNotes(mangalBoy, mangalGirl),
    }
    showReport(true)
  } catch (err) {
    console.error('Match calculation failed:', err)
    swePromise = null // allow a retry on the next attempt
    showFatal(t('match.engineError'))
  } finally {
    reportBtn.disabled = false
  }
}

document.querySelector('#continue-btn').addEventListener('click', continueToGirl)
document.querySelector('#back-btn').addEventListener('click', backToBoy)
reportBtn.addEventListener('click', runReport)

// Enter anywhere in the form continues to the next step (never a page reload).
document.querySelector('#match-form').addEventListener('submit', (event) => {
  event.preventDefault()
  if (document.getElementById('step-g').hidden) continueToGirl()
  else runReport()
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
buildMonthChips('b')
buildMonthChips('g')
setupSearch('b')
setupSearch('g')

// Dev-only helper: on the dev server, open /match/?demo=1 to prefill both
// sides with the sample couple (Ram & Sita, Varanasi). Never included in the
// production build (import.meta.env.DEV is false there).
if (import.meta.env?.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).get('demo') === '1') {
  const fill = (p, v) => {
    document.getElementById(`${p}-name`).value = v.name
    document.querySelector(`input[name="${p}-month"][value="${v.month}"]`).checked = true
    document.getElementById(`${p}-day`).value = v.day
    document.getElementById(`${p}-year`).value = v.year
    document.getElementById(`${p}-hour`).value = v.hour
    document.getElementById(`${p}-minute`).value = v.minute
    document.getElementById(`${p}-lat`).value = v.lat
    document.getElementById(`${p}-lon`).value = v.lon
    document.getElementById(`${p}-tz`).value = v.tz
  }
  fill('b', { name: 'राम कुमार', month: 1, day: 11, year: 1995, hour: 1, minute: 30, lat: '25.31668', lon: '83.01041', tz: 'Asia/Kolkata' })
  fill('g', { name: 'सीता देवी', month: 6, day: 2, year: 1995, hour: 16, minute: 0, lat: '25.31668', lon: '83.01041', tz: 'Asia/Kolkata' })
}

applyLanguage()
