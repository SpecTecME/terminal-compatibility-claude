/**
 * Identity Providers List Page (SSO Configuration Registry)
 * 
 * PURPOSE:
 * Manage external authentication providers (OIDC and SAML).
 * Enables enterprise SSO integration for secure login.
 * 
 * DOMAIN CONTEXT - ENTERPRISE SSO:
 * 
 * WHY SSO MATTERS:
 * Large organizations use centralized identity:
 * - Microsoft Entra ID (Azure AD)
 * - Okta
 * - Google Workspace
 * - Custom SAML providers
 * 
 * BENEFITS:
 * - Single login for all apps
 * - Centralized access control
 * - Automatic user provisioning
 * - Enhanced security (MFA at IdP level)
 * - Compliance (audit trails)
 * 
 * BACKEND REQUIREMENT NOTICE (lines 115-121):
 * 
 * Blue info banner explains:
 * "Backend Functions Required"
 * 
 * CURRENT STATE:
 * - Frontend config UI functional
 * - Database stores provider metadata
 * - Actual SSO flows need backend implementation
 * 
 * FUTURE:
 * Backend handlers will read this config for OAuth/SAML flows.
 * 
 * TABLE COLUMNS EXPLAINED:
 * 
 * 1. PROVIDER NAME (line 140, 162-164):
 *    Display name (e.g., "Microsoft Entra ID", "Okta Corporate").
 * 
 * 2. TYPE (line 141, 165-169):
 *    Protocol: OIDC or SAML.
 *    Badge styling for visual differentiation.
 * 
 * 3. STATUS (line 142, 170-181):
 *    isEnabled flag.
 *    
 *    ENABLED:
 *    - Green checkmark
 *    - "Enabled" text
 *    - Provider active for login
 *    
 *    DISABLED:
 *    - Gray X
 *    - "Disabled" text
 *    - Provider ignored by login system
 * 
 * 4. DEFAULT (line 143, 183-187):
 *    isDefault flag.
 *    
 *    SHOWN: Gold star (filled)
 *    HIDDEN: Empty cell
 *    
 *    MEANING:
 *    Default provider used when:
 *    - User email domain not matched
 *    - Direct SSO button click
 *    - Only one provider → auto-select
 * 
 * 5. SSO ENFORCED (line 144, 188-194):
 *    enforceSSO flag.
 *    
 *    YES (green checkmark):
 *    - Local password login blocked
 *    - Users MUST use SSO
 *    - Exception: break-glass admins (if allowLocalAdminBypass)
 *    
 *    NO (gray X):
 *    - SSO optional
 *    - Users can choose local password
 * 
 * 6. JIT PROVISIONING (line 145, 195-201):
 *    jitProvisioningEnabled flag.
 *    
 *    ENABLED:
 *    - New users auto-created on first SSO login
 *    - No manual user creation needed
 *    - Assigned jitDefaultRole (user/admin)
 *    
 *    DISABLED:
 *    - User must exist in database before SSO login
 *    - Admin pre-creates users via invite
 *    
 *    TRADE-OFF:
 *    - Enabled: Convenient, less control
 *    - Disabled: Manual work, tighter access control
 * 
 * 7. GROUP MAPPING (line 146, 202-208):
 *    groupRoleMappingEnabled flag.
 *    
 *    ENABLED:
 *    - IdP groups → App roles
 *    - "Azure-Admins" group → admin role
 *    - "Azure-Users" group → user role
 *    - Managed in GroupRoleMappings page
 *    
 *    DISABLED:
 *    - Manual role assignment
 *    - All JIT users get jitDefaultRole
 * 
 * HARD DELETE (lines 55-66):
 * 
 * Actually deletes provider (not soft delete).
 * 
 * WARNING (line 239):
 * "Users who authenticate via this provider will no longer be able to sign in."
 * 
 * IMPACT:
 * - Existing SSO users locked out
 * - Should migrate users first
 * - Or have local password fallback
 * 
 * USE SPARINGLY:
 * Only delete if misconfigured or switching providers.
 * 
 * EMPTY STATE (lines 151-158):
 * Shows when no providers configured.
 * Shield icon, helpful message.
 * Encourages adding first provider.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Key,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

export default function IdentityProviders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState(null);
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['identityProviders'],
    queryFn: () => base44.entities.CompanyIdentityProvider.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyIdentityProvider.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['identityProviders']);
      toast.success('Identity provider deleted');
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to delete provider: ' + error.message);
    }
  });

  const filteredProviders = providers.filter(p =>
    p.providerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.providerType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (provider) => {
    setProviderToDelete(provider);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (providerToDelete) {
      deleteMutation.mutate(providerToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Identity Providers (SSO)</h1>
            <p className="text-gray-600 mt-1">Configure OIDC and SAML authentication providers</p>
          </div>
          <Link to={createPageUrl('AddIdentityProvider')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Backend Functions Required</p>
          <p>SSO authentication flows require backend functions to be enabled. The providers configured here will be used once backend SSO handlers are implemented.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white border-gray-300 text-gray-900"
        />
      </div>

      {/* Providers Table */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Provider Name</TableHead>
                <TableHead className="text-gray-600">Type</TableHead>
                <TableHead className="text-gray-600">Status</TableHead>
                <TableHead className="text-gray-600">Default</TableHead>
                <TableHead className="text-gray-600">SSO Enforced</TableHead>
                <TableHead className="text-gray-600">JIT Provisioning</TableHead>
                <TableHead className="text-gray-600">Group Mapping</TableHead>
                <TableHead className="text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No identity providers configured</p>
                    <p className="text-sm mt-1">Add your first SSO provider to get started</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((provider) => (
                  <TableRow key={provider.id} className="border-gray-200">
                    <TableCell className="font-medium text-gray-900">
                      {provider.providerName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gray-300 text-gray-700">
                        {provider.providerType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {provider.isEnabled ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Disabled</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {provider.isDefault && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {provider.enforceSSO ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {provider.jitProvisioningEnabled ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {provider.groupRoleMappingEnabled ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={createPageUrl(`EditIdentityProvider?id=${provider.id}`)}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteClick(provider)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Identity Provider</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete "{providerToDelete?.providerName}"? Users who authenticate via this provider will no longer be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Provider'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}