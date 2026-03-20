/**
 * Add Cargo Type Page
 * 
 * PURPOSE:
 * Create new cargo type classifications for vessel capabilities.
 * Defines what types of cargo vessels can carry.
 * 
 * DOMAIN CONTEXT - CARGO TYPES vs PRODUCT TYPES:
 * 
 * CARGO TYPE (this page):
 * - Describes what VESSELS carry
 * - Vessel capability classification
 * - Examples: "LNG", "Crude Oil", "Containers", "Passengers"
 * 
 * PRODUCT TYPE (separate):
 * - Describes what TERMINALS/BERTHS handle
 * - Facility capability classification
 * 
 * RELATIONSHIP:
 * Cargo Type ⟷ Product Type compatibility matching.
 * Links through productTypeId field (line 145).
 * 
 * FIELD EXPLANATIONS:
 * 
 * 1. CODE (line 80-86):
 *    - Short identifier (e.g., "LNG", "CRUDE_OIL", "CONTAINERS")
 *    - Used in reports and APIs
 *    - REQUIRED
 * 
 * 2. NAME (line 88-95):
 *    - Full descriptive name
 *    - Examples: "Liquefied Natural Gas (LNG)", "Crude Oil", "20/40ft Containers"
 *    - REQUIRED
 * 
 * 3. CARGO CATEGORY (line 100-116):
 *    - High-level classification
 *    - REQUIRED
 *    
 *    OPTIONS:
 *    - GAS: Gaseous cargoes (LNG, LPG)
 *    - LIQUID_BULK: Liquid cargoes (oil, chemicals)
 *    - DRY_BULK: Dry bulk (coal, grain)
 *    - CONTAINER: Containerized cargo
 *    - RORO: Roll-on/Roll-off (vehicles)
 *    - PASSENGER: People
 *    - GENERAL: General cargo
 *    - OTHER: Miscellaneous
 * 
 * 4. DEFAULT UNIT (line 118-132):
 *    - Measurement unit for this cargo type
 *    - REQUIRED
 *    
 *    UNITS:
 *    - m³ (cubic meters): Gas/liquid volumes
 *    - MT (metric tonnes): Weight-based
 *    - TEU (Twenty-foot Equivalent Unit): Containers
 *    - CEU (Car Equivalent Unit): Vehicles
 *    - pax (passengers): People
 *    - lane_meters: Ro-Ro deck space
 *    
 *    IMPORTANCE:
 *    Used in capacity calculations and reporting.
 * 
 * 5. PRODUCT TYPE LINK (line 145-170):
 *    - Optional link to ProductTypeRef
 *    - Enables cargo-product compatibility matching
 *    
 *    WORKFLOW (lines 147-154):
 *    - User selects product type
 *    - System stores both ID and publicId
 *    - publicId enables data portability
 *    
 *    WHEN TO LINK:
 *    - LNG cargo → LNG product: LINK
 *    - Crude cargo → Crude product: LINK
 *    - Passengers → (no product type): NO LINK
 *    
 *    RATIONALE (line 168-169):
 *    Passenger vessels don't match against terminal product types.
 *    Passengers aren't "products" handled by cargo terminals.
 * 
 * 6. SORT ORDER (line 134-141):
 *    - Display priority
 *    - Lower numbers first
 * 
 * 7. NOTES (line 173-179):
 *    - Additional specifications
 *    - Handling requirements
 *    - Safety considerations
 * 
 * 8. ISACTIVE (line 181-188):
 *    - Defaults to true (line 25)
 *    - Can be changed immediately
 *    - Controls visibility in dropdowns
 * 
 * DUAL IDENTIFIER STORAGE (lines 148-154):
 * 
 * Stores BOTH productTypeId and productTypePublicId.
 * 
 * RATIONALE:
 * - productTypeId: Base44 internal ID (for queries)
 * - productTypePublicId: UUID (for migration/portability)
 * 
 * Benefits migration between environments.
 * Can rebuild relationships using publicIds.
 * 
 * USE IN SYSTEM:
 * - Vessel capability definition
 * - Compatibility calculations with terminals
 * - Reporting and analytics
 * - Operational planning
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AddCargoType() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    cargoCategory: 'GAS',
    defaultUnit: 'm3',
    productTypeId: '',
    productTypePublicId: '',
    isActive: true,
    sortOrder: 0,
    notes: ''
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CargoTypeRef.create({
      ...data,
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      sortOrder: parseInt(data.sortOrder) || null,
      productTypeId: data.productTypeId || null,
      productTypePublicId: data.productTypePublicId || null
    }),
    onSuccess: () => {
      toast.success('Cargo type created');
      navigate(createPageUrl('CargoTypes'));
    },
    onError: (error) => {
      toast.error('Failed to create: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('CargoTypes')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Cargo Type</h1>
          <p className="text-sm text-gray-600 mt-1">Create a new cargo type</p>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Cargo Type Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g., LNG, CRUDE_OIL"
                  required
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Liquefied Natural Gas (LNG)"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formData.cargoCategory} onValueChange={(v) => setFormData({...formData, cargoCategory: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GAS">Gas</SelectItem>
                    <SelectItem value="LIQUID_BULK">Liquid Bulk</SelectItem>
                    <SelectItem value="DRY_BULK">Dry Bulk</SelectItem>
                    <SelectItem value="CONTAINER">Container</SelectItem>
                    <SelectItem value="RORO">Ro-Ro</SelectItem>
                    <SelectItem value="PASSENGER">Passenger</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Default Unit *</Label>
                <Select value={formData.defaultUnit} onValueChange={(v) => setFormData({...formData, defaultUnit: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m3">m³</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="TEU">TEU</SelectItem>
                    <SelectItem value="CEU">CEU</SelectItem>
                    <SelectItem value="pax">Pax</SelectItem>
                    <SelectItem value="lane_meters">Lane Meters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Product Type (for compatibility)</Label>
              <Select 
                value={formData.productTypeId} 
                onValueChange={(v) => {
                  const selectedPT = productTypes.find(pt => pt.id === v);
                  setFormData({
                    ...formData, 
                    productTypeId: v,
                    productTypePublicId: selectedPT?.publicId || ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product type (leave empty for passenger types)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None (N/A)</SelectItem>
                  {productTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-1">
                Links cargo type to terminal/berth product type for compatibility matching. Leave empty for passenger-related cargo.
              </p>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(c) => setFormData({...formData, isActive: c})}
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link to={createPageUrl('CargoTypes')}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}