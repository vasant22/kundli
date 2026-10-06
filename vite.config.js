import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Absolute path of a page entry (ESM has no __dirname).
const page = (p) => fileURLToPath(new URL(p, import.meta.url))

// base: './' => every asset URL in the build is relative, so the app works on
// GitHub Pages, a custom subdomain (kundli.mybapuji.com), or any sub-folder.
export default defineConfig({
  base: './',

  build: {
    // Multi-page build: the main Kundli page, the Kundli Matching page
    // (served at /match/), the full Panchang page, the homepage widgets
    // (Panchang card + Kundli & Matching mini-widgets), and the BNN
    // (भृगु नंदी नाड़ी) chart page (served at /bnn/) — all reusing the same
    // modules.
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
