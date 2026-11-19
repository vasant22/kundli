// scripts/ank-seo-build.mjs — ank/index.html का SEO भाग (लेख, FAQ, tools, किताबें, Sponsored) और JSON-LD
// text-hi.js से एक साथ बनाता है, ताकि page पर दिखने वाले प्रश्न और JSON-LD के प्रश्न हमेशा एक जैसे रहें।
// चलाना: node scripts/ank-seo-build.mjs   (Claude, 19-11-2026)
import { readFileSync, writeFileSync } from 'node:fs';
import * as T from '../src/ank/text-hi.js';

const PAGE = 'https://mybapuji.com/ank-jyotish-numerology/';
const file = new URL('../ank/index.html', import.meta.url);
let html = readFileSync(file, 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TITLE = 'Name Numerology Calculator Hindi | अंक ज्योतिष, मूलांक, लो-शू ग्रिड — Free';
const DESC = 'Free Name Numerology Calculator हिंदी में — नाम और जन्म-तिथि से मूलांक, भाग्यांक, नामांक, Lo Shu Grid, नाम की spelling सुधार (name correction), मोबाइल नंबर का अंक, अगले 10 वर्ष का फल और PDF। बिना साइन-अप।';
const KEYS = 'name numerology calculator, numerology calculator, numerology in hindi, अंक ज्योतिष, अंक शास्त्र, मूलांक, मूलांक कैसे निकाले, mulank calculator, भाग्यांक, नामांक, lo shu grid, लो शू ग्रिड, numerology name correction, mobile number numerology, kua number, ank jyotish';

/* ---------- JSON-LD ---------- */
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'अंक ज्योतिष — मूलांक, भाग्यांक, नामांक कैलकुलेटर',
      alternateName: ['Free Name Numerology Calculator in Hindi', 'Lo Shu Grid Calculator', 'Mulank Calculator'],
      url: PAGE,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web browser (mobile & desktop)',
      browserRequirements: 'Requires JavaScript',
      inLanguage: 'hi-IN',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      featureList: ['मूलांक और भाग्यांक', 'कैल्डियन नामांक और नाम-स्कोर', 'नाम की spelling सुधार', 'लो-शू ग्रिड और कुआ अंक', 'अगले 10 वर्ष और 12 महीने', 'जीवनसाथी, मोबाइल और व्यापार-नाम जाँच', 'PDF रिपोर्ट'],
      image: 'https://mybapuji.com/kundli-assets/ank-og.jpg',
      publisher: { '@type': 'Organization', name: 'MyBapuji', url: 'https://mybapuji.com/' },
      description: 'नाम और जन्म-तिथि से मूलांक, भाग्यांक, नामांक, लो-शू ग्रिड, 10 वर्ष का फल और उपाय — निःशुल्क।',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'होम', item: 'https://mybapuji.com/' },
        { '@type': 'ListItem', position: 2, name: 'ज्योतिष', item: 'https://mybapuji.com/kundli/' },
        { '@type': 'ListItem', position: 3, name: 'अंक ज्योतिष', item: PAGE },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: T.FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

