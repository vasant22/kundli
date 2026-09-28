# Deployment Guide (Phase 12)

यह app **GitHub Pages** पर चलेगा और **kundli.mybapuji.com** से खुलेगा।
साइट पूरी तरह static है — कोई server, database या खर्च नहीं।

## repo में पहले से तैयार

- `.github/workflows/deploy.yml` — हर push पर: install → tests → build → Pages पर deploy।
- `public/CNAME` — custom domain की जानकारी (`kundli.mybapuji.com`), build में अपने-आप dist/ में जाती है।

## क़दम (एक-एक बार)

### 1. GitHub account

- अगर account नहीं है: <https://github.com/signup> पर बनाएँ (2 मिनट, free)।
- username याद रखें — जैसे `basanthariom`.

### 2. नया public repo बनाएँ

- <https://github.com/new> → Repository name: **kundli** → **Public** चुनें → **Create repository**।

### 3. कोड push करें

AutoClaw मशीन पर:

```bash
cd ~/.openclaw-autoclaw/workspace/projects/kundli
git remote add origin https://github.com/<आपका-username>/kundli.git
git push -u origin main
```

(पहली बार GitHub login माँग सकता है। AutoClaw से चलवाना हो तो बताएँ।)

### 4. GitHub Pages चालू करें

Repo → **Settings → Pages**:

- **Source**: `GitHub Actions` चुनें।
- **Custom domain**: `kundli.mybapuji.com` लिखकर **Save**।
- **Enforce HTTPS** ✓ करें (थोड़ी देर बाद विकल्प आएगा)।

Repo → **Actions** tab में "Deploy to GitHub Pages" हरा tick दिखना चाहिए।

### 5. Cloudflare DNS

Cloudflare → डोमेन **mybapuji.com** → **DNS → Records → Add record**:

| Field | Value |
|---|---|
| Type | CNAME |
| Name | kundli |
| Target | `<आपका-username>.github.io` |
| Proxy status | **DNS only (grey cloud)** ⚠️ ज़रूरी |

10–30 मिनट में <https://kundli.mybapuji.com> खुलने लगेगा।

> AutoClaw के पास Cloudflare की जानकारी मौजूद है — चाहें तो यह record मैं भी जोड़ सकता हूँ (एक API token चाहिए होगा)।

## जाँच-सूची

- [ ] Actions workflow हरा (green)
- [ ] `https://<username>.github.io/kundli/` खुलता है
- [ ] `https://kundli.mybapuji.com` खुलता है + ताला (🔒 HTTPS) दिखता है

## बाक़ी छोटे काम (repo बनने के बाद)

- `src/main.js` की `SOURCE_URL` में असली username डाल दें (footer के "सोर्स कोड" लिंक के लिए)।
