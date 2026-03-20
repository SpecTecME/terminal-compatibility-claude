/**
 * Edit/Add Document Type Page (Unified Form)
 * 
 * PURPOSE:
 * Unified form for creating new document types or editing existing ones.
 * Central configuration for document classification, validity rules, and authority constraints.
 * 
 * UNIFIED PATTERN (line 26-31):
 * Single component handles both create and edit modes:
 * - URL param 'id' present → Edit mode (load existing)
 * - URL param 'id' absent → Create mode (empty form)
 * 
 * RATIONALE:
 * - Identical form fields for both operations
 * - Reduces code duplication
 * - Consistent UX between create/edit
 * 
 * VALIDITY TYPE INFLUENCE ON UI:
 * 
 * Different validity types affect which fields are relevant:
 * 
 * 1. PermanentStatic:
 *    - No expiry date fields needed
 *    - No reminder system
 *    - Example: Construction certificate (never expires)
 * 
 * 2. RenewableCertified:
 *    - defaultValidityDuration critical (e.g., 5 years)
 *    - reminderLeadTime important (e.g., 30 days before expiry)
 *    - Example: Class certificate (5-year cycle)
 * 
 * 3. VettingTimeSensitive:
 *    - Short validity (6-12 months typical)
 *    - Aggressive reminders (60-90 days)
 *    - Example: SIRE inspection report
 * 
 * 4. TerminalEventDriven:
 *    - Validity tied to events not dates
 *    - Duration fields less relevant
 *    - Example: Terminal registration approval (valid until withdrawn)
 * 
 * TODO: Consider hiding irrelevant fields based on validity type selection.
 * Current approach: Show all fields, user ignores what doesn't apply.
 * 
 * ALLOWED ISSUERS SYSTEM (lines 134-140, 142-150, 349-365):
 * 
 * MULTI-SELECT CHECKBOX PATTERN:
 * allowedIssuers array stores which authority types can issue this document.
 * 
 * BUSINESS RULES:
 * - Class certificates: Only "Class Society" allowed
 * - Flag state certs: Only "Flag State" allowed
 * - Vetting reports: "OCIMF" OR "Terminal" allowed
 * - Internal forms: "Owner or Operator" allowed
 * 
 * VALIDATION USE:
 * When user uploads document, system checks:
 * - Is selected issuing authority in allowedIssuers list?
 * - If not, show warning (data quality issue)
 * 
 * PREVENTS:
 * - Port authority issuing class certificate (invalid)
 * - Shipyard issuing statutory certificate (invalid)
 * 
 * DEFAULT AUTHORITY (lines 330-347):
 * Pre-selects issuing authority in document upload form.
 * Saves user time for common cases.
 * User can override if needed.
 * 
 * CATEGORY VALIDATION (lines 126-129):
 * Active document types MUST have category.
 * Inactive types can be orphaned (preparing for deletion).
 * 
 * RATIONALE:
 * Categories provide hierarchical organization.
 * Active documents without category = bad UX (can't browse by category).
 * 
 * EXTERNAL CODES SECTION (lines 421-423):
 * 
 * Only shown in EDIT mode (not create).
 * Manages DocumentTypeExternalCode mappings.
 * Separate component (ExternalCodesSection) handles complex UI.
 * 
 * WORKFLOW:
 * 1. Create document type (basic info)
 2. Save and navigate to edit mode
 * 3. Add external code mappings from various authorities
 * 
 * Can't add external codes during create because document type ID needed.
 * 
 * SORT ORDER (lines 375-383):
 * Lower numbers appear first in lists.
 * Null/empty treated as 999 (bottom).
 * 
 * COMMON PATTERN:
 * - Critical documents: sortOrder 1-20
 * - Standard documents: sortOrder 50-100
 * - Rare documents: sortOrder 200+
 * - Unlisted: null (bottom)
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';
import { ArrowLeft, Save } from 'lucide-react';
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
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ExternalCodesSection from '../components/documenttype/ExternalCodesSection';

export default function EditDocumentType() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const docTypeId = urlParams.get('id');
  const isEdit = !!docTypeId;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    categoryId: '',
    appliesTo: 'Vessel',
    documentValidityType: 'RenewableCertified',
    isExpiryRequired: false,
    defaultValidityDuration: null,
    validityUnit: 'Months',
    reminderLeadTime: 30,
    reminderUnit: 'Days',
    issuingAuthorityDefault: '',
    allowedIssuers: [],
    isActive: true,
    sortOrder: null,
    description: '',
    notes: ''
  });

  const [selectedIssuers, setSelectedIssuers] = useState([]);

  const { data: existingDocType } = useQuery({
    queryKey: ['documentType', docTypeId],
    queryFn: () => base44.entities.DocumentType.filter({ id: docTypeId }).then(r => r[0]),
    enabled: isEdit
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: () => base44.entities.DocumentCategory.list()
  });

  useEffect(() => {
    if (existingDocType) {
      setFormData({
        name: existingDocType.name || '',
        code: existingDocType.code || '',
        categoryId: existingDocType.categoryId || '',
        appliesTo: existingDocType.appliesTo || 'Vessel',
        documentValidityType: existingDocType.documentValidityType || 'RenewableCertified',
        isExpiryRequired: existingDocType.isExpiryRequired ?? false,
        defaultValidityDuration: existingDocType.defaultValidityDuration || null,
        validityUnit: existingDocType.validityUnit || 'Months',
        reminderLeadTime: existingDocType.reminderLeadTime || 30,
        reminderUnit: existingDocType.reminderUnit || 'Days',
        issuingAuthorityDefault: existingDocType.issuingAuthorityDefault || '',
        allowedIssuers: existingDocType.allowedIssuers || [],
        isActive: existingDocType.isActive ?? true,
        sortOrder: existingDocType.sortOrder || null,
        description: existingDocType.description || '',
        notes: existingDocType.notes || ''
      });
      setSelectedIssuers(existingDocType.allowedIssuers || []);
    }
  }, [existingDocType]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const category = categories.find(c => c.id === data.categoryId);
      const payload = {
        ...data,
        categoryPublicId: category?.publicId,
        allowedIssuers: selectedIssuers
      };

      if (isEdit) {
        return await base44.entities.DocumentType.update(docTypeId, payload);
      } else {
        return await base44.entities.DocumentType.create({
          ...payload,
          publicId: generateUUID(),
          tenantId: getCurrentTenantId()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      toast.success(isEdit ? 'Document type updated' : 'Document type created');
      navigate(createPageUrl('DocumentTypes'));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save document type');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (formData.isActive && !formData.categoryId) {
      toast.error('Category is required for active document types');
      return;
    }

    saveMutation.mutate(formData);
  };

  const toggleIssuer = (issuer) => {
    setSelectedIssuers(prev => 
      prev.includes(issuer) 
        ? prev.filter(i => i !== issuer)
        : [...prev, issuer]
    );
  };

  const issuerOptions = [
    'Flag State',
    'Class Society',
    'OCIMF',
    'Terminal',
    'Owner or Operator',
    'Manufacturer or Shipyard',
    'Engineering Consultant'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('DocumentTypes')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Document Type' : 'Add Document Type'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update document type details' : 'Create a new document type'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Name *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-white border-gray-300"
                  placeholder="e.g., Certificate of Registry"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="bg-white border-gray-300"
                  placeholder="e.g., COR"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Category *</Label>
                <Select 
                  value={formData.categoryId}
                  onValueChange={(v) => setFormData({...formData, categoryId: v})}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {categories.filter(c => c.isActive).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-gray-900">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Applies To</Label>
                <Select 
                  value={formData.appliesTo}
                  onValueChange={(v) => setFormData({...formData, appliesTo: v})}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="Vessel" className="text-gray-900">Vessel</SelectItem>
                    <SelectItem value="Terminal" className="text-gray-900">Terminal</SelectItem>
                    <SelectItem value="Berth" className="text-gray-900">Berth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Document Validity Type</Label>
              <Select 
                value={formData.documentValidityType}
                onValueChange={(v) => setFormData({...formData, documentValidityType: v})}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="PermanentStatic" className="text-gray-900">Permanent Static</SelectItem>
                  <SelectItem value="TerminalEventDriven" className="text-gray-900">Terminal Event Driven</SelectItem>
                  <SelectItem value="RenewableCertified" className="text-gray-900">Renewable Certified</SelectItem>
                  <SelectItem value="VettingTimeSensitive" className="text-gray-900">Vetting Time Sensitive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Validity & Reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isExpiryRequired}
                onCheckedChange={(checked) => setFormData({...formData, isExpiryRequired: checked})}
              />
              <Label className="text-gray-700">Expiry Date Required</Label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Default Validity Duration</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={formData.defaultValidityDuration || ''}
                    onChange={(e) => setFormData({...formData, defaultValidityDuration: e.target.value ? parseInt(e.target.value) : null})}
                    className="bg-white border-gray-300"
                    placeholder="12"
                  />
                  <Select 
                    value={formData.validityUnit}
                    onValueChange={(v) => setFormData({...formData, validityUnit: v})}
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="Days" className="text-gray-900">Days</SelectItem>
                      <SelectItem value="Months" className="text-gray-900">Months</SelectItem>
                      <SelectItem value="Years" className="text-gray-900">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Reminder Lead Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={formData.reminderLeadTime || ''}
                    onChange={(e) => setFormData({...formData, reminderLeadTime: e.target.value ? parseInt(e.target.value) : null})}
                    className="bg-white border-gray-300"
                    placeholder="30"
                  />
                  <Select 
                    value={formData.reminderUnit}
                    onValueChange={(v) => setFormData({...formData, reminderUnit: v})}
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="Days" className="text-gray-900">Days</SelectItem>
                      <SelectItem value="Months" className="text-gray-900">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Issuing Authority</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Default Authority</Label>
              <Select 
                value={formData.issuingAuthorityDefault}
                onValueChange={(v) => setFormData({...formData, issuingAuthorityDefault: v})}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select default authority" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {issuerOptions.map((issuer) => (
                    <SelectItem key={issuer} value={issuer} className="text-gray-900">
                      {issuer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Allowed Issuers</Label>
              <div className="grid grid-cols-2 gap-2">
                {issuerOptions.map((issuer) => (
                  <div key={issuer} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIssuers.includes(issuer)}
                      onChange={() => toggleIssuer(issuer)}
                      className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">{issuer}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder || ''}
                  onChange={(e) => setFormData({...formData, sortOrder: e.target.value ? parseInt(e.target.value) : null})}
                  className="bg-white border-gray-300"
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <span className="text-sm text-gray-700">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-white border-gray-300 min-h-[100px]"
                placeholder="Document type description..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white border-gray-300 min-h-[100px]"
                placeholder="Additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        {isEdit && existingDocType && (
          <ExternalCodesSection documentType={existingDocType} />
        )}

        <div className="flex justify-end gap-3">
          <Link to={createPageUrl('DocumentTypes')}>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}