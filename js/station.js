/* FreshScent Station page — lightweight interactions (no hero/video, so this stays separate from main.js) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  if (reduce || !hasGSAP) document.documentElement.classList.add('rm');

  // Mobile menu
  const burger = $('#burger'), menu = $('#menu');
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open; menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));

  if (!hasGSAP || reduce) return;

  // Nav background + hide-on-scroll
  const nav = $('#nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      const hide = self.direction === 1 && y > 500 && !menuOpen;
      gsap.to(nav, { yPercent: hide ? -160 : 0, duration: .5, ease: 'power3.out', overwrite: 'auto' });
    }
  });

  // Generic reveals
  $$('[data-reveal]').forEach(el => gsap.from(el, {
    y: 44, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  }));
  $$('[data-stagger]').forEach(g => gsap.from(g.children, {
    y: 32, autoAlpha: 0, duration: 1, stagger: .09, ease: 'expo.out',
    scrollTrigger: { trigger: g, start: 'top 86%', once: true }
  }));
})();
