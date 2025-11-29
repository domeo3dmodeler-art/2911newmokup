// app/lib/import/types.ts
export type RawRow = Record<string, unknown>;
export type ImportDefaults = { currency?: string; valid_from?: string; fallback_hardware_set?: string; };

export type FieldSpec = {
  dest: string;
  required?: boolean;
  type: 'string'|'number'|'int'|'date'|'enum';
  enumValues?: string[];
};

export interface CategoryAdapter {
  getSchema(): FieldSpec[];
  buildKeys(raw: RawRow, mapped: Record<string, unknown>): { sku: string };
  validateRow(mapped: Record<string, unknown>): string[];
  upsertMany(rows: Record<string, unknown>[]): Promise<number>;
}