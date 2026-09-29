// match.js — Kundli Matching (कुंडली मिलान) page, served at /match/.
// Phase 1: page shell + site navigation. Reuses the same modules and site
// chrome as the main app (astro.js, geocode.js, timeutil.js, i18n.js).
// Two-step boy → girl form follows in Phase 2; Ashtakoot Guna Milan +
// Mangal Dosha checks in later phases.
import './style.css'
import { t, getLang, setLang } from './i18n.js'

// Where the public source code lives (same repo as the main page).
const SOURCE_URL = 'https://github.com/vasant22/kundli'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="wrap">
    <header class="site-header">
      <div>
        <h1 data-i18n="match.title"></h1>
        <p class="sub" data-i18n="match.subtitle"></p>
        <nav class="site-nav">
          <a href="../" data-i18n="nav.home"></a>
          <a href="./" class="active" data-i18n="nav.match"></a>
        </nav>
      </div>
      <button id="lang-toggle" class="lang-toggle" type="button"></button>
    </header>

    <main>
      <section class="card match-intro-card">
        <p class="note" data-i18n="match.intro"></p>
      </section>
    </main>

    <footer class="site-footer">
      <p class="note" data-i18n="footer.privacy"></p>
      <p class="note footer-credit-line">
        <span data-i18n="footer.poweredBy"></span><a href="https://www.astro.com/swisseph/" target="_blank" rel="noopener">Swiss Ephemeris</a> (Astrodienst AG) ·
        <a class="footer-source" href="${SOURCE_URL}" target="_blank" rel="noopener" data-i18n="footer.source"></a>
      </p>
    </footer>
  </div>
`

const langToggle = document.querySelector('#lang-toggle')

// Same pattern as the main page: re-label everything in the active language.
function applyLanguage() {
  document.documentElement.lang = getLang()
  document.title = t('match.docTitle')
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n)
  })
  langToggle.textContent = t('lang.switchTo')
}

langToggle.addEventListener('click', () => {
  setLang(getLang() === 'hi' ? 'en' : 'hi')
  applyLanguage()
})

applyLanguage()
