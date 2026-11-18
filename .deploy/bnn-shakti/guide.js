// BNN Shakti — बटन गाइड (संस्करण 1.0.5, Claude, 17-11-2026)
// -----------------------------------------------------------------------------
// नए उपयोगकर्ता के लिए: हर बटन क्या करता है और दबाने पर क्या दिखता है।
//   • स्क्रीन पर गाइड — बाक़ी screen धुँधली, एक बटन चमकता है, बगल में 2 पंक्तियाँ;
//     पिछला / अगला / बंद करें, और ← → Esc कुंजियाँ।
//   • वही सामग्री सहायता (❓) के “🧭 बटन गाइड” विषय में सूची के रूप में भी।
// यह सिर्फ़ ऊपर की परत (overlay) है — कोई गणना, तालिका या print नहीं छूता, कोई बटन
// अपने-आप नहीं दबाता। कुंडली न खुली हो तो “कुंडली screen” की गाइड के लिए नमूना कुंडली
// खुलती है (सहेजी नहीं जाती, Ref नहीं बढ़ता) और गाइड बंद होते ही हट जाती है।
// BNN के नियम यहाँ नहीं लिखे — अर्थ के लिए सहायता के विषयों की ओर भेजा गया है।
(function () {
  'use strict'

  // ---------------------------------------------------------------- सामग्री
  // हर step: s = selector(s) — पहला जो screen पर दिखे; hi/en = [नाम, क्या करता है, क्या दिखता है];
  // help = सहायता का विषय (अर्थ के लिए); items = tabs की छोटी सूची (वैकल्पिक)
  var STEPS = {
    form: [
      { s: '.topbar .brand', hi: ['ऊपर की पट्टी', 'यहाँ software का नाम और संस्करण है; दाईं ओर के बटन हर screen पर रहते हैं।', 'अगले कुछ कदम इन्हीं बटनों के बारे में हैं।'], en: ['Top bar', 'Shows the software name and version; the buttons on the right stay on every screen.', 'The next few steps explain these buttons.'] },
      { s: '#btnPng', hi: ['📄 ऑल चार्ट (PNG)', 'खुली कुंडली के चार्ट और तालिकाएँ एक तस्वीर (PNG) में सहेजता है।', 'पहले “कुंडली देखें” से कुंडली खोलें; फिर फ़ाइल सहेजने की जगह पूछी जाती है।'], en: ['📄 All Charts (PNG)', 'Saves the open kundli\'s chart and tables as one picture (PNG).', 'Open a kundli first with “View Kundli”; then it asks where to save the file.'], help: 'print' },
      { s: '#btnPrint', hi: ['🖨️ प्रिंट', 'खुली कुंडली को काग़ज़ पर छापता है (A4)।', 'प्रिंट की खिड़की खुलती है; ज्योतिषी का नाम/पता सेटिंग्स से छपता है।'], en: ['🖨️ Print', 'Prints the open kundli on paper (A4).', 'The print window opens; astrologer name/address come from Settings.'], help: 'print' },
      { s: '#btnPdf', hi: ['📄 PDF', 'खुली कुंडली की PDF फ़ाइल बनाता है।', 'फ़ाइल कहाँ सहेजनी है पूछकर PDF बन जाती है। (गोचर चालू हो तब भी जन्म-कुंडली ही।)'], en: ['📄 PDF', 'Makes a PDF file of the open kundli.', 'It asks where to save, then makes the PDF. (Always the birth chart, even in transit mode.)'], help: 'print' },
      { s: '#btnHelp', hi: ['❓ सहायता', 'हर विषय की सरल जानकारी — यह गाइड भी यहीं से दोबारा चलती है।', 'बाईं ओर विषयों की सूची, दाईं ओर उस विषय की बातें।'], en: ['❓ Help', 'Simple notes on every topic — this guide also starts from here.', 'Topics on the left, the notes on the right.'] },
      { s: '#btnLang', hi: ['भाषा', 'हिंदी ↔ English बदलता है।', 'सारे बटन, खाने और तालिकाओं के शीर्षक उसी भाषा में हो जाते हैं।'], en: ['Language', 'Switches Hindi ↔ English.', 'All buttons, fields and table headings change to that language.'] },
      { s: '#btnSettings', hi: ['⚙ सेटिंग्स', 'ज्योतिषी का नाम-पता, डिफ़ॉल्ट स्थान, डिफ़ॉल्ट चार्ट (उत्तर/दक्षिण), ऑटो बैकअप, अगला Ref नंबर।', 'एक खिड़की खुलती है; “✅ सेव करें” से बदलाव रहते हैं।'], en: ['⚙ Settings', 'Astrologer name/address, default place, default chart (North/South), auto backup, next Ref number.', 'A window opens; “✅ Save” keeps the changes.'] },
      { s: '.side .chips', hi: ['कुंडली खोजें — किससे', 'Ref No / नाम / ग्रुप / मोबाइल में से चुनिए कि किस आधार पर खोजना है।', 'चुना हुआ बटन नारंगी हो जाता है।'], en: ['Search Kundli — by', 'Choose whether to search by Ref No / Name / Group / Mobile.', 'The chosen button turns orange.'], help: 'naya' },
      { s: '#q', hi: ['खोज का खाना + 🔍', 'नाम या अंक लिखिए और 🔍 दबाइए (या Enter)।', 'नीचे की सूची में केवल मिलती-जुलती कुंडलियाँ रह जाती हैं।'], en: ['Search box + 🔍', 'Type a name or number and press 🔍 (or Enter).', 'The list below keeps only matching kundlis.'] },
      { s: '#btnBrowse', hi: ['ब्राउज़…', 'खोज हटाकर सारी सहेजी कुंडलियाँ फिर दिखाता है।', 'पूरी सूची वापस आ जाती है।'], en: ['Browse…', 'Clears the search and shows all saved kundlis again.', 'The full list comes back.'] },
      { s: '#btnDelList', hi: ['🗑 मिटाएँ (सूची)', 'सूची में चुनी (खुली) कुंडली को मिटाता है।', 'पहले पुष्टि पूछी जाती है; मिटाने के बाद वह सूची से हट जाती है।'], en: ['🗑 Delete (list)', 'Deletes the kundli selected (open) in the list.', 'It asks to confirm first; then it disappears from the list.'] },
      { s: '#list', hi: ['सहेजी कुंडलियों की सूची', 'किसी नाम पर क्लिक कीजिए।', 'वह कुंडली फ़ॉर्म में खुल जाती है — बदलकर फिर सहेज सकते हैं।'], en: ['Saved kundli list', 'Click any name.', 'That kundli opens in the form — you can change and save again.'] },
      { s: '#btnBackup', hi: ['⬇️ बैकअप फ़ाइल', 'सारी कुंडलियों की एक फ़ाइल (JSON) बनाता है।', 'उसे पेन-ड्राइव या दूसरे computer पर सुरक्षित रखिए।'], en: ['⬇️ Backup File', 'Makes one file (JSON) of all kundlis.', 'Keep it safe on a pen-drive or another computer.'], help: 'data' },
      { s: '#btnRestore', hi: ['⬆️ बैकअप खोलें', 'पहले बनाई बैकअप फ़ाइल चुनकर सूची वापस लाता है।', 'खोलने से पहले ऐप एक सुरक्षा-बैकअप भी बना लेता है।'], en: ['⬆️ Open Backup', 'Pick a backup file made earlier to bring the list back.', 'Before opening, the app also makes a safety backup.'], help: 'data' },
      { s: '#fName', hi: ['नाम + 📁', 'जातक का नाम (वैकल्पिक)। 📁 से सहेजी कुंडलियों की बड़ी सूची खुलती है।', 'सूची से चुनी कुंडली फ़ॉर्म में भर जाती है।'], en: ['Name + 📁', 'Native\'s name (optional). 📁 opens the big list of saved kundlis.', 'The chosen kundli fills the form.'] },
      { s: '#fGroup', hi: ['ग्रुप + ＋ नया ग्रुप', 'कुंडली किस ग्रुप में रहे (परिवार, मित्र, ग्राहक…)। नया ग्रुप भी बना सकते हैं।', 'बाद में “ग्रुप” से खोजने पर उसी ग्रुप की कुंडलियाँ दिखती हैं।'], en: ['Group + ＋ New Group', 'Which group the kundli belongs to (family, friends, clients…). You can make a new group.', 'Searching by “Group” later shows that group\'s kundlis.'] },
      { s: '.radios', hi: ['लिंग', 'पुरुष या स्त्री चुनना ज़रूरी है।', 'इससे चार्ट और तालिकाओं में ग्रहों का क्रम बदलता है।'], en: ['Gender', 'Choosing Male or Female is required.', 'It changes the order of planets in the chart and tables.'], help: 'vivaran' },
      { s: '#fDate', hi: ['जन्म-तारीख़', 'दिन-महीना-साल लिखिए — जैसे 18-06-1995; अंक लिखते ही अगला हिस्सा आगे बढ़ता है।', 'ग़लत तारीख़ (जैसे 31-02) पर नीचे लाल सूचना आती है।'], en: ['Date of birth', 'Type DD-MM-YYYY — e.g. 18-06-1995; the cursor moves on as you type.', 'A wrong date (e.g. 31-02) shows a red note below.'] },
      { s: '#fTime', hi: ['जन्म-समय', '24 घंटे के ढंग से — 14:47 या 14:47:32 (सेकंड वैकल्पिक)।', 'दाईं ओर नीले में 12 घंटे वाला समय दिखता है (जैसे 2:47 pm)।'], en: ['Time of birth', '24-hour style — 14:47 or 14:47:32 (seconds optional).', 'The 12-hour time shows in blue on the right (e.g. 2:47 pm).'] },
      { s: '#fCountryTxt', hi: ['देश', 'देश का नाम लिखिए — सूची छँटती जाती है; क्लिक या Enter से चुनिए।', 'चुनते ही राज्य-सूची, शहर-सूची और टाइम ज़ोन उसी देश के हो जाते हैं।'], en: ['Country', 'Type the country name — the list narrows; pick with click or Enter.', 'The state list, city list and time zone switch to that country.'], help: 'vivaran' },
      { s: '#fState', hi: ['राज्य / प्रांत', 'उस देश का राज्य चुनिए (जिस देश में राज्य न हों, वहाँ यह खाना बंद रहता है)।', 'जन्म-स्थान के सुझाव पहले उसी राज्य के आते हैं।'], en: ['State / Province', 'Pick the state of that country (closed for countries without states).', 'Birth-place suggestions from that state come first.'] },
      { s: '#fPlace', hi: ['जन्म स्थान + 🔍', 'अंग्रेज़ी अक्षरों में लिखिए — जैसे B → Boisar; ↑↓ और Enter से चुनिए। 🔍 से पूरी सूची।', 'चुनते ही अक्षांश, देशांतर, टाइम ज़ोन और GMT अपने-आप भर जाते हैं।'], en: ['Birth place + 🔍', 'Type in English letters — e.g. B → Boisar; pick with ↑↓ and Enter. 🔍 shows the full list.', 'Latitude, longitude, time zone and GMT fill in by themselves.'], help: 'vivaran' },
      { s: '#fLat', hi: ['अक्षांश / देशांतर', 'स्थान चुनने पर अपने-आप भरते हैं; शहर सूची में न हो तो ख़ुद लिखिए।', 'इन्हीं से लग्न और भाव बनते हैं।'], en: ['Latitude / Longitude', 'Filled automatically when you pick a place; type them if the city is not listed.', 'The ascendant and houses are worked out from these.'] },
      { s: '#fGmt', hi: ['GMT, टाइम ज़ोन और DST', 'GMT जन्म की तारीख़-समय और टाइम ज़ोन से अपने-आप बनता है — DST भी अपने-आप जुड़ता है।', 'नीचे पंक्ति में लिखा रहता है कि क्या लगा (जैसे “DST लागू नहीं”, “युद्ध-काल का समय”)।'], en: ['GMT, time zone and DST', 'GMT is worked out from the birth date-time and time zone — DST is added automatically.', 'The line below says what was applied (e.g. “no DST”, “war time”).'], help: 'vivaran' },
      { s: '#btnNew', hi: ['＋ नई कुंडली', 'फ़ॉर्म ख़ाली करता है और नया Ref नंबर देता है।', 'डिफ़ॉल्ट स्थान (सेटिंग्स वाला) पहले से भरा मिलता है।'], en: ['＋ New Kundli', 'Clears the form and gives a new Ref number.', 'The default place (from Settings) comes pre-filled.'], help: 'naya' },
      { s: '#btnSave', hi: ['💾 सहेजें', 'फ़ॉर्म की कुंडली सूची में सहेजता है।', 'सहेजी कुंडलियों की सूची में नाम जुड़ जाता है (पुरानी खुली हो तो वही बदलती है)।'], en: ['💾 Save', 'Saves the kundli in the form to the list.', 'The name appears in the saved list (or the open one is updated).'], help: 'naya' },
      { s: '#btnDelete', hi: ['🗑 मिटाएँ', 'खुली कुंडली को सूची से मिटाता है।', 'पहले पुष्टि पूछी जाती है।'], en: ['🗑 Delete', 'Deletes the open kundli from the list.', 'It asks to confirm first.'] },
      { s: '#btnShow', hi: ['कुंडली देखें →', 'भरे विवरण से कुंडली बनाता है (सहेजना ज़रूरी नहीं)।', 'कुंडली की screen खुलती है — चार्ट, तालिकाएँ, दशा, गोचर। उसकी गाइड अलग है (सहायता → बटन गाइड)।'], en: ['View Kundli →', 'Makes the kundli from the filled details (saving is not required).', 'The kundli screen opens — chart, tables, dasha, transit. It has its own guide (Help → Button Guide).'] }
    ],
    result: [
      { s: '#btnBack', hi: ['← वापस', 'जन्म-विवरण वाले फ़ॉर्म पर लौटता है।', 'फ़ॉर्म में वही विवरण रहते हैं — बदलकर फिर “कुंडली देखें”।'], en: ['← Back', 'Goes back to the birth-details form.', 'The form keeps the same details — change them and “View Kundli” again.'] },
      { s: '#btnRPrint', hi: ['🖨️ प्रिंट · 📄 PDF · 📄 PNG', 'यही तीनों बटन यहाँ भी हैं (फ़ोन पर केवल यहीं)।', 'तीनों हमेशा जन्म-कुंडली छापते हैं — गोचर चालू हो तब भी।'], en: ['🖨️ Print · 📄 PDF · 📄 PNG', 'The same three buttons are here too (on phones only here).', 'All three always print the birth chart — even in transit mode.'], help: 'print' },
      { s: '#pPariv', hi: ['परिवर्तन की पेटी', 'कुंडली में ग्रहों का परिवर्तन हो तो जोड़ी यहाँ लिखी आती है (जैसे बुध ⇄ गुरु)।', 'न हो तो “—”। परिवर्तन होने पर पेटी हल्की धड़कती है।'], en: ['Parivartan box', 'If planets exchange, the pair is written here (e.g. Mercury ⇄ Jupiter).', 'Otherwise “—”. With a parivartan the box gently pulses.'], help: 'bpap' },
      { s: '#pMid', hi: ['राहु-केतु मध्य बिंदु की पेटी', 'मध्य बिंदु के पास बैठा ग्रह यहाँ लिखा आता है; न हो तो “—”।', 'पेटी पर माउस ले जाने से दोनों बिंदुओं की राशि-डिग्री दिखती है।'], en: ['Rahu-Ketu Midpoint box', 'A planet sitting near the midpoint is written here; otherwise “—”.', 'Hover the box to see both points\' sign-degree.'], help: 'teen' },
      { s: '#rChart', hi: ['चार्ट', 'भाव 01–12, ग्रह कोड और डिग्री; # = वक्री। शैली (उत्तर/दक्षिण) सेटिंग्स से।', 'किसी ग्रह पर माउस ले जाइए — नक्षत्र-पद, भाव, स्वामी आदि का छोटा बक्सा और तीर दिखते हैं।'], en: ['Chart', 'Houses 01–12, planet codes and degrees; # = retrograde. Style (North/South) from Settings.', 'Hover a planet — a small box with nakshatra-pada, house, lord etc. and arrows appear.'], help: 'chart' },
      { s: '#gocharTime', hi: ['गोचर का समय', 'जिस तारीख़-समय का गोचर देखना है, वह लिखिए (📅 से कैलेंडर)।', 'चार्ट के बाहर उस समय के चलते ग्रह दिखते हैं।'], en: ['Transit time', 'Type the date-time for the transit (📅 opens a calendar).', 'The moving planets of that time show outside the chart.'], help: 'gochar' },
      { s: '#btnGocharNow', hi: ['अभी', 'गोचर का समय “अभी” (आज, इसी पल) कर देता है।', 'चार्ट के बाहर के गोचर-ग्रह ताज़ा हो जाते हैं।'], en: ['Now', 'Sets the transit time to “now”.', 'The transit planets outside the chart refresh.'], help: 'gochar' },
      { s: '#btnTransitMode', hi: ['गोचर (मोड)', 'तालिकाओं को गोचर के ग्रहों से दिखाने का मोड चालू/बंद करता है।', 'दाईं ओर “गोचर चार्ट” tab जलता है और तालिकाओं के शीर्षक में TRANSIT आता है।'], en: ['Transit (mode)', 'Turns on/off the mode that shows the tables with transit planets.', 'The “Transit Chart” tab lights up on the right and tables say TRANSIT.'], help: 'gochar' },
      { s: '.stcard .ct', hi: ['🌟 स्पेशल ट्रांज़िट', 'चलते ग्रह जन्म-ग्रह के 1-5-7-9 (या 1-5-9) स्थानों से कब गुज़रेंगे — Start/End तिथियाँ।', 'इसकी भी अपनी 🖨️ प्रिंट / 📄 PDF है।'], en: ['🌟 Special Transit', 'When moving planets pass the 1-5-7-9 (or 1-5-9) positions of a birth planet — Start/End dates.', 'It has its own 🖨️ Print / 📄 PDF.'] },
      { s: '#rStGroups', hi: ['कौन-से चलते ग्रह', 'सभी ग्रह / राहु-केतु / शनि-गुरु में से चुनिए।', 'केवल उन्हीं ग्रहों के गोचर की तिथियाँ बनती हैं।'], en: ['Which moving planets', 'Choose All Planets / Rahu-Ketu / Saturn-Jupiter.', 'Dates are made only for those planets.'] },
      { s: '#rStBirth', hi: ['जन्म का ग्रह (मुख्य ग्रह)', 'किस जन्म-ग्रह के लिए देखना है।', 'नतीजा उसी ग्रह के स्थानों के हिसाब से।'], en: ['Birth planet (main)', 'Which birth planet to check.', 'Results are for that planet\'s positions.'] },
      { s: '#rStMode', hi: ['1-5-7-9 / 1-5-9 · शुरू · अंत · खोजें', 'स्थानों का प्रकार और तिथियों की अवधि चुनकर “खोजें” दबाइए।', 'नीचे Start/End तिथियों की सूची बनती है।'], en: ['1-5-7-9 / 1-5-9 · Start · End · Find', 'Pick the kind of positions and the date range, then press “Find”.', 'A list of Start/End dates appears below.'] },
      { s: '.chartctrl', hi: ['BP · AP · गोचर चार्ट', 'BP = परिवर्तन से पहले, AP = परिवर्तन के बाद; तीसरा = गोचर।', 'चार्ट और सारी तालिकाएँ उसी के हिसाब से बदल जाती हैं।'], en: ['BP · AP · Transit Chart', 'BP = before Parivartan, AP = after Parivartan; third = transit.', 'The chart and all tables switch accordingly.'], help: 'bpap' },
      { s: '#rBhavaTabs', hi: ['BHAVA COMBINATION के tabs', '12 भावों (B01–B12) की तालिका, चार रूपों में:', 'रंग: नीला = पहला, हरा = 20% या ज़्यादा, नारंगी = 20% से कम।'], en: ['BHAVA COMBINATION tabs', 'Table of the 12 houses (B01–B12), in four views:', 'Colours: blue = first, green = 20% or more, orange = below 20%.'], help: 'bpap',
        items: { hi: ['1-5-9 — 1-5-9 संयोजन', '1-5-7-9 — 1-5-7-9 संयोजन', 'BRSSS — भाव-संधियों पर बनी सूची', 'SPECIAL — LORD, PLANETS(A), IN STAR OF A, फलदाता'], en: ['1-5-9 — 1-5-9 combination', '1-5-7-9 — 1-5-7-9 combination', 'BRSSS — list built on house cusps', 'SPECIAL — LORD, PLANETS(A), IN STAR OF A, Director'] } },
      { s: '#rPlanetTabs', hi: ['PLANET COMBINATION के tabs', '9 ग्रहों की तालिका; पंक्ति-नाम के आगे भाव-बिंदु अंक (जैसे JUP#-15):', 'आख़िरी खाने में ग्रह-साथी (Astronomy); न हो तो “—”।'], en: ['PLANET COMBINATION tabs', 'Table of the 9 planets; row name carries the point number (e.g. JUP#-15):', 'The last column shows the planet partner (Astronomy); “—” if none.'], help: 'bpap',
        items: { hi: ['1-5-7-9 / 1-5-9 — ग्रह के संयोजन', 'SPECIAL — स्वामी · बैठा → देता · तारा · फलदाता', '3-11 — 60° ±3° वाले संशोधक ग्रह', 'PRSSS — जन्म के ग्रहों पर बनी सूची'], en: ['1-5-7-9 / 1-5-9 — planet combinations', 'SPECIAL — lord · sits → gives · star · director', '3-11 — modifier planets at 60° ±3°', 'PRSSS — list built on birth planets'] } },
      { s: '#rDashaTabs', hi: ['VIMSHOTTARI — DHASA / BHUKTHI / ANDHIRAM', 'महादशा → भुक्ति → अंतर। किसी पंक्ति पर क्लिक करने से उसके भीतर की दशाएँ खुलती हैं।', 'पीली पंक्ति = आज चल रही दशा; “—” = जन्म से पहले बीत चुकी अवधि।'], en: ['VIMSHOTTARI — DHASA / BHUKTHI / ANDHIRAM', 'Mahadasha → bhukthi → andhiram. Click a row to open the periods inside it.', 'Yellow row = running today; “—” = period over before birth.'], help: 'dasha' }
    ]
  }

  // ---------------------------------------------------------------- सहायक
  function lang() {
    try { if (window.BNNApp && window.BNNApp.lang) return window.BNNApp.lang() } catch (e) {}
    try { return localStorage.getItem('bnn_lang_v1') === 'en' ? 'en' : 'hi' } catch (e) { return 'hi' }
  }
  function L(hi, en) { return lang() === 'en' ? en : hi }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function txt(step) { return lang() === 'en' ? step.en : step.hi }
  function itemsOf(step) { return step.items ? (lang() === 'en' ? step.items.en : step.items.hi) : null }

  function visibleEl(sel) {
    var list = String(sel).split(',')
    for (var i = 0; i < list.length; i++) {
      var e = null
      try { e = document.querySelector(list[i].trim()) } catch (x) { e = null }
      if (!e) continue
      if (e.closest && e.closest('[hidden]')) continue
      var r = e.getBoundingClientRect()
      if (!r || (r.width === 0 && r.height === 0)) continue
      if (window.getComputedStyle) {
        var cs = window.getComputedStyle(e)
        if (cs.display === 'none' || cs.visibility === 'hidden') continue
      }
      return e
    }
    return null
  }
  function currentScreen() {
    var r = document.getElementById('viewResult')
    return (r && !r.hidden) ? 'result' : 'form'
  }
  function helpTitle(id) {
    var T = (window.BNNHelp && window.BNNHelp.topics) || []
    for (var i = 0; i < T.length; i++) if (T[i].id === id) return T[i].title
    return ''
  }

  // ---------------------------------------------------------------- tour
  var st = null   // { screen, steps:[{step, el}], i, demo, scrolls }

  // गाइड के दौरान जो डिब्बे/पन्ना scroll हुए, बंद होने पर उन्हें पहले जैसा लौटाओ (screen जैसी थी वैसी)
  function rememberScroll(el) {
    if (!st) return
    for (var e = el; e; e = e.parentElement) {
      if (st.scrolls.some(function (x) { return x.el === e })) continue
      st.scrolls.push({ el: e, l: e.scrollLeft, t: e.scrollTop })
    }
    var se = document.scrollingElement || document.documentElement
    if (se && !st.scrolls.some(function (x) { return x.el === se })) st.scrolls.push({ el: se, l: se.scrollLeft, t: se.scrollTop })
  }
  function restoreScroll(list) {
    for (var i = list.length - 1; i >= 0; i--) { try { list[i].el.scrollLeft = list[i].l; list[i].el.scrollTop = list[i].t } catch (e) {} }
  }

  function stepsFor(screen) {
    var out = []
    var arr = STEPS[screen] || []
    for (var i = 0; i < arr.length; i++) {
      var el = visibleEl(arr[i].s)
      if (el) out.push({ step: arr[i], el: el })
    }
    return out
  }

  function build() {
    var wrap = document.createElement('div')
    wrap.id = 'gdWrap'
    wrap.className = 'gdWrap'
    wrap.setAttribute('role', 'dialog')
    wrap.setAttribute('aria-modal', 'true')
    wrap.innerHTML = '<div class="gdBlock" id="gdBlock"></div><div class="gdSpot" id="gdSpot"></div>' +
      '<div class="gdCard" id="gdCard" aria-live="polite"><div class="gdHead"><span class="gdNum" id="gdNum"></span><b id="gdTitle"></b></div>' +
      '<div class="gdBody" id="gdBody"></div>' +
      '<div class="gdFoot"><button type="button" class="btn small" id="gdPrev"></button><span class="sp"></span>' +
      '<button type="button" class="btn small" id="gdClose"></button><button type="button" class="btn small amber" id="gdNext"></button></div></div>'
    document.body.appendChild(wrap)
    document.getElementById('gdPrev').addEventListener('click', function () { go(-1) })
    document.getElementById('gdNext').addEventListener('click', function () { go(1) })
    document.getElementById('gdClose').addEventListener('click', function () { stop() })
    // धुँधले हिस्से पर क्लिक से कुछ न दबे (गाइड के दौरान ऐप अछूता)
    document.getElementById('gdBlock').addEventListener('mousedown', function (ev) { ev.preventDefault() })
    return wrap
  }

  function render() {
    if (!st) return
    var cur = st.steps[st.i]
    if (!cur) return
    var t = txt(cur.step)
    var n = st.steps.length
    document.getElementById('gdNum').textContent = (st.i + 1) + ' / ' + n
    document.getElementById('gdTitle').textContent = t[0]
    var h = '<div>' + esc(t[1]) + '</div>'
    var it = itemsOf(cur.step)
    if (it) { h += '<ul>'; for (var k = 0; k < it.length; k++) h += '<li>' + esc(it[k]) + '</li>'; h += '</ul>' }
    h += '<div class="gdSee">👁 ' + esc(t[2]) + '</div>'
    if (cur.step.help) {
      var ht = helpTitle(cur.step.help)
      if (ht) h += '<div class="gdMore">' + esc(L('विस्तार: ❓ सहायता → ', 'More: ❓ Help → ')) + esc(ht) + '</div>'
    }
    if (st.i === 0 && st.demo) h += '<div class="gdMore">' + esc(L('यह नमूना कुंडली है — केवल गाइड के लिए; सहेजी नहीं जाती।', 'This is a sample kundli — only for the guide; it is not saved.')) + '</div>'
    document.getElementById('gdBody').innerHTML = h
    document.getElementById('gdPrev').textContent = L('← पिछला', '← Back')
    document.getElementById('gdPrev').disabled = st.i === 0
    document.getElementById('gdClose').textContent = L('बंद करें', 'Close')
    document.getElementById('gdNext').textContent = st.i === n - 1 ? L('पूरा ✓', 'Done ✓') : L('अगला →', 'Next →')
    rememberScroll(cur.el)
    try { cur.el.scrollIntoView({ block: 'center', inline: 'nearest' }) } catch (e) { try { cur.el.scrollIntoView() } catch (e2) {} }
    place()
    try { document.getElementById('gdNext').focus({ preventScroll: true }) } catch (e) {}
  }

  function place() {
    if (!st) return
    var cur = st.steps[st.i]
    if (!cur) return
    var spot = document.getElementById('gdSpot'), card = document.getElementById('gdCard')
    var vw = window.innerWidth || document.documentElement.clientWidth || 1200
    var vh = window.innerHeight || document.documentElement.clientHeight || 800
    var r = cur.el.getBoundingClientRect()
    var pad = 6
    var x = Math.max(2, r.left - pad), y = Math.max(2, r.top - pad)
    var w = Math.min(vw - x - 2, r.width + pad * 2), h = Math.min(vh - y - 2, r.height + pad * 2)
    spot.style.left = x + 'px'; spot.style.top = y + 'px'; spot.style.width = Math.max(10, w) + 'px'; spot.style.height = Math.max(10, h) + 'px'
    var narrow = vw < 820
    card.classList.toggle('gdNarrow', narrow)
    if (narrow) { card.style.left = ''; card.style.top = ''; return }   // फ़ोन: नीचे पूरी चौड़ाई (CSS)
    var cw = Math.min(380, vw - 24)
    card.style.width = cw + 'px'
    var ch = card.offsetHeight || 180
    var gap = 14
    var cx, cy
    if (r.bottom + gap + ch <= vh - 8) { cy = r.bottom + gap; cx = r.left }             // नीचे
    else if (r.top - gap - ch >= 8) { cy = r.top - gap - ch; cx = r.left }              // ऊपर
    else if (r.right + gap + cw <= vw - 8) { cx = r.right + gap; cy = r.top }           // दाएँ
    else if (r.left - gap - cw >= 8) { cx = r.left - gap - cw; cy = r.top }             // बाएँ
    else { cx = vw - cw - 12; cy = vh - ch - 12 }                                      // कोना
    cx = Math.max(8, Math.min(cx, vw - cw - 8))
    cy = Math.max(8, Math.min(cy, vh - ch - 8))
    card.style.left = Math.round(cx) + 'px'; card.style.top = Math.round(cy) + 'px'
  }

  function go(d) {
    if (!st) return
    var j = st.i + d
    if (j < 0) return
    if (j >= st.steps.length) { stop(); return }
    st.i = j
    render()
  }

  function onKey(ev) {
    if (!st) return
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); stop() }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); go(1) }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(-1) }
    else if (ev.key === 'Tab') {   // फ़ोकस कार्ड के भीतर ही
      var f = [document.getElementById('gdPrev'), document.getElementById('gdClose'), document.getElementById('gdNext')].filter(function (b) { return b && !b.disabled })
      if (!f.length) return
      var k = f.indexOf(document.activeElement)
      ev.preventDefault()
      f[(k + (ev.shiftKey ? -1 : 1) + f.length) % f.length].focus()
    }
  }
  function onResize() { place() }
  function onLang() { if (st) render() }

  // screen = 'form' | 'result' | undefined (= जो screen अभी खुली है)
  async function start(screen) {
    if (st) stop()
    var api = window.BNNApp || {}
    if (window.BNNHelp && window.BNNHelp.close) { try { window.BNNHelp.close() } catch (e) {} }
    screen = screen || currentScreen()
    var demo = false
    if (screen === 'result') {
      if (!(api.hasResult && api.hasResult())) {
        if (!api.openDemo) return false
        var ok = await api.openDemo()
        if (!ok) return false
        demo = true
      } else if (currentScreen() !== 'result' && api.showView) api.showView('result')
    } else if (currentScreen() !== 'form' && api.showView) api.showView('form')
    var steps = stepsFor(screen)
    if (!steps.length) { if (demo && api.closeDemo) api.closeDemo(); return false }
    var wrap = document.getElementById('gdWrap') || build()
    wrap.hidden = false
    document.body.classList.add('guideOpen')
    st = { screen: screen, steps: steps, i: 0, demo: demo, scrolls: [] }
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', onResize)
    document.addEventListener('bnn:lang', onLang)
    render()
    return true
  }

  function stop() {
    if (!st) return
    var demo = st.demo, scrolls = st.scrolls
    st = null
    if (!demo) restoreScroll(scrolls)
    var wrap = document.getElementById('gdWrap')
    if (wrap) wrap.hidden = true
    document.body.classList.remove('guideOpen')
    document.removeEventListener('keydown', onKey, true)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('bnn:lang', onLang)
    if (demo && window.BNNApp && window.BNNApp.closeDemo) window.BNNApp.closeDemo()
  }

  // ---------------------------------------------------------------- सहायता की सूची
  function refHtml() {
    var h = '<div class="gdRef">'
    h += '<p>' + esc(L('नए उपयोगकर्ता के लिए — हर बटन क्या करता है और दबाने पर क्या दिखता है। स्क्रीन पर एक-एक बटन चमकाकर दिखाने के लिए:',
      'For new users — what every button does and what you see after pressing it. To see it on the screen, one button at a time:')) + '</p>'
    h += '<div class="gdStart"><button type="button" class="btn amber" id="gdStartForm">▶ ' + esc(L('जन्म-विवरण screen की गाइड', 'Guide: birth-details screen')) + '</button>' +
      '<button type="button" class="btn amber" id="gdStartResult">▶ ' + esc(L('कुंडली screen की गाइड', 'Guide: kundli screen')) + '</button></div>'
    h += '<p class="gdHint">' + esc(L('कुंजियाँ: → अगला · ← पिछला · Esc बंद। कोई कुंडली खुली न हो तो कुंडली-screen की गाइड नमूना कुंडली पर चलती है (सहेजी नहीं जाती)।',
      'Keys: → next · ← back · Esc close. If no kundli is open, the kundli-screen guide uses a sample kundli (not saved).')) + '</p>'
    var groups = [['form', L('1. जन्म-विवरण वाली screen', '1. Birth-details screen')], ['result', L('2. कुंडली वाली screen', '2. Kundli screen')]]
    for (var g = 0; g < groups.length; g++) {
      h += '<h4>' + esc(groups[g][1]) + '</h4><table class="gdTbl"><thead><tr><th>' + esc(L('बटन / खाना', 'Button / field')) + '</th><th>' +
        esc(L('क्या करता है', 'What it does')) + '</th><th>' + esc(L('क्या दिखता है', 'What you see')) + '</th></tr></thead><tbody>'
      var arr = STEPS[groups[g][0]]
      for (var i = 0; i < arr.length; i++) {
        var t = txt(arr[i]), it = itemsOf(arr[i])
        var mid = esc(t[1])
        if (it) mid += '<ul>' + it.map(function (x) { return '<li>' + esc(x) + '</li>' }).join('') + '</ul>'
        h += '<tr><td><b>' + esc(t[0]) + '</b></td><td>' + mid + '</td><td>' + esc(t[2]) + '</td></tr>'
      }
      h += '</tbody></table>'
    }
    h += '</div>'
    return h
  }
  function wireRef(root) {
    var a = (root || document).querySelector('#gdStartForm'), b = (root || document).querySelector('#gdStartResult')
    if (a) a.addEventListener('click', function () { start('form') })
    if (b) b.addEventListener('click', function () { start('result') })
  }

  window.BNNGuide = {
    steps: STEPS,
    start: start,
    stop: stop,
    next: function () { go(1) },
    prev: function () { go(-1) },
    isOpen: function () { return !!st },
    state: function () { return st ? { screen: st.screen, i: st.i, n: st.steps.length, demo: st.demo, sel: st.steps[st.i].step.s } : null },
    stepsFor: stepsFor,
    refHtml: refHtml,
    wireRef: wireRef
  }
})()
