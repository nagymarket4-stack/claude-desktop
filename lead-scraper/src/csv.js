// Exportación a CSV compatible con Excel (UTF-8 con BOM).

function esc(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

const COLUMNS = [
  ['name', 'Nombre'],
  ['phone', 'Telefono'],
  ['email', 'Email'],
  ['website', 'Web'],
  ['ciudad', 'Ciudad'],
  ['address', 'Direccion'],
  ['rating', 'Valoracion'],
  ['reviews', 'Resenas'],
  ['type', 'Tipo'],
  ['query', 'Consulta'],
  ['mapsUri', 'GoogleMaps'],
];

export function toCSV(rows) {
  const header = COLUMNS.map(([, label]) => esc(label)).join(',');
  const lines = rows.map((r) => COLUMNS.map(([key]) => esc(r[key])).join(','));
  // BOM para que Excel respete los acentos (UTF-8).
  return '﻿' + [header, ...lines].join('\r\n');
}
