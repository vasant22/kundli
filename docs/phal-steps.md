# फलादेश PDF — काम की सूची (steps) और प्रगति

यह file टोकन ख़त्म होने पर काम वहीं से शुरू करने के लिए है। टास्क 01 से 04 तक का
पूरा नक़्शा नियम-फ़ाइल `2026-11-11-autoclaw-phal-00-niyam.md` में है; यहाँ सिर्फ़
"कहाँ तक हुआ" और "आगे क्या" रहता है।

## जगहें (एक नज़र में)
- Repo: `~/.openclaw-autoclaw/workspace/projects/kundli`
- नई परत: `src/phal/` · Tests: `tests/phal-*.test.js`
- Public URL (टास्क 03 में): `mybapuji.com/kundli-phal/` ← `phal/index.html`

## टास्क 01 — गणना-परत ✅ (2026-11-11)
- [x] `src/phal/frame.js` — whole-sign भाव, स्वामी, ग्रह→भाव नक़्शा, शुभ/पाप
- [x] `src/phal/vargas.js` — षोडशवर्ग (D1…D60) + D60 देवता + लग्न-संवेदनशीलता
- [x] `src/phal/dignity.js` — उच्च/नीच/मूलत्रिकोण/पंचधा मैत्री/अस्त/दिग्बल/वर्गोत्तम + कार्येश स्वभाव
- [x] `src/phal/strength.js` — विंशोपक बल (भार 20) + श्रेणी
- [x] `src/phal/dasha.js` — महादशा → अंतर्दशा → प्रत्यंतर (kundli page से हूबहू)
- [x] `src/phal/yogas.js` — 30+ योग + दृष्टि-तालिका
- [x] `src/phal/doshas.js` — मंगल दोष (mangaldosha.js से), कालसर्प, गुरु-चांडाल
- [x] `src/phal/sadesati.js` — साढ़ेसाती/ढैया, जन्म से 100 वर्ष, वक्री-टुकड़े सहित
- [x] `src/phal/ashtakavarga.js` — BAV (48/49/39/54/56/52/39) + SAV 337
- [x] `src/phal/gochar.js` — आज का गोचर + अगले 2 वर्ष के राशि-परिवर्तन
- [x] `src/phal/avakahada.js` — वर्ण/वश्य/योनि/गण/नाड़ी, पाद-अक्षर, कारक, कारकांश, सुदर्शन
- [x] `src/phal/ratna.js` + `gems.js` — जीवन/भाग्य/कारक रत्न + चेतावनी + निर्बल ग्रह
- [x] `src/phal/index.js` — `buildPhalData(swe, birth, {nowMs})`
- [x] 12 test files, 177 tests · पूरा suite 974 ✓

## टास्क 02 — मौलिक हिंदी फलादेश text (बाक़ी)
- [ ] `src/phal/text/` — हर भाग का text (लग्न, ग्रह-भाव, योग, दशा, गोचर, उपाय)
- [ ] Vas22 जी के लिए review-पत्र (कौन-सा वाक्य किस नियम से)
- [ ] पूरा text सिर्फ़ `buildPhalData` के object से — कोई अलग गणना नहीं

## टास्क 03 — report page + PDF (बाक़ी)
- [ ] `phal/index.html` + `src/phal/render.js` + `phal.css` (mybapuji रंग)
- [ ] kundli page पर "📄 विस्तृत फलादेश (PDF)" बटन (result के नीचे, layout न बदले)
- [ ] `vite.config.js` + `scripts/build-server-layout.mjs` में नया entry
- [ ] Print-CSS (25–35 पन्ने, A4), कोई बाहरी font/tracker नहीं

## टास्क 04 — जाँच (बाक़ी)
- [ ] oracle (सिर्फ़ `.openclaw-tmp/phal-oracle/`) से अंक मिलान
- [ ] print-PDF screenshots, 5 कुंडलियाँ
- [ ] deploy-तैयारी (deploy नहीं — Vas22 जी की हाँ बाद में)

## खुले प्रश्न (Vas22 जी से पूछने)
1. D60 के 60 देवताओं के नाम BPHS अ.6 से लिए; #51–60 की वर्तनी और शुभ/अशुभ विभाजन
   परवर्ती सूचियों पर है — छापे से मिलान चाहिए।
2. D60 में सम राशि के लिए राशि-गिनती भी उलटी होती है या सिर्फ़ देवता-क्रम उलटा?
   (अभी: गिनती सीधी, देवता उलटे — कार्य-निर्देश के अक्षरश: अर्थ पर।)
3. विंशोपक में वर्ग-नीच का अंक 5 रखा है (शास्त्र में अलग अंक नहीं मिला) — ठीक है?
