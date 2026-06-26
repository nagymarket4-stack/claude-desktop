// Guardado de leads en la tabla `prospectos` de Supabase.
// Usa la SERVICE ROLE key (server-side): la tabla tiene RLS sin políticas anon,
// así que solo el backend (o las Edge Functions) pueden escribir.

// Mapea un resultado del scraper a una fila de `prospectos`.
function toRow(r) {
  return {
    nombre: r.name || null,
    // En prospectos guardamos UN solo email (el mejor); el scraper puede traer varios.
    email: r.email ? r.email.split(';')[0].trim().toLowerCase() : null,
    ciudad: r.ciudad || null,
    telefono: r.phone || null,
    web: r.website || null,
    direccion: r.address || null,
    place_id: r.id || null,
    estado: 'pendiente',
  };
}

// Quita duplicados dentro del lote: por email si lo hay, si no por place_id.
function dedupe(rows) {
  const seenEmail = new Set();
  const seenPlace = new Set();
  const out = [];
  for (const r of rows) {
    if (r.email) {
      if (seenEmail.has(r.email)) continue;
      seenEmail.add(r.email);
    } else if (r.place_id) {
      if (seenPlace.has(r.place_id)) continue;
      seenPlace.add(r.place_id);
    }
    out.push(r);
  }
  return out;
}

// Sube las filas a `prospectos`. Upsert con on_conflict=email e ignore-duplicates:
// los emails ya existentes (incluidos los que están en estado 'baja') NO se tocan.
export async function saveProspectos(results) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase no configurado: faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.');
  }

  const rows = dedupe(results.map(toRow));
  if (!rows.length) return { sent: 0, inserted: 0, skipped: 0 };

  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/prospectos?on_conflict=email`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      // ignore-duplicates → ON CONFLICT DO NOTHING; representation → devuelve solo lo insertado.
      Prefer: 'resolution=ignore-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase ${res.status}: ${txt.slice(0, 500)}`);
  }

  const inserted = await res.json();
  return {
    sent: rows.length,
    inserted: Array.isArray(inserted) ? inserted.length : 0,
    skipped: rows.length - (Array.isArray(inserted) ? inserted.length : 0),
  };
}
