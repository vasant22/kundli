// match-widget.js — Homepage Widgets project, Phase 3: the compact
// "Kundli Matching" card (step 1: boy's details → step 2: girl's details),
// served at kundli.mybapuji.com/widgets/match/ and embedded via an iframe.
//
// Like the Kundli mini-widget, this card does NO calculation: on
// "मिलान रिपोर्ट देखें" it validates both sides (the shared rules in
// src/birthvalidate.js) and opens the full matching tool at /match/ with all
// values in the URL (b_/g_ parameters — see src/prefill.js) in a NEW tab.
// The full tool then runs the 36-point report by itself.
//
// url params: ?lang=en for English labels; ?transparent=1 blends the page
// background with the WordPress theme (same as the other widgets).

import { t, setLang, getLang } from './i18n.js'
import { searchPlace } from './geocode.js'
import { validateBirth } from './birthvalidate.js'
import { installHeightReporter } from './widget-resize.js'
import './fonts.css'
import './widget.css'

// Per-person search state (the card holds two forms, shown one at a time).
const state = {
  b: { selectedPlace: null, lastResults: [], lastSearch: { at: 0, query: '' } },
  g: { selectedPlace: null, lastResults: [], lastSearch: { at: 0, query: '' } },
}
let currentStep = 'b'

function displayName(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ')
}

// ---------------------------------------------------------------------------
// Link building (pure — unit-tested; the format must match src/prefill.js)
// ---------------------------------------------------------------------------

function addPersonParams(params, prefix, v) {
  if (v.name) params.set(`${prefix}name`, v.name)
  params.set(`${prefix}day`, v.day)
  params.set(`${prefix}month`, v.month)
  params.set(`${prefix}year`, v.year)
  params.set(`${prefix}hour`, v.hour)
  params.set(`${prefix}min`, v.minute)
  params.set(`${prefix}sec`, v.second === '' ? '0' : v.second)
  if (v.selectedPlace) {
    params.set(`${prefix}place`, displayName(v.selectedPlace))
    params.set(`${prefix}lat`, String(v.selectedPlace.latitude))
    params.set(`${prefix}lng`, String(v.selectedPlace.longitude))
    params.set(`${prefix}tz`, v.selectedPlace.timezone)
  }
}

/** Query parameters understood by the full /match/ page (b_/g_ pairs). */
export function buildMatchParams(boy, girl, lang = 'hi') {
  const params = new URLSearchParams()
  addPersonParams(params, 'b_', boy)
  addPersonParams(params, 'g_', girl)
  if (lang === 'en') params.set('lang', 'en')
  return params
}

/** Full URL to open: '../..' + 'match/' = the matching tool (dev + prod). */
export function buildOpenUrl(href, boy, girl, lang = 'hi') {
  const url = new URL('../../match/', href)
  url.search = buildMatchParams(boy, girl, lang).toString()
  return url.toString()
}

// ---------------------------------------------------------------------------
// Render + wiring
// ---------------------------------------------------------------------------

const $ = (root, sel) => root.querySelector(sel)

// One person's fields — the same compact layout as the Kundli mini-widget
// (both steps share this template; ids are prefixed mw-b-… / mw-g-…).
function personFieldsHtml(p) {
  return `
    <div class="kw-field">
      <label class="kw-label" for="mw-${p}-name">${t('form.name')}</label>
      <input class="kw-input" id="mw-${p}-name" type="text" placeholder="${t('form.namePh')}" />
    </div>

    <div class="kw-field">
      <span class="kw-label">${t('form.dob')}</span>
      <div class="kw-row3">
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${p}-day">${t('date.day')}</label>
          <input class="kw-input" id="mw-${p}-day" type="number" inputmode="numeric" min="1" max="31" placeholder="1–31" />
        </div>
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${p}-month">${t('date.month')}</label>
          <input class="kw-input" id="mw-${p}-month" type="number" inputmode="numeric" min="1" max="12" placeholder="1–12" />
        </div>
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${p}-year">${t('date.year')}</label>
          <input class="kw-input" id="mw-${p}-year" type="number" inputmode="numeric" min="1800" max="2400" placeholder="1990" />
        </div>
      </div>
      <p class="kw-err" id="mw-${p}-err-date" aria-live="polite"></p>
    </div>

    <div class="kw-field">
      <span class="kw-label">${t('form.tob')} <span class="kw-note-inline">${t('form.tobNote')}</span></span>
      <div class="kw-row3">
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${p}-hour">${t('time.hour')}</label>
          <input class="kw-input" id="mw-${p}-hour" type="number" inputmode="numeric" min="0" max="23" placeholder="0–23" />
        </div>
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${p}-minute">${t('time.minute')}</label>
          <input class="kw-input" id="mw-${p}-minute" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" />
        </div>
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${p}-second">${t('time.second')}</label>
          <input class="kw-input" id="mw-${p}-second" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" value="0" />
        </div>
      </div>
      <p class="kw-err" id="mw-${p}-err-time" aria-live="polite"></p>
    </div>

    <div class="kw-field">
      <label class="kw-label" for="mw-${p}-place">${t('form.place')}</label>
      <div class="kw-search">
        <input class="kw-input" id="mw-${p}-place" type="text" placeholder="${t('form.placePh')}" />
        <button id="mw-${p}-search-btn" class="kw-search-btn" type="button">${t('form.search')}</button>
      </div>
      <p class="kw-note" id="mw-${p}-search-note" hidden></p>
      <div id="mw-${p}-results" class="kw-results" hidden></div>
      <p class="kw-ok" id="mw-${p}-place-confirm" hidden></p>
      <p class="kw-err" id="mw-${p}-err-place" aria-live="polite"></p>
    </div>`
}

