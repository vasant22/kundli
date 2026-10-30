// tests/bnn-vishesh-drishti-sir.test.js — राउंड 62 (Claude, 30-10-2026)
// सर के software के 5 चार्टों से विशेष दृष्टि (SAT3/SAT10/MAR4/MAR8) का मिलान।
// स्रोत: नियम-पुस्तिका चित्र अध्याय-10-चित्र-2, 24-चित्र-32, 27-चित्र-18, 28-चित्र-26/43,
// और दीपक (13-11-1997 19:45 बोईसर, AP) — MyAIHub/agents/autoclaw/reports/2026-10-30-*.
// नियम: दृष्टि-बिंदु पाने वाले ग्रह के *अपने पहले* 30° क्षेत्र में, पाने वाले की दिशा से।
import { describe, expect, it } from 'vitest'
import { planetCombinations } from '../src/bnn/combos.js'

const SIGN = { mesh: 0, vrish: 1, mithun: 2, kark: 3, simha: 4, kanya: 5, tula: 6, vrishchik: 7, dhanu: 8, makar: 9, kumbh: 10, meen: 11 }
const pos = (sign, dm) => { const [d, m] = dm.split('.').map(Number); return SIGN[sign] * 30 + d + m / 60 }
const P = (key, sign, dm, retro = false) => {
  const lon = pos(sign, dm)
  return { key, longitude: lon, rashi: Math.floor(lon / 30) % 12, degInSign: lon % 30, retro: retro || key === 'rahu' || key === 'ketu' }
}
const asp = (list) => list.filter((e) => e.type === 'aspect').map((e) => e.label).sort()
const ALL = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']
const check = (planets, mode, expected) => {
  const r = planetCombinations(planets, mode)
  for (const k of ALL) expect([k, asp(r[k].list1579)]).toEqual([k, (expected[k] || []).slice().sort()])
}

describe('सर के software से मिलान — विशेष दृष्टि', () => {
  it('चार्ट A (अध्याय-10): केवल MOO में SAT3; वक्री केतु में नहीं', () => {
    check([
      P('venus', 'mithun', '00.35'), P('mercury', 'mithun', '25.57'), P('sun', 'kark', '12.32'),
      P('rahu', 'simha', '04.56'), P('mars', 'simha', '24.55'), P('ketu', 'kumbh', '04.56'),
      P('moon', 'kumbh', '02.31'), P('jupiter', 'makar', '08.25', true), P('saturn', 'makar', '02.30', true),
    ], 'AP', { moon: ['SAT3'] })
  })
  it('चार्ट C (अध्याय-27): MOO SAT3 · MER# SAT10 · SAT MAR4 · KET MAR8', () => {
    check([
      P('ketu', 'mesh', '20.25'), P('sun', 'simha', '17.41'), P('mars', 'simha', '23.36'),
      P('mercury', 'simha', '29.12', true), P('jupiter', 'kanya', '12.05'), P('venus', 'kanya', '24.18'),
      P('rahu', 'tula', '20.25'), P('saturn', 'vrishchik', '14.49'), P('moon', 'dhanu', '17.44'),
    ], 'AP', { moon: ['SAT3'], mercury: ['SAT10'], saturn: ['MAR4'], ketu: ['MAR8'] })
  })
  const chartD = () => [
    P('rahu', 'meen', '25.27'), P('sun', 'meen', '23.28'), P('saturn', 'meen', '22.08'),
    P('mercury', 'meen', '05.54'), P('venus', 'meen', '03.47'), P('mars', 'mesh', '13.40'),
    P('moon', 'mithun', '29.14'), P('jupiter', 'simha', '02.46', true), P('ketu', 'kanya', '25.27'),
  ]
  it('चार्ट D (अध्याय-28) BP: MOO MAR4 · JUP# MAR4', () => {
    check(chartD(), 'BP', { moon: ['MAR4'], jupiter: ['MAR4'] })
  })
  it('चार्ट D (अध्याय-28) AP, सूर्य-गुरु परिवर्तन: SUN-90 में MAR4 (क्रम सहित)', () => {
    const r = planetCombinations(chartD(), 'AP')
    const order = r.sun.list1579.map((e) => (e.type === 'aspect' ? e.label : e.key))
    expect(order).toEqual(['rahu', 'jupiter', 'saturn', 'MAR4', 'mercury', 'venus'])
  })
  it('दीपक AP (गुरु-शनि परिवर्तन): JUP-90 = SAT3 MER MAR4 SUN KET', () => {
    const planets = [
      P('saturn', 'meen', '20.38', true), P('moon', 'mesh', '13.50'), P('ketu', 'kumbh', '22.27'),
      P('jupiter', 'makar', '20.22'), P('venus', 'dhanu', '14.13'), P('mars', 'dhanu', '09.27'),
      P('mercury', 'vrishchik', '14.43'), P('sun', 'tula', '27.24'), P('rahu', 'simha', '22.27'),
    ]
    const r = planetCombinations(planets, 'AP')
    const order = r.jupiter.list1579.map((e) => (e.type === 'aspect' ? e.label : e.key))
    expect(order).toEqual(['SAT3', 'mercury', 'MAR4', 'sun', 'ketu'])
    expect(asp(r.sun.list1579)).toEqual([]) // SAT3/MAR4 सूर्य के 5वें क्षेत्र में — नहीं गिने
  })
  it('बसंत (22-01-1980 20:30 बैतूल, AP, शनि-बुध परिवर्तन): सर जैसा — MOO MAR8, VEN SAT3', () => {
    check([
      P('moon', 'meen', '12.30'), P('venus', 'kumbh', '14.18'), P('ketu', 'kumbh', '07.10'),
      P('mercury', 'makar', '08.59'), P('sun', 'makar', '08.09'), P('rahu', 'simha', '07.10'),
      P('jupiter', 'simha', '15.30', true), P('mars', 'simha', '21.30', true), P('saturn', 'kanya', '03.12', true),
    ], 'AP', { moon: ['MAR8'], venus: ['SAT3'] })
  })
  // ज्ञात अपवाद (सर से पूछना बाक़ी): चार्ट B (अध्याय-24) — बुध# तुला 11.56 को MAR4 (तुला 10.41) नहीं मिलता।
  it.todo('चार्ट B: बुध# / MAR4 अपवाद')
})
