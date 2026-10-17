# SUBFOLDER MOVE — kundli.mybapuji.com → mybapuji.com (17 Oct 2026)

**मक़सद:** subdomain Google के लिए अलग site है, इसलिए उसकी visitors/backlinks/authority
मुख्य domain को नहीं मिलती। चारों tools को mybapuji.com के **असली pages** बनाना।

## Target URLs

| Tool | पुराना (GitHub Pages) | नया |
|---|---|---|
| वैदिक कुंडली | `kundli.mybapuji.com/` | **`mybapuji.com/kundli/`** |
| कुंडली मिलान | `kundli.mybapuji.com/match/` | **`mybapuji.com/kundli-milan/`** |
| पंचांग | `kundli.mybapuji.com/panchang/` | **`mybapuji.com/panchang/`** |
| फ्री BNN चार्ट | `kundli.mybapuji.com/bnn/` | **`mybapuji.com/bnn-chart/`** |
| कुंडली widget (iframe) | `/widgets/kundli/` | `/kundli/widget/` (noindex) |
| मिलान widget (iframe) | `/widgets/match/` | `/kundli-milan/widget/` (noindex) |
| पंचांग widget (iframe) | `/panchang-widget/` | `/panchang/widget/` (noindex) |

सारे paths **absolute** (root से) — इसलिए page कितनी भी गहरा हो, चलेगा।

## Server layout (docroot में)

```
public_html/
├── kundli/index.html
├── kundli-milan/index.html
├── panchang/index.html
├── bnn-chart/index.html
├── kundli/widget/index.html
├── kundli-milan/widget/index.html
├── panchang/widget/index.html
└── kundli-assets/            ← पूरा app payload, एक जगह
    ├── js/                   ← hashed JS/CSS/images (vite assetsDir)
    ├── wasm/                 ← swisseph.data + .wasm  (2.6 MB)
    ├── fonts/                ← Noto Devanagari subsets
    └── favicon*.png
```

**क्यों `kundli-assets/js/`?** swisseph-wasm अपनी files `new URL('../wasm/<f>', import.meta.url)`
से ढूँढता है — यानी chunk से **एक level ऊपर** `wasm/` चाहिए। `assetsDir: 'js'` इसीलिए रखा गया।
इसीलिए `vite.config.js` में `base: '/kundli-assets/'` **ज़रूरी** है (पुराना `'./'` था)।

## Backup / rollback

- `~/.openclaw-autoclaw/workspace/backups/kundli-move-20261017/` — ROLLBACK.md पढ़ें
- git tag `backup-pre-subfolder-20261017` (= `07597d1`, मूल state)
- **सबसे बड़ी सुरक्षा:** `kundli.mybapuji.com` अभी भी GitHub Pages पर चल रहा है।
  जब तक हम उसका DNS बदलते नहीं, पुराना setup ज़िंदा है। `git reset --hard backup-pre-subfolder-20261017` + `git push` = पूरा वापस।

## Status

### ✅ Done
- [x] Backup (tag + tarball + 8 live pages snapshot + WP templates)
- [x] `vite.config.js` — `base: '/kundli-assets/'`, `assetsDir: 'js'`
- [x] `src/fonts.css` — `/fonts/` → `/kundli-assets/fonts/` (app की एकमात्र hardcoded root path)
- [x] नया `src/pages.js` — 4 tool paths + 3 widget paths, एक जगह
- [x] 4 nav blocks (main/match/panchang-page/bnn) — relative → `PAGES.*`
- [x] Widgets: `buildOpenUrl` `../../` hop → `PAGES.*` (पुराना depth-coupling bug)
- [x] `panchang-widget.js` FULL_PAGE_URL → `PAGES.panchang`
- [x] Print/PDF footer links (main.js, match.js) + match PNG footer string
- [x] 4 HTML files — canonical + og:url + JSON-LD `url` + favicon
- [x] 3 widget HTML files — favicon
- [x] `index.html` static cross-links (`./match/` → `/kundli-milan/`)
- [x] `public/sitemap.xml` (4 नए URLs), `public/robots.txt` (नोट सहित), `public/CNAME` **हटाया**
- [x] Tests के URL assertions — **504/504 पास**
- [x] `scripts/build-server-layout.mjs` — dist → server layout + cache headers
- [x] **DEPLOYED + LIVE** — 6 URLs 200 OK, MIME सही (`application/wasm` ✓)

