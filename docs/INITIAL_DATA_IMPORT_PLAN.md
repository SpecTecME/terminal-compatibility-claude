# Initial Data Import Plan

Generated: 2026-04-09  
Source folder: `/initial_data`  
Status: **PLAN ONLY — nothing imported yet**

---

## File Inventory

| File | Rows | Target Table | Category | Import Phase |
|---|---|---|---|---|
| `Country_export-3.csv` | 253 | `Country` | Reference / master data | 1 |
| `CountryAlias_export.csv` | 19 | `CountryAlias` | Reference / master data | 1 |
| `MaritimeZone_export-2.csv` | 33 | `MaritimeZone` | Reference / master data | 1 |
| `CountryMaritimeZone_export.csv` | 37 | `CountryMaritimeZone` | Reference / master data | 1 |
| `ProductTypeRef_export-2.csv` | 14 | `ProductTypeRef` | Reference / master data | 1 |
| `CargoTypeRef_export-2.csv` | 19 | `CargoTypeRef` | Reference / master data | 1 |
| `FuelTypeRef_export.csv` | 7 | `FuelTypeRef` | Reference / master data | 1 |
| `VesselTypeRef_export-2.csv` | 73 | `VesselTypeRef` | Reference / master data | 1 |
| `VesselTypeAllowedCargoType_export.csv` | 16 | `VesselTypeAllowedCargoType` | Reference / master data | 1 |
| `VesselTypeAllowedFuelType_export.csv` | 20 | `VesselTypeAllowedFuelType` | Reference / master data | 1 |
| `VesselTypeCargoPolicy_export.csv` | 16 | `VesselTypeCargoPolicy` | Reference / master data | 1 |
| `VesselTypeFuelTankPolicy_export.csv` | 37 | `VesselTypeFuelTankPolicy` | Reference / master data | 1 |
| `TerminalType_export.csv` | 4 | `TerminalType` | Reference / master data | 1 |
| `DocumentCategory_export.csv` | 19 | `DocumentCategory` | Reference / master data | 1 |
| `DocumentType_export-2.csv` | 48 | `DocumentType` | Reference / master data | 1 |
| `DocumentTypeExternalCode_export.csv` | 7 | `DocumentTypeExternalCode` | Reference / master data | 1 |
| `IssuingAuthority_export.csv` | 6 | `IssuingAuthority` | Reference / master data | 1 |
| `SystemTag_export.csv` | 30 | `SystemTag` | Reference / master data | 1 |
| `UdfConfiguration_export.csv` | 1 | `UdfConfiguration` | Reference / master data | 1 |
| `UdfListValue_export.csv` | 8 | `UdfListValue` | Reference / master data | 1 |
| `MapConfiguration_export.csv` | 0 | `MapConfiguration` | Reference / master data — empty, skip | — |
| `Company_export-2.csv` | 31 | `Company` | Transactional / live data | 2 |
| `Contact_export.csv` | 1 | `Contact` | Transactional / live data | 2 |
| `CompanyOffice_export.csv` | 0 | `CompanyOffice` | Transactional / live data — empty, skip | — |
| `CompanySecurityPolicy_export.csv` | 0 | `CompanySecurityPolicy` | Transactional / live data — empty, skip | — |
| `CompanySystemTagAssignment_export.csv` | 13 | `CompanySystemTagAssignment` | Transactional / live data | 2 |
| `Terminal_export-6.csv` | 165 | `Terminal` | Transactional / live data | 3 |
| `Berth_export-4.csv` | 21 | `Berth` | Transactional / live data | 3 |
| `Vessel_export-3.csv` | 76 | `Vessel` | Transactional / live data | 3 |
| `VesselZone_export.csv` | 12 | `VesselZone` | Transactional / live data | 3 |
| `VesselCompatibility_export.csv` | 4 | `VesselCompatibility` | Transactional / live data | 3 |
| `Document_export-2.csv` | 49 | `Document` | Transactional / live data | 4 |
| `TerminalDocumentRequirement_export.csv` | 55 | `TerminalDocumentRequirement` | Transactional / live data | 4 |
| `VesselTerminalDocumentSet_export.csv` | 0 | `VesselTerminalDocumentSet` | Transactional / live data — empty, skip | — |
| `VesselTerminalDocumentSetItem_export.csv` | 5 | `VesselTerminalDocumentSetItem` | Transactional / live data | 4 |
| `TerminalRegistrationApplication_export.csv` | 29 | `TerminalRegistrationApplication` | Transactional / live data | 5 |
| `TerminalRegistrationChecklistItem_export.csv` | 151 | `TerminalRegistrationChecklistItem` | Transactional / live data | 5 |
| `TerminalAttachment_export.csv` | 0 | `TerminalAttachment` | Transactional / live data — empty, skip | — |
| `TerminalMarineAccess_export.csv` | 0 | `TerminalMarineAccess` | Transactional / live data — empty, skip | — |
| `SystemTagAssignment_export.csv` | 10 | `SystemTagAssignment` | Transactional / live data | 2 |
| `UserTag_export.csv` | 2 | `UserTag` | Unknown / needs manual review | — |
| `UserCompanyTagAssignment_export.csv` | 1 | `UserCompanyTagAssignment` | Unknown / needs manual review | — |
| `UserContactTagAssignment_export.csv` | 2 | `UserContactTagAssignment` | Unknown / needs manual review | — |
| `UserPreference_export.csv` | 0 | `UserPreference` | Unknown / needs manual review — empty, skip | — |
| `AccessPoint_export.csv` | 2 | `AccessPoint` | Transactional / live data (vessel safety zones) | 3 |
| `Cabin_export.csv` | 7 | `Cabin` | Transactional / live data (vessel accommodation) | 3 |
| `LifeRaftGroup_export.csv` | 2 | `LifeRaftGroup` | Transactional / live data (vessel safety) | 3 |
| `Lifeboat_export.csv` | 2 | `Lifeboat` | Transactional / live data (vessel safety) | 3 |
| `MusterStation_export.csv` | 3 | `MusterStation` | Transactional / live data (vessel safety) | 3 |
| `ApplicationFunction_export.csv` | 26 | `ApplicationFunction` | Unknown / needs manual review (platform metadata) | — |
| `ApplicationRole_export.csv` | 3 | `ApplicationRole` | Unknown / needs manual review (platform metadata) | — |
| `ApplicationUser_export.csv` | 2 | `ApplicationUser` | Unknown / needs manual review (platform metadata) | — |
| `ApplicationUserRole_export.csv` | 2 | `ApplicationUserRole` | Unknown / needs manual review (platform metadata) | — |
| `RoleFieldPermission_export.csv` | 0 | `RoleFieldPermission` | Unknown / needs manual review — empty, skip | — |
| `RoleFunctionPermission_export.csv` | 59 | `RoleFunctionPermission` | Unknown / needs manual review (platform metadata) | — |
| `RoleTablePermission_export.csv` | 135 | `RoleTablePermission` | Unknown / needs manual review (platform metadata) | — |
| `RoleWorkflowPermission_export.csv` | 13 | `RoleWorkflowPermission` | Unknown / needs manual review (platform metadata) | — |
| `WorkflowAction_export.csv` | 7 | `WorkflowAction` | Unknown / needs manual review (platform metadata) | — |
| `WorkflowDefinition_export.csv` | 1 | `WorkflowDefinition` | Unknown / needs manual review (platform metadata) | — |
| `WorkflowStatus_export.csv` | 7 | `WorkflowStatus` | Unknown / needs manual review (platform metadata) | — |
| `WorkflowTransition_export.csv` | 4 | `WorkflowTransition` | Unknown / needs manual review (platform metadata) | — |
| `HelpAlias_export.csv` | 22 | `HelpAlias` | Reference / master data (chatbot content) | 6 |
| `HelpArticle_export.csv` | 118 | `HelpArticle` | Reference / master data (chatbot content) | 6 |
| `HelpContextRule_export.csv` | 9 | `HelpContextRule` | Reference / master data (chatbot content) | 6 |
| `HelpIntent_export.csv` | 83 | `HelpIntent` | Reference / master data (chatbot content) | 6 |

