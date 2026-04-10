/**
 * Fuel Types List Page (Vessel Fuel Classification)
 * 
 * PURPOSE:
 * Registry of fuel types that vessels use for propulsion and auxiliary power.
 * Critical for environmental compliance and operational planning.
 * 
 * DOMAIN CONTEXT - MARITIME FUELS:
 * 
 * FUEL REGULATIONS:
 * IMO 2020 sulfur cap changed fuel landscape:
 * - Traditional HFO (High Sulfur) → restricted
 * - VLSFO (Very Low Sulfur) → standard
 * - LNG fuel → growing adoption (dual-fuel engines)
 * - Methanol/Ammonia → future zero-carbon fuels
 * 
 * FUEL CATEGORIES (lines 57-63):
 * 
 * 1. GAS:
 *    - LNG (Liquefied Natural Gas)
 *    - CNG (Compressed Natural Gas)
 *    - Boil-off gas
 * 
 * 2. DISTILLATE:
 *    - MGO (Marine Gas Oil)
 *    - MDO (Marine Diesel Oil)
 *    - ULSFO (Ultra Low Sulfur Fuel Oil)
 *    - Cleaner-burning, more expensive
 * 
 * 3. RESIDUAL:
 *    - HFO (Heavy Fuel Oil)
 *    - IFO (Intermediate Fuel Oil)
 *    - VLSFO (Very Low Sulfur Fuel Oil)
 *    - Viscous, requires heating
 * 
 * 4. ALCOHOL:
 *    - Methanol
 *    - Ethanol
 *    - Alternative fuels, emerging technology
 * 
 * 5. OTHER:
 *    - Ammonia (zero-carbon future fuel)
 *    - Hydrogen
 *    - Biodiesel
 * 
 * SPECIAL CHARACTERISTICS:
 * 
 * HEATING REQUIRED (line 171, 189-197):
 * Indicates if fuel must be heated for use.
 * 
 * EXAMPLES:
 * - HFO: YES (too viscous at ambient temp)
 * - VLSFO: YES (viscosity management)
 * - MGO: NO (flows at normal temp)
 * - LNG: NO (cryogenic, different issue)
 * 
 * VISUAL: Flame icon (orange) for heated fuels.
 * 
 * CRYOGENIC FLAG (line 172, 199-208):
 * Indicates ultra-low temperature storage needed.
 * 
 * EXAMPLES:
 * - LNG: YES (-162°C)
 * - Ammonia: YES (-33°C)
 * - MGO: NO (ambient storage)
 * - HFO: NO (heated, not cooled)
 * 
 * VISUAL: Snowflake icon (cyan) for cryogenic fuels.
 * 
 * IMPORTANCE:
 * - Tank insulation requirements
 * - Safety protocols
 * - Boil-off management (for cryogenic)
 * - Equipment specifications
 * 
 * DUAL INDICATORS IN GRID/COMPACT (lines 261-274, 309-320):
 * Both heating and cryogenic shown as badges.
 * LNG fuel could theoretically show cryogenic only.
 * Some fuels might need both (edge cases).
 * 
 * HARD DELETE (lines 28-38):
 * Actual deletion, not soft delete.
 * Same rationale as cargo types.
 * 
 * SORT ORDER (lines 50-55):
 * Primary by sortOrder, secondary by code.
 * Prioritizes common fuels at top of lists.
 * 
 * SEED DATA BUTTON (lines 87-89):
 * Links to SeedFuelTypes utility page.
 * Populates standard maritime fuel classifications.
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
import { Plus, Search, Edit, Trash2, List, Grid3x3, LayoutList, X, Flame, Snowflake } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function FuelTypes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [deletingFuel, setDeletingFuel] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const { data: fuelTypes = [], isLoading } = useQuery({
    queryKey: ['fuelTypes'],
    queryFn: () => base44.entities.FuelTypeRef.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FuelTypeRef.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['fuelTypes']);
      setDeletingFuel(null);
      toast.success('Fuel type deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });

  const filteredFuels = fuelTypes
    .filter(ft => {
      const matchesSearch = !searchQuery || 
        ft.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ft.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && ft.isActive !== false) ||
        (statusFilter === 'inactive' && ft.isActive === false);
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
    DISTILLATE: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    RESIDUAL: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    ALCOHOL: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
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
            <h1 className="text-2xl font-bold text-gray-900">Fuel Types</h1>
            <p className="text-sm text-gray-600 mt-1">Manage fuel type reference data</p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('SeedFuelTypes')}>
              <Button variant="outline">Seed Data</Button>
            </Link>
            <Link to={createPageUrl('AddFuelType')}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Fuel Type
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search fuel types..."
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

      {filteredFuels.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'No fuel types found'}
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
                  <TableHead className="text-gray-600">Heating Required</TableHead>
                  <TableHead className="text-gray-600">Cryogenic</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuels.map((ft) => (
                  <TableRow key={ft.id} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{ft.code}</TableCell>
                    <TableCell className="text-gray-700">{ft.name}</TableCell>
                    <TableCell>
                      {ft.category && (
                        <Badge className={`${categoryColors[ft.category]} border`}>
                          {ft.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {ft.heatingRequired ? (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Flame className="w-4 h-4" />
                          <span className="text-sm">Yes</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ft.isCryogenic ? (
                        <div className="flex items-center gap-1 text-cyan-600">
                          <Snowflake className="w-4 h-4" />
                          <span className="text-sm">Yes</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={ft.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border' 
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'}>
                        {ft.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={createPageUrl(`EditFuelType?id=${ft.id}`)}>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setDeletingFuel(ft)}
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
          {filteredFuels.map((ft) => (
            <Card key={ft.id} className="bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{ft.code}</h3>
                    <p className="text-sm text-gray-600">{ft.name}</p>
                  </div>
                  <Badge className={ft.isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                    : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                    {ft.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-2 mb-3">
                  {ft.category && (
                    <Badge className={`${categoryColors[ft.category]} border text-xs`}>
                      {ft.category}
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    {ft.heatingRequired && (
                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 border text-xs">
                        <Flame className="w-3 h-3 mr-1" />
                        Heating
                      </Badge>
                    )}
                    {ft.isCryogenic && (
                      <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30 border text-xs">
                        <Snowflake className="w-3 h-3 mr-1" />
                        Cryogenic
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link to={createPageUrl(`EditFuelType?id=${ft.id}`)}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingFuel(ft)}>
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
              {filteredFuels.map((ft) => (
                <div key={ft.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{ft.code}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-700">{ft.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {ft.category && (
                        <Badge className={`${categoryColors[ft.category]} border text-xs`}>
                          {ft.category}
                        </Badge>
                      )}
                      {ft.heatingRequired && (
                        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 border text-xs">
                          <Flame className="w-3 h-3 mr-1" />
                          Heating
                        </Badge>
                      )}
                      {ft.isCryogenic && (
                        <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30 border text-xs">
                          <Snowflake className="w-3 h-3 mr-1" />
                          Cryogenic
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={ft.isActive 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                      : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                      {ft.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Link to={createPageUrl(`EditFuelType?id=${ft.id}`)}>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingFuel(ft)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deletingFuel} onOpenChange={() => setDeletingFuel(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fuel Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingFuel?.code} - {deletingFuel?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingFuel.id)}
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