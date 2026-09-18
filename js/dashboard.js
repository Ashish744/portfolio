/* ==========================================================================
   dashboard.js — sidebar, profile menu, chart animation, 404 action routing
   ========================================================================== */

(function(){
  const storedEmail = localStorage.getItem('stacklyUserEmail');
  const profileName = document.querySelector('.dash-profile-btn .name strong');
  if(storedEmail && profileName) profileName.textContent = storedEmail;

  const sidebar = document.querySelector('.dash-sidebar');
  const toggle = document.querySelector('.dash-sidebar-toggle');
  const overlay = document.querySelector('.dash-sidebar-overlay');

  if(toggle && sidebar){
    toggle.addEventListener('click', ()=>{
      sidebar.classList.toggle('is-open');
      overlay && overlay.classList.toggle('is-open');
    });
  }
  if(overlay && sidebar){
    overlay.addEventListener('click', ()=>{
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
    });
  }

  const profileBtn = document.querySelector('.dash-profile-btn');
  const profileMenu = document.querySelector('.dash-profile-menu');
  if(profileBtn && profileMenu){
    profileBtn.addEventListener('click', e=>{
      e.stopPropagation();
      profileMenu.classList.toggle('is-open');
    });
    document.addEventListener('click', ()=> profileMenu.classList.remove('is-open'));
  }

  const adminViewMap = {projects:'admin-projects',messages:'admin-messages',analytics:'admin-analytics',users:'admin-users',settings:'admin-settings',activity:'admin-activity'};
  document.querySelectorAll('.dash-sidebar .dash-nav a[href^="#admin-"]').forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault();
      const view = link.getAttribute('href').replace('#admin-', '');
      window.location.href = `admin-dashboard.html?view=${view}`;
    });
  });
  const requestedView = new URLSearchParams(window.location.search).get('view') || window.location.hash.replace('#admin-', '');
  const adminMain = document.querySelector('.dash-admin');
  const requestedTarget = adminViewMap[requestedView];
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.dash-sidebar .dash-nav a').forEach(link=>{
    const linkUrl = new URL(link.href, window.location.href);
    const isCurrentPage = linkUrl.pathname.split('/').pop() === currentPage;
    link.classList.toggle('is-active', requestedTarget ? link.href.includes(`view=${requestedView}`) : isCurrentPage);
  });
  if(adminMain && requestedTarget){
    const viewItems = Array.from(adminMain.querySelectorAll('[data-admin-view]')).filter(item=> item.dataset.adminView === requestedView);
    if(viewItems.length){
      Array.from(adminMain.children).forEach(child=>{
        if(!child.classList.contains('dash-head')){
          child.style.display = viewItems.some(item=> child === item || child.contains(item)) ? '' : 'none';
        }
      });
      adminMain.querySelectorAll('.dash-panels').forEach(group=>{
        group.querySelectorAll(':scope > .dash-panel[data-admin-view]').forEach(panel=>{
          panel.style.display = panel.dataset.adminView === requestedView ? '' : 'none';
        });
      });
      const pageHeading = adminMain.querySelector('.dash-head h1');
      if(pageHeading) pageHeading.textContent = requestedView.charAt(0).toUpperCase() + requestedView.slice(1);
    }
  }

  /* any non-anchor dashboard control (icon buttons, row actions) routes to 404 */
  document.querySelectorAll('[data-goto-404]').forEach(el=>{
    el.addEventListener('click', ()=>{ window.location.href = '404.html'; });
  });

  function animateCharts(){
    document.querySelectorAll('.chart-bars .bar i').forEach(bar=>{
      const val = bar.dataset.value || 0;
      requestAnimationFrame(()=> bar.style.height = val + '%');
    });
    document.querySelectorAll('.chart-donut').forEach(donut=>{
      const target = parseFloat(donut.dataset.value) || 0;
      let cur = 0;
      const tick = () => {
        cur = Math.min(cur + 2, target);
        donut.style.setProperty('--p', cur);
        if(cur < target) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    document.querySelectorAll('.progress-track i').forEach(bar=>{
      const val = bar.dataset.value || 0;
      requestAnimationFrame(()=> bar.style.width = val + '%');
    });
  }

  document.addEventListener('DOMContentLoaded', ()=> setTimeout(animateCharts, 350));

  /* floating cards + gentle hover lift for dashboard panels */
  if(typeof gsap !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.querySelectorAll('.dash-card, .dash-panel').forEach((card, i)=>{
      gsap.from(card, {
        y: 22, opacity: 0, duration: .7, ease:'power3.out', delay: i * 0.05,
        scrollTrigger: typeof ScrollTrigger !== 'undefined' ? { trigger: card, start:'top 95%', once:true } : undefined
      });
    });
  }
})();
