/* M+E Tarif-Kompass - Rechner */

/* ---------- Helfer ---------- */
TK.fmt = {
  eur: function(n){
    if(n === null || n === undefined || isNaN(n)) return "–";
    return n.toLocaleString("de-DE",{minimumFractionDigits:2, maximumFractionDigits:2}) + " €";
  },
  num: function(n, d){
    if(n === null || n === undefined || isNaN(n)) return "–";
    d = (d === undefined) ? 2 : d;
    return n.toLocaleString("de-DE",{minimumFractionDigits:d, maximumFractionDigits:d});
  },
  pct: function(n, d){ return TK.fmt.num(n, d === undefined ? 1 : d) + " %"; },
  datum: function(dt){
    if(!dt || isNaN(dt.getTime())) return "–";
    var p = function(x){ return (x<10?"0":"") + x; };
    return p(dt.getDate()) + "." + p(dt.getMonth()+1) + "." + dt.getFullYear();
  }
};

TK.h = {
  grundentgelt: function(eg, jahr){
    var t = TK.tab.entgelt[jahr];
    if(!t) return 0;
    return t.werte[eg-1] || 0;
  },
  eg17: function(jahr){ return TK.h.grundentgelt(17, jahr); },
  eck: function(jahr){ return TK.h.grundentgelt(TK.tab.eckentgeltEG, jahr); },
  /* Eingangs-/Zusatzstufenbetrag nach ERA-TV § 11.4 */
  stufe: function(eg, jahr, art){
    var b = TK.h.grundentgelt(eg, jahr);
    if(art === "eingang"){
      var unten = (eg > 1) ? TK.h.grundentgelt(eg-1, jahr) : b;
      return b - (b - unten)/3;
    }
    if(art === "zusatz"){
      if(eg >= 17){ /* hoechste EG: Differenzbetrag wie Eingangsstufe */
        var u17 = TK.h.grundentgelt(16, jahr);
        return b + (b - u17)/3;
      }
      var oben = TK.h.grundentgelt(eg+1, jahr);
      return b + (oben - b)/3;
    }
    return b;
  },
  belastung: function(idx, jahr){
    var r = TK.tab.belastung[idx];
    if(!r) return 0;
    return jahr === "2026" ? r.e2026 : r.e2025;
  },
  egAusPunkte: function(p){
    var g = TK.tab.eraGruppen, i;
    for(i=0;i<g.length;i++){ if(p >= g[i].von && p <= g[i].bis) return g[i]; }
    if(p < g[0].von) return null;
    return g[g.length-1];
  },
  monate: function(von, bis){
    if(!von || !bis) return 0;
    var m = (bis.getFullYear() - von.getFullYear())*12 + (bis.getMonth() - von.getMonth());
    if(bis.getDate() < von.getDate()) m -= 1;
    return m;
  },
  jahre: function(von, bis){ return Math.floor(TK.h.monate(von,bis)/12); },
  plusMonate: function(d, m){
    var r = new Date(d.getTime());
    var tag = r.getDate();
    r.setDate(1);
    r.setMonth(r.getMonth() + m);
    var letzter = new Date(r.getFullYear(), r.getMonth()+1, 0).getDate();
    r.setDate(Math.min(tag, letzter));
    return r;
  },
  monatsEnde: function(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0); },
  naechstesMonatsEnde: function(d){
    var e = TK.h.monatsEnde(d);
    if(e >= d) return e;
    return TK.h.monatsEnde(new Date(d.getFullYear(), d.getMonth()+1, 1));
  },
  naechstesQuartalsEnde: function(d){
    var q = [2,5,8,11], i, e;
    for(i=0;i<q.length;i++){
      e = new Date(d.getFullYear(), q[i]+1, 0);
      if(e >= d) return e;
    }
    return new Date(d.getFullYear()+1, 3, 0);
  },
  jahrOpts: [{v:"2025", l:"ab 01.04.2025 (+2,0 %)"},{v:"2026", l:"ab 01.04.2026 (+3,1 %)"}],
  egOpts: function(){
    var o = [], i;
    for(i=1;i<=17;i++){ o.push({v:String(i), l:"EG " + i + (i===7 ? " (Eckentgelt)" : "")}); }
    return o;
  }
};

