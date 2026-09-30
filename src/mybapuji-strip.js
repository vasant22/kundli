// mybapuji-strip.js — पेज के सबसे ऊपर MyBapuji (मुख्य साइट) की menu-पट्टी।
// तीनों पूरे पेजों (कुंडली / कुंडली मिलान / पंचांग) में दिखती है; widget/mini pages में नहीं।
export function mybapujiStripHTML() {
  return `
  <div class="mb-strip">
    <div class="in">
      <a class="brand" href="https://mybapuji.com/">🌿 MyBapuji.Com</a>
      <a class="mb-link" href="https://mybapuji.com/" data-i18n="mb.home"></a>
      <a class="mb-link" href="https://mybapuji.com/hindi-pdf-e-book-download-for-free/" data-i18n="mb.books"></a>
      <a class="mb-link" href="https://mybapuji.com/blog/" data-i18n="mb.blog"></a>
      <a class="mb-link" href="https://mybapuji.com/category/disease_diagnostics/" data-i18n="mb.treatment"></a>
      <a class="mb-link" href="https://mybapuji.com/video/" data-i18n="mb.video"></a>
    </div>
  </div>`
}
