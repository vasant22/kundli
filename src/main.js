// main.js — Kundli app entry point.
// Phase 1 goal: confirm the Swiss Ephemeris WASM loads and calculates in the
// browser. The real input form UI is built in Phase 2.
import './style.css'
import SwissEph from 'swisseph-wasm'

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="page">
    <h1>कुंडली / Kundli</h1>
    <p id="status">⏳ Swiss Ephemeris load हो रहा है… (WASM)</p>
  </main>
`

const status = document.querySelector('#status')

async function smokeTest() {
  try {
    const swe = new SwissEph()
    await swe.initSwissEph()

    // 2000-01-01 12:00 UTC => known Julian Day 2451545.0
    const jd = swe.julday(2000, 1, 1, 12)

    // A real calculation to prove the engine runs (Sun longitude ~280.37°).
    const sun = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH)

    status.textContent =
      `✅ OK — Swiss Ephemeris चल गया। ` +
      `Test: JD ${jd} | Sun longitude ${sun[0].toFixed(2)}°`
  } catch (err) {
    console.error(err)
    status.textContent = `❌ Swiss Ephemeris load नहीं हुआ: ${err.message}`
    status.classList.add('error')
  }
}

smokeTest()
