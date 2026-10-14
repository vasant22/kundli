# PCP / “Special Transit” — Research Log & Open Items
**Status: v1.2 (built & live) — research continues.** Updated: 2026-10-10 (तीसरा दौर — चंद्र+शुक्र)।
(2026-10-09: Saturn-159 decode — rise rows, शनि-X-dip, display; 27/51 → 47/65।
2026-10-10: राहु-केतु (159, 2026→2048) decode — leads 23.65–27.3, node X-line, [D→C] close; score → 81/91। ब्यौरा: findings §17–§18।)
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
11. **राहु/केतु (2026-10-10 decode)**: leads — राहु **23.75** (×गुरु) / **23.65** (×शनि); केतु **27.2** / **27.3**;
   **X-line** राहु **+7.36** (zDeg+0.193), केतु +7.30; **rise row अब [D→C] भी बंद** होती है (rv_C < −1°)।
12. **बुध/सूर्य (2026-10-10 दूसरा दौर)**: बुध — line **+0.15** (RV), **X ≈ +27.15**; सूर्य — lead **4.05**,
   **X ≈ −0.2**; **rise-window** (126.5–137.5 दिन; rvD ≥ −20°) — इसके बाहर की sub-startLine rise rows
   अपने A-crossing रूप में आती हैं; shallow dip station-D के बाद **+1** पर बंद (दीप close रूल update)।
13. **शुक्र (2026-10-10 तीसरा दौर)**: lead **6.2°**, **X = +27.2°** (C-open iff rvC ≤ X)।
14. **चंद्र (2026-10-10 तीसरा दौर)**: **C-open iff rvC ∈ [+7°, +23.7°]** (X+ = 23.7); **deep-A = −27.15°**
   (ऊपर crossing → rows); **rise fire-floor −25.5°, band लागू नहीं**।

## 2) अब तक की validation (legacy से मिलान)
- **मंगल (1579): 15/15 ✅** · **शनि (1579): 5/5 ✅** · **शनि-159: 14/14 ✅ exact**।
- **राहु-159: 18/18 ✅ और केतु-159: 18/18 ✅** (19 exact, बाक़ी ±1 दिन — सर की display-jitter; §18)।
- नया पूरा स्कोर: **151/158 PASS** — मंगल/शनि/राहु/केतु/बुध/सूर्य/चंद्र/शुक्र सब हरे; बाक़ी 7 = शुक्र-2035 split 2 · सूर्य ±2 outlier 1 · पुराने चंद्र legacy 3 · गुरु-b 1।
- बाक़ी FAIL = सूर्य/चंद्र के "D-से-शुरू" rows · शुक्र का E-छिपा व्यवहार · गुरु-b का एक row · (सूर्य×शनि
  lead अभी अनुमानित)।

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

## 5) All-planets captures (2026-10-14, user) — chain semantics (नया)
- Screenshots: `.openclaw/tmp/bnn-ref/pcp/allplanets-{sun,mars}-{1,2}.png` · settings: **All Planets · 14-10-2026 → 14-10-2030** · जन्म-ग्रह = सूर्य और मंगल।
- **Display = chain:** हर नई row-opening उसी क्षण पिछली row को बंद कर देती है (End और अगली Start एक ही मिनट पर)। PLANET label = `<BIRTH>-<गोचर ग्रह>` (नताल-वक्री पर `#`) — webapp में `k` (1/5/7/9) की जगह।
- Sun-chain (14-10-26 → 24-01-27): KET 14-10 → VEN 26-10 00:56 → MOO 02-11 04:32 → RAH 30-11 → JUP# 24-12 → MAR# 01-01-27 → SAT# 07-01 → SUN 19-01 → MER 23-01 → … ; (2027-28) MAR# 01-03-27 → SAT# 07-03-27 → [लंबी SAT# जोड़] → 09-09-28 MAR#/SAT# → SUN 21-09-28 → MER 26-09 → MOO 27-09 → KET 30-09 → VEN 25-10 → MOO 01-11 → RAH 29-11-28।
- Mars-chain (14-10-26 → 09-01-28): RAH 14-10 → VEN 02-12 → JUP# 29-12 → VEN 26-01-27 → RAH 31-01 → MOO 20-02 → RAH 01-04 → VEN 21-05 → … KET 05-09-27 → VEN 05-09 → MOO 16-09 → RAH 26-10 → JUP# 29-11 → MAR# 10-12 → SAT# 17-12 → SUN 01-01-28 → MER 08-01 → KET 09-01-28।
- **पक्के मिलान (opening event vs engine maths):** सूर्य-opening = rv −4.05 (19-01-2027) ✓ · मंगल (जन्म-मंगल) = rv −5.00 ✓ · शुक्र-opening = rv **+27.2 = X-line** (26-10-2026; §13) ✓ · पहली KET-row = range-start पर clipped (asli opening ~26-08-2026 = [Can 8°10′ + 27.2°] पर) ✓।
- **गैप (next work):** decoded leads/conditions अब तक **गुरु/शनि-गोचर वाली** tables से हैं; all-planets के जोड़े (सूर्य×शुक्र, सूर्य×केतु, सूर्य×राहु…) की opening-lines decode करनी बाक़ी हैं। Engine अभी (जन्म-सूर्य, 2026–2030, group=all): sun 16, moon 213, mars 10 (first 07-2027), mercury 19 (01-2027), jupiter 1 (16-08-2028 ✓), venus 16 (first **02-2027**, चाहिए 10-2026), saturn 1 (2030), rahu 1 (**01-2028**, चाहिए 11-2026), **ketu 0** — यानी इन जोड़ों की openings sir से बहुत देर से/कभी नहीं आ रहीं।
- **Chain display app में अभी नहीं** — पहले ये openings decode हों, वरना chain गलत rows से बनेगी। (Format वाला हिस्सा राउंड-13 में हो गया: एक merged तालिका, SUN-KET labels, HH:MM।)

## 4) अगले काम (future)
1. **शुक्र-2035 का split** ([16-11-2034→23-03-2035] + [24-03-2035→30-03-2035]) — decode बाक़ी; चंद्र के
   deep-fire की चयन-शर्त भी और डेटा से संकरी/साफ़ करनी है।
2. **सूर्य/चंद्र के "D-से-शुरू" rows** (rvD << start-line होते हुए भी [D→B]) — per-chart शर्त ढूँढना;
   चंद्र का rv≈−27.14 वाला X-row; शुक्र का "E-छिपा" व्यवहार।
3. **159 vs 1579 का dip-अपवाद** (Mercury-2029) — खुला।
4. **Node leads (23.65–27.3) व X (7.30/7.36) की और पुष्टि** — बुध/सूर्य charts से।
5. हर सुधार के बाद: `pcp-check` चलाएँ (लक्ष्य: सारे 122 ✅), tests, फिर commit+deploy।
6. जब भी काम शुरू करें: पहले **यह दस्तावेज़ + findings §9–§19 + `pcp-check.mjs`** पढ़ें।
