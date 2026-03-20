/**
 * Breadcrumbs Component (Hierarchical Navigation Trail)
 * 
 * PURPOSE:
 * Displays navigation path showing user's current location in app hierarchy.
 * Enables quick navigation up the hierarchy tree.
 * 
 * NAVIGATION MAP ARCHITECTURE (lines 6-80):
 * 
 * Defines parent-child relationships for ALL pages:
 * 
 * STRUCTURE:
 * 'PageName': { parent: 'ParentPage', title: 'Display Name' }
 * 
 * ROOT PAGES (parent: null):
 * - Dashboard: Main hub
 * - Home: Landing page
 * 
 * HIERARCHY EXAMPLES:
 * 
 * 1. Vessel Detail Path:
 *    Dashboard → Fleet → Vessel Detail
 *    
 * 2. Document Type Edit Path:
 *    Dashboard → Reference Data → Document Types → Edit Document Type
 * 
 * 3. Country Alias Path:
 *    Dashboard → Reference Data → Countries → Aliases
 * 
 * MULTI-LEVEL NESTING:
 * Support for deep hierarchies (3-4 levels).
 * Example: Configuration → System Config → UDF Configuration
 * 
 * BREADCRUMB GENERATION (lines 82-100):
 * 
 * ALGORITHM:
 * 1. Start with currentPageName
 * 2. Look up in navigationMap
 * 3. Add to breadcrumbs array (front)
 * 4. Move to parent page
 * 5. Repeat until parent is null or not found
 * 6. Result: Reversed path from root to current
 * 
 * unshift() builds array in reverse order.
 * Final array: [root, parent, current]
 * 
 * DASHBOARD INJECTION (lines 95-100):
 * If breadcrumb trail doesn't start with Dashboard, prepend it.
 * Ensures consistent "Home" link at start.
 * 
 * HANDLES EDGE CASES:
 * - Pages not in map → empty breadcrumbs
 * - Circular references → would infinite loop (shouldn't exist in map)
 * - Missing parent → stops traversal gracefully
 * 
 * RENDERING LOGIC (lines 102-119):
 * 
 * LOOP through breadcrumbs:
 * - First item: Dashboard → renders Home icon instead of text
 * - Middle items: Render as clickable links
 * - Last item: Current page → render as bold text (not link)
 * 
 * SEPARATORS (line 106):
 * ChevronRight icon between each crumb.
 * Not rendered before first item.
 * 
 * ACTIVE/INACTIVE STATES:
 * - Links: hover:text-gray-700 hover:underline
 * - Current: text-gray-900 font-semibold (no hover, no link)
 * 
 * SPECIAL HOME ICON (line 114):
 * Dashboard crumb renders <Home icon> instead of "Dashboard" text.
 * Saves horizontal space in narrow headers.
 * Common UX pattern (home icon = back to start).
 * 
 * RESPONSIVE BEHAVIOR:
 * No explicit mobile handling (appears in desktop header only).
 * On mobile, header hidden and breadcrumbs don't render.
 * See Layout.js desktop header (line 467).
 * 
 * MISSING PAGES:
 * If page not in navigationMap, no breadcrumbs shown.
 * Graceful degradation.
 * TODO: Add all pages to map for complete coverage.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ChevronRight, Home } from 'lucide-react';

const navigationMap = {
  // Root
  'Dashboard': { parent: null, title: 'Dashboard' },
  'Home': { parent: null, title: 'Home' },

  // Primary nav
  'TerminalMap': { parent: 'Dashboard', title: 'World Map' },
  'TerminalComplexes': { parent: 'Dashboard', title: 'Terminal Complexes' },
  'Terminals': { parent: 'Dashboard', title: 'Terminals' },
  'Berths': { parent: 'Dashboard', title: 'Berths' },
  'Vessels': { parent: 'Dashboard', title: 'Fleet' },
  'Documents': { parent: 'Dashboard', title: 'Documents' },

  // CRM
  'Companies': { parent: 'Dashboard', title: 'Companies' },
  'Contacts': { parent: 'Dashboard', title: 'Contacts' },

  // ── Reference Data (ConfigurationMasterData) ──
  'ConfigurationMasterData': { parent: 'Dashboard', title: 'Reference Data' },
  'DocumentTypes': { parent: 'ConfigurationMasterData', title: 'Document Types' },
  'DocumentTypeDetail': { parent: 'DocumentTypes', title: 'Document Type Detail' },
  'EditDocumentType': { parent: 'DocumentTypes', title: 'Edit Document Type' },
  'AddDocumentType': { parent: 'DocumentTypes', title: 'Add Document Type' },
  'DocumentCategories': { parent: 'ConfigurationMasterData', title: 'Document Categories' },
  'DocumentCategoryDetail': { parent: 'DocumentCategories', title: 'Category Detail' },
  'EditDocumentCategory': { parent: 'DocumentCategories', title: 'Edit Category' },
  'AddDocumentCategory': { parent: 'DocumentCategories', title: 'Add Category' },
  'Countries': { parent: 'ConfigurationMasterData', title: 'Countries' },
  'CountryDetail': { parent: 'Countries', title: 'Country Detail' },
  'EditCountry': { parent: 'Countries', title: 'Edit Country' },
  'AddCountry': { parent: 'Countries', title: 'Add Country' },
  'CountryAliases': { parent: 'Countries', title: 'Aliases' },
  'IssuingAuthorities': { parent: 'ConfigurationMasterData', title: 'Issuing Authorities' },
  'AddIssuingAuthority': { parent: 'IssuingAuthorities', title: 'Add Authority' },
  'EditIssuingAuthority': { parent: 'IssuingAuthorities', title: 'Edit Authority' },
  'ProductTypes': { parent: 'ConfigurationMasterData', title: 'Product Types' },
  'AddProductType': { parent: 'ProductTypes', title: 'Add Product Type' },
  'EditProductType': { parent: 'ProductTypes', title: 'Edit Product Type' },

  // ── Vessel Configuration ──
  'ConfigurationVesselConfig': { parent: 'Dashboard', title: 'Vessel Configuration' },
  'VesselTypes': { parent: 'ConfigurationVesselConfig', title: 'Vessel Types' },
  'EditVesselType': { parent: 'VesselTypes', title: 'Edit Vessel Type' },
  'AddVesselType': { parent: 'VesselTypes', title: 'Add Vessel Type' },
  'FuelTypes': { parent: 'ConfigurationVesselConfig', title: 'Fuel Types' },
  'EditFuelType': { parent: 'FuelTypes', title: 'Edit Fuel Type' },
  'AddFuelType': { parent: 'FuelTypes', title: 'Add Fuel Type' },
  'CargoTypes': { parent: 'ConfigurationVesselConfig', title: 'Cargo Types' },
  'EditCargoType': { parent: 'CargoTypes', title: 'Edit Cargo Type' },
  'AddCargoType': { parent: 'CargoTypes', title: 'Add Cargo Type' },
  'VesselTypeAllowedCargoTypes': { parent: 'ConfigurationVesselConfig', title: 'Allowed Cargo Types' },
  'VesselTypeCargoPolicy': { parent: 'ConfigurationVesselConfig', title: 'Cargo Policy' },
  'VesselTypeAllowedFuelTypes': { parent: 'ConfigurationVesselConfig', title: 'Allowed Fuel Types' },
  'VesselTypeFuelTankPolicy': { parent: 'ConfigurationVesselConfig', title: 'Fuel Tank Policy' },

  // ── System & Behavior Configuration ──
  'ConfigurationSystemConfig': { parent: 'Dashboard', title: 'System & Behavior' },
  'SystemTags': { parent: 'ConfigurationSystemConfig', title: 'System Tags' },
  'SystemTagDetail': { parent: 'SystemTags', title: 'Tag Detail' },
  'AddSystemTag': { parent: 'SystemTags', title: 'Add Tag' },
  'EditSystemTag': { parent: 'SystemTags', title: 'Edit Tag' },
  'UdfConfigurations': { parent: 'ConfigurationSystemConfig', title: 'UDF Configuration' },
  'EditUdfConfiguration': { parent: 'UdfConfigurations', title: 'Edit UDF' },
  'Roles': { parent: 'ConfigurationSystemConfig', title: 'Roles' },
  'ApplicationUsers': { parent: 'ConfigurationSystemConfig', title: 'Application Users' },
  'PermissionMatrix': { parent: 'ConfigurationSystemConfig', title: 'Permission Matrix' },
  'Workflow': { parent: 'ConfigurationSystemConfig', title: 'Workflows' },
  'VesselTerminalDocumentSets': { parent: 'ConfigurationSystemConfig', title: 'Vessel-Terminal Document Sets' },
  'AddVesselTerminalDocumentSet': { parent: 'VesselTerminalDocumentSets', title: 'Add Document Set' },
  'EditVesselTerminalDocumentSet': { parent: 'VesselTerminalDocumentSets', title: 'Edit Document Set' },

  // ── Application Settings ──
  'ConfigurationAppSettings': { parent: 'Dashboard', title: 'Application Settings' },
  'SecurityPolicies': { parent: 'ConfigurationSystemConfig', title: 'Security Policies' },
  'GroupRoleMappings': { parent: 'ConfigurationSystemConfig', title: 'Group Role Mappings' },
  'IdentityProviders': { parent: 'ConfigurationSystemConfig', title: 'Identity Providers' },
  'AddIdentityProvider': { parent: 'IdentityProviders', title: 'Add Identity Provider' },
  'EditIdentityProvider': { parent: 'IdentityProviders', title: 'Edit Identity Provider' },

  // ── Design / Dev ──
  'DesignElements': { parent: 'ConfigurationSystemConfig', title: 'Design Elements' },

  // ── Administration ──
  'AdminUsers': { parent: 'Dashboard', title: 'Users' },
  'AuditLog': { parent: 'Dashboard', title: 'Audit Log' },
  'AuditLogDetail': { parent: 'AuditLog', title: 'Log Detail' },

  // ── Detail & Edit pages ──
  'VesselDetail': { parent: 'Vessels', title: 'Vessel Detail' },
  'EditVessel': { parent: 'Vessels', title: 'Edit Vessel' },
  'AddVessel': { parent: 'Vessels', title: 'Add Vessel' },
  'TerminalDetail': { parent: 'Terminals', title: 'Terminal Detail' },
  'EditTerminal': { parent: 'Terminals', title: 'Edit Terminal' },
  'AddTerminal': { parent: 'Terminals', title: 'Add Terminal' },
  'BerthDetail': { parent: 'Berths', title: 'Berth Detail' },
  'EditBerth': { parent: 'Berths', title: 'Edit Berth' },
  'AddBerth': { parent: 'Berths', title: 'Add Berth' },
  'CompanyDetail': { parent: 'Companies', title: 'Company Detail' },
  'EditCompany': { parent: 'Companies', title: 'Edit Company' },
  'AddCompany': { parent: 'Companies', title: 'Add Company' },
  'ContactDetail': { parent: 'Contacts', title: 'Contact Detail' },
  'EditContact': { parent: 'Contacts', title: 'Edit Contact' },
  'AddContact': { parent: 'Contacts', title: 'Add Contact' },
  'TerminalComplexDetail': { parent: 'TerminalComplexes', title: 'Complex Detail' },
  'EditTerminalComplex': { parent: 'TerminalComplexes', title: 'Edit Complex' },
  'AddTerminalComplex': { parent: 'TerminalComplexes', title: 'Add Complex' },
  'DocumentDetail': { parent: 'Documents', title: 'Document Detail' },
};

// Global subpage title registry — pages can register a detail title here
// so the breadcrumb shows e.g. "Workflows > Fleet Approval" as the last crumb
let _subPageTitle = null;
export const setBreadcrumbSubPage = (title) => { _subPageTitle = title; };
export const clearBreadcrumbSubPage = () => { _subPageTitle = null; };

const Breadcrumbs = ({ currentPageName }) => {
  const breadcrumbs = [];
  let currentPage = currentPageName;

  while (currentPage && navigationMap[currentPage]) {
    const pageInfo = navigationMap[currentPage];
    breadcrumbs.unshift({
      title: pageInfo.title,
      href: currentPage,
    });
    currentPage = pageInfo.parent;
  }

  if (breadcrumbs.length > 0 && breadcrumbs[0].href !== 'Dashboard') {
    breadcrumbs.unshift({ title: 'Home', href: 'Dashboard' });
  }

  // If a sub-page title is registered, append it as a non-link final crumb
  const subTitle = _subPageTitle;

  return (
    <nav className="flex items-center text-sm font-medium text-gray-500">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1 && !subTitle;
        return (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
            {isLast ? (
              <span className="text-gray-900 font-semibold">{crumb.title}</span>
            ) : (
              <Link to={createPageUrl(crumb.href)} className="hover:text-gray-700 hover:underline">
                {crumb.href === 'Dashboard' ? <Home className='w-4 h-4'/> : crumb.title}
              </Link>
            )}
          </div>
        );
      })}
      {subTitle && (
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
          <span className="text-gray-900 font-semibold">{subTitle}</span>
        </div>
      )}
    </nav>
  );
};

export default Breadcrumbs;