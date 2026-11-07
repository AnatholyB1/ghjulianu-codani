# Roadmap: v1.1 Téléchargement par email, newsletter & KPIs admin

## Milestones

- v1.0 shipped: Phases 1-4 (archived in `.planning/milestones/v1.0-ROADMAP.md`)
- v1.1 in progress: Phases 5-10

## Overview

v1.1 replaces the client-side photo downloads with a server-mediated flow: the visitor gives an email, receives an expiring link, and downloads photos or a streamed ZIP. Each step feeds first-party events, a newsletter list the admin controls, and a KPI dashboard. Phases follow the dependency chain: foundations, request, delivery, removal of the old system, newsletter management, then tracking and KPIs.

## Phases

- [ ] **Phase 5: Foundations** - Privacy policy, verified email domain, locked-down data tables
- [ ] **Phase 6: Demande de téléchargement par email** - Form, optional newsletter box, expiring-link email, abuse protection, private albums
- [ ] **Phase 7: Livraison des photos** - Landing page, single and ZIP download routes, atomic use counting
- [ ] **Phase 8: Suppression de l'ancien système & protection UI** - Remove direct downloads, block image extraction in the UI
- [ ] **Phase 9: Gestion de la newsletter** - Double opt-in, unsubscribe, bounce handling, admin list and CSV export
- [ ] **Phase 10: Suivi des événements & KPIs admin** - View tracking, stats dashboard, retention purge

## Phase Details

### Phase 5: Foundations
**Goal**: The legal, email-sending and data-protection groundwork exists so later phases can collect emails safely
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: FND-01, FND-02, FND-03
**Success Criteria** (what must be TRUE):
  1. Visitor can open a FR and EN privacy policy listing purposes, retention periods, processors (Resend/Supabase/Vercel) and GDPR rights
  2. Admin can send a test email from the verified domain that passes SPF/DKIM/DMARC checks
  3. A preview deployment never sends real emails
  4. Email, token and event tables return nothing to anonymous or public API requests
**Plans**: TBD
**UI hint**: yes

### Phase 6: Demande de téléchargement par email
**Goal**: A visitor can request their selected photos by email and receive an expiring link, including for private albums
**Depends on**: Phase 5
**Requirements**: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05
**Success Criteria** (what must be TRUE):
  1. Visitor enters an email from the selection and sees a generic confirmation message
  2. Visitor receives a FR or EN email with a link valid 48 h and 3 uses
  3. Visitor can leave the newsletter box unchecked (default) and still receive the download link
  4. Bots (honeypot) and repeated requests per IP or email are rejected without revealing whether an email is known
  5. Visitor to a private album enters the access key, which is checked server-side with limited attempts, then follows the same email flow
**Plans**: TBD
**UI hint**: yes

### Phase 7: Livraison des photos
**Goal**: A visitor opening the emailed link can safely download one photo or all photos as a ZIP
**Depends on**: Phase 6
**Requirements**: DLV-01, DLV-02, DLV-03, DLV-04, PRT-03
**Success Criteria** (what must be TRUE):
  1. Visitor opens the link and sees a landing page with thumbnails, or a clear expired/used-up state, without a use being consumed
  2. Visitor downloads a single photo or a streamed ZIP of all photos without the server stalling
  3. Large selections are split into parts under the size cap, and the ZIP is not recompressed
  4. Each download consumes exactly one use atomically (concurrent clicks cannot exceed 3) and records bytes transferred
  5. File source is chosen by one function, ready for private originals in v1.2
**Plans**: TBD
**UI hint**: yes

### Phase 8: Suppression de l'ancien système & protection UI
**Goal**: The email flow is the only way to download, and public images resist casual extraction
**Depends on**: Phase 7
**Requirements**: PRT-01, PRT-02
**Success Criteria** (what must be TRUE):
  1. No direct download path remains (cart download, browser ZIP, folder picker); `jszip` is gone from the project
  2. Right-click, drag and long-press are blocked on public images on desktop, iOS and Android
  3. Form fields still work normally and the lightbox is unaffected
**Plans**: TBD
**UI hint**: yes

### Phase 9: Gestion de la newsletter
**Goal**: Subscribers are confirmed, can leave in one click, are cleaned automatically, and the admin controls the list
**Depends on**: Phase 6, Phase 5
**Requirements**: NWS-01, NWS-02, NWS-03, NWS-04, NWS-05
**Success Criteria** (what must be TRUE):
  1. A person who ticked the box receives a confirmation email and is subscribed only after pressing its button
  2. Subscriber can unsubscribe in one click from any email, including via the mail client unsubscribe header
  3. A bounce or spam complaint removes the address automatically
  4. Admin can view, filter and delete subscribers in the admin
  5. Admin can export confirmed subscribers to CSV that opens correctly in Excel and is safe from formula injection
**Plans**: TBD
**UI hint**: yes

### Phase 10: Suivi des événements & KPIs admin
**Goal**: The admin can see how the site and downloads perform, with privacy-friendly data
**Depends on**: Phase 7, Phase 9
**Requirements**: KPI-01, KPI-02, KPI-03, KPI-04, KPI-05, KPI-06, KPI-07
**Success Criteria** (what must be TRUE):
  1. Admin sees downloads and views with a period selector and variation versus the previous period
  2. Admin sees favorite photos (selection adds), most downloaded photos, and top albums
  3. Admin sees the funnel (view, request, link opened, downloaded), newsletter signup rate, subscriber growth and estimated bandwidth
  4. Admin sees day/night split and device breakdown
  5. Views are counted after real display, once per session and day, with bots filtered and no cookie or raw IP stored
  6. Raw events older than about 13 months are purged while aggregates remain
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Foundations | 0/? | Not started | - |
| 6. Demande de téléchargement par email | 0/? | Not started | - |
| 7. Livraison des photos | 0/? | Not started | - |
| 8. Suppression de l'ancien système & protection UI | 0/? | Not started | - |
| 9. Gestion de la newsletter | 0/? | Not started | - |
| 10. Suivi des événements & KPIs admin | 0/? | Not started | - |