---

## Recommended Import Order

### Phase 1 — Reference / Master Data (no FK dependencies)

These tables are pure lookup data. They must be imported before anything that references them.

1. `Country` — 253 rows — ISO standard codes, foundation for all geo fields
2. `CountryAlias` — 19 rows — depends on Country
3. `MaritimeZone` — 33 rows — independent
4. `CountryMaritimeZone` — 37 rows — depends on Country + MaritimeZone
5. `ProductTypeRef` — 14 rows — independent
6. `CargoTypeRef` — 19 rows — depends on ProductTypeRef
7. `FuelTypeRef` — 7 rows — independent
8. `VesselTypeRef` — 73 rows — independent
9. `VesselTypeAllowedCargoType` — 16 rows — depends on VesselTypeRef + CargoTypeRef
10. `VesselTypeAllowedFuelType` — 20 rows — depends on VesselTypeRef + FuelTypeRef
11. `VesselTypeCargoPolicy` — 16 rows — depends on VesselTypeRef + CargoTypeRef
12. `VesselTypeFuelTankPolicy` — 37 rows — depends on VesselTypeRef + FuelTypeRef
13. `TerminalType` — 4 rows — independent
14. `DocumentCategory` — 19 rows — independent
15. `DocumentType` — 48 rows — depends on DocumentCategory
16. `IssuingAuthority` — 6 rows — depends on Country; cross-phase FK to Company (import Company public ID column only)
17. `DocumentTypeExternalCode` — 7 rows — depends on DocumentType; cross-phase FK to Company (import public ID column only)
18. `SystemTag` — 30 rows — independent
19. `UdfConfiguration` — 1 row — independent
20. `UdfListValue` — 8 rows — depends on UdfConfiguration

