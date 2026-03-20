/**
 * Edit Fuel Type Page
 * 
 * PURPOSE:
 * Update existing fuel type records.
 * Identical form as AddFuelType with pre-populated data.
 * 
 * SAME FIELDS AS ADD:
 * See AddFuelType documentation for field explanations.
 * 
 * STATE INITIALIZATION (lines 37-49):
 * Loads fuel type data and populates form.
 * Uses || operators for null-safe defaults.
 * 
 * DUAL QUERY INVALIDATION (lines 57-58):
 * Refreshes both list and detail caches.
 * Ensures UI consistency after update.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function EditFuelType() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const fuelTypeId = urlParams.get('id');

  const { data: fuelType, isLoading } = useQuery({
    queryKey: ['fuelType', fuelTypeId],
    queryFn: () => base44.entities.FuelTypeRef.filter({ id: fuelTypeId }).then(r => r[0]),
    enabled: !!fuelTypeId
  });

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'OTHER',
    heatingRequired: false,
    isCryogenic: false,
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    if (fuelType) {
      setFormData({
        code: fuelType.code || '',
        name: fuelType.name || '',
        category: fuelType.category || 'OTHER',
        heatingRequired: fuelType.heatingRequired || false,
        isCryogenic: fuelType.isCryogenic || false,
        isActive: fuelType.isActive !== false,
        sortOrder: fuelType.sortOrder || 0
      });
    }
  }, [fuelType]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.FuelTypeRef.update(fuelTypeId, {
      ...data,
      sortOrder: parseInt(data.sortOrder) || 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['fuelTypes']);
      queryClient.invalidateQueries(['fuelType', fuelTypeId]);
      toast.success('Fuel type updated successfully');
      navigate(createPageUrl('FuelTypes'));
    },
    onError: (error) => {
      toast.error('Failed to update fuel type: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('FuelTypes')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Fuel Type</h1>
          <p className="text-sm text-gray-600 mt-1">Update fuel type reference</p>
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Fuel Type'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}