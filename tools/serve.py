"""Startet den M+E Tarif-Kompass als lokalen Server.

    python tools/serve.py            # Port 8765
    python tools/serve.py 9000       # anderer Port

Der Server liefert die App im Netz aus und zeigt beim Start alle Adressen,
unter denen sie erreichbar ist. Fuer die Installation auf dem iPhone wird
eine HTTPS-Adresse gebraucht - dafuer zusaetzlich in einem zweiten Fenster:

    tailscale serve 8765

Danach laeuft die App unter https://<rechner>.<tailnet>.ts.net/ - verschluesselt,
nur fuer die eigenen Geraete, nicht oeffentlich.
"""

import http.server
import os
import socket
import socketserver
import subprocess
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Typen, die Python nicht von sich aus kennt
EXTRA = {
    ".webmanifest": "application/manifest+json",
    ".mobileconfig": "application/x-apple-aspen-config",
    ".json": "application/json",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=WURZEL, **kw)

    def guess_type(self, pfad):
        endung = os.path.splitext(str(pfad))[1].lower()
        if endung in EXTRA:
            return EXTRA[endung]
        return super().guess_type(pfad)

    def end_headers(self):
        # Der Service Worker darf nicht aus dem Browser-Cache kommen,
        # sonst bemerkt die App Aktualisierungen nicht.
        if self.path.endswith("sw.js"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Service-Worker-Allowed", "/")
        super().end_headers()

    def log_message(self, format, *args):
        if "404" in (args[1] if len(args) > 1 else ""):
            sys.stderr.write("  fehlt: %s\n" % (args[0] if args else "?"))


def lan_adresse():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return None


def tailscale_name():
    try:
        roh = subprocess.run(["tailscale", "status", "--json"],
                             capture_output=True, text=True, timeout=5)
        if roh.returncode != 0:
            return None
        import json
        name = json.loads(roh.stdout).get("Self", {}).get("DNSName", "")
        return name.rstrip(".") or None
    except (OSError, ValueError, subprocess.SubprocessError):
        return None


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    socketserver.TCPServer.allow_reuse_address = True

    print()
    print("  M+E Tarif-Kompass")
    print("  Ordner: %s" % WURZEL)
    print()
    print("  Auf diesem Rechner   http://localhost:%d/" % port)
    lan = lan_adresse()
    if lan:
        print("  Im selben WLAN       http://%s:%d/" % (lan, port))
        print("                       (ohne HTTPS: kein Offline-Betrieb)")
    ts = tailscale_name()
    if ts:
        print()
        print("  Fuer das iPhone - in einem zweiten Fenster starten:")
        print("      tailscale serve %d" % port)
        print("  Die App ist dann erreichbar unter")
        print("      https://%s/" % ts)
        print("  Verschluesselt, nur fuer Geraete im eigenen Tailnet.")
    print()
    print("  Beenden mit Strg+C")
    print()

    with socketserver.TCPServer(("0.0.0.0", port), Handler) as srv:
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server beendet.")


if __name__ == "__main__":
    main()