### Phase 2 — Core Domain: Companies & Contacts

21. `Company` — 31 rows — depends on Country
22. `Contact` — 1 row — depends on Company
23. `SystemTagAssignment` — 10 rows — depends on SystemTag
24. `CompanySystemTagAssignment` — 13 rows — depends on Company + SystemTag

### Phase 3 — Core Domain: Terminals, Berths, Vessels

25. `Terminal` — 165 rows — depends on Country, Company, TerminalType
26. `Berth` — 21 rows — depends on Terminal
27. `Vessel` — 76 rows — depends on Company (owner/operator), Country (flag), VesselTypeRef
28. `VesselZone` — 12 rows — depends on Vessel
29. `AccessPoint` — 2 rows — depends on Vessel + VesselZone
30. `Cabin` — 7 rows — depends on Vessel + VesselZone
31. `LifeRaftGroup` — 2 rows — depends on Vessel + VesselZone
32. `Lifeboat` — 2 rows — depends on Vessel + VesselZone
33. `MusterStation` — 3 rows — depends on Vessel + VesselZone
34. `VesselCompatibility` — 4 rows — depends on Vessel + Terminal

### Phase 4 — Documents

35. `Document` — 49 rows — depends on Vessel, Terminal, Berth, DocumentType
36. `TerminalDocumentRequirement` — 55 rows — depends on Terminal, Berth, DocumentType
37. `VesselTerminalDocumentSetItem` — 5 rows — depends on Document, DocumentType

### Phase 5 — Registration Workflow

38. `TerminalRegistrationApplication` — 29 rows — depends on Terminal, Vessel
39. `TerminalRegistrationChecklistItem` — 151 rows — depends on TerminalRegistrationApplication, DocumentType

### Phase 6 — Help / Chatbot Content

40. `HelpIntent` — 83 rows — independent
41. `HelpArticle` — 118 rows — may reference HelpIntent
42. `HelpAlias` — 22 rows — depends on HelpIntent or HelpArticle
43. `HelpContextRule` — 9 rows — depends on HelpIntent

---

## Skipped (empty files)

These files have 0 data rows and can be skipped:

- `MapConfiguration_export.csv`
- `CompanyOffice_export.csv`
- `CompanySecurityPolicy_export.csv`
- `VesselTerminalDocumentSet_export.csv`
- `TerminalAttachment_export.csv`
- `TerminalMarineAccess_export.csv`
- `UserPreference_export.csv`
- `RoleFieldPermission_export.csv`

---

## Needs Manual Review

These files cannot be imported without a decision on how the new system handles them:

| File | Reason |
|---|---|
| `ApplicationFunction_export.csv` | Base44 platform metadata — maps to RBAC functions in the new system; needs new model or mapping |
| `ApplicationRole_export.csv` | Base44 platform RBAC — 3 roles (admin, user, viewer likely); must align with new auth system roles |
| `ApplicationUser_export.csv` | Base44 platform user accounts — only 2 rows; identities must be re-provisioned in new auth system |
| `ApplicationUserRole_export.csv` | Base44 platform RBAC assignments — depends on ApplicationUser + ApplicationRole decisions |
| `RoleFunctionPermission_export.csv` | Base44 platform permission matrix — 59 rows; must be re-modelled for new RBAC |
| `RoleTablePermission_export.csv` | Base44 platform permission matrix — 135 rows; largest permission file; needs new model |
| `RoleWorkflowPermission_export.csv` | Base44 workflow RBAC — 13 rows; depends on workflow model decisions |
| `WorkflowAction/Definition/Status/Transition` | Base44 workflow engine definitions — 4 files; new system workflow model not yet designed |
| `UserTag_export.csv` | User-specific tags — 2 rows; user model not yet implemented |
| `UserCompanyTagAssignment_export.csv` | User-specific data — 1 row; depends on User model |
| `UserContactTagAssignment_export.csv` | User-specific data — 2 rows; depends on User model |

---

## Notes on CSV Format

- All files use `publicId` as the stable migration key (UUID format)
- Base44 internal `id` fields are MongoDB ObjectId strings — these will **not** be imported as PKs; the new integer PK will be auto-generated
- `tenantId` values are `"default-tenant"` or `"global"` — map both to the same tenant on import
- `is_sample` column is present in all files — rows with `"true"` should be excluded from import
- `created_by_id` / `created_by` are Base44 user references — can be stored as audit strings but not FK-linked until users are migrated
- Some files have a numeric suffix (e.g. `_export-6`) — this is a Base44 export version number, not meaningful for import order
