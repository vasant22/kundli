// tests/bnn-sir-charts.test.js — राउंड 62 (Claude, 30-10-2026): सर के software के 11 चार्ट, 99 ग्रह-पंक्तियाँ (क्रम सहित)।
// KNOWN = अभी न सुलझे अंतर (aspect का क्रम; चार्ट B बुध#/MAR4; दीपक शनि-केतु ≈32°) — इन्हें छोड़कर बाक़ी सब हूबहू मिलनी चाहिए।
import { expect, it } from 'vitest'
import { planetCombinations } from '../src/bnn/combos.js'
const S={mesh:0,vrish:1,mithun:2,kark:3,simha:4,kanya:5,tula:6,vrishchik:7,dhanu:8,makar:9,kumbh:10,meen:11}
const P=(key,s,dm,retro=false)=>{const[d,m]=dm.split('.').map(Number);const lon=S[s]*30+d+m/60;return{key,longitude:lon,rashi:Math.floor(lon/30)%12,degInSign:lon%30,retro:retro||key==='rahu'||key==='ketu'}}
const N={Sun:'sun',Moo:'moon',Mar:'mars',Mer:'mercury',Jup:'jupiter',Ven:'venus',Sat:'saturn',Rah:'rahu',Ket:'ketu'}
const cv=s=>s.split(' ').filter(Boolean).map(x=>N[x]||x.toUpperCase()).join(' ')
const C={
A:['AP',[P('venus','mithun','00.35'),P('mercury','mithun','25.57'),P('sun','kark','12.32'),P('rahu','simha','04.56'),P('mars','simha','24.55'),P('ketu','kumbh','04.56'),P('moon','kumbh','02.31'),P('jupiter','makar','08.25',true),P('saturn','makar','02.30',true)],
 {sun:'Moo Rah',moon:'Ket Mar Mer Sat3',mars:'Sat Jup',mercury:'Sat Jup Sun',jupiter:'Sat Mer Mar',venus:'Moo Ket Mer',saturn:'Mer Mar Rah',rahu:'Sun',ketu:'Moo Ven Jup'}],
B:['AP',[P('ketu','mesh','22.13'),P('mars','kark','10.41'),P('saturn','kumbh','12.32',true),P('moon','makar','06.44'),P('venus','tula','24.13'),P('jupiter','tula','23.38'),P('rahu','tula','22.13'),P('mercury','tula','11.56',true),P('sun','kanya','25.21')],
 {sun:'Mer Mar4 Sat Rah Jup Ven',moon:'Mar Sun',mars:'',mercury:'Sat Sun',jupiter:'Ven Mar Sat10',venus:'Jup Mar Sat10',saturn:'Mer Mar8 Sun',rahu:'Mar4 Sat Mer Sun',ketu:'Sat3'}],
C:['AP',[P('ketu','mesh','20.25'),P('sun','simha','17.41'),P('mars','simha','23.36'),P('mercury','simha','29.12',true),P('jupiter','kanya','12.05'),P('venus','kanya','24.18'),P('rahu','tula','20.25'),P('saturn','vrishchik','14.49'),P('moon','dhanu','17.44')],
 {sun:'Moo Ket Mar Mer Jup',moon:'Sun Ket Mar Mer Sat3 Jup',mars:'Mer Jup Ven',mercury:'Mar Ket Moo Sun Sat10',jupiter:'Ven',venus:'Rah',saturn:'Mar4',rahu:'Ven',ketu:'Moo Sun Mar8'}],
D:['BP',[P('rahu','meen','25.27'),P('sun','meen','23.28'),P('saturn','meen','22.08'),P('mercury','meen','05.54'),P('venus','meen','03.47'),P('mars','mesh','13.40'),P('moon','mithun','29.14'),P('jupiter','simha','02.46',true),P('ketu','kanya','25.27')],
 {sun:'Rah Jup Mar',moon:'Ven Mer Mar4 Sat Sun Rah',mars:'',mercury:'Sat Sun Rah Jup',jupiter:'Rah Sun Sat Mar4 Mer Ven',venus:'Mer Sat Sun Rah Jup',saturn:'Sun Rah Jup Mar',rahu:'Sun Sat Mer Ven Moo',ketu:''}],
a:['AP',[P('ketu','mesh','10.53'),P('jupiter','vrish','07.09',true),P('saturn','kark','21.00'),P('venus','tula','20.02'),P('rahu','tula','10.53'),P('mars','tula','05.23'),P('mercury','kanya','02.40'),P('sun','kanya','20.34'),P('moon','meen','10.19')],
 {jupiter:'Mar8 Mer Sat10 Ven Ket',sun:'Sat3 Mar Rah Ven',moon:'Sun Sat Mar Ket',mars:'Rah Ven',mercury:'Jup Moo Sun Sat3',venus:'Jup Moo Sat',saturn:'Ket',rahu:'Mar Sun Sat3',ketu:'Sat Moo'}],
b:['AP',[P('jupiter','kark','14.26',true),P('moon','simha','19.15'),P('saturn','simha','20.21'),P('rahu','simha','28.13'),P('venus','tula','22.29'),P('mercury','vrishchik','14.02'),P('mars','dhanu','12.54'),P('sun','dhanu','05.27'),P('ketu','kumbh','28.13')],
 {jupiter:'Mer Mar8 Ket Ven',sun:'Mar Moo Sat Rah',moon:'Sat Rah',mars:'Moo Sat Rah',mercury:'Jup Sun Mar',venus:'Ket Mer Jup',saturn:'Rah',rahu:'Sat Moo Mar Sun',ketu:'Ven'}],
c:['AP',[P('mars','vrish','11.24'),P('sun','vrish','27.36'),P('mercury','mithun','11.19',true),P('venus','mithun','14.57'),P('rahu','kark','10.19'),P('jupiter','kanya','07.12'),P('saturn','kanya','09.26'),P('moon','kanya','28.46'),P('ketu','makar','10.19')],
 {jupiter:'Sat Ket Mar Sun Moo',sun:'Moo Sat10 Mer Ven',moon:'Mer Ven',mars:'Sun Moo Sat10 Mer',mercury:'Sat10 Moo Sun Mar',venus:'Rah',saturn:'Ket Mar Sun Moo',rahu:'Ven Mer',ketu:'Sat Jup Mar8'}],
x:['AP',[P('ketu','mesh','10.40'),P('moon','mesh','27.44'),P('jupiter','vrish','06.54',true),P('saturn','kark','21.19'),P('venus','tula','24.55'),P('rahu','tula','10.40'),P('mars','tula','08.06'),P('mercury','kanya','07.19'),P('sun','kanya','24.32')],
 {jupiter:'Mer Moo Ven Sat10 Ket Mar',sun:'Mar Rah Ven',moon:'Jup Mer Mar8 Sun',mars:'Rah Ven Moo Jup',mercury:'Jup Sat3 Sun Mar',venus:'Moo Jup Sat',saturn:'Ket',rahu:'Mar Sun Sat3',ketu:'Sat'}],
y:['AP',[P('mars','vrish','16.20'),P('sun','mithun','04.17'),P('mercury','mithun','08.30',true),P('venus','mithun','23.30'),P('rahu','kark','09.56'),P('jupiter','kanya','07.35'),P('saturn','kanya','09.33'),P('moon','dhanu','22.50'),P('ketu','makar','09.56')],
 {jupiter:'Sat Ket Mar Sun Mer',sun:'Mer Sat10 Moo Ven',moon:'Ven Jup Sat Ket Mar',mars:'Sun Mer Sat10',mercury:'Sun Mar Ket Sat Jup',venus:'Moo Rah',saturn:'Ket Mar Sun Mer',rahu:'Ven',ketu:'Sat Jup Moo Mar8'}],
deepak:['AP',[P('saturn','meen','20.38',true),P('moon','mesh','13.50'),P('ketu','kumbh','22.27'),P('jupiter','makar','20.22'),P('venus','dhanu','14.13'),P('mars','dhanu','09.27'),P('mercury','vrishchik','14.43'),P('sun','tula','27.24'),P('rahu','simha','22.27')],
 {jupiter:'Sat3 Mer Mar4 Sun Ket',sun:'Mer Jup',moon:'Ven Rah Sun Mer',mars:'Moo Ven Rah',mercury:'Jup Mar Moo Ven',venus:'Moo Rah',saturn:'Ket',rahu:'Ven Moo Mar',ketu:'Sat'}],
basant:['AP',[P('moon','meen','12.30'),P('venus','kumbh','14.18'),P('ketu','kumbh','07.10'),P('mercury','makar','08.59'),P('sun','makar','08.09'),P('rahu','simha','07.10'),P('jupiter','simha','15.30',true),P('mars','simha','21.30',true),P('saturn','kanya','03.12',true)],
 {jupiter:'Ven Rah',sun:'Sat Ket',moon:'Mar8 Rah',mars:'Jup Ven Rah',mercury:'Mar Jup Ven Rah',venus:'Jup Mar Mer Sat3 Moo',saturn:'Sun Ket',rahu:'Moo',ketu:'Sat Sun'}]}
const KNOWN = new Set(['B sun', 'B mercury', 'B rahu', 'C moon', 'a rahu', 'deepak saturn', 'deepak ketu'])
it('सर के software की 99 पंक्तियाँ (KNOWN छोड़कर) हूबहू', () => {
  let ok = 0
  for (const [nm, [mode, pl, sir]] of Object.entries(C)) {
    const r = planetCombinations(pl, mode)
    for (const k of Object.keys(sir)) {
      if (KNOWN.has(nm + ' ' + k)) continue
      const got = r[k].list1579.map((e) => (e.type === 'aspect' ? e.label : e.key)).join(' ')
      expect(nm + ' ' + k + ': ' + got).toBe(nm + ' ' + k + ': ' + cv(sir[k]))
      ok++
    }
  }
  expect(ok).toBe(92)
})
