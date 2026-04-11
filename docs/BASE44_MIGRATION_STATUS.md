# BASE44_MIGRATION_STATUS.md

**Generated:** 2026-04-11  
**Based on:** `entities/*.jsonc` (92 schemas), `src/api/base44Client.js`, `backend/src/TscPlatform.Api/Controllers/`, `docs/BACKEND_MIGRATION_PLAN.md`, `docs/INITIAL_DATA_IMPORT_PLAN.md`  
**Rule:** This is a migration, not a redesign. No renaming, no UI changes, only Base44 dependency replacement.

---

## Classification Key

| Status | Meaning |
|--------|---------|
| ✅ **Fully migrated** | Real backend GET + POST + PUT + DELETE. Frontend wired. Data persists. |
| 🔶 **Partially migrated** | Backend has GET + some writes. DELETE missing, or writes exist backend-side but frontend has edge-case bugs. |
| 📖 **Read-only migrated** | Backend has GET endpoint. Frontend reads real data. Writes are no-op or not yet needed. |
| 🔴 **Not migrated** | No backend endpoint. Frontend uses in-memory `makeStore` or falls through to `genericEntityHandler` (no-op proxy). Nothing persists. |

---

## How the Frontend Stub Works Today

`src/api/base44Client.js` dispatches every `base44.entities.<EntityName>.*` call through one of four paths:

| Path | Entities | Behavior |
|------|----------|----------|
| `makeApiStore(url)` | 18 entities | GET fetches from real backend. create→POST, update→PUT are wired. `delete` is always **noop**. |
| Custom Country store | `Country` | GET from `/api/countries`. Writes are noop. |
| Custom `TerminalDocumentRequirement` store | 1 entity | Full POST/PUT/bulkCreate wired. |
| `makeStore(seed)` | `Vessel`, `Company`, `Document` | In-memory session only. Data lost on page refresh. |
| `genericEntityHandler` | All remaining ~70 entities | Returns `[]` for reads, stub ID for creates, silently does nothing for updates/deletes. |

---

## Group 1 — Reference Data (Migration Plan Phase 1)

**Entities: Country, CountryAlias, CountryMaritimeZone, MaritimeZone, ProductTypeRef, CargoTypeRef, FuelTypeRef, VesselTypeRef, VesselTypeAllowedCargoType, VesselTypeAllowedFuelType, VesselTypeCargoPolicy, VesselTypeFuelTankPolicy, TerminalType, DocumentCategory, DocumentType, DocumentTypeExternalCode, IssuingAuthority, SystemTag, UdfConfiguration, UdfListValue, MapConfiguration**

### Sub-group 1a — Pure Lookup / Dropdown Sources

These entities are read-only from the UI. No create/edit pages in normal operation (only Configuration admin pages). Backend GET endpoints exist and are wired.

| Entity | Backend Model | Controller | GET | POST | PUT | DELETE | Frontend Store | Status |
|--------|--------------|------------|-----|------|-----|--------|----------------|--------|
| Country | ✅ Phase1 | `GET /api/countries` | ✅ | ➖ | ➖ | ➖ | Custom (read-only) | 📖 Read-only |
| CountryAlias | ✅ Phase1 | `GET /api/country-aliases` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| MaritimeZone | ✅ Phase1 | `GET /api/maritime-zones` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| CountryMaritimeZone | ✅ Phase1 | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler (no-op) | 🔴 Not migrated |
| ProductTypeRef | ✅ Phase1 | `GET /api/product-types` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| CargoTypeRef | ✅ Phase1 | `GET /api/cargo-types` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| FuelTypeRef | ✅ Phase1 | `GET /api/fuel-types` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| VesselTypeRef | ✅ Phase1 | `GET /api/vessel-types` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| VesselTypeAllowedCargoType | ✅ Phase1 | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler (no-op) | 🔴 Not migrated |
| VesselTypeAllowedFuelType | ✅ Phase1 | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler (no-op) | 🔴 Not migrated |
| VesselTypeCargoPolicy | ✅ Phase1 | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler (no-op) | 🔴 Not migrated |
| VesselTypeFuelTankPolicy | ✅ Phase1 | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler (no-op) | 🔴 Not migrated |
| TerminalType | ✅ Phase1 | `GET /api/terminal-types` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| IssuingAuthority | ✅ Phase1 | `GET /api/issuing-authorities` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| DocumentTypeExternalCode | ✅ Phase1 | `GET /api/document-type-external-codes` | ✅ | ❌ | ❌ | ❌ | makeApiStore | 📖 Read-only |
| SystemTag | ✅ Phase1 | `GET /api/system-tags` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| UdfConfiguration | ✅ Phase1 | `GET /api/udf-configurations` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| UdfListValue | ✅ Phase1 | `GET /api/udf-list-values` | ✅ | ➖ | ➖ | ➖ | makeApiStore | 📖 Read-only |
| MapConfiguration | ✅ Phase1 | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler (no-op) | 🔴 Not migrated |

