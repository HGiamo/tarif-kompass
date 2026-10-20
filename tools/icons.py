"""Erzeugt App-Icons und iOS-Startbilder fuer den M+E Tarif-Kompass."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = r"C:\Users\harry\TarifKompass\assets\icons"
os.makedirs(OUT, exist_ok=True)

BLAU = (19, 78, 111)        # --accent
BLAU_TIEF = (13, 58, 83)
WEISS = (255, 255, 255)
SAND = (228, 238, 244)

FONT_SERIF = r"C:\Windows\Fonts\georgia.ttf"
FONT_SERIF_B = r"C:\Windows\Fonts\georgiab.ttf"
FONT_SANS = r"C:\Windows\Fonts\segoeui.ttf"
FONT_SANS_B = r"C:\Windows\Fonts\segoeuib.ttf"


def font(pfad, groesse):
    try:
        return ImageFont.truetype(pfad, groesse)
    except OSError:
        return ImageFont.load_default()


def mitte(d, xy, text, f, fill):
    """Text exakt auf xy zentrieren (optische Mitte ueber die Glyphen-Box)."""
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    d.text((xy[0] - (l + r) / 2, xy[1] - (t + b) / 2), text, font=f, fill=fill)


def verlauf(groesse):
    """Diagonaler Verlauf als Hintergrund."""
    w, h = groesse
    g = Image.new("RGB", (w, h), BLAU)
    d = ImageDraw.Draw(g)
    for i in range(h):
        q = i / max(1, h - 1)
        d.line([(0, i), (w, i)],
               fill=(int(BLAU[0] + (BLAU_TIEF[0] - BLAU[0]) * q),
                     int(BLAU[1] + (BLAU_TIEF[1] - BLAU[1]) * q),
                     int(BLAU[2] + (BLAU_TIEF[2] - BLAU[2]) * q)))
    return g


def icon(px, pad_anteil=0.0, rund=False, transparent=False):
    """Vollflaechiges Icon mit Paragraphzeichen.
    pad_anteil: zusaetzlicher Rand (fuer maskable), rund: eigene Ecken."""
    gross = px * 4
    if transparent:
        bild = Image.new("RGBA", (gross, gross), (0, 0, 0, 0))
        flaeche = verlauf((gross, gross)).convert("RGBA")
        maske = Image.new("L", (gross, gross), 0)
        ImageDraw.Draw(maske).rounded_rectangle(
            [0, 0, gross - 1, gross - 1], radius=int(gross * 0.22), fill=255)
        bild.paste(flaeche, (0, 0), maske)
    else:
        bild = verlauf((gross, gross)).convert("RGBA")
        if rund:
            maske = Image.new("L", (gross, gross), 0)
            ImageDraw.Draw(maske).rounded_rectangle(
                [0, 0, gross - 1, gross - 1], radius=int(gross * 0.22), fill=255)
            leer = Image.new("RGBA", (gross, gross), (0, 0, 0, 0))
            leer.paste(bild, (0, 0), maske)
            bild = leer

    d = ImageDraw.Draw(bild)
    nutz = gross * (1 - 2 * pad_anteil)
    # Paragraphzeichen
    f = font(FONT_SERIF_B, int(nutz * 0.54))
    mitte(d, (gross / 2, gross / 2 - nutz * 0.045), "\u00a7", f, WEISS)
    # Unterstrich als ruhiger Anker
    bw = nutz * 0.28
    by = gross / 2 + nutz * 0.285
    d.rounded_rectangle([gross / 2 - bw / 2, by, gross / 2 + bw / 2, by + nutz * 0.035],
                        radius=int(nutz * 0.02), fill=SAND)
    return bild.resize((px, px), Image.LANCZOS)


# --- Icons ---------------------------------------------------------------
dateien = []
for px in (1024, 512, 192, 180, 167, 152, 120, 32):
    bild = icon(px)
    name = "icon-%d.png" % px
    bild.convert("RGB").save(os.path.join(OUT, name), "PNG", optimize=True)
    dateien.append(name)

# maskable (Android/Chrome: 20 % Sicherheitszone)
m = icon(512, pad_anteil=0.14)
m.convert("RGB").save(os.path.join(OUT, "icon-maskable-512.png"), "PNG", optimize=True)
dateien.append("icon-maskable-512.png")

# Favicon mit Transparenz
icon(64, transparent=True).save(os.path.join(OUT, "favicon-64.png"), "PNG", optimize=True)
dateien.append("favicon-64.png")


# --- iOS Startbilder -----------------------------------------------------
def splash(w, h):
    bild = verlauf((w, h))
    d = ImageDraw.Draw(bild)
    kurz = min(w, h)
    # Icon-Kachel
    kante = int(kurz * 0.26)
    kachel = icon(kante, rund=True)
    bild.paste(kachel, (int((w - kante) / 2), int(h * 0.34 - kante / 2)), kachel)
    # Titel
    f1 = font(FONT_SANS_B, int(kurz * 0.062))
    f2 = font(FONT_SANS, int(kurz * 0.034))
    mitte(d, (w / 2, h * 0.52), "M+E Tarif-Kompass", f1, WEISS)
    mitte(d, (w / 2, h * 0.52 + kurz * 0.075), "Metall- und Elektroindustrie", f2, SAND)
    mitte(d, (w / 2, h * 0.52 + kurz * 0.125), "Baden-W\u00fcrttemberg", f2, SAND)
    return bild


groessen = [
    (1320, 2868), (1290, 2796), (1284, 2778), (1206, 2622),
    (1179, 2556), (1170, 2532), (1125, 2436), (828, 1792), (750, 1334),
]
for w, h in groessen:
    name = "splash-%dx%d.png" % (w, h)
    splash(w, h).save(os.path.join(OUT, name), "PNG", optimize=True)
    dateien.append(name)

for n in dateien:
    p = os.path.join(OUT, n)
    print("%-26s %7.1f KB" % (n, os.path.getsize(p) / 1024))
print("Summe: %.1f KB" % (sum(os.path.getsize(os.path.join(OUT, n)) for n in dateien) / 1024))
