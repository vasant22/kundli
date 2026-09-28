// main.js — Kundli app entry point: header + birth-details form.
// Coming phases: time conversion (4), calculations (5), full bilingual data (6),
// charts (7), results page (8).
import './style.css'
import { t, getLang, setLang, months } from './i18n.js'
import { searchPlace } from './geocode.js'

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
              <input id="f-second" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" />
            </div>
          </div>
          <p class="err" id="err-time" aria-live="polite"></p>
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

      <section id="output" hidden></section>
    </main>
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

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

// Accepts an IANA name (Asia/Kolkata), "UTC", or a UTC offset (+05:30, -8).
function isValidTimezone(value) {
  const offset = /^[+-]?\d{1,2}(:[0-5]\d)?$/
  const ianaName = /^[A-Za-z]+(?:[_/][A-Za-z0-9+_-]+)+$|^UTC$/
  return offset.test(value) || ianaName.test(value)
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

  // Time: 24-hour clock, hour 0–23, minute/second 0–59.
  const h = toInt(v.hour)
  const mi = toInt(v.minute)
  const s = toInt(v.second)
  if (v.hour === '' || v.minute === '' || v.second === '') {
    errors.time = t('err.timeRequired')
  } else if (!Number.isInteger(h) || h < 0 || h > 23) {
    errors.time = t('err.hour')
  } else if (!Number.isInteger(mi) || mi < 0 || mi > 59) {
    errors.time = t('err.minute')
  } else if (!Number.isInteger(s) || s < 0 || s > 59) {
    errors.time = t('err.second')
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
    } else if (!isValidTimezone(v.manual.tz)) {
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
  const timeText = `${pad(toInt(values.hour))}:${pad(toInt(values.minute))}:${pad(toInt(values.second))}`

  output.hidden = false
  output.replaceChildren()

  const card = document.createElement('div')
  card.className = 'card summary'

  const heading = document.createElement('h2')
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

  const note = document.createElement('p')
  note.className = 'note'
  note.textContent = t('summary.note')
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

form.addEventListener('submit', (event) => {
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

  lastValues = values
  showSummary(values, true)
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
buildMonthChips()
applyLanguage()
