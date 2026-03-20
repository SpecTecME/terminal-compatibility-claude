/**
 * Add Identity Provider Page (SSO Configuration Form)
 * 
 * PURPOSE:
 * Create new SSO provider configurations for enterprise authentication.
 * Supports OIDC/OAuth 2.0 and SAML 2.0 protocols.
 * 
 * TWO-SECTION FORM:
 * 1. Basic Information (lines 116-259): Behavior toggles
 * 2. Protocol Configuration (lines 261-489): OIDC or SAML fields
 * 
 * ========================================
 * SECTION 1: BASIC INFORMATION
 * ========================================
 * 
 * PROVIDER NAME (line 126-133):
 * Display name for the SSO provider.
 * Examples: "Microsoft Entra ID", "Okta Corporate", "Google Workspace".
 * 
 * PROVIDER TYPE (line 135-149):
 * Authentication protocol:
 * - OIDC: Modern, OAuth 2.0 based, JSON tokens
 * - SAML: Legacy, XML-based, enterprise standard
 * 
 * DOMAIN ALLOWLIST (line 152-161):
 * Comma-separated email domains.
 * 
 * ROUTING LOGIC:
 * - User enters: john@company.com
 * - System checks: "company.com" in allowlist?
 * - If yes: Route to this provider
 * - If no: Use default provider or local login
 * 
 * EXAMPLES:
 * - "company.com, company.ae" → Both domains
 * - Empty → No domain-based routing
 * 
 * TOGGLES (lines 163-246):
 * 
 * 1. IS ENABLED (line 164-173):
 *    Master switch for the provider.
 *    Disabled → Provider ignored completely.
 * 
 * 2. IS DEFAULT (line 175-184):
 *    Use when domain doesn't match any allowlist.
 *    Only one provider should be default.
 *    App doesn't enforce (admin responsibility).
 * 
 * 3. ENFORCE SSO (line 186-195):
 *    Block local password login.
 *    
 *    ENABLED:
 *    - Users MUST use SSO
 *    - Local login hidden/blocked
 *    - Exception: break-glass admins (next toggle)
 *    
 *    USE CASE:
 *    Corporate security policy requires SSO.
 *    No weak local passwords allowed.
 * 
 * 4. ALLOW LOCAL ADMIN BYPASS (line 197-206):
 *    Emergency access for admins.
 *    
 *    SCENARIO:
 *    - SSO enforced (previous toggle)
 *    - IdP goes down (Microsoft outage)
 *    - Need emergency access
 *    
 *    SOLUTION:
 *    - Special admin accounts exempt
 *    - Can use local password
 *    - Break-glass access
 * 
 * 5. JIT PROVISIONING (line 208-217):
 *    Just-In-Time user creation.
 *    
 *    ENABLED:
 *    - User logs in via SSO (first time)
 *    - System auto-creates User record
 *    - Assigns jitDefaultRole
 *    
 *    DISABLED:
 *    - Admin must pre-create/invite users
 *    - SSO login fails if user not found
 *    
 *    CONDITIONAL FIELD (lines 219-235):
 *    Shows jitDefaultRole dropdown if enabled.
 *    Options: user, admin.
 *    Most orgs use "user" (safe default).
 * 
 * 6. GROUP-ROLE MAPPING (line 237-246):
 *    Map IdP groups to app roles.
 *    
 *    ENABLED:
 *    - Reads groups from IdP token
 *    - Checks GroupRoleMappings table
 *    - Assigns corresponding role
 *    
 *    EXAMPLE:
 *    - User in "Azure-Admins" group
 *    - Mapping: "Azure-Admins" → admin
 *    - User gets admin role
 *    
 *    REQUIRES:
 *    - groupsClaim (OIDC) or groupsAttribute (SAML)
 *    - GroupRoleMappings configured
 * 
 * ========================================
 * SECTION 2: PROTOCOL CONFIGURATION
 * ========================================
 * 
 * TABBED INTERFACE (line 269):
 * Shows OIDC or SAML fields based on providerType.
 * 
 * OIDC FIELDS (lines 270-382):
 * 
 * ISSUER URL (line 273-280):
 * IdP's base URL for discovery.
 * Example: "https://login.microsoftonline.com/{tenant}/v2.0".
 * Some systems auto-discover endpoints from this.
 * 
 * CLIENT ID (line 281-289):
 * OAuth application identifier.
 * Obtained from IdP app registration.
 * 
 * CLIENT SECRET (line 292-301):
 * OAuth application secret.
 * Type=password (masked input).
 * Stored securely in database.
 * 
 * REDIRECT URI (line 303-311):
 * Where IdP returns after login.
 * Must match IdP configuration exactly.
 * Example: "https://yourapp.com/auth/callback".
 * 
 * OPTIONAL ENDPOINTS (lines 313-341):
 * Authorization, Token, UserInfo URLs.
 * Placeholder: "Optional if derivable".
 * Many IdPs support discovery (auto-derive from issuer).
 * 
 * SCOPES (line 343-351):
 * OAuth permission scopes.
 * Default: "openid profile email".
 * Minimum for user identification.
 * 
 * CLAIMS (lines 353-381):
 * Token field mappings:
 * - emailClaim: Where to find email (default: "email")
 * - nameClaim: Where to find name (default: "name")
 * - groupsClaim: Where to find groups (optional, for role mapping)
 * 
 * WHY CONFIGURABLE:
 * Different IdPs use different claim names.
 * Microsoft: "preferred_username" vs standard "email".
 * 
 * SAML FIELDS (lines 384-486):
 * 
 * IDP ENTITY ID (line 387-394):
 * Unique identifier for the IdP.
 * Example: "https://sts.windows.net/{tenant}/".
 * 
 * SSO URL (line 395-403):
 * SAML login endpoint.
 * Where to redirect for authentication.
 * 
 * X.509 CERTIFICATE (line 406-414):
 * IdP's public certificate for signature verification.
 * PEM format, multi-line.
 * Textarea with monospace font (line 412).
 * 
 * SP ENTITY ID (line 417-424):
 * This app's identifier (Service Provider).
 * Example: "https://yourapp.com".
 * 
 * ACS URL (line 426-434):
 * Assertion Consumer Service URL.
 * Where IdP posts SAML response.
 * Example: "https://yourapp.com/auth/saml/acs".
 * 
 * ATTRIBUTES (lines 447-475):
 * SAML attribute mappings (same concept as OIDC claims).
 * - emailAttribute: "email"
 * - nameAttribute: "displayName"
 * - groupsAttribute: "groups" (optional)
 * 
 * NAMEID FORMAT (line 477-485):
 * SAML NameID format.
 * Example: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress".
 * Tells IdP what format to use for user identifier.
 * 
 * NAVIGATION AFTER CREATE (line 75):
 * Redirects to EditIdentityProvider (not list).
 * Allows immediate testing/refinement of config.
 * 
 * DEFAULTS (lines 27-62):
 * Sensible defaults for most fields.
 * Reduces manual entry for standard configs.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Shield, Save, ArrowLeft, AlertCircle } from 'lucide-react';
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

export default function AddIdentityProvider() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    // OIDC fields
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
    // SAML fields
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

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.CompanyIdentityProvider.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        ...data
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['identityProviders']);
      toast.success('Identity provider created successfully');
      navigate(createPageUrl(`EditIdentityProvider?id=${data.id}`));
    },
    onError: (error) => {
      toast.error('Failed to create provider: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.providerName) {
      toast.error('Provider name is required');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('IdentityProviders')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Identity Provider</h1>
          <p className="text-gray-600 mt-1">Configure a new SSO authentication provider</p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Configuration Only</p>
          <p>This creates the provider configuration. Backend SSO handlers must be implemented separately to enable actual authentication flows.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
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
                  placeholder="e.g., Microsoft Entra ID"
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
              <p className="text-xs text-gray-600">Comma-separated email domains that should use this provider</p>
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
                placeholder="Admin notes about this provider..."
                className="bg-white border-gray-300 text-gray-900 min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Protocol Configuration */}
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
                    <Label className="text-gray-700">Issuer URL *</Label>
                    <Input
                      value={formData.issuerUrl}
                      onChange={(e) => setFormData({...formData, issuerUrl: e.target.value})}
                      placeholder="https://login.microsoftonline.com/{tenant}/v2.0"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Client ID *</Label>
                    <Input
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      placeholder="Application/Client ID"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Client Secret *</Label>
                  <Input
                    type="password"
                    value={formData.clientSecret}
                    onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                    placeholder="Client secret (stored securely)"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Redirect URI *</Label>
                  <Input
                    value={formData.redirectUri}
                    onChange={(e) => setFormData({...formData, redirectUri: e.target.value})}
                    placeholder="https://yourapp.com/auth/callback"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Authorization URL</Label>
                    <Input
                      value={formData.authorizationUrl}
                      onChange={(e) => setFormData({...formData, authorizationUrl: e.target.value})}
                      placeholder="Optional if derivable"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Token URL</Label>
                    <Input
                      value={formData.tokenUrl}
                      onChange={(e) => setFormData({...formData, tokenUrl: e.target.value})}
                      placeholder="Optional if derivable"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">UserInfo URL</Label>
                    <Input
                      value={formData.userInfoUrl}
                      onChange={(e) => setFormData({...formData, userInfoUrl: e.target.value})}
                      placeholder="Optional"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Scopes</Label>
                  <Input
                    value={formData.scopes}
                    onChange={(e) => setFormData({...formData, scopes: e.target.value})}
                    placeholder="openid profile email"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Email Claim</Label>
                    <Input
                      value={formData.emailClaim}
                      onChange={(e) => setFormData({...formData, emailClaim: e.target.value})}
                      placeholder="email"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Name Claim</Label>
                    <Input
                      value={formData.nameClaim}
                      onChange={(e) => setFormData({...formData, nameClaim: e.target.value})}
                      placeholder="name"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Groups Claim</Label>
                    <Input
                      value={formData.groupsClaim}
                      onChange={(e) => setFormData({...formData, groupsClaim: e.target.value})}
                      placeholder="groups (optional)"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="SAML" className="space-y-4 mt-0">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">IdP Entity ID *</Label>
                    <Input
                      value={formData.idpEntityId}
                      onChange={(e) => setFormData({...formData, idpEntityId: e.target.value})}
                      placeholder="https://sts.windows.net/{tenant}/"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">SSO URL *</Label>
                    <Input
                      value={formData.ssoUrl}
                      onChange={(e) => setFormData({...formData, ssoUrl: e.target.value})}
                      placeholder="https://login.microsoftonline.com/{tenant}/saml2"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">X.509 Certificate *</Label>
                  <Textarea
                    value={formData.x509Certificate}
                    onChange={(e) => setFormData({...formData, x509Certificate: e.target.value})}
                    placeholder="Paste IdP public certificate (PEM format)"
                    className="bg-white border-gray-300 text-gray-900 min-h-[120px] font-mono text-xs"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">SP Entity ID *</Label>
                    <Input
                      value={formData.spEntityId}
                      onChange={(e) => setFormData({...formData, spEntityId: e.target.value})}
                      placeholder="https://yourapp.com"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">ACS URL *</Label>
                    <Input
                      value={formData.acsUrl}
                      onChange={(e) => setFormData({...formData, acsUrl: e.target.value})}
                      placeholder="https://yourapp.com/auth/saml/acs"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Logout URL</Label>
                  <Input
                    value={formData.logoutUrl}
                    onChange={(e) => setFormData({...formData, logoutUrl: e.target.value})}
                    placeholder="Optional"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Email Attribute</Label>
                    <Input
                      value={formData.emailAttribute}
                      onChange={(e) => setFormData({...formData, emailAttribute: e.target.value})}
                      placeholder="email"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Name Attribute</Label>
                    <Input
                      value={formData.nameAttribute}
                      onChange={(e) => setFormData({...formData, nameAttribute: e.target.value})}
                      placeholder="displayName"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Groups Attribute</Label>
                    <Input
                      value={formData.groupsAttribute}
                      onChange={(e) => setFormData({...formData, groupsAttribute: e.target.value})}
                      placeholder="groups (optional)"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">NameID Format</Label>
                  <Input
                    value={formData.nameIdFormat}
                    onChange={(e) => setFormData({...formData, nameIdFormat: e.target.value})}
                    placeholder="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
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
            disabled={createMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Provider'}
          </Button>
        </div>
      </form>
    </div>
  );
}