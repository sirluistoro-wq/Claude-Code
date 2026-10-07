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
  $$('[data-reveal], .photo:not(.hero__main):not(.hero__side)').forEach((el) => {
    if (el.closest('.preview')) return;
    io.observe(el);
  });

  /* ── Services: photo follows the cursor ── */
  const list = $('#menuList'), preview = $('#preview');
  if (finePointer && !reduced) {
    const items = $$('.photo', preview);
    const rows = $$('.row', list);
    let mx = 0, my = 0, px = 0, py = 0, active = false;
    const w = () => preview.offsetWidth, h = () => preview.offsetHeight;
    list.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
    rows.forEach((row, i) => {
      row.addEventListener('mouseenter', (e) => {
        if (!active) { px = mx = e.clientX; py = my = e.clientY; }
        active = true;
        list.classList.add('is-hovering');
        rows.forEach((r) => r.classList.toggle('is-on', r === row));
        items.forEach((it, k) => it.classList.toggle('is-on', k === i));
        preview.classList.add('is-on');
      });
    });
    list.addEventListener('mouseleave', () => {
      active = false;
      list.classList.remove('is-hovering');
      rows.forEach((r) => r.classList.remove('is-on'));
      preview.classList.remove('is-on');
    });
    (function follow() {
      px = lerp(px, mx, .14); py = lerp(py, my, .14);
      preview.style.transform = `translate3d(${px + 28}px, ${py - h() / 2}px, 0) rotate(${clamp((mx - px) * .05, -6, 6)}deg)`;
      requestAnimationFrame(follow);
    })();
  }

  /* ── FAQ accordion ── */
  const qs = $$('.acc__q');
  qs.forEach((q) => q.addEventListener('click', () => {
    const open = q.getAttribute('aria-expanded') === 'true';
    qs.forEach((x) => x.setAttribute('aria-expanded', 'false'));
    q.setAttribute('aria-expanded', String(!open));
  }));

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

  /* ── Scroll-linked: nav + gentle photo parallax ── */
  const nav = $('#nav');
  const plx = $$('[data-parallax]');
  let lastY = scrollY, hidden = false, vh = innerHeight, dirty = true;

  function effects() {
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 40);
    const dy = y - lastY;
    if (Math.abs(dy) > 4) {
      const hide = dy > 0 && y > 500 && !menu.classList.contains('is-open');
      if (hide !== hidden) { hidden = hide; nav.classList.toggle('is-hidden', hidden); }
      lastY = y;
    }
    if (!reduced) plx.forEach((fig) => {
      const r = fig.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const off = (r.top + r.height / 2 - vh / 2) * parseFloat(fig.dataset.parallax) * -1;
      $('.photo__in', fig).style.translate = `0 ${Math.round(off * 10) / 10}px`;
    });
  }
  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  addEventListener('resize', () => { vh = innerHeight; dirty = true; });
  (function frame() {
    stepSmooth();
    if (dirty) { dirty = false; effects(); }
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
      $$('.hero__main, .hero__side').forEach((f, i) => setTimeout(() => f.classList.add('in'), 150 + i * 350));
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
