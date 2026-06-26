import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { searchAll, normalizePlace } from './src/places.js';
import { findEmails, mapLimit } from './src/email.js';
import { createJob, getJob, log, summary } from './src/jobs.js';
import { toCSV } from './src/csv.js';
import { saveProspectos } from './src/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '256kb' }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const EMAIL_CONCURRENCY = Number(process.env.EMAIL_CONCURRENCY || 5);

if (!API_KEY) {
  console.warn('⚠️  Falta GOOGLE_MAPS_API_KEY. Las búsquedas fallarán hasta que la configures.');
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('ℹ️  Supabase no configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY): el guardado en prospectos estará deshabilitado.');
}

// Health check público (Render/Railway lo consultan sin credenciales).
app.get('/health', (_req, res) => res.json({ ok: true }));

// --- Autenticación básica (protege todo el panel) ---
function auth(req, res, next) {
  const user = process.env.SCRAPER_USER;
  const pass = process.env.SCRAPER_PASS;
  if (!user || !pass) return next(); // sin credenciales configuradas → abierto (no recomendado en prod)

  const hdr = req.headers.authorization || '';
  const [type, creds] = hdr.split(' ');
  if (type === 'Basic' && creds) {
    const [u, p] = Buffer.from(creds, 'base64').toString().split(':');
    if (u === user && p === pass) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Guardalia Lead Scraper"');
  return res.status(401).send('Autenticación requerida');
}
app.use(auth);

// --- Lanzar una búsqueda ---
app.post('/api/search', (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY no configurada en el servidor.' });

  const queries = (req.body.queries || [])
    .map((s) => String(s).trim())
    .filter(Boolean);
  const locations = (req.body.locations || [])
    .map((s) => String(s).trim())
    .filter(Boolean);

  if (!queries.length) return res.status(400).json({ error: 'Indica al menos un término de búsqueda.' });

  const input = {
    queries,
    locations,
    maxPerQuery: Math.min(Math.max(Number(req.body.maxPerQuery) || 60, 1), 60),
    languageCode: req.body.languageCode || 'es',
    regionCode: req.body.regionCode || 'ES',
    skipEmails: Boolean(req.body.skipEmails),
    autoSave: Boolean(req.body.autoSave),
  };

  const job = createJob(input);
  runJob(job).catch((e) => {
    job.status = 'error';
    job.error = e.message;
    log(job, `ERROR: ${e.message}`);
  });

  res.json({ id: job.id });
});

// --- Estado / progreso ---
app.get('/api/jobs/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Trabajo no encontrado.' });
  res.json(summary(job, req.query.results === '1'));
});

// --- Guardar en la tabla prospectos (Supabase) ---
app.post('/api/jobs/:id/save', async (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Trabajo no encontrado.' });
  if (job.status !== 'done') return res.status(409).json({ error: 'El trabajo aún no ha terminado.' });

  // Por defecto solo guardamos centros con algún contacto (email o teléfono).
  const onlyWithContact = req.body.onlyWithContact !== false;
  const rows = onlyWithContact ? job.results.filter((r) => r.email || r.phone) : job.results;

  try {
    const result = await saveProspectos(rows);
    log(job, `Guardado en prospectos: ${result.inserted} nuevos · ${result.skipped} ya existían/sin novedad.`);
    res.json(result);
  } catch (e) {
    log(job, `Error guardando en prospectos: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

// --- Descargar CSV ---
app.get('/api/jobs/:id/csv', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).send('Trabajo no encontrado.');
  const csv = toCSV(job.results);
  const stamp = new Date().toISOString().slice(0, 10);
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="leads-escuelas-${stamp}.csv"`);
  res.send(csv);
});

app.use(express.static(path.join(__dirname, 'public')));

// --- Ejecución del trabajo ---
async function runJob(job) {
  job.status = 'running';
  const { queries, locations, maxPerQuery, languageCode, regionCode, skipEmails, autoSave } = job.input;

  // Combinar términos × zonas → "escuela infantil en Madrid", etc.
  const combos = locations.length
    ? queries.flatMap((q) => locations.map((loc) => ({ textQuery: `${q} en ${loc}`, ciudad: loc })))
    : queries.map((q) => ({ textQuery: q, ciudad: '' }));

  job.phase = `buscando en Google Places (${combos.length} consultas)`;
  const seen = new Map(); // dedupe por place id

  for (const { textQuery, ciudad } of combos) {
    log(job, `Buscando: ${textQuery}`);
    try {
      const places = await searchAll({
        apiKey: API_KEY,
        textQuery,
        maxResults: maxPerQuery,
        languageCode,
        regionCode,
      });
      for (const p of places) {
        if (!p.id || seen.has(p.id)) continue;
        seen.set(p.id, normalizePlace(p, textQuery, ciudad));
      }
      job.found = seen.size;
      log(job, `  → ${places.length} resultados (acumulado único: ${seen.size})`);
    } catch (e) {
      log(job, `  ✗ Error en "${textQuery}": ${e.message}`);
    }
  }

  job.results = [...seen.values()];
  job.total = job.results.length;

  if (skipEmails) {
    log(job, `Búsqueda terminada (sin emails). ${job.total} centros.`);
  } else {
    // Extraer emails visitando cada web.
    const withSite = job.results.filter((r) => r.website);
    job.emailsTotal = withSite.length;
    job.phase = `extrayendo emails (${withSite.length} webs)`;
    log(job, `Visitando ${withSite.length} webs para buscar emails…`);

    await mapLimit(
      withSite,
      EMAIL_CONCURRENCY,
      async (r) => {
        const emails = await findEmails(r.website);
        if (emails.length) r.email = emails.slice(0, 3).join('; ');
      },
      (done) => {
        job.emailsDone = done;
      }
    );
    const withEmail = job.results.filter((r) => r.email).length;
    log(job, `Búsqueda terminada. ${job.total} centros · ${job.results.filter((r) => r.phone).length} con tel. · ${withEmail} con email.`);
  }

  // Guardado automático en prospectos si se pidió.
  if (autoSave) {
    job.phase = 'guardando en prospectos';
    try {
      const rows = job.results.filter((r) => r.email || r.phone);
      const saved = await saveProspectos(rows);
      job.saved = saved;
      log(job, `Guardado en prospectos: ${saved.inserted} nuevos · ${saved.skipped} ya existían/sin novedad.`);
    } catch (e) {
      job.saved = { error: e.message };
      log(job, `Error guardando en prospectos: ${e.message}`);
    }
  }

  job.phase = 'completado';
  job.status = 'done';
}

app.listen(PORT, () => {
  console.log(`Guardalia Lead Scraper escuchando en http://localhost:${PORT}`);
});
