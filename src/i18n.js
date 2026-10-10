// i18n.js — bilingual strings (Hindi default + English).
// Phase 6 will add the full data lists: 12 rashis, 9 grahas, 27 nakshatras.
// Everything the UI shows should come from here via t(key).

const STRINGS = {
  hi: {
    'app.docTitle': 'कुंडली — जन्मपत्री',
    'app.title': 'कुंडली',
    'app.subtitle': 'वैदिक जन्मपत्री (बर्थ चार्ट)',
    'app.badge': '✨ 100% Free कुंडली — बिना साइन-अप',
    'lang.switchTo': 'English',

    'nav.home': 'कुंडली',
    'nav.match': 'कुंडली मिलान',
    'nav.panchang': 'पंचांग',
    'nav.bnn': 'Free BNN चार्ट',

    // भृगु नंदी नाड़ी (BNN) चार्ट — नया पेज /bnn/ (2026-10-07 से)
    'bnn.docTitle': 'Free BNN चार्ट (भृगु नंदी नाड़ी ज्योतिष) — Online बनाएं & PDF Download',
    'bnn.title': 'भृगु नंदी नाड़ी चार्ट',
    'bnn.subtitle': 'भावचलित (KP New) आधारित विशेष चार्ट',
    'bnn.badge': '✨ 100% Free — बिना साइन-अप',
    'bnn.intro': 'जन्म विवरण भरें — पूरी गणना आपके ब्राउज़र में, बिना साइन-अप।',
    'bnn.btn': 'BNN चार्ट बनाएँ',
    'bnn.noteTitle': '✅ जन्म विवरण ठीक है',
    'bnn.noteBody': 'भावचलित (KP New) गणना और चार्ट अगले चरणों में जुड़ेंगे।',
    'bnn.calculating': '⏳ BNN चार्ट की गणना हो रही है…',
    'bnn.calcError': 'गणना इंजन लोड नहीं हो सका — थोड़ी देर बाद दोबारा कोशिश करें।',
    'bnn.bp': 'परिवर्तन से पहले (BP)',
    'bnn.ap': 'परिवर्तन के बाद (AP)',
    'bnn.legend': '🔵 मुख्य ग्रह — जीवन भर असर · 🟢 20%+ — अपनी दशा-भुक्ति में असर · 🟠 20% से कम — कमज़ोर · 🩷 आगे बढ़ने पर पहले मिलने वाला ग्रह',
    'bnn.dashaNote': 'अंतिम तिथि — उस समय की आयु · पीली पंक्ति = अभी चल रही दशा/भुक्ति/अंतर',
    'bnn.transitTime': 'गोचर समय',
    'bnn.transitNow': 'अभी',
    'bnn.transitPlace': 'गोचर स्थान',
    'bnn.print': '🖨️ प्रिंट / PDF बनाएँ',
    'bnn.allChart': '📄 ऑल चार्ट (PNG)',
    'bnn.lg.bhava': 'भाव',
    'bnn.lg.centric': 'केन्द्रीय ग्रह',
    'bnn.lg.main': 'मुख्य ग्रह',
    'bnn.lg.sub': 'उपग्रह',
    'bnn.lg.weak': 'अल्प बलशाली ग्रह',
    'bnn.lg.prog': 'प्रगति का प्रथम ग्रह',

    // स्पेशल ट्रांज़िट (legacy PCP) — page के bottom पर
    'st.title': '🌟 स्पेशल ट्रांज़िट (Special Transit)',
    'st.intro': 'गोचर करते ग्रह जब जन्म-ग्रह के 1-5-7-9 (या 1-5-9) स्थानों से गुज़रते हैं — Start/End तिथियाँ।',
    'st.group.all': 'सभी ग्रह',
    'st.group.nodes': 'राहु-केतु',
    'st.group.sg': 'शनि-गुरु',
    'st.birth': 'जन्म का ग्रह (मुख्य ग्रह)',
    'st.start': 'शुरू तारीख़',
    'st.end': 'अंत तारीख़',
    'st.find': 'खोजें',
    'st.print': '🖨️ प्रिंट / PDF',
    'st.computing': '⏳ गणना हो रही है…',
    'st.none': 'इस अवधि में कोई पंक्ति नहीं मिली।',
    'st.aspect': 'ASPECT',
    'st.retro': 'RETRO',

    // मुख्य साइट (MyBapuji) की ऊपरी पट्टी
    'mb.home': 'होम',
    'mb.books': 'किताबें',
    'mb.blog': 'ब्लॉग',
    'mb.treatment': 'इलाज',
    'mb.video': 'वीडियो',

    // कुंडली मिलान (Kundli Matching) — नया पेज /match/
    'match.docTitle': 'कुंडली मिलान — अष्टकूट गुण मिलान',
    'match.title': 'कुंडली मिलान',
    'match.subtitle': 'विवाह हेतु अष्टकूट गुण मिलान (36 अंक)',
    'match.badge': '✨ 100% Free कुंडली मिलान — तुरंत परिणाम',
    'match.intro': 'पहले लड़के का जन्म विवरण भरें, फिर अगले पन्ने पर लड़की का — और पाएँ 36 अंकों का अष्टकूट गुण मिलान रिपोर्ट।',
    'match.boysHeading': 'लड़के का विवरण',
    'match.girlsHeading': 'लड़की का विवरण',
    'match.step1': 'चरण 1/2 — लड़के का विवरण',
    'match.step2': 'चरण 2/2 — लड़की का विवरण',
    'match.nextNote': 'लड़की का विवरण अगले पन्ने पर डालें।',
    'match.continue': 'आगे बढ़ें',
    'match.back': '← पीछे जाएँ (लड़के का विवरण)',
    'match.getReport': 'मिलान रिपोर्ट देखें',
    'match.calculating': '⏳ दोनों कुंडलियों की गणना हो रही है…',
    'match.boy': 'लड़का',
    'match.girl': 'लड़की',
    'match.engineError': 'गणना इंजन लोड नहीं हो सका — थोड़ी देर बाद दोबारा कोशिश करें।',
    'match.errConv': 'समय क्षेत्र बदलने में दिक़्क़त — कृपया जगह या समय क्षेत्र जाँचें।',
    'match.moonRashi': 'चंद्र राशि',
    'match.moonNak': 'चंद्र नक्षत्र',

    // परिणाम (रिपोर्ट) — Phase 5
    'match.report.title': 'अष्टकूट गुण मिलान परिणाम',
    'match.table.koota': 'कूट',
    'match.table.points': 'अंक',
    'match.table.reason': 'कारण',
    'match.totalRow': 'कुल योग',
    'match.mangal.title': 'मंगल दोष जाँच (लग्न व चंद्र से)',
    'match.mangal.present': 'मंगल दोष है',
    'match.mangal.none': 'मंगल दोष नहीं',
    'match.mangal.low': 'एक चार्ट में — हल्का',
    'match.mangal.high': 'दोनों चार्ट में — उच्च',
    'match.mangal.fromLagna': 'लग्न से भाव',
    'match.mangal.fromMoon': 'चंद्र से भाव',
    'match.disclaimer': 'यह परंपरागत अष्टकूट (36-गुण) स्कोर है — पूर्ण ज्योतिषीय निर्णय नहीं। अंतिम निर्णय से पहले पूरी कुंडली, दशाएँ व दोष-गंभीरता किसी अनुभवी ज्योतिषी से अवश्य देखें।',

    'form.heading': 'जन्म विवरण भरें',
    'form.name': 'नाम (वैकल्पिक)',
    'form.namePh': 'आपका नाम',
    'form.gender': 'लिंग',
    'gender.male': 'पुरुष',
    'gender.female': 'महिला',
    'gender.other': 'अन्य',
    'form.dob': 'जन्म तिथि',
    'date.day': 'दिन',
    'date.month': 'महीना',
    'date.monthPh': '— चुनें —',
    'date.year': 'साल',
    'form.tob': 'जन्म समय',
    'form.tobNote': '(24 घंटे का प्रारूप, जैसे 14 = दोपहर 2 बजे)',
    'time.hour': 'घंटा',
    'time.minute': 'मिनट',
    'time.second': 'सेकंड',
    'time.offset': 'UTC ऑफ़सेट (वैकल्पिक)',
    'time.offsetHint': 'ख़ाली छोड़ें — जगह से अपने-आप तय होगा। पुराने जन्मों के लिए जैसे: +05:30',
    'form.place': 'जन्म स्थान',
    'form.placePh': 'गाँव / शहर का नाम',
    'form.search': 'खोजें',
    'btn.get': 'कुंडली बनाएँ',

    'search.busy': 'खोजा जा रहा है…',
    'search.enterName': 'पहले जगह का नाम लिखें।',
    'search.moreLetters': 'एक और अक्षर लिखें — फिर सुझाव दिखेंगे।',
    'search.none': 'यह जगह नहीं मिली — नाम थोड़ा और साफ़ लिखकर फिर कोशिश करें।',
    'search.error': 'खोज पूरी नहीं हो सकी (इंटरनेट या सेवा की दिक़्क़त)। नीचे हाथ से विवरण भर सकते हैं।',
    'search.selected': 'चुना गया',
    'place.errSelect': 'पहले "खोजें" दबाकर सही जगह चुनें, या नीचे हाथ से विवरण भरें।',
    'manual.summary': 'जगह नहीं मिली? हाथ से विवरण भरें',
    'manual.lat': 'अक्षांश (latitude)',
    'manual.lon': 'देशांतर (longitude)',
    'manual.tz': 'समय क्षेत्र',
    'manual.hint': 'समय क्षेत्र: IANA नाम (जैसे Asia/Kolkata) या UTC offset (जैसे +05:30)।',

    'err.gender': 'कृपया लिंग चुनें।',
    'err.dateRequired': 'जन्म तिथि पूरी भरें — दिन, महीना और साल।',
    'err.dateInvalid': 'यह तिथि मान्य नहीं है, दिन जाँचें।',
    'err.yearRange': 'साल 1800 से 2400 के बीच होना चाहिए।',
    'err.timeRequired': 'जन्म समय भरें — घंटा और मिनट (सेकंड ख़ाली हो तो 00 माना जाएगा)।',
    'err.hour': 'घंटा 0 से 23 के बीच होना चाहिए।',
    'err.minute': 'मिनट 0 से 59 के बीच होना चाहिए।',
    'err.second': 'सेकंड 0 से 59 के बीच होना चाहिए।',
    'err.place': 'कृपया जन्म स्थान भरें।',
    'err.latlonRequired': 'तीनों भरें — अक्षांश, देशांतर और समय क्षेत्र।',
    'err.latRange': 'अक्षांश -90 से 90 के बीच हो।',
    'err.lonRange': 'देशांतर -180 से 180 के बीच हो।',
    'err.tzInvalid': 'समय क्षेत्र ठीक नहीं लगा — जैसे Asia/Kolkata या +05:30।',
    'err.offsetInvalid': 'ऑफ़सेट ठीक नहीं लगा — जैसे +05:30 या -08:00 लिखें।',
    'err.polar': 'इस जगह (ध्रुवीय क्षेत्र) पर भाव-गणना संभव नहीं — कृपया जगह जाँचें।',

    'summary.title': '✅ जानकारी सही है',
    'summary.name': 'नाम',
    'summary.gender': 'लिंग',
    'summary.date': 'जन्म तिथि',
    'summary.time': 'जन्म समय',
    'summary.place': 'जन्म स्थान',
    'summary.coords': 'निर्देशांक',
    'summary.tz': 'समय क्षेत्र',
    'summary.utc': 'UTC समय',
    'summary.manualOffset': 'हाथ से भरा',
    'summary.lagna': 'लग्न',
    'summary.ayanamsa': 'अयनांश (लाहिरी)',
    'summary.planets': 'ग्रह स्थिति',
    'summary.calculating': '⏳ कुंडली की गणना हो रही है…',
    'summary.engineError': 'गणना इंजन लोड नहीं हो सका — थोड़ी देर बाद दोबारा कोशिश करें।',
    'k.rashi': 'राशि',
    'k.house': 'भाव',
    'k.retro': 'वक्री',
    'chart.north': 'उत्तर भारतीय',
    'chart.south': 'दक्षिण भारतीय',
    'chart.d1': 'जन्म कुंडली (D1)',
    'chart.d9': 'नवमांश (D9)',
    'chart.chalit': 'भाव चलित',
    'summary.note': 'चार्ट और ग्रह-तालिका तैयार हैं — PNG में सेव करें या PDF/प्रिंट करें।',
    'summary.dasha': 'विंशोत्तरी दशा',
    'dasha.md': 'महादशा',
    'dasha.ad': 'अंतर्दशा',
    'dasha.from': 'प्रारंभ',
    'dasha.to': 'अंत',
    'dasha.now': 'अभी',
    'dasha.nowLine': 'अभी चल रही: ',
    'dasha.till': 'तक',
    'dasha.basis': 'आधार: चंद्र-नक्षत्र · सौर वर्ष = 365.25 दिन',
    'table.asc': 'लग्न / Ascendant',
    'table.planet': 'ग्रह',
    'table.rashi': 'राशि',
    'table.degree': 'अंश',
    'table.nakshatra': 'नक्षत्र',
    'table.pada': 'पद',
    'table.house': 'भाव',
    'table.retro': 'वक्री',
    'btn.downloadPng': 'PNG सेव करें',
    'btn.print': 'PDF सेव करें',
    'btn.copy': 'विवरण कॉपी करें',
    'actions.pdfHint': 'PDF के लिए खुलने वाली प्रिंट विंडो में “Save as PDF” चुनें।',
    'msg.copied': '✓ कॉपी हो गया',
    'msg.copyFailed': 'कॉपी नहीं हो सका',
    'msg.pngFailed': 'PNG नहीं बन सकी — फिर कोशिश करें।',
    'footer.privacy': '🔒 निजता: जन्म-विवरण आपके ब्राउज़र में ही रहता है — कहीं भेजा या सेव नहीं होता।',
    'footer.poweredBy': 'गणना इंजन: ',
    'footer.source': 'सोर्स कोड (GitHub)',

    'month.1': 'जनवरी',
    'month.2': 'फ़रवरी',
    'month.3': 'मार्च',
    'month.4': 'अप्रैल',
    'month.5': 'मई',
    'month.6': 'जून',
    'month.7': 'जुलाई',
    'month.8': 'अगस्त',
    'month.9': 'सितंबर',
    'month.10': 'अक्टूबर',
    'month.11': 'नवंबर',
    'month.12': 'दिसंबर',
  },

  en: {
    'app.docTitle': 'Kundli — Birth Chart',
    'app.title': 'Kundli',
    'app.subtitle': 'Vedic Birth Chart',
    'app.badge': '✨ 100% Free Kundli — no sign-up',
    'lang.switchTo': 'हिंदी',

    'nav.home': 'Kundli',
    'nav.match': 'Kundli Matching',
    'nav.panchang': 'Panchang',
    'nav.bnn': 'Free BNN Chart',

    // Bhrigu Nandi Nadi (BNN) chart — new page /bnn/ (from 2026-10-07)
    'bnn.docTitle': 'Free BNN Chart (Bhrigu Nandi Nadi) — Create Online & Download PDF',
    'bnn.title': 'Bhrigu Nandi Nadi Chart',
    'bnn.subtitle': 'Bhava-chalit (KP New) based special chart',
    'bnn.badge': '✨ 100% Free — no sign-up',
    'bnn.intro': 'Enter the birth details — everything is computed in your browser.',
    'bnn.btn': 'Create BNN Chart',
    'bnn.noteTitle': '✅ Birth details checked',
    'bnn.noteBody': 'The KP New bhava-chalit calculation and charts arrive in the next phases.',
    'bnn.calculating': '⏳ Computing the BNN chart…',
    'bnn.calcError': 'The calculation engine could not load — please try again in a moment.',
    'bnn.bp': 'Before parivartana (BP)',
    'bnn.ap': 'After parivartana (AP)',
    'bnn.legend': '🔵 main planet — lifelong · 🟢 20%+ — acts in its dasha · 🟠 below 20% — weak · 🩷 first planet met on progression',
    'bnn.dashaNote': 'End date — age at that time · yellow row = currently running',
    'bnn.transitTime': 'Transit time',
    'bnn.transitNow': 'Now',
    'bnn.transitPlace': 'Transit place',
    'bnn.print': '🖨️ Print / Save PDF',
    'bnn.allChart': '📄 All Chart (PNG)',
    'bnn.lg.bhava': 'Bhava',
    'bnn.lg.centric': 'Centric planet',
    'bnn.lg.main': 'Main planet',
    'bnn.lg.sub': 'Sub planet',
    'bnn.lg.weak': 'Weak planet',
    'bnn.lg.prog': 'Progression first planet',

    // Special Transit (legacy PCP) — bottom of the page
    'st.title': '🌟 Special Transit (PCP)',
    'st.intro': 'Periods when transiting planets pass over the birth planet’s 1-5-7-9 (or 1-5-9) positions — Start/End dates.',
    'st.group.all': 'All Planets',
    'st.group.nodes': 'Rahu Kethu',
    'st.group.sg': 'Saturn Guru',
    'st.birth': 'Birth planet',
    'st.start': 'Start date',
    'st.end': 'End date',
    'st.find': 'Find',
    'st.print': '🖨️ Print / PDF',
    'st.computing': '⏳ Computing…',
    'st.none': 'No rows in this period.',
    'st.aspect': 'ASPECT',
    'st.retro': 'RETRO',

    // MyBapuji main-site strip
    'mb.home': 'Home',
    'mb.books': 'Books',
    'mb.blog': 'Blog',
    'mb.treatment': 'Treatment',
    'mb.video': 'Videos',

    // Kundli Matching — the new /match/ page
    'match.docTitle': 'Kundli Matching — Ashtakoot Guna Milan',
    'match.title': 'Kundli Matching',
    'match.subtitle': 'Ashtakoot Guna Milan for marriage (36 points)',
    'match.badge': '✨ 100% Free Kundli Matching — instant results',
    'match.intro': "Enter the boy's birth details first, then the girl's on the next page — get a 36-point Ashtakoot Guna Milan report.",
    'match.boysHeading': "Enter Boy's Details",
    'match.girlsHeading': "Enter Girl's Details",
    'match.step1': "Step 1/2 — Boy's details",
    'match.step2': "Step 2/2 — Girl's details",
    'match.nextNote': "Enter girl's details on the next page.",
    'match.continue': 'Continue',
    'match.back': "← Back (edit boy's details)",
    'match.getReport': 'Get Match Report',
    'match.calculating': '⏳ Calculating both charts…',
    'match.boy': 'Boy',
    'match.girl': 'Girl',
    'match.engineError': 'The calculation engine could not load — please try again in a moment.',
    'match.errConv': 'Could not convert the birth time — please check the place / time zone.',
    'match.moonRashi': 'Moon sign',
    'match.moonNak': 'Moon nakshatra',

    // Report (Phase 5)
    'match.report.title': 'Ashtakoot Guna Milan result',
    'match.table.koota': 'Koota',
    'match.table.points': 'Points',
    'match.table.reason': 'Reason',
    'match.totalRow': 'Total',
    'match.mangal.title': 'Mangal Dosha check (from Lagna & Moon)',
    'match.mangal.present': 'Mangal dosha present',
    'match.mangal.none': 'No Mangal dosha',
    'match.mangal.low': 'in one chart — low',
    'match.mangal.high': 'in both charts — high',
    'match.mangal.fromLagna': 'from Lagna house',
    'match.mangal.fromMoon': 'from Moon house',
    'match.disclaimer': 'This is a traditional Ashtakoot (36-point) score — not a complete astrological judgement. Before a final decision, review the full charts, dashas and dosha severity with a knowledgeable astrologer.',

    'form.heading': 'Enter birth details',
    'form.name': 'Name (optional)',
    'form.namePh': 'Your name',
    'form.gender': 'Gender',
    'gender.male': 'Male',
    'gender.female': 'Female',
    'gender.other': 'Other',
    'form.dob': 'Birth date',
    'date.day': 'Day',
    'date.month': 'Month',
    'date.monthPh': '— Select —',
    'date.year': 'Year',
    'form.tob': 'Birth time',
    'form.tobNote': '(24-hour format, e.g. 14 = 2 PM)',
    'time.hour': 'Hour',
    'time.minute': 'Minute',
    'time.second': 'Second',
    'time.offset': 'UTC offset override (optional)',
    'time.offsetHint': 'Leave empty to auto-detect from the place. For old births e.g. +05:30',
    'form.place': 'Birth place',
    'form.placePh': 'Village / city name',
    'form.search': 'Search',
    'btn.get': 'Get Kundli',

    'search.busy': 'Searching…',
    'search.enterName': 'Type a place name first.',
    'search.moreLetters': 'Type one more letter — suggestions will appear.',
    'search.none': 'Place not found — try a clearer name.',
    'search.error': 'Search could not complete (network or service issue). You can fill details manually below.',
    'search.selected': 'Selected',
    'place.errSelect': 'Press "Search" and pick the right place, or fill the manual fields below.',
    'manual.summary': "Can't find it? Enter details manually",
    'manual.lat': 'Latitude',
    'manual.lon': 'Longitude',
    'manual.tz': 'Time zone',
    'manual.hint': 'Time zone: IANA name (e.g. Asia/Kolkata) or UTC offset (e.g. +05:30).',

    'err.gender': 'Please choose a gender.',
    'err.dateRequired': 'Fill the full birth date — day, month and year.',
    'err.dateInvalid': 'This date is not valid — please check the day.',
    'err.yearRange': 'Year must be between 1800 and 2400.',
    'err.timeRequired': 'Fill the birth time — hour and minute (empty seconds are taken as 00).',
    'err.hour': 'Hour must be between 0 and 23.',
    'err.minute': 'Minute must be between 0 and 59.',
    'err.second': 'Second must be between 0 and 59.',
    'err.place': 'Please enter a birth place.',
    'err.latlonRequired': 'Fill all three — latitude, longitude and time zone.',
    'err.latRange': 'Latitude must be between -90 and 90.',
    'err.lonRange': 'Longitude must be between -180 and 180.',
    'err.tzInvalid': 'This time zone looks wrong — e.g. Asia/Kolkata or +05:30.',
    'err.offsetInvalid': 'Offset looks wrong — e.g. +05:30 or -08:00.',
    'err.polar': 'House calculation is not possible at this polar location — please check the place.',

    'summary.title': '✅ Details are valid',
    'summary.name': 'Name',
    'summary.gender': 'Gender',
    'summary.date': 'Birth date',
    'summary.time': 'Birth time',
    'summary.place': 'Birth place',
    'summary.coords': 'Coordinates',
    'summary.tz': 'Time zone',
    'summary.utc': 'UTC time',
    'summary.manualOffset': 'entered manually',
    'summary.lagna': 'Ascendant (Lagna)',
    'summary.ayanamsa': 'Ayanamsa (Lahiri)',
    'summary.planets': 'Planet positions',
    'summary.calculating': '⏳ Calculating the chart…',
    'summary.engineError': 'The calculation engine could not load — please try again in a moment.',
    'k.rashi': 'Sign',
    'k.house': 'House',
    'k.retro': 'Retro',
    'chart.north': 'North Indian',
    'chart.south': 'South Indian',
    'chart.d1': 'Birth chart (D1)',
    'chart.d9': 'Navamsa (D9)',
    'chart.chalit': 'Bhava Chalit',
    'summary.note': 'Your chart and planet table are ready — save as PNG, or PDF/print.',
    'summary.dasha': 'Vimshottari Dasha',
    'dasha.md': 'Mahadasha',
    'dasha.ad': 'Antardasha',
    'dasha.from': 'From',
    'dasha.to': 'To',
    'dasha.now': 'now',
    'dasha.nowLine': 'Running now: ',
    'dasha.till': 'till',
    'dasha.basis': 'Basis: Moon nakshatra · solar year = 365.25 days',
    'table.asc': 'लग्न / Ascendant',
    'table.planet': 'Planet',
    'table.rashi': 'Rashi',
    'table.degree': 'Degree',
    'table.nakshatra': 'Nakshatra',
    'table.pada': 'Pada',
    'table.house': 'House',
    'table.retro': 'Retro',
    'btn.downloadPng': 'Download PNG',
    'btn.print': 'Save PDF',
    'btn.copy': 'Copy details',
    'actions.pdfHint': 'In the print window, choose “Save as PDF”.',
    'msg.copied': '✓ Copied',
    'msg.copyFailed': 'Could not copy',
    'msg.pngFailed': 'PNG could not be created — please try again.',
    'footer.privacy': '🔒 Privacy: your birth details stay in your browser — never sent or stored anywhere.',
    'footer.poweredBy': 'Powered by ',
    'footer.source': 'Source code (GitHub)',

    'month.1': 'January',
    'month.2': 'February',
    'month.3': 'March',
    'month.4': 'April',
    'month.5': 'May',
    'month.6': 'June',
    'month.7': 'July',
    'month.8': 'August',
    'month.9': 'September',
    'month.10': 'October',
    'month.11': 'November',
    'month.12': 'December',
  },
}

