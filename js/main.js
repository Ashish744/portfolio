/* ==========================================================================
   main.js — navbar, mobile menu, cursor, magnetic buttons, marquee,
   loader orchestration, lightweight page transitions
   ========================================================================== */

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_TOUCH = window.matchMedia('(hover:none)').matches || window.innerWidth < 861;

/* ---------- active nav link ---------- */
(function markActiveNav(){
  const path = (location.pathname.split('/').pop() || 'index.html').split('?')[0].split('#')[0];
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a=>{
    const href = (a.getAttribute('href') || '').split('?')[0].split('#')[0];
    const isCurrent = href === path || (path === '' && href === 'index.html');
    a.classList.toggle('is-active', isCurrent);
    if(isCurrent) a.setAttribute('aria-current', 'page');
  });
})();

/* ---------- navbar scroll state ---------- */
(function navbarScroll(){
  const nav = document.querySelector('.navbar');
  if(!nav) return;
  const onScroll = () => {
    if(window.scrollY > 30) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});
})();

/* ---------- mobile menu ---------- */
(function mobileMenu(){
  const btn = document.querySelector('.hamburger');
  const menu = document.querySelector('.mobile-menu');
  if(!btn || !menu) return;
  btn.addEventListener('click', ()=>{
    const open = btn.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
    btn.classList.remove('is-open');
    menu.classList.remove('is-open');
    document.body.style.overflow = '';
  }));
})();

/* ---------- custom cursor ---------- */
(function customCursor(){
  if(IS_TOUCH) return;
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if(!dot || !ring) return;

  let mx=innerWidth/2, my=innerHeight/2, rx=mx, ry=my;
  window.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; dot.style.left=mx+'px'; dot.style.top=my+'px'; });

  function loop(){
    rx += (mx-rx)*0.16; ry += (my-ry)*0.16;
    ring.style.left = rx+'px'; ring.style.top = ry+'px';
    requestAnimationFrame(loop);
  }
  loop();

  const hoverables = 'a, button, .magnetic, input, textarea, [data-cursor-hover]';
  document.addEventListener('mouseover', e=>{
    if(e.target.closest(hoverables)) ring.classList.add('is-active');
  });
  document.addEventListener('mouseout', e=>{
    if(e.target.closest(hoverables)) ring.classList.remove('is-active');
  });
})();

/* ---------- magnetic buttons ---------- */
(function magnetic(){
  if(IS_TOUCH || REDUCE_MOTION) return;
  document.querySelectorAll('[data-magnetic]').forEach(el=>{
    const strength = 0.35;
    el.addEventListener('mousemove', e=>{
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width/2) * strength;
      const y = (e.clientY - r.top - r.height/2) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mouseleave', ()=>{ el.style.transform = 'translate(0,0)'; });
  });
})();

/* ---------- hover spotlight (skills / cards) ---------- */
(function spotlight(){
  if(IS_TOUCH) return;
  document.querySelectorAll('[data-spotlight]').forEach(el=>{
    el.addEventListener('mousemove', e=>{
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX-r.left)+'px');
      el.style.setProperty('--my', (e.clientY-r.top)+'px');
    });
  });
})();

/* ---------- marquee: build + pause on hover ---------- */
(function marquee(){
  document.querySelectorAll('.marquee-wrap').forEach((wrap, i)=>{
    const track = wrap.querySelector('.marquee-track');
    if(!track) return;
    // duplicate content for seamless loop
    track.innerHTML += track.innerHTML;
    const duration = wrap.dataset.speed || (28 + i*10);
    track.style.animation = `marquee-scroll ${duration}s linear infinite`;
    wrap.addEventListener('mouseenter', ()=>wrap.classList.add('is-paused'));
    wrap.addEventListener('mouseleave', ()=>wrap.classList.remove('is-paused'));
  });
  const styleTag = document.createElement('style');
  styleTag.textContent = `@keyframes marquee-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`;
  document.head.appendChild(styleTag);
})();

