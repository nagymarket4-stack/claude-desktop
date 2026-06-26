// Estado de los trabajos de búsqueda en memoria.
// Un worker de larga duración mantiene esto vivo entre peticiones.

import { randomUUID } from 'node:crypto';

const jobs = new Map();

export function createJob(input) {
  const id = randomUUID();
  const job = {
    id,
    input,
    status: 'pending', // pending | running | done | error
    phase: 'en cola',
    createdAt: Date.now(),
    found: 0,
    total: 0,
    emailsDone: 0,
    emailsTotal: 0,
    results: [],
    log: [],
    error: null,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id) {
  return jobs.get(id);
}

export function log(job, msg) {
  job.log.push(`${new Date().toLocaleTimeString('es-ES')} · ${msg}`);
  if (job.log.length > 500) job.log.shift();
}

// Vista ligera para el polling del front (sin volcar todos los resultados salvo que se pida).
export function summary(job, includeResults = false) {
  const { results, ...rest } = job;
  return {
    ...rest,
    withEmail: results.filter((r) => r.email).length,
    results: includeResults ? results : undefined,
  };
}

// Limpieza de trabajos viejos cada 30 min (más de 6 h de antigüedad).
setInterval(() => {
  const cutoff = Date.now() - 1000 * 60 * 60 * 6;
  for (const [id, j] of jobs) if (j.createdAt < cutoff) jobs.delete(id);
}, 1000 * 60 * 30).unref?.();
