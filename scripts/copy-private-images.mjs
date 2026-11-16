// scripts/copy-rashi.mjs — राशि-चित्र (licence वाले) private-assets से public/rashi/ में.
//
// Repo public है, इसलिए चित्र repo में नहीं रखे जाते (टास्क 05-ख). असली copy:
//   ~/.openclaw-autoclaw/workspace/private-assets/rashi/rashi-01.webp … rashi-12.webp
// folder न मिले तो साफ़ संदेश और build चलता रहे (चित्र बिना page बनेगा).

import { cp, mkdir, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = join(homedir(), '.openclaw-autoclaw/workspace/private-assets/rashi')
const DEST = fileURLToPath(new URL('../public/rashi/', import.meta.url))
const NEED = 12

let files = []
try {
  files = (await readdir(SRC)).filter((f) => f.endsWith('.webp')).sort()
} catch {
  console.warn(`\n⚠️  राशि-चित्र नहीं मिले: ${SRC}`)
  console.warn('    (ये licence वाले चित्र हैं — repo में नहीं रखे जाते; private-assets folder चाहिए)')
  console.warn('    build चलता रहेगा, पर फलादेश के पन्नों में राशि-चित्र ख़ाली रहेंगे.\n')
  process.exit(0)
}

if (files.length < NEED) {
  console.warn(`⚠️  ${SRC} में ${files.length}/${NEED} चित्र हैं — बाक़ी बिना चित्र के रहेंगे`)
}

await mkdir(DEST, { recursive: true })
for (const f of files) await cp(join(SRC, f), join(DEST, f))
console.log(`  राशि-चित्र: ${files.length} → public/rashi/`)
