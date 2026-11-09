// tests/bnn-teen-gyarah.test.js — राउंड 66 / टास्क 10
// (क) 3-11 संबंध: देशांतर का वृत्तीय अंतर 60° ± 3° → जुड़े (सदस्य केवल 7 ग्रह)।
// (ख) राहु-केतु मध्य बिंदु: राहु +90° / +270°, उसी mode की सीट ≤ 3° → पेटी में।
// स्रोत: TASK.md की 16 कुंडलियाँ (सर के software के screenshots; छह पर "(अपेक्षित …)" —
// यानी सर से अभी नहीं देखा गया, वे भी यहाँ तय हैं) + शुद्ध-स्थिति के उदाहरण।
import { beforeAll, describe, expect, it } from 'vitest'
import { initEphemeris } from '../src/astro.js'
import { computeBhavaChalit } from '../src/bnn/kp.js'
import { wallTimeToUtc } from '../src/timeutil.js'
import { rahuKetuMidpoint, threeElevenTable } from '../src/bnn/teen-gyarah.js'

const PLACES = {
  Boisar: [19.8036, 72.756], Gwalior: [26.2298, 78.1734], Mumbai: [19.076, 72.8777],
  Mapuca: [15.5937, 73.8142], Pune: [18.5204, 73.8567], Varanasi: [25.3176, 82.9739],
  Jaipur: [26.9124, 75.7873], Bhopal: [23.2599, 77.4126], Nagpur: [21.1458, 79.0882],
}
const ORDER_M = ['jupiter', 'sun', 'moon', 'mars', 'mercury', 'venus', 'saturn', 'rahu', 'ketu']
const ORDER_F = ['venus', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'saturn', 'rahu', 'ketu']
const SEVEN = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']
const SH = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' }

// ---- 16 कुंडलियाँ: [जन्म, समय, स्थान, स्त्री?, AP 3-11, AP मध्य बिंदु] ----
// 3-11 = केवल भरी पंक्तियाँ (क्रम सहित); बाक़ी सब ख़ाली होनी चाहिए।
const CHARTS = [
  { n: 1, date: '13-11-1997', time: '19:45', place: 'Boisar', sir: true,
    three: { jupiter: ['saturn'], saturn: ['jupiter'] }, mid: null },
  { n: 2, date: '11-06-1985', time: '05:15', place: 'Gwalior', sir: true,
    three: {}, mid: ['jupiter'] },
  { n: 3, date: '12-04-1989', time: '15:05', place: 'Mumbai', sir: true,
    three: { sun: ['venus'], venus: ['sun'] }, mid: null },
  { n: 4, date: '03-10-1996', time: '11:30', place: 'Mapuca', female: true, sir: true,
    three: { venus: ['moon'], moon: ['venus'] }, mid: ['jupiter'] },
  { n: 5, date: '18-08-1992', time: '09:12', place: 'Pune', sir: true,
    three: { moon: ['mars'], mars: ['moon'] }, mid: null },
  { n: 6, date: '18-07-1975', time: '09:06', place: 'Varanasi', sir: true,
    three: { mars: ['mercury'], mercury: ['mars'] }, mid: null },
  { n: 7, date: '09-07-1970', time: '20:57', place: 'Jaipur', sir: true,
    three: { jupiter: ['venus'], sun: ['saturn'], moon: ['mercury', 'mars'], mars: ['moon'],
      mercury: ['moon', 'saturn'], venus: ['jupiter'], saturn: ['mercury', 'sun'] }, mid: null },
  { n: 8, date: '25-03-1969', time: '05:54', place: 'Jaipur', sir: true,
    three: { moon: ['venus', 'saturn'], venus: ['moon'], saturn: ['moon'] }, mid: null },
  // #9, #10, #11, #14 — TASK.md में "(अपेक्षित …)" यानी सर से अभी नहीं देखा गया
  { n: 9, date: '27-09-1986', time: '16:20', place: 'Jaipur', sir: false,
    three: { sun: ['mars'], mars: ['sun'] }, mid: ['saturn'], midGap: 2 + 28 / 60 },
  { n: 10, date: '20-05-1965', time: '02:52', place: 'Jaipur', sir: false,
    three: { moon: ['saturn'], saturn: ['moon'] }, mid: ['mars', 'saturn'] },
  { n: 11, date: '27-07-1969', time: '05:21', place: 'Bhopal', sir: false,
    three: { sun: ['jupiter'], mars: ['jupiter'], jupiter: ['mars', 'sun'] }, mid: ['venus'] },
  { n: 12, date: '05-10-1984', time: '00:29', place: 'Nagpur', sir: false, three: {}, mid: null },
  { n: 13, date: '06-12-1978', time: '05:07', place: 'Bhopal', sir: false,
    three: {}, mid: ['mars'], midGap: 2 + 19 / 60 },
  { n: 14, date: '08-05-1978', time: '05:39', place: 'Pune', sir: false,
    three: { mars: ['venus'], venus: ['mars'] }, mid: ['mercury'], midGap: 0 + 29 / 60 },
  { n: 15, date: '24-06-1980', time: '23:13', place: 'Jaipur', sir: false,
    three: { jupiter: ['sun'], sun: ['jupiter'], moon: ['mars', 'saturn'], mars: ['moon'], saturn: ['moon'] },
    mid: ['moon'], midGap: 2 + 38 / 60 },
  { n: 16, date: '14-05-1964', time: '10:38', place: 'Pune', sir: true,
    three: { mars: ['saturn', 'venus'], mercury: ['saturn', 'venus'], venus: ['mars', 'mercury'],
      saturn: ['mars', 'mercury'] }, mid: null },
]
// #10 सर में `MAR . SAT` — दो ग्रह, इसलिए प्रभाव नहीं; क्रम पुरुष-पंक्ति का
const MID_TWO = new Set([10])

