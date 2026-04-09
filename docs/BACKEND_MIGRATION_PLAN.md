# Backend Migration Plan — TCS (Terminal Compatibility System)

**Basis:** `entities/*.jsonc` (92 files), `README.md`, existing frontend code
**Target stack:** .NET API + PostgreSQL (per README §5 and §10)
**Rule:** No renaming of entities, fields, or relationships. This is a migration, not a redesign.

---

## 1. All 92 Entities → Database Tables

Every entity file in `entities/` becomes one PostgreSQL table. Field names carry over unchanged.

Every table receives:
- `id` — PostgreSQL `SERIAL` or `UUID` primary key (maps to Base44's auto-generated `id`)
- `publicId` — `VARCHAR UNIQUE NOT NULL` — stable cross-entity reference key; never changes after creation
- `tenantId` — `VARCHAR NOT NULL` — multi-tenancy partition key; index on every table

| # | Entity | Category |
|---|--------|----------|
| 1 | `Country` | Reference |
| 2 | `CountryAlias` | Reference |
| 3 | `CountryMaritimeZone` | Reference |
| 4 | `MaritimeZone` | Reference |
| 5 | `ProductTypeRef` | Reference |
| 6 | `CargoTypeRef` | Reference |
| 7 | `FuelTypeRef` | Reference |
| 8 | `VesselTypeRef` | Reference |
| 9 | `VesselTypeAllowedCargoType` | Reference |
| 10 | `VesselTypeAllowedFuelType` | Reference |
| 11 | `VesselTypeCargoPolicy` | Reference |
| 12 | `VesselTypeFuelTankPolicy` | Reference |
| 13 | `TerminalType` | Reference |
| 14 | `DocumentCategory` | Reference |
| 15 | `DocumentType` | Reference |
| 16 | `DocumentTypeExternalCode` | Reference |
| 17 | `IssuingAuthority` | Reference |
| 18 | `SystemTag` | Reference |
| 19 | `UdfConfiguration` | Reference |
| 20 | `UdfListValue` | Reference |
| 21 | `MapConfiguration` | Config |
| 22 | `TerminalComplex` | Core Domain |
| 23 | `Terminal` | Core Domain |
| 24 | `Berth` | Core Domain |
| 25 | `TerminalCompany` | Core Domain |
| 26 | `TerminalAttachment` | Core Domain |
| 27 | `TerminalMarineAccess` | Core Domain |
| 28 | `TerminalNews` | Core Domain |
| 29 | `TerminalProcedure` | Core Domain |
| 30 | `TerminalDocumentRequirement` | Core Domain |
| 31 | `TerminalForm` | Core Domain |
| 32 | `TerminalDocument` | Core Domain |
| 33 | `Vessel` | Core Domain |
| 34 | `VesselZone` | Core Domain |
| 35 | `AccessPoint` | Core Domain |
| 36 | `Cabin` | Core Domain |
| 37 | `Lifeboat` | Core Domain |
| 38 | `LifeRaftGroup` | Core Domain |
| 39 | `MusterStation` | Core Domain |
| 40 | `VesselCompanyRole` | Core Domain |
| 41 | `VesselCargoCapability` | Core Domain |
| 42 | `VesselCompatibility` | Core Domain |
| 43 | `VesselBerthCompatibility` | Core Domain |
| 44 | `Company` | CRM |
| 45 | `CompanyLegalEntity` | CRM |
| 46 | `CompanyOffice` | CRM |
| 47 | `CompanyDocument` | CRM |
| 48 | `CompanySystemTagAssignment` | CRM |
| 49 | `CompanySecurityPolicy` | CRM |
| 50 | `CompanyIdentityProvider` | CRM |
| 51 | `CompanyGroupRoleMapping` | CRM |
| 52 | `Contact` | CRM |
| 53 | `ContactEmploymentHistory` | CRM |
| 54 | `SystemTagAssignment` | CRM |
| 55 | `Document` | Documents |
| 56 | `DocumentUpload` | Documents |
| 57 | `VesselTerminalDocumentSet` | Documents |
| 58 | `VesselTerminalDocumentSetItem` | Documents |
| 59 | `ApprovalSubmission` | Registration |
| 60 | `TerminalRegistrationApplication` | Registration |
| 61 | `TerminalRegistrationAttachment` | Registration |
| 62 | `TerminalRegistrationChecklistItem` | Registration |
| 63 | `TerminalRegistrationEmailDraft` | Registration |
| 64 | `TerminalRegistrationFormInstance` | Registration |
| 65 | `ApplicationUser` | Security |
| 66 | `ApplicationRole` | Security |
| 67 | `ApplicationFunction` | Security |
| 68 | `ApplicationUserRole` | Security |
| 69 | `RoleFieldPermission` | Security |
| 70 | `RoleFunctionPermission` | Security |
| 71 | `RoleTablePermission` | Security |
| 72 | `RoleWorkflowPermission` | Security |
| 73 | `RoleWorkflowFieldOverride` | Security |
| 74 | `UserTag` | Security |
| 75 | `UserPreference` | Security |
| 76 | `UserSecurityLog` | Security |
| 77 | `UserContactTagAssignment` | Security |
| 78 | `UserCompanyTagAssignment` | Security |
| 79 | `UserFavoriteContact` | Security |
| 80 | `WorkflowDefinition` | Workflow |
| 81 | `WorkflowStatus` | Workflow |
| 82 | `WorkflowAction` | Workflow |
| 83 | `WorkflowTransition` | Workflow |
| 84 | `WorkflowCondition` | Workflow |
| 85 | `WorkflowSystemAction` | Workflow |
| 86 | `Assignment` | Workflow |
| 87 | `AuditLog` | Audit |
| 88 | `SystemAuditLog` | Audit |
| 89 | `HelpIntent` | Help |
| 90 | `HelpAlias` | Help |
| 91 | `HelpArticle` | Help |
| 92 | `HelpContextRule` | Help |

> **File naming note:** `VesselTypeAllowedFuelType .jsonc` has a trailing space in its filename.
> Rename to `VesselTypeAllowedFuelType.jsonc` before any tooling processes the `entities/` directory.

---

## 2. Key Relationships

Every `*Id` / `*PublicId` field pair in the schemas maps to a foreign key.
The convention is consistent throughout: `entityId` = internal mutable PK, `entityPublicId` = stable migration-safe reference.
**Define PostgreSQL foreign keys on `publicId` columns**, not on internal `id`, to preserve migration portability.

### Core domain spine

```
Country
  ├── CountryAlias
  ├── CountryMaritimeZone ──→ MaritimeZone
  ├── TerminalComplex
  │     └── Terminal ──→ TerminalType, ProductTypeRef, Country
  │           └── Berth ──→ ProductTypeRef[]  (array field → junction table)
  ├── Company ──→ Country
  │     ├── CompanyLegalEntity
  │     ├── CompanyOffice ──→ CompanyLegalEntity
  │     ├── CompanyIdentityProvider
  │     │     └── CompanyGroupRoleMapping
  │     ├── CompanyDocument ──→ DocumentType
  │     ├── CompanySystemTagAssignment ──→ SystemTag
  │     └── Contact ──→ Company, CompanyOffice, Country, Terminal
  │           └── ContactEmploymentHistory ──→ Company
  └── IssuingAuthority ──→ Country, Company
```

### Vessel spine

```
VesselTypeRef
  ├── VesselTypeAllowedCargoType ──→ CargoTypeRef
  ├── VesselTypeAllowedFuelType  ──→ FuelTypeRef
  ├── VesselTypeCargoPolicy      ──→ CargoTypeRef
  └── VesselTypeFuelTankPolicy   ──→ FuelTypeRef

Vessel ──→ VesselTypeRef, Country (flag), Company (owner / operator / classSociety)
  ├── VesselZone  (self-reference: parentZoneId → VesselZone)
  │     ├── AccessPoint
  │     ├── Cabin
  │     ├── Lifeboat
  │     ├── LifeRaftGroup
  │     └── MusterStation
  ├── VesselCompanyRole   ──→ Company
  └── VesselCargoCapability ──→ CargoTypeRef
```

### Documents spine

```
DocumentCategory
  └── DocumentType ──→ DocumentCategory
        └── DocumentTypeExternalCode ──→ Company (authority)

Document ──→ Vessel, DocumentType, Terminal, Berth, TerminalForm, IssuingAuthority
DocumentUpload ──→ DocumentType, Vessel, Terminal, Berth

VesselTerminalDocumentSet ──→ Vessel, Terminal, Berth
  └── VesselTerminalDocumentSetItem ──→ DocumentType, Document
```

### Terminal content

```
Terminal
  ├── TerminalDocumentRequirement ──→ Berth, DocumentType
  ├── TerminalForm                ──→ Berth, DocumentType
  ├── TerminalAttachment
  ├── TerminalMarineAccess
  ├── TerminalNews
  ├── TerminalProcedure
  ├── TerminalDocument            ──→ Berth
  └── TerminalCompany             ──→ Company
```

### Registration workflow

```
TerminalRegistrationApplication ──→ Terminal, Vessel
  ├── TerminalRegistrationAttachment    ──→ Document, DocumentType
  ├── TerminalRegistrationChecklistItem ──→ TerminalDocumentRequirement, DocumentType, Document
  ├── TerminalRegistrationEmailDraft
  └── TerminalRegistrationFormInstance  ──→ Terminal, Vessel, TerminalAttachment (form template)

ApprovalSubmission      ──→ Vessel, Terminal, Berth[], Document[]
VesselBerthCompatibility ──→ TerminalRegistrationApplication, Vessel, Berth
VesselCompatibility      ──→ Vessel, Terminal, Berth
```

### Security & workflow

```
ApplicationRole  (self-reference: inherits_from_role_id)
  ├── ApplicationUserRole         ──→ ApplicationUser
  ├── RoleFieldPermission
  ├── RoleFunctionPermission
  ├── RoleTablePermission
  ├── RoleWorkflowPermission      ──→ WorkflowDefinition, WorkflowAction, ApplicationUser
  └── RoleWorkflowFieldOverride   ──→ WorkflowDefinition, WorkflowAction, WorkflowStatus

WorkflowDefinition  (self-reference: parent_workflow_id)
  ├── WorkflowStatus
  ├── WorkflowAction
  └── WorkflowTransition ──→ WorkflowStatus (from/to), WorkflowAction
        ├── WorkflowCondition
        └── WorkflowSystemAction
```

### Array fields requiring junction tables in PostgreSQL

These `type: array` fields in the schemas cannot be stored as simple columns and must become separate tables:

| Entity | Array field | Junction table |
|--------|-------------|----------------|
| `Berth` | `productTypeRefIds` | `berth_product_type` |
| `ApprovalSubmission` | `berth_ids` | `approval_berth` |
| `ApprovalSubmission` | `document_ids` | `approval_document` |
| `DocumentType` | `searchAliases` | `document_type_alias` |
| `DocumentType` | `allowedIssuers` | `document_type_issuer` |
| `SystemTag` | `appliesTo` | can stay as PG `text[]` — enum values only |
| `VesselBerthCompatibility` | `restrictions`, `incompatibilityReasons` | can stay as PG `text[]` or `JSONB` |

---

## 3. Dependency Tiers (Migration Order)

Entities are ordered by FK depth. Tier 0 has no dependencies; each higher tier depends only on tiers below it.

### Tier 0 — No dependencies (migrate first, any order within tier)

Pure lookup / reference tables. Zero FK references to other entities.

`Country`, `MaritimeZone`, `ProductTypeRef`, `CargoTypeRef`, `FuelTypeRef`, `VesselTypeRef`,
`TerminalType`, `DocumentCategory`, `SystemTag`, `MapConfiguration`, `HelpIntent`, `HelpArticle`,
`ApplicationFunction`, `WorkflowDefinition` *(self-ref only)*, `ApplicationRole` *(self-ref only)*,
`UdfConfiguration`, `UdfListValue`

### Tier 1 — Depend only on Tier 0

`CountryAlias`, `CountryMaritimeZone`, `TerminalComplex`, `Company`, `DocumentType`,
`VesselTypeAllowedCargoType`, `VesselTypeAllowedFuelType`, `VesselTypeCargoPolicy`,
`VesselTypeFuelTankPolicy`, `ApplicationUser`, `WorkflowStatus`, `WorkflowAction`,
`HelpAlias`, `HelpContextRule`, `IssuingAuthority`

### Tier 2 — Depend on Tier 1

`Terminal`, `Vessel`, `Contact`, `CompanyLegalEntity`, `DocumentTypeExternalCode`,
`ApplicationUserRole`, `WorkflowTransition`, `CompanySystemTagAssignment`,
`RoleFieldPermission`, `RoleFunctionPermission`, `RoleTablePermission`, `RoleWorkflowPermission`

### Tier 3 — Depend on Tier 2

`Berth`, `TerminalCompany`, `TerminalAttachment`, `TerminalMarineAccess`, `TerminalNews`,
`TerminalProcedure`, `TerminalDocumentRequirement`, `TerminalForm`, `TerminalDocument`,
`ContactEmploymentHistory`, `VesselZone` *(self-ref)*, `VesselCompanyRole`, `VesselCargoCapability`,
`UserTag`, `UserPreference`, `UserSecurityLog`,
`WorkflowCondition`, `WorkflowSystemAction`, `RoleWorkflowFieldOverride`,
`CompanyIdentityProvider`, `CompanyOffice`

### Tier 4 — Depend on Tier 3

`Document`, `DocumentUpload`, `AccessPoint`, `Cabin`, `Lifeboat`, `LifeRaftGroup`, `MusterStation`,
`SystemTagAssignment`, `UserContactTagAssignment`, `UserCompanyTagAssignment`, `UserFavoriteContact`,
`CompanyDocument`, `CompanyGroupRoleMapping`

### Tier 5 — Depend on Tier 4

`VesselTerminalDocumentSet`, `TerminalRegistrationApplication`, `ApprovalSubmission`, `VesselCompatibility`

### Tier 6 — Depend on Tier 5

`VesselTerminalDocumentSetItem`, `VesselBerthCompatibility`,
`TerminalRegistrationAttachment`, `TerminalRegistrationChecklistItem`,
`TerminalRegistrationEmailDraft`, `TerminalRegistrationFormInstance`, `Assignment`

### No strict FK (create at any phase)

`AuditLog`, `SystemAuditLog` — reference other tables as generic `tableName`/`recordId` strings, not enforced FKs.
Create alongside Phase 1 so logging is available from day one.

---

## 4. Phased Backend Migration Order

Each phase delivers working API endpoints. The frontend `src/api/base44Client.js` mock is replaced one domain at a time — no big-bang cutover.

---

### Phase 1 — Reference & Lookup Data

**Entities (19):**
`Country`, `CountryAlias`, `CountryMaritimeZone`, `MaritimeZone`,
`ProductTypeRef`, `CargoTypeRef`, `FuelTypeRef`,
`VesselTypeRef`, `VesselTypeAllowedCargoType`, `VesselTypeAllowedFuelType`,
`VesselTypeCargoPolicy`, `VesselTypeFuelTankPolicy`,
`TerminalType`, `DocumentCategory`, `DocumentType`, `DocumentTypeExternalCode`,
`IssuingAuthority`, `SystemTag`, `MapConfiguration`, `UdfConfiguration`, `UdfListValue`,
`AuditLog`, `SystemAuditLog`

**Why first:**
Every other entity depends on at least one of these. No FK constraints to satisfy. Data is mostly static (ISO country codes, document categories, fuel/vessel/product types, maritime zones). Logging infrastructure available from the start.

**API surface:** `GET /api/reference/{entity}` — read-heavy, rarely mutated, cacheable responses.

**Frontend pages unlocked:** All dropdown sources across every form, `CountrySelector` component, map configuration settings.

---

### Phase 2 — Company

**Entities (8):**
`Company`, `CompanyLegalEntity`, `CompanyOffice`, `CompanyDocument`,
`CompanySystemTagAssignment`, `CompanySecurityPolicy`,
`CompanyIdentityProvider`, `CompanyGroupRoleMapping`

**Why here:**
`Company` is a FK dependency for `Terminal`, `Vessel`, `Contact`, `IssuingAuthority`, and `DocumentTypeExternalCode`. Must exist before any of those can be created.

**API surface:** Full CRUD `/api/companies` and sub-resources.

**Frontend pages unlocked:** Companies list and detail pages, company dropdowns on Vessel and Terminal forms.

---

### Phase 3 — Terminal

**Entities (11):**
`TerminalComplex`, `Terminal`, `Berth`,
`TerminalCompany`, `TerminalAttachment`, `TerminalMarineAccess`,
`TerminalNews`, `TerminalProcedure`, `TerminalDocumentRequirement`,
`TerminalForm`, `TerminalDocument`

**Why here:**
Terminal is the central entity of the application. Berth depends on Terminal. Both are referenced by nearly every downstream entity (documents, registration, compatibility).

**API surface:** Full CRUD `/api/terminals`, `/api/berths`, `/api/terminal-complexes`.

**Frontend pages unlocked:** Terminal map, terminal list and detail pages, berth list and detail pages, all terminal sub-tabs (marine access, news, procedures, requirements, forms).

---

### Phase 4 — Vessel

**Entities (9):**
`Vessel`, `VesselZone`, `AccessPoint`, `Cabin`, `Lifeboat`,
`LifeRaftGroup`, `MusterStation`, `VesselCompanyRole`, `VesselCargoCapability`

**Why here:**
Vessel is the second central entity. Company (Phase 2), VesselTypeRef (Phase 1), and Country (Phase 1) are all present. All vessel sub-entities depend on VesselZone, which depends on Vessel.

**API surface:** Full CRUD `/api/vessels` and sub-resources.

**Frontend pages unlocked:** Fleet list and detail pages, all vessel sub-tabs (zones, safety equipment, cabins, cargo capability, company roles).

---

### Phase 5 — Documents & Compliance

**Entities (4):**
`Document`, `DocumentUpload`, `VesselTerminalDocumentSet`, `VesselTerminalDocumentSetItem`

**Why here:**
Depends on Vessel (Phase 4), Terminal and Berth (Phase 3), DocumentType and IssuingAuthority (Phase 1), and TerminalForm (Phase 3).

**API surface:** Full CRUD `/api/documents`, `/api/document-sets`.

**Frontend pages unlocked:** Documents list, document upload, vessel-terminal document sets.

---

### Phase 6 — Registration Workflow

**Entities (8):**
`TerminalRegistrationApplication`, `TerminalRegistrationAttachment`,
`TerminalRegistrationChecklistItem`, `TerminalRegistrationEmailDraft`,
`TerminalRegistrationFormInstance`, `ApprovalSubmission`,
`VesselCompatibility`, `VesselBerthCompatibility`

**Why here:**
Depends on Terminal, Vessel, Berth, Document, DocumentType, and TerminalDocumentRequirement all being in place. This is the highest-dependency workflow in the system.

**API surface:** `/api/registrations`, `/api/approvals`, `/api/compatibility`.

**Frontend pages unlocked:** Registration entry point, simple and complex registration flows, compatibility calculator, approval submissions, berth compatibility checker.

---

### Phase 7 — CRM: Contacts

**Entities (3):**
`Contact`, `ContactEmploymentHistory`, `SystemTagAssignment`

**Why here:**
Contact depends on Company (Phase 2). Kept as a separate phase because CRM is non-critical to the core maritime workflow and can ship independently.

**API surface:** Full CRUD `/api/contacts`.

**Frontend pages unlocked:** Contacts list and detail pages, terminal contacts tab, employment history.

---

### Phase 8 — Security & Users

**Entities (16):**
`ApplicationUser`, `ApplicationRole`, `ApplicationFunction`, `ApplicationUserRole`,
`RoleFieldPermission`, `RoleFunctionPermission`, `RoleTablePermission`,
`RoleWorkflowPermission`, `RoleWorkflowFieldOverride`,
`UserTag`, `UserPreference`, `UserSecurityLog`,
`UserContactTagAssignment`, `UserCompanyTagAssignment`, `UserFavoriteContact`

**Why here:**
Authentication and role management. Replaces the `MOCK_USER` in `src/api/base44Client.js`. Done after all domain data is stable so permissions can be tested against real records.

**API surface:** `/api/users`, `/api/roles`, `/api/auth/me`, `/api/auth/logout`.

**Frontend pages unlocked:** Admin Users page, Roles page, Permission Matrix, real login, user preferences, favorites (terminals, berths, complexes).

---

### Phase 9 — Workflow Engine

**Entities (7):**
`WorkflowDefinition`, `WorkflowStatus`, `WorkflowAction`,
`WorkflowTransition`, `WorkflowCondition`, `WorkflowSystemAction`, `Assignment`

**Why here:**
The workflow engine drives status transitions across domain entities (e.g. registration status, vessel assignment status). Built after all domain entities exist as workflow targets.

**API surface:** `/api/workflows`.

**Frontend pages unlocked:** Workflow configuration pages, status transition buttons throughout the application.

---

### Phase 10 — Help & Chatbot

**Entities (4):**
`HelpIntent`, `HelpAlias`, `HelpArticle`, `HelpContextRule`

**Why last:**
Fully self-contained with no dependencies on domain data. The embedded chatbot (`src/components/chatbot/`) and `chatbotService.jsx` will work as-is once these endpoints exist. Content can be seeded independently at any time.

**API surface:** `/api/help`.

**Frontend pages unlocked:** Embedded chatbot widget, contextual help responses.

---

## Summary

| Phase | Domain | Entity count | Frontend pages unlocked |
|-------|--------|-------------|------------------------|
| 1 | Reference & Lookup Data | 23 | All dropdown sources, map config |
| 2 | Company | 8 | Companies pages, company FK on Vessel/Terminal forms |
| 3 | Terminal | 11 | Terminal map, terminal/berth pages and all sub-tabs |
| 4 | Vessel | 9 | Fleet pages, vessel detail tabs |
| 5 | Documents | 4 | Document library, upload, document sets |
| 6 | Registration | 8 | Registration workflow, compatibility calculator |
| 7 | Contacts | 3 | CRM contacts pages |
| 8 | Security & Users | 16 | Real auth, roles, permissions, favorites |
| 9 | Workflow Engine | 7 | Status transitions, workflow config pages |
| 10 | Help & Chatbot | 4 | Embedded chatbot |
| **Total** | | **93*** | |

> *93 because `AuditLog` and `SystemAuditLog` are included in Phase 1 in addition to the 92 entity files. All 92 `entities/*.jsonc` files are accounted for across all phases.
