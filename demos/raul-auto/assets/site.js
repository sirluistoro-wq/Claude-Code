// Raul's Automotive — shared page behavior.
(function () {
  // Shop hours in Las Vegas time. Keys are Date.getDay() values (0 = Sunday).
  var HOURS = { 1: [8, 18], 2: [8, 18], 3: [8, 18], 4: [8, 18], 5: [8, 18], 6: [9, 15] };

  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  var links = document.getElementById('nav-links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      links.classList.toggle('open', !open);
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menuBtn.setAttribute('aria-expanded', 'false');
        links.classList.remove('open');
      }
    });
  }

  // Open / closed status, computed in Las Vegas time
  function vegasNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());
      var get = function (t) { return parts.find(function (p) { return p.type === t; }).value; };
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      return { day: day, hour: (parseInt(get('hour'), 10) % 24) + parseInt(get('minute'), 10) / 60 };
    } catch (err) {
      var d = new Date();
      return { day: d.getDay(), hour: d.getHours() + d.getMinutes() / 60 };
    }
  }
  function fmt(h) { var ampm = h >= 12 ? 'PM' : 'AM'; var hr = h % 12 || 12; return hr + ':00 ' + ampm; }

  var now = vegasNow();
  var today = HOURS[now.day];
  var isOpen = !!today && now.hour >= today[0] && now.hour < today[1];
  var statusText;
  if (isOpen) {
    statusText = 'Open now · until ' + fmt(today[1]);
  } else {
    var next = null;
    for (var i = 0; i < 7 && !next; i++) {
      var d = (now.day + i) % 7;
      var h = HOURS[d];
      if (h && (i > 0 || now.hour < h[0])) {
        var name = i === 0 ? 'today' : i === 1 ? 'tomorrow' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
        next = 'Closed · opens ' + name + ' ' + fmt(h[0]);
      }
    }
    statusText = next || 'Closed';
  }
  document.querySelectorAll('[data-status]').forEach(function (el) {
    el.textContent = statusText;
    var dot = el.parentElement && el.parentElement.querySelector('.open-dot');
    if (dot) dot.classList.toggle('is-open', isOpen);
  });
  document.querySelectorAll('.hours [data-days]').forEach(function (row) {
    if (row.getAttribute('data-days').split(',').indexOf(String(now.day)) !== -1) row.classList.add('today');
  });

  // Booking form (demo: no backend yet)
  var form = document.getElementById('book-form');
  if (form) {
    if (location.hash === '#tow') {
      var sel = document.getElementById('f-service');
      if (sel) sel.value = 'Need a tow';
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = document.getElementById('form-error');
      var missing = [];
      ['f-name', 'f-phone'].forEach(function (id) {
        var input = document.getElementById(id);
        var bad = !input.value.trim();
        input.setAttribute('aria-invalid', String(bad));
        if (bad) missing.push(input.labels[0].textContent.toLowerCase());
      });
      if (missing.length) {
        err.textContent = 'Add your ' + missing.join(' and ') + ' so the shop can confirm your appointment.';
        err.hidden = false;
        return;
      }
      err.hidden = true;
      document.getElementById('confirm').hidden = false;
    });
  }

  // Gentle reveal for content that starts below the fold; anything already on screen stays put
  var reveals = document.querySelectorAll('.reveal');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!calm && 'IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.remove('pre'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
  }

  // phone call / book bar: on the home page it waits until the hero has been scrolled past
  var callbar = document.getElementById('callbar');
  if (callbar) {
    var hero = document.querySelector('.hero3d');
    var update = function () {
      var past = hero ? window.scrollY > hero.offsetTop + hero.offsetHeight - window.innerHeight * 0.9 : window.scrollY > 120;
      callbar.classList.toggle('show', past);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
