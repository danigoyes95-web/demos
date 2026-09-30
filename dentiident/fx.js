/* Aparición al hacer scroll en cascada (Dermabelle 12 + Core Studio 1).
   Sin JS o con movimiento reducido, todo se ve normal. */
(() => {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const a = e.target.__rv; a.play(); a.onfinish = () => a.cancel(); io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  const preparar = (el, i) => {
    el.__rv = el.animate([{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }],
      { duration: 900, delay: Math.min(i, 6) * 110, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
    el.__rv.pause(); io.observe(el);
  };
  document.querySelectorAll('[data-reveal]').forEach(el => preparar(el, 0));
  document.querySelectorAll('[data-stagger]').forEach(p => [...p.children].forEach(preparar));
})();
