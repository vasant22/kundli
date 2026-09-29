// gen-validation.mjs — writes tests/PANCHANG_VALIDATION.md with our values
// pre-filled (place: MUMBAI). Regenerate after any formula change:
//   node scripts/panchang-calib/gen-validation.mjs
import fs from 'node:fs'
import { initEphemeris } from '../../src/astro.js'
import { computePanchang, sunriseKundli } from '../../src/panchang.js'
import {
  tithiLabel, nakshatraLabel, yogaLabel, karanaLabel, vaaraLabel, lunarMonthLabel,
  pakshaLabel, rituLabel, rashiLabel,
} from '../../src/i18n.js'

const MUMBAI = { latitude: 19.076, longitude: 72.8777, timeZone: 'Asia/Kolkata' }

const DATES = [
  ['15-01-2026', 'ऋतु (शिशिर) व मकर-काल्‍प की पुष्टि'],
  ['12-03-2026', '«पूरी रात» वाला तिथि-दृश्य (दशमी रात-भर चलती है)'],
  ['20-03-2026', 'संवत् परिवर्तन का दिन — शक 1948/पराभव शुरू (विक्रम पहले ही 2083)'],
  ['20-04-2026', 'एक दिन में दो तिथियाँ — तृतीया → चतुर्थी (दोनों अंत-समय)'],
  ['25-05-2026', 'अधिक ज्येष्ठ मास («(अधिक)» दिखना चाहिए)'],
  ['21-06-2026', 'संक्रांति-दिवस; ऋतु सूर्य की सायन स्थिति से (वर्षा)'],
  ['16-07-2026', 'प्रविष्टे सीमा (31 → अगले दिन 1); योग/करण दो-दो प्रविष्टियाँ'],
  ['29-09-2026', 'चार्ट व ग्रह-तालिका की हाथ-जाँच (नीचे अलग तालिका)'],
  ['17-10-2026', 'प्रविष्टे सीमा (31 → अगले दिन 2)'],
  ['23-03-2027', 'अगले वर्ष विक्रम-परिवर्तन (2084 शुरू)'],
]

const entryText = (e, name) => `${name} ${e.fullNight ? '«पूरी रात»' : 'तक ' + (e.endText ?? '—')}`
const listLimb = (entries, nameFn) => entries.map((e, i) => entryText(e, nameFn(e, i))).join('; ')

const swe = await initEphemeris()
let md = `# पंचांग — हाथ से जाँचने की सूची (Panchang Validation, Phase 9)

इन 10 तारीख़ों के लिए, किसी भरोसेमंद पंचांग (जैसे **drikpanchang.com** या **panchang.astrosage.com**) पर
**मुंबई (Mumbai)** चुनकर नीचे लिखे मान मिलाइए और अंतिम दो कॉलम भर दीजिए।
«हमारा परिणाम» पहले से भरा हुआ है (किसी भी सूत्र-बदलाव के बाद दोबारा बनाने के लिए:
«npm run panchang:validation»)।

- समय स्थानीय (IST) · सब कुछ **सूर्योदय-आधारित** है।
- स्वीकृत छोटे अंतर (विस्तार README में): तत्वों के अंत-समय में संदर्भ साइट से ~3 मिनट तक फ़र्क़ हो सकता है;
  «प्रविष्टे» में AstroSage की 2-तारीख़ वाली विचित्रता जान-बूझकर छोड़ी गई है (हमारा मान Drik से मिलता है); 29-03-2025 का करण
  किनारा (सूर्योदय से ~1 मिनट पहले/बाद) एक ज्ञात अपवाद है।

| # | तारीख़ (मुंबई) | इस तारीख़ की ख़ास जाँच | हमारा परिणाम | संदर्भ साइट परिणाम | मैच? |
|---|----------------|------------------------|--------------|--------------------|------|
`

