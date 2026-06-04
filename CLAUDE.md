# Parliamentary Housing & Office Management System
## Claude Code Project Context — Auto-read at every session start

---

## SYSTEM OVERVIEW

| Field | Value |
|---|---|
| System Name | Parliamentary Housing & Office Management System |
| Parliament | 13th Parliament — started 17 Feb 2026, end date open |
| Primary Purpose | Asset allocation tracking + Report generation |
| Language | Bilingual — Bangla (বাংলা) + English (UI, Data, Reports) |
| Users | IT Staff only (Username + Password login) |
| Roles | SuperAdmin (full access + audit logs), Admin (everything else) |
| Deployment | Parliament's own server room, Internet-facing |
| Server Managed By | Parliament IT Team |
| Notifications | None required |
| Approval Workflow | None — single-actor system |
| Digital Signature | None required |

---

## TECH STACK

```
Backend         : Node.js + NestJS (TypeScript)
Database        : PostgreSQL
ORM             : Prisma
Frontend        : React + TypeScript
UI Library      : Ant Design
File Storage    : MinIO (object storage — S3-compatible, self-hosted)
Report PDF      : pdfmake or Puppeteer (TBD during report phase)
Report Excel    : SheetJS (xlsx)
Auth            : JWT + Role-based (SuperAdmin, Admin)
Deployment      : Docker + Nginx
Bangla Font     : Unicode (Noto Sans Bengali)
```

---

## PROJECT STRUCTURE

```
/
├── CLAUDE.md              ← YOU ARE HERE — read first every session
├── TASKS.md               ← Progress tracker — check after reading this
├── backend/
│   ├── src/
│   │   ├── auth/          ← JWT auth, roles, guards
│   │   ├── users/         ← System users (IT staff)
│   │   ├── tenure/        ← Parliament tenure management
│   │   ├── lookups/       ← All admin-managed dropdowns
│   │   ├── mp/            ← MP entity + Excel upload + photo
│   │   ├── staff/         ← Staff entity + Excel upload + photo
│   │   ├── office/        ← MP Office assets
│   │   ├── mp-flat/       ← MP Flat assets
│   │   ├── quarter/       ← Staff Quarter assets
│   │   ├── allocation/    ← Unified allocation engine
│   │   ├── household/     ← Household members under staff
│   │   ├── reports/       ← All 10 reports (PDF + Excel)
│   │   ├── upload/        ← Excel import pipeline
│   │   ├── audit/         ← Audit log (SuperAdmin only)
│   │   └── storage/       ← MinIO photo upload service
│   ├── prisma/
│   │   └── schema.prisma  ← Single source of truth for DB
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── i18n/          ← Bangla + English translations
│   │   └── services/      ← API calls
│   └── package.json
└── docs/
    ├── ER-diagram.md
    └── decisions.md
```

---

## DATABASE — ALL TABLES (~23 tables)

### Core Entities
```
parliament_tenures          ← Parliament session records
mps                         ← 350 MPs per tenure
staff                       ← 1000+ Secretariat staff
mp_offices                  ← Office assets
mp_flats                    ← MP flat assets
staff_quarters              ← Staff quarter assets
```

### Allocation & History
```
allocations                 ← Unified: OFFICE | MP_FLAT | STAFF_QUARTER
                               One active allocation per asset (partial unique index)
mp_designation_logs         ← MP designation change history
staff_designation_logs      ← Staff designation change history
household_members           ← Persons living in staff quarters
```

### Admin-Managed Lookup Tables (7 dropdowns)
```
mp_flat_categories          ← e.g. N.A.C., H.C., A, B, C ...
staff_quarter_categories    ← Admin-created quarter types
political_parties           ← Seeded from MP Excel, then admin-managed
departments                 ← Seeded from Staff Excel, then admin-managed
mp_designations             ← MP, Minister, Speaker, Whip, etc.
mp_office_buildings         ← Building names for MP offices
household_relation_types    ← Spouse, Son, Daughter, Father, Mother, Other ...
```

