// @vitest-environment jsdom
// tests/ank-link.test.js — form से फल बनने के बाद share-link और "PDF सहेजें" में तारीख़ सही क्रम में (d, m, y)।
// 19-11-2026 को live पर पकड़ा: 15-08-1985 का link d=8&m=1985&y=15 बन रहा था (Claude)।
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi, beforeAll } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'ank/index.html'), 'utf8');
const body = html.split('<body class="ank">')[1].split('<script type="module"')[0];
let replaced = '';

beforeAll(async () => {
  document.body.innerHTML = body;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { search: '', pathname: '/ank-jyotish-numerology/', href: 'https://mybapuji.com/ank-jyotish-numerology/' },
  });
  window.history.replaceState = vi.fn((s, t, url) => { replaced = String(url); });
  window.open = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  await import('../src/ank/main.js');
  document.querySelector('#f-name').value = 'Rahul Sharma';
  document.querySelector('#f-d').value = '15';
  document.querySelector('#f-m').value = '8';
  document.querySelector('#f-y').value = '1985';
  document.querySelector('#ank-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
});

describe('form → link', () => {
  it('फल बना (15 अगस्त 1985)', () => {
    expect(document.querySelector('#result').hidden).toBe(false);
    expect(document.querySelector('#result').textContent).toContain('15 अगस्त 1985');
  });
  it('URL में d=15, m=8, y=1985', () => {
    const q = new URLSearchParams(replaced.split('?')[1]);
    expect([q.get('d'), q.get('m'), q.get('y')]).toEqual(['15', '8', '1985']);
  });
  it('"PDF सहेजें" उसी सही तारीख़ के साथ print=1 खोलता है', () => {
    document.querySelector('[data-pdf]').click();
    const url = String(window.open.mock.calls[0][0]);
    const q = new URLSearchParams(url.split('?')[1]);
    expect([q.get('d'), q.get('m'), q.get('y'), q.get('print')]).toEqual(['15', '8', '1985', '1']);
  });
});
