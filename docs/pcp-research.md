# PCP / “Special Transit” — Research Log & Open Items
**Status: v0.9 (built & live) — research continues.** Updated: 2026-10-07.
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

## 2) अब तक की validation (legacy से मिलान)
- **मंगल (1579, 07-10-2026→07-01-2040): 15/15 ✅ पूरा perfect** (गुरु 9 + शनि 6)।
- पूरा स्कोर: **27/51** — सूर्य 2/4 · शुक्र 2/4 · चंद्र 4/9 · गुरु 2/4 · शनि 2/5 · राहु 0/7 · केतु 0/4।
- बाक़ी FAIL पंक्तियाँ = सब retro/station-टुकड़ों की structure (§1.7 का अधूरा हिस्सा)।

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
1. **Retro/station-टुकड़ों का rule** — बाक़ी failed rows से decode करना (RAH/KET + सूर्य-चंद्र की कुछ rows सबसे अच्छे samples)।
2. **बाक़ी lead-combos** भरना (सूर्य×शनि, बुध×शनि, शुक्र×शनि, केतु×शनि; गुरु×शनि के 5.4 vs 7.4 की पुष्टि) — ज़रूरत हो तो owner से एक-दो और tables।
3. **159 vs 1579 का dip-अपवाद** (Mercury-2029) — खुला।
4. हर सुधार के बाद: `pcp-check` चलाएँ (लक्ष्य: सारे 51 ✅), tests, फिर commit+deploy।
5. जब भी काम शुरू करें: पहले **यह दस्तावेज़ + findings §9–§16 + `pcp-check.mjs`** पढ़ें।
