/* Verelle Lash Studio
   Vanilla JS, no dependencies. */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* ── Photos: show the image only once it has really loaded ── */
  $$('.photo').forEach((fig) => {
    const img = $('img', fig);
    if (!img) return;
    const ok = () => fig.classList.add('is-loaded');
    if (img.complete && img.naturalWidth > 0) ok();
    else img.addEventListener('load', ok, { once: true });
  });

  /* ── Smooth scrolling (wheel, eased) ── */
  const sc = { target: 0, current: 0, set: 0, on: false };
  const maxScroll = () => Math.max(0, root.scrollHeight - innerHeight);

  function initSmooth() {
    if (reduced || !finePointer) return;
    sc.on = true;
    sc.target = sc.current = sc.set = scrollY;
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.defaultPrevented || document.body.classList.contains('is-locked')) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 34; else if (e.deltaMode === 2) d *= innerHeight;
      e.preventDefault();
      sc.target = clamp(sc.target + d, 0, maxScroll());
    }, { passive: false });
    addEventListener('scroll', () => {
      if (Math.abs(scrollY - sc.set) > 2) sc.target = sc.current = sc.set = scrollY;
    }, { passive: true });
  }
  function stepSmooth() {
    if (!sc.on) return;
    sc.target = clamp(sc.target, 0, maxScroll());
    const diff = sc.target - sc.current;
    if (Math.abs(diff) < .08) {
      if (sc.current !== sc.target) { sc.current = sc.target; sc.set = sc.current; scrollTo(0, sc.current); }
      return;
    }
    sc.current += diff * .085;
    sc.set = sc.current;
    scrollTo(0, sc.current);
  }
  function goTo(y) {
    y = clamp(y, 0, maxScroll());
    if (sc.on) sc.target = y; else scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ── Menu + anchors ── */
  const burger = $('#burger'), menu = $('#menu');
  function closeMenu() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const h = a.getAttribute('href');
    e.preventDefault();
    closeMenu();
    if (h.length < 2 || h === '#top') { goTo(0); return; }
    const el = $(h);
    if (el) goTo(el.getBoundingClientRect().top + scrollY - (h === '#faq' ? 0 : 0));
  }));

  /* ── Reveal on scroll ── */
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal], [data-stagger], .photo:not(.hero__video)').forEach((el) => io.observe(el));

  /* ── Services: expanding photo panels ── */
  const panels = $$('.panel');
  const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function openPanel(p) {
    panels.forEach((x) => { const on = x === p; x.classList.toggle('is-active', on); x.setAttribute('aria-expanded', String(on)); });
  }
  panels.forEach((p) => {
    p.addEventListener('click', () => openPanel(p));
    // keyboard focus opens a panel; a tap or click does it on `click`, so the layout never shifts under a finger
    p.addEventListener('focus', () => { if (p.matches(':focus-visible')) openPanel(p); });
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(p); } });
    if (hoverPointer) p.addEventListener('mouseenter', () => { if (innerWidth > 900) openPanel(p); });
    // "Book ..." jumps to the form with the service already chosen
    $('.panel__cta', p).addEventListener('click', () => {
      const sel = $('#form').elements.service;
      [...sel.options].forEach((o) => { if (o.text === p.dataset.service) sel.value = o.value || o.text; });
    });
  });

  /* ── Reviews: swipe deck ── */
  (function deck() {
    const el = $('#deck'); if (!el) return;
    const cards = $$('.rcard', el), n = cards.length, now = $('#rNow');
    let cur = 0, timer = 0, busy = false;
    const place = () => cards.forEach((c, i) => {
      const pos = (i - cur + n) % n;
      c.style.setProperty('--pos', Math.min(pos, 3));
      if (pos > 2) c.setAttribute('data-hidden', ''); else c.removeAttribute('data-hidden');
    });
    function go(dir) {
      if (busy) return; busy = true;
      if (dir > 0) {
        const out = cards[cur]; out.classList.add('is-leaving');
        cur = (cur + 1) % n; place();
        setTimeout(() => { out.classList.remove('is-leaving'); busy = false; }, 900);
      } else {
        cur = (cur - 1 + n) % n;
        const back = cards[cur]; back.classList.add('is-leaving'); place();
        requestAnimationFrame(() => requestAnimationFrame(() => back.classList.remove('is-leaving')));
        setTimeout(() => { busy = false; }, 900);
      }
      now.textContent = String(cur + 1).padStart(2, '0');
    }
    const auto = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => go(1), 7000); };
    $('#rNext').addEventListener('click', () => { go(1); auto(); });
    $('#rPrev').addEventListener('click', () => { go(-1); auto(); });
    let sx = null;
    el.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) { go(dx < 0 ? 1 : -1); auto(); } });
    el.addEventListener('mouseenter', () => clearInterval(timer));
    el.addEventListener('mouseleave', auto);
    place(); auto();
  })();

  /* ── FAQ: choose a question, its answer opens beside it (under it on phones) ── */
  (function faq() {
    const items = $$('.qa');
    const open = (it, force) => items.forEach((x) => {
      const on = x === it && (force || !x.classList.contains('is-on') || innerWidth > 1000);
      x.classList.toggle('is-on', on);
      $('.qa__q', x).setAttribute('aria-expanded', String(on));
    });
    items.forEach((it) => {
      const q = $('.qa__q', it);
      q.addEventListener('click', () => open(it));
      q.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover) and (min-width: 1001px)').matches) open(it, true); });
      q.addEventListener('focus', () => { if (q.matches(':focus-visible') && innerWidth > 1000) open(it, true); });
    });
  })();

  /* ── Booking form (front-end demo only) ── */
  const form = $('#form'), ok = $('#formOk');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name, email = form.elements.email;
    const badName = !name.value.trim(), badMail = !/^\S+@\S+\.\S+$/.test(email.value);
    name.classList.toggle('err', badName); email.classList.toggle('err', badMail);
    if (badName || badMail) { ok.textContent = 'Please add your name and a valid email.'; return; }
    ok.textContent = `Thank you, ${name.value.trim().split(' ')[0]}. We will confirm your appointment by email within a day.`;
    form.reset();
  });

  /* ── Video slots: any <figure class="photo" data-video="..."> becomes a scroll-scrubbed clip ── */
  const clips = [];
  $$('.photo[data-video]').forEach((fig) => {
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto'; v.tabIndex = -1; v.loop = false;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    v.setAttribute('disablepictureinpicture', ''); v.setAttribute('aria-hidden', 'true');
    // show the video as soon as the browser has anything to draw (phones fire different events)
    const show = () => fig.classList.add('is-loaded', 'has-video');
    ['loadeddata', 'canplay', 'playing'].forEach((ev) => v.addEventListener(ev, show, { once: true }));
    // phones get a lighter clip when one is provided; try .mp4 first, then a .webm with the same name
    const base = (matchMedia('(max-width: 700px)').matches && fig.dataset.videoMobile) || fig.dataset.video;
    let triedWebm = false;
    v.addEventListener('error', () => {
      if (!triedWebm && /\.mp4$/.test(base)) { triedWebm = true; v.src = base.replace(/\.mp4$/, '.webm'); }
      else { fig.classList.remove('has-video'); v.remove(); }
    });
    $('.photo__in', fig).appendChild(v);
    clips.push({ fig, v, base, started: false, hero: fig.classList.contains('hero__video') });
  });

  // iPhones and some Androids only start loading a video after it has been told to play once.
  // Muted + inline playback is allowed, so start it, then stop it on the first frame so scroll can drive it.
  const prime = (v) => {
    if (v.dataset.primed || !v.src) return;
    const p = v.play();
    if (p && p.then) p.then(() => { v.dataset.primed = '1'; v.pause(); }).catch(() => {});
  };
  // clips download only when they get close to the screen (the hero starts straight away), so phones are not flooded
  const startClip = (c) => {
    if (c.started) return; c.started = true;
    c.v.src = c.base; c.v.load();
    c.v.addEventListener('loadedmetadata', () => prime(c.v), { once: true });
    prime(c.v);
  };
  const clipIO = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    const c = clips.find((x) => x.fig === en.target); if (c) startClip(c);
    clipIO.unobserve(en.target);
  }), { rootMargin: '700px 0px' });
  clips.forEach((c) => { if (c.hero) startClip(c); else clipIO.observe(c.fig); });
  // if the phone refused (data saver / low power mode), the first touch is allowed to start them
  ['touchstart', 'pointerdown', 'scroll'].forEach((ev) => addEventListener(ev, () => clips.forEach((c) => c.started && prime(c.v)), { once: true, passive: true }));

  /* ── Scroll-linked: nav, hero stage, photo motion and clip scrubbing ── */
  const nav = $('#nav');
  const hero = $('#hero'), stage = $('.hero__stage');
  const photos = $$('.photo').filter((f) => !f.classList.contains('hero__video'));
  let lastY = scrollY, hidden = false, vh = innerHeight, dirty = true, heroP = 0, scrubbing = false;
  const progress = (r) => clamp((vh - r.top) / (vh + r.height));

  const stepsEl = $('.steps'), stepItems = $$('.steps li');

  function effects() {
    const y = scrollY;
    const heroSpan = Math.max(1, hero.offsetHeight - vh);
    heroP = clamp(y / heroSpan);
    stage.style.setProperty('--p', heroP.toFixed(4));
    const onHero = heroP < .3;
    nav.classList.toggle('on-hero', onHero);
    nav.classList.toggle('is-solid', !onHero && y > 40);
    const dy = y - lastY;
    if (Math.abs(dy) > 4) {
      const hide = dy > 0 && y > 500 && !onHero && !menu.classList.contains('is-open');
      if (hide !== hidden) { hidden = hide; nav.classList.toggle('is-hidden', hidden); }
      lastY = y;
    }
    // timeline: the step nearest the middle of the screen lights up and the line fills
    const sr = stepsEl.getBoundingClientRect();
    if (sr.top < vh && sr.bottom > 0) {
      stepsEl.style.setProperty('--sp', clamp((vh * .55 - sr.top) / sr.height).toFixed(3));
      let best = 0, bestD = Infinity;
      stepItems.forEach((li, i) => { const r = li.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - vh * .5); if (d < bestD) { bestD = d; best = i; } });
      stepItems.forEach((li, i) => li.classList.toggle('is-current', i === best));
    }
    if (!reduced) photos.forEach((fig) => {
      const r = fig.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) return;
      const inner = $('.photo__in', fig);
      const p = progress(r);
      // slow zoom-out as the photo travels up the screen
      inner.style.scale = (1.16 - .16 * clamp(p * 1.7)).toFixed(4);
      if (fig.dataset.parallax) {
        const off = (r.top + r.height / 2 - vh / 2) * parseFloat(fig.dataset.parallax) * -1;
        inner.style.translate = `0 ${Math.round(off * 10) / 10}px`;
      }
    });
  }

  function scrub() {
    if (reduced) return;
    clips.forEach((c) => {
      const v = c.v;
      if (!v.duration || !isFinite(v.duration) || v.readyState < 2 || v.seeking) return;
      if (!v.paused) v.pause();
      let p;
      if (c.hero) p = heroP;
      else {
        const r = c.fig.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        p = progress(r);
      }
      const target = clamp(p) * (v.duration - .05);
      const diff = target - v.currentTime;
      if (Math.abs(diff) > .025) v.currentTime = v.currentTime + diff * .2;
    });
  }

  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  addEventListener('resize', () => { vh = innerHeight; dirty = true; });
  (function frame() {
    stepSmooth();
    if (dirty) { dirty = false; effects(); }
    scrub();
    requestAnimationFrame(frame);
  })();

  /* ── Intro ── */
  const loader = $('#loader');
  let started = false;
  function reveal() {
    if (started) return; started = true;
    loader.classList.add('is-done');
    document.body.classList.remove('is-locked');
    setTimeout(() => {
      document.body.classList.add('is-ready');
      $('.hero__video').classList.add('in');
    }, 650);
    setTimeout(() => { loader.style.display = 'none'; }, 1400);
  }
  initSmooth();
  if (reduced) {
    loader.style.display = 'none';
    document.body.classList.add('is-ready');
    $$('.photo').forEach((f) => f.classList.add('in'));
  } else {
    document.body.classList.add('is-locked');
    scrollTo(0, 0);
    const wait = new Promise((r) => setTimeout(r, 1700));
    const fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
    Promise.all([wait, fonts]).then(reveal);
    setTimeout(reveal, 5000);
  }
})();
