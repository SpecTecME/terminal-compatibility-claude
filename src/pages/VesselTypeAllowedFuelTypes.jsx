/**
 * Vessel Type Allowed Fuel Types Page (Fuel Capability Matrix)
 * 
 * PURPOSE:
 * Define which fuel types each vessel type can use.
 * Whitelist pattern for vessel fuel capabilities.
 * 
 * DOMAIN CONTEXT - VESSEL FUEL RESTRICTIONS:
 * 
 * Not all vessels can use all fuels:
 * - LNG carriers: Can use LNG, MGO (dual-fuel engines)
 * - Oil tankers: MGO, HFO, VLSFO only (no LNG tanks)
 * - Modern vessels: LNG + traditional fuels (dual-fuel capability)
 * - Legacy vessels: HFO/MGO only (single-fuel systems)
 * 
 * MAPPING PATTERN:
 * VesselTypeRef + FuelTypeRef → Allowed/Not Allowed
 * 
 * EXAMPLES:
 * - "LNG Carrier | Q-Max" + "LNG" → ALLOWED
 * - "LNG Carrier | Q-Max" + "MGO" → ALLOWED (aux engines)
 * - "Oil Tanker | VLCC" + "LNG" → NOT ALLOWED (no infrastructure)
 * 
 * SIMPLE FIELDS:
 * 
 * VESSEL TYPE (line 238, 248):
 * Which vessel type this applies to.
 * 
 * FUEL TYPE (line 239, 249):
 * Which fuel this rule concerns.
 * 
 * ALLOWED (line 240, 250):
 * ✓ = Can use this fuel
 * ✗ = Cannot use this fuel
 * 
 * QUESTION: Why track "not allowed"?
 * ANSWER: Explicit blocking for edge cases.
 * Default assumption: If not listed, unclear.
 * Explicit "not allowed" = definitive answer.
 * 
 * HARD DELETE (lines 73-83):
 * Permanent deletion.
 * Low risk (configuration data, can recreate).
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Trash2, X, List, Grid3x3, LayoutList, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableSelect from '../components/ui/SearchableSelect';
import { toast } from 'sonner';

export default function VesselTypeAllowedFuelTypes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [vesselTypeFilter, setVesselTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [viewMode, setViewMode] = useState('list');
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    vesselTypeRefId: '',
    fuelTypeRefId: '',
    isAllowed: true,
    isActive: true
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['allowedFuelTypes'],
    queryFn: () => base44.entities.VesselTypeAllowedFuelType.list()
  });

  const { data: vesselTypes = [] } = useQuery({
    queryKey: ['vesselTypes'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const { data: fuelTypes = [] } = useQuery({
    queryKey: ['fuelTypes'],
    queryFn: () => base44.entities.FuelTypeRef.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const vesselType = vesselTypes.find(vt => vt.id === data.vesselTypeRefId);
      const fuelType = fuelTypes.find(ft => ft.id === data.fuelTypeRefId);
      return base44.entities.VesselTypeAllowedFuelType.create({
        ...data,
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        vesselTypeRefPublicId: vesselType?.publicId,
        fuelTypeRefPublicId: fuelType?.publicId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allowedFuelTypes']);
      setShowDialog(false);
      resetForm();
      toast.success('Fuel type allowed');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VesselTypeAllowedFuelType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['allowedFuelTypes']);
      setDeletingRecord(null);
      toast.success('Record deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      vesselTypeRefId: '',
      fuelTypeRefId: '',
      isAllowed: true,
      isActive: true
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getVesselTypeName = (id) => {
    const vt = vesselTypes.find(v => v.id === id);
    return vt ? `${vt.primaryType} | ${vt.subType}` : '-';
  };

  const getFuelTypeName = (id) => {
    const ft = fuelTypes.find(f => f.id === id);
    return ft ? ft.code : '-';
  };

  const filteredRecords = records
    .filter(r => {
      const matchesVesselType = vesselTypeFilter === 'all' || r.vesselTypeRefId === vesselTypeFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && r.isActive !== false) ||
        (statusFilter === 'inactive' && r.isActive === false);
      const vName = getVesselTypeName(r.vesselTypeRefId).toLowerCase();
      const fName = getFuelTypeName(r.fuelTypeRefId).toLowerCase();
      const matchesSearch = !searchQuery || 
        vName.includes(searchQuery.toLowerCase()) ||
        fName.includes(searchQuery.toLowerCase());
      return matchesVesselType && matchesStatus && matchesSearch;
    });

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
        <Link to={createPageUrl('ConfigurationVesselConfig')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vessel Type Allowed Fuel Types</h1>
            <p className="text-sm text-gray-600 mt-1">Define which fuel types are allowed per vessel type</p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('SeedVesselTypeAllowedFuelTypes')}>
              <Button variant="outline">Seed Data</Button>
            </Link>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Allowed Fuel
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-white border-gray-300"
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
        <Select value={vesselTypeFilter} onValueChange={setVesselTypeFilter}>
          <SelectTrigger className="w-48 bg-white border-gray-300">
            <SelectValue placeholder="Filter by Vessel Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vessel Types</SelectItem>
            {vesselTypes.map(vt => (
              <SelectItem key={vt.id} value={vt.id}>{vt.primaryType} | {vt.subType}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-cyan-600 text-white border-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-cyan-600 text-white border-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('compact')}
            className={viewMode === 'compact' ? 'bg-cyan-600 text-white border-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-6">No allowed fuel types configured</p>
        </div>
      ) : viewMode === 'list' ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Vessel Type</TableHead>
                  <TableHead className="text-gray-600">Fuel Type</TableHead>
                  <TableHead className="text-gray-600">Allowed</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{getVesselTypeName(record.vesselTypeRefId)}</TableCell>
                    <TableCell className="text-gray-700">{getFuelTypeName(record.fuelTypeRefId)}</TableCell>
                    <TableCell>{record.isAllowed ? '✓' : '✗'}</TableCell>
                    <TableCell>
                      <Badge className={record.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border' 
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'}>
                        {record.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDeletingRecord(record)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{getVesselTypeName(record.vesselTypeRefId)}</h3>
                    <p className="text-sm text-gray-600">{getFuelTypeName(record.fuelTypeRefId)}</p>
                  </div>
                  <Badge className={record.isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                    : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                    {record.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-600">{record.isAllowed ? '✓ Allowed' : '✗ Not Allowed'}</span>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingRecord(record)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{getVesselTypeName(record.vesselTypeRefId)}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-700">{getFuelTypeName(record.fuelTypeRefId)}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {record.isAllowed ? '✓ Allowed' : '✗ Not Allowed'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={record.isActive 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                      : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                      {record.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingRecord(record)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle>Add Allowed Fuel Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Vessel Type *</Label>
              <SearchableSelect
                value={formData.vesselTypeRefId}
                onValueChange={(v) => setFormData({...formData, vesselTypeRefId: v})}
                options={vesselTypes.map(vt => ({ value: vt.id, label: `${vt.primaryType} | ${vt.subType}` }))}
                placeholder="Select vessel type"
              />
            </div>
            <div>
              <Label>Fuel Type *</Label>
              <SearchableSelect
                value={formData.fuelTypeRefId}
                onValueChange={(v) => setFormData({...formData, fuelTypeRefId: v})}
                options={fuelTypes.map(ft => ({ value: ft.id, label: ft.code }))}
                placeholder="Select fuel type"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="isAllowed" checked={formData.isAllowed} onCheckedChange={(c) => setFormData({...formData, isAllowed: c})} />
                <Label htmlFor="isAllowed" className="cursor-pointer">Allowed</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="isActive" checked={formData.isActive} onCheckedChange={(c) => setFormData({...formData, isActive: c})} />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingRecord} onOpenChange={() => setDeletingRecord(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingRecord.id)} className="bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}