# BNN अयनांश + भावचलित calibration — नतीजे (2026-10-07)

Reference चार्ट: जन्म **22-01-1980, 20:30, बैतूल** (user का अपना chart — software Ref No 58)।
लक्ष्य: guide भाग 5 के सारे मान **1 कला (arcminute) के भीतर**।
Scripts: `scripts/bnn-calib/` · दोबारा चलाएँ: `node scripts/bnn-calib/ayanamsa-final.mjs` (candidates) और `node scripts/bnn-calib/ayanamsa-confirm.mjs` (final check)।

## 1) KP / Krishnamurti candidates की जाँच

| sweph mode | नाम (package strings से) | value (22-01-1980) | ग्रहों का max अंतर | नतीजा |
|---|---|---|---|---|
| 5 | Krishnamurti | 23°28′54″ | ~7.0′ | ✗ बहुत दूर |
| 45 | Krishnamurti VP291 | 23°30′07″ | ~5.8′ | ✗ दूर |
| 43 | Lahiri 1940 | 23°33′50″ | ~2.1′ | ~ पास |
| **44** | **Lahiri VP285** | **23°35′06″** | **~0.84′** | **✓ सबसे अच्छा** |
| 46 | Lahiri ICRC | 23°34′41″ | ~1.2′ | ~ पास |
| 1 | Lahiri | 23°34′43″ | ~1.2′ | ~ पास |

→ reference चार्ट का "KP New" **व्यवहार में mode 44 (23°35′06″)** जैसा है; Swiss Ephemeris के Krishnamurti modes (5 / 45) मेल नहीं खाते।

## 2) चुने गए settings

- **Ayanamsa = mode 44, value 23°35′06″** — `src/bnn/kp.js` → `BNN_SETTINGS.ayanamsaMode = 44`
- **भाव-संधियाँ = UT + ΔT** — `BNN_SETTINGS.housesAtDeltaT = true` (नीचे §3)

## 3) ✅ पुष्टि — user के screenshots से (07-10-2026)

पुराने software की details screen से: Betul **latitude 21.4833 / longitude 78.25**, जन्म **20:30:00**, GMT 5.5।
इन exact inputs पर बचा हुआ अंतर सिर्फ़ ~50 सेकंड था — जो ठीक **ΔT(1980) = 50.6s** है। यानी
**पुराना software भाव-संधियाँ UT + ΔT पर बनाता है** (चार्ट मिलान के लिए हमने भी वही settings लगाई)।

अंतिम मिलान (ΔT लगाकर, delta-t table):

- सभी 12 संधियाँ: **≤ 0.7′**
- सभी ग्रह: **≤ 0.9′** (सूर्य +0.87′, चंद्र +0.73′, बाक़ी ≤0.82′)

(रास्ता: पहले "+2m13s + lat≈21°29′" वाला सुराग़ निकला था — अब साफ़ है कि वह = coordinates
(78.25 बनाम अनुमानित 77.90) + ΔT का जोड़ था।)

इसके साथ दो बारीक़ियाँ और मिलाई गईं (दोनों code+tests में pinned):

- चार्ट के text में **मिनट truncate** होते हैं (8°09.87′ → "08.09", 13°36.69′ → "13.36")।
- भाव-संधि में **+0.5 सेकंड का fine-tune** — इससे चार्ट का हर visible अंक पुराने face से
  अक्षरशः same निकलता है (जाँच: `scripts/bnn-calib/chart-texts.mjs`)।

### भाव-संधियाँ (ΔT सहित · संगणना vs reference)

| संधि | संगणना | अंतर |
|---|---|---|
| 1 | सिंह 12°53.01′ | +0.01′ |
| 2 | कन्या 10°54.45′ | +0.45′ |
| 3 | तुला 11°31.41′ | +0.41′ |
| 4 | वृश्चिक 12°52.01′ | +0.01′ |
| 5 | धनु 13°36.69′ | +0.69′ |
| 6 | मकर 13°38.39′ | +0.39′ |
| 7–12 | (1–6 के दर्पण) | वही |

### ग्रह (ΔT सहित)

