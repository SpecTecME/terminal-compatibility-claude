/**
 * Add Product Type Page
 * 
 * PURPOSE:
 * Create new product type classifications for terminals and berths.
 * Defines what cargo products can be handled at facilities.
 * 
 * DOMAIN CONTEXT - PRODUCT TYPES:
 * 
 * Product types classify what terminals/berths handle.
 * Different from Cargo Types (which describe what vessels carry).
 * 
 * RELATIONSHIP:
 * Terminal Product Type ⟷ Vessel Cargo Type compatibility matching.
 * 
 * EXAMPLES:
 * - LNG (Liquefied Natural Gas)
 * - Crude Oil
 * - Refined Products
 * - LPG (Liquefied Petroleum Gas)
 * - Ammonia
 * - Ethane
 * 
 * FIELD EXPLANATIONS:
 * 
 * 1. CODE (line 89-95):
 *    - Short identifier (e.g., "LNG", "CRUDE", "LPG")
 *    - Used in reports, APIs, exports
 *    - Should be concise, uppercase recommended
 *    - REQUIRED
 * 
 * 2. NAME (line 111-117):
 *    - Full descriptive name
 *    - Examples: "Liquefied Natural Gas", "Crude Oil", "Refined Petroleum Products"
 *    - Displayed in UI dropdowns and labels
 *    - REQUIRED
 * 
 * 3. PRODUCT CATEGORY (line 121-138):
 *    - High-level classification
 *    - REQUIRED
 *    
 *    OPTIONS:
 *    - GAS: Gaseous products (LNG, LPG, natural gas)
 *    - LIQUID_BULK: Liquid cargoes (oil, chemicals, ammonia)
 *    - DRY_BULK: Solid bulk (coal, grain, ore)
 *    - UNITIZED: Containers, packaged cargo
 *    - PASSENGER: People transport
 *    - OTHER: Miscellaneous
 *    
 *    RATIONALE:
 *    Enables high-level filtering and categorization.
 *    Compatible with vessel type categories.
 * 
 * 4. CRYOGENIC CHECKBOX (line 140-149):
 *    - Indicates if product requires cryogenic storage
 *    - Cryogenic = ultra-low temperature (below -150°C)
 *    - Examples: LNG (-162°C), LPG (-42°C), Ammonia (-33°C)
 *    
 *    IMPORTANCE:
 *    - Affects terminal equipment requirements
 *    - Special safety protocols needed
 *    - Insulation and containment specifications
 *    - Vessel compatibility constraints
 * 
 * 5. SORT ORDER (line 98-106):
 *    - Display priority in dropdowns/lists
 *    - Lower numbers appear first
 *    - Example: LNG=1, Crude=2, LPG=3
 *    - Optional (null = lowest priority)
 * 
 * 6. NOTES (line 151-158):
 *    - Additional context, specifications, warnings
 *    - Example: "Requires special vapor recovery system"
 *    - Free-text for flexibility
 * 
 * SORT ORDER vs ISACTIVE:
 * - sortOrder: Controls display position when active
 *- isActive: Controls visibility (always true on create)
 * 
 * Default isActive=true (line 33).
 * New product types active immediately.
 * Can deactivate later if needed.
 * 
 * USE IN SYSTEM:
 * - Terminal/berth product type assignment
 * - Compatibility calculations
 * - Filtering and reporting
 * - Operational planning
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function AddProductType() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    productCategory: '',
    isCryogenic: false,
    isActive: true,
    sortOrder: '',
    notes: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ProductTypeRef.create({
        publicId: generateUUID(),
        tenantId: getCurrentTenantId(),
        ...data,
        sortOrder: data.sortOrder ? parseInt(data.sortOrder) : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      toast.success('Product type created successfully');
      navigate(createPageUrl('ProductTypes'));
    },
    onError: (error) => {
      toast.error('Failed to create product type: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.productCategory) {
      toast.error('Code, name, and category are required');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Type</h1>
          <p className="text-gray-600 mt-1">Create a new product type classification</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Product Type Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g., LNG"
                  className="bg-white border-gray-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                  placeholder="e.g., 1"
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Liquefied Natural Gas"
                className="bg-white border-gray-300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Product Category *</Label>
              <Select
                value={formData.productCategory}
                onValueChange={(v) => setFormData({...formData, productCategory: v})}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="GAS">GAS</SelectItem>
                  <SelectItem value="LIQUID_BULK">LIQUID_BULK</SelectItem>
                  <SelectItem value="DRY_BULK">DRY_BULK</SelectItem>
                  <SelectItem value="UNITIZED">UNITIZED</SelectItem>
                  <SelectItem value="PASSENGER">PASSENGER</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCryogenic"
                checked={formData.isCryogenic}
                onCheckedChange={(checked) => setFormData({...formData, isCryogenic: checked})}
              />
              <Label htmlFor="isCryogenic" className="text-gray-700 cursor-pointer">
                Cryogenic product
              </Label>
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
          <Link to={createPageUrl('ProductTypes')}>
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
            {createMutation.isPending ? 'Creating...' : 'Create Product Type'}
          </Button>
        </div>
      </form>
    </div>
  );
}