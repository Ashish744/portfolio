/* ==========================================================================
   animations.js — GSAP + ScrollTrigger driven animation engine
   Reads data-reveal / data-split attributes so every heading across the
   site can use a different animation without bespoke per-page JS.
   ========================================================================== */

(function(){
  if(typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- text splitting ---------- */
  function splitText(el){
    const type = el.dataset.split || 'none';
    if(type === 'none' || el.dataset.splitDone) return el.dataset.splitDone ? Array.from(el.querySelectorAll('.u-split-item')) : [el];
    const raw = el.textContent.trim();
    el.setAttribute('aria-label', raw);
    el.textContent = '';
    el.dataset.splitDone = '1';
    const items = [];

    if(type === 'chars'){
      raw.split('').forEach(ch=>{
        const s = document.createElement('span');
        s.className = 'u-split-item';
        s.style.display = 'inline-block';
        s.textContent = ch === ' ' ? '\u00A0' : ch;
        el.appendChild(s);
        items.push(s);
      });
    } else if(type === 'words'){
      raw.split(' ').forEach((w, i, arr)=>{
        const s = document.createElement('span');
        s.className = 'u-split-item';
        s.style.display = 'inline-block';
        s.textContent = w;
        el.appendChild(s);
        items.push(s);
        if(i < arr.length - 1) el.appendChild(document.createTextNode('\u00A0'));
      });
    } else if(type === 'lines'){
      raw.split('|').map(l=>l.trim()).filter(Boolean).forEach(line=>{
        const wrap = document.createElement('span');
        wrap.style.cssText = 'display:block;overflow:hidden';
        const inner = document.createElement('span');
        inner.className = 'u-split-item';
        inner.style.display = 'inline-block';
        inner.textContent = line;
        wrap.appendChild(inner);
        el.appendChild(wrap);
        items.push(inner);
      });
    }
    return items;
  }

  const PRESETS = {
    'fade-up':    { from:{y:46, opacity:0},                          to:{y:0, opacity:1} },
    'fade-down':  { from:{y:-46, opacity:0},                         to:{y:0, opacity:1} },
    'fade-left':  { from:{x:-56, opacity:0},                         to:{x:0, opacity:1} },
    'fade-right': { from:{x:56, opacity:0},                          to:{x:0, opacity:1} },
    'blur':       { from:{opacity:0, filter:'blur(16px)'},           to:{opacity:1, filter:'blur(0px)'} },
    'clip':       { from:{clipPath:'inset(0 0 100% 0)'},             to:{clipPath:'inset(0 0 0% 0)'}, ease:'power4.inOut' },
    'scale':      { from:{scale:.86, opacity:0},                     to:{scale:1, opacity:1} },
    'rotate':     { from:{rotate:-7, y:28, opacity:0},                to:{rotate:0, y:0, opacity:1} },
    'elastic':    { from:{y:60, opacity:0},                          to:{y:0, opacity:1}, ease:'elastic.out(1,.65)', dur:1.3 },
    'mask':       { from:{yPercent:110},                             to:{yPercent:0}, ease:'power4.out' },
    'tracking':   { from:{opacity:0, letterSpacing:'.35em'},         to:{opacity:1, letterSpacing:'normal'} },
  };

  function initReveals(){
    document.querySelectorAll('[data-reveal]').forEach(el=>{
      const type = el.dataset.reveal;
      const items = splitText(el);

      if(type === 'typewriter'){
        gsap.set(items, {opacity:0});
        ScrollTrigger.create({
          trigger: el, start:'top 85%', once:true,
          onEnter: ()=> gsap.to(items, {opacity:1, duration:.01, stagger:.032})
        });
        return;
      }

      const preset = PRESETS[type] || PRESETS['fade-up'];
      const splitType = el.dataset.split || 'none';
      const stagger = parseFloat(el.dataset.stagger) || (splitType==='chars'?0.018 : splitType==='words'?0.05 : splitType==='lines'?0.12 : 0.08);
      const delay = parseFloat(el.dataset.delay) || 0;

      gsap.set(items, preset.from);
      ScrollTrigger.create({
        trigger: el, start:'top 88%', once:true,
        onEnter: ()=> gsap.to(items, {
          ...preset.to, duration: preset.dur || 1, ease: preset.ease || 'power3.out', stagger, delay
        })
      });
    });
  }

  /* ---------- counters ---------- */
  function initCounters(){
    document.querySelectorAll('[data-counter]').forEach(el=>{
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      const obj = {val:0};
      ScrollTrigger.create({
        trigger: el, start:'top 92%', once:true,
        onEnter: ()=> gsap.to(obj, {
          val: target, duration: 1.8, ease:'power2.out',
          onUpdate: ()=> el.textContent = Math.floor(obj.val) + suffix
        })
      });
    });
  }

  /* ---------- vertical timeline progress ---------- */
  function initTimeline(){
    const line = document.querySelector('.timeline-line i');
    const wrap = document.querySelector('.timeline');
    if(!line || !wrap) return;
    gsap.fromTo(line, {height:'0%'}, {
      height:'100%', ease:'none',
      scrollTrigger:{ trigger: wrap, start:'top 65%', end:'bottom 75%', scrub:.4 }
    });
  }

  /* ---------- horizontal pinned process ---------- */
  function initProcessPin(){
    const pin = document.querySelector('.process-pin');
    const track = document.querySelector('.process-track');
    const progress = document.querySelector('.process-progress i');
    if(!pin || !track) return;
    const getLen = () => Math.max(track.scrollWidth - window.innerWidth + 120, 10);
    gsap.to(track, {
      x: () => -getLen(),
      ease:'none',
      scrollTrigger:{
        trigger: pin, start:'top top', end: () => '+=' + getLen(),
        scrub:.6, pin:true, invalidateOnRefresh:true, anticipatePin:1,
        onUpdate: self => { if(progress) progress.style.width = (self.progress*100)+'%'; }
      }
    });
  }

  /* ---------- hero entrance ---------- */
  function initHero(){
    const hero = document.querySelector('.hero');
    if(!hero) return;
    const lines = hero.querySelectorAll('.hero-title .line span');
    const titleEl = hero.querySelector('.hero-title');

    // only feed GSAP targets that actually exist (keeps the console warning-free)
    const q = sel => { const els = [...hero.querySelectorAll(sel)]; return els.length ? els : null; };
    const step = (tl, sel, vars, pos) => { const t = q(sel); if(t) tl.from(t, vars, pos); };

    const run = () => {
      const tl = gsap.timeline({delay:.1});
      if(lines.length){
        // inner pages: pre-split display lines sweep up
        gsap.set(lines, {yPercent:120, opacity:0, filter:'blur(12px)'});
        tl.to(lines, {yPercent:0, opacity:1, filter:'blur(0px)', duration:1.15, ease:'power4.out', stagger:.09});
      } else if(titleEl){
        // home: title is slider-driven, so animate it as a single block
        tl.from(titleEl, {y:40, opacity:0, filter:'blur(12px)', duration:1.1, ease:'power4.out'});
      }
      step(tl, '.hero-kicker', {y:16, opacity:0, duration:.7, ease:'power3.out'}, '-=.75');
      step(tl, '.hero-desc, .hero-description', {y:18, opacity:0, duration:.7, ease:'power3.out'}, '-=.55');
      step(tl, '.hero-actions', {y:18, opacity:0, duration:.7, ease:'power3.out'}, '-=.5');
      step(tl, '.hero-side', {opacity:0, scale:.92, duration:1, ease:'power3.out'}, '-=.9');
      step(tl, '.hero-float-card', {y:24, opacity:0, duration:.7, ease:'back.out(1.7)'}, '-=.4');
      step(tl, '.hero-dots', {opacity:0, duration:.5}, '-=.4');
      const si = document.querySelector('.scroll-indicator');
      if(si) tl.from(si, {opacity:0, duration:.6}, '-=.3');
    };

    if(document.getElementById('loader')) window.addEventListener('loaderComplete', run, {once:true});
    else run();
  }

  /* ---------- hero slider: text + image change together every 4000ms ----------
     Slides are declared per page in a <script type="application/json"
     class="hero-slides"> block inside the hero, so every page owns its own
     content and this function stays generic.

     SCOPING NOTE: only elements inside `.hero` are touched, addressed via
     dedicated classes (.hero-image / .hero-title / .hero-description /
     .hero-cta). No bare `img` selector is ever used, so the navbar logo
     (.navbar-logo) can never be modified by the slider. */
  function initHeroSlider(){
    const hero = document.querySelector('.hero');
    if(!hero) return;

    const dataEl = hero.querySelector('.hero-slides');
    if(!dataEl) return;

    let slides = [];
    try{
      slides = JSON.parse(dataEl.textContent);
    }catch(err){
      return; // malformed slide data: leave the static hero exactly as authored
    }
    if(!Array.isArray(slides) || slides.length < 2) return;

    const titleEl = hero.querySelector('.hero-title');
    const descEl  = hero.querySelector('.hero-description');
    const ctaEl   = hero.querySelector('.hero-cta');
    const imgEl   = hero.querySelector('.hero-image');
    const dots    = hero.querySelectorAll('.hero-dot');
    if(!titleEl || !descEl || !imgEl) return;

    const INTERVAL = 4000;   // hold each slide for 4s, per spec
    let index = 0;
    let timer = null;
    let tl = null;

    function paint(i){
      const s = slides[i];
      titleEl.innerHTML = s.title;
      descEl.textContent = s.desc;
      if(ctaEl && s.cta) ctaEl.textContent = s.cta;
      imgEl.src = s.img;
      imgEl.alt = s.alt || '';
      dots.forEach((d, di)=>{
        const on = di === i;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-selected', String(on));
      });
    }

    function transitionTo(i){
      if(tl) tl.kill();
      const copy = [titleEl, descEl, ctaEl].filter(Boolean);
      tl = gsap.timeline({defaults:{ease:'power2.inOut'}});
      // 1-2. current copy drifts out, image softly blurs + zooms out
      tl.to(copy, {opacity:0, y:-22, filter:'blur(6px)', duration:.75, stagger:.06})
        .to(imgEl, {opacity:0, scale:1.08, filter:'blur(10px)', duration:.85}, '<')
        .call(()=>paint(i))
        // 3-4. new copy eases in, image crossfades back to sharp
        .fromTo(copy,
          {opacity:0, y:26, filter:'blur(8px)'},
          {opacity:1, y:0, filter:'blur(0px)', duration:1.05, ease:'power3.out', stagger:.1})
        .fromTo(imgEl,
          {opacity:0, scale:1.12, filter:'blur(12px)'},
          {opacity:1, scale:1, filter:'blur(0px)', duration:1.35, ease:'power3.out'}, '<');
    }

    function goTo(i){
      index = (i + slides.length) % slides.length;
      transitionTo(index);
    }
    const next = () => goTo(index + 1);

    function start(){ stop(); timer = setInterval(next, INTERVAL); }
    function stop(){ if(timer) clearInterval(timer); timer = null; }

    dots.forEach((d, i)=> d.addEventListener('click', ()=>{ goTo(i); start(); }));

    // pause while the visitor is reading / interacting
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', ()=> document.hidden ? stop() : start());

    // Slide 0's content is already correct in the server-rendered HTML — the
    // markup was authored to match it exactly. Repainting it here would swap
    // out the very DOM nodes initHero() is about to animate, before that
    // animation ever gets a chance to render (title would just pop in
    // instantly with no reveal). So on first load we only sync the dots;
    // real repaints start from the first rotation onward.
    dots.forEach((d, di)=>{
      const on = di === 0;
      d.classList.toggle('is-active', on);
      d.setAttribute('aria-selected', String(on));
    });
    if(REDUCE_MOTION) return;  // motion-sensitive users keep a static hero

    const begin = () => setTimeout(start, 1200);
    if(document.getElementById('loader')) window.addEventListener('loaderComplete', begin, {once:true});
    else begin();
  }

  /* ---------- hero parallax shape ---------- */
  function initHeroParallax(){
    const shape = document.querySelector('.hero-bg-shape');
    if(!shape || IS_TOUCH) return;
    window.addEventListener('mousemove', e=>{
      gsap.to(shape, {
        x:(e.clientX/window.innerWidth - .5)*50,
        y:(e.clientY/window.innerHeight - .5)*50,
        duration:1.3, ease:'power3.out'
      });
    });
  }

  /* ---------- project row cursor thumbnail ---------- */
  function initProjectThumb(){
    const thumb = document.querySelector('.project-thumb');
    const rows = document.querySelectorAll('.project-row');
    if(!thumb || !rows.length || IS_TOUCH) return;
    const img = thumb.querySelector('.project-thumb-img');
    if(!img) return;

    // never let the preview drift up into the navbar band
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
    const safeTop = navH + 90; // thumb is centre-anchored, so add half its height

    function hide(instant){
      gsap.killTweensOf(thumb);
      if(instant){
        gsap.set(thumb, {opacity:0, visibility:'hidden'});
      }else{
        gsap.to(thumb, {opacity:0, scale:.9, duration:.3, onComplete:()=> gsap.set(thumb, {visibility:'hidden'})});
      }
    }

    rows.forEach(row=>{
      row.addEventListener('mouseenter', e=>{
        if(row.dataset.image) img.src = row.dataset.image;
        gsap.killTweensOf(thumb);
        // position is set INSTANTLY, in the same frame as becoming visible —
        // this is what actually prevents the stray top-left flash, since the
        // element can never be visible without a valid position already applied.
        const y = Math.max(e.clientY, safeTop);
        gsap.set(thumb, {x:e.clientX, y, visibility:'visible'});
        gsap.to(thumb, {opacity:1, scale:1, duration:.4, ease:'power3.out'});
      });
      row.addEventListener('mouseleave', ()=> hide(false));
      row.addEventListener('mousemove', e=>{
        if(e.clientY < navH){ hide(true); return; }
        gsap.to(thumb, {x:e.clientX, y:Math.max(e.clientY, safeTop), duration:.6, ease:'power3.out'});
      });
    });

    // failsafes: never leave the preview stuck visible under any circumstance
    document.addEventListener('mouseleave', ()=> hide(true));
    window.addEventListener('blur', ()=> hide(true));
    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) hide(true); });
    window.addEventListener('scroll', ()=> hide(true), {passive:true});
  }

  /* ---------- linear skill bars ---------- */
  function initSkillBars(){
    document.querySelectorAll('.skill-bar-track i[data-width]').forEach(bar=>{
      const w = bar.dataset.width;
      ScrollTrigger.create({
        trigger: bar, start:'top 92%', once:true,
        onEnter: ()=> gsap.to(bar, {width: w + '%', duration:1.3, ease:'power2.out'})
      });
    });
  }

  /* ---------- skill rings ---------- */
  function initSkillRings(){
    document.querySelectorAll('.ring-progress').forEach(svg=>{
      const circle = svg.querySelector('circle.bar');
      if(!circle) return;
      const percent = parseFloat(svg.dataset.percent) || 80;
      const r = circle.r.baseVal.value;
      const c = 2*Math.PI*r;
      circle.style.strokeDasharray = c;
      circle.style.strokeDashoffset = c;
      ScrollTrigger.create({
        trigger: svg, start:'top 92%', once:true,
        onEnter: ()=> gsap.to(circle, {strokeDashoffset: c - (percent/100)*c, duration:1.5, ease:'power2.out'})
      });
    });
  }

  /* ---------- testimonial expand ---------- */
  function initTestimonials(){
    document.querySelectorAll('.testimonial-item').forEach(item=>{
      item.setAttribute('role','button');
      item.setAttribute('tabindex','0');
      const toggle = () => item.classList.toggle('is-open');
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
    });
  }

  /* ---------- flip cards: click support for touch ---------- */
  function initFlipCards(){
    document.querySelectorAll('.flip-card').forEach(card=>{
      card.addEventListener('click', ()=>{ if(IS_TOUCH) card.classList.toggle('is-flipped'); });
    });
  }

  /* ---------- floating decorative cards ---------- */
  function initFloaters(){
    if(REDUCE_MOTION) return;
    document.querySelectorAll('[data-float]').forEach((el,i)=>{
      gsap.to(el, {
        y: parseFloat(el.dataset.float) || 14,
        duration: 3 + (i%3),
        ease:'sine.inOut', repeat:-1, yoyo:true, delay: i*.15
      });
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    initReveals();
    initCounters();
    initTimeline();
    initProcessPin();
    initHero();
    initHeroSlider();
    initHeroParallax();
    initProjectThumb();
    initSkillRings();
    initSkillBars();
    initTestimonials();
    initFlipCards();
    initFloaters();
    ScrollTrigger.refresh();
  });

  window.addEventListener('load', ()=> ScrollTrigger.refresh());
})();
