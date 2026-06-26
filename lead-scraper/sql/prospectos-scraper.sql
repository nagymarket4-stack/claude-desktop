-- Ejecutar UNA vez en Supabase → SQL Editor.
-- Añade a la tabla `prospectos` (ya existente) las columnas que aporta el lead-scraper
-- y asegura los valores por defecto que usan las Edge Functions de campaña.
-- Es idempotente: se puede ejecutar varias veces sin error.

alter table public.prospectos add column if not exists telefono  text;
alter table public.prospectos add column if not exists web       text;
alter table public.prospectos add column if not exists direccion text;
alter table public.prospectos add column if not exists place_id  text;

-- Permitir prospectos sin email (centros de los que solo tenemos teléfono).
alter table public.prospectos alter column email drop not null;

-- Asegurar defaults (no fallan si ya estaban puestos).
alter table public.prospectos alter column estado     set default 'pendiente';
alter table public.prospectos alter column token      set default gen_random_uuid();
alter table public.prospectos alter column created_at set default now();

-- Índice opcional para localizar duplicados por centro de Google.
create index if not exists prospectos_place_id_idx on public.prospectos (place_id);