### Sub-group 1b — Actively Edited Reference Data

These have dedicated edit/create pages in the Configuration section.

| Entity | Pages | GET | POST | PUT | DELETE | Status |
|--------|-------|-----|------|-----|--------|--------|
| DocumentCategory | `DocumentCategories`, `EditDocumentCategory`, `DocumentCategoryDetail` | ✅ | ✅ | ✅ | ❌ | 🔶 Partial (no DELETE) |
| DocumentType | `DocumentTypes`, `EditDocumentType`, `DocumentTypeDetail` | ✅ | ✅ | ✅ | ❌ | 🔶 Partial (no DELETE) |
| Country | `Countries`, `EditCountry`, `CountryDetail` | ✅ | ❌ | ❌ | ❌ | 📖 Read-only (edit UI exists but writes fail silently) |
| CountryAlias | `CountryAliases` | ✅ | ❌ | ❌ | ❌ | 📖 Read-only |
| IssuingAuthority | `IssuingAuthorities`, `EditIssuingAuthority`, `AddIssuingAuthority` | ✅ | ❌ | ❌ | ❌ | 📖 Read-only (edit UI writes silently fail) |
| ProductTypeRef | `ProductTypes`, `EditProductType`, `AddProductType` | ✅ | ❌ | ❌ | ❌ | 📖 Read-only |
| CargoTypeRef | `CargoTypes`, `EditCargoType`, `AddCargoType` | ✅ | ❌ | ❌ | ❌ | 📖 Read-only |
| FuelTypeRef | `FuelTypes`, `EditFuelType`, `AddFuelType` | ✅ | ❌ | ❌ | ❌ | 📖 Read-only |
| VesselTypeRef | `VesselTypes`, `EditVesselType`, `AddVesselType` | ✅ | ❌ | ❌ | ❌ | 📖 Read-only |
| MaritimeZone | `MaritimeZones` | ✅ | ❌ | ❌ | ❌ | 📖 Read-only |
| SystemTag | `SystemTags`, `EditSystemTag`, `AddSystemTag`, `SystemTagDetail` | ✅ | ❌ | ❌ | ❌ | 📖 Read-only |
| UdfConfiguration | `UdfConfigurations`, `EditUdfConfiguration` | ✅ | ❌ | ❌ | ❌ | 📖 Read-only |
| VesselTypeAllowedCargoType | `VesselTypeAllowedCargoTypes` | ❌ | ❌ | ❌ | ❌ | 🔴 Not migrated |
| VesselTypeAllowedFuelType | `VesselTypeAllowedFuelTypes` | ❌ | ❌ | ❌ | ❌ | 🔴 Not migrated |
| VesselTypeCargoPolicy | `VesselTypeCargoPolicy` | ❌ | ❌ | ❌ | ❌ | 🔴 Not migrated |
| VesselTypeFuelTankPolicy | `VesselTypeFuelTankPolicy` | ❌ | ❌ | ❌ | ❌ | 🔴 Not migrated |

### Known Issues — Group 1

1. **`delete` is always noop on makeApiStore** — `Terminals.jsx` and others call delete on entities; the call succeeds client-side (no error) but nothing is removed from the DB.
2. **Edit pages for read-only entities silently discard saves** — `EditCountry`, `EditIssuingAuthority`, `EditProductType`, etc. call `create`/`update` on entities where the backend only has GET. The `makeApiStore.create()` sends a POST → backend returns 405/404 → `onError` fires → UI shows error toast.
3. **CountryMaritimeZone, MapConfiguration, VesselType policies** — no backend controller at all; pages are completely inert.

### Priority — Group 1

| Batch | What | Risk |
|-------|------|------|
| **Safe to batch now** | Add POST/PUT/DELETE to all 12 remaining read-only reference data controllers (Country, CountryAlias, MaritimeZone, IssuingAuthority, ProductTypeRef, CargoTypeRef, FuelTypeRef, VesselTypeRef, SystemTag, UdfConfiguration, UdfListValue, TerminalType) | Low — pure CRUD on isolated tables |
| **Safe to batch now** | Add controllers for CountryMaritimeZone, VesselTypeAllowedCargoType, VesselTypeAllowedFuelType, VesselTypeCargoPolicy, VesselTypeFuelTankPolicy, MapConfiguration | Low — lookup tables, no FK complexity |
| **Safe to batch now** | Add DELETE to DocumentCategory and DocumentType controllers | Low — same pattern as existing POST/PUT |
| **Safe to batch now** | Add POST/PUT to DocumentTypeExternalCode | Low |

