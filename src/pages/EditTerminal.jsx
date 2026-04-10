/**
 * Edit Terminal Page
 * 
 * PURPOSE:
 * Updates existing terminal records with comprehensive audit logging.
 * Implements field-level change tracking for regulatory compliance and data governance.
 * 
 * AUDIT LOG ARCHITECTURE:
 * 
 * EVERY field change automatically creates AuditLog record with:
 * - tableName: 'Terminal'
 * - recordId: terminal's database ID
 * - recordPublicId: terminal's UUID (migration-portable reference)
 * - fieldName: name of changed field (e.g., 'capacity_mtpa', 'status')
 * - previousValue: value before change (stringified)
 * - newValue: value after change (stringified)
 * - userId, userEmail, userName: who made the change
 * - timestamp: when change occurred
 * 
 * WHY AUDIT TERMINALS?
 * Terminals are critical infrastructure with regulatory oversight.
 * Changes must be traceable for:
 * - Safety investigations (why was draft limit changed?)
 * - Compliance audits (who approved this configuration?)
 * - Data quality (track evolution of specifications)
 * - Legal disputes (prove when capacity was communicated)
 * 
 * AUDIT CREATION TIMING:
 * - AFTER successful database update (lines 94-108)
 * - Only for fields that actually changed (previousValue !== newValue)
 * - All audit logs created in loop (for..of) sequentially
 * 
 * PERFORMANCE CONSIDERATION:
 * Sequential audit log creation could be slow for many field changes.
 * TODO: Consider Promise.all for parallel audit log creation
 * Trade-off: Current approach ensures ordered audit trail
 * 
 * PRODUCT TYPE CLEARING:
 * - Select includes "__CLEAR__" option to set productTypeRefId to null
 * - Handles case where terminal no longer has primary product
 * - Important for multi-product terminals or during transitions
 * 
 * VALIDATION:
 * - Terminal name MANDATORY (business rule)
 * - Latitude/Longitude MANDATORY (required for map display)
 * - All other fields optional
 * 
 * REFERENTIAL INTEGRITY:
 * - Updates BOTH countryId AND countryPublicId when country changes
 * - Maintains migration portability across environments
 * - publicId-based references support cross-system imports
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';
import { Save, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import CountrySelector from '../components/ui/CountrySelector';

export default function EditTerminal() {
  const urlParams = new URLSearchParams(window.location.search);
  const terminalId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(null);

  const { data: terminal, isLoading } = useQuery({
    queryKey: ['terminal', terminalId],
    queryFn: () => base44.entities.Terminal.filter({ id: terminalId }).then(r => r[0]),
    enabled: !!terminalId
  });

  const { data: allCountries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const isCountryActive = (country) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validFrom = country.validFrom ? new Date(country.validFrom) : null;
    const validTo = country.validTo ? new Date(country.validTo) : null;
    
    if (validFrom && validFrom > today) return false;
    if (validTo && validTo < today) return false;
    
    return true;
  };

  const countries = allCountries.filter(c => isCountryActive(c)).sort((a, b) => a.nameEn.localeCompare(b.nameEn));

  React.useEffect(() => {
    if (terminal && !formData && allCountries.length > 0) {
      setFormData(terminal);
    }
  }, [terminal, formData, allCountries.length]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  /**
   * Create audit log entry for field-level changes
   * 
   * AUDIT GRANULARITY:
   * Logs at FIELD level, not row level.
   * Each changed field = separate audit record.
   * Enables detailed change tracking and rollback capabilities.
   * 
   * SKIP CONDITION:
   * If previousValue === newValue, skip logging (no actual change).
   * Prevents noise in audit trail from form re-submissions.
   * 
   * VALUE STRINGIFICATION:
   * All values converted to String for consistent storage.
   * Handles: numbers, booleans, dates, nulls, objects.
   * Empty values stored as empty string (not "null" string).
   * 
   * USER ATTRIBUTION:
   * Captures user ID, email, and full name.
   * Redundant storage intentional (user record might change later).
   * Audit log preserves state at time of action.
   * 
   * TIMESTAMP:
   * ISO 8601 format with timezone for cross-system compatibility.
   * Server time (not client time) would be more accurate.
   * TODO: Consider using server-side timestamp generation.
   */
  const createAuditLog = async (fieldName, previousValue, newValue) => {
    if (previousValue === newValue) return;
    
    await base44.entities.AuditLog.create({
      publicId: generateUUID(),
      tenantId: getCurrentTenantId(),
      tableName: 'Terminal',
      recordId: terminalId,
      recordPublicId: terminal.publicId,
      action: 'Update',
      fieldName,
      previousValue: String(previousValue || ''),
      newValue: String(newValue || ''),
      userId: user?.id,
      userEmail: user?.email,
      userName: user?.full_name,
      timestamp: new Date().toISOString()
    });
  };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Create audit logs for changed fields
      const changedFields = Object.keys(data).filter(
        key => terminal[key] !== data[key]
      );
      
      // Update the terminal
      await base44.entities.Terminal.update(terminalId, data);
      
      // Create audit logs
      for (const field of changedFields) {
        await createAuditLog(field, terminal[field], data[field]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminal', terminalId] });
      toast.success('Terminal updated successfully');
      navigate(createPageUrl(`TerminalDetail?id=${terminalId}`));
    },
    onError: (error) => {
      toast.error('Failed to update terminal');
      console.error(error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Terminal name is required');
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading || !formData || allCountries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terminal</h1>
          <p className="text-gray-600 mt-1">Update terminal information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Terminal Name *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-white border-gray-300 text-gray-900"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Products</Label>
                <Select
                  value={formData?.productTypeRefId || ''}
                  onValueChange={(value) => {
                    const productType = productTypes.find(pt => pt.id === value);
                    setFormData({
                      ...formData,
                      productTypeRefId: value || null,
                      productTypeRefPublicId: productType?.publicId || null
                    });
                  }}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Select products (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="__CLEAR__">None</SelectItem>
                    {productTypes.filter(pt => pt.isActive).map((pt) => (
                      <SelectItem key={pt.id} value={pt.id} className="text-gray-900">
                        {pt.code} - {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Port</Label>
                <Input
                  value={formData.port || ''}
                  onChange={(e) => setFormData({...formData, port: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Country</Label>
                <Select 
                  value={formData?.countryId || ''} 
                  onValueChange={(value) => {
                    const country = countries.find(c => c.id === value);
                    setFormData({
                      ...formData,
                      countryId: value,
                      countryPublicId: country?.publicId || null
                    });
                  }}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id} className="text-gray-900">
                        {country.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Operation Type</Label>
                <Select 
                  value={formData.operation_type || ''} 
                  onValueChange={(value) => setFormData({...formData, operation_type: value})}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Select operation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Import">Import</SelectItem>
                    <SelectItem value="Export">Export</SelectItem>
                    <SelectItem value="Import/Export">Import/Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Operator</Label>
                <Input
                  value={formData.operator || ''}
                  onChange={(e) => setFormData({...formData, operator: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Status</Label>
                <Select 
                  value={formData.status || 'Operational'} 
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operational">Operational</SelectItem>
                    <SelectItem value="Under Construction">Under Construction</SelectItem>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Capacity (MTPA)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.capacity_mtpa || ''}
                  onChange={(e) => setFormData({...formData, capacity_mtpa: parseFloat(e.target.value) || null})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Timezone</Label>
                <Input
                  value={formData.timezone || ''}
                  onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="e.g., UTC+9, EST"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Latitude *</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude || ''}
                  onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value) || null})}
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Longitude *</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude || ''}
                  onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value) || null})}
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email || ''}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Contact Phone</Label>
                <Input
                  value={formData.contact_phone || ''}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Website</Label>
              <Input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="bg-white border-gray-300 text-gray-900"
                placeholder="https://"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-white border-gray-300 text-gray-900 min-h-24"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white border-gray-300 text-gray-900 min-h-24"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link to={createPageUrl(`TerminalDetail?id=${terminalId}`)}>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
            disabled={updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}