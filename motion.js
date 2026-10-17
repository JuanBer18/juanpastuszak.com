/* Small motion on the home page: count-up results and cards fading in.
   Everything is skipped when the visitor asks for reduced motion. */
(function () {
  if (!document.body.classList.contains('bento-home')) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var all = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  if (reduce) return;

  /* 2. Numbers in the result strips count up when they come into view */
  all('.bento-result b').forEach(function (el) {
    var txt = el.textContent, obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        obs.disconnect();
        var start = performance.now(), dur = 1300;
        (function step(now) {
          var p = Math.min(1, (now - start) / dur), ease = 1 - Math.pow(1 - p, 3);
          el.textContent = txt.replace(/\d[\d,]*\.?\d*/g, function (m) {
            var dec = (m.split('.')[1] || '').length, v = parseFloat(m.replace(/,/g, '')) * ease, s = v.toFixed(dec);
            if (m.indexOf(',') > -1) s = Number(s).toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec });
            return s;
          });
          if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
        })(start);
      });
    }, { threshold: .6 });
    obs.observe(el);
  });

  /* 3. Cards fade up as they scroll into view */
  var els = all('.poster-profile, .poster-prize, .bento-recognition > *, .bento-tile');
  document.documentElement.classList.add('js-motion');
  var rev = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var delay = (els.indexOf(e.target) % 3) * 90;
      setTimeout(function () { e.target.classList.add('in'); }, delay);
      rev.unobserve(e.target);
    });
  }, { threshold: .12 });
  els.forEach(function (el) { el.classList.add('rv'); rev.observe(el); });
})();
