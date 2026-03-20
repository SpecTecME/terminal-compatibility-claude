import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SeedSSODemoData() {
  const queryClient = useQueryClient();
  const [results, setResults] = useState([]);

  const seedMutation = useMutation({
    mutationFn: async () => {
      const logs = [];
      
      // Create demo Identity Providers
      logs.push({ step: 'Creating Microsoft Entra ID (OIDC) provider...', status: 'running' });
      const entraProvider = await base44.entities.CompanyIdentityProvider.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        providerName: 'Microsoft Entra ID (Demo)',
        providerType: 'OIDC',
        isEnabled: false,
        isDefault: false,
        enforceSSO: false,
        allowLocalAdminBypass: true,
        domainAllowlist: 'example.com',
        jitProvisioningEnabled: false,
        groupRoleMappingEnabled: false,
        issuerUrl: 'https://login.microsoftonline.com/{tenant-id}/v2.0',
        clientId: 'demo-client-id',
        clientSecret: 'demo-secret',
        redirectUri: 'https://yourapp.com/auth/callback',
        scopes: 'openid profile email',
        emailClaim: 'email',
        nameClaim: 'name',
        groupsClaim: 'groups',
        notes: 'Demo configuration - not functional without real credentials'
      });
      logs.push({ step: 'Created Microsoft Entra ID provider', status: 'success' });

      logs.push({ step: 'Creating AD FS (SAML) provider...', status: 'running' });
      const adfsProvider = await base44.entities.CompanyIdentityProvider.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        providerName: 'AD FS (Demo)',
        providerType: 'SAML',
        isEnabled: false,
        isDefault: false,
        enforceSSO: false,
        allowLocalAdminBypass: true,
        domainAllowlist: 'corp.example.com',
        jitProvisioningEnabled: false,
        groupRoleMappingEnabled: false,
        idpEntityId: 'https://adfs.example.com/adfs/services/trust',
        ssoUrl: 'https://adfs.example.com/adfs/ls/',
        x509Certificate: '-----BEGIN CERTIFICATE-----\n(Demo Certificate - Replace with real)\n-----END CERTIFICATE-----',
        spEntityId: 'https://yourapp.com',
        acsUrl: 'https://yourapp.com/auth/saml/acs',
        emailAttribute: 'email',
        nameAttribute: 'displayName',
        groupsAttribute: 'groups',
        notes: 'Demo configuration - not functional without real credentials'
      });
      logs.push({ step: 'Created AD FS provider', status: 'success' });

      logs.push({ step: 'Creating Okta (OIDC) provider...', status: 'running' });
      const oktaProvider = await base44.entities.CompanyIdentityProvider.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        providerName: 'Okta (Demo)',
        providerType: 'OIDC',
        isEnabled: false,
        isDefault: false,
        enforceSSO: false,
        allowLocalAdminBypass: true,
        domainAllowlist: 'example.okta.com',
        jitProvisioningEnabled: true,
        jitDefaultRole: 'user',
        groupRoleMappingEnabled: true,
        issuerUrl: 'https://example.okta.com/oauth2/default',
        clientId: 'demo-okta-client',
        clientSecret: 'demo-okta-secret',
        redirectUri: 'https://yourapp.com/auth/callback',
        scopes: 'openid profile email groups',
        emailClaim: 'email',
        nameClaim: 'name',
        groupsClaim: 'groups',
        notes: 'Demo with JIT provisioning and group mapping enabled'
      });
      logs.push({ step: 'Created Okta provider', status: 'success' });

      // Create demo Group-Role Mappings
      logs.push({ step: 'Creating group-role mappings...', status: 'running' });
      
      await base44.entities.CompanyGroupRoleMapping.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        providerId: oktaProvider.id,
        groupKey: 'TerminalAdmins',
        groupDisplayName: 'Terminal Administrators',
        mappedRole: 'admin',
        priority: 10,
        isActive: false,
        notes: 'Demo mapping - disabled by default'
      });

      await base44.entities.CompanyGroupRoleMapping.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        providerId: oktaProvider.id,
        groupKey: 'VesselEditors',
        groupDisplayName: 'Vessel Editors',
        mappedRole: 'user',
        priority: 20,
        isActive: false,
        notes: 'Demo mapping - disabled by default'
      });

      await base44.entities.CompanyGroupRoleMapping.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        providerId: oktaProvider.id,
        groupKey: 'ViewOnlyUsers',
        groupDisplayName: 'View-Only Users',
        mappedRole: 'user',
        priority: 30,
        isActive: false,
        notes: 'Demo mapping - disabled by default'
      });

      logs.push({ step: 'Created 3 group-role mappings', status: 'success' });
      logs.push({ step: 'Seed completed successfully!', status: 'success' });

      return logs;
    },
    onSuccess: (logs) => {
      setResults(logs);
      queryClient.invalidateQueries(['identityProviders']);
      queryClient.invalidateQueries(['groupRoleMappings']);
      toast.success('Demo SSO data seeded successfully');
    },
    onError: (error) => {
      toast.error('Seeding failed: ' + error.message);
      setResults([{ step: 'Error: ' + error.message, status: 'error' }]);
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed SSO Demo Data</h1>
        <p className="text-gray-600 mt-1">Create demo Identity Providers and Group-Role Mappings for testing</p>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Demo Data Only</p>
          <p>This creates disabled demo configurations with placeholder credentials. They are not functional and should be replaced with real SSO provider details for production use.</p>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5" />
            What will be created
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              Microsoft Entra ID (OIDC) provider (disabled)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              AD FS (SAML) provider (disabled)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              Okta (OIDC) provider with JIT & Group Mapping (disabled)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              3 demo group-role mappings (TerminalAdmins → Admin, VesselEditors → User, ViewOnlyUsers → User)
            </li>
          </ul>
        </CardContent>
      </Card>

      <Button 
        onClick={() => seedMutation.mutate()}
        disabled={seedMutation.isPending}
        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
      >
        <Play className="w-4 h-4 mr-2" />
        {seedMutation.isPending ? 'Seeding...' : 'Run Seed'}
      </Button>

      {results.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                  {result.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />}
                  {result.status === 'running' && <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mt-0.5" />}
                  <span className="text-sm text-gray-700">{result.step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}