let swe
beforeAll(async () => { swe = await initEphemeris() }, 30000)

function chartOf(c) {
  const [d, m, y] = c.date.split('-').map(Number)
  const [h, mi] = c.time.split(':').map(Number)
  const utc = wallTimeToUtc({ year: y, month: m, day: d, hour: h, minute: mi, second: 0 }, '+05:30').utc
  const [lat, lon] = PLACES[c.place]
  return computeBhavaChalit(swe, utc, { latitude: lat, longitude: lon })
}
const rowsOf = (t) => {
  const out = {}
  for (const k of Object.keys(t)) if (t[k].length) out[k] = t[k].map((e) => e.key)
  return out
}

describe('सर के software की 16 कुंडलियाँ — 3-11 (AP)', () => {
  for (const c of CHARTS) {
    it('#' + c.n + ' ' + c.date + ' ' + c.place + (c.sir ? '' : ' (सर से पुष्टि बाक़ी)'), () => {
      const b = chartOf(c)
      const order = c.female ? ORDER_F : ORDER_M
      const t = threeElevenTable(b.planets, 'AP', order)
      expect(rowsOf(t)).toEqual(c.three)
      for (const k of SEVEN) {
        for (const e of t[k]) expect([SH[e.key], e.side === 3 || e.side === 11]).toEqual([SH[e.key], true])
      }
      // राहु-केतु की पंक्तियाँ दिखती हैं पर सदा ख़ाली
      expect(t.rahu).toEqual([])
      expect(t.ketu).toEqual([])
    })
  }
})

describe('सर के software की 16 कुंडलियाँ — राहु-केतु मध्य बिंदु (AP)', () => {
  for (const c of CHARTS) {
    it('#' + c.n + ' ' + c.date + (c.sir ? '' : ' (हमारा, सर से जान-बूझकर अलग)'), () => {
      const b = chartOf(c)
      const order = c.female ? ORDER_F : ORDER_M
      const r = rahuKetuMidpoint(b.planets, 'AP', order)
      expect(r.members.map((e) => e.key)).toEqual(c.mid || [])
      expect(r.effective).toBe(!!c.mid && !MID_TWO.has(c.n))
      expect(r.points.length).toBe(2)
      if (c.midGap != null) expect(Math.abs(r.members[0].gap - c.midGap)).toBeLessThanOrEqual(1 / 60 + 1e-9)
      // राहु-केतु के कारण बिंदु हमेशा जन्म के: दोनों बिंदु 180° पर
      let d = Math.abs(r.points[0] - r.points[1]); if (d > 180) d = 360 - d
      expect(Math.abs(d - 180)).toBeLessThan(1e-9)
    })
  }
})