/* ---------- Rechner-Definitionen ---------- */
TK.calc = [

/* 1 ---------------------------------------------------------------- */
{ id:"grundentgelt", ico:"💰", name:"Monatsentgelt aus der Entgelttabelle",
  desc:"Grundentgelt nach Entgeltgruppe und Arbeitszeit, mit Eingangs-/Zusatzstufe, Belastungszulage, Sockelbetrag und Leistungsentgelt.",
  refs:["§ 2.1 / 2.2 / 2.3 TV Entgelte","§ 11.4 ERA-TV","§ 20 ERA-TV","Anlage 2 ERA-TV"],
  felder:[
    { k:"eg",    l:"Entgeltgruppe",            t:"select", v:"7", opts:TK.h.egOpts() },
    { k:"jahr",  l:"Entgelttabelle",           t:"select", v:"2025", opts:TK.h.jahrOpts },
    { k:"irwaz", l:"Individuelle Arbeitszeit (IRWAZ)", t:"number", v:35, step:0.5, min:1, max:48, unit:"Std./Woche", hint:"Tarifliche Arbeitszeit = 35 Stunden (§ 6 MTV)" },
    { k:"stufe", l:"Eingangs- / Zusatzstufe (nur EG 7–17)", t:"select", v:"keine",
      opts:[{v:"keine",l:"keine Stufe"},{v:"eingang",l:"Eingangsstufe (1. Jahr in der EG)"},{v:"zusatz",l:"Zusatzstufe (Spezialkenntnisse)"}] },
    { k:"bel",   l:"Belastungszulage", t:"select", v:"-1",
      opts:[{v:"-1",l:"keine"},{v:"0",l:"1 Punkt (2,5 %)"},{v:"1",l:"2 Punkte (5,0 %)"},{v:"2",l:"3 Punkte (7,5 %)"},{v:"3",l:"4 und mehr Punkte (10,0 %)"},{v:"4",l:"Gießereien (12,5 %)"}] },
    { k:"sockel",l:"Sockelbetrag",  t:"number", v:0, step:1, min:0, max:11, unit:"% des Grundentgelts", hint:"Nur bei Zeitgradprämien: EG 1 = 9 oder 11 %, EG 2 = 7 oder 10 %, EG 3 = 2 oder 5 %, EG 4 = 0 oder 2 %" },
    { k:"le",    l:"Leistungsentgelt", t:"number", v:15, step:0.5, min:0, max:30, unit:"% des Grundentgelts", hint:"Individuell 0 bis 30 %, im Betriebsdurchschnitt 15 % (§ 20 ERA-TV)" },
    { k:"ueber", l:"Übertarifliche Zulage", t:"number", v:0, step:10, min:0, unit:"€/Monat" }
  ],
  run:function(f){
    var eg = parseInt(f.eg,10), jahr = f.jahr, irwaz = f.irwaz||35, quote = irwaz/35;
    var tab = TK.h.grundentgelt(eg, jahr);
    var basis = tab, steps = [], hinweise = [];
    if(f.stufe !== "keine"){
      if(eg < 7){
        hinweise.push("Eingangs- und Zusatzstufen gibt es nach § 11.1 ERA-TV nur für die Entgeltgruppen 7 bis 17 – die Stufe wurde nicht berücksichtigt.");
      } else {
        basis = TK.h.stufe(eg, jahr, f.stufe);
      }
    }
    steps.push({lbl:"Tabellenwert EG " + eg + " (" + TK.tab.entgelt[jahr].ab + ", 35 Std.)", val:TK.fmt.eur(tab)});
    if(basis !== tab){
      steps.push({lbl:(f.stufe==="eingang"?"Eingangsstufe":"Zusatzstufe") + " = Tabellenwert " + (f.stufe==="eingang"?"−":"+") + " 1/3 der Differenz zur " + (f.stufe==="eingang"?"nächstniedrigeren":"nächsthöheren") + " EG", val:TK.fmt.eur(basis)});
    }
    var grund = basis * quote;
    steps.push({lbl:"Umrechnung auf " + TK.fmt.num(irwaz,1) + " Std.: × " + TK.fmt.num(irwaz,1) + " / 35", val:TK.fmt.eur(grund)});
    var sockel = grund * (f.sockel||0)/100;
    if(sockel) steps.push({lbl:"Sockelbetrag " + TK.fmt.pct(f.sockel) + " des Grundentgelts", val:TK.fmt.eur(sockel)});
    var belIdx = parseInt(f.bel,10), bel = 0;
    if(belIdx >= 0){
      bel = TK.h.belastung(belIdx, jahr) * quote;
      steps.push({lbl:"Belastungszulage " + TK.tab.belastung[belIdx].pkt + " (" + TK.fmt.pct(TK.tab.belastung[belIdx].proz) + " von EG 7)" + (quote!==1 ? ", anteilig" : ""), val:TK.fmt.eur(bel)});
    }
    var le = grund * (f.le||0)/100;
    if(le) steps.push({lbl:"Leistungsentgelt " + TK.fmt.pct(f.le) + " des Grundentgelts", val:TK.fmt.eur(le)});
    var ue = f.ueber||0;
    if(ue) steps.push({lbl:"Übertarifliche Zulage", val:TK.fmt.eur(ue)});
    var fest = grund + sockel + bel + ue;
    var summe = fest + le;
    steps.push({lbl:"Feste Bestandteile des Monatsentgelts (§ 31.2 MTV)", val:TK.fmt.eur(fest), cls:"sum"});
    steps.push({lbl:"Monatsentgelt einschließlich Leistungsentgelt", val:TK.fmt.eur(summe), cls:"sum"});
    steps.push({lbl:"Entgelt je Stunde (§ 32.2 MTV: ÷ 4,35 × IRWAZ)", val:TK.fmt.eur(summe/(4.35*irwaz))});
    hinweise.push("Das Leistungsentgelt ist ein variabler Bestandteil (§ 31.3 MTV) und geht nicht in die festen Bestandteile ein.");
    return { big:TK.fmt.eur(summe), bigLabel:"Monatsentgelt brutto (EG " + eg + ", " + TK.fmt.num(irwaz,1) + " Std.)", steps:steps, hinweise:hinweise };
  },
  extra:function(){
    var jahre = ["2025","2026"], i, eg, h = "";
    h += "<h3>Entgelttabellen (35 Stunden)</h3><div class=\"scroll-x\"><table><thead><tr><th>EG</th><th class=\"num\">Schlüssel</th><th class=\"num\">ab 01.04.2025</th><th class=\"num\">ab 01.04.2026</th></tr></thead><tbody>";
    for(eg=1; eg<=17; eg++){
      h += "<tr><td>EG " + eg + (eg===7?" <span class=\"tag\">Eckentgelt</span>":"") + "</td><td class=\"num\">" + TK.fmt.num(TK.tab.schluessel[eg-1],1) + " %</td><td class=\"num\">" + TK.fmt.eur(TK.h.grundentgelt(eg,"2025")) + "</td><td class=\"num\">" + TK.fmt.eur(TK.h.grundentgelt(eg,"2026")) + "</td></tr>";
    }
    h += "</tbody></table></div>";
    h += "<h3>Belastungszulagen</h3><div class=\"scroll-x\"><table><thead><tr><th>Summe Punkte</th><th class=\"num\">% von EG 7</th><th class=\"num\">ab 01.04.2025</th><th class=\"num\">ab 01.04.2026</th></tr></thead><tbody>";
    for(i=0;i<TK.tab.belastung.length;i++){
      var r = TK.tab.belastung[i];
      h += "<tr><td>" + r.pkt + "</td><td class=\"num\">" + TK.fmt.pct(r.proz) + "</td><td class=\"num\">" + TK.fmt.eur(r.e2025) + "</td><td class=\"num\">" + TK.fmt.eur(r.e2026) + "</td></tr>";
    }
    h += "</tbody></table></div>";
    h += "<h3>Sockelbeträge (TV Entgelte Anlage 2)</h3><div class=\"scroll-x\"><table><thead><tr><th>Entgeltgruppe</th><th class=\"num\">Sockelbetrag (*1)</th><th class=\"num\">Sockelbetrag (*2)</th></tr></thead><tbody>";
    for(i=0;i<TK.tab.sockel.length;i++){
      h += "<tr><td>EG " + TK.tab.sockel[i].eg + "</td><td class=\"num\">" + TK.tab.sockel[i].v1 + " %</td><td class=\"num\">" + TK.tab.sockel[i].v2 + " %</td></tr>";
    }
    h += "</tbody></table></div><p class=\"muted\">Die Anlage 2 unterscheidet zwei Spalten (*1 / *2); welche im Betrieb gilt, ergibt sich aus der Vereinbarung zu den Sockelbeträgen vom 10. Oktober 2006. Bitte im Original prüfen.</p>";
    return h;
  }
},

/* 2 ---------------------------------------------------------------- */
{ id:"einstufung", ico:"📊", name:"ERA-Einstufung (Stufenwertzahlverfahren)",
  desc:"Punkte der fünf Bewertungsmerkmale addieren und die Entgeltgruppe bestimmen.",
  refs:["§ 6 ERA-TV","Anlage 1 ERA-TV"],
  felder:[
    { k:"wk", l:"Wissen und Können – Variante", t:"select", v:"b",
      opts:[{v:"a",l:"1.1 Anlernen (A 1 bis A 5)"},{v:"b",l:"1.2 Ausbildung und Erfahrung (B + E)"}] },
    { k:"a",  l:"Anlernen",  t:"selectData", v:"0", data:"anlernen" },
    { k:"b",  l:"Ausbildung", t:"selectData", v:"1", data:"ausbildung" },
    { k:"e",  l:"Erfahrung",  t:"selectData", v:"0", data:"erfahrung" },
    { k:"d",  l:"Denken",     t:"selectData", v:"2", data:"denken" },
    { k:"hs", l:"Handlungsspielraum / Verantwortung", t:"selectData", v:"3", data:"handlung" },
    { k:"ko", l:"Kommunikation", t:"selectData", v:"1", data:"kommunikation" },
    { k:"fu", l:"Mitarbeiterführung", t:"selectData", v:"-1", data:"fuehrung", leer:"keine Mitarbeiterführung (keine Bewertung)" },
    { k:"jahr", l:"Entgelttabelle für die Euro-Anzeige", t:"select", v:"2025", opts:TK.h.jahrOpts }
  ],
  run:function(f){
    var m = TK.tab.eraMerkmale, steps = [], summe = 0;
    function add(label, liste, idx){
      if(idx < 0) return;
      var r = liste[idx];
      if(!r) return;
      summe += r.p;
      steps.push({lbl:label + ": " + r.st + " – " + r.d, val:r.p + " Pkt."});
    }
    if(f.wk === "a"){
      add("Wissen und Können (Anlernen)", m.anlernen, parseInt(f.a,10));
    } else {
      add("Ausbildung", m.ausbildung, parseInt(f.b,10));
      add("Erfahrung", m.erfahrung, parseInt(f.e,10));
    }
    add("Denken", m.denken, parseInt(f.d,10));
    add("Handlungsspielraum", m.handlung, parseInt(f.hs,10));
    add("Kommunikation", m.kommunikation, parseInt(f.ko,10));
    var fu = parseInt(f.fu,10);
    if(fu < 0) steps.push({lbl:"Mitarbeiterführung: keine Bewertung (§ 5 Anlage 1)", val:"0 Pkt."});
    else add("Mitarbeiterführung", m.fuehrung, fu);
    steps.push({lbl:"Gesamtpunktzahl", val:summe + " Pkt.", cls:"sum"});
    var g = TK.h.egAusPunkte(summe), hinweise = [];
    var big, label;
    if(!g){
      big = summe + " Punkte";
      label = "unter 6 Punkten – keine Entgeltgruppe zugeordnet";
      hinweise.push("Die niedrigste Entgeltgruppe EG 1 beginnt bei 6 Punkten.");
    } else {
      big = "EG " + g.eg;
      label = summe + " Punkte (Spanne der EG " + g.eg + ": " + g.von + " bis " + g.bis + ")";
      steps.push({lbl:"Grundentgelt EG " + g.eg + " (" + TK.tab.entgelt[f.jahr].ab + ", 35 Std.)", val:TK.fmt.eur(TK.h.grundentgelt(g.eg, f.jahr))});
    }
    hinweise.push("Bewertet wird die Arbeitsaufgabe, nicht die Person (§ 4.1 ERA-TV). Grundlage ist eine Beschreibung der Arbeitsaufgabe; die Bewertung ist je Merkmal zu begründen (§ 6.4.1).");
    hinweise.push("Belastungen werden außerhalb des Verfahrens durch die Belastungszulage berücksichtigt (Anlage 2 ERA-TV).");
    return { big:big, bigLabel:label, steps:steps, hinweise:hinweise };
  },
  extra:function(){
    var h = "<h3>Punktzahl → Entgeltgruppe (§ 6.1.5 ERA-TV)</h3><div class=\"scroll-x\"><table><thead><tr><th>EG</th><th class=\"num\">Gesamtpunktzahl</th><th class=\"num\">EG</th><th class=\"num\">Gesamtpunktzahl</th></tr></thead><tbody>";
    var g = TK.tab.eraGruppen, i;
    for(i=0;i<9;i++){
      var a = g[i], b = g[i+9];
      h += "<tr><td>EG " + a.eg + "</td><td class=\"num\">" + (a.von===a.bis ? a.von : a.von + " – " + a.bis) + "</td>" +
           (b ? "<td class=\"num\">EG " + b.eg + "</td><td class=\"num\">" + b.von + " – " + b.bis + "</td>" : "<td></td><td></td>") + "</tr>";
    }
    h += "</tbody></table></div>";
    return h;
  }
},

/* 3 ---------------------------------------------------------------- */
{ id:"zuschlag", ico:"🌙", name:"Zuschlagsrechner",
  desc:"Stundenentgelt nach § 32.2 MTV und die Zuschläge für Mehr-, Spät-, Nacht-, Sonn- und Feiertagsarbeit.",
  refs:["§ 32.2 MTV","§ 33 MTV","§ 34 MTV","§ 35 MTV"],
  felder:[
    { k:"fest",  l:"Feste Bestandteile des Monatsentgelts", t:"number", v:3592, step:50, min:0, unit:"€ brutto", hint:"Grundentgelt, regelmäßige Zulagen, Belastungszulage, Sockelbetrag" },
    { k:"leist", l:"Leistungsabhängige variable Bestandteile", t:"number", v:538.8, step:10, min:0, unit:"€, Ø der letzten 3 Monate" },
    { k:"irwaz", l:"IRWAZ", t:"number", v:35, step:0.5, min:1, max:48, unit:"Std./Woche" },
    { k:"art",   l:"Zuschlagsart", t:"select", v:"ma25",
      opts:[
        {v:"ma25", l:"Mehrarbeit, erste 10 Stunden der Woche – 25 %"},
        {v:"ma50", l:"Mehrarbeit weitere Std. / 3. tägliche Std. / Sa nach 12 Uhr – 50 %"},
        {v:"spaet",l:"Spätarbeit 12 bis 19 Uhr – 20 %"},
        {v:"nacht",l:"Nachtarbeit 19 bis 6 Uhr – 30 %"},
        {v:"nacht12", l:"Nachtarbeit, Beschäftigte nach § 12 – 20 %"},
        {v:"nachtma", l:"Nachtarbeit, die zugleich Mehrarbeit ist – 50 %"},
        {v:"so",   l:"Sonntag / 24. und 31.12. ab 12 Uhr – 50 %"},
        {v:"ft100",l:"Feiertag auf arbeitsfreiem Werktag oder Sonntag – 100 %"},
        {v:"ft150",l:"Feiertag auf regelmäßigem Arbeitstag, Oster-/Pfingstsonntag, Weihnachten – 150 %"}
      ] },
    { k:"std",   l:"Zuschlagspflichtige Stunden", t:"number", v:8, step:0.5, min:0, unit:"Stunden" },
    { k:"nachtPlus", l:"Nachtarbeit an diesem Sonn-/Feiertag (§ 35.5: Nachtzuschlag kommt hinzu)", t:"check", v:false },
    { k:"grund", l:"Grundvergütung der Stunden zusätzlich ausweisen (bei Mehrarbeit)", t:"check", v:true }
  ],
  run:function(f){
    var satzListe = { ma25:25, ma50:50, spaet:20, nacht:30, nacht12:20, nachtma:50, so:50, ft100:100, ft150:150 };
    var namen = { ma25:"Mehrarbeitszuschlag (§ 35.1)", ma50:"Mehrarbeitszuschlag (§ 35.1)", spaet:"Spätarbeitszuschlag (§ 35.2)",
      nacht:"Nachtarbeitszuschlag (§ 35.3)", nacht12:"Nachtarbeitszuschlag § 12-Bereiche (§ 35.3)", nachtma:"Nachtarbeit = Mehrarbeit (§ 35.3)",
      so:"Sonntagszuschlag (§ 35.4)", ft100:"Feiertagszuschlag (§ 35.4)", ft150:"Feiertagszuschlag (§ 35.4)" };
    var irwaz = f.irwaz||35, teiler = 4.35*irwaz;
    var stunde = ((f.fest||0) + (f.leist||0)) / teiler;
    var satz = satzListe[f.art], std = f.std||0, steps = [], hinweise = [];
    steps.push({lbl:"Feste Bestandteile", val:TK.fmt.eur(f.fest||0)});
    steps.push({lbl:"Leistungsabhängige variable Bestandteile (Ø 3 Monate)", val:TK.fmt.eur(f.leist||0)});
    steps.push({lbl:"Teiler 4,35 × " + TK.fmt.num(irwaz,1) + " Std.", val:TK.fmt.num(teiler,2) + " Std."});
    steps.push({lbl:"Entgelt je Arbeitsstunde (§ 32.2 MTV)", val:TK.fmt.eur(stunde), cls:"sum"});
    var zuschlag = stunde * satz/100 * std;
    steps.push({lbl:namen[f.art] + ": " + satz + " % × " + TK.fmt.num(std,1) + " Std.", val:TK.fmt.eur(zuschlag)});
    var gesamt = zuschlag;
    if(f.nachtPlus && (f.art==="so" || f.art==="ft100" || f.art==="ft150")){
      var n = stunde * 0.30 * std;
      gesamt += n;
      steps.push({lbl:"zusätzlich Nachtzuschlag 30 % (§ 35.5 Satz 2)", val:TK.fmt.eur(n)});
    }
    if(f.grund && (f.art==="ma25" || f.art==="ma50" || f.art==="nachtma")){
      var gv = stunde * std;
      steps.push({lbl:"Mehrarbeitsgrundvergütung " + TK.fmt.num(std,1) + " Std. (§ 32.2)", val:TK.fmt.eur(gv)});
      steps.push({lbl:"Grundvergütung + Zuschlag", val:TK.fmt.eur(gv + gesamt), cls:"sum"});
    }
    if(f.art==="nachtma") hinweise.push("Die 50 % setzen sich aus 30 % Nacht- und 20 % Mehrarbeitsanteil zusammen – unabhängig davon, ob die Mehrarbeitsstunde sonst mit 25 % oder 50 % zu vergüten wäre.");
    hinweise.push("Beim Zusammentreffen mehrerer Zuschläge wird nur der höhere gezahlt; nur bei Nachtarbeit an Sonn- und Feiertagen kommt der Nachtzuschlag hinzu (§ 35.5).");
    hinweise.push("Bei Teilzeitbeschäftigten ist Mehrarbeit erst zuschlagspflichtig, soweit die tarifliche Arbeitszeit von 35 Stunden überschritten wird (§ 33.1).");
    return { big:TK.fmt.eur(gesamt), bigLabel:"Zuschlag für " + TK.fmt.num(std,1) + " Stunden", steps:steps, hinweise:hinweise };
  }
},

/* 4 ---------------------------------------------------------------- */
{ id:"tzug", ico:"🎁", name:"T-ZUG und Zusatzbetrag",
  desc:"Tarifliches Zusatzgeld (27,5 % eines Monatsverdienstes) und der Zusatzbetrag nach § 2 TV T-ZUG.",
  refs:["§ 2 TV T-ZUG","§ 3 TV T-ZUG","Anlage 3 TV Entgelte","§ 5 TV T-ZUG"],
  felder:[
    { k:"modus", l:"Monatsverdienst", t:"select", v:"direkt",
      opts:[{v:"direkt",l:"Monatsverdienst ist bekannt"},{v:"tage",l:"aus Entgelt und bezahlten Tagen berechnen (§ 2.2.1)"}] },
    { k:"mv",    l:"Monatsverdienst", t:"number", v:4130.8, step:50, min:0, unit:"€ brutto" },
    { k:"betrag",l:"Entgeltsumme der letzten 3 abgerechneten Monate", t:"number", v:12000, step:100, min:0, unit:"€", hint:"Feste und leistungsabhängige Bestandteile sowie zeitabhängige Bestandteile – ohne Mehrarbeit, Auslösungen, Entgeltfortzahlung, Krankengeldzuschuss, Urlaubsvergütung, AVWL, Einmalzahlungen" },
    { k:"tage",  l:"Bezahlte Tage in diesem Zeitraum (ohne Krankheits- und Urlaubstage)", t:"number", v:63, step:1, min:1 },
    { k:"jahr",  l:"Auszahlungsjahr", t:"select", v:"2025", opts:[{v:"2025",l:"2025 (Zusatzbetrag 651,50 €)"},{v:"2026",l:"2026 (Zusatzbetrag 952,00 €)"}] },
    { k:"irwaz", l:"IRWAZ", t:"number", v:35, step:0.5, min:1, max:48, unit:"Std./Woche", hint:"Der Zusatzbetrag wird bei weniger als 35 Stunden anteilig gezahlt" },
    { k:"frei",  l:"Freistellung statt T-ZUG gewählt (§ 25 MTV)", t:"check", v:false },
    { k:"anteil",l:"Anteilige Berechnung (Austrittsjahr oder teilweises Ruhen)", t:"number", v:12, step:1, min:1, max:12, unit:"von 12 Monaten" }
  ],
  run:function(f){
    var steps = [], hinweise = [], mv;
    if(f.modus === "tage"){
      var tagsatz = (f.betrag||0)/(f.tage||1);
      mv = tagsatz * 21.75;
      steps.push({lbl:"Entgeltsumme 3 Monate ÷ " + f.tage + " bezahlte Tage", val:TK.fmt.eur(tagsatz)});
      steps.push({lbl:"× Faktor 21,75 = Monatsverdienst", val:TK.fmt.eur(mv)});
    } else {
      mv = f.mv||0;
      steps.push({lbl:"Monatsverdienst", val:TK.fmt.eur(mv)});
    }
    var anteil = (f.anteil||12)/12;
    var tzug = f.frei ? 0 : mv * 0.275 * anteil;
    if(f.frei){
      steps.push({lbl:"T-ZUG 27,5 % – entfällt wegen Freistellung (§ 5 TV T-ZUG)", val:TK.fmt.eur(0)});
    } else {
      steps.push({lbl:"T-ZUG = 27,5 % des Monatsverdienstes" + (anteil<1 ? " × " + f.anteil + "/12" : ""), val:TK.fmt.eur(tzug)});
    }
    var zb = TK.tab.tzugZusatz[f.jahr].besch;
    var zbAnt = zb * Math.min(1,(f.irwaz||35)/35) * anteil;
    steps.push({lbl:"Zusatzbetrag " + f.jahr + " (Vollzeit " + TK.fmt.eur(zb) + ")" + ((f.irwaz||35)<35 ? " × " + TK.fmt.num(f.irwaz,1) + "/35" : "") + (anteil<1 ? " × " + f.anteil + "/12" : ""), val:TK.fmt.eur(zbAnt)});
    var summe = tzug + zbAnt;
    steps.push({lbl:"Auszahlung insgesamt", val:TK.fmt.eur(summe), cls:"sum"});
    if(!f.frei) steps.push({lbl:"Abgeltung je nicht realisierter Freistellungstag: 1/8 bzw. 1/6 des T-ZUG (§ 25.4 MTV)", val:TK.fmt.eur(tzug/8) + " / " + TK.fmt.eur(tzug/6)});
    hinweise.push("Anspruchsvoraussetzung: am Auszahlungstag im Arbeitsverhältnis und ununterbrochen 6 Monate im Betrieb (§ 2.1 TV T-ZUG).");
    hinweise.push("Auszahlung am 31. Juli, durch Betriebsvereinbarung spätestens zum 30. September (§ 3 TV T-ZUG).");
    if(f.frei) hinweise.push("Bei Wahl der Freistellung entfällt nur das T-ZUG nach § 2.2.1 – der Zusatzbetrag bleibt bestehen.");
    hinweise.push("Die Zusatzbeträge können nach § 4 TV T-ZUG mit Zustimmung der Tarifvertragsparteien gekürzt oder um bis zu 5 Monate verschoben werden.");
    return { big:TK.fmt.eur(summe), bigLabel:"T-ZUG + Zusatzbetrag " + f.jahr, steps:steps, hinweise:hinweise };
  }
},

/* 5 ---------------------------------------------------------------- */
{ id:"freietage", ico:"📅", name:"Freie Tage statt T-ZUG",
  desc:"Anspruchsumfang nach § 25 MTV, anteilige Berechnung bei abweichender Verteilung und Abgeltung nicht realisierter Tage.",
  refs:["§ 25.1 bis 25.4 MTV","§ 5 TV T-ZUG"],
  felder:[
    { k:"grund", l:"Anspruchsgrund", t:"select", v:"schicht",
      opts:[{v:"schicht",l:"Schichtarbeit (Wechselschicht, 3+ Schichten, nur Nachtschicht)"},
            {v:"pflege", l:"Pflege eines Angehörigen (ab Pflegegrad 1)"},
            {v:"kind",   l:"Betreuung eines Kindes bis 12 Jahre"}] },
    { k:"nr",    l:"Wievielte Inanspruchnahme?", t:"select", v:"1",
      opts:[{v:"1",l:"1. Inanspruchnahme (8 Tage)"},{v:"2",l:"2. Inanspruchnahme (8 Tage)"},{v:"3",l:"3. bis 5. Inanspruchnahme (6 Tage)"}] },
    { k:"tage",  l:"Arbeitstage pro Woche", t:"number", v:5, step:0.5, min:1, max:6, unit:"Tage", hint:"Der tarifliche Umfang gilt bei Verteilung auf 5 Tage pro Woche" },
    { k:"irwaz", l:"IRWAZ", t:"number", v:35, step:0.5, min:1, max:48, unit:"Std./Woche" },
    { k:"tzug",  l:"T-ZUG-Betrag (27,5 % eines Monatsverdienstes)", t:"number", v:1135.97, step:50, min:0, unit:"€" },
    { k:"offen", l:"Im Kalenderjahr nicht realisierte Freistellungstage", t:"number", v:0, step:1, min:0, unit:"Tage" }
  ],
  run:function(f){
    var basis = (f.nr === "3") ? 6 : 8;
    var quote = (f.tage||5)/5;
    var anspruch = basis * quote;
    var steps = [], hinweise = [];
    steps.push({lbl:"Tariflicher Umfang (" + (basis===8 ? "1. und 2." : "ab 3.") + " Inanspruchnahme)", val:basis + " Tage"});
    if(quote !== 1) steps.push({lbl:"Anteilig bei " + TK.fmt.num(f.tage,1) + " Arbeitstagen pro Woche: × " + TK.fmt.num(f.tage,1) + "/5", val:TK.fmt.num(anspruch,2) + " Tage"});
    var ganze = Math.floor(anspruch + 1e-9), rest = anspruch - ganze;
    steps.push({lbl:"Ganze freie Tage", val:ganze + " Tage"});
    if(rest > 0.001){
      var stdTag = (f.irwaz||35)/(f.tage||5);
      steps.push({lbl:"Restanspruch " + TK.fmt.num(rest,2) + " Tage – stunden-/minutenweise oder als Zeitgutschrift (§ 25.3)", val:TK.fmt.num(rest*stdTag,2) + " Std."});
    }
    var abgeltung = (f.offen||0) * (f.tzug||0) / basis;
    if(f.offen > 0){
      steps.push({lbl:"Abgeltung: " + f.offen + " × 1/" + basis + " des T-ZUG (§ 25.4)", val:TK.fmt.eur(abgeltung), cls:"sum"});
    }
    if(f.grund === "schicht"){
      hinweise.push("Voraussetzung: mindestens 5 Jahre ununterbrochene Betriebszugehörigkeit zum 31. Oktober, mindestens 3 Jahre Schichtarbeit beim derzeitigen Arbeitgeber und voraussichtliche Fortsetzung im Folgejahr (§ 25.1).");
    } else {
      hinweise.push("Voraussetzung: mindestens 2-jährige ununterbrochene Betriebszugehörigkeit zum 31. Oktober. Die Freistellung kann pro pflegebedürftigem Angehörigen bzw. pro Kind höchstens 5 Mal in Anspruch genommen werden (§ 25.2).");
    }
    hinweise.push("Antrag bis zum 31. Oktober für das Folgejahr; abweichender Stichtag durch freiwillige Betriebsvereinbarung möglich.");
    hinweise.push("Keine Übertragung ins Folgejahr. Erkrankt der Beschäftigte im genehmigten Freistellungszeitraum, bleibt der Anspruch im Umfang der nachgewiesenen AU-Tage erhalten.");
    hinweise.push("Beschäftigte in Altersteilzeit sind von § 25 ausgenommen.");
    return { big:(f.offen>0 ? TK.fmt.eur(abgeltung) : TK.fmt.num(anspruch,2) + " Tage"),
             bigLabel:(f.offen>0 ? "Abgeltung für " + f.offen + " nicht realisierte Tage" : "Freistellungsanspruch"),
             steps:steps, hinweise:hinweise };
  }
},

/* 6 ---------------------------------------------------------------- */
{ id:"soza", ico:"🎄", name:"Betriebliche Sonderzahlung",
  desc:"Staffel nach Betriebszugehörigkeit, Grundfall und abweichender Fall, Teilzeit und Optionsmodell.",
  refs:["§ 2.1 bis 2.4 TV SoZa","§ 3 TV SoZa","§ 4 TV SoZa"],
  felder:[
    { k:"me",    l:"Monatsentgelt (Berechnung nach § 2.3)", t:"number", v:4130.8, step:50, min:0, unit:"€ brutto" },
    { k:"bz",    l:"Betriebszugehörigkeit am Auszahlungstag", t:"number", v:36, step:1, min:0, unit:"Monate" },
    { k:"fall",  l:"Staffel", t:"select", v:"grund",
      opts:[{v:"grund",l:"Grundfall (25 / 35 / 45 / 55 %)"},{v:"abw",l:"abweichender Fall (30 / 40 / 50 / 60 %)"}] },
    { k:"irwaz", l:"IRWAZ", t:"number", v:35, step:0.5, min:1, max:48, unit:"Std./Woche" },
    { k:"option",l:"Optionsmodell (§ 3 TV SoZa)", t:"number", v:0, step:5, min:-50, max:50, unit:"% Kürzung (−) oder Erhöhung (+)" },
    { k:"ruhen", l:"Anteilige Leistung bei teilweisem Ruhen", t:"number", v:12, step:1, min:1, max:12, unit:"von 12 Monaten" }
  ],
  run:function(f){
    var staffel = TK.tab.sozaStaffel, satz = 0, stufe = null, i;
    for(i=0;i<staffel.length;i++){
      if((f.bz||0) >= staffel[i].monate){ stufe = staffel[i]; satz = (f.fall==="abw") ? staffel[i].abw : staffel[i].grund; }
    }
    var steps = [], hinweise = [];
    if(!stufe){
      steps.push({lbl:"Betriebszugehörigkeit " + (f.bz||0) + " Monate", val:"kein Anspruch"});
      hinweise.push("Der Anspruch setzt eine ununterbrochene Betriebszugehörigkeit von 6 Monaten am Auszahlungstag voraus (§ 2.1 TV SoZa).");
      return { big:TK.fmt.eur(0), bigLabel:"Kein Anspruch – Wartezeit von 6 Monaten nicht erfüllt", steps:steps, hinweise:hinweise };
    }
    steps.push({lbl:"Monatsentgelt", val:TK.fmt.eur(f.me||0)});
    steps.push({lbl:"Staffel: " + (f.fall==="abw"?"abweichender Fall":"Grundfall") + ", ab " + stufe.monate + " Monaten", val:TK.fmt.pct(satz,0)});
    var betrag = (f.me||0) * satz/100;
    steps.push({lbl:"Sonderzahlung " + TK.fmt.pct(satz,0) + " eines Monatsentgelts", val:TK.fmt.eur(betrag)});
    var q = Math.min(1,(f.irwaz||35)/35);
    if(q < 1){
      betrag *= q;
      steps.push({lbl:"Teilzeit anteilig: × " + TK.fmt.num(f.irwaz,1) + "/35 (§ 2.4)", val:TK.fmt.eur(betrag)});
    }
    if(f.option){
      betrag *= (1 + f.option/100);
      steps.push({lbl:"Optionsmodell " + (f.option>0?"+":"") + TK.fmt.pct(f.option,0) + " (§ 3)", val:TK.fmt.eur(betrag)});
    }
    if((f.ruhen||12) < 12){
      betrag *= f.ruhen/12;
      steps.push({lbl:"Anteilig " + f.ruhen + "/12", val:TK.fmt.eur(betrag)});
    }
    steps.push({lbl:"Auszahlung", val:TK.fmt.eur(betrag), cls:"sum"});
    hinweise.push("Kein Anspruch für Beschäftigte, die am Auszahlungstag selbst gekündigt haben (§ 2.1).");
    hinweise.push("Die Höhe bleibt durch Kurzarbeit unberührt. Wer wegen Erwerbs-/Berufsunfähigkeit, Altersgrenze oder Kündigung zwecks vorgezogenem Altersruhegeld ausscheidet, erhält die volle Leistung (§ 2.4).");
    hinweise.push("Ohne Betriebsvereinbarung gilt der 1. Dezember als Auszahlungstag (§ 4). Betriebliches Weihnachtsgeld und vergleichbare Leistungen erfüllen den Anspruch (§ 5).");
    hinweise.push("Endet der TV AVo ohne Neuregelung, erhöht sich die Staffel um 5 Prozentpunkte (§ 3.3 TV AVo).");
    return { big:TK.fmt.eur(betrag), bigLabel:"Betriebliche Sonderzahlung", steps:steps, hinweise:hinweise };
  },
  extra:function(){
    var h = "<h3>Staffel (§ 2.2 TV SoZa)</h3><table><thead><tr><th>Betriebszugehörigkeit</th><th class=\"num\">Grundfall</th><th class=\"num\">abweichender Fall</th></tr></thead><tbody>";
    var s = TK.tab.sozaStaffel, i;
    for(i=0;i<s.length;i++){ h += "<tr><td>nach " + s[i].monate + " Monaten</td><td class=\"num\">" + s[i].grund + " %</td><td class=\"num\">" + s[i].abw + " %</td></tr>"; }
    h += "</tbody></table>";
    return h;
  }
},

/* 7 ---------------------------------------------------------------- */
{ id:"urlaubsgeld", ico:"☀️", name:"Zusätzliches Urlaubsgeld",
  desc:"Standardmodell (pro Urlaubstag) und Alternativmodell (Urlaubstage / 21,75) nach § 4 Urlaubsabkommen.",
  refs:["§ 4.2 Urlaubsabkommen","§ 4.3 Urlaubsabkommen","§ 4.4 Urlaubsabkommen"],
  felder:[
    { k:"modell", l:"Modell", t:"select", v:"standard",
      opts:[{v:"standard",l:"Standardmodell – pro Urlaubstag (§ 4.3)"},{v:"alt",l:"Alternativmodell – Stichtag (§ 4.4)"}] },
    { k:"fest",   l:"Feste und leistungsabhängige Bestandteile (§ 4.2 Abs. 1)", t:"number", v:4130.8, step:50, min:0, unit:"€/Monat" },
    { k:"zeit",   l:"Betrag der zeitabhängigen Bestandteile je Urlaubstag (§ 4.2 Abs. 2)", t:"number", v:0, step:5, min:0, unit:"€/Tag" },
    { k:"tage",   l:"Urlaubstage", t:"number", v:30, step:1, min:0, max:40, unit:"Tage" },
    { k:"teiler", l:"Teiler", t:"number", v:21.75, step:0.25, min:1, unit:"Tage", hint:"Bei Verteilung auf weniger als 5 Tage pro Woche ist der Wert entsprechend umzurechnen (Fußnote zu § 4.3)" }
  ],
  run:function(f){
    var steps = [], hinweise = [], gesamt, proTag;
    if(f.modell === "standard"){
      var basis = (f.fest||0)/(f.teiler||21.75);
      steps.push({lbl:"1/" + TK.fmt.num(f.teiler,2) + " der festen und leistungsabhängigen Bestandteile", val:TK.fmt.eur(basis)});
      if(f.zeit) steps.push({lbl:"zeitabhängige Bestandteile je Urlaubstag", val:TK.fmt.eur(f.zeit)});
      proTag = (basis + (f.zeit||0)) * 0.5;
      steps.push({lbl:"50 % hiervon = zusätzliches Urlaubsgeld je Urlaubstag", val:TK.fmt.eur(proTag), cls:"sum"});
      gesamt = proTag * (f.tage||0);
      steps.push({lbl:"× " + TK.fmt.num(f.tage,0) + " Urlaubstage", val:TK.fmt.eur(gesamt), cls:"sum"});
      hinweise.push("Auf einen Urlaubstag entfällt 1/5 der individuellen regelmäßigen wöchentlichen Arbeitszeit (§ 4.3).");
    } else {
      steps.push({lbl:"Monatsverdienst (feste und leistungsabhängige Bestandteile im Abrechnungsmonat, zeitabhängige aus 3 Monaten × 21,75)", val:TK.fmt.eur(f.fest||0)});
      steps.push({lbl:"Urlaubstage / " + TK.fmt.num(f.teiler,2), val:TK.fmt.num((f.tage||0)/(f.teiler||21.75),4)});
      gesamt = (f.tage||0)/(f.teiler||21.75) * (f.fest||0) * 0.5;
      steps.push({lbl:"× 50 % des Monatsverdienstes", val:TK.fmt.eur(gesamt), cls:"sum"});
      hinweise.push("Das Alternativmodell setzt eine freiwillige Betriebsvereinbarung voraus und löst die Verknüpfung mit der tatsächlichen Urlaubsnahme (Fußnote zu § 4.4).");
    }
    hinweise.push("Auszahlung grundsätzlich zusammenhängend an einem Stichtag spätestens bis zum 30. Juni; per Betriebsvereinbarung auch mit Urlaubsnahme (§ 4.3).");
    hinweise.push("Die Urlaubsvergütung bleibt durch Kurzarbeit unberührt (§ 4.5). Tariferhöhungen im Urlaubszeitraum sind zu berücksichtigen (§ 4.6).");
    hinweise.push("Während der Altersteilzeit besteht kein Anspruch auf das zusätzliche Urlaubsgeld (§ 5.3 TV FlexÜ).");
    return { big:TK.fmt.eur(gesamt), bigLabel:"Zusätzliches Urlaubsgeld", steps:steps, hinweise:hinweise };
  }
},

/* 8 ---------------------------------------------------------------- */
{ id:"urlaub", ico:"🏖️", name:"Urlaubsanspruch",
  desc:"Jahresurlaub mit Zusatzurlaub, Zwölftelung bei Ein- und Austritt, Kürzung und Rundung.",
  refs:["§ 3 Urlaubsabkommen","§ 2.2 Urlaubsabkommen","§ 208 SGB IX"],
  felder:[
    { k:"jub",   l:"Betriebszugehörigkeit mindestens 25 Jahre (Jubilare, + 1 Tag)", t:"check", v:false },
    { k:"giess", l:"Ständig in der Gießerei unter erschwerten Bedingungen (+ 2 Tage)", t:"check", v:false },
    { k:"sb",    l:"Schwerbehindert (gesetzlicher Zusatzurlaub, + 5 Tage bei 5-Tage-Woche)", t:"check", v:false },
    { k:"monate",l:"Monate des Bestehens des Arbeitsverhältnisses im Urlaubsjahr", t:"number", v:12, step:1, min:1, max:12, unit:"angefangene Monate", hint:"Im Eintritts- und Austrittsjahr 1/12 je angefangenen Monat (§ 3.7)" },
    { k:"kuerz", l:"Kürzungsmonate nach § 3.9 (Ruhen über 3 Monate / Krankheit über 9 Monate)", t:"number", v:0, step:1, min:0, max:12, unit:"Monate" },
    { k:"zweite",l:"Austritt in der zweiten Kalenderjahreshälfte (gesetzlicher Mindesturlaub als Untergrenze)", t:"check", v:false },
    { k:"tage",  l:"Arbeitstage pro Woche", t:"number", v:5, step:0.5, min:1, max:6, unit:"Tage", hint:"Urlaubsrechtlich gelten stets 5 Tage je Woche als Arbeitstage (§ 3.5)" }
  ],
  run:function(f){
    var steps = [], hinweise = [];
    var basis = 30;
    steps.push({lbl:"Regelurlaub (§ 3.1)", val:"30 Arbeitstage"});
    if(f.jub){ basis += 1; steps.push({lbl:"Zusatzurlaub Jubilare ab 25 Jahren (§ 3.2)", val:"+ 1 Tag"}); }
    if(f.giess){ basis += 2; steps.push({lbl:"Zusatzurlaub Gießerei (§ 3.3)", val:"+ 2 Tage"}); }
    if(f.sb){ basis += 5; steps.push({lbl:"Gesetzlicher Zusatzurlaub schwerbehinderter Menschen (§ 3.4, § 208 SGB IX)", val:"+ 5 Tage"}); }
    steps.push({lbl:"Jahresurlaub", val:TK.fmt.num(basis,0) + " Tage", cls:"sum"});
    var wert = basis;
    if((f.monate||12) < 12){
      wert = basis * f.monate/12;
      steps.push({lbl:"Zwölftelung: " + f.monate + "/12 (§ 3.7)", val:TK.fmt.num(wert,2) + " Tage"});
    }
    if(f.kuerz > 0){
      var k = basis * f.kuerz/12;
      wert -= k;
      steps.push({lbl:"Kürzung " + f.kuerz + " × 1/12 (§ 3.9)", val:"− " + TK.fmt.num(k,2) + " Tage"});
    }
    if(wert < 0) wert = 0;
    var gerundet = Math.floor(wert) + ((wert - Math.floor(wert)) >= 0.5 ? 1 : 0);
    steps.push({lbl:"Rundung: Bruchteile ab einem halben Tag aufrunden (§ 3.11)", val:TK.fmt.num(gerundet,0) + " Tage"});
    var ergebnis = gerundet;
    if(f.zweite){
      var minG = Math.round(20 * Math.min(1,(f.tage||5)/5));
      if(ergebnis < minG){
        ergebnis = minG;
        steps.push({lbl:"Untergrenze gesetzlicher Mindesturlaub (§ 3.7 Satz 2, § 3 BUrlG)", val:TK.fmt.num(minG,0) + " Tage", cls:"sum"});
      } else {
        steps.push({lbl:"Gesetzlicher Mindesturlaub (" + minG + " Tage) ist nicht unterschritten", val:"ok"});
      }
    }
    if(f.tage !== 5) hinweise.push("Urlaubsrechtlich gelten stets 5 Tage je Woche als Arbeitstage – auch bei Verteilung auf mehr oder weniger Tage (§ 3.5). Die Angabe der Arbeitstage wirkt hier nur auf den gesetzlichen Mindesturlaub.");
    hinweise.push("Wartezeit: Der volle Anspruch entsteht erstmalig nach 6-monatigem ununterbrochenem Arbeitsverhältnis (§ 2.2).");
    hinweise.push("Entgeltzahlungspflichtige Feiertage im Urlaub werden nicht als Urlaubstage angerechnet (§ 3.5); ärztlich nachgewiesene AU-Tage im Urlaub ebenfalls nicht (§ 2.5).");
    hinweise.push("Übertragung bis 31. März, bei Krankheit bis 31. März des zweiten Folgejahres (§ 2.6). Keine Kürzung bei Berufskrankheit oder nicht grob fahrlässig verschuldetem Arbeitsunfall (§ 3.9).");
    return { big:TK.fmt.num(ergebnis,0) + " Urlaubstage", bigLabel:"Anspruch im Urlaubsjahr", steps:steps, hinweise:hinweise };
  }
},

/* 9 ---------------------------------------------------------------- */
{ id:"lohnsicherung", ico:"🕓", name:"Lohnsicherung: Alterssicherungsbetrag (§ 40 MTV)",
  desc:"Alterssicherungsbetrag aus seinen sechs Bestandteilen, Begrenzung auf 137,5 % der höchsten Entgeltgruppe und Aufzahlung im Vergleichsmonat.",
  refs:["§ 40.1 bis 40.3 MTV","§ 40.4 MTV","§ 40.5 / 40.6 MTV","§ 40.7 MTV","§ 40.10 MTV"],
  felder:[
    { k:"alter", l:"Alter des Beschäftigten", t:"number", v:56, step:1, min:30, max:70, unit:"Jahre", hint:"Anspruch ab Vollendung des 54. Lebensjahres" },
    { k:"bz",    l:"Betriebs- oder Unternehmenszugehörigkeit", t:"number", v:15, step:1, min:0, max:50, unit:"Jahre", hint:"Mindestens 10 Jahre erforderlich" },
    { k:"ge",    l:"a) Monatsgrundentgelt der EG zu Beginn", t:"number", v:3592, step:50, min:0, unit:"€" },
    { k:"leist", l:"b) Ø leistungsabhängige variable Bestandteile (36 Monate)", t:"number", v:538.8, step:10, min:0, unit:"€" },
    { k:"zmodus",l:"c) Zuschläge Sonn-/Feiertags-/Spät-/Nacht-/Montagearbeit", t:"select", v:"formel",
      opts:[{v:"direkt",l:"Monatsdurchschnitt ist bekannt"},{v:"formel",l:"nach § 40.5 aus Gesamtbetrag und Stunden berechnen"}] },
    { k:"zdirekt", l:"Monatsdurchschnitt der Zuschläge", t:"number", v:0, step:10, min:0, unit:"€" },
    { k:"zgesamt", l:"Gesamtbetrag der Zuschläge im Referenzzeitraum", t:"number", v:9000, step:100, min:0, unit:"€" },
    { k:"zstunden",l:"Tatsächlich gearbeitete Stunden im Referenzzeitraum", t:"number", v:4500, step:50, min:1, unit:"Stunden" },
    { k:"irwaz", l:"IRWAZ zu Beginn der Verdienstsicherung", t:"number", v:35, step:0.5, min:1, max:48, unit:"Std./Woche" },
    { k:"zvoraus", l:"Voraussetzungen des § 40.5 erfüllt (regelmäßige Arbeitsaufgabe; bei Spät-/Nachtarbeit mehr als 4 von 8 Jahren)", t:"check", v:true },
    { k:"bel",   l:"d) Belastungszulage zu Beginn", t:"number", v:0, step:10, min:0, unit:"€" },
    { k:"va",    l:"e) Verdienstausgleich nach § 13 ERA-TV zu Beginn", t:"number", v:0, step:10, min:0, unit:"€" },
    { k:"ueber", l:"f) Übertarifliche Zulage zu Beginn", t:"number", v:0, step:10, min:0, unit:"€" },
    { k:"jahr",  l:"Entgelttabelle für die 137,5-%-Grenze", t:"select", v:"2025", opts:TK.h.jahrOpts },
    { k:"irwazNeu", l:"Aktuelle IRWAZ (bei späterer Änderung, § 40.7)", t:"number", v:35, step:0.5, min:1, max:48, unit:"Std./Woche" },
    { k:"dv",    l:"Durchschnittsverdienst im Vergleichszeitraum", t:"number", v:4000, step:50, min:0, unit:"€", hint:"Nur Bestandteile, die auch im Alterssicherungsbetrag enthalten sind (§ 40.10)" }
  ],
  run:function(f){
    var steps = [], hinweise = [], warn = null;
    if((f.alter||0) < 54 || (f.bz||0) < 10){
      warn = "Die Voraussetzungen des § 40.1 MTV sind nicht erfüllt: erforderlich sind die Vollendung des 54. Lebensjahres und mindestens zehn Jahre Betriebs- oder Unternehmenszugehörigkeit. Die folgende Rechnung ist daher nur eine Vorausberechnung.";
    }
    var z = 0;
    if(f.zvoraus){
      if(f.zmodus === "formel"){
        var proStd = (f.zgesamt||0)/(f.zstunden||1);
        z = proStd * 4.35 * (f.irwaz||35);
      } else {
        z = f.zdirekt||0;
      }
    }
    steps.push({lbl:"a) Monatsgrundentgelt der Entgeltgruppe", val:TK.fmt.eur(f.ge||0)});
    steps.push({lbl:"b) Ø leistungsabhängige variable Bestandteile (36 Monate)", val:TK.fmt.eur(f.leist||0)});
    if(f.zvoraus && f.zmodus === "formel"){
      steps.push({lbl:"c) Zuschläge: " + TK.fmt.eur(f.zgesamt||0) + " ÷ " + TK.fmt.num(f.zstunden,0) + " Std.", val:TK.fmt.eur((f.zgesamt||0)/(f.zstunden||1)) + "/Std.", cls:"sub"});
      steps.push({lbl:"c) × 4,35 × " + TK.fmt.num(f.irwaz,1) + " Std. (§ 40.5)", val:TK.fmt.eur(z)});
    } else {
      steps.push({lbl:"c) Zuschläge Sonn-/Feiertags-/Spät-/Nacht-/Montagearbeit" + (f.zvoraus ? "" : " – Voraussetzungen des § 40.5 nicht erfüllt"), val:TK.fmt.eur(z)});
    }
    steps.push({lbl:"d) Belastungszulage", val:TK.fmt.eur(f.bel||0)});
    steps.push({lbl:"e) Verdienstausgleich § 13 ERA-TV", val:TK.fmt.eur(f.va||0)});
    steps.push({lbl:"f) Übertarifliche Zulage", val:TK.fmt.eur(f.ueber||0)});
    var summe = (f.ge||0) + (f.leist||0) + z + (f.bel||0) + (f.va||0) + (f.ueber||0);
    steps.push({lbl:"Summe a) bis f)", val:TK.fmt.eur(summe), cls:"sum"});
    var eg17 = TK.h.eg17(f.jahr), grenze = eg17 * 1.375;
    steps.push({lbl:"Grenze: 137,5 % des Grundentgelts der EG 17 (" + TK.fmt.eur(eg17) + ")", val:TK.fmt.eur(grenze)});
    var asb = summe;
    if(summe > grenze){
      asb = grenze;
      steps.push({lbl:"Begrenzung greift (§ 40.4 letzter Absatz)", val:TK.fmt.eur(asb), cls:"sum"});
      hinweise.push("Die Begrenzung bezieht sich auf die errechnete Summe, nicht auf die einzelnen Bestandteile.");
    }
    var asbAkt = asb;
    if((f.irwazNeu||35) !== (f.irwaz||35)){
      asbAkt = asb * (f.irwazNeu||35)/(f.irwaz||35);
      steps.push({lbl:"Umrechnung auf aktuelle IRWAZ " + TK.fmt.num(f.irwazNeu,1) + " Std. (§ 40.7)", val:TK.fmt.eur(asbAkt), cls:"sum"});
    }
    steps.push({lbl:"Durchschnittsverdienst im Vergleichszeitraum (§ 40.10)", val:TK.fmt.eur(f.dv||0)});
    var auf = asbAkt - (f.dv||0);
    if(auf > 0){
      steps.push({lbl:"Aufzahlung bis zum Alterssicherungsbetrag", val:TK.fmt.eur(auf), cls:"sum"});
    } else {
      steps.push({lbl:"Keine Aufzahlung – Durchschnittsverdienst erreicht den Alterssicherungsbetrag", val:TK.fmt.eur(0), cls:"sum"});
    }
    hinweise.push("Der Alterssicherungsbetrag ist aufgegliedert festzuschreiben; Beschäftigter und Betriebsrat sind unverzüglich in Textform zu unterrichten (§§ 40.8, 40.9).");
    hinweise.push("Nicht einzubeziehen sind Mehrarbeitszuschläge und sonstige unregelmäßige Bezüge, AVWL, Auslösungen, Gratifikationen, zusätzliches Urlaubsgeld, tarifliche Sonderzahlung, T-ZUG und Zusatzbetrag sowie der Trafobaustein (§ 40.6).");
    hinweise.push("Tarifbedingte Erhöhungen erhöhen den Alterssicherungsbetrag, leistungsbedingte Änderungen und allgemeine betriebliche Entgelterhöhungen nicht (§ 40.11).");
    hinweise.push("Der Vergleich ist monatlich vorzunehmen; der mit dem Betriebsrat festzulegende Vergleichszeitraum darf 12 Monate nicht übersteigen (§ 40.10).");
    return { big:TK.fmt.eur(asbAkt), bigLabel:"Alterssicherungsbetrag – garantierter Mindestverdienst", steps:steps, hinweise:hinweise, warn:warn };
  }
},

/* 10 --------------------------------------------------------------- */
{ id:"verdienstausgleich", ico:"⚖️", name:"Verdienstausgleich (§ 13 ERA-TV)",
  desc:"Ausgleich bei Verminderung des Grundentgeltanspruchs, mit Kappung auf 10 bzw. 13 Prozent.",
  refs:["§ 12 ERA-TV","§ 13.2 ERA-TV","§ 13.3 ERA-TV","§ 13.4 ERA-TV"],
  felder:[
    { k:"geAlt", l:"Bisheriges Grundentgelt", t:"number", v:4095, step:50, min:1, unit:"€" },
    { k:"leAlt", l:"Bisheriges Leistungsentgelt (Ø der letzten 3 Monate)", t:"number", v:614.25, step:10, min:0, unit:"€" },
    { k:"belAlt",l:"Bisherige Belastungszulage", t:"number", v:179.6, step:10, min:0, unit:"€" },
    { k:"geNeu", l:"Neues Grundentgelt", t:"number", v:3592, step:50, min:1, unit:"€" },
    { k:"belNeu",l:"Neue Belastungszulage", t:"number", v:0, step:10, min:0, unit:"€" },
    { k:"egNeu", l:"Entgeltgruppe für die Kappungsgrenze", t:"select", v:"hoch",
      opts:[{v:"nieder",l:"EG 1 bis 6 – Grenze 10 %"},{v:"hoch",l:"EG 7 bis 17 – Grenze 13 %"}] }
  ],
  run:function(f){
    var steps = [], hinweise = [];
    var altSumme = (f.geAlt||0) + (f.leAlt||0) + (f.belAlt||0);
    var leNeu = (f.leAlt||0) * (f.geNeu||0) / (f.geAlt||1);
    var neuSumme = (f.geNeu||0) + leNeu + (f.belNeu||0);
    steps.push({lbl:"Bisher: Grundentgelt + Leistungsentgelt + Belastungszulage", val:TK.fmt.eur(altSumme), cls:"sum"});
    steps.push({lbl:"Neues Leistungsentgelt = " + TK.fmt.eur(f.leAlt||0) + " × " + TK.fmt.eur(f.geNeu||0) + " / " + TK.fmt.eur(f.geAlt||0), val:TK.fmt.eur(leNeu), cls:"sub"});
    steps.push({lbl:"Neu: Grundentgelt + Leistungsentgelt + Belastungszulage", val:TK.fmt.eur(neuSumme), cls:"sum"});
    var va = altSumme - neuSumme;
    if(va < 0) va = 0;
    steps.push({lbl:"Verdienstausgleich (§ 13.2)", val:TK.fmt.eur(va), cls:"sum"});
    var grenzProz = (f.egNeu === "nieder") ? 10 : 13;
    var grenze = altSumme * grenzProz/100;
    steps.push({lbl:"Kappungsgrenze " + grenzProz + " % des bisherigen Entgelts", val:TK.fmt.eur(grenze)});
    var kern = va, zulage = 0;
    if(va > grenze){
      kern = grenze;
      zulage = va - grenze;
      steps.push({lbl:"davon Verdienstausgleich (bis zur Grenze)", val:TK.fmt.eur(kern)});
      steps.push({lbl:"davon Zulage zum regelmäßigen Monatsentgelt (§ 13.3)", val:TK.fmt.eur(zulage)});
      hinweise.push("Die Zulage nach § 13.3 nimmt an Tariferhöhungen teil.");
    }
    hinweise.push("Vorrang hat die Sicherung nach § 12: zunächst zumutbare Arbeitsaufgabe mit der bisherigen Entgeltgruppe, dann Qualifizierungsmaßnahme. Erst danach greift § 13.");
    hinweise.push("Voraussetzung: Der Anspruch auf das bisherige oder höhere Entgelt bestand länger als 6 Monate oder es bestand nicht nur Anspruch auf die Eingangsstufe (§ 13.1).");
    hinweise.push("Zahlung für 18 Monate ab Verminderung bzw. verbindlicher Einstufung, abzüglich Kündigungs- oder Ankündigungsfrist; danach kann die erste Grundentgelterhöhung voll, jede weitere bis zu 50 % angerechnet werden (§ 13.4).");
    hinweise.push("Der Verdienstausgleich ist gesondert auszuweisen, geht in nicht leistungsabhängige Zulagen und Zuschläge ein und zählt bei Beginn der Verdienstsicherung zum Alterssicherungsbetrag (§ 40.4 e MTV).");
    return { big:TK.fmt.eur(va), bigLabel:"Monatlicher Ausgleich insgesamt", steps:steps, hinweise:hinweise };
  }
},

/* 11 --------------------------------------------------------------- */
{ id:"krankheit", ico:"🩺", name:"Entgeltfortzahlung und Krankengeldzuschuss",
  desc:"Dauer der Entgeltfortzahlung und des Krankengeldzuschusses nach Betriebszugehörigkeit.",
  refs:["§ 36.2 MTV","§ 36.3 MTV","§ 36.4 MTV"],
  felder:[
    { k:"beginn", l:"Erster Tag der Arbeitsunfähigkeit", t:"date", v:"" },
    { k:"bz",     l:"Betriebszugehörigkeit", t:"number", v:6, step:1, min:0, max:50, unit:"Jahre" },
    { k:"variante",l:"Zuschussstaffel", t:"select", v:"normal",
      opts:[{v:"normal",l:"Regelfall: 2 / 4 / 6 Jahre → 1 / 2 / 3 Monate"},{v:"bv27",l:"Betriebsvereinbarung nach § 27 Abs. 3: 5 / 10 Jahre → 1 / 2 Monate"}] },
    { k:"unfall", l:"Arbeitsunfall (nicht grob fahrlässig verursacht)", t:"check", v:false },
    { k:"schon",  l:"Zuschuss im laufenden Kalenderjahr bereits in Anspruch genommen", t:"check", v:false }
  ],
  run:function(f){
    var steps = [], hinweise = [], warn = null;
    var monate = 0, staffel = "";
    if(f.variante === "bv27"){
      if((f.bz||0) >= 10){ monate = 2; staffel = "ab 10 Jahren"; }
      else if((f.bz||0) >= 5){ monate = 1; staffel = "ab 5 Jahren"; }
    } else {
      if((f.bz||0) >= 6){ monate = 3; staffel = "ab 6 Jahren"; }
      else if((f.bz||0) >= 4){ monate = 2; staffel = "ab 4 Jahren"; }
      else if((f.bz||0) >= 2){ monate = 1; staffel = "ab 2 Jahren"; }
    }
    steps.push({lbl:"Entgeltfortzahlung 100 % ab dem ersten Tag (§ 36.2)", val:"6 Wochen"});
    var d0 = f.beginn ? new Date(f.beginn) : null;
    if(d0 && !isNaN(d0.getTime())){
      var ende6 = new Date(d0.getTime()); ende6.setDate(ende6.getDate() + 41);
      steps.push({lbl:"Ende der 6 Wochen (42. Kalendertag)", val:TK.fmt.datum(ende6)});
    }
    if(f.unfall){
      steps.push({lbl:"Arbeitsunfall: Zuschuss ohne Rücksicht auf die Betriebszugehörigkeit (§ 36.4)", val:"bis zur 78. Woche"});
      if(d0 && !isNaN(d0.getTime())){
        var e78 = new Date(d0.getTime()); e78.setDate(e78.getDate() + 78*7 - 1);
        steps.push({lbl:"Ende der 78. Woche", val:TK.fmt.datum(e78)});
      }
      hinweise.push("Beim Arbeitsunfall gilt die Begrenzung auf einmal im Kalenderjahr nicht (§ 36.3 letzter Absatz). AVWL-Leistungen sind weiterzuzahlen.");
      return { big:"6 Wochen + bis 78. Woche", bigLabel:"Entgeltfortzahlung und Zuschuss bei Arbeitsunfall", steps:steps, hinweise:hinweise };
    }
    if(monate === 0){
      steps.push({lbl:"Krankengeldzuschuss (§ 36.3)", val:"kein Anspruch"});
      hinweise.push("Ein Krankengeldzuschuss setzt im Regelfall mindestens 2 Jahre Betriebszugehörigkeit voraus (bei Betriebsvereinbarung nach § 27 Abs. 3: 5 Jahre).");
    } else {
      steps.push({lbl:"Krankengeldzuschuss " + staffel + " (§ 36.3)", val:monate + (monate===1?" Monat":" Monate")});
      if(d0 && !isNaN(d0.getTime())){
        var start = new Date(d0.getTime()); start.setDate(start.getDate() + 42);
        var ende = TK.h.plusMonate(start, monate); ende.setDate(ende.getDate() - 1);
        steps.push({lbl:"Zuschusszeitraum", val:TK.fmt.datum(start) + " bis " + TK.fmt.datum(ende)});
      }
      steps.push({lbl:"Zuschusshöhe", val:"Differenz bis 100 % Netto"});
    }
    if(f.schon && monate > 0){
      warn = "Der Anspruch auf den Krankengeldzuschuss besteht nur einmal im Kalenderjahr (§ 36.3) – ausgenommen bei Arbeitsunfällen. Da er im laufenden Kalenderjahr bereits in Anspruch genommen wurde, besteht kein weiterer Anspruch.";
    }
    hinweise.push("Der Zuschuss ist die Differenz zwischen den Leistungen der Sozialversicherungsträger und 100 % der Nettoentgeltfortzahlung; er wird brutto gewährt und unterliegt den gesetzlichen Abzügen.");
    hinweise.push("AU-Bescheinigung: bei mehr als 3 Tagen Pflicht, bis 3 Tage nur auf Verlangen; nach 5 Jahren Betriebszugehörigkeit entfällt die Vorlagepflicht grundsätzlich (§ 36.1).");
    hinweise.push("Verdienstkürzungen infolge Kurzarbeit bleiben für die Entgeltfortzahlung außer Betracht (§ 36.2).");
    return { big:"6 Wochen" + (monate ? " + " + monate + (monate===1?" Monat":" Monate") : ""), bigLabel:"Entgeltfortzahlung und Krankengeldzuschuss", steps:steps, hinweise:hinweise, warn:warn };
  }
},

/* 12 --------------------------------------------------------------- */
{ id:"kuendigung", ico:"🚪", name:"Kündigungsfrist und Endtermin",
  desc:"Tarifliche Frist nach § 43.3 MTV, Endtermin zum Monats- oder Quartalsende und Prüfung des besonderen Kündigungsschutzes.",
  refs:["§ 43.1 MTV","§ 43.2 MTV","§ 43.3 MTV"],
  felder:[
    { k:"eintritt", l:"Eintrittsdatum", t:"date", v:"" },
    { k:"zugang",   l:"Zugang der Kündigung", t:"date", v:"" },
    { k:"partei",   l:"Wer kündigt?", t:"select", v:"ag",
      opts:[{v:"ag",l:"Arbeitgeber"},{v:"an",l:"Beschäftigte/r"}] },
    { k:"geb",      l:"Geburtsdatum (für § 43.2, optional)", t:"date", v:"" }
  ],
  run:function(f){
    var steps = [], hinweise = [], warn = null;
    var ein = f.eintritt ? new Date(f.eintritt) : null;
    var zug = f.zugang ? new Date(f.zugang) : null;
    if(!ein || isNaN(ein.getTime()) || !zug || isNaN(zug.getTime())){
      return { big:"–", bigLabel:"Bitte Eintrittsdatum und Zugang der Kündigung eingeben", steps:[], hinweise:["Die Kündigungsfrist beginnt frühestens mit dem Tag der vereinbarten Arbeitsaufnahme (§ 43.3)."] };
    }
    var mon = TK.h.monate(ein, zug), jahre = Math.floor(mon/12);
    steps.push({lbl:"Betriebszugehörigkeit bei Zugang", val:jahre + " Jahre, " + (mon - jahre*12) + " Monate"});
    var frist, bezug, para;
    if(f.partei === "ag" && jahre >= 12){ frist = 6; bezug = "quartal"; para = "§ 43.3 Abs. 3"; }
    else if(f.partei === "ag" && jahre >= 10){ frist = 5; bezug = "quartal"; para = "§ 43.3 Abs. 3"; }
    else if(f.partei === "ag" && jahre >= 8){ frist = 4; bezug = "quartal"; para = "§ 43.3 Abs. 3"; }
    else if(f.partei === "ag" && jahre >= 5){ frist = 3; bezug = "quartal"; para = "§ 43.3 Abs. 3"; }
    else if(mon >= 3){ frist = 2; bezug = "monat"; para = "§ 43.3 Abs. 2"; }
    else { frist = 1; bezug = "monat"; para = "§ 43.3 Abs. 2"; }
    steps.push({lbl:"Tarifliche Frist (" + para + ")", val:frist + (frist===1?" Monat":" Monate") + " zum " + (bezug==="quartal" ? "Quartalsende" : "Monatsende")});
    var ziel = TK.h.plusMonate(zug, frist);
    steps.push({lbl:"Zugang + " + frist + (frist===1?" Monat":" Monate"), val:TK.fmt.datum(ziel)});
    var ende = (bezug === "quartal") ? TK.h.naechstesQuartalsEnde(ziel) : TK.h.naechstesMonatsEnde(ziel);
    steps.push({lbl:"Frühester Beendigungstermin", val:TK.fmt.datum(ende), cls:"sum"});
    if(f.geb){
      var geb = new Date(f.geb);
      if(!isNaN(geb.getTime())){
        var alter = TK.h.jahre(geb, zug);
        steps.push({lbl:"Alter bei Zugang", val:alter + " Jahre"});
        if(alter >= 53 && jahre >= 10 && f.partei === "ag"){
          warn = "Besonderer Kündigungsschutz nach § 43.2 MTV: Bei Vollendung des 53. Lebensjahres und mindestens 10 Jahren Betriebszugehörigkeit ist eine Kündigung – auch eine Änderungskündigung – nur noch aus wichtigem Grund möglich (solange die Regelaltersgrenze nicht erreicht ist).";
        }
      }
    }
    hinweise.push("Kündigung und Aufhebungsvertrag bedürfen der Schriftform; die elektronische Form ist ausgeschlossen (§ 43.1).");
    if(f.partei === "an") hinweise.push("Die verlängerten Fristen des § 43.3 Abs. 3 gelten für die Kündigung des Arbeitgebers. Für Beschäftigte bleibt es bei der beiderseitigen Frist von 2 Monaten zum Monatsende (bzw. 1 Monat in den ersten 3 Monaten).");
    hinweise.push("Bei betriebsbedingter Kündigung gilt die Betriebszugehörigkeit als nicht unterbrochen, wenn eine frühere Unterbrechung nicht länger als 12 Monate dauerte (§ 2.6).");
    hinweise.push("Nach Kündigung besteht Anspruch auf angemessene bezahlte Freistellung zur Stellensuche (§ 44) und auf ein vorläufiges Zeugnis (§ 45). Für fristlose Kündigungen gelten die gesetzlichen Bestimmungen.");
    return { big:TK.fmt.datum(ende), bigLabel:"Frühester Beendigungstermin – Frist: " + frist + (frist===1?" Monat":" Monate") + " zum " + (bezug==="quartal"?"Quartalsende":"Monatsende"), steps:steps, hinweise:hinweise, warn:warn };
  },
  extra:function(){
    return "<h3>Fristen im Überblick (§ 43.3 MTV)</h3><table><thead><tr><th>Betriebszugehörigkeit</th><th>Frist</th><th>Termin</th></tr></thead><tbody>" +
      "<tr><td>in den ersten 3 Monaten</td><td>1 Monat</td><td>Monatsende</td></tr>" +
      "<tr><td>nach Ablauf der ersten 3 Monate</td><td>2 Monate</td><td>Monatsende</td></tr>" +
      "<tr><td>ab 5 Jahren (Arbeitgeber)</td><td>3 Monate</td><td>Kalendervierteljahr</td></tr>" +
      "<tr><td>ab 8 Jahren (Arbeitgeber)</td><td>4 Monate</td><td>Kalendervierteljahr</td></tr>" +
      "<tr><td>ab 10 Jahren (Arbeitgeber)</td><td>5 Monate</td><td>Kalendervierteljahr</td></tr>" +
      "<tr><td>ab 12 Jahren (Arbeitgeber)</td><td>6 Monate</td><td>Kalendervierteljahr</td></tr>" +
      "</tbody></table>";
  }
},

/* 13 --------------------------------------------------------------- */
{ id:"atz", ico:"🏗️", name:"Altersteilzeit: Aufstockung und Rente",
  desc:"Bruttoaufstockungsprozentsatz nach Anlage 1 TV FlexÜ, zusätzliche Rentenversicherungsbeiträge und Abfindung nach § 12.2.2.",
  refs:["§ 2.1 TV FlexÜ","§ 6 TV FlexÜ","§ 7 TV FlexÜ","§ 12 TV FlexÜ"],
  felder:[
    { k:"vollzeit", l:"Bisheriges Vollzeit-Bruttoentgelt", t:"number", v:4000, step:100, min:0, unit:"€/Monat" },
    { k:"rae",   l:"Regelarbeitsentgelt in der Altersteilzeit", t:"number", v:2000, step:50, min:0, unit:"€/Monat", hint:"In der Regel die Hälfte des bisherigen Entgelts (§ 6 Abs. 1 AltTZG)" },
    { k:"kat",   l:"Kategorie nach Anlage 1", t:"select", v:"a",
      opts:[{v:"a",l:"Kategorie A (Regelfall)"},{v:"b",l:"Kategorie B (verheiratet, mindestens 2/3 des gemeinsamen Arbeitseinkommens)"}] },
    { k:"alter", l:"Alter bei Beginn", t:"number", v:58, step:1, min:50, max:67, unit:"Jahre" },
    { k:"bz",    l:"Betriebszugehörigkeit", t:"number", v:15, step:1, min:0, max:50, unit:"Jahre" },
    { k:"schicht", l:"Bevorrechtigter Personenkreis nach § 12.2 (Schicht-/Nachtarbeit, starke Umgebungseinflüsse)", t:"check", v:false },
    { k:"luecke", l:"Monate zwischen Ende der Altersteilzeit und ungeminderter Altersrente", t:"number", v:0, step:1, min:0, max:60, unit:"Monate" }
  ],
  run:function(f){
    var steps = [], hinweise = [], warn = null;
    var tab = TK.tab.atzAufstockung, i, satz = tab[tab.length-1][f.kat];
    for(i=0;i<tab.length;i++){ if((f.rae||0) <= tab[i].bis){ satz = tab[i][f.kat]; break; } }
    steps.push({lbl:"Regelarbeitsentgelt", val:TK.fmt.eur(f.rae||0)});
    steps.push({lbl:"Bruttoaufstockungsprozentsatz, Kategorie " + f.kat.toUpperCase() + " (Anlage 1)", val:TK.fmt.pct(satz,1)});
    var auf = (f.rae||0) * satz/100;
    steps.push({lbl:"Aufstockungsbetrag (§ 6)", val:TK.fmt.eur(auf)});
    var gesamt = (f.rae||0) + auf;
    steps.push({lbl:"Altersteilzeitentgelt + Aufstockung", val:TK.fmt.eur(gesamt), cls:"sum"});
    if(f.vollzeit) steps.push({lbl:"im Verhältnis zum bisherigen Vollzeitentgelt", val:TK.fmt.pct(gesamt/(f.vollzeit)*100,1)});
    steps.push({lbl:"Zusätzliche Rentenversicherung: Beitrag mindestens auf 90 % des Regelarbeitsentgelts (§ 7.1)", val:TK.fmt.eur((f.rae||0)*0.9) + " Bemessung"});
    if(f.luecke > 0 && f.schicht){
      var mon = Math.min(24, f.luecke);
      var abf = mon * 250;
      steps.push({lbl:"Abfindung " + mon + " × 250 € (§ 12.2.2, höchstens 24 Monate)", val:TK.fmt.eur(abf), cls:"sum"});
      if(f.luecke > 24) hinweise.push("Die Abfindung ist auf maximal 24 Monate begrenzt – " + (f.luecke-24) + " Monate bleiben unberücksichtigt.");
    } else if(f.luecke > 0){
      hinweise.push("Die Abfindung von 250 € je Monat nach § 12.2.2 gilt nur für den bevorrechtigten Personenkreis des § 12.2 (Schicht-/Nachtarbeit oder besonders starke Umgebungseinflüsse).");
    }
    if((f.alter||0) < 57) warn = "Altersteilzeit setzt nach § 2.1 TV FlexÜ die Vollendung des 57. Lebensjahres voraus (bevorrechtigter Anspruch nach § 12.2: frühestens ab 58).";
    else if(f.schicht && (f.alter||0) < 58) warn = "Der bevorrechtigte Anspruch nach § 12.2 besteht frühestens ab Vollendung des 58. Lebensjahres.";
    else if((f.bz||0) < 12) warn = "Der individuelle Anspruch nach § 12 setzt eine Betriebszugehörigkeit von mindestens 12 Jahren voraus; eine Vereinbarung ist aber auch ohne Anspruch möglich (§ 2.1).";
    hinweise.push("Weitere Voraussetzung: in den letzten 5 Jahren mindestens 1080 Kalendertage versicherungspflichtige Beschäftigung nach SGB III (§ 2.1).");
    hinweise.push("Quoten: Der Anspruch ist ausgeschlossen, wenn 4 % der Beschäftigten Altersteilzeit in Anspruch nehmen; für den bevorrechtigten Personenkreis nach § 12.2 gilt eine eigene Quote von 3 % (§ 12.1.1, § 12.2.3).");
    hinweise.push("Während der Altersteilzeit bestehen keine Ansprüche auf zusätzliches Urlaubsgeld und die tarifliche Sonderzahlung (§ 5.3). Ein Ausgleich von Rentenabschlägen findet nicht statt (§ 7.2).");
    hinweise.push("Der Prozentsatz wird im ersten Monat ermittelt und bleibt für die Laufzeit gleich; beim Übergang in die Freistellungsphase wird er nach § 5.2 neu ermittelt.");
    return { big:TK.fmt.eur(gesamt), bigLabel:"Monatlich: Altersteilzeitentgelt + Aufstockung", steps:steps, hinweise:hinweise, warn:warn };
  },
  extra:function(){
    var h = "<h3>Bruttoaufstockungsprozentsatz (Anlage 1 TV FlexÜ)</h3><div class=\"scroll-x\"><table><thead><tr><th>Regelarbeitsentgelt</th><th class=\"num\">Kategorie A</th><th class=\"num\">Kategorie B</th></tr></thead><tbody>";
    var t = TK.tab.atzAufstockung, i, vonWert = 0;
    for(i=0;i<t.length;i++){
      var label;
      if(i === 0) label = "bis " + TK.fmt.eur(t[i].bis);
      else if(t[i].bis === Infinity) label = "ab " + TK.fmt.eur(vonWert);
      else label = TK.fmt.eur(vonWert) + " bis " + TK.fmt.eur(t[i].bis);
      h += "<tr><td>" + label + "</td><td class=\"num\">" + TK.fmt.pct(t[i].a,1) + "</td><td class=\"num\">" + TK.fmt.pct(t[i].b,1) + "</td></tr>";
      vonWert = Math.round((t[i].bis + 0.01)*100)/100;
    }
    h += "</tbody></table></div>";
    return h;
  }
},

/* 14 --------------------------------------------------------------- */
{ id:"trafo", ico:"📉", name:"Trafobaustein",
  desc:"18,4 % eines Monatsverdienstes nach § 7.1 TV Beschäftigungssicherung.",
  refs:["§ 7.1 TV Besch"],
  felder:[
    { k:"modus", l:"Monatsverdienst", t:"select", v:"direkt",
      opts:[{v:"direkt",l:"Monatsverdienst ist bekannt"},{v:"tage",l:"aus Entgelt und bezahlten Tagen berechnen"}] },
    { k:"mv",    l:"Monatsverdienst", t:"number", v:4130.8, step:50, min:0, unit:"€ brutto" },
    { k:"betrag",l:"Entgeltsumme der letzten 3 abgerechneten Monate", t:"number", v:12000, step:100, min:0, unit:"€" },
    { k:"tage",  l:"Bezahlte Tage (ohne Krankheits- und Urlaubstage)", t:"number", v:63, step:1, min:1 },
    { k:"anteil",l:"Anteilige Berechnung (Austrittsjahr / teilweises Ruhen)", t:"number", v:12, step:1, min:1, max:12, unit:"von 12 Monaten" }
  ],
  run:function(f){
    var steps = [], mv;
    if(f.modus === "tage"){
      var t = (f.betrag||0)/(f.tage||1);
      mv = t * 21.75;
      steps.push({lbl:"Entgeltsumme ÷ " + f.tage + " bezahlte Tage", val:TK.fmt.eur(t)});
      steps.push({lbl:"× Faktor 21,75", val:TK.fmt.eur(mv)});
    } else {
      mv = f.mv||0;
      steps.push({lbl:"Monatsverdienst", val:TK.fmt.eur(mv)});
    }
    var betrag = mv * 0.184 * (f.anteil||12)/12;
    steps.push({lbl:"Trafobaustein = 18,4 % eines Monatsverdienstes" + ((f.anteil||12)<12 ? " × " + f.anteil + "/12" : ""), val:TK.fmt.eur(betrag), cls:"sum"});
    return { big:TK.fmt.eur(betrag), bigLabel:"Trafobaustein", steps:steps, hinweise:[
      "Anspruch: am 31. Juli im Arbeitsverhältnis und ununterbrochen 6 Monate im Betrieb; im Austrittsjahr anteilig, bei ruhendem Arbeitsverhältnis keine bzw. anteilige Leistung.",
      "Auszahlung mit der Juli-Abrechnung, durch Betriebsvereinbarung spätestens zum 30. September.",
      "Der Trafobaustein kann je nach wirtschaftlicher Situation ganz oder teilweise entfallen oder um bis zu 5 Monate verschoben werden – mit vorheriger Zustimmung der Tarifvertragsparteien.",
      "Der Trafobaustein wird nicht in den Alterssicherungsbetrag nach § 40 MTV einbezogen (§ 40.6 MTV)."
    ] };
  }
},

/* 15 --------------------------------------------------------------- */
{ id:"azubi", ico:"🎓", name:"Ausbildungsvergütung und Azubi-T-ZUG",
  desc:"Ausbildungsvergütung nach Tabelle und Relation zu EG 7, T-ZUG und Zusatzbetrag für Auszubildende.",
  refs:["§ 3 TV Entgelte","§ 2.2.3 / 2.2.4 TV T-ZUG","Anlage 3 TV Entgelte"],
  felder:[
    { k:"jahr",  l:"Ausbildungsjahr", t:"select", v:"1",
      opts:[{v:"1",l:"1. Ausbildungsjahr (35,2 % EG 7)"},{v:"2",l:"2. Ausbildungsjahr (37,2 %)"},{v:"3",l:"3. Ausbildungsjahr (40,2 %)"},{v:"4",l:"4. Ausbildungsjahr (42,2 %)"}] },
    { k:"stand", l:"Stand", t:"select", v:"2025",
      opts:[{v:"2025",l:"ab 01.01.2025"},{v:"2026",l:"ab 01.04.2026"}] },
    { k:"schmied", l:"Ausbildung als Formschmied, Gesenkschmied, Kettenschmied oder Former (+ 23,01 €)", t:"check", v:false }
  ],
  run:function(f){
    var idx = parseInt(f.jahr,10)-1, steps = [], hinweise = [];
    var tab = TK.tab.azubi[f.stand], wert = tab.werte[idx];
    steps.push({lbl:"Tabellenwert " + f.jahr + ". Ausbildungsjahr (" + tab.ab + ")", val:TK.fmt.eur(wert)});
    steps.push({lbl:"Relation zum Monatsgrundentgelt der EG 7", val:TK.fmt.pct(TK.tab.azubi.relation[idx],1)});
    var ges = wert;
    if(f.schmied){ ges += 23.01; steps.push({lbl:"Zulage nach § 3.3 TV Entgelte", val:TK.fmt.eur(23.01)}); }
    steps.push({lbl:"Ausbildungsvergütung", val:TK.fmt.eur(ges), cls:"sum"});
    var tzugJahr = (f.stand === "2026") ? "2026" : "2025";
    var tzug = wert * 0.275;
    var zb = TK.tab.tzugZusatz[tzugJahr].azubi[idx];
    steps.push({lbl:"T-ZUG = 27,5 % der Ausbildungsvergütung (§ 2.2.3 TV T-ZUG)", val:TK.fmt.eur(tzug)});
    steps.push({lbl:"Zusatzbetrag " + tzugJahr + " (Anlage 3 TV Entgelte)", val:TK.fmt.eur(zb)});
    steps.push({lbl:"T-ZUG + Zusatzbetrag, Auszahlung 31. Juli", val:TK.fmt.eur(tzug + zb), cls:"sum"});
    hinweise.push("Für Auszubildende und DHBW-Studierende gilt der eigenständige Manteltarifvertrag Ausbildung (MTV A).");
    hinweise.push("Zum 1. Januar 2025 wurden die Ausbildungsvergütungen um je 140 € erhöht; zum 1. April 2025 erfolgte keine weitere Erhöhung (§ 3.1 / 3.2 TV Entgelte).");
    hinweise.push("Zur Inanspruchnahme oder Vermeidung der Kürzung von Leistungen Dritter kann auf Antrag schriftlich auf Spitzenbeträge verzichtet werden (§ 3.4).");
    return { big:TK.fmt.eur(ges), bigLabel:"Ausbildungsvergütung brutto", steps:steps, hinweise:hinweise };
  },
  extra:function(){
    var h = "<h3>Ausbildungsvergütungen</h3><table><thead><tr><th>Ausbildungsjahr</th><th class=\"num\">Relation EG 7</th><th class=\"num\">ab 01.01.2025</th><th class=\"num\">ab 01.04.2026</th></tr></thead><tbody>";
    var i;
    for(i=0;i<4;i++){
      h += "<tr><td>" + (i+1) + ". Jahr</td><td class=\"num\">" + TK.fmt.pct(TK.tab.azubi.relation[i],1) + "</td><td class=\"num\">" + TK.fmt.eur(TK.tab.azubi["2025"].werte[i]) + "</td><td class=\"num\">" + TK.fmt.eur(TK.tab.azubi["2026"].werte[i]) + "</td></tr>";
    }
    h += "</tbody></table><h3>Zusatzbeträge für Auszubildende (Anlage 3)</h3><table><thead><tr><th>Ausbildungsjahr</th><th class=\"num\">2025</th><th class=\"num\">2026</th></tr></thead><tbody>";
    for(i=0;i<4;i++){
      h += "<tr><td>" + (i+1) + ". Jahr</td><td class=\"num\">" + TK.fmt.eur(TK.tab.tzugZusatz["2025"].azubi[i]) + "</td><td class=\"num\">" + TK.fmt.eur(TK.tab.tzugZusatz["2026"].azubi[i]) + "</td></tr>";
    }
    h += "</tbody></table>";
    return h;
  }
}

];
