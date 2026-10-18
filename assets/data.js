/* M+E Tarif-Kompass - Stammdaten
   Quelle: oeffentlich veroeffentlichte Tarifvertragstexte Suedwestmetall / IG Metall
   Bezirk Baden-Wuerttemberg. Siehe Ansicht "Quellen". */

window.TK = {};

TK.meta = {
  gebiet: "Tarifgebiet Baden-Württemberg (M+E-Industrie)",
  parteien: "Verband der Metall- und Elektroindustrie Baden-Württemberg e.V. (Südwestmetall) – IG Metall Bezirk Baden-Württemberg",
  stand: "MTV-Fassung vom 12.11.2024, Entgelte bis 01.04.2026",
  datenstand: "18.10.2026"
};

/* ---------------- Tarifvertraege ---------------- */
TK.vertraege = {
  mtv:    { kurz:"MTV",       name:"Manteltarifvertrag für Beschäftigte",                        vom:"12.11.2024", url:"https://igmetall-gaggenau.de/wp-content/uploads/2025/01/ME-8-MTV-Beschaeftigte_2024.pdf" },
  mtva:   { kurz:"MTV A",     name:"Manteltarifvertrag Ausbildung",                                   vom:"12.11.2024", url:"https://igmetall-gaggenau.de/wp-content/uploads/2025/01/ME-22-MTV-Ausbildung_2024.pdf" },
  etv:    { kurz:"TV Entgelte",name:"TV über Entgelte und Ausbildungsvergütungen",               vom:"12.11.2024", url:"https://igmetall-gaggenau.de/wp-content/uploads/2025/01/ME-1_TV-Entgelte-final-mit-Tabellen_2024.pdf" },
  era:    { kurz:"ERA-TV",    name:"Entgeltrahmentarifvertrag",                                       vom:"in Kraft 01.01.2022", url:"https://igmetall-gaggenau.de/wp-content/uploads/2023/11/4_ERA-TV_2022.pdf" },
  url:    { kurz:"UrlAbk",    name:"Urlaubsabkommen",                                                 vom:"11.11.2021", url:"https://igmetall-gaggenau.de/wp-content/uploads/2023/11/18_Urlaubsabkommen_2022.pdf" },
  soza:   { kurz:"TV SoZa",   name:"TV über die Absicherung betrieblicher Sonderzahlungen",         vom:"11.11.2021", url:"https://igmetall-gaggenau.de/wp-content/uploads/2023/11/19_TV-Soza_2022.pdf" },
  tzug:   { kurz:"TV T-ZUG",  name:"TV zum tariflichen Zusatzgeld",                                   vom:"18.11.2022", url:"https://igmetall-gaggenau.de/wp-content/uploads/2023/11/20_TV-T-ZUG_2023.pdf" },
  flexue: { kurz:"TV FlexÜ", name:"TV zum flexiblen Übergang in die Rente (Altersteilzeit)",       vom:"11.11.2021", url:"https://igmetall-gaggenau.de/wp-content/uploads/2023/11/24_TV_FlexUe_2022.pdf" },
  avo:    { kurz:"TV AVo",    name:"TV Anspruchsvoraussetzungen",                                     vom:"12.11.2024", url:"https://igmetall-gaggenau.de/wp-content/uploads/2025/01/ME-2_TV-AVO_2024.pdf" },
  besch:  { kurz:"TV Besch",  name:"TV zur Beschäftigungssicherung",                                vom:"12.11.2024", url:"https://igmetall-gaggenau.de/wp-content/uploads/2025/01/ME-11_TV-Besch-komplett-mit-Anlagen_2024.pdf" },
  quali:  { kurz:"TV Quali",  name:"TV zur Qualifizierung",                                           vom:"2022",       url:"https://igmetall-gaggenau.de/wp-content/uploads/2023/11/12_TV-Quali_2022.pdf" },
  moba:   { kurz:"TV MobA",   name:"TV zum Mobilen Arbeiten",                                         vom:"2022",       url:"https://igmetall-gaggenau.de/wp-content/uploads/2023/11/13_TV-MobA_2022.pdf" },
  leiz:   { kurz:"TV LeiZ",   name:"TV Leih-/Zeitarbeit",                                             vom:"2022",       url:"https://igmetall-gaggenau.de/wp-content/uploads/2023/11/15_TV-LeiZ-_2022.pdf" },
  avwl:   { kurz:"TV AVWL",   name:"TV altersvorsorgewirksame Leistungen",                            vom:"2006",       url:"https://igmetall-gaggenau.de/wp-content/uploads/2023/11/25_TV-Altersvorsorgewirksame-Leistungen_TV-AVWL_2006.pdf" },
  bmtv:   { kurz:"BMTV",      name:"Bundesmontagetarifvertrag",                                       vom:"1988",       url:"https://igmetall-gaggenau.de/wp-content/uploads/2023/11/29_BundesmontageTV_BMTV_1988.pdf" }
};

