/**
 * Vessel Company Roles Tab Component
 * 
 * PURPOSE:
 * Manages complex vessel-company relationships with temporal validity.
 * Vessels have multiple companies serving different roles, changing over time.
 * 
 * DOMAIN CONTEXT - SHIP MANAGEMENT STRUCTURE:
 * 
 * ROLE TYPES (lines 30-46):
 * 
 * 1. REGISTERED OWNER:
 *    - Legal entity on vessel's registration certificate
 *    - Appears in official shipping databases
 *    - Often different from beneficial owner (for financing/tax)
 * 
 * 2. BENEFICIAL OWNER:
 *    - Actual economic owner (receives profits)
 *    - May be private equity, shipping fund, etc.
 *    - Often confidential in shipping industry
 * 
 * 3. TECHNICAL MANAGER:
 *    - Responsible for vessel maintenance, crew, operations
 *    - Often specialized ship management company
 *    - Example: V.Ships, Anglo-Eastern, Wilhelmsen
 * 
 * 4. COMMERCIAL MANAGER:
 *    - Markets the vessel, secures charters
 *    - Negotiates cargo contracts
 *    - May be owner or third-party broker
 * 
 * 5. ISM/DOC HOLDER:
 *    - ISM = International Safety Management Code
 *    - DOC = Document of Compliance
 *    - Company holding safety management responsibility
 *    - SOLAS requirement for passenger/cargo vessels
 * 
 * 6. OPERATOR:
 *    - Day-to-day operational control
 *    - May overlap with technical/commercial manager
 *    - Defined by charter party type
 * 
 * WHY SEPARATE FROM VESSEL.OWNER/OPERATOR FIELDS?
 * 
 * Vessel entity has simple owner/operator/class fields (lines in EditVessel).
 * VesselCompanyRole entity provides:
 * - Multiple companies per role type
 * - Temporal validity (companies change over time)
 * - Historical tracking (who owned vessel in 2020?)
 * - Primary designation (current vs historical)
 * 
 * TEMPORAL VALIDITY (lines 261-279):
 * 
 * validFrom / validTo date range:
 * - validFrom: When company assumed role
 * - validTo: When company relinquished role (null = ongoing)
 * 
 * USE CASE:
 * Vessel sold in 2023:
 * - Owner 1: validFrom=2018, validTo=2023-06-15
 * - Owner 2: validFrom=2023-06-15, validTo=null (current)
 * 
 * ENABLES:
 * - Historical ownership queries
 * - Change tracking for compliance
 * - Overlap detection (shouldn't have 2 primary owners simultaneously)
 * 
 * isPrimary FLAG (line 60, 184-188):
 * 
 * Distinguishes current from historical roles.
 * 
 * BUSINESS RULE:
 * Only ONE isPrimary=true per role type should exist.
 * Example: Can't have 2 primary TechnicalManagers.
 * 
 * TODO - VALIDATION:
 * System doesn't enforce single-primary rule currently.
 * User responsible for deactivating old primary when adding new.
 * Future enhancement: Auto-deactivate old primary when new one added.
 * 
 * SOFT DELETE PATTERN (lines 101-109):
 * 
 * Deactivation (isActive=false) instead of hard delete.
 * Preserves historical role assignments.
 * 
 * ALTERNATIVE APPROACH:
 * Could set validTo to today instead of isActive flag.
 * Current approach keeps both: validTo AND isActive.
 * isActive = "deleted" flag (not shown in UI).
 * validTo = actual role end date (meaningful business data).
 * 
 * ACTIVE FILTERING (line 154):
 * UI shows only active roles.
 * Historical (isActive=false) roles hidden.
 * Keeps interface clean while preserving data.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { toast } from 'sonner';

const ROLE_OPTIONS = [
  'RegisteredOwner',
  'BeneficialOwner',
  'TechnicalManager',
  'CommercialManager',
  'ISMDocHolder',
  'Operator'
];

const ROLE_LABELS = {
  'RegisteredOwner': 'Registered Owner',
  'BeneficialOwner': 'Beneficial Owner',
  'TechnicalManager': 'Technical Manager',
  'CommercialManager': 'Commercial Manager',
  'ISMDocHolder': 'ISM/DOC Holder',
  'Operator': 'Operator'
};

export default function VesselCompanyRolesTab({ vesselId, tenantId }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);
  
  const [formData, setFormData] = useState({
    companyId: '',
    role: '',
    validFrom: '',
    validTo: '',
    notes: '',
    isPrimary: true
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['vesselCompanyRoles', vesselId],
    queryFn: () => base44.entities.VesselCompanyRole.filter({ vesselId })
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VesselCompanyRole.create({
      ...data,
      vesselId,
      tenantId,
      publicId: crypto.randomUUID()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselCompanyRoles', vesselId]);
      setShowDialog(false);
      resetForm();
      toast.success('Role added successfully');
    },
    onError: (error) => toast.error('Failed to add role: ' + error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VesselCompanyRole.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselCompanyRoles', vesselId]);
      setShowDialog(false);
      setEditingRole(null);
      resetForm();
      toast.success('Role updated successfully');
    },
    onError: (error) => toast.error('Failed to update role: ' + error.message)
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => base44.entities.VesselCompanyRole.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselCompanyRoles', vesselId]);
      setDeletingRole(null);
      toast.success('Role deactivated successfully');
    },
    onError: (error) => toast.error('Failed to deactivate role: ' + error.message)
  });

  const resetForm = () => {
    setFormData({
      companyId: '',
      role: '',
      validFrom: '',
      validTo: '',
      notes: '',
      isPrimary: true
    });
  };

  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        companyId: role.companyId,
        role: role.role,
        validFrom: role.validFrom || '',
        validTo: role.validTo || '',
        notes: role.notes || '',
        isPrimary: role.isPrimary
      });
    } else {
      resetForm();
      setEditingRole(null);
    }
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.companyId || !formData.role) {
      toast.error('Please select company and role');
      return;
    }

    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const activeRoles = roles.filter(r => r.isActive);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-cyan-500 to-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Company Role
        </Button>
      </div>

      {activeRoles.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Company Roles</h3>
            <p className="text-gray-600">Add company roles to define vessel management structure</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activeRoles.map((role) => {
            const company = companies.find(c => c.id === role.companyId);
            return (
              <Card key={role.id} className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{ROLE_LABELS[role.role]}</h4>
                        {role.isPrimary && (
                          <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{company?.name || 'Unknown Company'}</p>
                      {(role.validFrom || role.validTo) && (
                        <div className="text-xs text-gray-500 space-y-1">
                          {role.validFrom && <p>From: {role.validFrom}</p>}
                          {role.validTo && <p>To: {role.validTo}</p>}
                        </div>
                      )}
                      {role.notes && (
                        <p className="text-xs text-gray-600 mt-2">{role.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(role)}
                        className="h-8 w-8"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingRole(role)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingRole ? 'Edit Company Role' : 'Add Company Role'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Company *</Label>
              <SearchableSelect
                value={formData.companyId}
                onValueChange={(value) => setFormData({...formData, companyId: value})}
                options={companies.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select company"
                searchPlaceholder="Search companies..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(role => (
                    <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Valid From</Label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Valid To (optional)</Label>
                <Input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({...formData, validTo: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes"
                className="bg-white border-gray-300"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="border-gray-300">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingRole ? 'Update Role' : 'Add Role'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deletingRole} onOpenChange={() => setDeletingRole(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Deactivate Role</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to deactivate this company role? This action can be reversed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateMutation.mutate(deletingRole.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}