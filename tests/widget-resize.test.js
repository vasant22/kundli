// @vitest-environment jsdom
// tests/widget-resize.test.js — the height reporter used by all three
// homepage widgets (they tell the mybapuji.com page how tall their iframe
// should be).
import { describe, expect, it } from 'vitest'
import { installHeightReporter } from '../src/widget-resize.js'

describe('installHeightReporter', () => {
  it('does nothing when the page is not inside an iframe (jsdom default: parent === window)', () => {
    expect(() => installHeightReporter()).not.toThrow()
  })

  it('posts the card height to the parent window (framed)', () => {
    const posts = []
    const fakeWin = {
      parent: { postMessage: (msg, target) => posts.push({ msg, target }) },
      requestAnimationFrame: (cb) => cb(),
      addEventListener: () => {},
    }
    const fakeDoc = { documentElement: { scrollHeight: 812 }, body: { scrollHeight: 850 } }
    installHeightReporter(fakeWin, fakeDoc)
    expect(posts).toEqual([{ msg: { type: 'acw-height', height: 850 }, target: '*' }])
  })

  it('prefers the #widget card height when available (never the iframe size)', () => {
    const posts = []
    const fakeWin = {
      parent: { postMessage: (msg) => posts.push(msg) },
      requestAnimationFrame: (cb) => cb(),
      addEventListener: () => {},
    }
    const fakeDoc = {
      // scrollHeight would report the iframe's own size — the card element wins
      getElementById: (id) => (id === 'widget' ? { getBoundingClientRect: () => ({ height: 566.4 }) } : null),
      documentElement: { scrollHeight: 999 },
      body: { scrollHeight: 999 },
    }
    installHeightReporter(fakeWin, fakeDoc)
    expect(posts).toEqual([{ type: 'acw-height', height: 567 }])
  })
})
