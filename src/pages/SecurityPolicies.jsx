/**
 * Security Policies Page (Company-Wide Security Configuration)
 * 
 * PURPOSE:
 * Configure security rules that apply to all users in the organization.
 * Admin-only page for setting password, MFA, and session policies.
 * 
 * ADMIN ACCESS CONTROL (lines 26-38, 116-124):
 * 
 * LOADS USER (lines 26-39):
 * Checks if current user is admin.
 * Shows error if not admin role.
 * 
 * ACCESS DENIED UI (lines 116-124):
 * Red alert icon, clear message.
 * Non-admins cannot view/edit policies.
 * 
 * SECURITY RATIONALE:
 * These policies affect ALL users.
 * Only trusted admins should configure.
 * 
 * SINGLETON PATTERN (lines 41-47, 81-101):
 * 
 * Only ONE active security policy per tenant.
 * Query filters by isActive=true.
 * 
 * CREATE OR UPDATE:
 * - If policy exists: Update it (line 84)
 * - If no policy: Create first one (lines 86-91)
 * 
 * PREVENTS:
 * Multiple conflicting policies.
 * 
 * ========================================
 * AUTHENTICATION MODE (lines 158-211)
 * ========================================
 * 
 * AUTH SOURCE POLICY (line 168-187):
 * How users authenticate:
 * 
 * LOCAL (line 177):
 * - Email/password only
 * - No SSO integration
 * - Simple deployment
 * 
 * SSO (line 178):
 * - Identity provider only
 * - Local login blocked (except break-glass admins)
 * - Enterprise requirement
 * 
 * HYBRID (line 179):
 * - User chooses: password OR SSO
 * - Most flexible
 * - Gradual SSO migration
 * 
 * HELP TEXT (lines 182-186):
 * Dynamic description based on selection.
 * Explains current mode clearly.
 * 
 * MFA SOURCE POLICY (line 189-209):
 * Where MFA is enforced:
 * 
 * APP (line 199):
 * - This application handles MFA
 * - User configures in UserSecurity page
 * - App sends codes via SMS/email
 * 
 * IDP (line 200):
 * - Identity provider handles MFA
 * - Configured in Azure AD/Okta/etc.
 * - App trusts IdP's MFA
 * 
 * EITHER (line 201):
 * - Depends on authentication path
 * - SSO login → IdP MFA
 * - Local login → App MFA
 * 
 * ========================================
 * MFA POLICY (lines 213-270)
 * ========================================
 * 
 * ENFORCE MFA (line 223-232):
 * Global requirement toggle.
 * 
 * ENABLED:
 * - ALL users must configure MFA
 * - Cannot disable in UserSecurity page
 * - Enforced at login
 * 
 * DISABLED:
 * - MFA optional
 * - Users choose to enable
 * 
 * ALLOWED METHODS (line 234-267):
 * Which MFA types permitted:
 * 
 * - Authenticator: TOTP apps (Google Authenticator, Authy)
 * - SMS: Text message codes (carrier-dependent)
 * - Email: Fallback via email (less secure)
 * 
 * MULTI-SELECT (lines 237-266):
 * Checkboxes for each method.
 * Can allow all, none, or specific combinations.
 * 
 * TOGGLE LOGIC (lines 108-114):
 * Adds/removes from allowedMfaMethods array.
 * Manages multi-select state cleanly.
 * 
 * ========================================
 * PASSWORD POLICY (lines 272-334)
 * ========================================
 * 
 * MIN LENGTH (line 283-293):
 * Character count requirement.
 * Range: 6-32 characters.
 * Industry standard: 8-12.
 * 
 * COMPLEXITY (line 295-307):
 * Character variety requirements:
 * 
 * LOW: Letters only (weak, not recommended)
 * MEDIUM: Letters + numbers (common)
 * STRONG: Letters + numbers + symbols (recommended)
 * 
 * PASSWORD EXPIRY (line 309-320):
 * Force periodic password changes.
 * 
 * OPTIONAL:
 * - Null/empty: Never expires
 * - 90: Expire every 90 days (common)
 * - 365: Annual change
 * 
 * CONTROVERSY:
 * NIST now recommends NO expiry (users pick weak passwords if forced to change).
 * But many corporate policies require it.
 * 
 * ALLOW REUSE (line 323-332):
 * Can users reuse old passwords?
 * 
 * ENABLED:
 * - User can set same password again
 * - Simple, less frustrating
 * 
 * DISABLED:
 * - Must pick new password each time
 * - More secure (if password leaked)
 * - Requires password history tracking
 * 
 * ========================================
 * SESSION POLICY (lines 336-373)
 * ========================================
 * 
 * SESSION TIMEOUT (line 347-356):
 * Idle time before auto-logout.
 * In minutes (default: 480 = 8 hours).
 * 
 * TRADE-OFF:
 * - Short timeout: More secure, annoying
 * - Long timeout: Convenient, security risk
 * 
 * COMMON VALUES:
 * - 15-30 min: High-security systems
 * - 240 min (4h): Balanced
 * - 480 min (8h): Full workday
 * 
 * MAX CONCURRENT SESSIONS (line 359-370):
 * Limit simultaneous logins.
 * 
 * OPTIONAL:
 * - Null/empty: Unlimited (default)
 * - 1: One device at a time
 * - 3: Desktop + laptop + mobile
 * 
 * ENFORCEMENT:
 * When limit reached, oldest session terminated.
 * 
 * EFFECTIVE DATE (lines 375-392):
 * When policy takes effect.
 * 
 * FUTURE USE:
 * Could support scheduled policy changes.
 * Currently just metadata (immediate effect).
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, AlertCircle, Lock, Clock, Users, Key, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function SecurityPolicies() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData.role !== 'admin') {
          toast.error('Access denied: Admin role required');
        }
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: policy, isLoading } = useQuery({
    queryKey: ['securityPolicy'],
    queryFn: async () => {
      const policies = await base44.entities.CompanySecurityPolicy.filter({ isActive: true });
      return policies[0];
    }
  });

  const [formData, setFormData] = useState({
    authSourcePolicy: 'LOCAL',
    mfaSourcePolicy: 'APP',
    enforceMfa: false,
    allowedMfaMethods: ['authenticator', 'sms', 'email'],
    passwordMinLength: 8,
    passwordComplexity: 'medium',
    passwordExpiryDays: null,
    sessionTimeoutMinutes: 480,
    maxConcurrentSessions: null,
    allowPasswordReuse: true,
    documentApprovalMode: 'COMPLEX',
    policyEffectiveFrom: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        authSourcePolicy: policy.authSourcePolicy || 'LOCAL',
        mfaSourcePolicy: policy.mfaSourcePolicy || 'APP',
        enforceMfa: policy.enforceMfa || false,
        allowedMfaMethods: policy.allowedMfaMethods || ['authenticator', 'sms', 'email'],
        passwordMinLength: policy.passwordMinLength || 8,
        passwordComplexity: policy.passwordComplexity || 'medium',
        passwordExpiryDays: policy.passwordExpiryDays || null,
        sessionTimeoutMinutes: policy.sessionTimeoutMinutes || 480,
        maxConcurrentSessions: policy.maxConcurrentSessions || null,
        allowPasswordReuse: policy.allowPasswordReuse ?? true,
        documentApprovalMode: policy.documentApprovalMode || 'COMPLEX',
        policyEffectiveFrom: policy.policyEffectiveFrom || new Date().toISOString().split('T')[0]
      });
    }
  }, [policy]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (policy) {
        return await base44.entities.CompanySecurityPolicy.update(policy.id, data);
      } else {
        return await base44.entities.CompanySecurityPolicy.create({
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          isActive: true,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['securityPolicy']);
      toast.success('Security policy updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update policy: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const toggleMfaMethod = (method) => {
    const current = formData.allowedMfaMethods || [];
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    setFormData({ ...formData, allowedMfaMethods: updated });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only administrators can manage security policies</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Security Policies</h1>
          <p className="text-gray-600 mt-1">Configure security rules that apply to all users</p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Admin-Only Configuration</p>
          <p>These policies apply to all users and override individual user settings.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Authentication Mode */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Authentication Mode
            </CardTitle>
            <CardDescription>Control how users authenticate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-gray-900">Auth Source Policy</Label>
              <Select 
                value={formData.authSourcePolicy}
                onValueChange={(value) => setFormData({...formData, authSourcePolicy: value})}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOCAL">Local Password Only</SelectItem>
                  <SelectItem value="SSO">SSO Only (via Identity Provider)</SelectItem>
                  <SelectItem value="HYBRID">Hybrid (Allow Both)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">
                {formData.authSourcePolicy === 'LOCAL' && 'Users authenticate with email/password only'}
                {formData.authSourcePolicy === 'SSO' && 'Users must authenticate via SSO (local login blocked except break-glass admins)'}
                {formData.authSourcePolicy === 'HYBRID' && 'Users can choose between password or SSO login'}
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-900">MFA Source Policy</Label>
              <Select 
                value={formData.mfaSourcePolicy}
                onValueChange={(value) => setFormData({...formData, mfaSourcePolicy: value})}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APP">Application-Managed MFA</SelectItem>
                  <SelectItem value="IDP">IdP-Managed MFA</SelectItem>
                  <SelectItem value="EITHER">Allow Either</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">
                {formData.mfaSourcePolicy === 'APP' && 'MFA handled by this application'}
                {formData.mfaSourcePolicy === 'IDP' && 'MFA handled by Identity Provider (SSO)'}
                {formData.mfaSourcePolicy === 'EITHER' && 'Allow either depending on authentication path'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* MFA Policy */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Multi-Factor Authentication
            </CardTitle>
            <CardDescription>Control MFA requirements for all users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-900">Enforce MFA for all users</Label>
                <p className="text-sm text-gray-600">Require all users to configure MFA</p>
              </div>
              <Switch
                checked={formData.enforceMfa}
                onCheckedChange={(checked) => setFormData({...formData, enforceMfa: checked})}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-gray-900">Allowed MFA Methods</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="authenticator"
                    checked={formData.allowedMfaMethods.includes('authenticator')}
                    onCheckedChange={() => toggleMfaMethod('authenticator')}
                  />
                  <Label htmlFor="authenticator" className="cursor-pointer text-gray-700">
                    Authenticator App
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="sms"
                    checked={formData.allowedMfaMethods.includes('sms')}
                    onCheckedChange={() => toggleMfaMethod('sms')}
                  />
                  <Label htmlFor="sms" className="cursor-pointer text-gray-700">
                    SMS Verification
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="email"
                    checked={formData.allowedMfaMethods.includes('email')}
                    onCheckedChange={() => toggleMfaMethod('email')}
                  />
                  <Label htmlFor="email" className="cursor-pointer text-gray-700">
                    Email Fallback
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Policy */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Password Requirements
            </CardTitle>
            <CardDescription>Set password strength and validity rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Minimum Length</Label>
                <Input
                  type="number"
                  min="6"
                  max="32"
                  value={formData.passwordMinLength}
                  onChange={(e) => setFormData({...formData, passwordMinLength: parseInt(e.target.value)})}
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Complexity Level</Label>
                <Select value={formData.passwordComplexity} onValueChange={(value) => setFormData({...formData, passwordComplexity: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - letters only</SelectItem>
                    <SelectItem value="medium">Medium - letters + numbers</SelectItem>
                    <SelectItem value="strong">Strong - letters, numbers, symbols</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Password Expiry (Days)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.passwordExpiryDays || ''}
                  onChange={(e) => setFormData({...formData, passwordExpiryDays: e.target.value ? parseInt(e.target.value) : null})}
                  placeholder="Optional (e.g., 90)"
                  className="bg-white border-gray-300"
                />
                <p className="text-xs text-gray-600">Leave empty for no expiry</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-900">Allow Password Reuse</Label>
                <p className="text-sm text-gray-600">Users can reuse previous passwords</p>
              </div>
              <Switch
                checked={formData.allowPasswordReuse}
                onCheckedChange={(checked) => setFormData({...formData, allowPasswordReuse: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Session Policy */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Session Management
            </CardTitle>
            <CardDescription>Control session timeouts and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Session Timeout (Minutes)</Label>
                <Input
                  type="number"
                  min="5"
                  value={formData.sessionTimeoutMinutes}
                  onChange={(e) => setFormData({...formData, sessionTimeoutMinutes: parseInt(e.target.value)})}
                  className="bg-white border-gray-300"
                />
                <p className="text-xs text-gray-600">Idle time before automatic logout</p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Max Concurrent Sessions</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxConcurrentSessions || ''}
                  onChange={(e) => setFormData({...formData, maxConcurrentSessions: e.target.value ? parseInt(e.target.value) : null})}
                  placeholder="Optional (e.g., 3)"
                  className="bg-white border-gray-300"
                />
                <p className="text-xs text-gray-600">Leave empty for unlimited</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Approval Mode */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Document Approval Mode
            </CardTitle>
            <CardDescription>Choose how terminal document requirements are managed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select 
              value={formData.documentApprovalMode}
              onValueChange={(value) => setFormData({...formData, documentApprovalMode: value})}
            >
              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLEX">Complex - Rule-Based Requirements</SelectItem>
                <SelectItem value="SIMPLE">Simple - Manual Document Selection</SelectItem>
              </SelectContent>
            </Select>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-900">
                {formData.documentApprovalMode === 'COMPLEX' && (
                  <>
                    <strong>Complex mode:</strong> Terminal/berth requirements automatically determine which documents are needed based on rules and vessel properties.
                  </>
                )}
                {formData.documentApprovalMode === 'SIMPLE' && (
                  <>
                    <strong>Simple mode:</strong> Manually select required documents for each vessel-terminal combination without complex rules.
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Policy Metadata */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Policy Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Effective From</Label>
              <Input
                type="date"
                value={formData.policyEffectiveFrom}
                onChange={(e) => setFormData({...formData, policyEffectiveFrom: e.target.value})}
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-gray-600">Date when this policy becomes active</p>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Policy'}
          </Button>
        </div>
      </form>
    </div>
  );
}