// ---------------------------------------------------------------------------
// Bilingual Vedic data lists (Phase 6) — Hindi + English side by side.
// These are THE canonical lists used by tables, charts and results.
// ---------------------------------------------------------------------------

// 12 rashis; index 0 = Mesha (Aries).
export const RASHIS = [
  { hi: 'मेष', en: 'Aries' },
  { hi: 'वृषभ', en: 'Taurus' },
  { hi: 'मिथुन', en: 'Gemini' },
  { hi: 'कर्क', en: 'Cancer' },
  { hi: 'सिंह', en: 'Leo' },
  { hi: 'कन्या', en: 'Virgo' },
  { hi: 'तुला', en: 'Libra' },
  { hi: 'वृश्चिक', en: 'Scorpio' },
  { hi: 'धनु', en: 'Sagittarius' },
  { hi: 'मकर', en: 'Capricorn' },
  { hi: 'कुंभ', en: 'Aquarius' },
  { hi: 'मीन', en: 'Pisces' },
]

// 9 grahas, in chart order, with the English chart abbreviations.
export const GRAHAS = [
  { key: 'sun', short: 'Su', hi: 'सूर्य', en: 'Sun' },
  { key: 'moon', short: 'Mo', hi: 'चंद्र', en: 'Moon' },
  { key: 'mars', short: 'Ma', hi: 'मंगल', en: 'Mars' },
  { key: 'mercury', short: 'Me', hi: 'बुध', en: 'Mercury' },
  { key: 'jupiter', short: 'Ju', hi: 'गुरु', en: 'Jupiter' },
  { key: 'venus', short: 'Ve', hi: 'शुक्र', en: 'Venus' },
  { key: 'saturn', short: 'Sa', hi: 'शनि', en: 'Saturn' },
  { key: 'rahu', short: 'Ra', hi: 'राहु', en: 'Rahu' },
  { key: 'ketu', short: 'Ke', hi: 'केतु', en: 'Ketu' },
]

