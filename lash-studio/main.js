/* Verelle — Lash Atelier
   Vanilla JS, no dependencies. */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  const NS = 'http://www.w3.org/2000/svg';

  /* ────────────────────────────────────────────────
     Eye illustration engine
     Procedural line-art: every lash is a tapered,
     curled stroke placed along the upper lid.
     ──────────────────────────────────────────────── */
  // Closed eye: LINE is the lash line (smile curve), CREASE the lid fold above it.
  const LINE = [[64, 120], [186, 236], [416, 236], [528, 106]];
  const CREASE = [[64, 120], [166, 8], [440, 4], [528, 106]];
  const bz = (p, t) => {
    const u = 1 - t;
    return [
      u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
      u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
    ];
  };
  const bd = (p, t) => {
    const u = 1 - t;
    return [
      3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]),
      3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]),
    ];
  };
  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const smooth = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };

  const STYLES = {
    natural: {
      name: 'Natural', fig: 'I', pair: 'Classic &nbsp;·&nbsp; Hybrid',
      desc: 'Even, balanced length from corner to corner. An eye that looks rested and open, as if you were simply born with it.',
      fn: (t) => .46 + .1 * Math.sin(t * Math.PI),
    },
    doll: {
      name: 'Doll', fig: 'II', pair: 'Volume &nbsp;·&nbsp; Hybrid',
      desc: 'Longest at the centre of the eye, tapering softly to each corner. It rounds and opens the eye for a wide, bright gaze.',
      fn: (t) => .3 + .66 * Math.exp(-Math.pow((t - .5) / .27, 2)),
    },
    cat: {
      name: 'Cat Eye', fig: 'III', pair: 'Hybrid &nbsp;·&nbsp; Mega Volume',
      desc: 'Short at the inner corner, lengthening gradually into a dramatic outer flick. It lifts and elongates the eye.',
      fn: (t) => .16 + .74 * Math.pow(smooth(.04, .98, t), 1.45),
    },
    squirrel: {
      name: 'Squirrel', fig: 'IV', pair: 'Volume &nbsp;·&nbsp; Hybrid',
      desc: 'Weighted toward the outer centre with a gently wispy finish. It adds lift and a playful, textured flare.',
      fn: (t) => .26 + .72 * Math.exp(-Math.pow((t - .7) / .2, 2)),
    },
  };

    const f1 = (n) => Math.round(n * 10) / 10;

  function createEye(host, { seed = 3, n = 48, style = 'natural', grow = 0 } = {}) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 600 360');
    svg.setAttribute('class', 'eye');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    const linePath = `M${LINE[0]} C${LINE[1]} ${LINE[2]} ${LINE[3]}`;
    const creasePath = `M${CREASE[0]} C${CREASE[1]} ${CREASE[2]} ${CREASE[3]}`;
    const lidShape = `${linePath} C${CREASE[2]} ${CREASE[1]} ${CREASE[0]} Z`;

    svg.innerHTML = `
      <path class="lid" d="${lidShape}"/>
      <path class="ln ln--fine" d="${creasePath}"/>
      <path class="ln ln--line" d="${linePath}"/>
      <path class="lash up"/>`;
    host.appendChild(svg);
    const upEl = $('.lash.up', svg);

    // deterministic jitter so the lash line feels hand-placed
    const rnd = mulberry(seed);
    const jit = Array.from({ length: n }, () => [rnd(), rnd(), rnd()]);
    const state = { fn: STYLES[style].fn, g: grow };

    function draw() {
      const { fn, g } = state;
      let d = '';
      for (let i = 0; i < n; i++) {
        const t = .03 + .95 * (i / (n - 1));
        const [x, y] = bz(LINE, t);
        const [dx, dy] = bd(LINE, t);
        const L = Math.hypot(dx, dy);
        const tx = dx / L, ty = dy / L;
        const nx = -ty, ny = tx;                                  // outward (down) normal
        const ang = (8 - 24 * t + (jit[i][0] - .5) * 5) * Math.PI / 180;
        const c = Math.cos(ang), s = Math.sin(ang);
        const ux = nx * c - ny * s, uy = nx * s + ny * c;         // lash direction
        const px = uy, py = -ux;                                  // curl side (toward the outer corner)
        const local = clamp((g - t * .32) / .68);
        const len = (14 + 112 * fn(t)) * (.93 + jit[i][1] * .14) * easeOut(local);
        if (len < .6) continue;
        const w = 3.2 * (.85 + jit[i][2] * .3);
        const bx = x - ux * 1.2, by = y - uy * 1.2;
        const cx = bx + ux * len * .55 + px * len * .02, cy = by + uy * len * .55 + py * len * .02;
        const ex = bx + ux * len * .97 + px * len * .22, ey = by + uy * len * .97 + py * len * .22;
        d += `M${f1(bx - tx * w / 2)} ${f1(by - ty * w / 2)}Q${f1(cx - tx * w * .2)} ${f1(cy - ty * w * .2)} ${f1(ex)} ${f1(ey)}Q${f1(cx + tx * w * .2)} ${f1(cy + ty * w * .2)} ${f1(bx + tx * w / 2)} ${f1(by + ty * w / 2)}Z`;
      }
      upEl.setAttribute('d', d);
    }

    let raf = 0;
    function tween(opts) {
      cancelAnimationFrame(raf);
      const { from, to, ms, ease = easeIO, toFn, onDone } = opts;
      const fromFn = state.fn, g0 = state.g;
      if (reduced) { state.fn = toFn || state.fn; state.g = to ?? state.g; draw(); onDone && onDone(); return; }
      const t0 = performance.now();
      const step = (now) => {
        const k = clamp((now - t0) / ms), e = ease(k);
        if (toFn) { const a = fromFn, b = toFn; state.fn = (t) => lerp(a(t), b(t), e); }
        if (to != null) state.g = lerp(from ?? g0, to, e);
        draw();
        if (k < 1) raf = requestAnimationFrame(step);
        else { if (toFn) state.fn = toFn; onDone && onDone(); }
      };
      raf = requestAnimationFrame(step);
    }

    draw();
    return {
      svg,
      grow: (ms = 1700) => tween({ from: 0, to: 1, ms, ease: (t) => t }),
      morph: (key, ms = 900) => tween({ toFn: STYLES[key].fn, ms }),
    };
  }

  /* ── Plates (illustrated photo slots) ── */
  const plates = [];
  $$('.ph[data-plate]').forEach((ph, i) => {
    if ($('img', ph)) return;
    const eye = createEye(ph, { seed: 11 + i * 7, style: ph.dataset.plate, grow: reduced ? 1 : 0 });
    // keep caption above svg
    const cap = $('figcaption', ph); if (cap) ph.appendChild(cap);
    plates.push({ ph, eye, played: false, hero: !!ph.closest('.hero') });
  });
  const playPlate = (p, delay = 0) => { if (p.played) return; p.played = true; setTimeout(() => p.eye.grow(1900), delay); };

  /* ── Fans (service illustrations) ── */
  function buildFan(svg) {
    const kind = svg.dataset.fan;
    let html = '';
    if (kind === 'lift') {
      html += `<path class="guide" d="M22 168 Q100 202 178 168"/>`;
      for (let i = 0; i < 9; i++) {
        const t = i / 8, x = lerp(34, 166, t), y = 168 + Math.sin(t * Math.PI) * 17 - 10;
        const a = lerp(-.5, .62, t), sx = Math.sin(a), cy = Math.cos(a);
        html += `<path class="fil" pathLength="1" style="--k:${i}" d="M${f1(x)} ${f1(y)} C${f1(x + sx * 34)} ${f1(y - cy * 44)} ${f1(x + sx * 58 + 18)} ${f1(y - cy * 82)} ${f1(x + sx * 70 + 38)} ${f1(y - cy * 98)}"/>`;
      }
    } else {
      const n = +kind;
      const spread = n === 1 ? 0 : Math.min(42, 5.4 * (n - 1) + 10);
      html += `<path class="stem" d="M100 196 L100 168"/>`;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? .5 : i / (n - 1);
        const a = (n === 1 ? 4 : lerp(-spread, spread, t)) * Math.PI / 180;
        const L = (n === 1 ? 134 : 124 + Math.sin(t * Math.PI) * 10);
        const sx = Math.sin(a), cy = Math.cos(a);
        html += `<path class="fil" pathLength="1" style="--k:${i}" d="M100 168 Q${f1(100 + sx * L * .5 - 2)} ${f1(168 - cy * L * .52)} ${f1(100 + sx * L + (n === 1 ? 10 : 0))} ${f1(168 - cy * L)}"/>`;
      }
    }
    svg.innerHTML = html;
  }
  $$('.fan').forEach(buildFan);

  /* ────────────────────────────────────────────────
     Smooth scrolling (wheel-based, eased)
     ──────────────────────────────────────────────── */
  const sc = { target: 0, current: 0, set: 0, on: false, busy: false };
  const maxScroll = () => Math.max(0, root.scrollHeight - innerHeight);
  const smoothEnabled = !reduced && finePointer;

  function initSmooth() {
    if (!smoothEnabled) return;
    sc.on = true;
    sc.target = sc.current = sc.set = scrollY;
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.defaultPrevented || document.body.classList.contains('is-locked')) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      // let nested horizontal scrollers handle their own wheel
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 34; else if (e.deltaMode === 2) d *= innerHeight;
      e.preventDefault();
      sc.target = clamp(sc.target + d, 0, maxScroll());
    }, { passive: false });
    addEventListener('scroll', () => {
      if (Math.abs(scrollY - sc.set) > 2) { sc.target = sc.current = sc.set = scrollY; }
    }, { passive: true });
  }
  function stepSmooth() {
    if (!sc.on) return;
    sc.target = clamp(sc.target, 0, maxScroll());
    const diff = sc.target - sc.current;
    if (Math.abs(diff) < .08) { if (sc.current !== sc.target) { sc.current = sc.target; sc.set = sc.current; scrollTo(0, sc.current); } return; }
    sc.current += diff * .085;
    sc.set = sc.current;
    scrollTo(0, sc.current);
  }
  function goTo(y) {
    y = clamp(y, 0, maxScroll());
    if (sc.on) sc.target = y; else scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const h = a.getAttribute('href');
    if (h.length < 2) { e.preventDefault(); goTo(0); closeMenu(); return; }
    const el = $(h);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    goTo(h === '#top' ? 0 : el.getBoundingClientRect().top + scrollY - (h === '#services' ? 0 : 0));
  }));

  /* ────────────────────────────────────────────────
     Mobile menu
     ──────────────────────────────────────────────── */
  const burger = $('#burger'), menu = $('#menu');
  function closeMenu() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('is-locked');
  }
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  });

  /* ────────────────────────────────────────────────
     Reveal on scroll
     ──────────────────────────────────────────────── */
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      io.unobserve(el);
      if (el.matches('[data-count]')) countUp(el);
    });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal], .fan, [data-count]').forEach((el) => io.observe(el));

  const plateIO = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      const p = plates.find((x) => x.ph === en.target);
      plateIO.unobserve(en.target);
      if (p && !p.hero) playPlate(p, 150);
    });
  }, { threshold: .35 });
  plates.forEach((p) => { if (!p.hero) plateIO.observe(p.ph); });

  function countUp(el) {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
    if (reduced) { el.textContent = fmt(end); return; }
    const t0 = performance.now(), ms = 2200;
    const step = (now) => {
      const k = clamp((now - t0) / ms);
      el.textContent = fmt(end * easeOut(k));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  $$('[data-count]').forEach((el) => { el.textContent = (+el.dataset.dec ? '0.0' : '0') + (el.dataset.suffix || ''); });

  /* ── Statement: words light up with scroll ── */
  const stmt = $('#statement');
  const words = [];
  (function splitWords() {
    const txt = stmt.textContent.trim().split(/\s+/);
    stmt.textContent = '';
    txt.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w'; s.textContent = w;
      stmt.appendChild(s);
      if (i < txt.length - 1) stmt.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  })();

  /* ────────────────────────────────────────────────
     Style finder
     ──────────────────────────────────────────────── */
  const stage = $('#eyeStage');
  const finder = createEye(stage, { seed: 5, n: 52, style: 'natural', grow: reduced ? 1 : 0 });
  let finderPlayed = false;
  new IntersectionObserver((ents, o) => {
    if (ents[0].isIntersecting && !finderPlayed) { finderPlayed = true; finder.grow(2000); o.disconnect(); }
  }, { threshold: .3 }).observe(stage);

  const tabs = $$('.tabs button');
  const sName = $('#styleName'), sDesc = $('#styleDesc'), sPair = $('#stylePair'), sFig = $('#eyeFig');
  tabs.forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.style, st = STYLES[k];
    tabs.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    finder.morph(k, 1000);
    [sName, sDesc, sPair].forEach((el) => { el.style.transition = 'opacity .25s'; el.style.opacity = 0; });
    setTimeout(() => {
      sName.textContent = st.name; sDesc.textContent = st.desc; sPair.innerHTML = st.pair; sFig.textContent = st.fig;
      [sName, sDesc, sPair].forEach((el) => { el.style.transition = 'opacity .6s'; el.style.opacity = 1; });
    }, 260);
  }));

  /* ────────────────────────────────────────────────
     Work rail (drag + buttons + progress)
     ──────────────────────────────────────────────── */
  const rail = $('#rail'), bar = $('#railBar');
  function railProgress() {
    const sw = rail.scrollWidth, cw = rail.clientWidth;
    bar.style.width = (cw / sw * 100) + '%';
    bar.style.left = (rail.scrollLeft / sw * 100) + '%';
  }
  rail.addEventListener('scroll', railProgress, { passive: true });
  addEventListener('resize', railProgress);
  railProgress();

  let drag = null, vel = 0, inertia = 0;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    cancelAnimationFrame(inertia);
    drag = { x: e.clientX, left: rail.scrollLeft, last: e.clientX, moved: 0 };
    rail.setPointerCapture(e.pointerId);
  });
  rail.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 3) rail.classList.add('is-drag');
    vel = e.clientX - drag.last; drag.last = e.clientX;
    rail.scrollLeft = drag.left - dx;
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null; rail.classList.remove('is-drag');
    const glide = () => { vel *= .94; rail.scrollLeft -= vel; if (Math.abs(vel) > .4) inertia = requestAnimationFrame(glide); };
    glide();
  };
  rail.addEventListener('pointerup', endDrag);
  rail.addEventListener('pointercancel', endDrag);
  const slideW = () => ($('.slide', rail).offsetWidth + 28);
  $('#next').addEventListener('click', () => rail.scrollBy({ left: slideW(), behavior: 'smooth' }));
  $('#prev').addEventListener('click', () => rail.scrollBy({ left: -slideW(), behavior: 'smooth' }));

  /* ────────────────────────────────────────────────
     Testimonials
     ──────────────────────────────────────────────── */
  const quotes = $$('.quote'), dots = $$('#qDots i'), qNow = $('#qNow');
  let qi = 0, qTimer;
  function showQuote(i) {
    qi = (i + quotes.length) % quotes.length;
    quotes.forEach((q, k) => q.classList.toggle('is-on', k === qi));
    dots.forEach((d, k) => d.classList.toggle('on', k === qi));
    qNow.textContent = String(qi + 1).padStart(2, '0');
  }
  const qAuto = () => { clearInterval(qTimer); qTimer = setInterval(() => showQuote(qi + 1), 7000); };
  dots.forEach((d, k) => d.addEventListener('click', () => { showQuote(k); qAuto(); }));
  if (!reduced) qAuto();

  /* ────────────────────────────────────────────────
     Accordion
     ──────────────────────────────────────────────── */
  const qs = $$('.acc__q');
  qs.forEach((q) => q.addEventListener('click', () => {
    const open = q.getAttribute('aria-expanded') === 'true';
    qs.forEach((x) => x.setAttribute('aria-expanded', 'false'));
    q.setAttribute('aria-expanded', String(!open));
  }));

  /* ────────────────────────────────────────────────
     Form (front-end demo only)
     ──────────────────────────────────────────────── */
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

  /* ────────────────────────────────────────────────
     Cursor + magnetic buttons
     ──────────────────────────────────────────────── */
  if (finePointer && !reduced) {
    const cur = $('#cursor'), label = $('span', cur);
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; cur.classList.add('is-on'); }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('a, button, input, select, textarea, [data-cursor], .dots i');
      const dr = e.target.closest('[data-cursor]');
      cur.classList.toggle('is-link', !!t && !dr);
      cur.classList.toggle('is-drag', !!dr);
      if (dr) label.textContent = dr.dataset.cursor;
    });
    (function follow() {
      cx = lerp(cx, mx, .2); cy = lerp(cy, my, .2);
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(follow);
    })();

    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * .28, y = (e.clientY - (r.top + r.height / 2)) * .4;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ────────────────────────────────────────────────
     Scroll-linked effects (single frame loop)
     ──────────────────────────────────────────────── */
  const nav = $('#nav');
  const parallax = $$('[data-parallax]');
  const cards = $$('.card');
  const steps = $('#steps'), stepsFill = $('#stepsFill');
  const foot = $('.foot'), mark = $('.foot__mark');
  let lastY = scrollY, hidden = false, vh = innerHeight, cardTops = [];
  const measure = () => { vh = innerHeight; cardTops = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0); };
  addEventListener('resize', measure); measure();

  function effects() {
    const y = scrollY;
    // nav
    nav.classList.toggle('is-solid', y > 40);
    const dy = y - lastY;
    if (Math.abs(dy) > 4) {
      const shouldHide = dy > 0 && y > 500 && !menu.classList.contains('is-open');
      if (shouldHide !== hidden) { hidden = shouldHide; nav.classList.toggle('is-hidden', hidden); }
      lastY = y;
    }
    // parallax (hero arches)
    if (!reduced) parallax.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
      el.style.translate = `0 ${f1(off)}px`;
    });
    // statement words
    const sr = stmt.getBoundingClientRect();
    if (sr.top < vh && sr.bottom > 0) {
      const p = clamp((vh * .85 - sr.top) / (vh * .3 + sr.height));
      const n = Math.floor(p * words.length * 1.04);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    // stacked cards
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const d = next.getBoundingClientRect().top - cardTops[i + 1];
      const p = clamp(1 - d / (c.offsetHeight + 26));
      c.style.setProperty('--p', f1(p * 100) / 100);
    });
    // ritual line
    const rr = steps.getBoundingClientRect();
    stepsFill.style.height = (clamp((vh * .62 - rr.top) / rr.height) * 100) + '%';
    // footer wordmark
    const fr = foot.getBoundingClientRect();
    if (fr.top < vh) {
      const p = clamp((vh - fr.top) / (vh * .9));
      mark.style.setProperty('--ty', f1((1 - easeOut(p)) * mark.offsetHeight * .45) + 'px');
    }
  }

  let ticking = true;
  addEventListener('scroll', () => { ticking = true; }, { passive: true });
  addEventListener('resize', () => { ticking = true; });
  (function frame() {
    stepSmooth();
    if (ticking) { ticking = false; effects(); }
    requestAnimationFrame(frame);
  })();

  /* ────────────────────────────────────────────────
     Intro sequence
     ──────────────────────────────────────────────── */
  const loader = $('#loader');
  let started = false;
  function reveal() {
    if (started) return; started = true;
    loader.classList.add('is-done');
    document.body.classList.remove('is-locked');
    setTimeout(() => {
      document.body.classList.add('is-ready');
      plates.filter((p) => p.hero).forEach((p, i) => playPlate(p, 700 + i * 350));
    }, 650);
    setTimeout(() => { loader.style.display = 'none'; }, 1400);
  }
  initSmooth();
  if (reduced) { loader.style.display = 'none'; document.body.classList.add('is-ready'); plates.forEach((p) => { p.played = true; p.eye.grow(1); }); }
  else {
    document.body.classList.add('is-locked');
    scrollTo(0, 0);
    const minWait = new Promise((r) => setTimeout(r, 2300));
    const fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
    Promise.all([minWait, fonts]).then(reveal);
    setTimeout(reveal, 5000); // failsafe
  }
})();