---

## Group 2 — Terminal / Berth / Terminal Complex (Migration Plan Phase 3)

**Entities: TerminalComplex, Terminal, Berth, TerminalDocumentRequirement, TerminalCompany, TerminalAttachment, TerminalMarineAccess, TerminalNews, TerminalProcedure, TerminalForm, TerminalDocument**

| Entity | Backend Model | Controller | GET | POST | PUT | DELETE | Frontend Store | Status |
|--------|--------------|------------|-----|------|-----|--------|----------------|--------|
| TerminalComplex | ✅ Phase3 | `GET /api/terminal-complexes` | ✅ | ❌ | ❌ | ❌ | makeApiStore | 📖 Read-only |
| Terminal | ✅ Phase3 | `GET /api/terminals` | ✅ | ❌ | ❌ | ❌ | makeApiStore | 📖 Read-only |
| Berth | ✅ Phase3 | `GET /api/berths` | ✅ | ❌ | ❌ | ❌ | makeApiStore | 📖 Read-only |
| TerminalDocumentRequirement | ✅ Phase3 | `GET/POST/PUT /api/terminal-document-requirements` | ✅ | ✅ | ✅ | ❌ | Custom store | 🔶 Partial (no DELETE) |
| TerminalCompany | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| TerminalAttachment | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| TerminalMarineAccess | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| TerminalNews | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| TerminalProcedure | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| TerminalForm | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| TerminalDocument | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |

### Pages Affected

| Page | Entities Used | Current Behavior |
|------|---------------|-----------------|
| `TerminalMap.jsx` | Terminal | ✅ Real data loads from API |
| `Terminals.jsx` | Terminal | ✅ List loads. Edit/Delete calls fail silently (no PUT/DELETE on backend) |
| `TerminalDetail.jsx` | Terminal, Berth, TerminalAttachment, TerminalMarineAccess, TerminalNews, TerminalCompany, TerminalProcedure | ✅ Core terminal data loads. All sub-tabs (Attachments, Marine Access, News, Company, Procedures) return empty — no-op proxy |
| `AddTerminal.jsx` / `EditTerminal.jsx` | Terminal | ❌ Create/Update silently fail — backend has no POST/PUT |
| `Berths.jsx` | Berth | ✅ List loads |
| `BerthDetail.jsx` | Berth | ✅ Berth data loads. Sub-entities empty |
| `EditBerth.jsx` / `AddBerth.jsx` | Berth | ❌ Create/Update silently fail — no POST/PUT |
| `TerminalComplexes.jsx` | TerminalComplex | ✅ List loads |
| `TerminalComplexDetail.jsx` | TerminalComplex | ✅ Detail loads |
| `EditTerminalComplex.jsx` / `AddTerminalComplex.jsx` | TerminalComplex | ❌ Create/Update fail — no POST/PUT |
| `TerminalRequirements.jsx` | Terminal, Berth, DocumentType, DocumentCategory, TerminalDocumentRequirement | ✅ Reads work. Create/Update works. Bulk configure works. Delete is noop. |

### Known Issues — Group 2

1. **Terminal/Berth/TerminalComplex are immutable from the UI** — All edit/add pages exist but writes have no backend endpoint. Data can only enter via CSV importer (`--import-phase3`).
2. **TerminalDetail sub-tabs all empty** — `TerminalAttachment`, `TerminalMarineAccess`, `TerminalNews`, `TerminalProcedure`, `TerminalDocument`, `TerminalCompany` all return `[]` from the no-op proxy.
3. **TerminalDocumentRequirement DELETE is noop** — Delete button in requirements list does nothing persistently.
4. **TerminalRequirements uses integer `id` in bulk configure** — The `bulkCreateMutation` checks `existing.id` for the update path; uses the integer PK from the API, which is correct (backend `PUT /{id:int}`). This is fine.

### Priority — Group 2

| Batch | What | Risk |
|-------|------|------|
| **Safe to batch now** | Add POST/PUT/DELETE to TerminalsController, BerthsController, TerminalComplexesController | Medium — these have no FK resolution complexity; just field mapping |
| **Safe to batch now** | Add DELETE to TerminalDocumentRequirementsController | Low |
| **Medium risk — do one by one** | Add model + controller + migration for TerminalCompany, TerminalAttachment, TerminalDocument, TerminalMarineAccess | Medium — each has FK to Terminal + optional FK to Berth |
| **Medium risk — do one by one** | Add model + controller + migration for TerminalNews, TerminalProcedure, TerminalForm | Medium — simpler, but terminal sub-entities need careful FK mapping |

