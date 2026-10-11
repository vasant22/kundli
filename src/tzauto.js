// tzauto.js — अक्षांश-देशांतर से समय क्षेत्र अपने-आप भरना (Open-Meteo, timezone=auto)।
//
// जब यूज़र manual भाग में latitude/longitude भरता है, हम Open-Meteo के free
// forecast endpoint से उस जगह का IANA समय क्षेत्र लेकर 'समय क्षेत्र' वाला खाना
// अपने-आप भर देते हैं। नियम:
//  • यूज़र का ख़ुद भरा हुआ समय क्षेत्र कभी नहीं छेड़ते (सिर्फ़ ख़ाली खाने पर,
//    या जब पहले हमने ही भरा हो)।
//  • स्वयंसेवा कॉल कम हों — टाइपिंग रुकने पर (~600 ms) एक बार; नतीजा cache।
//  • नेटवर्क/सेवा न मिले → चुपचाप छोड़ दो — यूज़र ख़ुद भर सकता है (पुराना तरीक़ा)।
// तीनों forms (कुंडली · कुंडली-मिलान · BNN) इसी helper का उपयोग करते हैं।

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const TIMEOUT_MS = 10000

const cache = new Map() // "lat,lon" → समय क्षेत्र का नाम (सिर्फ़ कामयाब लुकअप)
const norm = (n) => Math.round(n * 1000) / 1000

/** निर्देशांकों से IANA समय क्षेत्र। न मिले/गड़बड़ हो → null (कभी throw नहीं)। */
export async function lookupTimezone(lat, lon) {
  const key = `${norm(lat)},${norm(lon)}`
  if (cache.has(key)) return cache.get(key)

  const url = `${ENDPOINT}?latitude=${lat}&longitude=${lon}&timezone=auto&forecast_days=1`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let tz = null
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (res.ok) {
      const data = await res.json()
      if (data && typeof data.timezone === 'string' && data.timezone !== '') tz = data.timezone
    }
  } catch {
    tz = null // ऑफ़लाइन / टाइमआउट — चुपचाप छोड़ दें
  } finally {
    clearTimeout(timer)
  }
  if (tz) cache.set(key, tz)
  return tz
}

/**
 * अक्षांश/देशांतर के खानों पर नज़र; दोनों भरते ही समय-क्षेत्र अपने-आप भरो।
 * @param {object} o
 * @param {HTMLInputElement} o.latEl
 * @param {HTMLInputElement} o.lonEl
 * @param {HTMLInputElement} o.tzEl
 * @param {(state: ''|'searching'|'filled'|'notfound') => void} [o.onState]
 * @param {number} [o.delay=600] — टाइपिंग रुकने के बाद इंतज़ार (ms)
 * @returns {{ detach: () => void }}
 */
export function attachTimezoneAutofill({ latEl, lonEl, tzEl, onState, delay = 600 }) {
  let timer = null
  let seq = 0
  let autoValue = null // यह मान हमने भरा था
  const say = (s) => {
    if (onState) onState(s)
  }

  const owned = () => tzEl.value === '' || tzEl.value === autoValue
  const inRange = (v, lim) => v !== '' && Number.isFinite(Number(v)) && Math.abs(Number(v)) <= lim

  async function run() {
    const latS = latEl.value.trim()
    const lonS = lonEl.value.trim()
    if (!inRange(latS, 90) || !inRange(lonS, 180)) return
    if (!owned()) return // यूज़र ख़ुद भर चुका — मत छेड़ो

    const my = ++seq
    say('searching')
    const tz = await lookupTimezone(Number(latS), Number(lonS))
    if (my !== seq) return // कोई नया टाइप जीत गया
    if (!tz) {
      say('notfound')
      return
    }

    autoValue = tz
    tzEl.value = tz
    tzEl.dispatchEvent(new Event('input', { bubbles: true }))
    say('filled')
  }

  function schedule() {
    if (!owned()) return // यूज़र ने ख़ुद भरा है — मत छेड़ो
    clearTimeout(timer)
    timer = setTimeout(run, delay)
  }

  function onTzInput() {
    if (tzEl.value !== autoValue) {
      // यूज़र ने ख़ुद बदल दिया — अब हम दोबारा नहीं भरेंगे
      autoValue = null
      say('')
    }
  }

  latEl.addEventListener('input', schedule)
  lonEl.addEventListener('input', schedule)
  tzEl.addEventListener('input', onTzInput)

  return {
    detach() {
      clearTimeout(timer)
      latEl.removeEventListener('input', schedule)
      lonEl.removeEventListener('input', schedule)
      tzEl.removeEventListener('input', onTzInput)
    },
  }
}
