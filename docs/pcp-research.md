# PCP / “Special Transit” — Research Log & Open Items
**Status: v0.95 (built & live) — research continues.** Updated: 2026-10-09.
(2026-10-09: Saturn-159 लंबी-range decode — rise rows, शनि-X-dip, display-convention; score 27/51 → 47/65। ब्यौरा: findings §17।)
(यह दस्तावेज़ PCP/Special Transit पर हुई सारी research का एक-जगह ब्यौरा है — भविष्य के काम के लिए।)

## 0) कहाँ क्या है
- **Feature (live)**: `/bnn/` page → bottom section "🌟 स्पेशल ट्रांज़िट (Special Transit)".
  - Engine: `src/bnn/pcp.js` · UI: `src/bnn/pcp-ui.js` · tests: `tests/bnn-pcp.test.js`.
  - Controls: tabs [सभी ग्रह · राहु-केतु · शनि-गुरु] · जन्म-ग्रह चयन · ●1579/●159 · start/end dates · खोजें · प्रति-गोचर tables (PLANET/DATE/ASPECT/RETRO) · प्रिंट।
- **Legacy reference**: Gemini software का "GEMINI'S SPECIAL TRANSIT" (Parallels Windows 11 VM)।
  - हमारे पास संदर्भ screenshots: `workspace/.openclaw/tmp/bnn-ref/pcp/` (व K' bound copies attachments में)।
- **Calibration/check**: `node scripts/bnn-calib/pcp-check.mjs` — legacy तालिकाओं से milan (स्कोर नीचे §3)।
- **ब्यौरे का इतिहास**: `docs/bnn-calib-findings.md` §9–§16 + `NOTES.md` (2026-10-07 की PCP entries)।

## 1) Decoded rules (जो पक्का मिल चुका है)
1. **का (frame) नियम**: जन्म-ग्रह N की राशि से {0,4,6,8} राशियाँ = N की 1/5/7/9 स्थितियाँ (forward-count), और वही चारों राशियाँ backward-count भी (1/5/9/7)। 159-set = {1,5,9}; 1579-set = {1,5,7,9}।
2. **rv (frame value)**: राशि के 0° से नापी डिग्री − N की डिग्री (बीच की शाखा)। सारी रेखाएँ rv-स्पेस में हैं।
3. **Direct pass** (सीधा गोचर): **शुरुआत = जब गोचर-ग्रह rv = −lead पार करे (ऊपर की ओर); अंत = rv = +1**। (owner के hint से मिला: "sir ने कुछ degree पहले से starting point लिया…जब degree पार करता है तो end…"।)
4. **Per-planet leads (पहले से कितने अंश)** — verified empirically:
   - गुरु-गोचर वाली tables: बुध ≈0.15° · गुरु ≈0.17° · शनि ≈0.9° · चंद्र ≈2.44° · सूर्य ≈3.86° · मंगल 5° · शुक्र 6° · केतु ≈13.94° · राहु ≈14.42°।
   - शनि-गोचर वाली tables में कुछ अलग (verified so far): चंद्र ≈8.29° · राहु ≈10.4° · गुरु ≈5.4° · शनि ≈0.89° · मंगल 5°। (सूर्य/बुध/शुक्र/केतु × शनि — अभी अनुमान, जाँच बाक़ी।)
   - Code में: `PCP_LEADS` (per birth) + `PCP_LEADS_BY_TRANSIT` (birth×transit overrides)।
5. **Labels**: `<BIRTH>-k` — k = जन्म-ग्रह की स्थिति गोचर-ग्रह की राशि से; direct = forward count, retro = backward count (guide R18)।
6. **Clipping**: row शुरू होने से पहले range शुरू हो तो start = range-edge (और range-बाहर rows हट जाती हैं)। F/R flag = उस तारीख़ पर गोचर ग्रह की चाल (vक्री=R)।
7. **Retro rows (जो समझा)**: कुछ dip-प्रकार —
   - `[E(+10°40′)↓ या station-R → station-D / −1↓]` (मंगल के कुछ cases),
   - `[station-R → station-D]` (VEN-9, Mercury-2029),
   - `[station-D → +1]` rise-rows (SUN-7 2026, चंद्र 15-07-2030),
   - और `[x → station]` प्रकार (RAH-1 [−23.5° → station], KET rows) — **यही अभी अधूरा हिस्सा है।**
8. **Rise rows [D→B]** (2026-10-09 decode): station-D पर अगर `−lead ≤ rvD < +1` → नई row
   [D → अगला +1° crossing]। rvD < −lead हो → वही पुराना A-crossing row बनता है; rvD ≥ +1 → कुछ नहीं।
9. **शनि-जन्म (birth=Saturn)**: leads शनि×शनि = 10.667, शनि×गुरु = 10.72; शनि की dips +10°40′ पर नहीं
   — **X-line ≈ rv +3.9** (code: zDeg+0.7) पर खुलती हैं; X तक न पहुँचें → कोई dip row नहीं।
10. **Display convention** (2026-10-09): दिखने वाली तारीख़ = crossing + 12h की IST तारीख़ (noon-to-noon
   दिन); range-edge = edge की तारीख़। −1° mid line गुरु के लिए −1.02, शनि −1.00 (display-fit)।

## 2) अब तक की validation (legacy से मिलान)
- **मंगल (1579, 07-10-2026→07-01-2040): 15/15 ✅ पूरा perfect** (गुरु 9 + शनि 6)।
- **शनि (1579, 2026-2031): 5/5 ✅** (2026-10-09 को 2/5 → 5/5)।
- **शनि-159 (09-10-2026→09-10-2048, owner के screens): 14/14 ✅ exact** (सारे visible rows)।
- नया पूरा स्कोर: **47/65** — सूर्य 2/4 · शुक्र 2/4 · चंद्र 4/9 · गुरु-b 3/4 · राहु 1/7 · केतु 1/4।
- बाक़ी FAIL पंक्तियाँ = सूर्य/चंद्र के "D-से-शुरू" rows + राहु/केतु की station-टुकड़े + बाक़ी leads।

## 3) Reference tables (जो legacy से capture हुईं — source of truth)
| चार्ट (selected ग्रह) | Settings | Rows (legacy) | कहाँ |
|---|---|---|---|
| मंगल | sg · 1579 · 07-10-2026→07-01-2040 | गुरु 9 + शनि 6 | `.openclaw/tmp/bnn-ref/pcp/mars-*` |
| सूर्य | sg · 1579 · 07-01-2026→07-06-2031 | गुरु 2 + शनि 2 | pcp/sun-* |
| शुक्र | वही | गुरु 4 | pcp/venus-* |
| चंद्र | वही | गुरु 7 + शनि 3 | pcp/moon-* |
| गुरु | वही | गुरु 1 + शनि 3 | pcp/jupiter-* |
| शनि | वही | गुरु 2 + शनि 3 | pcp/saturn-* |
| राहु | वही | गुरु 3 + शनि 4 | pcp/rahu-* |
| केतु | वही | गुरु 2 + शनि 1 | pcp/ketu-* |
(सब expectations `scripts/bnn-calib/pcp-check.mjs` में भी दर्ज हैं।)

## 4) अगले काम (future)
1. **सूर्य/चंद्र के "D-से-शुरू" rows** — rvD << start-line होते हुए भी [D→B] क्यों (शनि/मंगल में नहीं) —
   per-chart condition ढूँढना; साथ में चंद्र का rv≈−27.14 वाला X-row और शुक्र का "E-छिपा" व्यवहार।
2. **Mercury/राहु/केतु की dip-structures** — owner से उनकी 159 tables (लंबी range) माँगना — सबसे
   ज़्यादा बाक़ी rows वहीं हैं (राहु 6, केतु 2, केतु-b sat ...)।
3. **159 vs 1579 का dip-अपवाद** (Mercury-2029) — खुला।
4. **शनि×गुरु lead (10.72) और शनि-X (3.9137) की guru/डेटा-पुष्टि** — एक-दो और charts से।
5. हर सुधार के बाद: `pcp-check` चलाएँ (लक्ष्य: सारे 65 ✅), tests, फिर commit+deploy।
6. जब भी काम शुरू करें: पहले **यह दस्तावेज़ + findings §9–§17 + `pcp-check.mjs`** पढ़ें।
