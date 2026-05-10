# TASKS.md — Parliamentary Housing System
## Development Progress Tracker
> Update checkboxes as tasks complete. Claude Code reads this every session.
> Legend: [ ] = not started | [~] = in progress | [x] = complete

---

## PHASE 0 — Project Setup
- [x] Initialize NestJS backend project
- [x] Initialize React + TypeScript frontend project
- [x] Configure PostgreSQL connection
- [x] Configure Prisma ORM
- [x] Configure MinIO (object storage)
- [x] Docker + docker-compose setup (backend, frontend, db, minio)
- [x] Nginx configuration
- [x] Environment variables (.env) structure defined
- [x] Git repository initialized with .gitignore

> NOTE: Migration + seed require Docker running. Run: `docker compose up -d postgres minio`
> then: `cd backend && npx prisma migrate dev --name init && npm run db:seed`

---

## PHASE 1 — Database Schema & Migrations

### Lookup Tables (Admin-Managed Dropdowns)
- [x] mp_flat_categories
- [x] staff_quarter_categories
- [x] political_parties
- [x] departments
- [x] mp_designations
- [x] mp_office_buildings
- [x] household_relation_types

### Core Tables
- [x] parliament_tenures
- [x] system_users
- [x] mps
- [x] staff
- [x] mp_offices
- [x] mp_flats
- [x] staff_quarters

### Allocation & History Tables
- [x] allocations (unified) + partial unique index
- [x] mp_designation_logs
- [x] staff_designation_logs
- [x] household_members

### Upload Tracking Tables
- [x] upload_logs
- [x] upload_log_rows

### System Tables
- [x] audit_logs

### Seed Data
- [x] Employee Class (Class-1, Class-2, Class-3, Class-4, No Class)
- [x] Grade (1–20)
- [x] Gender (Male, Female, Other)
- [x] Marital Status (Single, Married, Divorced, Widowed)
- [x] MP Status values
- [x] Staff Status values
- [x] Asset Status values
- [x] Default household relation types (Spouse, Son, Daughter, Father, Mother, Other)

> NOTE: Seed script at backend/prisma/seed.ts — run after migration

---

## PHASE 2 — Authentication & Authorization
- [x] system_users CRUD (SuperAdmin manages users)
- [x] Login endpoint (username + password → JWT)
- [x] JWT guard (protect all routes)
- [x] Role guard (SuperAdmin vs Admin)
- [x] Password hashing (bcrypt)
- [x] Session timeout handling (JWT expiry = 8h, configurable via JWT_EXPIRES_IN)
- [x] Initial SuperAdmin seed account

---

## PHASE 3 — Lookup / Dropdown Management (Admin UI)
> All 7 admin-managed dropdowns — each needs: list, add, edit, delete

- [x] MP Flat Categories API + UI
- [x] Staff Quarter Categories API + UI
- [x] Political Parties API + UI
- [x] Departments API + UI
- [x] MP Designations API + UI
- [x] MP Office Buildings API + UI
- [x] Household Relation Types API + UI

> Single unified controller: GET|POST /api/lookups/:type — :type is one of:
> mp-flat-categories, quarter-categories, political-parties, departments,
> mp-designations, office-buildings, relation-types

---

## PHASE 4 — Parliament Tenure Management
- [x] Create tenure (name, start_date)
- [x] Update tenure end_date (on dissolution)
- [x] Update tenure status
- [x] List all tenures
- [x] Tenure detail view

---

## PHASE 5 — MP Module

### MP Excel Upload
- [x] Upload endpoint (accept .xlsx / .xls)
- [x] Parse Excel with UTF-8 / Bangla text support
- [x] Validate rows (required fields, duplicate parliament_number)
- [x] Preview screen (valid rows + error rows)
- [x] Confirm → upsert to mps table
- [x] Auto-seed parties from upload (if not exists)
- [ ] Auto-seed constituencies from upload (stored as text field — no separate table needed)
- [x] Upload log saved with per-row result
- [ ] Error report downloadable (Excel) — deferred to reports phase

### MP CRUD
- [x] List MPs (filterable: tenure, status, party, search)
- [x] MP detail view
- [x] Edit MP fields (all fields editable)
- [x] Update MP status (Active/Resigned/Deceased/Seat Vacant)
- [x] Photo upload (JPG/PNG, 500KB max, stored in MinIO)

