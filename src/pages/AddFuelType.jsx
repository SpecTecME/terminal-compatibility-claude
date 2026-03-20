/**
 * Add Fuel Type Page
 * 
 * PURPOSE:
 * Create new fuel type classifications for vessel fuel management.
 * Defines fuel characteristics for compliance and operational tracking.
 * 
 * FIELD EXPLANATIONS:
 * 
 * 1. CODE (line 72-78):
 *    - Short identifier (LNG, MGO, HFO, VLSFO)
 *    - Auto-uppercased for consistency
 *    - Used in reports and APIs
 *    - REQUIRED
 * 
 * 2. NAME (line 80-88):
 *    - Full descriptive name
 *    - Examples: "Liquefied Natural Gas", "Marine Gas Oil", "Very Low Sulfur Fuel Oil"
 *    - REQUIRED
 * 
 * 3. CATEGORY (line 92-108):
 *    - High-level fuel classification
 *    
 *    OPTIONS:
 *    - GAS: Gaseous fuels (LNG, CNG)
 *    - DISTILLATE: Light refined fuels (MGO, MDO)
 *    - RESIDUAL: Heavy fuel oils (HFO, IFO, VLSFO)
 *    - ALCOHOL: Methanol, ethanol
 *    - OTHER: Alternative/future fuels (ammonia, hydrogen)
 * 
 * 4. HEATING REQUIRED (line 121-128):
 *    - Checkbox for fuels needing thermal management
 *    
 *    WHEN REQUIRED:
 *    - HFO: YES (too viscous when cold)
 *    - IFO: YES (medium viscosity)
 *    - VLSFO: SOMETIMES (depends on blend)
 *    - MGO: NO (flows at ambient)
 *    
 *    OPERATIONAL IMPACT:
 *    - Heating coils in fuel tanks
 *    - Temperature monitoring
 *    - Purifier operation requirements
 *    - Bunker transfer procedures
 * 
 * 5. CRYOGENIC (line 129-136):
 *    - Checkbox for ultra-low temperature fuels
 *    
 *    EXAMPLES:
 *    - LNG: YES (-162°C)
 *    - Ammonia: YES (-33°C)
 *    - MGO: NO (ambient storage)
 *    
 *    REQUIREMENTS:
 *    - Insulated tanks
 *    - Boil-off gas management
 *    - Specialized pumps and piping
 *    - Safety systems for cold burns
 * 
 * 6. SORT ORDER (line 110-117):
 *    - Display priority in dropdowns
 *    - Common fuels (MGO, VLSFO) → lower numbers
 *    - Rare/future fuels → higher numbers
 * 
 * 7. ISACTIVE (line 137-144):
 *    - Default true for new fuels
 *    - Can create inactive if preparing data
 * 
 * DEFAULT VALUES (lines 18-26):
 * - category: OTHER (most flexible default)
 * - heatingRequired: false (most fuels don't need it)
 * - isCryogenic: false (rare characteristic)
 * - isActive: true (active by default)
 * - sortOrder: 0 (neutral priority)
 * 
 * DATA TRANSFORMATION (lines 29-34):
 * - Generates publicId (UUID)
 * - Sets tenantId
 * - Forces isSystem=false (user-created, not system-defined)
 * - Forces isLocked=false (can be edited/deleted)
 * - Converts sortOrder to integer
 * 
 * USE IN SYSTEM:
 * - Vessel fuel tank specifications
 * - Bunker planning
 * - Environmental compliance reporting
 * - ECA (Emission Control Area) tracking
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AddFuelType() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'OTHER',
    heatingRequired: false,
    isCryogenic: false,
    isActive: true,
    sortOrder: 0
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FuelTypeRef.create({
      ...data,
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      sortOrder: parseInt(data.sortOrder) || 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['fuelTypes']);
      toast.success('Fuel type created successfully');
      navigate(createPageUrl('FuelTypes'));
    },
    onError: (error) => {
      toast.error('Failed to create fuel type: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('FuelTypes')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Fuel Type</h1>
          <p className="text-sm text-gray-600 mt-1">Create a new fuel type reference</p>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Fuel Type Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., LNG, MGO"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Liquefied Natural Gas"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GAS">Gas</SelectItem>
                    <SelectItem value="DISTILLATE">Distillate</SelectItem>
                    <SelectItem value="RESIDUAL">Residual</SelectItem>
                    <SelectItem value="ALCOHOL">Alcohol</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="heatingRequired"
                  checked={formData.heatingRequired}
                  onCheckedChange={(checked) => setFormData({...formData, heatingRequired: checked})}
                />
                <Label htmlFor="heatingRequired" className="cursor-pointer">Heating Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isCryogenic"
                  checked={formData.isCryogenic}
                  onCheckedChange={(checked) => setFormData({...formData, isCryogenic: checked})}
                />
                <Label htmlFor="isCryogenic" className="cursor-pointer">Cryogenic</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Link to={createPageUrl('FuelTypes')}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Fuel Type'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}