// BNN Shakti — संस्करण की तुलना (राउंड 65 / टास्क 03, 4-11-2026)
// यह classic script है (index.html में <script> से जुड़ती है), इसलिए न browser में
// import की ज़रूरत है न Node में — दोनों जगह काम करती है:
//   browser:  window.BNNSemver.compare('1.0.10', '1.0.9')  →  1
//   Node/CJS: const { compare } = require('./app/version.js')
// नियम: बिंदु से बँटे अंक, बाएँ से दाएँ; जो हिस्सा न हो उसे 0 मानो (1.0 = 1.0.0)।
// अक्षर वाला हिस्सा (जैसे 1.0.1-beta) यहाँ नहीं चलता — हमारे संस्करण सादे अंक ही हैं।
(function (root) {
  'use strict'

  // ऐप का संस्करण — **यही एक जगह** (राउंड 65 / टास्क 05)। बदलते समय यह भी बदलें:
  // desktop/package.json · build/version.json · CHANGELOG.md
  var APP_VERSION = '1.0.1'

  function parse(v) {
    var s = String(v == null ? '' : v).trim()
    var m = /^v?(\d+(?:\.\d+)*)/i.exec(s)
    if (!m) return []
    return m[1].split('.').map(function (x) { return parseInt(x, 10) || 0 })
  }

  // a > b → 1 · a = b → 0 · a < b → −1
  function compare(a, b) {
    var A = parse(a), B = parse(b)
    var n = Math.max(A.length, B.length)
    for (var i = 0; i < n; i++) {
      var x = A[i] || 0, y = B[i] || 0
      if (x > y) return 1
      if (x < y) return -1
    }
    return 0
  }

  var api = { parse: parse, compare: compare, appVersion: APP_VERSION, label: 'BNN Shakti ' + APP_VERSION }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  if (root && typeof root === 'object') root.BNNSemver = api
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this))
