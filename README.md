# M+E Tarif-Kompass

Web-App für die Personalarbeit in der **Metall- und Elektroindustrie Baden-Württemberg**
(Tarifverträge zwischen **Südwestmetall** und der **IG Metall Bezirk Baden-Württemberg**).

Nachschlagen, rechnen und lernen — jede Aussage mit Paragraph und Link zum Originaltext,
damit sie im Gespräch und in der Akte belegbar ist.

## Was drin ist

| Bereich | Inhalt |
|---|---|
| **Wo steht was** | 95 Fundstellen aus 16 Tarifverträgen, filterbar nach Thema und Vertrag, jede mit Inhalt, Fundstelle und PDF-Link |
| **Themen** | 14 Sachgebiete von Arbeitszeit über ERA-Einstufung bis Beschäftigungssicherung |
| **Rechner** | 15 Rechner mit vollständigem Rechenweg und Zwischenschritten |
| **Karteikarten** | 90 Karten im Frage-Antwort-Paragraph-Schema, mit Lernfortschritt und Wiederholungsstapel |
| **Ergänzungen** | eigene Notizen zu jeder Fundstelle (Betriebsvereinbarung, Hausregel, Ansprechpartner), mit Sicherung als Datei |
| **Suche** | Volltextsuche über Paragraphen, Karten, Rechner und eigene Notizen — Taste `/` |

### Die Rechner

Entgelttabelle · ERA-Einstufung (Stufenwertzahlverfahren) · Zuschläge · T-ZUG und Zusatzbetrag ·
freie Tage statt T-ZUG · betriebliche Sonderzahlung · zusätzliches Urlaubsgeld · Urlaubsanspruch ·
**Lohnsicherung / Alterssicherungsbetrag (§ 40 MTV)** · Verdienstausgleich (§ 13 ERA-TV) ·
Entgeltfortzahlung und Krankengeldzuschuss · Kündigungsfrist und Endtermin ·
Altersteilzeit-Aufstockung · Trafobaustein · Ausbildungsvergütung

Jeder Rechner zeigt nicht nur das Ergebnis, sondern den Weg dorthin: jeden Zwischenschritt
mit Bezeichnung, Betrag und Fundstelle, dazu die rechtlichen Hinweise aus dem Tarifvertrag.

## Datenstand

- Manteltarifvertrag in der Fassung vom **12.11.2024**
- Entgelttabellen **ab 01.04.2025 (+2,0 %)** und **ab 01.04.2026 (+3,1 %)**
- T-ZUG-Zusatzbetrag 2025: 651,50 € · 2026: 952,00 €
- Erfasste Verträge: MTV, MTV Ausbildung, TV Entgelte, ERA-TV, Urlaubsabkommen, TV SoZa,
  TV T-ZUG, TV FlexÜ, TV AVo, TV Besch, TV Quali, TV MobA, TV LeiZ, TV AVWL, BMTV

## Benutzung

Die App ist eine statische Website ohne Server, Build-Schritt oder Abhängigkeiten.

- **Lokal:** `index.html` im Browser öffnen (Doppelklick genügt).
- **Im Web:** Repository auf GitHub Pages veröffentlichen — Settings → Pages → Branch `main`, Ordner `/`.
- **Auf dem iPhone:** Seite in Safari öffnen, „Teilen“ → „Zum Home-Bildschirm“.

Eigene Ergänzungen und der Lernfortschritt liegen ausschließlich im `localStorage` des
jeweiligen Browsers — sie werden nicht übertragen und sind nicht geräteübergreifend
verfügbar. Für die Sicherung gibt es in der Ansicht „Ergänzungen“ einen Export als Datei.

## Aufbau

```
index.html
assets/
  style.css              Gestaltung, hell und dunkel
  data.js                Metadaten, Verträge, Themen, Tariftabellen
  register-mtv.js        Paragraphen-Register: Manteltarifvertrag
  register-era.js        Paragraphen-Register: ERA-TV und TV Entgelte
  register-weitere.js    Paragraphen-Register: übrige Tarifverträge
  cards.js               Karteikarten
  calc.js                Rechner samt Rechenwegen
  app.js                 Oberfläche, Suche, Routing, Notizen
```

Eine neue Fundstelle besteht aus einem Objekt in einer der `register-*.js`-Dateien
(`id`, Vertrag `v`, Paragraph `p`, Titel `t`, Inhalt `k`, Themen `th`, Suchwörter `tg`,
optional Zitat `q` und Rechner `calc`). Eine neue Karteikarte ist ein Objekt in `cards.js`.
Ein neuer Rechner ist ein Objekt in `calc.js` mit `felder` und einer `run`-Funktion, die
Ergebnis, Rechenschritte und Hinweise zurückgibt.

## Rechtlicher Hinweis

Arbeits- und Lernhilfe, **keine Rechtsberatung**. Maßgeblich ist allein der Wortlaut der
Tarifverträge. Betriebsvereinbarungen, Ergänzungstarifverträge und Einzelarbeitsverträge
können abweichen oder günstiger sein. Tarifliche Ansprüche stehen nach dem Geltungsbereich
der Verträge Mitgliedern der IG Metall in Betrieben mit Südwestmetall-Mitgliedschaft zu.
Vor Entscheidungen bitte im Originaltext prüfen; die PDFs sind in der Ansicht „Quellen“
direkt verlinkt.