/* ---------- लेख ---------- */
const CH = [['A I J Q Y', 1], ['B K R', 2], ['C G L S', 3], ['D M T', 4], ['E H N X', 5], ['U V W', 6], ['O Z', 7], ['F P', 8]];
const PLANET = [[1, 'सूर्य', 'रविवार', 'माणिक्य'], [2, 'चंद्र', 'सोमवार', 'मोती'], [3, 'गुरु', 'गुरुवार', 'पुखराज'], [4, 'राहु', 'रविवार, शनिवार', 'गोमेद'], [5, 'बुध', 'बुधवार', 'पन्ना'], [6, 'शुक्र', 'शुक्रवार', 'हीरा / ओपल'], [7, 'केतु', 'सोमवार, रविवार', 'लहसुनिया'], [8, 'शनि', 'शनिवार', 'नीलम'], [9, 'मंगल', 'मंगलवार', 'मूँगा']];
const article = `
      <article class="art">
      <h2>अंक ज्योतिष (Numerology) क्या है?</h2>
      <p>अंक ज्योतिष, जिसे अंक शास्त्र या numerology भी कहते हैं, 1 से 9 तक के अंकों के माध्यम से व्यक्ति के स्वभाव, क्षमताओं और अनुकूल समय को समझने की विद्या है। भारतीय परंपरा में हर अंक एक ग्रह से जुड़ा है — 1 सूर्य, 2 चंद्र, 3 गुरु, 4 राहु, 5 बुध, 6 शुक्र, 7 केतु, 8 शनि और 9 मंगल। इसलिए अंकों की आपसी मित्रता भी ग्रहों की नैसर्गिक मैत्री से देखी जाती है। जन्म-कुंडली के लिए जन्म का समय और स्थान चाहिए, पर अंक ज्योतिष केवल नाम और जन्म-तिथि से चल जाता है — यही इसकी सरलता है।</p>
      <p>इस page का <strong>Numerology Calculator</strong> एक साथ तीन पद्धतियाँ जोड़ता है: जन्म-तिथि से मूलांक और भाग्यांक, कैल्डियन पद्धति से नाम का अंक (name numerology), और लो-शू ग्रिड। सब गणना आपके browser में होती है।</p>

      <h2>मूलांक कैसे निकाले? (Mulank Calculator)</h2>
      <p>जन्म की तारीख़ के अंकों को तब तक जोड़ें जब तक एक अंक न बचे। 1 से 9 तारीख़ पर वही अंक मूलांक है; 10 से 31 तारीख़ पर दोनों अंक जोड़ें।</p>
      <div class="tbl"><table><thead><tr><th>मूलांक</th><th>इन तारीख़ों पर जन्म</th><th>ग्रह</th></tr></thead><tbody>
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<tr><td><b>${n}</b></td><td>${esc(T.MULANK[n].dates)}</td><td>${PLANET[n - 1][1]}</td></tr>`).join('')}
      </tbody></table></div>

      <h2>भाग्यांक कैसे निकालें?</h2>
      <p>पूरी जन्म-तिथि (दिन, माह, वर्ष) के सारे अंक जोड़कर एक अंक तक घटाएँ। जैसे 15-08-1985: 1+5+0+8+1+9+8+5 = 37, फिर 3+7 = 10, फिर 1+0 = <b>1</b>। मूलांक भीतर का स्वभाव बताता है और भाग्यांक जीवन की दिशा — दोनों आपस में मित्र हों तो स्वभाव और परिस्थिति साथ चलते हैं।</p>

      <h2>नाम का अंक कैसे निकालें? (Name Numerology Calculator)</h2>
      <p>नामांक के लिए हम <strong>कैल्डियन पद्धति</strong> का उपयोग करते हैं, जिसमें अक्षरों के मान ध्वनि के आधार पर 1 से 8 तक हैं (9 किसी अक्षर को नहीं दिया जाता)। नाम वैसे ही लिखें जैसे हस्ताक्षर और दस्तावेज़ों में लिखते हैं।</p>
      <div class="tbl"><table><thead><tr><th>अक्षर</th><th>मान</th></tr></thead><tbody>
        ${CH.map(([l, v]) => `<tr><td>${l}</td><td><b>${v}</b></td></tr>`).join('')}
      </tbody></table></div>
      <p>पूरे नाम का योग 10 से 52 के बीच हो, तो वह <em>संयुक्त अंक</em> कहलाता है और उसका अपना अर्थ होता है — कुछ शुभ, कुछ मिश्र और कुछ चुनौती वाले। Calculator यह भी बताता है और 0 से 10 का नाम-स्कोर देता है।</p>

      <h2>Lo Shu Grid (लो-शू ग्रिड) क्या है?</h2>
      <p>लो-शू 1 से 9 अंकों का प्राचीन 3×3 जादुई वर्ग है — ऊपर 4-9-2, बीच में 3-5-7, नीचे 8-1-6 — जिसकी हर पंक्ति, स्तंभ और कर्ण का योग 15 है। जन्म-तिथि के अंक (शून्य छोड़कर), मूलांक और भाग्यांक इसमें भरे जाते हैं। जो अंक बार-बार आए, वह गुण प्रबल है; जो खाली रह जाए, उस पर ध्यान और सरल उपाय की ज़रूरत है। पूरी भरी रेखाएँ — जैसे 4-5-6 (स्वर्ण योग) या 2-5-8 (राज योग) — विशेष मानी जाती हैं।</p>

      <h2>Numerology Name Correction — spelling कब बदलें?</h2>
      <p>नाम-स्कोर 6 या उससे अधिक हो तो नाम अच्छा है, बदलने की ज़रूरत नहीं। स्कोर कम हो तो calculator ऐसी spellings सुझाता है जिनका उच्चारण लगभग वही रहे पर अंक आपके मूलांक-भाग्यांक से मेल खाए। बदलाव करें तो हर जगह एक ही रूप लिखें; सरकारी दस्तावेज़ बदलने से पहले अच्छी तरह सोच लें। बच्चे का नाम चुनना हो तो हमारी <a href="https://mybapuji.com/hindu-bachon-ke-naam-aur-arth-in-hindi/">बच्चों के नाम और अर्थ</a> सूची भी देखें।</p>

      <h2>Mobile Number Numerology</h2>
      <p>मोबाइल नंबर के दसों अंकों का योग एक अंक तक घटाएँ। वह अंक आपके मूलांक और भाग्यांक दोनों का मित्र हो तो नंबर शुभ माना जाता है। नया नंबर लेते समय ऐसा चुनें जिसका योग आपके शुभ अंकों में से हो।</p>

      <h2>अंक, ग्रह, शुभ दिन और रत्न</h2>
      <div class="tbl"><table><thead><tr><th>अंक</th><th>ग्रह</th><th>शुभ दिन</th><th>रत्न</th></tr></thead><tbody>
        ${PLANET.map(([n, g, d, r]) => `<tr><td><b>${n}</b></td><td>${g}</td><td>${d}</td><td>${r}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="small">रत्न केवल अंक देखकर न पहनें — किसी अनुभवी ज्योतिषी से अपनी जन्म-कुंडली परखवा लें। पहले निःशुल्क उपाय करें।</p>
      </article>`;

/* ---------- FAQ ---------- */
const faq = `
      <h2>अक़्सर पूछे जाने वाले प्रश्न</h2>
      ${T.FAQ.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n      ')}`;

/* ---------- हमारे निःशुल्क ज्योतिष software ---------- */
const tools = [
  ['/kundli/', '🪐', 'Free कुंडली', 'जन्मपत्री + फलादेश PDF'],
  ['/kundli-milan/', '💞', 'कुंडली मिलान', '36 गुण + मंगल दोष'],
  ['/panchang/', '📅', 'आज का पंचांग', 'तिथि, नक्षत्र, मुहूर्त'],
  ['/bnn-chart/', '🔱', 'BNN चार्ट', 'भृगु नंदी नाड़ी'],
  ['/bnn-shakti/', '⚡', 'BNN Shakti ऑनलाइन', 'पूरा software browser में'],
  ['/free-bhrigu-nandi-nadi-jyotish-software-download/', '💻', 'BNN Shakti Download', 'Windows और Mac — Free'],
  ['/hindu-bachon-ke-naam-aur-arth-in-hindi/', '👶', 'बच्चों के नाम', 'नाम और अर्थ'],
  ['/category/vastu/', '🏠', 'वास्तु', 'वास्तु के लेख'],
];
const toolsBox = `
      <div class="box2">
        <h2>हमारे निःशुल्क ज्योतिष software</h2>
        <p class="note">ये सभी tools mybapuji.com पर बिना साइन-अप, पूरी तरह मुफ़्त हैं:</p>
        <div class="cards">
          ${tools.map(([u, i, t, s]) => `<a class="card" href="https://mybapuji.com${u}"><span class="ic">${i}</span><span class="t">${t}</span><span class="s">${s}</span></a>`).join('\n          ')}
        </div>
      </div>`;

/* ---------- मुफ़्त किताबें (kundli page वाली ही श्रेणियाँ) ---------- */
const books = [
  ['/hindi-pdf-e-book-download-for-free/pdf-jyotish-books-hindi-vedic-astrology-free-download/', '🔮', 'ज्योतिष शास्त्र', 'वैदिक ज्योतिष'],
  ['/hindi-pdf-e-book-download-for-free/pdf-book-jyotish-sangrah/', '📔', 'ज्योतिष संग्रह', 'संग्रह'],
  ['/pdf-nadi-astrology-books-free-download/', '🧭', 'नाड़ी ज्योतिष', 'नाड़ी रीडिंग'],
  ['/hindi-pdf-e-book-download-for-free/pdf-hasth-rekha-gyan-hindi-free-download/', '🖐️', 'हस्त रेखा ज्ञान', 'हस्त रेखा'],
  ['/hindi-pdf-e-book-download-for-free/pdf-kp-astrology-free-download/', '📗', 'KP Astrology', 'KP पद्धति'],
  ['/pdf-astrology-books-english-free-download/', '🔤', 'Astrology Books', 'English'],
];
const booksBox = `
      <div class="box2">
        <h2>ज्योतिष संबंधित किताबें मुफ़्त Download करें</h2>
        <p class="note">mybapuji.com पर हिंदी और English में ज्योतिष की हज़ारों किताबें मुफ़्त PDF में मौजूद हैं:</p>
        <div class="cards cards6">
          ${books.map(([u, i, t, s]) => `<a class="card" href="https://mybapuji.com${u}" target="_blank" rel="noopener"><span class="ic">${i}</span><span class="t">${t}</span><span class="s">${s}</span></a>`).join('\n          ')}
        </div>
        <nav class="pills" aria-label="और भी किताबें"><a href="https://mybapuji.com/hindi-pdf-e-book-download-for-free/" target="_blank" rel="noopener">📚 सभी हिंदी किताबें</a></nav>
      </div>`;

/* ---------- Sponsored (Amazon — kundli page वाला ही tag) ---------- */
const TAG = 'krishna220af-21';
const amz = [
  ['numerology books hindi', '🔢', 'अंक ज्योतिष'],
  ['lo shu grid numerology book', '🟧', 'लो-शू / Numerology'],
  ['jyotish astrology hindi books', '📿', 'ज्योतिष'],
  ['vastu shastra hindi books', '🏠', 'वास्तु शास्त्र'],
  ['ratna vigyan gemstone hindi book', '💎', 'रत्न विज्ञान'],
  ['hindi religious spiritual books', '🙏', 'धार्मिक किताबें'],
];
const amzBox = `
      <div class="box2">
        <h2><span class="sp">Sponsored</span> आपके लिए चुनी किताबें</h2>
        <div class="cards cards6">
          ${amz.map(([k, i, t]) => `<a class="card" href="https://www.amazon.in/s?i=stripbooks&amp;k=${encodeURIComponent(k)}&amp;tag=${TAG}" target="_blank" rel="nofollow sponsored noopener"><span class="ic">${i}</span><span class="t">${t}</span></a>`).join('\n          ')}
        </div>
      </div>`;

const seo = `<section class="seo"><div class="seo-info">
      <h2>${esc(T.SEO_INTRO.whatTitle)}</h2>
      <div class="what">${T.SEO_INTRO.what.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}</div>
${article}
${faq}
${toolsBox}
${booksBox}
${amzBox}
      <p class="foot-note">यह page mybapuji.com का निःशुल्क tool है। फल मार्गदर्शन के लिए हैं; बड़े निर्णय अपने विवेक से लें।</p>
      </div>
    </section>`;

/* ---------- index.html में बदलो ---------- */
const start = html.indexOf('<section class="seo">');
const end = html.indexOf('</section>', start) + '</section>'.length;
if (start < 0 || end < start) throw new Error('seo section नहीं मिला');
html = html.slice(0, start) + seo + html.slice(end);
html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(TITLE)}</title>`);
html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(DESC)}" />`);
html = html.replace(/<meta name="keywords" content="[^"]*" \/>/, `<meta name="keywords" content="${esc(KEYS)}" />`);
html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(TITLE)}" />`);
html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(DESC)}" />`);
html = html.replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />');
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
html = html.replace(/<h1>[\s\S]*?<\/h1>/, '<h1>अंक ज्योतिष <small>(Numerology Calculator)</small> — <span>मूलांक, भाग्यांक</span> और नामांक</h1>');
const OG = 'https://mybapuji.com/kundli-assets/ank-og.jpg';
if (!html.includes('og:image')) {
  html = html.replace('<meta property="og:locale" content="hi_IN" />', `<meta property="og:locale" content="hi_IN" />\n    <meta property="og:image" content="${OG}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="अंक ज्योतिष — Free Numerology Calculator, लो-शू ग्रिड" />`);
}
html = html.replace('<meta name="twitter:card" content="summary" />', '<meta name="twitter:card" content="summary_large_image" />');
if (!html.includes('twitter:image')) html = html.replace('<meta name="twitter:card" content="summary_large_image" />', `<meta name="twitter:card" content="summary_large_image" />\n    <meta name="twitter:image" content="${OG}" />`);
if (!html.includes('twitter:title')) {
  html = html.replace('<meta name="twitter:card" content="summary" />', `<meta name="twitter:card" content="summary" />\n    <meta name="twitter:title" content="${esc(TITLE)}" />\n    <meta name="twitter:description" content="${esc(DESC)}" />`);
}
writeFileSync(file, html);
console.log('ank/index.html अपडेट — FAQ', T.FAQ.length, '· tools', tools.length, '· books', books.length, '· amz', amz.length);
