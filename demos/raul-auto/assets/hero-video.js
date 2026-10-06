// Raul's Automotive — scroll-scrubbed hero video.
// The video never plays on its own: its frame follows the scroll position, eased
// so it glides to a stop when the visitor stops scrolling.
(function () {
  var wrap = document.querySelector('.hero3d');
  var stage = wrap && wrap.querySelector('.hero3d-stage');
  var video = wrap && wrap.querySelector('.hero-video');
  if (!wrap || !stage || !video) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var portraitQuery = window.matchMedia('(max-aspect-ratio: 9/10)');

  var target = 0, prog = 0, shown = -1, duration = 0, ready = false, ticking = false;

  function readScroll() {
    var rect = wrap.getBoundingClientRect();
    var range = wrap.offsetHeight - stage.offsetHeight;
    target = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 0;
    kick();
  }

  function tick() {
    // glide toward the scroll position; a light ease feels organic without lagging behind
    prog += (target - prog) * 0.14;
    if (Math.abs(target - prog) < 0.0005) prog = target;
    stage.style.setProperty('--p', prog.toFixed(4));
    wrap.classList.toggle('is-late', prog > 0.45);

    if (ready) {
      var t = prog * duration;
      // only seek when the frame actually changes and the last seek has finished
      if (Math.abs(t - shown) > 1 / 48 && !video.seeking) {
        video.currentTime = t;
        shown = t;
      }
    }
    if (prog !== target || (ready && Math.abs(prog * duration - shown) > 1 / 48)) {
      requestAnimationFrame(tick);
    } else {
      ticking = false;
    }
  }
  function kick() {
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }

  function progress(f) {
    window.dispatchEvent(new CustomEvent('hero:progress', { detail: Math.min(1, f) }));
  }

  function load() {
    var src = video.getAttribute(portraitQuery.matches ? 'data-portrait' : 'data-landscape');
    // MP4 (H.264) everywhere it plays; WebM (VP9) for browsers built without H.264
    if (!video.canPlayType('video/mp4; codecs="avc1.640028"')) src = src.replace(/\.mp4$/, '.webm');
    ready = false;
    wrap.classList.remove('video-ready');
    // download the whole clip first so every frame is available instantly while scrubbing
    fetch(src).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      // read the stream so the loading screen can show real progress
      var total = +r.headers.get('content-length') || 0;
      if (!r.body || !r.body.getReader || !total) return r.blob();
      var reader = r.body.getReader(), got = 0, parts = [];
      return (function pump() {
        return reader.read().then(function (res) {
          if (res.done) return new Blob(parts, { type: r.headers.get('content-type') || 'video/mp4' });
          parts.push(res.value);
          got += res.value.length;
          progress(got / total);
          return pump();
        });
      })();
    }).then(function (blob) {
      if (video.dataset.url) URL.revokeObjectURL(video.dataset.url);
      video.dataset.url = URL.createObjectURL(blob);
      video.src = video.dataset.url;
    }).catch(function () {
      video.src = src; // fall back to streaming the file directly
    });
  }

  video.muted = true;
  video.addEventListener('loadedmetadata', function () {
    duration = Math.max(0, video.duration - 0.05);
    // some mobile browsers only paint a seeked frame after the video has played once
    var p = video.play();
    if (p && p.then) p.then(function () { video.pause(); }).catch(function () {});
    else video.pause();
  });
  video.addEventListener('loadeddata', function () {
    window.dispatchEvent(new CustomEvent('hero:ready'));
    ready = true;
    shown = -1;
    wrap.classList.add('video-ready');
    kick();
  });

  if (reduceMotion) return; // keep the still poster frame

  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', readScroll);
  if (portraitQuery.addEventListener) portraitQuery.addEventListener('change', load);
  readScroll();
  prog = target;
  load();
})();