describe('शुद्ध स्थिति — 3-11 के उदाहरण', () => {
  const S = { mesh: 0, vrish: 1, mithun: 2, kark: 3, simha: 4, kanya: 5, tula: 6, vrishchik: 7, dhanu: 8, makar: 9, kumbh: 10, meen: 11 }
  const P = (key, sign, degInSign, retro = false) => {
    const lon = S[sign] * 30 + degInSign
    return { key, longitude: lon, rashi: S[sign], degInSign, retro }
  }
  // दो ही ग्रह: बुध मिथुन में अपनी राशि, मंगल सिंह में — कोई परिवर्तन नहीं
  const two = (mercuryDeg, marsDeg) => [P('mercury', 'mithun', mercuryDeg), P('mars', 'simha', marsDeg)]
  it('notes: बुध मिथुन 25°57′ ↔ मंगल सिंह 24°55′ जुड़े; मंगल 21°00′ पर नहीं', () => {
    const a = threeElevenTable(two(25 + 57 / 60, 24 + 55 / 60), 'AP', ORDER_M)
    expect(a.mercury.map((e) => e.key)).toEqual(['mars'])
    expect(a.mars.map((e) => e.key)).toEqual(['mercury'])
    expect(a.mercury[0].side).toBe(3)      // मंगल बुध से ~59° आगे (3रा)
    const b = threeElevenTable(two(25 + 57 / 60, 21), 'AP', ORDER_M)
    expect(rowsOf(b)).toEqual({})
  })
  it('सीमा: 63°00′ जुड़ा, 63°01′ नहीं; 57°00′ जुड़ा, 56°59′ नहीं', () => {
    const at = (deg) => threeElevenTable([P('sun', 'mesh', 0), P('moon', 'mithun', deg)], 'AP', ORDER_M)
    const at2 = (sign, deg) => threeElevenTable([P('sun', 'mesh', 0), P('moon', sign, deg)], 'AP', ORDER_M)
    expect(at(3).sun.map((e) => e.key)).toEqual(['moon'])          // 63°00′
    expect(at(3 + 1 / 60).sun).toEqual([])                          // 63°01′
    expect(at2('vrish', 27).sun.map((e) => e.key)).toEqual(['moon'])     // 57°00′
    expect(at2('vrish', 27 - 1 / 60).sun).toEqual([])                    // 56°59′
  })
  it('राशि-पार: सिंह 29° ↔ कर्क 1° जुड़े (राशि-गिनती से 2री, फिर भी)', () => {
    const t = threeElevenTable([P('sun', 'simha', 29), P('moon', 'kark', 1)], 'AP', ORDER_M)
    expect(t.sun.map((e) => e.key)).toEqual(['moon'])
    expect(t.sun[0].side).toBe(11)
    expect(Math.abs(t.sun[0].gap - 2)).toBeLessThan(1e-9)
  })
  it('राहु-केतु सदस्य नहीं (कीर्ति: बुध↔राहु 61°23′ फिर भी ख़ाली)', () => {
    const t = threeElevenTable([P('mercury', 'mithun', 20), P('rahu', 'kark', 21 + 23 / 60, true)], 'AP', ORDER_M)
    expect(t.mercury).toEqual([])
    expect(t.rahu).toEqual([])
  })
})

