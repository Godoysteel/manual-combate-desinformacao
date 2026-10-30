// Service worker do Modo debate. Versão: 20261030205003
var CACHE = "modo-debate-20261030205003";
var PRE = ["./", "index.html", "manifest.webmanifest", "imagens/capa-cartaz-web.jpg", "imagens/icon-192.png", "imagens/icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf("modo-debate-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") { return; }
  var url = new URL(req.url);
  var mesmo = url.origin === self.location.origin;
  var externo = /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname);
  if (!mesmo && !externo) { return; }               // GoatCounter, Giscus etc. passam direto
  if (mesmo && url.pathname.indexOf("/admin/") !== -1) { return; }   // painel nunca vai para o cache
  var html = req.mode === "navigate" || (req.headers.get("accept") || "").indexOf("text/html") !== -1;
  if (html) {
    // rede primeiro: o conteúdo novo chega assim que houver internet
    e.respondWith(fetch(req).then(function (r) {
      var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); return r;
    }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match("index.html"); }); }));
    return;
  }
  // arquivos: cache primeiro e atualiza em segundo plano
  e.respondWith(caches.match(req).then(function (m) {
    var rede = fetch(req).then(function (r) {
      if (r && (r.ok || r.type === "opaque")) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
      return r;
    }).catch(function () { return m; });
    return m || rede;
  }));
});
