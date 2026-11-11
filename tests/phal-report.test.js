// @vitest-environment jsdom
// tests/phal-report.test.js — report page (टास्क 03) की ढाँचा-जाँच.
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { buildPhalData } from '../src/phal/index.js'
import { renderReport } from '../src/phal/report.js'

let swe
beforeAll(async () => { swe = await initEphemeris() }, 30000)

const BIRTH = {
  utc: { year: 1990, month: 5, day: 15, hour: 9, minute: 0, second: 0 },
  latitude: 25.31668,
  longitude: 83.01041,
  timeZone: 'Asia/Kolkata',
  local: { year: 1990, month: 5, day: 15, hour: 14, minute: 30, second: 0 },
  name: 'राम', gender: 'male', place: 'Varanasi',
}

describe('renderReport', () => {
  it('चौदहों अध्याय बनते हैं और नाम भर जाता है', () => {
    const html = renderReport(buildPhalData(swe, BIRTH, { nowMs: Date.UTC(2026, 10, 11) }))
    for (const title of ['जन्म कुंडली फलादेश', 'विषय-सूची', 'एक नज़र में', 'जन्म-विवरण और अवकहड़ा',
      'मुख्य कुंडलियाँ', 'ग्रह और उनकी स्थिति', 'बारह भाव', 'षोडश वर्ग', 'षष्ट्यंश (D60)',
      'योग और दोष', 'विंशोत्तरी दशा', 'साढ़ेसाती, ढैया और आज का गोचर', 'अष्टकवर्ग',
      'उपाय और रत्न', 'शब्दकोश और गणना-पद्धति']) {
      expect(html, title).toContain(title)
    }
    expect(html).toContain('राम')
    expect(html).toContain('mybapuji.com')
    expect(html).toContain('॥ शुभमस्तु ॥')
  })

  it('हर अध्याय की शुरुआत में "यह भाग" वाली पेटी है', () => {
    const html = renderReport(buildPhalData(swe, BIRTH, { nowMs: Date.UTC(2026, 10, 11) }))
    const chapters = (html.match(/<section class="chapter/g) ?? []).length
    expect(chapters).toBeGreaterThanOrEqual(13)
    // हर अध्याय (विषय-सूची सहित) की अपनी "यह भाग क्या बताता है" पेटी
    expect((html.match(/class="ch-intro"/g) ?? []).length).toBe(chapters)
  })

  it('tone-चिह्न रंग के साथ शब्द भी दिखाते हैं', () => {
    const html = renderReport(buildPhalData(swe, BIRTH, { nowMs: Date.UTC(2026, 10, 11) }))
    expect(html).toMatch(/tone-(shubh|mishr|savdhan)/)
    expect(html).toMatch(/शुभ|मिश्र|सावधानी/)
  })

  it('कहीं "1वें / 12वें" जैसा अंक-रूप नहीं', () => {
    const html = renderReport(buildPhalData(swe, BIRTH, { nowMs: Date.UTC(2026, 10, 11) }))
    const text = html.replace(/<[^>]+>/g, ' ')
    expect(text).not.toMatch(/[०-९0-9]\s*वें/)
  })

  it('किसी दूसरे software/website या व्यक्ति का नाम नहीं', () => {
    const html = renderReport(buildPhalData(swe, BIRTH, { nowMs: Date.UTC(2026, 10, 11) }))
    const low = html.toLowerCase()
    for (const n of ['astrosage', 'drik', 'prokerala', 'jhora', 'claude', 'chatgpt', 'openclaw']) {
      expect(low.includes(n), n).toBe(false)
    }
  })

  it('data न मिले तो साफ़ संदेश (कोई crash नहीं)', () => {
    expect(renderReport(null)).toContain('कुंडली नहीं बन सकी')
    expect(renderReport({ error: 'polar' })).toContain('कुंडली नहीं बन सकी')
  })
})
