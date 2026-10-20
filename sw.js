/* M+E Tarif-Kompass - Service Worker
   Legt die App beim ersten Start vollstaendig auf dem Geraet ab.
   Danach laeuft sie ohne Server und ohne Internet.
   Bei jeder Aenderung an den Dateien die VERSION hochzaehlen. */

var VERSION = "tk-v4";
var WARTEZEIT = 2500;   /* so lange wird auf das Netz gewartet, dann aus dem Cache */

var DATEIEN = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/style.css",
  "./assets/data.js",
  "./assets/register-mtv.js",
  "./assets/register-era.js",
  "./assets/register-weitere.js",
  "./assets/cards.js",
  "./assets/calc.js",
  "./assets/app.js",
  /* Symbole */
  "./assets/icons/favicon-64.png",
  "./assets/icons/icon-32.png",
  "./assets/icons/icon-120.png",
  "./assets/icons/icon-152.png",
  "./assets/icons/icon-167.png",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-1024.png",
  "./assets/icons/icon-maskable-512.png",
  /* Startbilder: werden beim Oeffnen vom Home-Bildschirm gebraucht */
  "./assets/icons/splash-1320x2868.png",
  "./assets/icons/splash-1290x2796.png",
  "./assets/icons/splash-1284x2778.png",
  "./assets/icons/splash-1206x2622.png",
  "./assets/icons/splash-1179x2556.png",
  "./assets/icons/splash-1170x2532.png",
  "./assets/icons/splash-1125x2436.png",
  "./assets/icons/splash-828x1792.png",
  "./assets/icons/splash-750x1334.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(VERSION).then(function(c){
      /* Einzeln laden: eine fehlende Datei soll die Installation nicht kippen */
      return Promise.all(DATEIEN.map(function(d){
        return c.add(new Request(d, {cache:"reload"})).catch(function(){ return null; });
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === VERSION ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Netz mit Zeitlimit: ist der Server weg oder lahm, kommt sofort der Cache */
function netzOderCache(req){
  return caches.match(req).then(function(treffer){
    var fallback = treffer || caches.match("./index.html");
    var erledigt = false;
    return new Promise(function(ok){
      var uhr = setTimeout(function(){
        if(!erledigt){ erledigt = true; fallback.then ? fallback.then(ok) : ok(fallback); }
      }, WARTEZEIT);
      fetch(req).then(function(res){
        clearTimeout(uhr);
        if(erledigt) return;
        erledigt = true;
        if(res && res.status === 200){
          var kopie = res.clone();
          caches.open(VERSION).then(function(c){ c.put(req, kopie); });
        }
        ok(res);
      }).catch(function(){
        clearTimeout(uhr);
        if(erledigt) return;
        erledigt = true;
        Promise.resolve(fallback).then(ok);
      });
    });
  });
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;   /* PDFs u. a. direkt aus dem Netz */

  /* Seitenaufrufe: Netz mit Zeitlimit, sonst aus dem Cache */
  if(req.mode === "navigate"){
    e.respondWith(netzOderCache(req));
    return;
  }

  /* Uebrige Dateien: sofort aus dem Cache, im Hintergrund auffrischen */
  e.respondWith(
    caches.match(req).then(function(treffer){
      var netz = fetch(req).then(function(res){
        if(res && res.status === 200){
          var kopie = res.clone();
          caches.open(VERSION).then(function(c){ c.put(req, kopie); });
        }
        return res;
      }).catch(function(){ return treffer; });
      return treffer || netz;
    })
  );
});

self.addEventListener("message", function(e){
  if(e.data === "skipWaiting"){ self.skipWaiting(); return; }
  /* Die App fragt, ob sie vollstaendig offline verfuegbar ist */
  if(e.data === "status" && e.source){
    caches.open(VERSION).then(function(c){
      return c.keys().then(function(k){
        e.source.postMessage({ typ:"status", version:VERSION, abgelegt:k.length, erwartet:DATEIEN.length });
      });
    });
  }
});
