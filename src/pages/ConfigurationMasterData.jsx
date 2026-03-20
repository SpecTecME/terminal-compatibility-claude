/**
 * Configuration Master Data Hub Page
 * 
 * PURPOSE:
 * Navigation hub for all master/reference data management pages.
 * Centralized access to foundational data that powers the system.
 * 
 * DOMAIN CONTEXT - MASTER DATA:
 * 
 * Master data = shared reference data used across the system.
 * Changes infrequently, managed by admins, used by all users.
 * 
 * CATEGORIES ORGANIZED HERE:
 * 
 * 1. GEOGRAPHIC DATA:
 *    - Countries: ISO codes, temporal validity
 *    - Used for: Flag states, locations, jurisdictions
 * 
 * 2. PRODUCT/CARGO CLASSIFICATION:
 *    - Product Types: Terminal/berth cargo types (LNG, Crude Oil, etc.)
 *    - Fuel Types: Vessel fuel classifications
 *    - Cargo Types: Vessel cargo capabilities
 *    - Enables compatibility matching between vessels and terminals
 * 
 * 3. VESSEL CLASSIFICATION:
 *    - Vessel Types: Primary type + sub-type hierarchy
 *    - Defines vessel capabilities and specifications
 * 
 * 4. DOCUMENT MANAGEMENT:
 *    - Document Categories: Top-level groupings
 *    - Document Types: Specific certificate/form definitions
 *    - Issuing Authorities: Who issues documents
 *    - Manages compliance documentation system
 * 
 * 5. TAXONOMY/TAGGING:
 *    - System Tags: Admin-defined tags for entities
 *    - Flexible categorization across all modules
 * 
 * NAVIGATION PATTERN (lines 17-27, 38-57):
 * 
 * Grid of clickable cards, each linking to a master data list page.
 * Consistent visual pattern:
 * - Icon (category identifier)
 * - Name (data type)
 * - Description (purpose)
 * - Chevron (indicates navigation)
 * 
 * HOVER STATES:
 * Cards highlight on hover (cyan border, background change).
 * Clear affordance for clickability.
 * 
 * WHY CENTRALIZE:
 * - Single entry point for all reference data
 * - Easier training for admins
 * - Consistent management patterns
 * - Clear separation from operational data
 * 
 * RELATED HUBS:
 * - ConfigurationAppSettings: Email, localization
 * - ConfigurationVesselConfig: Vessel type policies
 * - ConfigurationSystemConfig: Auth, security, workflow
 * 
 * Each configuration area has its own hub page.
 * This page = master/reference data only.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Ship, 
  FileText, 
  Database, 
  Package, 
  Map, 
  Tag,
  Building2,
  ChevronRight
} from 'lucide-react';

export default function ConfigurationMasterData() {
  const items = [
    { name: 'Countries', href: 'Countries', icon: Map, description: 'Manage country reference data' },
    { name: 'Product Types', href: 'ProductTypes', icon: Package, description: 'Manage product type classifications' },
    { name: 'Fuel Types', href: 'FuelTypes', icon: Database, description: 'Manage fuel type reference data' },
    { name: 'Cargo Types', href: 'CargoTypes', icon: Package, description: 'Manage cargo type reference data' },
    { name: 'Vessel Types', href: 'VesselTypes', icon: Ship, description: 'Manage vessel type definitions' },
    { name: 'Document Categories', href: 'DocumentCategories', icon: FileText, description: 'Organize documents into categories' },
    { name: 'Document Types', href: 'DocumentTypes', icon: FileText, description: 'Manage document type definitions' },
    { name: 'Issuing Authorities', href: 'IssuingAuthorities', icon: Building2, description: 'Manage document issuing authorities' },
    { name: 'System Tags', href: 'SystemTags', icon: Tag, description: 'Configure system-wide tags' },
    { name: 'Maritime Zones', href: 'MaritimeZones', icon: Map, description: 'Manage maritime zones and regulatory overlays' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reference / Master Data</h1>
        <p className="text-gray-600 mt-1">Maintain core reference data and system tags</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-3">
            {items.map((item) => (
              <Link key={item.href} to={createPageUrl(item.href)}>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-cyan-500/50 hover:bg-gray-50 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                      <item.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm group-hover:text-cyan-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}