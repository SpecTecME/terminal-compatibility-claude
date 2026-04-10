/**
 * Edit Berth Page
 * 
 * PURPOSE:
 * Updates existing berth specifications and operational parameters.
 * Maintains dual field name structure during legacy-to-new schema migration.
 * 
 * CRITICAL DUAL FIELD ARCHITECTURE:
 * 
 * This component manages BOTH old and new field names simultaneously:
 * 
 * NEW FIELDS (CamelCase):        LEGACY FIELDS (snake_case):
 * - berthCode                    - (none)
 * - berthName                    - (none)
 * - maxLOAM                      - max_loa
 * - maxBeamM                     - max_beam
 * - maxArrivalDraftM             - max_draft
 * - maxCargoCapacityM3           - max_cargo_capacity
 * 
 * WHY DUAL FIELDS?
 * - Gradual migration strategy (cannot update all references at once)
 * - Some legacy queries/reports still use snake_case names
 * - New UI components use CamelCase for consistency
 * - Both updated in sync (lines 114-118) to maintain data integrity
 * 
 * MIGRATION STRATEGY:
 * 1. Add new fields to schema (already done)
 * 2. Update write operations to populate both (THIS file)
 * 3. Gradually migrate read operations to new fields
 * 4. Once all references updated, deprecate legacy fields
 * 5. Eventually remove legacy fields from schema
 * 
 * Currently in Phase 2 - writing both sets of values.
 * 
 * PRODUCT TYPE MANAGEMENT:
 * - productTypeRefIds = Array of product IDs (multi-select)
 * - Stored as JSON array in database
 * - UI uses Popover with checkboxes for multi-selection
 * - Terminal's default product shown as hint (line 251-255)
 * 
 * Q-MAX / Q-FLEX CAPABILITY:
 * - LNG-specific vessel class flags
 * - Q-Max = Largest LNG carriers (266,000 m³)
 * - Q-Flex = Large LNG carriers (210,000-217,000 m³)
 * - Qatar Petroleum specific classifications
 * - Boolean flags for quick compatibility checks
 * - Only relevant for LNG terminals
 * 
 * METADATA TRACKING:
 * - operator: Who operates this specific berth
 * - dataSource: Where specifications came from (e.g., "Terminal website", "Site survey")
 * - lastVerifiedDate: When data last confirmed accurate
 * - Supports data governance and audit requirements
 * 
 * NAVIGATION:
 * Always returns to BerthDetail page (never to list).
 * Maintains user's context within berth workflow.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Plus } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from 'sonner';

export default function EditBerth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const berthId = urlParams.get('id');

  const [formData, setFormData] = useState({
    berthCode: '',
    berthName: '',
    berthType: '',
    productTypeRefIds: [],
    status: 'Operational',
    qmaxCapable: false,
    qflexCapable: false,
    maxCargoCapacityM3: '',
    maxLOAM: '',
    maxBeamM: '',
    maxArrivalDraftM: '',
    maxArrivalDisplacementT: '',
    manifoldLimitsNotes: '',
    loadingArmsLngCount: '',
    vapourReturnAvailable: false,
    typicalLoadingRateNotes: '',
    operator: '',
    dataSource: '',
    lastVerifiedDate: '',
    notes: ''
  });

  const { data: berth, isLoading } = useQuery({
    queryKey: ['berth', berthId],
    queryFn: () => base44.entities.Berth.filter({ id: berthId }).then(r => r[0]),
    enabled: !!berthId
  });

  const { data: terminal } = useQuery({
    queryKey: ['terminal', berth?.terminal_id],
    queryFn: () => base44.entities.Terminal.filter({ id: berth.terminal_id }).then(r => r[0]),
    enabled: !!berth?.terminal_id
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  useEffect(() => {
    if (berth) {
      setFormData({
        berthCode: berth.berthCode || '',
        berthName: berth.berthName || '',
        berthType: berth.berthType || '',
        productTypeRefIds: berth.productTypeRefIds || [],
        status: berth.status || 'Operational',
        qmaxCapable: berth.qmaxCapable || false,
        qflexCapable: berth.qflexCapable || false,
        maxCargoCapacityM3: berth.maxCargoCapacityM3 || '',
        maxLOAM: berth.maxLOAM || '',
        maxBeamM: berth.maxBeamM || '',
        maxArrivalDraftM: berth.maxArrivalDraftM || '',
        maxArrivalDisplacementT: berth.maxArrivalDisplacementT || '',
        manifoldLimitsNotes: berth.manifoldLimitsNotes || '',
        loadingArmsLngCount: berth.loadingArmsLngCount || '',
        vapourReturnAvailable: berth.vapourReturnAvailable || false,
        typicalLoadingRateNotes: berth.typicalLoadingRateNotes || '',
        operator: berth.operator || '',
        dataSource: berth.dataSource || '',
        lastVerifiedDate: berth.lastVerifiedDate || '',
        notes: berth.notes || ''
      });
    }
  }, [berth]);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const updateData = {
        ...data,
        berthCode: data.berthCode || null,
        berthName: data.berthName || null,
        berthType: data.berthType || null,
        productTypeRefIds: data.productTypeRefIds || [],
        maxCargoCapacityM3: data.maxCargoCapacityM3 ? parseFloat(data.maxCargoCapacityM3) : null,
        maxLOAM: data.maxLOAM ? parseFloat(data.maxLOAM) : null,
        maxBeamM: data.maxBeamM ? parseFloat(data.maxBeamM) : null,
        maxArrivalDraftM: data.maxArrivalDraftM ? parseFloat(data.maxArrivalDraftM) : null,
        maxArrivalDisplacementT: data.maxArrivalDisplacementT ? parseFloat(data.maxArrivalDisplacementT) : null,
        loadingArmsLngCount: data.loadingArmsLngCount ? parseInt(data.loadingArmsLngCount) : null,
        // Also update legacy fields
        max_loa: data.maxLOAM ? parseFloat(data.maxLOAM) : null,
        max_beam: data.maxBeamM ? parseFloat(data.maxBeamM) : null,
        max_draft: data.maxArrivalDraftM ? parseFloat(data.maxArrivalDraftM) : null,
        max_cargo_capacity: data.maxCargoCapacityM3 ? parseFloat(data.maxCargoCapacityM3) : null
      };
      return base44.entities.Berth.update(berthId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['berth', berthId]);
      queryClient.invalidateQueries(['berths']);
      toast.success('Berth updated successfully');
      navigate(createPageUrl(`BerthDetail?id=${berthId}`));
    },
    onError: (error) => {
      toast.error('Failed to update berth: ' + error.message);
    }
  });

  /**
   * Validate and submit berth update
   * 
   * MANDATORY FIELDS: berthCode and berthName
   * - User cannot save berth without these critical identifiers
   * - Inline validation prevents submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate mandatory fields
    if (!formData.berthCode || formData.berthCode.trim() === '') {
      toast.error('Berth Code is required');
      return;
    }
    if (!formData.berthName || formData.berthName.trim() === '') {
      toast.error('Berth Name is required');
      return;
    }
    
    updateMutation.mutate(formData);
  };

  if (isLoading || !berth) {
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
          <h1 className="text-2xl font-bold text-gray-900">Berth</h1>
          <p className="text-gray-600 mt-1">{berth.berthName || berth.berth_number}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Berth Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity and Service</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="berthCode" className="text-gray-700">Berth Code *</Label>
                  <Input
                    id="berthCode"
                    value={formData.berthCode}
                    onChange={(e) => setFormData({ ...formData, berthCode: e.target.value })}
                    className="bg-blue-50 border-blue-300 text-gray-900"
                    placeholder="e.g., B1, LNG1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="berthName" className="text-gray-700">Berth Name *</Label>
                  <Input
                    id="berthName"
                    value={formData.berthName}
                    onChange={(e) => setFormData({ ...formData, berthName: e.target.value })}
                    className="bg-blue-50 border-blue-300 text-gray-900"
                    placeholder="e.g., North Jetty"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="berthType" className="text-gray-700">Berth Type</Label>
                  <Select value={formData.berthType} onValueChange={(value) => setFormData({ ...formData, berthType: value })}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jetty">Jetty</SelectItem>
                      <SelectItem value="Quay">Quay</SelectItem>
                      <SelectItem value="SPM">SPM</SelectItem>
                      <SelectItem value="Dolphin">Dolphin</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Products</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-white border-gray-300 text-gray-900"
                      >
                        <span className="truncate">
                          {formData.productTypeRefIds.length > 0
                            ? formData.productTypeRefIds.map(id => productTypes.find(pt => pt.id === id)?.code).filter(Boolean).join(', ')
                            : 'Select products...'}
                        </span>
                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2" align="start">
                      <div className="space-y-1">
                        {productTypes.filter(pt => pt.isActive).map(pt => (
                          <div
                            key={pt.id}
                            onClick={() => {
                              const isSelected = formData.productTypeRefIds.includes(pt.id);
                              setFormData({
                                ...formData,
                                productTypeRefIds: isSelected
                                  ? formData.productTypeRefIds.filter(id => id !== pt.id)
                                  : [...formData.productTypeRefIds, pt.id]
                              });
                            }}
                            className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                              formData.productTypeRefIds.includes(pt.id)
                                ? 'bg-cyan-600 text-white'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox checked={formData.productTypeRefIds.includes(pt.id)} />
                              <span>{pt.code} - {pt.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {terminal?.productTypeRefId && (
                    <p className="text-xs text-gray-600">
                      Terminal default: {productTypes.find(pt => pt.id === terminal.productTypeRefId)?.code || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="status" className="text-gray-700">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operational">Operational</SelectItem>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Under Construction">Under Construction</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compatibility and Limits</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLOAM">Max LOA (m)</Label>
                  <Input
                    id="maxLOAM"
                    type="number"
                    step="0.01"
                    value={formData.maxLOAM}
                    onChange={(e) => setFormData({ ...formData, maxLOAM: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBeamM">Max Beam (m)</Label>
                  <Input
                    id="maxBeamM"
                    type="number"
                    step="0.01"
                    value={formData.maxBeamM}
                    onChange={(e) => setFormData({ ...formData, maxBeamM: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="maxArrivalDraftM">Max Arrival Draft (m)</Label>
                  <Input
                    id="maxArrivalDraftM"
                    type="number"
                    step="0.01"
                    value={formData.maxArrivalDraftM}
                    onChange={(e) => setFormData({ ...formData, maxArrivalDraftM: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxArrivalDisplacementT">Max Arrival Displacement (t)</Label>
                  <Input
                    id="maxArrivalDisplacementT"
                    type="number"
                    step="0.01"
                    value={formData.maxArrivalDisplacementT}
                    onChange={(e) => setFormData({ ...formData, maxArrivalDisplacementT: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="qmaxCapable" checked={formData.qmaxCapable} onCheckedChange={(c) => setFormData({ ...formData, qmaxCapable: c })} />
                  <Label htmlFor="qmaxCapable" className="cursor-pointer">Q-Max Capable</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="qflexCapable" checked={formData.qflexCapable} onCheckedChange={(c) => setFormData({ ...formData, qflexCapable: c })} />
                  <Label htmlFor="qflexCapable" className="cursor-pointer">Q-Flex Capable</Label>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="maxCargoCapacityM3">Max Cargo Capacity (m³)</Label>
                <Input
                  id="maxCargoCapacityM3"
                  type="number"
                  step="0.01"
                  value={formData.maxCargoCapacityM3}
                  onChange={(e) => setFormData({ ...formData, maxCargoCapacityM3: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="manifoldLimitsNotes">Manifold Limits Notes</Label>
                <Textarea
                  id="manifoldLimitsNotes"
                  value={formData.manifoldLimitsNotes}
                  onChange={(e) => setFormData({ ...formData, manifoldLimitsNotes: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                  rows={2}
                />
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Loading Interface</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loadingArmsLngCount">LNG Loading Arms Count</Label>
                  <Input
                    id="loadingArmsLngCount"
                    type="number"
                    step="1"
                    value={formData.loadingArmsLngCount}
                    onChange={(e) => setFormData({ ...formData, loadingArmsLngCount: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="vapourReturnAvailable" checked={formData.vapourReturnAvailable} onCheckedChange={(c) => setFormData({ ...formData, vapourReturnAvailable: c })} />
                  <Label htmlFor="vapourReturnAvailable" className="cursor-pointer">Vapour Return Available</Label>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="typicalLoadingRateNotes">Typical Loading Rate Notes</Label>
                <Textarea
                  id="typicalLoadingRateNotes"
                  value={formData.typicalLoadingRateNotes}
                  onChange={(e) => setFormData({ ...formData, typicalLoadingRateNotes: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                  rows={2}
                />
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operator">Operator</Label>
                  <Input
                    id="operator"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataSource">Data Source</Label>
                  <Input
                    id="dataSource"
                    value={formData.dataSource}
                    onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="lastVerifiedDate">Last Verified Date</Label>
                <Input
                  id="lastVerifiedDate"
                  type="date"
                  value={formData.lastVerifiedDate}
                  onChange={(e) => setFormData({ ...formData, lastVerifiedDate: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">General Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white border-gray-300 text-gray-900"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl(`BerthDetail?id=${berthId}`))}
            className="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Berth'}
          </Button>
        </div>
      </form>
    </div>
  );
}