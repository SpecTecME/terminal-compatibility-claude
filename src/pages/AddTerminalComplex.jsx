import React, { useState } from 'react';
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

/**
 * Add Terminal Complex Page
 * 
 * PURPOSE:
 * Creates new terminal complex (port/industrial zone) records.
 * Terminal Complexes are optional parent groupings for terminals.
 * 
 * DOMAIN CONTEXT:
 * Terminal Complex = Large port or industrial zone containing multiple terminals
 * Examples:
 * - "Ras Laffan Industrial City" (contains multiple LNG export terminals)
 * - "Port of Rotterdam" (contains oil, gas, container terminals)
 * - "Singapore Port" (major hub with specialized terminals)
 * 
 * ARCHITECTURAL DECISIONS:
 * 
 * 1. OPTIONAL USAGE:
 *    - Not all terminals need a parent complex
 *    - Single-terminal facilities can skip this level
 *    - Provides organizational flexibility
 * 
 * 2. AUDIT LOG INTEGRATION:
 *    - Explicitly creates AuditLog entry on creation
 *    - Tracks CREATE action with full record snapshot
 *    - Pattern for high-value configuration entities
 *    - TODO: Consider implementing this for all master data creates
 * 
 * 3. GEOGRAPHIC HIERARCHY:
 *    - Country → Region → City structure
 *    - All optional but recommended for filtering
 *    - Latitude/Longitude optional (unlike Terminal where it's required)
 *    - Rationale: Complex covers large area, single point less meaningful
 * 
 * 4. OPERATOR AUTHORITY:
 *    - Free-text field for managing organization name
 *    - Often different from terminal operators
 *    - Example: "Qatar Ports Management Company" manages complex,
 *      but individual terminals operated by "QatarEnergy", "RasGas", etc.
 * 
 * 5. CODE FIELD:
 *    - Optional abbreviation/identifier
 *    - Used for quick reference in reports
 *    - Example: "RLIC" for "Ras Laffan Industrial City"
 * 
 * SIMPLER THAN TERMINAL:
 * - No status management (operational states irrelevant)
 * - No product types (complexes are multi-product by definition)
 * - No capacity specifications (aggregate of child terminals)
 * - Purely organizational/grouping entity
 */
export default function AddTerminalComplex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const country = countries.find(c => c.id === data.countryId);
      const result = await base44.entities.TerminalComplex.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        ...data,
        countryPublicId: country?.publicId || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null
      });

      await base44.entities.AuditLog.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        entityType: 'TerminalComplex',
        entityId: result.id,
        entityPublicId: result.publicId,
        action: 'CREATE',
        fieldName: null,
        oldValue: null,
        newValue: JSON.stringify(result),
        timestamp: new Date().toISOString()
      });

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['terminalComplexes'] });
      toast.success('Terminal complex created successfully');
      navigate(createPageUrl(`TerminalComplexDetail?id=${result.id}`));
    },
    onError: (error) => {
      toast.error('Failed to create terminal complex: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Terminal complex name is required');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('TerminalComplexes')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Terminal Complex</h1>
          <p className="text-gray-600 mt-1">Create a new terminal complex</p>
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
                  placeholder="e.g., Ras Laffan Industrial City"
                  className="bg-white border-gray-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Complex Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g., RLIC"
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
                  onValueChange={(value) => setFormData({...formData, countryId: value})}
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
                placeholder="e.g., Qatar Ports Management Company"
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
          <Link to={createPageUrl('TerminalComplexes')}>
            <Button type="button" variant="outline" className="border-gray-300">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={createMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Terminal Complex'}
          </Button>
        </div>
      </form>
    </div>
  );
}