### System-Seeded Fixed Lists (no admin UI — hardcoded in app)
```
employee_class   : Class-1, Class-2, Class-3, Class-4, No Class
grade            : 1–20 (Bangladesh Civil Service)
gender           : Male, Female, Other
marital_status   : Single, Married, Divorced, Widowed
mp_status        : Active, Resigned, Deceased, Seat Vacant
staff_status     : Active, Retired, Transferred, Deceased
asset_status     : Vacant, Occupied, Under Maintenance
allocation_type  : OFFICE, MP_FLAT, STAFF_QUARTER
occupant_type    : MP, STAFF
```

### Upload Tracking
```
upload_logs                 ← Each Excel import: filename, date, user, row results
upload_log_rows             ← Per-row result: success | error message
```

### System
```
system_users                ← IT staff login accounts
audit_logs                  ← All insert/update/delete — SuperAdmin view only
```

---

## ENTITY FIELD REFERENCE

### parliament_tenures
```
id, name, start_date, end_date (nullable), status, created_by, created_at
```

### mps
```
id, parliament_number (unique), name_bn, name_en,
constituency (text — from Excel), party_id,
gender, photo_path, internal_user_id,
designation_id (nullable → mp_designations),
designation_since (date, nullable),
status, tenure_id, created_at, updated_at
```

### mp_designation_logs
```
id, mp_id, old_designation_id, new_designation_id,
effective_date, changed_by, changed_at
```

### mp_offices
```
id, building_id (→ mp_office_buildings), floor,
room_number, phone_intercom (nullable),
status, created_at, updated_at
```

### mp_flats
```
id, category_id (→ mp_flat_categories),
location_name, building_name,
flat_number (unique within building),
floor, area_sqft, status, created_at, updated_at
```

### staff
```
id, internal_user_id (unique), name_bn, name_en,
mobile, employee_class, grade (1–20),
designation (text — current), department_id,
gender, marital_status, photo_path,
service_status, created_at, updated_at
```

### staff_designation_logs
```
id, staff_id, old_designation, new_designation,
effective_date, changed_by, changed_at
```

### staff_quarters
```
id, category_id (→ staff_quarter_categories),
quarter_number (unique within category),
location, building_name (nullable),
floor (nullable), house_flat_number (nullable),
area_sqft, full_address (computed on save),
status, created_at, updated_at
```
> full_address format:
> "CategoryName - QuarterNo, House/FlatNo, Location" OR
> "CategoryName - QuarterNo, Location"

### allocations (UNIFIED)
```
id, allocation_type (OFFICE|MP_FLAT|STAFF_QUARTER),
asset_id, occupant_type (MP|STAFF), occupant_id,
allotment_date,          ← "Received Date" = moved in
vacated_date (nullable), ← "Handover Date" = moved out
remarks (nullable), status (Active|Vacated),
created_by, created_at, updated_at
```
> CONSTRAINT: only ONE Active allocation per asset_id at a time
> ENFORCED BY: partial unique index on (asset_id) WHERE status = 'Active'

### household_members
```
id, staff_id, allocation_id,
name_bn, name_en,
relation_type_id (→ household_relation_types),
date_of_birth, identity_number,
photo_path, is_active (bool — false = removed),
created_at, updated_at
```
> Removed members (is_active = false) DO NOT appear in reports

---

## EXCEL UPLOAD SPECIFICATION

### MP Excel Columns
```
Column             | Bangla Header
parliament_number  | সংসদ নাম্বার
constituency       | নির্বাচনী এলাকার নাম ও নম্বর
name_bn            | সংসদ সদস্যের নাম (বাংলা)
name_en            | MP Name (English)
party              | রাজনৈতিক দল
status             | স্ট্যাটাস
internal_user_id   | ইউজার আইডি
gender             | লিঙ্গ
```
> Photos: uploaded separately via UI after import
> Upsert key: parliament_number
> Duplicate parliament_number in same file → reject row, log error
> Party value: insert into political_parties if not exists
> Constituency: extracted and seeded on first upload

### Staff Excel Columns
```
Column             | Bangla Header
internal_user_id   | ইউজার আইডি
name_bn            | কর্মকর্তা/কর্মচারির নাম (বাংলা)
name_en            | Employee Name (English)
mobile             | মোবাইল নাম্বার
employee_class     | কর্মকর্তা/কর্মচারি ক্লাস
grade              | গ্রেড
designation        | পদবী
department         | বিভাগ
gender             | লিঙ্গ
marital_status     | বৈবাহিক অবস্থা
```
> Photos: uploaded separately via UI after import
> Upsert key: internal_user_id
> Duplicate internal_user_id in same file → reject row, log error
> Department: insert into departments table if not exists

