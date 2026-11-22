/* =========================================================
   PABLO MAZZOLA · capa de tema sobre Rider7
   No modifica app.js: lee lo que Rider7 arma (portadas, vistas, libro)
   y le suma:
   - Portada con el nombre: cada sílaba (o letra, o palabra) abre una sección.
   - Intro: el nombre se escribe letra por letra, con trazo, y se va a la esquina.
   - Al pasar el mouse por una sílaba, la proyecta sobre una pantalla.
   - Transición de iris con cartel al entrar a una sección.
   - En cada sección: texto.txt (texto con formato simple) y video de info.txt.
   Las secciones son las carpetas de contenido/, en orden.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = matchMedia('(hover: hover)').matches;
  var INTRO_KEY = 'pm-intro-visto';

  var cfg = {};
  var sections = [];       // { href, title, img, desc } en el orden de las carpetas
  var parts = [];          // un enlace por parte del nombre (HTML o SVG)
  var landingOn = false;
  var hot = -1;            // parte señalada con el mouse o el foco
  var lit = -1;            // parte que está proyectando
  var tourTimer = null, tourIdx = -1;
  var introRunning = false;
  var nameFont = 'PM Hurricane';
  var writeTime = 0;       // duración de la escritura (segundos), si el nombre es SVG

  /* ---------- Utilidades ---------- */

  function parseTxt(text) {
    var out = {};
    String(text || '').replace(/^﻿/, '').split(/\r?\n/).forEach(function (line) {
      var t = line.trim();
      if (!t || t.charAt(0) === '#') return;
      var i = t.indexOf(':');
      if (i < 1) return;
      out[t.slice(0, i).trim().toLowerCase().replace(/\s+/g, '_')] = t.slice(i + 1).trim().replace(/\s+#\s.*$/, '').trim();
    });
    return out;
  }
  function yes(v, d) { if (v == null || v === '') return d; return /^(s[ií]|yes|true|1|on)$/i.test(String(v).trim()); }
  function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return n < 9 ? '0' + (n + 1) : String(n + 1); }
  function normName(s) { return String(s || '').trim().replace(/\s+/g, ' '); }
  // Trae un archivo de texto. Si el hosting devuelve la página principal en lugar del archivo, lo descarta
  var textCache = {};
  function getText(url) {
    if (!textCache[url]) {
      textCache[url] = fetch(url, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) return '';
        return r.text().then(function (t) { return /<html|<!doctype/i.test(t.slice(0, 400)) ? '' : t; });
      }).catch(function () { return ''; });
    }
    return textCache[url];
  }
  function isRoot() {
    var q = new URLSearchParams(location.search);
    return !q.has('ver') && !q.has('sitemap') && !/^#\//.test(location.hash);
  }
  function svg(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  /* ---------- Portada: armado ---------- */

  var landing = document.createElement('div');
  landing.className = 'pm-landing';
  landing.innerHTML =
    '<div class="pm-bg" aria-hidden="true"></div>' +
    '<div class="pm-preview" aria-hidden="true"><img alt=""><img alt=""></div>' +
    '<div class="pm-beam" aria-hidden="true"><div class="pm-beam-in"></div></div>' +
    '<figure class="pm-screen" aria-hidden="true"><img alt=""><img alt=""><figcaption class="pm-screen-cap"></figcaption></figure>' +
    '<div class="pm-grain" aria-hidden="true"></div>' +
    '<div class="pm-corner">' +
      '<div class="pm-label" aria-hidden="true"><span class="pm-label-n"></span><span class="pm-label-t"></span></div>' +
      '<nav class="pm-name" aria-label="Secciones"></nav>' +
      '<div class="pm-hint" aria-hidden="true"></div>' +
    '</div>';
  document.body.appendChild(landing);

  var iris = document.createElement('div');
  iris.className = 'pm-iris';
  iris.setAttribute('aria-hidden', 'true');
  iris.innerHTML = '<img alt=""><div class="pm-iris-t"><small></small><span></span></div>';
  document.body.appendChild(iris);

  var nameEl = $('.pm-name', landing);
  var labelN = $('.pm-label-n', landing), labelT = $('.pm-label-t', landing), labelEl = $('.pm-label', landing);
  var hintEl = $('.pm-hint', landing);
  var prevImgs = $$('.pm-preview img', landing);
  var screenEl = $('.pm-screen', landing), screenImgs = $$('.pm-screen img', landing);
  var screenCap = $('.pm-screen-cap', landing);
  var beamIn = $('.pm-beam-in', landing), beamEl = $('.pm-beam', landing);

  // Si se entra por la portada, se tapa desde el primer momento (sin parpadeo del cargador)
  if (isRoot()) setLanding(true);

  // Nombre con la tipografía (texto común). Se usa si no hay trazos generados para este nombre.
  function buildNameText(text) {
    nameEl.innerHTML = '';
    nameEl.classList.remove('is-svg');
    parts = [];
    var words = normName(text).split(' ').filter(Boolean);
    words.forEach(function (w, wi) {
      var ws = document.createElement('span');
      ws.className = 'pm-word';
      w.split('|').filter(Boolean).forEach(function (p) {
        var a = document.createElement('a');
        a.className = 'pm-part is-idle';
        a.textContent = p;
        addPart(a);
        ws.appendChild(a);
      });
      nameEl.appendChild(ws);
      if (wi < words.length - 1) nameEl.appendChild(document.createTextNode(' '));
    });
    writeTime = 0;
    linkParts();
  }

  // Nombre dibujado con trazos (assets/nombre.json): permite escribirlo letra por letra
  function buildNameSVG(data) {
    nameEl.innerHTML = '';
    nameEl.classList.add('is-svg');
    parts = [];
    var upm = data.upm, g = 0, step = 0.15, start = 0.25;
    data.palabras.forEach(function (w, wi) {
      var ws = document.createElement('span');
      ws.className = 'pm-word';
      var s = svg('svg', {
        viewBox: w.x + ' ' + data.y + ' ' + w.ancho + ' ' + data.alto,
        class: 'pm-svgw', focusable: 'false'
      });
      s.style.width = (w.ancho / upm) + 'em';
      s.style.height = (data.alto / upm) + 'em';
      w.partes.forEach(function (p) {
        var a = svg('a', { class: 'pm-part is-idle' });
        a.appendChild(svg('rect', { class: 'pm-hit', x: p.x0, y: data.y, width: Math.max(1, p.x1 - p.x0), height: data.alto }));
        p.glifos.forEach(function (d) {
          var path = svg('path', { d: d, class: 'pm-g', pathLength: '1' });
          path.style.setProperty('--d', (start + g * step).toFixed(2) + 's');
          g++;
          a.appendChild(path);
        });
        addPart(a);
        s.appendChild(a);
      });
      ws.appendChild(s);
      nameEl.appendChild(ws);
      if (wi < data.palabras.length - 1) nameEl.appendChild(document.createTextNode(' '));
    });
    writeTime = start + Math.max(0, g - 1) * step + 0.95;
    linkParts();
  }

  function addPart(a) {
    a.dataset.i = parts.length;
    bindPart(a);
    parts.push(a);
  }

  function linkParts() {
    parts.forEach(function (a, i) {
      var s = sections[i];
      a.classList.toggle('is-idle', !s);
      if (s) {
        a.setAttribute('href', s.href);
        a.setAttribute('aria-label', s.title);
        a.setAttribute('role', 'link');
      } else {
        a.removeAttribute('href');
        a.removeAttribute('aria-label');
      }
    });
    if (landingOn && !introRunning) startTour();
  }

  // Lee las portadas que arma Rider7 en el inicio: son las secciones, en orden
  function readCovers() {
    var list = $$('.covers > a.cover').map(function (a) {
      var img = $('.cover-book img', a);
      var h2 = $('h2', a), p = $('.cover-info p', a);
      return {
        href: a.getAttribute('href'),
        title: h2 ? h2.textContent.trim() : '',
        img: img ? img.getAttribute('src') : '',
        desc: p ? p.textContent.trim() : ''
      };
    });
    if (!list.length) return;
    var same = list.length === sections.length && list.every(function (s, i) { return s.href === sections[i].href; });
    sections = list;
    if (!same) linkParts();
  }

  /* ---------- Portada: interacción ---------- */

  function bindPart(a) {
    var i = function () { return +a.dataset.i; };
    a.addEventListener('mouseenter', function () { setHot(i(), true); });
    a.addEventListener('mouseleave', function () { setHot(-1); });
    a.addEventListener('focus', function () { setHot(i(), true); });
    a.addEventListener('blur', function () { setHot(-1); });
    a.addEventListener('click', function (e) {
      if (!a.getAttribute('href')) { e.preventDefault(); return; }
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); // Rider7 no procesa el enlace: lo abre la transición
      openSection(i(), e);
    });
  }

  function setHot(i, project) {
    if (introRunning) return;
    if (i >= 0 && !sections[i]) i = -1;
    hot = i;
    if (i >= 0) { stopTour(); markPart(i, 'pm-hot', project && canHover); hideHint(); }
    else { markPart(-1, 'pm-hot'); if (landingOn) startTour(1200); }
  }

  // Resalta una parte y muestra su etiqueta. Con el mouse encima, además la proyecta.
  function markPart(i, cls, project) {
    parts.forEach(function (a, k) {
      a.classList.toggle(cls, k === i);
      a.classList.remove(cls === 'pm-hot' ? 'pm-tour' : 'pm-hot');
    });
    nameEl.classList.toggle('has-hot', cls === 'pm-hot' && i >= 0);
    var s = sections[i];
    if (!s) {
      labelEl.classList.remove('on');
      swap(prevImgs, 'prev', '');
      project = false;
    } else {
      labelN.textContent = pad(i);
      labelT.textContent = s.title;
      labelEl.classList.add('on');
      swap(prevImgs, 'prev', s.img);
    }
    project = project && yes(cfg.proyector, true);
    lit = project ? i : -1;
    if (project) {
      screenCap.textContent = s.title;
      swap(screenImgs, 'screen', s.img);
      screenEl.classList.add('on');
      aimBeam();
      beamEl.classList.add('on');
    } else {
      screenEl.classList.remove('on');
      beamEl.classList.remove('on');
    }
  }

  // Fundido entre dos imágenes apiladas (fondo desenfocado y pantalla)
  var fronts = { prev: 0, screen: 0 };
  function swap(imgs, key, src) {
    if (!src) { imgs.forEach(function (im) { im.classList.remove('on'); }); return; }
    var front = imgs[fronts[key]];
    if (front.getAttribute('src') === src && front.classList.contains('on')) return;
    fronts[key] = 1 - fronts[key];
    var next = imgs[fronts[key]], old = imgs[1 - fronts[key]];
    var show = function () { next.classList.add('on'); old.classList.remove('on'); };
    next.onload = show;
    if (next.getAttribute('src') === src && next.complete) show();
    else next.src = src;
  }

  /* El haz de luz: sale de la sílaba y abre hacia las cuatro esquinas de la pantalla */
  function aimBeam() {
    if (lit < 0 || !parts[lit]) return;
    var pr = parts[lit].getBoundingClientRect(), sr = screenEl.getBoundingClientRect();
    if (!sr.width) return;
    var P = [pr.left + pr.width / 2, pr.top + pr.height * .35];
    var pts = [P, [sr.left, sr.top], [sr.right, sr.top], [sr.right, sr.bottom], [sr.left, sr.bottom]];
    var hull = convexHull(pts).map(function (p) { return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px'; });
    beamIn.style.clipPath = 'polygon(' + hull.join(',') + ')';
    beamIn.style.setProperty('--bx', P[0] + 'px');
    beamIn.style.setProperty('--by', P[1] + 'px');
  }
  function convexHull(pts) {
    pts = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var cross = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); };
    var lo = [], up = [];
    pts.forEach(function (p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
    pts.slice().reverse().forEach(function (p) { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); });
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  window.addEventListener('resize', function () { if (landingOn) aimBeam(); });

  // Recorrido: si nadie toca nada, el nombre va señalando sus secciones de a una (sin proyectar)
  function startTour(delay) {
    stopTour();
    if (reduce || !yes(cfg.recorrido, true) || !sections.length || !parts.length) return;
    var n = Math.min(sections.length, parts.length);
    tourTimer = setTimeout(function step() {
      if (!landingOn || hot >= 0) return;
      tourIdx = (tourIdx + 1) % n;
      markPart(tourIdx, 'pm-tour', false);
      tourTimer = setTimeout(step, 3400);
    }, delay == null ? 1500 : delay);
  }
  function stopTour() {
    clearTimeout(tourTimer);
    tourTimer = null;
    parts.forEach(function (a) { a.classList.remove('pm-tour'); });
  }
  function hideHint() { hintEl.classList.add('gone'); }

  /* ---------- Transición de iris y navegación ---------- */

  function navigate(href) {
    history.pushState(null, '', href);
    window.dispatchEvent(new PopStateEvent('popstate')); // Rider7 escucha popstate y arma la vista
  }

  function openSection(i, e) {
    var s = sections[i];
    if (!s) return;
    stopTour();
    if (reduce) return navigate(s.href);
    var r = parts[i].getBoundingClientRect();
    var x = e && e.clientX ? e.clientX : r.left + r.width / 2;
    var y = e && e.clientY ? e.clientY : r.top + r.height / 2;
    iris.style.setProperty('--x', x + 'px');
    iris.style.setProperty('--y', y + 'px');
    $('img', iris).src = s.img;
    $('.pm-iris-t small', iris).textContent = pad(i);
    $('.pm-iris-t span', iris).textContent = s.title;
    iris.className = 'pm-iris';
    void iris.offsetWidth;
    iris.classList.add('open');
    // Cartel con el nombre de la sección, y después se abre la sección
    setTimeout(function () {
      navigate(s.href);
      setTimeout(function () { iris.classList.add('fade'); }, 900);
      setTimeout(function () { iris.className = 'pm-iris'; }, 1800);
    }, 760);
  }

  /* ---------- Mostrar u ocultar la portada ---------- */

  function setLanding(on) {
    if (on === landingOn) return;
    landingOn = on;
    document.body.classList.toggle('pm-home', on);
    landing.classList.toggle('is-on', on);
    if (on) {
      window.scrollTo(0, 0);
      hot = -1;
      markPart(-1, 'pm-hot');
      if (!introRunning) startTour(1500);
    } else {
      stopTour();
    }
  }

  function sync() {
    var msg = $('.view-msg'), book = $('.view-book'), home = $('.view-home');
    var group = $('.intro').classList.contains('is-group');
    var msgErr = !msg.hidden && !$('.msg .spinner');
    setLanding(isRoot() && book.hidden && !msgErr && !group);
    if (!home.hidden && !group) readCovers();
    if (!book.hidden) bookExtras();
  }
  var syncQueued = false;
  function queueSync() {
    if (syncQueued) return;
    syncQueued = true;
    Promise.resolve().then(function () { syncQueued = false; sync(); });
  }
  var mo = new MutationObserver(queueSync);
  $$('.view').forEach(function (v) { mo.observe(v, { attributes: true, attributeFilter: ['hidden'] }); });
  mo.observe($('.intro'), { attributes: true, attributeFilter: ['class'] });
  mo.observe($('.covers'), { childList: true });
  mo.observe($('.bg-blur img'), { attributes: true, attributeFilter: ['src'] });
  window.addEventListener('popstate', queueSync);

  /* ---------- Intro: el nombre se escribe y se va a la esquina ---------- */

  function finalizeIntro() {
    introRunning = false;
    landing.classList.remove('pm-intro', 'pm-writing', 'pm-moving');
    nameEl.style.transform = '';
    nameEl.style.transition = '';
    landing.classList.add('pm-ready');
    if (landingOn) startTour(1400);
  }

  function playIntro() {
    introRunning = true;
    landing.classList.add('pm-intro');
    var timers = [];
    var skip = function () { if (introRunning) { timers.forEach(clearTimeout); finalizeIntro(); } };
    ['pointerdown', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, function f() { skip(); window.removeEventListener(ev, f); });
    });

    var fontReady = document.fonts && document.fonts.load ? document.fonts.load('1em "' + nameFont + '"') : Promise.resolve();
    var minWait = new Promise(function (r) { setTimeout(r, 500); });
    var maxWait = new Promise(function (r) { setTimeout(r, 3000); });
    Promise.race([Promise.all([fontReady, minWait]), maxWait]).then(function () {
      if (!introRunning) return;
      // El nombre ya está en su lugar final (esquina). Se lo lleva al centro, grande, y desde ahí vuelve.
      var r = nameEl.getBoundingClientRect();
      var vw = window.innerWidth, vh = window.innerHeight;
      var s = Math.max(1, Math.min((vw * 0.8) / r.width, (vh * 0.42) / r.height));
      var dx = vw / 2 - (r.left + r.width / 2);
      var dy = vh / 2 - (r.top + r.height / 2);
      nameEl.style.transition = 'none';
      nameEl.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
      void nameEl.offsetWidth;
      landing.classList.add('pm-writing');
      var write = (writeTime || 2) * 1000;
      timers.push(setTimeout(function () {
        landing.classList.add('pm-moving');
        nameEl.style.transition = '';
        nameEl.style.transform = '';
      }, write + 600));
      timers.push(setTimeout(finalizeIntro, write + 1900));
    });
  }

  /* ---------- Secciones: texto y video ---------- */

  var extra = document.createElement('section');
  extra.className = 'pm-extra';
  extra.id = 'texto';
  extra.hidden = true;
  $('.view-book').appendChild(extra);

  var moreBtn = document.createElement('button');
  moreBtn.className = 'btn-ghost pm-more';
  moreBtn.type = 'button';
  moreBtn.hidden = true;
  moreBtn.setAttribute('aria-label', 'Ir al texto');
  moreBtn.title = 'Texto';
  moreBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9"/></svg>';
  moreBtn.addEventListener('click', function () { extra.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  var tools = $('.book-tools');
  if (tools) tools.insertBefore(moreBtn, tools.firstChild);

  var currentFolder = null;
  function bookExtras() {
    var src = $('.bg-blur img').getAttribute('src') || '';
    var folder = '';
    try {
      var u = new URL(src, location.href);
      if (u.origin === location.origin) folder = src.slice(0, src.lastIndexOf('/') + 1);
    } catch (e) {}
    if (folder === currentFolder) return;
    currentFolder = folder;
    extra.hidden = true;
    moreBtn.hidden = true;
    extra.innerHTML = '';
    if (!folder) return;
    Promise.all([getText(folder + 'info.txt'), getText(folder + 'texto.txt')]).then(function (r) {
      if (folder !== currentFolder) return;
      var info = parseTxt(r[0]);
      var html = videoHTML(info.video) + (r[1].trim() ? '<div class="pm-text">' + textHTML(r[1]) + '</div>' : '');
      if (!html) return;
      extra.innerHTML = html;
      extra.hidden = false;
      moreBtn.hidden = false;
    });
  }

  function videoHTML(url) {
    url = String(url || '').trim();
    if (!url) return '';
    var m, src = '';
    if ((m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/))) {
      src = 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0';
    } else if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
      src = 'https://player.vimeo.com/video/' + m[1] + '?dnt=1';
    }
    if (!src) return '';
    return '<div class="pm-video"><iframe src="' + esc(src) + '" title="Video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe></div>';
  }

  // Formato de texto.txt:
  //   # Título        ## Subtítulo
  //   - ítem de lista
  //   **negrita**  *cursiva*   (los enlaces y correos se detectan solos)
  //   Una línea en blanco separa párrafos
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
      .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|[\s(])([\w.+-]+@[\w-]+\.[\w.-]*\w)/g, '$1<a href="mailto:$2">$2</a>');
  }
  function textHTML(t) {
    var out = [];
    String(t).replace(/^﻿/, '').replace(/\r/g, '').split(/\n\s*\n/).forEach(function (block) {
      var lines = block.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) return;
      if (/^##\s+/.test(lines[0])) { out.push('<h3>' + inline(lines.shift().replace(/^##\s+/, '')) + '</h3>'); }
      else if (/^#\s+/.test(lines[0])) { out.push('<h2>' + inline(lines.shift().replace(/^#\s+/, '')) + '</h2>'); }
      if (!lines.length) return;
      if (lines.every(function (l) { return /^[-*•]\s+/.test(l); })) {
        out.push('<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^[-*•]\s+/, '')) + '</li>'; }).join('') + '</ul>');
      } else {
        out.push('<p>' + lines.map(inline).join('<br>') + '</p>');
      }
    });
    return out.join('');
  }

  /* ---------- Arranque ---------- */

  var cfgReady = getText('config.txt').then(function (t) {
    cfg = parseTxt(t);
    var root = document.documentElement.style;
    var nombre = normName(cfg.nombre || cfg.titulo || document.title);

    // Tipografía del nombre: Hurricane viene incluida; cualquier otra se pide a Google Fonts
    var fn = String(cfg.fuente_nombre || '').trim();
    var isHurricane = !fn || /^hurricane$/i.test(fn);
    if (!isHurricane) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=' + fn.replace(/\s+/g, '+') + '&display=swap';
      document.head.appendChild(link);
      nameFont = fn;
      root.setProperty('--pm-name-font', '"' + fn + '"');
    }
    root.setProperty('--pm-name-scale', String(Math.min(3, Math.max(.3, num(cfg.nombre_tamano, 100) / 100))));

    // Ciclo de colores del fondo
    var cols = String(cfg.fondo_colores || '').split(',').map(function (c) { return c.trim(); }).filter(Boolean);
    if (cols.length > 1) {
      var kf = cols.map(function (c, i) { return (i / (cols.length - 1) * 100).toFixed(2) + '%{background-color:' + c + '}'; }).join('');
      var st = document.createElement('style');
      st.textContent = '@keyframes pmCycle{' + kf + '}';
      document.head.appendChild(st);
      root.setProperty('--pm-cycle', Math.max(4, num(cfg.fondo_ciclo, 40)) + 's');
      landing.classList.add('has-cycle');
    } else if (cols.length) {
      root.setProperty('--pm-bg', cols[0]);
    }
    if (!yes(cfg.grano, true)) document.body.classList.add('pm-no-grain');
    var hint = cfg.nombre_pista == null ? '' : cfg.nombre_pista;
    hintEl.textContent = hint;
    if (!hint) hideHint();

    // Trazos del nombre: solo si fueron generados para este mismo nombre y con Hurricane
    var trazos = isHurricane ? fetch('assets/nombre.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null);
    return trazos.then(function (data) {
      if (data && normName(data.texto) === nombre && data.palabras) buildNameSVG(data);
      else buildNameText(nombre);
      queueSync();
    });
  });

  var seen = false;
  try { seen = sessionStorage.getItem(INTRO_KEY) === '1'; sessionStorage.setItem(INTRO_KEY, '1'); } catch (e) {}
  cfgReady.then(function () {
    if (landingOn && !reduce && !seen && yes(cfg.intro, true)) playIntro();
    else landing.classList.add('pm-ready');
  });
  queueSync();
})();