/** Build the card (call again after setLang to switch language). */
export function renderMatchWidget(root, lang = 'hi') {
  setLang(lang)
  state.b = { selectedPlace: null, lastResults: [], lastSearch: { at: 0, query: '' } }
  state.g = { selectedPlace: null, lastResults: [], lastSearch: { at: 0, query: '' } }
  currentStep = 'b'

  root.innerHTML = `
    <div class="pw-card" role="region" aria-label="${t('mw.title')}">
      <div class="pw-head">
        <div class="pw-title">${t('mw.title')}</div>
      </div>
      <form id="mw-form" class="kw-form" novalidate>
        <section id="mw-step-b">
          <p class="mw-step-heading">${t('match.boysHeading')}</p>
          ${personFieldsHtml('b')}
          <p class="kw-note mw-next-note">${t('match.nextNote')}</p>
          <button class="pw-btn kw-submit" type="submit" id="mw-continue">${t('match.continue')}</button>
        </section>

        <section id="mw-step-g" hidden>
          <button type="button" class="mw-back" id="mw-back">${t('match.back')}</button>
          <p class="mw-step-heading">${t('match.girlsHeading')}</p>
          ${personFieldsHtml('g')}
          <button class="pw-btn kw-submit" type="submit" id="mw-report">${t('match.getReport')}</button>
        </section>

        <p class="kw-ok" id="mw-open-note" hidden></p>
        <p class="kw-credit">Geocoding by <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo.com</a></p>
      </form>
    </div>`

  wire(root)
}

// One person's values — the same shape src/birthvalidate.js expects.
function readPerson(root, p) {
  const val = (x) => $(root, `#mw-${p}-${x}`).value.trim()
  return {
    name: val('name'),
    day: val('day'),
    month: val('month'),
    year: val('year'),
    hour: val('hour'),
    minute: val('minute'),
    second: val('second'),
    offset: '',
    place: val('place'),
    selectedPlace: state[p].selectedPlace,
    manual: { lat: '', lon: '', tz: '' },
  }
}

function showPersonErrors(root, p, errors) {
  const section = $(root, p === 'b' ? '#mw-step-b' : '#mw-step-g')
  section.querySelectorAll('.kw-err').forEach((el) => {
    el.textContent = ''
  })
  section.querySelectorAll('.kw-field.has-error').forEach((el) => el.classList.remove('has-error'))

  Object.entries(errors).forEach(([key, message]) => {
    const errEl = section.querySelector(`#mw-${p}-err-${key}`)
    if (!errEl) return
    errEl.textContent = message
    const field = errEl.closest('.kw-field')
    if (field) field.classList.add('has-error')
  })
}