// 27 nakshatras; index 0 = Ashwini.
export const NAKSHATRAS = [
  { hi: 'अश्विनी', en: 'Ashwini' },
  { hi: 'भरणी', en: 'Bharani' },
  { hi: 'कृत्तिका', en: 'Krittika' },
  { hi: 'रोहिणी', en: 'Rohini' },
  { hi: 'मृगशिरा', en: 'Mrigashira' },
  { hi: 'आर्द्रा', en: 'Ardra' },
  { hi: 'पुनर्वसु', en: 'Punarvasu' },
  { hi: 'पुष्य', en: 'Pushya' },
  { hi: 'आश्लेषा', en: 'Ashlesha' },
  { hi: 'मघा', en: 'Magha' },
  { hi: 'पूर्वा फाल्गुनी', en: 'Purva Phalguni' },
  { hi: 'उत्तरा फाल्गुनी', en: 'Uttara Phalguni' },
  { hi: 'हस्त', en: 'Hasta' },
  { hi: 'चित्रा', en: 'Chitra' },
  { hi: 'स्वाति', en: 'Swati' },
  { hi: 'विशाखा', en: 'Vishakha' },
  { hi: 'अनुराधा', en: 'Anuradha' },
  { hi: 'ज्येष्ठा', en: 'Jyeshtha' },
  { hi: 'मूल', en: 'Mula' },
  { hi: 'पूर्वाषाढ़ा', en: 'Purva Ashadha' },
  { hi: 'उत्तराषाढ़ा', en: 'Uttara Ashadha' },
  { hi: 'श्रवण', en: 'Shravana' },
  { hi: 'धनिष्ठा', en: 'Dhanishtha' },
  { hi: 'शतभिषा', en: 'Shatabhisha' },
  { hi: 'पूर्वा भाद्रपद', en: 'Purva Bhadrapada' },
  { hi: 'उत्तरा भाद्रपद', en: 'Uttara Bhadrapada' },
  { hi: 'रेवती', en: 'Revati' },
]

