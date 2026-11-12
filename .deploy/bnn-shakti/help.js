// BNN Shakti — सहायता (राउंड 65 / टास्क 04, 4-11-2026)
// -----------------------------------------------------------------------------
// सारी सामग्री यहीं है, ताकि आगे बदलना आसान हो (कोई गणना या ऐप का कोड नहीं छूना पड़ता)।
// हर विषय में 5–10 पंक्तियाँ, सरल हिंदी। BNN के सूत्रों की व्याख्या यहाँ नहीं है —
// वह course का काम है; यहाँ सिर्फ़ "कहाँ क्या दिखता है"।
// Desktop में बाहरी link बाहरी browser में खुलते हैं (window.desktop.openExternal)।
(function () {
  'use strict'

  // निःशुल्क course का link — **ऐप में तय नहीं**। यह server की version.json के `courseUrl`
  // खेत से आता है (राउंड 65 / टास्क 04-ख), ताकि course publish होते ही सिर्फ़ server की
  // file बदलनी पड़े, नया build नहीं। ख़ाली/ग़लत domain → link दिखता ही नहीं।
  var COURSE_URL = ''
  // राउंड 67 / टास्क 12: संस्करण सहायता में साफ़ दिखे — वही एक स्रोत (version.js)
  var VER = (window.BNNSemver && window.BNNSemver.appVersion) ? window.BNNSemver.appVersion : ''

  var T = [
    {
      id: 'is-sanskar',
      title: 'इस संस्करण में नया' + (VER ? ' (' + VER + ')' : ''),
      lines: [
        (VER ? 'संस्करण ' + VER + ' — ' : '') + 'नया “3-11” tab: ग्रह तालिका में SPECIAL और PRSSS के बीच; जो दो ग्रह 60° ±3° पर बैठे हों (तीसरे/ग्यारहवें), उनका संबंध — ये संशोधक ग्रह हैं।',
        '“राहु-केतु मध्य बिंदु” की पेटी अब चार्ट के ऊपर-दाएँ बड़े रूप में (ग्रह न हों तो भी पूरा आकार, “—” सहित); उसके आमने-सामने “परिवर्तन” की बराबर बड़ी पेटी।',
        'दोनों Print, PDF और ऑल चार्ट (PNG) में भी आते हैं। नया संस्करण आने पर ऊपर की पट्टी में उसका नाम दिखता है (web पर पुरानी files दिखें तो “ताज़ा करें” बटन)।'
      ]
    },
    {
      id: 'naya',
      title: 'नई कुंडली बनाना · सहेजना · खोलना',
      lines: [
        'बाईं पट्टी में सबसे ऊपर “कुंडली खोजें” है — नीचे की सूची में आपकी सहेजी कुंडलियाँ दिखती हैं।',
        '“＋ नई कुंडली” दबाइए, फ़ॉर्म भरिए, फिर “💾 सहेजें” (सूची में जुड़ जाएगी) या “कुंडली देखें →” (बिना सहेजे भी देख सकते हैं)।',
        'संदर्भ क्रमांक (Ref) अपने-आप बढ़ता है; किसी पुरानी कुंडली पर क्लिक करने पर वह फ़ॉर्म में खुल जाती है — बदलकर फिर सहेज सकते हैं।',
        'खोज: Ref No / नाम / ग्रुप / मोबाइल में से चुनकर ऊपर के खाने में लिखिए; नाम के आगे 📁 वाले बटन से भी सहेजी कुंडलियों की सूची खुलती है।',
        'ग्रुप बदलने के लिए “＋ नया ग्रुप” — जैसे परिवार, मित्र, ग्राहक।'
      ]
    },
    {
      id: 'vivaran',
      title: 'स्थान, समय और लिंग',
      lines: [
        'जन्म स्थान अंग्रेज़ी में लिखना सबसे आसान है — जैसे “B” लिखते ही Boisar जैसे सुझाव आते हैं; ↑↓ और Enter से चुनिए (या माउस से)।',
        'स्थान चुनते ही अक्षांश, देशांतर, GMT अपने-आप भर जाते हैं। ज़रूरत हो तो हाथ से भी बदल सकते हैं।',
        'समय 24 घंटे के ढंग से — “14:47” या “14:47:32”; सेकंड लिखना ज़रूरी नहीं।',
        'गर्मी की छुट्टी वाला समय (DST) हो तो “लागू — घड़ी 1 घंटा आगे थी” पर टिक लगाइए।',
        'पुराने जन्म: 1 सितंबर 1942 से 14 अक्टूबर 1945 तक भारत में युद्ध-समय (+06:30) चलता था — उस दौर के जन्म में DST पर टिक कीजिए (5:30 + 1 = 6:30)।',
        '01-01-1906 से पहले के जन्म में ऐप अपने-आप स्थानीय समय (LMT = देशांतर ÷ 15) भर देता है और नीचे सूचना दिखाता है — चाहें तो बदल सकते हैं। जो offset आपने ख़ुद लिखा हो, उसे ऐप कभी नहीं बदलता।',
        'बॉम्बे (1955 तक, +04:51) या कलकत्ता (1948 तक, +05:53:20) का पुराना जन्म हो तो ऐप सिर्फ़ सूचना दिखाता है — offset अपने-आप नहीं बदलता; जानकारी मिलने पर ख़ुद भर लीजिए।',
        'लिंग (पुरुष / स्त्री) चुनना ज़रूरी है — इससे चार्ट और तालिकाओं में ग्रहों का क्रम बदलता है।'
      ]
    },
    {
      id: 'chart',
      title: 'चार्ट पढ़ना — शैली, रंग और चिह्न',
      lines: [
        'उत्तर भारतीय या दक्षिण भारतीय शैली — “⚙ सेटिंग्स → डिफ़ॉल्ट चार्ट” में चुनिए; बदलते ही खुली कुंडली का चार्ट बदल जाता है।',
        'चार्ट के कोनों/खानों में 01 से 12 अंक भाव हैं; हर खाने में ग्रह के कोड (SUN, MOO, MAR, MER, JUP, VEN, SAT, RAH, KET) और उनकी डिग्री लिखी है।',
        'ग्रह के कोड के आगे # का मतलब वक्री (उलटा चल रहा) है — राहु/केतु पर # नहीं लगता।',
        'गोचर मोड में नीले रंग का लग्न गोचर का लग्न होता है (जन्म का नहीं)।',
        'तालिकाओं में रंग: पहला (नीला) = उस पंक्ति का मुख्य ग्रह; हरा = 20% या ज़्यादा बल वाला सदस्य (और शनि सदा हरा; ग्रह-तालिका में वक्री मंगल, बुध, गुरु, शुक्र भी सदा हरा); नारंगी = 20% से कम।',
        'किसी ग्रह पर माउस ले जाइए — छोटा बक्सा खुलता है: नक्षत्र-पद, बैठा भाव/राशि/डिग्री, स्वामी भाव, फल भाव और तारा-स्वामी; साथ में चार्ट पर घेरा और तीर भी बनते हैं।'
      ]
    },
    {
      id: 'bpap',
      title: 'BP और AP — और कौन-सी तालिका कहाँ',
      lines: [
        'BP = परिवर्तन से पहले, AP = परिवर्तन के बाद — चार्ट के नीचे की पट्टी में BP | AP | गोचर चार्ट से बदलिए।',
        'BHAVA COMBINATION: 12 पंक्तियाँ (B01–B12)। ऊपर के tabs: 1-5-9, 1-5-7-9, BRSSS, SPECIAL।',
        'PLANET COMBINATION: 9 पंक्तियाँ, हर ग्रह के कोड से; पंक्ति के नाम के आगे भाव-बिंदु अंक भी (जैसे JUP#-15)। tabs: 1-5-7-9, 1-5-9, SPECIAL, 3-11, PRSSS।',
        'SPECIAL: भाव की तालिका में चार खाने — LORD (स्वामी), PLANETS(A) (उस भाव में बैठे ग्रह), IN STAR OF A (उनका तारा-स्वामी) और फलदाता; ग्रह की तालिका में स्वामी · बैठा → देता · तारा · फलदाता।',
        'Astronomy (ग्रह-साथी): PLANET तालिका (1-5-7-9 / 1-5-9) की हर पंक्ति के आख़िर में एक खाना है — उस ग्रह का साथी ग्रह; न हो तो “—”।',
        'PRSSS और BRSSS अपने-अपने tabs में — जन्म के ग्रहों/भाव-संधियों के आधार पर बनी सूचियाँ।',
        '12 भावों से जुड़ी तालिकाएँ नीचे-ऊपर एक ही क्रम में हैं; कोई भाव ख़ाली दिखे तो उस भाव में उस शर्त का कोई ग्रह नहीं।'
      ]
    },
    {
      id: 'teen',
      title: '3-11 संबंध और राहु-केतु मध्य बिंदु',
      lines: [
        'PLANET COMBINATION में नया tab “3-11” — 3-11 Link (60° ±3°): जिन दो ग्रहों के देशांतर का अंतर 60° के आस-पास ±3° हो (57° से 63° तक, दोनों सिरे शामिल), वे एक-दूसरे से जुड़े दिखते हैं।',
        'यह संबंध राशि-सीमा से नहीं रुकता — सिर्फ़ कोण गिना जाता है; जोड़ी दोनों पंक्तियों में दिखती है (A में B, B में A) और राहु-केतु इसमें नहीं गिने जाते।',
        'इन ग्रहों को “संशोधक” समझिए — 1-5-7-9 के संयोजन का फल बढ़ाते या घटाते हैं; मुख्यतः तब देखिए जब 1-5-7-9 में उनका कोई साथी न हो। खाने पर माउस ले जाने से “3रा/11वाँ · अंतर” दिखता है।',
        'चार्ट के ऊपर-दाएँ कोने के बाहर छोटी पीच पेटी = राहु-केतु मध्य बिंदु (±3°) — Rahu-Ketu midpoint: राहु से 90° और 270° पर दो बिंदु; उनसे 3° के भीतर बैठा ग्रह उसमें लिखा दिखता है (पहले या बाद — दोनों तरफ़ बराबर)।',
        'एक ही ग्रह हो तो उसका कारकत्व जाता है; एक से अधिक हों तो नीचे “एक से अधिक — प्रभाव नहीं” लिखा आ जाता है। पेटी पर माउस ले जाने से दोनों बिंदुओं की राशि-डिग्री दिखती है; कोई ग्रह न हो तो पेटी ख़ाली रहती है।'
      ]
    },
    {
      id: 'dasha',
      title: 'दशा — महादशा, भुक्ति, अंतर',
      lines: [
        'दाहिनी ओर “VIMSHOTTARI — DHASA / BHUKTHI / ANDHIRAM” में तीन tabs हैं।',
        'DHASA में 9 महादशाएँ — अंत तिथि और उस समय की आयु के साथ। पीली पंक्ति = आज चल रही महादशा।',
        'किसी महादशा पर क्लिक कीजिए → उसकी 9 भुक्तियाँ; किसी भुक्ति पर क्लिक कीजिए → उसके 9 अंतर। ऊपर “↺ चल रही पर लौटें” से वापस।',
        '“—” वाली पंक्तियाँ जन्म से पहले बीत चुकी अवधि हैं (उनकी तारीख़ें नहीं दिखतीं)।',
        'जिस भुक्ति में जन्म पड़ता है, उसके शुरू के कुछ अंतर भी “—” हो सकते हैं — वे जन्म से पहले ख़त्म हो गए थे।',
        'आयु जन्म-तारीख़ से गिनी जाती है (साल-महीना-दिन)।'
      ]
    },
    {
      id: 'gochar',
      title: 'गोचर (चलती हुई स्थिति)',
      lines: [
        'चार्ट कार्ड में “गोचर” बटन दबाइए — दाहिनी ओर की पट्टी में तीसरा tab “गोचर चार्ट” बन जाता है (BP | AP | गोचर चार्ट)।',
        'तारीख़-समय का खाना “ओवरराइट” ढंग से चलता है: लिखते ही अगला हिस्सा आगे बढ़ता है, खाना कभी ख़ाली नहीं होता, Backspace सिर्फ़ कर्सर पीछे ले जाता है।',
        '↑ ↓ या माउस का पहिया, और ← → से आगे-पीछे के हिस्से बदलिए; ग़लत मान लिखकर बाहर क्लिक करें तो आख़िरी सही मान लौट आता है।',
        '“अभी” बटन से आज का गोचर; 📅 बटन से कैलेंडर।',
        'गोचर में भाव-संधियाँ और भाव-स्वामी जन्म के रहते हैं, ग्रह चलते हैं — मुहूर्त देखने में यही काम आता है। तालिकाओं के शीर्षक में TRANSIT लिखा आ जाता है।',
        'ध्यान: गोचर चालू होने पर भी 🖨️ प्रिंट / 📄 PDF / 📄 ऑल चार्ट (PNG) हमेशा जन्म-कुंडली (NATAL) ही छापते हैं।'
      ]
    },
    {
      id: 'print',
      title: 'प्रिंट, PDF और ऑल चार्ट (PNG)',
      lines: [
        '🖨️ प्रिंट — काग़ज़ पर छपाई (ज्योतिषी का नाम/पता/स्लोगन “⚙ सेटिंग्स” से जुड़ता है)।',
        '📄 PDF — फ़ाइल कहाँ सहेजनी है पूछकर PDF बन जाती है (A4, आड़ा)।',
        '📄 ऑल चार्ट (PNG) — सारे चार्ट एक तस्वीर में, सहेजने के लिए।',
        'ये तीनों नतीजे की पट्टी में भी हैं (“← वापस” के पास) — फ़ोन पर ऊपर की पट्टी में नहीं, वहीं मिलेंगे।',
        'तीनों हमेशा जन्म-कुंडली के होते हैं — गोचर मोड चालू हो तब भी (Vas22 जी का तय नियम)।',
        'प्रिंट/PDF में ऊपर की पट्टी, साइड-सूची और बटन नहीं छपते; केवल तालिकाएँ और चार्ट।'
      ]
    },
    {
      id: 'data',
      title: 'आपका data कहाँ रहता है · बैकअप',
      lines: [
        'सारी कुंडलियाँ केवल इसी computer/browser में रहती हैं — कहीं भेजी नहीं जातीं, कोई खाता (login) नहीं चाहिए।',
        'website पर (bnn-shakti) data browser की अपनी जगह (localStorage) में रहता है; browser का data साफ़ करने पर वह मिट सकता है।',
        'desktop ऐप में data इस computer के BNN-Kundli फ़ोल्डर में रहता है (Windows: %APPDATA%\\BNN-Kundli · Mac: ~/Library/Application Support/BNN-Kundli)।',
        '“⬇️ बैकअप फ़ाइल” से एक JSON फ़ाइल बनती है — उसे पेन-ड्राइव या दूसरे computer पर रखिए; दूसरे computer पर “⬆️ बैकअप खोलें” से वही सूची वापस आ जाती है।',
        'desktop ऐप हर कुछ दिनों में अपने-आप भी बैकअप रखता है (सेटिंग्स में 0/7/15/30 दिन चुन सकते हैं); फ़ाइलें BNN-Kundli के Backup फ़ोल्डर में मिलेंगी — “⚙ सेटिंग्स → डेटा फ़ोल्डर खोलें” से वहाँ पहुँचिए।',
        'बैकअप खोलने से पहले ऐप एक सुरक्षा-बैकअप भी बना लेता है (before-import-…json)।'
      ]
    },
    {
      id: 'contact',
      title: 'संपर्क और आगे सीखना',
      lines: [
        'कोई सवाल, सुझाव या गड़बड़ हो — ई-मेल कीजिए: info@mybapuji.com',
        'website: mybapuji.com पर कुंडली, कुंडली मिलान, पंचांग और BNN चार्ट भी निःशुल्क हैं।',
        'BNN ज्योतिष सीखना हो तो mybapuji.com पर निःशुल्क course है (नीचे link)।',
        'सॉफ़्टवेयर निःशुल्क है — “BNN Free Software for All”; किसी से पैसे न लें और न दें।'
      ]
    }
  ]

  function el(tag, cls, html) {
    var e = document.createElement(tag)
    if (cls) e.className = cls
    if (html != null) e.innerHTML = html
    return e
  }

  function openExternal(url) {
    if (window.desktop && window.desktop.openExternal) { window.desktop.openExternal(url); return }
    window.open(url, '_blank', 'noopener')
  }

  var modal = null

  function build() {
    modal = el('div', 'modalWrap', '')
    modal.id = 'helpModal'
    modal.hidden = true
    var box = el('div', 'modal helpModal', '')
    var head = el('div', 'mtb', '<span>❓ सहायता — BNN Shakti' + (VER ? ' · ' + VER : '') + '</span><span class="sp"></span>')
    var close = el('button', 'helpX', '✕')
    close.type = 'button'
    close.title = 'बंद करें (Esc)'
    close.setAttribute('aria-label', 'सहायता बंद करें')
    close.id = 'helpClose'
    head.appendChild(close)
    var body = el('div', 'helpBody', '')
    var list = el('div', 'helpList', '')
    list.id = 'helpList'
    list.setAttribute('role', 'tablist')
    var pane = el('div', 'helpPane', '')
    pane.id = 'helpPane'
    body.appendChild(list)
    body.appendChild(pane)
    box.appendChild(head)
    box.appendChild(body)
    modal.appendChild(box)
    document.body.appendChild(modal)
    close.addEventListener('click', closeHelp)
    modal.addEventListener('mousedown', function (ev) { if (ev.target === modal) closeHelp() })
    // विषय-सूची के बटन
    T.forEach(function (t, i) {
      var b = el('button', 'helpTopic', t.title)
      b.type = 'button'
      b.id = 'helpT_' + t.id
      b.setAttribute('role', 'tab')
      b.dataset.i = String(i)
      b.addEventListener('click', function () { show(i) })
      b.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
          ev.preventDefault()
          var j = i + (ev.key === 'ArrowDown' ? 1 : -1)
          if (j < 0) j = T.length - 1
          if (j >= T.length) j = 0
          var nb = document.getElementById('helpT_' + T[j].id)
          if (nb) nb.focus()
        }
      })
      list.appendChild(b)
    })
  }

  function show(i) {
    var t = T[i]
    if (!t) return
    var list = document.getElementById('helpList')
    var pane = document.getElementById('helpPane')
    var kids = list.querySelectorAll('.helpTopic')
    for (var k = 0; k < kids.length; k++) {
      var on = +kids[k].dataset.i === i
      kids[k].classList.toggle('on', on)
      kids[k].setAttribute('aria-selected', on ? 'true' : 'false')
    }
    var html = '<h3>' + t.title + '</h3><ul>'
    for (var j = 0; j < t.lines.length; j++) html += '<li>' + t.lines[j] + '</li>'
    html += '</ul>'
    if (COURSE_URL) html += '<div class="helpCourse">📘 <a href="' + COURSE_URL + '" id="helpCourseLink">BNN ज्योतिष सीखें — mybapuji.com पर निःशुल्क course</a></div>'
    html += '<div class="helpFoot">सहायता चाहिए? <a href="mailto:info@mybapuji.com" id="helpMailLink">info@mybapuji.com</a></div>'
    pane.innerHTML = html
    pane.scrollTop = 0
    var cl = document.getElementById('helpCourseLink')
    if (cl) cl.addEventListener('click', function (ev) { ev.preventDefault(); openExternal(COURSE_URL) })
    var ml = document.getElementById('helpMailLink')
    if (ml) ml.addEventListener('click', function (ev) {
      ev.preventDefault()
      openExternal('mailto:info@mybapuji.com')
    })
  }

  // version.json से मिला course link — केवल https://mybapuji.com/ से शुरू हो तो मानो
  function setCourseUrl(u) {
    var s1 = String(u == null ? '' : u).trim()
    COURSE_URL = /^https:\/\/mybapuji\.com\//i.test(s1) ? s1 : ''
    refresh()
    return COURSE_URL
  }

  // खिड़की खुली हो तो मौजूदा विषय फिर दिखाओ (link बाद में आया हो तो भी दिख जाए)
  function refresh() {
    if (!modal || modal.hidden) return
    var on = document.querySelector('#helpList .helpTopic.on')
    show(on ? +on.dataset.i : 0)
  }

  // Tab/Shift+Tab खिड़की के अंदर ही घूमें
  function focusables() {
    if (!modal) return []
    var all = modal.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    var out = []
    for (var i = 0; i < all.length; i++) {
      var e = all[i]
      if (e.disabled) continue
      if (e.closest && e.closest('[hidden]')) continue   // छिपी चीज़ें नहीं
      out.push(e)
    }
    return out
  }

  function openHelp() {
    if (!modal) build()
    modal.hidden = false
    show(0)
    var first = document.getElementById('helpT_' + T[0].id)
    if (first) first.focus()
    document.body.classList.add('helpOpen')
  }

  function closeHelp() {
    if (!modal) return
    modal.hidden = true
    document.body.classList.remove('helpOpen')
    var b = document.getElementById('btnHelp')
    if (b) b.focus()
  }

  document.addEventListener('keydown', function (ev) {
    if (!modal || modal.hidden) return
    if (ev.key === 'Escape') { ev.preventDefault(); closeHelp(); return }
    if (ev.key === 'Tab') {
      var f = focusables()
      if (!f.length) return
      var first = f[0], last = f[f.length - 1]
      var cur = document.activeElement
      if (!modal.contains(cur)) { ev.preventDefault(); first.focus(); return }
      if (ev.shiftKey && cur === first) { ev.preventDefault(); last.focus(); return }
      if (!ev.shiftKey && cur === last) { ev.preventDefault(); first.focus(); return }
    }
  })

  window.BNNHelp = {
    open: openHelp,
    close: closeHelp,
    topics: T,
    setCourseUrl: setCourseUrl,
    refresh: refresh,
    getCourseUrl: function () { return COURSE_URL }
  }
})()
