# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project rules (read first)

This is a **Base44 → independent migration**. It is NOT a new system.

- No UI changes
- No logic changes
- No renaming
- Only replace Base44 dependencies
- Read README.md before any task and follow it strictly

Do not re-introduce `@base44/sdk` or `@base44/vite-plugin`.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run lint       # ESLint (quiet — errors only)
npm run lint:fix   # ESLint with auto-fix
npm run typecheck  # tsc type check via jsconfig.json
npm run preview    # Preview production build
```

There are no tests in this project.

## Architecture

### Entry point & routing

`src/main.jsx` → `src/App.jsx` → `src/pages.config.js`

`pages.config.js` is the central page registry. It imports every page component and exports `PAGES` (map of route name → component) and `pagesConfig` (with `mainPage`, `Layout`). The current landing page is `TerminalMap`. Routes are generated dynamically from `PAGES` as `/<PageName>`.

`App.jsx` wraps everything in `AuthProvider` → `QueryClientProvider` → `Router`. Auth state from `AuthContext` gates rendering — `auth_required` redirects to login, `user_not_registered` shows an error screen.

### Layout

`src/Layout.jsx` is the application shell. It renders a collapsible sidebar with four tiers:
1. Primary nav (Dashboard, Map, Terminals, Berths, Fleet, Documents)
2. CRM (Companies, Contacts) — collapsible
3. Configuration (40+ admin pages, 5 sub-sections) — admin-only, collapsible
4. Administration (Users, Roles, Audit Log) — admin-only, collapsible

Admin sections only render when `user?.role === 'admin'`.

### Data layer (stub — needs real implementation)

`src/api/base44Client.js` exports a `base44` stub. **Every data read and write in all 187 page/component files goes through this object.** The stub currently returns empty arrays/null for everything.

Interface to implement:

```js
base44.entities.<EntityName>.list(sortBy?, limit?)
base44.entities.<EntityName>.filter(query, sortBy?, limit?)
base44.entities.<EntityName>.create(data)
base44.entities.<EntityName>.update(id, data)
base44.entities.<EntityName>.delete(id)
base44.entities.<EntityName>.bulkCreate(items[])

base44.auth.me()               // → user object or null
base44.auth.logout(redirectUrl?)
base44.auth.redirectToLogin(returnUrl?)
base44.auth.isAuthenticated()  // → boolean
base44.auth.updateMe(data)

base44.appLogs.logUserInApp(pageName)
```

The 92 entity schemas in `entities/*.jsonc` define the complete data model. Each file = one table/collection. These are the source of truth for what backend endpoints and fields are needed.

### Service layer

`src/components/services/` wraps `base44.entities.*` for the core domain objects (Terminal, Vessel, Document, Country, CountryAlias, chatbot help content). Services inject `tenantId` via `src/components/utils/tenant.jsx` and generate `publicId` UUIDs for new records.

### Authentication

`src/lib/AuthContext.jsx` — fetches `/api/apps/public/prod/public-settings/by-id/${appId}` (currently a Base44 platform endpoint that will fail), then calls `base44.auth.me()`. The `authError` state handles failure gracefully. This fetch target must be replaced with your own endpoint.

`src/lib/app-params.js` — reads `appId` and `access_token` from URL params or `localStorage` (keys prefixed `base44_*`). Env vars `VITE_BASE44_APP_ID` and `VITE_BASE44_FUNCTIONS_VERSION` provide defaults.

### React Query

`src/lib/query-client.js` — singleton `QueryClient`. All pages use `useQuery`/`useMutation`. The `['currentUser']` query key is shared app-wide for the logged-in user — invalidate it on logout or profile update.

### Path alias

`@/` → `src/` (configured in `vite.config.js` `resolve.alias` and `jsconfig.json`). Use `@/` for all internal imports.

### UI components

`src/components/ui/` — shadcn/ui (Radix UI + Tailwind). Do not modify.

### Map

`src/pages/TerminalMap.jsx` + `src/components/map/` — uses `react-leaflet` with `protomaps-leaflet` for tiles and `three.js` for 3D. Config managed via the `MapConfigurationSettings` page.
