
const NAV_ITEMS = [
  { id:'dashboard',  label:'Dashboard',    icon:'ti-chart-bar' },
  { id:'clientes',   label:'Clientes',     icon:'ti-building'  },
  { id:'planes',     label:'Planes',       icon:'ti-credit-card'},
  { id:'pipeline',   label:'Pipeline',     icon:'ti-funnel'    },
  { id:'facturacion',label:'Facturación',  icon:'ti-receipt'   },
];

const PAGE_RENDERERS = {
  dashboard:  renderDashboard,
  clientes:   renderClientes,
  planes:     renderPlanes,
  pipeline:   renderPipeline,
  facturacion:renderFacturacion,
};

function navegarSaas(page) {
  saasState.currentPage = page;
  document.querySelectorAll('.nav-link').forEach(el=>{
    el.classList.toggle('active', el.dataset.page===page);
  });
  const r = PAGE_RENDERERS[page];
  if(r) r();
  closeSaasSidebar();
  document.getElementById('saas-top-title').textContent = NAV_ITEMS.find(n=>n.id===page)?.label || '';
}

function toggleSaasSidebar() {
  const sb = document.getElementById('saas-sidebar');
  const bd = document.getElementById('saas-backdrop');
  const open = !sb.classList.contains('-translate-x-full');
  if(open) { closeSaasSidebar(); }
  else {
    sb.classList.remove('-translate-x-full');
    bd.classList.remove('hidden');
    document.body.style.overflow='hidden';
  }
}
function closeSaasSidebar() {
  document.getElementById('saas-sidebar').classList.add('-translate-x-full');
  document.getElementById('saas-backdrop').classList.add('hidden');
  document.body.style.overflow='';
}

function toastSaas(msg, tipo='success') {
  let t = document.getElementById('saas-toast');
  if(!t){
    t=document.createElement('div');
    t.id='saas-toast';
    document.body.appendChild(t);
  }
  t.className = `saas-toast ${tipo}`;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'),3000);
}

function doSaasLogin(e) {
  if(e) e.preventDefault();
  const user = document.getElementById('saas-user').value.trim();
  const pass = document.getElementById('saas-pass').value;
  if(user==='admin' && pass==='admin2024') {
    document.getElementById('saas-login').style.display='none';
    document.getElementById('saas-app').style.display='flex';
    navegarSaas('dashboard');
  } else {
    document.getElementById('saas-login-err').textContent='Credenciales incorrectas';
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('saas-login-form').addEventListener('submit', doSaasLogin);
  document.getElementById('saas-pass').addEventListener('keydown', e=>{ if(e.key==='Enter') doSaasLogin(); });
  document.getElementById('saas-user').focus();
});
