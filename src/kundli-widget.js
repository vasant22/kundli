// kundli-widget.js — Homepage Widgets project, Phase 2: the small
// "Kundli / Birth Chart" input card for the mybapuji.com homepage
// (served at kundli.mybapuji.com/widgets/kundli/, embedded via an iframe).
//
// This widget does NO calculation. On "कुंडली बनाएँ" it validates the details
// (exactly the same rules as the full form — src/birthvalidate.js), builds a
// query-string link to the full Kundli tool with every value (including the
// picked place's latitude/longitude/timezone) and opens it in a NEW tab, so
// the visitor keeps their place on mybapuji.com. The full page understands
// these parameters natively (see src/prefill.js) and starts the calculation
// by itself.
//
// url params: ?lang=en for English labels; ?transparent=1 blends the page
// background with the WordPress theme (same as the Panchang widget).

import { t, setLang, getLang } from './i18n.js'
import { searchPlace } from './geocode.js'
import { validateBirth } from './birthvalidate.js'
import { installHeightReporter } from './widget-resize.js'
import './fonts.css'
import './widget.css'

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------

// The search results live in module state (the widget page has one form only).
const state = {
  selectedPlace: null,
  lastResults: [],
  lastSearch: { at: 0, query: '' },
}

function displayName(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ')
}

// ---------------------------------------------------------------------------
// Link building (pure — unit-tested; the format must match src/prefill.js)
// ---------------------------------------------------------------------------

/**
 * Turn the widget's values into the query parameters the full Kundli page
 * understands: name/gender/day/month/year/hour/min/sec/place/lat/lng/tz
 * (+ lang=en when the widget is in English; Hindi is the default).
 */
export function buildKundliParams(v, lang = 'hi') {
  const params = new URLSearchParams()
  if (v.name) params.set('name', v.name)
  if (v.gender) params.set('gender', v.gender)
  params.set('day', v.day)
  params.set('month', v.month)
  params.set('year', v.year)
  params.set('hour', v.hour)
  params.set('min', v.minute)
  params.set('sec', v.second === '' ? '0' : v.second)
  if (v.selectedPlace) {
    params.set('place', displayName(v.selectedPlace))
    params.set('lat', String(v.selectedPlace.latitude))
    params.set('lng', String(v.selectedPlace.longitude))
    params.set('tz', v.selectedPlace.timezone)
  }
  if (lang === 'en') params.set('lang', 'en')
  return params
}

/**
 * The full URL to open. `href` is the widget page's own location — '../..'
 * resolves to the site root in production (/widgets/kundli/ → kundli.
 * mybapuji.com/) and on the dev server exactly the same way.
 */
export function buildOpenUrl(href, v, lang = 'hi') {
  const url = new URL('../../', href)
  url.search = buildKundliParams(v, lang).toString()
  return url.toString()
}

// ---------------------------------------------------------------------------
// Render + wiring
// ---------------------------------------------------------------------------

const $ = (root, sel) => root.querySelector(sel)

/** Build the card (call again after setLang to switch language). */
export function renderKundliWidget(root, lang = 'hi') {
  setLang(lang)
  state.selectedPlace = null
  state.lastResults = []
  state.lastSearch = { at: 0, query: '' }

  root.innerHTML = `
    <div class="pw-card" role="region" aria-label="${t('kw.title')}">
      <div class="pw-head">
        <div class="pw-title">${t('kw.title')}</div>
        <div class="pw-sub">${t('form.heading')}</div>
      </div>
      <form id="kw-form" class="kw-form" novalidate>
        <div class="kw-field">
          <label class="kw-label" for="kw-name">${t('form.name')}</label>
          <input class="kw-input" id="kw-name" type="text" autocomplete="name" placeholder="${t('form.namePh')}" />
        </div>

        <fieldset class="kw-field kw-fieldset">
          <legend class="kw-label">${t('form.gender')}</legend>
          <div class="kw-gender">
            <label><input type="radio" name="kw-gender" value="male" /><span>${t('gender.male')}</span></label>
            <label><input type="radio" name="kw-gender" value="female" /><span>${t('gender.female')}</span></label>
            <label><input type="radio" name="kw-gender" value="other" /><span>${t('gender.other')}</span></label>
          </div>
          <p class="kw-err" id="kw-err-gender" aria-live="polite"></p>
        </fieldset>

        <div class="kw-field">
          <span class="kw-label">${t('form.dob')}</span>
          <div class="kw-row3">
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-day">${t('date.day')}</label>
              <input class="kw-input" id="kw-day" type="number" inputmode="numeric" min="1" max="31" placeholder="1–31" />
            </div>
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-month">${t('date.month')}</label>
              <input class="kw-input" id="kw-month" type="number" inputmode="numeric" min="1" max="12" placeholder="1–12" />
            </div>
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-year">${t('date.year')}</label>
              <input class="kw-input" id="kw-year" type="number" inputmode="numeric" min="1800" max="2400" placeholder="1990" />
            </div>
          </div>
          <p class="kw-err" id="kw-err-date" aria-live="polite"></p>
        </div>

        <div class="kw-field">
          <span class="kw-label">${t('form.tob')} <span class="kw-note-inline">${t('form.tobNote')}</span></span>
          <div class="kw-row3">
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-hour">${t('time.hour')}</label>
              <input class="kw-input" id="kw-hour" type="number" inputmode="numeric" min="0" max="23" placeholder="0–23" />
            </div>
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-minute">${t('time.minute')}</label>
              <input class="kw-input" id="kw-minute" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" />
            </div>
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-second">${t('time.second')}</label>
              <input class="kw-input" id="kw-second" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" value="0" />
            </div>
          </div>
          <p class="kw-err" id="kw-err-time" aria-live="polite"></p>
        </div>

        <div class="kw-field">
          <label class="kw-label" for="kw-place">${t('form.place')}</label>
          <div class="kw-search">
            <input class="kw-input" id="kw-place" type="text" placeholder="${t('form.placePh')}" />
            <button id="kw-search-btn" class="kw-search-btn" type="button">${t('form.search')}</button>
          </div>
          <p class="kw-note" id="kw-search-note" hidden></p>
          <div id="kw-results" class="kw-results" hidden></div>
          <p class="kw-ok" id="kw-place-confirm" hidden></p>
          <p class="kw-err" id="kw-err-place" aria-live="polite"></p>
        </div>

        <button class="pw-btn kw-submit" type="submit" id="kw-submit">${t('btn.get')}</button>
        <p class="kw-ok" id="kw-open-note" hidden></p>
        <p class="kw-credit">Geocoding by <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo.com</a></p>
      </form>
    </div>`

  wire(root)
}

