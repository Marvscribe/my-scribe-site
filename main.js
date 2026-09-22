/* Provisorisches Ersatz-Skript — main.js vom Original ging verloren.
   Deckt Grundfunktionen ab: Reveal-on-scroll, Nav-Toggle, Rechner,
   Zähler, FAQ-Accordion, YouTube-Facade. Die drei Live-Demo-Animationen
   (Live-Demo, KI-Assistent, Text verbessern) fehlen, da deren Inhalte
   nur im Original-Skript standen. */

/* Läuft sofort, wenn das DOM schon steht (z. B. bei nachgeladenem Inhalt in
   Webflow), sonst wie gewohnt bei DOMContentLoaded. */
function mysReady(fn){ if (document.readyState !== 'loading') { fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }
mysReady(() => {

  /* Reveal-on-scroll */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* Mobile nav toggle */
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navMobile = document.querySelector('[data-nav-mobile]');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMobile.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* Stat count-up */
  const counters = document.querySelectorAll('[data-count-to]');
  if ('IntersectionObserver' in window && counters.length) {
    const counterIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        counterIo.unobserve(el);
        const target = parseFloat(el.dataset.countTo);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 900;
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const value = Math.round(target * progress);
          el.textContent = `${prefix}${value}${suffix}`;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => counterIo.observe(el));
  }

  /* Einsparungsrechner */
  const calc = document.querySelector('[data-calculator]');
  if (calc) {
    const beds = calc.querySelector('[data-calc-beds]');
    const cases = calc.querySelector('[data-calc-cases]');
    const doctors = calc.querySelector('[data-calc-doctors]');
    const bedsOut = calc.querySelector('[data-calc-beds-out]');
    const casesOut = calc.querySelector('[data-calc-cases-out]');
    const doctorsOut = calc.querySelector('[data-calc-doctors-out]');
    const result = calc.querySelector('[data-calc-result]');

    function formatEuro(value) {
      return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value) + ' €';
    }

    function update() {
      const bedsVal = Number(beds.value);
      const casesVal = Number(cases.value);
      const doctorsVal = Number(doctors.value);
      bedsOut.textContent = bedsVal;
      casesOut.textContent = casesVal;
      doctorsOut.textContent = doctorsVal;
      /* Angenommener Stundensatz 60€:
         - 2h Zeitersparnis pro Arzt/Tag, 220 Arbeitstage/Jahr
         - 20min Zeitersparnis pro Arztbrief (Fallzahl)
         - 500€ Entlastung pro Bett/Jahr (Koordination, Doppeldokumentation)
         abzüglich einer angenommenen Lizenzgebühr von 1.200€ pro Arzt/Jahr */
      const doctorSavings = doctorsVal * 2 * 220 * 60;
      const caseSavings = casesVal * (20 / 60) * 60;
      const bedSavings = bedsVal * 500;
      const licenseCost = doctorsVal * 1200;
      const savings = Math.max(0, doctorSavings + caseSavings + bedSavings - licenseCost);
      setResult(savings);
    }

    /* Die Summe rollt auf den neuen Wert zu, statt zu springen — das macht
       spürbar, dass der Regler wirklich etwas verändert. */
    let shown = 0;
    let raf = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setResult(target) {
      if (reduceMotion) {
        shown = target;
        result.textContent = formatEuro(target);
        return;
      }
      if (raf) cancelAnimationFrame(raf);
      const from = shown;
      const start = performance.now();
      const duration = 450;
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        shown = from + (target - from) * eased;
        result.textContent = formatEuro(shown);
        if (p < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }

    [beds, cases, doctors].forEach((input) => input && input.addEventListener('input', update));
    update();
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const btn = item.querySelector('.faq-item__q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.getAttribute('data-open') === 'true';
      item.setAttribute('data-open', String(!isOpen));
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* YouTube facade */
  document.querySelectorAll('[data-yt-facade]').forEach((facade) => {
    function play() {
      const id = facade.dataset.ytId;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
      iframe.title = 'YouTube video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      facade.appendChild(iframe);
      facade.classList.add('is-playing');
    }
    facade.addEventListener('click', play);
    facade.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
    });
  });

  /* ---- Scroll-Fortschritt ---- */
  const progressBar = document.querySelector('[data-scroll-progress]');
  if (progressBar) {
    let ticking = false;
    function updateProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progressBar.style.width = Math.min(100, Math.max(0, pct)) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();
  }

  /* ---- Nav schaltet auf die dunkle Variante, sobald eine dunkle Sektion
         unter ihr liegt. Gemessen wird an der Unterkante der Nav. ---- */
  const nav = document.querySelector('.nav');
  const darkSections = document.querySelectorAll('.bg-dark, .doctors-section, .demo-trilogy, .about-hero, .hero');
  if (nav && darkSections.length) {
    let navTicking = false;
    function updateNavTheme() {
      /* Knapp unter der Nav-Unterkante messen — sonst greift der Wechsel am
         Seitenanfang nicht, wo eine dunkle Sektion direkt anschließt. */
      const line = nav.getBoundingClientRect().bottom + 1;
      let onDark = false;
      darkSections.forEach((sec) => {
        const r = sec.getBoundingClientRect();
        if (r.top <= line && r.bottom >= line) onDark = true;
      });
      nav.classList.toggle('nav--on-dark', onDark);
      navTicking = false;
    }
    window.addEventListener('scroll', () => {
      if (!navTicking) { navTicking = true; requestAnimationFrame(updateNavTheme); }
    }, { passive: true });
    window.addEventListener('resize', updateNavTheme);
    /* Im Hintergrund-Tab pausiert requestAnimationFrame — beim Zurückkehren
       einmal nachziehen, damit Nav und Fortschritt nicht veraltet dastehen. */
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        updateNavTheme();
        if (progressBar) progressBar.style.width =
          Math.min(100, Math.max(0, (window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)) * 100)) + '%';
      }
    });
    updateNavTheme();
  }

  /* ---- Drei Schritte als Reiter (1/2/3) ----
         Ersetzt die frühere Sticky-Scroll-Sequenz: der Schritt wird
         angeklickt, nicht erscrollt. Pfeiltasten wechseln wie in einer
         echten Tableiste, Home/End springen an die Enden. ---- */
  document.querySelectorAll('[data-stepswitch]').forEach((wurzel) => {
    const tabs = [...wurzel.querySelectorAll('[data-step-tab]')];
    const panels = [...wurzel.querySelectorAll('[data-step-panel]')];
    if (!tabs.length || !panels.length) return;

    function waehlen(nr, fokus) {
      tabs.forEach((t) => {
        const an = t.dataset.stepTab === nr;
        t.classList.toggle('is-active', an);
        t.setAttribute('aria-selected', String(an));
        t.tabIndex = an ? 0 : -1;
        if (an && fokus) t.focus();
      });
      panels.forEach((pa) => {
        pa.hidden = pa.dataset.stepPanel !== nr;
        pa.classList.toggle('is-active', pa.dataset.stepPanel === nr);
      });
    }

    function melden(nr) {
      wurzel.dispatchEvent(new CustomEvent('schrittgewechselt', { detail: { nr: Number(nr) } }));
    }

    tabs.forEach((t) => {
      t.addEventListener('click', () => { waehlen(t.dataset.stepTab, false); melden(t.dataset.stepTab); });
    });

    wurzel.querySelector('[role="tablist"]')?.addEventListener('keydown', (e) => {
      const jetzt = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      let ziel = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ziel = (jetzt + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ziel = (jetzt - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') ziel = 0;
      else if (e.key === 'End') ziel = tabs.length - 1;
      if (ziel === null) return;
      e.preventDefault();
      waehlen(tabs[ziel].dataset.stepTab, true);
      melden(tabs[ziel].dataset.stepTab);
    });
  });

  /* ---- Der Arztbrief schreibt sich selbst ----
         Der Brief ist echter Text, kein Bild, und hat wie auf myscribe.de
         zwei Seiten. Beim Hineinscrollen schreibt sich Schritt 1; jeder
         Reiterklick schreibt den zugehörigen Abschnitt neu und blättert
         dabei auf die Seite, auf der er steht. ---- */
  (function () {
    const brief = document.querySelector('[data-brief]');
    if (!brief) return;
    const wurzel = brief.closest('[data-stepswitch]');
    const sanft = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const seiten = [...brief.querySelectorAll('[data-brief-seite]')];
    const seitenzahl = brief.querySelector('[data-brief-seitenzahl]');
    const stempel = brief.querySelector('[data-brief-stempel]');
    /* Alle Bausteine in Dokumentreihenfolge — so läuft die Animation den
       Brief von oben nach unten durch, über beide Seiten. */
    const teile = [...brief.querySelectorAll('[data-brief-zeile], [data-brief-ein]')];
    const zeilen = teile.filter((el) => el.dataset.briefZeile);

    zeilen.forEach((el) => { el.dataset.text = el.textContent.trim(); el.textContent = ''; });

    let lauf = 0;
    let aktuelleSeite = '1';
    const schlaf = (ms) => new Promise((r) => setTimeout(r, ms));

    function schrittVon(el) {
      return Number(el.dataset.briefZeile || el.dataset.briefEin);
    }
    function seiteVon(el) {
      const s = el.closest('[data-brief-seite]');
      return s ? s.dataset.briefSeite : '1';
    }
    function seiteZeigen(nr) {
      aktuelleSeite = nr;
      seiten.forEach((s) => s.classList.toggle('is-da', s.dataset.briefSeite === nr));
      if (seitenzahl) seitenzahl.textContent = 'Seite ' + nr + ' von ' + seiten.length;
    }

    function fertigStellen(bis) {
      teile.forEach((el) => {
        const drin = schrittVon(el) <= bis;
        if (el.dataset.briefZeile) el.textContent = drin ? el.dataset.text : '';
        else el.classList.toggle('is-da', drin);
        el.classList.remove('brief__zeile--tippt');
      });
      if (stempel) stempel.classList.toggle('is-da', bis >= Number(stempel.dataset.briefStempel));
      /* Auf der Seite stehen bleiben, auf der zuletzt geschrieben wurde. */
      const letztes = teile.filter((el) => schrittVon(el) <= bis).pop();
      seiteZeigen(letztes ? seiteVon(letztes) : '1');
    }

    async function schreiben(schritt) {
      const meins = ++lauf;
      const abgebrochen = () => meins !== lauf;

      if (sanft) { fertigStellen(schritt); return; }

      fertigStellen(schritt - 1);
      if (stempel) stempel.classList.remove('is-da');

      for (const el of teile.filter((x) => schrittVon(x) === schritt)) {
        if (abgebrochen()) return;

        /* Steht der nächste Baustein auf der anderen Seite, erst umblättern. */
        const seite = seiteVon(el);
        if (seite !== aktuelleSeite) {
          seiteZeigen(seite);
          await schlaf(620);
          if (abgebrochen()) return;
        }

        if (el.dataset.briefEin) {           // übernommener Befund: erscheint
          el.classList.add('is-da');
          await schlaf(220);
          continue;
        }

        const text = el.dataset.text;
        el.classList.add('brief__zeile--tippt');
        for (let i = 1; i <= text.length; i++) {
          if (abgebrochen()) { el.classList.remove('brief__zeile--tippt'); return; }
          el.textContent = text.slice(0, i);
          /* Nach Satzzeichen eine Spur länger — das wirkt wie geschrieben
             und nicht wie ein Fortschrittsbalken. */
          await schlaf(/[.,:;]/.test(text[i - 1]) ? 24 : 6);
        }
        el.classList.remove('brief__zeile--tippt');
        await schlaf(40);
      }
      if (abgebrochen()) return;
      if (stempel && schritt >= Number(stempel.dataset.briefStempel)) {
        await schlaf(260);
        if (!abgebrochen()) stempel.classList.add('is-da');
      }
    }

    fertigStellen(0);
    seiteZeigen('1');

    let gestartet = false;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((eintraege) => {
        eintraege.forEach((e) => {
          if (!e.isIntersecting || gestartet) return;
          gestartet = true;
          io.disconnect();
          schreiben(1);
        });
      }, { threshold: 0.35 });
      io.observe(brief);
    } else {
      fertigStellen(3);
    }

    if (wurzel) {
      wurzel.addEventListener('schrittgewechselt', (e) => {
        gestartet = true;
        schreiben(e.detail.nr);
      });
    }
  }());

  /* ---- Detailseite einer Pressemitteilung ----
         Eine Seite für alle Meldungen: welche gezeigt wird, steht in
         ?beitrag=… , die Inhalte in js/presse-daten.js. ---- */
  (function () {
    const buehne = document.querySelector('[data-pm]');
    if (!buehne || !Array.isArray(window.PRESSE)) return;

    const gesucht = new URLSearchParams(location.search).get('beitrag');
    const eintrag = window.PRESSE.find((e) => e.slug === gesucht) || window.PRESSE[0];

    document.title = eintrag.titel + ' — myScribe Presse';
    const beschreibung = document.querySelector('meta[name="description"]');
    const ersterAbsatz = (eintrag.bloecke.find((b) => b.art === 'p') || {}).text || '';
    if (beschreibung && ersterAbsatz) beschreibung.setAttribute('content', ersterAbsatz.slice(0, 155));

    buehne.querySelector('[data-pm-titel]').textContent = eintrag.titel;
    buehne.querySelector('[data-pm-datum]').textContent = eintrag.datum;
    const bild = buehne.querySelector('[data-pm-bild]');
    bild.src = eintrag.bild;
    bild.alt = eintrag.titel;

    const text = buehne.querySelector('[data-pm-text]');
    eintrag.bloecke.forEach((b) => {
      const el = document.createElement(b.art === 'h' ? 'h2' : 'p');
      el.textContent = b.text;
      text.appendChild(el);
    });

    /* Drei weitere Meldungen, die neuesten zuerst, ohne die aktuelle. */
    const weitere = document.querySelector('[data-pm-weitere]');
    if (weitere) {
      window.PRESSE.filter((e) => e.slug !== eintrag.slug).slice(0, 3).forEach((e) => {
        const karte = document.createElement('article');
        karte.className = 'press-card';
        karte.innerHTML =
          '<div class="press-card__frame"><img class="press-card__img" loading="lazy" alt=""></div>' +
          '<div class="press-card__date"></div>' +
          '<h3><a class="press-card__link" href="pressemitteilung.html?beitrag=' + e.slug + '"></a></h3>';
        karte.querySelector('img').src = e.bild;
        karte.querySelector('.press-card__date').textContent = e.datum;
        karte.querySelector('a').textContent = e.titel;
        weitere.appendChild(karte);
      });
    }
  }());

  /* ---- Kunden-Logos zum Durchklicken ---- */
  document.querySelectorAll('[data-logoswitch]').forEach((ls) => {
    const tabs = [...ls.querySelectorAll('[data-logo-tab]')];
    const panels = [...ls.querySelectorAll('[data-logo-panel]')];
    if (!tabs.length) return;

    function waehlen(key) {
      tabs.forEach((t) => {
        const an = t.dataset.logoTab === key;
        t.setAttribute('aria-selected', String(an));
        t.tabIndex = an ? 0 : -1;
      });
      panels.forEach((p) => {
        const an = p.dataset.logoPanel === key;
        p.classList.toggle('is-active', an);
        if (an) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => waehlen(tab.dataset.logoTab));
      tab.addEventListener('keydown', (e) => {
        const i = tabs.indexOf(tab);
        let ziel = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ziel = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ziel = tabs[(i - 1 + tabs.length) % tabs.length];
        if (ziel) { e.preventDefault(); waehlen(ziel.dataset.logoTab); ziel.focus(); }
      });
    });
  });

  /* ---- Ein System: Galerie ----
         Rein manuell: Pfeile, Striche, Pfeiltasten. Kein Automatikwechsel
         und kein Eingriff ins Scrollen. ---- */
  const gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    const slides = [...gallery.querySelectorAll('[data-gallery-slide]')];
    const dots = [...gallery.querySelectorAll('[data-gallery-dot]')];
    const prev = gallery.querySelector('[data-gallery-prev]');
    const next = gallery.querySelector('[data-gallery-next]');
    let index = 0;

    function render() {
      slides.forEach((sl, i) => {
        const on = i === index;
        sl.classList.toggle('is-active', on);
        if (on) sl.removeAttribute('aria-hidden'); else sl.setAttribute('aria-hidden', 'true');
      });
      dots.forEach((d, i) => {
        d.setAttribute('aria-selected', String(i === index));
        d.tabIndex = i === index ? 0 : -1;
      });
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === slides.length - 1;
    }

    function go(i) {
      index = Math.min(slides.length - 1, Math.max(0, i));
      render();
    }

    if (prev) prev.addEventListener('click', () => go(index - 1));
    if (next) next.addEventListener('click', () => go(index + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));

    /* Die Reiterleiste verhält sich wie eine echte Tableiste. */
    const tablist = gallery.querySelector('[data-gallery-tabs]');
    if (tablist) {
      tablist.addEventListener('keydown', (e) => {
        let ziel = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ziel = (index + 1) % dots.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ziel = (index - 1 + dots.length) % dots.length;
        else if (e.key === 'Home') ziel = 0;
        else if (e.key === 'End') ziel = dots.length - 1;
        if (ziel === null) return;
        e.preventDefault();
        go(ziel);
        dots[ziel].focus();
      });
    }

    const stage = gallery.querySelector('.gallery__stage');
    if (stage) {
      stage.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      });
    }
    render();
  }

  /* ---- FHIR-Diagramm: Pulslänge und -tempo an die echte Pfadlänge koppeln,
         damit Daten auf jeder Leitung gleich schnell fließen ---- */
  document.querySelectorAll('.fhir-flow').forEach((path) => {
    if (typeof path.getTotalLength !== 'function') return;
    const len = path.getTotalLength();
    if (!len) return;
    path.style.setProperty('--len', len + 'px');
    /* Konstante Geschwindigkeit (~120 px/s), nach unten begrenzt, damit
       kurze Leitungen nicht hektisch blinken. */
    path.style.setProperty('--dur', Math.max(1.8, (len + 14) / 120).toFixed(2) + 's');
  });

  /* ---- Stimmen: seitliches Scrollen ----
         Das Scrollen selbst macht CSS (scroll-snap). Hier nur die Pfeile —
         und sie verschwinden, wenn alle Karten ohnehin nebeneinander
         passen, damit keine funktionslosen Schalter dastehen. ---- */
  document.querySelectorAll('[data-voices]').forEach((voices) => {
    const track = voices.querySelector('[data-voices-track]');
    const prev = voices.querySelector('[data-voices-prev]');
    const next = voices.querySelector('[data-voices-next]');
    const head = voices.querySelector('.voices__head');
    if (!track) return;

    function schrittweite() {
      const karte = track.querySelector('.voice');
      if (!karte) return track.clientWidth;
      const abstand = parseFloat(getComputedStyle(track).columnGap) || 0;
      return karte.getBoundingClientRect().width + abstand;
    }

    function aktualisieren() {
      /* Toleranz deckt den Innenabstand des Tracks ab (4px für den
         Fokusring) — sonst gilt der Anfang nie als "ganz links". */
      const rand = 8;
      const scrollbar = track.scrollWidth - track.clientWidth > rand;
      if (head) head.hidden = !scrollbar;
      if (!scrollbar) return;
      if (prev) prev.disabled = track.scrollLeft <= rand;
      if (next) next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - rand;
    }

    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -schrittweite(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: schrittweite(), behavior: 'smooth' }));
    track.addEventListener('scroll', aktualisieren, { passive: true });
    window.addEventListener('resize', aktualisieren);
    aktualisieren();
  });

  /* ---- Presse-Archiv: Jahresfilter ----
         Chips werden aus den data-year-Werten der vorhandenen Karten
         erzeugt, damit sie nie am Inhalt vorbeilaufen. ---- */
  document.querySelectorAll('[data-press-filter]').forEach((bar) => {
    const grid = bar.nextElementSibling;
    if (!grid || !grid.hasAttribute('data-press-grid')) return;
    const cards = [...grid.querySelectorAll('.press-card')];
    if (!cards.length) return;

    const years = [...new Set(cards.map((c) => c.dataset.year).filter(Boolean))]
      .sort((a, b) => Number(b) - Number(a));
    if (years.length < 2) return;

    const count = document.createElement('span');
    count.className = 'press-filter__count';

    function apply(year) {
      let shown = 0;
      cards.forEach((card) => {
        const on = year === 'alle' || card.dataset.year === year;
        card.hidden = !on;
        if (on) shown++;
      });
      bar.querySelectorAll('.press-chip').forEach((chip) => {
        chip.setAttribute('aria-pressed', String(chip.dataset.year === year));
      });
      count.textContent = shown === cards.length
        ? `${cards.length} Einträge`
        : `${shown} von ${cards.length}`;
    }

    ['alle', ...years].forEach((year) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'press-chip';
      chip.dataset.year = year;
      chip.textContent = year === 'alle' ? 'Alle' : year;
      chip.setAttribute('aria-pressed', String(year === 'alle'));
      chip.addEventListener('click', () => apply(year));
      bar.appendChild(chip);
    });
    bar.appendChild(count);
    apply('alle');
  });

  /* ---- Zeitvergleich: Balken laufen los, sobald sie sichtbar werden ---- */
  const timeCompare = document.querySelector('[data-time-compare]');
  if (timeCompare && 'IntersectionObserver' in window) {
    const tcIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tcIo.unobserve(entry.target);
        entry.target.querySelectorAll('[data-time-fill]').forEach((fill) => {
          fill.style.width = fill.dataset.timeFill + '%';
        });
      });
    }, { threshold: 0.4 });
    tcIo.observe(timeCompare);
  }

});
