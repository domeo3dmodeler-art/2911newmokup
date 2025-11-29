// app/lib/import/automap.ts
import { RawRow } from './parse';
import { FieldSpec } from './types';

export function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g,'_').replace(/[()]/g,'');
}

/** Simple fuzzy auto-map: for each schema.dest look for the closest raw header by normalized equality */
export function autoMap(raw: RawRow, schema: FieldSpec[], defaults: Record<string, any>) {
  const norm: Record<string, any> = {};
  for (const k of Object.keys(raw)) norm[normalizeHeader(k)] = raw[k];

  const out: Record<string, any> = {};
  for (const f of schema) {
    const key = normalizeHeader(f.dest);
    if (key in norm) out[f.dest] = norm[key];
  }

  // apply defaults for absent fields
  for (const [k, v] of Object.entries(defaults || {})) {
    if (out[k] == null || out[k] === '') out[k] = v;
  }
  return out;
}