### MP Designation
- [x] Assign designation to MP
- [x] Change designation → log old + new + effective_date
- [x] Designation history view per MP

---

## PHASE 6 — Staff Module

### Staff Excel Upload
- [x] Upload endpoint (accept .xlsx / .xls)
- [x] Parse Excel with UTF-8 / Bangla text support
- [x] Validate rows (required fields, duplicate internal_user_id)
- [x] Preview screen (valid rows + error rows)
- [x] Confirm → upsert to staff table
- [x] Auto-seed departments from upload (if not exists)
- [x] Upload log saved with per-row result
- [ ] Error report downloadable (Excel) — deferred to reports phase

### Staff CRUD
- [x] List staff (filterable: status, department_id, grade, employee_class, search)
- [x] Staff detail view
- [x] Edit staff fields (all fields editable)
- [x] Update service status (Active/Retired/Transferred/Deceased)
- [x] Photo upload (JPG/PNG, 500KB max, stored in MinIO)

### Staff Designation Change
- [x] Update current designation
- [x] Log: old designation + new designation + effective_date
- [x] Designation history view per staff member

---

## PHASE 7 — Asset Management

### MP Offices
- [x] Create office (building dropdown, floor, room, intercom)
- [x] List offices (filterable: status, building_id)
- [x] Edit office (all fields editable)
- [x] Delete office (only if Vacant)
- [x] Status management (Vacant / Occupied / Under Maintenance)

### MP Flats
- [x] Create flat (category, location, building, flat_no, floor, area)
- [x] Validate flat_number unique within building
- [x] List flats (filterable: category, building, status)
- [x] Edit flat (all fields editable)
- [x] Status management

### Staff Quarters
- [x] Create quarter (category, quarter_number, location, optional fields)
- [x] Validate quarter_number unique within category
- [x] Auto-compose full_address on save
- [x] List quarters (filterable: category, location, status)
- [x] Edit quarter (all fields editable)
- [x] Status management

---

## PHASE 8 — Allocation Engine

### Core Allocation Logic
- [x] Enforce: asset must be Vacant before allocation (backend check)
- [x] Enforce: only one Active allocation per asset (partial unique index + service check)
- [x] On allocation created → set asset status = Occupied
- [x] On allocation vacated → set asset status = Vacant

### MP Office Allocation
- [x] Assign office to MP
- [x] Unassign (vacate) office from MP
- [x] View current office allocation for MP
- [x] Office allocation history

### MP Flat Allocation
- [x] Assign flat to MP
- [x] Unassign flat
- [x] Historical flat allocation preserved in reports
- [x] Flat allocation history per flat

### Staff Quarter Allocation
- [x] Assign quarter to staff
- [x] Vacate quarter from staff
- [x] Quarter allocation history (with designation at time of allocation)

---

## PHASE 9 — Household Members

- [x] Add household member to staff allocation
- [x] Fields: name_bn, name_en, relation_type, date_of_birth, identity_number, photo
- [x] Edit household member (all fields editable)
- [x] Remove household member (is_active = false — hidden from reports)
- [x] Photo upload for household member
- [x] List household members per staff / per quarter

---

## PHASE 10 — Reports Engine

### Report Infrastructure
- [x] Report generation service (pluggable per report)
- [x] PDF export (with letterhead: logo + title + date)
- [x] Excel export
- [x] Footer on every PDF page: "Bangladesh Parliament Secretariat — B&IT"
- [x] Column selection UI (user picks columns before generating)
- [x] Language selection at generation time (Bangla / English)
- [x] Logo file integrated into PDF header (parliament-logo.png in assets/, loaded as base64)

### Individual Reports
- [x] R-01: Quarter Detail Report
- [x] R-02: All Quarters Occupancy Status
- [x] R-03: Staff Housing Directory
- [x] R-04: Household Member List
- [x] R-05: Quarter Occupancy History
- [x] R-06: MP Office & Flat Directory
- [x] R-07: MP Flat Occupancy
- [x] R-08: Vacant Assets Summary
- [x] R-10: Category-wise Summary
- [x] R-11: Tenure Changeover Report

---

## PHASE 11 — Bilingual (i18n)

