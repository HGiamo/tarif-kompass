/* M+E Tarif-Kompass - Oberflaeche, Suche, Karteikarten, Notizen */
(function(){
"use strict";

/* ---------- Speicher ---------- */
var LS = {
  get: function(k, d){
    try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }
    catch(e){ return d; }
  },
  set: function(k, v){
    try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){}
  }
};
var notizen = LS.get("tk.notizen", {});
var kartenState = LS.get("tk.karten", {});
var calcState = LS.get("tk.calc", {});

/* ---------- Werkzeug ---------- */
function esc(s){
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function el(id){ return document.getElementById(id); }
function vertrag(k){ return TK.vertraege[k] || { kurz:k, name:k, vom:"", url:"" }; }
function refLabel(e){ return e.p + " " + vertrag(e.v).kurz; }
function thema(id){
  var i;
  for(i=0;i<TK.themen.length;i++){ if(TK.themen[i].id === id) return TK.themen[i]; }
  return null;
}
function calcById(id){
  var i;
  for(i=0;i<TK.calc.length;i++){ if(TK.calc[i].id === id) return TK.calc[i]; }
  return null;
}
function regById(id){
  var i;
  for(i=0;i<TK.register.length;i++){ if(TK.register[i].id === id) return TK.register[i]; }
  return null;
}
function plain(html){ return String(html).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(); }
function kurzText(html, n){
  var t = plain(html);
  return t.length > n ? t.slice(0,n).replace(/\s\S*$/,"") + " …" : t;
}
function norm(s){
  return String(s).toLowerCase()
    .replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss");
}

/* ---------- Theme ---------- */
var theme = LS.get("tk.theme", null);
if(theme) document.documentElement.setAttribute("data-theme", theme);
el("themeToggle").addEventListener("click", function(){
  var cur = document.documentElement.getAttribute("data-theme");
  var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var next = cur ? (cur === "dark" ? "light" : "dark") : (dark ? "light" : "dark");
  document.documentElement.setAttribute("data-theme", next);
  LS.set("tk.theme", next);
});

/* ---------- Navigation ---------- */
el("burger").addEventListener("click", function(){
  var n = el("sidenav");
  var open = n.classList.toggle("open");
  this.setAttribute("aria-expanded", open ? "true" : "false");
});
function closeNav(){ el("sidenav").classList.remove("open"); }

/* ---------- Suche ---------- */
var suchIndex = null;
function buildIndex(){
  var idx = [], i;
  for(i=0;i<TK.register.length;i++){
    var e = TK.register[i];
    idx.push({ art:"Paragraph", titel:refLabel(e) + " – " + e.t, text:kurzText(e.k, 150),
      href:"#/ref/" + e.id, key:norm([e.p, vertrag(e.v).kurz, vertrag(e.v).name, e.t, e.tg || "", plain(e.k)].join(" ")) });
  }
  for(i=0;i<TK.karten.length;i++){
    var c = TK.karten[i];
    idx.push({ art:"Karteikarte", titel:c.f, text:c.ref,
      href:"#/karten?karte=" + c.id, key:norm([c.f, plain(c.b), c.ref].join(" ")) });
  }
  for(i=0;i<TK.calc.length;i++){
    var r = TK.calc[i];
    idx.push({ art:"Rechner", titel:r.name, text:r.desc,
      href:"#/rechner/" + r.id, key:norm([r.name, r.desc, r.refs.join(" ")].join(" ")) });
  }
  for(i=0;i<TK.themen.length;i++){
    var t = TK.themen[i];
    idx.push({ art:"Thema", titel:t.name, text:t.desc, href:"#/thema/" + t.id, key:norm([t.name, t.desc].join(" ")) });
  }
  var ids = Object.keys(notizen);
  for(i=0;i<ids.length;i++){
    if(!notizen[ids[i]]) continue;
    var re = regById(ids[i]);
    idx.push({ art:"Eigene Ergänzung", titel:(re ? refLabel(re) + " – " + re.t : ids[i]),
      text:kurzText(notizen[ids[i]],120), href:"#/ref/" + ids[i], key:norm(notizen[ids[i]] + " " + (re ? re.t : "")) });
  }
  return idx;
}
function suche(q){
  if(!suchIndex) suchIndex = buildIndex();
  var nq = norm(q).trim();
  if(nq.length < 2) return [];
  var worte = nq.split(/\s+/), res = [], i, j;
  for(i=0;i<suchIndex.length;i++){
    var it = suchIndex[i], score = 0, ok = true;
    for(j=0;j<worte.length;j++){
      var pos = it.key.indexOf(worte[j]);
      if(pos < 0){ ok = false; break; }
      score += (pos < 60 ? 3 : 1);
      if(norm(it.titel).indexOf(worte[j]) >= 0) score += 6;
    }
    if(ok) res.push({ it:it, score:score });
  }
  res.sort(function(a,b){ return b.score - a.score; });
  return res.slice(0,40).map(function(r){ return r.it; });
}
function renderSuche(q){
  var ov = el("searchOverlay"), box = el("searchResults");
  var treffer = suche(q);
  if(!q || q.trim().length < 2){ ov.hidden = true; box.innerHTML = ""; return; }
  ov.hidden = false;
  if(!treffer.length){
    box.innerHTML = "<div class=\"sr-empty\">Kein Treffer für „" + esc(q) + "“.<br>Versuche es mit einem Stichwort wie „Nachtzuschlag“, „Urlaubsgeld“ oder „§ 40“.</div>";
    return;
  }
  var gruppen = {}, reihe = ["Paragraph","Rechner","Karteikarte","Thema","Eigene Ergänzung"], h = "", i, g;
  for(i=0;i<treffer.length;i++){
    g = treffer[i].art;
    if(!gruppen[g]) gruppen[g] = [];
    gruppen[g].push(treffer[i]);
  }
  for(i=0;i<reihe.length;i++){
    g = reihe[i];
    if(!gruppen[g]) continue;
    h += "<div class=\"sr-group\">" + esc(g) + " (" + gruppen[g].length + ")</div>";
    gruppen[g].forEach(function(it){
      h += "<a class=\"sr-item\" href=\"" + it.href + "\"><span class=\"sr-t\">" + esc(it.titel) + "</span><span class=\"sr-d\">" + esc(it.text) + "</span></a>";
    });
  }
  box.innerHTML = h;
}
var si = el("globalSearch");
si.addEventListener("input", function(){ renderSuche(this.value); });
si.addEventListener("keydown", function(e){
  if(e.key === "Escape"){ this.value = ""; renderSuche(""); this.blur(); }
  if(e.key === "Enter"){
    var first = el("searchResults").querySelector("a.sr-item");
    if(first){ location.hash = first.getAttribute("href").slice(1); this.blur(); }
  }
});
el("searchOverlay").addEventListener("click", function(e){
  if(e.target === this){ this.hidden = true; }
});
el("searchResults").addEventListener("click", function(){
  el("searchOverlay").hidden = true;
  si.value = "";
});
document.addEventListener("keydown", function(e){
  if(e.key === "/" && document.activeElement !== si && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){
    e.preventDefault(); si.focus();
  }
  if(e.key === "Escape") el("searchOverlay").hidden = true;
});

/* ---------- Bausteine ---------- */
function refBadge(e){
  return "<a class=\"ref\" href=\"#/ref/" + e.id + "\">" + esc(refLabel(e)) + "</a>";
}
function disclaimer(){
  return "<div class=\"disclaimer\"><strong>Arbeits- und Lernhilfe, keine Rechtsberatung.</strong> " +
    "Diese App gibt die Tarifregelungen der Metall- und Elektroindustrie Baden-Württemberg (Südwestmetall – IG Metall Bezirk Baden-Württemberg) in zusammengefasster Form wieder. " +
    "Maßgeblich ist allein der Wortlaut der Tarifverträge; betriebliche Regelungen, Ergänzungstarifverträge und Einzelarbeitsverträge können abweichen oder günstiger sein. " +
    "Tarifliche Ansprüche stehen nach dem Geltungsbereich der Verträge Mitgliedern der IG Metall in Betrieben mit Südwestmetall-Mitgliedschaft zu. " +
    "Datenstand: " + esc(TK.meta.datenstand) + " – " + esc(TK.meta.stand) + ". Vor Entscheidungen bitte im Originaltext prüfen (siehe <a href=\"#/quellen\">Quellen</a>).</div>";
}
function regItem(e, opts){
  opts = opts || {};
  var h = "<article class=\"reg-item\" id=\"ref-" + e.id + "\">";
  h += "<div class=\"reg-head\">" + refBadge(e) + "<h3>" + esc(e.t) + "</h3></div>";
  h += "<p>" + e.k + "</p>";
  if(e.q) h += "<div class=\"quote\">„" + esc(e.q) + "“</div>";
  if(notizen[e.id]){
    h += "<div class=\"own-note\"><div class=\"own-note-h\">Eigene Ergänzung</div>" + esc(notizen[e.id]) + "</div>";
  }
  h += "<div class=\"reg-foot\">";
  (e.th || []).forEach(function(t){
    var th = thema(t);
    if(th) h += "<a class=\"tag\" href=\"#/thema/" + t + "\">" + esc(th.name) + "</a>";
  });
  if(e.calc){
    var c = calcById(e.calc);
    if(c) h += "<a class=\"tag\" href=\"#/rechner/" + c.id + "\">🧮 " + esc(c.name) + "</a>";
  }
  h += "<button class=\"btn small\" data-note=\"" + e.id + "\">" + (notizen[e.id] ? "Ergänzung bearbeiten" : "Ergänzung hinzufügen") + "</button>";
  if(vertrag(e.v).url) h += "<a class=\"btn small\" href=\"" + esc(vertrag(e.v).url) + "\" target=\"_blank\" rel=\"noopener\">Originaltext (PDF)</a>";
  h += "</div></article>";
  return h;
}

/* ---------- Notiz-Editor ---------- */
function noteEditor(id){
  var e = regById(id);
  if(!e) return;
  var box = document.querySelector("#ref-" + id);
  if(!box || box.querySelector("textarea")) return;
  var d = document.createElement("div");
  d.innerHTML = "<label class=\"field\" style=\"margin-top:10px\">Eigene Ergänzung zu " + esc(refLabel(e)) +
    "<span class=\"hint\">Betriebsvereinbarung, Hausregel, Fundstelle, Ansprechpartner … Wird nur in diesem Browser gespeichert.</span>" +
    "<textarea>" + esc(notizen[id] || "") + "</textarea></label>" +
    "<div class=\"btn-row\"><button class=\"btn primary\" data-save=\"" + id + "\">Speichern</button>" +
    "<button class=\"btn\" data-cancel=\"1\">Abbrechen</button>" +
    (notizen[id] ? "<button class=\"btn\" data-del=\"" + id + "\">Löschen</button>" : "") + "</div>";
  box.appendChild(d);
  d.querySelector("textarea").focus();
}
document.addEventListener("click", function(ev){
  var t = ev.target;
  if(t.dataset && t.dataset.note){ noteEditor(t.dataset.note); return; }
  if(t.dataset && t.dataset.save){
    var id = t.dataset.save;
    var ta = t.closest("div").parentNode.querySelector("textarea");
    var val = ta ? ta.value.trim() : "";
    if(val) notizen[id] = val; else delete notizen[id];
    LS.set("tk.notizen", notizen);
    suchIndex = null;
    route();
    return;
  }
  if(t.dataset && t.dataset.del){
    delete notizen[t.dataset.del];
    LS.set("tk.notizen", notizen);
    suchIndex = null;
    route();
    return;
  }
  if(t.dataset && t.dataset.cancel){ route(); return; }
});

/* ============================================================
   Ansichten
   ============================================================ */
function viewStart(){
  var h = "";
  h += "<h1>M+E Tarif-Kompass</h1>";
  h += "<p class=\"lead\">Nachschlagen, rechnen und lernen – auf Grundlage der Tarifverträge der Metall- und Elektroindustrie Baden-Württemberg (Südwestmetall / IG Metall). " +
       "Jede Aussage ist mit der Fundstelle hinterlegt, damit sie im Gespräch belegbar ist.</p>";
  h += "<div class=\"grid c3\">";
  h += "<a class=\"tile\" href=\"#/register\"><span class=\"tile-ico\">🔎</span><h3>Wo steht was</h3><p>" + TK.register.length + " Fundstellen aus " + Object.keys(TK.vertraege).length + " Tarifverträgen – nach Thema und Vertrag filterbar.</p></a>";
  h += "<a class=\"tile\" href=\"#/rechner\"><span class=\"tile-ico\">🧮</span><h3>Rechner</h3><p>" + TK.calc.length + " Rechenwege mit Zwischenschritten: Entgelt, Zuschläge, T-ZUG, Urlaub, Lohnsicherung.</p></a>";
  h += "<a class=\"tile\" href=\"#/karten\"><span class=\"tile-ico\">🗂️</span><h3>Karteikarten</h3><p>" + TK.karten.length + " Karten zum Lernen – Frage, Antwort, Paragraph. Mit Fortschritt und Wiederholung.</p></a>";
  h += "<a class=\"tile\" href=\"#/themen\"><span class=\"tile-ico\">📚</span><h3>Themen</h3><p>Alle Regelungen nach " + TK.themen.length + " Sachgebieten geordnet – vom Einstieg bis zur Beendigung.</p></a>";
  h += "<a class=\"tile\" href=\"#/notizen\"><span class=\"tile-ico\">✏️</span><h3>Ergänzungen</h3><p>Eigene Notizen zu jeder Fundstelle – Betriebsvereinbarungen, Hausregeln, Ansprechpartner.</p></a>";
  h += "<a class=\"tile\" href=\"#/quellen\"><span class=\"tile-ico\">📄</span><h3>Quellen</h3><p>Direktlinks zu den öffentlichen Tarifvertragstexten als PDF.</p></a>";
  h += "</div>";

  h += "<h2>Schnellzugriff: häufige Fragen</h2><div class=\"grid c2\">";
  var schnell = [
    ["mtv-35",  "Wie hoch ist der Nachtzuschlag?"],
    ["mtv-43-3","Welche Kündigungsfrist gilt?"],
    ["mtv-40-4","Wie wird der Alterssicherungsbetrag berechnet?"],
    ["mtv-26",  "Wie viele Tage frei bei Todesfall oder Hochzeit?"],
    ["url-3",   "Wie viele Urlaubstage stehen zu?"],
    ["mtv-36-3","Wie lange läuft der Krankengeldzuschuss?"],
    ["tzug-2-2","Wie hoch sind T-ZUG und Zusatzbetrag?"],
    ["mtv-46",  "Welche Ausschlussfristen sind zu beachten?"]
  ];
  schnell.forEach(function(s){
    var e = regById(s[0]);
    if(!e) return;
    h += "<a class=\"tile\" href=\"#/ref/" + e.id + "\"><h3>" + esc(s[1]) + "</h3><p>" + esc(refLabel(e)) + " – " + esc(e.t) + "</p></a>";
  });
  h += "</div>";

  h += "<h2>Zum Lernen</h2><div class=\"card\"><p>Die Karteikarten sind wie eine Rechts-Lernkartei aufgebaut: <strong>Frage – Antwort – Paragraph</strong>. " +
       "Der Fortschritt wird in diesem Browser gespeichert; mit „Nur Wiederholungen“ lässt sich gezielt üben, was noch nicht sitzt.</p>" +
       "<div class=\"btn-row\"><a class=\"btn primary\" href=\"#/karten\">Karteikarten starten</a><a class=\"btn\" href=\"#/themen\">Themen durchgehen</a></div></div>";
  h += disclaimer();
  return h;
}

function viewThemen(){
  var h = "<h1>Themen</h1><p class=\"lead\">Alle Regelungen nach Sachgebieten. Die Zahl zeigt, wie viele Fundstellen und Karteikarten hinterlegt sind.</p><div class=\"grid c2\">";
  TK.themen.forEach(function(t){
    var n = TK.register.filter(function(e){ return (e.th||[]).indexOf(t.id) >= 0; }).length;
    var k = TK.karten.filter(function(c){ return c.th === t.id; }).length;
    h += "<a class=\"tile\" href=\"#/thema/" + t.id + "\"><span class=\"tile-ico\">" + t.ico + "</span><h3>" + esc(t.name) + "</h3><p>" + esc(t.desc) + "</p>" +
         "<p class=\"muted\" style=\"margin-top:7px\">" + n + " Fundstellen · " + k + " Karteikarten</p></a>";
  });
  h += "</div>" + disclaimer();
  return h;
}

function viewThema(id){
  var t = thema(id);
  if(!t) return "<h1>Thema nicht gefunden</h1><p><a href=\"#/themen\">Zur Übersicht</a></p>";
  var eintraege = TK.register.filter(function(e){ return (e.th||[]).indexOf(id) >= 0; });
  var karten = TK.karten.filter(function(c){ return c.th === id; });
  var rechner = TK.calc.filter(function(r){
    return eintraege.some(function(e){ return e.calc === r.id; });
  });
  var h = "<p class=\"muted\"><a href=\"#/themen\">Themen</a> / " + esc(t.name) + "</p>";
  h += "<h1>" + t.ico + " " + esc(t.name) + "</h1><p class=\"lead\">" + esc(t.desc) + "</p>";
  if(rechner.length){
    h += "<div class=\"btn-row\">";
    rechner.forEach(function(r){ h += "<a class=\"btn\" href=\"#/rechner/" + r.id + "\">🧮 " + esc(r.name) + "</a>"; });
    h += "</div>";
  }
  h += "<h2>Fundstellen (" + eintraege.length + ")</h2>";
  eintraege.forEach(function(e){ h += regItem(e); });
  if(karten.length){
    h += "<h2>Karteikarten zu diesem Thema (" + karten.length + ")</h2>";
    h += "<div class=\"btn-row\"><a class=\"btn primary\" href=\"#/karten?thema=" + id + "\">Diese Karten üben</a></div>";
    h += "<div>";
    karten.forEach(function(c){
      h += "<details class=\"acc\"><summary>" + esc(c.f) + "</summary><div class=\"acc-body\"><p>" + c.b + "</p><p><span class=\"ref\">" + esc(c.ref) + "</span></p></div></details>";
    });
    h += "</div>";
  }
  h += disclaimer();
  return h;
}

var regFilter = { thema:"", v:"", q:"" };
function viewRegister(){
  var h = "<h1>Wo steht was</h1><p class=\"lead\">Das Paragraphen-Register: " + TK.register.length + " Fundstellen mit Inhalt, Thema und Direktlink zum Originaltext. " +
          "Filtere nach Thema oder Tarifvertrag – oder nutze oben die Suche (Taste <kbd>/</kbd>).</p>";
  h += "<div class=\"chips\" id=\"chipsThema\"><button class=\"chip" + (regFilter.thema===""?" on":"") + "\" data-ft=\"\">Alle Themen</button>";
  TK.themen.forEach(function(t){
    h += "<button class=\"chip" + (regFilter.thema===t.id?" on":"") + "\" data-ft=\"" + t.id + "\">" + t.ico + " " + esc(t.name) + "</button>";
  });
  h += "</div>";
  h += "<div class=\"chips\" id=\"chipsV\"><button class=\"chip" + (regFilter.v===""?" on":"") + "\" data-fv=\"\">Alle Verträge</button>";
  Object.keys(TK.vertraege).forEach(function(k){
    var anz = TK.register.filter(function(e){ return e.v === k; }).length;
    if(!anz) return;
    h += "<button class=\"chip" + (regFilter.v===k?" on":"") + "\" data-fv=\"" + k + "\">" + esc(vertrag(k).kurz) + " (" + anz + ")</button>";
  });
  h += "</div>";
  var liste = TK.register.filter(function(e){
    if(regFilter.thema && (e.th||[]).indexOf(regFilter.thema) < 0) return false;
    if(regFilter.v && e.v !== regFilter.v) return false;
    return true;
  });
  h += "<p class=\"muted\">" + liste.length + " von " + TK.register.length + " Fundstellen</p>";
  liste.forEach(function(e){ h += regItem(e); });
  if(!liste.length) h += "<div class=\"card\">Keine Fundstelle mit dieser Filterkombination.</div>";
  h += disclaimer();
  return h;
}

function viewRef(id){
  var e = regById(id);
  if(!e) return "<h1>Fundstelle nicht gefunden</h1><p><a href=\"#/register\">Zum Register</a></p>";
  var v = vertrag(e.v);
  var h = "<p class=\"muted\"><a href=\"#/register\">Wo steht was</a> / " + esc(refLabel(e)) + "</p>";
  h += "<h1>" + esc(e.p) + " " + esc(v.kurz) + "</h1><p class=\"lead\">" + esc(e.t) + "</p>";
  h += "<dl class=\"kv\"><dt>Tarifvertrag</dt><dd>" + esc(v.name) + "</dd><dt>Fassung</dt><dd>" + esc(v.vom) + "</dd><dt>Tarifgebiet</dt><dd>" + esc(TK.meta.gebiet) + "</dd></dl>";
  h += regItem(e);
  var nachbarn = TK.register.filter(function(o){ return o.v === e.v && o.id !== e.id; }).slice(0,0);
  var gleiche = TK.register.filter(function(o){
    return o.id !== e.id && (o.th||[]).some(function(t){ return (e.th||[]).indexOf(t) >= 0; });
  }).slice(0,6);
  if(gleiche.length){
    h += "<h2>Passt dazu</h2><div class=\"grid c2\">";
    gleiche.forEach(function(o){
      h += "<a class=\"tile\" href=\"#/ref/" + o.id + "\"><h3>" + esc(o.t) + "</h3><p>" + esc(refLabel(o)) + "</p></a>";
    });
    h += "</div>";
  }
  if(e.calc){
    var c = calcById(e.calc);
    if(c) h += "<div class=\"note ok\"><strong>Rechner:</strong> Zu dieser Vorschrift gibt es einen Rechenweg – <a href=\"#/rechner/" + c.id + "\">" + esc(c.name) + "</a>.</div>";
  }
  h += disclaimer();
  return h;
}

/* ---------- Rechner ---------- */
TK.vis = {
  einstufung: {
    a: function(v){ return v.wk === "a"; },
    b: function(v){ return v.wk === "b"; },
    e: function(v){ return v.wk === "b"; }
  },
  tzug: {
    mv:     function(v){ return v.modus === "direkt"; },
    betrag: function(v){ return v.modus === "tage"; },
    tage:   function(v){ return v.modus === "tage"; }
  },
  trafo: {
    mv:     function(v){ return v.modus === "direkt"; },
    betrag: function(v){ return v.modus === "tage"; },
    tage:   function(v){ return v.modus === "tage"; }
  },
  lohnsicherung: {
    zdirekt:  function(v){ return v.zvoraus && v.zmodus === "direkt"; },
    zgesamt:  function(v){ return v.zvoraus && v.zmodus === "formel"; },
    zstunden: function(v){ return v.zvoraus && v.zmodus === "formel"; },
    zmodus:   function(v){ return !!v.zvoraus; }
  },
  urlaubsgeld: {
    zeit: function(v){ return v.modell === "standard"; }
  }
};

function calcValues(r){
  var v = {}, i;
  var saved = calcState[r.id] || {};
  for(i=0;i<r.felder.length;i++){
    var f = r.felder[i];
    v[f.k] = (saved[f.k] !== undefined && saved[f.k] !== null) ? saved[f.k] : f.v;
  }
  return v;
}
function fieldHtml(r, f, v){
  var vis = TK.vis[r.id] && TK.vis[r.id][f.k];
  if(vis && !vis(v)) return "";
  var val = v[f.k], h = "";
  if(f.t === "check"){
    h += "<label class=\"check\"><input type=\"checkbox\" data-f=\"" + f.k + "\"" + (val ? " checked" : "") + "> <span>" + esc(f.l) + "</span></label>";
    return h;
  }
  h += "<label class=\"field\">" + esc(f.l) + (f.unit ? " <span class=\"muted\">(" + esc(f.unit) + ")</span>" : "");
  if(f.hint) h += "<span class=\"hint\">" + esc(f.hint) + "</span>";
  if(f.t === "number"){
    h += "<input type=\"number\" data-f=\"" + f.k + "\" value=\"" + esc(val) + "\" step=\"" + (f.step || 1) + "\"" +
         (f.min !== undefined ? " min=\"" + f.min + "\"" : "") + (f.max !== undefined ? " max=\"" + f.max + "\"" : "") + ">";
  } else if(f.t === "date"){
    h += "<input type=\"date\" data-f=\"" + f.k + "\" value=\"" + esc(val || "") + "\">";
  } else if(f.t === "select"){
    h += "<select data-f=\"" + f.k + "\">";
    f.opts.forEach(function(o){
      h += "<option value=\"" + esc(o.v) + "\"" + (String(val) === String(o.v) ? " selected" : "") + ">" + esc(o.l) + "</option>";
    });
    h += "</select>";
  } else if(f.t === "selectData"){
    var liste = TK.tab.eraMerkmale[f.data] || [];
    h += "<select data-f=\"" + f.k + "\">";
    if(f.leer) h += "<option value=\"-1\"" + (String(val) === "-1" ? " selected" : "") + ">" + esc(f.leer) + "</option>";
    liste.forEach(function(o, i){
      h += "<option value=\"" + i + "\"" + (String(val) === String(i) ? " selected" : "") + ">" + esc(o.st + " (" + o.p + " Pkt.) – " + o.d) + "</option>";
    });
    h += "</select>";
  } else {
    h += "<input type=\"text\" data-f=\"" + f.k + "\" value=\"" + esc(val || "") + "\">";
  }
  h += "</label>";
  return h;
}
function renderCalcResult(r, v){
  var out;
  try { out = r.run(v); }
  catch(err){ return "<div class=\"note warn\"><strong>Fehler in der Berechnung:</strong> " + esc(err.message) + "</div>"; }
  var h = "";
  if(out.warn) h += "<div class=\"note warn\"><strong>Prüfen:</strong> " + out.warn + "</div>";
  h += "<div class=\"result\"><p class=\"big\">" + out.big + "</p><p class=\"muted\">" + esc(out.bigLabel || "") + "</p>";
  if(out.steps && out.steps.length){
    h += "<ul class=\"steps\">";
    out.steps.forEach(function(s){
      h += "<li class=\"" + (s.cls || "") + "\"><span class=\"lbl\">" + s.lbl + "</span><span class=\"val\">" + s.val + "</span></li>";
    });
    h += "</ul>";
  }
  h += "</div>";
  if(out.hinweise && out.hinweise.length){
    h += "<h3>Rechtliche Hinweise</h3>";
    out.hinweise.forEach(function(x){ h += "<div class=\"note\">" + x + "</div>"; });
  }
  return h;
}
function viewRechnerListe(){
  var h = "<h1>Rechner</h1><p class=\"lead\">Jeder Rechner zeigt den vollständigen Rechenweg mit den Zwischenschritten und der Fundstelle – so lässt sich das Ergebnis im Gespräch oder in der Akte belegen.</p><div class=\"grid c2\">";
  TK.calc.forEach(function(r){
    h += "<a class=\"tile\" href=\"#/rechner/" + r.id + "\"><span class=\"tile-ico\">" + r.ico + "</span><h3>" + esc(r.name) + "</h3><p>" + esc(r.desc) + "</p>" +
         "<p style=\"margin-top:8px\">" + r.refs.map(function(x){ return "<span class=\"tag\">" + esc(x) + "</span>"; }).join("") + "</p></a>";
  });
  h += "</div>" + disclaimer();
  return h;
}
function viewRechner(id){
  var r = calcById(id);
  if(!r) return "<h1>Rechner nicht gefunden</h1><p><a href=\"#/rechner\">Zur Übersicht</a></p>";
  var v = calcValues(r);
  var h = "<p class=\"muted\"><a href=\"#/rechner\">Rechner</a> / " + esc(r.name) + "</p>";
  h += "<h1>" + r.ico + " " + esc(r.name) + "</h1><p class=\"lead\">" + esc(r.desc) + "</p>";
  h += "<p>" + r.refs.map(function(x){ return "<span class=\"tag\">" + esc(x) + "</span>"; }).join("") + "</p>";
  h += "<div class=\"grid c2\" style=\"align-items:start\">";
  h += "<form class=\"card\" id=\"calcForm\" autocomplete=\"off\"><fieldset><legend>Eingaben</legend>";
  r.felder.forEach(function(f){ h += fieldHtml(r, f, v); });
  h += "</fieldset><div class=\"btn-row\"><button type=\"button\" class=\"btn\" id=\"calcReset\">Zurücksetzen</button><button type=\"button\" class=\"btn\" id=\"calcPrint\">Drucken</button></div></form>";
  h += "<div id=\"calcOut\">" + renderCalcResult(r, v) + "</div>";
  h += "</div>";
  if(r.extra) h += "<div class=\"card\">" + r.extra() + "</div>";
  h += disclaimer();
  return h;
}
function bindCalc(id){
  var r = calcById(id), form = el("calcForm");
  if(!r || !form) return;
  function lese(){
    var v = calcValues(r);
    r.felder.forEach(function(f){
      var node = form.querySelector("[data-f=\"" + f.k + "\"]");
      if(!node) return;
      if(f.t === "check") v[f.k] = node.checked;
      else if(f.t === "number"){
        var n = parseFloat(String(node.value).replace(",", "."));
        v[f.k] = isNaN(n) ? 0 : n;
      }
      else v[f.k] = node.value;
    });
    return v;
  }
  function update(rerender){
    var v = lese();
    calcState[r.id] = v;
    LS.set("tk.calc", calcState);
    if(rerender){
      var scroll = window.scrollY;
      el("main").innerHTML = viewRechner(id);
      bindCalc(id);
      window.scrollTo(0, scroll);
    } else {
      el("calcOut").innerHTML = renderCalcResult(r, v);
    }
  }
  var steuer = TK.vis[r.id] ? Object.keys(TK.vis[r.id]) : [];
  form.addEventListener("input", function(e){
    var k = e.target.dataset ? e.target.dataset.f : null;
    var braucht = false, i;
    if(k){
      for(i=0;i<r.felder.length;i++){
        var vis = TK.vis[r.id] && TK.vis[r.id][r.felder[i].k];
        if(vis && String(vis).indexOf("v." + k) >= 0) braucht = true;
      }
    }
    update(braucht);
  });
  form.addEventListener("change", function(e){
    var k = e.target.dataset ? e.target.dataset.f : null;
    var braucht = false, i;
    if(k){
      for(i=0;i<r.felder.length;i++){
        var vis = TK.vis[r.id] && TK.vis[r.id][r.felder[i].k];
        if(vis && String(vis).indexOf("v." + k) >= 0) braucht = true;
      }
    }
    update(braucht);
  });
  el("calcReset").addEventListener("click", function(){
    delete calcState[r.id];
    LS.set("tk.calc", calcState);
    el("main").innerHTML = viewRechner(id);
    bindCalc(id);
  });
  el("calcPrint").addEventListener("click", function(){ window.print(); });
}

/* ---------- Karteikarten ---------- */
var deck = { karten:[], pos:0, thema:"", nurWdh:false, offen:false };
function deckBauen(){
  var liste = TK.karten.filter(function(c){
    if(deck.thema && c.th !== deck.thema) return false;
    if(deck.nurWdh && kartenState[c.id] !== "wdh") return false;
    return true;
  });
  var i, j, t;
  for(i=liste.length-1;i>0;i--){
    j = Math.floor(Math.random()*(i+1));
    t = liste[i]; liste[i] = liste[j]; liste[j] = t;
  }
  deck.karten = liste;
  deck.pos = 0;
  deck.offen = false;
}
function viewKarten(query){
  if(query && query.thema !== undefined && query.thema !== deck.thema){
    deck.thema = query.thema; deckBauen();
  }
  if(!deck.karten.length) deckBauen();
  var gewusst = TK.karten.filter(function(c){ return kartenState[c.id] === "ok"; }).length;
  var wdh = TK.karten.filter(function(c){ return kartenState[c.id] === "wdh"; }).length;
  var h = "<h1>Karteikarten</h1><p class=\"lead\">Frage – Antwort – Paragraph. Antwort erst aufdecken, wenn du sie selbst formuliert hast; so prüfst du nicht nur das Ergebnis, sondern auch die Fundstelle.</p>";
  h += "<div class=\"chips\" id=\"chipsKarten\"><button class=\"chip" + (deck.thema===""?" on":"") + "\" data-kt=\"\">Alle</button>";
  TK.themen.forEach(function(t){
    var n = TK.karten.filter(function(c){ return c.th === t.id; }).length;
    if(!n) return;
    h += "<button class=\"chip" + (deck.thema===t.id?" on":"") + "\" data-kt=\"" + t.id + "\">" + t.ico + " " + esc(t.name) + " (" + n + ")</button>";
  });
  h += "</div>";
  h += "<div class=\"deck-stats\"><span>Gewusst: <b>" + gewusst + "</b></span><span>Zur Wiederholung: <b>" + wdh + "</b></span><span>Karten im Stapel: <b>" + deck.karten.length + "</b></span></div>";
  var anteil = deck.karten.length ? Math.round((deck.pos / deck.karten.length)*100) : 0;
  h += "<div class=\"progress\"><i style=\"width:" + anteil + "%\"></i></div>";
  h += "<div class=\"btn-row\"><button class=\"btn" + (deck.nurWdh ? " primary" : "") + "\" id=\"kWdh\">" + (deck.nurWdh ? "Alle Karten zeigen" : "Nur Wiederholungen (" + wdh + ")") + "</button>" +
       "<button class=\"btn\" id=\"kMisch\">Neu mischen</button>" +
       "<button class=\"btn\" id=\"kResetF\">Fortschritt zurücksetzen</button></div>";

  if(!deck.karten.length){
    h += "<div class=\"card\">In diesem Stapel ist keine Karte. Wähle ein anderes Thema oder zeige alle Karten.</div>" + disclaimer();
    return h;
  }
  if(deck.pos >= deck.karten.length){
    h += "<div class=\"card\"><h2 style=\"margin-top:0\">Stapel durchgearbeitet</h2><p>Du hast alle " + deck.karten.length + " Karten dieses Stapels gesehen. " +
         (wdh ? "Noch <strong>" + wdh + "</strong> Karten stehen zur Wiederholung." : "Es stehen keine Karten zur Wiederholung an.") + "</p>" +
         "<div class=\"btn-row\"><button class=\"btn primary\" id=\"kMisch2\">Noch einmal durchgehen</button>" + (wdh ? "<button class=\"btn\" id=\"kWdh2\">Nur Wiederholungen üben</button>" : "") + "</div></div>" + disclaimer();
    return h;
  }
  var c = deck.karten[deck.pos];
  var t = thema(c.th);
  h += "<div class=\"flash\"><div class=\"flash-meta\"><span class=\"tag\">" + esc(t ? t.ico + " " + t.name : c.th) + "</span>" +
       "<span class=\"muted\">Karte " + (deck.pos+1) + " von " + deck.karten.length + "</span>" +
       (kartenState[c.id] === "ok" ? "<span class=\"tag\">zuletzt gewusst</span>" : "") +
       (kartenState[c.id] === "wdh" ? "<span class=\"tag\">zur Wiederholung</span>" : "") + "</div>";
  h += "<p class=\"q\">" + esc(c.f) + "</p>";
  if(deck.offen){
    h += "<div class=\"a\">" + c.b + "<p style=\"margin-top:14px\"><span class=\"ref\">" + esc(c.ref) + "</span></p></div>";
    h += "<div class=\"flash-foot\"><button class=\"btn primary\" id=\"kOk\">Gewusst</button><button class=\"btn\" id=\"kNo\">Nochmal üben</button>";
    var passend = TK.register.filter(function(e){ return c.ref.indexOf(e.p) === 0 && e.v === c.v; })[0];
    if(passend) h += "<a class=\"btn\" href=\"#/ref/" + passend.id + "\">Fundstelle öffnen</a>";
    h += "<button class=\"btn\" id=\"kSkip\">Überspringen</button></div>";
  } else {
    h += "<div class=\"flash-foot\"><button class=\"btn primary\" id=\"kShow\">Antwort aufdecken</button><button class=\"btn\" id=\"kSkip\">Überspringen</button></div>";
  }
  h += "</div>";
  h += "<p class=\"muted\" style=\"margin-top:12px\">Tastatur: <kbd>Leertaste</kbd> aufdecken · <kbd>1</kbd> gewusst · <kbd>2</kbd> nochmal</p>";
  h += disclaimer();
  return h;
}
function kartenBind(){
  function neu(){ el("main").innerHTML = viewKarten(); kartenBind(); }
  var chips = el("chipsKarten");
  if(chips) chips.addEventListener("click", function(e){
    if(e.target.dataset.kt === undefined) return;
    deck.thema = e.target.dataset.kt;
    deck.nurWdh = false;
    deckBauen(); neu();
  });
  function bind(id, fn){ var n = el(id); if(n) n.addEventListener("click", fn); }
  bind("kShow", function(){ deck.offen = true; neu(); });
  bind("kSkip", function(){ deck.pos++; deck.offen = false; neu(); });
  bind("kOk", function(){
    kartenState[deck.karten[deck.pos].id] = "ok";
    LS.set("tk.karten", kartenState);
    deck.pos++; deck.offen = false; neu();
  });
  bind("kNo", function(){
    kartenState[deck.karten[deck.pos].id] = "wdh";
    LS.set("tk.karten", kartenState);
    deck.pos++; deck.offen = false; neu();
  });
  bind("kMisch", function(){ deckBauen(); neu(); });
  bind("kMisch2", function(){ deck.nurWdh = false; deckBauen(); neu(); });
  bind("kWdh", function(){ deck.nurWdh = !deck.nurWdh; deckBauen(); neu(); });
  bind("kWdh2", function(){ deck.nurWdh = true; deckBauen(); neu(); });
  bind("kResetF", function(){
    if(!confirm("Den Lernfortschritt aller Karteikarten zurücksetzen?")) return;
    kartenState = {};
    LS.set("tk.karten", kartenState);
    deckBauen(); neu();
  });
}
document.addEventListener("keydown", function(e){
  if(location.hash.indexOf("#/karten") !== 0) return;
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
  if(e.key === " " && el("kShow")){ e.preventDefault(); el("kShow").click(); }
  else if(e.key === "1" && el("kOk")) el("kOk").click();
  else if(e.key === "2" && el("kNo")) el("kNo").click();
});

/* ---------- Notizen ---------- */
function viewNotizen(){
  var ids = Object.keys(notizen).filter(function(i){ return !!notizen[i]; });
  var h = "<h1>Ergänzungen</h1><p class=\"lead\">Eigene Notizen zu den Fundstellen – zum Beispiel die passende Betriebsvereinbarung, eine Hausregel, ein Aktenzeichen oder der Ansprechpartner. " +
          "Die Notizen liegen ausschließlich in diesem Browser und werden nicht übertragen.</p>";
  h += "<div class=\"note\"><strong>Wichtig:</strong> Browserdaten können verloren gehen (neues Gerät, geleerter Cache, privates Fenster). " +
       "Sichere deine Ergänzungen regelmäßig über „Als Datei sichern“.</div>";
  h += "<div class=\"btn-row\"><button class=\"btn\" id=\"nExport\">Als Datei sichern</button>" +
       "<label class=\"btn\" style=\"cursor:pointer\">Datei einlesen<input type=\"file\" id=\"nImport\" accept=\"application/json\" style=\"display:none\"></label></div>";
  if(!ids.length){
    h += "<div class=\"card\">Noch keine Ergänzung. Öffne eine Fundstelle im <a href=\"#/register\">Register</a> und wähle dort „Ergänzung hinzufügen“.</div>";
    return h + disclaimer();
  }
  h += "<p class=\"muted\">" + ids.length + " Ergänzung" + (ids.length===1?"":"en") + "</p>";
  ids.forEach(function(id){
    var e = regById(id);
    if(!e){
      h += "<div class=\"reg-item\"><p class=\"muted\">Unbekannte Fundstelle " + esc(id) + "</p><div class=\"own-note\">" + esc(notizen[id]) + "</div></div>";
      return;
    }
    h += regItem(e);
  });
  return h + disclaimer();
}
function notizenBind(){
  var ex = el("nExport");
  if(ex) ex.addEventListener("click", function(){
    var daten = { app:"M+E Tarif-Kompass", exportiert:new Date().toISOString(), notizen:notizen, karten:kartenState };
    var blob = new Blob([JSON.stringify(daten,null,2)], {type:"application/json"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tarif-kompass-ergaenzungen.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  var im = el("nImport");
  if(im) im.addEventListener("change", function(){
    var f = this.files[0];
    if(!f) return;
    var r = new FileReader();
    r.onload = function(){
      try {
        var d = JSON.parse(r.result);
        if(d.notizen){
          Object.keys(d.notizen).forEach(function(k){ notizen[k] = d.notizen[k]; });
          LS.set("tk.notizen", notizen);
        }
        if(d.karten){
          Object.keys(d.karten).forEach(function(k){ kartenState[k] = d.karten[k]; });
          LS.set("tk.karten", kartenState);
        }
        suchIndex = null;
        alert("Ergänzungen eingelesen.");
        route();
      } catch(err){ alert("Die Datei konnte nicht gelesen werden."); }
    };
    r.readAsText(f);
  });
}

/* ---------- Quellen ---------- */
function viewQuellen(){
  var h = "<h1>Quellen</h1><p class=\"lead\">Alle Inhalte dieser App beruhen auf den öffentlich veröffentlichten Tarifvertragstexten für die Metall- und Elektroindustrie Baden-Württemberg. " +
          "Maßgeblich ist immer der Originaltext – hier sind die PDFs direkt verlinkt.</p>";
  h += "<dl class=\"kv\"><dt>Tarifvertragsparteien</dt><dd>" + esc(TK.meta.parteien) + "</dd>" +
       "<dt>Tarifgebiet</dt><dd>" + esc(TK.meta.gebiet) + "</dd>" +
       "<dt>Stand der Daten</dt><dd>" + esc(TK.meta.stand) + "</dd></dl>";
  h += "<div class=\"scroll-x\"><table><thead><tr><th>Tarifvertrag</th><th>Kurz</th><th>Fassung</th><th>Fundstellen</th><th>Original</th></tr></thead><tbody>";
  Object.keys(TK.vertraege).forEach(function(k){
    var v = TK.vertraege[k];
    var n = TK.register.filter(function(e){ return e.v === k; }).length;
    h += "<tr><td>" + esc(v.name) + "</td><td>" + esc(v.kurz) + "</td><td>" + esc(v.vom) + "</td><td class=\"num\">" + n + "</td>" +
         "<td>" + (v.url ? "<a href=\"" + esc(v.url) + "\" target=\"_blank\" rel=\"noopener\">PDF öffnen</a>" : "–") + "</td></tr>";
  });
  h += "</tbody></table></div>";
  h += "<h2>Weitere Übersichten</h2><ul>" +
       "<li><a href=\"https://baden-wuerttemberg.igmetall.de/tarif-und-branchen/tarifvertraege/metall-und-elektroindustrie\" target=\"_blank\" rel=\"noopener\">IG Metall Baden-Württemberg – Tarifverträge der M+E-Industrie</a></li>" +
       "<li><a href=\"https://igmetall-gaggenau.de/tarif/metall-und-elektroindustrie/\" target=\"_blank\" rel=\"noopener\">Vollständige PDF-Sammlung der M+E-Tarifverträge</a></li>" +
       "<li><a href=\"https://www.suedwestmetall.de\" target=\"_blank\" rel=\"noopener\">Südwestmetall – Verband der Metall- und Elektroindustrie Baden-Württemberg</a></li>" +
       "<li><a href=\"https://www.bmas.de/SharedDocs/Downloads/DE/Arbeitsrecht/Tarifdatenblaetter/Metall-und-Elektroindustrie/baden-wuerttemberg-metall-und-elektroindustrie.pdf\" target=\"_blank\" rel=\"noopener\">BMAS – Tarifdatenblatt M+E Baden-Württemberg</a></li>" +
       "</ul>";
  h += "<h2>Hinweise zur Nutzung</h2><div class=\"card\"><ul>" +
       "<li>Die Zusammenfassungen sind sorgfältig aus den Vertragstexten gearbeitet, ersetzen aber keine Prüfung des Wortlauts – insbesondere nicht bei Protokollnotizen und Übergangsregelungen.</li>" +
       "<li>Betriebsvereinbarungen, Ergänzungstarifverträge und günstigere Einzelvereinbarungen gehen den hier abgebildeten Mindestbedingungen vor bzw. ergänzen sie.</li>" +
       "<li>Einzelne Anlagen (z. B. TV AVWL) liegen öffentlich nur als Scan vor und sind deshalb hier nur übersichtsweise erfasst.</li>" +
       "<li>Entgeltwerte gelten für eine tarifliche Arbeitszeit von 35 Stunden und sind auf die individuelle Arbeitszeit umzurechnen.</li>" +
       "</ul></div>";
  return h + disclaimer();
}

/* ---------- Router ---------- */
function parseHash(){
  var h = location.hash.replace(/^#\/?/, "");
  var teile = h.split("?");
  var pfad = teile[0].split("/").filter(function(x){ return x !== ""; });
  var q = {};
  if(teile[1]){
    teile[1].split("&").forEach(function(p){
      var kv = p.split("=");
      q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
    });
  }
  return { pfad:pfad, q:q };
}
function setActive(name){
  var links = document.querySelectorAll(".sidenav a[data-nav]"), i;
  for(i=0;i<links.length;i++){
    links[i].classList.toggle("active", links[i].dataset.nav === name);
  }
}
function route(){
  var r = parseHash(), p = r.pfad, seite = p[0] || "start", m = el("main"), html = "", nav = seite;
  if(seite === "start") html = viewStart();
  else if(seite === "themen") html = viewThemen();
  else if(seite === "thema"){ html = viewThema(p[1]); nav = "themen"; }
  else if(seite === "register") html = viewRegister();
  else if(seite === "ref"){ html = viewRef(p[1]); nav = "register"; }
  else if(seite === "rechner"){ html = p[1] ? viewRechner(p[1]) : viewRechnerListe(); }
  else if(seite === "karten") html = viewKarten(r.q);
  else if(seite === "notizen") html = viewNotizen();
  else if(seite === "quellen") html = viewQuellen();
  else { html = viewStart(); nav = "start"; }
  m.innerHTML = html;
  setActive(nav);
  closeNav();
  el("searchOverlay").hidden = true;
  if(seite === "rechner" && p[1]) bindCalc(p[1]);
  if(seite === "karten") kartenBind();
  if(seite === "notizen") notizenBind();
  if(seite === "register"){
    var ct = el("chipsThema"), cv = el("chipsV");
    if(ct) ct.addEventListener("click", function(e){
      if(e.target.dataset.ft === undefined) return;
      regFilter.thema = e.target.dataset.ft; route();
    });
    if(cv) cv.addEventListener("click", function(e){
      if(e.target.dataset.fv === undefined) return;
      regFilter.v = e.target.dataset.fv; route();
    });
  }
  if(location.hash.indexOf("#/ref/") !== 0) window.scrollTo(0,0);
  m.focus();
}
window.addEventListener("hashchange", route);
el("navStand").textContent = TK.meta.datenstand;
if(!location.hash) location.hash = "#/start";
route();

})();
