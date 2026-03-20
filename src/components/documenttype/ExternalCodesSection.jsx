/**
 * External Codes Section Component (Authority Code Mapping)
 * 
 * PURPOSE:
 * Maps internal document types to external authority codes.
 * Enables data exchange with classification societies and regulators.
 * 
 * DOMAIN CONTEXT - AUTHORITY CODE MAPPING:
 * 
 * THE PROBLEM:
 * Different authorities use different codes for same document:
 * 
 * INTERNAL:
 * Document type: "International Load Line Certificate"
 * 
 * EXTERNAL CODES:
 * - DNV: "ILLC-IC"
 * - ABS: "Load Line"
 * - ClassNK: "LL-Cert"
 * - Lloyd's: "ILL"
 * 
 * WITHOUT MAPPING:
 * Manual cross-reference needed.
 * Errors in data exchange.
 * Integration complexity.
 * 
 * WITH MAPPING:
 * System knows DNV's code for this doc type.
 * Automated data import/export.
 * API integrations work seamlessly.
 * 
 * USE CASES:
 * 
 * 1. DATA IMPORT:
 *    DNV sends CSV with "ILLC-IC" column.
 *    System maps to internal document type.
 *    Imports correctly.
 * 
 * 2. API INTEGRATION:
 *    Query DNV API for vessel certificates.
 *    Response uses DNV codes.
 *    Map to internal types for storage.
 * 
 * 3. EXPORT REPORTS:
 *    Generate report for ABS.
 *    Convert internal types to ABS codes.
 *    Report uses ABS terminology.
 * 
 * FIELDS EXPLAINED:
 * 
 * AUTHORITY (line 311-318):
 * Which company/organization uses this code.
 * 
 * FILTERED TO AUTHORITIES (line 67):
 * Only shows companies with type='Authority'.
 * 
 * EXAMPLES:
 * - DNV (Det Norske Veritas)
 * - ABS (American Bureau of Shipping)
 * - ClassNK (Nippon Kaiji Kyokai)
 * - Lloyd's Register
 * 
 * EXTERNAL CODE (line 322-330):
 * The authority's identifier.
 * 
 * EXAMPLES:
 * - "ILLC-IC"
 * - "ISM-DOC"
 * - "SIRE-2.0"
 * 
 * REQUIRED field.
 * Exact match critical for integrations.
 * 
 * CODE TYPE (line 333-346):
 * Classification of the code.
 * 
 * OPTIONS (lines 338-342):
 * - Certificate Code: For certificates
 * - Document Code: For general documents
 * - Regulation Reference: For regulatory codes
 * - Other: Miscellaneous
 * 
 * HELPS ORGANIZE:
 * Many codes per authority.
 * Type indicates usage context.
 * 
 * EXTERNAL NAME (line 349-356):
 * Authority's full name for this document.
 * Optional (code is key identifier).
 * 
 * EXAMPLE:
 * - externalCode: "ILLC-IC"
 * - externalName: "International Load Line Certificate - Initial Certification"
 * 
 * NOTES (line 359-368):
 * Admin documentation.
 * Mapping details, version info, etc.
 * 
 * IS PRIMARY (line 370-376):
 * One mapping per authority should be primary.
 * 
 * USE CASE:
 * Authority has multiple codes for variants.
 * Primary = most common/default variant.
 * 
 * ENFORCEMENT (lines 73-84, 109-121):
 * 
 * When setting isPrimary=true:
 * 1. Finds other primaries for same authority
 * 2. Sets their isPrimary=false
 * 3. Then sets current to true
 * 
 * RESULT:
 * Only one primary per authority.
 * 
 * AUTOMATIC CONSTRAINT:
 * System enforces business rule.
 * Admin doesn't manually deselect old primary.
 * 
 * DISPLAY TABLE (lines 238-296):
 * 
 * Shows all active external codes.
 * 
 * AUTHORITY COLUMN (line 241, 253):
 * Company name resolved via getCompanyName.
 * 
 * EXTERNAL CODE (line 242, 254):
 * Monospace font (technical identifier).
 * 
 * CODE TYPE (line 243, 255-258):
 * Color-coded badge.
 * 
 * CODE TYPE COLORS (lines 210-215):
 * - Certificate: Violet
 * - Document: Blue
 * - Regulation: Cyan
 * - Other: Gray
 * 
 * PRIMARY BADGE (lines 245, 261-266):
 * Green "Primary" badge if flagged.
 * Empty cell otherwise.
 * 
 * STATUS (line 246, 268-271):
 * Always "Active" (filtered to active codes, line 208).
 * 
 * SOFT DELETE (lines 137-148):
 * Sets isActive=false.
 * Code hidden but preserved.
 * Existing mappings still reference it.
 * 
 * COMPONENT INTEGRATION:
 * Used in DocumentTypeDetail page.
 * Prop: documentType object.
 * Shows codes for that specific document type.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Edit, Trash2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import SearchableSelect from '../ui/SearchableSelect';

export default function ExternalCodesSection({ documentType }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState(null);
  const [formData, setFormData] = useState({
    authorityCompanyId: '',
    externalCode: '',
    externalName: '',
    codeType: 'Certificate Code',
    notes: '',
    isPrimary: false,
    isActive: true,
    sortOrder: null
  });

  const { data: externalCodes = [] } = useQuery({
    queryKey: ['documentTypeExternalCodes', documentType.id],
    queryFn: () => base44.entities.DocumentTypeExternalCode.filter({ documentTypeId: documentType.id }),
    enabled: !!documentType.id
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const authorityCompanies = companies.filter(c => c.type === 'Authority' && c.isActive !== false);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const company = companies.find(c => c.id === data.authorityCompanyId);
      
      // If setting as primary, unset other primaries for this authority
      if (data.isPrimary) {
        const existingPrimaries = externalCodes.filter(
          ec => ec.authorityCompanyId === data.authorityCompanyId && 
                ec.isActive !== false && 
                ec.isPrimary
        );
        
        for (const primary of existingPrimaries) {
          await base44.entities.DocumentTypeExternalCode.update(primary.id, { isPrimary: false });
        }
      }
      
      return base44.entities.DocumentTypeExternalCode.create({
        ...data,
        publicId: crypto.randomUUID(),
        tenantId: documentType.tenantId,
        documentTypeId: documentType.id,
        documentTypePublicId: documentType.publicId,
        authorityCompanyPublicId: company?.publicId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documentTypeExternalCodes', documentType.id]);
      setShowDialog(false);
      setEditingCode(null);
      resetForm();
      toast.success('External code added');
    },
    onError: (error) => {
      toast.error('Failed to add code: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // If setting as primary, unset other primaries for this authority
      if (data.isPrimary) {
        const existingPrimaries = externalCodes.filter(
          ec => ec.id !== id && 
                ec.authorityCompanyId === data.authorityCompanyId && 
                ec.isActive !== false && 
                ec.isPrimary
        );
        
        for (const primary of existingPrimaries) {
          await base44.entities.DocumentTypeExternalCode.update(primary.id, { isPrimary: false });
        }
      }
      
      return base44.entities.DocumentTypeExternalCode.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documentTypeExternalCodes', documentType.id]);
      setShowDialog(false);
      setEditingCode(null);
      resetForm();
      toast.success('External code updated');
    },
    onError: (error) => {
      toast.error('Failed to update code: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentTypeExternalCode.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentTypeExternalCodes', documentType.id]);
      setDeleteDialogOpen(false);
      setCodeToDelete(null);
      toast.success('External code deactivated');
    },
    onError: (error) => {
      toast.error('Failed to deactivate code: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      authorityCompanyId: '',
      externalCode: '',
      externalName: '',
      codeType: 'Certificate Code',
      notes: '',
      isPrimary: false,
      isActive: true,
      sortOrder: null
    });
  };

  const handleAdd = () => {
    setEditingCode(null);
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      authorityCompanyId: code.authorityCompanyId,
      externalCode: code.externalCode,
      externalName: code.externalName || '',
      codeType: code.codeType || 'Certificate Code',
      notes: code.notes || '',
      isPrimary: code.isPrimary || false,
      isActive: code.isActive !== false,
      sortOrder: code.sortOrder || null
    });
    setShowDialog(true);
  };

  const handleDelete = (code) => {
    setCodeToDelete(code);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.authorityCompanyId || !formData.externalCode) {
      toast.error('Authority and external code are required');
      return;
    }

    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || '-';
  };

  const activeCodes = externalCodes.filter(c => c.isActive !== false);

  const codeTypeColors = {
    'Certificate Code': 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    'Document Code': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Regulation Reference': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    'Other': 'bg-gray-500/10 text-gray-400 border-gray-500/30'
  };

  return (
    <>
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            External Codes
          </CardTitle>
          <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Add External Code
          </Button>
        </CardHeader>
        <CardContent>
          {activeCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No external codes defined</p>
              <p className="text-sm mt-1">Add mappings to authority codes (DNV, ABS, etc.)</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Authority</TableHead>
                  <TableHead className="text-gray-600">External Code</TableHead>
                  <TableHead className="text-gray-600">Code Type</TableHead>
                  <TableHead className="text-gray-600">External Name</TableHead>
                  <TableHead className="text-gray-600">Primary</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCodes.map((code) => (
                  <TableRow key={code.id} className="border-gray-200">
                    <TableCell className="font-medium text-gray-900">{getCompanyName(code.authorityCompanyId)}</TableCell>
                    <TableCell className="text-gray-900 font-mono text-sm">{code.externalCode}</TableCell>
                    <TableCell>
                      <Badge className={`${codeTypeColors[code.codeType]} border text-xs`}>
                        {code.codeType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">{code.externalName || '-'}</TableCell>
                    <TableCell>
                      {code.isPrimary && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border text-xs">
                          Primary
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border text-xs">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(code)}
                          className="text-gray-400 hover:text-gray-900 h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(code)}
                          className="text-red-500 hover:text-red-700 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingCode ? 'Edit External Code' : 'Add External Code'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Authority (Company) *</Label>
              <SearchableSelect
                value={formData.authorityCompanyId}
                onValueChange={(value) => setFormData({ ...formData, authorityCompanyId: value })}
                options={authorityCompanies.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select authority company"
                searchPlaceholder="Search companies..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">External Code *</Label>
                <Input
                  value={formData.externalCode}
                  onChange={(e) => setFormData({ ...formData, externalCode: e.target.value })}
                  className="bg-white border-gray-300"
                  placeholder="e.g., ILLC-IC"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Code Type *</Label>
                <SearchableSelect
                  value={formData.codeType}
                  onValueChange={(value) => setFormData({ ...formData, codeType: value })}
                  options={[
                    { value: 'Certificate Code', label: 'Certificate Code' },
                    { value: 'Document Code', label: 'Document Code' },
                    { value: 'Regulation Reference', label: 'Regulation Reference' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  placeholder="Select code type"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">External Name</Label>
              <Input
                value={formData.externalName}
                onChange={(e) => setFormData({ ...formData, externalName: e.target.value })}
                className="bg-white border-gray-300"
                placeholder="Name used by the authority (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white border-gray-300"
                placeholder="Additional notes about this mapping"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isPrimary}
                onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
              />
              <Label className="text-gray-700">Primary mapping for this authority</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingCode(null);
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
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingCode
                  ? 'Update Code'
                  : 'Add Code'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Deactivate External Code</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to deactivate the external code "{codeToDelete?.externalCode}" for {getCompanyName(codeToDelete?.authorityCompanyId)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(codeToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}