---

## Group 3 — Documents / Document Sets (Migration Plan Phase 5)

**Entities: Document, DocumentUpload, VesselTerminalDocumentSet, VesselTerminalDocumentSetItem**

| Entity | Backend Model | Controller | GET | POST | PUT | DELETE | Frontend Store | Status |
|--------|--------------|------------|-----|------|-----|--------|----------------|--------|
| Document | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | makeStore (in-memory) | 🔴 Not migrated |
| DocumentUpload | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| VesselTerminalDocumentSet | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| VesselTerminalDocumentSetItem | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |

### Pages Affected

| Page | Behavior |
|------|----------|
| `Documents.jsx` | Shows in-memory seed documents (5 hardcoded records). Not real data. |
| `DocumentDetail.jsx` | Shows seed document only |
| `UploadDocument.jsx` | Upload form exists; no backend to receive it |
| `VesselTerminalDocumentSets.jsx` | Always empty (no-op) |
| `EditVesselTerminalDocumentSet.jsx` | Form exists; saves nowhere |
| `AddVesselTerminalDocumentSet.jsx` | Form exists; saves nowhere |

### Known Issues — Group 3

1. **Document is a `makeStore`** — 5 hardcoded demo records exist. Any creates/updates survive only for the browser session. Page refresh resets to seed.
2. **DocumentUpload has no file storage backend** — This entity also implies a file storage solution (S3, Azure Blob, local disk). The migration plan must address storage, not just the DB record.
3. **VesselTerminalDocumentSet depends on Vessel (Phase 4) and Terminal (Phase 3)** — Both must be fully migrated before this can work end-to-end.

### Priority — Group 3

| Batch | What | Risk |
|-------|------|------|
| **Medium risk** | Migrate Document entity (model + controller + migration) | Medium — depends on Vessel (not yet migrated) and Terminal, DocumentType, IssuingAuthority |
| **High risk — do last** | DocumentUpload | High — requires file storage infrastructure decision beyond DB |
| **High risk — do last** | VesselTerminalDocumentSet + Item | High — depends on Vessel + Terminal + Document all being migrated first |

---

## Group 4 — CRM: Companies / Contacts (Migration Plan Phases 2 & 7)

**Entities: Company, CompanyLegalEntity, CompanyOffice, CompanyDocument, CompanySystemTagAssignment, CompanySecurityPolicy, CompanyIdentityProvider, CompanyGroupRoleMapping, Contact, ContactEmploymentHistory, SystemTagAssignment**

| Entity | Backend Model | Controller | GET | POST | PUT | DELETE | Frontend Store | Status |
|--------|--------------|------------|-----|------|-----|--------|----------------|--------|
| Company | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | makeStore (in-memory) | 🔴 Not migrated |
| CompanyLegalEntity | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| CompanyOffice | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| CompanyDocument | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| CompanySystemTagAssignment | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| CompanySecurityPolicy | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| CompanyIdentityProvider | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| CompanyGroupRoleMapping | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| Contact | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| ContactEmploymentHistory | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| SystemTagAssignment | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |

### Pages Affected

| Page | Behavior |
|------|----------|
| `Companies.jsx` | Shows 6 in-memory seed companies. Not real data. |
| `CompanyDetail.jsx` | Shows seed company; sub-tabs (Offices, Legal Entities, Documents, Security) all return empty |
| `EditCompany.jsx` / `AddCompany.jsx` | Form exists; saves to in-memory only |
| `Contacts.jsx` | Always empty (genericHandler) |
| `ContactDetail.jsx` | Always empty |
| `EditContact.jsx` / `AddContact.jsx` | Form exists; saves nowhere |

### Known Issues — Group 4

1. **Company is a `makeStore`** — 6 hardcoded seed records. All CRM data is session-only.
2. **Company is a Phase 2 dependency** — `IssuingAuthority` and `DocumentTypeExternalCode` already have `companyPublicId` FK columns in the DB (stored as nullable strings during Phase 1 import). Once Company is migrated, these FKs can be resolved.
3. **Terminal and Vessel reference Company** — operator, owner, classSociety all point to Company. Company must be migrated before those FKs can be wired.
4. **`ContactDetail.jsx` uses `filter({ id: contactId })`** — when migrated, this will need to change to `filter({ publicId: contactId })`.

### Priority — Group 4

