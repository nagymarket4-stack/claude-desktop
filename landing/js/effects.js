// ─── Efectos visuales y micro-interacciones de la landing ─────────────────────

// 1) Menú móvil
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
}

// 2) Contadores animados (se disparan al entrar en viewport)
const fmt = n => n.toLocaleString('es-ES');
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const dur = 1600; const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(target * eased)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const countIO = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); } });
}, { threshold: 0.4 });
document.querySelectorAll('[data-count]').forEach(el => countIO.observe(el));

// 3) Toggle de facturación mensual / anual
const billing = document.getElementById('billing-toggle');
if (billing) {
  billing.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      billing.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const anual = btn.dataset.cycle === 'anual';
      document.querySelectorAll('.amt').forEach(a => {
        a.textContent = anual ? a.dataset.a : a.dataset.m;
      });
    });
  });
}

// 4) Parallax / tilt suave del mockup del hero (solo escritorio con puntero fino)
const finePointer = window.matchMedia('(pointer:fine)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
if (finePointer && !reduceMotion) {
  const scene = document.querySelector('.scene');
  const mockup = document.querySelector('[data-parallax]');
  if (scene && mockup) {
    scene.addEventListener('mousemove', (e) => {
      const r = scene.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      mockup.style.transform = `rotateY(${-9 + x * 8}deg) rotateX(${6 - y * 8}deg)`;
    });
    scene.addEventListener('mouseleave', () => { mockup.style.transform = ''; });
  }
}
