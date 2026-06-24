// ─── Autenticación con roles y bloqueo ───────────────────────────────────────
const MAX_INTENTOS = 5;
const BLOQUEO_MS   = 15 * 60 * 1000;

let sesionActual = null; // { id, usuario, nombre, rol, alumnoIds }

async function sha256(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function leerBloqueo() {
  try { return JSON.parse(sessionStorage.getItem('__bloqueo')) || { intentos:0, hasta:null }; }
  catch { return { intentos:0, hasta:null }; }
}
function guardarBloqueo(d) { sessionStorage.setItem('__bloqueo', JSON.stringify(d)); }

async function intentarLogin() {
  const bloqueo = leerBloqueo();
  if (bloqueo.hasta && Date.now() < bloqueo.hasta) {
    mostrarErrorLogin(`Demasiados intentos. Espera ${Math.ceil((bloqueo.hasta-Date.now())/60000)} min.`);
    return;
  }

  const usuario = document.getElementById('login-user').value.trim().toLowerCase();
  const pass    = document.getElementById('login-pass').value;
  if (!usuario || !pass) { mostrarErrorLogin('Introduce usuario y contraseña.'); return; }

  const hash       = await sha256(pass);
  const encontrado = state.usuarios.find(u => u.usuario === usuario && u.passHash === hash && u.activo);

  if (!encontrado) {
    bloqueo.intentos = (bloqueo.intentos||0) + 1;
    if (bloqueo.intentos >= MAX_INTENTOS) {
      bloqueo.hasta = Date.now() + BLOQUEO_MS;
      guardarBloqueo(bloqueo);
      mostrarErrorLogin('Cuenta bloqueada 15 minutos por seguridad.');
    } else {
      guardarBloqueo(bloqueo);
      mostrarErrorLogin(`Credenciales incorrectas. Intentos restantes: ${MAX_INTENTOS - bloqueo.intentos}`);
    }
    document.getElementById('login-pass').value = '';
    return;
  }

  guardarBloqueo({ intentos:0, hasta:null });
  sesionActual = { id: encontrado.id, usuario: encontrado.usuario, nombre: encontrado.nombre, rol: encontrado.rol, alumnoIds: encontrado.alumnoIds||[] };

  document.getElementById('login-screen').classList.add('hidden');
  const appEl = document.getElementById('app');
  appEl.classList.remove('hidden');
  appEl.classList.add('show');

  persistir(); // guardar sesión para mantener login al recargar

  if (sesionActual.rol === 'padre') {
    iniciarPortalPadres();
  } else {
    iniciarPortalStaff();
  }
}

function iniciarPortalStaff() {
  renderSidebarStaff();
  renderBottomNavStaff();
  document.getElementById('top-avatar').textContent = sesionActual.nombre[0];
  // Actualizar nombre/rol en sidebar footer
  const sn = document.getElementById('sidebar-nombre');
  const sr = document.getElementById('sidebar-rol');
  const sa = document.getElementById('sidebar-avatar');
  if (sn) sn.textContent = sesionActual.nombre;
  if (sr) sr.textContent = { superadmin:'Superadministrador', admin:'Administración', profesor:'Profesor/a', padre:'Familia' }[sesionActual.rol] || sesionActual.rol;
  if (sa) sa.textContent = sesionActual.nombre[0];
  navigate('dashboard');
  if (typeof mostrarBannerSuscripcion === 'function') mostrarBannerSuscripcion();
}

function iniciarPortalPadres() {
  renderSidebarPadres();
  renderBottomNavPadres();
  document.getElementById('top-avatar').textContent = sesionActual.nombre[0];
  const sn = document.getElementById('sidebar-nombre');
  const sr = document.getElementById('sidebar-rol');
  const sa = document.getElementById('sidebar-avatar');
  if (sn) sn.textContent = sesionActual.nombre;
  if (sr) sr.textContent = 'Familia';
  if (sa) sa.textContent = sesionActual.nombre[0];
  navigate('padre-inicio');
}

function mostrarErrorLogin(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function cerrarSesion() {
  persistir();            // guardar datos compartidos antes de salir
  sesionActual = null;
  try { localStorage.removeItem(LS_SESION); } catch (e) {} // olvidar solo la sesión
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').classList.add('hidden');
  const appEl = document.getElementById('app');
  appEl.classList.add('hidden');
  appEl.classList.remove('show');
  document.getElementById('login-screen').classList.remove('hidden');
}
