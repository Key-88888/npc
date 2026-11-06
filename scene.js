/* «Не По Сценарию» · сцена из слоёв в стиле Supercell (перенос w0-08 из look/brawl/js/stage.js + kit.js).
   Слои: фон-картинка → луч → пыль (canvas) → Тимур (картинка позы) → вага и нити (SVG). Экземпляров два: «a» — шаг 1 (с нитями), «c» — финал (без нитей).
   ВСЁ, что меняется при замене картинок, — в блоке NPC_STAGE ниже (src поз, точки нитей, размеры). Для curious и away точки пока как у honest: ведущий поправит. */
window.NPC_STAGE = {
  bg: 'art/corridor.webp',
  parallax: { bg: 7, char: 4 },
  aspect: 733 / 1100,
  /* где стоит Тимур: доли игровой зоны (cx — центр, feet — линия ног, h — высота) */
  box: { phone: { cx: 0.27, feet: 1.0, h: 0.92 }, wide: { cx: 0.5, feet: 0.98, h: 0.9 } },
  poses: {
    idle:      { src: 'art/timur-idle.webp',      attach: { head: [0.50, 0.02],   lsh: [0.33, 0.36],   rsh: [0.68, 0.36],   lhand: [0.298, 0.38],  rhand: [0.684, 0.553] } },
    flattered: { src: 'art/timur-flattered.webp', attach: { head: [0.37, 0.03],   lsh: [0.29, 0.345],  rsh: [0.64, 0.27],   lhand: [0.26, 0.568],  rhand: [0.754, 0.114] } },
    crowd:     { src: 'art/timur-crowd.webp',     attach: { head: [0.42, 0.03],   lsh: [0.266, 0.273], rsh: [0.69, 0.264],  lhand: [0.407, 0.40],  rhand: [0.573, 0.398] } },
    hurry:     { src: 'art/timur-hurry.webp',     attach: { head: [0.545, 0.03],  lsh: [0.26, 0.236],  rsh: [0.61, 0.38],   lhand: [0.143, 0.15],  rhand: [0.748, 0.486] } },
    honest:    { src: 'art/timur-honest.webp',    attach: { head: [0.478, 0.02],  lsh: [0.334, 0.345], rsh: [0.68, 0.345],  lhand: [0.307, 0.56],  rhand: [0.63, 0.48] } },
    go:        { src: 'art/timur-go.webp',        attach: { head: [0.484, 0.023], lsh: [0.34, 0.32],   rsh: [0.71, 0.345],  lhand: [0.348, 0.436], rhand: [0.78, 0.336] } },
    curious:   { src: 'art/timur-curious.webp',   fallback: 'honest', attach: { head: [0.478, 0.02], lsh: [0.334, 0.345], rsh: [0.68, 0.345], lhand: [0.307, 0.56], rhand: [0.63, 0.48] } },
    away:      { src: 'art/timur-away.webp',      fallback: 'honest', attach: { head: [0.478, 0.02], lsh: [0.334, 0.345], rsh: [0.68, 0.345], lhand: [0.307, 0.56], rhand: [0.63, 0.48] } }
  },
  /* вага: зазор до макушки в долях высоты позы, ширина в долях ширины позы */
  bar: { gap: 0.17, gapPhone: 0.05, width: 1.1 }
};

