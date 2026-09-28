// tests/geocode.test.js — Phase 3 unit tests for the Open-Meteo search helper.
// Run with: npm test
import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchPlace } from '../src/geocode.js'

const okResponse = (payload) => ({ ok: true, json: async () => payload })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchPlace (Open-Meteo geocoding)', () => {
  it('builds the correct URL and maps the results', async () => {
    const mock = vi.fn(async () =>
      okResponse({
        results: [
          {
            name: 'Varanasi',
            admin1: 'Uttar Pradesh',
            country: 'India',
            latitude: 25.31668,
            longitude: 83.01041,
            timezone: 'Asia/Kolkata',
          },
        ],
      })
    )
    vi.stubGlobal('fetch', mock)

    const out = await searchPlace('Varanasi')

    expect(mock).toHaveBeenCalledTimes(1)
    const url = mock.mock.calls[0][0]
    expect(url).toContain('geocoding-api.open-meteo.com/v1/search')
    expect(url).toContain('name=Varanasi')
    expect(url).toContain('count=8')
    expect(url).toContain('language=en')
    expect(url).toContain('format=json')

    expect(out).toHaveLength(1)
    expect(out[0]).toEqual({
      name: 'Varanasi',
      admin1: 'Uttar Pradesh',
      country: 'India',
      latitude: 25.31668,
      longitude: 83.01041,
      timezone: 'Asia/Kolkata',
    })
  })

  it('encodes the query and respects a custom count', async () => {
    const mock = vi.fn(async () => okResponse({ results: [] }))
    vi.stubGlobal('fetch', mock)

    await searchPlace('New Delhi', 5)

    const url = mock.mock.calls[0][0]
    expect(url).toContain('name=New%20Delhi')
    expect(url).toContain('count=5')
  })

  it('returns an empty list when the service has no matches', async () => {
    // Open-Meteo simply omits "results" when nothing is found.
    vi.stubGlobal('fetch', vi.fn(async () => okResponse({ generationtime_ms: 0.2 })))
    await expect(searchPlace('xqzwvxyznotreal')).resolves.toEqual([])
  })

  it('throws on HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    await expect(searchPlace('Varanasi')).rejects.toThrow('HTTP 500')
  })
})