| Batch | What | Risk |
|-------|------|------|
| **Safe to batch now** | Company model + controller + migration (full CRUD) | Low — only depends on Country (Phase 1, done) |
| **Medium risk** | CompanyLegalEntity, CompanyOffice, CompanyDocument, CompanySystemTagAssignment | Medium — depends on Company |
| **Medium risk** | Contact, ContactEmploymentHistory | Medium — depends on Company |
| **Do one by one** | CompanyIdentityProvider, CompanyGroupRoleMapping, CompanySecurityPolicy | High — these touch auth/SSO patterns, need careful review |

---

## Group 5 — Fleet / Vessel (Migration Plan Phase 4)

**Entities: Vessel, VesselZone, AccessPoint, Cabin, Lifeboat, LifeRaftGroup, MusterStation, VesselCompanyRole, VesselCargoCapability, VesselCompatibility, VesselBerthCompatibility**

| Entity | Backend Model | Controller | GET | POST | PUT | DELETE | Frontend Store | Status |
|--------|--------------|------------|-----|------|-----|--------|----------------|--------|
| Vessel | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | makeStore (in-memory) | 🔴 Not migrated |
| VesselZone | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| AccessPoint | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| Cabin | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| Lifeboat | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| LifeRaftGroup | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| MusterStation | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| VesselCompanyRole | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| VesselCargoCapability | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| VesselCompatibility | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| VesselBerthCompatibility | ❌ No model | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |

### Pages Affected

| Page | Behavior |
|------|----------|
| `Vessels.jsx` | Shows 5 in-memory seed vessels. Not real data. |
| `VesselDetail.jsx` | Shows seed vessel; all sub-tabs (Zones, Safety, Cargo, Company Roles) empty |
| `EditVessel.jsx` / `AddVessel.jsx` | Form exists; saves to in-memory only |

### Known Issues — Group 5

1. **Vessel is a `makeStore`** — 5 hardcoded seed records. All fleet data is session-only.
2. **Vessel depends on Company (Phase 2)** — `ownerCompanyPublicId`, `operatorCompanyPublicId`, `classSocietyCompanyPublicId`. Company must be migrated before these FK relationships can be wired.
3. **Initial data import plan has 76 Vessel rows + 12 VesselZone rows** — These can be imported once the model exists.
4. **`VesselDetail.jsx` uses multiple `filter({ id: ... })` calls** — Will need publicId fixes when migrated.
5. **`VesselCompatibility` depends on Vessel + Terminal** — Both must be migrated first.

### Priority — Group 5

| Batch | What | Risk |
|-------|------|------|
| **Do after Company (Phase 2)** | Vessel model + full CRUD controller | Medium — depends on Company + VesselTypeRef (done) |
| **Safe to batch (after Vessel)** | VesselZone, AccessPoint, Cabin, Lifeboat, LifeRaftGroup, MusterStation | Low — all child entities of Vessel |
| **Do after Vessel** | VesselCompanyRole, VesselCargoCapability | Medium — junction entities |
| **High risk — do last** | VesselCompatibility, VesselBerthCompatibility | High — calculated compatibility entity; depends on Vessel + Terminal + Registration workflow |

---

## Group 6 — Configuration / System & Behavior (Admin Pages)

**Entities: MapConfiguration, UdfConfiguration, UdfListValue, SystemTag, AuditLog, SystemAuditLog**

| Entity | Backend Model | Controller | GET | POST | PUT | DELETE | Frontend Store | Status |
|--------|--------------|------------|-----|------|-----|--------|----------------|--------|
| MapConfiguration | ✅ Phase1 | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| UdfConfiguration | ✅ Phase1 | `GET /api/udf-configurations` | ✅ | ❌ | ❌ | ❌ | makeApiStore | 📖 Read-only |
| UdfListValue | ✅ Phase1 | `GET /api/udf-list-values` | ✅ | ❌ | ❌ | ❌ | makeApiStore | 📖 Read-only |
| SystemTag | ✅ Phase1 | `GET /api/system-tags` | ✅ | ❌ | ❌ | ❌ | makeApiStore | 📖 Read-only |
| AuditLog | ✅ Phase1 | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |
| SystemAuditLog | ✅ Phase1 | ❌ No controller | ❌ | ❌ | ❌ | ❌ | genericHandler | 🔴 Not migrated |

### Pages Affected

