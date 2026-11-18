// BNN Shakti — उपयोग की शर्तें: पहली बार खुलने पर स्वीकृति (संस्करण 1.0.6, Claude, 18-11-2026)
// -----------------------------------------------------------------------------
// • पहली बार (और शर्तों का संस्करण बदलने पर एक बार) खिड़की आती है; टिक किए बिना आगे नहीं।
// • स्वीकृति इसी computer/browser में दर्ज (localStorage: शर्तों का संस्करण + तारीख़) — कहीं भेजी नहीं जाती।
// • पूरी शर्तें: https://mybapuji.com/bnn-shakti-terms/ (desktop में बाहरी browser में खुलती हैं)।
// • शर्तें बदलें तो यहाँ TERMS_VERSION बढ़ाइए और page पर भी वही संस्करण लिखिए।
(function () {
  'use strict'

  var TERMS_VERSION = 1
  var KEY = 'bnn_terms_v1'
  var URL_ = 'https://mybapuji.com/bnn-shakti-terms/'

  var TXT = {
    hi: {
      title: '📜 उपयोग की शर्तें — कृपया पढ़कर स्वीकार करें',
      intro: 'BNN Shakti का उपयोग शुरू करने से पहले ये मुख्य बातें पढ़ लीजिए:',
      pts: [
        'BNN Shakti पूरी तरह <b>निःशुल्क</b> है — कोई login नहीं, कोई विज्ञापन नहीं। इसके लिए कोई पैसे माँगे तो वह हमारी ओर से नहीं है।',
        'कुंडली, तालिकाएँ, दशा, गोचर और फल केवल <b>अध्ययन और मार्गदर्शन</b> के लिए हैं — किसी परिणाम की <b>गारंटी नहीं</b>।',
        'यह <b>डॉक्टर, वैद्य, वकील या वित्तीय सलाहकार की जगह नहीं</b> है। स्वास्थ्य, क़ानूनी, पैसे या विवाह-नौकरी जैसे फ़ैसले केवल इसके भरोसे न लें।',
        'कोई भी ज्योतिषीय उपाय <b>इलाज नहीं</b> है — उपाय के कारण दवा या डॉक्टर की सलाह कभी न छोड़ें।',
        'Software <b>“जैसा है”</b> दिया गया है; गणना की किसी त्रुटि या उपयोग से हुई हानि की ज़िम्मेदारी बनाने वाले की नहीं। सही जन्म-विवरण भरें और ज़रूरी परिणाम स्वयं जाँचें।',
        'आपकी कुंडलियाँ <b>आपके ही computer में</b> रहती हैं, कहीं नहीं भेजी जातीं। बैकअप रखना आपकी ज़िम्मेदारी है; दूसरों का जन्म-विवरण उनकी अनुमति से ही रखें।',
        'Software को <b>बेचना, किराए पर देना, या नाम/brand बदलकर बाँटना मना</b> है।',
        '18 वर्ष से कम आयु के उपयोगकर्ता अभिभावक की देखरेख में उपयोग करें।',
        'भारतीय क़ानून लागू (न्यायक्षेत्र: पालघर, महाराष्ट्र) · गणना: Swiss Ephemeris (AGPL) · शहर: GeoNames (CC BY 4.0) · संपर्क: info@mybapuji.com'
      ],
      full: 'पूरी शर्तें पढ़ें (mybapuji.com)',
      ver: 'शर्तों का संस्करण ',
      check: 'मैंने उपयोग की शर्तें पढ़ लीं और उन्हें स्वीकार करता / करती हूँ।',
      go: 'स्वीकार करें और आगे बढ़ें',
      no: 'स्वीकार नहीं — बंद करें',
      noWeb: 'शर्तें स्वीकार किए बिना software का उपयोग नहीं किया जा सकता।',
      lang: 'English',
      done: 'धन्यवाद — शर्तें स्वीकार की गईं।'
    },
    en: {
      title: '📜 Terms of Use — please read and accept',
      intro: 'Before you start using BNN Shakti, please read these key points:',
      pts: [
        'BNN Shakti is completely <b>free</b> — no login, no ads. Anyone asking money for it is not acting for us.',
        'Charts, tables, dashas, transits and readings are for <b>study and guidance only</b> — <b>no outcome is guaranteed</b>.',
        'It is <b>not a substitute for a doctor, Ayurvedic physician, lawyer or financial adviser</b>. Do not make health, legal, money, marriage or career decisions on it alone.',
        'No astrological remedy is a <b>medical treatment</b> — never stop medicine or medical advice because of a remedy.',
        'The software is provided <b>“as is”</b>; its makers are not liable for calculation errors or losses from its use. Enter correct birth details and verify important results yourself.',
        'Your kundlis stay <b>on your own computer</b> and are never sent anywhere. Keeping backups is your responsibility; store other people’s birth details only with their consent.',
        '<b>Selling, renting, or re-branding</b> the software is not allowed.',
        'Users under 18 should use it under a guardian’s supervision.',
        'Governed by Indian law (jurisdiction: Palghar, Maharashtra) · Calculation: Swiss Ephemeris (AGPL) · Cities: GeoNames (CC BY 4.0) · Contact: info@mybapuji.com'
      ],
      full: 'Read the full terms (mybapuji.com)',
      ver: 'Terms version ',
      check: 'I have read the Terms of Use and I accept them.',
      go: 'Accept and continue',
      no: 'Do not accept — close',
      noWeb: 'The software cannot be used without accepting the terms.',
      lang: 'हिंदी',
      done: 'Thank you — terms accepted.'
    }
  }

  function lang() {
    try { if (window.BNNApp && window.BNNApp.lang) return window.BNNApp.lang() } catch (e) {}
    try { return localStorage.getItem('bnn_lang_v1') === 'en' ? 'en' : 'hi' } catch (e) { return 'hi' }
  }
  function T() { return TXT[lang()] || TXT.hi }
  function stored() {
    try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); return (j && typeof j === 'object') ? j : null } catch (e) { return null }
  }
  function accepted() { var s = stored(); return !!(s && Number(s.v) >= TERMS_VERSION) }
  function isDesktop() { return !!(window.desktop && window.desktop.isDesktop) }

  var wrap = null

  function openFull(ev) {
    if (ev) ev.preventDefault()
    if (window.desktop && window.desktop.openExternal) window.desktop.openExternal(URL_)
    else window.open(URL_, '_blank', 'noopener')
  }

  function render() {
    if (!wrap) return
    var t = T(), h = ''
    h += '<div class="tmBox" role="document"><div class="tmHead"><b id="tmTitle">' + t.title + '</b><span class="sp"></span>' +
      '<button type="button" class="btn small" id="tmLang">' + t.lang + '</button></div>'
    h += '<div class="tmBody"><p>' + t.intro + '</p><ol>'
    for (var i = 0; i < t.pts.length; i++) h += '<li>' + t.pts[i] + '</li>'
    h += '</ol><p class="tmFull"><a href="' + URL_ + '" id="tmFull">📄 ' + t.full + '</a> · <span class="tmVer">' + t.ver + TERMS_VERSION + '</span></p></div>'
    h += '<div class="tmFoot"><label class="tmChk"><input type="checkbox" id="tmChk"> <span>' + t.check + '</span></label>' +
      '<div class="tmBtns"><button type="button" class="btn" id="tmNo">' + t.no + '</button>' +
      '<button type="button" class="btn amber" id="tmGo" disabled>' + t.go + '</button></div>' +
      '<div class="tmMsg" id="tmMsg" hidden>' + t.noWeb + '</div></div></div>'
    var wasChecked = false
    var old = document.getElementById('tmChk'); if (old) wasChecked = old.checked
    wrap.innerHTML = h
    var chk = document.getElementById('tmChk'), go = document.getElementById('tmGo')
    chk.checked = wasChecked; go.disabled = !wasChecked
    chk.addEventListener('change', function () { go.disabled = !chk.checked })
    go.addEventListener('click', accept)
    document.getElementById('tmNo').addEventListener('click', decline)
    document.getElementById('tmFull').addEventListener('click', openFull)
    document.getElementById('tmLang').addEventListener('click', function () {
      var b = document.getElementById('btnLang')
      if (b) b.click()                    // ऐप की भाषा बदलो → 'bnn:lang' से यह खिड़की भी बदलती है
      else { try { localStorage.setItem('bnn_lang_v1', lang() === 'en' ? 'hi' : 'en') } catch (e) {} render() }
    })
  }

  function show() {
    if (!wrap) {
      wrap = document.createElement('div')
      wrap.id = 'termsModal'
      wrap.className = 'tmWrap'
      wrap.setAttribute('role', 'dialog')
      wrap.setAttribute('aria-modal', 'true')
      wrap.setAttribute('aria-labelledby', 'tmTitle')
      document.body.appendChild(wrap)
      document.addEventListener('bnn:lang', function () { if (wrap && !wrap.hidden) render() })
      // खिड़की खुली हो तो पीछे के ऐप में कुंजियाँ न जाएँ (Tab खिड़की के भीतर)
      document.addEventListener('keydown', function (ev) {
        if (!wrap || wrap.hidden) return
        if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); return }
        if (ev.key === 'Tab') {
          var f = wrap.querySelectorAll('button:not([disabled]), input, a[href]')
          if (!f.length) return
          var first = f[0], last = f[f.length - 1]
          if (!wrap.contains(document.activeElement)) { ev.preventDefault(); first.focus(); return }
          if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus() }
          else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus() }
        }
      }, true)
    }
    render()
    wrap.hidden = false
    document.body.classList.add('termsOpen')
    try { document.getElementById('tmChk').focus() } catch (e) {}
  }

  function accept() {
    var chk = document.getElementById('tmChk')
    if (!chk || !chk.checked) return
    try { localStorage.setItem(KEY, JSON.stringify({ v: TERMS_VERSION, at: new Date().toISOString() })) } catch (e) {}
    if (wrap) wrap.hidden = true
    document.body.classList.remove('termsOpen')
    try { var t = document.getElementById('toast'); if (t) { t.textContent = T().done; t.hidden = false; setTimeout(function () { t.hidden = true }, 2500) } } catch (e) {}
  }

  function decline() {
    if (isDesktop()) { try { window.close() } catch (e) {} }
    var m = document.getElementById('tmMsg'); if (m) m.hidden = false
  }

  function init() {
    if (/^#demo/.test(location.hash || '')) return       // AutoClaw/जाँच के demo पते — खिड़की नहीं
    if (!accepted()) show()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()

  window.BNNTerms = {
    version: TERMS_VERSION,
    url: URL_,
    accepted: accepted,
    record: stored,
    show: show,
    isOpen: function () { return !!(wrap && !wrap.hidden) }
  }
})()
