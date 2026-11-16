// main.js — Kundli app entry point: header + birth-details form.
// Coming phases: full bilingual data (6), charts (7), results page (8).
import './style.css'
import { t, getLang, setLang, months, rashiLabel, grahaLabel, nakshatraLabel, monthEn } from './i18n.js'
import { searchPlace } from './geocode.js'
import { parseBirthParams } from './prefill.js'
import { validateBirth } from './birthvalidate.js'
import { formatUtcOffset, parseUtcOffset, wallTimeToUtc } from './timeutil.js'
import { computeKundli, initEphemeris, navamsaKundli, computeVimshottari } from './astro.js'
import { buildNorthChart, buildSouthChart } from './charts.js'
import { mybapujiStripHTML } from './mybapuji-strip.js'
import { attachTimezoneAutofill } from './tzauto.js'
import { PAGES, absoluteUrl } from './pages.js'

// Where the public source code lives — confirmed/adjusted when the GitHub
// repo is created (deploy phase).
const SOURCE_URL = 'https://github.com/vasant22/kundli'

const app = document.querySelector('#app')

// ---------------------------------------------------------------------------
// App shell — header + form + output area
// ---------------------------------------------------------------------------
app.innerHTML = mybapujiStripHTML() + `
  <div class="wrap">
    <header class="site-header">
      <div>
        <h1 data-i18n="app.title"></h1>
        <p class="sub" data-i18n="app.subtitle"></p>
        <p class="free-badge" data-i18n="app.badge"></p>
        <nav class="site-nav">
          <a href="${PAGES.kundli}" class="active" data-i18n="nav.home"></a>
          <a href="${PAGES.match}" data-i18n="nav.match"></a>
          <a href="${PAGES.panchang}" data-i18n="nav.panchang"></a>
          <a href="${PAGES.bnn}" data-i18n="nav.bnn"></a>
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
            <p class="note" id="tz-auto-note" aria-live="polite" hidden></p>
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

// अक्षांश-देशांतर भरते ही समय-क्षेत्र अपने-आप (Open-Meteo — देखें src/tzauto.js)।
const tzAutoNote = document.querySelector('#tz-auto-note')
attachTimezoneAutofill({
  latEl: document.querySelector('#f-lat'),
  lonEl: document.querySelector('#f-lon'),
  tzEl: document.querySelector('#f-tz'),
  onState(state) {
    tzAutoNote.hidden = !state
    tzAutoNote.classList.toggle('ok', state === 'filled')
    if (state) {
      tzAutoNote.dataset.i18n = `tz.auto.${state}`
      tzAutoNote.textContent = t(`tz.auto.${state}`)
    } else {
      tzAutoNote.removeAttribute('data-i18n')
      tzAutoNote.textContent = ''
    }
  },
})

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
// फलादेश page का link — वही prefill format जो prefill.js पढ़ता है.
function phalQuery(values, conversion, coords) {
  const q = new URLSearchParams()
  if (values.name) q.set('name', values.name)
  if (values.gender) q.set('gender', values.gender)
  q.set('day', values.day)
  q.set('month', values.month)
  q.set('year', values.year)
  q.set('hour', values.hour)
  q.set('min', values.minute)
  q.set('sec', values.second === '' ? '0' : values.second)
  if (values.place) q.set('place', values.place)
  if (coords) { q.set('lat', String(coords.latitude)); q.set('lng', String(coords.longitude)) }
  if (conversion?.zone) q.set('tz', conversion.zone)
  return q
}
function phalUrl(values, conversion, coords) {
  return `../kundli-phal/?${phalQuery(values, conversion, coords).toString()}`
}

// विस्तृत फलादेश का online section — JS chunk तभी load होता है जब जातक यहाँ तक
// scroll करे (देखें beginPhalOnline). जो वहाँ तक नहीं जाता, उसके लिए कुछ नहीं.
function beginPhalOnline(host, values, conversion, coords) {
  // एक बार में एक ही mount; page दोबारा render हो तो जो host अभी DOM में है उसी में भरो
  const start = async () => {
    if (host.dataset.phalMounted) return
    host.dataset.phalMounted = '1'
    try {
      const { mountPhalOnline } = await import('./phal/online.js')
      const target = document.querySelector('#phal-online')
      if (!target || target.dataset.phalMountedFinal) return
      target.dataset.phalMountedFinal = '1'
      await mountPhalOnline(target, {
        search: `?${phalQuery(values, conversion, coords).toString()}`,
        pdfHref: `${phalUrl(values, conversion, coords)}&print=1`,
        name: values.name,
        hint: t('phal.onlineHint'),
        hindiOnlyNote: getLang() === 'en' ? t('phal.englishNote') : '',
      })
    } catch (err) {
      console.error('phal online failed', err)
      const target = document.querySelector('#phal-online') || host
      target.innerHTML = '<p class="po-note">विस्तृत फलादेश यहाँ नहीं खुल सका — ऊपर दिए बटन से PDF खोलें।</p>'
    }
  }
  if (globalThis.__phalOnlineReady) { start(); return }
  const near = () => {
    const r = host.getBoundingClientRect()
    return r.top < window.innerHeight + 600 && r.bottom > -600
  }
  if (typeof IntersectionObserver === 'undefined') { start(); return }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); window.removeEventListener('scroll', onScroll); start() }
  }, { rootMargin: '600px' })
  const onScroll = () => { if (!near()) return; window.removeEventListener('scroll', onScroll); io.disconnect(); start() }
  io.observe(host)
  if (near()) { io.disconnect(); start() } else window.addEventListener('scroll', onScroll, { passive: true })
}

// विस्तृत फलादेश — मौजूदा result के नीचे, screen-लगाव में (कोई ऊपरी हिस्सा नहीं बदलता)
  const onlineCoords = resolveCoordinates(values)
  const onlineConv = computeConversion(values)
  if (onlineCoords && onlineConv && !values.kundliError) {
    const host = document.createElement('section')
    host.id = 'phal-online'
    host.className = 'phal-online'
    host.innerHTML = '<p class="po-note">विस्तृत फलादेश यहाँ खुलेगा…</p>'
    output.append(host)
    beginPhalOnline(host, values, onlineConv, onlineCoords)
  }

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

// The full submit journey (validate → convert → show → calculate). Shared by
// the form's own submit button and by the URL pre-fill auto-run below, so a
// link from the homepage widget takes exactly the same path as a manual submit.
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
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  submitForm()
})

// ---------------------------------------------------------------------------
// URL pre-fill — one-click links from the homepage Kundli widget, e.g.
//   /?name=…&gender=…&day=…&month=…&year=…&hour=…&min=…&sec=…
//    &place=…&lat=…&lng=…&tz=…   (full list in src/prefill.js)
// Fills whatever arrived; the caller (Start, below) then auto-runs the
// calculation when all required values are present and valid. A plain visit
// without parameters changes nothing at all.
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
// URL pre-fill first (an English link should render English from the start).
const prefill = parseBirthParams(window.location.search)
if (prefill.lang) setLang(prefill.lang)

buildMonthChips()
applyLanguage()

if (prefill.any) {
  applyBirthPrefill(prefill)
  // Auto-run only when every required value arrived — nothing left to type.
  if (Object.keys(validateBirth(readForm())).length === 0) submitForm()
}