| Page | Behavior |
|------|----------|
| `MapConfigurationSettings.jsx` | Loads empty (no-op). Map config is not configurable via UI yet. |
| `UdfConfigurations.jsx` / `EditUdfConfiguration.jsx` | List loads real data. Edit saves to no-op. |
| `AuditLog.jsx` / `AuditLogDetail.jsx` | Always empty — no controller, no-op proxy |
| `SystemTags.jsx` / `EditSystemTag.jsx` | List loads real data. Edit saves to no-op. |
| `Configuration.jsx` | Navigation page only — no data |
| `ConfigurationAppSettings.jsx` | App settings — reads/writes to no-op |

### Priority — Group 6

| Batch | What | Risk |
|-------|------|------|
| **Safe to batch now** | Add POST/PUT/DELETE to SystemTags, UdfConfigurations, UdfListValues controllers | Low |
| **Safe to batch now** | Add controller for MapConfiguration (GET + POST + PUT) | Low — simple config entity |
| **Safe now** | Add GET-only controller for AuditLog (read-only listing, no write needed) | Low |

---

## Group 7 — Registration / Approval / Workflow (Migration Plan Phases 6 & 9)

**Entities: TerminalRegistrationApplication, TerminalRegistrationAttachment, TerminalRegistrationChecklistItem, TerminalRegistrationEmailDraft, TerminalRegistrationFormInstance, ApprovalSubmission, WorkflowDefinition, WorkflowStatus, WorkflowAction, WorkflowTransition, WorkflowCondition, WorkflowSystemAction, Assignment**

| Entity | Backend Model | Controller | GET | Status |
|--------|--------------|------------|-----|--------|
| TerminalRegistrationApplication | ❌ | ❌ | ❌ | 🔴 Not migrated |
| TerminalRegistrationAttachment | ❌ | ❌ | ❌ | 🔴 Not migrated |
| TerminalRegistrationChecklistItem | ❌ | ❌ | ❌ | 🔴 Not migrated |
| TerminalRegistrationEmailDraft | ❌ | ❌ | ❌ | 🔴 Not migrated |
| TerminalRegistrationFormInstance | ❌ | ❌ | ❌ | 🔴 Not migrated |
| ApprovalSubmission | ❌ | ❌ | ❌ | 🔴 Not migrated |
| WorkflowDefinition | ❌ | ❌ | ❌ | 🔴 Not migrated |
| WorkflowStatus | ❌ | ❌ | ❌ | 🔴 Not migrated |
| WorkflowAction | ❌ | ❌ | ❌ | 🔴 Not migrated |
| WorkflowTransition | ❌ | ❌ | ❌ | 🔴 Not migrated |
| WorkflowCondition | ❌ | ❌ | ❌ | 🔴 Not migrated |
| WorkflowSystemAction | ❌ | ❌ | ❌ | 🔴 Not migrated |
| Assignment | ❌ | ❌ | ❌ | 🔴 Not migrated |

### Pages Affected

| Page | Behavior |
|------|----------|
| `RegistrationEntrypoint.jsx` | Always empty — no backend |
| `Registration.jsx` | No-op — registration flow completely inert |
| `SimpleRegistration.jsx` | No-op |
| `ComplexRegistration.jsx` | No-op |
| `RegistrationApplications.jsx` | Always empty list |
| `SubmitApproval.jsx` | Form exists; submits nowhere |
| `Workflow.jsx` | Always empty |
| `PermissionMatrix.jsx` | Reads from no-op |

### Priority — Group 7

| Batch | What | Risk |
|-------|------|------|
| **High risk — prerequisites first** | TerminalRegistrationApplication is Phase 6 — requires Terminal, Vessel, Document all migrated first | High |
| **High risk — do one by one** | All registration sub-entities (Attachment, ChecklistItem, EmailDraft, FormInstance) | High — complex interdependencies |
| **High risk — do last** | WorkflowDefinition/Status/Action/Transition — engine-level; affects entire application status management | Very High |
| **High risk — do last** | ApprovalSubmission, Assignment | High — end of dependency chain |

---

## Group 8 — Security / Users / Auth (Migration Plan Phase 8)

**Entities: ApplicationUser, ApplicationRole, ApplicationFunction, ApplicationUserRole, RoleFieldPermission, RoleFunctionPermission, RoleTablePermission, RoleWorkflowPermission, RoleWorkflowFieldOverride, UserTag, UserPreference, UserSecurityLog, UserContactTagAssignment, UserCompanyTagAssignment, UserFavoriteContact**

| Entity | Backend Model | Controller | GET | Status |
|--------|--------------|------------|-----|--------|
| ApplicationUser | ❌ | ❌ | ❌ | 🔴 Not migrated |
| ApplicationRole | ❌ | ❌ | ❌ | 🔴 Not migrated |
| ApplicationFunction | ❌ | ❌ | ❌ | 🔴 Not migrated |
| ApplicationUserRole | ❌ | ❌ | ❌ | 🔴 Not migrated |
| All role permissions (5) | ❌ | ❌ | ❌ | 🔴 Not migrated |
| User preferences / tags (5) | ❌ | ❌ | ❌ | 🔴 Not migrated |

