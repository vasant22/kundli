import{c as e}from"./astro-Bb-V9OEA.js";import{a as t}from"./timeutil-D7IgO8sO.js";import{t as n}from"./prefill-DEE8HIZn.js";import{r,t as i}from"./report-C-mIJ_g6.js";function a(e){let t=n(e);if([`day`,`month`,`year`,`hour`,`lat`,`lng`,`tz`].some(e=>t[e]===``||t[e]===void 0))return null;let r={year:Number(t.year),month:Number(t.month),day:Number(t.day),hour:Number(t.hour),minute:Number(t.minute||0),second:Number(t.second||0)};return!Number.isFinite(r.year)||r.year<1800||r.year>2100?null:{p:t,birth:r}}async function o(n,{search:o,pdfHref:s,name:c=``,hindiOnlyNote:l=``,hint:u=``}){let d=a(o);if(!d){n.innerHTML=`<p class="po-note">फलादेश के लिए जन्म-विवरण पूरा भरें।</p>`;return}let{p:f,birth:p}=d,m=t(p,f.tz),h=r(await e(),{utc:m.utc,latitude:Number(f.lat),longitude:Number(f.lng),timeZone:f.tz,local:p,name:f.name||c,gender:f.gender||``,place:f.place||``});n.innerHTML=`<div class="phal">
    <div class="po-head">
      <div><h2 class="po-title">विस्तृत फलादेश</h2>
        <p class="po-sub">${u}</p></div>
      <a class="po-pdf" href="${s}" target="_blank" rel="noopener">📄 PDF सहेजें</a>
    </div>
    ${l?`<p class="po-note">${l}</p>`:``}
    ${i(h)}
  </div>`}export{o as mountPhalOnline};