### 🔴 INCIDENT 2 — sitemap mu-plugin ne site gira di (fix ho chuka hai)

`autoclaw-kundli-sitemap.php` (naya mu-plugin, robots.txt + sitemap index ke liye) upload karte hi
**poori WordPress site "critical error" (500)** ho gayi. `php -l` syntax theek tha — runtime fatal
tha, aur suPHP + Apache error log dono chup rahe (suPHP log sirf "Executing index.php" dikhata hai).

**Fix:** plugin ko hata diya (`/root/autoclaw-kundli-sitemap.php.hold`). Homepage foran 200.

**सीख:** Rank Math/robots को छेड़ने वाला छोटा plugin 4 pages के sitemap से कहीं ज़्यादा जोखिम है।
**छोड़ दिया** — अब sitemap का काम GSC में direct submit करके होगा
(`https://mybapuji.com/kundli/sitemap.xml`), जो बिना code-touch सही भी है।
Internal links (menu + strip + cards) से Google खुद खोज लेगा।

⚠️ **नियम:** WordPress site पर कोई भी *नया* mu-plugin तभी upload करो जब वह बिल्कुल trivial हो।
पहले उसका local copy test करो; और हमेशा तुरंत rollback ready रखो (backup file + "कौन-सी file हटानी है" लिखा हो)।

### 🔲 बाकी (user action)
- [ ] **Cloudflare Cache Rule** `/kundli-assets/*` (नीचे steps)
- [ ] **Cloudflare 301** `kundli.mybapuji.com/*` → `mybapuji.com/kundli/*`
- [ ] WordPress: `autoclaw-home.php` (3 iframes + **postMessage origin allow-list**),
      `autoclaw-kundli-links.php` (4 links), नया mu-plugin `autoclaw-kundli-sitemap.php`
- [ ] GSC में नए 4 URLs submit
- [ ] GitHub Pages retire (बाद में — जब तक 301 नहीं लगा, subdomain safety net है)

## Deploy ke do (mere) bugs — live pakde gaye, dono fix

1. **Page-level `.htaccess` 404 kar raha tha.** Maine `RewriteCond !-f` + `RewriteRule ^ - [R=404,L]`
   likha tha; wo *directory* request par bhi 404 karta hai, to `/kundli/` (jiska file
   `index.html` hai) bhi 404 gaya. Fix: page-level `.htaccess` hata diya — asli
   `index.html` asli folder mein hai aur parent WordPress `.htaccess` pehle se
   `!-f` + `!-d` dono guard karta hai. Generator se bhi hata diya.
2. **`sitemap.xml` ki permission `600` thi** → suPHP user (`my4bap21`) pad hi nahi
   paa raha tha (403 → 404). Fix: generator ab `chmod -R a+rX` karta hai.

⚠️ **Apache direct test valid nahi hai** is server par — `curl 127.0.0.1:8181 -H 'Host: mybapuji.com'`
par *existing* `index.php` bhi 404 deta hai (koi bhi normal file nahi milti). asli path
hamesha nginx → Apache (`proxy_pass 139.59.92.161:8181`) hai. **Hamesha `https://mybapuji.com/...`
se test karo.** Vhost ka apna error log bhi alag hai: `/usr/local/apache/domlogs/mybapuji.com.error.log`
(`/usr/local/apache/logs/error_log` mein kuch nahi aata).

## 🔴 INCIDENT — 17 Oct 2026 02:41 — poori website 500 par gayi (fix ho chuki hai)