### Current Auth State

- `src/api/base44Client.js` returns a **hardcoded `MOCK_USER`** for `base44.auth.me()`.
- Role is always `'admin'` — all admin-only sidebar sections are always visible.
- `src/lib/AuthContext.jsx` attempts to fetch `/api/apps/public/prod/public-settings/by-id/${appId}` (Base44 platform endpoint — will fail). The `authError` state handles the failure gracefully and the app continues.
- Login / logout / favorites / preferences: all no-ops.

### Pages Affected

| Page | Behavior |
|------|----------|
| `AdminUsers.jsx` / `ApplicationUsers.jsx` | Always empty — no backend |
| `Roles.jsx` | Always empty |
| `PermissionMatrix.jsx` | Always empty |
| `Profile.jsx` | Shows mock user |
| `Preferences.jsx` | Form exists; saves nowhere |
| `UserSecurity.jsx` | Always empty |
| `AuditLog.jsx` | Always empty |

### Priority — Group 8

| Batch | What | Risk |
|-------|------|------|
| **High risk — do last** | Replace MOCK_USER with real auth | Very High — replaces the `auth.me()` stub that every page depends on; must be done carefully to avoid locking everyone out |
| **High risk** | ApplicationUser, ApplicationRole, ApplicationFunction, permissions | High — entire RBAC layer; do after all domain data is stable |

---

## Group 9 — Help / Chatbot (Migration Plan Phase 10)

**Entities: HelpIntent, HelpAlias, HelpArticle, HelpContextRule**

| Entity | Backend Model | Controller | GET | Status |
|--------|--------------|------------|-----|--------|
| HelpIntent | ❌ | ❌ | ❌ | 🔴 Not migrated |
| HelpAlias | ❌ | ❌ | ❌ | 🔴 Not migrated |
| HelpArticle | ❌ | ❌ | ❌ | 🔴 Not migrated |
| HelpContextRule | ❌ | ❌ | ❌ | 🔴 Not migrated |

### Pages / Components Affected

- `SeedHelpContent.jsx` — Seed page that creates help content; saves nowhere currently.
- `src/components/chatbot/` — Chatbot widget reads from `HelpIntent`/`HelpArticle`/`HelpAlias` via `chatbotService.jsx`. Always returns no results.

### Priority — Group 9

| Batch | What | Risk |
|-------|------|------|
| **Safe to batch now** | All 4 help entities (model + GET + POST controller, migration) — fully self-contained | Low |

---

## Summary: Current Migration Counts

| Status | Entity Count | Notes |
|--------|-------------|-------|
| ✅ Fully migrated | **0** | No entity has complete CRUD + DELETE wired end-to-end |
| 🔶 Partially migrated | **3** | DocumentCategory, DocumentType, TerminalDocumentRequirement — GET/POST/PUT, no DELETE |
| 📖 Read-only migrated | **16** | Phase 1 reference data with GET endpoints wired |
| 🔴 Not migrated | **73** | No backend, or in-memory session only, or no-op proxy |
| **Total tracked** | **92** | All entities from `BACKEND_MIGRATION_PLAN.md` |

---

## Cross-Cutting Issues

### 1. `delete` is always noop everywhere

`makeApiStore` has `delete: noop`. Every page with a delete button (Terminals, Berths, DocumentTypes, etc.) does nothing on confirm. No backend DELETE endpoints exist on any controller. Affects every group.

### 2. id vs publicId mismatch pattern

Several pages use `filter({ id: ... })` where the URL parameter is a publicId. When those entities are migrated to real API, these lookups will return nothing. Known affected pages:

- `EditBerth.jsx` — `filter({ id: berthId })`, `filter({ id: terminal.terminal_id })`
- `EditTerminal.jsx` — `filter({ id: terminalId })`
- `EditTerminalComplex.jsx` — `filter({ id: complexId })`
- `EditCompany.jsx` — `filter({ id: companyId })`
- `EditContact.jsx` — `filter({ id: contactId })`
- `EditVesselTerminalDocumentSet.jsx` — multiple `filter({ id: ... })` calls
- `RegistrationEntrypoint.jsx` / `Registration.jsx` — `filter({ id: applicationId })`
- `SubmitApproval.jsx` — `filter({ id: vesselId })`, `filter({ id: terminalId })`
- `AuditLogDetail.jsx` — `filter({ id: logId })`
- `EditVesselType.jsx` — `filter({ id: vesselTypeId })`
- `EditProductType.jsx` — `filter({ id: productTypeId })`
- Several `AddBerth.jsx` / terminal sub-pages

