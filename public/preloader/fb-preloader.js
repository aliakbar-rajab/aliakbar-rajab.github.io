/* ==========================================================================
   Foulad Bonyan Daria — intro preloader
   Self-injecting. Include fb-preloader.css in <head> and this file with
   <script src="fb-preloader.js" defer></script>. No other markup required.
   ========================================================================== */
(function () {
  var CONFIG = {
    video: '/preloader/assets/tr2.mp4', // '' to run with a flat #4B4B4B background
    minHoldMs: 6000,             // never exit sooner than this
    perCharMs: 124,              // Persian letter-reveal cadence
    typeCharMs: 62,              // Latin letter cadence
    pauseAfterMs: 1000,          // hold on the finished lock-up before exiting
    oncePerSession: true,        // sessionStorage gate
    holdVideoToEnd: true         // never exit before the video finishes + 1s
  };

  var KEY = 'fb-preloader';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

  var site = document.getElementById('fb-site'); // optional
  function unlock() { document.body.classList.remove('fb-lock'); }
  function showSite() { if (site) site.classList.add('fb-in'); }

  if (reduced || (CONFIG.oncePerSession && seen)) {
    if (site) { site.style.transition = 'none'; site.style.opacity = '1'; }
    unlock();
    return;
  }
  try { sessionStorage.setItem(KEY, '1'); } catch (e) {}

  // ---- markup -------------------------------------------------------------
  var LATIN = 'BONYAN FOULAD DARIA';
  var el = document.createElement('div');
  el.id = 'fb-preloader';
  var enHtml = '', started = false, small = false;
  LATIN.split('').forEach(function (ch, i) {
    if (ch === ' ') { enHtml += '<span data-char data-space></span>'; if (i > 12) small = true; return; }
    if (i >= 14) small = true;
    enHtml += '<span data-char' + (small ? ' class="fb-small"' : '') + '>' + ch + '</span>';
  });
  el.innerHTML =
    (CONFIG.video ? '<video id="fb-bg" muted playsinline autoplay preload="auto"></video>' : '') +
    '<div id="fb-scrim"></div>' +
    '<div id="fb-lock-up">' +
      '<div id="fb-fa">' +
        '<span class="fb-w">\u0628\u0646\u06CC\u0627\u0646</span>' +
        '<span class="fb-w">\u0641\u0648\u0644\u0627\u062F</span>' +
        '<span class="fb-sub">\u062F\u0627\u0631\u06CC\u0627</span>' +
      '</div>' +
      '<div id="fb-rule"></div>' +
      '<div id="fb-en">' + enHtml + '<span id="fb-caret"></span></div>' +
    '</div>';

  function mount() {
    document.body.classList.add('fb-lock');
    document.body.insertBefore(el, document.body.firstChild);
    boot();
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });

  // ---- sequence -----------------------------------------------------------
  function boot() {
    var vid = document.getElementById('fb-bg');
    var rule = document.getElementById('fb-rule');
    var caret = document.getElementById('fb-caret');
    var words = [].slice.call(el.querySelectorAll('#fb-fa span'));
    var chars = [].slice.call(el.querySelectorAll('#fb-en span[data-char]'));

    var loaded = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise(function (r) { window.addEventListener('load', r, { once: true }); });

    var exited = false, floorAt = 0, videoStart = 0;

    // Background video. Some hosts don't answer range requests for <video>;
    // the fetch/blob fallback covers that.
    if (vid) {
      var playNow = function () {
        try { vid.currentTime = 0; var p = vid.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
      };
      vid.src = CONFIG.video;
      playNow();
      fetch(CONFIG.video).then(function (r) { return r.ok ? r.blob() : Promise.reject(); })
        .then(function (b) { if (vid.videoWidth === 0) { vid.src = URL.createObjectURL(b); playNow(); } })
        .catch(function () {});

      if (CONFIG.holdVideoToEnd) {
        vid.addEventListener('playing', function () { videoStart = performance.now(); raiseFloor(); });
        vid.addEventListener('loadedmetadata', raiseFloor);
        vid.addEventListener('durationchange', raiseFloor);
      }
      vid.addEventListener('ended', function () {
        try { vid.pause(); } catch (e) {}
        setTimeout(exit, CONFIG.pauseAfterMs);
      });
    }

    // Push the earliest-allowed exit out to video end + 1s.
    function raiseFloor() {
      if (!vid || !isFinite(vid.duration) || !vid.duration) return;
      var target = (videoStart || performance.now()) + vid.duration * 1000 + CONFIG.pauseAfterMs;
      if (floorAt >= target) return;
      floorAt = target;
      var wait = Math.max(0, target - performance.now());
      setTimeout(function () { loaded.then(exit); }, wait);
      setTimeout(function () { floorAt = 0; exit(); }, wait + 4000); // safety ceiling
    }

    function exit() {
      if (exited) return;
      if (floorAt && performance.now() < floorAt - 50) return;
      exited = true;
      el.classList.add('fb-out');
      showSite();
      unlock();
      setTimeout(function () {
        el.classList.add('fb-hidden');
        if (vid) { try { vid.pause(); } catch (e) {} }
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 820);
    }

    function sequence() {
      // 1) Persian name writes itself letter by letter, right to left.
      //    Clip-path on the whole word keeps Arabic letter joining intact;
      //    a Range measures where each letter boundary sits.
      var t = 180;
      words.forEach(function (w) {
        var node = w.firstChild;
        var total = w.getBoundingClientRect().width;
        var n = node && node.textContent ? node.textContent.length : 0;
        var range = document.createRange();
        for (var i = 1; i <= n; i++) {
          range.setStart(node, 0); range.setEnd(node, i);
          var left = Math.max(0, total - range.getBoundingClientRect().width);
          (function (l, at) { setTimeout(function () { w.style.clipPath = 'inset(0 0 0 ' + l + 'px)'; }, at); })(left, t + (i - 1) * CONFIG.perCharMs);
        }
        t += n * CONFIG.perCharMs;
        (function (at) { setTimeout(function () { w.style.clipPath = 'inset(0 0 0 0)'; }, at); })(t);
        t += 200;
      });

      // 2) Yellow rule wipes out from the right.
      if (rule) setTimeout(function () {
        rule.style.transition = 'transform 640ms cubic-bezier(.65,.02,.28,1)';
        rule.style.transform = 'scaleX(1)';
      }, Math.max(0, t - 60));

      // 3) Latin lock-up types in, DARIA in yellow.
      var typeStart = t + 260, tt = typeStart;
      if (caret) setTimeout(function () {
        caret.style.opacity = '1';
        caret.style.animation = 'fbCaret 900ms steps(1,end) infinite';
      }, typeStart - 120);
      chars.forEach(function (s) {
        var space = s.hasAttribute('data-space');
        (function (at) { setTimeout(function () { s.style.opacity = '1'; }, at); })(tt);
        tt += space ? 210 : CONFIG.typeCharMs;
      });
      if (caret) setTimeout(function () { caret.style.animation = 'none'; caret.style.opacity = '0'; }, tt + 900);

      // 4) Hold, then wait for window load and leave.
      var outAt = Math.max(CONFIG.minHoldMs, tt + CONFIG.pauseAfterMs);
      setTimeout(function () { loaded.then(exit); }, outAt);
      setTimeout(exit, outAt + 4000);                          // safety ceiling
      setTimeout(function () { floorAt = 0; exit(); }, outAt + 12000); // hard ceiling
    }

    // Letter measurement must happen after the font is ready.
    var fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise(function (r) { setTimeout(r, 1200); })])
      .then(function () { setTimeout(sequence, 20); });
  }
})();