(function () {
  'use strict';
  var C = window.NPC_STAGE, NS = 'http://www.w3.org/2000/svg';
  var NAMES = ['head', 'lsh', 'rsh', 'lhand', 'rhand'];
  var HOOK = { lhand: 0, lsh: 0.28, head: 0.5, rsh: 0.72, rhand: 1 };
  var INK = '#0b1633';
  var REDUCED = false;
  try { REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { /* без media */ }

  /* ---------- общее: пружина, взгляд, пыль, искры, дуга ---------- */
  var K = window.NPCK = { REDUCED: REDUCED };
  K.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  K.Spring = function (x, k, c) { this.x = x; this.t = x; this.v = 0; this.k = k || 120; this.c = c || 12; };
  K.Spring.prototype.step = function (dt) {
    var n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
    for (var i = 0; i < n; i++) { this.v += ((this.t - this.x) * this.k - this.v * this.c) * h; this.x += this.v * h; }
    return this.x;
  };
  K.Spring.prototype.kick = function (v) { this.v += v; };

  K.look = { x: 0, y: 0, tx: 0, ty: 0, src: 'auto' };
  var lookInit = false;
  K.initLook = function () {
    if (lookInit || REDUCED) return; lookInit = true;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      K.look.src = 'mouse'; K.look.tx = (e.clientX / innerWidth - 0.5) * 2; K.look.ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
    /* наклон Android без запроса разрешения; на iPhone requestPermission не вызывается — сцена плывёт сама */
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', function (e) {
        if (e.gamma == null) return;
        K.look.src = 'tilt'; K.look.tx = K.clamp(e.gamma / 25, -1, 1); K.look.ty = K.clamp((e.beta - 45) / 30, -1, 1);
      }, { passive: true });
    }
  };
  K.stepLook = function (t, dt) {
    var L = K.look;
    if (REDUCED) { L.x = L.y = 0; return; }
    if (L.src === 'auto') { L.tx = Math.sin(t * 0.23) * 0.55; L.ty = Math.sin(t * 0.17 + 1) * 0.35; }
    var k = 1 - Math.exp(-dt * 2.2); L.x += (L.tx - L.x) * k; L.y += (L.ty - L.y) * k;
  };

  /* пыль в луче: 40 частиц, canvas размером с хост */
  K.dust = function (canvas, host, n) {
    var g = canvas.getContext('2d'), N = n || 40, W = 0, H = 0, P = [], dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    for (var i = 0; i < N; i++) P.push({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 2, s: 0.004 + Math.random() * 0.012, p: Math.random() * 6.28, a: 0.25 + Math.random() * 0.6 });
    function resize() { var r = host.getBoundingClientRect(); W = Math.round(r.width) || 1; H = Math.round(r.height) || 1; canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; }
    resize();
    function draw(t, dt) {
      if (!W || Math.abs(host.clientWidth - W) > 1 || Math.abs(host.clientHeight - H) > 1) resize();
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      for (var i = 0; i < N; i++) {
        var q = P[i];
        if (!REDUCED) { q.y -= q.s * dt * 3; q.x += Math.sin(t * 0.5 + q.p) * 0.0006 * dt * 60; if (q.y < -0.02) { q.y = 1.02; q.x = Math.random(); } }
        var beam = K.clamp(1 - Math.abs((q.x - 0.78) + (q.y - 0.12) * 0.7 - 0.25 * q.y) * 2.4, 0.18, 1);
        g.globalAlpha = q.a * beam * (0.65 + 0.35 * Math.sin(t * 1.2 + q.p));
        g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(q.x * W, q.y * H, q.r, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
    }
    draw(0, 0);
    return draw;
  };

  /* искры (WAAPI), position:fixed — координаты экрана */
  K.sparks = function (x, y, n, hot) {
    if (REDUCED) return;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i'); s.className = 'spark' + (hot ? ' hot' : ''); document.body.appendChild(s);
      var a = Math.random() * Math.PI * 2, r = 24 + Math.random() * 46, dx = Math.cos(a) * r, dy = Math.sin(a) * r - 18;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + (dy + 30) + 'px)) scale(.2)', opacity: 0 }],
        { duration: 420 + Math.random() * 260, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }).onfinish = (function (el) { return function () { el.remove(); }; })(s);
    }
  };
  /* дуга полёта: элемент position:fixed летит из A в B по квадратичной кривой */
  K.arc = function (el, A, B, lift, ms, sc, done) {
    if (REDUCED) { el.remove(); done(); return; }
    var kf = [], Cc = [(A.x + B.x) / 2, Math.min(A.y, B.y) - lift];
    for (var i = 0; i <= 12; i++) {
      var t = i / 12, u = 1 - t, x = u * u * A.x + 2 * u * t * Cc[0] + t * t * B.x, y = u * u * A.y + 2 * u * t * Cc[1] + t * t * B.y;
      kf.push({ transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) ' + sc(t), offset: t });
    }
    el.animate(kf, { duration: ms, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' }).onfinish = function () { el.remove(); done(); };
  };
  /* пружинистое нажатие: продавливание при касании, отскок при отпускании (делегирование на контейнер) */
  K.springPress = function (root, sel) {
    root.addEventListener('pointerdown', function (e) { var el = e.target.closest(sel); if (el && !el.classList.contains('spent') && !el.disabled) el.classList.add('pressed'); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      root.addEventListener(ev, function (e) {
        var el = e.target.closest ? e.target.closest(sel) : null; if (!el || !el.classList.contains('pressed')) return;
        el.classList.remove('pressed');
        if (!REDUCED && el.animate) el.animate([{ transform: 'translateY(5px) scale(.97)' }, { transform: 'translateY(-5px) scale(1.035)' }, { transform: 'translateY(1px) scale(.995)' }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.3,.7,.4,1)' });
      }, true);
    });
  };

  /* общий цикл: один rAF на все сцены; сцена шагает, только пока её хост виден */
  var scenes = [], looping = false;
  function loop() {
    var last = performance.now(), raf = 0, t = 0;
    function fr(now) {
      var dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
      K.stepLook(t, dt);
      scenes.forEach(function (s) { if (s.visible()) s.step(t, dt); });
      raf = requestAnimationFrame(fr);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(fr); }
    });
    raf = requestAnimationFrame(fr);
  }

  function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function mix(a, b, t) { return Math.round(a + (b - a) * t); }

  /* ---------- экземпляр сцены ---------- */
  K.createScene = function (host, o) {
    o = o || {}; K.initLook();
    var BASE = window.NPC_BASE || ''; /* игра поднята с запасной копии (сторож в index.html): картинки сцены брать оттуда же, а не с застрявшего адреса */
    var withStrings = o.strings !== false;
    host.insertAdjacentHTML('afterbegin', '<div class="sc" aria-hidden="true"><div class="layer bgL"></div><div class="beam"></div><canvas class="dust"></canvas><div class="puppet"></div><svg class="strings" xmlns="' + NS + '"></svg><div class="scdim"></div></div>');
    var root = host.querySelector('.sc'), bgL = root.querySelector('.bgL'), puppet = root.querySelector('.puppet'), svg = root.querySelector('.strings'), cv = root.querySelector('.dust');
    var S = { cur: null, frozen: false, root: root, host: host, withStrings: withStrings }, imgs = {}, failed = {}, loaded = {};
    var A = { x: 0, y: 0, w: 375, h: 400 }, wide = false, W = 375, H = 400;
    var geo = { h: 200, wrapW: 125, cx: 100, feet: 300, X: 0, Y: 0, rot: 0, sx: 1, sy: 1, vx: 0, vy: 0, tilt: 0, barW: 130 };
    var att = {}, lift = new K.Spring(0, 220, 9), kx = new K.Spring(0, 160, 10), ky = new K.Spring(0, 160, 10), sq = new K.Spring(0, 200, 8), rotS = new K.Spring(0, 160, 9), tiltS = new K.Spring(0, 90, 7);
    var slack = {}, heat = {}, dim = new K.Spring(0, 60, 11), baseSlack = 0.3, played = {}, pulled = null, paths = {}, vagaG, cord, cordIn, built = false;
    NAMES.forEach(function (n) { slack[n] = new K.Spring(baseSlack, 130, 8); heat[n] = 0; att[n] = null; });

    /* фон: картинка есть — показываем, нет — пустой слой (градиент хоста) */
    (function () { var im = new Image(); im.alt = ''; im.decoding = 'async'; im.draggable = false; im.onload = function () { bgL.appendChild(im); root.classList.add('bgok'); }; im.onerror = function () { /* без фона */ }; im.src = BASE + C.bg; })();

    var names = o.poses || Object.keys(C.poses);
    names.forEach(function (n) {
      var im = new Image(); im.alt = ''; im.className = 'pose'; im.decoding = 'async'; im.draggable = false; im.dataset.pose = n;
      im.onload = function () { loaded[n] = true; if (S.cur === n || (S.cur && C.poses[S.cur].fallback === n)) im.classList.add('on'); };
      im.onerror = function () { failed[n] = true; im.style.display = 'none'; };
      puppet.appendChild(im); imgs[n] = im;
    });
    function load(n) { var im = imgs[n]; if (im && !im.getAttribute('src')) im.src = BASE + C.poses[n].src; }
    /* первая поза — сразу, остальные — после первого кадра */
    function actual(n) { return failed[n] && C.poses[n].fallback ? C.poses[n].fallback : n; }
    S.preload = function () { names.forEach(load); };
    load(names[0]);
    setTimeout(S.preload, 400);

    function buildStrings() {
      built = true;
      var defs = mk('defs', {}, svg), gr = mk('linearGradient', { id: 'wood' + (o.id || ''), x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      mk('stop', { offset: 0, 'stop-color': '#ffd27a' }, gr); mk('stop', { offset: 1, 'stop-color': '#c47a2c' }, gr);
      cord = mk('line', { stroke: INK, 'stroke-width': 4.4, 'stroke-linecap': 'round' }, svg);
      cordIn = mk('line', { stroke: '#fff6dc', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, svg);
      NAMES.forEach(function (n) {
        var g = mk('g', { 'class': 'st', 'data-att': n }, svg);
        paths[n] = { g: g, back: mk('path', { fill: 'none', stroke: INK, 'stroke-width': 3.6, 'stroke-linecap': 'round', opacity: 0.6 }, g),
          glow: mk('path', { fill: 'none', stroke: '#ff3b2c', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0 }, g),
          front: mk('path', { fill: 'none', stroke: '#fff6dc', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g),
          knot: mk('circle', { r: 2.6, fill: '#f1d9a8', stroke: INK, 'stroke-width': 1.4 }, g) };
      });
      vagaG = mk('g', { 'class': 'vaga' }, svg);
      mk('rect', { x: -60, y: -6, width: 120, height: 12, rx: 6, fill: 'url(#wood' + (o.id || '') + ')', stroke: INK, 'stroke-width': 3.2 }, vagaG).setAttribute('class', 'vbar');
      mk('path', { d: 'M-52 -3.4H52', stroke: '#fff', 'stroke-opacity': 0.55, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, vagaG).setAttribute('class', 'vhi');
      NAMES.forEach(function (n) { paths[n].hook = mk('circle', { r: 3.6, fill: '#ffefc2', stroke: INK, 'stroke-width': 2 }, vagaG); });
      mk('circle', { cx: 0, cy: -9, r: 6, fill: 'none', stroke: INK, 'stroke-width': 3.4 }, vagaG);
    }
    if (withStrings) buildStrings();

    function localAttach(pose, n) {
      var a = C.poses[pose].attach[n], iw = geo.h * C.aspect;
      return [(geo.wrapW - iw) / 2 + a[0] * iw, a[1] * geo.h];
    }

    /* area — игровая зона в пикселях хоста */
    S.layout = function (area, isWide) {
      var r = host.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height);
      A = area; wide = isWide;
      var b = wide ? C.box.wide : C.box.phone;
      geo.h = A.h * b.h; geo.wrapW = geo.h * C.aspect; geo.cx = A.x + A.w * b.cx; geo.feet = A.y + A.h * b.feet;
      puppet.style.width = geo.wrapW + 'px'; puppet.style.height = geo.h + 'px';
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      geo.barW = geo.wrapW * C.bar.width;
      if (withStrings) {
        vagaG.querySelector('.vbar').setAttribute('x', -geo.barW / 2); vagaG.querySelector('.vbar').setAttribute('width', geo.barW);
        vagaG.querySelector('.vhi').setAttribute('d', 'M' + (-geo.barW / 2 + 8) + ' -3.4H' + (geo.barW / 2 - 8));
      }
      if (S.cur) NAMES.forEach(function (n) { att[n] = localAttach(S.cur, n); });
    };

    S.setPose = function (name, opt) {
      opt = opt || {}; if (name === S.cur || !imgs[name]) return;
      load(name); if (C.poses[name].fallback) load(C.poses[name].fallback);
      var show = actual(name), old = S.cur ? imgs[actual(S.cur)] : null, nw = imgs[show], prev = S.cur; S.cur = name;
      if (old && old !== nw) {
        if (REDUCED || opt.instant) old.classList.remove('on');
        else old.animate([{ transform: 'scale(1,1)', opacity: 1 }, { transform: 'scale(.8,.66) translateY(6%)', opacity: 0 }], { duration: 170, easing: 'ease-in', fill: 'forwards' })
          .onfinish = function () { if (S.cur !== prev) old.classList.remove('on'); };
      }
      Object.keys(imgs).forEach(function (k) { if (k !== show && k !== (old && old.dataset.pose)) imgs[k].classList.remove('on'); });
      if (loaded[show] || opt.instant) nw.classList.add('on');
      if (!REDUCED && !opt.instant && old !== nw) {
        nw.animate([{ transform: 'scale(.55,1.4) translateY(-12%)', opacity: 0 }, { transform: 'scale(1.16,.86)', opacity: 1, offset: 0.42 }, { transform: 'scale(.96,1.05)', offset: 0.7 }, { transform: 'scale(1,1)', opacity: 1 }],
          { duration: 480, easing: 'cubic-bezier(.3,.7,.4,1)' });
      }
      if (geo.wrapW && (opt.instant || !att.head)) NAMES.forEach(function (n) { att[n] = localAttach(name, n); });
    };

    /* ход приёмом: нить краснеет и натягивается, вага кренится, Тимура дёргает вверх */
    S.pull = function (n) {
      if (!withStrings) return;
      pulled = n; played[n] = 1; dim.t = 0;
      NAMES.forEach(function (k) { slack[k].t = baseSlack; });
      slack[n].t = 0; slack[n].x = Math.max(slack[n].x, 0.2); heat[n] = 1.6;
      tiltS.t = n === 'lhand' ? 0.16 : n === 'rhand' ? -0.16 : 0;
      lift.kick(-260); rotS.kick(n === 'lhand' ? -2 : n === 'rhand' ? 2 : 0);
      setTimeout(function () { tiltS.t = tiltS.t * 0.35; slack[n].t = 0.12; }, 520);
    };
    /* уже сыгранные нити остаются тёплыми (без анимации, для возврата на экран) */
    S.setPlayed = function (list) { played = {}; (list || []).forEach(function (n) { played[n] = 1; }); pulled = list && list.length ? list[list.length - 1] : null; NAMES.forEach(function (k) { slack[k].x = slack[k].t = played[k] ? 0.12 : baseSlack; heat[k] = played[k] ? 0.6 : 0; }); };
    S.release = function () {
      if (withStrings) { pulled = null; dim.t = 1; tiltS.t = 0; NAMES.forEach(function (k) { slack[k].t = 1.1; heat[k] = Math.min(heat[k], 0.4); }); }
      sq.kick(-3);
    };
    S.kick = function (a) { var d = (Math.random() < 0.5 ? -1 : 1); kx.kick(d * 160 * a); ky.kick(-120 * a); sq.kick(4 * a); };
    S.squash = function (v) { sq.kick(v); };
    S.hide = function (on) { root.classList.toggle('turn', !!on); };
    S.visible = function () { return host.offsetParent !== null && host.clientWidth > 0; };

    function toScreen(lx, ly) {
      var ox = geo.wrapW / 2, oy = geo.h, c = Math.cos(geo.rot), s = Math.sin(geo.rot);
      var dx = (lx - ox) * geo.sx, dy = (ly - oy) * geo.sy;
      return { x: geo.X + ox + dx * c - dy * s, y: geo.Y + oy + dx * s + dy * c };
    }
    /* точка на фигуре в координатах ХОСТА */
    S.world = function (name) {
      if (!S.cur || !att.head) return { x: geo.cx, y: geo.feet - geo.h * 0.5 };
      if (name === 'top') return toScreen(geo.wrapW / 2, 0);
      var a = att[name] || localAttach(S.cur, name); return toScreen(a[0], a[1]);
    };
    /* то же в координатах окна (для летящих карт и «+N») */
    S.screen = function (name) { var p = S.world(name), r = host.getBoundingClientRect(); return { x: p.x + r.left, y: p.y + r.top }; };
    S.box = function () { return { cx: geo.cx, feet: geo.feet, h: geo.h, w: geo.wrapW, X: geo.X, Y: geo.Y, A: A }; };
    S.strings = function () { return paths; };

    var dust = K.dust(cv, host, 40);
    S.step = function (t, dt) {
      if (!S.cur) { dust(t, dt); return; }
      if (!att.head) NAMES.forEach(function (n) { att[n] = localAttach(S.cur, n); });
      dust(t, dt);
      var L = K.look, fz = S.frozen || REDUCED, par = C.parallax;
      var sway = fz ? 0 : Math.sin(t * 0.9) * 2.6, swayR = fz ? 0 : Math.sin(t * 0.7 + 0.5) * 0.014, breathe = fz ? 1 : 1 + 0.0125 * Math.sin(t * 1.5);
      var lf = lift.step(dt), kX = kx.step(dt), kY = ky.step(dt), sqz = sq.step(dt), rs = rotS.step(dt), tilt = tiltS.step(dt), dm = dim.step(dt);
      NAMES.forEach(function (n) { slack[n].step(dt); heat[n] = Math.max(played[n] ? 0.55 : 0, n === pulled ? 0.85 : 0, heat[n] - dt * 1.6); });
      var lx = fz ? 0 : L.x, ly = fz ? 0 : L.y, kk = fz ? 0 : 1;
      bgL.style.transform = 'translate3d(' + (-lx * par.bg + kX * 0.12 * kk).toFixed(2) + 'px,' + (-ly * par.bg * 0.6 + kY * 0.1 * kk).toFixed(2) + 'px,0) scale(1.06)';
      geo.rot = swayR + rs * 0.012 + tilt * 0.1; geo.sx = 1 - sqz * 0.012; geo.sy = breathe * (1 + sqz * 0.02);
      var px = -lx * par.char + kX * 0.2 * kk + sway, py = -ly * par.char * 0.6 + kY * 0.18 * kk + lf;
      geo.X = geo.cx - geo.wrapW / 2 + px; geo.Y = geo.feet - geo.h + py;
      puppet.style.transform = 'translate3d(' + geo.X.toFixed(2) + 'px,' + geo.Y.toFixed(2) + 'px,0) rotate(' + geo.rot.toFixed(4) + 'rad) scale(' + geo.sx.toFixed(4) + ',' + geo.sy.toFixed(4) + ')';
      if (!withStrings) return;
      var k = 1 - Math.exp(-dt * 14);
      NAMES.forEach(function (n) { var tg = localAttach(S.cur, n), a = att[n]; a[0] += (tg[0] - a[0]) * k; a[1] += (tg[1] - a[1]) * k; });
      var hp = toScreen(geo.wrapW / 2, 0);
      geo.vx = geo.cx + px * 0.55; geo.vy = hp.y - geo.h * (!wide && C.bar.gapPhone != null ? C.bar.gapPhone : C.bar.gap) + Math.min(0, lf) * 0.55; geo.tilt = tilt + (fz ? 0 : Math.sin(t * 0.8) * 0.012);
      vagaG.setAttribute('transform', 'translate(' + geo.vx.toFixed(1) + ',' + geo.vy.toFixed(1) + ') rotate(' + (geo.tilt * 57.2958).toFixed(2) + ')');
      var yTop = -20;
      cord.setAttribute('x1', geo.vx); cord.setAttribute('y1', geo.vy - 15); cord.setAttribute('x2', geo.vx); cord.setAttribute('y2', yTop);
      cordIn.setAttribute('x1', geo.vx); cordIn.setAttribute('y1', geo.vy - 15); cordIn.setAttribute('x2', geo.vx); cordIn.setAttribute('y2', yTop);
      var cs = Math.cos(geo.tilt), sn = Math.sin(geo.tilt);
      NAMES.forEach(function (n, i) {
        var off = (HOOK[n] - 0.5) * geo.barW * 0.94, hx = geo.vx + off * cs, hy = geo.vy + off * sn + 6;
        paths[n].hook.setAttribute('cx', off); paths[n].hook.setAttribute('cy', 0);
        var a = toScreen(att[n][0], att[n][1]), dx = a.x - hx, dy = a.y - hy, len = Math.hypot(dx, dy) || 1;
        var sl = slack[n].x, h = Math.min(1, heat[n]);
        var wob = fz ? 0 : Math.sin(t * 1.3 + i * 1.7) * 2.2 * (0.4 + sl);
        var side = (i % 2 ? 1 : -1) * (n === 'head' ? 0.6 : 1);
        var mx = (hx + a.x) / 2 + (-dy / len) * (sl * len * 0.1 * side + wob), my = (hy + a.y) / 2 + (dx / len) * (sl * len * 0.1 * side + wob) + sl * len * 0.05;
        var d = 'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + a.x.toFixed(1) + ' ' + a.y.toFixed(1);
        var P = paths[n]; P.back.setAttribute('d', d); P.glow.setAttribute('d', d); P.front.setAttribute('d', d);
        var hot = n === pulled ? Math.max(h, 0.85) : h, gg = mix(246, 59, hot), bb = mix(220, 44, hot);
        P.front.setAttribute('stroke', 'rgb(255,' + gg + ',' + bb + ')');
        P.front.setAttribute('stroke-width', (1.8 + (n === pulled ? 1.2 : 0) + Math.max(0, heat[n] - 1) * 4).toFixed(2));
        P.glow.setAttribute('opacity', (Math.max(0, heat[n] - 0.5) * 0.45).toFixed(2));
        var op = (1 - dm.x * 0.6) * (0.9 - sl * 0.18); P.front.setAttribute('opacity', op.toFixed(2)); P.back.setAttribute('opacity', (0.6 * op).toFixed(2));
        P.knot.setAttribute('cx', a.x.toFixed(1)); P.knot.setAttribute('cy', a.y.toFixed(1)); P.knot.setAttribute('fill', 'rgb(255,' + gg + ',' + bb + ')'); P.knot.setAttribute('opacity', op.toFixed(2));
        P.g.setAttribute('data-played', played[n] ? '1' : '0');
      });
    };
    scenes.push(S);
    if (!looping) { looping = true; loop(); }
    return S;
  };
})();