**Fix pattern:** Change each `filter({ id: X })` to `filter({ publicId: X })` at the time that entity is migrated.

### 3. `makeStore` in-memory entities (Vessel, Company, Document)

These three are the most visible domain objects and are hardcoded session-only. They appear functional but persist nothing. These must be migrated together or in close succession since they cross-reference each other.

### 4. AsNoTracking missing from most GET controllers

15 out of 20 controllers lack `AsNoTracking()` on their GET endpoints. For reference data (rarely mutated, frequently read), this causes unnecessary EF change-tracking overhead. Safe to add in a single batch pass.

### 5. Initial data not yet imported for Phase 4+

The `INITIAL_DATA_IMPORT_PLAN.md` lists 76 Vessel rows, 29 TerminalRegistrationApplication rows, 55 TerminalDocumentRequirement rows (already partially addressed via seed), and 49 Document rows. These cannot be imported until the corresponding models/tables exist.

### 6. `TerminalDocumentRequirement` export data exists (55 rows)

The initial data import plan has a CSV export for TerminalDocumentRequirement. Now that the table and controller exist, the import script (`Phase3Importer`) should be extended to import this file. Currently only 3 demo rows exist (from the dev seed).

---

## Recommended Migration Order (Next Sprints)

### Sprint A — "Complete Phase 1" (Safe to batch, low risk)

1. Add POST/PUT/DELETE to: `CountriesController`, `CountryAliasesController`, `MaritimeZonesController`, `IssuingAuthoritiesController`, `ProductTypeRefsController`, `CargoTypeRefsController`, `FuelTypeRefsController`, `VesselTypeRefsController`, `SystemTagsController`, `UdfConfigurationsController`, `UdfListValuesController`, `TerminalTypeController`
2. Add controllers (GET + POST + PUT + DELETE) for: `CountryMaritimeZone`, `VesselTypeAllowedCargoType`, `VesselTypeAllowedFuelType`, `VesselTypeCargoPolicy`, `VesselTypeFuelTankPolicy`, `MapConfiguration`
3. Add DELETE to: `DocumentCategoriesController`, `DocumentTypesController`, `TerminalDocumentRequirementsController`
4. Add POST/PUT to: `DocumentTypeExternalCodesController`
5. Add `AsNoTracking()` to all GET-only controllers
6. Wire `TerminalDocumentRequirement` initial data import in Phase3Importer (55 rows from CSV)

### Sprint B — "Terminal/Berth Writes" (Medium risk)

1. Add POST/PUT/DELETE to `TerminalsController`, `BerthsController`, `TerminalComplexesController`
2. Fix `EditTerminal.jsx`, `EditBerth.jsx`, `EditTerminalComplex.jsx` id→publicId filter
3. Add model + migration + controller for: `TerminalCompany`, `TerminalAttachment`, `TerminalNews`, `TerminalProcedure`, `TerminalDocument`, `TerminalMarineAccess`

### Sprint C — "Company + CRM" (Medium risk)

1. Company model + full CRUD + migration
2. Wire Company FK resolution in IssuingAuthority and DocumentTypeExternalCode
3. CompanyLegalEntity, CompanyOffice, CompanyDocument, CompanySystemTagAssignment
4. Contact, ContactEmploymentHistory
5. Fix id→publicId in `EditCompany.jsx`, `ContactDetail.jsx`, `EditContact.jsx`

### Sprint D — "Vessel + Fleet" (Medium risk, after Sprint C)

1. Vessel model + full CRUD + migration
2. Import 76 Vessel rows, 12 VesselZone rows
3. VesselZone, AccessPoint, Cabin, Lifeboat, LifeRaftGroup, MusterStation
4. VesselCompanyRole, VesselCargoCapability

### Sprint E — "Documents" (After Sprint D)

1. Document model + full CRUD
2. Import 49 Document rows
3. VesselTerminalDocumentSet + Item

### Sprint F — "Registration Workflow" (High risk, after E)

1. TerminalRegistrationApplication + sub-entities
2. ApprovalSubmission
3. VesselCompatibility, VesselBerthCompatibility

### Sprint G — "Security / Auth" (Last, high risk)

1. Replace MOCK_USER with real auth endpoint
2. ApplicationUser, ApplicationRole, permissions

### Sprint H — "Help / Chatbot" (Any time, independent)

- All 4 help entities are self-contained; can be done in parallel with any other sprint
