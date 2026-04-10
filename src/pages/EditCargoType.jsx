/**
 * Edit Cargo Type Page
 * 
 * PURPOSE:
 * Update existing cargo type records with same form as AddCargoType.
 * Enables deactivation of obsolete cargo types.
 * 
 * IDENTICAL TO ADD:
 * Same fields and validation as AddCargoType.
 * See AddCargoType documentation for field explanations.
 * 
 * STATE INITIALIZATION (lines 36-62):
 * Sets default values, then overrides with loaded data.
 * useEffect populates form when cargoType query completes.
 * 
 * NULL HANDLING (lines 41-42, 55-56, 68-69):
 * Stores both ID and publicId for product type link.
 * Converts null to empty string for form inputs.
 * Converts back to null for database (lines 68-69).
 * 
 * DUAL QUERY INVALIDATION (lines 72-73):
 * Refreshes both list and detail caches after update.
 * Ensures all views reflect latest data.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function EditCargoType() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const cargoTypeId = urlParams.get('id');

  const { data: cargoType, isLoading } = useQuery({
    queryKey: ['cargoType', cargoTypeId],
    queryFn: async () => {
      const allCargos = await base44.entities.CargoTypeRef.list();
      return allCargos.find(ct => ct.id === cargoTypeId);
    },
    enabled: !!cargoTypeId
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

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

  useEffect(() => {
    if (cargoType) {
      setFormData({
        code: cargoType.code || '',
        name: cargoType.name || '',
        cargoCategory: cargoType.cargoCategory || 'GAS',
        defaultUnit: cargoType.defaultUnit || 'm3',
        productTypeId: cargoType.productTypeId || '',
        productTypePublicId: cargoType.productTypePublicId || '',
        isActive: cargoType.isActive !== false,
        sortOrder: cargoType.sortOrder || 0,
        notes: cargoType.notes || ''
      });
    }
  }, [cargoType]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CargoTypeRef.update(cargoTypeId, {
      ...data,
      sortOrder: parseInt(data.sortOrder) || null,
      productTypeId: data.productTypeId || null,
      productTypePublicId: data.productTypePublicId || null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cargoTypes']);
      queryClient.invalidateQueries(['cargoType', cargoTypeId]);
      toast.success('Cargo type updated');
      navigate(createPageUrl('CargoTypes'));
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cargo Type</h1>
          <p className="text-sm text-gray-600 mt-1">Update cargo type details</p>
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
                  required
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}