| ग्रह | संगणना | अंतर |
|---|---|---|
| सूर्य | मकर 8°09.87′ | +0.87′ |
| चंद्र | मीन 12°30.73′ | +0.73′ |
| मंगल# | सिंह 21°30.10′ | +0.10′ |
| बुध | मकर 8°59.46′ | +0.46′ |
| गुरु# | सिंह 15°30.44′ | +0.44′ |
| शुक्र | कुंभ 14°18.76′ | +0.76′ |
| शनि# | कन्या 3°12.82′ | +0.82′ |
| राहु | सिंह 7°10.10′ | +0.10′ |
| केतु | कुंभ 7°10.10′ | +0.10′ |

तिथि/योग/नक्षत्र-पद जाँच: **उत्तरा भाद्रपद-3 · शुक्ल षष्ठी · शिव योग** ✓

## 4) scripts

- `ayanamsa-check.mjs` — हर candidate की screening comparison
- `ayanamsa-fit.mjs` / `-diag.mjs` / `-diag2.mjs` — house-system × समय × latitude की खोज
- `ayanamsa-final.mjs` — candidates सूची + fine fit + पूरी तालिका
- **`ayanamsa-confirm.mjs`** — exact coords पर final verification (§3 की तालिका)
- `chart-texts.mjs` — चार्ट के display-text (truncated arcminutes) पुराने face से मिलान + +0.5s fine-tune

## 5) UI संदर्भ (old software के screenshots — Phase 2b+ के लिए)

