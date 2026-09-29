// scratch: validate panchang.js vs the AstroSage Sep 29 2026 fixture
import { computePanchang } from '../../src/panchang.js'
import { initEphemeris } from '../../src/astro.js'

const swe = await initEphemeris()

const p = computePanchang(swe, {
  year: 2026, month: 9, day: 29,
  latitude: 28.6139, longitude: 77.209, timeZone: 'Asia/Kolkata',
})
console.log('vaar:', p.vaar, '(expect 2 = Tuesday)')
console.log('tithi:', p.tithi.index, p.tithi.paksha, 'entries:', p.tithi.entries.map(e => `${e.index}@${e.endText ?? 'FULLNIGHT'}`), '(expect 18 krishna, 17:11:53)')
console.log('nakshatra:', p.nakshatra.index, p.nakshatra.entries.map(e => `${e.index}@${e.endText}`), '(expect 1, 09:04:04)')
console.log('yoga:', p.yoga.index, p.yoga.entries.map(e => `${e.index}@${e.endText}`), '(expect 13, 13@06:12:55 & 14@27:20:03)')
console.log('karana:', JSON.stringify(p.karana.numbers), p.karana.entries.map(e => `${e.index}@${e.endText}`), '(expect [5,6], 35@06:15:25 & 36@17:11:53)')
console.log('samvat:', JSON.stringify(p.samvat), '(expect shaka 1948 vikram 2083 kali 5127 Parabhava#40)')
console.log('pravishte:', JSON.stringify(p.pravishte), '(expect value 13 mode A/B ~)')
console.log('months:', JSON.stringify(p.months), '(expect amanta bhadrapada 5, purnimanta ashwin 6)')
console.log('ritu:', p.ritu, '(expect 3 = Sharad)')
console.log('moonSign:', p.moonSign, '(expect 0 = Mesha)')
console.log('dayDuration:', p.dayDuration, '(ref 11:57:22)')
console.log('sunrise/sunset:', p.sunrise, p.sunset, '(ref 06:12:41 / 18:10:03)')
console.log('nextSunrise:', p.nextSunrise)