// "कन्या / Virgo" — the side-by-side format used in results.
function sideBySide(item) {
  return item ? `${item.hi} / ${item.en}` : ''
}
export function rashiLabel(index) {
  return sideBySide(RASHIS[index])
}
export function grahaLabel(key) {
  const graha = GRAHAS.find((g) => g.key === key)
  return graha ? sideBySide(graha) : key
}
export function nakshatraLabel(number) {
  return sideBySide(NAKSHATRAS[number - 1])
}

let lang = 'hi' // Hindi is the default language

export function getLang() {
  return lang
}

export function setLang(next) {
  if (next === 'hi' || next === 'en') lang = next
}

// t('some.key') -> string in the active language
export function t(key) {
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key
}

// List of the 12 month names in the active language.
export function months() {
  return Array.from({ length: 12 }, (_, i) => t(`month.${i + 1}`))
}

// English month name regardless of the active language (charts are English).
export function monthEn(number) {
  return STRINGS.en[`month.${number}`] ?? ''
}

// ---------------------------------------------------------------------------
// Panchang support data — the Samvatsara list is needed by src/panchang.js
// (Phase 3). The remaining Panchang lists (30 tithis, 27 yogas, 11 karanas,
// vaars, lunar months, ritus, muhurat names, directions, UI strings) arrive
// with Panchang Phase 6 per the project guide.
// ---------------------------------------------------------------------------

