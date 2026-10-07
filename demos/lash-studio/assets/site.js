/* Velour Lash Studio — shared site script.
   Each page sets <body data-page="..."> and gets its own init below. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.body.dataset.page;
  const store = {
    get(k) { try { return sessionStorage.getItem('velour.' + k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem('velour.' + k, v); } catch {} },
    del(k) { try { sessionStorage.removeItem('velour.' + k); } catch {} },
  };

  /* ── Data ─────────────────────────────── */
  const SERVICES = [
    { id: 'classic', group: 'sets', name: 'Classic full set', price: 140, mins: 105, lasts: '3–4 weeks', best: 'First-timers, a mascara look',
      desc: 'One extension bonded to each natural lash. Clean, defined and the easiest set to live with.', style: 'classic' },
    { id: 'hybrid', group: 'sets', name: 'Hybrid full set', price: 165, mins: 120, lasts: '3–4 weeks', best: 'Texture without heaviness',
      desc: 'Roughly half classic, half handmade volume fans. Soft, textured, and the most requested set in the studio.', style: 'hybrid' },
    { id: 'volume', group: 'sets', name: 'Volume full set', price: 190, mins: 135, lasts: '3–4 weeks', best: 'Sparse lashes, full density',
      desc: 'Handmade 3–6D fans of ultra-fine fibres. Fluffy and dark, while staying light on your natural lashes.', style: 'volume' },
    { id: 'mega', group: 'sets', name: 'Mega volume set', price: 230, mins: 150, lasts: '3–4 weeks', best: 'Maximum drama',
      desc: '8–16D fans at 0.03–0.05 mm for the darkest, fullest lash line. Strong, healthy natural lashes required.', style: 'mega' },
    { id: 'fill2', group: 'fills', name: '2-week fill', price: 65, mins: 45, lasts: 'Within 14 days', best: 'Keeping a set full',
      desc: 'Replaces grown-out and shed extensions. At least 40% of your set must remain.' },
    { id: 'fill3', group: 'fills', name: '3-week fill', price: 85, mins: 60, lasts: 'Within 21 days', best: 'Most clients',
      desc: 'Our most booked fill. Includes a cleanse and a fresh lash map check.' },
    { id: 'foreign', group: 'fills', name: 'Foreign fill', price: 120, mins: 90, lasts: 'First visit only', best: 'Sets from another studio',
      desc: 'Assessment, partial removal and rebuild when your current set was done elsewhere.' },
    { id: 'lift', group: 'natural', name: 'Lash lift & tint', price: 95, mins: 60, lasts: '6–8 weeks', best: 'No extensions, low upkeep',
      desc: 'Lifts and curls your natural lashes from the root, finished with a tint for a mascara-free look.' },
    { id: 'brow', group: 'natural', name: 'Brow lamination', price: 85, mins: 50, lasts: '4–6 weeks', best: 'Fuller, brushed-up brows',
      desc: 'Sets brow hairs in place, then shapes and tints for a full, groomed finish.' },
  ];
  const ADDONS = [
    { name: 'Bottom lashes', price: 25, time: '+15 min' },
    { name: 'Coloured lash accents', price: 15, time: '+10 min' },
    { name: 'Lash removal', price: 30, time: '30 min' },
    { name: 'Brow tint', price: 20, time: '+10 min' },
    { name: 'Lash bath kit', price: 18, time: 'Take home' },
    { name: 'Patch test', price: 0, time: '15 min' },
  ];
  // zones = lengths in mm across the lid, inner corner → outer corner
  const STYLES = {
    classic: { name: 'Classic', fan: 1, w: 1.6, curl: .22, density: 34 },
    hybrid:  { name: 'Hybrid',  fan: 2, spread: .25, w: 1.5, curl: .25, density: 40 },
    wispy:   { name: 'Wispy',   fan: 2, spread: .3, spikes: 4, w: 1.3, curl: .28, density: 38 },
    volume:  { name: 'Volume',  fan: 4, spread: .4, w: 1.4, curl: .3, density: 40 },
    mega:    { name: 'Mega volume', fan: 6, spread: .5, w: 1.3, curl: .3, density: 42 },
    lift:    { name: 'Lash lift', fan: 1, w: 1.2, curl: .45, density: 30 },
  };
  const MAPS = [
    { id: 'cat-classic', style: 'classic', shape: 'Cat eye', zones: [8, 9, 10, 11, 12], curl: 'C', fibre: '0.15 mm', svc: 'classic',
      note: 'Lengths build toward the outer corner to lift and elongate. Great for round or downturned eyes.' },
    { id: 'doll-hybrid', style: 'hybrid', shape: 'Doll eye', zones: [9, 11, 12, 11, 9], curl: 'CC', fibre: '0.07 / 0.15', svc: 'hybrid',
      note: 'Longest lengths sit over the centre of the eye to open it up. Suits almond and hooded eyes.' },
    { id: 'squirrel-wispy', style: 'wispy', shape: 'Squirrel', zones: [8, 10, 12, 13, 11], curl: 'CC', fibre: '0.07 mm', svc: 'volume',
      note: 'Peaks just past the arch, then softens at the corner. A lifted look without dragging the eye down.' },
    { id: 'open-volume', style: 'volume', shape: 'Open eye', zones: [9, 11, 13, 12, 10], curl: 'D', fibre: '0.05 mm', svc: 'volume',
      note: 'Dense fans with a tight curl to make eyes look rounder and brighter.' },
    { id: 'natural-classic', style: 'classic', shape: 'Natural', zones: [8, 9, 10, 10, 9], curl: 'C', fibre: '0.12 mm', svc: 'classic',
      note: 'Follows your natural lash pattern with a touch more length. Nobody will know.' },
    { id: 'cat-mega', style: 'mega', shape: 'Cat eye', zones: [9, 11, 12, 14, 15], curl: 'D', fibre: '0.03 mm', svc: 'mega',
      note: 'Maximum density and a dramatic outer flick. Built for nights out and photos.' },
    { id: 'wispy-hybrid', style: 'hybrid', shape: 'Wispy cat', zones: [8, 10, 11, 13, 12], curl: 'CC', fibre: '0.07 / 0.15', svc: 'hybrid',
      note: 'Hybrid texture with longer spikes every few lashes. Our most saved look on social.' },
    { id: 'doll-volume', style: 'volume', shape: 'Doll eye', zones: [10, 12, 13, 12, 10], curl: 'D', fibre: '0.05 mm', svc: 'volume',
      note: 'Round and full. Pairs best with a D curl and very fine fans.' },
    { id: 'lift', style: 'lift', shape: 'Lash lift', zones: [6, 7, 8, 8, 7], curl: 'Lift', fibre: 'Natural', svc: 'lift',
      note: 'Your own lashes, lifted from the root and tinted. No extensions and no fills.' },
  ];
  const fmtDur = m => `${Math.floor(m / 60) ? Math.floor(m / 60) + ' hr ' : ''}${m % 60 ? m % 60 + ' min' : ''}`.trim();
  const bookHref = id => `book.html?service=${id}`;

  /* ── Lash drawing ─────────────────────── */
  let uid = 0;
  function eyeSVG(svg, o) {
    const P0 = [26, 112], P1 = [150, 22], P2 = [274, 112];
    const L1 = [150, 178];
    const q = (a, b, c, t) => (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c;
    const dq = (a, b, c, t) => 2 * (1 - t) * (b - a) + 2 * t * (c - b);
    const NS = 'http://www.w3.org/2000/svg';
    const cid = 'clip' + (++uid);
    svg.innerHTML = `
      <defs><clipPath id="${cid}"><path d="M${P0} Q${P1} ${P2} Q${L1} ${P0}Z"/></clipPath></defs>
      <g clip-path="url(#${cid})"><circle class="iris" cx="150" cy="104" r="40"/><circle class="glint" cx="164" cy="90" r="7"/></g>
      <path class="lower" d="M${P0} Q${L1} ${P2}"/>
      <path class="lid" d="M${P0} Q${P1} ${P2}"/>`;
    const n = o.count || o.density || 36, strands = o.fan || 1, curl = o.curl ?? .25;
    const lenAt = t => {
      if (o.zones) { // interpolate mm across 5 zones, ~4.6 px per mm
        const z = o.zones, f = t * (z.length - 1), i = Math.min(z.length - 2, Math.floor(f));
        return (z[i] + (z[i + 1] - z[i]) * (f - i)) * 4.6;
      }
      const prof = Math.exp(-((t - (o.peak ?? .68)) ** 2) / (2 * .22 ** 2));
      return o.len * (.45 + .55 * prof);
    };
    let i = 0;
    for (let k = 0; k < n; k++) {
      const t = .04 + .92 * (k / (n - 1));
      const x = q(P0[0], P1[0], P2[0], t), y = q(P0[1], P1[1], P2[1], t);
      let dx = dq(P0[0], P1[0], P2[0], t), dy = dq(P0[1], P1[1], P2[1], t);
      const m = Math.hypot(dx, dy); dx /= m; dy /= m;
      const taper = o.zones ? (.55 + .45 * Math.sin(Math.PI * Math.min(1, t * 1.25))) : 1;
      const L = lenAt(t) * taper * (o.spikes && k % o.spikes === 0 ? 1.22 : 1);
      for (let s = 0; s < strands; s++) {
        const spread = strands > 1 ? (s / (strands - 1) - .5) * (o.spread || .35) : 0;
        const tilt = (t - .5) * .9 + spread;
        let nx = dy, ny = -dx;
        const c = Math.cos(tilt), sn = Math.sin(tilt);
        [nx, ny] = [nx * c - ny * sn, nx * sn + ny * c];
        const ex = x + nx * L, ey = y + ny * L + L * curl * .2;
        const cx = x + nx * L * .55, cy = y + ny * L * .55 - L * curl * .6;
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('class', 'l');
        p.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
        p.setAttribute('pathLength', '1');
        p.style.strokeWidth = (o.w || 1.4) * (strands > 1 ? .7 : 1);
        if (svg.classList.contains('draw')) p.style.animationDelay = (.4 + i * (o.stagger ?? .012)) + 's';
        svg.appendChild(p); i++;
      }
    }
  }
  const drawMap = (svg, map) => eyeSVG(svg, { ...STYLES[map.style], zones: map.zones });

  // Any <svg data-eye='{"...":...}'> or data-map="id" draws itself
  $$('svg[data-eye]').forEach(s => eyeSVG(s, JSON.parse(s.dataset.eye)));
  $$('svg[data-map]').forEach(s => drawMap(s, MAPS.find(m => m.id === s.dataset.map)));

  /* ── Header, mobile menu, mobile book bar ── */
  const nav = $('#nav'), mbar = $('#mbar');
  const menuBtn = $('#menuBtn');
  menuBtn?.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) menuBtn.click(); });
  let hideBar = false;
  const bookSection = $('[data-hide-mbar]');
  if (bookSection) new IntersectionObserver(([e]) => { hideBar = e.isIntersecting; onScroll(); }, { threshold: .02 }).observe(bookSection);
  function onScroll() {
    nav?.classList.toggle('scrolled', scrollY > 8);
    mbar?.classList.toggle('show', scrollY > 360 && !hideBar);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Next open day (studio open Tue–Sat)
  const openDays = [];
  { const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    for (let i = 1; openDays.length < 14 && i < 40; i++) {
      const d = new Date(d0); d.setDate(d0.getDate() + i);
      if (d.getDay() !== 0 && d.getDay() !== 1) openDays.push(d);
    } }
  const shortDay = d => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  $$('[data-next-open]').forEach(el => el.textContent = shortDay(openDays[0]));

  /* ── Scroll reveal: only hide what starts below the fold ── */
  function reveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv:not(.seen)').forEach(el => {
      el.classList.add('seen');
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
  }

  /* ── Shared builders ──────────────────── */
  function menuItem(s) {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `<span class="name">${s.name}</span><span class="price">$${s.price}</span>
      <span class="desc">${s.desc}</span><span class="time">${fmtDur(s.mins)}</span>
      <a class="add" href="${bookHref(s.id)}">Book this</a>`;
    return el;
  }

  /* ════════ Pages ════════ */
  const pages = {
    home() {
      eyeSVG($('#heroEye'), { count: 44, len: 58, fan: 2, spread: .28, spikes: 5, w: 1.6, curl: .26, stagger: .014 });
      const grid = $('#styleGrid');
      ['cat-classic', 'doll-hybrid', 'squirrel-wispy', 'open-volume'].forEach((id, idx) => {
        const m = MAPS.find(x => x.id === id);
        const a = document.createElement('a');
        a.href = `gallery.html#${id}`; a.className = 'style-card rv'; a.style.textDecoration = 'none';
        a.style.transitionDelay = (idx * 80) + 'ms';
        a.innerHTML = `<div class="eye"><svg class="lash" viewBox="0 0 300 200" aria-hidden="true"></svg></div>
          <h3>${STYLES[m.style].name}</h3><p style="color:var(--muted);font-size:15px">${m.shape} map</p>
          <dl><dt>Curl</dt><dd>${m.curl}</dd><dt>Length</dt><dd>${Math.min(...m.zones)}–${Math.max(...m.zones)} mm</dd><dt>Fibre</dt><dd>${m.fibre}</dd></dl>`;
        grid.appendChild(a); drawMap($('svg', a), m);
      });
      SERVICES.filter(s => s.group === 'sets').forEach(s => $('#menuSets').appendChild(menuItem(s)));
      SERVICES.filter(s => s.group !== 'sets').slice(0, 4).forEach(s => $('#menuMore').appendChild(menuItem(s)));
      buildIntro();
    },

    services() {
      const list = $('#svcList');
      const groups = { sets: 'Full sets', fills: 'Fills', natural: 'Lifts & brows' };
      SERVICES.forEach(s => {
        const el = document.createElement('article');
        el.className = 'svc rv'; el.id = s.id; el.dataset.group = s.group;
        const art = s.style || (s.group === 'natural' ? 'lift' : 'hybrid');
        el.innerHTML = `
          <div class="eye"><svg class="lash" viewBox="0 0 300 200" aria-hidden="true"></svg></div>
          <div class="body">
            <span class="eyebrow">${groups[s.group]}</span>
            <h3>${s.name}</h3>
            <p>${s.desc}</p>
            <div class="specs"><span>${fmtDur(s.mins)}</span><span>Lasts ${s.lasts}</span><span>Best for: ${s.best}</span></div>
          </div>
          <div class="side"><span class="price">$${s.price}</span><small>$25 deposit to book</small>
            <a class="btn sm" href="${bookHref(s.id)}">Book <span class="arrow" aria-hidden="true">→</span></a></div>`;
        list.appendChild(el);
        eyeSVG($('svg', el), { ...STYLES[art], peak: s.group === 'fills' ? .6 : .68, len: 52 });
      });
      $$('#svcTabs .chip').forEach(c => c.addEventListener('click', () => {
        $$('#svcTabs .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c)));
        $$('.svc', list).forEach(el => el.hidden = c.dataset.g !== 'all' && el.dataset.group !== c.dataset.g);
      }));
      const addons = $('#addons');
      ADDONS.forEach(a => {
        const el = document.createElement('div'); el.className = 'item';
        el.innerHTML = `<span class="name">${a.name}</span><span class="price">${a.price ? '$' + a.price : 'Free'}</span><span class="desc"></span><span class="time">${a.time}</span>`;
        addons.appendChild(el);
      });
    },

    gallery() {
      const grid = $('#gallery'), lb = $('#lightbox');
      MAPS.forEach(m => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'g-card rv'; b.dataset.style = m.style; b.id = m.id;
        b.innerHTML = `<div class="eye"><svg class="lash" viewBox="0 0 300 200" aria-hidden="true"></svg></div>
          <div class="cap"><b>${m.shape}</b><small>${STYLES[m.style].name} · ${m.curl} curl · ${Math.min(...m.zones)}–${Math.max(...m.zones)} mm</small></div>`;
        b.addEventListener('click', () => openMap(m));
        grid.appendChild(b); drawMap($('svg', b), m);
      });
      $$('#gTabs .chip').forEach(c => c.addEventListener('click', () => {
        $$('#gTabs .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c)));
        $$('.g-card', grid).forEach(el => el.hidden = c.dataset.s !== 'all' && el.dataset.style !== c.dataset.s);
      }));
      let lastFocus;
      function openMap(m) {
        lastFocus = document.activeElement;
        const svg = $('#lbEye'); svg.classList.add('draw'); drawMap(svg, m);
        $('#lbStyle').textContent = `${STYLES[m.style].name} set`;
        $('#lbTitle').textContent = m.shape;
        $('#lbNote').textContent = m.note;
        $('#lbZones').innerHTML = m.zones.map((z, i) => `<div><b>${z}</b>${['Inner', '', 'Arch', '', 'Outer'][i] || 'mm'}</div>`).join('');
        $('#lbSpecs').innerHTML = `<span>${m.curl} curl</span><span>${m.fibre}</span><span>${STYLES[m.style].name}</span>`;
        $('#lbBook').href = bookHref(m.svc);
        $('#lbBook').onclick = () => store.set('note', `Lash map: ${m.shape}, ${STYLES[m.style].name} (${m.curl} curl, ${m.zones.join('/')} mm)`);
        lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
        $('.lb-close', lb).focus();
      }
      const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); lastFocus?.focus(); };
      $('.lb-close', lb).addEventListener('click', close);
      lb.addEventListener('click', e => { if (e.target === lb) close(); });
      addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
      const hash = location.hash.slice(1), hit = MAPS.find(m => m.id === hash);
      if (hit) setTimeout(() => { $('#' + hash).scrollIntoView({ block: 'center' }); openMap(hit); }, 300);
    },

    about() {},

    book() {
      const state = { svc: null, day: null, time: null };
      const svcChips = $('#svcChips'), dayStrip = $('#dayStrip'), timeGrid = $('#timeGrid');
      const groups = { sets: 'Full sets', fills: 'Fills', natural: 'Lifts & brows' };
      Object.entries(groups).forEach(([g, label]) => {
        const h = document.createElement('p'); h.className = 'eyebrow';
        h.style.cssText = 'width:100%;margin:10px 0 2px;color:var(--muted)'; h.textContent = label;
        svcChips.appendChild(h);
        SERVICES.filter(s => s.group === g).forEach(s => {
          const c = document.createElement('button');
          c.type = 'button'; c.className = 'chip'; c.dataset.id = s.id; c.setAttribute('aria-pressed', 'false');
          c.innerHTML = `${s.name.replace(' full set', '').replace(' set', '')} <small>$${s.price}</small>`;
          c.addEventListener('click', () => selectService(s.id));
          svcChips.appendChild(c);
        });
      });
      function selectService(id) {
        state.svc = SERVICES.find(s => s.id === id) || null;
        $$('.chip', svcChips).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.id === id)));
        renderTimes(); updateSummary();
      }
      const fmtDay = d => d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      openDays.forEach((d, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'day'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', fmtDay(d));
        b.innerHTML = `<small>${d.toLocaleDateString(undefined, { weekday: 'short' })}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString(undefined, { month: 'short' })}</small>`;
        b.addEventListener('click', () => {
          state.day = i; state.time = null;
          $$('.day', dayStrip).forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
          renderTimes(); updateSummary();
        });
        dayStrip.appendChild(b);
      });
      const SLOTS = [['9:00 am'], ['10:00 am'], ['11:30 am'], ['12:30 pm'], ['1:30 pm'], ['3:00 pm'], ['4:30 pm'], ['5:30 pm']].map(x => x[0]);
      const isBooked = (di, si) => ((di * 7 + si * 3 + openDays[di].getDate()) % 5) < 2;
      function renderTimes() {
        timeGrid.innerHTML = '';
        if (state.day == null) { timeGrid.innerHTML = '<p style="grid-column:1/-1;color:var(--muted);font-size:14px">Choose a day to see open times.</p>'; return; }
        const sat = openDays[state.day].getDay() === 6;
        SLOTS.forEach((t, j) => {
          if (sat && j > 5) return;
          const c = document.createElement('button');
          c.type = 'button'; c.className = 'chip'; c.textContent = t;
          c.disabled = isBooked(state.day, j);
          if (c.disabled) c.setAttribute('aria-label', t + ', booked');
          c.setAttribute('aria-pressed', String(state.time === t));
          c.addEventListener('click', () => { state.time = t; $$('.chip', timeGrid).forEach(x => x.setAttribute('aria-pressed', String(x === c))); updateSummary(); });
          timeGrid.appendChild(c);
        });
      }
      function updateSummary() {
        $('#sumSvc').textContent = state.svc ? state.svc.name : 'Choose a service';
        $('#sumDate').textContent = state.day != null ? shortDay(openDays[state.day]) : '—';
        $('#sumTime').textContent = state.time || '—';
        $('#sumDur').textContent = state.svc ? fmtDur(state.svc.mins) : '—';
        $('#sumPrice').textContent = '$' + (state.svc ? state.svc.price : 0);
        $('#bookErr').textContent = '';
      }
      $('#bookForm').addEventListener('submit', e => {
        e.preventDefault();
        const err = $('#bookErr');
        const name = $('#fName').value.trim(), phone = $('#fPhone').value.trim(), email = $('#fEmail').value.trim();
        if (!state.svc) return err.textContent = 'Choose a service to continue.';
        if (state.day == null || !state.time) return err.textContent = 'Pick a day and an open time.';
        if (!name || !phone) return err.textContent = 'Add your name and phone so I can confirm.';
        if (!/^\S+@\S+\.\S+$/.test(email)) return err.textContent = 'That email looks incomplete. Check for the @ and domain.';
        if (!$('#fPolicy').checked) return err.textContent = 'Please agree to the booking policy to continue.';
        $('#doneText').textContent = `${name.split(' ')[0]}, your ${state.svc.name.toLowerCase()} is set for ${fmtDay(openDays[state.day])} at ${state.time}.` +
          ($('#fNew').checked ? ' I\'ll reach out to schedule your free patch test.' : '') + ' Come with clean, makeup-free eyes.';
        $('#doneRef').textContent = 'VLR-' + Math.random().toString(36).slice(2, 7).toUpperCase();
        $('#bookSteps').hidden = true; $('#bookDone').hidden = false;
        const de = $('#doneEye'); de.classList.add('draw');
        eyeSVG(de, { count: 30, len: 50, fan: 2, spread: .25, w: 1.6, stagger: .02 });
        $('#bookBtn').disabled = true; $('#bookBtn').style.opacity = .5;
        store.del('note');
        $('#bookForm').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
      $('#bookAgain').addEventListener('click', () => {
        $('#bookSteps').hidden = false; $('#bookDone').hidden = true;
        $('#bookBtn').disabled = false; $('#bookBtn').style.opacity = '';
        state.time = null; renderTimes(); updateSummary();
      });
      // Pre-select from ?service= (from Services / Gallery), else an example state
      const want = new URLSearchParams(location.search).get('service');
      const note = store.get('note'); if (note) $('#fNotes').value = note;
      selectService(SERVICES.some(s => s.id === want) ? want : 'hybrid');
      $$('.day', dayStrip)[want ? 0 : 1].click();
    },

    aftercare() {},

    contact() {
      const today = new Date().getDay();
      $$('#hours tr').forEach(tr => tr.classList.toggle('today', +tr.dataset.d === today));
      $$('.copy').forEach(b => b.addEventListener('click', async () => {
        const v = $(b.dataset.copy).textContent.trim();
        try { await navigator.clipboard.writeText(v); b.textContent = 'Copied'; }
        catch { const r = document.createRange(); r.selectNodeContents($(b.dataset.copy)); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'Selected'; }
        setTimeout(() => b.textContent = 'Copy', 1600);
      }));
      $('#contactForm').addEventListener('submit', e => {
        e.preventDefault();
        const err = $('#cErr'), name = $('#cName').value.trim(), email = $('#cEmail').value.trim(), msg = $('#cMsg').value.trim();
        if (!name) return err.textContent = 'Add your name.';
        if (!/^\S+@\S+\.\S+$/.test(email)) return err.textContent = 'That email looks incomplete. Check for the @ and domain.';
        if (msg.length < 5) return err.textContent = 'Write a short message so I know how to help.';
        $('#contactForm').hidden = true; $('#cSent').hidden = false;
        $('#cSentName').textContent = name.split(' ')[0];
      });
    },
  };
  pages[page]?.();
  reveal();

  /* ── Home #build: blank screen → site, then auto-scroll tour (for screen recording) ── */
  function buildIntro() {
    if (location.hash !== '#build' || reduce) return;
    history.replaceState(null, '', location.pathname + location.search);
    scrollTo(0, 0);
    const heroEye = $('#heroEye'); heroEye.classList.remove('draw'); heroEye.innerHTML = '';
    const ov = document.createElement('div');
    ov.className = 'intro';
    ov.innerHTML = '<div class="stage-word" id="iw"><span class="caret"></span></div><button class="skip" type="button">Skip</button>';
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    const iw = $('#iw', ov);
    let stopped = false; const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const word = (txt, cls = '') => { iw.className = 'stage-word pop ' + cls; iw.innerHTML = txt; };
    const finish = () => {
      if (stopped) return; stopped = true; timers.forEach(clearTimeout);
      ov.classList.add('out'); document.body.style.overflow = '';
      heroEye.classList.add('draw');
      eyeSVG(heroEye, { count: 44, len: 58, fan: 2, spread: .28, spikes: 5, w: 1.6, curl: .26, stagger: .014 });
      $$('.hero [style*="animation"], .hero h1 .line > span, .hero .lede, .hero .ctas, .hero .facts, .hero-art .tag')
        .forEach(el => { el.style.animationName = 'none'; void el.offsetWidth; el.style.animationName = ''; });
      setTimeout(() => ov.remove(), 1200);
      setTimeout(tour, 3200);
    };
    $('.skip', ov).addEventListener('click', finish);
    at(1400, () => word('Starting from zero.<span class="caret"></span>', 'small'));
    at(2600, () => word('Branding.'));
    at(3300, () => word('Services.'));
    at(4000, () => word('Booking.'));
    at(4700, () => word('Mobile design.'));
    at(5500, () => word('<em class="it">Velour</em>'));
    at(6500, finish);
    function tour() {
      let y = scrollY, last = performance.now(), on = true;
      const stop = () => { on = false; };
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, stop, { once: true, passive: true }));
      document.documentElement.style.scrollBehavior = 'auto';
      (function step(now) {
        if (!on) { document.documentElement.style.scrollBehavior = ''; return; }
        y += (now - last) * .22; last = now; scrollTo(0, y);
        if (y < document.documentElement.scrollHeight - innerHeight) requestAnimationFrame(step);
        else document.documentElement.style.scrollBehavior = '';
      })(last);
    }
  }
})();
