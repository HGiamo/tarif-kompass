/* M+E Tarif-Kompass - Service Worker
   Macht die App nach dem ersten Start offline verfuegbar.
   Bei jeder Aenderung an den Dateien die VERSION hochzaehlen. */

var VERSION = "tk-v1";
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
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/favicon-64.png"
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

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;   /* PDFs u. a. direkt aus dem Netz */

  /* Seitenaufrufe: erst Netz, bei Ausfall aus dem Cache */
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(function(res){
        var kopie = res.clone();
        caches.open(VERSION).then(function(c){ c.put(req, kopie); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(t){ return t || caches.match("./index.html"); });
      })
    );
    return;
  }

  /* Uebrige Dateien: aus dem Cache, im Hintergrund auffrischen */
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
  if(e.data === "skipWaiting") self.skipWaiting();
});
