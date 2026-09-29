// src/prefill.js — URL pre-fill parsing for one-click links from the
// homepage widgets (and any other deep links into the tools).
//
// Kundli page (index.html):
//   ?name=…&gender=…&day=…&month=…&year=…&hour=…&min=…&sec=…
//   &place=…&lat=…&lng=…&tz=…&lang=hi|en
// Match page (/match/): same keys, prefixed per person —
//   b_name=…&b_day=… … (boy) and g_name=…&g_day=… … (girl), plus lang.
// "lon" is accepted as an alias of "lng".
//
// This module only PARSES the query string into plain objects; the page
// modules (main.js / match.js) apply the values to their own form fields.
// No DOM access here, so it is easy to unit-test.
//
// Note: an empty/garbage value is simply ignored ("") — the visitor sees an
// unfilled field instead of an invalid one. Auto-running the calculation is
// decided by each page's own validation, not by this parser.

function clean(value) {
  return value === null ? '' : String(value).trim()
}

// "5" / "05" → "5"; anything outside 1–12 → '' (month chip stays unpicked).
function cleanMonth(value) {
  const n = Number(clean(value))
  return Number.isInteger(n) && n >= 1 && n <= 12 ? String(n) : ''
}

function cleanLang(value) {
  const v = clean(value).toLowerCase()
  return v === 'hi' || v === 'en' ? v : ''
}

function parsePerson(p, prefix) {
  const get = (key) => clean(p.get(prefix + key))
  const person = {
    name: get('name'),
    day: get('day'),
    month: cleanMonth(get('month')),
    year: get('year'),
    hour: get('hour'),
    minute: get('min'),
    second: get('sec'),
    place: get('place'),
    lat: get('lat'),
    lng: get('lng') || get('lon'),
    tz: get('tz'),
  }
  // Did this block carry any usable value at all? (decides fill / auto-run)
  person.any = Object.values(person).some((v) => v !== '')
  return person
}

// → { ...person fields, gender, lang, any }
export function parseBirthParams(search) {
  const p = new URLSearchParams(search || '')
  const person = parsePerson(p, '')
  const gender = clean(p.get('gender')).toLowerCase()
  person.gender = ['male', 'female', 'other'].includes(gender) ? gender : ''
  person.lang = cleanLang(p.get('lang'))
  person.any = person.any || person.gender !== ''
  return person
}

// → { b, g, lang, any } — b/g are the two persons' blocks.
export function parseMatchParams(search) {
  const p = new URLSearchParams(search || '')
  const b = parsePerson(p, 'b_')
  const g = parsePerson(p, 'g_')
  return { b, g, lang: cleanLang(p.get('lang')), any: b.any || g.any }
}