// Place search — wired once per person (same behaviour as the full tool).
function setupSearch(root, p) {
  const st = state[p]
  const searchBtn = $(root, `#mw-${p}-search-btn`)
  const searchNote = $(root, `#mw-${p}-search-note`)
  const placeInput = $(root, `#mw-${p}-place`)
  const resultsBox = $(root, `#mw-${p}-results`)
  const placeConfirm = $(root, `#mw-${p}-place-confirm`)

  const setNote = (key) => {
    searchNote.hidden = !key
    searchNote.textContent = key ? t(key) : ''
  }

  const renderConfirm = () => {
    placeConfirm.hidden = !st.selectedPlace
    if (st.selectedPlace) {
      const pl = st.selectedPlace
      placeConfirm.textContent =
        `✔ ${t('search.selected')}: ${displayName(pl)} · ${pl.latitude}, ${pl.longitude} · ${pl.timezone}`
    }
  }

  const renderResults = () => {
    resultsBox.replaceChildren()
    resultsBox.hidden = st.lastResults.length === 0
    st.lastResults.forEach((place) => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'kw-result' + (place === st.selectedPlace ? ' selected' : '')
      item.textContent = displayName(place)
      item.addEventListener('click', () => {
        st.selectedPlace = place
        setNote(null)
        renderConfirm()
        renderResults()
        resultsBox.hidden = true // hide the suggestion list once picked
      })
      resultsBox.append(item)
    })
  }

  async function runSearch() {
    const query = placeInput.value.trim()
    if (!query) {
      setNote('search.enterName')
      return
    }
    // Small cooldown between identical searches — polite to the free API.
    const now = Date.now()
    if (query === st.lastSearch.query && now - st.lastSearch.at < 300) return
    st.lastSearch = { at: now, query }
    searchBtn.disabled = true
    setNote('search.busy')
    try {
      st.lastResults = await searchPlace(query, 8)
      if (st.lastResults.length === 0) {
        resultsBox.hidden = true
        setNote('search.none')
      } else {
        setNote(null)
        renderResults()
      }
    } catch (err) {
      console.error(err)
      resultsBox.hidden = true
      setNote('panchang.errPlace')
    } finally {
      searchBtn.disabled = false
    }
  }

  searchBtn.addEventListener('click', runSearch)
  placeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      runSearch()
    }
  })
  placeInput.addEventListener('input', () => {
    if (st.selectedPlace) {
      st.selectedPlace = null
      renderConfirm()
    }
  })
}

function wire(root) {
  const form = $(root, '#mw-form')
  const openNote = $(root, '#mw-open-note')
  const stepB = $(root, '#mw-step-b')
  const stepG = $(root, '#mw-step-g')

  const showStep = (step) => {
    currentStep = step
    stepB.hidden = step !== 'b'
    stepG.hidden = step !== 'g'
    if (typeof form.scrollIntoView === 'function') {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  for (const p of ['b', 'g']) setupSearch(root, p)
  $(root, '#mw-back').addEventListener('click', () => showStep('b'))

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    openNote.hidden = true

    if (currentStep === 'b') {
      // Step 1 → step 2 (validate the boy's details first). No gender is
      // asked on this card — same as the full matching tool.
      const v = readPerson(root, 'b')
      const errors = validateBirth(v, { requireGender: false, placeSelectKey: 'kw.errPlacePick' })
      showPersonErrors(root, 'b', errors)
      if (Object.keys(errors).length > 0) return
      showStep('g')
      return
    }

    // Final submit: validate BOTH sides (the boy's fields may have been
    // edited after going Back — same behaviour as the full tool).
    const vb = readPerson(root, 'b')
    const eb = validateBirth(vb, { requireGender: false, placeSelectKey: 'kw.errPlacePick' })
    showPersonErrors(root, 'b', eb)
    const vg = readPerson(root, 'g')
    const eg = validateBirth(vg, { requireGender: false, placeSelectKey: 'kw.errPlacePick' })
    showPersonErrors(root, 'g', eg)
    if (Object.keys(eb).length > 0) {
      showStep('b')
      return
    }
    if (Object.keys(eg).length > 0) return

    openNote.hidden = false
    openNote.textContent = t('mw.opening')
    // New tab, synchronously inside the user gesture (popup-blocker friendly).
    window.open(buildOpenUrl(window.location.href, vb, vg, getLang()), '_blank', 'noopener')
  })
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
// Auto-start when embedded on a page (skipped in unit tests — no #widget root).
if (typeof document !== 'undefined') {
  const root = document.getElementById('widget')
  if (root) {
    const params = new URLSearchParams(window.location.search)
    if (params.get('transparent') === '1') document.body.classList.add('pw-transparent')
    installHeightReporter() // keep the parent's <iframe> the right height
    renderMatchWidget(root, params.get('lang') === 'en' ? 'en' : 'hi')
  }
}
