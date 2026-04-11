/**
 * Edit Vessel Type Page
 * 
 * PURPOSE:
 * Update existing vessel type records.
 * Same form as AddVesselType with pre-populated data.
 * 
 * STATE INITIALIZATION (lines 38-51):
 * Populates form when vessel type loads.
 * Careful null handling for sortOrder (line 47).
 * Default isActive to true if undefined (line 48).
 * 
 * DUAL QUERY INVALIDATION (lines 59-60):
 * Refreshes both specific record and full list.
 * Ensures UI consistency after update.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function EditVesselType() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const vesselTypeId = urlParams.get('id');

  const { data: vesselType, isLoading } = useQuery({
    queryKey: ['vesselType', vesselTypeId],
    queryFn: () => base44.entities.VesselTypeRef.filter({ id: parseInt(vesselTypeId) }).then(r => r[0]),
    enabled: !!vesselTypeId
  });

  const [formData, setFormData] = useState({
    primaryType: '',
    subType: '',
    sizeMetric: '',
    typicalSizeRange: '',
    definingCharacteristics: '',
    capabilitiesSections: '',
    sortOrder: '',
    isActive: true
  });

  React.useEffect(() => {
    if (vesselType) {
      setFormData({
        primaryType: vesselType.primaryType || '',
        subType: vesselType.subType || '',
        sizeMetric: vesselType.sizeMetric || '',
        typicalSizeRange: vesselType.typicalSizeRange || '',
        definingCharacteristics: vesselType.definingCharacteristics || '',
        capabilitiesSections: vesselType.capabilitiesSections || '',
        sortOrder: vesselType.sortOrder !== null && vesselType.sortOrder !== undefined ? vesselType.sortOrder.toString() : '',
        isActive: vesselType.isActive !== undefined ? vesselType.isActive : true
      });
    }
  }, [vesselType]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.VesselTypeRef.update(vesselTypeId, {
      ...data,
      sortOrder: data.sortOrder ? parseInt(data.sortOrder) : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vesselType', vesselTypeId] });
      queryClient.invalidateQueries({ queryKey: ['vesselTypes'] });
      toast.success('Vessel type updated');
      navigate(createPageUrl('VesselTypes'));
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const sizeMetrics = ['DWT', 'TEU', 'm3', 'pax', 'LOA_m', 'BHP', 'BP', 'volume', 'tonnes', 'lane_meters', 'CEU', 'class'];

  if (isLoading || !vesselType) {
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
          <h1 className="text-2xl font-bold text-gray-900">Vessel Type</h1>
          <p className="text-sm text-gray-600 mt-1">{vesselType.primaryType} - {vesselType.subType}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Vessel Type Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Primary Type *</Label>
                <Input
                  value={formData.primaryType}
                  onChange={(e) => setFormData({...formData, primaryType: e.target.value})}
                  className="bg-white border-gray-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Sub-Type / Size Class *</Label>
                <Input
                  value={formData.subType}
                  onChange={(e) => setFormData({...formData, subType: e.target.value})}
                  className="bg-white border-gray-300"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Size Metric</Label>
                <Select value={formData.sizeMetric} onValueChange={(value) => setFormData({...formData, sizeMetric: value})}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Select size metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeMetrics.map(metric => (
                      <SelectItem key={metric} value={metric}>{metric}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Typical Size Range</Label>
                <Input
                  value={formData.typicalSizeRange}
                  onChange={(e) => setFormData({...formData, typicalSizeRange: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Defining Characteristics</Label>
              <Textarea
                value={formData.definingCharacteristics}
                onChange={(e) => setFormData({...formData, definingCharacteristics: e.target.value})}
                className="bg-white border-gray-300"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Capabilities Sections</Label>
              <Input
                value={formData.capabilitiesSections}
                onChange={(e) => setFormData({...formData, capabilitiesSections: e.target.value})}
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-gray-500">Comma-separated list</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Status</Label>
                <Select value={formData.isActive.toString()} onValueChange={(value) => setFormData({...formData, isActive: value === 'true'})}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link to={createPageUrl('VesselTypes')}>
            <Button type="button" variant="outline" className="border-gray-300">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}