/* ---------------- Themen ---------------- */
TK.themen = [
  { id:"arbeitszeit",     ico:"⏱️", name:"Arbeitszeit & Konten",          desc:"35 Stunden, verlängerte und verkürzte Vollzeit, Teilzeit, Mehrarbeit, Zeitkonten, Schicht." },
  { id:"entgelt",         ico:"💰", name:"Entgelt & Bestandteile",        desc:"Monatsentgelt, feste und variable Bestandteile, Entgelttabellen, Sockelbetrag, Berechnungsgrundsätze." },
  { id:"era",             ico:"📊", name:"ERA: Einstufung & Leistung",    desc:"Stufenwertzahlverfahren, Entgeltgruppen, Leistungsentgelt, Belastungszulage, Verdienstausgleich." },
  { id:"zuschlaege",      ico:"🌙", name:"Zuschläge",                     desc:"Mehrarbeit, Spät-, Nacht-, Sonn- und Feiertagsarbeit, Zusammentreffen mehrerer Zuschläge." },
  { id:"jahresleistung",  ico:"🎁", name:"Jahresleistungen",              desc:"T-ZUG, Zusatzbetrag, betriebliche Sonderzahlung, Trafobaustein, zusätzliches Urlaubsgeld." },
  { id:"urlaub",          ico:"🏖️", name:"Urlaub",                  desc:"30 Tage, Zusatzurlaub, Wartezeit, Zwölftelung, Übertragung, Urlaubsvergütung." },
  { id:"krankheit",       ico:"🩺", name:"Krankheit & Entgeltfortzahlung",desc:"Anzeige und Nachweis, 6 Wochen 100 %, Krankengeldzuschuss, Arbeitsunfall." },
  { id:"familie",         ico:"👥", name:"Familie & Freistellung",        desc:"Arbeitsverhinderung nach § 616 BGB, Pflege, Kinderbetreuung, freie Tage statt T-ZUG." },
  { id:"alter",           ico:"🕓", name:"Alter, Lohnsicherung & Rente",  desc:"Verdienstsicherung ab 54, Alterssicherungsbetrag, Altersteilzeit, Kündigungsschutz ab 53." },
  { id:"beginn",          ico:"📝", name:"Einstellung & Vertrag",         desc:"Vorstellungskosten, Arbeitsvertrag, Wiedereinstellung, Vorbeschäftigungszeiten." },
  { id:"ende",            ico:"🚪", name:"Beendigung & Fristen",          desc:"Kündigungsfristen, besonderer Kündigungsschutz, Zeugnis, Ausschlussfristen." },
  { id:"flexibel",        ico:"💻", name:"Mobiles Arbeiten & Qualifizierung", desc:"TV MobA, Bildungsteilzeit, Qualifizierungsgespräch, Leih-/Zeitarbeit." },
  { id:"krise",           ico:"📉", name:"Beschäftigungssicherung",       desc:"Arbeitszeitabsenkung, gesetzliche und tarifliche Kurzarbeit, Trafobaustein." },
  { id:"system",          ico:"⚖️", name:"System & Geltung",              desc:"Geltungsbereich, Günstigkeitsprinzip, Betriebsvereinbarungen, Streitbeilegung, Laufzeiten." }
];

