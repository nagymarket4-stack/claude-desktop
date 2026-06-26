# Guardalia · Buscador de leads (escuelas infantiles)

Herramienta web para encontrar **escuelas infantiles / guarderías con su teléfono y correo**,
pensada para prospección comercial de Guardalia.

Usa la **API oficial de Google Places (New)** para obtener nombre, dirección, teléfono y web de
forma estable y legal — **sin baneos de IP ni CAPTCHAs**. El email no lo da Google, así que se
extrae visitando la web de cada centro.

> ⚠️ Scrapear el HTML de Google Maps/Buscador directamente va contra sus términos y **sí** sufre
> baneos aunque esté alojado en la nube (las IPs de datacenter se bloquean antes). Por eso esta
> herramienta usa la API oficial.

## Cómo funciona

1. Escribes uno o varios términos (`escuela infantil`, `guardería`…) y opcionalmente zonas
   (`Madrid`, `Barcelona`…). Se combinan: `escuela infantil en Madrid`, etc.
2. Cada combinación se consulta a Places API (hasta 60 resultados por consulta).
3. Para cada centro con web, se visita su sitio y se extrae el email (`mailto:` y regex,
   filtrando falsos positivos, priorizando el dominio propio).
4. Ves la tabla en pantalla, **descargas un CSV** (compatible con Excel) y/o
   **guardas los leads en la tabla `prospectos` de Supabase** (para la campaña de email frío).

## Guardado en `prospectos` (Supabase)

La tabla `prospectos` ya existe en tu proyecto. Tiene RLS sin políticas anon, así que el worker
escribe con la **SERVICE ROLE key** (server-side).

1. Ejecuta una vez [`sql/prospectos-scraper.sql`](sql/prospectos-scraper.sql) en Supabase →
   *SQL Editor*. Añade las columnas `telefono`, `web`, `direccion`, `place_id`, permite emails
   nulos (centros solo con teléfono) y asegura los defaults de `estado`/`token`/`created_at`.
2. Configura `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
3. En el panel: marca *"Guardar en prospectos al terminar"* o usa el botón **Guardar en prospectos**.

El guardado hace **upsert por `email` ignorando duplicados**: los emails que ya existen —incluidos
los que están en estado `baja`— **no se sobrescriben** (no se re-contacta a quien se dio de baja).
Por defecto solo se guardan centros con email **o** teléfono.

## Requisitos

- Node 18+
- Una **API key de Google Cloud** con **"Places API (New)"** habilitada y **facturación activada**.
  Google da crédito gratuito mensual; cada búsqueda cuesta céntimos. Restringe la key por API.

## Uso en local

```bash
cd lead-scraper
cp .env.example .env      # rellena GOOGLE_MAPS_API_KEY (y usuario/contraseña)
npm install
npm start                 # http://localhost:3000
```

## Desplegar en Render (recomendado)

1. Sube el repo a GitHub.
2. En Render → **New → Blueprint**, selecciona el repo (detecta `lead-scraper/render.yaml`),
   o crea un **Web Service** manual con *Root Directory* = `lead-scraper`,
   *Build* = `npm install`, *Start* = `npm start`.
3. Añade las variables de entorno: `GOOGLE_MAPS_API_KEY`, `SCRAPER_USER`, `SCRAPER_PASS`.
4. Abre la URL pública. La búsqueda corre en el servidor → es **su** IP, no la tuya.

## Desplegar en Railway

1. **New Project → Deploy from GitHub repo**.
2. En *Settings* del servicio: *Root Directory* = `lead-scraper`, *Start Command* = `npm start`.
3. Variables: `GOOGLE_MAPS_API_KEY`, `SCRAPER_USER`, `SCRAPER_PASS`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `GOOGLE_MAPS_API_KEY` | API key con Places API (New). **Obligatoria.** |
| `SCRAPER_USER` / `SCRAPER_PASS` | Credenciales del panel (Basic Auth). Sin ellas, el panel queda abierto. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Para guardar en `prospectos`. Service role, solo server-side. |
| `PORT` | Puerto (lo inyecta Render/Railway automáticamente). |
| `EMAIL_CONCURRENCY` | Webs visitadas en paralelo al buscar emails (por defecto 5). |

## Notas legales y de buenas prácticas

- Respeta el RGPD: los datos de contacto profesionales pueden usarse para prospección B2B con
  base legítima, pero ofrece siempre baja y no envíes spam masivo.
- La extracción de email solo visita la web pública del propio centro, sin saltarse logins.
