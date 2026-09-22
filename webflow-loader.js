/* myScribe — Webflow-Lader
   Holt den echten Seiteninhalt von der externen Adresse und blendet ihn in
   das Embed ein. Danach werden die Skripte in der richtigen Reihenfolge
   nachgeladen; sie initialisieren sich selbst (readyState-Prüfung).
   Bei jeder Änderung an den Dateien auf dem Host ist die Seite sofort aktuell –
   in Webflow muss nichts angefasst werden. */
(function () {
  var BASE = "https://marvscribe.github.io/my-scribe-site";
  var host = document.querySelector('[data-mys-page]');
  if (!host) return;
  var slug = host.getAttribute('data-mys-page');

  fetch(BASE + '/' + slug + '.html', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(function (frag) {
      host.innerHTML = frag;
      /* Safari spielt per innerHTML eingefügte Videos nicht von selbst –
         daher hier explizit laden und (stumm) starten. */
      host.querySelectorAll('video').forEach(function (v) {
        try { v.muted = true; v.load(); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
      });
      var q = [BASE + '/presse-daten.js', BASE + '/main.js', BASE + '/demos.js'];
      (function next(i) {
        if (i >= q.length) { return zumAnker(); }
        var sc = document.createElement('script');
        sc.src = q[i];
        sc.onload = function () { next(i + 1); };
        sc.onerror = function () { next(i + 1); }; // presse-daten fehlt evtl. – egal
        document.body.appendChild(sc);
      })(0);
    })
    .catch(function (e) { console.error('myScribe-Lader:', e); });

  function zumAnker() {
    if (!location.hash) return;
    var ziel = document.querySelector(location.hash);
    if (ziel) ziel.scrollIntoView();
  }
}());