let i = 0
for (const [dm, note] of DATES) {
  i += 1
  const [d, m, y] = dm.split('-').map(Number)
  const p = computePanchang(swe, { year: y, month: m, day: d, ...MUMBAI })
  const parts = [
    `तिथि: ${listLimb(p.tithi.entries, (e) => `${tithiLabel(e.index)} (${pakshaLabel(p.tithi.paksha)})`)}`,
    `नक्षत्र: ${listLimb(p.nakshatra.entries, (e) => nakshatraLabel(e.index))}`,
    `योग: ${listLimb(p.yoga.entries, (e) => yogaLabel(e.index))}`,
    `करण: ${listLimb(p.karana.entries, (e, j) => karanaLabel(p.karana.numbers[j]))}`,
    `वार: ${vaaraLabel(p.vaar)}`,
    `शक ${p.samvat.shaka} (${p.samvat.samvatsara.hi}) · विक्रम ${p.samvat.vikram} · कली ${p.samvat.kali}`,
    `प्रविष्टे ${p.pravishte.value} · मास: ${lunarMonthLabel(p.months.amanta.index, p.months.amanta.adhika)} (अमांत) / ${lunarMonthLabel(p.months.purnimanta.index, p.months.purnimanta.adhika)} (पूर्णिमांत)`,
    `ऋतु: ${rituLabel(p.ritu)} · चंद्रराशि: ${rashiLabel(p.moonSign)}`,
    `सूर्योदय ${p.sunrise} · सूर्यास्त ${p.sunset}`,
  ]
  md += `| ${i} | ${dm} | ${note} | ${parts.join(' · ')} | | |\n`
}

// Planet-table spot check (2026-09-29)
const [dd, mm2, yy] = [29, 9, 2026]
const pSep = computePanchang(swe, { year: yy, month: mm2, day: dd, ...MUMBAI })
const k = sunriseKundli(swe, pSep, { name: 'Mumbai', latitude: MUMBAI.latitude, longitude: MUMBAI.longitude })
md += `
## लग्न चार्ट व ग्रह-स्थिति की जाँच (सूर्योदय, 29-09-2026, मुंबई)

संदर्भ साइट पर उसी दिन मुंबई का «Lagna Chart at Sunrise / Planetary Position» देखकर मिलाइए:

- सूर्योदय: **${pSep.sunrise}** → लग्न (Asc): **${rashiLabel(k.ascendant.rashi)} ${k.ascendant.degInSign.toFixed(2)}°**
- चार्ट के तीन अंदाज़ (उत्तर/दक्षिण/पूर्व) — ग्रह-स्थिति तीनों में एक जैसी दिखेगी।

| ग्रह | राशि | अंश (DMS) | नक्षत्र | पद | संदर्भ साइट | मैच? |
|------|------|-----------|---------|-----|--------------|------|
`
const dms = (deg) => {
  let d = Math.floor(deg); let m = Math.floor((deg - d) * 60); let s = Math.round((((deg - d) * 60) - m) * 60)
  if (s === 60) { s = 0; m += 1 } if (m === 60) { m = 0; d += 1 }
  const p2 = (n) => String(n).padStart(2, '0')
  return `${d}°${p2(m)}'${p2(s)}"`
}
for (const g of k.planets) {
  md += `| ${g.name} | ${rashiLabel(g.rashi)} | ${dms(g.degInSign)} | ${nakshatraLabel(g.nakshatra)} | ${g.pada} | | |\n`
}

md += `
---
नोट: तत्वों के अंत-समय में संदर्भ साइट से 1–3 मिनट का फ़र्क़ *सामान्य* है (दोनों संदर्भ साइटें भी आपस में
~3–4 मिनट अलग होती हैं — विवरण README के «Panchang» भाग में)।
`

fs.writeFileSync(new URL('../../tests/PANCHANG_VALIDATION.md', import.meta.url), md)
console.log('written tests/PANCHANG_VALIDATION.md', md.length, 'bytes')