- **Left (चार्ट):** दक्षिण-शैली grid; हर राशि cell में लाल "NN dd.mm" (भाव-संधि नंबर + डिग्री.मिनट,
  जैसे "09 11.31") और ग्रह "MOO 12.30" (वक्री पर #); सिंह cell में "ASC 12.53"; grid के बाहर चारों ओर
  गोचर के ग्रह; top-left box में **"MERCURY<>SATURN"** label; नीचे Back/Save बटन।
- **Centre panel** (grid के बीच): नाम / जगह / तारीख़+वार / AGE Y-M-D / नक्षत्र-पद / तिथि / योग /
  "VEN DHASA: …<>…" / "MER BHUKTHI: …<>…"।
- **Right side:** tables — BHAVA COMBINATION (1-5-9, 1-5-7-9, BRSSS, SPECIAL),
  PLANET COMBINATION (1-5-7-9, 1-5-9, SPECIAL, PRSSS, ASTRONOMY), DHAṢĀ/BHUKTHI/ANDHIRAM।
- Screenshots user के पास; नाम-सहित private ब्यौरा होने से **repo में नहीं रखे** — local copy:
  `.openclaw/tmp/bnn-ref/` (outer face + Betul coords screen)।

## 6) दशा अंशांकन (Phase 6, 2026-10-07)

- **दशा का चंद्र = UT + ΔT** (+0.5 s fine-tune — वही convention जो भाव-संधियों की है)। plain UT से पहली
  दशा-अंत 28-12-1985 आती; ΔT से **23-12-1985 exactly** (reference, guide भाग 5)। `dasha.js` →
  `DASHA_SETTINGS.useDeltaT`।
- Balance → कैलेंडर Y-M-D (वर्ष 365.25 दिन; महीना-भिन्न = 365.25/12; दिन round) → 5Y-11M-1D।
- महादशा-अंत = पूर्व-अंत + पूरे कैलेंडर वर्ष; भुक्ति = round(Y×366×b/120) दिन (आख़िरी = दशा-अंत);
  अंतर = floor(भुक्ति(नाममात्र) × a/120) दिन (आख़िरी = भुक्ति-अंत)।
- guide कहती है "अंतर का वर्ष ~364 दिन (±1 दिन)" — reference से re-fit: **366-आधारित floor हर
  readable तारीख़ से exactly मिलता है** (rows 1–6 + "JUP 21-05-2028" + "SAT 06-11-2028"=आख़िरी)।
  Screenshot में "RAH की पंक्ति कटी" थी; हमारी पूरी सूची में वह पंक्ति = 04-01-2028।
- Check: `scripts/bnn-calib/dasha-check.mjs` — **27/27 PASS** (महादशा 9 + भुक्ति 9 + अंतर 9)।

## 7) परिवर्तन "returned degree" नियम (गुरुजी — user, 2026-10-07)

- बदली हुई कुर्सी वाले ग्रह के लिए: उसकी कुर्सी-डिग्री से **1° के भीतर पीछे (उल्टी दिशा)** बैठा
  ग्रह combination में जुड़ता है। यहाँ: सूर्य बुध की डिग्री से 0.83° पीछे → **AP में SAT# row = SUN-97,
  BP में MER row = SUN-97** — दोनों old software से exactly मेल। प्रतिशत भाव-सूत्र से (97) —
  सीधे ग्रह-सूत्र से 94 आता था; match के लिए भाव-सूत्र। `combos.js` → `COMBO_SETTINGS.returnedCatchDeg = 1.0`।
- Report-only बाक़ी: BP-1579 MER row के extra cells VEN-37 / RAH-15 (159 में SAT10-18) — नियम नहीं मिला।

## 8) गोचर अंशांकन (Phase 7, 2026-10-07)

- Transit planets & ascendant: **UT + ΔT (+0.5 s)** — वही convention जो भाव-संधियों की।
  बाहर के अंक **arcminute पर ROUND** होते हैं (सबूत: "ASC 28.01" = 28°00.9′);
  अंदर के chart-text truncate ही रहते हैं (दो अलग code-paths)।
- Ref-1 (01-10-2026 ≈12:16 IST, guide भाग 5): सब 9 ग्रह ≤0.63′; "ASC 5°46′" ≈12:15:03 पर
  मिलता है (guide का समय "लगभग" है)।
- Ref-2 (07-10-2026 04:40:03 IST, outer-face screenshot): SAT# 16.52 · MAR 10.53 · JUP 26.24 ·
  VEN# 13.59 · MER 13.56 · SUN 19.28 · MOO 03.39 · ASC 28.01 — exact; RAH/KET में ~0.6′
  (उनका mean-node model swisseph से थोड़ा अलग; sign/degree ठीक)।
- check: `scripts/bnn-calib/transit-check.mjs` — **20/20 PASS**।

## 9) PCP (विशेष गोचर) — software का प्रथम अवलोकन (07-10-2026)
- Parallels VM (Windows 11) में Gemini software की **"GEMINI'S SPECIAL TRANSIT"** विंडो देखी + प्रथम search चलाया।
- Dialog: tabs **[All Planets | Rahu Kethu | Saturn Guru]** · START / END DATE (dropdown) · **Find** · Print · बाएँ **TRANSIT** radio-सूची (Sun…Kethu) · results: **PLANET | DATE | ASPECT | RETRO**।
- Run (Transit=**Sun**, 07-10-2026 → 07-11-2026): 
  `SUN-KET 07-10 12:16 Start → 26-10 01:04 End` · `SUN-VEN 26-10 01:04 Start → 02-11 04:40 End` · `SUN-MOO 02-11 04:40 Start → (चालू)` — सब **F**।
- **सत्यापित (हमारे sweph से exact)**: "End" = जब गोचर-सूर्य की डिग्री = जन्म-ग्रह की डिग्री **+1°** (26-10: तुला 8°09.85' ≈ केतु 7°10' +1; 02-11: तुला 15°18.2' ≈ शुक्र 14°18' +1 — ~5 मिनट के भीतर)। यानी guide का "1° बाद" ✓। संबंध-क्षेत्र = "5वाँ स्थान" (सूर्य तुला में ↔ केतु/शुक्र कुंभ में)।
- Rows **जुड़ी हुई** दिखीं: एक का End = अगले का Start (दोनों बार exact मिनट)।
- **खुला**: Start का नियम (पहली row का Start "07-10-2026 12:16" — संभवतः range-start समय; "4° पहले" इन rows में नहीं दिखा; chaining vs window-start अगली जाँच); 159/1579 का चुनाव इस dialog में नहीं दिखा (शायद मुख्य window की setting); tabs का असर; वक्री (R) वाले rows।
- अगला test: **गुरु/शनि** (guide भाग-4 वाला: `SUN-5 17-08-2028` आदि से मिलान) + tabs + 159/1579 की खोज — user के साथ।

## 10) PCP दूसरा दौर — user का setup (MARS · 1579 · Saturn Guru) — 07-10-2026
- **Settings**: tab = Saturn Guru · **BIRTH = MARS** · ● **1579** (यही 159/1579 का चुनाव है — END DATE के पास!) · range 07-10-2026 → 07-01-2040।
  दो tables: **TRANSIT JUPITER** (9 segments) + **TRANSIT SATURN** (6 segments)।
- **Format का रहस्य खुला**: "MAR-k" में k = गोचर-ग्रह से **मंगल की स्थिति** — काउंट **motion की दिशा में** (मार्गी = आगे, वक्री = पीछे)। guide R18 से मेल ✓
  (जैसे MAR-1 = वही राशि; MAR-5 = आगे से 5वीं; वक्री में पीछे से 9वीं = "MAR-9")।
- **Direct segments का window**: [Start, End] ≈ जब गोचर ग्रह उस frame-राशि में **[N−5°, N+1°]** में हो
  (exact margins ±0.1° तक पिन करने के लिए hh:mm चाहिए — display में सिर्फ़ तारीख़ें हैं)। उदाहरण-सत्यापन:
  MAR-1 = Leo [16.5→22.5] (गुरु 15-09-2027→13-10-2027); MAR-9 = Sag [16.5→22.5]; MAR-7 = Aqu; MAR-5 = Ari।
- **Retro/station segments** अलग rows में (R flags); stations पर segments बँटते हैं। कुछ छोटे retro "dip" segments के
  start-boundary का exact rule अभी pin नहीं हुआ (≈ अगली राशि के ~2.16° जैसा लगा — 3 samples) — और data चाहिए।
- **Jupiter rows** (Start→End): MAR-1 15-09-27→13-10-27; MAR-1 08-02-28(R)→14-05-28; MAR-9 03-01-32→29-01-32;
  MAR-5 25-07-32(R)→18-09-32; MAR-7 30-01-34→25-02-34; MAR-5 17-06-35→22-07-35; MAR-9 10-09-35(R)→14-11-35(R);
  MAR-5 15-01-36→09-03-36; MAR-1 31-08-39→27-09-39।
- **Saturn rows**: MAR-5 29-07-28→23-08-28(R); MAR-5 05-04-29→23-05-29; MAR-9 07-09-29(R)→19-01-30;
  MAR-1 06-10-37→04-02-38(R); MAR-1 23-06-38→22-08-38; MAR-1 08-03-39(R)→25-05-39।
- अगला: display-रणनीति (user के साथ) + exact margins के लिए समय-सहित output (Print?) / और charts।

## 11) PCP तीसरा दौर — Mercury@159 + main-window verification (07-10-2026)
- **Setup (user)**: Saturn Guru · BIRTH=MERCURY · ●**159** · range 01-01-2025 → 07-01-2033। दोनों tables पढ़े व verify किये।
- **🎯 LABEL-नियम पूरा हल (+ ~30 rows पर verified)**: "MER-k"/"MAR-k" में k = **जन्म-ग्रह की स्थिति, गोचर-ग्रह की राशि से गिनकर — गिनती उस segment की चाल की दिशा में**:
  मार्गी (direct) → आगे की गिनती; वक्री → पीछे की गिनती। Anchor = गोचर की वह राशि जहाँ segment का **अंत** होता है (straddle करने वाले dips भी अब fit: MAR-1, MAR-5, MER-9 वग़ैरह सब ✓)।
- **End-events**: ज़्यादातर = "जन्म-ग्रह की डिग्री + 1°" उस frame-राशि में (Jupiter Vir 10.06, Cap 10.12, Tau 9.99-10.03; Saturn Tau 9.99-10.03 — सब ≈ +1°/day-slop के भीतर) अथवा **station** (वक्री मोड़)। Rows stations पर टूटती हैं।
- **Start-events**: अभी 100% pin नहीं (Mars@1579 में ≈ N−5 जैसा दिखा; Mercury@159 में ≈ N+0.1..0.2 जैसा) — datetimes (hh:mm) मिले तो exact margins निकलेंगे; या guru-rules।
- **159 vs 1579 तुलना अधूरी**: 1579 वाला run pending (user से कराया जाएगा — 159 में rows कम/hल्की दिखीं)।
- **Main-window verification (bonus)**: चार्ट + centre panel + BHAVA/PLANET tables + VIMSHOTTARI live देखा — हमारी गणनाओं से मेल: dasha ages (49Y-11M-1D … 106Y-11M-1D), BRSSS rows, "3-11"/"10" tabs वाला old UI (जो हम नहीं बनाते)।

## 12) 159 vs 1579 — पहली तुलना (Mercury · Saturn Guru · 01-01-2025→07-01-2033) — 07-10-2026
- **Jupiter table का फ़र्क़ (159 → 1579)**:
  - 1579 में **जुड़ी**: `MER-7 [16-07-2026 → 20-07-2026]` — गुरु कर्क [9.19° → 10.07°] (जाँचा: कर्क = बुध की 7वीं स्थिति; window वही "≈ [N+0.25°, N+1°]" पैटर्न)।
  - 1579 में **हटी**: `MER-9 [11-02-2029 → 14-06-2029]` (गुरु का वक्री-चक्कर: station-r Lib 3.15 → station-d Vir 23.23) — यह row सिर्फ़ 159 में आई थी।
  - बाक़ी दोनों में समान: MER-5 [2025], MER-5 [10-09-2028→14-09-2028], MER-1 [18-12-2032→22-12-2032]।
- **Saturn table: दोनों modes में बिल्कुल समान** (8 rows, कोई फ़र्क़ नहीं)।
- **अर्थ (working)**: 1579 = 7वीं स्थिति जोड़ता है (MER-7); कुछ 9-वर्गीय station-वाले segments (सिर्फ़-159) हट जाते हैं। Exact अंतर-नियम अभी open — guru से पूछने लायक।
- **Mercury-सेट labels re-verified**: MER-5 (Tau↔retro-back & Vir-fwd), MER-7 (Can = opposition), MER-9 (Vir-back), MER-1 (Cap) — सब "direction-counted" नियम से ✓।

## 13) स्पेशल ट्रांज़िट (PCP) — हमारा version बना (Phase 7b, 2026-10-07)
- **इंजन `src/bnn/pcp.js`** (decode किये नियम): frames = जन्म-राशि + {0,4,6,8}; direct pass = [N−5° → N+1°]; retro dips = [N+10°40′↓ या station-R → N−1°↓ या station-D]; stations-cut; labels = चाल-दिशा में स्थिति k; 159/1579 sets; range-clip।
- **`scripts/bnn-calib/pcp-check.mjs`: 15/15 PASS** — legacy की मंगल तालिका (गुरु 9 rows + शनि 6 rows) से ±1 दिन के भीतर, labels exact।
- **UI**: page के bottom में section — tabs [सभी ग्रह | राहु-केतु | शनि-गुरु] · जन्म-ग्रह chips · ●1579/●159 · start/end · खोजें · TRANSIT tables (PLANET/DATE/ASPECT/RETRO) · प्रिंट। Headless browser में पूरा verify।
- खुला: start-margin का चार्ट-दर-चार्ट फ़र्क़ (Sun −4°, Mercury +0.2°, Mars −5°) — guru-पुष्टि बाक़ी; 1579 में एक dip-अपवाद (Mercury-2029)।

## 14) सूर्य-कुंडली की PCP तुलना (user, 14:15) — start-margin का रहस्य और गहरा हुआ
- User ने हमारा output vs software का output (SUN · 1579 · 07-01-2026→07-06-2031 · Jup+Sat) मिलाया।
- **मेल**: सारे **End** (+1° नियम) — 16-07-2026 ✓, 10-09-2028 (±1d) ✓, 29-06-2030 ✓; labels/set सही।
- **फ़र्क़ — start-margins chart-दर-chart बदलते हैं (verified precisely)**:
  - मंगल: ≈ **N − 5.0°** (7 rows)
  - सूर्य: ≈ **N − 3.85°** (2 rows: Jup-Vir 4.31, Sat-Tau 4.28 — दोनों −3.85±0.02) — और एक row station-D से शुरू (SUN-7 11-03-2026 = गुरु का Gem 20.86 station!)
  - बुध: ≈ N + 0.15°
  → कोई universal formula नहीं मिला; guru-rule ज़रूरी। (हमारा [−5,+1] सिर्फ़ मंगल पर perfect; अन्य charts पर start कुछ दिन-महीने खिसकता है।)
- **extra-stub बग-सा दिखने वाला मामला**: हमारी एक अतिरिक्त छोटी row [05-01→12-01-2028] — वह गुरु के micro-wiggle (Vir 3.15→3.25) से बनी; सही Sun-margin (−3.85) होने पर यह नहीं बनती। यानी यह भी margin का ही परिणाम।
- शनि-2030-31 dip का splitting भी margins से ही बदलता है (हम vs software अलग टुकड़े)।
- **Guru से पूछने वाला सटीक सवाल**: "PCP में हर कुंडली की Start-सीमा क्या होती है (N से कितने अंश पहले)? और वक्री-मोड़ों पर पंक्तियाँ कैसे बँटती हैं?"
