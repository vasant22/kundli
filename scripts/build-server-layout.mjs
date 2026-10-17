// build-server-layout.mjs — turn `dist/` into the exact folder tree that goes
// into mybapuji.com's docroot (17 Oct 2026 subfolder move).
//
// Run after `npm run build`:
//     npm run build && node scripts/build-server-layout.mjs
//
// Output:  .deploy/kundli-site/   (mirrors public_html/)
//          .deploy/kundli-site.tar.gz
//
// Why a mapping step at all? The build's internal page names (match/, bnn/, …)
// no longer match the public URLs (/kundli-milan/, /bnn-chart/), and the
// hashed bundles + WASM + fonts all have to land under ONE shared
// /kundli-assets/ folder — because vite.config.js `base` points there and the
// Swiss Ephemeris resolves its own files as '../wasm/<f>' relative to a bundle
// in /kundli-assets/js/.
//
// Safe to re-run: the staging dir is rebuilt from scratch every time.

import { cp, mkdir, rm, writeFile, readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = new URL('..', import.meta.url)
const DIST = new URL('dist/', root)
const OUT = new URL('.deploy/', root)
const STAGE = new URL('kundli-site/', OUT)

// build output  →  public path under public_html/
const MAP = [
  ['index.html', 'kundli/index.html'],
  ['match/index.html', 'kundli-milan/index.html'],
  ['panchang/index.html', 'panchang/index.html'],
  ['bnn/index.html', 'bnn-chart/index.html'],
  ['widgets/kundli/index.html', 'kundli/widget/index.html'],
  ['widgets/match/index.html', 'kundli-milan/widget/index.html'],
  ['panchang-widget/index.html', 'panchang/widget/index.html'],
  ['sitemap.xml', 'kundli/sitemap.xml'],
  ['js', 'kundli-assets/js'],
  ['wasm', 'kundli-assets/wasm'],
  ['fonts', 'kundli-assets/fonts'],
  ['favicon-32.png', 'kundli-assets/favicon-32.png'],
  ['favicon.png', 'kundli-assets/favicon.png'],
]

// NOT copied: dist/robots.txt — robots.txt is only read at a domain root and
// mybapuji.com's belongs to WordPress/Rank Math. The sitemap line for the four
// tool URLs is injected there by the mu-plugin autoclaw-kundli-sitemap.php.
// (public/robots.txt stays in the repo as documentation + a drift guard.)

// Cache headers for the shared asset folder.
//
// Why two different TTLs: everything in js/ has a content hash in its filename,
// so it can be cached forever. swisseph.wasm / swisseph.data / *.woff2 do NOT
// — they keep stable names, so `immutable` would strand a visitor on an old
// ephemeris after an upgrade. 30 days is the safety valve.
const ASSETS_HTACCESS = `# /kundli-assets/ — shared app payload for mybapuji.com
# (कुंडली · कुंडली मिलान · पंचांग · BNN चार्ट). Added 17 Oct 2026.
#
# Everything here is static and content-addressed, so it is meant to be cached
# hard at the browser AND at the Cloudflare edge — that is what keeps these
# pages off the WordPress server's bandwidth.

<IfModule mod_headers.c>
  # Hashed bundles: filename changes whenever the content does.
  <FilesMatch "\\.(js|css|png|svg|jpg|webp)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # Stable filenames — cache long, but not immutable.
  <FilesMatch "\\.(wasm|data|woff2|ttf)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>

  # The WASM engine must be served as application/wasm or
  # instantiateStreaming() refuses it and the page hangs on "loading".
  <FilesMatch "\\.wasm$">
    Header set Content-Type "application/wasm"
  </FilesMatch>
</IfModule>

# Nothing in here is dynamic — never hand it to PHP.
<IfModule mod_rewrite.c>
  RewriteEngine Off
</IfModule>
Options -Indexes -MultiViews
`

// The four tool pages are plain static HTML. WordPress's catch-all rewrite must
// never swallow them, and they must never be cached hard (content changes).
const PAGE_HTACCESS = `# Static tool page — served straight from disk, never via PHP.
<IfModule mod_headers.c>
  Header set Cache-Control "public, max-age=0, must-revalidate"
  Header set X-Content-Type-Options "nosniff"
</IfModule>

# If the folder somehow ends up without index.html, don't let WordPress render
# a 404 page with a 200 status — a missing page must look missing.
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ - [R=404,L]
</IfModule>
`

async function dirSize(dir) {
  let total = 0
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir)
    total += entry.isDirectory() ? await dirSize(p) : (await stat(p)).size
  }
  return total
}

async function main() {
  await rm(STAGE, { recursive: true, force: true })
  await rm(new URL('kundli-site.tar.gz', OUT), { force: true })
  await mkdir(STAGE, { recursive: true })

  for (const [from, to] of MAP) {
    const src = new URL(from, DIST)
    const dest = new URL(to, STAGE)
    await mkdir(new URL('.', dest), { recursive: true })
    try {
      await cp(src, dest, { recursive: true })
    } catch (err) {
      console.error(`  ✗ ${from} → ${to}: ${err.message}`)
      process.exit(1)
    }
  }

  // Cache headers: one .htaccess for the shared folder, one next to each page.
  await writeFile(new URL('.htaccess', new URL('kundli-assets/', STAGE)), ASSETS_HTACCESS)
  for (const pageDir of ['kundli', 'kundli-milan', 'panchang', 'bnn-chart']) {
    await writeFile(new URL('.htaccess', new URL(pageDir + '/', STAGE)), PAGE_HTACCESS)
  }

  execFileSync('tar', ['-czf', fileURLToPath(new URL('kundli-site.tar.gz', OUT)),
                       '-C', fileURLToPath(OUT), 'kundli-site'])

  const bytes = await dirSize(STAGE)
  console.log('server layout staged:')
  for (const [, to] of MAP) console.log(`  ${to}`)
  console.log('  kundli-assets/.htaccess, <page>/.htaccess  (cache headers)')
  console.log(`total: ${(bytes / 1024 / 1024).toFixed(2)} MB → .deploy/kundli-site.tar.gz`)
}

main()
