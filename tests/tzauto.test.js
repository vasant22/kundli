// @vitest-environment jsdom
// tests/tzauto.test.js — अक्षांश-देशांतर से समय-क्षेत्र अपने-आप भरना (Open-Meteo)।
// Run with: npm test
import { afterEach, describe, expect, it, vi } from 'vitest'
import { attachTimezoneAutofill, lookupTimezone } from '../src/tzauto.js'

const okResponse = (payload) => ({ ok: true, json: async () => payload })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('lookupTimezone (Open-Meteo timezone=auto)', () => {
  it('URL सही बनती है और IANA नाम लौटता है', async () => {
    const mock = vi.fn(async () => okResponse({ timezone: 'Asia/Kolkata' }))
    vi.stubGlobal('fetch', mock)

    const tz = await lookupTimezone(10.111, 20.222)

    expect(tz).toBe('Asia/Kolkata')
    const url = mock.mock.calls[0][0]
    expect(url).toContain('api.open-meteo.com/v1/forecast')
    expect(url).toContain('latitude=10.111')
    expect(url).toContain('longitude=20.222')
    expect(url).toContain('timezone=auto')
  })

  it('एक ही जगह की दोबारा कॉल cache से — बिना नया request', async () => {
    const mock = vi.fn(async () => okResponse({ timezone: 'Asia/Kathmandu' }))
    vi.stubGlobal('fetch', mock)

    expect(await lookupTimezone(11.111, 21.222)).toBe('Asia/Kathmandu')
    expect(await lookupTimezone(11.111, 21.222)).toBe('Asia/Kathmandu')
    expect(mock).toHaveBeenCalledTimes(1)
  })

  it('गड़बड़/ख़ाली जवाब पर null — कभी throw नहीं', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline')
    }))
    expect(await lookupTimezone(12.111, 22.222)).toBeNull()

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    expect(await lookupTimezone(13.111, 23.222)).toBeNull()

    vi.stubGlobal('fetch', vi.fn(async () => okResponse({})))
    expect(await lookupTimezone(14.111, 24.222)).toBeNull()
  })
})

describe('attachTimezoneAutofill', () => {
  const setup = () => {
    document.body.innerHTML = '<input id="lat" /><input id="lon" /><input id="tz" />'
    return {
      lat: document.getElementById('lat'),
      lon: document.getElementById('lon'),
      tz: document.getElementById('tz'),
    }
  }
  const type = (el, value) => {
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('दोनों निर्देशांक भरते ही समय-क्षेत्र भर जाता है', async () => {
    const { lat, lon, tz } = setup()
    const states = []
    const mock = vi.fn(async () => okResponse({ timezone: 'Asia/Kolkata' }))
    vi.stubGlobal('fetch', mock)

    attachTimezoneAutofill({
      latEl: lat, lonEl: lon, tzEl: tz, delay: 20,
      onState: (s) => states.push(s),
    })

    type(lat, '21.4833')
    type(lon, '78.25')
    expect(mock).not.toHaveBeenCalled() // debounce — तुरंत नहीं

    await vi.waitFor(() => expect(tz.value).toBe('Asia/Kolkata'))
    expect(mock).toHaveBeenCalledTimes(1)
    expect(states).toEqual(['searching', 'filled'])
  })

  it('यूज़र का ख़ुद भरा समय-क्षेत्र नहीं छेड़ता', async () => {
    const { lat, lon, tz } = setup()
    const mock = vi.fn(async () => okResponse({ timezone: 'Asia/Kolkata' }))
    vi.stubGlobal('fetch', mock)
    attachTimezoneAutofill({ latEl: lat, lonEl: lon, tzEl: tz, delay: 20 })

    type(tz, '+05:30') // यूज़र ने ख़ुद भरा
    type(lat, '31.111')
    type(lon, '71.222')
    await sleep(80)

    expect(tz.value).toBe('+05:30')
    expect(mock).not.toHaveBeenCalled()
  })

  it('जगह बदलने पर फिर से भरता है (auto वाला मान हो तो)', async () => {
    const { lat, lon, tz } = setup()
    const mock = vi.fn(async (url) =>
      okResponse({ timezone: String(url).includes('latitude=41') ? 'America/New_York' : 'Asia/Kolkata' }))
    vi.stubGlobal('fetch', mock)
    attachTimezoneAutofill({ latEl: lat, lonEl: lon, tzEl: tz, delay: 20 })

    type(lat, '21.111')
    type(lon, '78.222')
    await vi.waitFor(() => expect(tz.value).toBe('Asia/Kolkata'))

    type(lat, '41.111') // अब अमेरिका वाली जगह
    await vi.waitFor(() => expect(tz.value).toBe('America/New_York'))
  })

  it('यूज़र द्वारा बदलने के बाद दोबारा auto नहीं', async () => {
    const { lat, lon, tz } = setup()
    const mock = vi.fn(async () => okResponse({ timezone: 'Asia/Kolkata' }))
    vi.stubGlobal('fetch', mock)
    attachTimezoneAutofill({ latEl: lat, lonEl: lon, tzEl: tz, delay: 20 })

    type(lat, '22.111')
    type(lon, '79.222')
    await vi.waitFor(() => expect(tz.value).toBe('Asia/Kolkata'))

    type(tz, '+05:30') // अब यूज़र का भरा हुआ
    type(lat, '23.111')
    await sleep(80)

    expect(tz.value).toBe('+05:30')
    expect(mock).toHaveBeenCalledTimes(1)
  })

  it('अवैध निर्देशांक पर कुछ नहीं', async () => {
    const { lat, lon, tz } = setup()
    const mock = vi.fn(async () => okResponse({ timezone: 'Asia/Kolkata' }))
    vi.stubGlobal('fetch', mock)
    attachTimezoneAutofill({ latEl: lat, lonEl: lon, tzEl: tz, delay: 20 })

    type(lat, '91') // सीमा से बाहर
    type(lon, '78.25')
    await sleep(80)

    expect(mock).not.toHaveBeenCalled()
    expect(tz.value).toBe('')
  })

  it('न मिलने पर notfound स्थिति — चुप, बिना अड़चन', async () => {
    const { lat, lon, tz } = setup()
    const states = []
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    attachTimezoneAutofill({
      latEl: lat, lonEl: lon, tzEl: tz, delay: 20,
      onState: (s) => states.push(s),
    })

    type(lat, '0.001')
    type(lon, '0.002')
    await vi.waitFor(() => expect(states).toContain('notfound'))
    expect(tz.value).toBe('')
  })
})
