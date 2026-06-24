
const PLANES = [
  { id:'starter',  nombre:'Starter',    precio:29,  color:'green',  max_alumnos:30,  max_profesores:5,  features:['Alumnos y asistencia','Actividades diarias','Portal familias','Soporte email'] },
  { id:'pro',      nombre:'Pro',        precio:79,  color:'purple', max_alumnos:100, max_profesores:20, features:['Todo Starter','Bienestar & nutrición','Chat con familias','Informes mensuales','Soporte prioritario'] },
  { id:'enterprise',nombre:'Enterprise',precio:199, color:'amber',  max_alumnos:999, max_profesores:999,features:['Todo Pro','Múltiples centros','API access','SSO / LDAP','SLA 99.9%','Gestor de cuenta dedicado'] },
];

// Los clientes se cargan desde Supabase (tabla tenants) al iniciar sesión.
let CLIENTES = [];

// El pipeline se rellena con los leads reales captados desde la web (tabla leads).
let PIPELINE = [];

const MRR_HISTORICO = [
  { mes:'Dic 24', mrr:890  },
  { mes:'Ene 25', mrr:1180 },
  { mes:'Feb 25', mrr:1440 },
  { mes:'Mar 25', mrr:1780 },
  { mes:'Abr 25', mrr:2050 },
  { mes:'May 25', mrr:2390 },
  { mes:'Jun 25', mrr:2656 },
];

// Facturas derivadas de los clientes activos (se recalculan tras cargar de Supabase)
let FACTURAS = [];
function recomputarFacturas() {
  FACTURAS = CLIENTES
    .filter(c => c.estado === 'activo')
    .flatMap(c => {
      const meses = ['Jun 2026','May 2026','Abr 2026'];
      return meses.map((mes, i) => ({
        id: `INV-${String(c.id).slice(0,6).toUpperCase()}-${6-i}`,
        cliente_id: c.id,
        cliente: c.nombre,
        mes,
        importe: c.mrr,
        estado: i === 0 ? 'pendiente' : 'pagada',
        fecha: `2026-0${6-i}-01`,
      }));
    });
}

function calcMRR() { return CLIENTES.filter(c=>c.estado==='activo').reduce((s,c)=>s+c.mrr,0); }
function calcARR() { return calcMRR() * 12; }
function calcChurn() {
  const cancel = CLIENTES.filter(c=>c.estado==='cancelado').length;
  return ((cancel / CLIENTES.length) * 100).toFixed(1);
}
function planColor(id) { return {starter:'green',pro:'purple',enterprise:'amber'}[id]||'gray'; }
function planLabel(id) { return {starter:'Starter',pro:'Pro',enterprise:'Enterprise'}[id]||id; }
function estadoBadge(e) {
  const m = {activo:'<span class="badge b-ok">Activo</span>',trial:'<span class="badge b-info">En prueba</span>',pausado:'<span class="badge b-warn">Pausado</span>',cancelado:'<span class="badge b-danger">Cancelado</span>',negociando:'<span class="badge b-info">Negociando</span>',expirado:'<span class="badge b-warn">Expirado</span>'};
  return m[e] || e;
}
function planBadge(id) {
  const m = {starter:'<span class="badge b-green">Starter</span>',pro:'<span class="badge b-purple">Pro</span>',enterprise:'<span class="badge b-amber">Enterprise</span>'};
  return m[id] || id;
}
function esc(s) { const d=document.createElement('div');d.appendChild(document.createTextNode(String(s??'')));return d.innerHTML; }
function fmtEuro(n) { return '€'+n.toLocaleString('es-ES'); }
function fmtFecha(s) { if(!s)return'—'; const [y,m,d]=s.split('-'); const ms=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']; return `${d} ${ms[parseInt(m)-1]} ${y}`; }

let saasState = {
  currentPage: 'dashboard',
  clienteFiltro: '',
  clienteEstado: 'todos',
  clienteDetalle: null,
  pipelineDetalle: null,
};
