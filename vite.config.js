import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Absolute path of a page entry (ESM has no __dirname).
const page = (p) => fileURLToPath(new URL(p, import.meta.url))

// base: '/kundli-assets/' => absolute asset URLs rooted at ONE shared folder.
// Since 17 Oct 2026 the app lives on mybapuji.com itself (SEO: the tools are
// real pages of the main domain, not a separate subdomain site):
//
//   mybapuji.com/kundli/         mybapuji.com/kundli-milan/
//   mybapuji.com/panchang/       mybapuji.com/bnn-chart/
//
// Absolute paths mean every one of those pages works no matter how deep it sits,
// and nothing collides with WordPress (which owns /wp-content/, /wp-admin/).
// assetsDir: 'js' nests the hashed bundles one level down, which is exactly
// where the Swiss Ephemeris WASM needs its parent folder to be — swisseph-wasm
// resolves its files as new URL('../wasm/<f>', import.meta.url) relative to the
// chunk, so the layout is:
//
//   /kundli-assets/js/main-<hash>.js
//   /kundli-assets/wasm/swisseph.wasm   <- '../wasm/' from the chunk above
//   /kundli-assets/fonts/*.woff2
export default defineConfig({
  base: '/kundli-assets/',

  build: {
    // Bundles land in kundli-assets/js/ (see the note above about the WASM).
    assetsDir: 'js',

    // Multi-page build: the Kundli page, the Kundli Matching page, the full
    // Panchang page, the BNN (भृगु नंदी नाड़ी) chart page and the three homepage
    // mini-widgets (Kundli, Matching, Panchang) — all reusing the same modules.
    // The build output paths (match/, bnn/, …) are internal: scripts/build-server-layout.mjs
    // republishes them to the public URLs (kundli-milan/, bnn-chart/, …).
    rollupOptions: {
      input: {
        main: page('index.html'),
        match: page('match/index.html'),
        widget: page('panchang-widget/index.html'),
        panchang: page('panchang/index.html'),
        'kundli-widget': page('widgets/kundli/index.html'),
        'match-widget': page('widgets/match/index.html'),
        bnn: page('bnn/index.html'),
      },
    },
  },

  optimizeDeps: {
    // swisseph-wasm loads its own .wasm/.data files that sit next to its
    // source (new URL('../wasm/...', import.meta.url)). Excluding it from
    // esbuild pre-bundling keeps those relative paths intact in dev.
    exclude: ['swisseph-wasm'],
  },

  plugins: [
    {
      // The emscripten glue inside swisseph-wasm also contains a fallback
      // `new URL('swisseph.wasm', import.meta.url)` that only runs when no
      // locateFile override exists. swisseph-wasm always sets one (loading
      // the files from /wasm/ — see public/wasm/ + scripts/copy-wasm.mjs),
      // so the bundled copy of that fallback is dead weight. Drop it so the
      // build stays under the 3 MB budget.
      name: 'drop-unused-wasm-asset',
      generateBundle(_options, bundle) {
        for (const key of Object.keys(bundle)) {
          if (key.endsWith('.wasm')) delete bundle[key]
        }
      },
    },
  ],
})
