// @vitest-environment jsdom
// tests/phal-report.test.js — report page (टास्क 03) की ढाँचा-जाँच.
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { buildPhalData } from '../src/phal/index.js'
import { renderReport, lordPlacements, yogaTextParts, yogaShown, dashaPersonalLine } from '../src/phal/report.js'
import { degMinHi } from '../src/phal/text.js'
import * as TX from '../src/phal/text-hi.js'

let swe
beforeAll(async () => { swe = await initEphemeris() }, 30000)

// 1985 की कुंडली — टास्क 03-ख के सारे उदाहरण इसी पर हैं (सूर्य 12वें, वग़ैरह).
const BIRTH_1985 = {
  utc: { year: 1985, month: 8, day: 15, hour: 2, minute: 0, second: 0 },
  latitude: 19.0728,
  longitude: 72.8826,
  timeZone: 'Asia/Kolkata',
  local: { year: 1985, month: 8, day: 15, hour: 7, minute: 30, second: 0 },
  name: 'जातक', gender: 'male', place: 'Mumbai',
}

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

describe('अंश-गोलाई (टास्क 03-ख §1)', () => {
  it('पहले कुल मिनट गोल, फिर अंश-मिनट', () => {
    expect(degMinHi(20.9999)).toBe('21° 00′')
    expect(degMinHi(0.004)).toBe('0° 00′')
    expect(degMinHi(7.04)).toBe('7° 02′')
    expect(degMinHi(9.5)).toBe('9° 30′')
  })

  it('राशि-सीमा नहीं लाँघी जाती', () => {
    expect(degMinHi(29.9999)).toBe('29° 59′')
    expect(degMinHi(29.999999)).toBe('29° 59′')
    expect(degMinHi(20.99999)).toBe('21° 00′')
  })

  it('report की किसी तालिका/चार्ट में "60′" नहीं', () => {
    for (const b of [BIRTH_1985, BIRTH]) {
      const html = renderReport(buildPhalData(swe, b, { nowMs: Date.UTC(2026, 10, 11) }))
      expect(html).not.toContain('60′')
      expect(html).not.toContain("60'")
      expect(html).not.toMatch(/\d°\s*60/)
    }
  })
})

describe('भावेश का फल — स्वामित्व-भाव से (टास्क 03-ख §2)', () => {
  it('1985: हर ग्रह के owns × बैठा-भाव की कोठरी', () => {
    const d = buildPhalData(swe, BIRTH_1985, { nowMs: Date.UTC(2026, 10, 11) })
    const got = {}
    for (const p of d.planets) got[p.key] = lordPlacements(p).map((x) => [x.own, x.inHouse])
    expect(got.sun).toEqual([[1, 12]])
    expect(got.moon).toEqual([[12, 12]])
    expect(got.mars).toEqual([[4, 12], [9, 12]])
    expect(got.mercury).toEqual([[2, 12], [11, 12]])
    expect(got.jupiter).toEqual([[5, 6], [8, 6]])
    expect(got.venus).toEqual([[3, 11], [10, 11]])
    expect(got.saturn).toEqual([[6, 3], [7, 3]])
    expect(got.rahu).toEqual([])
    expect(got.ketu).toEqual([])
  })

  it('हर पंक्ति में वही text जो LORD_IN_HOUSE की उस कोठरी में है', () => {
    const d = buildPhalData(swe, BIRTH_1985, { nowMs: Date.UTC(2026, 10, 11) })
    for (const p of d.planets) {
      for (const lp of lordPlacements(p)) {
        expect(lp.tx.t, `${p.key}[${lp.own}][${lp.inHouse}]`).toBe(TX.LORD_IN_HOUSE[lp.own][lp.inHouse].t)
      }
    }
    const sun = d.planets.find((p) => p.key === 'sun')
    const tx = TX.LORD_IN_HOUSE[1][12].t
    const html = renderReport(d)
    expect(html).toContain('पहले भाव का स्वामी होकर बारहवें भाव में')
    expect(html).toContain(tx.slice(0, 40))
    // और ग़लत कोठरी (बैठा-भाव = स्वामित्व) का text सूर्य के नीचे नहीं
    expect(lordPlacements(sun)[0].tx).not.toBe(TX.LORD_IN_HOUSE[12][12])
  })

  it('बारह भाव वाले अध्याय में हर भाव का भावेश-cell', () => {
    const d = buildPhalData(swe, BIRTH_1985, { nowMs: Date.UTC(2026, 10, 11) })
    const html = renderReport(d)
    for (const h of d.houses) {
      const lordHouse = d.planets.find((p) => p.key === h.lord).house
      expect(html, `भाव ${h.house}`).toContain(TX.LORD_IN_HOUSE[h.house][lordHouse].t.slice(0, 40))
    }
  })
})

