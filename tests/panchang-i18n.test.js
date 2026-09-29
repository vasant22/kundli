// panchang-i18n.test.js — Phase 6: Panchang bilingual data lists + UI strings.
import { describe, expect, it } from 'vitest'
import {
  TITHIS, YOGAS, KARANAS, VAARAS, LUNAR_MONTHS, RITUS, SAMVATSARA_NAMES, DIRECTIONS,
  tithiLabel, yogaLabel, karanaLabel, vaaraLabel, lunarMonthLabel, rituLabel, samvatsaraLabel,
  getLang, setLang, t,
} from '../src/i18n.js'

const ALL = { TITHIS, YOGAS, KARANAS, VAARAS, LUNAR_MONTHS, RITUS, SAMVATSARA_NAMES, DIRECTIONS }

describe('Panchang bilingual lists', () => {
  it('has the right lengths', () => {
    expect(TITHIS).toHaveLength(30)
    expect(YOGAS).toHaveLength(27)
    expect(KARANAS).toHaveLength(11)
    expect(VAARAS).toHaveLength(7)
    expect(LUNAR_MONTHS).toHaveLength(12)
    expect(RITUS).toHaveLength(6)
    expect(SAMVATSARA_NAMES).toHaveLength(60)
    expect(DIRECTIONS).toHaveLength(8)
  })

  it('every entry has non-empty Hindi and English', () => {
    for (const [name, list] of Object.entries(ALL)) {
      list.forEach((item, i) => {
        expect(item.hi, `${name}[${i}] hi`).toBeTruthy()
        expect(item.en, `${name}[${i}] en`).toBeTruthy()
      })
    }
  })

  it('spot checks: tithis, yogas, karanas, vaaras, months, ritus, samvatsaras', () => {
    expect(tithiLabel(15)).toBe('पूर्णिमा / Purnima')
    expect(tithiLabel(30)).toBe('अमावस्या / Amavasya')
    expect(tithiLabel(18)).toBe('तृतीया / Tritiya') // Krishna Tritiya (separate paksha field)
    expect(yogaLabel(13)).toBe('व्याघात / Vyaghata')
    expect(yogaLabel(1)).toBe('विष्कुम्भ / Vishkambha')
    expect(yogaLabel(27)).toBe('वैधृति / Vaidhriti')
    expect(karanaLabel(6)).toBe('विष्टि / Vishti')
    expect(karanaLabel(10)).toBe('किंस्तुघ्न / Kimstughna')
    expect(vaaraLabel(2)).toBe('मंगलवार / Mangalavara')
    expect(lunarMonthLabel(5)).toBe('भाद्रपद / Bhadrapada')
    expect(lunarMonthLabel(2, true)).toBe('ज्येष्ठ (अधिक) / Jyeshtha (Adhik)')
    expect(rituLabel(3)).toBe('शरद / Sharad')
    expect(samvatsaraLabel(40)).toBe('पराभव / Parabhava')
    expect(samvatsaraLabel(38)).toBe('क्रोधी / Krodhi')
  })
})

describe('Panchang UI strings', () => {
  const KEYS = [
    'panchang.docTitle', 'panchang.title', 'panchang.subtitle', 'panchang.dateLabel',
    'panchang.placeLabel', 'panchang.searchPlace', 'panchang.getPanchang', 'panchang.calculating',
    'panchang.engineError', 'panchang.section.today', 'panchang.section.sunMoon',
    'panchang.section.monthYear', 'panchang.section.ashubha', 'panchang.section.shubha',
    'panchang.section.disha', 'panchang.section.bala', 'panchang.section.lagna',
    'panchang.section.planets', 'panchang.f.tithi', 'panchang.f.nakshatra', 'panchang.f.karana',
    'panchang.f.paksha', 'panchang.f.yoga', 'panchang.f.vaar', 'panchang.f.sunrise',
    'panchang.f.sunset', 'panchang.f.moonSign', 'panchang.f.moonrise', 'panchang.f.moonset',
    'panchang.f.ritu', 'panchang.f.shaka', 'panchang.f.vikram', 'panchang.f.kali',
    'panchang.f.pravishte', 'panchang.f.monthPurnimanta', 'panchang.f.monthAmanta',
    'panchang.f.dayDuration', 'panchang.upto', 'panchang.from', 'panchang.to', 'panchang.fullNight',
    'panchang.adhik', 'panchang.na', 'panchang.chart.north', 'panchang.chart.south',
    'panchang.chart.east', 'panchang.planets.modernNote', 'panchang.widget.title',
    'panchang.widget.button', 'panchang.errPlace',
  ]

  it('exists in BOTH languages (no missing keys)', () => {
    const prev = getLang()
    for (const lang of ['hi', 'en']) {
      setLang(lang)
      for (const key of KEYS) {
        const v = t(key)
        expect(v, `${key} [${lang}]`).toBeTruthy()
        expect(v, `${key} [${lang}] should not fall back to the key`).not.toBe(key)
      }
    }
    setLang(prev)
  })

  it('language switching changes section titles', () => {
    const prev = getLang()
    setLang('hi')
    expect(t('panchang.section.today')).toBe('आज का पंचांग')
    setLang('en')
    expect(t('panchang.section.today')).toBe('Panchang For Today')
    setLang(prev)
  })
})