/* ---------- loader (index.html only, bento grid) ---------- */
(function loader(){
  const el = document.getElementById('loader');
  if(!el) { document.body.classList.add('is-ready'); return; }

  if(REDUCE_MOTION || typeof gsap === 'undefined'){
    el.style.display = 'none';
    document.body.classList.add('is-ready');
    return;
  }

  const cells = el.querySelectorAll('.bento i');
  const word = el.querySelector('.loader-word');
  const tl = gsap.timeline({
    onComplete: ()=>{
      el.style.display = 'none';
      document.body.classList.add('is-ready');
      window.dispatchEvent(new Event('loaderComplete'));
    }
  });
  tl.to(cells, { opacity:1, scale:1, duration:.5, stagger:{amount:.9, from:'random'}, ease:'back.out(2)' })
    .to(word, { opacity:1, duration:.4 }, '-=.5')
    .to(word, { opacity:0, duration:.3 }, '+=.4')
    .to(cells, { scale:.3, rotation:15, opacity:0, duration:.5, stagger:{amount:.5, from:'random'}, ease:'power2.in' }, '-=.1')
    .to(el, { autoAlpha:0, duration:.5 }, '-=.2');
})();

/* ---------- page transition overlay on internal nav ---------- */
(function pageTransitions(){
  const overlay = document.getElementById('page-transition');
  if(!overlay || typeof gsap === 'undefined' || REDUCE_MOTION) return;

  document.addEventListener('click', e=>{
    const a = e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || a.target === '_blank') return;
    if(!href.endsWith('.html')) return;

    e.preventDefault();
    gsap.set(overlay, { yPercent: 101 });
    gsap.to(overlay, {
      yPercent: 0, duration:.5, ease:'power3.inOut',
      onComplete: ()=>{ window.location.href = href; }
    });
  });

  gsap.set(overlay, { yPercent: 101 });
})();

/* ---------- accordion (experience / faq / expandable service cards) ---------- */
(function accordions(){
  document.querySelectorAll('.accordion-trigger').forEach(trigger=>{
    trigger.addEventListener('click', ()=>{
      trigger.closest('.accordion-item').classList.toggle('is-open');
    });
  });
})();

/* ---------- blog category filter ---------- */
(function blogFilter(){
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.blog-card');
  if(!filterBtns.length || !cards.length) return;
  filterBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      filterBtns.forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const cat = btn.dataset.filter;
      cards.forEach(card=>{
        const show = cat === 'all' || card.dataset.category === cat;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });
})();

/* ---------- 404 particles + mouse tilt ---------- */
(function errorPage(){
  const wrap = document.querySelector('.error-particles');
  if(wrap){
    for(let i=0;i<36;i++){
      const p = document.createElement('i');
      p.style.top = Math.random()*100+'%';
      p.style.left = Math.random()*100+'%';
      p.style.opacity = (0.15 + Math.random()*0.5).toFixed(2);
      p.style.transform = `scale(${(0.6+Math.random()*1.8).toFixed(2)})`;
      wrap.appendChild(p);
    }
    if(typeof gsap !== 'undefined' && !REDUCE_MOTION){
      gsap.to(wrap.children, {
        y: () => gsap.utils.random(-30,30), x: () => gsap.utils.random(-30,30),
        duration: () => gsap.utils.random(3,6), repeat:-1, yoyo:true, ease:'sine.inOut',
        stagger: {each:0.03, from:'random'}
      });
    }
  }
  const code = document.querySelector('.error-code');
  if(code && !IS_TOUCH){
    code.addEventListener('mousemove', e=>{
      const r = code.getBoundingClientRect();
      const rx = ((e.clientY - r.top)/r.height - .5) * -10;
      const ry = ((e.clientX - r.left)/r.width - .5) * 10;
      code.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    code.addEventListener('mouseleave', ()=>{ code.style.transform = 'perspective(800px) rotateX(0) rotateY(0)'; });
  }
})();

/* ---------- footer year ---------- */
document.querySelectorAll('[data-year]').forEach(el=> el.textContent = new Date().getFullYear());
