/* Controls-themed motion on the home page.
   - Root locus in the prize card: runs on its own (slow gain sweep).
   - One vehicle tracks the cursor with second-order dynamics. A ring follows the cursor, a graph under the photo records
     the vertical command against the vehicle's response, and an attitude indicator banks and pitches with its velocity.
   Everything is decorative (aria-hidden), skipped for reduced motion, and the cursor-driven pieces are skipped on touch screens and phones. */
(function () {
  if (!document.body.classList.contains('bento-home')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ACC = getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#1f5a6b';
  var INK = '#1d1a16';
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var wide = function () { return window.innerWidth >= 760; };
  var $ = function (s) { return document.querySelector(s); };
  function fit(c, w, h) { var d = Math.min(window.devicePixelRatio || 1, 2); c.width = Math.round(w * d); c.height = Math.round(h * d); c.style.width = w + 'px'; c.style.height = h + 'px'; var x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return x; }
  function visible(el, cb) { var io = new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { threshold: 0 }); io.observe(el); }
  function mk(cls) { var d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); return d; }

  /* ---- shared vehicle ---- */
  function Axis() { this.x = 0; this.v = 0; this.a = 0; }
  Axis.prototype.step = function (target, z, w, dt) {
    var n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
    for (var i = 0; i < n; i++) { this.a = w * w * (target - this.x) - 2 * z * w * this.v; this.v += this.a * h; this.x += this.v * h; }
  };
  var SH = { tx: innerWidth * .5, ty: innerHeight * .5, ax: new Axis(), ay: new Axis(), lastMove: -1e9, t: 0 };
  SH.ax.x = SH.tx; SH.ay.x = SH.ty;
  window.addEventListener('pointermove', function (e) { if (!wide()) return; SH.tx = e.clientX; SH.ty = e.clientY; SH.lastMove = performance.now(); });
  var subs = [], last = performance.now();
  function engine(now) {
    requestAnimationFrame(engine);
    var dt = Math.min(0.06, (now - last) / 1000 || 0.016); last = now; SH.t += dt;
    if (now - SH.lastMove > 5000) { /* nobody steering: a slow drift keeps the traces moving */
      SH.tx = innerWidth * (.5 + .22 * Math.sin(SH.t * .45)); SH.ty = innerHeight * (.5 + .18 * Math.sin(SH.t * .31 + 1)); }
    SH.ax.step(SH.tx, 0.34, 9, dt); SH.ay.step(SH.ty, 0.34, 9, dt);
    for (var i = 0; i < subs.length; i++) subs[i](dt, now);
  }

  /* ---- root locus of K / (s (s+1) (s+3)) in the prize card ----
     Roots are tracked by continuation (each frame starts from the previous roots) so branches never swap, and the plot keeps
     a uniform scale so it is not stretched on the tall phone card. */
  function rootLocus() {
    var card = $('.poster-prize'); if (!card) return;
    card.classList.add('ctl-rel');
    var host = mk('ctl-bg ctl-dark'); card.insertBefore(host, card.firstChild);
    var c = document.createElement('canvas'); host.appendChild(c);
    var KMAX = 30, PERIOD = 12;
    var W, H, g, S, OX, OY, on = true, t0 = performance.now(), trail, r, K, lastK;
    function reset() { r = [[0, 0], [-1, 0], [-3, 0]]; trail = [[], [], []]; K = 0; lastK = 0; }
    function size() {
      var b = host.getBoundingClientRect(); W = b.width; H = b.height; g = fit(c, W, H); c.style.width = '100%'; c.style.height = '100%';
      S = Math.min(W / 8.4, H / 7.4); OX = W - 2.2 * S - 10; OY = H * 0.5;
    }
    reset(); size(); window.addEventListener('resize', size);
    function mul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
    function div(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
    function f(z) { var z2 = mul(z, z), z3 = mul(z2, z); return [z3[0] + 4 * z2[0] + 3 * z[0] + K, z3[1] + 4 * z2[1] + 3 * z[1]]; }
    function refine() {
      for (var i = 0; i < 3; i++) if (Math.abs(r[i][1]) < 1e-4) r[i][1] = (i === 0 ? 1 : -1) * 2e-4; /* lets a real pair leave the axis at breakaway */
      for (var it = 0; it < 14; it++) for (i = 0; i < 3; i++) {
        var p = [1, 0]; for (var j = 0; j < 3; j++) if (j !== i) p = mul(p, [r[i][0] - r[j][0], r[i][1] - r[j][1]]);
        var q = div(f(r[i]), p); r[i] = [r[i][0] - q[0], r[i][1] - q[1]];
      }
    }
    function mx(s) { return OX + s * S; } function my(w) { return OY - w * S; }
    visible(host, function (v) { on = v; });
    subs.push(function (dt, now) {
      if (!on) return;
      var ph = ((now - t0) / 1000 % PERIOD) / PERIOD, tgt = ph < .5 ? ph * 2 * KMAX : (1 - (ph - .5) * 2) * KMAX;
      if (tgt < lastK - 1 && tgt < 1) { reset(); }
      var n = Math.max(1, Math.ceil(Math.abs(tgt - K) / 0.15));
      for (var i = 0; i < n; i++) { K += (tgt - K) / (n - i); refine(); }
      lastK = K;
      trail.forEach(function (tr, k) { var l = tr[tr.length - 1]; if (!l || Math.abs(l[0] - r[k][0]) + Math.abs(l[1] - r[k][1]) > 0.03) { tr.push([r[k][0], r[k][1]]); if (tr.length > 500) tr.shift(); } });
      g.clearRect(0, 0, W, H);
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.14)'; g.beginPath();
      g.moveTo(0, my(0)); g.lineTo(W, my(0)); g.moveTo(mx(0), 0); g.lineTo(mx(0), H); g.stroke();
      g.fillStyle = 'rgba(255,120,90,.07)'; g.fillRect(mx(0), 0, W - mx(0), H); /* right half plane: unstable */
      [0, -1, -3].forEach(function (p) { var x = mx(p), y = my(0); g.beginPath(); g.moveTo(x - 5, y - 5); g.lineTo(x + 5, y + 5); g.moveTo(x + 5, y - 5); g.lineTo(x - 5, y + 5); g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke(); });
      g.lineWidth = 1.6; g.lineJoin = 'round'; g.strokeStyle = 'rgba(127,196,212,.7)';
      trail.forEach(function (tr) { g.beginPath(); tr.forEach(function (p, k) { var x = mx(p[0]), y = my(p[1]); if (k) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); });
      r.forEach(function (q) { g.fillStyle = q[0] > 0 ? '#ffb48a' : '#9fd9e6'; g.beginPath(); g.arc(mx(q[0]), my(q[1]), 4.5, 0, 7); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.45)'; g.font = '11px Inter, sans-serif'; g.textAlign = 'right';
      g.fillText('K = ' + K.toFixed(1) + (r.some(function (q) { return q[0] > 0; }) ? '  unstable' : '  stable'), W - 12, H - 12);
    });
  }

  /* ---- graph under the photo: vertical command against the vehicle, error shaded ---- */
  function graph(fig) {
    var host = mk('ctl-graph'); fig.appendChild(host);
    var c = document.createElement('canvas'); host.appendChild(c);
    var W, H = 86, g, hc = [], hr = [], carry = 0, on = true;
    function size() { W = Math.max(100, host.getBoundingClientRect().width); g = fit(c, W, H); c.style.width = '100%'; hc = []; hr = []; }
    size(); window.addEventListener('resize', size);
    visible(host, function (v) { on = v; });
    subs.push(function (dt) {
      if (!on) return;
      carry += 45 * dt; var px = Math.floor(carry); carry -= px;
      var cmd = SH.ty / innerHeight - .5, rsp = SH.ay.x / innerHeight - .5;
      for (var k = 0; k < px; k++) { hc.push(cmd); hr.push(rsp); }
      if (hc.length > W) { hc.splice(0, hc.length - W); hr.splice(0, hr.length - W); }
      g.clearRect(0, 0, W, H);
      var mid = H / 2, A = H * 0.8, off = W - hc.length;
      g.strokeStyle = 'rgba(29,26,22,.22)'; g.lineWidth = 1; g.setLineDash([2, 5]); g.beginPath(); g.moveTo(0, mid); g.lineTo(W, mid); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(31,90,107,.14)'; g.beginPath();
      for (var a = 0; a < hc.length; a++) g.lineTo(off + a, mid + hc[a] * A);
      for (var b = hr.length - 1; b >= 0; b--) g.lineTo(off + b, mid + hr[b] * A);
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(29,26,22,.4)'; g.lineWidth = 1.3; g.setLineDash([4, 4]); g.beginPath();
      hc.forEach(function (v, i) { if (i) g.lineTo(off + i, mid + v * A); else g.moveTo(off + i, mid + v * A); }); g.stroke(); g.setLineDash([]);
      g.strokeStyle = ACC; g.lineWidth = 2.3; g.lineJoin = 'round'; g.beginPath();
      hr.forEach(function (v, i) { if (i) g.lineTo(off + i, mid + v * A); else g.moveTo(off + i, mid + v * A); }); g.stroke();
    });
  }

  /* ---- attitude indicator under the photo ---- */
  function attitude(fig) {
    var px = 104, wrap = mk('ctl-att');
    wrap.innerHTML = '<svg viewBox="-60 -60 120 120" width="' + px + '" height="' + px + '" focusable="false"><defs><clipPath id="ctlc"><circle r="54"/></clipPath></defs>' +
      '<g clip-path="url(#ctlc)"><g class="hz"><rect x="-160" y="-160" width="320" height="160" fill="#cfe0e6"/><rect x="-160" y="0" width="320" height="160" fill="#b9a98f"/>' +
      '<line x1="-160" y1="0" x2="160" y2="0" stroke="#fff" stroke-width="1.6"/>' +
      [-30, -20, -10, 10, 20, 30].map(function (m) { var w = Math.abs(m) === 20 ? 14 : 9; return '<line x1="' + (-w) + '" y1="' + m + '" x2="' + w + '" y2="' + m + '" stroke="#fff" stroke-width="1"/>'; }).join('') + '</g></g>' +
      '<circle r="54" fill="none" stroke="' + INK + '" stroke-width="3.5"/><path d="M-26 0 H-8 M8 0 H26 M0 -3 V3" stroke="' + ACC + '" stroke-width="3.4" stroke-linecap="round" fill="none"/></svg>';
    fig.appendChild(wrap);
    var hz = wrap.querySelector('.hz'), pitch = 0, roll = 0;
    subs.push(function (dt) {
      var tp = Math.max(-1, Math.min(1, SH.ay.v / 900)), tr = Math.max(-1, Math.min(1, SH.ax.v / 900));
      pitch += (tp - pitch) * Math.min(1, dt * 8); roll += (tr - roll) * Math.min(1, dt * 8);
      hz.setAttribute('transform', 'rotate(' + (roll * 28).toFixed(2) + ') translate(0 ' + (-pitch * 26).toFixed(2) + ')');
    });
  }

  /* ---- ring that follows the cursor ---- */
  function ring() {
    var c = document.createElement('canvas'); c.className = 'ctl-ring'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c);
    var W = innerWidth, H = innerHeight, g = fit(c, W, H), trail = [];
    window.addEventListener('resize', function () { W = innerWidth; H = innerHeight; g = fit(c, W, H); });
    subs.push(function () {
      var x = SH.ax.x, y = SH.ay.x; trail.push([x, y]); if (trail.length > 36) trail.shift();
      g.clearRect(0, 0, W, H);
      for (var i = 1; i < trail.length; i++) { g.strokeStyle = 'rgba(31,90,107,' + (i / trail.length * 0.5).toFixed(3) + ')'; g.lineWidth = 1 + i / trail.length * 2.4; g.beginPath(); g.moveTo(trail[i - 1][0], trail[i - 1][1]); g.lineTo(trail[i][0], trail[i][1]); g.stroke(); }
      g.strokeStyle = ACC; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 9, 0, 7); g.stroke();
      g.fillStyle = 'rgba(29,26,22,.5)'; g.beginPath(); g.arc(SH.tx, SH.ty, 2.2, 0, 7); g.fill();
    });
  }

  /* Phones: the same instruments sit in their own tile and the vehicle follows the scroll position, so scrolling is the command. */
  function strip() {
    var host = $('.poster-opening'); if (!host) return;
    var box = mk('ctl-strip'); host.parentNode.insertBefore(box, host.nextSibling);
    graph(box); attitude(box);
    var cap = document.createElement('p'); cap.className = 'ctl-cap'; cap.textContent = 'Live: scroll to steer. Dashed is the command, solid is the response.'; box.appendChild(cap);
    SH.tx = innerWidth * .5;
    window.addEventListener('scroll', function () { SH.ty = innerHeight * (.5 + .32 * Math.sin(window.scrollY / 170)); SH.lastMove = performance.now(); }, { passive: true });
  }

  rootLocus();
  var fig = $('.poster-portrait');
  if (fig && wide()) { fig.classList.add('ctl-col'); graph(fig); attitude(fig); }
  if (fine && wide()) ring();
  if (!wide()) strip();
  requestAnimationFrame(engine);
})();