// 60 Samvatsara (Jovian cycle) names; index 0 = Prabhava (cf. Shaka +12 mod 60).
// Hindi forms follow the traditional published list (transliterations where
// usage varies); verified against the cycle position on the reference sites
// (e.g. Shaka 1948 → Parabhava, #40).
export const SAMVATSARA_NAMES = [
  { hi: 'प्रभव', en: 'Prabhava' },
  { hi: 'विभव', en: 'Vibhava' },
  { hi: 'शुक्ल', en: 'Shukla' },
  { hi: 'प्रमोद', en: 'Pramoda' },
  { hi: 'प्रजापति', en: 'Prajapati' },
  { hi: 'अंगिरस', en: 'Angirasa' },
  { hi: 'श्रीमुख', en: 'Shrimukha' },
  { hi: 'भव', en: 'Bhava' },
  { hi: 'युवा', en: 'Yuva' },
  { hi: 'धाता', en: 'Dhata' },
  { hi: 'ईश्वर', en: 'Ishvara' },
  { hi: 'बहुधान्य', en: 'Bahudhanya' },
  { hi: 'प्रमाथी', en: 'Pramathi' },
  { hi: 'विक्रम', en: 'Vikrama' },
  { hi: 'वृष', en: 'Vrisha' },
  { hi: 'चित्रभानु', en: 'Chitrabhanu' },
  { hi: 'स्वभानु', en: 'Svabhanu' },
  { hi: 'तारण', en: 'Tarana' },
  { hi: 'पार्थिव', en: 'Parthiva' },
  { hi: 'व्यय', en: 'Vyaya' },
  { hi: 'सर्वजित', en: 'Sarvajit' },
  { hi: 'सर्वधारी', en: 'Sarvadhari' },
  { hi: 'विरोधी', en: 'Virodhi' },
  { hi: 'विकृति', en: 'Vikriti' },
  { hi: 'खर', en: 'Khara' },
  { hi: 'नंदन', en: 'Nandana' },
  { hi: 'विजय', en: 'Vijaya' },
  { hi: 'जय', en: 'Jaya' },
  { hi: 'मन्मथ', en: 'Manmatha' },
  { hi: 'दुर्मुख', en: 'Durmukha' },
  { hi: 'हेमलंब', en: 'Hemalamba' },
  { hi: 'विलंबी', en: 'Vilambi' },
  { hi: 'विकारी', en: 'Vikari' },
  { hi: 'शार्वरी', en: 'Sharvari' },
  { hi: 'प्लव', en: 'Plava' },
  { hi: 'शुभकृत', en: 'Shubhakrit' },
  { hi: 'शोभकृत', en: 'Shobhakrit' },
  { hi: 'क्रोधी', en: 'Krodhi' },
  { hi: 'विश्वावसु', en: 'Vishvavasu' },
  { hi: 'पराभव', en: 'Parabhava' },
  { hi: 'प्लवंग', en: 'Plavanga' },
  { hi: 'कीलक', en: 'Kilaka' },
  { hi: 'सौम्य', en: 'Saumya' },
  { hi: 'साधारण', en: 'Sadharana' },
  { hi: 'विरोधकृत', en: 'Virodhikrit' },
  { hi: 'परिधावी', en: 'Paridhavi' },
  { hi: 'प्रमादी', en: 'Pramadi' },
  { hi: 'आनंद', en: 'Ananda' },
  { hi: 'राक्षस', en: 'Rakshasa' },
  { hi: 'अनल', en: 'Anala' },
  { hi: 'पिंगल', en: 'Pingala' },
  { hi: 'कलयुक्त', en: 'Kalayukta' },
  { hi: 'सिद्धार्थी', en: 'Siddharthi' },
  { hi: 'रौद्र', en: 'Raudra' },
  { hi: 'दुर्मति', en: 'Durmati' },
  { hi: 'दुंदुभि', en: 'Dundubhi' },
  { hi: 'रुधिरोद्गारी', en: 'Rudhirodgari' },
  { hi: 'रक्ताक्ष', en: 'Raktaksha' },
  { hi: 'क्रोधन', en: 'Krodhana' },
  { hi: 'अक्षय', en: 'Akshaya' },
]