- [x] i18n setup in React (react-i18next)
- [x] English translation file (en.json)
- [x] Bangla translation file (bn.json)
- [x] Language toggle in UI header (persisted to localStorage via useLang hook)
- [x] All menus, labels, buttons, table headers translated (useTranslation throughout)
- [x] Form validation messages translated (val_required, val_invalid_date, etc.)
- [x] Report language parameter wired to PDF/Excel generation (ReportsPage lang selector)
- [ ] Bangla font rendering tested in PDF output (requires font files in assets/fonts/)

---

## PHASE 12 — Audit Log

- [x] Audit log middleware / interceptor (captures all mutations)
- [x] Stores: table, record_id, action, old_json, new_json, user, timestamp, IP
- [x] Audit log viewer UI — SuperAdmin only
- [x] Filters: by table, by user, by date range
- [x] Audit log NOT editable, NOT deletable (append-only)

---

## PHASE 13 — Admin Utilities

- [x] Manual backup trigger button (Admin UI) — POST /api/backup/trigger → pg_dump | gzip
- [x] Upload history log viewer — GET /api/upload-logs with per-row drill-down modal
- [x] System user management (SuperAdmin: add/edit/deactivate IT staff logins)

---

## PHASE 14 — QA & Hardening

### Demo Data
- [x] Demo seed script created (backend/prisma/seed-demo.ts)
- [x] npm run db:seed-demo — populates 10 MPs, 10 staff, 12 offices, 12 flats, 12 quarters, 22 allocations, 5 household members

### Testing Checklist
- [ ] Test: duplicate allocation prevention (try to assign Occupied asset)
- [ ] Test: Excel upload with Bangla text (UTF-8)
- [ ] Test: Excel upload with duplicate key rows
- [ ] Test: Photo upload (size limit, format rejection, compression)
- [~] Test: PDF report with Bangla font — English PDF works; Bengali needs NotoSansBengali-Regular.ttf in assets/fonts/
- [ ] Test: All 10 reports generate without error
- [ ] Test: Audit log captures designation change
- [ ] Test: Quarter history shows correct designation per period
- [ ] Test: Role guard — Admin cannot access audit logs
- [ ] Input validation on all API endpoints
- [ ] SQL injection / XSS protection review
- [ ] API error messages bilingual

---

## PHASE 15 — Deployment

- [ ] Production Docker build
- [ ] Nginx reverse proxy config
- [ ] SSL/TLS certificate setup
- [ ] MinIO production config (storage path, access keys)
- [ ] PostgreSQL production config (connection pool, pg_hba.conf)
- [ ] Environment variables secured
- [ ] Initial SuperAdmin account provisioned
- [ ] Weekly backup cron job configured

---

## CURRENT SPRINT
> **Update this section every session**

```
Sprint Goal    : Phase 14 QA — system live with demo data, all features testable
Started        : 2026-05-08
Status         : IN PROGRESS — Detail views complete, moving to QA

Currently Active Task:
  Phase  : Phase 14 — QA & Hardening
  Task   : Test reports, allocation rules, validation, security
  File   : Various

Blocked By     : Nothing
Notes          :
  - SuperAdmin login: superadmin / Admin@1234
  - Demo seed: npm run db:seed-demo (backend/) — safe to re-run
  - Detail drawers: click any row in MPs/Staff/Quarters/Flats/Offices to open side panel
  - MP Drawer: Profile + Designation History + Allocation History tabs
  - Staff Drawer: Profile + Designation History + Quarter History + Household Members tabs
  - Quarter/Flat/Office: Info panel + Allocation History
  - PDF works with NotoSansBengali font (both Bangla and English output)
  - Reports page: "Preview in Table" button shows inline preview
```

---

## DECISIONS LOG
> Record any new decisions made during development here.
> Format: [DATE] — [DECISION] — [REASON]

```
2026-02-17  — Project kickoff. 13th Parliament tenure created as seed.
2026-05-07  — Allocation model uses separate nullable FK columns (mp_office_id, mp_flat_id, quarter_id)
              instead of single asset_id — Prisma cannot express polymorphic FKs to multiple tables.
              Service layer enforces that only the correct FK is set per allocation_type.
2026-05-07  — Excel upload must accept PAIRS of files (Bangla + English) OR a single combined file.
              Actual sample files split names by language. Parser handles both formats.
2026-05-07  — Prisma 7 used (new config format: prisma.config.ts, generator = "prisma-client")
2026-05-07  — Staff department column: "দপ্তর" (Bangla) / "Office" (English) — NOT "বিভাগ"/"Department" as in spec.
              Parser must recognize both spellings.
```

---
