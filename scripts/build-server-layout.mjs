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

// NO .htaccess goes next to the tool pages — deliberately.
//
// A first attempt shipped one with `RewriteCond !-f` + `RewriteRule ^ - [R=404,L]`
// to make a missing page look missing. That 404s *directory* requests too, so
// every tool page (/kundli/ → /kundli/index.html) returned 404 on the live site.
// Real files inside real directories are already served correctly: the parent
// WordPress .htaccess guards with both `!-f` and `!-d`, so it never swallows
// them. Nothing is needed here — and less .htaccess is less risk.

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

  // Cache headers for the shared folder only (see the note above about pages).
  await writeFile(new URL('.htaccess', new URL('kundli-assets/', STAGE)), ASSETS_HTACCESS)
  // WordPress serves these as the suPHP user `my4bap21`; a file that is not
  // world-readable comes back as a 403/404. Normalise before shipping.
  execFileSync('chmod', ['-R', 'a+rX', fileURLToPath(STAGE)])

  // ⚠️ macOS tar embeds the LOCAL uid/gid (501/games) plus AppleDouble `._`
  // files. COPYFILE_DISABLE=1 drops the `._` clutter.
  execFileSync('tar', ['-czf', fileURLToPath(new URL('kundli-site.tar.gz', OUT)),
                       '-C', fileURLToPath(OUT), 'kundli-site'],
               { env: { ...process.env, COPYFILE_DISABLE: '1' } })

  const bytes = await dirSize(STAGE)
  console.log('server layout staged:')
  for (const [, to] of MAP) console.log(`  ${to}`)
  console.log('  kundli-assets/.htaccess  (cache headers — the pages need none)')
  console.log(`total: ${(bytes / 1024 / 1024).toFixed(2)} MB → .deploy/kundli-site.tar.gz`)
  console.log(`
⚠️  UPLOAD — do it exactly like this, or you WILL take mybapuji.com down:

  # 1. fetch (into /tmp, never into the docroot)
  curl -sL -o /tmp/ksite.tgz <raw-url-of-this-tarball>

  # 2. extract with --no-same-owner. The tarball carries the macOS uid 501;
  #    without this flag the files land as 501:games.
  rm -rf /tmp/ksite && mkdir -p /tmp/ksite
  tar xzf /tmp/ksite.tgz --no-same-owner -C /tmp/ksite
  find /tmp/ksite -name '._*' -delete

  # 3. copy each entry separately into the docroot.  cp -a src/. DEST/ copies
  #    the source directory's OWN attributes onto DEST — that once reset
  #    public_html to 501:games and suPHP then returned 500 for the whole
  #    WordPress site. A per-entry copy leaves public_html untouched.
  D=/home/my4bap21/public_html
  for e in /tmp/ksite/kundli-site/*; do cp -a "$e" "$D/"; done

  # 4. ownership + permissions
  chown -R my4bap21:my4bap21 $D/kundli $D/kundli-milan $D/panchang $D/bnn-chart $D/kundli-assets
  find $D/kundli $D/kundli-milan $D/panchang $D/bnn-chart $D/kundli-assets \\
       -type d -exec chmod 755 {} + -o -type f -exec chmod 644 {} +

  # 5. verify public_html itself was NOT touched
  ls -ld $D    # must read: my4bap21 my4bap21   (never 501 games)
`)
}

main()