// Muhurat window names (used by src/muhurat.js; UI strings follow in Phase 6).
export const MUHURAT_NAMES = {  rahu: { hi: 'राहु काल', en: 'Rahu Kaal' },
  yamaganda: { hi: 'यमगंड', en: 'Yamaganda' },
  gulika: { hi: 'गुलिक काल', en: 'Gulika Kaal' },
  kulika: { hi: 'कुलिक', en: 'Kulika' },
  kantaka: { hi: 'कंटक / मृत्यु', en: 'Kantaka / Mrityu' },
  kalavela: { hi: 'कालवेला / अर्धयाम', en: 'Kalavela / Ardhayaam' },
  yamaghanta: { hi: 'यमघंट', en: 'Yamaghanta' },
  dushta: { hi: 'दुष्ट मुहूर्त', en: 'Dushta Muhurtas' },
  abhijit: { hi: 'अभिजीत', en: 'Abhijit' },
}

// 8 compass directions (Disha Shoola uses the 4 cardinals; corners included for
// completeness / future use).
export const DIRECTIONS = [
  { key: 'east', hi: 'पूर्व', en: 'East' },
  { key: 'west', hi: 'पश्चिम', en: 'West' },
  { key: 'north', hi: 'उत्तर', en: 'North' },
  { key: 'south', hi: 'दक्षिण', en: 'South' },
  { key: 'ne', hi: 'ईशान', en: 'North-East' },
  { key: 'se', hi: 'आग्नेय', en: 'South-East' },
  { key: 'sw', hi: 'नैऋत्य', en: 'South-West' },
  { key: 'nw', hi: 'वायव्य', en: 'North-West' },
]

