
const PLANES = [
  { id:'starter',  nombre:'Starter',    precio:29,  color:'green',  max_alumnos:30,  max_profesores:5,  features:['Alumnos y asistencia','Actividades diarias','Portal familias','Soporte email'] },
  { id:'pro',      nombre:'Pro',        precio:79,  color:'purple', max_alumnos:100, max_profesores:20, features:['Todo Starter','Bienestar & nutrición','Chat con familias','Informes mensuales','Soporte prioritario'] },
  { id:'enterprise',nombre:'Enterprise',precio:199, color:'amber',  max_alumnos:999, max_profesores:999,features:['Todo Pro','Múltiples centros','API access','SSO / LDAP','SLA 99.9%','Gestor de cuenta dedicado'] },
];

const CLIENTES = [
  { id:1,  nombre:'Guardería Sol & Luna',   ciudad:'Madrid',      plan:'pro',        estado:'activo',  alta:'2025-01-15', alumnos:48,  contacto:'Ana García',     email:'ana@solyluna.es',       mrr:79  },
  { id:2,  nombre:'Pulgarcito BCN',         ciudad:'Barcelona',   plan:'pro',        estado:'activo',  alta:'2025-02-03', alumnos:61,  contacto:'Marta Puig',     email:'marta@pulgarcito.es',   mrr:79  },
  { id:3,  nombre:'Arco Iris Valencia',     ciudad:'Valencia',    plan:'enterprise', estado:'activo',  alta:'2024-11-20', alumnos:142, contacto:'Carlos Sanz',    email:'carlos@arcoiris.es',    mrr:199 },
  { id:4,  nombre:'Nube de Algodón',        ciudad:'Sevilla',     plan:'starter',    estado:'activo',  alta:'2025-03-10', alumnos:22,  contacto:'Lucía Romero',   email:'lucia@nubedealgodón.es',mrr:29  },
  { id:5,  nombre:'Jardín Encantado',       ciudad:'Bilbao',      plan:'pro',        estado:'activo',  alta:'2025-01-28', alumnos:55,  contacto:'Jon Eguia',      email:'jon@jardinencantado.es',mrr:79  },
  { id:6,  nombre:'Los Pinos Zaragoza',     ciudad:'Zaragoza',    plan:'enterprise', estado:'activo',  alta:'2024-10-05', alumnos:210, contacto:'Rosa Navarro',   email:'rosa@lospinos.es',      mrr:199 },
  { id:7,  nombre:'Pequeños Exploradores',  ciudad:'Málaga',      plan:'pro',        estado:'activo',  alta:'2025-04-01', alumnos:73,  contacto:'Pedro Vega',     email:'pedro@exploradores.es', mrr:79  },
  { id:8,  nombre:'La Casita Feliz',        ciudad:'Murcia',      plan:'starter',    estado:'activo',  alta:'2025-05-15', alumnos:19,  contacto:'Isabel Rubio',   email:'isabel@casitafeliz.es', mrr:29  },
  { id:9,  nombre:'Kinder Plus Madrid',     ciudad:'Madrid',      plan:'enterprise', estado:'activo',  alta:'2024-09-12', alumnos:188, contacto:'Pablo Moreno',   email:'pablo@kinderplus.es',   mrr:199 },
  { id:10, nombre:'Mundo Infantil Gijón',   ciudad:'Gijón',       plan:'pro',        estado:'activo',  alta:'2025-02-20', alumnos:44,  contacto:'Elena Fernández',email:'elena@mundoinfantil.es',mrr:79  },
  { id:11, nombre:'Osos de Peluche',        ciudad:'Valladolid',  plan:'starter',    estado:'activo',  alta:'2025-06-01', alumnos:27,  contacto:'Silvia Castro',  email:'silvia@ososdepeluche.es',mrr:29 },
  { id:12, nombre:'Alegría Infantil',       ciudad:'Alicante',    plan:'pro',        estado:'activo',  alta:'2025-03-22', alumnos:59,  contacto:'Tomás López',    email:'tomas@alegría.es',      mrr:79  },
  { id:13, nombre:'Primeras Letras',        ciudad:'Granada',     plan:'enterprise', estado:'activo',  alta:'2024-12-01', alumnos:156, contacto:'María Ruiz',     email:'maria@primerasletras.es',mrr:199},
  { id:14, nombre:'Duendes y Hadas',        ciudad:'Pamplona',    plan:'pro',        estado:'activo',  alta:'2025-04-15', alumnos:38,  contacto:'Iker Azcona',    email:'iker@duendes.es',       mrr:79  },
  { id:15, nombre:'Smart Kids Palma',       ciudad:'Palma',       plan:'enterprise', estado:'activo',  alta:'2025-01-05', alumnos:201, contacto:'Clara Vidal',    email:'clara@smartkids.es',    mrr:199 },
  { id:16, nombre:'Pequeñas Estrellas',     ciudad:'Santander',   plan:'pro',        estado:'activo',  alta:'2025-05-20', alumnos:46,  contacto:'Raúl Pérez',     email:'raul@estrellas.es',     mrr:79  },
  { id:17, nombre:'Mariposas Córdoba',      ciudad:'Córdoba',     plan:'starter',    estado:'activo',  alta:'2025-06-10', alumnos:14,  contacto:'Nuria Jiménez',  email:'nuria@mariposas.es',    mrr:29  },
  { id:18, nombre:'Montessori Norte',       ciudad:'Oviedo',      plan:'enterprise', estado:'activo',  alta:'2025-02-14', alumnos:178, contacto:'Fernando Díaz',  email:'fdiaz@montessorinorte.es',mrr:199},
  { id:19, nombre:'Nidos de Primavera',     ciudad:'Burgos',      plan:'pro',        estado:'activo',  alta:'2025-03-08', alumnos:52,  contacto:'Laura Blanco',   email:'laura@nidosprimavera.es',mrr:79 },
  { id:20, nombre:'Los Amiguitos',          ciudad:'Logroño',     plan:'starter',    estado:'pausado', alta:'2025-04-20', alumnos:18,  contacto:'Jorge Santos',   email:'jorge@amiguitos.es',    mrr:0   },
  { id:21, nombre:'Happy Kids Lleida',      ciudad:'Lleida',      plan:'pro',        estado:'cancelado',alta:'2025-01-10',alumnos:0,  contacto:'Anna Soler',     email:'anna@happykids.es',     mrr:0   },
  { id:22, nombre:'Delfines Tarragona',     ciudad:'Tarragona',   plan:'pro',        estado:'activo',  alta:'2025-05-30', alumnos:41,  contacto:'Marc Ferrer',    email:'marc@delfines.es',      mrr:79  },
  { id:23, nombre:'Rayos de Sol Badajoz',   ciudad:'Badajoz',     plan:'pro',        estado:'activo',  alta:'2025-04-08', alumnos:33,  contacto:'Diego Morales',  email:'diego@rayossol.es',     mrr:79  },
  { id:24, nombre:'El Bosque Encantado',    ciudad:'San Sebastián',plan:'enterprise',estado:'activo',  alta:'2025-03-01', alumnos:165, contacto:'Amaia Etxeberria',email:'amaia@bosqueencantado.es',mrr:199},
];

