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
  Für Service Worker und Installation braucht es HTTP: `python -m http.server 8765`
  im Projektordner, dann `http://127.0.0.1:8765/`.
- **Im Web:** Repository auf GitHub Pages veröffentlichen — Settings → Pages → Branch `main`, Ordner `/`.

Eigene Ergänzungen und der Lernfortschritt liegen ausschließlich im `localStorage` des
jeweiligen Browsers — sie werden nicht übertragen und sind nicht geräteübergreifend
verfügbar. Für die Sicherung gibt es in der Ansicht „Ergänzungen“ einen Export als Datei.

## Als App aufs iPhone

Die App ist eine vollwertige PWA: Manifest, Service Worker (offline), Apple-Touch-Icons und
Startbilder für die gängigen iPhone-Auflösungen. Beide Wege kommen ohne App Store,
ohne Entwicklerkonto und ohne alternativen Marktplatz aus — die Ansicht **„Aufs iPhone“**
in der App führt durch beide:

1. **Zum Home-Bildschirm** (empfohlen) — in Safari öffnen, Teilen → „Zum Home-Bildschirm“.
   Danach Vollbild ohne Browserleiste, eigenes Symbol, eigenes Startbild, offline nutzbar.
2. **Konfigurationsprofil** (`.mobileconfig`) — wer wirklich etwas herunterladen will:
   Die App erzeugt im Browser ein Apple-Web-Clip-Profil mit der aktuellen Adresse und dem
   Icon als Base64. Laden → in „Dateien“ öffnen → Einstellungen → Profil installieren.
   Unsigniert, iOS zeigt daher „Nicht verifiziert“; entfernbar über Einstellungen →
   Allgemein → VPN und Geräteverwaltung.

Beides setzt voraus, dass die App unter einer **HTTPS-Adresse** erreichbar ist
(z. B. GitHub Pages). Von `file://` aus funktioniert weder Service Worker noch Installation.

Nicht nutzbar ohne Entwicklerkonto: App Store, TestFlight und Apples **Web Distribution**
(EU, ab iOS 17.5 — erlaubt die Verteilung über die eigene Website, verlangt aber
Developer-Program-Mitgliedschaft, zwei Jahre Mitgliedschaft und über eine Million
EU-Installationen im Vorjahr).

## Aufbau

```
index.html
manifest.webmanifest     App-Name, Symbole, Startadresse, Verknüpfungen
sw.js                    Service Worker: Offline-Betrieb (VERSION beim Ändern hochzählen)
assets/
  icons/                 App-Symbole und iOS-Startbilder (aus tools/icons.py)
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
