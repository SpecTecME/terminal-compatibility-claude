/**
 * Edit Product Type Page
 * 
 * PURPOSE:
 * Update existing product type records.
 * Identical form as AddProductType plus isActive toggle.
 * 
 * EDIT PATTERN:
 * 1. Load product type by ID (lines 30-34)
 * 2. Initialize form state on data load (lines 36-40)
 * 3. User modifies fields
 * 4. Update mutation saves changes (lines 42-58)
 * 5. Navigate back to list (line 53)
 * 
 * STATE MANAGEMENT PATTERN (lines 28, 36-40):
 * 
 * Uses null initial state, not empty object.
 * 
 * REASON:
 * - Distinguishes "not loaded" from "loaded with empty values"
 * - Prevents form flicker on load
 * - Only populates once when data arrives
 * 
 * Conditional check: if (productType && !formData)
 * Prevents re-initialization on re-renders.
 * 
 * ISACTIVE TOGGLE (lines 159-168):
 * 
 * Only appears in edit mode (not add mode).
 * 
 * ALLOWS:
 * - Deactivating obsolete product types
 * - Reactivating previously disabled types
 * - Soft delete without data loss
 * 
 * COMMON SCENARIOS:
 * - Terminal no longer handles certain product → deactivate
 * - New product type added by mistake → deactivate
 * - Product type back in use → reactivate
 * 
 * VALIDATION (lines 60-66):
 * Same as AddProductType:
 * - Code, name, category required
 * - Prevents incomplete records
 * 
 * DUAL QUERY INVALIDATION (lines 50-51):
 * Invalidates both:
 * - List cache (productTypes)
 * - Detail cache (productType, productTypeId)
 * 
 * Ensures all views refresh with latest data.
 * 
 * NULL-SAFE RENDERING (lines 101, 111, 121, 131, 151, 173):
 * 
 * All inputs use `|| ''` pattern:
 * - value={formData.code || ''}
 * - Prevents "uncontrolled to controlled" React warnings
 * - Handles null/undefined gracefully
 * 
 * LOADING STATE (lines 69-75):
 * Shows spinner until both:
 * - Query completes (productType loaded)
 * - Form state initialized (formData populated)
 * 
 * Prevents empty form flash.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
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

export default function EditProductType() {
  const urlParams = new URLSearchParams(window.location.search);
  const productTypeId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(null);

  const { data: productType, isLoading } = useQuery({
    queryKey: ['productType', productTypeId],
    queryFn: () => base44.entities.ProductTypeRef.filter({ id: productTypeId }).then(r => r[0]),
    enabled: !!productTypeId
  });

  React.useEffect(() => {
    if (productType && !formData) {
      setFormData(productType);
    }
  }, [productType, formData]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ProductTypeRef.update(productTypeId, {
        ...data,
        sortOrder: data.sortOrder ? parseInt(data.sortOrder) : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      queryClient.invalidateQueries({ queryKey: ['productType', productTypeId] });
      toast.success('Product type updated successfully');
      navigate(createPageUrl('ProductTypes'));
    },
    onError: (error) => {
      toast.error('Failed to update product type: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.productCategory) {
      toast.error('Code, name, and category are required');
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Type</h1>
          <p className="text-gray-600 mt-1">Update product type information</p>
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
                  value={formData.code || ''}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="bg-white border-gray-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder || ''}
                  onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Name *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-white border-gray-300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Product Category *</Label>
              <Select
                value={formData.productCategory || ''}
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
                checked={formData.isCryogenic || false}
                onCheckedChange={(checked) => setFormData({...formData, isCryogenic: checked})}
              />
              <Label htmlFor="isCryogenic" className="text-gray-700 cursor-pointer">
                Cryogenic product
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive ?? true}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="isActive" className="text-gray-700 cursor-pointer">
                Active
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={formData.notes || ''}
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