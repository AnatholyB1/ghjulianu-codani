// node scripts/test-delivery-plan.mjs  (Node >= 22.18 strips TS types natively)
import assert from 'node:assert/strict';
import { planParts, ZIP_PART_MAX_BYTES, ZIP_PART_MAX_FILES, zipFileName, photoFileName, downloadPrefix } from '../src/lib/server/deliveryPlan.ts';
const MB = 1024 * 1024;
// 96 photos x 2.57 MB = ~247 MB (contract example) -> split by bytes AND files
const items = Array.from({ length: 96 }, (_, i) => ({ i, bytes: Math.round(2.57 * MB) }));
const parts = planParts(items);
assert.equal(ZIP_PART_MAX_BYTES, 70 * MB);
assert.equal(parts.length, 4);
for (const p of parts) { assert.ok(p.bytes <= ZIP_PART_MAX_BYTES); assert.ok(p.items.length <= ZIP_PART_MAX_FILES); }
assert.equal(parts.flatMap((p) => p.items).length, 96);
assert.deepEqual(planParts(items).map((p) => p.items.length), parts.map((p) => p.items.length), 'deterministic');
// byte cap bites before file cap
assert.deepEqual(planParts(Array.from({ length: 10 }, () => ({ bytes: 50 * MB }))).map((p) => p.items.length), [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
assert.deepEqual(planParts(Array.from({ length: 6 }, () => ({ bytes: 30 * MB }))).map((p) => p.items.length), [2, 2, 2]);
// oversize single file gets its own part; empty input gives no part
assert.deepEqual(planParts([{ bytes: 1 }, { bytes: 500 * MB }, { bytes: 1 }]).map((p) => p.items.length), [1, 1, 1]);
assert.equal(planParts([]).length, 0);
// names
assert.equal(downloadPrefix('furtive-2025'), 'FURTIVE2025');
assert.equal(photoFileName('FURTIVE2025', 7, 'jpg'), 'FURTIVE2025_007.jpg');
assert.equal(zipFileName('X', 2, 3), 'X_part2of3.zip');
assert.equal(zipFileName('X', 1, 1), 'X.zip');
// M4: any unknown size => split by count only (cap 20), regardless of which items are unknown
const unk = Array.from({ length: 45 }, (_, i) => ({ i, bytes: 3 * MB, known: i !== 7 }));
assert.deepEqual(planParts(unk).map((p) => p.items.length), [20, 20, 5]);
const unk2 = unk.map((x, i) => ({ ...x, known: i !== 30, bytes: i === 3 ? 60 * MB : x.bytes }));
assert.deepEqual(planParts(unk2).map((p) => p.items.length), [20, 20, 5], 'which item is unknown does not matter');
assert.deepEqual(planParts(unk.map((x) => ({ ...x, known: true }))).map((p) => p.items.length), [23, 22]);
console.log('planParts / names: all assertions passed');
