// @vitest-environment jsdom
// tests/ank-print.test.js — `?print=1` खुलते ही एक ही बार window.print() बुलता है।
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi, beforeAll } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'ank/index.html'), 'utf8');
const body = html.split('<body class="ank">')[1].split('<script type="module"')[0];

beforeAll(async () => {
  document.body.innerHTML = body;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      search: '?name=RAHUL+SHARMA&d=15&m=8&y=1985&g=m&print=1',
      pathname: '/ank-jyotish-numerology/',
      href: 'https://mybapuji.com/ank-jyotish-numerology/?name=RAHUL+SHARMA&print=1',
    },
  });
  window.print = vi.fn();
  window.open = vi.fn();
  vi.useFakeTimers();
  await import('../src/ank/main.js');
  vi.advanceTimersByTime(6000);
});

describe('PDF मोड (print=1)', () => {
  it('window.print ठीक एक बार', () => {
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('फल बन गया — कवर, तेरह अध्याय और शीर्षक', () => {
    const host = document.querySelector('#result');
    expect(host.hidden).toBe(false);
    expect(host.querySelector('.cover')).toBeTruthy();
    // मोबाइल/व्यापार नहीं दिए, इसलिए 12 अध्याय (13वाँ सिर्फ़ तब आता है जब वे दिए हों)
    expect(host.querySelectorAll('details.ch').length).toBe(12);
    expect(host.querySelector('#ch-mobile')).toBeNull();
    expect(document.title).toContain('RAHUL SHARMA');
    expect(document.body.classList.contains('ank-doc')).toBe(true);
  });

  it('तीनों मुख्य अंक स्क्रीन पर वही', () => {
    const txt = document.querySelector('#result').textContent;
    expect(txt).toContain('मूलांक 6');
    expect(txt).toContain('भाग्यांक 1');
    expect(txt).toContain('नामांक 6');
  });
});