### Upload Pipeline (both MP and Staff)
```
1. Admin uploads Excel file via UI
2. System parses file (UTF-8 encoding — handle Bangla text)
3. Validate each row (required fields, format, duplicates)
4. Show PREVIEW: X valid rows, Y error rows (downloadable error list)
5. Admin confirms
6. System upserts valid rows
7. Upload log saved with per-row result
```

---

## PHOTO HANDLING

```
Upload trigger  : UI button on each MP / Staff / Household Member record
Accepted formats: JPG, PNG only
Max file size   : 500KB (compress on upload if needed)
Min resolution  : 300×300px
Storage         : MinIO (object storage)
DB stores       : photo_path (string URL/path only — never BLOB)
In reports      : Optional — user selects columns at report generation time
Entities        : MPs, Staff, Household Members
```

---

## REPORTS — FULL LIST (10 reports)

| Code | Report Name | Key Filters |
|---|---|---|
| R-01 | Quarter Detail Report | Category + Quarter Number |
| R-02 | All Quarters Occupancy Status | Category, Status |
| R-03 | Staff Housing Directory | Category, Department, Status |
| R-04 | Household Member List | Quarter, Staff |
| R-05 | Quarter Occupancy History | Quarter Number |
| R-06 | MP Office & Flat Directory | Tenure, Status, Party |
| R-07 | MP Flat Occupancy | Category, Building |
| R-08 | Vacant Assets Summary | Asset Type, Category |
| R-10 | Category-wise Summary | Asset Type |
| R-11 | Tenure Changeover Report | Tenure |

### All Reports Share:
```
Generation    : Real-time
Export        : PDF + Excel
Header        : Parliament of Bangladesh logo + Report Title + Generated Date
Footer        : Bangladesh Parliament Secretariat — B&IT
Column Select : User selects which columns to include at generation time
Language      : User selects Bangla or English at generation time
```

### R-01 Quarter Detail — Field List
```
Quarter Category | Quarter Number | Location | House/Flat Number
Area (sqft) | Floor | Building Name | Full Address
Allotment Date (Received) | Vacation Date (Handover)
Officer Name | Officer Designation (current for active, historical for past)
Household Members: Name | Relation | Age | Identity Number | Photo (if selected)
```

---

## AUDIT LOG
```
Viewer   : SuperAdmin only
Captures : All INSERT / UPDATE / DELETE
Fields   : table_name, record_id, action, old_value_json,
           new_value_json, changed_by, changed_at, ip_address
```

---

## BACKUP
```
Automated : Weekly (Parliament IT manages)
Manual    : Admin can trigger backup via UI button anytime
```

---

## BILINGUAL IMPLEMENTATION NOTES
```
- Every data entity has _bn and _en field variants for name fields
- UI language toggle: stored in user session/preference
- Report language: selected by user at report generation time
- Bangla text in Excel: handle UTF-8 encoding explicitly during parse
- All lookup table entries should have name_bn + name_en
- Constituency data comes from MP Excel — store both scripts
```

---

## EDIT POLICY
```
Everything is editable after creation — no locked fields.
History preserved via:
  - allocation records      (who lived where, when)
  - designation_logs        (old → new designation with effective_date)
  - audit_logs              (who changed what field, old value, new value)
```

---

## ⚡ CURRENT SESSION STATUS
> **UPDATE THIS SECTION before ending every session**

