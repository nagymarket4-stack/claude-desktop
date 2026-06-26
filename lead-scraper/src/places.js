// Cliente de la API oficial de Google Places (New).
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

// Campos que pedimos. Incluir teléfono y web sube de SKU pero nos evita
// una segunda llamada a Place Details por cada resultado.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.primaryTypeDisplayName',
  'nextPageToken',
].join(',');

async function searchPage({ apiKey, textQuery, pageToken, languageCode = 'es', regionCode = 'ES' }) {
  const body = { textQuery, languageCode, regionCode, pageSize: 20 };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(PLACES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
      // Algunas IPs de datacenter reciben la página anti-bot de Google si la
      // petición no parece de un cliente normal. Un User-Agent estándar ayuda.
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    // Si Google devuelve HTML (página de error del robot) en vez de JSON, casi siempre
    // es una restricción de la API key que bloquea peticiones de servidor.
    if (/<html/i.test(txt)) {
      let hint = `HTTP ${res.status} (Google devolvió una página de error, no JSON).`;
      if (res.status === 403) {
        hint += ' Causa habitual: la API key tiene "Application restrictions" (p. ej. HTTP referrers)'
          + ' que bloquean al servidor. Solución: en Google Cloud → Credenciales → tu key,'
          + ' pon "Application restrictions: None" y deja "API restrictions" solo con Places API (New).';
      }
      throw new Error(`Places API: ${hint}`);
    }
    throw new Error(`Places API ${res.status}: ${txt.slice(0, 500)}`);
  }
  return res.json();
}

// Pagina automáticamente (la API devuelve máx. 60 resultados por consulta de texto).
export async function searchAll({ apiKey, textQuery, maxResults = 60, languageCode, regionCode, onPage }) {
  const out = [];
  let pageToken;
  do {
    const data = await searchPage({ apiKey, textQuery, pageToken, languageCode, regionCode });
    const places = data.places || [];
    out.push(...places);
    if (onPage) onPage(places, out.length);
    pageToken = data.nextPageToken;
    // El nextPageToken tarda un instante en activarse del lado de Google.
    if (pageToken && out.length < maxResults) await new Promise((r) => setTimeout(r, 1500));
  } while (pageToken && out.length < maxResults);
  return out.slice(0, maxResults);
}

// Normaliza un place de la API a la forma plana que usamos en CSV/UI/Supabase.
export function normalizePlace(p, query, ciudad = '') {
  return {
    id: p.id,
    name: p.displayName?.text || '',
    phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
    website: p.websiteUri || '',
    address: p.formattedAddress || '',
    ciudad,
    rating: p.rating ?? '',
    reviews: p.userRatingCount ?? '',
    type: p.primaryTypeDisplayName?.text || '',
    mapsUri: p.googleMapsUri || '',
    query,
    email: '',
  };
}
