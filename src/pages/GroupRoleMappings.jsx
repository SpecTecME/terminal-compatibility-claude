/**
 * Group-Role Mappings Page (SSO Group Authorization)
 * 
 * PURPOSE:
 * Map external IdP groups to application roles.
 * Enables automatic role assignment based on SSO group membership.
 * 
 * DOMAIN CONTEXT - SSO GROUP MAPPING:
 * 
 * THE PROBLEM:
 * User logs in via SSO with groups: ["Azure-Admins", "Azure-Users", "Finance-Team"].
 * System needs to determine: Is this user admin or regular user?
 * 
 * THE SOLUTION:
 * Group-role mapping rules:
 * - "Azure-Admins" → admin
 * - "Azure-Users" → user
 * - "Finance-Team" → user (or ignore if no mapping)
 * 
 * PROCESS FLOW:
 * 1. User authenticates via SSO
 * 2. IdP returns groups in token
 * 3. System checks GroupRoleMappings table
 * 4. Finds matching rule(s)
 * 5. Assigns corresponding role
 * 
 * INFO BANNER (lines 318-324):
 * Explains mapping concept to admins.
 * Critical for understanding the feature.
 * 
 * FIELDS IN FORM:
 * 
 * 1. IDENTITY PROVIDER (line 214-227):
 *    Which SSO provider this mapping applies to.
 *    Allows different mappings per provider.
 *    
 *    EXAMPLE:
 *    - Microsoft Entra ID: "Azure-Admins" → admin
 *    - Okta: "Okta-SuperUsers" → admin
 * 
 * 2. GROUP KEY/ID (line 231-241):
 *    Exact group identifier from IdP.
 *    
 *    CASE SENSITIVITY:
 *    Usually case-sensitive (depends on IdP).
 *    Must match IdP group name exactly.
 *    
 *    EXAMPLES:
 *    - "TerminalAdmins" (Azure AD group)
 *    - "cn=Admins,ou=Groups,dc=company,dc=com" (LDAP DN)
 *    - "app-admin-group" (Okta group)
 *    
 *    PLACEHOLDER:
 *    "e.g., TerminalAdmins" shows format.
 * 
 * 3. DISPLAY NAME (line 242-250):
 *    Human-readable description.
 *    Optional (can be same as groupKey).
 *    
 *    EXAMPLES:
 *    - groupKey: "app-admin-group"
 *    - displayName: "Application Administrators"
 *    
 *    HELPS:
 *    Admin remembers what group does.
 *    Clearer in UI tables.
 * 
 * 4. MAPPED ROLE (line 254-267):
 *    Which app role to assign.
 *    Options: user, admin.
 *    
 *    REQUIRED field (validated line 150).
 *    
 *    EXAMPLES:
 *    - "Azure-Admins" → admin
 *    - "Azure-Users" → user
 *    - "Finance-Team" → user
 * 
 * 5. PRIORITY (line 269-278):
 *    Resolution order when user in multiple groups.
 *    
 *    SCENARIO:
 *    User in both "Azure-Admins" and "Azure-Users".
 *    
 *    RULES:
 *    - "Azure-Admins" → admin (priority 10)
 *    - "Azure-Users" → user (priority 100)
 *    
 *    RESOLUTION:
 *    System picks lowest priority number → admin role.
 *    
 *    DEFAULT (line 59, 128):
 *    Priority = 100 (neutral).
 *    
 *    STRATEGY:
 *    - Admin groups: Low priority (10, 20)
 *    - User groups: High priority (100, 200)
 *    - Ensures admin assignment wins
 * 
 * 6. NOTES (line 281-289):
 *    Admin documentation.
 *    Example: "All terminal administrators in Azure AD".
 * 
 * 7. ISACTIVE (line 142):
 *    Default true in form initialization.
 *    Could deactivate outdated mappings.
 * 
 * DIALOG-BASED UI:
 * 
 * ADD/EDIT IN DIALOG (lines 193-314):
 * Not separate page, inline dialog.
 * 
 * BENEFITS:
 * - Stay on list page
 * - Quick add/edit workflow
 * - See other mappings while editing
 * 
 * SHARED FORM:
 * Dialog handles both create and edit.
 * Title changes (line 208-209).
 * Submit button text changes (line 309).
 * 
 * TABLE COLUMNS:
 * 
 * PROVIDER (line 332, 353-355):
 * Provider name resolved via getProviderName (lines 166-169).
 * 
 * GROUP KEY (line 333, 356-358):
 * Monospace font (font-mono).
 * Suggests technical identifier.
 * 
 * MAPPED ROLE (line 335, 362-370):
 * Color-coded badges:
 * - Admin: Purple
 * - User: Blue
 * 
 * PRIORITY (line 336, 371):
 * Numeric display.
 * Lower values more important.
 * 
 * STATUS (line 337, 372-381):
 * Active/Inactive badge.
 * 
 * HARD DELETE (lines 109-120):
 * Permanently removes mapping.
 * Users in this group won't auto-assign role.
 * 
 * WARNING (line 415):
 * "Users in this group will no longer be assigned the mapped role."
 * 
 * VALIDATION (lines 148-153):
 * Requires provider, groupKey, and mappedRole.
 * Prevents incomplete mappings.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Users, Plus, Edit, Trash2, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function GroupRoleMappings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    providerId: '',
    groupKey: '',
    groupDisplayName: '',
    mappedRole: 'user',
    priority: 100,
    isActive: true,
    notes: ''
  });

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['groupRoleMappings'],
    queryFn: () => base44.entities.CompanyGroupRoleMapping.list()
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['identityProviders'],
    queryFn: () => base44.entities.CompanyIdentityProvider.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.CompanyGroupRoleMapping.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupRoleMappings']);
      toast.success('Group mapping created');
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create mapping: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.CompanyGroupRoleMapping.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupRoleMappings']);
      toast.success('Group mapping updated');
      setDialogOpen(false);
      setEditingMapping(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update mapping: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyGroupRoleMapping.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupRoleMappings']);
      toast.success('Group mapping deleted');
      setDeleteDialogOpen(false);
      setMappingToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to delete mapping: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      providerId: '',
      groupKey: '',
      groupDisplayName: '',
      mappedRole: 'user',
      priority: 100,
      isActive: true,
      notes: ''
    });
  };

  const handleEdit = (mapping) => {
    setEditingMapping(mapping);
    setFormData({
      providerId: mapping.providerId || '',
      groupKey: mapping.groupKey || '',
      groupDisplayName: mapping.groupDisplayName || '',
      mappedRole: mapping.mappedRole || 'user',
      priority: mapping.priority || 100,
      isActive: mapping.isActive ?? true,
      notes: mapping.notes || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.providerId || !formData.groupKey || !formData.mappedRole) {
      toast.error('Provider, Group Key, and Role are required');
      return;
    }
    if (editingMapping) {
      updateMutation.mutate({ id: editingMapping.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (mapping) => {
    setMappingToDelete(mapping);
    setDeleteDialogOpen(true);
  };

  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.providerName || 'Unknown Provider';
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
        <Link to={createPageUrl('ConfigurationAppSettings')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Group-Role Mappings</h1>
            <p className="text-gray-600 mt-1">Map IdP groups to application roles</p>
          </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingMapping(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Mapping
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                {editingMapping ? 'Edit Group Mapping' : 'Add Group Mapping'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Identity Provider *</Label>
                <Select 
                  value={formData.providerId}
                  onValueChange={(v) => setFormData({...formData, providerId: v})}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.providerName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Group Key/ID *</Label>
                  <Input
                    required
                    value={formData.groupKey}
                    onChange={(e) => setFormData({...formData, groupKey: e.target.value})}
                    placeholder="e.g., TerminalAdmins"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  <p className="text-xs text-gray-600">Group ID or name from IdP</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Display Name</Label>
                  <Input
                    value={formData.groupDisplayName}
                    onChange={(e) => setFormData({...formData, groupDisplayName: e.target.value})}
                    placeholder="Human-readable name"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Mapped Role *</Label>
                  <Select 
                    value={formData.mappedRole}
                    onValueChange={(v) => setFormData({...formData, mappedRole: v})}
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
                <div className="space-y-2">
                  <Label className="text-gray-700">Priority</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  <p className="text-xs text-gray-600">Lower = higher priority</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingMapping(null);
                    resetForm();
                  }}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  {editingMapping ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Group Mapping</p>
          <p>When users log in via SSO, their groups from the IdP will be mapped to application roles based on these rules.</p>
        </div>
      </div>

      {/* Mappings Table */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Provider</TableHead>
                <TableHead className="text-gray-600">Group Key</TableHead>
                <TableHead className="text-gray-600">Display Name</TableHead>
                <TableHead className="text-gray-600">Mapped Role</TableHead>
                <TableHead className="text-gray-600">Priority</TableHead>
                <TableHead className="text-gray-600">Status</TableHead>
                <TableHead className="text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No group mappings configured</p>
                    <p className="text-sm mt-1">Add your first mapping to get started</p>
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((mapping) => (
                  <TableRow key={mapping.id} className="border-gray-200">
                    <TableCell className="text-gray-900">
                      {getProviderName(mapping.providerId)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-700">
                      {mapping.groupKey}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {mapping.groupDisplayName || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={mapping.mappedRole === 'admin' 
                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/30 border' 
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/30 border'}
                      >
                        {mapping.mappedRole}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">{mapping.priority}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={mapping.isActive 
                          ? 'border-green-300 text-green-700' 
                          : 'border-gray-300 text-gray-500'}
                      >
                        {mapping.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-gray-900"
                          onClick={() => handleEdit(mapping)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(mapping)}
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
            <AlertDialogTitle className="text-gray-900">Delete Group Mapping</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete the mapping for "{mappingToDelete?.groupKey}"? Users in this group will no longer be assigned the mapped role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => mappingToDelete && deleteMutation.mutate(mappingToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}