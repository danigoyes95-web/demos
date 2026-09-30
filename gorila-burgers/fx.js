/* Aparición en cascada al hacer scroll · ritmo energía (0.35 s, rebote leve).
   Sin JS, sin soporte o con movimiento reducido: todo se ve completo y quieto. */
(() => {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const a = e.target.__rv; a.play(); a.onfinish = () => a.cancel(); io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  const preparar = (el, i) => {
    el.__rv = el.animate([{ opacity: 0, transform: 'translateY(22px) scale(.98)' }, { opacity: 1, transform: 'none' }],
      { duration: 380, delay: Math.min(i, 6) * 70, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'both' });
    el.__rv.pause(); io.observe(el);
  };
  const vigilar = raiz => {
    raiz.querySelectorAll('[data-reveal]:not([data-rv])').forEach(el => { el.dataset.rv = 1; preparar(el, 0); });
    raiz.querySelectorAll('[data-stagger]:not([data-rv])').forEach(p => { p.dataset.rv = 1; [...p.children].forEach(preparar); });
  };
  vigilar(document);
  window.fxVigilar = vigilar;
})();