const PIPELINE = [
  { id:'t1', nombre:'Pequeños Genios Madrid',   ciudad:'Madrid',    contacto:'Roberto Alonso', email:'roberto@pgenius.es',  plan_interes:'pro',        inicio_trial:'2026-06-15', fin_trial:'2026-06-29', alumnos_aprox:65, estado:'activo',    notas:'Demo realizada el lunes. Muy interesado. Precio ok.' },
  { id:'t2', nombre:'Gotita de Rocío',          ciudad:'Huelva',    contacto:'Carmen Suárez',  email:'carmen@gotarocio.es', plan_interes:'starter',    inicio_trial:'2026-06-18', fin_trial:'2026-07-02', alumnos_aprox:20, estado:'activo',    notas:'Pequeño centro rural. Necesitan formación básica.' },
  { id:'t3', nombre:'Red Montessori España',    ciudad:'Madrid',    contacto:'Álvaro Crespo',  email:'acrespo@redmontessori.es',plan_interes:'enterprise',inicio_trial:'2026-06-10',fin_trial:'2026-06-24',alumnos_aprox:500,estado:'negociando',notas:'10 centros. Quieren precio especial. Reunión con dirección el viernes.' },
  { id:'t4', nombre:'Trotamundos BCN',          ciudad:'Barcelona', contacto:'Sonia Mas',      email:'sonia@trotamundos.es',plan_interes:'pro',        inicio_trial:'2026-05-20', fin_trial:'2026-06-03', alumnos_aprox:58, estado:'expirado',  notas:'No respondió emails post-trial. Llamar.' },
  { id:'t5', nombre:'Arbolitos Alicante',       ciudad:'Alicante',  contacto:'Jaime García',   email:'jaime@arbolitos.es',  plan_interes:'pro',        inicio_trial:'2026-06-20', fin_trial:'2026-07-04', alumnos_aprox:44, estado:'activo',    notas:'Referido por Arco Iris Valencia. Alto potencial.' },
];

const MRR_HISTORICO = [
  { mes:'Dic 24', mrr:890  },
  { mes:'Ene 25', mrr:1180 },
  { mes:'Feb 25', mrr:1440 },
  { mes:'Mar 25', mrr:1780 },
  { mes:'Abr 25', mrr:2050 },
  { mes:'May 25', mrr:2390 },
  { mes:'Jun 25', mrr:2656 },
];

const FACTURAS = CLIENTES
  .filter(c => c.estado === 'activo')
  .flatMap(c => {
    const meses = ['Jun 2026','May 2026','Abr 2026'];
    return meses.map((mes, i) => ({
      id: `INV-${String(c.id).padStart(3,'0')}-${6-i}`,
      cliente_id: c.id,
      cliente: c.nombre,
      mes,
      importe: c.mrr,
      estado: i === 0 ? 'pendiente' : 'pagada',
      fecha: `2026-0${6-i}-01`,
    }));
  });

function calcMRR() { return CLIENTES.filter(c=>c.estado==='activo').reduce((s,c)=>s+c.mrr,0); }
function calcARR() { return calcMRR() * 12; }
function calcChurn() {
  const cancel = CLIENTES.filter(c=>c.estado==='cancelado').length;
  return ((cancel / CLIENTES.length) * 100).toFixed(1);
}
function planColor(id) { return {starter:'green',pro:'purple',enterprise:'amber'}[id]||'gray'; }
function planLabel(id) { return {starter:'Starter',pro:'Pro',enterprise:'Enterprise'}[id]||id; }
function estadoBadge(e) {
  const m = {activo:'<span class="badge b-ok">Activo</span>',pausado:'<span class="badge b-warn">Pausado</span>',cancelado:'<span class="badge b-danger">Cancelado</span>',negociando:'<span class="badge b-info">Negociando</span>',expirado:'<span class="badge b-warn">Expirado</span>'};
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