describe('योग-text — शर्त पर ही (टास्क 03-ख §3)', () => {
  it('गजकेसरी: नीच/अस्त वाली बात detail में सच हो तभी', () => {
    const base = yogaTextParts({ id: 'gajakesari', detail: { weak: false } })
    expect(base).toHaveLength(1)
    const weak = yogaTextParts({ id: 'gajakesari', detail: { weak: true, debilitated: true, combust: false } })
    expect(weak).toHaveLength(2)
    expect(weak[1].t).toContain('इस कुंडली में गुरु नीच है')
  })

  it('बुधादित्य: बुध अस्त हो तभी वह वाक्य', () => {
    expect(yogaTextParts({ id: 'budhaditya', detail: { mercuryCombust: false } })).toHaveLength(1)
    const c = yogaTextParts({ id: 'budhaditya', detail: { mercuryCombust: true } })
    expect(c).toHaveLength(2)
    expect(c[1].t).toContain('इस कुंडली में बुध अस्त है')
  })

  it('केमद्रुम: भंग की बात केंद्र-ग्रह होने पर ही', () => {
    expect(yogaTextParts({ id: 'kemadruma', detail: { empty: true, bhanga: [] } })).toHaveLength(1)
    const b = yogaTextParts({ id: 'kemadruma', detail: { empty: true, bhanga: ['sun', 'mars'] } })
    expect(b).toHaveLength(2)
    expect(b[1].t).toContain('सूर्य, मंगल केंद्र में हैं')
    expect(b[1].t).toContain('भंग')
  })

  it('1985 में गजकेसरी कमज़ोर है — रिपोर्ट में कारण छपता है', () => {
    const html = renderReport(buildPhalData(swe, BIRTH_1985, { nowMs: Date.UTC(2026, 10, 11) }))
    expect(html).toContain('गजकेसरी')
    expect(html).toContain('इस कुंडली में गुरु नीच है')
  })

  it('योग-तालिका में सिर्फ़ बने योग खुलकर; बाक़ी एक पंक्ति', () => {
    const d = buildPhalData(swe, BIRTH_1985, { nowMs: Date.UTC(2026, 10, 11) })
    const html = renderReport(d)
    expect(html).toContain('इस कुंडली में ये योग नहीं बनते:')
    expect(html).toContain('रुचक योग')
    // रुचक का फल-text कहीं नहीं (वह योग बनता ही नहीं)
    expect(html).not.toContain(TX.YOGA_TEXT.ruchaka.t)
    // बने विपरीत योग अपने नाम और अपने text के साथ
    const sarala = d.yogas.list.find((y) => y.id === 'sarala')
    expect(sarala.present).toBe(true)
    expect(html).toContain(TX.YOGA_TEXT.sarala.t)
    expect(html).toContain('विपरीत')
  })

  it('आंशिक अधियोग खुलकर दिखता है', () => {
    const d = buildPhalData(swe, BIRTH_1985, { nowMs: Date.UTC(2026, 10, 11) })
    const adhi = d.yogas.list.find((y) => y.id === 'adhi')
    expect(adhi.partial).toBe(true)
    expect(yogaShown(adhi)).toBe(true)
  })
})

describe('दशा — व्यक्तिगत दशाफल (टास्क 03-ख §4)', () => {
  it('template भरता है: स्वामी + स्वामित्व-भाव + बैठा-भाव + विषय', () => {
    const line = dashaPersonalLine('venus', { owns: [3, 10], house: 11 })
    expect(line).toContain('इस दशा का स्वामी शुक्र')
    expect(line).toContain('तीसरे और दसवें भाव का स्वामी होकर ग्यारहवें भाव में बैठा है')
    expect(line).toContain('भाई-बहन, साहस, संवाद और छोटी यात्रा')
    expect(line).toContain('कर्म, पद, पहचान और ज़िम्मेदारी')
    expect(line).toContain('लाभ, मित्र और इच्छापूर्ति')
    expect(line).not.toContain('{')
  })

  it('राहु-केतु के लिए अलग रूप (वे किसी राशि के स्वामी नहीं)', () => {
    const line = dashaPersonalLine('rahu', { owns: [], house: 9 })
    expect(line).toContain('इस दशा का स्वामी राहु')
    expect(line).toContain('नौवें भाव में बैठा है')
    expect(line).not.toContain('का स्वामी होकर')
    expect(line).not.toContain('{')
  })

  it('1985 की चल रही दशा (शुक्र/राहु) रिपोर्ट में खुलकर आती है', () => {
    const d = buildPhalData(swe, BIRTH_1985, { nowMs: Date.UTC(2026, 10, 11) })
    expect(d.dasha.current.maha.key).toBe('venus')
    expect(d.dasha.current.antar.key).toBe('rahu')
    const html = renderReport(d)
    expect(html).toContain('तीसरे और दसवें भाव का स्वामी होकर ग्यारहवें भाव में बैठा है')
    expect(html).toContain('इसके भीतर राहु की अंतर्दशा चल रही है, जो नौवें भाव में बैठा है')
    expect(html).toContain('स्वामी · बैठा')
    expect(html).toContain('स्वामी: तीसरे, दसवें भाव · बैठा: ग्यारहवें भाव')
    // स्थिति की पंक्ति भी साथ
    expect(html).toMatch(/उच्च|नीच|स्वराशि|मूलत्रिकोण|मित्र|सम|शत्रु/)
  })
})
