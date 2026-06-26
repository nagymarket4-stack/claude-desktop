// Extracción de emails visitando la propia web del centro.
// Google Places NO devuelve el email, así que hay que rastrear su sitio.

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Falsos positivos típicos (assets, librerías, placeholders).
const BLOCKLIST = [
  /sentry/i, /wixpress/i, /\.wix/i, /example\./i, /your-?email/i, /domain\.com/i,
  /godaddy/i, /core-?js/i, /react/i, /\.png$/i, /\.jpe?g$/i, /\.gif$/i, /\.webp$/i,
  /\.svg$/i, /\.css$/i, /\.js$/i, /u003e/i, /sentry\.io/i, /@2x/i,
];

// Páginas donde suele estar el contacto (en orden de probabilidad).
const CONTACT_PATHS = ['', 'contacto', 'contacto/', 'contact', 'aviso-legal', 'legal', 'quienes-somos'];

function cleanEmails(text, siteHost) {
  const found = new Set();
  for (const m of text.matchAll(EMAIL_RE)) {
    const e = m[0].toLowerCase().replace(/\.$/, '');
    if (e.length > 80) continue;
    if (BLOCKLIST.some((re) => re.test(e))) continue;
    found.add(e);
  }
  const arr = [...found];
  // Priorizar emails del mismo dominio que la web del centro.
  if (siteHost) {
    const root = siteHost.replace(/^www\./, '');
    arr.sort((a, b) => Number(b.endsWith(root)) - Number(a.endsWith(root)));
  }
  return arr;
}

async function fetchText(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GuardaliaLeadBot/1.0)' },
    });
    if (!res.ok) return '';
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('text/plain')) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(t);
  }
}

// Devuelve un array de emails encontrados en la web (vacío si nada).
export async function findEmails(websiteUri, { maxPages = 3 } = {}) {
  if (!websiteUri) return [];
  let base;
  try {
    base = new URL(websiteUri);
  } catch {
    return [];
  }
  const host = base.host;
  const emails = new Set();

  for (const path of CONTACT_PATHS.slice(0, maxPages + 1)) {
    let url;
    try {
      url = new URL(path, base.origin + '/').toString();
    } catch {
      continue;
    }
    const html = await fetchText(url);
    if (!html) continue;

    // mailto: es la señal más fiable.
    for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) {
      let e;
      try {
        e = decodeURIComponent(m[1]).toLowerCase();
      } catch {
        e = m[1].toLowerCase();
      }
      EMAIL_RE.lastIndex = 0;
      if (!BLOCKLIST.some((re) => re.test(e)) && EMAIL_RE.test(e)) emails.add(e);
      EMAIL_RE.lastIndex = 0;
    }
    for (const e of cleanEmails(html, host)) emails.add(e);

    if (emails.size) break; // basta con la primera página que dé resultados
  }

  return cleanEmails([...emails].join(' '), host);
}

// Ejecuta fn sobre items con concurrencia limitada (para no martillear webs).
export async function mapLimit(items, limit, fn, onProgress) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await fn(items[idx], idx);
      done++;
      if (onProgress) onProgress(done, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
