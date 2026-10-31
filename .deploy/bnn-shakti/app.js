'use strict';
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var LS_KEY = 'bnn_kundli_v1';
  var state = { nextRef: 1, groups: ['परिवार', 'मित्र'], records: [] };
  var currentId = null, filterField = 'ref', grpSel = null;
  var LANG_KEY = 'bnn_lang_v1';
  var LANG = 'hi';
  function L(hi, en) { return LANG === 'en' ? en : hi; }
  function T(s) { var p = String(s).split('||'); return LANG === 'en' ? (p[1] || p[0]) : p[0]; }


  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._h); toast._h = setTimeout(function () { t.hidden = true; }, 3400);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setStatus() {
    var d = new Date();
    var hh = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    $('status').textContent = L('॥ श्री गणेशाय नमः ॥ · कुल कुंडलियाँ: ', '॥ Shree Ganeshaya Namah ॥ · Total kundlis: ') + state.records.length + L(' · अंतिम सहेजा: ', ' · Last saved: ') + hh;
  }

  function loadState() {
    try {
      var t = localStorage.getItem(LS_KEY);
      if (t) {
        var o = JSON.parse(t);
        if (o && Array.isArray(o.records)) {
          state = o;
          if (!state.groups || !state.groups.length) state.groups = ['परिवार', 'मित्र'];
          if (state.groups.indexOf('ग्राहक') > -1) {
            var gUsed = state.records.some(function (r) { return r.group === 'ग्राहक'; });
            if (!gUsed) { state.groups = state.groups.filter(function (g) { return g !== 'ग्राहक'; }); saveState(); }
          }
          if (!(state.nextRef >= 1)) state.nextRef = 1 + state.records.reduce(function (m, r) { return Math.max(m, r.ref || 0); }, 0);
        }
      }
    } catch (e) { /* पहली बार — ख़ाली से शुरू */ }
  }
  function saveState() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); return true; }
    catch (e) { toast(L('⚠️ इस ब्राउज़र में सहेजना उपलब्ध नहीं — बैकअप फ़ाइल वाला तरीक़ा इस्तेमाल करें', '⚠️ Saving is not available in this browser — use the Backup File method')); return false; }
  }

  function vDate(s) {
    s = (s || '').trim();
    var m = /^(\d{1,2})[\-\/.](\d{1,2})[\-\/.](\d{4})$/.exec(s);
    if (!m) return null;
    var d = +m[1], mo = +m[2], y = +m[3];
    if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 1800 || y > 2400) return null;
    return ('0' + d).slice(-2) + '-' + ('0' + mo).slice(-2) + '-' + y;
  }
  function vTime(s) {
    // राउंड 64 / चरण 2: सेकंड वैकल्पिक है। maskTyped समय-खाने में मिनट भरते ही आख़िरी ':'
    // लगा देता है (ताकि सीधे सेकंड टाइप हो सकें), इसलिए आख़िर के ':' हटाकर जाँचें।
    s = (s || '').trim().replace(/:+$/, '');
    var m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
    if (!m) return null;
    var h = +m[1], mi = +m[2], se = +(m[3] || 0);
    if (h > 23 || mi > 59 || se > 59) return null;
    return ('0' + h).slice(-2) + ':' + ('0' + mi).slice(-2) + ':' + ('0' + se).slice(-2);
  }
  function vNum(s) {
    s = (s || '').trim();
    if (s === '') return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  }

  var COUNTRIES = [['India', 'भारत'], ['Nepal', 'नेपाल'], ['Sri Lanka', 'श्रीलंका'], ['UAE', 'संयुक्त अरब अमीरात'], ['USA', 'अमेरिका'], ['UK', 'यूनाइटेड किंगडम'], ['Canada', 'कनाडा'], ['Australia', 'ऑस्ट्रेलिया'], ['Other', 'अन्य']];
  var STATES = [['Andaman & Nicobar', 'अंडमान व निकोबार'], ['Arunachal Pradesh', 'अरुणाचल प्रदेश'], ['Assam', 'असम'], ['Andhra Pradesh', 'आंध्र प्रदेश'], ['Bihar', 'बिहार'], ['Chandigarh', 'चंडीगढ़'], ['Chhattisgarh', 'छत्तीसगढ़'], ['Dadra & Nagar Haveli', 'दादरा व नगर हवेली'], ['Daman & Diu', 'दमन-दीव'], ['Delhi', 'दिल्ली'], ['Goa', 'गोवा'], ['Gujarat', 'गुजरात'], ['Haryana', 'हरियाणा'], ['Himachal Pradesh', 'हिमाचल प्रदेश'], ['Jammu & Kashmir', 'जम्मू-कश्मीर'], ['Jharkhand', 'झारखंड'], ['Karnataka', 'कर्नाटक'], ['Kerala', 'केरल'], ['Ladakh', 'लद्दाख'], ['Lakshadweep', 'लक्षद्वीप'], ['Madhya Pradesh', 'मध्य प्रदेश'], ['Maharashtra', 'महाराष्ट्र'], ['Manipur', 'मणिपुर'], ['Meghalaya', 'मेघालय'], ['Mizoram', 'मिज़ोरम'], ['Nagaland', 'नागालैंड'], ['Odisha', 'ओडिशा'], ['Puducherry', 'पुदुचेरी'], ['Punjab', 'पंजाब'], ['Rajasthan', 'राजस्थान'], ['Sikkim', 'सिक्किम'], ['Tamil Nadu', 'तमिलनाडु'], ['Telangana', 'तेलंगाना'], ['Tripura', 'त्रिपुरा'], ['Uttarakhand', 'उत्तराखंड'], ['Uttar Pradesh', 'उत्तर प्रदेश'], ['West Bengal', 'पश्चिम बंगाल']];
  function hiOfEn(pairs, en) { for (var i = 0; i < pairs.length; i++) if (pairs[i][0] === en) return pairs[i][1]; return en || ''; }
  function enOfHiP(pairs, hi) { for (var i = 0; i < pairs.length; i++) if (pairs[i][1] === hi) return pairs[i][0]; return hi || ''; }
  var PLACE_EN = {
    'बोईसर': 'Boisar', 'पालघर': 'Palghar', 'वसई-विरार': 'Vasai-Virar', 'मुंबई': 'Mumbai', 'ठाणे': 'Thane',
    'नवी मुंबई': 'Navi Mumbai', 'पुणे': 'Pune', 'नासिक': 'Nashik', 'छत्रपति संभाजीनगर': 'Chhatrapati Sambhajinagar',
    'कोल्हापुर': 'Kolhapur', 'सोलापुर': 'Solapur', 'नागपुर': 'Nagpur', 'अमरावती': 'Amravati', 'अकोला': 'Akola',
    'दिल्ली': 'Delhi', 'चंडीगढ़': 'Chandigarh', 'अमृतसर': 'Amritsar', 'लुधियाना': 'Ludhiana', 'शिमला': 'Shimla',
    'जम्मू': 'Jammu', 'देहरादून': 'Dehradun', 'हरिद्वार': 'Haridwar', 'जयपुर': 'Jaipur', 'अजमेर': 'Ajmer',
    'जोधपुर': 'Jodhpur', 'उदयपुर': 'Udaipur', 'कोटा': 'Kota', 'लखनऊ': 'Lucknow', 'कानपुर': 'Kanpur',
    'प्रयागराज': 'Prayagraj', 'आगरा': 'Agra', 'मथुरा': 'Mathura', 'वाराणसी': 'Varanasi', 'अयोध्या': 'Ayodhya',
    'गोरखपुर': 'Gorakhpur', 'पटना': 'Patna', 'रांची': 'Ranchi', 'कोलकाता': 'Kolkata', 'गुवाहाटी': 'Guwahati',
    'भुवनेश्वर': 'Bhubaneswar', 'भोपाल': 'Bhopal', 'इंदौर': 'Indore', 'जबलपुर': 'Jabalpur', 'उज्जैन': 'Ujjain',
    'ग्वालियर': 'Gwalior', 'बेतूल': 'Betul', 'सागर': 'Sagar', 'रायपुर': 'Raipur', 'बिलासपुर': 'Bilaspur',
    'अहमदाबाद': 'Ahmedabad', 'सूरत': 'Surat', 'वडोदरा': 'Vadodara', 'राजकोट': 'Rajkot', 'पणजी': 'Panaji',
    'हैदराबाद': 'Hyderabad', 'बेंगलुरु': 'Bengaluru', 'चेन्नई': 'Chennai', 'कोयंबटूर': 'Coimbatore',
    'कोच्चि': 'Kochi', 'तिरुवनंतपुरम': 'Thiruvananthapuram'
  };
  // शहर-सूची — places.js (GeoNames CC BY 4.0) से; न हो तो छोटी fallback सूची ही चलेगी
  var PLACES = (function () {
    var src = (window.BNN_PLACES || []);
    if (!src.length) {
      src = [
        ['Mumbai', 'मुंबई', 'Maharashtra', 19.0728, 72.8826],
        ['Delhi', 'दिल्ली', 'Delhi', 28.6519, 77.2315],
        ['Pune', 'पुणे', 'Maharashtra', 18.5204, 73.8567],
        ['Jaipur', 'जयपुर', 'Rajasthan', 26.9124, 75.7873],
        ['Lucknow', 'लखनऊ', 'Uttar Pradesh', 26.8467, 80.9462],
        ['Patna', 'पटना', 'Bihar', 25.5941, 85.1376],
        ['Bhopal', 'भोपाल', 'Madhya Pradesh', 23.2599, 77.4126],
        ['Hyderabad', 'हैदराबाद', 'Telangana', 17.384, 78.4564],
        ['Chennai', 'चेन्नई', 'Tamil Nadu', 13.0827, 80.2707],
        ['Kolkata', 'कोलकाता', 'West Bengal', 22.5726, 88.3639]
      ];
    }
    var out = [];
    for (var i = 0; i < src.length; i++) {
      var r = src[i];
      out.push({ en: r[0], n: r[1] || r[0], se: r[2], s: hiOfEn(STATES, r[2]), lat: r[3], lon: r[4], alt: r[5] || '' });
    }
    return out;
  })();

  function fillCountries() {
    var sel = $('fCountry'); sel.innerHTML = '';
    COUNTRIES.forEach(function (c) { var o = document.createElement('option'); o.value = c[0]; o.textContent = c[0]; sel.appendChild(o); });
    sel.value = 'India';
  }
  function rebuildStates(pick) {
    var country = $('fCountry').value;
    var sel = $('fState'), txt = $('fStateTxt');
    if (country === 'India') {
      txt.hidden = true; sel.hidden = false;
      sel.innerHTML = '';
      STATES.forEach(function (s) { var o = document.createElement('option'); o.value = s[0]; o.textContent = s[0]; sel.appendChild(o); });
      var ok = false;
      if (pick) { for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === pick) ok = true; }
      sel.value = ok ? pick : 'Maharashtra';
    } else {
      sel.hidden = true; txt.hidden = false;
      txt.value = pick || '';
    }
  }
  var SUGG_ITEMS = [];
  function placeItems(q) {
    var stEN = ($('fCountry').value === 'India') ? $('fState').value : '';
    var list = PLACES.slice();
    q = (q || '').trim(); var ql = q.toLowerCase();
    if (q) {
      list = list.filter(function (p) {
        return p.en.toLowerCase().indexOf(ql) > -1 || p.n.indexOf(q) > -1 || p.se.toLowerCase().indexOf(ql) > -1 || (p.s || '').indexOf(q) > -1 || (p.alt && p.alt.toLowerCase().indexOf(ql) > -1);
      });
    } else if (stEN) {
      var same = list.filter(function (p) { return p.se === stEN; });
      var rest = list.filter(function (p) { return p.se !== stEN; });
      list = same.concat(rest);
    }
    return list.slice(0, 60);
  }
  function renderSugg(q) {
    var box = $('placeSugg'); SUGG_ITEMS = placeItems(q);
    if (!SUGG_ITEMS.length) {
      box.innerHTML = '<div class="sItem none">' + L('कोई सुझाव नहीं — नाम वैसा ही रखें, अक्षांश/देशांतर ख़ुद भरें', 'No suggestions — keep the name as is, fill Latitude/Longitude yourself') + '</div>';
    } else {
      var html = '';
      SUGG_ITEMS.forEach(function (p, i) {
        html += '<div class="sItem" data-i="' + i + '">' + esc(p.en) + ' <span>' + esc(p.se) + (p.n !== p.en ? ' · ' + esc(p.n) : '') + '</span></div>';
      });
      box.innerHTML = html;
    }
    box.hidden = false;
  }
  function hideSugg() { $('placeSugg').hidden = true; }
  function pickPlace(p) {
    $('fPlace').value = p.en;
    if (p.se && $('fCountry').value === 'India') {
      var sel = $('fState');
      for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === p.se) sel.value = p.se;
    }
    $('fLat').value = p.lat; $('fLon').value = p.lon;
    $('fGmt').value = 5.5; $('fDstChk').checked = false;
    hideSugg(); updateFormOk();
  }
  function applyPlace() {
    var v = $('fPlace').value.trim();
    for (var i = 0; i < PLACES.length; i++) { if (PLACES[i].en === v || PLACES[i].n === v) { pickPlace(PLACES[i]); return; } }
  }

  function renderGroups() {
    var sel = $('fGroup'); var keep = sel.value; sel.innerHTML = '';
    state.groups.forEach(function (g) {
      var o = document.createElement('option'); o.textContent = g; o.value = g; sel.appendChild(o);
    });
    if (keep) { for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].value === keep) { sel.value = keep; break; } } }
  }

  function renderList(filter) {
    var el = $('list');
    var q = ((filter && filter.q) || '').trim();
    $('count').textContent = L('कुल कुंडलियाँ: ', 'Total kundlis: ') + state.records.length;
    if (filterField === 'group') {
      el.innerHTML = '';
      var qq = q.toLowerCase();
      if (grpSel) {
        var back = document.createElement('div');
        back.className = 'li grpBack';
        back.textContent = L('← सभी ग्रुप', '← All Groups');
        back.addEventListener('click', function () { grpSel = null; $('q').value = ''; renderList(); });
        el.appendChild(back);
        var mem = state.records.filter(function (r) { return (r.group || '') === grpSel; });
        if (qq) mem = mem.filter(function (r) { var v = [r.ref == null ? '' : String(r.ref), r.name || '', r.mobile || ''].join(' ').toLowerCase(); return v.indexOf(qq) > -1; });
        mem.sort(function (a, b) { return (a.ref || 0) - (b.ref || 0); });
        if (!mem.length) { el.insertAdjacentHTML('beforeend', '<div class="empty">' + L('इस ग्रुप में कुछ नहीं मिला।', 'Nothing in this group.') + '</div>'); }
        mem.forEach(function (r) {
          var d = document.createElement('div');
          d.className = 'li' + (r.id === currentId ? ' on' : '');
          d.innerHTML = '<b>' + r.ref + '</b> · ' + esc(r.name || '—') + (r.mobile ? '<span class="liSub">' + esc(r.mobile) + '</span>' : '');
          d.addEventListener('click', function () { loadRecord(r.id); });
          el.appendChild(d);
        });
      } else {
        var groups = state.groups.slice();
        if (qq) groups = groups.filter(function (g) { return g.toLowerCase().indexOf(qq) > -1; });
        if (!groups.length) { el.innerHTML = '<div class="empty">' + (state.groups.length ? L('कोई ग्रुप नहीं मिला।', 'No groups found.') : L('अभी कोई ग्रुप नहीं है।', 'No groups yet.')) + '</div>'; setStatus(); return; }
        groups.forEach(function (g) {
          var cnt = state.records.filter(function (r) { return (r.group || '') === g; }).length;
          var d = document.createElement('div');
          d.className = 'li grpItem';
          d.innerHTML = '📁 <b>' + esc(g) + '</b><span class="liSub">' + cnt + L(' कुंडलियाँ', ' kundlis') + '</span>';
          d.addEventListener('click', function () { grpSel = g; $('q').value = ''; renderList(); });
          el.appendChild(d);
        });
      }
      setStatus();
      return;
    }
    var rows = state.records.slice().sort(function (a, b) { return (a.ref || 0) - (b.ref || 0); });
    if (q) {
      var ql = q.toLowerCase();
      rows = rows.filter(function (r) {
        var v = '';
        if (filterField === 'ref') v = String(r.ref == null ? '' : r.ref);
        else if (filterField === 'name') v = r.name || '';
        else if (filterField === 'group') v = r.group || '';
        else v = r.mobile || '';
        return String(v).toLowerCase().indexOf(ql) > -1;
      });
    }
    el.innerHTML = '';
    if (!rows.length) {
      el.innerHTML = '<div class="empty">' + (state.records.length ? L('इस खोज में कुछ नहीं मिला।', 'Nothing found in this search.') : L('अभी कोई कुंडली नहीं है।<br>नई कुंडली भरकर 💾 सहेजें दबाएँ।', 'No kundli yet.<br>Fill a new kundli and press 💾 Save.')) + '</div>';
      setStatus();
      return;
    }
    rows.forEach(function (r) {
      var d = document.createElement('div');
      d.className = 'li' + (r.id === currentId ? ' on' : '');
      d.dataset.id = r.id;
      d.innerHTML = '<b>' + r.ref + '</b> · ' + esc(r.name || '—') + (r.mobile ? '<span class="liSub">' + esc(r.mobile) + '</span>' : '');
      d.addEventListener('click', function () { loadRecord(r.id); });
      el.appendChild(d);
    });
    setStatus();
  }

  function loadRecord(id) {
    var r = null;
    for (var i = 0; i < state.records.length; i++) if (state.records[i].id === id) r = state.records[i];
    if (!r) return;
    currentId = id;
    $('fRef').value = r.ref;
    $('fName').value = r.name || '';
    renderGroups(); $('fGroup').value = r.group || state.groups[0];
    var gs = document.getElementsByName('gender');
    for (var j = 0; j < gs.length; j++) gs[j].checked = (gs[j].value === (r.gender || 'पुरुष'));
    $('fMobile').value = r.mobile || '';
    $('fDate').value = r.date || ''; $('fTime').value = r.time || '';
    var ctryEN = r.countryEN || enOfHiP(COUNTRIES, r.country) || 'India';
    var csel = $('fCountry'), cok = false;
    for (var ci = 0; ci < csel.options.length; ci++) if (csel.options[ci].value === ctryEN) cok = true;
    if (!cok) { var co = document.createElement('option'); co.value = ctryEN; co.textContent = ctryEN; csel.appendChild(co); }
    csel.value = ctryEN;
    rebuildStates(r.stateEN || enOfHiP(STATES, r.state) || r.state || '');
    var plv = r.placeEN || r.place || '';
    for (var pj = 0; pj < PLACES.length; pj++) { if (PLACES[pj].n === plv) { plv = PLACES[pj].en; break; } }
    $('fPlace').value = plv; hideSugg();
    $('fLat').value = r.lat != null ? r.lat : ''; $('fLon').value = r.lon != null ? r.lon : '';
    $('fGmt').value = r.gmt != null ? r.gmt : 5.5; $('fDstChk').checked = Number(r.dst) > 0;
    refreshFormTitle();
    clearErr(); updateHour12(); updateFormOk(); renderList();
    toast(L('कुंडली खोल दी — संदर्भ ', 'Kundli opened — Ref ') + r.ref);
  }

  function clearErr() {
    ['fDate', 'fTime', 'fLat', 'fLon', 'fGmt', 'fPlace'].forEach(function (id) { $(id).classList.remove('err'); });
    $('hDate').textContent = ''; $('hTime').textContent = '';
    $('hDate').className = 'hint'; $('hTime').className = 'hint';
  }

  function gather() {
    var errs = []; clearErr();
    var date = vDate($('fDate').value);
    if (!date) { errs.push(L('जन्म तिथि', 'Date of Birth')); $('fDate').classList.add('err'); $('hDate').textContent = L('दिन-महीना-साल भरें — जैसे 18-06-1995', 'Fill DD-MM-YYYY — e.g. 18-06-1995'); $('hDate').className = 'hint err'; }
    var time = vTime($('fTime').value);
    if (!time) { errs.push(L('जन्म समय', 'Time of Birth')); $('fTime').classList.add('err'); $('hTime').textContent = L('घंटा:मिनट भरें (सेकंड वैकल्पिक) — जैसे 14:47 या 14:47:32', 'Fill HH:MM (seconds optional) — e.g. 14:47 or 14:47:32'); $('hTime').className = 'hint err'; }
    var lat = vNum($('fLat').value);
    if (lat === null || lat < -90 || lat > 90) { errs.push(L('अक्षांश', 'Latitude')); $('fLat').classList.add('err'); }
    var lon = vNum($('fLon').value);
    if (lon === null || lon < -180 || lon > 180) { errs.push(L('देशांतर', 'Longitude')); $('fLon').classList.add('err'); }
    var gmt = vNum($('fGmt').value);
    if (gmt === null || gmt < -12 || gmt > 14) { errs.push('GMT'); $('fGmt').classList.add('err'); }
    var dst = $('fDstChk').checked ? 1 : 0;
    var placeRaw = $('fPlace').value.trim();
    if (!placeRaw) { errs.push(L('जन्म स्थान', 'Birth Place')); $('fPlace').classList.add('err'); }
    var placeHI = placeRaw, placeEN = placeRaw;
    for (var pi = 0; pi < PLACES.length; pi++) { if (PLACES[pi].en === placeRaw || PLACES[pi].n === placeRaw) { placeHI = PLACES[pi].n; placeEN = PLACES[pi].en; break; } }
    // राउंड 64 / चरण 3: लिंग का कोई default नहीं — engine में gender से ग्रह-क्रम बदलता है
    // (ORDER_M / ORDER_F), इसलिए गलत default ख़तरनाक था।
    var gender = null;
    var gs = document.getElementsByName('gender');
    for (var j = 0; j < gs.length; j++) if (gs[j].checked) gender = gs[j].value;
    if (!gender) errs.push(L('कृपया पुरुष या स्त्री चुनें', 'Please choose Male or Female'));
    var countryEN = $('fCountry').value || 'India';
    var stateENv = ($('fCountry').value === 'India') ? $('fState').value : $('fStateTxt').value.trim();
    var rec = {
      name: $('fName').value.trim(), group: $('fGroup').value || state.groups[0], gender: gender,
      mobile: $('fMobile').value.trim(), date: date || $('fDate').value.trim(), time: time || $('fTime').value.trim(),
      country: hiOfEn(COUNTRIES, countryEN), countryEN: countryEN,
      state: hiOfEn(STATES, stateENv), stateEN: stateENv, place: placeHI, placeEN: placeEN,
      lat: lat, lon: lon, gmt: gmt, dst: dst
    };
    return { rec: rec, errs: errs };
  }

  function saveKundli(silent) {
    var g = gather();
    if (g.errs.length) { toast(L('कृपया पहले ठीक करें: ', 'Please fix first: ') + g.errs.join(' · ')); return null; }
    var rec = g.rec; var isNew = !currentId;
    if (!isNew) {
      for (var i = 0; i < state.records.length; i++) {
        if (state.records[i].id === currentId) { rec.id = currentId; rec.ref = state.records[i].ref; state.records[i] = rec; break; }
      }
    } else {
      rec.id = Date.now(); rec.ref = state.nextRef; state.nextRef++;
      state.records.push(rec); currentId = rec.id;
    }
    saveState();
    refreshFormTitle();
    $('fRef').value = isNew ? state.nextRef : rec.ref;
    renderList();
    if (!silent) toast(L('✅ सहेज दिया — संदर्भ क्रमांक ', '✅ Saved — Ref No. ') + rec.ref);
    return rec;
  }

  function newKundli() {
    currentId = null;
    $('fName').value = ''; $('fMobile').value = '';
    $('fDate').value = ''; $('fTime').value = '';
    $('fCountry').value = 'India'; rebuildStates('Maharashtra'); $('fPlace').value = ''; hideSugg();
    $('fLat').value = ''; $('fLon').value = ''; $('fGmt').value = 5.5; $('fDstChk').checked = false;
    applyDefaultPlace();
    var gs = document.getElementsByName('gender');
    for (var j = 0; j < gs.length; j++) gs[j].checked = false;   // चरण 3: पहले से कुछ चुना न हो
    renderGroups();
    $('fRef').value = state.nextRef;
    refreshFormTitle();
    clearErr(); updateHour12(); updateFormOk(); renderList();
    toast(L('नई कुंडली — अगला संदर्भ क्रमांक ', 'New kundli — next Ref No. ') + state.nextRef);
  }

  // राउंड 59: अपना confirm-modal (Electron में window.confirm कई हालतों में false लौटा देता है)
  function uiConfirm(msg, okText) {
    return new Promise(function (resolve) {
      var old = document.getElementById('cnfModal'); if (old) old.remove();
      var w = document.createElement('div');
      w.id = 'cnfModal';
      w.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.55);display:flex;align-items:center;justify-content:center;z-index:10001';
      var box = document.createElement('div');
      box.style.cssText = 'background:#faf6ee;border:2px solid #d97706;border-radius:14px;max-width:460px;padding:20px 22px;box-shadow:0 18px 50px rgba(0,0,0,.35);font-family:inherit';
      var txt = document.createElement('div');
      txt.id = 'cnfMsg';
      txt.style.cssText = 'font-size:15.5px;font-weight:700;color:#5b3a12;line-height:1.55';
      txt.textContent = msg;
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:16px';
      var no = document.createElement('button');
      no.className = 'btn'; no.style.height = '36px'; no.textContent = L('रद्द', 'Cancel');
      var yes = document.createElement('button');
      yes.className = 'btn'; yes.style.cssText = 'height:36px;background:#b91c1c;border-color:#b91c1c;color:#fff;font-weight:800';
      yes.textContent = okText || L('हाँ, मिटाएँ', 'Yes, delete');
      row.appendChild(no); row.appendChild(yes);
      box.appendChild(txt); box.appendChild(row); w.appendChild(box); document.body.appendChild(w);
      var done = function (v) { w.remove(); resolve(v); };
      yes.onclick = function () { done(true); };
      no.onclick = function () { done(false); };
      w.addEventListener('click', function (e) { if (e.target === w) done(false); });
    });
  }

  function deleteKundli() {
    if (!currentId) { toast(L('पहले सूची से कोई कुंडली खोलें, फिर मिटाएँ', 'First open a kundli from the list, then Delete')); return; }
    var r = null;
    for (var i = 0; i < state.records.length; i++) if (state.records[i].id === currentId) r = state.records[i];
    if (!r) return;
    var dtag = L('संदर्भ ', 'Ref ') + r.ref + (r.name ? ' (' + r.name + ')' : '');
    uiConfirm(dtag + L(' मिटानी है?', ' — delete?')).then(function (ok) {
      if (!ok) return;
      state.records = state.records.filter(function (x) { return x.id !== currentId; });
      currentId = null; saveState(); newKundli();
      toast(L('🗑 मिटा दिया', '🗑 Deleted'));
    });
  }

  function download(name, text) {
    var a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(text);
    a.download = name; a.click();
  }

  // ---------- परिणाम दृश्य (कुंडली देखें) ----------
  var RESULT = null, RESULT_REC = null;
  var RMODE = 'AP', RCHART = 'north', RBHAVA_TAB = '159', RPLANET_TAB = '1579', RDASHA_TAB = 'maha';
  // राउंड 64 (चरण 4): गोचर मोड अलग स्थिति है — RMODE (BP/AP) जैसा रहता है।
  var RTRANSIT = false;
  function curT() { return (RTRANSIT && RESULT && RESULT.trTables) ? RESULT.trTables : RESULT; }
  var RST = null;
  var HI = { sun: 'सूर्य', moon: 'चंद्र', mars: 'मंगल', mercury: 'बुध', jupiter: 'गुरु', venus: 'शुक्र', saturn: 'शनि', rahu: 'राहु', ketu: 'केतु' };
  var SHORT = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' }; // राउंड 11: बड़े code (website जैसे)
  var RASHIS = ['मेष', 'वृष', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन'];
  var RASHIS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  var PLANET_EN = { sun: 'Sun', moon: 'Moon', mars: 'Mars', mercury: 'Mercury', jupiter: 'Jupiter', venus: 'Venus', saturn: 'Saturn', rahu: 'Rahu', ketu: 'Ketu' };
  function rashiName(i) { return LANG === 'en' ? (RASHIS_EN[i] || RASHIS[i]) : RASHIS[i]; }
  function planetName(k) { return LANG === 'en' ? (PLANET_EN[k] || k) : (HI[k] || k); }
  function genderName(g) { if (!g) return ''; return LANG === 'en' ? (g === 'स्त्री' ? 'Female' : 'Male') : g; }
  function recPlace(r) {
    if (LANG !== 'en') return r.place || r.placeEN || '';
    if (r.placeEN) return r.placeEN;
    for (var i = 0; i < PLACES.length; i++) if (PLACES[i].n === r.place) return PLACES[i].en;
    if (PLACE_EN[r.place]) return PLACE_EN[r.place];
    return r.place || '';
  }
  function recState(r) {
    if (LANG !== 'en') return r.state || r.stateEN || '';
    return r.stateEN || enOfHiP(STATES, r.state) || r.state || '';
  }
  var COLORS = { sun: '#1d4ed8', moon: '#1d4ed8', jupiter: '#1d4ed8', venus: '#1d4ed8', mars: '#15803d', mercury: '#15803d', saturn: '#c2410c', rahu: '#c2410c', ketu: '#db2777' };
  var BHAVA_TH = { 159: '1-5-9 में ग्रह||Planets in 1-5-9', 1579: '1-5-7-9 में ग्रह||Planets in 1-5-7-9', brsss: 'BRSSS चक्र||BRSSS Cycle', special: 'SPECIAL — स्वामी · बैठे ग्रह||SPECIAL — Lord · Sitting' };
  var PLANET_TH = { 1579: '1-5-7-9 संयोजन||1-5-7-9 Combination', 159: '1-5-9 संयोजन||1-5-9 Combination', special: 'SPECIAL — स्वामी · देता · तारा||SPECIAL — Lord · Gives · Star', prsss: 'PRSSS चक्र||PRSSS Cycle' };
  var DASHA_TH = { maha: 'महादशा||Mahadasha', bhukthi: 'भुक्ति||Bhukti', andhiram: 'अंतर||Antar' };

  function pad2(n) { n = String(n); return n.length < 2 ? '0' + n : n; }
  function fmtDeg(d) { var g = Math.floor(d), m = Math.round((d - g) * 60); if (m === 60) { g++; m = 0; } return pad2(g) + '.' + pad2(m); }
  function fmtISO(iso) { if (!iso) return '—'; var p = String(iso).split('-'); return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : iso; }
  function ageFrom(ds) { var m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(ds || ''); if (!m) return ''; var b = new Date(+m[3], +m[2] - 1, +m[1]); var n = new Date(); var a = n.getFullYear() - b.getFullYear(); var mm = n.getMonth() - b.getMonth(); if (mm < 0 || (mm === 0 && n.getDate() < b.getDate())) a--; return a; }
  function chainText(ch) { if (ch == null) return '—'; if (Array.isArray(ch)) return ch.join(' · '); if (typeof ch === 'object') { try { return Object.keys(ch).map(function (k) { var v = ch[k]; return Array.isArray(v) ? v.join(' · ') : String(v); }).join(' · '); } catch (e) { return '—'; } } return String(ch); }
  function entTd(e, idx, map) {
    if (!e) return '<td class="entc"></td>';
    var cls = idx === 0 ? 'b' : ((e.type === 'planet' && e.key === 'saturn') ? 'g' : (e.percent >= 20 ? 'g' : 'o'));
    var txt;
    if (e.type === 'aspect') {
      var lbl = String(e.label || '');
      var m = /^([A-Z]+)(\d+)$/.exec(lbl);
      txt = (m ? m[1] + '<span class="drishti-digit">' + m[2] + '</span>' : esc(lbl)) + ' · ' + Math.round(e.percent);
    } else {
      txt = (map ? tCode(e.key, map) : pCode(e.key)) + ' · ' + Math.round(e.percent);
    }
    var pl = (e.type === 'planet' && e.key) ? ' data-pl="' + e.key + '"' : '';
    return '<td class="entc ce' + cls + '"' + pl + '>' + txt + '</td>';
  }
  function pCode(k) {
    var np = null;
    RESULT.bnn.planets.forEach(function (p) { if (p.key === k) np = p; });
    return (SHORT[k] || k) + (((np && np.retro) && k !== 'rahu' && k !== 'ketu') ? '#' : '');
  }
  // राउंड 64 / भाग B: जिन तालिकाओं के सदस्य गोचर-ग्रह हैं, वहाँ '#' गोचर-वक्री से लगे।
  function trRetro() {
    var m = {};
    if (RESULT && RESULT.transit && RESULT.transit.planets) {
      RESULT.transit.planets.forEach(function (p) { m[p.key] = !!p.retro; });
    }
    return m;
  }
  function tCode(k, map) {
    var r = (map || trRetro())[k];
    return (SHORT[k] || k) + ((r && k !== 'rahu' && k !== 'ketu') ? '#' : '');
  }
  function codeFor(k, useTr, map) { return useTr ? tCode(k, map) : pCode(k); }
  // प्रिंट/PDF हमेशा NATAL — इसलिए वहाँ यही (जन्म का कोड + जन्म का अंक) लगता है,
  // गोचर मोड चालू हो तब भी (भाग E)।
  function pLabNat(k) {
    var s = pCode(k);
    var lb = RESULT && RESULT.labels && RESULT.labels[RMODE];
    if (lb && lb[k] != null) s += '-' + lb[k];
    return s;
  }
  // प्रिंट में ग्रह SPECIAL की पंक्ति-नाम हमेशा NATAL वाला (भाग E) — तीन हिस्सों वाला
  function pSpecLabNat(k) {
    var sp = RESULT && RESULT.tables.special && RESULT.tables.special[RMODE];
    var sits = (sp && sp.rows && sp.rows[k]) ? sp.rows[k].sitsAt : null;
    var s = pCode(k);
    if (sits != null) s += '-' + sits;
    var lb = RESULT && RESULT.labels && RESULT.labels[RMODE];
    if (lb && lb[k] != null) s += '-' + lb[k];
    return s;
  }
  // भाग B (राउंड 64): पंक्ति का नाम = कोड + '#' + '-' + भाव-बिंदु अंक (website जैसा)।
  // पुराना engine (labels नहीं) हो तो बिना अंक के, पहले जैसा।
  function pCodeFor(k) {
    if (RTRANSIT && RESULT && RESULT.transit) {
      // गोचर मोड: कोड + '#' गोचर-वक्री से (राहु-केतु पर '#' नहीं)
      var tp = null;
      RESULT.transit.planets.forEach(function (p) { if (p.key === k) tp = p; });
      return (SHORT[k] || k) + ((tp && tp.retro && k !== 'rahu' && k !== 'ketu') ? '#' : '');
    }
    return pCode(k);
  }
  function pLab(k) {
    var s = pCodeFor(k);
    var src = curT();
    var lb = src && src.labels && src.labels[RMODE];
    if (lb && lb[k] != null) s += '-' + lb[k];
    return s;
  }
  // ग्रह SPECIAL की पंक्ति: कोड + '#' + '-' + बैठा भाव + '-' + भाव-बिंदु अंक (सर: JUP#-3-15)
  function pSpecLab(k) {
    var T = curT();
    var sp = T && T.tables && T.tables.special && T.tables.special[RMODE];
    var sits = (sp && sp.rows && sp.rows[k]) ? sp.rows[k].sitsAt : null;
    var s = pCodeFor(k);
    if (sits != null) s += '-' + sits;
    var lb = T && T.labels && T.labels[RMODE];
    if (lb && lb[k] != null) s += '-' + lb[k];
    return s;
  }
  // सर के software में LORD / फलदाता (Director) और STAR कॉलम बिना '#' है
  function pNoHash(k) { return SHORT[k] || k; }
  function setTabs(id, val) { var el = $(id); if (!el) return; var t = el.querySelectorAll('.tab'); for (var i = 0; i < t.length; i++) { t[i].classList.toggle('on', t[i].dataset.t === val); } }
  function showView(which) {
    document.querySelector('.shell').hidden = (which !== 'form');
    $('viewResult').hidden = (which !== 'result');
    // कुंडली खुलते ही page ऊपर-से (पूरी view) दिखे — user request 2026-10-16
    if (which === 'result') { try { window.scrollTo(0, 0); } catch (e) {} }
  }
  function setModeTabs() {
    $('tabAp').classList.toggle('on', RMODE === 'AP');
    $('tabBp').classList.toggle('on', RMODE === 'BP');
    if ($('tabTr')) { $('tabTr').classList.toggle('on', RTRANSIT); $('tabTr').classList.toggle('blink', RTRANSIT); }
    if ($('btnTransitMode')) $('btnTransitMode').classList.toggle('on', RTRANSIT);
    if ($('rKindA')) $('rKindA').textContent = RTRANSIT ? 'TRANSIT' : 'NATAL';
    if ($('rKindB')) $('rKindB').textContent = RTRANSIT ? 'TRANSIT' : 'NATAL';
  }
  // चरण 4.3: गोचर-चार्ट मोड चालू/बंद — बंद होते ही सब NATAL पर लौटता है
  function setTransitMode(on) {
    if (!RESULT) return;
    on = !!on;
    if (RTRANSIT === on) return;
    RTRANSIT = on;
    setModeTabs();
    if (RTRANSIT) {
      var w = parseWallInput($('gocharTime').value);
      if (w) computeTransitAt(w, { keepField: true });
      else if (RESULT.trTables) { renderBhava(); renderPlanet(); }
    } else {
      renderBhava(); renderPlanet();
    }
  }

  function renderParivartan() {
    var box = $('rParivartan');
    // परिवर्तन हो → ग्रह + धड़कता रंग; न हो → ख़ाली घेरा (hide नहीं, कोई color-बदलाव नहीं)
    box.hidden = false;
    if (!RESULT.exchanges.length) { box.textContent = ''; box.classList.add('nopulse'); return; }
    box.classList.remove('nopulse');
    var t = RESULT.exchanges.map(function (p) { return planetName(p[0]) + ' ⇄ ' + planetName(p[1]); }).join('  ·  ');
    box.textContent = '🔁 ' + t;
  }
  // ---------- राउंड 37 (user 19-10-2026): ग्रह पर mouse → उसके फल-भावों तक उसी रंग की पतली तीर-रेखाएँ ----------
  var HOV_NS = 'http://www.w3.org/2000/svg';
  function hovClear() {
    var box = $('rChart'); if (!box) return;
    var o = box.querySelector('svg.hovln'); if (o && o.parentNode) o.parentNode.removeChild(o);
    var hot = box.querySelectorAll('.bhhot');
    for (var i = 0; i < hot.length; i++) hot[i].classList.remove('bhhot');
  }
  function hovHouses(key) {          // SPECIAL तालिका वाला ही नियम: जहाँ बैठा + जिनका फल देता
    var sp = RESULT && RESULT.tables && RESULT.tables.special && RESULT.tables.special[RMODE];
    var row = sp && sp.rows ? sp.rows[key] : null;
    if (!row) return [];
    var out = [];
    if (row.sitsAt != null) out.push(+row.sitsAt);
    (row.gives || []).forEach(function (h) { h = +h; if (isFinite(h) && out.indexOf(h) < 0) out.push(h); });
    return out;
  }
  // सुधार-राउंड 45: box हमेशा तीर की उलटी दिशा में — तीर/भाव-अंक न ढके
  function tipSide(el, key) {
    var box = $('rChart');
    if (!box || !el.closest || !el.closest('#rChart')) return 'left';
    var hs = hovHouses(key); if (!hs.length) return 'left';
    var sx = 0, sy = 0, n = 0;
    var labels = box.querySelectorAll('[data-bh]');
    for (var i = 0; i < labels.length; i++) {
      var h = +labels[i].getAttribute('data-bh');
      if (hs.indexOf(h) < 0) continue;
      var r = labels[i].getBoundingClientRect();
      sx += r.left + r.width / 2; sy += r.top + r.height / 2; n++;
    }
    if (!n) return 'left';
    var er = el.getBoundingClientRect();
    var dx = (sx / n) - (er.left + er.width / 2), dy = (sy / n) - (er.top + er.height / 2);
    if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'right' : 'left';
    return dy < 0 ? 'down' : 'up';
  }
  function hovShow(plEl) {
    var box = $('rChart'); if (!box) return;
    var key = plEl.getAttribute('data-pl');
    var hs = hovHouses(key); if (!hs.length) return;
    var svg = box.querySelector('svg'); if (!svg) return;
    var br = box.getBoundingClientRect(), sr = svg.getBoundingClientRect();
    var col = COLORS[key] || '#334155';
    var ov = document.createElementNS(HOV_NS, 'svg');
    ov.setAttribute('class', 'hovln');
    ov.setAttribute('width', Math.round(sr.width)); ov.setAttribute('height', Math.round(sr.height));
    ov.style.left = (sr.left - br.left) + 'px'; ov.style.top = (sr.top - br.top) + 'px';
    var defs = document.createElementNS(HOV_NS, 'defs');
    var mk = document.createElementNS(HOV_NS, 'marker');
    mk.setAttribute('id', 'hovArr'); mk.setAttribute('viewBox', '0 0 10 10');
    mk.setAttribute('refX', '9'); mk.setAttribute('refY', '5');
    mk.setAttribute('markerWidth', '7'); mk.setAttribute('markerHeight', '7'); mk.setAttribute('orient', 'auto');
    var mp = document.createElementNS(HOV_NS, 'path');
    mp.setAttribute('d', 'M0,0 L10,5 L0,10 Z'); mp.setAttribute('fill', col);
    mk.appendChild(mp); defs.appendChild(mk); ov.appendChild(defs);
    var sRect = plEl.getBoundingClientRect();
    var sx = sRect.left - sr.left + sRect.width / 2, sy = sRect.top - sr.top + sRect.height / 2;

    var labels = box.querySelectorAll('[data-bh]'), drawn = 0;
    for (var i = 0; i < labels.length; i++) {
      var el = labels[i], h = +el.getAttribute('data-bh');
      if (hs.indexOf(h) < 0) continue;
      var tr = el.getBoundingClientRect();
      if (String(h) === String(plEl.getAttribute('data-house'))) {   // जिस भाव में बैठा है — उस पर रंगीन घेरा
        var rg = document.createElementNS(HOV_NS, 'rect');
        rg.setAttribute('x', (tr.left - sr.left - 3).toFixed(1)); rg.setAttribute('y', (tr.top - sr.top - 2).toFixed(1));
        rg.setAttribute('width', (tr.width + 6).toFixed(1)); rg.setAttribute('height', (tr.height + 4).toFixed(1));
        rg.setAttribute('rx', '4'); rg.setAttribute('fill', 'none');
        rg.setAttribute('stroke', col); rg.setAttribute('stroke-width', '1.6');
        ov.appendChild(rg); el.classList.add('bhhot'); drawn++;
        continue;
      }
      var tx = tr.left - sr.left + tr.width / 2, ty = tr.top - sr.top + tr.height / 2;
      var dx = tx - sx, dy = ty - sy, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / len, uy = dy / len;
      // ग्रह-अक्षरों के बाहर से शुरू, भाव-अंक के बाहर तीर ख़त्म (अक्षर न ढके)
      var t1 = Math.min(sRect.width / 2 / (Math.abs(ux) || 1e-6), sRect.height / 2 / (Math.abs(uy) || 1e-6)) + 4;
      var t2 = Math.min(tr.width / 2 / (Math.abs(ux) || 1e-6), tr.height / 2 / (Math.abs(uy) || 1e-6)) + 2;
      if (t1 + t2 + 6 > len) { t1 = len * 0.35; t2 = len * 0.35; }          // बहुत पास → बीच से
      var x1 = sx + ux * t1, y1 = sy + uy * t1;
      var x2 = tx - ux * t2, y2 = ty - uy * t2;
      var ln = document.createElementNS(HOV_NS, 'line');
      ln.setAttribute('x1', x1.toFixed(1)); ln.setAttribute('y1', y1.toFixed(1));
      ln.setAttribute('x2', x2.toFixed(1)); ln.setAttribute('y2', y2.toFixed(1));
      ln.setAttribute('stroke', col); ln.setAttribute('stroke-width', '1.8');
      ln.setAttribute('stroke-linecap', 'round');
      if (len > 34) ln.setAttribute('marker-end', 'url(#hovArr)');
      ov.appendChild(ln);
      el.classList.add('bhhot');
      drawn++;
    }
    if (drawn) box.appendChild(ov);
  }
  function hovWire() {
    var box = $('rChart'); if (!box || box.__hv) return; box.__hv = 1;
    box.addEventListener('mouseover', function (e) {
      var t = (e.target && e.target.closest) ? e.target.closest('[data-pl]') : null;
      if (!t) return;
      if (box.__cur === t) return;
      box.__cur = t; hovClear(); hovShow(t);
    });
    box.addEventListener('mouseout', function (e) {
      var t = (e.target && e.target.closest) ? e.target.closest('[data-pl]') : null;
      if (!t) return;
      var to = e.relatedTarget;
      if (to && to.closest && to.closest('[data-pl]') === t) return;
      box.__cur = null; hovClear();
    });
  }
  // ---------- राउंड 39 (user 19-10-2026): ग्रह पर mouse → नक्षत्र · बैठक · lordship का सुंदर box ----------
  function plHouse(p) {
    var asc = RESULT && RESULT.bnn ? RESULT.bnn.ascendant.rashi : 0;
    return ((p.rashi - asc + 12) % 12) + 1;
  }
  function plInfo(key) {
    if (!RESULT || !RESULT.bnn) return null;
    var p = null;
    (RESULT.bnn.planets || []).forEach(function (x) { if (x.key === key) p = x; });
    if (!p) return null;
    var sp = RESULT.tables.special[RMODE] || {};
    var row = (sp.rows && sp.rows[key]) || {};
    var nk = p.nakshatra || (Math.floor(p.longitude / (360 / 27)) + 1);
    var pd = p.pada || (Math.floor((p.longitude % (360 / 27)) / (360 / 108)) + 1);
    return { p: p, row: row, nk: nk, pd: pd };
  }
  function plTipEl() {
    var t = document.getElementById('plTip');
    if (!t) { t = document.createElement('div'); t.id = 'plTip'; document.body.appendChild(t); }
    return t;
  }
  function showPlTip(el, key, cx, cy) {
    var inf = plInfo(key); if (!inf) return;
    var r = inf.row, col = COLORS[key] || '#334155';
    var slKey = r.starLord ? String(r.starLord).replace(/[^a-z]/gi, '') : '';
    var sl = slKey ? pCode(slKey) : '';
    var st = (r.starAt != null && r.starAt !== '') ? pad2(r.starAt) : '';
    var sg = (r.starGives || []).map(function (h) { return String(h); }).join(',');
    var inner = '';
    if (sl) {
      inner = '<b style="color:' + (COLORS[slKey] || '#334155') + '">' + sl + '</b>';
      if (st) inner += ' - ' + st;
      if (sg) inner += ' - ' + sg;
    } else { inner = '—'; }
    var t = plTipEl();
    t.innerHTML = '<span class="pt-min" style="border-left-color:' + col + '">' + inner + '</span>';
    t.classList.add('on');
    document.__plSide = tipSide(el, key);
    plTipPlace(cx, cy);
  }
  function bhTipEl() {
    var t = document.getElementById('bhTip');
    if (!t) { t = document.createElement('div'); t.id = 'bhTip'; document.body.appendChild(t); }
    return t;
  }
  function showBhTip(el, n) {
    var sp = RESULT && RESULT.tables && RESULT.tables.special && RESULT.tables.special[RMODE];
    var lord = sp && sp.directors ? sp.directors[n] : null;
    if (!lord) return;
    // साथ में उसी ग्रह का "sits → gives" (PLANET COMBINATION — SPECIAL से)
    var prow = (sp.rows && sp.rows[lord]) || {};
    var sits = (prow.sitsAt != null && prow.sitsAt !== '') ? pad2(prow.sitsAt) : '—';
    var gives = (prow.gives && prow.gives.length) ? prow.gives.join(',') : '—';
    var t = bhTipEl();
    t.innerHTML = '<span class="bdot"></span><span>' + pCode(lord) + '</span>'
      + '<span class="bsep"></span><span class="bx">' + sits + ' → ' + gives + '</span>';
    t.classList.add('on');
    var r = el.getBoundingClientRect(), tw = t.offsetWidth, th = t.offsetHeight;
    var left = r.left - tw - 12;
    if (left < 8) left = r.right + 12;
    var top = r.top + r.height / 2 - th / 2;
    top = Math.max(8, Math.min(top, window.innerHeight - th - 8));
    t.style.left = Math.round(left) + 'px';
    t.style.top = Math.round(top) + 'px';
  }
  function hideBhTip() { var t = document.getElementById('bhTip'); if (t) t.classList.remove('on'); }
  function plTipPlace(cx, cy) {
    var t = document.getElementById('plTip');
    if (!t || !t.classList.contains('on')) return;
    var tw = t.offsetWidth, th = t.offsetHeight;
    var left, top, el = document.__plEl;
    if (el && el.getBoundingClientRect) {
      var r = el.getBoundingClientRect(), side = document.__plSide || 'left';
      if (side === 'right') { left = r.right + 12; top = r.top + r.height / 2 - th / 2; }
      else if (side === 'up') { left = r.left + r.width / 2 - tw / 2; top = r.top - th - 10; }
      else if (side === 'down') { left = r.left + r.width / 2 - tw / 2; top = r.bottom + 10; }
      else { left = r.left - tw - 12; top = r.top + r.height / 2 - th / 2; }
      if (left < 8) left = r.right + 12;
      if (left + tw > window.innerWidth - 8) left = Math.max(8, r.left - tw - 12);
    } else {
      left = cx + 18; top = cy - th - 10;
      if (left + tw > window.innerWidth - 8) left = cx - tw - 18;
    }
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - th - 8));
    t.style.left = Math.round(left) + 'px';
    t.style.top = Math.round(top) + 'px';
  }
  function hidePlTip() { var t = document.getElementById('plTip'); if (t) t.classList.remove('on'); }
  function plTipWire() {
    if (document.__plTip) return; document.__plTip = 1;
    document.addEventListener('mouseover', function (e) {
      var bh = (e.target && e.target.closest) ? e.target.closest('[data-lord]') : null;
      if (bh && RESULT) { hidePlTip(); showBhTip(bh, +bh.getAttribute('data-lord')); return; }
      hideBhTip();
      var t = (e.target && e.target.closest) ? e.target.closest('[data-pl]') : null;
      if (!t || !RESULT) return;
      document.__plEl = t;
      if (document.__plKey === t.getAttribute('data-pl') && plTipEl().classList.contains('on')) { plTipPlace(e.clientX, e.clientY); return; }
      document.__plKey = t.getAttribute('data-pl');
      showPlTip(t, t.getAttribute('data-pl'), e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', function (e) {
      var t = (e.target && e.target.closest) ? e.target.closest('[data-pl]') : null;
      if (!t) return;
      plTipPlace(e.clientX, e.clientY);
    });
    document.addEventListener('mouseout', function (e) {
      var bh = (e.target && e.target.closest) ? e.target.closest('[data-lord]') : null;
      if (bh && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[data-lord]'))) hideBhTip();
      var t = (e.target && e.target.closest) ? e.target.closest('[data-pl]') : null;
      if (!t) return;
      var to = e.relatedTarget;
      if (to && to.closest && to.closest('[data-pl]')) return;
      hidePlTip();
    });
    document.addEventListener('scroll', function () { hidePlTip(); hideBhTip(); }, true);
    window.addEventListener('resize', hidePlTip);
  }
  function renderChart() {
    $('rChart').innerHTML = (RCHART === 'north') ? northSvgString() : southSvgString();
    hovClear(); hovWire(); plTipWire();
  }
  var WEEKDAYS_EN = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  var WEEKDAYS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  var NAK_HI = ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती'];
  var NAK_EN = ['ASHWINI', 'BHARANI', 'KRITTIKA', 'ROHINI', 'MRIGASHIRA', 'ARDRA', 'PUNARVASU', 'PUSHYA', 'ASHLESHA', 'MAGHA', 'PURVA PHALGUNI', 'UTTARA PHALGUNI', 'HASTA', 'CHITRA', 'SWATI', 'VISHAKHA', 'ANURADHA', 'JYESHTHA', 'MOOLA', 'PURVASHADHA', 'UTTARASHADHA', 'SHRAVANA', 'DHANISHTA', 'SHATABHISHA', 'PURVA BHADRAPADA', 'UTTARA BHADRAPADA', 'REVATI'];
  var TITHI_HI = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा', 'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'अमावस्या'];
  var TITHI_EN = ['PRATIPADA', 'DWITIYA', 'TRITIYA', 'CHATURTHI', 'PANCHAMI', 'SHASHTHI', 'SAPTAMI', 'ASHTAMI', 'NAVAMI', 'DASHAMI', 'EKADASHI', 'DWADASHI', 'TRAYODASHI', 'CHATURDASHI', 'PURNIMA', 'PRATIPADA', 'DWITIYA', 'TRITIYA', 'CHATURTHI', 'PANCHAMI', 'SHASHTHI', 'SAPTAMI', 'ASHTAMI', 'NAVAMI', 'DASHAMI', 'EKADASHI', 'DWADASHI', 'TRAYODASHI', 'CHATURDASHI', 'AMAVASYA'];
  var YOGA_HI = ['विष्कुम्भ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन', 'अतिगण्ड', 'सुकर्मा', 'धृति', 'शूल', 'गण्ड', 'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र', 'सिद्धि', 'व्यतिपात', 'वरीयान', 'परिघ', 'शिव', 'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल', 'ब्रह्म', 'इन्द्र', 'वैधृति'];
  var YOGA_EN = ['VISHKAMBHA', 'PRITI', 'AYUSHMAN', 'SAUBHAGYA', 'SHOBHANA', 'ATIGANDA', 'SUKARMAN', 'DHRITI', 'SHULA', 'GANDA', 'VRIDDHI', 'DHRUVA', 'VYAGHATA', 'HARSHANA', 'VAJRA', 'SIDDHI', 'VYATIPATA', 'VARIYANA', 'PARIGHA', 'SHIVA', 'SIDDHA', 'SADHYA', 'SHUBHA', 'SHUKLA', 'BRAHMA', 'INDRA', 'VAIDHRITI'];
  function ageYMDOf(ds) {
    var m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(ds || ''); if (!m) return null;
    var b = new Date(+m[3], +m[2] - 1, +m[1]), n = new Date();
    var y = n.getFullYear() - b.getFullYear(), mo = n.getMonth() - b.getMonth(), dd = n.getDate() - b.getDate();
    if (dd < 0) { mo--; dd += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); }
    if (mo < 0) { y--; mo += 12; }
    return { y: y, m: mo, d: dd };
  }
  function splitLong(t, max) {
    if (t.length <= max) return [t];
    var cut = t.lastIndexOf(' ', Math.ceil(max * 0.75));
    if (cut <= 0) cut = t.indexOf(' ', Math.ceil(max * 0.5));
    if (cut <= 0) return [t];
    return [t.slice(0, cut), t.slice(cut + 1)];
  }
  function chartPanelData() {
    var rec = RESULT_REC, b = RESULT.bnn, out = [], i;
    if (rec.name) { var nm = splitLong(rec.name, 20); for (i = 0; i < nm.length; i++) out.push({ t: nm[i], size: 12.5, w: 700 }); }
    var pl = recPlace(rec) + (recState(rec) ? ', ' + recState(rec) : '');
    if (pl) { var pcs = splitLong(pl, 22); for (i = 0; i < pcs.length; i++) out.push({ t: pcs[i], size: 11.5, w: 600 }); }
    var mm = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(rec.date || '');
    var wd = '';
    if (mm) { var wi = new Date(+mm[3], +mm[2] - 1, +mm[1]).getDay(); wd = ' ' + (LANG === 'en' ? WEEKDAYS_EN[wi] : WEEKDAYS_HI[wi]); }
    out.push({ t: rec.date + ' - ' + rec.time + wd, size: 11, w: 600 });
    var age = ageYMDOf(rec.date);
    if (age) out.push({ t: L('आयु: ', 'AGE : ') + age.y + 'Y-' + age.m + 'M-' + age.d + 'D ' + (rec.gender === 'स्त्री' ? L('स्त्री', 'FEMALE') : L('पुरुष', 'MALE')), size: 11, w: 600 });
    var moon = null;
    b.planets.forEach(function (p) { if (p.key === 'moon') moon = p; });
    if (moon) {
      var nk = moon.nakshatra || (Math.floor(moon.longitude / (360 / 27)) + 1);
      var pd = moon.pada || (Math.floor((moon.longitude % (360 / 27)) / (360 / 108)) + 1);
      var nkName = (LANG === 'en' ? NAK_EN : NAK_HI)[nk - 1] || '';
      if (nkName) out.push({ t: nkName + ' - ' + pd, size: 11, w: 600 });
    }
    if (b.tithiIndex && b.tithiIndex >= 1) {
      var ti = b.tithiIndex - 1;
      var pak = ti < 15 ? L('शुक्ल', 'SHUKLA') : L('कृष्ण', 'KRISHNA');
      var tn = (LANG === 'en' ? TITHI_EN : TITHI_HI)[ti] || '';
      if (tn) out.push({ t: pak + ' - ' + tn, size: 11, w: 600 });
    }
    if (b.yogaIndex && b.yogaIndex >= 1) {
      var yn = (LANG === 'en' ? YOGA_EN : YOGA_HI)[b.yogaIndex - 1] || '';
      if (yn) out.push({ t: yn + L(' योग', ' YOGA'), size: 11, w: 600 });
    }
    var d = RESULT.dasha;
    var mi = d.running && d.running.mahaIndex;
    if (mi != null && d.mahadashas[mi] && d.mahadashas[mi].lord) {
      var mr = d.mahadashas[mi];
      out.push({ t: planetName(mr.lord) + L(' दशा: ', ' DHASA: ') + fmtISO(mr.startISO) + ' → ' + fmtISO(mr.endISO), size: 9.4, w: 600 });
    }
    var bhs = (d.running && d.running.bhukthis) || [];
    var bi = d.running && d.running.bhukthiIndex;
    if (bi != null && bhs[bi] && bhs[bi].lord) {
      var br = bhs[bi];
      out.push({ t: planetName(br.lord) + L(' भुक्ति: ', ' BHUKTI: ') + fmtISO(br.startISO) + ' → ' + fmtISO(br.endISO), size: 9.4, w: 600 });
    }
    return out;
  }
  function panelLinesTxt(cx, cy, s, lines) {
    var h = 0, i;
    for (i = 0; i < lines.length; i++) h += lines[i].size * s * 1.3;
    var y = cy - h / 2, out = '';
    for (i = 0; i < lines.length; i++) {
      var sz = lines[i].size * s;
      y += sz * 1.3;
      out += '<text x="' + cx + '" y="' + (y - sz * 0.3).toFixed(1) + '" font-size="' + sz.toFixed(1) + '" font-weight="' + (lines[i].w || 600) + '" text-anchor="middle" fill="#3a2410">' + esc(lines[i].t) + '</text>';
    }
    return out;
  }

  // सुधार-राउंड 10: भाव-केंद्र website (render.js N_CENTERS) जैसे — भाव 1 ऊपर-मध्य, फिर विपरीत दिशा।
  var NC = [[0.5, 0.25], [0.25, 0.12], [0.12, 0.25], [0.25, 0.5], [0.12, 0.75], [0.25, 0.88], [0.5, 0.75], [0.75, 0.88], [0.88, 0.75], [0.75, 0.5], [0.88, 0.25], [0.75, 0.12]];
  // चार्ट-वर्ग (3..337) के भाव-बहुभुज; बीच का केंद्र-पैनल (88..252) अलग बाधा है।
  var N_POLY = {
    1: [[170, 3], [253.5, 86.5], [170, 170], [86.5, 86.5]],
    2: [[3, 3], [170, 3], [86.5, 86.5]],
    3: [[3, 3], [86.5, 86.5], [3, 170]],
    4: [[3, 170], [86.5, 86.5], [170, 170], [86.5, 253.5]],
    5: [[3, 170], [86.5, 253.5], [3, 337]],
    6: [[86.5, 253.5], [170, 337], [3, 337]],
    7: [[86.5, 253.5], [170, 170], [253.5, 253.5], [170, 337]],
    8: [[253.5, 253.5], [170, 337], [337, 337]],
    9: [[337, 337], [337, 170], [253.5, 253.5]],
    10: [[337, 170], [253.5, 86.5], [170, 170], [253.5, 253.5]],
    11: [[337, 170], [253.5, 86.5], [337, 3]],
    12: [[337, 3], [253.5, 86.5], [170, 3]]
  };
  function nInPoly(x, y, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function nSegDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    var t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    var qx = ax + t * dx - px, qy = ay + t * dy - py;
    return Math.sqrt(qx * qx + qy * qy);
  }
  function nPolyClear(x, y, poly) {
    var d = 1e9;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) d = Math.min(d, nSegDist(x, y, poly[j][0], poly[j][1], poly[i][0], poly[i][1]));
    return nInPoly(x, y, poly) ? d : -d;
  }
  // अंदाज़ी text-block (चौड़ाई प्रति अक्षर ≈ 0.58 × size) — भाव-सीमा और केंद्र-पैनल,
  // दोनों में से जो कम बची वही अंक (बाहर निकले तो ऋणात्मक)।
  function nBlockClear(house, lines, size, sp, cx, cy) {
    var w = 0;
    lines.forEach(function (L) { w = Math.max(w, L.t.length * size * 0.58); });
    var h = lines.length * sp, x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    var poly = N_POLY[house], m = 1e9;
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [cx, y0], [cx, y1], [x0, cy], [x1, cy]].forEach(function (p) {
      m = Math.min(m, nPolyClear(p[0], p[1], poly));
    });
    var ox = Math.min(x1, 252) - Math.max(x0, 88), oy = Math.min(y1, 252) - Math.max(y0, 88);
    var pd;
    if (ox > 0 && oy > 0) { pd = -Math.min(ox, oy); }
    else {
      var dxp = Math.max(88 - x1, x0 - 252, 0), dyp = Math.max(88 - y1, y0 - 252, 0);
      pd = Math.sqrt(dxp * dxp + dyp * dyp);
    }
    return Math.min(m, pd);
  }
  // नामी जगह ठीक (≥2.5) हो तो वहीं; वरना 2.0 का लक्ष्य पाने वाली सबसे नज़दीकी जगह; कहीं न मिले तो सबसे बेहतर।
  function nFit(house, lines, size, sp, cx0, cy0) {
    var best = { cx: cx0, cy: cy0, s: nBlockClear(house, lines, size, sp, cx0, cy0), d: 0 };
    if (best.s >= 2.5) return { cx: cx0, cy: cy0 };
    var pick = null;
    for (var dx = -40; dx <= 40; dx += 2) for (var dy = -40; dy <= 40; dy += 2) {
      if (!dx && !dy) continue;
      var s = nBlockClear(house, lines, size, sp, cx0 + dx, cy0 + dy);
      var d = Math.abs(dx) + Math.abs(dy);
      if (s >= 2.0 && (!pick || d < pick.d)) pick = { cx: cx0 + dx, cy: cy0 + dy, s: s, d: d };
      if (s > best.s + 0.01) best = { cx: cx0 + dx, cy: cy0 + dy, s: s, d: d };
    }
    return pick ? { cx: pick.cx, cy: pick.cy } : { cx: best.cx, cy: best.cy };
  }

  function northSvgString() {
    var b = RESULT.bnn, asc = b.ascendant.rashi;
    var byH = {};
    b.planets.forEach(function (p) { var h = ((p.rashi - asc + 12) % 12) + 1; (byH[h] = byH[h] || []).push(p); });
    var T = '';
    for (var h = 1; h <= 12; h++) {
      var lines = [];
      var cp = b.cusps[h - 1];
      // सुधार-राउंड 38 (user 19-10-2026): उत्तर चार्ट में भाव-अंक की जगह राशि-अंक
      // (दक्षिण चार्ट में भाव जगह बदलते हैं, उत्तर में राशियाँ — इसलिए यहाँ राशि सही पहचान है)
      if (cp) lines.push({ t: pad2(((asc + h - 1) % 12) + 1) + ' ' + fmtDeg(cp.degInSign), c: '#c62828', w: 700, bh: h });
      // सुधार-राउंड 44 (user 19-10-2026): उत्तर चार्ट में ASC पंक्ति नहीं — राशि+डिग्री पहले से है
      (byH[h] || []).forEach(function (p) { lines.push({ t: (SHORT[p.key] || p.short) + ((p.retro && p.key !== 'rahu' && p.key !== 'ketu') ? '#' : '') + ' ' + fmtDeg(p.degInSign), c: COLORS[p.key] || '#334155', w: 600, pl: p.key }); });
      if (!lines.length) continue;
      var big = lines.length >= 5, size = big ? 11 : 12;
      var sp = big ? 13.2 : 14.4;
      if (big && (h === 1 || h === 7)) sp = 11.2; // चोटी/तल का कोना पतला — पंक्ति भाव के भीतर रहे
      var cx = 3 + NC[h - 1][0] * 334, cy = 3 + NC[h - 1][1] * 334;
      var fit = nFit(h, lines, size, sp, cx, cy);
      cx = fit.cx; cy = fit.cy;
      var y0 = cy - (lines.length * sp) / 2;
      T += '<g class="house" data-house="' + h + '" font-size="12" text-anchor="middle">';
      lines.forEach(function (L, i) {
        var at = (L.pl ? ' class="pl" data-pl="' + L.pl + '" data-house="' + h + '"' : (L.bh ? ' class="bhx" data-bh="' + L.bh + '" data-house="' + h + '"' : ''));
        T += '<text x="' + cx.toFixed(1) + '" y="' + (y0 + (i + 1) * sp - size * 0.3).toFixed(1) + '"' + (big ? ' font-size="11"' : '') + ' font-weight="' + L.w + '" fill="' + L.c + '"' + at + '>' + L.t + '</text>';
      });
      T += '</g>';
    }
    var tg = northTransitLines(asc).map(function (L) { return '<text x="' + L.x + '" y="' + L.y + '" font-size="11" font-weight="600" text-anchor="' + L.anchor + '" fill="' + L.c + '">' + L.t + '</text>'; }).join('');
    var panelTxt = panelLinesTxt(170, 170, 1, chartPanelData());
    return '<svg class="nchart" xmlns="http://www.w3.org/2000/svg" viewBox="-72 -72 484 484" width="560" height="560"><g font-family="sans-serif">' + tg + '<rect x="3" y="3" width="334" height="334" fill="#fffdf7" stroke="#c9a24a" stroke-width="1.6"/><line x1="3" y1="3" x2="337" y2="337" stroke="#c9a24a" stroke-width="1.2"/><line x1="337" y1="3" x2="3" y2="337" stroke="#c9a24a" stroke-width="1.2"/><polygon points="170,3 337,170 170,337 3,170" fill="none" stroke="#c9a24a" stroke-width="1.2"/><rect x="88" y="88" width="164" height="164" rx="10" fill="#fffdf3" stroke="#e3d2a6"/>' + panelTxt + T + '</g></svg>';
  }
  function southSvgString() {
    var b = RESULT.bnn, asc = b.ascendant.rashi;
    var byR = {};
    b.planets.forEach(function (p) { (byR[p.rashi] = byR[p.rashi] || []).push(p); });
    var cuspByR = {};
    b.cusps.forEach(function (c) { (cuspByR[c.rashi] = cuspByR[c.rashi] || []).push(c); });
    var grid = [[11, 0, 1, 2], [10, -1, -1, 3], [9, -1, -1, 4], [8, 7, 6, 5]];
    var cell = 135, s = '';
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
      var ri = grid[r][c], x = c * cell, y = r * cell;
      if (ri === -1) continue;
      var isAsc = (ri === asc);
      s += '<rect x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" fill="' + (isAsc ? '#fff7e6' : '#fffdf7') + '" stroke="#c9a24a" stroke-width="1"/>';
      // राउंड 47: लग्न-खाने के ऊपरी-दाएँ कोने पर दो छोटे निशान (पारंपरिक/website जैसा)
      if (isAsc) { [22, 30].forEach(function (d) { s += '<line x1="' + (x + cell - d) + '" y1="' + y + '" x2="' + (x + cell) + '" y2="' + (y + d) + '" stroke="#b45309" stroke-width="2"/>'; }); }
      var lines = [], hno = ((ri - asc + 12) % 12) + 1;
      // राउंड 47: लग्न-खाने में '01 12.53' नहीं (ASC वही बात कहता है)
      (cuspByR[ri] || []).forEach(function (cp) { if (cp.n === 1) return; lines.push({ t: pad2(cp.n) + ' ' + fmtDeg(cp.degInSign), c: '#c62828', w: 700, bh: cp.n }); });
      if (isAsc) lines.push({ t: 'ASC ' + fmtDeg(b.ascendant.degInSign), c: '#1e3a8a', w: 700, bh: 1 });
      (byR[ri] || []).forEach(function (p) { lines.push({ t: (SHORT[p.key] || p.short) + ((p.retro && p.key !== 'rahu' && p.key !== 'ketu') ? '#' : '') + ' ' + fmtDeg(p.degInSign), c: COLORS[p.key] || '#334155', w: 600, pl: p.key }); });
      lines.forEach(function (ln, i) {
        var at = (ln.pl ? ' class="pl" data-pl="' + ln.pl + '" data-house="' + hno + '"' : (ln.bh ? ' class="bhx" data-bh="' + ln.bh + '" data-house="' + hno + '"' : ''));
        s += '<text x="' + (x + 8) + '" y="' + (y + 21 + i * 19.5) + '" font-size="16.5" font-weight="' + ln.w + '" fill="' + ln.c + '"' + at + '>' + ln.t + '</text>';
      });
    }
    s += '<rect x="135" y="135" width="270" height="270" fill="#fffdf3" stroke="#e3d2a6"/>';
    s += panelLinesTxt(270, 270, 1.3, chartPanelData());
    var tg = southTransitLines(asc).map(function (L) { return '<text x="' + L.x + '" y="' + L.y + '" font-size="16" font-weight="600" text-anchor="' + L.anchor + '" fill="' + L.c + '">' + L.t + '</text>'; }).join('');
    return '<svg class="nchart" xmlns="http://www.w3.org/2000/svg" viewBox="-132 -72 804 736" width="804" height="736"><g font-family="sans-serif">' + tg + s + '</g></svg>';
  }
  function renderBhava() {
    var T = curT();
    var bc = T.tables.bhava[RMODE], sp = T.tables.special[RMODE];
    var i, n, html = '';
    if (RBHAVA_TAB === '159' || RBHAVA_TAB === '1579') {
      var key = RBHAVA_TAB === '159' ? 'list159' : 'list1579';
      var max = 0;
      for (n = 1; n <= 12; n++) { var ln = (bc[String(n)][key] || []).length; if (ln > max) max = ln; }
      var TM = RTRANSIT ? trRetro() : null;   // भाग B: भाव-पंक्तियों के सदस्य गोचर-ग्रह हैं
      for (n = 1; n <= 12; n++) {
        var list = bc[String(n)][key] || [];
        html += '<tr><td class="rlab" data-lord="' + n + '">B' + pad2(n) + '</td>';
        for (i = 0; i < max; i++) html += entTd(list[i], i, TM);
        html += '</tr>';
      }
      $('rBhava').innerHTML = '<table class="coltbl">' + html + '</table>';
      return;
    }
    if (RBHAVA_TAB === 'brsss') {
      var maxB = 0;
      for (n = 1; n <= 12; n++) { var lb0 = (T.brsss && T.brsss[n - 1]) || []; if (lb0.length > maxB) maxB = lb0.length; }
      for (n = 1; n <= 12; n++) {
        var lb = (T.brsss && T.brsss[n - 1]) || [];
        html += '<tr><td class="rlab" data-lord="' + n + '">B' + pad2(n) + '</td>';
        for (i = 0; i < maxB; i++) html += '<td class="entc"' + (lb[i] ? ' data-pl="' + lb[i] + '"' : '') + '>' + (lb[i] ? esc(SHORT[lb[i]] || lb[i]) : '') + '</td>';
        html += '</tr>';
      }
      $('rBhava').innerHTML = '<table class="coltbl">' + html + '</table>';
      return;
    }
    var TM2 = RTRANSIT ? trRetro() : null;   // भाग B: SPECIAL के सदस्य गोचर-ग्रह हैं
    html += '<tr><th></th><th>' + L('स्वामी', 'LORD') + '</th><th>' + L('बैठे ग्रह (A)', 'PLANETS(A)') + '</th><th>' + L('तारा (A) में', 'IN STAR OF A') + '</th><th>' + L('फलदाता', 'LORDSHIP') + '</th></tr>';
    for (n = 1; n <= 12; n++) {
      var inb = (sp.inBhava[n] || []).map(function (x) { return codeFor(x.key, RTRANSIT, TM2); }).join(', ') || '—';
      var instar = (sp.inStarOf[n] || []).map(function (k) { return codeFor(k, RTRANSIT, TM2); }).join(', ') || '—';
      html += '<tr><td class="rlab" data-lord="' + n + '">B' + pad2(n) + '</td><td class="entc plbtn" data-pl="' + sp.lords[n] + '">' + pNoHash(sp.lords[n]) + '</td><td class="entc">' + inb + '</td><td class="entc">' + instar + '</td><td class="entc">' + pNoHash(sp.directors[n]) + '</td></tr>';
    }
    $('rBhava').innerHTML = '<table class="coltbl">' + html + '</table>';
  }
  function renderPlanet() {
    var T = curT();
    var pc = T.tables.planet[RMODE], sp = T.tables.special[RMODE];
    var astro = (T.astro && T.astro[RMODE]) || {};
    var i, html = '';
    if (RPLANET_TAB === '1579' || RPLANET_TAB === '159') {
      var key = RPLANET_TAB === '1579' ? 'list1579' : 'list159';
      var max = 0;
      RESULT.order.forEach(function (k) { var ln = ((pc[k] || {})[key] || []).length; if (ln > max) max = ln; });
      var cols = Math.max(7, max);
      RESULT.order.forEach(function (k) {
        var list = (pc[k] || {})[key] || [];
        html += '<tr><td class="rlab plbtn" data-pl="' + k + '">' + pLab(k) + '</td>';
        for (i = 0; i < cols; i++) html += entTd(list[i], i);
        var partner = astro[k];
        html += '<td class="entc cep">' + (partner ? esc(codeFor(partner, RTRANSIT)) : '—') + '</td>';
        html += '</tr>';
      });
      $('rPlanet').innerHTML = '<table class="coltbl">' + html + '</table>';
      return;
    }
    if (RPLANET_TAB === 'special') {
      html += '<tr><th></th><th>' + L('स्वामी', 'LORD') + '</th><th>' + L('बैठा → देता', 'sits → gives') + '</th><th>' + L('तारा', 'STAR') + '</th><th>' + L('फलदाता', 'LORDSHIP') + '</th></tr>';
      RESULT.order.forEach(function (k) {
        var r = sp.rows[k] || {};
        var owns = (r.owns && r.owns.length) ? r.owns.join(',') : '—';
        var gives = (r.gives && r.gives.length) ? r.gives.join(',') : '—';
        var sits = (r.sitsAt != null) ? pad2(r.sitsAt) + ' → ' + gives : gives;
        var star = r.starLord ? pNoHash(r.starLord) + ' - ' + r.starAt : '—';
        var sg = (r.starGives && r.starGives.length) ? r.starGives.join(',') : '—';
        html += '<tr><td class="rlab plbtn" data-pl="' + k + '">' + pSpecLab(k) + '</td><td class="entc">' + owns + '</td><td class="entc">' + sits + '</td><td class="entc">' + star + '</td><td class="entc">' + sg + '</td></tr>';
      });
      $('rPlanet').innerHTML = '<table class="coltbl">' + html + '</table>';
      return;
    }
    var maxP = 0;
    RESULT.order.forEach(function (k) { var ln = (T.prsss[k] || []).length; if (ln > maxP) maxP = ln; });
    RESULT.order.forEach(function (k) {
      var lb = T.prsss[k] || [];
      html += '<tr><td class="rlab plbtn" data-pl="' + k + '">' + pLab(k) + '</td>';
      for (i = 0; i < maxP; i++) html += '<td class="entc"' + (lb[i] ? ' data-pl="' + lb[i] + '"' : '') + '>' + (lb[i] ? esc(codeFor(lb[i], RTRANSIT)) : '') + '</td>';
      html += '</tr>';
    });
    $('rPlanet').innerHTML = '<table class="coltbl">' + html + '</table>';
  }
  var RDASHA_MI = null, RDASHA_BI = null, DASHA_ROW_CLICK = null;
  // सुधार-राउंड 11: दशा/भुक्ति/अंतर manually चुनकर देखना — किसी भी पंक्ति पर क्लिक = अंदर खुलना।
  function renderDasha() {
    var d = RESULT.dasha;
    var runMI = d.running.mahaIndex, runBI = d.running.bhukthiIndex, runAI = d.running.andhiramIndex;
    var selMI = (RDASHA_MI != null) ? RDASHA_MI : runMI;
    var selBI = (RDASHA_BI != null) ? RDASHA_BI : runBI;
    var mahaRow = (selMI != null && selMI >= 0 && d.mahadashas[selMI]) ? d.mahadashas[selMI] : null;
    var bhRow = (mahaRow && mahaRow.bhukthis && selBI != null && selBI >= 0 && mahaRow.bhukthis[selBI]) ? mahaRow.bhukthis[selBI] : null;
    var list = [], hi = -1, sel = -1, note = '';
    DASHA_ROW_CLICK = null;
    if (RDASHA_TAB === 'maha') {
      list = d.mahadashas; hi = runMI; sel = (RDASHA_MI != null) ? RDASHA_MI : -1;
      note = L('किसी दशा-पंक्ति पर क्लिक करें — उसकी भुक्तियाँ खुलेंगी।', 'Click a dasha row — its bhuktis will open.');
      DASHA_ROW_CLICK = function (i) { RDASHA_MI = i; RDASHA_BI = null; RDASHA_TAB = 'bhukthi'; setTabs('rDashaTabs', RDASHA_TAB); renderDasha(); };
    } else if (RDASHA_TAB === 'bhukthi') {
      list = (mahaRow && mahaRow.bhukthis) || []; hi = (selMI === runMI) ? runBI : -1; sel = (RDASHA_BI != null) ? RDASHA_BI : -1;
      note = (mahaRow ? planetName(mahaRow.lord) + L(' महादशा — किसी भुक्ति पर क्लिक करें, उसके अंतर खुलेंगे।', ' mahadasha — click a bhukti to open its andhirams.') : '');
      DASHA_ROW_CLICK = function (i) { if (!list[i] || list[i].blank) return; RDASHA_BI = i; RDASHA_TAB = 'andhiram'; setTabs('rDashaTabs', RDASHA_TAB); renderDasha(); };
    } else {
      list = (bhRow && bhRow.andhirams) || []; hi = (selMI === runMI && selBI === runBI) ? runAI : -1;
      note = (mahaRow && bhRow) ? (planetName(mahaRow.lord) + ' → ' + planetName(bhRow.lord) + L(' भुक्ति — सभी अंतर', ' bhukti — all andhirams')) : '';
    }
    var path = '<div class="dnote">' + esc(note);
    if (RDASHA_MI != null || RDASHA_BI != null) path += '<button class="btn small" id="dashRunBtn">' + L('↺ चल रही पर लौटें', '↺ Back to current') + '</button>';
    path += '</div>';
    if (!list.length) { $('rDasha').innerHTML = path + '<div class="note" style="margin:4px 2px">' + L('इस चयन की भुक्ति/अंतर उपलब्ध नहीं।', 'Bhukti/Antar not available for this selection.') + '</div>'; return; }
    var head = '<tr><th>' + T(DASHA_TH[RDASHA_TAB]) + '</th><th>' + L('अंत तिथि', 'End Date') + '</th><th>' + L('आयु', 'Age') + '</th></tr>';
    function partRows(from, to) {
      var rows = '';
      for (var i = from; i < to; i++) {
        var r = list[i];
        var lord = r.blank ? '—' : planetName(r.lord);
        var cls = (i === hi) ? 'cur' : ((i === sel) ? 'sel' : '');
        if (DASHA_ROW_CLICK) cls = (cls ? cls + ' ' : '') + 'drow';
        rows += '<tr' + (cls ? ' class="' + cls + '"' : '') + ' data-i="' + i + '"><td>' + lord + '</td><td>' + fmtISO(r.endISO) + '</td><td>' + (r.age ? (r.age.y + 'Y-' + r.age.m + 'M-' + r.age.d + 'D') : '—') + '</td></tr>';
      }
      return rows;
    }
    var half = Math.ceil(list.length / 2);
    $('rDasha').innerHTML = path + '<div class="dcols one"><table>' + head + partRows(0, list.length) + '</table></div>';
  }
  function renderResult() {
    renderParivartan(); renderChart();
    $('rModeA').textContent = RMODE; $('rModeB').textContent = RMODE;
    renderBhava(); renderPlanet(); renderDasha();
    $('rTransitPlace').textContent = recPlace(RESULT_REC) + (recState(RESULT_REC) ? ', ' + recState(RESULT_REC) : '');
  }
  async function openResult(rec) {
    if (!window.BNNEngine) { toast(L('गणना इंजन लोड नहीं हुआ', 'Calculation engine not loaded')); return; }
    try {
      toast(L('⏳ गणना हो रही है…', '⏳ Calculating…'));
      var res = await window.BNNEngine.compute(rec);
      RESULT = res; RESULT_REC = rec; window.BNN_LAST = res;
      RTRANSIT = false; // चरण 4.3: नई कुंडली खुलने पर गोचर मोड बंद
      RMODE = (Number(ageFrom(rec.date)) >= 30) ? 'AP' : 'BP';
      RCHART = (SETTINGS.chartDefault === 'south') ? 'south' : 'north'; RBHAVA_TAB = '159'; RPLANET_TAB = '1579'; RDASHA_TAB = 'maha'; RDASHA_MI = null; RDASHA_BI = null;
      setTabs('rBhavaTabs', RBHAVA_TAB); setTabs('rPlanetTabs', RPLANET_TAB); setTabs('rDashaTabs', RDASHA_TAB);
      setModeTabs(); renderResult(); showView('result');
      RST = { group: 'sg', birth: 'sun', mode: '1579', result: null };
      setTabsAttr('rStGroups', 'g', RST.group); setTabsAttr('rStBirth', 'p', RST.birth); setTabsAttr('rStMode', 'm', RST.mode);
      syncStModeRow();
      var rng = stDateRange();
      $('stStart').value = isoToDMY(rng.s); $('stEnd').value = isoToDMY(rng.e);
      computeTransitAt(null);
      runSpecial();
      toast(L('✅ कुंडली तैयार — ', '✅ Kundli ready — ') + (rec.name || (L('संदर्भ ', 'Ref ') + rec.ref)));
    } catch (e) {
      console.error(e);
      toast(L('गणना नहीं हो सकी — ', 'Calculation failed — ') + e.message);
    }
  }

  // ---------- गोचर + स्पेशल ट्रांज़िट ----------
  function setTabsAttr(id, attr, val) { var el = $(id); if (!el) return; var t = el.querySelectorAll('.tab'); for (var i = 0; i < t.length; i++) { t[i].classList.toggle('on', t[i].dataset[attr] === val); } }
  function fmtWall(w) { return pad2(w.d) + '-' + pad2(w.m) + '-' + w.y + ' ' + pad2(w.h) + ':' + pad2(w.mi) + ':' + pad2(w.s); }
  function parseWallInput(s) { var m = /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(s || '').trim()); if (!m) return null; return { d: +m[1], m: +m[2], y: +m[3], h: +m[4], mi: +m[5], s: +(m[6] || 0) }; }
  function parseLocalVal(v) { var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(v || '')); if (!m) return null; return { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: +(m[6] || 0) }; }
  function localValStr(w) { return w.y + '-' + pad2(w.m) + '-' + pad2(w.d) + 'T' + pad2(w.h) + ':' + pad2(w.mi) + ':' + pad2(w.s); }
  function stDateRange() {
    var gmt = Number(RESULT_REC.gmt); if (!isFinite(gmt)) gmt = 5.5;
    var now = new Date(Date.now() + gmt * 3600 * 1000);
    var y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate();
    var e = new Date(Date.UTC(y, m + 24, d));
    return {
      s: y + '-' + pad2(m + 1) + '-' + pad2(d),
      e: e.getUTCFullYear() + '-' + pad2(e.getUTCMonth() + 1) + '-' + pad2(e.getUTCDate())
    };
  }
  function stYMD(s2) { var m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(s2 || '').trim()); if (!m) return null; return { y: +m[3], m: +m[2], d: +m[1] }; } // राउंड 12: dd-mm-yyyy
  function stDateMs(ms, clipped) {
    var gmt = Number(RESULT_REC.gmt); if (!isFinite(gmt)) gmt = 5.5;
    var t = ms + (clipped ? 0 : 12 * 3600 * 1000) + gmt * 3600 * 1000;
    var d = new Date(t);
    return pad2(d.getUTCDate()) + '-' + pad2(d.getUTCMonth() + 1) + '-' + d.getUTCFullYear();
  }
  async function computeTransitAt(when, opts) {
    if (!RESULT || !RESULT_REC) return;
    try {
      var t = await window.BNNEngine.transitNow(RESULT_REC, when);
      RESULT.transit = t.snapshot; RESULT.transitWall = t.wall;
      if (!(opts && opts.keepField)) { $('gocharTime').value = fmtWall(t.wall); $('gocharTime').dispatchEvent(new Event('dtsetgood')); } // राउंड 36: लिखते समय न छेड़ें · 64-ख: आख़िरी सही मान
      $('rGocharWhen').textContent = fmtWall(t.wall);
      renderChart();
      if (RTRANSIT) {
        // गोचर मोड: वही debounce — तालिकाएँ भी नई गोचर तिथि से बनें
        var tt = await window.BNNEngine.transitTables(RESULT_REC, t.wall);
        RESULT.trTables = tt;
        renderBhava(); renderPlanet();
      }
    } catch (e) { console.error(e); toast(L('गोचर नहीं हो सका: ', 'Transit failed: ') + e.message); }
  }
  async function runSpecial() {
    if (!RESULT || !RESULT_REC || !RST) return;
    var birth = null;
    RESULT.bnn.planets.forEach(function (p) { if (p.key === RST.birth) birth = p; });
    if (!birth) { toast(L('जन्म का ग्रह नहीं मिला', 'Birth planet not found')); return; }
    var s = stYMD($('stStart').value), e = stYMD($('stEnd').value);
    if (!s || !e) { toast(L('शुरू और अंत तारीख़ें भरें', 'Fill start and end dates')); return; }
    $('rStResults').innerHTML = '<div class="note" style="margin:4px 2px">' + L('⏳ गणना हो रही है…', '⏳ Calculating…') + '</div>';
    try {
      var nat = {}; (RESULT.bnn.planets || []).forEach(function (p) { nat[p.key] = p.longitude; });
      var st = await window.BNNEngine.specialTransit(RESULT_REC, { zSign: birth.rashi, zDeg: birth.degInSign, birthKey: RST.birth, group: RST.group, mode: RST.mode, startYMD: s, endYMD: e, natalLons: nat });
      RST.result = st;
      renderStResults();
    } catch (err) {
      console.error(err);
      $('rStResults').innerHTML = '<div class="note" style="margin:4px 2px">' + L('गणना नहीं हो सकी — ', 'Calculation failed — ') + esc(err.message) + '</div>';
    }
  }
  // सुधार-राउंड 13: पारंपरिक तालिका-शैली जैसा — सारे गोचर-ग्रहों की एक ही तालिका, तारीख़-क्रम में
  var ST_CODE = { sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP', venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET' };
  function stDateMsT(ms, clipped, preShifted) {
    var gmt = Number(RESULT_REC.gmt); if (!isFinite(gmt)) gmt = 5.5;
    var t = ms + ((clipped || preShifted) ? 0 : 12 * 3600 * 1000) + gmt * 3600 * 1000;
    var d = new Date(t);
    return pad2(d.getUTCDate()) + '-' + pad2(d.getUTCMonth() + 1) + '-' + d.getUTCFullYear() + ' ' + pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes());
  }
  function stAllRows() {
    var st = RST && RST.result; if (!st) return [];
    var lbl = ST_CODE[RST.birth] || RST.birth, rows = [];
    st.forEach(function (p) {
      (p.segments || []).forEach(function (seg) {
        var code = (RST.group === 'all') ? (lbl + '-' + pCode(p.key)) : (lbl + '-' + seg.k);
        rows.push({ ms: seg.startMs, dt: stDateMsT(seg.startMs, seg.clippedStart, seg.preShifted), asp: 's', dir: (seg.flags && seg.flags[0] === 'R') ? 'R' : 'F', code: code });
        rows.push({ ms: seg.endMs, dt: stDateMsT(seg.endMs, seg.clippedEnd, seg.preShifted), asp: 'e', dir: (seg.flags && seg.flags[1] === 'R') ? 'R' : 'F', code: code });
      });
    });
    rows.sort(function (a, b) { if (a.ms !== b.ms) return a.ms - b.ms; return a.asp === 'e' ? -1 : (b.asp === 'e' ? 1 : 0); });
    return rows;
  }
  function stTblRows(p) {
    var lbl = ST_CODE[RST.birth] || RST.birth, rows = [];
    (p.segments || []).forEach(function (seg) {
      rows.push({ ms: seg.startMs, dt: stDateMsT(seg.startMs, seg.clippedStart, seg.preShifted), asp: 's', dir: (seg.flags && seg.flags[0] === 'R') ? 'R' : 'F', code: lbl + '-' + seg.k });
      rows.push({ ms: seg.endMs, dt: stDateMsT(seg.endMs, seg.clippedEnd, seg.preShifted), asp: 'e', dir: (seg.flags && seg.flags[1] === 'R') ? 'R' : 'F', code: lbl + '-' + seg.k });
    });
    rows.sort(function (a, b) { if (a.ms !== b.ms) return a.ms - b.ms; return a.asp === 'e' ? -1 : (b.asp === 'e' ? 1 : 0); });
    return rows;
  }
  function renderStResults() {
    var box = $('rStResults');
    // राहु-केतु / शनि-गुरु (सुधार-राउंड 19): पारंपरिक शैली की तरह हर गोचर-ग्रह की अपनी तालिका, आजू-बाजू
    if (RST.group !== 'all') {
      var groups = (RST.result || []).filter(function (p) { return (p.segments || []).length; });
      if (!groups.length) { box.innerHTML = '<div class="note" style="margin:4px 2px">' + L('इस अवधि में कोई पंक्ति नहीं मिली।', 'No rows found in this period.') + '</div>'; return; }
      var ph = '<div class="stpair' + (groups.length === 2 ? ' two' : '') + '">';
      groups.forEach(function (p) {
        var fullName = { rahu: 'RAHU', ketu: 'KETU', jupiter: 'JUPITER', saturn: 'SATURN' }[p.key] || (ST_CODE[p.key] || p.key);
        ph += '<div class="stbox"><div class="sttitle">TRANSIT ' + fullName + ' (' + planetName(p.key) + ')</div>';
        ph += '<div class="stscroll"><table class="stt"><tr><th>' + L('ग्रह', 'PLANET') + '</th><th>' + L('तारीख़', 'DATE') + '</th><th>' + L('चरण', 'ASPECT') + '</th><th>' + L('वक्री', 'RETRO') + '</th></tr>';
        stTblRows(p).forEach(function (r) {
          ph += '<tr class="' + (r.asp === 's' ? 'pair-a' : 'pair-b') + '"><td class="stl2">' + esc(r.code) + '</td><td>' + r.dt + '</td><td>' + (r.asp === 's' ? L('शुरू', 'Start') : L('अंत', 'End')) + '</td><td>' + r.dir + '</td></tr>';
        });
        ph += '</table></div></div>';
      });
      ph += '</div>';
      box.innerHTML = ph;
      return;
    }
    var rows = stAllRows();
    if (!rows.length) { box.innerHTML = '<div class="note" style="margin:4px 2px">' + L('इस अवधि में कोई पंक्ति नहीं मिली।', 'No rows found in this period.') + '</div>'; return; }
    var html = '<div class="stbox"><div class="sttitle">' + L('ट्रांज़िट — जन्म-ग्रह: ', 'TRANSIT — birth: ') + esc(ST_CODE[RST.birth] || '') + ' (' + planetName(RST.birth) + ')</div>';
    html += '<div class="stscroll"><table class="stt"><tr><th>' + L('ग्रह', 'PLANET') + '</th><th>' + L('तारीख़', 'DATE') + '</th><th>' + L('चरण', 'ASPECT') + '</th><th>' + L('वक्री', 'RETRO') + '</th></tr>';
    rows.forEach(function (r) {
      html += '<tr class="' + (r.asp === 's' ? 'pair-a' : 'pair-b') + '"><td class="stl2">' + esc(r.code) + '</td><td>' + r.dt + '</td><td>' + (r.asp === 's' ? L('शुरू', 'Start') : L('अंत', 'End')) + '</td><td>' + r.dir + '</td></tr>';
    });
    html += '</table></div></div>';
    box.innerHTML = html;
  }
  function northTransitLines(asc) {
    if (!RESULT || !RESULT.transit) return [];
    var t = RESULT.transit;
    var pos = { 1: [170, 52], 2: [84, 52], 3: [46, 98], 4: [60, 170], 5: [46, 235], 6: [84, 292], 7: [170, 288], 8: [262, 292], 9: [292, 238], 10: [282, 160], 11: [292, 106], 12: [262, 48] };
    var by = {};
    t.planets.forEach(function (p) { (by[p.rashi] = by[p.rashi] || []).push(p); });
    (by[t.ascendant.rashi] = by[t.ascendant.rashi] || []).push({ key: 'asc', degInSign: t.ascendant.degInSign, retro: false, isAsc: true });
    var out = [];
    Object.keys(by).forEach(function (rs) {
      var grp = by[rs].slice().sort(function (a, b) { return a.degInSign - b.degInSign; });
      var xy = pos[((+rs - asc + 12) % 12) + 1];
      var side, u;
      if (xy[0] < 85) { side = 'left'; u = xy[1]; }
      else if (xy[0] > 255) { side = 'right'; u = xy[1]; }
      else { side = xy[1] < 95 ? 'top' : 'bottom'; u = xy[0]; }
      for (var i = 0; i < grp.length; i++) {
        var p = grp[i];
        var off = (i - (grp.length - 1) / 2) * 12.5;
        var x, y, anchor = 'middle';
        if (side === 'left') { x = -8; y = u + off; anchor = 'end'; }
        else if (side === 'right') { x = 348; y = u + off; anchor = 'start'; }
        else if (side === 'top') { x = u; y = -12 - (grp.length - 1 - i) * 12.5; }
        else { x = u; y = 352 + i * 12.5; }
        out.push({ t: (p.isAsc ? 'ASC' : (SHORT[p.key] || p.key)) + ((!p.isAsc && p.retro && p.key !== 'rahu' && p.key !== 'ketu') ? '#' : '') + ' ' + fmtDeg(p.degInSign), x: x, y: y, anchor: anchor, c: p.isAsc ? '#1565c0' : '#700000' });
      }
    });
    return out;
  }
  function southTransitLines(asc) {
    if (!RESULT || !RESULT.transit) return [];
    var t = RESULT.transit;
    var grid = [[11, 0, 1, 2], [10, -1, -1, 3], [9, -1, -1, 4], [8, 7, 6, 5]];
    var cellPos = {};
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) if (grid[r][c] !== -1) cellPos[grid[r][c]] = [c, r];
    var by = {};
    t.planets.forEach(function (p) { (by[p.rashi] = by[p.rashi] || []).push(p); });
    (by[t.ascendant.rashi] = by[t.ascendant.rashi] || []).push({ key: 'asc', degInSign: t.ascendant.degInSign, retro: false, isAsc: true });
    var out = [];
    Object.keys(by).forEach(function (rs) {
      var cr = cellPos[+rs]; if (!cr) return;
      var grp = by[rs].slice().sort(function (a, b) { return a.degInSign - b.degInSign; });
      var side = cr[0] === 0 ? 'left' : cr[0] === 3 ? 'right' : (cr[1] === 0 ? 'top' : 'bottom');
      var u = (side === 'left' || side === 'right') ? (cr[1] + 0.5) * 135 : (cr[0] + 0.5) * 135;
      for (var i = 0; i < grp.length; i++) {
        var p = grp[i];
        var off = (i - (grp.length - 1) / 2) * 17;
        var x, y, anchor = 'middle';
        if (side === 'left') { x = -12; y = u + off; anchor = 'end'; }
        else if (side === 'right') { x = 552; y = u + off; anchor = 'start'; }
        else if (side === 'top') { x = u; y = -18 - (grp.length - 1 - i) * 17; }
        else { x = u; y = 556 + i * 17; }
        out.push({ t: (p.isAsc ? 'ASC' : (SHORT[p.key] || p.key)) + ((!p.isAsc && p.retro && p.key !== 'rahu' && p.key !== 'ketu') ? '#' : '') + ' ' + fmtDeg(p.degInSign), x: x, y: y, anchor: anchor, c: p.isAsc ? '#1565c0' : '#700000' });
      }
    });
    return out;
  }

  // ---------- प्रिंट / PDF + ऑल चार्ट PNG (चरण 5) ----------
  function todayStamp() {
    var d = new Date();
    return pad2(d.getDate()) + '-' + pad2(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function comboPlain(e) {
    if (e.type === 'aspect') return (e.label || '') + ' ' + Math.round(e.percent);
    return (SHORT[e.key] || e.key) + (e.natalRetro ? '#' : '') + ' ' + Math.round(e.percent);
  }
  function bhavaCellText(bn, mode, tab) {
    mode = mode || RMODE; tab = tab || RBHAVA_TAB;
    var bc = RESULT.tables.bhava[mode], sp = RESULT.tables.special[mode];
    if (tab === '159') return (bc[String(bn)].list159 || []).map(comboPlain).join(' · ');
    if (tab === '1579') return (bc[String(bn)].list1579 || []).map(comboPlain).join(' · ');
    if (tab === 'special') {
      var lord = planetName(sp.lords[bn]);
      var inb = (sp.inBhava[bn] || []).map(function (x) { return (SHORT[x.key] || x.key) + (x.natalRetro ? '#' : ''); }).join(' ');
      return L('स्वामी: ', 'Lord: ') + lord + L(' · बैठे: ', ' · Sitting: ') + (inb || '—');
    }
    return chainText(RESULT.brsss && RESULT.brsss[bn - 1]);
  }
  function bhavaRowsPlain() {
    var rows = [];
    for (var bn = 1; bn <= 12; bn++) rows.push(['B' + pad2(bn), bhavaCellText(bn) || '—']);
    return rows;
  }
  function planetCellText(key, mode, tab) {
    mode = mode || RMODE; tab = tab || RPLANET_TAB;
    var pc = RESULT.tables.planet[mode], sp = RESULT.tables.special[mode];
    if (tab === '1579') return ((pc[key] || {}).list1579 || []).map(comboPlain).join(' · ');
    if (tab === '159') return ((pc[key] || {}).list159 || []).map(comboPlain).join(' · ');
    if (tab === 'special') {
      var s = sp.rows[key] || {};
      return L('स्वामी: ', 'Lord: ') + ((s.owns && s.owns.length) ? s.owns.join('-') : '—') + L(' · देता: ', ' · Gives: ') + ((s.gives && s.gives.length) ? s.gives.join('-') : '—') + L(' · तारा: ', ' · Star: ') + (s.starLord ? (SHORT[s.starLord] || s.starLord) + '@' + s.starAt : '—');
    }
    return chainText(RESULT.prsss[key]);
  }
  function planetRowsPlain() {
    var rows = [];
    RESULT.order.forEach(function (key) {
      var np = null;
      RESULT.bnn.planets.forEach(function (p) { if (p.key === key) np = p; });
      rows.push([(SHORT[key] || key) + ((np && np.retro) ? '#' : ''), planetCellText(key) || '—']);
    });
    return rows;
  }
  function drawSimpleTable(ctx, x, y, w, title, headers, rows, widths) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8a6a2f'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText(title, x, y);
    ctx.strokeStyle = '#e8cfa6'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.lineTo(x + w, y + 7); ctx.stroke();
    y += 24;
    var rowH = 26;
    var topY = y;
    ctx.fillStyle = '#f7f1e5'; ctx.fillRect(x, y, w, rowH);
    ctx.fillStyle = '#7a5a22'; ctx.font = 'bold 13px sans-serif';
    var cx = x + 6;
    for (var i = 0; i < headers.length; i++) { ctx.fillText(headers[i], cx, y + 18); cx += widths[i]; }
    y += rowH;
    for (var r = 0; r < rows.length; r++) {
      if (r % 2 === 1) { ctx.fillStyle = '#fffdf8'; ctx.fillRect(x, y, w, rowH); }
      ctx.fillStyle = '#222'; ctx.font = '13px sans-serif';
      cx = x + 6;
      for (var c = 0; c < rows[r].length; c++) {
        ctx.fillText(String(rows[r][c] == null ? '' : rows[r][c]), cx, y + 18, Math.max(20, widths[c] - 10));
        cx += widths[c];
      }
      y += rowH;
    }
    ctx.strokeStyle = '#e2d5ba'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, topY + 0.5, w - 1, (y - topY) - 1);
    return y + 16;
  }
  function pEnt(e, idx) {
    if (!e) return null;
    var cls = idx === 0 ? 'ceb' : ((e.type === 'planet' && e.key === 'saturn') ? 'ceg' : (e.percent >= 20 ? 'ceg' : 'ceo'));
    var t = e.type === 'aspect' ? (e.label || '') + ' · ' + Math.round(e.percent)
          : (SHORT[e.key] || e.key) + ((e.natalRetro && e.key !== 'rahu' && e.key !== 'ketu') ? '#' : '') + ' · ' + Math.round(e.percent);
    return { t: t, c: cls };
  }
  function printBhavaBlock(mode, tab) {
    mode = mode || RMODE; tab = tab || RBHAVA_TAB;
    var bc = RESULT.tables.bhava[mode];
    var n, i, html = '';
    if (tab === 'brsss') {
      var maxB = 0;
      for (n = 1; n <= 12; n++) { var lb0 = (RESULT.brsss && RESULT.brsss[n - 1]) || []; if (lb0.length > maxB) maxB = lb0.length; }
      for (n = 1; n <= 12; n++) {
        var lb = (RESULT.brsss && RESULT.brsss[n - 1]) || [];
        html += '<tr><td class="rlab" data-lord="' + n + '">B' + pad2(n) + '</td>';
        for (i = 0; i < maxB; i++) html += '<td class="entc"' + (lb[i] ? ' data-pl="' + lb[i] + '"' : '') + '>' + (lb[i] ? esc(SHORT[lb[i]] || lb[i]) : '') + '</td>';
        html += '</tr>';
      }
      return '<div class="pBlock"><div class="pTitle">BHAVA COMBINATION — NATAL — BRSSS</div><table class="pcols">' + html + '</table></div>';
    }
    var key = tab === '1579' ? 'list1579' : 'list159';
    var max = 0;
    for (n = 1; n <= 12; n++) { var l = (bc[String(n)][key] || []).length; if (l > max) max = l; }
    var ms = mode + ' · ' + (mode === 'AP' ? L('परिवर्तन के बाद', 'After Parivartan') : L('परिवर्तन से पहले', 'Before Parivartan'));
    for (n = 1; n <= 12; n++) {
      html += '<tr><td class="rlab" data-lord="' + n + '">B' + pad2(n) + '</td>';
      var list = bc[String(n)][key] || [];
      for (i = 0; i < max; i++) { var e = pEnt(list[i], i); html += '<td class="entc ' + (e ? e.c : '') + '">' + (e ? esc(e.t) : '') + '</td>'; }
      html += '</tr>';
    }
    return '<div class="pBlock"><div class="pTitle">' + L('भाव Combination', 'BHAVA Combination') + ' — NATAL — ' + ms + '</div><table class="pcols">' + html + '</table></div>';
  }
  function printPlanetBlock(mode, tab) {
    mode = mode || RMODE; tab = tab || RPLANET_TAB;
    var pc = RESULT.tables.planet[mode];
    var n, i, html = '';
    if (tab === 'prsss') {
      var maxP = 0;
      RESULT.order.forEach(function (k) { var l = (RESULT.prsss[k] || []).length; if (l > maxP) maxP = l; });
      RESULT.order.forEach(function (k) {
        var lb = RESULT.prsss[k] || [];
        html += '<tr><td class="rlab">' + esc(pLabNat(k)) + '</td>';
        for (i = 0; i < maxP; i++) html += '<td class="entc"' + (lb[i] ? ' data-pl="' + lb[i] + '"' : '') + '>' + (lb[i] ? esc(SHORT[lb[i]] || lb[i]) : '') + '</td>';
        html += '</tr>';
      });
      return '<div class="pBlock"><div class="pTitle">PLANET COMBINATION — NATAL — PRSSS</div><table class="pcols">' + html + '</table></div>';
    }
    var key = tab === '159' ? 'list159' : 'list1579';
    var max = 0;
    RESULT.order.forEach(function (k) { var l = ((pc[k] || {})[key] || []).length; if (l > max) max = l; });
    var astro = (RESULT.astro && RESULT.astro[mode]) || {};
    var cols = Math.max(7, max);
    var ms = mode + ' · ' + (mode === 'AP' ? L('परिवर्तन के बाद', 'After Parivartan') : L('परिवर्तन से पहले', 'Before Parivartan'));
    RESULT.order.forEach(function (k) {
      var list = (pc[k] || {})[key] || [];
      html += '<tr><td class="rlab">' + esc(pLabNat(k)) + '</td>';
      for (i = 0; i < cols; i++) { var e = pEnt(list[i], i); html += '<td class="entc ' + (e ? e.c : '') + '">' + (e ? esc(e.t) : '') + '</td>'; }
      var partner = astro[k];
      html += '<td class="entc cep">' + (partner ? esc(SHORT[partner] || partner) : '') + '</td>';
      html += '</tr>';
    });
    return '<div class="pBlock"><div class="pTitle">' + L('ग्रह Combination', 'PLANET Combination') + ' — NATAL — ' + ms + '</div><table class="pcols">' + html + '</table></div>';
  }
  function printBhavaSpecial(mode) {
    mode = mode || RMODE;
    var sp = RESULT.tables.special[mode];
    var html = '<tr><th></th><th>' + L('स्वामी', 'LORD') + '</th><th>' + L('बैठे ग्रह (A)', 'PLANETS(A)') + '</th><th>' + L('तारा (A) में', 'IN STAR OF A') + '</th><th>' + L('फलदाता', 'LORDSHIP') + '</th></tr>';
    for (var n = 1; n <= 12; n++) {
      var inb = (sp.inBhava[n] || []).map(function (x) { return pCode(x.key); }).join(', ') || '—';
      var instar = (sp.inStarOf[n] || []).map(function (k) { return pCode(k); }).join(', ') || '—';
      html += '<tr><td class="rlab" data-lord="' + n + '">B' + pad2(n) + '</td><td class="entc plbtn" data-pl="' + sp.lords[n] + '">' + pNoHash(sp.lords[n]) + '</td><td class="entc">' + inb + '</td><td class="entc">' + instar + '</td><td class="entc">' + pNoHash(sp.directors[n]) + '</td></tr>';
    }
    return '<div class="pBlock"><div class="pTitle">BHAVA COMBINATION — NATAL — SPECIAL — ' + mode + '</div><table>' + html + '</table></div>';
  }
  function printPlanetSpecial(mode) {
    mode = mode || RMODE;
    var sp = RESULT.tables.special[mode];
    var html = '<tr><th></th><th>' + L('स्वामी', 'LORD') + '</th><th>' + L('बैठा → देता', 'sits → gives') + '</th><th>' + L('तारा', 'STAR') + '</th><th>' + L('फलदाता', 'LORDSHIP') + '</th></tr>';
    RESULT.order.forEach(function (k) {
      var r = sp.rows[k] || {};
      var owns = (r.owns && r.owns.length) ? r.owns.join(',') : '—';
      var gives = (r.gives && r.gives.length) ? r.gives.join(',') : '—';
      var sits = (r.sitsAt != null) ? pad2(r.sitsAt) + ' → ' + gives : gives;
      var star = r.starLord ? pNoHash(r.starLord) + ' - ' + r.starAt : '—';
      var sg = (r.starGives && r.starGives.length) ? r.starGives.join(',') : '—';
      html += '<tr><td class="rlab plbtn" data-pl="' + k + '">' + pSpecLabNat(k) + '</td><td class="entc">' + owns + '</td><td class="entc">' + sits + '</td><td class="entc">' + star + '</td><td class="entc">' + sg + '</td></tr>';
    });
    return '<div class="pBlock"><div class="pTitle">PLANET COMBINATION — NATAL — SPECIAL — ' + mode + '</div><table>' + html + '</table></div>';
  }
  function printDashaBlock(only) {
    var d = RESULT.dasha;
    var rows = '';
    d.mahadashas.forEach(function (r, i) {
      rows += '<tr' + (i === d.running.mahaIndex ? ' class="cur"' : '') + '><td>' + planetName(r.lord) + '</td><td>' + fmtISO(r.endISO) + '</td><td>' + (r.age ? (r.age.y + 'Y-' + r.age.m + 'M-' + r.age.d + 'D') : '—') + '</td></tr>';
    });
    var html = (only === 'bhukthi' || only === 'andhiram') ? '' : '<div class="pBlock"><div class="pTitle">' + L('VIMSHOTTARI — DHASA (चल रही: पीली पंक्ति)', 'VIMSHOTTARI — DHASA (current: yellow row)') + '</div><table><tr><th>' + L('महादशा', 'Mahadasha') + '</th><th>' + L('अंत तिथि', 'End Date') + '</th><th>' + L('आयु', 'Age') + '</th></tr>' + rows + '</table></div>';
    if ((only !== 'dhasa' && only !== 'andhiram') && d.running.bhukthis && d.running.bhukthis.length) {
      var rows2 = '';
      d.running.bhukthis.forEach(function (r, i) {
        rows2 += '<tr' + (i === d.running.bhukthiIndex ? ' class="cur"' : '') + '><td>' + (r.blank ? '—' : planetName(r.lord)) + '</td><td>' + fmtISO(r.endISO) + '</td><td>' + (r.age ? (r.age.y + 'Y-' + r.age.m + 'M-' + r.age.d + 'D') : '—') + '</td></tr>';
      });
      html += '<div class="pBlock"><div class="pTitle">' + L('BHUKTHI (चल रही महादशा की)', 'BHUKTHI (of current mahadasha)') + '</div><table><tr><th>' + L('भुक्ति', 'Bhukti') + '</th><th>' + L('अंत तिथि', 'End Date') + '</th><th>' + L('आयु', 'Age') + '</th></tr>' + rows2 + '</table></div>';
    }
    if ((only !== 'dhasa' && only !== 'bhukthi') && d.running.andhirams && d.running.andhirams.length) {
      var rows3 = '';
      d.running.andhirams.forEach(function (r, i) {
        rows3 += '<tr' + (i === d.running.andhiramIndex ? ' class="cur"' : '') + '><td>' + (r.blank ? '—' : planetName(r.lord)) + '</td><td>' + fmtISO(r.endISO) + '</td><td>' + (r.age ? (r.age.y + 'Y-' + r.age.m + 'M-' + r.age.d + 'D') : '—') + '</td></tr>';
      });
      html += '<div class="pBlock"><div class="pTitle">' + L('ANDHIRAM (चल रही भुक्ति का)', 'ANDHIRAM (of current bhukti)') + '</div><table><tr><th>' + L('अंतर', 'Andhiram') + '</th><th>' + L('अंत तिथि', 'End Date') + '</th><th>' + L('आयु', 'Age') + '</th></tr>' + rows3 + '</table></div>';
    }
    return html;
  }
  function printSpecialTransitBlock() {
    var rowsAll = stAllRows();
    if (!rowsAll.length) return '';
    var rows = '';
    rowsAll.forEach(function (r) {
      rows += '<tr><td>' + esc(r.code) + '</td><td>' + r.dt + '</td><td>' + (r.asp === 's' ? L('शुरू', 'Start') : L('अंत', 'End')) + '</td><td>' + r.dir + '</td></tr>';
    });
    return '<div class="pBlock"><div class="pTitle">' + L('स्पेशल ट्रांज़िट — ', 'Special Transit — ') + planetName(RST.birth) + ' · ' + RST.mode + '</div><table><tr><th>' + L('ग्रह', 'PLANET') + '</th><th>' + L('तारीख़', 'DATE') + '</th><th>' + L('चरण', 'ASPECT') + '</th><th>' + L('वक्री', 'RETRO') + '</th></tr>' + rows + '</table></div>';
  }
  function printRunBox() {
    var d = RESULT.dasha, lines = [];
    var mi = d.running && d.running.mahaIndex;
    if (mi != null && d.mahadashas[mi] && d.mahadashas[mi].lord) lines.push(planetName(d.mahadashas[mi].lord) + L(' दशा: ', ' DHASA: ') + fmtISO(d.mahadashas[mi].startISO) + ' → ' + fmtISO(d.mahadashas[mi].endISO));
    var bhs = (d.running && d.running.bhukthis) || [];
    var bi = d.running && d.running.bhukthiIndex;
    if (bi != null && bhs[bi] && bhs[bi].lord) lines.push(planetName(bhs[bi].lord) + L(' भुक्ति: ', ' BHUKTHI: ') + fmtISO(bhs[bi].startISO) + ' → ' + fmtISO(bhs[bi].endISO));
    var ahs = (d.running && d.running.andhirams) || [];
    var ai = d.running && d.running.andhiramIndex;
    if (ai != null && ahs[ai] && ahs[ai].lord) lines.push(planetName(ahs[ai].lord) + L(' अंतर: ', ' ANDHIRAM: ') + fmtISO(ahs[ai].startISO) + ' → ' + fmtISO(ahs[ai].endISO));
    if (!lines.length) return '';
    var h = '<div class="pRunBox"><div class="pRunTitle">' + L('चल रही दशा / RUNNING', 'चल रही दशा / RUNNING') + '</div>';
    lines.forEach(function (t) { h += '<div class="pRunLine">' + esc(t) + '</div>'; });
    return h + '</div>';
  }
  function buildPrintSheet() {
    var sheet = $('printSheet');
    if (!sheet) { sheet = document.createElement('div'); sheet.id = 'printSheet'; document.body.appendChild(sheet); }
    var rec = RESULT_REC, b = RESULT.bnn, a = SETTINGS.astro;
    var age = ageFrom(rec.date);
    var meta = L('संदर्भ क्रमांक: ', 'Ref No.: ') + rec.ref + L(' · नाम: ', ' · Name: ') + esc(rec.name || '—') + ' · ' + esc(genderName(rec.gender)) + (age !== '' ? L(' · आयु ', ' · Age ') + age + L(' वर्ष', ' yrs') : '') + '<br>'
      + L('जन्म: ', 'Birth: ') + esc(rec.date) + ' ' + esc(rec.time) + L(' · स्थान: ', ' · Place: ') + esc(recPlace(rec)) + (recState(rec) ? ', ' + esc(recState(rec)) : '') + L(' · लग्न: ', ' · Lagna: ') + rashiName(b.ascendant.rashi)
;   // user 2026-10-20: page-1 par dasha/bhukti nahi
    var isSouth = (typeof RCHART !== 'undefined' && RCHART === 'south');
    var chartSvg = isSouth ? southSvgString() : northSvgString();
    var cap = isSouth ? L('दक्षिण भारतीय चार्ट (गोचर सहित)', 'South Indian Chart (with transit)') : L('उत्तर भारतीय चार्ट (गोचर सहित)', 'North Indian Chart (with transit)');
    var brand = '<div class="pBrand"><img class="pBrandIcon" src="branding/bnn-shakti.png"><div><div class="pBrandName">BNN Shakti 1.0 (beta)</div><div class="pBrandSub"><a href="mailto:info@mybapuji.com">info@mybapuji.com</a> · <a href="https://mybapuji.com" target="_blank">mybapuji.com</a></div></div></div>';
    var astr = [a.name, a.title].filter(Boolean).join(' — ');
    var astr2 = [a.addr1, a.addr2, a.city, (a.pin ? L('पिन ', 'PIN ') + a.pin : ''), (a.phone ? '📞 ' + a.phone : ''), a.email, a.website].filter(Boolean).join(' · ');
    var foot = '<div class="pFoot"><div class="pFootAstro">' + esc(astr || '') + (astr2 ? '<span class="pFootSep"> · </span>' + esc(astr2) : '') + '</div>'
      + L('BNN Shakti 1.0 (beta) · <a href="mailto:info@mybapuji.com">info@mybapuji.com</a> · <a href="https://mybapuji.com" target="_blank">mybapuji.com</a> · प्रिंट: ', 'BNN Shakti 1.0 (beta) · <a href="mailto:info@mybapuji.com">info@mybapuji.com</a> · <a href="https://mybapuji.com" target="_blank">mybapuji.com</a> · Printed: ') + todayStamp() + '</div>';
    var page = function (inner, last) { return '<div class="pPage">' + inner + (last ? foot : '') + '</div>'; };
    var two = function (l, r) { return '<div class="pTwoCol"><div class="pSide">' + l + '</div><div class="pSide">' + r + '</div></div>'; };
    var m1 = RMODE;                       // 30+ → AP, 30− → BP (openResult में तय)
    var p1 = page(brand + '<div class="pMetaBox">' + meta + '</div>' + '<div class="ppChartBox pChartSingle">' + chartSvg + '<div class="pCap">' + cap + '</div></div>');
    var topLab = function (txt) { return '<div class="pComboTop">' + txt + '</div>'; };
    var p2 = page(two(topLab(L('भाव Combination 159', 'BHAVA Combination 159')) + printBhavaBlock(m1, '159'),
                      topLab(L('ग्रह Combination 1579', 'PLANET Combination 1579')) + printPlanetBlock(m1, '1579')));
    var p3 = page('<div class="pPageTitle">' + L('भाव BRSSS · भाव SPECIAL', 'Bhava BRSSS · Bhava SPECIAL') + '</div>' + two(printBhavaBlock(m1, 'brsss'), printBhavaSpecial(m1)));
    var p4 = page('<div class="pPageTitle">' + L('ग्रह PRSSS · ग्रह SPECIAL', 'Planet PRSSS · Planet SPECIAL') + '</div>' + two(printPlanetBlock(m1, 'prsss'), printPlanetSpecial(m1)));
    var p5 = page(two(printDashaBlock('dhasa'), printDashaBlock('bhukthi')));
    var p6 = page(printDashaBlock('andhiram'), true);
    sheet.innerHTML = p1 + p2 + p3 + p4 + p5 + p6;
  }
  function doPrint() {
    if (!RESULT || !RESULT_REC) { toast(L('पहले "कुंडली देखें" से कुंडली खोलें', 'First open a kundli via "View Kundli"')); return; }
    buildPrintSheet();
    document.body.classList.add('printing');
    var cleanup = function () { document.body.classList.remove('printing'); };
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(function () {
      try {
        if (window.desktop && window.desktop.printPage) { window.desktop.printPage().then(cleanup); }
        else { window.print(); }
      } catch (e) { cleanup(); toast(L('प्रिंट नहीं खुल सका', 'Could not open print')); }
    }, 60);
  }
  function doPdf() {
    if (!RESULT || !RESULT_REC) { toast(L('पहले "कुंडली देखें" से कुंडली खोलें', 'First open a kundli via "View Kundli"')); return; }
    buildPrintSheet();
    document.body.classList.add('printing');
    var cleanup = function () { document.body.classList.remove('printing'); };
    if (window.desktop && window.desktop.pdfSave) {
      toast(L('⏳ PDF बन रही है…', '⏳ Creating PDF…'));
      var fname = 'BNN-Shakti-' + (RESULT_REC.name ? RESULT_REC.name.replace(/[\\/:*?"<>|]/g, '') + '-' : '') + RESULT_REC.ref + '.pdf';
      window.desktop.pdfSave(fname).then(function (res) {
        cleanup();
        if (res && res.ok) { toast(L('✅ PDF सेव हो गई: ', '✅ PDF saved: ') + res.path); }
        else if (!res || !res.canceled) { toast(L('PDF नहीं बन सकी', 'Could not create PDF')); }
      }).catch(function () { cleanup(); toast(L('PDF नहीं बन सकी', 'Could not create PDF')); });
    } else {
      toast(L('प्रिंट विंडो में “Save as PDF” चुनें', 'In the print window choose “Save as PDF”'));
      window.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(function () { try { window.print(); } catch (e) { cleanup(); } }, 80);
    }
  }
  function svgToImg(svgStr) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('svg')); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    });
  }
  function roundRectC(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  async function exportAllChartPng(test) {
    if (!RESULT || !RESULT_REC) { toast(L('पहले "कुंडली देखें" से कुंडली खोलें', 'First open a kundli via "View Kundli"')); return; }
    try {
      toast(L('⏳ PNG बन रहा है…', '⏳ Making PNG…'));
      var isSouthPng = (typeof RCHART !== 'undefined' && RCHART === 'south');   // राउंड 52: जो स्क्रीन पर, वही PNG में
      var nImg = await svgToImg(isSouthPng ? southSvgString() : northSvgString());
      var W = 1600, M = 30, CH = 730;
      var rec = RESULT_REC;
      var canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = 2200;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, W, canvas.height);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8f1d14'; ctx.font = 'bold 27px sans-serif';
      ctx.fillText((rec.name || '—') + ' — BNN ALL CHART', M, 50);
      ctx.fillStyle = '#5c4a24'; ctx.font = '15px sans-serif';
      var exPairs = RESULT.exchanges.map(function (p) { return planetName(p[0]) + '<>' + planetName(p[1]); }).join('  ·  ');
      var exLine = (exPairs || L('परिवर्तन: कोई नहीं', 'Parivartan: None')) + ' — ' + (RMODE === 'AP' ? 'AFTER PARIVARDHANAI (AP)' : 'BEFORE PARIVARDHANAI (BP)');
      ctx.fillText(exLine, M, 76);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#8f1d14'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('mybapuji.com · BNN चार्ट', W - M, 44);
      ctx.fillStyle = '#6b5b3a'; ctx.font = '14px sans-serif';
      ctx.fillText(L('गोचर / Transit: ', 'गोचर / Transit: ') + (RESULT.transitWall ? fmtWall(RESULT.transitWall) : '—'), W - M, 68);
      var cx = M, cy = 96;
      var chH = isSouthPng ? Math.round(CH * 706 / 740) : CH;
      ctx.drawImage(nImg, cx, cy, CH, chH);
      if (RESULT.exchanges.length) {
        var exL = RESULT.exchanges.map(function (p) { return planetName(p[0]) + '<>' + planetName(p[1]); });
        var bx = cx + 10, by = cy + 10, bw = 220, bh = 14 + exL.length * 26;
        ctx.fillStyle = '#fff3dd'; ctx.strokeStyle = '#e8a13c'; ctx.lineWidth = 1.5;
        roundRectC(ctx, bx, by, bw, bh, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7a2e00'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
        exL.forEach(function (t, i) { ctx.fillText(t, bx + bw / 2, by + 26 + i * 26); });
        ctx.textAlign = 'left';
      }
      ctx.fillStyle = '#6b5b3a'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(isSouthPng ? 'SOUTH INDIAN STYLE' : 'NORTH INDIAN STYLE', cx + CH / 2, cy + chH + 26);
      ctx.textAlign = 'left';
      var x0 = cx + CH + 40, cw = W - x0 - M;
      var yC = cy - 8, rh = 30, labW = 64;
      function entP(e, idx) {
        if (!e) return null;
        var cls = idx === 0 ? 'b' : ((e.type === 'planet' && e.key === 'saturn') ? 'g' : (e.percent >= 20 ? 'g' : 'o'));
        var col = cls === 'b' ? '#1565c0' : cls === 'g' ? '#2e7d32' : '#ef6c00';
        var t = e.type === 'aspect' ? (e.label || '') + '-' + Math.round(e.percent)
              : (SHORT[e.key] || e.key) + ((e.natalRetro && e.key !== 'rahu' && e.key !== 'ketu') ? '#' : '') + '-' + Math.round(e.percent);
        return { t: t, c: col };
      }
      function titleBar(txt, y) {
        ctx.fillStyle = '#8f1d14'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(txt, x0, y);
        return y + 12;
      }
      var bc = RESULT.tables.bhava[RMODE], n, i;
      var maxB = 0;
      for (n = 1; n <= 12; n++) { var l1 = (bc[String(n)].list159 || []).length; if (l1 > maxB) maxB = l1; }
      var yy = titleBar('BHAVA COMBINATION — NATAL — 1-5-9 — ' + RMODE, yC + 18) + 14;
      ctx.font = 'bold 16px sans-serif';
      var bwMax = 0;
      for (n = 1; n <= 12; n++) {
        var lv0 = bc[String(n)].list159 || [];
        for (i = 0; i < lv0.length; i++) { var ev0 = entP(lv0[i], i); if (ev0) bwMax = Math.max(bwMax, ctx.measureText(ev0.t).width); }
      }
      var cellW = Math.min((cw - labW) / maxB, Math.max(72, Math.ceil(bwMax) + 16));
      var bW = labW + maxB * cellW;
      var bStart = yy;
      for (n = 1; n <= 12; n++) {
        ctx.fillStyle = '#b3261e'; ctx.font = 'bold 16px sans-serif';
        ctx.fillText('B' + pad2(n), x0 + 4, yy + 20);
        var list = bc[String(n)].list159 || [];
        for (i = 0; i < maxB; i++) {
          var en = entP(list[i], i);
          if (en) { ctx.fillStyle = en.c; ctx.font = 'bold 16px sans-serif'; ctx.fillText(en.t, x0 + labW + i * cellW + 6, yy + 20); }
        }
        ctx.strokeStyle = '#f0e7d2'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, yy + rh - 6); ctx.lineTo(x0 + bW, yy + rh - 6); ctx.stroke();
        yy += rh;
      }
      (function () {                         // राउंड 52: भाव-तालिका की खड़ी लकीरें
        var top = bStart - 6, bot = yy - 6;
        ctx.strokeStyle = '#e6d9bd'; ctx.lineWidth = 1;
        for (var c2 = 0; c2 <= maxB; c2++) {
          var vx = Math.min(x0 + labW + c2 * cellW, x0 + bW);
          ctx.beginPath(); ctx.moveTo(vx, top); ctx.lineTo(vx, bot); ctx.stroke();
        }
      })();
      var pc = RESULT.tables.planet[RMODE];
      var astro = (RESULT.astro && RESULT.astro[RMODE]) || {};
      var maxP = 0;
      RESULT.order.forEach(function (k) { var l = ((pc[k] || {}).list1579 || []).length; if (l > maxP) maxP = l; });
      var cols = Math.max(7, maxP);
      ctx.font = 'bold 16px sans-serif';
      var pwMax = 0;
      RESULT.order.forEach(function (k0) {
        ((pc[k0] || {}).list1579 || []).forEach(function (e0, i0) { var ep0 = entP(e0, i0); if (ep0) pwMax = Math.max(pwMax, ctx.measureText(ep0.t).width); });
      });
      var partW = 64;   // partner कॉलम
      var pW = Math.min(Math.round((cw - labW - partW) / cols), Math.max(66, Math.ceil(pwMax) + 14));
      yy = titleBar('PLANET COMBINATION — NATAL — 1-5-7-9 — ' + RMODE, yy + 34) + 14;
      var pStart = yy;
      RESULT.order.forEach(function (k) {
        var np = null;
        RESULT.bnn.planets.forEach(function (p) { if (p.key === k) np = p; });
        ctx.fillStyle = '#b3261e'; ctx.font = 'bold 16px sans-serif';
        var lbK = (RESULT.labels && RESULT.labels[RMODE]) ? RESULT.labels[RMODE][k] : null;   // भाग E: PNG में जन्म का ही अंक
        ctx.fillText((SHORT[k] || k) + ((np && np.retro && k !== 'rahu' && k !== 'ketu') ? '#' : '') + (lbK != null ? '-' + lbK : ''), x0 + 4, yy + 20);
        var lst = (pc[k] || {}).list1579 || [];
        for (var j = 0; j < cols; j++) {
          var ep = entP(lst[j], j);
          if (ep) { ctx.fillStyle = ep.c; ctx.font = 'bold 16px sans-serif'; ctx.fillText(ep.t, x0 + labW + j * pW + 4, yy + 20); }
        }
        var partner = astro[k];
        if (partner) {
          ctx.fillStyle = '#8e24aa'; ctx.font = 'bold 16px sans-serif';
          ctx.fillText((SHORT[partner] || partner), x0 + labW + cols * pW + 14, yy + 20);
        }
        ctx.strokeStyle = '#f0e7d2'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, yy + rh - 6); ctx.lineTo(x0 + labW + cols * pW + partW, yy + rh - 6); ctx.stroke();
        yy += rh;
      });
      (function () {                         // राउंड 52: ग्रह-तालिका + partner कॉलम की खड़ी लकीरें
        var top = pStart - 6, bot = yy - 6;
        ctx.strokeStyle = '#e6d9bd'; ctx.lineWidth = 1;
        for (var c3 = 0; c3 <= cols; c3++) {
          var vx = Math.min(x0 + labW + c3 * pW, x0 + cw);
          ctx.beginPath(); ctx.moveTo(vx, top); ctx.lineTo(vx, bot); ctx.stroke();
        }
        var px = x0 + labW + cols * pW;
        ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, bot); ctx.stroke();
        var px2 = px + partW;
        ctx.beginPath(); ctx.moveTo(px2, top); ctx.lineTo(px2, bot); ctx.stroke();
      })();
      var d = RESULT.dasha;
      var runLines = [];
      var mi = d.running && d.running.mahaIndex;
      if (mi != null && d.mahadashas[mi] && d.mahadashas[mi].lord) runLines.push(planetName(d.mahadashas[mi].lord) + L(' दशा: ', ' DHASA: ') + fmtISO(d.mahadashas[mi].startISO) + ' → ' + fmtISO(d.mahadashas[mi].endISO));
      var bhs = (d.running && d.running.bhukthis) || [];
      var bi = d.running && d.running.bhukthiIndex;
      if (bi != null && bhs[bi] && bhs[bi].lord) runLines.push(planetName(bhs[bi].lord) + L(' भुक्ति: ', ' BHUKTHI: ') + fmtISO(bhs[bi].startISO) + ' → ' + fmtISO(bhs[bi].endISO));
      var ahs = (d.running && d.running.andhirams) || [];
      var ai = d.running && d.running.andhiramIndex;
      if (ai != null && ahs[ai] && ahs[ai].lord) runLines.push(planetName(ahs[ai].lord) + L(' अंतर: ', ' ANDHIRAM: ') + fmtISO(ahs[ai].startISO) + ' → ' + fmtISO(ahs[ai].endISO));
      var boxY = yy + 10, boxH = 34 + runLines.length * 26;
      ctx.fillStyle = '#fff8e6'; ctx.strokeStyle = '#d9a95f'; ctx.lineWidth = 1.5;
      roundRectC(ctx, x0, boxY, cw, boxH, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7a2e00'; ctx.font = 'bold 17px sans-serif';
      ctx.fillText(L('चल रही दशा / RUNNING', 'चल रही दशा / RUNNING'), x0 + 14, boxY + 24);
      ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#5c4a24';
      runLines.forEach(function (t, i2) { ctx.fillText(t, x0 + 14, boxY + 50 + i2 * 26); });
      var yEnd = Math.max(cy + chH + 50, boxY + boxH + 20);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8f1d14'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('mybapuji.com - निशुल्क ज्योतिष सामग्री: कुंडली · कुंडली मिलान · पंचांग · BNN चार्ट', W / 2, yEnd + 8);
      ctx.fillStyle = '#6b5b3a'; ctx.font = '13px sans-serif';
      ctx.fillText('BNN Shakti 1.0 · info@mybapuji.com', W / 2, yEnd + 28);
      var outH = Math.round(yEnd + 44);
      var out = document.createElement('canvas');
      out.width = W; out.height = outH;
      out.getContext('2d').drawImage(canvas, 0, 0);
      var dataUrl = out.toDataURL('image/png');
      if (test) {
        var tImg = document.createElement('img');
        tImg.src = dataUrl; tImg.style.width = '900px'; tImg.style.display = 'block'; tImg.style.margin = '10px auto';
        document.body.appendChild(tImg);
        document.querySelector('.shell').hidden = true;
        $('viewResult').hidden = true;
        $('status').textContent = L('PNG झलक — ', 'PNG preview — ') + Math.round(dataUrl.length / 1024) + ' KB';
        return;
      }
      var dl = document.createElement('a');
      dl.href = dataUrl;
      dl.download = 'BNN-All-Chart-' + (rec.name ? rec.name.replace(/[\\/:*?"<>|]/g, '') : rec.ref) + '.png';
      dl.click();
      toast(L('✅ ऑल चार्ट PNG बन गया', '✅ All Charts PNG created'));
    } catch (e) { console.error(e); toast(L('PNG नहीं बन सका — ', 'PNG failed — ') + e.message); }
  }

  // ---------- भरने की सुविधाएँ + सेटिंग्स ----------
  // ---------- सुधार-राउंड 36 (user 18-10-2026): तारीख़/समय का खाना हिस्सा-दर-हिस्सा ----------
  //  दिक़्क़त थी: हर अंक डालने पर पूरी तारीख़ फिर से जोड़ी जाती थी — बीच में सुधारते ही अंक
  //  खिसक जाते (18-11-0202 70:42:34) और cursor कूद जाता। अब हर हिस्सा (दिन/महीना/साल/घंटा/
  //  मिनट/सेकंड) अपनी जगह पर बदलता है; हिस्सा भरते ही cursor अपने-आप अगले हिस्से में चला जाता है।
  // ---------- सुधार-राउंड 12: तारीख़ dd-mm-yyyy (दिन पहले) + 📅 चयनकर्ता ----------
  function isoToDMY(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : ''; }
  function isoToDMYT(v) { var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(v || '')); return m ? m[3] + '-' + m[2] + '-' + m[1] + ' ' + m[4] + ':' + m[5] + ':' + (m[6] || '00') : ''; }
  function dtWidths(mode) { return mode === 'dt' ? [2, 2, 4, 2, 2, 2] : (mode === 'time' ? [2, 2, 2] : [2, 2, 4]); }
  function dtSeps(mode) { return mode === 'dt' ? ['-', '-', ' ', ':', ':'] : (mode === 'time' ? [':', ':'] : ['-', '-']); }
  function maskTyped(el, mode) {
    var W = dtWidths(mode), SP = dtSeps(mode), segs = [], lastOut = null;
    function load() {
      var d = el.value.replace(/\D/g, ''), k = 0;
      segs = [];
      for (var i = 0; i < W.length; i++) { segs.push(d.slice(k, k + W[i])); k += W[i]; }
    }
    function render() {
      var last = -1, i, out = '';
      for (i = 0; i < W.length; i++) if (segs[i]) last = i;
      if (last < 0) return '';
      for (i = 0; i <= last; i++) { if (i) out += SP[i - 1]; out += segs[i]; }
      // आख़िरी हिस्सा भरा हो और आगे का ख़ाली → उसकी जगह दिखाने के लिए सेपरेटर
      if (segs[last].length >= W[last] && last < W.length - 1) out += SP[last];
      return out;
    }
    function posAfter(i) { var p = 0; for (var k = 0; k <= i; k++) { if (k) p += 1; p += segs[k].length; } return p; }
    function segAt(caret) {
      var p = 0;
      for (var i = 0; i < W.length; i++) {
        var L = (segs[i] || '').length;      // हिस्सा अभी नहीं पढ़ा गया हो तो भी न टूटे
        if (caret <= p + L) return i;
        p += L + 1;
      }
      return W.length - 1;
    }
    function sync() { if (el.value !== lastOut) load(); }   // बाहर से बदला हो तभी दोबारा पढ़ो
    // ---------- राउंड 64-ख (31-10-2026, Claude): गोचर का खाना कभी ख़ाली न हो ----------
    // 'dt' खाने में "ओवरराइट" ढंग: छहों हिस्से (दिन-महीना-वर्ष घंटा:मिनट:सेकंड) सदा दिखें,
    // अंक टाइप करने पर उसी जगह का अंक बदले, Backspace केवल cursor पीछे ले जाए, और
    // खाना अधूरा/ग़लत छोड़कर बाहर निकलें तो आख़िरी सही तारीख़-समय लौट आए।
    var lastGood = '';
    function isFull() { if (segs.length !== W.length) return false; for (var q = 0; q < W.length; q++) if ((segs[q] || '').length !== W[q]) return false; return true; }
    function isValidDt() {
      if (!isFull()) return false;
      var d = +segs[0], m = +segs[1], y = +segs[2], h = +segs[3], mi = +segs[4], se = +segs[5];
      if (!(m >= 1 && m <= 12 && y >= 1000 && h <= 23 && mi <= 59 && se <= 59 && d >= 1)) return false;
      var dim = [31, ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
      return d <= dim;
    }
    function noteGood() { if (mode === 'dt') { sync(); if (isValidDt()) lastGood = el.value; } }
    function restoreGood() {
      if (mode !== 'dt' || !lastGood) return;
      el.value = lastGood; lastOut = null; load(); lastOut = el.value;
    }
    function dtOverwrite(ch) {
      // पूरा भरा 'dt' खाना: cursor (या चुने हिस्से की शुरुआत) वाले अंक को बदलो, फिर आगे बढ़ो
      var c = (el.selectionStart == null) ? 0 : el.selectionStart;
      var i = segAt(c), a = segStart(i), off = c - a;
      if (off >= W[i]) { if (i < W.length - 1) { i++; a = segStart(i); off = 0; } else { off = W[i] - 1; } }
      if (off < 0) off = 0;
      segs[i] = segs[i].slice(0, off) + ch + segs[i].slice(off + 1);
      el.value = render(); lastOut = el.value;
      var np = a + off + 1;
      if (off + 1 >= W[i] && i < W.length - 1) np = segStart(i + 1);
      try { el.setSelectionRange(np, np); } catch (e) { }
      noteGood();
      fire();
    }
    function dtCaretBack() {
      var c = (el.selectionStart == null) ? 0 : el.selectionStart;
      if (el.selectionEnd > c) { try { el.setSelectionRange(c, c); } catch (e) { } return; }
      var np = c - 1;
      if (np > 0 && /\D/.test(el.value.charAt(np))) np--;            // सेपरेटर लाँघो
      if (np < 0) np = 0;
      try { el.setSelectionRange(np, np); } catch (e) { }
    }
    // ---------- राउंड 64 / चरण 4.1: हिस्सा-दर-हिस्सा ↑↓, ←→, wheel (तारीख़-समय वाले खाने में) ----------
    // maskTyped 'dt' (गोचर का तारीख़-समय) के लिए: हिस्से पर click → वह हिस्सा चुना जाए,
    // ↑↓ से एक आगे/पीछे (कैलेंडर सही: 59s→अगला मिनट, 31-01→01-02, 28-02-2028→29-02-2028),
    // wheel से भी वही, और ←→ से पिछले/अगले हिस्से पर।
    var DT_UNITS = { dt: ['day', 'month', 'year', 'hour', 'minute', 'second'], date: ['day', 'month', 'year'], time: ['hour', 'minute', 'second'] };
    function segStart(i) { var p = 0; for (var k = 0; k < i; k++) { p += segs[k].length + 1; } return p; }
    function selectSeg(i) {
      var a = segStart(i), b = a + segs[i].length;
      el.value = render(); lastOut = el.value;
      try { el.setSelectionRange(a, b); } catch (e) { }
    }
    function segAtCaret() {
      var c = (el.selectionStart == null) ? el.value.length : el.selectionStart;
      return segAt(c);
    }
    function leap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
    function daysIn(y, m) { return [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
    function bump(i, dir) {
      sync();
      if (segs.length !== W.length) load();
      for (var k = 0; k < W.length; k++) if ((segs[k] || '').length < W[k]) return false; // पूरा भरा हो तभी
      var o = { d: +segs[0], m: +segs[1], y: +segs[2], h: 0, mi: 0, s: 0 };
      if (mode === 'dt') { o.h = +segs[3]; o.mi = +segs[4]; o.s = +segs[5]; }
      else if (mode === 'time') { o.h = +segs[0]; o.mi = +segs[1]; o.s = +segs[2]; o.d = 1; o.m = 1; o.y = 2000; }
      var unit = DT_UNITS[mode][i];
      var t = Date.UTC(o.y, o.m - 1, o.d, o.h, o.mi, o.s);
      if (unit === 'second') t += dir * 1000;
      else if (unit === 'minute') t += dir * 60000;
      else if (unit === 'hour') t += dir * 3600000;
      else if (unit === 'day') t += dir * 86400000;
      else if (unit === 'month' || unit === 'year') {
        var total = o.y * 12 + (o.m - 1) + (unit === 'month' ? dir : dir * 12);
        var ny = Math.floor(total / 12), nm = total - ny * 12 + 1;
        var nd = Math.min(o.d, daysIn(ny, nm));
        t = Date.UTC(ny, nm - 1, nd, o.h, o.mi, o.s);
      }
      var D = new Date(t);
      var parts = {
        d: pad2(D.getUTCDate()), m: pad2(D.getUTCMonth() + 1), y: String(D.getUTCFullYear()),
        h: pad2(D.getUTCHours()), mi: pad2(D.getUTCMinutes()), s: pad2(D.getUTCSeconds())
      };
      if (mode === 'dt') segs = [parts.d, parts.m, parts.y, parts.h, parts.mi, parts.s];
      else if (mode === 'date') segs = [parts.d, parts.m, parts.y];
      else segs = [parts.h, parts.mi, parts.s];
      el.value = render(); lastOut = el.value;
      selectSeg(i);
      noteGood();
      fire();
      return true;
    }
    var quiet = false;
    function fire() {
      // बाक़ी ऐप (जैसे "✅ जन्म विवरण ठीक है" और घंटा-संकेत) को भी पता चले — पर ख़ुद दोबारा न छेड़ें
      quiet = true;
      try { el.dispatchEvent(new Event('input', { bubbles: true })); } finally { quiet = false; }
      el.dispatchEvent(new Event('dtedit', { bubbles: true }));
    }
    function paint(i, advance) {
      el.value = render(); lastOut = el.value;
      var p = posAfter(i);
      if (advance && i < W.length - 1 && p < el.value.length) p += 1;  // सेपरेटर लाँघो
      if (p > el.value.length) p = el.value.length;
      try { el.setSelectionRange(p, p); } catch (e) { }
      fire();
    }
    function digit(ch) {
      sync();
      if (mode === 'dt' && isFull()) { dtOverwrite(ch); return; }
      var caret = (el.selectionStart == null) ? el.value.length : el.selectionStart;
      var i = segAt(caret);
      if (segs[i].length >= W[i]) segs[i] = ch;         // हिस्सा भरा है → नया अंक उसकी जगह
      else segs[i] += ch;
      var full = segs[i].length >= W[i];
      paint(i, full);
    }
    function backspace(forward) {
      sync();
      if (mode === 'dt' && isFull()) { if (!forward) dtCaretBack(); return; }
      var caret = (el.selectionStart == null) ? el.value.length : el.selectionStart;
      var i = segAt(caret);
      if (!segs[i] && i > 0) { i--; }                    // ख़ाली हिस्सा → पिछला
      segs[i] = segs[i].slice(0, -1);
      paint(i, false);
    }
    el.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key >= '0' && e.key <= '9' && e.key.length === 1) { e.preventDefault(); digit(e.key); return; }
      if (e.key === 'Backspace') { e.preventDefault(); backspace(false); return; }
      if (e.key === 'Delete') { e.preventDefault(); backspace(true); return; }
      if (DT_UNITS[mode] && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        sync();
        e.preventDefault(); bump(segAtCaret(), e.key === 'ArrowUp' ? 1 : -1); return;
      }
      if (DT_UNITS[mode] && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        // हिस्से के किनारे पर हो तो पिछले/अगले हिस्से पर जाओ, वरना cursor सामान्य चले
        sync();
        var i = segAtCaret(), sel0 = el.selectionStart, sel1 = el.selectionEnd;
        var a = segStart(i), b = a + (segs[i] || '').length;
        var atEnd = sel0 >= b || (sel0 <= a && sel1 >= b);   // हिस्सा पूरा चुना हो भी "अंत" जैसा
        var atStart = sel0 <= a;
        if (e.key === 'ArrowRight' && atEnd && i < W.length - 1) { e.preventDefault(); selectSeg(i + 1); return; }
        if (e.key === 'ArrowLeft' && atStart && i > 0) { e.preventDefault(); selectSeg(i - 1); return; }
        setTimeout(function () { try { el.setSelectionRange(el.selectionStart, el.selectionEnd); } catch (er) { } }, 0);
        return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        setTimeout(function () { try { el.setSelectionRange(el.selectionStart, el.selectionEnd); } catch (er) { } }, 0);
      }
    });
    if (mode === 'dt') {
      el.addEventListener('focus', function () { noteGood(); if (!el.value.trim()) restoreGood(); });
      el.addEventListener('blur', function () {
        sync();
        if (isValidDt()) { lastGood = el.value; return; }
        if (lastGood) { restoreGood(); fire(); }
      });
      // बाहर से (अभी / गोचर / 📅) भरा गया मान भी "आख़िरी सही" बने
      el.addEventListener('dtsetgood', noteGood);
    }
    if (DT_UNITS[mode]) {
      // click → उस हिस्से का चुनाव
      el.addEventListener('mouseup', function () {
        setTimeout(function () {
          if (el.selectionStart !== el.selectionEnd) return; // drag से चुना हो तो न छेड़ें
          sync();
          var i = segAtCaret(); if (!segs[i]) return;
          selectSeg(i);
        }, 0);
      });
      // wheel → उस हिस्से को आगे/पीछे (page न खिसके)
      el.addEventListener('wheel', function (e) {
        var dir = e.deltaY < 0 ? 1 : -1;
        sync();
        if (!bump(segAtCaret(), dir)) return;   // पूरा भरा न हो तो page सामान्य खिसके
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
    }
    el.addEventListener('beforeinput', function (e) {
      // IME / autocorrect / insertText जैसे रास्ते (keydown नहीं मिलता) — वहाँ भी अंक ठीक जगह बैठे
      if (e.inputType === 'insertText' && e.data && /^[0-9]$/.test(e.data)) { e.preventDefault(); digit(e.data); }
    });
    el.addEventListener('paste', function (e) {
      var t = (e.clipboardData || window.clipboardData).getData('text') || '';
      if (!t) return;
      e.preventDefault();
      var d = t.replace(/\D/g, '');
      if (!d) return;
      load();
      var k = 0;
      for (var i = 0; i < W.length && k < d.length; i++) { segs[i] = d.slice(k, k + W[i]); k += W[i]; }
      el.value = render(); lastOut = el.value;
      try { el.setSelectionRange(el.value.length, el.value.length); } catch (er) { }
      fire();
    });
    el.addEventListener('input', function (e) {
      if (quiet) return;                                               // अपनी ही घोषणा पर लूप न हो
      if (mode === 'dt' && e.inputType && e.inputType.indexOf('delete') === 0) {
        // cut / खींचकर मिटाना — 'dt' खाना ख़ाली न हो: पिछला रूप वापस
        if (lastGood) { var cp = el.selectionStart; restoreGood(); try { el.setSelectionRange(cp, cp); } catch (er) { } }
        return;
      }
      if (e.inputType && e.inputType.indexOf('insert') !== 0) return;   // मिटाना हम ख़ुद सँभालते हैं
      load(); el.value = render(); lastOut = el.value;
      el.dispatchEvent(new Event('dtedit', { bubbles: true }));
    });
  }
  function maskDateField(el) { maskTyped(el, 'date'); }
  function maskTimeField(el) { maskTyped(el, 'time'); }
  function maskDateTimeField(el) { maskTyped(el, 'dt'); }
  function bindDtPicker(visId, pickId) {
    var vis = $(visId), pick = $(pickId);
    if (!vis || !pick) return;
    var btn = document.querySelector('.dtcal[data-for="' + visId + '"]');
    if (btn) btn.addEventListener('click', function () {
      if (pick.showPicker) { try { pick.showPicker(); return; } catch (e) { } }
      pick.click();
    });
    pick.addEventListener('change', function () {
      if (!pick.value) return;
      vis.value = (pick.value.indexOf('T') >= 0) ? isoToDMYT(pick.value) : isoToDMY(pick.value);
      vis.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  // सुधार-राउंड 12: 1-5-7-9 / 1-5-9 chips सिर्फ़ शनि-गुरु समूह पर दिखें
  function syncStModeRow() {
    var el = $('rStMode'); if (!el) return;
    var show = RST.group === 'sg';
    el.hidden = !show;
    if (!show) RST.mode = (RST.group === 'nodes') ? '159' : '1579';
    setTabsAttr('rStMode', 'm', RST.mode);
  }
  function updateHour12() {
    var el = $('hTime12'); if (!el) return;
    var m = /^(\d{1,2})/.exec($('fTime').value || '');
    var h = m ? +m[1] : NaN;
    if (!(h >= 0 && h <= 23)) { el.textContent = ''; return; }
    var h12 = h % 12 === 0 ? 12 : h % 12;
    var mm = /^\d{1,2}:(\d{2})/.exec($('fTime').value || '');
    el.textContent = '(' + h12 + (mm ? ':' + mm[1] : '') + ' ' + (h < 12 ? 'am' : 'pm') + ')';
  }
  function updateFormOk() {
    var el = $('formOk'); if (!el) return;
    // चरण 3: लिंग भी ज़रूरी है — चुना हुआ न हो तो "✅ जन्म विवरण ठीक है" न दिखे
    var gOk = !!document.querySelector('input[name="gender"]:checked');
    var ok = gOk && !!vDate($('fDate').value) && !!vTime($('fTime').value) && vNum($('fLat').value) !== null && vNum($('fLon').value) !== null && vNum($('fGmt').value) !== null && !!$('fPlace').value.trim();
    el.hidden = !ok;
  }

  var SETTINGS_KEY = 'bnn_settings_v1';
  var SETTINGS = {
    astro: { slogan: '', name: '', title: '', addr1: '', addr2: '', city: '', pin: '', phone: '', email: '', website: '' },
    defaultPlace: { state: '', place: '', lat: '', lon: '', gmt: '', dst: '' },
    ayanamsa: 'KP_NEW',
    logo: '',
    chartDefault: 'north',
    autoBackupDays: 7,
    lastAutoBackupMs: 0,
    nextRef: null
  };
  function loadAppSettings() {
    try {
      var t = localStorage.getItem(SETTINGS_KEY);
      if (t) {
        var o = JSON.parse(t);
        if (o) {
          if (o.astro) SETTINGS.astro = o.astro;
          if (o.defaultPlace) SETTINGS.defaultPlace = o.defaultPlace;
          if (o.ayanamsa) SETTINGS.ayanamsa = o.ayanamsa;
          if (o.logo) SETTINGS.logo = o.logo;
          if (o.chartDefault) SETTINGS.chartDefault = o.chartDefault;
          if (typeof o.autoBackupDays === 'number') SETTINGS.autoBackupDays = o.autoBackupDays;
          if (o.lastAutoBackupMs) SETTINGS.lastAutoBackupMs = o.lastAutoBackupMs;
          if (o.nextRef) SETTINGS.nextRef = o.nextRef;
        }
      }
    } catch (e) {}
  }
  function saveAppSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch (e) { toast(L('सेटिंग्स सहेजी नहीं जा सकीं', 'Could not save settings')); } }
  function applyDefaultPlace() {
    var d = SETTINGS.defaultPlace;
    if (!d || !d.place) return;
    $('fPlace').value = d.place;
    if (d.lat !== '' && d.lat != null) $('fLat').value = d.lat;
    if (d.lon !== '' && d.lon != null) $('fLon').value = d.lon;
    if (d.gmt !== '' && d.gmt != null) $('fGmt').value = d.gmt;
    $('fDstChk').checked = Number(d.dst) > 0;
    if (d.state) rebuildStates(enOfHiP(STATES, d.state));
  }
  function renderStLogo() { var img = $('stLogoImg'); if (SETTINGS.logo) { img.src = SETTINGS.logo; img.hidden = false; } else { img.hidden = true; img.removeAttribute('src'); } }
  function updatePrintPreview() {
    var a = SETTINGS.astro;
    var lines = [];
    if (a.slogan) lines.push(a.slogan);
    var l2 = [a.name, a.title].filter(Boolean).join(' — ');
    if (l2) lines.push(l2);
    var l3 = [a.addr1, a.addr2, a.city, (a.pin ? L('पिन ', 'PIN ') + a.pin : ''), (a.phone ? '📞 ' + a.phone : ''), a.email, a.website].filter(Boolean).join(' · ');
    if (l3) lines.push(l3);
    $('stPreview').innerHTML = lines.length
      ? lines.map(function (x, i) { return '<div class="pl' + (i + 1) + '">' + esc(x) + '</div>'; }).join('')
      : '<div class="pl3">' + L('विवरण भरने पर यहाँ झलक दिखेगी — यही हर प्रिंट/PDF के ऊपर छपेगा', 'Preview appears here once details are filled — this prints atop every Print/PDF') + '</div>';
  }
  function openSettings() {
    var a = SETTINGS.astro, d = SETTINGS.defaultPlace;
    $('stSlogan').value = a.slogan || ''; $('stName').value = a.name || ''; $('stTitle').value = a.title || '';
    $('stAddr1').value = a.addr1 || ''; $('stAddr2').value = a.addr2 || ''; $('stCity').value = a.city || '';
    $('stPin').value = a.pin || ''; $('stPhone').value = a.phone || ''; $('stEmail').value = a.email || ''; $('stWeb').value = a.website || '';
    $('stPlace').value = d.place || ''; $('stState').value = d.state || '';
    $('stLat').value = d.lat || ''; $('stLon').value = d.lon || ''; $('stGmt').value = d.gmt || ''; $('stDstChk').checked = Number(d.dst) > 0;
    $('stAyan').value = SETTINGS.ayanamsa || 'KP_NEW';
    $('stNext').value = state.nextRef;
    renderStLogo();
    updatePrintPreview();
    $('settingsModal').hidden = false;
  }
  function closeSettings() { $('settingsModal').hidden = true; }
  function saveSettingsClient() {
    var a = SETTINGS.astro;
    a.slogan = $('stSlogan').value.trim(); a.name = $('stName').value.trim(); a.title = $('stTitle').value.trim();
    a.addr1 = $('stAddr1').value.trim(); a.addr2 = $('stAddr2').value.trim(); a.city = $('stCity').value.trim();
    a.pin = $('stPin').value.trim(); a.phone = $('stPhone').value.trim(); a.email = $('stEmail').value.trim(); a.website = $('stWeb').value.trim();
    var d = SETTINGS.defaultPlace;
    d.place = $('stPlace').value.trim(); d.state = $('stState').value.trim();
    d.lat = $('stLat').value.trim(); d.lon = $('stLon').value.trim(); d.gmt = $('stGmt').value.trim(); d.dst = $('stDstChk').checked ? '1' : '0';
    SETTINGS.ayanamsa = $('stAyan').value;
    var n = parseInt($('stNext').value, 10);
    if (isFinite(n) && n >= 1) { SETTINGS.nextRef = n; state.nextRef = n; saveState(); if (!currentId) $('fRef').value = state.nextRef; }
    saveAppSettings();
    updatePrintPreview();
    toast(L('✅ सेटिंग्स सहेज दीं', '✅ Settings saved'));
  }

  // ---------- कुंडली खोलें / डेटा-बैकअप (चरण 7) ----------
  function renderOpenList() {
    var q = ($('openQ').value || '').trim().toLowerCase();
    var rows = state.records.slice().sort(function (a, b) { return (a.ref || 0) - (b.ref || 0); });
    if (q) rows = rows.filter(function (r) {
      var v = [r.ref == null ? '' : String(r.ref), r.name || '', r.group || '', r.mobile || ''].join(' ').toLowerCase();
      return v.indexOf(q) > -1;
    });
    var el = $('openList');
    if (!rows.length) { el.innerHTML = '<div class="empty2">' + L('कोई कुंडली नहीं मिली।', 'No kundli found.') + '</div>'; return; }
    // पारंपरिक शैली का records-तालिका (user request 2026-10-16): Ref No | Group | Name | City | DOB | Mobile
    var html = '<table class="openTbl"><tr><th>' + L('क्रमांक','Ref No') + '</th><th>' + L('ग्रुप','Group') + '</th><th>' + L('नाम','Name') + '</th><th>' + L('शहर','City') + '</th><th>' + L('जन्म तिथि-समय','Date of Birth') + '</th><th>' + L('मोबाइल','Mobile No.') + '</th><th></th></tr>';
    rows.forEach(function (r) {
      html += '<tr data-id="' + r.id + '"><td class="c1">' + (r.ref == null ? '' : r.ref) + '</td><td>' + esc(r.group || '—') + '</td><td>' + esc(r.name || '—') + '</td><td>' + esc(r.place || r.placeEN || '—') + '</td><td>' + esc(r.date || '') + '</td><td>' + esc(r.mobile || '—') + '</td><td class="cA"><button class="miniBtn opn">' + L('खोलें','Open') + '</button><button class="miniBtn del" data-del="' + r.id + '">🗑</button></td></tr>';
    });
    html += '</table>';
    el.innerHTML = html;
    el.querySelectorAll('tr[data-id]').forEach(function (tr) {
      tr.addEventListener('click', function (ev) { if (ev.target.closest('[data-del]')) return; closeOpenModal(); loadRecord(+tr.getAttribute('data-id')); });
    });
    el.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var id = +b.getAttribute('data-del');
        uiConfirm(L('क्या वास्तव में आप इस कुंडली को delete करना चाहते हैं?', 'Do you really want to delete this kundli?')).then(function (ok) {
          if (!ok) return;
          state.records = state.records.filter(function (x) { return x.id !== id; }); saveState();
          renderOpenList();
        });
      });
    });
  }
  function openOpenModal() { $('openModal').hidden = false; $('openQ').value = ''; renderOpenList(); $('openQ').focus(); }
  function closeOpenModal() { $('openModal').hidden = true; }
  function openDataModal() {
    $('dataModal').hidden = false;
    $('dataCount').textContent = L('अभी इस कंप्यूटर में: ', 'On this computer right now: ') + state.records.length + L(' कुंडलियाँ सुरक्षित', ' kundlis saved');
  }
  function closeDataModal() { $('dataModal').hidden = true; }
  function openGroupModal() { $('groupModal').hidden = false; $('groupName').value = ''; $('groupName').focus(); }
  function closeGroupModal() { $('groupModal').hidden = true; }
  function createGroup() {
    var g = ($('groupName').value || '').trim();
    if (!g) { toast(L('पहले ग्रुप का नाम लिखें', 'Type a group name first')); return; }
    if (state.groups.indexOf(g) > -1) { toast(L('यह ग्रुप पहले से है', 'This group already exists')); return; }
    state.groups.push(g); saveState(); renderGroups(); $('fGroup').value = g;
    closeGroupModal();
    toast(L('नया ग्रुप जुड़ गया: ', 'New group added: ') + g);
  }

  // ---------- भाषा (हिंदी / English) — चरण 6 ----------
  function setLangFromStorage() { try { if (localStorage.getItem(LANG_KEY) === 'en') LANG = 'en'; } catch (e) {} }
  function refreshFormTitle() {
    var r = null;
    for (var i = 0; i < state.records.length; i++) if (state.records[i].id === currentId) r = state.records[i];
    $('formTitle').textContent = r
      ? L('कुंडली — संदर्भ ', 'Kundli — Ref ') + r.ref + (r.name ? ' · ' + r.name : '')
      : L('नई कुंडली — जन्म विवरण', 'New Kundli — Birth Details');
  }
  function refreshAyanOptions() {
    var sel = $('stAyan'); if (!sel || sel.options.length < 3) return;
    sel.options[0].textContent = L('KP New (BNN — डिफ़ॉल्ट)', 'KP New (BNN — default)');
    sel.options[1].textContent = L('लाहिरी 1940', 'Lahiri 1940');
  }
  function applyLang() {
    var i, els;
    els = document.querySelectorAll('[data-l]');
    for (i = 0; i < els.length; i++) els[i].textContent = T(els[i].getAttribute('data-l'));
    els = document.querySelectorAll('[data-lp]');
    for (i = 0; i < els.length; i++) els[i].placeholder = T(els[i].getAttribute('data-lp'));
    els = document.querySelectorAll('[data-lt]');
    for (i = 0; i < els.length; i++) els[i].title = T(els[i].getAttribute('data-lt'));
    document.documentElement.lang = (LANG === 'en') ? 'en' : 'hi';
    if (!/mybapuji/.test(document.title)) document.title = 'BNN Shakti 1.0 (beta)';
    $('btnLang').textContent = L('🌐 भाषा: हिंदी', '🌐 Language: English');
    refreshAyanOptions();
    refreshFormTitle();
    renderList({ f: filterField, q: ($('q').value || '').trim() });
    setStatus();
    updatePrintPreview();
    if (!$('placeSugg').hidden) renderSugg($('fPlace').value);
    if (RESULT) {
      renderResult();
      if (RESULT.transitWall) $('rGocharWhen').textContent = fmtWall(RESULT.transitWall);
      if (RST && RST.result) renderStResults();
    }
    var sheet = $('printSheet'); if (sheet && sheet.parentNode) sheet.parentNode.removeChild(sheet);
  }
  function toggleLang() {
    LANG = (LANG === 'en') ? 'hi' : 'en';
    try { localStorage.setItem(LANG_KEY, LANG); } catch (e) {}
    applyLang();
    toast(L('भाषा अब हिंदी', 'Language now English'));
  }

  function init() {
    setLangFromStorage();
    fillCountries(); rebuildStates('Maharashtra'); loadAppSettings(); loadState(); renderGroups(); renderList();
    $('fRef').value = state.nextRef; setStatus();
    applyDefaultPlace();
    ['fDate', 'fTime', 'fLat', 'fLon', 'fGmt', 'fPlace'].forEach(function (id) {
      $(id).addEventListener('input', updateFormOk);
      $(id).addEventListener('blur', updateFormOk);
    });
    // चरण 3: लिंग चुनते ही "✅ जन्म विवरण ठीक है" का हिसाब दोबारा
    [].forEach.call(document.getElementsByName('gender'), function (g) { g.addEventListener('change', updateFormOk); });
    updateFormOk();

    $('btnNew').addEventListener('click', newKundli);
    $('btnSave').addEventListener('click', function () { saveKundli(false); });
    $('btnDelete').addEventListener('click', deleteKundli);
    $('btnShow').addEventListener('click', function () {
      var r = saveKundli(true);
      if (r) openResult(r);
    });
    $('btnAddGroup').addEventListener('click', openGroupModal);
    $('groupSave').addEventListener('click', createGroup);
    $('groupClose').addEventListener('click', closeGroupModal);
    $('groupModal').addEventListener('mousedown', function (ev) { if (ev.target === this) closeGroupModal(); });
    $('groupName').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); createGroup(); } });
    $('btnFolder').addEventListener('click', openOpenModal);
    $('openQ').addEventListener('input', renderOpenList);
    $('openClose').addEventListener('click', closeOpenModal);
    $('openModal').addEventListener('mousedown', function (ev) { if (ev.target === this) closeOpenModal(); });
    $('fCountry').addEventListener('change', function () { rebuildStates(''); renderSugg($('fPlace').value); });
    $('fState').addEventListener('change', function () { if (!$('placeSugg').hidden) renderSugg($('fPlace').value); });
    $('btnPlace').addEventListener('click', function () { $('fPlace').focus(); renderSugg(''); });
    $('fPlace').addEventListener('focus', function () { renderSugg(this.value); });
    $('fPlace').addEventListener('input', function () { renderSugg(this.value); });
    $('fPlace').addEventListener('blur', function () { setTimeout(hideSugg, 180); });
    $('fPlace').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (SUGG_ITEMS.length) pickPlace(SUGG_ITEMS[0]); else applyPlace(); }
      else if (e.key === 'Escape') { hideSugg(); }
    });
    $('placeSugg').addEventListener('mousedown', function (ev) {
      var it = ev.target.closest('.sItem');
      if (!it || !it.getAttribute('data-i')) return;
      ev.preventDefault();
      pickPlace(SUGG_ITEMS[+it.getAttribute('data-i')]);
    });
    maskDateField($('fDate')); maskTimeField($('fTime'));
    $('fTime').addEventListener('input', updateHour12);
    $('fTime').addEventListener('blur', updateHour12);
    $('fDate').addEventListener('blur', function () { var v = vDate(this.value); if (v) this.value = v; });
    $('fTime').addEventListener('blur', function () { var v = vTime(this.value); if (v) this.value = v; });

    document.querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        document.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on'); filterField = c.dataset.f; grpSel = null;
        renderList({ q: $('q').value.trim() });
      });
    });
    function doSearch() { renderList({ f: filterField, q: $('q').value.trim() }); }
    $('btnSearch').addEventListener('click', function () {
      openOpenModal();
      var qv = ($('q').value || '').trim();
      if (qv) { $('openQ').value = qv; renderOpenList(); }
    });
    $('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
    $('btnBrowse').addEventListener('click', function () { $('q').value = ''; grpSel = null; renderList(); toast(L('सभी कुंडलियाँ दिखाई गईं', 'All kundlis shown')); });
    $('btnDelList').addEventListener('click', deleteKundli);

    $('btnBackup').addEventListener('click', function () {
      download('bnn-kundli-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(state, null, 2));
      toast(L('⬇️ बैकअप फ़ाइल बन गई — सुरक्षित जगह रखें', '⬇️ Backup file created — keep it somewhere safe'));
    });
    $('btnRestore').addEventListener('click', function () { $('fileIn').click(); });
    // राउंड 56: बैकअप खोलने पर पहले सुरक्षा-बैकअप, फिर Merge / Replace का चुनाव
    function bkKey(r) { return [r && r.ref, (r && r.name) || '', (r && r.date) || '', (r && r.time) || ''].join('|'); }
    function bkStamp() {
      var d = new Date(), p2 = function (n) { return String(n).padStart(2, '0'); };
      return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + '_' + p2(d.getHours()) + '-' + p2(d.getMinutes()) + '-' + p2(d.getSeconds());
    }
    function safetyBackupNow() {
      var json = JSON.stringify(state, null, 2);
      if (window.desktop && window.desktop.safetyBackup) {
        return window.desktop.safetyBackup(json).then(function (p) { return p; }).catch(function () { return ''; });
      }
      try { download('bnn-before-import-' + bkStamp() + '.json', json); } catch (e) {}
      return Promise.resolve(L('डाउनलोड फ़ोल्डर', 'Downloads folder'));
    }
    function mergeImport(cur, inc) {
      var byKey = {}, usedRef = {}, maxRef = 0;
      cur.records.forEach(function (r) { byKey[bkKey(r)] = 1; usedRef[r.ref] = 1; if ((r.ref || 0) > maxRef) maxRef = r.ref || 0; });
      var added = 0, dup = 0;
      (inc.records || []).forEach(function (r) {
        if (!r || typeof r !== 'object') return;
        if (byKey[bkKey(r)]) { dup++; return; }
        var nr = JSON.parse(JSON.stringify(r));
        if (usedRef[nr.ref]) { maxRef++; nr.ref = maxRef; }
        usedRef[nr.ref] = 1; if ((nr.ref || 0) > maxRef) maxRef = nr.ref || 0;
        byKey[bkKey(nr)] = 1; cur.records.push(nr); added++;
      });
      var gs = cur.groups || ['परिवार']; (inc.groups || []).forEach(function (g) { if (g && gs.indexOf(g) < 0) gs.push(g); });
      cur.groups = gs;
      cur.nextRef = Math.max(cur.nextRef || 1, maxRef + 1);
      return { added: added, dup: dup };
    }
    function askImportMode(nCur, nInc, done) {
      var old = document.getElementById('impModal'); if (old) old.remove();
      var wrap = document.createElement('div');
      wrap.id = 'impModal';
      wrap.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.55);display:flex;align-items:center;justify-content:center;z-index:9999';
      wrap.innerHTML = '<div style="background:#faf6ee;border:2px solid #d97706;border-radius:14px;max-width:520px;padding:20px 22px;box-shadow:0 18px 50px rgba(0,0,0,.35);font-family:inherit">' +
        '<div style="font-size:18px;font-weight:800;color:#7a4a18;margin-bottom:6px">' + L('बैकअप कैसे खोलें?', 'How should the backup be opened?') + '</div>' +
        '<div style="font-size:14px;color:#3f3627;line-height:1.6;margin-bottom:14px">' +
        L('अभी आपके पास ' + nCur + ' कुंडलियाँ हैं · बैकअप में ' + nInc + ' हैं।<br>पहले आपकी मौजूदा सूची का <b>सुरक्षा-बैकअप</b> बनेगा।', 'You have ' + nCur + ' kundlis · the backup has ' + nInc + '.<br>A <b>safety backup</b> of your current list will be made first.') + '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button id="impMerge" class="btn" style="height:38px;background:#d97706;color:#fff;border-color:#d97706;font-weight:800">' + L('जोड़ें (Merge)', 'Merge') + '</button>' +
        '<button id="impReplace" class="btn" style="height:38px">' + L('पूरी सूची बदलें (Replace)', 'Replace all') + '</button>' +
        '<button id="impCancel" class="btn" style="height:38px;margin-left:auto">' + L('रद्द', 'Cancel') + '</button>' +
        '</div></div>';
      document.body.appendChild(wrap);
      var close = function () { wrap.remove(); };
      wrap.querySelector('#impMerge').onclick = function () { close(); done('merge'); };
      wrap.querySelector('#impReplace').onclick = function () { close(); done('replace'); };
      wrap.querySelector('#impCancel').onclick = function () { close(); done('cancel'); };
      wrap.addEventListener('click', function (e) { if (e.target === wrap) { close(); done('cancel'); } });
    }
    $('fileIn').addEventListener('change', function () {
      var f = this.files && this.files[0]; this.value = '';
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var o;
        try {
          o = JSON.parse(rd.result);
          if (!o || !Array.isArray(o.records)) throw new Error('bad');
        } catch (e) { toast(L('यह बैकअप फ़ाइल ठीक नहीं लगी', 'This backup file seems invalid')); return; }
        askImportMode(state.records.length, o.records.length, function (mode) {
          if (mode === 'cancel') return;
          safetyBackupNow().then(function (bkPath) {
            var msg;
            if (mode === 'merge') {
              var r = mergeImport(state, o);
              msg = L(r.added + ' नई जुड़ीं · ' + r.dup + ' पहले से थीं', r.added + ' added · ' + r.dup + ' already there');
            } else {
              state = o;
              if (!state.groups || !state.groups.length) state.groups = ['परिवार', 'मित्र'];
              if (!(state.nextRef >= 1)) state.nextRef = 1 + state.records.reduce(function (m, r) { return Math.max(m, r.ref || 0); }, 0);
              msg = L('पूरी सूची बदली — ' + state.records.length + ' कुंडलियाँ', 'List replaced — ' + state.records.length + ' kundlis');
            }
            saveState(); renderGroups(); newKundli();
            if (bkPath && bkPath.indexOf('ERR:') !== 0) msg += L(' · सुरक्षा-बैकअप: ', ' · safety backup: ') + bkPath;
            else if (bkPath && bkPath.indexOf('ERR:') === 0) msg += L(' · सुरक्षा-बैकअप नहीं बना', ' · safety backup failed');
            toast('⬆️ ' + msg);
          });
        });
      };
      rd.readAsText(f);
    });

    $('btnPng').addEventListener('click', function () { exportAllChartPng(); });
    $('btnPrint').addEventListener('click', function () { doPrint(); });
    $('btnPdf').addEventListener('click', function () { doPdf(); });
    $('btnLang').addEventListener('click', toggleLang);
    $('btnSettings').addEventListener('click', openSettings);

    $('btnBack').addEventListener('click', function () { showView('form'); });
    $('rBhavaTabs').addEventListener('click', function (ev) { var t = ev.target.closest('.tab'); if (!t || !RESULT) return; RBHAVA_TAB = t.dataset.t; setTabs('rBhavaTabs', RBHAVA_TAB); renderBhava(); });
    $('rPlanetTabs').addEventListener('click', function (ev) { var t = ev.target.closest('.tab'); if (!t || !RESULT) return; RPLANET_TAB = t.dataset.t; setTabs('rPlanetTabs', RPLANET_TAB); renderPlanet(); });
    $('rDashaTabs').addEventListener('click', function (ev) { var t = ev.target.closest('.tab'); if (!t || !RESULT) return; RDASHA_TAB = t.dataset.t; setTabs('rDashaTabs', RDASHA_TAB); renderDasha(); });
    $('rDasha').addEventListener('click', function (ev) {
      if (ev.target && ev.target.id === 'dashRunBtn') { RDASHA_MI = null; RDASHA_BI = null; renderDasha(); return; }
      var tr = ev.target && ev.target.closest ? ev.target.closest('tr') : null;
      if (tr && tr.dataset && tr.dataset.i != null && DASHA_ROW_CLICK) DASHA_ROW_CLICK(+tr.dataset.i);
    });
    function paintStAutoBk() {
      var t = $('stAutoBk'); if (!t) return;
      var tabs = t.querySelectorAll('.tab');
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].dataset.b === String(SETTINGS.autoBackupDays == null ? 7 : SETTINGS.autoBackupDays));
    }
    (function () {
      var ab = $('stAutoBk');
      if (ab) ab.addEventListener('click', function (ev) {
        var t = ev.target.closest('.tab'); if (!t) return;
        SETTINGS.autoBackupDays = +t.dataset.b || 0;
        saveAppSettings(); paintStAutoBk();
      });
      var sb2 = $('btnSettings');
      if (sb2) sb2.addEventListener('click', paintStAutoBk);
    })();
    function maybeAutoBackup() {
      try {
        var days = Number(SETTINGS.autoBackupDays);
        if (!days || !window.desktop || !window.desktop.autoBackup) { paintStAutoBk(); return; }
        var last = Number(SETTINGS.lastAutoBackupMs) || 0;
        if (Date.now() - last < days * 86400000) { paintStAutoBk(); return; }
        window.desktop.autoBackup(JSON.stringify(state, null, 2)).then(function (res) {
          if (res && String(res).indexOf('ERR:') === 0) { toast(L('ऑटो बैकअप नहीं हो सका', 'Auto backup failed')); return; }
          SETTINGS.lastAutoBackupMs = Date.now(); saveAppSettings();
          toast(L('✅ ऑटो बैकअप बन गया (Backup फ़ोल्डर)', '✅ Auto backup created (Backup folder)'));
        });
      } catch (e) {}
      paintStAutoBk();
    }
    setTimeout(function () { try { maybeAutoBackup(); } catch (e) {} }, 2500);
    function paintStChart() {
      var t = $('stChart'); if (!t) return;
      var tabs = t.querySelectorAll('.tab');
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].dataset.c === (SETTINGS.chartDefault || 'north'));
    }
    (function () {
      var sc = $('stChart');
      if (sc) sc.addEventListener('click', function (ev) {
        var t = ev.target.closest('.tab'); if (!t) return;
        SETTINGS.chartDefault = (t.dataset.c === 'south') ? 'south' : 'north';
        saveAppSettings(); paintStChart();
        // सुधार-राउंड 35: चुनाव अब यहीं से — खुली कुंडली का चार्ट तुरंत बदल जाए
        if (RESULT) { RCHART = SETTINGS.chartDefault; renderChart(); }
      });
      var sb = $('btnSettings');
      if (sb) sb.addEventListener('click', paintStChart);
    })();
    $('tabBp').addEventListener('click', function () { if (!RESULT) return; RMODE = 'BP'; setModeTabs(); renderResult(); });
    $('tabAp').addEventListener('click', function () { if (!RESULT) return; RMODE = 'AP'; setModeTabs(); renderResult(); });
    $('btnRPrint').addEventListener('click', function () { doPrint(); });
    $('btnRPdf').addEventListener('click', function () { doPdf(); });
    $('btnRPng').addEventListener('click', function () { exportAllChartPng(); });
    $('btnGocharNow').addEventListener('click', function () { if (RESULT) computeTransitAt(null); });
    if ($('btnTransitMode')) $('btnTransitMode').addEventListener('click', function () { setTransitMode(!RTRANSIT); });
    if ($('tabTr')) $('tabTr').addEventListener('click', function () { setTransitMode(!RTRANSIT); });
    maskDateTimeField($('gocharTime')); maskDateField($('stStart')); maskDateField($('stEnd'));
    bindDtPicker('gocharTime', 'gocharTimeP'); bindDtPicker('stStart', 'stStartP'); bindDtPicker('stEnd', 'stEndP');
    // सुधार-राउंड 20: तारीख़-समय टाइप करते ही caret अगले हिस्से (दिन→महीना→साल→समय) में
    // आगे बढ़ता रहे — डैश/कोलन अपने-आप लगें (user: cursor last में भाग जाता था)
    $('gocharTime').addEventListener('change', function () { if (!RESULT) return; var w = parseWallInput(this.value); if (w) computeTransitAt(w); else if (this.value.trim()) toast(L('तारीख़-समय ऐसे लिखें: 22-01-1980 20:30:00', 'Write date-time like: 22-01-1980 20:30:00')); });
    // सुधार-राउंड 36: तारीख़/समय का कोई भी हिस्सा बदले → गोचर तुरंत नई जगह पर (cursor जहाँ था वहीं)
    var gocharLiveT = null;
    function gocharLive() {
      if (!RESULT) return;
      var w = parseWallInput($('gocharTime').value);
      if (!w) return;
      if (!(w.d >= 1 && w.d <= 31 && w.m >= 1 && w.m <= 12 && w.y >= 1000 && w.y <= 9999 && w.h <= 23 && w.mi <= 59 && w.s <= 59)) return;
      clearTimeout(gocharLiveT);
      gocharLiveT = setTimeout(function () { computeTransitAt(w, { keepField: true }); }, 180);
    }
    $('gocharTime').addEventListener('dtedit', gocharLive);
    $('rStGroups').addEventListener('click', function (ev) { var t = ev.target.closest('.tab'); if (!t || !RESULT) return; RST.group = t.dataset.g; setTabsAttr('rStGroups', 'g', RST.group); syncStModeRow(); runSpecial(); });
    $('rStBirth').addEventListener('click', function (ev) { var t = ev.target.closest('.tab'); if (!t || !RESULT) return; RST.birth = t.dataset.p; setTabsAttr('rStBirth', 'p', RST.birth); runSpecial(); });
    $('rStMode').addEventListener('click', function (ev) { var t = ev.target.closest('.tab'); if (!t || !RESULT || RST.group !== 'sg') return; RST.mode = t.dataset.m; setTabsAttr('rStMode', 'm', RST.mode); runSpecial(); });
    $('btnStFind').addEventListener('click', function () { if (RESULT) runSpecial(); });
    $('btnStPrint').addEventListener('click', function () { doPrint(); });
    $('btnStPdf').addEventListener('click', function () { doPdf(); });
    $('stSave').addEventListener('click', saveSettingsClient);
    $('stClose').addEventListener('click', closeSettings);
    $('settingsModal').addEventListener('mousedown', function (ev) { if (ev.target === this) closeSettings(); });
    document.addEventListener('keydown', function (ev) { if (ev.key !== 'Escape') return; if (!$('settingsModal').hidden) closeSettings(); if (!$('openModal').hidden) closeOpenModal(); if (!$('dataModal').hidden) closeDataModal(); if (!$('groupModal').hidden) closeGroupModal(); });
    $('stLogoBtn').addEventListener('click', function () { $('stLogoFile').click(); });
    $('stLogoFile').addEventListener('change', function () {
      var f = this.files && this.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        if (String(rd.result).length > 400000) { toast(L('लोगो फ़ाइल कुछ बड़ी है — छोटा चित्र चुनें', 'Logo file is a bit large — choose a smaller image')); return; }
        SETTINGS.logo = rd.result; renderStLogo(); toast(L('लोगो चुन लिया — अब सेव करें', 'Logo chosen — now Save'));
      };
      rd.readAsDataURL(f); this.value = '';
    });
    $('stLogoDel').addEventListener('click', function () { SETTINGS.logo = ''; renderStLogo(); toast(L('लोगो हटा दिया — अब सेव करें', 'Logo removed — now Save')); });
    $('stBackup').addEventListener('click', function () {
      download('bnn-kundli-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(state, null, 2));
      toast(L('⬇️ बैकअप फ़ाइल बन गई', '⬇️ Backup file created'));
    });
    $('stFolder').addEventListener('click', openDataModal);
    $('dmBackup').addEventListener('click', function () {
      download('bnn-kundli-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(state, null, 2));
      toast(L('✅ बैकअप फ़ाइल बन गई — सुरक्षित जगह रखें', '✅ Backup file created — keep it somewhere safe'));
    });
    $('dmRestore').addEventListener('click', function () { closeDataModal(); closeSettings(); $('fileIn').click(); });
    $('dataClose').addEventListener('click', closeDataModal);
    $('dataModal').addEventListener('mousedown', function (ev) { if (ev.target === this) closeDataModal(); });
    if (window.desktop && window.desktop.isDesktop) {
      $('dmNoteBrowser').hidden = true;
      $('dmNoteDesktop').hidden = false;
      $('dmFolder').hidden = false;
      $('dmFolder').addEventListener('click', function () { window.desktop.openDataFolder(); });
    }
    applyLang();
    if (location.hash === '#settings') { openSettings(); }
    if (location.hash === '#sugg') { $('fPlace').value = 'Bo'; renderSugg('Bo'); $('fTime').value = '20:30:00'; updateHour12(); }
    if (location.hash === '#demo-png' && state.records.length) {
      openResult(state.records[0]).then(function () {
        setTimeout(function () { if (RESULT) exportAllChartPng(true); }, 1700);
      });
    }
    if (location.hash === '#demo-print' && state.records.length) {
      openResult(state.records[0]).then(function () {
        setTimeout(function () { if (RESULT) { buildPrintSheet(); document.body.classList.add('printing'); } }, 1600);
      });
    }
    if (location.hash === '#demo' && state.records.length) { openResult(state.records[0]); }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
