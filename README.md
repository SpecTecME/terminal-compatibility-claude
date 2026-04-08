LNG Terminal Navigator (TCS)

Base44 Migration Specification (MASTER FILE)

⸻

1. Purpose of This Repository

This repository contains the Terminal Compatibility System (TCS) originally developed using Base44.

The purpose of this project is:

To convert the existing Base44-based application into a fully independent system WITHOUT changing functionality, UI, or behavior.

This document is the MASTER SPECIFICATION and must be followed strictly.

⸻

2. Core Principle (MANDATORY)

🚨 THIS IS NOT A NEW BUILD

This is a migration project, not a redesign or rewrite.

⸻

❌ STRICTLY FORBIDDEN
	•	Rebuilding modules from scratch
	•	Changing UI design (colors, layout, spacing, fonts)
	•	Changing workflows or logic
	•	Renaming entities, fields, or structures
	•	Simplifying logic without instruction
	•	Introducing new UX patterns

⸻

✅ STRICTLY REQUIRED
	•	Replace Base44 dependencies only
	•	Keep UI identical
	•	Keep behavior identical
	•	Keep data structures identical
	•	Maintain backward compatibility at all times

⸻

3. Scope of Work

3.1 What MUST be done
	•	Remove all Base44 dependencies
	•	Replace Base44 backend logic with custom implementation
	•	Replace Base44 data layer with relational database
	•	Ensure system runs independently (no Base44)

⸻

3.2 What MUST NOT change

UI / UX (CRITICAL)
The following must remain EXACTLY the same:
	•	Layout
	•	Colors
	•	Fonts
	•	Component structure
	•	Navigation
	•	Field positioning
	•	Labels
	•	Tabs
	•	User workflows

If it looks or behaves differently than Base44, it is WRONG.

⸻

4. Source of Truth

The existing Base44 implementation is the only reference.

All migration must:
	•	Replicate behavior exactly
	•	Extract logic, NOT reinterpret it
	•	Preserve every functional detail

⸻

5. Migration Strategy

Step 1 – Identify Base44 Dependencies

Typical Base44 elements to remove:
	•	Data hooks
	•	API abstractions
	•	Storage layers
	•	Authentication utilities
	•	Auto-generated CRUD logic

⸻

Step 2 – Replace Backend Layer

Replace with:
	•	Custom API (target: .NET backend)
	•	REST endpoints
	•	Explicit business logic

⸻

Step 3 – Replace Data Layer

Convert Base44 data into:
	•	Relational schema
	•	Proper tables and relationships
	•	Foreign keys instead of implicit references

⸻

Step 4 – Keep Frontend Intact

Frontend rules:
	•	DO NOT rewrite components
	•	DO NOT change structure
	•	ONLY update data-fetching logic

⸻

6. Data Model (MUST BE PRESERVED)

The following entities already exist and MUST remain unchanged:
	•	Vessel
	•	Terminal Complex
	•	Terminal
	•	Berth
	•	Document Type
	•	Vessel Documents
	•	Terminal Requirements
	•	Questionnaire Definitions

⸻

⚠️ IMPORTANT
	•	Field names must NOT change
	•	Relationships must NOT change
	•	Structure must NOT change

Only implementation changes.

⸻

7. Configuration Strategy

System must support feature flags without breaking existing logic.

Example:
useSimpleDocumentMode: true / false

Rules:
	•	Default must preserve current behavior
	•	New logic must be additive
	•	Never replace existing logic

⸻

8. UI/UX Rules (ABSOLUTE)

8.1 General Rule

UI must remain IDENTICAL to Base44 implementation

⸻

8.2 List Views

Each list MUST retain:
	•	Search
	•	Filters
	•	Table/grid layout
	•	Pagination
	•	Row actions:
	•	View
	•	Edit
	•	Delete

⸻

8.3 Detail Pages

Must retain:
	•	Tabs
	•	Sections
	•	Layout structure

⸻

8.4 Forms

Must retain:
	•	Field order
	•	Validation behavior
	•	Dropdown sources
	•	Labels

⸻

9. Development Rules for Claude

9.1 DO NOT
	•	Redesign UI
	•	Change logic
	•	Rename fields
	•	Simplify workflows
	•	Introduce new patterns

⸻

9.2 ALWAYS
	•	Extend existing structures
	•	Replace only Base44-specific parts
	•	Preserve full behavior
	•	Keep UI unchanged

⸻

9.3 WHEN MODIFYING CODE

Claude MUST:
	1.	Identify Base44-specific code
	2.	Replace ONLY that part
	3.	Leave everything else unchanged
	4.	Verify behavior remains identical

⸻

9.4 PRIORITY ORDER
	1.	Functional accuracy
	2.	UI consistency
	3.	Code clarity

⸻

10. Target Architecture

Frontend:
	•	React (existing code preserved)

Backend:
	•	Custom API (.NET planned)

Database:
	•	PostgreSQL (recommended)

⸻

11. Out of Scope (FOR NOW)

The following are NOT part of this phase:
	•	AI assistant integration
	•	UI redesign
	•	Performance optimization
	•	Feature expansion

⸻

12. Definition of Done

Migration is complete when:
	•	No Base44 dependencies remain
	•	Application runs independently
	•	UI is identical to original
	•	All features behave exactly the same
	•	Data persists correctly

⸻

13. Critical Warning

Any change in UI or behavior is considered a FAILURE.

⸻

14. How Claude Must Use This File

Claude must:
	•	Treat this file as PRIMARY INSTRUCTION
	•	Not improvise
	•	Not optimize beyond scope
	•	Not assume missing details
	•	Ask for clarification if needed

⸻

15. Next Steps

After this master file:
	•	Module-specific specifications will be created:
	•	DOCUMENTS.md
	•	TERMINAL.md
	•	VESSEL.md
	•	QUESTIONNAIRES.md

These will define detailed behavior and migration logic per module.
