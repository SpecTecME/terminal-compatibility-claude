/**
 * Vessel Cargo Capability Management Component
 * 
 * PURPOSE:
 * Manages the detailed cargo handling capabilities of a vessel.
 * Defines WHAT cargoes the vessel can carry and at WHAT capacities.
 * 
 * ARCHITECTURAL CONTEXT:
 * 
 * This component represents a DIFFERENT dimension than VesselTypeRef:
 * 
 * VesselTypeRef (e.g., "LNG Carrier - Q-Max"):
 * - CLASSIFICATION of vessel (what category it belongs to)
 * - Defines TYPICAL capabilities for that vessel class
 * - Single selection (one vessel type)
 * 
 * VesselCargoCapability (This component):
 * - ACTUAL capabilities of THIS SPECIFIC vessel
 * - Can deviate from vessel type defaults
 * - Multi-cargo support (e.g., LNG + LPG + Ammonia)
 * - Captures precise capacity values with units
 * 
 * USE CASES:
 * 
 * 1. MULTI-CARGO VESSELS:
 *    - Some vessels certified for multiple cargo types
 *    - Example: LNG/LPG dual-fuel carrier
 *    - Each cargo has different capacity (tank segregation)
 * 
 * 2. CAPACITY PRECISION:
 *    - Vessel type defines RANGE (e.g., "120,000-200,000 m³")
 *    - This component stores EXACT capacity (e.g., "174,000 m³")
 *    - Critical for cargo planning and compatibility
 * 
 * 3. CAPACITY BASIS:
 *    - DESIGN: Original shipyard design specification
 *    - NOMINAL: Standard operating capacity
 *    - TYPICAL: Average practical capacity (accounting for operational constraints)
 *    - MAX: Absolute maximum (rarely used, requires special conditions)
 *    
 *    Different bases reflect operational vs theoretical capacity.
 *    Terminals care about NOMINAL/TYPICAL for planning.
 * 
 * 4. UNIT FLEXIBILITY:
 *    - m³: Volume (liquid cargo - LNG, crude oil)
 *    - MT: Metric tons (weight - dry bulk)
 *    - TEU: Twenty-foot Equivalent Units (containers)
 *    - CEU: Car Equivalent Units (RoRo vessels)
 *    - pax: Passengers (cruise ships, ferries)
 *    - lane_meters: RoRo deck space
 *    
 *    Unit auto-populated from cargo type default but overridable.
 * 
 * 5. ACTIVE/INACTIVE FLAG:
 *    - Vessels can lose certification for certain cargoes
 *    - Deactivate instead of delete (preserves history)
 *    - Example: Vessel previously LNG/LPG, now LNG only
 * 
 * CARGO TYPE INTEGRATION:
 * - Links to CargoTypeRef master data
 * - Cargo types have cargoCategory for grouping (GAS, LIQUID_BULK, etc.)
 * - Color-coding by category for visual scanning
 * 
 * DATA VALIDATION:
 * - Cargo type is MANDATORY (can't have capability without cargo)
 * - Capacity value is MANDATORY (numeric, can be decimal)
 * - Cargo type IMMUTABLE after creation (disabled in edit mode)
 *   Rationale: Changing cargo type changes meaning entirely, better to delete/recreate
 * 
 * HARD DELETE ALLOWED:
 * Unlike terminals/berths, cargo capabilities can be permanently deleted.
 * No complex dependencies, operational history not critical at this granularity.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import SearchableSelect from '../ui/SearchableSelect';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function VesselCargoCapabilityView({ vesselId, vesselPublicId }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCapability, setEditingCapability] = useState(null);
  const [deletingCapability, setDeletingCapability] = useState(null);
  const [formData, setFormData] = useState({
    cargoTypeRefId: '',
    capacityValue: 0,
    capacityUnit: 'm3',
    capacityBasis: 'NOMINAL',
    notes: '',
    isActive: true
  });

  const { data: capabilities = [], isLoading } = useQuery({
    queryKey: ['vesselCargoCapabilities', vesselId],
    queryFn: async () => {
      const all = await base44.entities.VesselCargoCapability.list();
      return all.filter(c => c.vesselId === vesselId);
    }
  });

  const { data: cargoTypes = [] } = useQuery({
    queryKey: ['cargoTypes'],
    queryFn: () => base44.entities.CargoTypeRef.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const cargoType = cargoTypes.find(ct => ct.id === data.cargoTypeRefId);
      return base44.entities.VesselCargoCapability.create({
        ...data,
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        vesselId,
        vesselPublicId,
        cargoTypeRefPublicId: cargoType?.publicId,
        capacityValue: parseFloat(data.capacityValue) || 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselCargoCapabilities', vesselId]);
      setShowDialog(false);
      resetForm();
      toast.success('Capability saved');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VesselCargoCapability.update(id, {
      ...data,
      capacityValue: parseFloat(data.capacityValue) || 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselCargoCapabilities', vesselId]);
      setShowDialog(false);
      setEditingCapability(null);
      resetForm();
      toast.success('Capability updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VesselCargoCapability.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselCargoCapabilities', vesselId]);
      setDeletingCapability(null);
      toast.success('Capability deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      cargoTypeRefId: '',
      capacityValue: 0,
      capacityUnit: 'm3',
      capacityBasis: 'NOMINAL',
      notes: '',
      isActive: true
    });
  };

  const handleAdd = () => {
    setEditingCapability(null);
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (capability) => {
    setEditingCapability(capability);
    setFormData({
      cargoTypeRefId: capability.cargoTypeRefId,
      capacityValue: capability.capacityValue || 0,
      capacityUnit: capability.capacityUnit || 'm3',
      capacityBasis: capability.capacityBasis || 'NOMINAL',
      notes: capability.notes || '',
      isActive: capability.isActive !== false
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCapability) {
      updateMutation.mutate({ id: editingCapability.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCargoTypeName = (id) => {
    const ct = cargoTypes.find(c => c.id === id);
    return ct ? ct.name : '-';
  };

  const getCargoTypeCategory = (id) => {
    const ct = cargoTypes.find(c => c.id === id);
    return ct ? ct.cargoCategory : '';
  };

  const filteredCapabilities = capabilities.filter(cap => {
    if (!searchQuery) return true;
    const cargoName = getCargoTypeName(cap.cargoTypeRefId).toLowerCase();
    return cargoName.includes(searchQuery.toLowerCase());
  });

  const categoryColors = {
    GAS: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    LIQUID_BULK: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    DRY_BULK: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    CONTAINER: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    RORO: 'bg-green-500/10 text-green-600 border-green-500/30',
    PASSENGER: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
    GENERAL: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
    OTHER: 'bg-gray-500/10 text-gray-600 border-gray-500/30'
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cargo Capability</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Capability
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search cargo types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCapabilities.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {searchQuery ? 'No matching cargo capabilities' : 'No cargo capabilities configured'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Basis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCapabilities.map((cap) => (
                <TableRow key={cap.id}>
                  <TableCell className="font-medium">{getCargoTypeName(cap.cargoTypeRefId)}</TableCell>
                  <TableCell>
                    {getCargoTypeCategory(cap.cargoTypeRefId) && (
                      <Badge className={`${categoryColors[getCargoTypeCategory(cap.cargoTypeRefId)]} border text-xs`}>
                        {getCargoTypeCategory(cap.cargoTypeRefId)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{cap.capacityValue?.toLocaleString()}</TableCell>
                  <TableCell>{cap.capacityUnit}</TableCell>
                  <TableCell>{cap.capacityBasis || 'NOMINAL'}</TableCell>
                  <TableCell>
                    <Badge className={cap.isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border' 
                      : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'}>
                      {cap.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cap)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingCapability(cap)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCapability ? 'Edit Capability' : 'Add Capability'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Cargo Type *</Label>
              <SearchableSelect
                value={formData.cargoTypeRefId}
                onValueChange={(v) => {
                  const cargo = cargoTypes.find(ct => ct.id === v);
                  setFormData({
                    ...formData, 
                    cargoTypeRefId: v,
                    capacityUnit: cargo?.defaultUnit || 'm3'
                  });
                }}
                options={cargoTypes.filter(ct => ct.isActive !== false).map(ct => ({ value: ct.id, label: ct.name }))}
                placeholder="Select cargo type"
                disabled={!!editingCapability}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Capacity Value *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.capacityValue}
                  onChange={(e) => setFormData({...formData, capacityValue: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Unit *</Label>
                <Select value={formData.capacityUnit} onValueChange={(v) => setFormData({...formData, capacityUnit: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Label>Basis</Label>
                <Select value={formData.capacityBasis} onValueChange={(v) => setFormData({...formData, capacityBasis: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESIGN">Design</SelectItem>
                    <SelectItem value="NOMINAL">Nominal</SelectItem>
                    <SelectItem value="TYPICAL">Typical</SelectItem>
                    <SelectItem value="MAX">Max</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editingCapability ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCapability} onOpenChange={() => setDeletingCapability(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Capability</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingCapability.id)} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}