describe('शुद्ध स्थिति — राहु-केतु मध्य बिंदु के उदाहरण', () => {
  const S = { mesh: 0, vrish: 1, mithun: 2, kark: 3, simha: 4, kanya: 5, tula: 6, vrishchik: 7, dhanu: 8, makar: 9, kumbh: 10, meen: 11 }
  const P = (key, sign, degInSign, retro = false) => {
    const lon = S[sign] * 30 + degInSign
    return { key, longitude: lon, rashi: S[sign], degInSign, retro }
  }
  const R = (degInSign) => P('rahu', 'mesh', degInSign, true)
  it('राहु मेष 22°, चंद्र कर्क 25° → MOO (ठीक 3°, अंदर); सूर्य मकर 28° बाहर', () => {
    const r = rahuKetuMidpoint([R(22), P('moon', 'kark', 25), P('sun', 'makar', 28)], 'AP', ORDER_M)
    expect(r.members.map((e) => e.key)).toEqual(['moon'])
    expect(r.members[0].gap).toBeCloseTo(3, 9)
    expect(r.effective).toBe(true)
    expect(r.points.map((x) => x.toFixed(3))).toEqual([(S.kark * 30 + 22).toFixed(3), (S.makar * 30 + 22).toFixed(3)])
  })
  it('राहु मेष 1°, ग्रह मिथुन 29° → अंदर (2°); 3°01′ पर बाहर', () => {
    expect(rahuKetuMidpoint([R(1), P('moon', 'mithun', 29)], 'AP', ORDER_M).members.map((e) => e.key)).toEqual(['moon'])
    const out = rahuKetuMidpoint([R(1), P('moon', 'mithun', 27 + 59 / 60)], 'AP', ORDER_M)
    expect(out.members).toEqual([])   // बिंदु कर्क 1° — 3°01′ दूर
  })
  it('राहु मेष 28°, बिंदु मकर 28°, ग्रह कुम्भ 0°30′ (बिंदु के बाद अगली राशि, 2°30′) → अंदर', () => {
    const r = rahuKetuMidpoint([R(28), P('saturn', 'kumbh', 0.5)], 'AP', ORDER_M)
    expect(r.members.map((e) => e.key)).toEqual(['saturn'])
    expect(r.members[0].gap).toBeCloseTo(2.5, 9)
  })
  it('दो ग्रह → members दो, effective=false; एक भी नहीं → effective=false', () => {
    const two = rahuKetuMidpoint([R(22), P('moon', 'kark', 25), P('sun', 'makar', 24)], 'AP', ORDER_M)
    expect(two.members.map((e) => e.key)).toEqual(['sun', 'moon'])
    expect(two.effective).toBe(false)
    expect(rahuKetuMidpoint([R(22), P('moon', 'kark', 8)], 'AP', ORDER_M).effective).toBe(false)
  })
  it('परिवर्तन: AP में बदली कुर्सी वाला गिना, BP में जन्म-स्थिति वाला', () => {
    // बुध सिंह 5°, सूर्य मिथुन 10° — परस्पर परिवर्तन (राशि-स्वामी)।
    // राहु मीन 10° → बिंदु मिथुन 10° और धनु 10°। AP में बुध की कुर्सी मिथुन 10° (बिंदु पर);
    // BP में बुध सिंह 5°, सूर्य मिथुन 10° पर।
    const pl = [
      P('mercury', 'simha', 5), P('sun', 'mithun', 10), P('moon', 'vrish', 3),
      P('mars', 'kanya', 20), P('jupiter', 'tula', 20), P('venus', 'vrishchik', 20),
      P('saturn', 'dhanu', 20), P('rahu', 'meen', 10, true), P('ketu', 'kanya', 10, true),
    ]
    const ap = rahuKetuMidpoint(pl, 'AP', ORDER_M)
    const bp = rahuKetuMidpoint(pl, 'BP', ORDER_M)
    expect(ap.members.map((e) => e.key)).toEqual(['mercury'])
    expect(bp.members.map((e) => e.key)).toEqual(['sun'])
    // क्रम पुरुष/स्त्री पंक्ति का: स्त्री में शुक्र पहले
    const two = rahuKetuMidpoint([R(22), P('moon', 'kark', 25), P('venus', 'makar', 24)], 'AP', ORDER_F)
    expect(two.members.map((e) => e.key)).toEqual(['venus', 'moon'])
  })
})