```
Last Updated     : 04 Jun, 2026
Last Worked On   : Dashboard upgrade — real aggregated data + interactive Recharts charts

File Last Edited :
  backend/src/dashboard/dashboard.service.ts                ← New: aggregate stats with Prisma groupBy
  backend/src/dashboard/dashboard.controller.ts             ← New: GET /api/dashboard/stats
  backend/src/dashboard/dashboard.module.ts                 ← New: DashboardModule
  backend/src/app.module.ts                                 ← Registered DashboardModule
  frontend/src/pages/DashboardPage.tsx                      ← Full rewrite: stat cards + 6 Recharts charts + recent allocations table
  frontend/src/i18n/en.json                                 ← Added 22 new dashboard i18n keys
  frontend/src/i18n/bn.json                                 ← Added 22 new dashboard i18n keys (Bangla)
  frontend/package.json                                     ← Added recharts ^2.15.3
  frontend/Dockerfile                                       ← Changed npm ci → npm install (needed for recharts)
  backend/prisma/schema.prisma                              ← Added name_bn to ParliamentTenure
  backend/prisma/migrations/20260510181345_add_tenure_name_bn/ ← New migration for tenure name_bn
  backend/src/tenure/dto/tenure.dto.ts                      ← Added name_bn to Create/UpdateTenureDto
  backend/src/tenure/tenure.service.ts                      ← Added name_bn to create/update
  backend/src/mp/mp-upload.parser.ts                        ← Split party → party_en + party_bn (file language detection)
  backend/src/mp/dto/mp.dto.ts                              ← MpRowDto: party → party_en + party_bn
  backend/src/mp/mp.service.ts                              ← Bilingual party upsert (find + update or create)
  backend/src/staff/staff-upload.parser.ts                  ← Split department → department_en + department_bn
  backend/src/staff/dto/staff.dto.ts                        ← StaffRowDto: department → department_en + department_bn
  backend/src/staff/staff.service.ts                        ← Bilingual department upsert
  backend/prisma/seed.ts                                    ← Added setval() calls after explicit-ID inserts
  backend/prisma/seed-demo.ts                               ← Added setval() calls after explicit-ID inserts
  frontend/src/pages/tenure/TenurePage.tsx                  ← Added name_bn field to form and table
  frontend/src/pages/mp/MpsPage.tsx                         ← ParsedRow: party → party_en + party_bn; merge fix
  frontend/src/pages/staff/StaffPage.tsx                    ← ParsedRow: department → department_en + department_bn; merge fix

Key Features Added This Session:
  1. Parliament Tenure bilingual — form now has English name + Bangla name fields
  2. Political Parties bilingual — MP upload parser detects file language (English/Bangla)
     and stores party_en from English file, party_bn from Bangla file separately.
     On re-import, existing parties are updated with the missing language name.
  3. Departments bilingual — same pattern: "Office" column (English Excel) → name_en,
     "বিভাগ" column (Bangla Excel) → name_bn.
  4. Fixed all DB sequence mismatches (seed used explicit IDs; sequences not advanced).
     Auto-fix applied at startup of seed scripts via setval().
  5. Fixed 4 failed MP rows (013000101-013000401) — caused by sequence collision.
     Inserted them directly + fixed root cause in seed.
  6. Restored 245 MPs with NULL party_id back to BNP (party_id=2) using Excel data.

Data Notes:
  - Political parties in DB are now fully bilingual (ids 2, 3, 4, 6-14)
  - All 348 MPs imported successfully; party distribution: BNP=246, Jamaat=77, Independent=8,
    NCP=8, and 5 smaller parties with 1-3 MPs each
  - Departments (ids 6-97) from staff import currently have Bangla name as name_en.
    Admin should re-upload both Bangla + English staff Excel to populate English dept names.
  - Re-uploading MP Excel (both files) will update party bilingual data automatically.

Stopped Because  : All 3 bilingual issues fixed
Next Step        :
  - Admin should re-upload staff Excel (Bangla + English) to populate English department names
  - Admin should re-upload MP Excel (Bangla + English) to confirm bilingual party names
  - QA testing: all 10 reports, duplicate allocation prevention, photo upload
  - Input validation audit on all API endpoints

Stopped Because  : All planned features complete
Next Step        :
  - QA testing: duplicate allocation prevention, Excel upload with Bangla text, PDF reports
  - Test all 10 reports generate without error
  - Input validation audit on all API endpoints
  - SQL injection / XSS protection review
```


---

## 🔁 HOW TO RESUME AFTER LIMIT RESET

Say exactly this at the start of a new session:

> **"Read CLAUDE.md and TASKS.md. Tell me what was in progress and continue building it."**

---