/* ---------------- Tabellen ---------------- */
/* ERA-Entgelttabellen: Grundentgelt in Euro bei 35 h/Woche, Index 0 = EG 1 */
TK.tab = {
  eckentgeltEG: 7,
  entgelt: {
    "2025": { ab:"01.04.2025", werte:[2658.00,2730.00,2873.50,3017.00,3197.00,3376.50,3592.00,3843.50,4095.00,4364.00,4651.50,4975.00,5298.00,5621.50,5944.50,6340.00,6699.00] },
    "2026": { ab:"01.04.2026", werte:[2740.50,2814.50,2962.50,3111.00,3296.00,3481.00,3703.50,3962.50,4222.00,4499.50,4796.00,5129.00,5462.50,5795.50,6129.00,6536.50,6906.50] }
  },
  /* Entgeltgruppenschluessel in % des Eckentgelts (EG 7 = 100 %) */
  schluessel:[74.0,76.0,80.0,84.0,89.0,94.0,100.0,107.0,114.0,121.5,129.5,138.5,147.5,156.5,165.5,176.5,186.5],
  /* Belastungszulage: Prozent des Grundentgelts EG 7 */
  belastung:[
    { pkt:"1",            proz:2.5,  e2025:89.80,  e2026:92.59 },
    { pkt:"2",            proz:5.0,  e2025:179.60, e2026:185.18 },
    { pkt:"3",            proz:7.5,  e2025:269.40, e2026:277.76 },
    { pkt:"4 und mehr",   proz:10.0, e2025:359.20, e2026:370.35 },
    { pkt:"Gießereien",   proz:12.5, e2025:449.00, e2026:462.94 }
  ],
  /* Sockelbetraege in % des ERA-Grundentgelts (TV Entgelte Anlage 2) */
  sockel:[
    { eg:"1",      v1:9, v2:11 },
    { eg:"2",      v1:7, v2:10 },
    { eg:"3",      v1:2, v2:5 },
    { eg:"4",      v1:0, v2:2 },
    { eg:"5 - 17", v1:0, v2:0 }
  ],
  azubi: {
    "2025": { ab:"01.01.2025", werte:[1267.00,1337.50,1443.00,1513.50] },
    "2026": { ab:"01.04.2026", werte:[1303.50,1377.50,1488.50,1563.00] },
    relation:[35.2,37.2,40.2,42.2]
  },
  /* Zusatzbetrag nach § 2 TV T-ZUG (TV Entgelte Anlage 3) */
  tzugZusatz: {
    "2025": { besch:651.50, azubi:[229.50,242.50,262.00,275.00] },
    "2026": { besch:952.00, azubi:[335.00,354.00,382.50,401.50] }
  },
  /* ERA Stufenwertzahlverfahren (ERA-TV Anlage 1) */
  eraMerkmale: {
    anlernen:[
      { st:"A 1", p:3, d:"Einmalige Arbeitsunterweisung und kurze Übung." },
      { st:"A 2", p:4, d:"Arbeitsunterweisung und längere Übung." },
      { st:"A 3", p:5, d:"Arbeitsunterweisung und Übung über mehrere Wochen." },
      { st:"A 4", p:7, d:"Systematisches Anlernen über den Zeitraum der Stufe A 3 hinaus." },
      { st:"A 5", p:9, d:"Umfangreiches systematisches Anlernen über ein halbes Jahr hinaus." }
    ],
    ausbildung:[
      { st:"B 1", p:10, d:"Abgeschlossene, in der Regel zweijährige Berufsausbildung (BBiG)." },
      { st:"B 2", p:13, d:"Abgeschlossene, in der Regel drei- bis dreieinhalbjährige Berufsausbildung (BBiG)." },
      { st:"B 3", p:16, d:"Berufsausbildung + aufbauende einjährige Vollzeit-Fachausbildung (z. B. Meister IHK)." },
      { st:"B 4", p:19, d:"Berufsausbildung + aufbauende zweijährige Vollzeit-Fachausbildung (z. B. Techniker)." },
      { st:"B 5", p:24, d:"Abgeschlossenes Fachhochschulstudium." },
      { st:"B 6", p:29, d:"Abgeschlossenes Universitätsstudium." }
    ],
    erfahrung:[
      { st:"E 1", p:1,  d:"bis zu einem Jahr" },
      { st:"E 2", p:3,  d:"mehr als 1 Jahr bis zu 2 Jahren" },
      { st:"E 3", p:5,  d:"mehr als 2 Jahre bis zu 3 Jahren" },
      { st:"E 4", p:8,  d:"mehr als 3 Jahre bis zu 5 Jahren" },
      { st:"E 5", p:10, d:"mehr als 5 Jahre" }
    ],
    denken:[
      { st:"D 1", p:1,  d:"Einfache Aufgaben, leicht zu erfassende Informationsverarbeitung." },
      { st:"D 2", p:3,  d:"Schwerer zu erfassende Informationen oder standardisierte Lösungswege anwenden." },
      { st:"D 3", p:5,  d:"Schwierige Erfassung oder Auswahl zutreffender Lösungswege aus bekannten Mustern." },
      { st:"D 4", p:8,  d:"Umfangreiche Aufgaben, bekannte Lösungsmuster kombinieren." },
      { st:"D 5", p:12, d:"Bekannte Lösungsmuster weiterentwickeln." },
      { st:"D 6", p:16, d:"Neuartige Problemstellungen, neue Lösungsmuster entwickeln." },
      { st:"D 7", p:20, d:"Neue komplexe Problemstellungen, innovatives Denken, Entwicklungstrends." }
    ],
    handlung:[
      { st:"H 1", p:1,  d:"Arbeitsdurchführung nach Anweisungen." },
      { st:"H 2", p:3,  d:"Nach Anweisungen mit geringem Spielraum bei einzelnen Arbeitsverrichtungen." },
      { st:"H 3", p:5,  d:"Nach Anweisungen mit Spielraum bei einzelnen Teilaufgaben." },
      { st:"H 4", p:7,  d:"Nach Anweisungen mit Spielraum innerhalb der Arbeitsaufgabe." },
      { st:"H 5", p:9,  d:"Nach allgemeinen Anweisungen mit erweitertem Spielraum, alternative Handlungswege." },
      { st:"H 6", p:11, d:"Nach Zielvorgaben mit Spielraum für ein Aufgabengebiet, selbständiger Methodeneinsatz." },
      { st:"H 7", p:14, d:"Nach Zielvorgaben mit erweitertem Spielraum für ein komplexes Aufgabengebiet." },
      { st:"H 8", p:17, d:"Nach allgemeinen Zielen mit weitgehendem Spielraum für ein umfangreiches Aufgabengebiet." }
    ],
    kommunikation:[
      { st:"K 1", p:1,  d:"Informationseinholung und -weitergabe zur Erledigung der Arbeitsaufgabe." },
      { st:"K 2", p:3,  d:"Abstimmung in routinemäßigen Einzelfragen." },
      { st:"K 3", p:5,  d:"Abstimmung über Routine hinaus bei häufig unterschiedlichen Voraussetzungen." },
      { st:"K 4", p:7,  d:"Abstimmung und Koordinierung im Aufgabenkomplex, unterschiedliche Interessenlagen." },
      { st:"K 5", p:10, d:"Interessenvertretung gegenüber Anderen bei unterschiedlichen Zielsetzungen." },
      { st:"K 6", p:13, d:"Verhandlungen von funktionsübergreifender Bedeutung." }
    ],
    fuehrung:[
      { st:"F 1", p:2, d:"Erteilen von Anweisungen unter konstanten, überschaubaren Rahmenbedingungen." },
      { st:"F 2", p:3, d:"Erläuterung der Ziele, Anhörung der Mitarbeiter; Rahmen überschaubar." },
      { st:"F 3", p:4, d:"Gemeinsames Aufgabenverständnis, auch bei unterschiedlicher Interessenlage." },
      { st:"F 4", p:5, d:"Gemeinsame Entwicklung bereichsbezogener und individueller Ziele." },
      { st:"F 5", p:7, d:"Auf persönliche Überzeugung ausgerichtete Zielentwicklung, funktionsübergreifend." }
    ]
  },
  /* Punktzahl -> Entgeltgruppe (ERA-TV § 6.1.5) */
  eraGruppen:[
    { eg:1,  von:6,  bis:6 },  { eg:2,  von:7,  bis:8 },  { eg:3,  von:9,  bis:11 },
    { eg:4,  von:12, bis:14 }, { eg:5,  von:15, bis:18 }, { eg:6,  von:19, bis:22 },
    { eg:7,  von:23, bis:26 }, { eg:8,  von:27, bis:30 }, { eg:9,  von:31, bis:34 },
    { eg:10, von:35, bis:38 }, { eg:11, von:39, bis:42 }, { eg:12, von:43, bis:46 },
    { eg:13, von:47, bis:50 }, { eg:14, von:51, bis:54 }, { eg:15, von:55, bis:58 },
    { eg:16, von:59, bis:63 }, { eg:17, von:64, bis:96 }
  ],
  /* Bruttoaufstockungsprozentsatz Altersteilzeit (TV FlexUe Anlage 1) */
  atzAufstockung:[
    { bis:1199.99, a:42.0, b:57.4 }, { bis:1299.99, a:41.0, b:54.7 },
    { bis:1399.99, a:39.9, b:52.0 }, { bis:1499.99, a:39.0, b:49.3 },
    { bis:1599.99, a:38.1, b:46.6 }, { bis:1699.99, a:37.2, b:43.9 },
    { bis:1799.99, a:36.4, b:41.2 }, { bis:1899.99, a:35.6, b:39.8 },
    { bis:1999.99, a:34.8, b:38.4 }, { bis:2099.99, a:33.8, b:37.4 },
    { bis:2199.99, a:32.5, b:36.8 }, { bis:2299.99, a:31.3, b:36.2 },
    { bis:2399.99, a:30.0, b:35.6 }, { bis:2499.99, a:28.7, b:35.0 },
    { bis:2599.99, a:27.7, b:34.4 }, { bis:2699.99, a:26.1, b:33.8 },
    { bis:2799.99, a:25.1, b:33.2 }, { bis:2899.99, a:24.0, b:32.6 },
    { bis:Infinity, a:23.8, b:32.0 }
  ],
  /* Sonderzahlungs-Staffel (TV SoZa § 2.2) */
  sozaStaffel:[
    { monate:6,  grund:25, abw:30 },
    { monate:12, grund:35, abw:40 },
    { monate:24, grund:45, abw:50 },
    { monate:36, grund:55, abw:60 }
  ]
};
