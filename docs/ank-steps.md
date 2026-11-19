# अंक ज्योतिष page — प्रगति (टास्क 01 से)

टास्क-फ़ाइल: `~/MyAIHub/tasks/2026-11-19-autoclaw-ank-01-ganana.md` · नियम: `…-ank-00-niyam.md`

## टास्क 01 — गणना-engine `src/ank/` + tests + oracle ✅ (19-11-2026)

- [x] Step 1 — `src/ank/` का ढाँचा: `core.js`, `name.js`, `loshu.js`, `time.js`, `match.js`, `remedy.js`, `index.js`, `names.js` (नामों की अस्थायी सूची — असली Claude देगा)
- [x] Step 2 — मूल तालिकाएँ `core.js` + 81-कोठरी truth-table test (हर कोठरी अलग) + 10–52 की 43 श्रेणियाँ
- [x] Step 3 — जन्म-तिथि के अंक (मूलांक/भाग्यांक/chain) + तिथि-जाँच (29-02, 31-04, 1900–2100)
- [x] Step 4 — `name.js`: चाल्डियन, नाम-स्कोर (breakdown keys के साथ), spelling-सुझाव, नए नाम, check-spellings
- [x] Step 5 — `loshu.js`: ग्रिड, कुआ, खाली/दोहराए अंक, आठ रेखाएँ
- [x] Step 6 — `time.js`: व्यक्तिगत वर्ष/मास, अगले 10 वर्ष/12 महीने, आयु (Asia/Kolkata)
- [x] Step 7 — `match.js`: जीवनसाथी %, मोबाइल, व्यापार-नाम
- [x] Step 8 — `remedy.js`: शुभ अंक, रत्न/धातु key, साप्ताहिक योजना, शुभ/सावधानी तिथियाँ
- [x] Step 9 — `index.js` `buildAnkData` (साफ़ JSON, हर ग़लत input पर `errors[]`, कभी crash नहीं)
- [x] Step 10 — 5 स्वीकृति-उदाहरण tests में पक्के (RAHUL 5.6 सामान्य · PRIYA 0 कमज़ोर)
- [x] Step 11 — oracle-मिलान 40 नाम+तिथियाँ: **1360/1360 = 100%** (`node scripts/ank-calib/oracle-compare.mjs`)
- [x] अंत — `npm test` **1341 ✓ + 3 todo** (85 files) · `npm run build` ✓ (बाक़ी pages के आकार वही) · local commit
- [x] `NOTICE.md` में मौलिक-लेखन की पंक्ति

**यहाँ रुका:** टास्क 02 (page) के लिए Claude का design-kit + text चाहिए; page/CSS/बाक़ी कुछ नहीं बना।

## टास्क 02 — page + PDF (Claude के design-kit और text के बाद)

(अभी शुरू नहीं)

## टास्क 03 — जाँच + deploy ("deploy भी करो" पर)

(अभी शुरू नहीं)
