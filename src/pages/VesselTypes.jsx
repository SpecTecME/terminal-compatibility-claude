/**
 * Vessel Types List Page (Master Classification Data)
 * 
 * PURPOSE:
 * Registry of vessel classifications used throughout the system.
 * Provides standardized vessel categorization for compatibility matching and reporting.
 * 
 * DOMAIN CONTEXT - VESSEL CLASSIFICATION SYSTEM:
 * 
 * TWO-LEVEL HIERARCHY:
 * 
 * LEVEL 1 - PRIMARY TYPE (Functional Category):
 * Defines vessel's purpose and cargo handling:
 * - LNG Carrier (liquefied natural gas)
 * - Oil Tanker (Crude) (crude oil)
 * - Oil Tanker (Product) (refined products)
 * - Container Ship (containerized cargo)
 * - Bulk Carrier (dry bulk commodities)
 * - Chemical Tanker (liquid chemicals)
 * - LPG Carrier (liquefied petroleum gas)
 * - FSRU/FSU (Floating Storage/Regasification Units)
 * - Ro-Ro (Roll-on/Roll-off vehicle carriers)
 * - Passenger Ship
 * 
 * LEVEL 2 - SUB-TYPE (Size/Design Class):
 * Refines by capacity and design:
 * 
 * For LNG Carriers:
 * - Q-Max: 266,000-270,000 m³ (largest LNG carriers, Qatar-specific)
 * - Q-Flex: 210,000-217,000 m³ (Qatar fleet)
 * - Conventional Large: 145,000-180,000 m³
 * - Conventional Standard: 125,000-145,000 m³
 * - Small Scale: <50,000 m³ (regional/coastal)
 * 
 * For Oil Tankers:
 * - VLCC (Very Large Crude Carrier): 200,000+ DWT
 * - Suezmax: 120,000-200,000 DWT (Suez Canal limit)
 * - Aframax: 80,000-120,000 DWT
 * - Panamax: 60,000-80,000 DWT (Panama Canal limit)
 * 
 * SIZE METRICS (line 167, 238-242):
 * 
 * Different vessel types measured differently:
 * - DWT (Deadweight Tonnage): Oil tankers, bulk carriers
 * - m³ (Cubic meters): LNG/LPG carriers (gas measured by volume)
 * - TEU (Twenty-foot Equivalent Units): Container ships
 * - pax (Passengers): Passenger ships
 * - LOA_m (Length Overall): Some specialized vessels
 * - CEU (Car Equivalent Units): Car carriers
 * 
 * SIZE METRIC + TYPICAL RANGE:
 * "DWT" + "120,000–200,000" = Suezmax tanker specification.
 * Critical for compatibility matching and berth planning.
 * 
 * CAPABILITIES SECTIONS (line 169, 187-189):
 * 
 * Comma-separated list of capability categories this vessel type has.
 * 
 * EXAMPLES:
 * - LNG Carrier: "Cargo System,Manifold,Mooring,Fender,Environmental"
 * - FSRU: "Cargo System,Manifold,Regasification,Mooring,Fender"
 * - Container Ship: "Cargo Handling,Mooring,Fender" (no manifold - containers not liquid)
 * 
 * USAGE:
 * Drives which tabs/sections appear in vessel detail pages.
 * FSRU shows regasification specs, conventional LNG carrier doesn't.
 * Dynamic UI generation based on vessel type capabilities.
 * 
 * HARD DELETE (lines 28-38):
 * 
 * VesselTypeRef uses HARD DELETE, not soft delete.
 * 
 * RATIONALE:
 * - Master data, rarely deleted
 * - If deleted, typically configuration error
 * - Vessels reference types (orphaning acceptable if type was mistake)
 * 
 * RISK:
 * Existing vessels may reference deleted type.
 * Display shows type name from vessel's stored copy.
 * TODO: Prevent deletion if vessels exist with this type.
 * 
 * SEED BUTTONS (lines 80-82):
 * Link to SeedVesselTypeFSRUFSU page.
 * Convenience for populating FSRU/FSU vessel type data.
 * Specialized vessel types not in standard seed data.
 * 
 * DEFINING CHARACTERISTICS (line 245-247):
 * Free-text field describing what makes this vessel type unique.
 * Example for Q-Max: "World's largest LNG carriers, purpose-built for Qatar export terminals, membrane containment, Qatar Petroleum specification".
 * 
 * Helps users understand vessel type without external research.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Grid3x3, List, LayoutList, X, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function VesselTypes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [deletingType, setDeletingType] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const { data: vesselTypes = [], isLoading } = useQuery({
    queryKey: ['vesselTypes'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VesselTypeRef.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vesselTypes']);
      setDeletingType(null);
      toast.success('Vessel type deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });

  const filteredTypes = vesselTypes
    .filter(vt => {
      const matchesSearch = !searchQuery || 
        vt.primaryType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vt.subType?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && vt.isActive !== false) ||
        (statusFilter === 'inactive' && vt.isActive === false);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      return (a.primaryType || '').localeCompare(b.primaryType || '') || 
             (a.subType || '').localeCompare(b.subType || '');
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
            <h1 className="text-2xl font-bold text-gray-900">Vessel Types</h1>
            <p className="text-sm text-gray-600 mt-1">Manage vessel type reference data</p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('SeedVesselTypeFSRUFSU')}>
              <Button variant="outline">Seed FSRU/FSU</Button>
            </Link>
            <Link to={createPageUrl('AddVesselType')}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Vessel Type
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search vessel types..."
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

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTypes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'No vessel types found'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Primary Type</TableHead>
                  <TableHead className="text-gray-600">Sub-Type / Size Class</TableHead>
                  <TableHead className="text-gray-600">Size Metric</TableHead>
                  <TableHead className="text-gray-600">Typical Size Range</TableHead>
                  <TableHead className="text-gray-600">Capabilities</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((vt) => (
                  <TableRow key={vt.id} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{vt.primaryType}</TableCell>
                    <TableCell className="text-gray-700">{vt.subType}</TableCell>
                    <TableCell>
                      {vt.sizeMetric && (
                        <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/30">
                          {vt.sizeMetric}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700">{vt.typicalSizeRange || '-'}</TableCell>
                    <TableCell className="text-gray-700 max-w-xs truncate">
                      {vt.capabilitiesSections || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={vt.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border' 
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'}>
                        {vt.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={createPageUrl(`EditVesselType?id=${vt.id}`)}>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setDeletingType(vt)}
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
          {filteredTypes.map((vt) => (
            <Card key={vt.id} className="bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{vt.primaryType}</h3>
                    <p className="text-sm text-gray-600">{vt.subType}</p>
                  </div>
                  <Badge className={vt.isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                    : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                    {vt.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-2 mb-3">
                  {vt.sizeMetric && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/30 text-xs">
                        {vt.sizeMetric}
                      </Badge>
                      <span className="text-sm text-gray-600">{vt.typicalSizeRange || '-'}</span>
                    </div>
                  )}
                  {vt.definingCharacteristics && (
                    <p className="text-xs text-gray-600 line-clamp-2">{vt.definingCharacteristics}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Link to={createPageUrl(`EditVesselType?id=${vt.id}`)}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingType(vt)}>
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
              {filteredTypes.map((vt) => (
                <div key={vt.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{vt.primaryType}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-700">{vt.subType}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {vt.sizeMetric && (
                        <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/30 text-xs">
                          {vt.sizeMetric}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-600">{vt.typicalSizeRange || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={vt.isActive 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border' 
                      : 'bg-gray-500/10 text-gray-600 border-gray-500/30 border'}>
                      {vt.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Link to={createPageUrl(`EditVesselType?id=${vt.id}`)}>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingType(vt)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deletingType} onOpenChange={() => setDeletingType(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vessel Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingType?.primaryType} - {deletingType?.subType}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingType.id)}
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