**Kya hua:** `cp -a /tmp/ksite/kundli-site/. /home/my4bap21/public_html/` — ye ek
command poori WordPress site ko 500 par le gaya.

**Kyun:** macOS par banaya gaya tarball har file ka **local uid/gid (501:games)**
store karta hai. `cp -a SRC/. DEST/` sirf contents nahi copy karta — ye source
directory ki **apni attributes** DEST par bhi apply kar deta hai. Isliye
`public_html` ka owner `501:games` ho gaya, jabki suPHP user hai `my4bap21`
(uid 1001). Apache:

```
SoftException in Application.cpp:560: Directory /home/my4bap21/public_html is not owned by my4bap21
End of script output before headers: index.php
```

→ har PHP page 500. Static pages (hamare /kundli/) phir bhi 200 — isliye
dekhne mein "sirf PHP tuta" laga, par poora WordPress down tha.

**Fix (2 min):** `chown my4bap21:my4bap21 /home/my4bap21/public_html`
→ homepage 200, `book-download.php?b=…` 302, sab kuch normal.

**Ab kya badla (is dobara na ho):**
- `build-server-layout.mjs` ab `COPYFILE_DISABLE=1` se tar banata hai (`._` files nahi)
- uska output **exact server-side steps** print karta hai, `cp -a …/. dest/`
  chhod kar **per-entry loop** use karte hue
- verification step: `ls -ld $D` — hamesha `my4bap21 my4bap21` hona chahiye
- deploy ke baad `find /tmp/ksite ! -user root` se check karna hai

⚠️ **Rule:** is server par koi bhi macOS se bana archive docroot mein `cp -a …/.`
se NAHI daalna. Ya to `--no-same-owner` ke saath extract karo, ya har entry alag
se copy karo, aur hamesha `chown -R my4bap21:my4bap21` ke baad verify karo.

## Server load — measured reality

| file | cache-control | cf-cache-status |
|---|---|---|
| `/kundli-assets/js/*.js` | `max-age=315360000` (CWP default) | `MISS` → edge me cache |
| `/kundli-assets/fonts/*.woff2` | `max-age=315360000` | `MISS` → edge me cache |
| `/kundli-assets/wasm/swisseph.wasm` (549 KB) | `public, max-age=2592000` (humara .htaccess) | `DYNAMIC` |
| `/kundli-assets/wasm/swisseph.data` (**2.1 MB**) | `public, max-age=2592000` | **`DYNAMIC`** ⚠️ |

`.wasm` / `.data` Cloudflare ki default cacheable-extension list me nahi hain, isliye
`cf-cache-status: DYNAMIC`. Browser 30 din tak cache karta hai (header set hai), to
**har naye visitor par sirf ek baar** 2.1 MB aayega — par woh aapke server se.
Cache Rule lagne ke baad Cloudflare edge absorb kar lega.


## Server load का फ़ैसला

Worker proxy **ज़रूरी नहीं**. app static files है और mybapuji.com पहले से Cloudflare के
पीछे है — `cache-control: max-age=315360000` + `cf-cache-status: HIT` (मौजूदा images में
पहले से हो रहा है)। `/kundli-assets/` को folder की तरह रखने पर वही treatment मिलेगा:
पहली बार ~3.3 MB origin से, उसके बाद **0** — सब Cloudflare edge से।
एक नज़र रखने लायक: `swisseph.data` (2.1 MB) — Cloudflare की default extension list में
`.data` शायद नहीं → उसके लिए `/kundli-assets/*` का Cache Rule (dashboard, 2 min) लगाना है।

## नियम (इस move के दौरान)

- गणना / चार्ट / accuracy कोड **बिल्कुल न छुआ** — सिर्फ paths और URLs।
- `tests/seo.test.js` canonical vs `public/sitemap.xml` की mismatch पकड़ता है — दोनों साथ बदलना।
