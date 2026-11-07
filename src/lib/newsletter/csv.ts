/**
 * Pure CSV helpers for the newsletter export (NWS-05). No imports on purpose:
 * unit-tested directly by scripts/test-newsletter-units.mjs.
 *
 * Format: UTF-8 with BOM (Excel FR), `;` separator, CRLF, formula-injection safe.
 */

export const CSV_BOM = '﻿';
export const CSV_SEPARATOR = ';';
export const CSV_HEADER = ['email', 'statut', 'langue', 'source', 'consentement_le', 'texte_version'] as const;

/** Characters that make Excel / Sheets / LibreOffice interpret a cell as a formula. */
const FORMULA_TRIGGERS = new Set(['=', '+', '-', '@', '\t', '\r']);

/**
 * Neutralise formula injection (OWASP CSV injection): a cell starting with
 * = + - @ TAB or CR gets a leading apostrophe. Leading whitespace/newlines are
 * checked too, because some spreadsheet apps trim them before evaluating.
 */
export function neutraliseFormula(value: string): string {
  const trimmed = value.replace(/^[\s\u0000-\u001f]+/, '');
  if (FORMULA_TRIGGERS.has(value.charAt(0)) || FORMULA_TRIGGERS.has(trimmed.charAt(0))) return `'${value}`;
  return value;
}

/** One CSV cell: formula-safe, quoted when it contains `;` `"` CR or LF. */
export function csvCell(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  const safe = neutraliseFormula(String(raw));
  if (/[;"\r\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export function csvRow(cells: readonly unknown[]): string {
  return cells.map(csvCell).join(CSV_SEPARATOR);
}

export interface ExportRow {
  email: string;
  status: string;
  lang: string | null;
  source: string | null;
  consent_at: string | null;
  consent_text_version: string | null;
}

/** Full file content (BOM + header + rows, CRLF). */
export function buildSubscribersCsv(rows: readonly ExportRow[]): string {
  const lines = [csvRow(CSV_HEADER)];
  for (const r of rows) {
    lines.push(csvRow([r.email, r.status, r.lang, r.source, r.consent_at, r.consent_text_version]));
  }
  return CSV_BOM + lines.join('\r\n') + '\r\n';
}

/** abonnes-confirmes-AAAA-MM-JJ.csv (Europe/Paris calendar day). */
export function exportFilename(now: Date = new Date()): string {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return `abonnes-confirmes-${day}.csv`;
}
