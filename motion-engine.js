(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(pointer:coarse)').matches;
  const sections = [...document.querySelectorAll('.scene-section')];
  if (!sections.length || reduce) return;

  root.classList.add('cinematic-paging');

  const nav = document.createElement('nav');
  nav.className = 'cinematic-nav';
  nav.setAttribute('aria-label', 'Scene navigation');
  sections.forEach((section, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = section.dataset.mode || `Scene ${i + 1}`;
    b.setAttribute('aria-label', `Go to ${section.dataset.mode || `scene ${i + 1}`}`);
    b.addEventListener('click', () => goTo(i));
    nav.appendChild(b);
  });
  document.body.appendChild(nav);

  const index = document.createElement('div');
  index.className = 'scene-index';
  index.innerHTML = '<span>01</span><i></i><span>SCENE</span>';
  document.body.appendChild(index);

  const hint = document.createElement('div');
  hint.className = 'cinematic-hint';
  hint.textContent = touch ? 'SWIPE / DRAG TO MOVE SCENES' : 'SWIPE TRACKPAD / WHEEL TO MOVE SCENES';
  document.body.appendChild(hint);

  let active = 0;
  let locked = false;
  let wheelAccum = 0;
  let wheelTimer = 0;
  let touchStartY = 0;
  let touchStartX = 0;
  let lastSceneChange = 0;

  const setActive = i => {
    active = Math.max(0, Math.min(sections.length - 1, i));
    nav.querySelectorAll('button').forEach((b, n) => b.setAttribute('aria-current', String(n === active)));
    const n = String(active + 1).padStart(2, '0');
    index.querySelector('span').textContent = n;
  };

  const goTo = (i) => {
    const next = Math.max(0, Math.min(sections.length - 1, i));
    if (next === active && locked) return;
    locked = true;
    lastSceneChange = performance.now();
    root.classList.add('is-jumping');
    setActive(next);
    if (window.DPLenis) window.DPLenis.scrollTo(sections[next], {duration:.82, lock:true, force:true}); else sections[next].scrollIntoView({behavior:'smooth', block:'start'});
    window.setTimeout(() => { locked = false; root.classList.remove('is-jumping'); }, 820);
  };

  const shouldIgnore = e => {
    const t = e.target;
    if (!t) return false;
    if (t.closest('input,textarea,select,button,a,[contenteditable="true"],#aiPanel')) return true;
    return false;
  };

  window.addEventListener('wheel', e => {
    if (shouldIgnore(e) || sections.length < 2) return;
    const now = performance.now();
    if (now - lastSceneChange < 620) { e.preventDefault(); return; }
    e.preventDefault();
    wheelAccum += e.deltaY;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelAccum = 0; }, 90);
    const threshold = Math.max(32, Math.min(95, 62 * (window.devicePixelRatio || 1)));
    if (!locked && Math.abs(wheelAccum) >= threshold) {
      const dir = wheelAccum > 0 ? 1 : -1;
      wheelAccum = 0;
      goTo(active + dir);
    }
  }, {passive:false});

  window.addEventListener('touchstart', e => {
    if (!e.touches[0]) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }, {passive:true});

  window.addEventListener('touchend', e => {
    if (shouldIgnore(e) || locked || !e.changedTouches[0]) return;
    const dy = touchStartY - e.changedTouches[0].clientY;
    const dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.max(Math.abs(dy), Math.abs(dx)) < 55) return;
    goTo(active + (Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 1 : -1) : (dx > 0 ? 1 : -1)));
  }, {passive:true});

  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
    if (!visible || locked) return;
    const i = sections.indexOf(visible.target);
    if (i >= 0) setActive(i);
  }, {threshold:[.55,.75,.9]});
  sections.forEach(s => observer.observe(s));

  // Continuous micro-motion for cards. One RAF loop keeps the whole UI on a single compositor clock.
  const floaters = [...document.querySelectorAll('.floating-ui,.module-card,.review-card')].map((el,i) => ({
    el, amp:3 + (i % 4) * 1.5, speed:.00065 + (i % 5) * .00011, phase:i * 1.17
  }));
  floaters.forEach(({el}) => {
    el.classList.add('motion-controlled');
    el.addEventListener('pointerenter', () => el.classList.add('tilt-active'), {passive:true});
    el.addEventListener('pointerleave', () => el.classList.remove('tilt-active'), {passive:true});
  });
  const floatLoop = t => {
    for (const item of floaters) {
      const {el,amp,speed,phase}=item;
      if (!el.matches(':hover') && !el.classList.contains('tilt-active')) {
        el.style.translate = `0 ${(Math.sin(t*speed+phase)*amp).toFixed(2)}px`;
        el.style.rotate = `${(Math.sin(t*speed*.72+phase)*.42).toFixed(2)}deg`;
      }
    }
    requestAnimationFrame(floatLoop);
  };
  requestAnimationFrame(floatLoop);

  const fine = window.matchMedia('(pointer:fine)').matches;
  const stage = document.querySelector('.webgl-stage');
  const pointer = {x:0,y:0,tx:0,ty:0};
  if (fine && stage) {
    window.addEventListener('pointermove', e => {
      pointer.tx = (e.clientX / innerWidth - .5);
      pointer.ty = (e.clientY / innerHeight - .5);
    }, {passive:true});
    const move = () => {
      pointer.x += (pointer.tx-pointer.x)*.035;
      pointer.y += (pointer.ty-pointer.y)*.035;
      stage.style.transform = `translate3d(${(pointer.x*7).toFixed(2)}px,${(pointer.y*4).toFixed(2)}px,0)`;
      requestAnimationFrame(move);
    };
    requestAnimationFrame(move);
  }

  setActive(0);
  window.DPCinematic = {goTo, get active(){return active;}};
})();