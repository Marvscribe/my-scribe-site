/* myScribe — Webflow-Lader
   Holt den echten Seiteninhalt von der externen Adresse und blendet ihn in
   das Embed ein. Danach werden die Skripte in der richtigen Reihenfolge
   nachgeladen; sie initialisieren sich selbst (readyState-Prüfung).
   Bei jeder Änderung an den Dateien auf dem Host ist die Seite sofort aktuell –
   in Webflow muss nichts angefasst werden. */
(function () {
  var BASE = "https://marvscribe.github.io/my-scribe-site";
  /* Seite immer im hellen Modus zeigen, egal welchen System-Modus der
     Besucher hat. Der Dunkelmodus im CSS ist per [data-theme="light"]
     abschaltbar. */
  document.documentElement.setAttribute('data-theme', 'light');
  try { document.documentElement.style.colorScheme = 'light'; } catch (e) {}

  var host = document.querySelector('[data-mys-page]');
  if (!host) return;
  var slug = host.getAttribute('data-mys-page');

  fetch(BASE + '/' + slug + '.html', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(function (frag) {
      host.innerHTML = frag;
      /* Safari spielt per innerHTML eingefuegte Videos nicht von selbst. Daher
         werden NUR Videos mit autoplay-Attribut (etwa das Hero-Hintergrundvideo)
         per Skript geladen und stumm gestartet, auf allen Geraeten. Ein normaler
         Player im Inhalt hat kein autoplay-Attribut und startet so erst auf Klick. */
      host.querySelectorAll('video[autoplay]').forEach(function (v) {
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
    var ziel;
    try { ziel = document.querySelector(location.hash); } catch (e) { return; }
    if (!ziel) return;
    /* Sofort zum Ziel – und kurz nachjustieren, solange Bilder/Video die
       Seitenhöhe noch verändern. Sobald der Besucher selbst scrollt, sofort
       aufhören, damit ihn nichts an den Anker zurückzieht. */
    ziel.scrollIntoView();
    var start = Date.now();
    var aus = false;
    function nutzerScrollt() {
      aus = true;
      window.removeEventListener('wheel', nutzerScrollt);
      window.removeEventListener('touchmove', nutzerScrollt);
      window.removeEventListener('keydown', nutzerScrollt);
    }
    window.addEventListener('wheel', nutzerScrollt, { passive: true });
    window.addEventListener('touchmove', nutzerScrollt, { passive: true });
    window.addEventListener('keydown', nutzerScrollt);
    var iv = setInterval(function () {
      if (aus || Date.now() - start > 1200) { clearInterval(iv); nutzerScrollt(); return; }
      ziel.scrollIntoView();
    }, 150);
  }
}());
