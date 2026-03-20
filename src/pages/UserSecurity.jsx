/**
 * User Security Page (Personal Security Settings)
 * 
 * PURPOSE:
 * User-level security management: password, MFA, sessions, recovery.
 * Respects company security policies while allowing personal configuration.
 * 
 * POLICY ENFORCEMENT (lines 57-66):
 * 
 * Loads CompanySecurityPolicy (active).
 * 
 * DERIVED VALUES:
 * - isMfaEnforced (line 65): From policy.enforceMfa
 * - allowedMethods (line 66): From policy.allowedMfaMethods
 * 
 * CONSTRAINS USER:
 * User cannot disable MFA if enforced by policy.
 * User cannot enable blocked MFA methods.
 * 
 * FOUR SECURITY TABS:
 * 
 * ========================================
 * 1. AUTHENTICATION TAB (lines 132-171)
 * ========================================
 * 
 * PASSWORD CHANGE (lines 139-148):
 * 
 * CURRENT STATE:
 * Placeholder (toast.info, line 69).
 * 
 * PLANNED:
 * - Current password verification
 * - New password entry (2x for confirmation)
 * - Policy compliance validation
 * - Secure password update
 * 
 * LAST CHANGED DISPLAY (line 142):
 * Shows when password last updated.
 * Helps user track security hygiene.
 * 
 * COMPANY POLICY DISPLAY (lines 150-168):
 * 
 * If policy exists, shows blue info box:
 * - Minimum length requirement
 * - Complexity level
 * - Expiry interval (if set)
 * - Reuse policy
 * 
 * TRANSPARENCY:
 * User understands requirements before changing password.
 * Reduces failed attempts.
 * 
 * ========================================
 * 2. MFA TAB (lines 173-289)
 * ========================================
 * 
 * MFA STATUS CARD (lines 181-205):
 * 
 * VISUAL INDICATOR (lines 183-187):
 * - Enabled: Green checkmark
 * - Disabled: Amber alert
 * 
 * POLICY BADGE (lines 192-196):
 * Shows "Required by policy" if enforced.
 * 
 * TOGGLE (lines 200-204):
 * Enable/disable MFA.
 * 
 * DISABLED IF:
 * isMfaEnforced && mfaEnabled (line 203).
 * Cannot disable company-required MFA.
 * 
 * ENFORCEMENT NOTICE (lines 207-212):
 * Amber warning when MFA locked on.
 * Explains cannot disable due to policy.
 * 
 * MFA METHODS (lines 216-286):
 * 
 * Three method cards:
 * 
 * 1. AUTHENTICATOR APP (lines 221-234):
 *    - Google Authenticator, Authy, etc.
 *    - TOTP (Time-based One-Time Password)
 *    - Most secure, offline
 * 
 * 2. SMS VERIFICATION (lines 237-255):
 *    - Text message codes
 *    - Requires phone number
 *    - "Disabled by policy" badge if not allowed (line 243-247)
 *    - Toggle disabled if not in allowedMethods (line 253)
 * 
 * 3. EMAIL FALLBACK (lines 258-276):
 *    - Email-based codes
 *    - Less secure (email compromise = account compromise)
 *    - Same policy enforcement as SMS
 * 
 * POLICY ENFORCEMENT (line 81-86):
 * Toggle handler checks allowedMethods.
 * Shows error if method not permitted.
 * 
 * PREVENTS:
 * User enabling SMS if company blocks it.
 * 
 * LAST VERIFIED (lines 279-285):
 * Shows timestamp of last MFA verification.
 * Security audit trail.
 * 
 * ========================================
 * 3. SESSIONS & DEVICES TAB (lines 291-346)
 * ========================================
 * 
 * SIGN OUT ALL BUTTON (lines 300-303):
 * Terminates all sessions.
 * 
 * USE CASE:
 * - Lost device
 * - Suspected compromise
 * - Force re-login everywhere
 * 
 * CURRENT STATE: Placeholder.
 * 
 * CURRENT SESSION CARD (lines 308-321):
 * Highlights active session.
 * Green background, "Active" badge.
 * Shows browser and activity time.
 * 
 * POLICY INFO (lines 324-334):
 * Displays from SecurityPolicy:
 * - Session timeout minutes
 * - Max concurrent sessions (if limited)
 * 
 * INFORMS USER:
 * How long they can stay idle.
 * How many devices they can use.
 * 
 * LOGIN HISTORY (lines 338-343):
 * Placeholder for future feature.
 * Would show past login attempts, IPs, devices.
 * 
 * ========================================
 * 4. RECOVERY TAB (lines 348-396)
 * ========================================
 * 
 * RECOVERY EMAIL (line 357-367):
 * Alternative email for account recovery.
 * Different from login email.
 * 
 * CURRENT STATE: Read-only placeholder.
 * 
 * RECOVERY PHONE (line 369-379):
 * Alternative phone for SMS recovery.
 * 
 * BACKUP CODES (lines 384-393):
 * One-time codes for emergency access.
 * 
 * SCENARIO:
 * - MFA device lost
 * - Cannot receive SMS
 * - Use backup code instead
 * 
 * GENERATE BUTTON:
 * Creates new set of codes.
 * Invalidates old codes (security).
 * 
 * PLACEHOLDER STATE:
 * Most handlers show "coming soon" toast.
 * UI structure ready for implementation.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  Key, 
  Smartphone, 
  Monitor, 
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  LogOut,
  RefreshCw,
  Mail,
  Phone as PhoneIcon,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getCurrentUserCached } from '../components/utils/currentUser';

export default function UserSecurity() {
  const [user, setUser] = useState(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMethods, setMfaMethods] = useState({
    authenticator: false,
    sms: false,
    email: false
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUserCached();
        setUser(userData);
        setMfaEnabled(userData.mfaEnabled || false);
        setMfaMethods({
          authenticator: userData.mfaAuthenticator || false,
          sms: userData.mfaSms || false,
          email: userData.mfaEmail || false
        });
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: securityPolicy } = useQuery({
    queryKey: ['securityPolicy'],
    queryFn: async () => {
      const policies = await base44.entities.CompanySecurityPolicy.filter({ isActive: true });
      return policies[0];
    }
  });

  const isMfaEnforced = securityPolicy?.enforceMfa || false;
  const allowedMethods = securityPolicy?.allowedMfaMethods || ['authenticator', 'sms', 'email'];

  const handlePasswordChange = () => {
    toast.info('Password change functionality coming soon');
  };

  const handleToggleMfa = () => {
    if (isMfaEnforced && mfaEnabled) {
      toast.error('MFA is enforced by company policy and cannot be disabled');
      return;
    }
    toast.info('MFA toggle functionality coming soon');
  };

  const handleToggleMfaMethod = (method) => {
    if (!allowedMethods.includes(method)) {
      toast.error(`${method} is not allowed by company policy`);
      return;
    }
    toast.info('MFA method configuration coming soon');
  };

  const handleSignOutAll = () => {
    toast.info('Sign out from all sessions functionality coming soon');
  };

  const handleRegenerateRecoveryCodes = () => {
    toast.info('Recovery codes regeneration coming soon');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-1">Manage your authentication and account security</p>
      </div>

      <Tabs defaultValue="authentication" className="space-y-6">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="authentication" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Authentication
          </TabsTrigger>
          <TabsTrigger value="mfa" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Multi-Factor Auth
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Sessions & Devices
          </TabsTrigger>
          <TabsTrigger value="recovery" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Recovery
          </TabsTrigger>
        </TabsList>

        {/* Authentication */}
        <TabsContent value="authentication">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Password</CardTitle>
              <CardDescription>Manage your password and authentication credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Change Password</p>
                  <p className="text-sm text-gray-600">Last changed: {user.passwordLastChanged || 'Never'}</p>
                </div>
                <Button onClick={handlePasswordChange} variant="outline" className="border-gray-300">
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>

              {securityPolicy && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-blue-900">Company Password Policy</p>
                      <ul className="space-y-1 text-blue-800">
                        <li>• Minimum length: {securityPolicy.passwordMinLength} characters</li>
                        <li>• Complexity: {securityPolicy.passwordComplexity}</li>
                        {securityPolicy.passwordExpiryDays && (
                          <li>• Expires every {securityPolicy.passwordExpiryDays} days</li>
                        )}
                        <li>• Reuse previous passwords: {securityPolicy.allowPasswordReuse ? 'Allowed' : 'Not allowed'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MFA */}
        <TabsContent value="mfa">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Multi-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  {mfaEnabled ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">MFA Status</p>
                    <p className="text-sm text-gray-600">
                      {mfaEnabled ? 'Enabled and active' : 'Not configured'}
                      {isMfaEnforced && (
                        <Badge className="ml-2 bg-blue-500/10 text-blue-600 border-blue-500/30">
                          Required by policy
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={mfaEnabled}
                  onCheckedChange={handleToggleMfa}
                  disabled={isMfaEnforced && mfaEnabled}
                />
              </div>

              {isMfaEnforced && mfaEnabled && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">MFA is enforced by company policy and cannot be disabled.</p>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">MFA Methods</h3>
                
                <div className="space-y-3">
                  {/* Authenticator App */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Authenticator App</p>
                        <p className="text-sm text-gray-600">Use Google Authenticator or similar</p>
                      </div>
                    </div>
                    <Switch
                      checked={mfaMethods.authenticator}
                      onCheckedChange={() => handleToggleMfaMethod('authenticator')}
                      disabled={!allowedMethods.includes('authenticator')}
                    />
                  </div>

                  {/* SMS */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">SMS Verification</p>
                        <p className="text-sm text-gray-600">Receive codes via text message</p>
                        {!allowedMethods.includes('sms') && (
                          <Badge className="mt-1 bg-slate-500/10 text-slate-600 border-slate-500/30">
                            Disabled by policy
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={mfaMethods.sms}
                      onCheckedChange={() => handleToggleMfaMethod('sms')}
                      disabled={!allowedMethods.includes('sms')}
                    />
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Email Fallback</p>
                        <p className="text-sm text-gray-600">Receive codes via email</p>
                        {!allowedMethods.includes('email') && (
                          <Badge className="mt-1 bg-slate-500/10 text-slate-600 border-slate-500/30">
                            Disabled by policy
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={mfaMethods.email}
                      onCheckedChange={() => handleToggleMfaMethod('email')}
                      disabled={!allowedMethods.includes('email')}
                    />
                  </div>
                </div>

                {user.mfaLastVerified && (
                  <div className="pt-4">
                    <p className="text-sm text-gray-600">
                      Last verified: {new Date(user.mfaLastVerified).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions & Devices */}
        <TabsContent value="sessions">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900">Active Sessions</CardTitle>
                  <CardDescription>Manage your active login sessions and devices</CardDescription>
                </div>
                <Button onClick={handleSignOutAll} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Session */}
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-900">Current Session</p>
                      <p className="text-sm text-gray-600">Browser • Last activity: just now</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    Active
                  </Badge>
                </div>
              </div>

              {/* Session Info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Session Management</p>
                {securityPolicy && (
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>• Session timeout: {securityPolicy.sessionTimeoutMinutes} minutes</p>
                    {securityPolicy.maxConcurrentSessions && (
                      <p>• Max concurrent sessions: {securityPolicy.maxConcurrentSessions}</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Recent Login History</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Login history tracking coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery */}
        <TabsContent value="recovery">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Account Recovery</CardTitle>
              <CardDescription>Configure recovery options for account access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Recovery Email</Label>
                  <Input
                    type="email"
                    value={user.recoveryEmail || ''}
                    onChange={(e) => toast.info('Recovery email update coming soon')}
                    placeholder="recovery@example.com"
                    className="bg-white border-gray-300"
                  />
                  <p className="text-xs text-gray-600">Used for account recovery if you lose access</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Recovery Phone</Label>
                  <Input
                    type="tel"
                    value={user.recoveryPhone || ''}
                    onChange={(e) => toast.info('Recovery phone update coming soon')}
                    placeholder="+1234567890"
                    className="bg-white border-gray-300"
                  />
                  <p className="text-xs text-gray-600">Alternative recovery option via SMS</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Backup Recovery Codes</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Recovery codes allow you to access your account if you lose your authentication device.
                </p>
                <Button onClick={handleRegenerateRecoveryCodes} variant="outline" className="border-gray-300">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Recovery Codes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}