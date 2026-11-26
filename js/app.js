// De gegevens komen na het inloggen uit de database (zie js/opslag.js).
const CARDS=GEGEVENS.kaarten;
const GIFT={wijn:{short:"Fles rode wijn met Blom-etiket in geschenkdoos, met kurkentrekker en stopper",name:"Fles wijn",img:"img/geschenk-wijn.webp",t:"Kaart + wijn",d:"Fles rode wijn met Blom-etiket in een zwarte geschenkdoos, met kurkentrekker en wijnstopper.",alt:"Wijngeschenk van Blom: zwarte geschenkdoos met fles rode wijn met Blom-etiket, kurkentrekker en wijnstopper"},taart:{short:"Kersttaart voor het hele team, met Blom-opdruk",name:"Taart",img:"img/geschenk-taart.webp",t:"Kaart + taart",d:"Kersttaart met slagroom en de opdruk \"Making spaces for a colourful Christmas\", voor het hele team op de locatie.",alt:"Vierkante kersttaart met slagroomtoefjes, chocolade cadeautjes en een opdruk met Blom-kerstballen en de tekst Making spaces for a colourful Christmas"}};
(()=>{const s=document.createElement("style");s.textContent=Object.entries(GIFT).filter(([,g])=>g.img).map(([k,g])=>`.gimg.${k}{background-image:url("${g.img}")}`).join("");document.head.appendChild(s)})();
const PRIJS=GEGEVENS.prijs,DONATIE=GEGEVENS.donatie;
const eur0=n=>"€\u00a0"+n.toLocaleString("nl-NL",Number.isInteger(Math.round(n*100)/100)?{maximumFractionDigits:0}:{minimumFractionDigits:2,maximumFractionDigits:2});
const eur=n=>"ca. "+eur0(n);
const costOf=c=>c.adv!=="stuur"?0:PRIJS.kaart+(c.gift==="wijn"?PRIJS.wijn:c.gift==="taart"?PRIJS.taart:0);
const LABS=[["Care","#FFB990"],["Hospitality","#F09491"],["Leisure","#91D6AC"],["Student housing","#FED880"],["Smart living","#BFCED6"]];
const LC=Object.fromEntries(LABS);
const labOf=c=>c.seg||"Onbekend";
const LABV=[...LABS.map(l=>l[0]),...(CARDS.some(c=>!c.seg)?["Onbekend"]:[])];
const AMS=[...new Set(CARDS.map(c=>c.am||"Onbekend"))].sort();
// taal van de kaarttekst: afgeleid uit de tekst zelf (ook na een aanpassing), anders het veld taal
const TAALN={NL:"Nederlands",DE:"Duits",EN:"Engels"};
function taalOf(c){const t=String(c.txt||"");if(/\b(im Namen|Sehr geehrte|Liebe[rs]? |Frohe Weihnachten|Herzliche)/i.test(t))return "Duits";if(/\b(on behalf of|Dear |Merry Christmas|Kind regards)/i.test(t))return "Engels";if(/\b(namens|Beste |Geachte |Fijne kerstdagen|Hartelijke groet)/i.test(t))return "Nederlands";return TAALN[c.taal]||"Nederlands"}
const landOf=c=>{const l=String(c.land||"").trim();return l?l.charAt(0).toUpperCase()+l.slice(1):"Nederland"};
const ORDER=v=>v==="Nederland"||v==="Nederlands"?"0":"1"+v;
const vals=fn=>[...new Set(CARDS.map(fn))].sort((a,b)=>ORDER(a).localeCompare(ORDER(b),"nl"));
// nieuwe talen of landen (bijv. via een toegevoegde kaart) staan standaard aan
const SEEN={taal:new Set(),land:new Set()};
function seen(key,list){list.forEach(v=>{if(!SEEN[key].has(v)){SEEN[key].add(v);F[key].add(v)}});return list}
const F={pkg:new Set(["kaart","taart","wijn"]),lab:new Set(LABV),am:new Set(AMS),chg:new Set(),taal:new Set(),land:new Set()};let show=50;
const $=id=>document.getElementById(id);
const esc=t=>String(t??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const addrText=c=>[c.org,c.cp&&!/^Team /.test(c.cp)?c.cp:"",c.adr,[c.pc,c.plaats].filter(Boolean).join(" "),c.land!=="Nederland"?c.land.toUpperCase():""].filter(Boolean).join("\n");
function toast(m){const t=$("toast");t.textContent=m;t.hidden=false;clearTimeout(t._t);t._t=setTimeout(()=>t.hidden=true,2200)}
function copy(text,btn,msg){
  const done=()=>{toast(msg);if(btn){btn.classList.add("ok");if(!btn.classList.contains("ib")){const o=btn.textContent;btn.textContent="gekopieerd";setTimeout(()=>{btn.textContent=o;btn.classList.remove("ok")},1500)}else setTimeout(()=>btn.classList.remove("ok"),1200)}};
  const fb=()=>{const ta=document.createElement("textarea");ta.className="ta";ta.value=text;document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand("copy")}catch(_){}ta.remove();ok?done():toast("Kopiëren lukte niet; selecteer de tekst handmatig.")};
  try{navigator.clipboard.writeText(text).then(done,fb)}catch(_){fb()}
}
const pkgOf=c=>c.adv!=="stuur"?"niet":(c.gift||"kaart");
const amOf=c=>c.am||"Onbekend";
function qOK(c){const q=$("q").value.trim().toLowerCase();return !q||[c.org,c.cp,c.pc,c.plaats,c.adr].join(" ").toLowerCase().includes(q)}
const pass=(c,skip)=>qOK(c)&&(skip==="pkg"||F.pkg.has(pkgOf(c)))&&(skip==="lab"||F.lab.has(labOf(c)))&&(skip==="am"||F.am.has(amOf(c)))&&(skip==="chg"||!F.chg.has("ja")||!!(c._e&&c._e.hist&&c._e.hist.length))&&(skip==="taal"||F.taal.has(taalOf(c)))&&(skip==="land"||F.land.has(landOf(c)));
function boxes(el,key,opts,fn){const R=CARDS.filter(c=>pass(c,key));
  el.innerHTML=opts.map(([v,t,col])=>`<label class="box${col?" lab":""}"${col?` style="--c:${col}"`:""}><input type="checkbox" data-k="${key}" value="${esc(v)}"${F[key].has(v)?" checked":""}>${col?`<i class="sw" style="background:${col}"></i>`:""}${t} <span class="n">${R.filter(c=>fn(c)===v).length}</span></label>`).join("")}
