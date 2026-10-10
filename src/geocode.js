// geocode.js — birth-place lookup via Open-Meteo Geocoding (free, no API key).
// Docs: https://open-meteo.com/en/docs/geocoding-api
// Callers keep it polite to the free service: explicit searches (Search
// button / Enter) plus debounced, cached live suggestions while typing.

const ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search'
const TIMEOUT_MS = 10000

// Search places by name. Returns up to `count` simplified results:
// { name, admin1, country, latitude, longitude, timezone }
export async function searchPlace(query, count = 8) {
  const url = `${ENDPOINT}?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`Geocoding request failed (HTTP ${res.status})`)
    const data = await res.json()
    return (data.results ?? []).map((r) => ({
      name: r.name,
      admin1: r.admin1 ?? '',
      country: r.country ?? '',
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone ?? '',
    }))
  } finally {
    clearTimeout(timer)
  }
}
