// ─── Autenticación con bloqueo por intentos fallidos ────────────────────────
// Credenciales de demo (en producción con Supabase Auth esto va en el backend)
const USUARIOS = [
  { usuario: 'admin',    passHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', nombre: 'Ana Díaz',          rol: 'Directora' },
  { usuario: 'carmen',  passHash: 'b14a7b8059d9c055954c92674ce60032d1ced612ad66ad4d7f92fe7d0b9b21b4', nombre: 'Carmen Rodríguez',  rol: 'Tutora Ositos' },
  { usuario: 'marta',   passHash: '9c56cc51b374c3ba189210d5b6d4bf57790d351ef8d0cf08d1a9d8f36a072a38', nombre: 'Marta Jiménez',     rol: 'Tutora Conejitos' },
];
// Contraseñas: admin→"admin", carmen→"carmen123", marta→"marta123"
// En producción: usar Supabase Auth (bcrypt en servidor, nunca SHA-256 cliente)

const MAX_INTENTOS = 5;
const BLOQUEO_MS   = 15 * 60 * 1000; // 15 minutos

let sesionActual = null;

// ── Utilidades ────────────────────────────────────────────────────────────────

async function sha256(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function leerBloqueo() {
  try {
    const raw = sessionStorage.getItem('__bloqueo');
    return raw ? JSON.parse(raw) : { intentos: 0, hasta: null };
  } catch { return { intentos: 0, hasta: null }; }
}

function guardarBloqueo(datos) {
  sessionStorage.setItem('__bloqueo', JSON.stringify(datos));
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function intentarLogin() {
  const bloqueo = leerBloqueo();

  if (bloqueo.hasta && Date.now() < bloqueo.hasta) {
    const mins = Math.ceil((bloqueo.hasta - Date.now()) / 60000);
    mostrarErrorLogin(`Demasiados intentos fallidos. Espera ${mins} min.`);
    return;
  }

  const usuario = document.getElementById('login-user').value.trim().toLowerCase();
  const pass    = document.getElementById('login-pass').value;

  if (!usuario || !pass) {
    mostrarErrorLogin('Introduce usuario y contraseña.');
    return;
  }

  const hash = await sha256(pass);
  const encontrado = USUARIOS.find(u => u.usuario === usuario && u.passHash === hash);

  if (!encontrado) {
    bloqueo.intentos = (bloqueo.intentos || 0) + 1;
    if (bloqueo.intentos >= MAX_INTENTOS) {
      bloqueo.hasta = Date.now() + BLOQUEO_MS;
      guardarBloqueo(bloqueo);
      mostrarErrorLogin(`Cuenta bloqueada 15 minutos por seguridad.`);
    } else {
      guardarBloqueo(bloqueo);
      const restantes = MAX_INTENTOS - bloqueo.intentos;
      mostrarErrorLogin(`Usuario o contraseña incorrectos. Intentos restantes: ${restantes}`);
    }
    document.getElementById('login-pass').value = '';
    return;
  }

  // Login correcto: limpiar bloqueo
  guardarBloqueo({ intentos: 0, hasta: null });
  sesionActual = { usuario: encontrado.usuario, nombre: encontrado.nombre, rol: encontrado.rol };

  // Actualizar sidebar
  document.getElementById('sidebar-avatar').textContent = encontrado.nombre[0];
  document.getElementById('sidebar-nombre').textContent = encontrado.nombre;
  document.getElementById('sidebar-rol').textContent    = encontrado.rol;

  // Mostrar app
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  navigate('dashboard');
}

function mostrarErrorLogin(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg; // textContent, nunca innerHTML
  el.classList.remove('hidden');
}

function cerrarSesion() {
  sesionActual = null;
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}
