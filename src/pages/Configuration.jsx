/**
 * Configuration Master Hub Page
 * 
 * PURPOSE:
 * Top-level navigation hub for all system configuration.
 * Organizes configuration into four logical areas.
 * 
 * FOUR CONFIGURATION AREAS:
 * 
 * 1. REFERENCE / MASTER DATA (lines 23-32, 91-95):
 *    Foundation data used across the system:
 *    - Countries (ISO codes, flag states)
 *    - Product/Fuel/Cargo types (classification)
 *    - Vessel types (vessel classification)
 *    - Document categories/types (compliance)
 *    - System tags (taxonomy)
 *    
 *    CHANGE FREQUENCY: Rare (quarterly or less)
 *    ACCESS: Data admins
 * 
 * 2. VESSEL CONFIGURATION (lines 34-39, 97-101):
 *    Vessel type-specific policies:
 *    - Fuel tank configurations
 *    - Allowed fuel types per vessel type
 *    - Allowed cargo types per vessel type
 *    - Cargo tank policies
 *    
 *    CHANGE FREQUENCY: Occasional (when adding vessel types)
 *    ACCESS: Marine engineering admins
 * 
 * 3. SYSTEM & BEHAVIOR (lines 41-46, 103-107):
 *    System-level settings:
 *    - Workflow/approval processes
 *    - Identity providers (SSO)
 *    - Group role mappings (IdP → App roles)
 *    - Security policies (passwords, MFA)
 *    
 *    CHANGE FREQUENCY: Rare (when policies change)
 *    ACCESS: System admins only
 *    RISK: High (security/access control)
 * 
 * 4. APPLICATION SETTINGS (lines 48-51, 109-113):
 *    App-wide preferences:
 *    - Email/notifications
 *    - Timezone/localization
 *    
 *    CHANGE FREQUENCY: Occasional
 *    ACCESS: Operations admins
 * 
 * REUSABLE SECTION COMPONENT (lines 53-82):
 * 
 * ConfigSection renders consistent card layout.
 * 
 * PROPS:
 * - title: Section heading
 * - description: Section purpose
 * - items: Array of nav items (name, href, icon, description)
 * 
 * BENEFITS:
 * - DRY: Single component, reused 4 times
 * - Consistent styling across sections
 * - Easy to add new sections/items
 * 
 * NAVIGATION PATTERN:
 * Each item is a clickable card.
 * Hover effects: Border color change, icon color change.
 * ChevronRight indicates navigation.
 * 
 * ICON SYSTEM:
 * Every configuration area has semantic icon:
 * - Map: Countries
 * - Package: Products/Cargo
 * - Fuel: Fuel types
 * - Shield: Identity/Security
 * - GitBranch: Workflow
 * - etc.
 * 
 * Consistent visual language throughout app.
 * 
 * HIERARCHICAL ORGANIZATION:
 * 
 * Configuration (this page)
 * ├── Reference Data
 * │   ├── Countries
 * │   ├── Product Types
 * │   └── ...
 * ├── Vessel Config
 * │   ├── Fuel Tank Policy
 * │   └── ...
 * ├── System Config
 * │   ├── Workflow
 * │   └── ...
 * └── App Settings
 *     └── ...
 * 
 * Clear mental model for admins.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Ship, 
  FileText, 
  Database, 
  Fuel, 
  Package, 
  Map, 
  Tag,
  ChevronRight,
  Shield,
  GitBranch,
  Users,
  Lock,
  Bell,
  Globe
} from 'lucide-react';

export default function Configuration() {
  const masterData = [
    { name: 'Countries', href: 'Countries', icon: Map, description: 'Manage country reference data' },
    { name: 'Product Types', href: 'ProductTypes', icon: Package, description: 'Manage product type classifications' },
    { name: 'Fuel Types', href: 'FuelTypes', icon: Fuel, description: 'Manage fuel type reference data' },
    { name: 'Cargo Types', href: 'CargoTypes', icon: Package, description: 'Manage cargo type reference data' },
    { name: 'Vessel Types', href: 'VesselTypes', icon: Ship, description: 'Manage vessel type definitions' },
    { name: 'Document Categories', href: 'DocumentCategories', icon: FileText, description: 'Organize documents into categories' },
    { name: 'Document Types', href: 'DocumentTypes', icon: FileText, description: 'Manage document type definitions' },
    { name: 'System Tags', href: 'SystemTags', icon: Tag, description: 'Configure system-wide tags' },
  ];

  const vesselConfig = [
    { name: 'Vessel Type Fuel Tank Policy', href: 'VesselTypeFuelTankPolicy', icon: Fuel, description: 'Configure fuel tank policies per vessel type' },
    { name: 'Vessel Type Allowed Fuel Types', href: 'VesselTypeAllowedFuelTypes', icon: Fuel, description: 'Define allowed fuel types per vessel type' },
    { name: 'Vessel Type Allowed Cargo Types', href: 'VesselTypeAllowedCargoTypes', icon: Package, description: 'Define allowed cargo types per vessel type' },
    { name: 'Vessel Type Cargo Policy', href: 'VesselTypeCargoPolicy', icon: Package, description: 'Configure cargo policies per vessel type' },
  ];

  const systemConfig = [
    { name: 'Workflow', href: 'Workflow', icon: GitBranch, description: 'Configure workflow and approval processes' },
    { name: 'Identity Providers', href: 'IdentityProviders', icon: Shield, description: 'Manage SSO and authentication providers' },
    { name: 'Group Mappings', href: 'GroupRoleMappings', icon: Users, description: 'Map IdP groups to application roles' },
    { name: 'Security Policies', href: 'SecurityPolicies', icon: Lock, description: 'Configure password and MFA policies' },
  ];

  const appSettings = [
    { name: 'Email & Notifications', href: 'Preferences', icon: Bell, description: 'Configure email and notification settings' },
    { name: 'Time & Localization', href: 'Preferences', icon: Globe, description: 'Configure timezone and language settings' },
  ];

  const ConfigSection = ({ title, description, items }) => (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
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
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
        <p className="text-gray-600 mt-1">Manage system configuration and reference data</p>
      </div>

      <ConfigSection
        title="Reference / Master Data"
        description="Maintain core reference data and system tags"
        items={masterData}
      />

      <ConfigSection
        title="Vessel Configuration"
        description="Configure vessel type policies and capabilities"
        items={vesselConfig}
      />

      <ConfigSection
        title="System & Behavior Configuration"
        description="Configure workflow, authentication, and security policies"
        items={systemConfig}
      />

      <ConfigSection
        title="Application Settings"
        description="Configure email, notifications, and localization"
        items={appSettings}
      />
    </div>
  );
}