function panel(){seen("taal",vals(taalOf));seen("land",vals(landOf));
  {const R=CARDS.filter(c=>pass(c,"pkg")),n=v=>R.filter(c=>pkgOf(c)===v).length;
   const o=(v,nm)=>`<label class="box"><input type="checkbox" data-k="pkg" value="${v}"${F.pkg.has(v)?" checked":""}><span class="mi ${v}">${IC[v]}</span>${nm} <span class="n">${n(v)}</span></label>`;
   $("fPkg").innerHTML=`<div class="side"><h4>Versturen · <b>${n("kaart")+n("taart")+n("wijn")}</b></h4><div class="row">${o("kaart","Alleen kaart")}${o("taart","Kaart + taart")}${o("wijn","Kaart + wijn")}</div></div><span class="sep"></span><div class="side"><h4>Niet versturen · <b>${n("niet")}</b></h4><div class="row">${o("niet","Geen kaart")}</div></div>`;}
  boxes($("fLab"),"lab",LABV.map(l=>[l,l,LC[l]||"#DEDED8"]),labOf);
  boxes($("fAm"),"am",AMS.map(a=>[a,a]),amOf);
  boxes($("fChg"),"chg",[["ja","Alleen aangepaste kaarten"]],c=>c._e&&c._e.hist&&c._e.hist.length?"ja":"nee");
  boxes($("fTaal"),"taal",vals(taalOf).map(v=>[v,v]),taalOf);
  boxes($("fLand"),"land",vals(landOf).map(v=>[v,v]),landOf);
}
function sel(){return CARDS.filter(c=>pass(c))}
const IB={fs:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',fsx:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',zin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6"/></svg>',zout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 10.5h6"/></svg>',open:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 13h16v7H4z"/><path d="M4 13 7 4h10l3 9"/></svg>',reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v6h6"/><path d="M5.5 15a7 7 0 1 0 1.6-7.3L4 10"/></svg>',copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M8 8h12v12H8z"/><path d="M16 8V4H4v12h4"/></svg>'};
const IC={kaart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 5h18v14H3z"/><path d="m3 6 9 7 9-7"/></svg>',taart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21h16v-9H4z"/><path d="M4 16c2 1.5 4 1.5 5.3 0s4-1.5 5.4 0 4 1.5 5.3 0"/><path d="M12 12V7"/><path d="M12 4.5v.01"/></svg>',wijn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 15v7"/><path d="M7 3h10l-.5 6a4.5 4.5 0 0 1-9 0z"/></svg>',niet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 5h18v14H3z"/><path d="m5 5 14 14"/></svg>'};
function pkg(c){if(c.adv!=="stuur")return `<span class="pkg niet">${IC.niet}Geen kaart</span>`;if(c.gift==="taart")return `<button type="button" class="pkg taart pkgb" data-gift="taart" title="Bekijk de taart">${IC.taart}Kaart + taart<span class="eye">${IB.eye}</span></button>`;if(c.gift==="wijn")return `<button type="button" class="pkg wijn pkgb" data-gift="wijn" title="Bekijk het wijngeschenk">${IC.wijn}Kaart + wijn<span class="eye">${IB.eye}</span></button>`;return `<span class="pkg kaart">${IC.kaart}Alleen kaart</span>`}
function hist(c){const a=c.yrs.includes(2024),b=c.yrs.includes(2025);return a&&b?"in 2024 en 2025":a?"alleen in 2024":b?"alleen in 2025":"nog nooit (nieuw)"}
function tav(n){return String(n).replace(/^t\.a\.v\.?\s+/i,"").replace(/^Das\s+/,"").replace(/^dhr\.?\s+/i,"de heer ").replace(/^mevr\.?\s+/i,"mevrouw ").replace(/^mw\.?\s+/i,"mevrouw ").replace(/^dhr\/mevr\.?\s+/i,"").replace(/\s+/g," ").trim()}
function tavp(c){return /^(Duitsland|Oostenrijk|Zwitserland)$/i.test(c.land||"")?"z. Hd. ":"T.a.v. "}
function pcf(c){const p=String(c.pc||"").trim().toUpperCase();const m=p.match(/^(\d{4})\s*([A-Z]{2})$/);return (!c.land||c.land==="Nederland")&&m?m[1]+" "+m[2]:p}
function envText(c){const cp=c.cp&&!/^Team /.test(c.cp)?c.cp:"";return [c.org,cp?tavp(c)+tav(cp):"",c.adr,pcf(c)+"  "+(c.plaats||"").toUpperCase(),c.land&&c.land!=="Nederland"?c.land.toUpperCase():""].filter(Boolean).join("\n")}
function hwHTML(s){const L=String(s||"").split("\n");if(L.length<4)return esc(s);return `<span class="hwa">${esc(L[0])}</span><span class="hwb">${esc(L.slice(1,-2).join("\n"))}</span><span class="hwc">${esc(L.slice(-2).join("\n"))}</span>`}
function card(c){const i=CARDS.indexOf(c),s=c.adv==="stuur";const cp=c.cp&&!/^Team /.test(c.cp)?c.cp:"";const col=LC[c.seg]||"";
 const UXL=[["org","Waarom deze organisatie"],["cp","Waarom deze contactpersoon"],["meer","Meer kaarten in deze organisatie?"],["gift","Geschenk in deze organisatie?"],["tekst","Waarom deze tekst"]];const ux=s&&c.ux?`<dl class="ux">${UXL.filter(([k])=>c.ux[k]).map(([k,l])=>`<dt>${l}</dt><dd>${esc(c.ux[k])}</dd>`).join("")}</dl>`:"";const bg=[...c.pts.map(p=>`<li>${esc(p)}</li>`),...c.flags.map(f=>`<li class="f">Let op: ${esc(f)}</li>`)];
 const man=f=>c._e&&c._e.cur&&f in c._e.cur;const one=!s?["niet","Waarom geen kaart",man("adv")?"Handmatig op niet versturen gezet (zie wijzigingen).":c.nw]:c.gift?[c.gift,c.gift==="taart"?"Waarom kaart + taart":"Waarom kaart + wijn",man("gift")||!c.giftwhy?"Handmatig toegekend (zie wijzigingen).":c.giftwhy]:["kaart","Waarom een kaart",man("adv")?"Handmatig op versturen gezet (zie wijzigingen).":(c.kw||(c._new?"Handmatig toegevoegd.":""))];
 return `<article class="card${s?"":" niet"}"${col?` style="--c:${col}"`:""}>
  <div class="who">
   <div class="top"><div class="t"><h2>${mk(c,"org",esc(c.org))}</h2>${c.seg?`<span class="lbl"><i></i>Blom ${esc(c.seg)}</span>`:""}</div><div class="pr">${pkg(c)}<span class="price" title="${c.adv!=="stuur"?"Geen kosten":"Excl. btw · kaart "+eur(PRIJS.kaart)+(c.gift?" + "+(c.gift==="wijn"?"wijn":"taart")+" "+eur(PRIJS[c.gift]):"")}">${eur(costOf(c))}</span></div></div>
   <div class="metar"><div class="meta"><span>${s?"Kaart komt van":"Afzender (als je toch stuurt)"} <b>${esc(c.am||"Onbekend")}</b></span><span>Eerder een kaart: <b>${hist(c)}</b></span><span>Taal kaart: <b>${esc(taalOf(c))}</b></span><span>Land bestemming: <b>${mk(c,"land",esc(landOf(c)))}</b></span></div>${CANEDIT?`<button class="edbtn" type="button" data-ed="${i}">${IB.pen}Pas kaart aan</button>`:""}</div>
   ${c._new?`<div class="chgline"><span class="chgtag">+ Toegevoegd</span> <span class="ednote" style="display:inline">door <b ${c._new.naam?"":`data-uid="${esc(c._new.by||"")}"`}>${esc(c._new.naam||"iemand")}</b> op ${fdt(c._new.at)}</span></div>`:""}
   ${c._e&&c._e.hist&&c._e.hist.length?`<div class="chgline"><span class="chgtag">${IB.pen}${c._e.cur&&Object.keys(c._e.cur).length?"Aangepast":"Teruggezet naar origineel"}</span> <span class="ednote" style="display:inline">laatst door <b ${last(c).naam?"":`data-uid="${esc(last(c).by||"")}"`}>${esc(last(c).naam||"iemand")}</b> op ${fdt(last(c).at)}</span></div>`:""}
   <div class="addr" title="Zo komt het adres op de envelop"><div>${mk(c,"org",esc(c.org))}</div>${cp?`<div>${tavp(c)}${mk(c,"cp",esc(tav(cp)))}</div>`:""}<div>${mk(c,"adr",esc(c.adr))}</div><div>${mk(c,"pc",esc(pcf(c)))}&nbsp;&nbsp;${mk(c,"plaats",esc((c.plaats||"").toUpperCase()))}</div>${c.land&&c.land!=="Nederland"?`<div>${mk(c,"land",esc(c.land.toUpperCase()))}</div>`:""}</div>${c.fn&&cp?`<div class="fnl">Functie contactpersoon: ${mk(c,"fn",esc(c.fn))}</div>`:""}
   ${s&&c.gift?`<div class="gcard ${c.gift}"><button type="button" class="gthumb gimg ${c.gift}" data-gift="${c.gift}" aria-label="Bekijk ${c.gift==="wijn"?"het wijngeschenk":"de taart"} groot"></button><div class="gtx2"><span class="gk2">Geschenk</span><b>${GIFT[c.gift].name}</b><span class="gd2">${esc(GIFT[c.gift].short)}</span></div><button type="button" class="gbtn" data-gift="${c.gift}">${IB.eye}Bekijk</button></div><p class="why1 ${c.gift}"><b>${one[1]}:</b> ${esc(one[2])}</p>`:one?`<p class="why1 ${one[0]}"><b>${one[1]}:</b> ${esc(one[2])}</p>`:""}
   ${histHTML(c)}
   ${bg.length||ux?`<details class="more2"><summary>Toelichting en achtergrond${c.flags.length?` <span class="wf">· ${c.flags.length} let op</span>`:""}</summary>${ux}${bg.length?`<div class="uxh">Gegevens</div><ul>${bg.join("")}</ul>`:""}</details>`:""}
  </div>
  <div class="greet"><div class="scene" data-s="${i}" title="Sleep om te draaien, klik om open of dicht te klappen" aria-label="3D-voorbeeld van de kaart">${s&&c.gift?`<div class="gv gimg ${c.gift}">${GIFT[c.gift].img?"":`<span class="ph">${IC.taart}<small>Het ontwerp van de taart volgt</small></span>`}</div>`:""}<span class="shadow"></span><div class="c3"><div class="pan base"><div class="face inbot"><div class="hwbox"><p class="hw">${hwHTML(c.txt)}</p></div></div><div class="face back"></div></div><div class="pan cover"><div class="face front"></div><div class="face intop"><p class="tfa">Deze kerst heeft Blom als duurzaam gebaar bomen geplant via Trees<br>for All, een organisatie erkend door het CBF. De helft van deze bomen is<br>geplant in Nederland, en de andere helft wereldwijd. Waarom? Omdat<br>klimaatverandering geen grenzen kent. Met deze groene stap creëren<br>wij duurzame ruimtes voor iedereen.<br><b>Plant jij ook mee?!</b></p></div></div></div>
   <div class="vw"><button type="button" data-v="tekst" aria-pressed="true">Lees tekst</button><button type="button" data-v="binnen">Binnenkant</button><button type="button" data-v="voor">Voorkant</button><button type="button" data-v="achter">Achterkant</button>${s&&c.gift?`<button type="button" data-v="gift" class="vgift">${c.gift==="wijn"?"Wijn":"Taart"}</button>`:""}</div><div class="tb"><div class="pz" role="group" aria-label="Binnenkant"><button type="button" data-pan="0.5" aria-pressed="false" title="Lees de bovenzijde (Trees for All)">▲ Boven</button><button type="button" data-pan="-0.5" aria-pressed="false" title="Lees de handgeschreven tekst">▼ Tekst</button></div><button class="ib" type="button" data-zi="${i}" title="Inzoomen" aria-label="Inzoomen">${IB.zin}</button><button class="ib" type="button" data-zo="${i}" title="Uitzoomen" aria-label="Uitzoomen">${IB.zout}</button><button class="ib" type="button" data-fs title="Volledig scherm" aria-label="Volledig scherm">${IB.fs}</button><span class="tsep"></span><button class="ib" type="button" data-t="${i}" title="Kopieer tekst" aria-label="Kopieer tekst">${IB.copy}</button></div>
   <span class="cnt">${c.taal!=="NL"?esc(c.taal)+" · ":""}${c.txt.length}/550</span></div></div>
 </article>`}
function budget(L){const all=CARDS.filter(c=>c.adv==="stuur");const nk=all.length,nw=all.filter(c=>c.gift==="wijn").length,nt=all.filter(c=>c.gift==="taart").length;
 const tot=nk*PRIJS.kaart+nw*PRIJS.wijn+nt*PRIJS.taart+DONATIE;const st=L.reduce((s,c)=>s+costOf(c),0);
 $("budget").innerHTML=`<div class="in"><span class="h">Begroting <span style="text-transform:none;letter-spacing:0;font-weight:400">(circa, excl. btw)</span></span>
 <span class="it"><small>${nk} kaarten × ${eur0(PRIJS.kaart)} (incl. handgeschreven envelop)</small><b>${eur(nk*PRIJS.kaart)}</b></span>
 <span class="it"><small>${nt} taarten × ${eur0(PRIJS.taart)}</small><b>${eur(nt*PRIJS.taart)}</b></span>
 <span class="it"><small>${nw} flessen wijn × ${eur0(PRIJS.wijn)}</small><b>${eur(nw*PRIJS.wijn)}</b></span>
 <span class="it"><small>Donatie Trees for All</small><b>${eur(DONATIE)}</b></span>
 <span class="it tot"><small>Totaal excl. btw${Math.abs(st+DONATIE-tot)>0.005?` · kaarten en geschenken in deze selectie ${eur(st)}`:""}</small><b>${eur(tot)}</b></span></div>`}
function render(){panel();const L=sel();budget(L);
  const P={kaart:"alleen kaart",taart:"kaart + taart",wijn:"kaart + wijn",niet:"geen kaart"};
  const pk=[...F.pkg].map(k=>P[k]).join(", ")||"niets aangevinkt";
  const lb=F.lab.size===LABV.length?"alle labels":(!F.lab.has("Care")&&F.lab.size===LABV.length-1)?"alles behalve Care":F.lab.size?[...F.lab].join(", "):"geen label";
  const af=F.am.size===AMS.length?"alle afzenders":F.am.size?[...F.am].join(", "):"geen afzender";
  const sub=(k,w)=>F[k].size>=SEEN[k].size?"":F[k].size?" · "+w+" "+[...F[k]].join(", "):" · geen "+w;
  $("now").innerHTML=`Je ziet nu <b>${L.length} relatie${L.length===1?"":"s"}</b> · ${pk} · ${lb} · ${af}${sub("taal","taal")}${sub("land","land")}`;
  $("list").innerHTML=L.length?L.slice(0,show).map(card).join(""):`<p class="empty">Geen relaties in deze selectie.</p>`;
  const m=$("more");m.hidden=L.length<=show;m.textContent=`Toon meer (${L.length-show} over)`;fitAll();fillNames()}
function fit(p){p.style.fontSize="";let s=parseFloat(getComputedStyle(p).fontSize);while(s>5&&p.scrollHeight>p.clientHeight+1){s-=.25;p.style.fontSize=s+"px"}}
function fitAll(){requestAnimationFrame(()=>{document.querySelectorAll(".hw").forEach(fit);document.querySelectorAll(".scene").forEach(sc=>{const c3=sc.querySelector(".c3");if(!sc.dataset.init||c3.classList.contains("tekst")){const first=!sc.dataset.init;sc.dataset.init="1";if(first)c3.classList.add("drag");textView(sc);if(first)requestAnimationFrame(()=>requestAnimationFrame(()=>c3.classList.remove("drag")))}})})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitAll);
window.addEventListener("resize",()=>{clearTimeout(window._ft);window._ft=setTimeout(fitAll,200)});
const ZS=[1,1.35,1.7,2.05,2.6,3.2];
function setZoom(sc,z,keep){const c3=sc.querySelector(".c3");if(!keep)c3.classList.remove("tekst");c3.dataset.z=z;c3.style.setProperty("--z",z);sc.querySelector("[data-zi]").disabled=z>=ZS[ZS.length-1]&&!keep;sc.querySelector("[data-zo]").disabled=z<=ZS[0];setTimeout(()=>fit(sc.querySelector(".hw")),520)}
const VIEWS={voor:{d:true,rx:6,ry:-8,z:1.35},binnen:{d:false,rx:7,ry:-5,z:1,plat:true},achter:{d:true,rx:6,ry:172,z:1.35}};
function textView(sc){sc.classList.remove("showgift");const c3=sc.querySelector(".c3"),hw=sc.querySelector(".hw"),box=hw.parentElement;c3.classList.remove("dicht");
 const W=c3.offsetWidth,H=W*.7095,z0=+(c3.dataset.z||1.7);const x=box.offsetLeft+hw.offsetLeft,y=box.offsetTop+hw.offsetTop,w=hw.offsetWidth,h=hw.offsetHeight;
 const sw=sc.clientWidth,sh=sc.clientHeight;const k=Math.min(sw*.9/w,(sh-40)*.88/h);const z=Math.min(4.2,z0*k),K=z/z0;
 const cx=(x+w/2)*K,cy=H*K+(y+h/2)*K;const tx=W*K/2-cx,ty=H*K-cy+16;
 c3.style.setProperty("--tx",tx+"px");c3.style.setProperty("--ty",ty+"px");setZoom(sc,z,true);c3.classList.add("tekst");markView(sc,"tekst");prs(sc,-0.5)}
function reView(sc){const c3=sc.querySelector(".c3"),v=(sc.querySelector(".vw [aria-pressed=true]")||{}).dataset;if(sc.classList.contains("showgift"))return;if(c3.classList.contains("tekst")){const top=sc.querySelector("[data-pan='0.5'][aria-pressed=true]");top?topView(sc):textView(sc)}}
function toggleFs(sc,off){const on=off?false:!sc.classList.contains("fs");document.querySelectorAll(".scene.fs").forEach(s=>{if(s!==sc){s.classList.remove("fs");setFsBtn(s,false)}});sc.classList.toggle("fs",on);document.body.classList.toggle("fsopen",on);setFsBtn(sc,on);requestAnimationFrame(()=>requestAnimationFrame(()=>{reView(sc);fit(sc.querySelector(".hw"))}))}
function setFsBtn(sc,on){const b=sc.querySelector("[data-fs]");if(!b)return;b.innerHTML=on?IB.fsx:IB.fs;b.title=b.ariaLabel=on?"Sluit volledig scherm":"Volledig scherm"}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){const s=document.querySelector(".scene.fs");if(s)toggleFs(s,true)}});
function prs(sc,v){sc.querySelectorAll("[data-pan]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.pan===v)))}
function topView(sc){sc.classList.remove("showgift");const c3=sc.querySelector(".c3"),el=sc.querySelector(".tfa");c3.classList.remove("dicht");c3.classList.add("plat");
 const W=c3.offsetWidth,H=W*.7095,z0=+(c3.dataset.z||1.7);const a=W*.175,x=el.offsetLeft-a,y=el.offsetTop-H*.04,w=el.offsetWidth+a,h=el.offsetHeight+H*.08;
 const sw=sc.clientWidth,sh=sc.clientHeight;const k=Math.min(sw*.9/w,(sh-40)*.85/h);const z=Math.min(8,z0*k),K=z/z0;
 const cx=(x+w/2)*K,cy=(y+h/2)*K;const tx=W*K/2-cx,ty=H*K-cy+4;
 c3.classList.add("drag");c3.style.setProperty("--tx",tx+"px");c3.style.setProperty("--ty",ty+"px");setZoom(sc,z,true);c3.classList.add("tekst");
 const r=el.getBoundingClientRect(),s=sc.getBoundingClientRect();const f=r.width/el.offsetWidth,dx=(s.left+s.width/2+a/2*f)-(r.left+r.width/2),dy=(s.top+(s.height-40)/2+4)-(r.top+r.height/2);
 c3.style.setProperty("--tx",(tx+dx)+"px");c3.style.setProperty("--ty",(ty+dy)+"px");void c3.offsetWidth;c3.classList.remove("drag");markView(sc,"binnen");prs(sc,0.5)}
function view(sc,v){sc.classList.toggle("showgift",v==="gift");if(v==="gift")return markView(sc,"gift");if(v==="tekst")return textView(sc);const c3=sc.querySelector(".c3"),p=VIEWS[v];c3.classList.toggle("dicht",p.d);c3.classList.toggle("plat",!!p.plat);setPan(sc,0);setRot(c3,p.rx,p.ry);setZoom(sc,p.z);markView(sc,v)}
function markView(sc,v){if(v)sc.classList.toggle("vbinnen",v==="binnen");sc.querySelectorAll(".vw [data-v]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===v)))}
function zoom(sc,dir){const c3=sc.querySelector(".c3");const cur=+(c3.dataset.z||1.7);let k=ZS.indexOf(cur);if(k<0){k=ZS.findIndex(v=>v>=cur);if(k<0)k=ZS.length;if(dir>0)k-=1}c3.classList.remove("tekst");markView(sc,"");k=Math.max(0,Math.min(ZS.length-1,k+dir));const z=ZS[k];c3.dataset.z=z;c3.style.setProperty("--z",z);if(c3.classList.contains("plat")){const f=+(c3.dataset.fy||0);if(z===1)setPan(sc,0);else if(f===0)setPan(sc,-0.5)}
  sc.querySelector("[data-zi]").disabled=k===ZS.length-1;sc.querySelector("[data-zo]").disabled=k===0;setTimeout(()=>fit(sc.querySelector(".hw")),520)}
let drag=null;
function setPan(sc,fy,fx){const c3=sc.querySelector(".c3");fx=fx||0;c3.dataset.fy=fy;c3.style.setProperty("--fy",fy);c3.dataset.fx=fx;c3.style.setProperty("--fx",fx);sc.querySelectorAll("[data-pan]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.pan===fy)))}
function pan(sc,fy){if(fy>0)return topView(sc);textView(sc);markView(sc,"binnen");return;const c3=sc.querySelector(".c3");const zt=fy>0?2.6:1.7;if(+(c3.dataset.z||1)<zt){c3.dataset.z=zt;c3.style.setProperty("--z",zt);sc.querySelector("[data-zi]").disabled=false;sc.querySelector("[data-zo]").disabled=false}setPan(sc,fy)}
const setRot=(c3,rx,ry)=>{c3.style.setProperty("--rx",rx+"deg");c3.style.setProperty("--ry",ry+"deg");c3.dataset.rx=rx;c3.dataset.ry=ry};
$("list").addEventListener("pointerdown",e=>{if(e.target.closest(".tb,.vw"))return;const sc=e.target.closest(".scene");if(!sc)return;const c3=sc.querySelector(".c3");
  c3.classList.remove("tekst");drag={sc,c3,x:e.clientX,y:e.clientY,rx:+(c3.dataset.rx??14),ry:+(c3.dataset.ry??-14),fy:+(c3.dataset.fy||0),fx:+(c3.dataset.fx||0),pn:c3.classList.contains("plat")&&!c3.classList.contains("dicht")&&+(c3.dataset.z||1)>1,moved:false};c3.classList.add("drag");sc.setPointerCapture(e.pointerId)});
$("list").addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;
  if(drag.pn){const h=drag.c3.offsetWidth*.7095;const f=Math.max(-.62,Math.min(.62,drag.fy+dy/h)),g=Math.max(-.5,Math.min(.5,drag.fx+dx/drag.c3.offsetWidth));drag.c3.dataset.fy=f;drag.c3.style.setProperty("--fy",f);drag.c3.dataset.fx=g;drag.c3.style.setProperty("--fx",g);drag.sc.querySelectorAll("[data-pan]").forEach(b=>b.setAttribute("aria-pressed",String(Math.abs(+b.dataset.pan-f)<.08)));return}
  setRot(drag.c3,Math.max(-75,Math.min(75,drag.rx-dy*.45)),drag.ry+dx*.45)});
$("list").addEventListener("pointerup",e=>{if(!drag)return;drag.c3.classList.remove("drag");if(!drag.moved){drag.c3.classList.toggle("dicht");markView(drag.sc,drag.c3.classList.contains("dicht")?"voor":"binnen")}else markView(drag.sc,"");drag=null});
$("list").addEventListener("pointercancel",()=>{if(drag){drag.c3.classList.remove("drag");drag=null}});

/* ---- aanpassingen: gedeeld opgeslagen per kaart, met geschiedenis ---- */
const STATIC=CARDS.map(c=>JSON.parse(JSON.stringify(c)));const BASE=STATIC.map(c=>JSON.parse(JSON.stringify(c)));let NIEUW={},MODE="edit";
const EF=[["adv","Versturen"],["gift","Geschenk"],["cp","Contactpersoon"],["fn","Functie"],["org","Organisatie"],["adr","Adres"],["pc","Postcode"],["plaats","Plaats"],["land","Land"],["txt","Handgeschreven tekst"]];
const EFL=Object.fromEntries(EF);
let EDITS={},DB=null,UQ=null,ME=null,CANEDIT=false,NAMES={},CURI=-1;
const fv=(f,v)=>f==="adv"?(v==="niet"?"Niet versturen":"Versturen"):f==="gift"?({taart:"Taart",wijn:"Fles wijn"}[v]||"Geen"):(v||"(leeg)");
const fdt=ms=>{try{return new Date(ms).toLocaleString("nl-NL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}catch(_){return""}};
const last=c=>c._e.hist[c._e.hist.length-1];
function mk(c,f,html){if(!(c._e&&c._e.cur&&f in c._e.cur))return html;const b=BASE[CARDS.indexOf(c)];return `<span class="chg" title="Aangepast. Origineel: ${esc(b[f]||"(leeg)")}">${html}</span>`}
function histHTML(c){if(!(c._e&&c._e.hist&&c._e.hist.length))return "";const i=CARDS.indexOf(c);const H=c._e.hist;
 return `<details class="hist"><summary>Wijzigingen · ${H.length}</summary><ol>${H.map((h,k)=>({h,k})).reverse().map(({h,k})=>`<li><div class="hh"><span><b ${h.naam?"":`data-uid="${esc(h.by||"")}"`}>${esc(h.naam||"iemand")}</b> · ${fdt(h.at)}</span>${CANEDIT?`<button type="button" class="lnkb" data-undo="${i}:${k}">zet deze wijziging terug</button>`:""}</div>${h.note?`<div class="note">${esc(h.note)}</div>`:""}<table>${(h.changes||[]).map(ch=>`<tr><td>${esc(EFL[ch.f]||ch.f)}</td><td><del>${esc(fv(ch.f,ch.from)).slice(0,160)}</del> → <ins>${esc(fv(ch.f,ch.to)).slice(0,160)}</ins></td></tr>`).join("")}</table></li>`).join("")}</ol></details>`}
async function fillNames(){if(!UQ)return;const els=[...document.querySelectorAll("[data-uid]")];const ids=[...new Set(els.map(e=>e.dataset.uid).filter(Boolean))];if(!ids.length)return;
 let ps={};try{ps=await UQ.profiles(ids)}catch(_){}
 els.forEach(e=>{const p=ps[e.dataset.uid];e.textContent=(p&&p.name)||(p&&p.isMe?"jij":"iemand")})}
function newCard(id,d){return {id,org:d.org||"",cp:d.cp||"",fn:d.fn||"",adr:d.adr||"",pc:d.pc||"",plaats:d.plaats||"",land:d.land||"Nederland",taal:"NL",key:"",loc:"",yrs:[],taart:false,flags:[],cat:"P",seg:d.seg||"Care",am:d.am||"",why:"",txt:d.txt||"",fromcard:0,adv:d.adv||"stuur",gift:d.gift||"",giftwhy:"",nw:"",pts:d.note?["Toelichting bij toevoegen: "+d.note]:[],_new:{by:d.by||"",naam:d.naam||"",at:d.at||0}}}
function rebuild(){const add=Object.entries(NIEUW).filter(([,d])=>!d.deleted).sort((a,b)=>(a[1].at||0)-(b[1].at||0)).map(([id,d])=>newCard(id,d));
 BASE.length=0;STATIC.forEach(c=>BASE.push(JSON.parse(JSON.stringify(c))));add.forEach(c=>BASE.push(JSON.parse(JSON.stringify(c))));
 while(CARDS.length<BASE.length)CARDS.push({});CARDS.length=BASE.length;applyEdits()}
function applyEdits(){CARDS.forEach((c,i)=>{const b=BASE[i],e=EDITS[b.id];for(const k of Object.keys(c))delete c[k];Object.assign(c,JSON.parse(JSON.stringify(b)),e&&e.cur?e.cur:{});c._e=e||null})}
function setR(f,n,v){f.querySelectorAll(`input[name="${n}"]`).forEach(r=>r.checked=r.value===v)}
let NAAM="";function getNaam(){if(NAAM)return NAAM;try{return localStorage.getItem("kk26-naam")||""}catch(_){return ""}}
function setNaam(n){NAAM=n;try{localStorage.setItem("kk26-naam",n)}catch(_){}}
function openEd(i){const c=CARDS[i],b=BASE[i];CURI=i;MODE="edit";const dl=$("dlg");dl.classList.remove("add");dl.classList.toggle("cannew",!!c._new);$("eSave").textContent="Wijziging opslaan";const f=$("edf");$("dlgT").textContent="Pas kaart aan";$("dlgS").textContent=b.org+(b.cp&&!/^Team /.test(b.cp)?" · "+b.cp:"");
 setR(f,"adv",c.adv);setR(f,"gift",c.gift||"");["cp","fn","org","adr","pc","plaats","land","txt"].forEach(k=>f[k].value=c[k]||"");f.note.value="";f.naam.value=getNaam();$("eErr").textContent="";
 f.querySelectorAll(".orig").forEach(o=>{const k=o.dataset.o;o.textContent=(c._e&&c._e.cur&&k in c._e.cur)?"Origineel: "+fv(k,b[k]).slice(0,120):""});
 syncEd();$("dlg").showModal()}
// Natascha Waanders ondertekent namens het team, zonder eigen naam op de kaart
function afsluiting(am){return am==="Natascha Waanders"?"Namens het hele team van Blom":am+", namens het hele team van Blom"}
function syncEd(e){const f=$("edf");if(MODE==="add"&&e&&e.target&&e.target.name==="am"){f.txt.value=f.txt.value.replace(/\n[^\n]*[Nn]amens het hele team van Blom\s*$/,"\n"+afsluiting(f.am.value))}$("eGift").classList.toggle("dis",f.adv.value!=="stuur");const n=f.txt.value.length;const cc=$("eCC");cc.textContent=n+" / 550 tekens";cc.classList.toggle("over",n>550)}
async function writeEdit(i,vals,note,naam){const b=BASE[i],c=CARDS[i];if(vals.adv!=="stuur")vals.gift="";
 const changes=[];EF.forEach(([f])=>{const a=(c[f]??"")+"",z=(vals[f]??"")+"";if(a!==z)changes.push({f,from:a,to:z})});
 if(!changes.length)return "none";
 const prev=EDITS[b.id];const cur={...(prev&&prev.cur?prev.cur:{})};changes.forEach(ch=>{if(ch.to===((b[ch.f]??"")+""))delete cur[ch.f];else cur[ch.f]=ch.to});
 const hist=[...(prev&&prev.hist?prev.hist:[]),{at:Date.now(),by:ME||"",naam:naam||"",note:note||"",changes}].slice(-60);
 await DB.doc("wijz/"+b.id).set({cur,hist,at:Date.now(),by:ME||"",naam:naam||""});return "ok"}
function openAdd(){MODE="add";CURI=-1;const dl=$("dlg"),f=$("edf");dl.classList.add("add");dl.classList.remove("cannew");$("dlgT").textContent="Kaart toevoegen";$("dlgS").textContent="Een nieuwe relatie die dit jaar een kaart krijgt";$("eSave").textContent="Kaart toevoegen";
 f.seg.innerHTML=LABS.map(l=>`<option>${l[0]}</option>`).join("");f.am.innerHTML=AMS.filter(a=>a!=="Onbekend").map(a=>`<option>${esc(a)}</option>`).join("");
 setR(f,"adv","stuur");setR(f,"gift","");["cp","fn","org","adr","pc","plaats"].forEach(k=>f[k].value="");f.land.value="Nederland";f.note.value="";f.naam.value=getNaam();
 f.txt.value="Beste ,\n\nFijne kerstdagen en een gezond en voorspoedig 2027 gewenst!\nHartelijke groet,\n"+afsluiting(f.am.value);
 f.querySelectorAll(".orig").forEach(o=>o.textContent="");$("eErr").textContent="";syncEd();dl.showModal();f.org.focus()}
$("addBtn").onclick=openAdd;
$("lbX").onclick=()=>$("lb").close();$("lb").addEventListener("click",e=>{if(e.target.id==="lb")$("lb").close()});
$("eDel").onclick=async()=>{const c=CARDS[CURI];if(!c||!c._new)return;try{const naam=$("edf").naam.value.trim()||getNaam();if(!naam){$("eErr").textContent="Vul je naam in.";return}setNaam(naam);await DB.doc("nieuw/"+c.id).update({deleted:true,deletedAt:Date.now(),deletedBy:ME||"",deletedNaam:naam});$("dlg").close();toast("Kaart verwijderd")}catch(_){$("eErr").textContent="Verwijderen lukte niet."}};
$("edf").addEventListener("input",e=>{if(e.target.classList)e.target.classList.remove("bad");syncEd(e)});$("edf").addEventListener("change",syncEd);
$("eCancel").onclick=()=>$("dlg").close();
$("edf").addEventListener("submit",async e=>{e.preventDefault();const f=$("edf");if(f.txt.value.length>550){$("eErr").textContent="De tekst is langer dan 550 tekens.";return}
 const vals={adv:f.adv.value,gift:f.gift.value};["cp","fn","org","adr","pc","plaats","land","txt"].forEach(k=>vals[k]=f[k].value.trim());
 f.querySelectorAll(".bad").forEach(x=>x.classList.remove("bad"));
 const naam=f.naam.value.trim();const miss=[];const need=f.adv.value==="stuur"?[["org","organisatie"],["cp","contactpersoon"],["adr","straat en huisnummer"],["pc","postcode"],["plaats","plaats"],["land","land"],["txt","handgeschreven tekst"]]:[];
 need.forEach(([k,l])=>{if(!f[k].value.trim()){miss.push(l);f[k].classList.add("bad")}});
 if(MODE==="add"&&!f.org.value.trim()&&!miss.includes("organisatie")){miss.unshift("organisatie");f.org.classList.add("bad")}
 if(f.adv.value==="stuur"&&f.txt.value.trim()&&/^Beste\s*,/m.test(f.txt.value)){miss.push("de naam in de aanhef");f.txt.classList.add("bad")}
 const pcv=f.pc.value.trim();if(f.adv.value==="stuur"&&pcv&&/^(nederland)?$/i.test(f.land.value.trim())&&!/^\d{4}\s?[A-Za-z]{2}$/.test(pcv)){miss.push("een geldige Nederlandse postcode (1234 AB)");f.pc.classList.add("bad")}
 if(!naam){miss.push("je eigen naam");f.naam.classList.add("bad")}
 if(miss.length){$("eErr").textContent="Nog invullen: "+miss.join(", ")+".";const fb=f.querySelector(".bad");if(fb)fb.focus();return}
 setNaam(naam);
 const btn=$("eSave");btn.disabled=true;$("eErr").textContent="";
 if(MODE==="add"){
  try{if(vals.adv!=="stuur")vals.gift="";const id="n"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);await DB.doc("nieuw/"+id).set({...vals,seg:f.seg.value,am:f.am.value,note:f.note.value.trim(),naam,at:Date.now(),by:ME||""});$("dlg").close();toast("Kaart toegevoegd")}
  catch(err){$("eErr").textContent=err&&err.code==="invalid_argument"?"Je hebt geen rechten om kaarten toe te voegen.":"Toevoegen lukte niet. Probeer het zo nog eens."}finally{btn.disabled=false}return}
 try{const r=await writeEdit(CURI,vals,f.note.value.trim(),naam);$("dlg").close();toast(r==="none"?"Geen wijzigingen":"Wijziging opgeslagen")}
 catch(err){$("eErr").textContent=err&&err.code==="invalid_argument"?"Je hebt geen rechten om aanpassingen op te slaan.":err&&err.code==="quota_exceeded"?"De opslag is vol; neem contact op met de eigenaar.":"Opslaan lukte niet. Probeer het zo nog eens."}
 finally{btn.disabled=false}});
let UNDO=null;function undo(i,k){const c=CARDS[i],h=c._e.hist[k];UNDO=[i,k];const d=$("nd");$("ndS").textContent=`Je zet de wijziging van ${h.naam||"iemand"} van ${fdt(h.at)} terug bij ${BASE[i].org}. De velden krijgen weer de waarde van vóór die wijziging.`;$("ndN").value=getNaam();$("ndE").textContent="";d.showModal();setTimeout(()=>$("ndN").focus(),30)}
async function doUndo(){const naam=$("ndN").value.trim();if(!naam){$("ndE").textContent="Vul je naam in.";return}setNaam(naam);const [i,k]=UNDO;const c=CARDS[i],h=c._e.hist[k];$("ndOk").disabled=true;const vals={};EF.forEach(([f])=>vals[f]=c[f]??"");(h.changes||[]).forEach(ch=>vals[ch.f]=ch.from);
 try{const r=await writeEdit(i,vals,"Teruggezet: wijziging van "+(h.naam||"iemand")+" op "+fdt(h.at),naam);$("nd").close();toast(r==="none"?"Niets om terug te zetten: de kaart is al gelijk aan vóór die wijziging":"Wijziging teruggezet")}catch(err){$("ndE").textContent=err&&err.code==="invalid_argument"?"Je hebt geen rechten om aanpassingen op te slaan.":"Terugzetten lukte niet. Probeer het zo nog eens."}finally{$("ndOk").disabled=false}}
document.addEventListener("click",e=>{if(e.target.closest("#ndOk"))doUndo();if(e.target.closest("#ndX"))$("nd").close()});document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target&&e.target.id==="ndN"){e.preventDefault();doUndo()}});
// Opslag van aanpassingen: in Claude de database van de artifact, daarbuiten Supabase (js/opslag.js) na inloggen.
function stopOpslag(){DB=null;UQ=null;ME=null;CANEDIT=false;NIEUW={};EDITS={};$("addBtn").hidden=true;rebuild();render()}
async function startOpslag(db,u){try{UQ=u;if(!db)return;DB=db;
 if(u){ME=await u.id();const w=await u.can("data.write");CANEDIT=w!==false}else CANEDIT=true;
 let first=true;const tm=setTimeout(()=>toast("Aanpassingen konden nog niet worden geladen."),10000);
 db.collection("nieuw").onSnapshot(s=>{NIEUW={};s.docs.forEach(d=>{NIEUW[d.id]=d.data()});rebuild();render()},()=>{});
 if(CANEDIT)$("addBtn").hidden=false;
 db.collection("wijz").onSnapshot(s=>{if(!s.metadata.fromCache)clearTimeout(tm);EDITS={};s.docs.forEach(d=>{EDITS[d.id]=d.data()});applyEdits();render();first=false},
  err=>{clearTimeout(tm);if(err&&err.code!=="revoked")toast("Aanpassingen zijn tijdelijk niet beschikbaar.")});
 render()}catch(_){}}
if(window.claude)(async()=>{try{const [db,u]=await Promise.all([claude.use("db"),claude.use("user")]);startOpslag(db,u)}catch(_){}})();
else if(window.KERST)KERST.koppel(startOpslag);
const reset=()=>{show=50;render()};
document.querySelector(".panel").addEventListener("click",e=>{const b=e.target.closest("[data-alls]");if(!b)return;const k=b.dataset.alls;F[k]=b.dataset.v==="1"?new Set(SEEN[k]):new Set();reset()});
document.querySelector(".panel").addEventListener("change",e=>{const i=e.target;if(!i.dataset||!i.dataset.k)return;const s=F[i.dataset.k];i.checked?s.add(i.value):s.delete(i.value);reset()});
$("qLab").onclick=e=>{const b=e.target.closest("[data-lab]");if(!b)return;const v=b.dataset.lab;F.lab=new Set(v==="all"?LABV:v==="care"?["Care"]:LABV.filter(l=>l!=="Care"));reset()};
document.querySelector("#fAm").closest(".grp").querySelector(".quick").onclick=e=>{const b=e.target.closest("[data-all]");if(!b)return;F.am=b.dataset.all==="1"?new Set(AMS):new Set();reset()};
$("q").oninput=reset;
$("more").onclick=()=>{show+=100;render()};
$("list").onclick=e=>{const a=e.target.closest("[data-a]"),t=e.target.closest("[data-t]");
  if(a)copy(addrText(CARDS[+a.dataset.a]),a,"Adres gekopieerd");
  if(t)copy(CARDS[+t.dataset.t].txt,t,"Kerstgroet gekopieerd");
  const o=e.target.closest("[data-o]"),r=e.target.closest("[data-r]");
  const zi=e.target.closest("[data-zi]"),zo=e.target.closest("[data-zo]");
  const pb=e.target.closest("[data-pan]");if(pb)pan(pb.closest(".scene"),+pb.dataset.pan);const fsb=e.target.closest("[data-fs]");if(fsb)toggleFs(fsb.closest(".scene"));if(zi)zoom(zi.closest(".scene"),1);if(zo)zoom(zo.closest(".scene"),-1);
  if(o)o.closest(".scene").querySelector(".c3").classList.toggle("dicht");
  if(r)view(r.closest(".scene"),"binnen");
  const gb=e.target.closest("[data-gift]");if(gb){const g=GIFT[gb.dataset.gift],art=gb.closest(".card");$("lbT").textContent=g.t;$("lbD").textContent=" "+g.d;$("lbImg").hidden=!g.img;$("lbPh").hidden=!!g.img;if(g.img){$("lbImg").src=g.img;$("lbImg").alt=g.alt}else $("lbPh").innerHTML=IC.taart+"<span>Het ontwerp van de taart volgt</span>";$("lbFor").textContent=art?"Voor: "+art.querySelector("h2").textContent:"";$("lb").showModal()}
  const ed=e.target.closest("[data-ed]");if(ed)openEd(+ed.dataset.ed);
  const un=e.target.closest("[data-undo]");if(un){const [ci,k]=un.dataset.undo.split(":").map(Number);undo(ci,k)}
  const vb=e.target.closest(".vw [data-v]");if(vb)view(vb.closest(".scene"),vb.dataset.v);
  if(o)markView(o.closest(".scene"),o.closest(".scene").querySelector(".c3").classList.contains("dicht")?"voor":"binnen")};
// Buiten Claude: gewoon downloaden via de browser.
const BROWSERDL={save:async({filename,data})=>{const a=document.createElement("a");a.href=URL.createObjectURL(data);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),10000)}};
let DL=null;(async()=>{try{DL=window.claude?await claude.use("downloads"):BROWSERDL}catch(_){}if(DL&&window.XLSX)$("xls").hidden=false})();
$("xls").onclick=async()=>{const btn=$("xls");btn.disabled=true;try{
 const ids=new Set();CARDS.forEach(c=>{if(c._e&&c._e.hist)c._e.hist.forEach(h=>h.by&&ids.add(h.by))});let ps={};if(UQ&&ids.size){try{ps=await UQ.profiles([...ids])}catch(_){}}
 const nm=(id,n)=>n||(ps[id]&&ps[id].name)||"onbekend";const pk=c=>c.adv!=="stuur"?"Geen kaart":c.gift==="taart"?"Kaart + taart":c.gift==="wijn"?"Kaart + wijn":"Alleen kaart";
 const ord={"Kaart + taart":0,"Kaart + wijn":1,"Alleen kaart":2,"Geen kaart":3};
 const L=[...CARDS].sort((x,y)=>ord[pk(x)]-ord[pk(y)]||x.seg.localeCompare(y.seg)||x.org.localeCompare(y.org));
 const H=["Wat sturen we","Versturen","Taart","Wijn","Label","Afzender","Adres op envelop","Organisatie","Contactpersoon","Functie","Adres","Postcode","Plaats","Land bestemming","Taal kaarttekst","Kaart 2024","Kaart 2025","Handgeschreven tekst","Tekens","Waarom (kaart, geschenk of geen kaart)","Waarom deze organisatie","Waarom deze contactpersoon","Meer kaarten in deze organisatie","Geschenk in deze organisatie","Waarom deze tekst","Achtergrond","Let op","Aangepast","Laatst aangepast door","Laatst aangepast op","Kosten (€)"];
 const rows=L.map(c=>{const s=c.adv==="stuur",e=c._e&&c._e.hist&&c._e.hist.length?c._e.hist[c._e.hist.length-1]:null;
  return [pk(c),s?"ja":"nee",s&&c.gift==="taart"?"ja":"nee",s&&c.gift==="wijn"?"ja":"nee",c.seg,c.am,envText(c),c.org,/^Team /.test(c.cp)?"":c.cp,c.fn,c.adr,c.pc,c.plaats,landOf(c),taalOf(c),c.yrs.includes(2024)?"ja":"nee",c.yrs.includes(2025)?"ja":"nee",c.txt,c.txt.length,s?(c.gift?c.giftwhy:(c.kw||"")):c.nw,...(s&&c.ux?[c.ux.org,c.ux.cp,c.ux.meer,c.ux.gift,c.ux.tekst]:["","","","",""]),c.pts.join("\n"),c.flags.join("\n"),e?"ja":"nee",e?nm(e.by,e.naam):"",e?new Date(e.at).toLocaleString("nl-NL"):"",costOf(c)]});
 const ws=XLSX.utils.aoa_to_sheet([H,...rows]);ws["!cols"]=[16,10,7,7,14,18,40,34,26,22,30,10,18,14,12,10,10,60,8,50,60,60,60,60,80,50,40,10,20,18].map(w=>({wch:w}));ws["!autofilter"]={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:rows.length,c:H.length-1}})};ws["!freeze"]={xSplit:0,ySplit:1};
 const LH=["Datum","Door","Organisatie","Contactpersoon (origineel)","Veld","Oud","Nieuw","Toelichting"],log=[];
 CARDS.forEach((c,i)=>{if(!(c._e&&c._e.hist))return;c._e.hist.forEach(h=>(h.changes||[]).forEach(ch=>log.push([new Date(h.at).toLocaleString("nl-NL"),nm(h.by,h.naam),BASE[i].org,BASE[i].cp,EFL[ch.f]||ch.f,fv(ch.f,ch.from),fv(ch.f,ch.to),h.note||""])))});
 const ws2=XLSX.utils.aoa_to_sheet([LH,...log]);ws2["!cols"]=[18,20,34,26,18,50,50,40].map(w=>({wch:w}));
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Kerstkaarten 2026");XLSX.utils.book_append_sheet(wb,ws2,"Wijzigingen");
 const buf=XLSX.write(wb,{type:"array",bookType:"xlsx"});
 await DL.save({filename:"Blom kerstkaarten 2026.xlsx",data:new Blob([buf])});toast("Excel-bestand opgeslagen")}
 catch(e){if(!e||e.code!=="declined")toast("Downloaden lukte niet")}finally{btn.disabled=false}};
render();
