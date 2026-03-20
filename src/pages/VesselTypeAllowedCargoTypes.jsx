/**
 * Vessel Type Allowed Cargo Types Page (Cargo Capability Matrix)
 * 
 * PURPOSE:
 * Define which cargo types each vessel type can carry.
 * Foundation for vessel-terminal cargo compatibility matching.
 * 
 * DOMAIN CONTEXT - CARGO RESTRICTIONS:
 * 
 * Physical and regulatory limits on cargo:
 * - LNG carriers: LNG only (specialized tanks)
 * - Oil tankers (crude): Crude oil primarily (dedicated crude fleet)
 * - Chemical tankers: Multiple chemical products (IMO Type 1/2/3 certified)
 * - Container ships: Containerized cargo only
 * - Passenger ships: Passengers (not cargo in traditional sense)
 * 
 * COMPATIBILITY MATCHING FLOW:
 * 
 * 1. Terminal has productTypeId = "LNG"
 * 2. Vessel type has allowedCargoType where cargoType.productTypeId = "LNG"
 * 3. Match found → Vessel can call at terminal
 * 4. No match → Vessel cannot handle terminal's product
 * 
 * EXAMPLE SCENARIO:
 * - Terminal: "Ras Laffan LNG" (productType = LNG)
 * - Vessel: "Q-Max LNG Carrier" (allowedCargoTypes includes LNG cargo type)
 * - CargoTypeRef "LNG" links to ProductTypeRef "LNG"
 * - System matches → Compatible
 * 
 * SIMPLE MAPPING:
 * VesselTypeRef + CargoTypeRef → Allowed/Not Allowed
 * 
 * Same pattern as fuel types, different domain.
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Trash2, X, List, Grid3x3, LayoutList, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableSelect from '../components/ui/SearchableSelect';
import { toast } from 'sonner';

export default function VesselTypeAllowedCargoTypes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [vesselTypeFilter, setVesselTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [viewMode, setViewMode] = useState('list');
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    vesselTypeRefId: '',
    cargoTypeRefId: '',
    isAllowed: true,
    isActive: true
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['allowedCargoTypes'],
    queryFn: () => base44.entities.VesselTypeAllowedCargoType.list()
  });

  const { data: vesselTypes = [] } = useQuery({
    queryKey: ['vesselTypes'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const { data: cargoTypes = [] } = useQuery({
    queryKey: ['cargoTypes'],
    queryFn: () => base44.entities.CargoTypeRef.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const vesselType = vesselTypes.find(vt => vt.id === data.vesselTypeRefId);
      const cargoType = cargoTypes.find(ct => ct.id === data.cargoTypeRefId);
      return base44.entities.VesselTypeAllowedCargoType.create({
        ...data,
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        vesselTypeRefPublicId: vesselType?.publicId,
        cargoTypeRefPublicId: cargoType?.publicId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allowedCargoTypes']);
      setShowDialog(false);
      resetForm();
      toast.success('Cargo type allowed');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VesselTypeAllowedCargoType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['allowedCargoTypes']);
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
      cargoTypeRefId: '',
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

  const getCargoTypeName = (id) => {
    const ct = cargoTypes.find(c => c.id === id);
    return ct ? ct.name : '-';
  };

  const filteredRecords = records
    .filter(r => {
      const matchesVesselType = vesselTypeFilter === 'all' || r.vesselTypeRefId === vesselTypeFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && r.isActive !== false) ||
        (statusFilter === 'inactive' && r.isActive === false);
      const vName = getVesselTypeName(r.vesselTypeRefId).toLowerCase();
      const cName = getCargoTypeName(r.cargoTypeRefId).toLowerCase();
      const matchesSearch = !searchQuery || 
        vName.includes(searchQuery.toLowerCase()) ||
        cName.includes(searchQuery.toLowerCase());
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
            <h1 className="text-2xl font-bold text-gray-900">Vessel Type Allowed Cargo Types</h1>
            <p className="text-sm text-gray-600 mt-1">Define which cargo types are allowed per vessel type</p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('SeedVesselTypeAllowedCargoTypes')}>
              <Button variant="outline">Seed Data</Button>
            </Link>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Allowed Cargo
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
          <p className="text-gray-600 mb-6">No allowed cargo types configured</p>
        </div>
      ) : viewMode === 'list' ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Vessel Type</TableHead>
                  <TableHead className="text-gray-600">Cargo Type</TableHead>
                  <TableHead className="text-gray-600">Allowed</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{getVesselTypeName(record.vesselTypeRefId)}</TableCell>
                    <TableCell className="text-gray-700">{getCargoTypeName(record.cargoTypeRefId)}</TableCell>
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
                    <p className="text-sm text-gray-600">{getCargoTypeName(record.cargoTypeRefId)}</p>
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
                      <span className="text-gray-700">{getCargoTypeName(record.cargoTypeRefId)}</span>
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
            <DialogTitle>Add Allowed Cargo Type</DialogTitle>
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
              <Label>Cargo Type *</Label>
              <SearchableSelect
                value={formData.cargoTypeRefId}
                onValueChange={(v) => setFormData({...formData, cargoTypeRefId: v})}
                options={cargoTypes.map(ct => ({ value: ct.id, label: ct.name }))}
                placeholder="Select cargo type"
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