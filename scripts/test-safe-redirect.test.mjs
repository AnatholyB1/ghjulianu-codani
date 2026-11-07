// node --test --import ./scripts/ts-register.mjs scripts/test-safe-redirect.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const { safeRelativePath } = await import('../src/lib/safeRedirect.ts');

test('safeRelativePath keeps same-origin relative paths', () => {
  assert.equal(safeRelativePath('/admin/stats?x=1'), '/admin/stats?x=1');
  assert.equal(safeRelativePath('/'), '/');
});

test('safeRelativePath rejects absolute, protocol-relative, backslash and junk', () => {
  for (const bad of ['https://evil.io', 'http://evil.io/x', '//evil.io', '/\\evil.io', '\\evil', 'javascript:alert(1)', 'admin', '', '/a\nb', null, undefined]) {
    assert.equal(safeRelativePath(bad), '/admin', String(bad));
  }
});
