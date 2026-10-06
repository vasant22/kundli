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
