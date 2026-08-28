/* ==========================================================================
   AM SERVICE — behaviour
   No dependencies. Everything degrades gracefully without JS
   (the page ships with the Armenian copy already in the HTML).
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     CONFIG — edit these four values if the contacts ever change.
     Phone numbers also appear in index.html (tel: links) and README.md.
  --------------------------------------------------------------------- */
  var CONFIG = {
    whatsapp: '37494209799',                                  // digits only, country code first
    instagram: 'https://www.instagram.com/am.servicee/',
    defaultLang: 'hy',
    supported: ['hy', 'ru', 'en']
  };

  var doc = document;
  var root = doc.documentElement;
  var $  = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =====================================================================
     1. i18n
  ===================================================================== */
  var DICT = window.I18N || {};

  function pickLang() {
    var url = new URLSearchParams(location.search).get('lang');
    if (url && CONFIG.supported.indexOf(url) > -1) return url;

    var saved;
    try { saved = localStorage.getItem('am-lang'); } catch (e) { /* private mode */ }
    if (saved && CONFIG.supported.indexOf(saved) > -1) return saved;

    var nav = (navigator.language || '').slice(0, 2).toLowerCase();
    if (CONFIG.supported.indexOf(nav) > -1) return nav;
    if (nav === 'be' || nav === 'uk' || nav === 'kk') return 'ru';

    return CONFIG.defaultLang;
  }

  function setMeta(kind, name, value) {
    if (!value) return;
    var el = doc.head.querySelector('meta[' + kind + '="' + name + '"]');
    if (el) el.setAttribute('content', value);
  }

  function applyLang(lang) {
    var d = DICT[lang] || DICT[CONFIG.defaultLang] || {};

    root.setAttribute('lang', lang);
    root.setAttribute('data-lang', lang);

    $$('[data-i18n]').forEach(function (el) {
      var v = d[el.getAttribute('data-i18n')];
      if (v != null) el.textContent = v;
    });

    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var bits = pair.split(':');
        var attr = (bits[0] || '').trim();
        var v = d[(bits[1] || '').trim()];
        if (attr && v != null) el.setAttribute(attr, v);
      });
    });

    if (d['meta.title']) doc.title = d['meta.title'];
    setMeta('name', 'description', d['meta.description']);
    setMeta('property', 'og:title', d['meta.title']);
    setMeta('property', 'og:description', d['meta.description']);
    setMeta('name', 'twitter:title', d['meta.title']);
    setMeta('name', 'twitter:description', d['meta.description']);
    setMeta('property', 'og:locale', lang === 'ru' ? 'ru_RU' : lang === 'en' ? 'en_US' : 'hy_AM');

    // reflect state in the switcher
    var codes = { hy: 'ՀԱՅ', ru: 'РУС', en: 'ENG' };
    var cur = $('.lang__cur');
    if (cur) cur.textContent = codes[lang] || codes.hy;
    $$('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-current', String(b.getAttribute('data-set-lang') === lang));
    });

    try { localStorage.setItem('am-lang', lang); } catch (e) { /* ignore */ }

    // keep ?lang= in the address bar in sync, without adding history entries
    // (throws on file:// — harmless, the page works either way)
    try {
      var u = new URL(location.href);
      if (u.searchParams.get('lang') !== lang) {
        u.searchParams.set('lang', lang);
        history.replaceState(null, '', u);
      }
    } catch (e) { /* file:// or blocked history API */ }
  }

  applyLang(pickLang());

  /* =====================================================================
     2. Canonical / OG urls — if the site is served from somewhere other than
        the address baked into the HTML (a custom domain, say), re-point them.
  ===================================================================== */
  (function fixUrls() {
    if (location.protocol.indexOf('http') !== 0) return;   // opened from disk
    var BAKED = 'https://arman712.github.io/amservice/';   // what the HTML ships with
    var here = location.origin + location.pathname.replace(/index\.html$/, '');
    if (here === BAKED) return;
    $$('link[rel="canonical"], link[rel="alternate"]').forEach(function (l) {
      if (l.href.indexOf(BAKED) === 0) l.href = l.href.replace(BAKED, here);
    });
    $$('meta[property^="og:"], meta[name^="twitter:"]').forEach(function (m) {
      var c = m.getAttribute('content') || '';
      if (c.indexOf(BAKED) === 0) m.setAttribute('content', c.replace(BAKED, here));
    });
  })();

  /* =====================================================================
     3. Header: scrolled state + back-to-top
  ===================================================================== */
  var header = $('#header');
  var toTop = $('#totop');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (toTop) toTop.classList.toggle('is-visible', y > 700);
    spy(y);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* =====================================================================
     4. Scroll-spy for the desktop nav
  ===================================================================== */
  var navLinks = $$('.nav__link');
  var targets = navLinks
    .map(function (a) { return { link: a, el: doc.getElementById(a.getAttribute('href').slice(1)) }; })
    .filter(function (t) { return t.el; });

  function spy(y) {
    if (!targets.length) return;
    var offset = y + (parseInt(getComputedStyle(root).getPropertyValue('--header-h'), 10) || 74) + 40;
    var active = null;
    targets.forEach(function (t) { if (t.el.offsetTop <= offset) active = t; });
    navLinks.forEach(function (a) { a.classList.remove('is-active'); });
    if (active) active.link.classList.add('is-active');
  }

  /* =====================================================================
     5. Language dropdown
  ===================================================================== */
  var lang = $('#lang');
  if (lang) {
    var langBtn = $('.lang__btn', lang);

    var closeLang = function () {
      lang.classList.remove('is-open');
      langBtn.setAttribute('aria-expanded', 'false');
    };

    langBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !lang.classList.contains('is-open');
      lang.classList.toggle('is-open', open);
      langBtn.setAttribute('aria-expanded', String(open));
    });

    $$('[data-set-lang]', lang).forEach(function (b) {
      b.addEventListener('click', function () {
        applyLang(b.getAttribute('data-set-lang'));
        closeLang();
      });
    });

    doc.addEventListener('click', function (e) { if (!lang.contains(e.target)) closeLang(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLang(); });
  }

  /* =====================================================================
     6. Mobile drawer
  ===================================================================== */
  var burger = $('#burger');
  var drawer = $('#mobile-menu');

  function setDrawer(open) {
    if (!drawer || !burger) return;
    burger.setAttribute('aria-expanded', String(open));
    doc.body.classList.toggle('is-locked', open);

    // keep the page behind the drawer out of the tab order
    ['main', '.footer', '.callbar'].forEach(function (sel) {
      var el = $(sel);
      if (el) el.inert = open;
    });
    if (open) {
      drawer.hidden = false;
      requestAnimationFrame(function () { drawer.classList.add('is-open'); });
    } else {
      drawer.classList.remove('is-open');
      window.setTimeout(function () { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 320);
    }
  }

  if (burger) burger.addEventListener('click', function () {
    setDrawer(burger.getAttribute('aria-expanded') !== 'true');
  });
  if (drawer) $$('a', drawer).forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1023 && burger && burger.getAttribute('aria-expanded') === 'true') setDrawer(false);
  });

  /* =====================================================================
     7. Price tabs
  ===================================================================== */
  var tabs = $$('.tab');
  if (tabs.length) {
    var selectTab = function (tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = doc.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(t); });
      t.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        selectTab(next);
        next.focus();
      });
    });
  }

  /* =====================================================================
     8. FAQ accordion (one open at a time)
  ===================================================================== */
  $$('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.acc__item');
      var open = btn.getAttribute('aria-expanded') === 'true';
      $$('.acc__item').forEach(function (it) {
        it.classList.remove('is-open');
        var b = $('.acc__btn', it);
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* =====================================================================
     9. Reveal on scroll (staggered per group)
  ===================================================================== */
  var revealables = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    revealables.forEach(function (el) {
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) {
        return c.classList && c.classList.contains('reveal');
      });
      var i = sibs.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* =====================================================================
     10. Brand marquee — duplicate the track for a seamless loop
  ===================================================================== */
  var track = $('.marquee__track');
  if (track && !reduceMotion) {
    var clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(clone.children, function (li) { track.appendChild(li); });
  }

  /* =====================================================================
     11. Animated counters
  ===================================================================== */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        cio.unobserve(el);
        var raw = el.getAttribute('data-count');
        var target = parseFloat(raw);
        var decimals = (raw.split('.')[1] || '').length;
        var suffix = el.getAttribute('data-suffix') || '';
        var start = performance.now();
        var dur = 1300;
        (function step(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* =====================================================================
     12. Contact form → prefilled WhatsApp message
  ===================================================================== */
  var form = $('#cform');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('#cform-err');
      var d = DICT[root.getAttribute('lang')] || DICT[CONFIG.defaultLang] || {};
      var val = function (n) { var f = form.elements[n]; return f ? f.value.trim() : ''; };

      var name = val('name'), phone = val('phone');
      if (!name || !phone) {
        if (err) err.hidden = false;
        (form.elements[name ? 'phone' : 'name'] || {}).focus && form.elements[name ? 'phone' : 'name'].focus();
        return;
      }
      if (err) err.hidden = true;

      var lines = [
        d['contact.form.name'] + ': ' + name,
        d['contact.form.phone'] + ': ' + phone
      ];
      if (val('device')) lines.push(d['contact.form.device'] + ': ' + val('device'));
      if (val('message')) lines.push(d['contact.form.msg'] + ': ' + val('message'));

      window.open(
        'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(lines.join('\n')),
        '_blank',
        'noopener'
      );
    });

    ['name', 'phone'].forEach(function (n) {
      var f = form.elements[n];
      if (f) f.addEventListener('input', function () {
        var err = $('#cform-err');
        if (err) err.hidden = true;
      });
    });
  }

  /* =====================================================================
     13. Footer year
  ===================================================================== */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* =====================================================================
     14. Subtle parallax on the hero glows (pointer devices only)
  ===================================================================== */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (min-width: 1080px)').matches) {
    var glows = $$('.bg-fx__glow');
    var rx = 0, ry = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener('pointermove', function (e) {
      rx = (e.clientX / window.innerWidth - 0.5) * 34;
      ry = (e.clientY / window.innerHeight - 0.5) * 26;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    function loop() {
      cx += (rx - cx) * 0.06;
      cy += (ry - cy) * 0.06;
      glows.forEach(function (g, i) {
        var k = i ? -1 : 1;
        g.style.transform = 'translate3d(' + (cx * k) + 'px,' + (cy * k) + 'px,0)';
      });
      raf = Math.abs(rx - cx) > 0.1 || Math.abs(ry - cy) > 0.1 ? requestAnimationFrame(loop) : null;
    }
  }

  onScroll();
})();
