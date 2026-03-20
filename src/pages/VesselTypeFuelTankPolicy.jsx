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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, X, List, Grid3x3, LayoutList, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableSelect from '../components/ui/SearchableSelect';
import { toast } from 'sonner';

export default function VesselTypeFuelTankPolicy() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [vesselTypeFilter, setVesselTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [viewMode, setViewMode] = useState('list');
  const [deletingPolicy, setDeletingPolicy] = useState(null);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    vesselTypeRefId: '',
    fuelTypeRefId: '',
    tankRole: 'STORAGE',
    isAllowed: true,
    isDefault: false,
    minCount: 0,
    recommendedCount: 0,
    notes: '',
    isActive: true
  });

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['fuelTankPolicies'],
    queryFn: () => base44.entities.VesselTypeFuelTankPolicy.list()
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
      return base44.entities.VesselTypeFuelTankPolicy.create({
        ...data,
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        vesselTypeRefPublicId: vesselType?.publicId,
        fuelTypeRefPublicId: fuelType?.publicId,
        minCount: parseInt(data.minCount) || null,
        recommendedCount: parseInt(data.recommendedCount) || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fuelTankPolicies']);
      setShowDialog(false);
      setEditingPolicy(null);
      resetForm();
      toast.success('Policy saved');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VesselTypeFuelTankPolicy.update(id, {
      ...data,
      minCount: parseInt(data.minCount) || null,
      recommendedCount: parseInt(data.recommendedCount) || null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['fuelTankPolicies']);
      setShowDialog(false);
      setEditingPolicy(null);
      resetForm();
      toast.success('Policy updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VesselTypeFuelTankPolicy.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['fuelTankPolicies']);
      setDeletingPolicy(null);
      toast.success('Policy deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      vesselTypeRefId: '',
      fuelTypeRefId: '',
      tankRole: 'STORAGE',
      isAllowed: true,
      isDefault: false,
      minCount: 0,
      recommendedCount: 0,
      notes: '',
      isActive: true
    });
  };

  const handleAdd = () => {
    setEditingPolicy(null);
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      vesselTypeRefId: policy.vesselTypeRefId,
      fuelTypeRefId: policy.fuelTypeRefId,
      tankRole: policy.tankRole,
      isAllowed: policy.isAllowed !== false,
      isDefault: policy.isDefault || false,
      minCount: policy.minCount || 0,
      recommendedCount: policy.recommendedCount || 0,
      notes: policy.notes || '',
      isActive: policy.isActive !== false
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getVesselTypeName = (id) => {
    const vt = vesselTypes.find(v => v.id === id);
    return vt ? `${vt.primaryType} | ${vt.subType}` : '-';
  };

  const getFuelTypeName = (id) => {
    const ft = fuelTypes.find(f => f.id === id);
    return ft ? ft.code : '-';
  };

  const filteredPolicies = policies
    .filter(p => {
      const matchesVesselType = vesselTypeFilter === 'all' || p.vesselTypeRefId === vesselTypeFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && p.isActive !== false) ||
        (statusFilter === 'inactive' && p.isActive === false);
      const vName = getVesselTypeName(p.vesselTypeRefId).toLowerCase();
      const fName = getFuelTypeName(p.fuelTypeRefId).toLowerCase();
      const matchesSearch = !searchQuery || 
        vName.includes(searchQuery.toLowerCase()) ||
        fName.includes(searchQuery.toLowerCase()) ||
        p.tankRole?.toLowerCase().includes(searchQuery.toLowerCase());
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
            <h1 className="text-2xl font-bold text-gray-900">Vessel Type Fuel Tank Policy</h1>
            <p className="text-sm text-gray-600 mt-1">Define fuel tank configurations per vessel type</p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('SeedVesselTypeFuelTankPolicy')}>
              <Button variant="outline">Seed Data</Button>
            </Link>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Policy
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search policies..."
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

      {filteredPolicies.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-6">No policies found</p>
        </div>
      ) : viewMode === 'list' ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Vessel Type</TableHead>
                  <TableHead className="text-gray-600">Fuel Type</TableHead>
                  <TableHead className="text-gray-600">Tank Role</TableHead>
                  <TableHead className="text-gray-600">Allowed</TableHead>
                  <TableHead className="text-gray-600">Default</TableHead>
                  <TableHead className="text-gray-600">Rec. Count</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((policy) => (
                  <TableRow key={policy.id} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{getVesselTypeName(policy.vesselTypeRefId)}</TableCell>
                    <TableCell className="text-gray-700">{getFuelTypeName(policy.fuelTypeRefId)}</TableCell>
                    <TableCell>
                      <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/30">
                        {policy.tankRole}
                      </Badge>
                    </TableCell>
                    <TableCell>{policy.isAllowed ? '✓' : '✗'}</TableCell>
                    <TableCell>{policy.isDefault ? '✓' : '—'}</TableCell>
                    <TableCell>{policy.recommendedCount || '—'}</TableCell>
                    <TableCell>
                      <Badge className={policy.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border' 
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(policy)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingPolicy(policy)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map((policy) => (
            <Card key={policy.id} className="bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{getVesselTypeName(policy.vesselTypeRefId)}</h3>
                    <p className="text-sm text-gray-600">{getFuelTypeName(policy.fuelTypeRefId)}</p>
                  </div>
                  <Badge className={policy.isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                    : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-2 mb-3">
                  <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/30 text-xs">
                    {policy.tankRole}
                  </Badge>
                  <div className="text-xs text-gray-600">
                    {policy.isDefault && <span className="mr-2">✓ Default</span>}
                    {policy.recommendedCount > 0 && <span>Rec: {policy.recommendedCount}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(policy)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingPolicy(policy)}>
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
              {filteredPolicies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{getVesselTypeName(policy.vesselTypeRefId)}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-700">{getFuelTypeName(policy.fuelTypeRefId)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/30 text-xs">
                        {policy.tankRole}
                      </Badge>
                      {policy.isDefault && <span className="text-xs text-gray-600">Default</span>}
                      {policy.recommendedCount > 0 && <span className="text-xs text-gray-600">Rec: {policy.recommendedCount}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={policy.isActive 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                      : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(policy)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingPolicy(policy)}>
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
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit Policy' : 'Add Policy'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vessel Type *</Label>
                <SearchableSelect
                  value={formData.vesselTypeRefId}
                  onValueChange={(v) => setFormData({...formData, vesselTypeRefId: v})}
                  options={vesselTypes.map(vt => ({ value: vt.id, label: `${vt.primaryType} | ${vt.subType}` }))}
                  placeholder="Select vessel type"
                  disabled={!!editingPolicy}
                />
              </div>
              <div>
                <Label>Fuel Type *</Label>
                <SearchableSelect
                  value={formData.fuelTypeRefId}
                  onValueChange={(v) => setFormData({...formData, fuelTypeRefId: v})}
                  options={fuelTypes.map(ft => ({ value: ft.id, label: ft.code }))}
                  placeholder="Select fuel type"
                  disabled={!!editingPolicy}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tank Role *</Label>
                <Select value={formData.tankRole} onValueChange={(v) => setFormData({...formData, tankRole: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STORAGE">Storage</SelectItem>
                    <SelectItem value="SERVICE_DAY_TANK">Service/Day Tank</SelectItem>
                    <SelectItem value="SETTLING">Settling</SelectItem>
                    <SelectItem value="DRAIN">Drain</SelectItem>
                    <SelectItem value="SLUDGE">Sludge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Min Count</Label>
                <Input type="number" value={formData.minCount} onChange={(e) => setFormData({...formData, minCount: e.target.value})} />
              </div>
              <div>
                <Label>Recommended Count</Label>
                <Input type="number" value={formData.recommendedCount} onChange={(e) => setFormData({...formData, recommendedCount: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="isAllowed" checked={formData.isAllowed} onCheckedChange={(c) => setFormData({...formData, isAllowed: c})} />
                <Label htmlFor="isAllowed" className="cursor-pointer">Allowed</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="isDefault" checked={formData.isDefault} onCheckedChange={(c) => setFormData({...formData, isDefault: c})} />
                <Label htmlFor="isDefault" className="cursor-pointer">Default</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="isActive" checked={formData.isActive} onCheckedChange={(c) => setFormData({...formData, isActive: c})} />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editingPolicy ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPolicy} onOpenChange={() => setDeletingPolicy(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingPolicy.id)} className="bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}