// ---------------------------------------------------------------------------
// Panchang lists (Phase 6) — 30 tithis, 27 yogas, 11 karanas, 7 vaaras,
// 12 lunar months (amanta & purnimanta share these names), 6 ritus.
// (Samvatsara 60, muhurat names and directions live above; added early.)
// ---------------------------------------------------------------------------

const zipLists = (hi, en) => hi.map((h, i) => ({ hi: h, en: en[i] }))

// 30 tithis; index 0-14 = Shukla Pratipada…Purnima, 15-29 = Krishna Pratipada…Amavasya.
export const TITHIS = zipLists(
  ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
    'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा',
    'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
    'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'अमावस्या'],
  ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'],
)

// 27 yogas (Vishkambha → Vaidhriti).
export const YOGAS = zipLists(
  ['विष्कुम्भ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन', 'अतिगण्ड', 'सुकर्मा', 'धृति', 'शूल',
    'गण्ड', 'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र', 'सिद्धि', 'व्यतिपात', 'वरीयान', 'परिघ',
    'शिव', 'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल', 'ब्रह्म', 'इन्द्र', 'वैधृति'],
  ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarman', 'Dhriti', 'Shula',
    'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha',
    'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'],
)

// 11 karanas, in the module's index order (7 movable + 4 fixed).
export const KARANAS = zipLists(
  ['बव', 'बालव', 'कौलव', 'तैतिल', 'गर', 'वणिज', 'विष्टि', 'शकुनि', 'चतुष्पद', 'नाग', 'किंस्तुघ्न'],
  ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti', 'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'],
)

// 7 vaaras (weekdays; 0 = Sunday).
export const VAARAS = zipLists(
  ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
  ['Ravivara', 'Somavara', 'Mangalavara', 'Budhavara', 'Guruvara', 'Shukravara', 'Shanivara'],
)

// 12 lunar months; used for BOTH amanta and purnimanta (names are the same).
export const LUNAR_MONTHS = zipLists(
  ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'],
  ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'],
)

// 6 ritus (Vasanta → Shishira).
export const RITUS = zipLists(
  ['वसंत', 'ग्रीष्म', 'वर्षा', 'शरद', 'हेमंत', 'शिशिर'],
  ['Vasanta', 'Grishma', 'Varsha', 'Sharad', 'Hemanta', 'Shishir'],
)

// Paksha labels (Tithi row companion / widget).
export const PAKSHA = {
  shukla: { hi: 'शुक्ल', en: 'Shukla' },
  krishna: { hi: 'कृष्ण', en: 'Krishna' },
}
export function pakshaLabel(key) {
  return sideBySide(PAKSHA[key])
}

// Label helpers ("हिंदी / English" — the site-wide display format).
export function tithiLabel(n) {
  return sideBySide(TITHIS[n - 1])
}
export function yogaLabel(n) {
  return sideBySide(YOGAS[n - 1])
}
export function karanaLabel(index) {
  return sideBySide(KARANAS[index])
}
export function vaaraLabel(index) {
  return sideBySide(VAARAS[index])
}
export function lunarMonthLabel(index, adhika = false) {
  const m = LUNAR_MONTHS[index]
  if (!m) return ''
  return adhika ? `${m.hi} (अधिक) / ${m.en} (Adhik)` : sideBySide(m)
}
export function rituLabel(index) {
  return sideBySide(RITUS[index])
}
export function samvatsaraLabel(index) {
  return sideBySide(SAMVATSARA_NAMES[index - 1])
}

