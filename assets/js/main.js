/* ============================================================
   VASILIKI RACE — Main UI
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  initI18n();
  setActiveNavLink();
});

/* Sticky nav */
function initNav() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');

  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  hamburger?.addEventListener('click', () => {
    const open = mobileNav?.classList.toggle('open');
    hamburger.classList.toggle('open', open);
  });

  mobileNav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger?.classList.remove('open');
    });
  });
}

/* Scroll-reveal */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

/* Highlight current page link */
function setActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href')?.split('/').pop();
    a.classList.toggle('active', href === page);
  });
}

/* Smooth counter animation for stats */
function animateCounter(el, end, duration = 1200) {
  if (!end || isNaN(end)) return;
  let start = 0;
  const step = (end / duration) * 16;
  const timer = setInterval(() => {
    start += step;
    if (start >= end) { el.textContent = end; clearInterval(timer); return; }
    el.textContent = Math.floor(start);
  }, 16);
}

/* Countdown to race */
function initCountdown(targetDate, containerId) {
  const el = document.getElementById(containerId);
  if (!el || !targetDate) return;
  function update() {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) { el.textContent = 'Race day!'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `<span>${d}d</span> <span>${h}h</span> <span>${m}m</span> <span>${s}s</span>`;
  }
  update();
  setInterval(update, 1000);
}
