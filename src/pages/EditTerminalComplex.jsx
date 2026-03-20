/**
 * Edit Terminal Complex Page
 * 
 * PURPOSE:
 * Updates terminal complex information with field-level audit logging.
 * Demonstrates comprehensive audit trail pattern for master data changes.
 * 
 * FIELD-LEVEL AUDIT LOGGING (lines 64-106):
 * 
 * CRITICAL ARCHITECTURE DECISION:
 * Terminal Complexes use FIELD-LEVEL audit logs, not entity-level.
 * 
 * PROCESS:
 * 1. Compute changed fields (lines 74-85):
 *    - Compare each field: oldValue vs newValue
 *    - Build array of changes: {field, oldValue, newValue}
 *    - Only fields that actually changed
 * 
 * 2. Update entity (line 87)
 * 
 * 3. Create AuditLog entries (lines 89-103):
 *    - ONE record per changed field
 *    - Each with specific fieldName, oldValue, newValue
 *    - Timestamp and action='UPDATE'
 *    - Parallel creation via Promise.all
 * 
 * EXAMPLE:
 * User changes complex name + city:
 * - AuditLog entry 1: fieldName='name', oldValue='Old Name', newValue='New Name'
 * - AuditLog entry 2: fieldName='city', oldValue='Old City', newValue='New City'
 * 
 * BENEFITS:
 * - Granular change tracking
 * - Can answer: "When did city change?"
 * - Can reconstruct field history timeline
 * - Regulatory compliance (prove what changed when)
 * 
 * CONTRAST WITH ENTITY-LEVEL:
 * Entity-level would store entire before/after snapshots.
 * Field-level provides finer granularity for audit queries.
 * 
 * COST:
 * More database records (one per field change vs one per update).
 * Worth it for master data governance.
 * 
 * PATTERN INCONSISTENCY:
 * Most other edit pages don't have this level of auditing.
 * Terminal Complex chosen as pilot for this pattern.
 * TODO: Consider extending to Terminal, Berth, Document Type edits.
 * 
 * NULL HANDLING (line 99-100):
 * Converts null values to string "null" for storage.
 * AuditLog.oldValue/newValue are text fields.
 * 
 * FORM STRUCTURE:
 * Identical to AddTerminalComplex.
 * Same fields, same validation.
 * Only difference: pre-populated from existing data.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SearchableSelect from '../components/ui/SearchableSelect';
import { toast } from 'sonner';

export default function EditTerminalComplex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const complexId = urlParams.get('id');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    countryId: '',
    region: '',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    operatorAuthority: '',
    notes: '',
    isActive: true
  });

  const { data: complex, isLoading } = useQuery({
    queryKey: ['terminalComplex', complexId],
    queryFn: () => base44.entities.TerminalComplex.filter({ id: complexId }).then(r => r[0]),
    enabled: !!complexId
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  useEffect(() => {
    if (complex) {
      setFormData({
        name: complex.name || '',
        code: complex.code || '',
        countryId: complex.countryId || '',
        region: complex.region || '',
        city: complex.city || '',
        address: complex.address || '',
        latitude: complex.latitude?.toString() || '',
        longitude: complex.longitude?.toString() || '',
        operatorAuthority: complex.operatorAuthority || '',
        notes: complex.notes || '',
        isActive: complex.isActive !== false
      });
    }
  }, [complex]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const country = countries.find(c => c.id === data.countryId);
      const updates = {
        ...data,
        countryPublicId: country?.publicId || complex.countryPublicId,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null
      };

      const changedFields = [];
      if (complex.name !== updates.name) changedFields.push({ field: 'name', oldValue: complex.name, newValue: updates.name });
      if (complex.code !== updates.code) changedFields.push({ field: 'code', oldValue: complex.code, newValue: updates.code });
      if (complex.countryId !== updates.countryId) changedFields.push({ field: 'countryId', oldValue: complex.countryId, newValue: updates.countryId });
      if (complex.region !== updates.region) changedFields.push({ field: 'region', oldValue: complex.region, newValue: updates.region });
      if (complex.city !== updates.city) changedFields.push({ field: 'city', oldValue: complex.city, newValue: updates.city });
      if (complex.address !== updates.address) changedFields.push({ field: 'address', oldValue: complex.address, newValue: updates.address });
      if (complex.latitude !== updates.latitude) changedFields.push({ field: 'latitude', oldValue: complex.latitude, newValue: updates.latitude });
      if (complex.longitude !== updates.longitude) changedFields.push({ field: 'longitude', oldValue: complex.longitude, newValue: updates.longitude });
      if (complex.operatorAuthority !== updates.operatorAuthority) changedFields.push({ field: 'operatorAuthority', oldValue: complex.operatorAuthority, newValue: updates.operatorAuthority });
      if (complex.notes !== updates.notes) changedFields.push({ field: 'notes', oldValue: complex.notes, newValue: updates.notes });
      if (complex.isActive !== updates.isActive) changedFields.push({ field: 'isActive', oldValue: complex.isActive, newValue: updates.isActive });

      const result = await base44.entities.TerminalComplex.update(complexId, updates);

      if (changedFields.length > 0) {
        await Promise.all(changedFields.map(change =>
          base44.entities.AuditLog.create({
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            entityType: 'TerminalComplex',
            entityId: complexId,
            entityPublicId: complex.publicId,
            action: 'UPDATE',
            fieldName: change.field,
            oldValue: change.oldValue?.toString() || null,
            newValue: change.newValue?.toString() || null,
            timestamp: new Date().toISOString()
          })
        ));
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminalComplexes'] });
      queryClient.invalidateQueries({ queryKey: ['terminalComplex', complexId] });
      toast.success('Terminal complex updated successfully');
      navigate(createPageUrl(`TerminalComplexDetail?id=${complexId}`));
    },
    onError: (error) => {
      toast.error('Failed to update terminal complex: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Terminal complex name is required');
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading || !complex) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl(`TerminalComplexDetail?id=${complexId}`)}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Terminal Complex</h1>
          <p className="text-gray-600 mt-1">{complex.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Terminal Complex Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Terminal Complex Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-white border-gray-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Complex Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Country</Label>
                <SearchableSelect
                  options={countries.map(c => ({ value: c.id, label: c.nameEn }))}
                  value={formData.countryId}
                  onChange={(value) => setFormData({...formData, countryId: value})}
                  placeholder="Select country"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Region/State</Label>
                <Input
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Port Authority / Operator</Label>
              <Input
                value={formData.operatorAuthority}
                onChange={(e) => setFormData({...formData, operatorAuthority: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white border-gray-300 min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link to={createPageUrl(`TerminalComplexDetail?id=${complexId}`)}>
            <Button type="button" variant="outline" className="border-gray-300">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}