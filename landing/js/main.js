// ─── Interacciones de la landing ──────────────────────────────────────────────

// Nav glass al hacer scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll); onScroll();

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// FAQ acordeón
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.addEventListener('click', () => {
    const open = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = null; });
    if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
  });
});

// Elegir plan desde precios → preselecciona en el formulario y baja al contacto
function elegirPlan(plan) {
  const sel = document.getElementById('lead-plan');
  if (sel) sel.value = plan;
  document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
}

// Envío del formulario de lead
const form = document.getElementById('lead-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('lead-msg');
  const btn = document.getElementById('lead-submit');
  const datos = Object.fromEntries(new FormData(form).entries());

  if (!datos.nombre || !datos.email) {
    mostrarMsg('Por favor, completa tu nombre y email.', 'err'); return;
  }

  btn.disabled = true; btn.textContent = 'Enviando…';
  try {
    if (typeof enviarLead === 'function') await enviarLead(datos);
    form.reset();
    mostrarMsg('¡Gracias! Hemos recibido tu solicitud. Te contactaremos en menos de 24h. 🎉', 'ok');
  } catch (err) {
    mostrarMsg('No se pudo enviar (¿conexión?). Escríbenos a hola@guardialia.com', 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Solicitar prueba gratis';
  }
});

function mostrarMsg(texto, tipo) {
  const msg = document.getElementById('lead-msg');
  msg.textContent = texto;
  msg.className = tipo === 'ok'
    ? 'text-sm rounded-xl px-4 py-2.5 bg-brand-50 text-brand-700 border border-brand-100'
    : 'text-sm rounded-xl px-4 py-2.5 bg-red-50 text-red-600 border border-red-100';
  msg.classList.remove('hidden');
}
