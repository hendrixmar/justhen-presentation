/* JUSTHEN deck · navigation + Motion transitions */
(() => {
  const { animate, stagger } = window.Motion || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || !window.Motion;
  const deck = document.querySelector('[data-deck]');
  const slides = [...deck.querySelectorAll('.slide')];
  const total = slides.length;
  const ease = [0.22, 1, 0.36, 1];
  let i = 0, busy = false;

  document.querySelector('[data-total]').textContent = total;

  /* fit 1920×1080 stage into viewport */
  const fit = () => deck.style.setProperty('--s', Math.min(innerWidth / 1920, innerHeight / 1080));
  addEventListener('resize', fit); fit();

  const prepare = (slide) => {
    slide.querySelectorAll('[data-in]').forEach(el => { el.style.opacity = 0; });
    slide.querySelectorAll('[data-count]').forEach(el => el.textContent = 0);
    const tl = slide.querySelector('[data-tl-line]'); if (tl) tl.style.transform = 'scaleX(0)';
  };

  const enter = (slide) => {
    const els = slide.querySelectorAll('[data-in]');
    if (reduce) { els.forEach(el => el.style.opacity = 1); return; }
    animate(els, { opacity: [0, 1], y: [40, 0], filter: ['blur(8px)', 'blur(0px)'] },
      { duration: 0.9, delay: stagger(0.08, { startDelay: 0.25 }), ease });
    slide.querySelectorAll('[data-count]').forEach(el => {
      animate(0, +el.dataset.count, { duration: 1.6, delay: 0.5, ease, onUpdate: v => el.textContent = Math.round(v) });
    });
    const tl = slide.querySelector('[data-tl-line]');
    if (tl) animate(tl, { scaleX: [0, 1] }, { duration: 1.6, delay: 0.3, ease });
    const mark = slide.querySelector('.bg-mark');
    if (mark) animate(mark, { x: [120, 0], opacity: [0, 1] }, { duration: 1.8, ease });
  };

  const go = (n, dir = 1) => {
    n = Math.max(0, Math.min(total - 1, n));
    if (n === i && slides[i].classList.contains('is-active')) return;
    if (busy) return; busy = true;
    const from = slides[i], to = slides[n];
    i = n;
    location.hash = n + 1;
    document.querySelector('[data-current]').textContent = n + 1;
    prepare(to);
    to.classList.add('is-active');
    if (reduce) { from.classList.remove('is-active'); enter(to); busy = false; return; }
    animate('[data-progress]', { scaleX: (n + 1) / total }, { duration: 0.6, ease });
    animate(to, { opacity: [0, 1], x: [80 * dir, 0], scale: [0.98, 1] }, { duration: 0.8, ease });
    if (from !== to) {
      animate(from, { opacity: [1, 0], x: [0, -60 * dir], scale: [1, 0.98] }, { duration: 0.6, ease })
        .then(() => { from.classList.remove('is-active'); from.style.transform = ''; });
    }
    enter(to);
    setTimeout(() => busy = false, 450);
  };

  /* controls */
  const next = () => go(i + 1, 1), prev = () => go(i - 1, -1);
  addEventListener('keydown', (e) => {
    if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') go(0); else if (e.key === 'End') go(total - 1);
    else if (e.key.toLowerCase() === 'f') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    else if (e.key === 'Escape') document.body.classList.toggle('is-overview');
  });
  document.querySelector('[data-next]').onclick = next;
  document.querySelector('[data-prev]').onclick = prev;
  deck.addEventListener('click', (e) => {
    if (document.body.classList.contains('is-overview')) {
      const s = e.target.closest('.slide'); if (s) { document.body.classList.remove('is-overview'); go(slides.indexOf(s)); }
      return;
    }
    if (e.target.closest('a,button')) return;
    (e.clientX < innerWidth * 0.2) ? prev() : next();
  });
  let tx = 0;
  addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) dx < 0 ? next() : prev(); });

  /* overview layout: grid of slides */
  const layoutOverview = () => slides.forEach((s, k) => {
    const col = k % 4, row = Math.floor(k / 4);
    s.style.transform = document.body.classList.contains('is-overview')
      ? `translate(${(col - 1.5) * 1960}px, ${(row - 1) * 1120}px)` : '';
  });
  new MutationObserver(layoutOverview).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  addEventListener('hashchange', () => { const h = parseInt(location.hash.slice(1), 10); if (!isNaN(h) && h - 1 !== i) go(h - 1, h - 1 > i ? 1 : -1); });

  /* start from hash */
  const start = parseInt(location.hash.slice(1), 10);
  slides.forEach(prepare);
  go(isNaN(start) ? 0 : start - 1);
})();