// ---------------------------------------------------------------------------
// Panchang UI strings (Phase 6) — merged into STRINGS via Object.assign so the
// existing t('key') lookup works unchanged.
// ---------------------------------------------------------------------------
Object.assign(STRINGS.hi, {
  'panchang.docTitle': 'पंचांग — आज का पंचांग',
  'panchang.title': 'पंचांग',
  'panchang.subtitle': 'दैनिक वैदिक पंचांग — सूर्योदय से आधारित',
  'panchang.badge': '✨ 100% Free पंचांग — हिंदी + English',
  'panchang.dateLabel': 'दिनांक',
  'panchang.placeLabel': 'स्थान',
  'panchang.searchPlace': 'स्थान खोजें…',
  'panchang.getPanchang': 'पंचांग देखें',
  'panchang.calculating': 'गणना हो रही है…',
  'panchang.engineError': 'गणना इंजन लोड नहीं हो सका — थोड़ी देर बाद दोबारा कोशिश करें।',
  'panchang.section.today': 'आज का पंचांग',
  'panchang.section.sunMoon': 'सूर्य और चंद्र गणना',
  'panchang.section.monthYear': 'हिंदू मास और वर्ष',
  'panchang.section.ashubha': 'अशुभ समय (अशुभ मुहूर्त)',
  'panchang.section.shubha': 'शुभ समय (शुभ मुहूर्त)',
  'panchang.section.disha': 'दिशा शूल',
  'panchang.section.bala': 'चंद्रबल और ताराबल',
  'panchang.section.lagna': 'सूर्योदय पर लग्न चार्ट',
  'panchang.section.planets': 'सूर्योदय पर ग्रह स्थिति',
  'panchang.f.tithi': 'तिथि',
  'panchang.f.nakshatra': 'नक्षत्र',
  'panchang.f.karana': 'करण',
  'panchang.f.paksha': 'पक्ष',
  'panchang.f.yoga': 'योग',
  'panchang.f.vaar': 'वार',
  'panchang.f.sunrise': 'सूर्योदय',
  'panchang.f.sunset': 'सूर्यास्त',
  'panchang.f.moonSign': 'चन्द्र राशि',
  'panchang.f.moonrise': 'चन्द्रोदय',
  'panchang.f.moonset': 'चन्द्रास्त',
  'panchang.f.ritu': 'ऋतु',
  'panchang.f.shaka': 'शक सम्वत',
  'panchang.f.vikram': 'विक्रम सम्वत',
  'panchang.f.kali': 'काली सम्वत',
  'panchang.f.pravishte': 'प्रविष्टे / गत्ते',
  'panchang.f.monthPurnimanta': 'मास पूर्णिमांत',
  'panchang.f.monthAmanta': 'मास अमांत',
  'panchang.f.dayDuration': 'दिन काल',
  'panchang.upto': 'तक',
  'panchang.from': 'से',
  'panchang.to': 'तक',
  'panchang.fullNight': 'पूरी रात',
  'panchang.adhik': 'अधिक',
  'panchang.na': 'उपलब्ध नहीं',
  'panchang.chart.north': 'उत्तर भारतीय',
  'panchang.chart.south': 'दक्षिण भारतीय',
  'panchang.chart.east': 'पूर्व भारतीय (बंगाली)',
  'panchang.planets.modernNote': 'आधुनिक ग्रह (परंपरागत वैदिक ज्योतिष में प्रयुक्त नहीं)',
  'panchang.widget.title': 'आज का पंचांग',
  'panchang.widget.button': 'आज का पंचांग',
  'panchang.widget.daySamvat': 'दिन और संवत्',
  'panchang.f.taraBala': 'ताराबल',
  'panchang.f.chandraBala': 'चन्द्रबल',
  'panchang.f.graha': 'ग्रह',
  'panchang.f.rashi': 'राशि',
  'panchang.f.degree': 'अंश',
  'panchang.f.pada': 'पद',
  'panchang.errNeedPlace': 'पहले जगह खोजकर चुनें।',
  'panchang.errDate': 'सही दिनांक चुनें।',
  'panchang.errPlace': 'स्थान खोजने में दिक़्क़त — दोबारा कोशिश करें।',

  // होमपेज कुंडली मिनी-विजेट (widgets/kundli/)
  'kw.title': 'कुंडली / Birth Chart',
  'kw.errPlacePick': 'खोजें दबाकर सूची में से सही जगह चुनें।',
  'kw.opening': '✅ कुंडली नई tab में खुल रही है…',

  // होमपेज कुंडली-मिलान मिनी-विजेट (widgets/match/)
  'mw.title': 'कुंडली मिलान / Kundli Matching',
  'mw.opening': '✅ मिलान रिपोर्ट नई tab में खुल रही है…',
})
Object.assign(STRINGS.en, {
  'panchang.docTitle': "Panchang — Today's Panchang",
  'panchang.title': 'Panchang',
  'panchang.subtitle': 'Daily Vedic almanac — anchored to sunrise',
  'panchang.badge': '✨ 100% Free Panchang — Hindi + English',
  'panchang.dateLabel': 'Date',
  'panchang.placeLabel': 'Place',
  'panchang.searchPlace': 'Search place…',
  'panchang.getPanchang': 'Get Panchang',
  'panchang.calculating': 'Calculating…',
  'panchang.engineError': 'Engine could not load — please retry in a moment.',
  'panchang.section.today': 'Panchang For Today',
  'panchang.section.sunMoon': 'Sun And Moon Calculations',
  'panchang.section.monthYear': 'Hindu Month And Year',
  'panchang.section.ashubha': 'Inauspicious Timings (Ashubha Muhurat)',
  'panchang.section.shubha': 'Auspicious Timings (Shubha Muhurat)',
  'panchang.section.disha': 'Disha Shoola',
  'panchang.section.bala': 'Chandrabalam And Tarabalam',
  'panchang.section.lagna': 'Lagna Chart at Sunrise',
  'panchang.section.planets': 'Planetary Position at Sunrise',
  'panchang.f.tithi': 'Tithi',
  'panchang.f.nakshatra': 'Nakshatra',
  'panchang.f.karana': 'Karana',
  'panchang.f.paksha': 'Paksha',
  'panchang.f.yoga': 'Yoga',
  'panchang.f.vaar': 'Day',
  'panchang.f.sunrise': 'Sun Rise',
  'panchang.f.sunset': 'Sun Set',
  'panchang.f.moonSign': 'Moon Sign',
  'panchang.f.moonrise': 'Moon Rise',
  'panchang.f.moonset': 'Moon Set',
  'panchang.f.ritu': 'Ritu',
  'panchang.f.shaka': 'Shaka Samvat',
  'panchang.f.vikram': 'Vikram Samvat',
  'panchang.f.kali': 'Kali Samvat',
  'panchang.f.pravishte': 'Pravishte / Gate',
  'panchang.f.monthPurnimanta': 'Month Purnimanta',
  'panchang.f.monthAmanta': 'Month Amanta',
  'panchang.f.dayDuration': 'Day Duration',
  'panchang.upto': 'upto',
  'panchang.from': 'From',
  'panchang.to': 'To',
  'panchang.fullNight': 'Full Night',
  'panchang.adhik': 'Adhik',
  'panchang.na': 'N/A',
  'panchang.chart.north': 'North Indian',
  'panchang.chart.south': 'South Indian',
  'panchang.chart.east': 'East Indian (Bengali)',
  'panchang.planets.modernNote': 'Modern planets (not used in traditional Vedic astrology)',
  'panchang.widget.title': "Today's Panchang",
  'panchang.widget.button': 'Today Panchang',
  'panchang.widget.daySamvat': 'Day & Samvat',
  'panchang.f.taraBala': 'Tarabalam',
  'panchang.f.chandraBala': 'Chandrabalam',
  'panchang.f.graha': 'Planet',
  'panchang.f.rashi': 'Rashi',
  'panchang.f.degree': 'Degree',
  'panchang.f.pada': 'Pada',
  'panchang.errNeedPlace': 'Please search and pick a place first.',
  'panchang.errDate': 'Please pick a valid date.',
  'panchang.errPlace': 'Place search failed — please try again.',

  // Homepage Kundli mini-widget (widgets/kundli/)
  'kw.title': 'Kundli / Birth Chart',
  'kw.errPlacePick': 'Press Search and pick the right place from the results.',
  'kw.opening': '✅ Opening the full Kundli in a new tab…',

  // Homepage Kundli-Matching mini-widget (widgets/match/)
  'mw.title': 'Kundli Matching',
  'mw.opening': '✅ Opening the match report in a new tab…',
})
