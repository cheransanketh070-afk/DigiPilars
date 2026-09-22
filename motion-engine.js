(() => {
  'use strict';

  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer:coarse)').matches;
  const sections = [...document.querySelectorAll('.scene-section')];
  if (!sections.length) return;

  root.classList.add('cinematic-show');

  try { window.DPLenis?.destroy?.(); } catch (_) {}
  try { window.ScrollTrigger?.getAll?.().forEach(t => t.kill()); } catch (_) {}
  try { window.gsap?.killTweensOf?.('.scene-section,.section-inner,.detail-grid,.floating-ui,.module-card,.review-card'); } catch (_) {}

  const slideNames = sections.map(s => (s.dataset.mode || 'scene').toUpperCase());
  const nav = document.createElement('nav');
  nav.className = 'cinematic-nav';
  nav.setAttribute('aria-label', 'Movie scenes');

  const progress = document.createElement('div');
  progress.className = 'slide-progress';
  progress.innerHTML = '<i></i>';
  document.body.appendChild(progress);

  const title = document.createElement('div');
  title.className = 'slide-title';
  title.innerHTML = '<b>DIGITAL PILLARS</b> / <span>SCENE 01</span>';
  document.body.appendChild(title);

  const index = document.createElement('div');
  index.className = 'scene-index';
  index.innerHTML = '<span>01</span><i></i><span>08</span>';
  document.body.appendChild(index);

  const hint = document.createElement('div');
  hint.className = 'cinematic-hint';
  hint.textContent = coarse ? 'SWIPE / TAP TO MOVE' : 'TRACKPAD / WHEEL TO MOVE';
  document.body.appendChild(hint);

  sections.forEach((section, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'Open ' + slideNames[i] + ' scene');
    button.title = slideNames[i];
    button.addEventListener('click', () => goTo(i));
    nav.appendChild(button);
  });
  document.body.appendChild(nav);

  let active = 0;
  let busy = false;
  let touchX = 0;
  let touchY = 0;
  let wheelAccumulator = 0;
  let wheelTimer = 0;

  const setMode = i => {
    const mode = sections[i]?.dataset.mode || 'core';
    window.DPSetMode?.(mode);
    document.body.dataset.mode = mode;
    window.dispatchEvent(new CustomEvent('dp:scene', { detail: { index:i, mode } }));
  };

  const updateChrome = () => {
    const n = String(active + 1).padStart(2, '0');
    const total = String(sections.length).padStart(2, '0');
    index.querySelector('span').textContent = n;
    index.lastElementChild.textContent = total;
    title.querySelector('span').textContent = 'SCENE ' + n + ' / ' + slideNames[active];
    progress.querySelector('i').style.width = (((active + 1) / sections.length) * 100) + '%';
    nav.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', i === active ? 'true' : 'false'));
  };

  const activate = (next, immediate = false) => {
    next = Math.max(0, Math.min(sections.length - 1, next));
    if (next === active && sections[next].classList.contains('is-active')) return;
    const previous = sections[active];
    const incoming = sections[next];
    const direction = next > active ? 1 : -1;

    sections.forEach(s => s.classList.remove('is-active', 'is-leaving'));
    previous?.classList.add('is-leaving');
    incoming.classList.add('is-active');
    incoming.style.setProperty('--slide-direction', direction);
    active = next;
    setMode(active);
    updateChrome();

    if (!immediate && !reduce) {
      busy = true;
      window.setTimeout(() => { busy = false; }, 720);
    } else busy = false;
  };

  const goTo = next => {
    if (busy) return;
    if (next < 0 || next >= sections.length) return;
    activate(next);
  };

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const i = sections.indexOf(target);
    if (i >= 0) goTo(i);
  }, true);

  const ignored = target => !!target?.closest('input,textarea,select,[contenteditable="true"],#aiPanel,.ai-questions');

  window.addEventListener('wheel', e => {
    if (ignored(e.target)) return;
    e.preventDefault();
    if (busy || !sections.length) return;
    wheelAccumulator += e.deltaY;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelAccumulator = 0; }, 120);
    const threshold = coarse ? 36 : Math.max(28, Math.min(72, 48 * (window.devicePixelRatio || 1)));
    if (Math.abs(wheelAccumulator) >= threshold) {
      const dir = wheelAccumulator > 0 ? 1 : -1;
      wheelAccumulator = 0;
      goTo(active + dir);
    }
  }, {capture:true, passive:false});

  window.addEventListener('touchstart', e => {
    if (!e.touches[0] || ignored(e.target)) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, {capture:true, passive:true});

  window.addEventListener('touchend', e => {
    if (busy || ignored(e.target) || !e.changedTouches[0]) return;
    const dx = touchX - e.changedTouches[0].clientX;
    const dy = touchY - e.changedTouches[0].clientY;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    if (distance < 50) return;
    goTo(active + (Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 1 : -1) : (dx > 0 ? 1 : -1)));
  }, {capture:true, passive:true});

  window.addEventListener('keydown', e => {
    if (ignored(e.target)) return;
    const forward = ['ArrowDown','PageDown','ArrowRight',' '].includes(e.key);
    const backward = ['ArrowUp','PageUp','ArrowLeft'].includes(e.key);
    if (!forward && !backward) return;
    e.preventDefault();
    goTo(active + (forward ? 1 : -1));
  }, {capture:true});

  const floaters = [...document.querySelectorAll('.floating-ui,.module-card,.review-card')].map((el,i) => ({
    el,
    amp: 2.2 + (i % 4) * .9,
    speed: .00052 + (i % 5) * .000075,
    phase: i * 1.31,
    rot: .12 + (i % 3) * .05
  }));

  const floatLoop = t => {
    if (!reduce) {
      for (const item of floaters) {
        const {el,amp,speed,phase,rot} = item;
        if (el.matches(':hover')) continue;
        const y = Math.sin(t * speed + phase) * amp;
        const r = Math.sin(t * speed * .72 + phase) * rot;
        el.style.translate = '0 ' + y.toFixed(2) + 'px';
        el.style.rotate = r.toFixed(2) + 'deg';
      }
    }
    requestAnimationFrame(floatLoop);
  };
  requestAnimationFrame(floatLoop);

  window.addEventListener('dp:scene', e => {
    document.body.dataset.mode = e.detail.mode;
  });

  sections.forEach(s => s.classList.remove('is-active','is-leaving'));
  active = 0;
  sections[0].classList.add('is-active');
  setMode(0);
  updateChrome();

  window.DPCinematic = {
    goTo,
    next: () => goTo(active + 1),
    previous: () => goTo(active - 1),
    get active() { return active; },
    get total() { return sections.length; }
  };
})();
