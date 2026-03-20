/**
 * Configuration System Config Hub Page
 * 
 * PURPOSE:
 * Navigation hub for system-level configuration and behavior.
 * Authentication, security, workflow, and extensibility settings.
 * 
 * DOMAIN CONTEXT - SYSTEM CONFIGURATION:
 * 
 * FIVE CONFIGURATION AREAS:
 * 
 * 1. WORKFLOW:
 *    - Approval processes (e.g., terminal registration workflow)
 *    - State transitions
 *    - Notification triggers
 *    - Escalation rules
 *    Example: "Registration requires marine operations approval before terminal approval"
 * 
 * 2. IDENTITY PROVIDERS (IdP):
 *    - SSO configuration (SAML, OIDC)
 *    - Azure AD, Okta, Google Workspace integration
 *    - Attribute mapping (email, name, groups)
 *    - Multi-IdP support for different organizations
 *    Example: "Nakilat users authenticate via Azure AD, contractors via separate IdP"
 * 
 * 3. GROUP ROLE MAPPINGS:
 *    - Map IdP groups to application roles
 *    - External group "Maritime_Admins" → App role "admin"
 *    - External group "Terminal_Operators" → App role "user"
 *    - Dynamic role assignment based on IdP membership
 *    Example: "Azure AD group 'Marine Operations' → role 'marine_ops_reviewer'"
 * 
 * 4. SECURITY POLICIES:
 *    - Password complexity requirements
 *    - MFA enforcement rules
 *    - Session timeout settings
 *    - IP whitelisting
 *    - Account lockout policies
 *    Example: "Require MFA for admin role, 12-character password minimum"
 * 
 * 5. UDF CONFIGURATION:
 *    - User-Defined Fields per module
 *    - Custom fields without schema changes
 *    - Vessel UDF: Two text fields (10 char, 12 char)
 *    - Future: Terminal UDF, Company UDF, etc.
 *    Example: "Vessel UDF01 = 'IMO Code', UDF02 = 'Fleet Number'"
 * 
 * WHY CENTRALIZE:
 * - Critical system settings in one place
 * - Admin-only access required
 * - Changes affect entire system
 * - Clear separation from user preferences
 * 
 * SECURITY CONSIDERATIONS:
 * These pages should have strict access control.
 * Incorrect configuration can compromise security or break system.
 * Audit logging required for all changes.
 * 
 * RELATED HUBS:
 * - ConfigurationMasterData: Reference data
 * - ConfigurationAppSettings: Application preferences
 * - ConfigurationVesselConfig: Domain-specific rules
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Shield,
  GitBranch,
  Users,
  Lock,
  ChevronRight,
  Settings
} from 'lucide-react';

export default function ConfigurationSystemConfig() {
  const items = [
    { name: 'Workflow', href: 'Workflow', icon: GitBranch, description: 'Configure workflow engine — statuses, actions, transitions' },
    { name: 'Identity Providers', href: 'IdentityProviders', icon: Shield, description: 'Manage SSO and authentication providers' },
    { name: 'Group Mappings', href: 'GroupRoleMappings', icon: Users, description: 'Map IdP groups to application roles' },
    { name: 'Security Policies', href: 'SecurityPolicies', icon: Lock, description: 'Configure password and MFA policies' },
    { name: 'UDF Configuration', href: 'UdfConfigurations', icon: Settings, description: 'Configure user-defined fields for modules' },
    { name: 'Application Users', href: 'ApplicationUsers', icon: Users, description: 'Application-level user registry for permissions and role assignment' },
    { name: 'Roles', href: 'Roles', icon: Shield, description: 'Define application roles with table, function and workflow permissions' },
    { name: 'Permission Matrix', href: 'PermissionMatrix', icon: Settings, description: 'Configure role-based access rights across all entities and functions' },
    { name: 'Map Configuration', href: 'MapConfigurationSettings', icon: Settings, description: 'Configure map display and maritime zone overlay settings' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System & Behavior Configuration</h1>
        <p className="text-gray-600 mt-1">Configure workflow, authentication, and security policies</p>
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