/* FreshScent Box — interactions (GSAP + ScrollTrigger + Lenis) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const body = document.body;
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  if (reduce || !hasGSAP) document.documentElement.classList.add('rm');

  /* ---------------- UI that works without animation ---------------- */
  // Mobile menu
  const burger = $('#burger'), menu = $('#menu');
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open; menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setMenu(!menuOpen));

  // Tabs
  const tabs = $$('[role="tab"]');
  const selectTab = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const pane = document.getElementById(t.getAttribute('aria-controls'));
      pane.hidden = !on;
      if (on && hasGSAP && !reduce) gsap.fromTo(pane.children, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, stagger: .06, ease: 'expo.out' });
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') selectTab(tabs[(i + 1) % tabs.length], true);
      if (e.key === 'ArrowLeft') selectTab(tabs[(i - 1 + tabs.length) % tabs.length], true);
    });
  });

  // Where: cards open when you interact with them
  const acc = $('#acc');
  const acards = $$('.acard', acc);
  const setCard = (card, open) => {
    const btn = $('.acard__btn', card), body = $('.acard__body', card), label = $('.acard__label', card);
    if (card.classList.contains('is-open') === open) return;
    btn.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Close' : 'Open';
    if (hasGSAP && !reduce) {
      if (open) {
        card.classList.add('is-open');
        gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: .7, ease: 'expo.out', clearProps: 'height' });
        gsap.fromTo($$('.acard__inner > *', card), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, stagger: .06, ease: 'expo.out', delay: .08 });
      } else {
        gsap.fromTo(body, { height: body.offsetHeight }, { height: 0, duration: .5, ease: 'power3.inOut', onComplete: () => { card.classList.remove('is-open'); gsap.set(body, { clearProps: 'height' }); } });
      }
    } else card.classList.toggle('is-open', open);
  };
  acards.forEach(card => $('.acard__btn', card).addEventListener('click', () => {
    const open = !card.classList.contains('is-open');
    acards.forEach(c => { if (c !== card) setCard(c, false); });
    setCard(card, open);
    acc.classList.toggle('has-open', open);
    if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 800);
  }));

  // Film: simple play / pause control
  const film = $('#meadowVideo'), filmBtn = $('#filmToggle');
  const syncFilm = () => { const p = film.paused; filmBtn.classList.toggle('is-paused', p); filmBtn.setAttribute('aria-label', p ? 'Play video' : 'Pause video'); };
  filmBtn.addEventListener('click', () => { if (film.paused) { const q = film.play(); q && q.catch && q.catch(() => {}); } else film.pause(); });
  film.addEventListener('play', syncFilm); film.addEventListener('pause', syncFilm);
  if (reduce) film.pause();
  syncFilm();

  // Why: image carousel (arrows + dots)
  const whyTrack = $('#whyCarouselTrack');
  const whySlides = $$('.carousel__slide', whyTrack);
  const whyDots = $$('#whyCarouselDots button');
  let whyIndex = 0;
  const setWhySlide = (i) => {
    whyIndex = (i + whySlides.length) % whySlides.length;
    whyTrack.style.transform = `translateX(-${whyIndex * 100}%)`;
    whyDots.forEach((d, j) => d.setAttribute('aria-selected', String(j === whyIndex)));
  };
  $('#whyCarouselPrev').addEventListener('click', () => setWhySlide(whyIndex - 1));
  $('#whyCarouselNext').addEventListener('click', () => setWhySlide(whyIndex + 1));
  whyDots.forEach((d, i) => d.addEventListener('click', () => setWhySlide(i)));

  // Partner form. Set data-endpoint on the form (e.g. a Formspree URL) to send real requests.
  const form = $('#partnerForm'), note = $('#formNote');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(f => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.setAttribute('aria-invalid', String(bad)); if (bad) ok = false;
    });
    note.classList.toggle('is-err', !ok);
    if (!ok) { note.textContent = 'Please fill in your name, a valid email, the property type, and the property name.'; return; }
    const first = form.name.value.trim().split(' ')[0];
    const endpoint = form.dataset.endpoint;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) });
        if (!res.ok) throw new Error();
        note.textContent = `Thanks, ${first}. We’ll be in touch at ${form.email.value.trim()}.`;
        form.reset();
      } catch { note.classList.add('is-err'); note.textContent = 'Your request didn’t go through. Please try again in a moment.'; }
    } else {
      note.textContent = `Thanks, ${first}. This preview doesn’t send requests yet; the form gets connected before launch.`;
    }
  });

  // ZIP finder (placeholder until a location directory is connected)
  const zipForm = $('#zipForm'), zipMsg = $('#zipMsg');
  zipForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = $('#zip').value.trim();
    zipMsg.textContent = q
      ? `Participating locations near “${q}” will show here once the FreshScent Box™ directory is connected.`
      : 'Enter a ZIP code or city to search.';
  });

  /* ---------------- no-animation path ---------------- */
  if (reduce || !hasGSAP) {
    body.classList.remove('is-loading');
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', () => setMenu(false)));
    return;
  }

  /* ---------------- smooth scroll ---------------- */
  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault(); setMenu(false);
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -24, duration: 1.6 });
    else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY - 24, behavior: 'smooth' });
  }));

  /* ---------------- intro: 3s film flies into the hero frame ---------------- */
  const nav = $('#nav');
  const intro = $('#intro'), media = $('#introMedia'), video = $('#introVideo'), tag = $('#introTag');
  const frame = $('#heroFrame');
  intro.hidden = false;

  gsap.set('.hero__title .line > span', { yPercent: 115 });
  gsap.set('[data-hero]', { autoAlpha: 0, y: 24 });
  gsap.set('[data-chip]', { autoAlpha: 0, scale: .8, y: 12 });
  gsap.set(nav, { yPercent: -160 });

  // Centered 3:2 box that fits the viewport, so the film is never cropped
  const stageRect = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(vw * (vw < 700 ? .92 : .82), vh * .74 * 1.5);
    const h = w / 1.5;
    return { left: (vw - w) / 2, top: (vh - h) / 2 - vh * .03, width: w, height: h };
  };
  const placeStage = () => {
    const r = stageRect();
    gsap.set(media, r);
    gsap.set(tag, { top: r.top + r.height + Math.min(36, window.innerHeight * .04) });
  };
  placeStage();
  window.addEventListener('resize', placeStage);

  gsap.timeline()
    .to('.intro__ambient', { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0)
    .fromTo(media, { scale: .94, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.3, ease: 'expo.out' }, 0)
    .to(tag, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, .9);

  let revealed = false;
  const reveal = () => {
    if (revealed) return; revealed = true;
    window.removeEventListener('resize', placeStage);
    const t = frame.getBoundingClientRect();
    body.classList.remove('is-loading');
    gsap.timeline({ defaults: { ease: 'expo.inOut' }, onComplete: () => { intro.remove(); } })
      .to(tag, { autoAlpha: 0, y: -10, duration: .45, ease: 'power2.in' }, 0)
      .to(media, { left: t.left, top: t.top, width: t.width, height: t.height, borderRadius: 28, boxShadow: '0 0 0 8px rgba(255,255,255,.75), 0 60px 90px -50px rgba(14,42,92,.55)', duration: 1.5 }, .1)
      .to('.intro__ambient', { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, .3)
      .to(intro, { backgroundColor: 'rgba(250,252,247,0)', duration: 1.1, ease: 'power2.inOut' }, .3)
      .to(nav, { yPercent: 0, duration: 1.2, ease: 'expo.out' }, .9)
      .to('.hero__title .line > span', { yPercent: 0, duration: 1.4, stagger: .09, ease: 'expo.out' }, .7)
      .to('[data-hero]', { autoAlpha: 1, y: 0, duration: 1.1, stagger: .08, ease: 'expo.out' }, .95)
      .to('[data-chip]', { autoAlpha: 1, scale: 1, y: 0, duration: .9, stagger: .12, ease: 'back.out(1.8)' }, 1.4)
      .add(() => { lenis && lenis.start(); ScrollTrigger.refresh(); }, 1.3);
  };

  video.addEventListener('ended', reveal);
  const fallback = setTimeout(reveal, 4400);
  const p = video.play();
  if (p && p.catch) p.catch(() => { clearTimeout(fallback); setTimeout(reveal, 1600); });

  // drifting cloud puffs + gently floating chips
  gsap.to('.puff--1', { xPercent: 22, duration: 18, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('.puff--2', { xPercent: -30, duration: 22, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('.puff--3', { xPercent: -18, duration: 20, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('.chip--a', { y: -8, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 2.5 });
  gsap.to('.chip--b', { y: 8, duration: 3.6, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 2.8 });

  /* ---------------- hero scroll-away (desktop, where the hero fits the screen) ---------------- */
  const mmHero = gsap.matchMedia();
  mmHero.add('(min-width: 901px) and (min-height: 560px)', () => {
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero__copy', { yPercent: -18, opacity: .2, ease: 'none' }, 0)
      .to('.hero__visual', { yPercent: -10, scale: .94, ease: 'none' }, 0)
      .to('.puff', { yPercent: -60, ease: 'none' }, 0);
  });

  /* ---------------- nav state ---------------- */
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      if (!revealed) return;
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      const hide = self.direction === 1 && y > 500 && !menuOpen;
      gsap.to(nav, { yPercent: hide ? -160 : 0, duration: .5, ease: 'power3.out', overwrite: 'auto' });
    }
  });

  /* ---------------- statement word scrub ---------------- */
  const statement = $('#statement');
  const splitWords = el => {
    [...el.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/([ \t\n\r]+)/).forEach(part => {
          if (!part) return;
          if (/^[ \t\n\r]+$/.test(part)) frag.appendChild(document.createTextNode(' '));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1) splitWords(node);
    });
  };
  splitWords(statement);
  gsap.fromTo($$('.w', statement), { opacity: .14 }, {
    opacity: 1, stagger: .12, ease: 'none',
    scrollTrigger: { trigger: statement, start: 'top 82%', end: 'bottom 45%', scrub: true }
  });

  /* ---------------- generic reveals ---------------- */
  $$('[data-reveal]').forEach(el => gsap.from(el, {
    y: 44, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  }));
  $$('[data-stagger]').forEach(g => gsap.from(g.children, {
    y: 32, autoAlpha: 0, duration: 1, stagger: .09, ease: 'expo.out',
    scrollTrigger: { trigger: g, start: 'top 86%', once: true }
  }));

  /* ---------------- marquee (reacts to scroll velocity) ---------------- */
  const loop = gsap.to('#marquee', { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
  loop.totalTime(26 * 200);
  let dir = 1;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const v = self.getVelocity();
      dir = v < 0 ? -1 : 1;
      const boost = 1 + Math.min(Math.abs(v) / 450, 5);
      gsap.timeline({ overwrite: true })
        .to(loop, { timeScale: dir * boost, duration: .2 })
        .to(loop, { timeScale: dir, duration: 1.2, ease: 'power2.out' });
    }
  });

  /* ---------------- responsive scroll scenes ---------------- */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', () => {
    // Problem: horizontal scroll
    const track = $('#problemTrack');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.problem', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true }
    });
  });

  /* ---------------- quality: image opens up ---------------- */
  gsap.fromTo('.quality__media', { clipPath: 'inset(6% 18% 6% 18% round 32px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
    scrollTrigger: { trigger: '.quality__media', start: 'top 90%', end: 'top 5%', scrub: true }
  });

  /* ---------------- box spec + finishes ---------------- */
  gsap.from('.box__spec', {
    y: 80, rotate: 2, autoAlpha: 0, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.box__spec', start: 'top 85%', once: true }
  });
  gsap.from('.tilt', {
    y: 60, autoAlpha: 0, duration: 1.1, stagger: .1, ease: 'expo.out',
    scrollTrigger: { trigger: '#wraps', start: 'top 85%', once: true }
  });
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.tilt').forEach(card => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3' });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * 14);
        rx(-((e.clientY - r.top) / r.height - .5) * 14);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
