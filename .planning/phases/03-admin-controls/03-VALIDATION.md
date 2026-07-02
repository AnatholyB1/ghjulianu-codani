---
phase: 3
slug: admin-controls
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-02
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — TypeScript as primary gate |
| **Config file** | tsconfig.json |
| **Quick run command** | `rtk tsc` |
| **Full suite command** | `rtk next build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `rtk tsc` (TypeScript check)
- **After every plan wave:** Run `rtk next build` (full build + lint)
- **Before `/gsd-verify-work`:** Full build must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-xx-01 | migration | 1 | PHO-01/ALB-02 | — | album_photos.is_day column present | build | `rtk next build` | ❌ W0 | ⬜ pending |
| 03-xx-02 | PortfolioAdminGrid | 1 | PHO-01 | T-03-01 | is_day only 'true'/'false'/'null' accepted | build | `rtk tsc` | ❌ W0 | ⬜ pending |
| 03-xx-03 | bulk action | 1 | PHO-02 | T-03-01 | bulk action only updates boolean\|null | build | `rtk tsc` | ❌ W0 | ⬜ pending |
| 03-xx-04 | indicators | 2 | PHO-03/ALB-03 | — | Sun/Moon badge renders per is_day | manual | — | ❌ | ⬜ pending |
| 03-xx-05 | album form | 2 | ALB-01 | T-03-02 | updateAlbum includes is_day, access_key intact | build | `rtk next build` | ❌ W0 | ⬜ pending |
| 03-xx-06 | inheritance UI | 2 | ALB-02 | — | inherited vs explicit badge in DraggablePhotoGrid | manual | — | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test framework to install. TypeScript coverage via `rtk tsc` and `rtk next build` is the automated gate.

- [ ] Ensure `album_photos` table has `is_day boolean | null` after migration (verified via `rtk next build` compiling AlbumPhoto type)
- [ ] `src/lib/db.types.ts` updated with `is_day?: boolean | null` on AlbumPhoto interface
- [ ] TypeScript must compile cleanly before any wave 2 tasks begin

*Existing infrastructure covers all phase requirements to the extent automation is available.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Inline toggle cycles NULL→day→night→NULL | PHO-01 | No test framework | Click photo card toggle in /admin/portfolio, verify icon cycles through states |
| Bulk select marks multiple photos | PHO-02 | No test framework | Click SELECT, check multiple photos, click MARK DAY, verify all updated |
| Sun/Moon badge renders per is_day | PHO-03 | No test framework | Visit /admin/portfolio, verify badges match database values |
| Album edit form saves is_day | ALB-01 | No test framework | Edit album, set day/night/untagged, save, re-open, verify value persists |
| Inherited vs explicit badge in album edit | ALB-02 | No test framework | Open album with is_day set; verify album photos show inherited badge; override one, verify explicit badge |
| Album list shows day/night indicator | ALB-03 | No test framework | Visit /admin/albums, verify each row shows ☀/☾/— matching album is_day |

---

## Security Threat Model (ASVS L1)

| Threat | STRIDE | Mitigation |
|--------|--------|-----------|
| Malicious is_day value in inline toggle | Tampering | Server Action accepts only `boolean \| null` via whitelist: parse 'true'→true, 'false'→false, else null |
| Bulk update via forged ids array | Tampering | Admin auth gate (admin layout); Supabase RLS restricts writes to authenticated users |
| Unauthorized Server Action call | Elevation of Privilege | Admin layout auth gate inherited by all Server Actions in /admin/* |

**Blocking threats for SECURITY_BLOCK=high:** None classified as high — admin auth gate and TypeScript type enforcement cover L1.

---

## Validation Sign-Off

- [ ] All tasks have TypeScript `rtk tsc` verify or manual verification instructions
- [ ] Wave 0 (migration + db.types.ts update) complete before wave 2 tasks
- [ ] Full `rtk next build` green before verification
- [ ] No watch-mode flags used in commands
- [ ] Feedback latency < 30s (tsc) / ~30s (next build)
- [ ] `nyquist_compliant: true` set in frontmatter when all checks pass

**Approval:** pending
