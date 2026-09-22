/* ==========================================================================
   Live-Demos der myScribe App (Startseite)

   HINWEIS: Das ursprüngliche Demo-Skript ging verloren; die Abläufe und die
   medizinischen Demo-Texte hier sind neu geschrieben. Die Befunde, Laborwerte
   und Formulierungen sind Platzhalter und sollten fachlich geprüft werden,
   bevor die Seite online geht.

   Es läuft immer nur das aktive Kapitel — und nur, solange die Sektion
   sichtbar ist.
   ========================================================================== */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* Läufe sind abbrechbar: beim Kapitelwechsel wird der alte Ablauf verworfen. */
  function makeRunner(reset, run) {
    let token = 0;
    return {
      start() {
        const mine = ++token;
        reset();
        run(() => mine !== token);
      },
      stop() {
        token++;
        reset();
      },
    };
  }

  function moveCursor(cursor, stage, target) {
    if (!cursor || !target) return;
    const s = stage.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const x = t.left - s.left + t.width / 2 - 9;
    const y = t.top - s.top + t.height / 2 - 9;
    cursor.classList.add('is-active');
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  async function clickCursor(cursor) {
    if (!cursor) return;
    cursor.classList.add('is-clicking');
    await sleep(500);
    cursor.classList.remove('is-clicking');
  }

  /* ---------------------------------------------------------------- Demo 1
     Quellenanzeige: ein Klick auf einen Satz der Epikrise zeigt, aus welchem
     Eintrag der Akte er stammt. Wortlaut der Funktion nach myscribe.de:
     "mit einem Klick zeigen, aus welcher Quelle ein Satz generiert wurde". */
  function initQuellen(root) {
    const stage = root;
    const cursor = root.querySelector('[data-quellen-cursor]');
    const karte = root.querySelector('[data-quellen-karte]');
    const leer = root.querySelector('[data-quellen-leer]');
    const inhalt = root.querySelector('[data-quellen-inhalt]');
    const titelOut = root.querySelector('[data-quellen-titel]');
    const metaOut = root.querySelector('[data-quellen-meta]');
    const zitatOut = root.querySelector('[data-quellen-zitat]');
    const saetze = [...root.querySelectorAll('[data-quellen-satz]')];
    if (!saetze.length || !inhalt) return null;

    const quellen = {
      '1': {
        titel: 'Anamnese',
        meta: '27.11.2025 · 14:22 · Dr. Müller',
        zitat: '„Seit 2 Tagen kolikartige Schmerzen rechte Flanke, wellenförmig, keine Dysurie."',
      },
      '2': {
        titel: 'Sonografie Abdomen',
        meta: '27.11.2025 · 16:05 · Befund',
        zitat: '„Harnstauungsniere Grad II rechts, Konkrement 7 mm im proximalen Ureter."',
      },
      '3': {
        titel: 'Prozedur und Verlauf',
        meta: '29.11.2025 · 09:10 · Verlaufseintrag',
        zitat: '„ESWL komplikationslos. Schmerzen VAS 2. Konkrement nicht mehr nachweisbar."',
      },
    };

    function reset() {
      saetze.forEach((s) => s.classList.remove('is-quelle'));
      inhalt.hidden = true;
      if (leer) leer.hidden = false;
      if (karte) karte.classList.remove('is-da');
      if (cursor) {
        cursor.classList.remove('is-active', 'is-clicking');
        cursor.style.transform = 'translate3d(-999px,-999px,0)';
      }
    }

    function zeigen(nr) {
      const q = quellen[nr];
      if (!q) return;
      if (leer) leer.hidden = true;
      inhalt.hidden = false;
      titelOut.textContent = q.titel;
      metaOut.textContent = q.meta;
      zitatOut.textContent = q.zitat;
      if (karte) {
        /* Neu anstoßen, damit die Karte bei jedem Satz wieder einfliegt. */
        karte.classList.remove('is-da');
        void karte.offsetWidth;
        karte.classList.add('is-da');
      }
    }

    async function run(cancelled) {
      if (reduceMotion) {
        saetze[0].classList.add('is-quelle');
        zeigen('1');
        return;
      }
      while (!cancelled()) {
        await sleep(900);
        for (const satz of saetze) {
          if (cancelled()) return;
          moveCursor(cursor, stage, satz);
          await sleep(700);
          if (cancelled()) return;
          await clickCursor(cursor);
          saetze.forEach((s) => s.classList.remove('is-quelle'));
          satz.classList.add('is-quelle');
          zeigen(satz.dataset.quellenSatz);
          await sleep(2200);
        }
        if (cancelled()) return;
        await sleep(900);
        reset();
      }
    }

    return makeRunner(reset, run);
  }

  /* ---------------------------------------------------------------- Demo 2
     KI-Assistent: Rückfragen zur Akte, mit Quellenangabe. */
  function initChat(root) {
    const stage = root;
    const cursor = root.querySelector('[data-chat-cursor]');
    const typing = root.querySelector('[data-chat-typing]');
    const inputText = root.querySelector('[data-chat-input-text]');
    const inputCaret = root.querySelector('[data-chat-caret]');
    const sendBtn = root.querySelector('[data-chat-send]');
    const msgs = {};
    root.querySelectorAll('[data-chat-msg]').forEach((m) => { msgs[m.dataset.chatMsg] = m; });
    const answers = root.querySelectorAll('[data-chat-text]');
    if (!answers.length) return null;

    const turns = [
      {
        question: 'Welche Auffälligkeiten zeigen die Laborwerte?',
        userMsg: '1',
        answerMsg: '2',
        answer: 'Erhöhtes CRP und eine leichte Leukozytose – vereinbar mit einer begleitenden Entzündung. Das Kreatinin liegt leicht über der Norm.',
      },
      {
        question: 'Fasse die Anamnese in einem Satz zusammen.',
        userMsg: '3',
        answerMsg: '4',
        answer: '68-jährige Patientin mit vorbekanntem Nierenstein und seit Wochen bestehenden Flankenschmerzen, aktuell zur ESWL bei Ureterstein aufgenommen.',
      },
    ];

    function reset() {
      Object.values(msgs).forEach((m) => m.classList.remove('is-visible'));
      answers.forEach((a) => { a.textContent = ''; });
      if (typing) typing.classList.remove('is-visible');
      if (inputText) inputText.textContent = '';
      if (inputCaret) inputCaret.classList.remove('is-hidden');
      if (cursor) {
        cursor.classList.remove('is-active', 'is-clicking');
        cursor.style.transform = 'translate3d(-999px,-999px,0)';
      }
    }

    async function typeInto(setter, str, delay, cancelled) {
      let acc = '';
      for (let i = 0; i < str.length; i++) {
        if (cancelled()) return;
        acc += str[i];
        setter(acc);
        await sleep(delay);
      }
    }

    async function run(cancelled) {
      if (reduceMotion) {
        Object.values(msgs).forEach((m) => m.classList.add('is-visible'));
        turns.forEach((t, i) => { if (answers[i]) answers[i].textContent = t.answer; });
        return;
      }
      while (!cancelled()) {
        await sleep(700);
        for (let i = 0; i < turns.length; i++) {
          const turn = turns[i];
          if (cancelled()) return;

          /* Frage wird in das Eingabefeld getippt */
          await typeInto((v) => { if (inputText) inputText.textContent = v; }, turn.question, 26, cancelled);
          if (cancelled()) return;
          await sleep(320);

          /* Cursor zum Senden-Button */
          if (sendBtn) {
            moveCursor(cursor, stage, sendBtn);
            await sleep(600);
            if (cancelled()) return;
            await clickCursor(cursor);
          }

          if (inputText) inputText.textContent = '';
          if (msgs[turn.userMsg]) msgs[turn.userMsg].classList.add('is-visible');
          await sleep(420);
          if (cancelled()) return;

          /* Der Assistent „denkt" */
          if (typing) typing.classList.add('is-visible');
          await sleep(1100);
          if (cancelled()) return;
          if (typing) typing.classList.remove('is-visible');

          if (msgs[turn.answerMsg]) msgs[turn.answerMsg].classList.add('is-visible');
          await typeInto((v) => { if (answers[i]) answers[i].textContent = v; }, turn.answer, 16, cancelled);
          await sleep(900);
        }
        if (cancelled()) return;
        await sleep(2400);
        if (cancelled()) return;
        reset();
      }
    }

    return makeRunner(reset, run);
  }

  /* ---------------------------------------------------------------- Demo 3
     Text verbessern: aus Stichworten wird Fachsprache. */
  function initRewrite(root) {
    const stage = root;
    const cursor = root.querySelector('[data-rewrite-cursor]');
    const textEl = root.querySelector('[data-rewrite-text]');
    const btn = root.querySelector('[data-rewrite-btn]');
    const badge = root.querySelector('[data-rewrite-badge]');
    if (!textEl) return null;

    const raw = textEl.textContent.trim();
    const improved = 'Die Patientin stellte sich mit rechtsseitigen Rückenschmerzen bei vorbekanntem Nierenstein vor. Es erfolgte eine extrakorporale Stoßwellenlithotripsie (ESWL). Der postinterventionelle Verlauf gestaltete sich unauffällig, die Schmerzsymptomatik war rückläufig.';

    function reset() {
      textEl.textContent = raw;
      textEl.classList.remove('is-loading', 'is-fading');
      if (badge) badge.classList.remove('is-visible');
      if (cursor) {
        cursor.classList.remove('is-active', 'is-clicking');
        cursor.style.transform = 'translate3d(-999px,-999px,0)';
      }
    }

    async function run(cancelled) {
      if (reduceMotion) {
        textEl.textContent = improved;
        if (badge) badge.classList.add('is-visible');
        return;
      }
      while (!cancelled()) {
        await sleep(1100);
        if (cancelled()) return;
        if (btn) {
          moveCursor(cursor, stage, btn);
          await sleep(700);
          if (cancelled()) return;
          await clickCursor(cursor);
        }
        textEl.classList.add('is-loading');
        await sleep(1300);
        if (cancelled()) return;
        textEl.classList.remove('is-loading');
        textEl.classList.add('is-fading');
        await sleep(300);
        if (cancelled()) return;
        textEl.textContent = improved;
        textEl.classList.remove('is-fading');
        await sleep(260);
        if (badge) badge.classList.add('is-visible');
        await sleep(3400);
        if (cancelled()) return;
        reset();
      }
    }

    return makeRunner(reset, run);
  }

  /* ------------------------------------------------------------ Steuerung */
  function mysReady(fn){ if (document.readyState !== 'loading') { fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }
  mysReady(() => {
    const tabsRoot = document.querySelector('[data-demo-tabs]');
    if (!tabsRoot) return;

    const runners = {
      '1': initQuellen(tabsRoot.querySelector('[data-quellen-root]')),
      '2': initChat(tabsRoot.querySelector('[data-chat-root]')),
      '3': initRewrite(tabsRoot.querySelector('[data-rewrite-root]')),
    };

    const tabs = [...tabsRoot.querySelectorAll('[data-demo-tab]')];
    const panels = [...tabsRoot.querySelectorAll('[data-demo-panel]')];
    let activeId = '1';
    let inView = false;

    function stopAll() {
      Object.values(runners).forEach((r) => r && r.stop());
    }

    function playActive() {
      stopAll();
      if (inView && runners[activeId]) runners[activeId].start();
    }

    /* Sichtbarkeit auch selbst bestimmen können: ein IntersectionObserver
       meldet Änderungen nur beim Rendering-Schritt. Wird die Seite direkt auf
       #live-demo geöffnet oder aus dem bfcache geholt, bliebe die Demo sonst
       stehen. */
    function computeInView() {
      const r = tabsRoot.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (!r.height) return false;
      const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      return visible / r.height >= 0.25;
    }

    function syncInView() {
      const now = computeInView();
      if (now !== inView) {
        inView = now;
        playActive();
      }
    }

    function select(id) {
      activeId = id;
      tabs.forEach((t) => {
        const on = t.dataset.demoTab === id;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p) => {
        const on = p.dataset.demoPanel === id;
        p.classList.toggle('is-active', on);
        if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
      });
      /* Wer klickt, will es laufen sehen — Sichtbarkeit frisch bestimmen. */
      inView = computeInView();
      playActive();
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => select(tab.dataset.demoTab));
      /* Pfeiltasten wie bei einer echten Tableiste */
      tab.addEventListener('keydown', (e) => {
        const i = tabs.indexOf(tab);
        let next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) { e.preventDefault(); select(next.dataset.demoTab); next.focus(); }
      });
    });

    /* Nur laufen lassen, wenn die Sektion wirklich zu sehen ist. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting === inView) return;
          inView = entry.isIntersecting;
          playActive();
        });
      }, { threshold: 0.25 }).observe(tabsRoot);
    }

    /* Zweiter, unabhängiger Weg — greift auch dort, wo der Observer
       keine Aktualisierung liefert. */
    let scrollTimer = null;
    window.addEventListener('scroll', () => {
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => { scrollTimer = null; syncInView(); }, 150);
    }, { passive: true });
    window.addEventListener('resize', syncInView);
    window.addEventListener('pageshow', syncInView);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) syncInView(); });
    syncInView();
  });
})();
