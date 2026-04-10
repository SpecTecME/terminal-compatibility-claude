/**
 * Edit Identity Provider Page
 * 
 * PURPOSE:
 * Update existing SSO provider configuration.
 * Same form as AddIdentityProvider with pre-populated data.
 * 
 * STATE INITIALIZATION (lines 70-107):
 * Comprehensive null-safe loading.
 * Uses ?? operator for boolean fields (lines 75-82).
 * || operator for string fields (lines 73-74, 79-104).
 * 
 * DUAL QUERY INVALIDATION (lines 114-115):
 * Refreshes both list and specific provider.
 * 
 * NOT FOUND STATE (lines 140-149):
 * Shows error if provider doesn't exist.
 * Provides navigation back to list.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Shield, Save, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function EditIdentityProvider() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get('id');

  const { data: provider, isLoading } = useQuery({
    queryKey: ['identityProvider', providerId],
    queryFn: () => base44.entities.CompanyIdentityProvider.filter({ id: providerId }).then(r => r[0]),
    enabled: !!providerId
  });

  const [formData, setFormData] = useState({
    providerName: '',
    providerType: 'OIDC',
    isEnabled: true,
    isDefault: false,
    enforceSSO: false,
    allowLocalAdminBypass: true,
    domainAllowlist: '',
    jitProvisioningEnabled: false,
    jitDefaultRole: 'user',
    groupRoleMappingEnabled: false,
    notes: '',
    issuerUrl: '',
    authorizationUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: 'openid profile email',
    emailClaim: 'email',
    nameClaim: 'name',
    groupsClaim: '',
    idpEntityId: '',
    ssoUrl: '',
    x509Certificate: '',
    spEntityId: '',
    acsUrl: '',
    logoutUrl: '',
    emailAttribute: 'email',
    nameAttribute: 'displayName',
    groupsAttribute: '',
    nameIdFormat: ''
  });

  useEffect(() => {
    if (provider) {
      setFormData({
        providerName: provider.providerName || '',
        providerType: provider.providerType || 'OIDC',
        isEnabled: provider.isEnabled ?? true,
        isDefault: provider.isDefault ?? false,
        enforceSSO: provider.enforceSSO ?? false,
        allowLocalAdminBypass: provider.allowLocalAdminBypass ?? true,
        domainAllowlist: provider.domainAllowlist || '',
        jitProvisioningEnabled: provider.jitProvisioningEnabled ?? false,
        jitDefaultRole: provider.jitDefaultRole || 'user',
        groupRoleMappingEnabled: provider.groupRoleMappingEnabled ?? false,
        notes: provider.notes || '',
        issuerUrl: provider.issuerUrl || '',
        authorizationUrl: provider.authorizationUrl || '',
        tokenUrl: provider.tokenUrl || '',
        userInfoUrl: provider.userInfoUrl || '',
        clientId: provider.clientId || '',
        clientSecret: provider.clientSecret || '',
        redirectUri: provider.redirectUri || '',
        scopes: provider.scopes || 'openid profile email',
        emailClaim: provider.emailClaim || 'email',
        nameClaim: provider.nameClaim || 'name',
        groupsClaim: provider.groupsClaim || '',
        idpEntityId: provider.idpEntityId || '',
        ssoUrl: provider.ssoUrl || '',
        x509Certificate: provider.x509Certificate || '',
        spEntityId: provider.spEntityId || '',
        acsUrl: provider.acsUrl || '',
        logoutUrl: provider.logoutUrl || '',
        emailAttribute: provider.emailAttribute || 'email',
        nameAttribute: provider.nameAttribute || 'displayName',
        groupsAttribute: provider.groupsAttribute || '',
        nameIdFormat: provider.nameIdFormat || ''
      });
    }
  }, [provider]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.CompanyIdentityProvider.update(providerId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['identityProviders']);
      queryClient.invalidateQueries(['identityProvider', providerId]);
      toast.success('Identity provider updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update provider: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.providerName) {
      toast.error('Provider name is required');
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Provider Not Found</h2>
        <Link to={createPageUrl('IdentityProviders')}>
          <Button variant="outline">Back to Providers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Identity Provider</h1>
          <p className="text-gray-600 mt-1">{provider.providerName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Same form structure as AddIdentityProvider but with pre-filled data */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Provider Name *</Label>
                <Input
                  required
                  value={formData.providerName}
                  onChange={(e) => setFormData({...formData, providerName: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Provider Type *</Label>
                <Select 
                  value={formData.providerType}
                  onValueChange={(v) => setFormData({...formData, providerType: v})}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OIDC">OIDC / OAuth 2.0</SelectItem>
                    <SelectItem value="SAML">SAML 2.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Domain Allowlist</Label>
              <Input
                value={formData.domainAllowlist}
                onChange={(e) => setFormData({...formData, domainAllowlist: e.target.value})}
                placeholder="e.g., company.com, company.ae"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-900">Enabled</Label>
                  <p className="text-sm text-gray-600">Allow users to authenticate via this provider</p>
                </div>
                <Switch
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData({...formData, isEnabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-900">Default Provider</Label>
                  <p className="text-sm text-gray-600">Use as default for SSO sign-in routing</p>
                </div>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({...formData, isDefault: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-900">Enforce SSO</Label>
                  <p className="text-sm text-gray-600">Block local password login (except break-glass admins)</p>
                </div>
                <Switch
                  checked={formData.enforceSSO}
                  onCheckedChange={(checked) => setFormData({...formData, enforceSSO: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-900">Allow Local Admin Bypass</Label>
                  <p className="text-sm text-gray-600">Emergency admin accounts can use local login</p>
                </div>
                <Switch
                  checked={formData.allowLocalAdminBypass}
                  onCheckedChange={(checked) => setFormData({...formData, allowLocalAdminBypass: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-900">JIT Provisioning</Label>
                  <p className="text-sm text-gray-600">Auto-create users on first SSO login</p>
                </div>
                <Switch
                  checked={formData.jitProvisioningEnabled}
                  onCheckedChange={(checked) => setFormData({...formData, jitProvisioningEnabled: checked})}
                />
              </div>

              {formData.jitProvisioningEnabled && (
                <div className="space-y-2 ml-6">
                  <Label className="text-gray-700">Default Role for JIT Users</Label>
                  <Select 
                    value={formData.jitDefaultRole}
                    onValueChange={(v) => setFormData({...formData, jitDefaultRole: v})}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-900">Group-Role Mapping</Label>
                  <p className="text-sm text-gray-600">Map IdP groups to application roles</p>
                </div>
                <Switch
                  checked={formData.groupRoleMappingEnabled}
                  onCheckedChange={(checked) => setFormData({...formData, groupRoleMappingEnabled: checked})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white border-gray-300 text-gray-900 min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Protocol Configuration - same as Add page */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {formData.providerType} Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={formData.providerType} className="w-full">
              <TabsContent value="OIDC" className="space-y-4 mt-0">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Issuer URL</Label>
                    <Input
                      value={formData.issuerUrl}
                      onChange={(e) => setFormData({...formData, issuerUrl: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Client ID</Label>
                    <Input
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Client Secret</Label>
                  <Input
                    type="password"
                    value={formData.clientSecret}
                    onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                    placeholder="Enter to update"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Redirect URI</Label>
                  <Input
                    value={formData.redirectUri}
                    onChange={(e) => setFormData({...formData, redirectUri: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Authorization URL</Label>
                    <Input
                      value={formData.authorizationUrl}
                      onChange={(e) => setFormData({...formData, authorizationUrl: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Token URL</Label>
                    <Input
                      value={formData.tokenUrl}
                      onChange={(e) => setFormData({...formData, tokenUrl: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">UserInfo URL</Label>
                    <Input
                      value={formData.userInfoUrl}
                      onChange={(e) => setFormData({...formData, userInfoUrl: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Scopes</Label>
                  <Input
                    value={formData.scopes}
                    onChange={(e) => setFormData({...formData, scopes: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Email Claim</Label>
                    <Input
                      value={formData.emailClaim}
                      onChange={(e) => setFormData({...formData, emailClaim: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Name Claim</Label>
                    <Input
                      value={formData.nameClaim}
                      onChange={(e) => setFormData({...formData, nameClaim: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Groups Claim</Label>
                    <Input
                      value={formData.groupsClaim}
                      onChange={(e) => setFormData({...formData, groupsClaim: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="SAML" className="space-y-4 mt-0">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">IdP Entity ID</Label>
                    <Input
                      value={formData.idpEntityId}
                      onChange={(e) => setFormData({...formData, idpEntityId: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">SSO URL</Label>
                    <Input
                      value={formData.ssoUrl}
                      onChange={(e) => setFormData({...formData, ssoUrl: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">X.509 Certificate</Label>
                  <Textarea
                    value={formData.x509Certificate}
                    onChange={(e) => setFormData({...formData, x509Certificate: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 min-h-[120px] font-mono text-xs"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">SP Entity ID</Label>
                    <Input
                      value={formData.spEntityId}
                      onChange={(e) => setFormData({...formData, spEntityId: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">ACS URL</Label>
                    <Input
                      value={formData.acsUrl}
                      onChange={(e) => setFormData({...formData, acsUrl: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Logout URL</Label>
                  <Input
                    value={formData.logoutUrl}
                    onChange={(e) => setFormData({...formData, logoutUrl: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Email Attribute</Label>
                    <Input
                      value={formData.emailAttribute}
                      onChange={(e) => setFormData({...formData, emailAttribute: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Name Attribute</Label>
                    <Input
                      value={formData.nameAttribute}
                      onChange={(e) => setFormData({...formData, nameAttribute: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Groups Attribute</Label>
                    <Input
                      value={formData.groupsAttribute}
                      onChange={(e) => setFormData({...formData, groupsAttribute: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">NameID Format</Label>
                  <Input
                    value={formData.nameIdFormat}
                    onChange={(e) => setFormData({...formData, nameIdFormat: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={createPageUrl('IdentityProviders')}>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}