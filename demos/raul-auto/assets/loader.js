// Raul's Automotive — first-visit loading screen.
// Shown only on a visitor's first time on the home page (the inline script in <head>
// adds .first-visit). It follows the hero video's real download and lifts away once
// the video can be scrubbed, or after a safety timeout.
(function () {
  var root = document.documentElement;
  var el = document.getElementById('loader');
  if (!el || !root.classList.contains('first-visit')) return;

  var count = el.querySelector('[data-count]');
  var bar = el.querySelector('.loader-fill');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MIN_MS = 1400, MAX_MS = 8000, started = performance.now();
  var target = 0.06, shown = 0, done = false, finished = false;

  function render() {
    // ease the visible number toward the real progress so it never jumps
    shown += (target - shown) * 0.12;
    if (target === 1 && 1 - shown < 0.004) shown = 1;
    var pct = Math.round(shown * 100);
    count.textContent = (pct < 10 ? '00' : pct < 100 ? '0' : '') + pct;
    bar.style.transform = 'scaleX(' + shown.toFixed(4) + ')';
    if (shown === 1 && done) return exit();
    requestAnimationFrame(render);
  }

  function finish() {
    if (done) return;
    done = true;
    var wait = Math.max(0, MIN_MS - (performance.now() - started));
    setTimeout(function () { target = 1; }, wait);
  }

  function exit() {
    if (finished) return;
    finished = true;
    try { localStorage.setItem('ra-visited', '1'); } catch (e) {}
    el.classList.add('is-leaving');
    setTimeout(function () {
      el.hidden = true;
      root.classList.remove('first-visit');
    }, calm ? 400 : 1100);
  }

  window.addEventListener('hero:progress', function (e) { if (!done) target = Math.max(target, Math.min(0.96, e.detail)); });
  window.addEventListener('hero:ready', finish);
  // reduced motion keeps the still poster, so there's no video to wait for
  if (calm) window.addEventListener('load', finish);
  setTimeout(finish, MAX_MS);
  requestAnimationFrame(render);
})();
