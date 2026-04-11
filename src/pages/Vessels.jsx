/**
 * Vessels List Page (Fleet Registry)
 * 
 * PURPOSE:
 * Central registry for managing the vessel fleet with comprehensive filtering,
 * search, and quick access to vessel details, documents, and terminal approvals.
 * 
 * DOMAIN CONTEXT - VESSEL LIFECYCLE:
 * 
 * Vessels are the primary operational assets that:
 * - Navigate between terminals
 * - Undergo registration/approval workflows
 * - Maintain compliance documentation
 * - Have physical/technical specifications
 * - Carry cargo according to their type
 * 
 * KEY ARCHITECTURAL FEATURES:
 * 
 * 1. UDF (USER-DEFINED FIELDS) SYSTEM (lines 69-71, 153-164, 262-265):
 * 
 * CRITICAL FLEXIBILITY FEATURE:
 * - Tenant-configurable custom fields (UDF01, UDF02)
 * - Labels and behavior defined in UdfConfiguration
 * - Can be text fields or dropdown lists
 * - Optional inclusion in search and list views
 * 
 * SEARCH INTEGRATION (lines 153-164):
 * UDF text fields with includeInSearch=true are searchable.
 * Dropdown UDFs (createList=true) excluded from text search.
 * 
 * FILTER COMPONENT (lines 262-265):
 * VesselUdfFilters renders dropdown selectors for list-type UDFs.
 * Enables filtering vessels by custom classifications.
 * 
 * EXAMPLES:
 * - UDF01 = "Fleet Manager" (dropdown) → Filter vessels by manager
 * - UDF02 = "Project Code" (text, searchable) → Find vessels by project
 * 
 * WHY THIS MATTERS:
 * Different operators need different fields.
 * UDF system avoids hardcoding tenant-specific attributes.
 * 
 * 2. URL STATE PERSISTENCE (lines 80-90):
 * 
 * All filter states synced to URL parameters:
 * - search, type, status, active, view
 * - Enables bookmarking specific filter combinations
 * - Browser back/forward preserves context
 * - Shareable URLs between team members
 * 
 * RETURN URL PATTERN (lines 303-309, 415-421, 470-476):
 * When navigating to VesselDetail:
 * - Current filter state encoded in returnTo param
 * - Vessel detail "Back" button returns to exact filter state
 * - Prevents lost context when drilling down
 * 
 * CRITICAL UX FEATURE:
 * User filters to "Active Q-Max vessels" → clicks detail → clicks back → returns to filtered list, not full unfiltered list.
 * 
 * 3. QUICK STATS AGGREGATION (lines 138-146, 302):
 * 
 * For each vessel, calculates from related entities:
 * - Approved terminals (compatibilities with status = Approved)
 * - Pending approvals (compatibilities with status = Under Review)
 * - Document count (all documents for this vessel)
 * 
 * DISPLAYED IN GRID VIEW (lines 358-371):
 * Icon badges showing counts at glance.
 * No need to click into detail for overview.
 * 
 * 4. VESSEL STATUS LIFECYCLE (lines 190-195, 240-250):
 * 
 * STATUS OPTIONS:
 * - Active: Normal operations
 * - Laid Up: Temporarily out of service (economic/market)
 * - Under Repair: In shipyard/drydock
 * - Scrapped: Decommissioned (end of life)
 * 
 * COLOR CODING:
 * - Active: Green (emerald)
 * - Laid Up: Amber (warning)
 * - Under Repair: Blue (informational)
 * - Scrapped: Gray (inactive)
 * 
 * 5. SOFT DELETE PATTERN (lines 112-123, 542-560):
 * 
 * "Delete" button actually DEACTIVATES (sets isActive = false).
 * Vessel data preserved for:
 * - Historical reporting
 * - Document retention
 * - Terminal approval history
 * 
 * USER MESSAGING:
 * Dialog says "Deactivate", not "Delete".
 * Explains vessel can be "reactivated later".
 * 
 * 6. VESSEL TYPE DISPLAY (lines 328-336, 425-428, 486-489):
 * 
 * Vessels reference VesselTypeRef by vesselTypeRefId.
 * Display shows: "PrimaryType - SubType" (e.g., "LNG Carrier - Q-Max").
 * 
 * LOOKUP LOGIC:
 * Finds type by matching vesselTypeRefId or publicId (migration compatibility).
 * Fallback to vessel.imo_number if type not found.
 * 
 * 7. THREE VIEW MODES (lines 266-291, 294-391, 464-522):
 * 
 * GRID VIEW (default):
 * - Card-based layout
 * - Visual prominence with icons and colors
 * - Shows key stats inline
 * - Best for scanning and visual recognition
 * 
 * LIST VIEW:
 * - Traditional table format
 * - Maximum information density
 * - Sortable columns
 * - Best for data analysis
 * 
 * COMPACT VIEW:
 * - Condensed rows
 * - Space-efficient
 * - Key badges visible
 * - Best for large datasets
 * 
 * 8. ACTIVE FILTER (lines 63, 252-261):
 * 
 * Three-state toggle:
 * - active: Show only isActive = true
 * - inactive: Show only isActive = false
 * - all: Show everything
 * 
 * DEFAULT: active (most users want active vessels only)
 * 
 * EMPTY STATE HANDLING (lines 524-540):
 * Context-aware messaging based on active filters.
 * Prompts to adjust filters or add first vessel.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Ship, 
  Plus, 
  Search, 
  Filter,
  ChevronRight,
  Anchor,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  List,
  Grid3x3,
  LayoutList,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useUdfConfigurations, getListViewUdfConfigs, VesselUdfFilters } from '../components/vessel/VesselUdfFields';

export default function Vessels() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [filterType, setFilterType] = useState(urlParams.get('type') || 'all');
  const [filterStatus, setFilterStatus] = useState(urlParams.get('status') || 'all');
  const [activeFilter, setActiveFilter] = useState(urlParams.get('active') || 'active');
  const [viewMode, setViewMode] = useState(urlParams.get('view') || 'grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vesselToDelete, setVesselToDelete] = useState(null);
  const [udfFilters, setUdfFilters] = useState({});

  // UDF Configuration
  const { data: udfConfigs = [] } = useUdfConfigurations('Vessel');
  const listViewUdfConfigs = getListViewUdfConfigs(udfConfigs);

  // UDF list values for dropdown filters
  const { data: udfListValues = [] } = useQuery({
    queryKey: ['udfListValues', 'Vessel'],
    queryFn: () => base44.entities.UdfListValue.filter({ module: 'Vessel', isActive: true }),
    enabled: listViewUdfConfigs.some(c => c.createList)
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filterType !== 'all') params.set('type', filterType);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (activeFilter !== 'active') params.set('active', activeFilter);
    if (viewMode !== 'grid') params.set('view', viewMode);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, filterType, filterStatus, activeFilter, viewMode]);

  const { data: vessels = [], isLoading } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: compatibilities = [] } = useQuery({
    queryKey: ['compatibilities'],
    queryFn: () => base44.entities.VesselCompatibility.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const { data: vesselTypeRefs = [] } = useQuery({
    queryKey: ['vesselTypeRefs'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (vessel) => base44.entities.Vessel.update(vessel.id, { ...vessel, isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      toast.success('Vessel deactivated');
      setDeleteDialogOpen(false);
      setVesselToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to deactivate vessel: ' + error.message);
    }
  });

  const handleDeleteClick = (vessel, e) => {
    e.preventDefault();
    e.stopPropagation();
    setVesselToDelete(vessel);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (vesselToDelete) {
      deleteMutation.mutate(vesselToDelete);
    }
  };

  const getVesselStats = (vesselId) => {
    const vesselComps = compatibilities.filter(c => c.vessel_id === vesselId);
    const vesselDocs = documents.filter(d => d.vessel_id === vesselId);
    return {
      approved: vesselComps.filter(c => c.status === 'Approved').length,
      pending: vesselComps.filter(c => c.status === 'Under Review').length,
      documents: vesselDocs.length
    };
  };

  const filteredVessels = vessels.filter(v => {
    // Basic text search
    let matchesSearch = v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           v.imoNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Also search in UDF text fields where includeInSearch=true and createList=false
    if (searchQuery && !matchesSearch) {
      for (const config of listViewUdfConfigs) {
        if (!config.createList) {
          const udfValue = v[config.udfCode.toLowerCase()];
          if (udfValue?.toLowerCase().includes(searchQuery.toLowerCase())) {
            matchesSearch = true;
            break;
          }
        }
      }
    }

    const matchesType = true; // Vessel type filtering removed temporarily
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesActive = activeFilter === 'all' || 
      (activeFilter === 'active' && v.isActive !== false) ||
      (activeFilter === 'inactive' && v.isActive === false);
    
    // UDF dropdown filters
    let matchesUdfFilters = true;
    for (const [key, value] of Object.entries(udfFilters)) {
      if (value && value !== '') {
        if (v[key] !== value) {
          matchesUdfFilters = false;
          break;
        }
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesActive && matchesUdfFilters;
  });

  const handleUdfFilterChange = (field, value) => {
    setUdfFilters(prev => ({ ...prev, [field]: value }));
  };

  const statusColors = {
    'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Laid Up': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Under Repair': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Scrapped': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Registry</h1>
            <p className="text-gray-600 mt-1">Manage your LNG vessel fleet</p>
          </div>
          <Link to={createPageUrl('AddVessel')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Register Vessel
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search vessels by name or IMO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
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
        {/* Remove vessel type filter for now - will need to be updated to use VesselTypeRef */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-40 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Status</SelectItem>
            <SelectItem value="Active" className="text-gray-900">Active</SelectItem>
            <SelectItem value="Laid Up" className="text-gray-900">Laid Up</SelectItem>
            <SelectItem value="Under Repair" className="text-gray-900">Under Repair</SelectItem>
            <SelectItem value="Scrapped" className="text-gray-900">Scrapped</SelectItem>
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-36 bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <VesselUdfFilters
          filters={udfFilters}
          onFilterChange={handleUdfFilterChange}
        />
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('compact')}
            className={viewMode === 'compact' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
        {filteredVessels.map((vessel) => {
          const stats = getVesselStats(vessel.id);
          const params = new URLSearchParams();
          if (searchQuery) params.set('search', searchQuery);
          if (filterType !== 'all') params.set('type', filterType);
          if (filterStatus !== 'all') params.set('status', filterStatus);
          if (activeFilter !== 'active') params.set('active', activeFilter);
          if (viewMode !== 'grid') params.set('view', viewMode);
          const returnUrl = `Vessels${params.toString() ? '?' + params.toString() : ''}`;
          return (
            <Link key={vessel.id} to={createPageUrl(`VesselDetail?id=${vessel.id}&returnTo=${encodeURIComponent(returnUrl)}`)}>
              <Card className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all group cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/30">
                      <Ship className="w-6 h-6 text-violet-400" />
                    </div>
                    <Badge className={`${statusColors[vessel.status]} border`}>
                      {vessel.status}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
                    {vessel.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">IMO: {vessel.imoNumber}</p>
                  
                  <div className="space-y-2 mb-4">
                    {vessel.vesselTypeRefId && (() => {
                       const typeRef = vesselTypeRefs.find(vt => vt.publicId === vessel.vesselTypeRefId || vt.id === vessel.vesselTypeRefId);
                       return typeRef ? (
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600">Type</span>
                           <span className="text-gray-900">{typeRef.primaryType} - {typeRef.subType}</span>
                         </div>
                       ) : null;
                     })()}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Capacity</span>
                      <span className="text-gray-900">{vessel.cargo_capacity ? `${vessel.cargo_capacity.toLocaleString()} m³` : '-'}</span>
                    </div>
                    {vessel.flagCountryId && (() => {
                      const flagCountry = countries.find(c => c.id === vessel.flagCountryId);
                      return flagCountry ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Flag</span>
                          <span className="text-gray-900">{flagCountry.nameEn}</span>
                        </div>
                      ) : null;
                    })}
                    {vessel.classSocietyCompanyId && (() => {
                      const classSociety = companies.find(c => c.id === vessel.classSocietyCompanyId);
                      return classSociety ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Class Society</span>
                          <span className="text-gray-900">{classSociety.name}</span>
                        </div>
                      ) : null;
                    })}
                    {listViewUdfConfigs.map(config => {
                      const value = vessel[config.udfCode.toLowerCase()];
                      if (!value) return null;
                      return (
                        <div key={config.udfCode} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{config.label}</span>
                          <span className="text-gray-900">{value}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-gray-700">{stats.approved}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-gray-700">{stats.pending}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{stats.documents}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                  </div>
                </CardContent>
                <div className="px-5 pb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => handleDeleteClick(vessel, e)}
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Deactivate
                  </Button>
                </div>
              </Card>
            </Link>
          );
        })}
        </motion.div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Vessel</TableHead>
                    <TableHead className="text-gray-600">Type</TableHead>
                    <TableHead className="text-gray-600">IMO</TableHead>
                    <TableHead className="text-gray-600">Flag</TableHead>
                    <TableHead className="text-gray-600">Class Society</TableHead>
                    {listViewUdfConfigs.map(config => (
                      <TableHead key={config.udfCode} className="text-gray-600">{config.label}</TableHead>
                    ))}
                    <TableHead className="text-gray-600 text-right">Approved</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVessels.map((vessel) => {
                  const stats = getVesselStats(vessel.id);
                  const params = new URLSearchParams();
                  if (searchQuery) params.set('search', searchQuery);
                  if (filterType !== 'all') params.set('type', filterType);
                  if (filterStatus !== 'all') params.set('status', filterStatus);
                  if (activeFilter !== 'active') params.set('active', activeFilter);
                  if (viewMode !== 'grid') params.set('view', viewMode);
                  const returnUrl = `Vessels${params.toString() ? '?' + params.toString() : ''}`;
                  return (
                    <TableRow key={vessel.id} className="border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = createPageUrl(`VesselDetail?id=${vessel.id}&returnTo=${encodeURIComponent(returnUrl)}`)}>
                       <TableCell className="font-medium text-gray-900">{vessel.name}</TableCell>
                       <TableCell className="text-gray-700">{vessel.vesselTypeRefId ? (() => {
                         const typeRef = vesselTypeRefs.find(vt => vt.publicId === vessel.vesselTypeRefId || vt.id === vessel.vesselTypeRefId);
                         return typeRef ? `${typeRef.primaryType} - ${typeRef.subType}` : '-';
                       })() : '-'}</TableCell>
                       <TableCell className="text-gray-700">{vessel.imoNumber}</TableCell>
                       <TableCell className="text-gray-700">{vessel.flagCountryId ? countries.find(c => c.id === vessel.flagCountryId)?.nameEn : '-'}</TableCell>
                       <TableCell className="text-gray-700">{vessel.classSocietyCompanyId ? companies.find(c => c.id === vessel.classSocietyCompanyId)?.name : '-'}</TableCell>
                      {listViewUdfConfigs.map(config => (
                        <TableCell key={config.udfCode} className="text-gray-700">
                          {vessel[config.udfCode.toLowerCase()] || '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-gray-700 text-right">{stats.approved}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[vessel.status]} border`}>
                          {vessel.status}
                        </Badge>
                        </TableCell>
                        <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(vessel, e);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        </TableCell>
                        </TableRow>
                        );
                        })}
                        </TableBody>
                        </Table>
                        </CardContent>
                        </Card>
                        )}

      {/* Compact View */}
      {viewMode === 'compact' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredVessels.map((vessel) => {
                const params = new URLSearchParams();
                if (searchQuery) params.set('search', searchQuery);
                if (filterType !== 'all') params.set('type', filterType);
                if (filterStatus !== 'all') params.set('status', filterStatus);
                if (activeFilter !== 'active') params.set('active', activeFilter);
                if (viewMode !== 'grid') params.set('view', viewMode);
                const returnUrl = `Vessels${params.toString() ? '?' + params.toString() : ''}`;
                return (
                <Link key={vessel.id} to={createPageUrl(`VesselDetail?id=${vessel.id}&returnTo=${encodeURIComponent(returnUrl)}`)}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/30">
                         <Ship className="w-4 h-4 text-violet-400" />
                       </div>
                       <div>
                         <p className="font-medium text-gray-900 text-sm group-hover:text-cyan-600 transition-colors">{vessel.name}</p>
                         <p className="text-xs text-gray-600">
                           IMO: {vessel.imoNumber}
                           {vessel.flagCountryId && ` | Flag: ${countries.find(c => c.id === vessel.flagCountryId)?.nameEn || '-'}`}
                           {vessel.classSocietyCompanyId && ` | Class: ${companies.find(c => c.id === vessel.classSocietyCompanyId)?.name || '-'}`}
                         </p>
                       </div>
                     </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {listViewUdfConfigs.map(config => {
                        const value = vessel[config.udfCode.toLowerCase()];
                        if (!value) return null;
                        return (
                          <Badge key={config.udfCode} variant="outline" className="text-xs text-gray-600">
                            {value}
                          </Badge>
                        );
                      })}
                      <Badge className={`${statusColors[vessel.status]} border text-xs`}>
                        {vessel.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={(e) => handleDeleteClick(vessel, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredVessels.length === 0 && (
        <div className="text-center py-16">
          <Ship className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vessels found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by registering your first vessel'}
          </p>
          <Link to={createPageUrl('AddVessel')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Register Vessel
            </Button>
          </Link>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Vessel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{vesselToDelete?.name}"? The vessel will be hidden from lists but can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}