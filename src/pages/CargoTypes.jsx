/**
 * Cargo Types List Page (Vessel Cargo Classification)
 * 
 * PURPOSE:
 * Registry of cargo classifications that vessels can carry.
 * Used in vessel capability definition and compatibility matching.
 * 
 * DOMAIN CONTEXT:
 * 
 * CARGO TYPE vs PRODUCT TYPE RELATIONSHIP:
 * 
 * CARGO TYPE (this page):
 * - Vessel-side classification
 * - What vessels are designed to carry
 * - Examples: LNG, Crude Oil, Containers, Passengers
 * 
 * PRODUCT TYPE (ProductTypes page):
 * - Terminal/berth-side classification
 * - What facilities can handle
 * - Examples: LNG, Crude Oil, Refined Products
 * 
 * LINKING:
 * Cargo types can link to product types (productTypeId).
 * Enables automated compatibility matching.
 * 
 * FIELDS DISPLAYED:
 * 
 * 1. CODE (line 171, 182):
 *    Short identifier for APIs and reports.
 * 
 * 2. NAME (line 172, 183):
 *    Full descriptive name for UI.
 * 
 * 3. CATEGORY (line 173, 184-189):
 *    High-level classification with color coding.
 *    
 *    CATEGORIES:
 *    - GAS: Cyan (LNG, LPG, natural gas)
 *    - LIQUID_BULK: Blue (oil, chemicals)
 *    - DRY_BULK: Amber (coal, grain, ore)
 *    - CONTAINER: Purple (containerized cargo)
 *    - RORO: Green (vehicles, wheeled cargo)
 *    - PASSENGER: Pink (people transport)
 *    - GENERAL: Slate (general cargo)
 *    - OTHER: Gray (miscellaneous)
 * 
 * 4. DEFAULT UNIT (line 174, 191):
 *    Measurement unit for this cargo type.
 *    m³, MT, TEU, CEU, pax, lane_meters.
 * 
 * COLOR CODING SYSTEM (lines 57-66):
 * Each category has unique color scheme.
 * Consistent across list, grid, and compact views.
 * Helps users quickly identify cargo families.
 * 
 * THREE VIEW MODES:
 * - List: Full table with all details
 * - Grid: Card-based for visual browsing
 * - Compact: Condensed for space efficiency
 * 
 * HARD DELETE (lines 28-38):
 * Uses actual delete, not soft delete.
 * 
 * RATIONALE:
 * Cargo types rarely deleted.
 * If deleted, usually data entry error.
 * Existing vessel capabilities may reference (orphaning acceptable).
 * 
 * SORT PRIORITY (lines 50-55):
 * 1. Primary: sortOrder field
 * 2. Secondary: Alphabetical by code
 * 
 * Allows admin to prioritize common cargo types.
 * 
 * SEED DATA BUTTON (lines 90-92):
 * Quick access to SeedCargoTypes utility.
 * Populates standard maritime cargo classifications.
 * Reduces manual data entry for new installations.
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, List, Grid3x3, LayoutList, X, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CargoTypes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [deletingCargo, setDeletingCargo] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const { data: cargoTypes = [], isLoading } = useQuery({
    queryKey: ['cargoTypes'],
    queryFn: () => base44.entities.CargoTypeRef.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CargoTypeRef.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargoTypes'] });
      setDeletingCargo(null);
      toast.success('Cargo type deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });

  const filteredCargos = cargoTypes
    .filter(ct => {
      const matchesSearch = !searchQuery || 
        ct.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ct.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && ct.isActive !== false) ||
        (statusFilter === 'inactive' && ct.isActive === false);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      return (a.code || '').localeCompare(b.code || '');
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
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cargo Types</h1>
            <p className="text-sm text-gray-600 mt-1">Manage cargo type reference data</p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('SeedCargoTypes')}>
              <Button variant="outline">Seed Data</Button>
            </Link>
            <Link to={createPageUrl('AddCargoType')}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Cargo Type
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search cargo types..."
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

      {filteredCargos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'No cargo types found'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Code</TableHead>
                  <TableHead className="text-gray-600">Name</TableHead>
                  <TableHead className="text-gray-600">Category</TableHead>
                  <TableHead className="text-gray-600">Default Unit</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCargos.map((ct) => (
                  <TableRow key={ct.id} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{ct.code}</TableCell>
                    <TableCell className="text-gray-700">{ct.name}</TableCell>
                    <TableCell>
                      {ct.cargoCategory && (
                        <Badge className={`${categoryColors[ct.cargoCategory]} border`}>
                          {ct.cargoCategory}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700">{ct.defaultUnit}</TableCell>
                    <TableCell>
                      <Badge className={ct.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border' 
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'}>
                        {ct.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={createPageUrl(`EditCargoType?id=${ct.id}`)}>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setDeletingCargo(ct)}
                        >
                          <Trash2 className="w-4 h-4" />
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
          {filteredCargos.map((ct) => (
            <Card key={ct.id} className="bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{ct.code}</h3>
                    <p className="text-sm text-gray-600">{ct.name}</p>
                  </div>
                  <Badge className={ct.isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                    : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                    {ct.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-2 mb-3">
                  {ct.cargoCategory && (
                    <Badge className={`${categoryColors[ct.cargoCategory]} border text-xs`}>
                      {ct.cargoCategory}
                    </Badge>
                  )}
                  <p className="text-xs text-gray-600">Unit: {ct.defaultUnit}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link to={createPageUrl(`EditCargoType?id=${ct.id}`)}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingCargo(ct)}>
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
              {filteredCargos.map((ct) => (
                <div key={ct.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{ct.code}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-700">{ct.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {ct.cargoCategory && (
                        <Badge className={`${categoryColors[ct.cargoCategory]} border text-xs`}>
                          {ct.cargoCategory}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-600">{ct.defaultUnit}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={ct.isActive 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                      : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                      {ct.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Link to={createPageUrl(`EditCargoType?id=${ct.id}`)}>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingCargo(ct)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deletingCargo} onOpenChange={() => setDeletingCargo(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cargo Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCargo?.code} - {deletingCargo?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingCargo.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}