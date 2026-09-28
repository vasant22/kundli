// copy-wasm.mjs — copy the Swiss Ephemeris .wasm/.data files from
// node_modules into public/wasm/ so the production build serves them from a
// relative path (/wasm/...) on any host (GitHub Pages, custom subdomain).
//
// Runs automatically before `npm run dev` and `npm run build` (npm pre-hooks).
import { mkdir, copyFile, stat } from 'node:fs/promises'

const SRC_DIR = new URL('../node_modules/swisseph-wasm/wasm/', import.meta.url)
const DST_DIR = new URL('../public/wasm/', import.meta.url)
const FILES = ['swisseph.wasm', 'swisseph.data']

await mkdir(DST_DIR, { recursive: true })

let done = 0
for (const name of FILES) {
  const src = new URL(name, SRC_DIR)
  const dst = new URL(name, DST_DIR)
  try {
    await copyFile(src, dst)
    const { size } = await stat(dst)
    console.log(`  ✓ ${name} (${(size / 1024 / 1024).toFixed(2)} MB)`)
    done++
  } catch (err) {
    console.error(`  ✗ Could not copy ${name}: ${err.message}`)
    process.exitCode = 1
  }
}
console.log(`wasm sync: ${done}/${FILES.length} files -> public/wasm/`)
