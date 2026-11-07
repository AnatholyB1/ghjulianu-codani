/** Same-origin relative path only (single leading slash, no double slash, no backslash, no control chars). */
export function safeRelativePath(target: string | null | undefined, fallback = '/admin'): string {
  if (typeof target !== 'string') return fallback;
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return fallback;
  if (/[\u0000-\u001f]/.test(target)) return fallback;
  return target;
}
