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
- [x] Tests के URL assertions (seo / widget / kundli-widget / match-widget / form / widgets-preview)

### 🔲 बाकी
- [ ] `npm test` — 504 पास होने चाहिए
- [ ] `scripts/build-server-layout.mjs` — dist → server layout
- [ ] `.github/workflows/deploy.yml` — Pages की जगह server upload
- [ ] `.htaccess` (cache headers) + Cloudflare Cache Rule guide
- [ ] WordPress: `autoclaw-home.php` (3 iframes + **postMessage origin allow-list**),
      `autoclaw-kundli-links.php` (4 links), नया mu-plugin `autoclaw-kundli-sitemap.php`
- [ ] Deploy + live verify (4 pages + 3 widgets + wasm load)
- [ ] Cloudflare: `kundli.mybapuji.com` → 301 नए URLs पर
- [ ] GSC में नए 4 URLs submit

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