function showErrors(root, errors) {
  root.querySelectorAll('.kw-err').forEach((el) => {
    el.textContent = ''
  })
  root.querySelectorAll('.kw-field.has-error').forEach((el) => el.classList.remove('has-error'))

  Object.entries(errors).forEach(([key, message]) => {
    const errEl = root.querySelector(`#kw-err-${key}`)
    if (!errEl) return
    errEl.textContent = message
    const field = errEl.closest('.kw-field')
    if (field) field.classList.add('has-error')
  })
}

function wire(root) {
  const form = $(root, '#kw-form')
  const searchBtn = $(root, '#kw-search-btn')
  const searchNote = $(root, '#kw-search-note')
  const placeInput = $(root, '#kw-place')
  const resultsBox = $(root, '#kw-results')
  const placeConfirm = $(root, '#kw-place-confirm')
  const openNote = $(root, '#kw-open-note')

  const setNote = (key) => {
    searchNote.hidden = !key
    searchNote.textContent = key ? t(key) : ''
  }

  const renderConfirm = () => {
    placeConfirm.hidden = !state.selectedPlace
    if (state.selectedPlace) {
      const p = state.selectedPlace
      placeConfirm.textContent =
        `✔ ${t('search.selected')}: ${displayName(p)} · ${p.latitude}, ${p.longitude} · ${p.timezone}`
    }
  }

  const renderResults = () => {
    resultsBox.replaceChildren()
    resultsBox.hidden = state.lastResults.length === 0
    state.lastResults.forEach((place) => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'kw-result' + (place === state.selectedPlace ? ' selected' : '')
      item.textContent = displayName(place)
      item.addEventListener('click', () => {
        state.selectedPlace = place
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
    if (query === state.lastSearch.query && now - state.lastSearch.at < 300) return
    state.lastSearch = { at: now, query }
    searchBtn.disabled = true
    setNote('search.busy')
    try {
      state.lastResults = await searchPlace(query, 8)
      if (state.lastResults.length === 0) {
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
    if (state.selectedPlace) {
      state.selectedPlace = null
      renderConfirm()
    }
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    openNote.hidden = true

    const v = {
      name: $(root, '#kw-name').value.trim(),
      gender: root.querySelector('input[name="kw-gender"]:checked')?.value ?? '',
      day: $(root, '#kw-day').value.trim(),
      month: $(root, '#kw-month').value.trim(),
      year: $(root, '#kw-year').value.trim(),
      hour: $(root, '#kw-hour').value.trim(),
      minute: $(root, '#kw-minute').value.trim(),
      second: $(root, '#kw-second').value.trim(),
      offset: '',
      place: placeInput.value.trim(),
      selectedPlace: state.selectedPlace,
      manual: { lat: '', lon: '', tz: '' },
    }
    const errors = validateBirth(v, { placeSelectKey: 'kw.errPlacePick' })
    showErrors(root, errors)
    if (Object.keys(errors).length > 0) return

    openNote.hidden = false
    openNote.textContent = t('kw.opening')
    // New tab, synchronously inside the user gesture (popup-blocker friendly).
    window.open(buildOpenUrl(window.location.href, v, getLang()), '_blank', 'noopener')
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
    renderKundliWidget(root, params.get('lang') === 'en' ? 'en' : 'hi')
  }
}
