import { defineConfig } from 'vite'

// base: './' => every asset URL in the build is relative, so the app works on
// GitHub Pages, a custom subdomain (kundli.mybapuji.com), or any sub-folder.
export default defineConfig({
  base: './',

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
