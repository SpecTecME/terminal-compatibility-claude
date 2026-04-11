/**
 * Berths List Page
 * 
 * PURPOSE:
 * Global berth registry across all terminals with advanced filtering and compatibility search.
 * Berths are the fundamental units where vessels physically dock for cargo operations.
 * 
 * ENTITY POSITION IN HIERARCHY:
 * TerminalComplex → Terminal → Berth (this entity)
 * 
 * KEY DOMAIN CONCEPTS:
 * 
 * 1. BERTH vs TERMINAL:
 *    - A terminal is a facility complex (land, equipment, storage)
 *    - A berth is a specific docking position within that terminal
 *    - One terminal typically has multiple berths (2-6 common for LNG)
 *    - Each berth has unique physical constraints (LOA, draft, manifold specs)
 * 
 * 2. ARCHIVE vs DELETE RULES (Same as Terminal):
 *    - Permanent deletion ONLY if berth has NO:
 *      * Vessel compatibility records
 *      * Document requirements
 *      * Associated documents
 *    - Otherwise → ARCHIVE enforced (soft delete)
 *    - Preserves historical operational data
 * 
 * 3. INDEPENDENT STATUS MANAGEMENT:
 *    - Berth status can differ from parent terminal status
 *    - Example: Terminal operational, but Berth 2 under maintenance
 *    - Status changes DO NOT cascade (berths are independent)
 *    - Exception: Terminal archives DO cascade to berths (data integrity)
 * 
 * 4. PRODUCT TYPE FLEXIBILITY:
 *    - Berths can handle multiple product types (array field)
 *    - May differ from terminal's primary product type
 *    - Example: LNG terminal might have one berth also capable of LPG
 *    - Affects vessel compatibility calculations
 * 
 * 5. PHYSICAL SPECIFICATIONS (Critical for Compatibility):
 *    - Max LOA (Length Overall) - vessel length limit
 *    - Max Beam - vessel width limit
 *    - Max Draft - water depth limit
 *    - Max Cargo Capacity - vessel tank capacity range
 *    - These constrain which vessels can use this berth
 * 
 * 6. LNG-SPECIFIC CAPABILITIES:
 *    - Q-Max capable (largest LNG carrier class, 266,000 m³)
 *    - Q-Flex capable (mid-size LNG carrier class, 210,000 m³)
 *    - Boolean flags for quick filtering
 *    - Specific to LNG terminal operations
 * 
 * 7. LEGACY FIELD COMPATIBILITY:
 *    - Both berth_number/berth_name AND berthCode/berthName supported
 *    - Gradual migration strategy from old schema
 *    - Display logic prioritizes new fields, falls back to legacy
 * 
 * RETURN URL PRESERVATION:
 * - getBerthDetailUrl() encodes all current filter state
 * - When user returns from BerthDetail, filters are restored
 * - Critical for maintaining user context in multi-step workflows
 * 
 * SEARCH SCOPE:
 * Searches berth identifiers, terminal name, port, and country
 * Enables finding berths through parent terminal context
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Anchor, 
  Plus, 
  Search, 
  Filter,
  ChevronRight,
  Building2,
  MapPin,
  Trash2,
  Edit,
  Star,
  List,
  Grid3x3,
  LayoutList,
  X,
  ToggleLeft,
  Archive,
  ArchiveRestore
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
import ChangeStatusDialog from '../components/berth/ChangeStatusDialog';
import ArchiveBerthDialog from '../components/berth/ArchiveBerthDialog';
import ArchivedToggle from '../components/ui/ArchivedToggle';
import FavoriteToggle from '../components/ui/FavoriteToggle';
import IconButton from '../components/ui/IconButton';
import { getCurrentUserCached } from '../components/utils/currentUser';

/**
 * Berths List Page
 * 
 * PURPOSE:
 * Global berth registry across all terminals with advanced filtering and compatibility search.
 * Berths are the fundamental units where vessels physically dock for cargo operations.
 * 
 * ENTITY POSITION IN HIERARCHY:
 * TerminalComplex → Terminal → Berth (this entity)
 * 
 * KEY DOMAIN CONCEPTS:
 * 
 * 1. BERTH vs TERMINAL:
 *    - A terminal is a facility complex (land, equipment, storage)
 *    - A berth is a specific docking position within that terminal
 *    - One terminal typically has multiple berths (2-6 common for LNG)
 *    - Each berth has unique physical constraints (LOA, draft, manifold specs)
 * 
 * 2. ARCHIVE vs DELETE RULES (Same as Terminal):
 *    - Permanent deletion ONLY if berth has NO:
 *      * Vessel compatibility records
 *      * Document requirements
 *      * Associated documents
 *    - Otherwise → ARCHIVE enforced (soft delete)
 *    - Preserves historical operational data
 * 
 * 3. INDEPENDENT STATUS MANAGEMENT:
 *    - Berth status can differ from parent terminal status
 *    - Example: Terminal operational, but Berth 2 under maintenance
 *    - Status changes DO NOT cascade (berths are independent)
 *    - Exception: Terminal archives DO cascade to berths (data integrity)
 * 
 * 4. PRODUCT TYPE FLEXIBILITY:
 *    - Berths can handle multiple product types (array field)
 *    - May differ from terminal's primary product type
 *    - Example: LNG terminal might have one berth also capable of LPG
 *    - Affects vessel compatibility calculations
 * 
 * 5. PHYSICAL SPECIFICATIONS (Critical for Compatibility):
 *    - Max LOA (Length Overall) - vessel length limit
 *    - Max Beam - vessel width limit
 *    - Max Draft - water depth limit
 *    - Max Cargo Capacity - vessel tank capacity range
 *    - These constrain which vessels can use this berth
 * 
 * 6. LNG-SPECIFIC CAPABILITIES:
 *    - Q-Max capable (largest LNG carrier class, 266,000 m³)
 *    - Q-Flex capable (mid-size LNG carrier class, 210,000 m³)
 *    - Boolean flags for quick filtering
 *    - Specific to LNG terminal operations
 * 
 * 7. LEGACY FIELD COMPATIBILITY:
 *    - Both berth_number/berth_name AND berthCode/berthName supported
 *    - Gradual migration strategy from old schema
 *    - Display logic prioritizes new fields, falls back to legacy
 * 
 * RETURN URL PRESERVATION:
 * - getBerthDetailUrl() encodes all current filter state
 * - When user returns from BerthDetail, filters are restored
 * - Critical for maintaining user context in multi-step workflows
 * 
 * SEARCH SCOPE:
 * Searches berth identifiers, terminal name, port, and country
 * Enables finding berths through parent terminal context
 */
export default function Berths() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  
  // Optional pre-filter from terminal detail page navigation
  const terminalFilter = urlParams.get('terminal');
  
  // Filter and display state
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [filterStatus, setFilterStatus] = useState(urlParams.get('status') || 'all');
  const [filterCountry, setFilterCountry] = useState(urlParams.get('country') || 'all');
  const [viewMode, setViewMode] = useState(urlParams.get('view') || 'list');
  const [archivedFilter, setArchivedFilter] = useState(urlParams.get('archived') || 'active');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [berthToDelete, setBerthToDelete] = useState(null);
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [berthToChangeStatus, setBerthToChangeStatus] = useState(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [berthToArchive, setBerthToArchive] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(urlParams.get('favorites') === 'true');
  const [filterTerminal, setFilterTerminal] = useState(terminalFilter || 'all');
  const [filterProduct, setFilterProduct] = useState(urlParams.get('product') || 'all');
  const [user, setUser] = useState(null);

  const getBerthDetailUrl = (berthId) => {
    const params = new URLSearchParams();
    params.set('id', berthId);
    params.set('from', 'berths');
    if (searchQuery) params.set('search', searchQuery);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterTerminal !== 'all') params.set('terminal', filterTerminal);
    if (filterProduct !== 'all') params.set('product', filterProduct);
    if (viewMode !== 'list') params.set('view', viewMode);
    if (showFavoritesOnly) params.set('favorites', 'true');
    if (archivedFilter !== 'active') params.set('archived', archivedFilter);
    return createPageUrl(`BerthDetail?${params.toString()}`);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUserCached();
        setUser(userData);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterTerminal !== 'all') params.set('terminal', filterTerminal);
    if (filterProduct !== 'all') params.set('product', filterProduct);
    if (viewMode !== 'list') params.set('view', viewMode);
    if (showFavoritesOnly) params.set('favorites', 'true');
    if (archivedFilter !== 'active') params.set('archived', archivedFilter);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, filterStatus, filterTerminal, filterProduct, viewMode, showFavoritesOnly, archivedFilter]);

  const { data: berths = [], isLoading } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: compatibilities = [] } = useQuery({
    queryKey: ['compatibilities'],
    queryFn: () => base44.entities.VesselCompatibility.list()
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.TerminalDocumentRequirement.list()
  });

  const favoriteBerthIds = user?.favoriteBerthIds || [];
  const isFavorite = (berthId) => favoriteBerthIds.includes(berthId);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (berthId) => {
      const currentFavorites = user?.favoriteBerthIds || [];
      const isFav = currentFavorites.includes(berthId);
      const newFavorites = isFav
        ? currentFavorites.filter(id => id !== berthId)
        : [...currentFavorites, berthId];
      
      await base44.auth.updateMe({ favoriteBerthIds: newFavorites });
      return newFavorites;
    },
    onSuccess: (newFavorites) => {
      setUser({ ...user, favoriteBerthIds: newFavorites });
      queryClient.invalidateQueries(['berths']);
    }
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const getTerminalById = (id) => terminals.find(t => t.id === id);

  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  /**
   * Enrich berths with parent terminal data
   * 
   * PURPOSE:
   * Joins berth records with their parent terminal for display.
   * Enables showing "Terminal Name" and terminal-level attributes in berth lists.
   * 
   * ALTERNATIVE APPROACH NOT USED:
   * Could fetch terminals separately in render, but this pre-joins for efficiency.
   * Single map operation vs multiple finds during render.
   */
  const enrichedBerths = berths.map(b => ({
    ...b,
    terminal: getTerminalById(b.terminal_id)
  }));

  const getCountryName = (terminal) => {
    if (terminal?.countryId) {
      const country = countries.find(c => c.id === terminal.countryId);
      return country?.nameEn || terminal.legacyCountryName || '';
    }
    return terminal?.legacyCountryName || terminal?.country || '';
  };

  const uniqueProducts = [...new Set(
    berths
      .filter(b => b.productTypeRefIds && b.productTypeRefIds.length > 0)
      .flatMap(b => b.productTypeRefIds)
  )].map(id => productTypes.find(pt => pt.id === id)).filter(Boolean);

  const statusOrder = { 'Operational': 1, 'Maintenance': 2, 'Under Construction': 3, 'Planned': 4, 'Inactive': 5 };

  const filteredBerths = enrichedBerths
    .filter(b => {
      const terminal = b.terminal;
      const terminalCountry = getCountryName(terminal);
      const matchesSearch = b.berth_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.berth_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.berthCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.berthName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            terminal?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            terminal?.port?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            terminalCountry?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
      const matchesTerminalFilter = filterTerminal === 'all' || b.terminal_id === filterTerminal;
      const matchesProduct = filterProduct === 'all' || (b.productTypeRefIds && b.productTypeRefIds.includes(filterProduct));
      const matchesFavorite = !showFavoritesOnly || isFavorite(b.id);
      const matchesArchived = archivedFilter === 'all' ? true : 
                              archivedFilter === 'archived' ? b.isArchived : 
                              !b.isArchived;
      return matchesSearch && matchesStatus && matchesTerminalFilter && matchesProduct && matchesFavorite && matchesArchived;
    })
    .sort((a, b) => {
      const aFav = isFavorite(a.id);
      const bFav = isFavorite(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
    });

  const statusColors = {
    'Operational': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Maintenance': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Planned': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Under Construction': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Inactive': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  };

  /**
   * Check if berth can be permanently deleted
   * 
   * DELETION RULES (Parallel to terminal deletion):
   * Berth can ONLY be permanently deleted if it has NO:
   * - Vessel compatibility records (operational history)
   * - Document requirements (regulatory configurations)
   * - Associated documents (uploaded certificates/forms)
   * 
   * If ANY dependency exists → ARCHIVE enforced
   * 
   * RATIONALE:
   * - Prevents orphaned compatibility records
   * - Preserves historical operational data
   * - Maintains audit trail for compliance
   */
  const checkBerthDeletable = (berth) => {
    const hasCompatibilities = compatibilities.some(c => c.berth_id === berth.id);
    const hasRequirements = requirements.some(r => r.berthId === berth.id);
    const hasDocuments = documents.some(d => d.berthId === berth.id);
    return !hasCompatibilities && !hasRequirements && !hasDocuments;
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Berth.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['berths']);
      toast.success('Berth permanently deleted');
      setDeleteDialogOpen(false);
      setBerthToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to delete berth: ' + error.message);
    }
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Berth.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['berths']);
      toast.success('Status updated successfully');
      setShowChangeStatus(false);
      setBerthToChangeStatus(null);
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.Berth.update(id, { 
      isArchived: true,
      isActive: false,
      status: 'Inactive',
      archivedAt: new Date().toISOString(),
      archivedReason: reason || null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['berths']);
      toast.success('Berth archived successfully');
      setShowArchiveDialog(false);
      setBerthToArchive(null);
      setDeleteDialogOpen(false);
      setBerthToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to archive berth: ' + error.message);
    }
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id) => base44.entities.Berth.update(id, { 
      isArchived: false,
      isActive: true,
      status: 'Operational',
      archivedAt: null,
      archivedReason: null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['berths']);
      toast.success('Berth unarchived successfully');
    },
    onError: (error) => {
      toast.error('Failed to unarchive berth: ' + error.message);
    }
  });

  const handleDeleteClick = (berth, e) => {
    e.preventDefault();
    e.stopPropagation();
    setBerthToDelete(berth);
    const canDelete = checkBerthDeletable(berth);
    if (!canDelete) {
      setBerthToArchive(berth);
      setShowArchiveDialog(true);
    } else {
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (berthToDelete) {
      deleteMutation.mutate(berthToDelete.id);
    }
  };

  const handleChangeStatus = (berth, e) => {
    e.preventDefault();
    e.stopPropagation();
    setBerthToChangeStatus(berth);
    setShowChangeStatus(true);
  };

  const handleStatusSave = (status) => {
    if (berthToChangeStatus) {
      changeStatusMutation.mutate({ id: berthToChangeStatus.id, status });
    }
  };

  const handleArchive = (reason) => {
    if (berthToArchive) {
      archiveMutation.mutate({ id: berthToArchive.id, reason });
    }
  };

  const handleUnarchive = (berth, e) => {
    e.preventDefault();
    e.stopPropagation();
    unarchiveMutation.mutate(berth.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Berths</h1>
            <p className="text-gray-600 mt-1">Manage berth configurations across all terminals</p>
          </div>
          <Link to={createPageUrl('AddBerth')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Berth
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search berths, terminals, ports, countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-20 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
          {searchQuery && (
            <>
              <span className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                ({filteredBerths.length})
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-full md:w-40 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Products" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Products</SelectItem>
            {uniqueProducts.map(pt => (
              <SelectItem key={pt.id} value={pt.id} className="text-gray-900">{pt.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-40 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Status</SelectItem>
            <SelectItem value="Operational" className="text-gray-900">Operational</SelectItem>
            <SelectItem value="Planned" className="text-gray-900">Planned</SelectItem>
            <SelectItem value="Under Construction" className="text-gray-900">Under Construction</SelectItem>
            <SelectItem value="Maintenance" className="text-gray-900">Maintenance</SelectItem>
            <SelectItem value="Inactive" className="text-gray-900">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <ArchivedToggle 
          archivedFilter={archivedFilter}
          onToggle={() => {
            const next = archivedFilter === 'active' ? 'archived' : archivedFilter === 'archived' ? 'all' : 'active';
            setArchivedFilter(next);
          }}
        />
        <IconButton
          icon={<Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-amber-500' : ''}`} />}
          tooltip={showFavoritesOnly ? "Show all berths" : "Show favorites only"}
          variant="outline"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={showFavoritesOnly ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
        />
        <div className="flex gap-1">
          <IconButton
            icon={List}
            tooltip="List view"
            variant="outline"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          />
          <IconButton
            icon={Grid3x3}
            tooltip="Grid view"
            variant="outline"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          />
          <IconButton
            icon={LayoutList}
            tooltip="Compact view"
            variant="outline"
            onClick={() => setViewMode('compact')}
            className={viewMode === 'compact' ? 'bg-cyan-600' : 'border-gray-300 text-gray-700'}
          />
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600 w-12"></TableHead>
                  <TableHead className="text-gray-600">Berth</TableHead>
                  <TableHead className="text-gray-600">Terminal</TableHead>
                  <TableHead className="text-gray-600 text-right">Max LOA</TableHead>
                  <TableHead className="text-gray-600 text-right">Max Draft</TableHead>
                  <TableHead className="text-gray-600 text-right">Max Capacity</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBerths.map((berth) => {
                  const terminal = berth.terminal;
                  return (
                    <TableRow 
                      key={berth.id} 
                      className="border-gray-200 cursor-pointer hover:bg-gray-50"
                      onClick={() => window.location.href = getBerthDetailUrl(berth.publicId)}
                    >
                      <TableCell>
                        <div onClick={(e) => e.stopPropagation()}>
                          <FavoriteToggle
                            isFavorite={isFavorite(berth.id)}
                            onToggle={() => toggleFavoriteMutation.mutate(berth.id)}
                            size="sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {berth.berthName || berth.berth_name || berth.berthCode || berth.berth_number}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {terminal?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-700 text-right">
                        {berth.max_loa ? `${berth.max_loa}m` : '-'}
                      </TableCell>
                      <TableCell className="text-gray-700 text-right">
                        {berth.max_draft ? `${berth.max_draft}m` : '-'}
                      </TableCell>
                      <TableCell className="text-gray-700 text-right">
                        {berth.max_cargo_capacity ? `${berth.max_cargo_capacity.toLocaleString()}m³` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[berth.status] || statusColors['Inactive']} border`}>
                          {berth.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {berth.isArchived ? (
                            <IconButton
                              icon={ArchiveRestore}
                              tooltip="Unarchive"
                              variant="ghost"
                              onClick={(e) => handleUnarchive(berth, e)}
                              className="h-8 w-8 text-green-500 hover:text-green-700"
                            />
                          ) : (
                            <>
                              <IconButton
                                icon={ToggleLeft}
                                tooltip="Change status"
                                variant="ghost"
                                onClick={(e) => handleChangeStatus(berth, e)}
                                className="h-8 w-8 text-blue-500 hover:text-blue-700"
                              />
                              <Link to={createPageUrl(`EditBerth?id=${berth.id}`)}>
                                <IconButton
                                  icon={Edit}
                                  tooltip="Edit"
                                  variant="ghost"
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-8 w-8 text-gray-400 hover:text-gray-900"
                                />
                              </Link>
                              <IconButton
                                icon={Trash2}
                                tooltip="Delete"
                                variant="ghost"
                                onClick={(e) => handleDeleteClick(berth, e)}
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                              />
                            </>
                          )}
                        </div>
                      </TableCell>
                      </TableRow>
                      );
                      })}
                      </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBerths.map((berth) => {
            const terminal = berth.terminal;
            return (
              <Card key={berth.id} className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => window.location.href = createPageUrl(`BerthDetail?id=${berth.publicId}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}>
                        <FavoriteToggle
                          isFavorite={isFavorite(berth.id)}
                          onToggle={() => toggleFavoriteMutation.mutate(berth.id)}
                          size="sm"
                        />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <Anchor className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{berth.berthName || berth.berth_name || berth.berthCode || berth.berth_number}</p>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-gray-600 truncate">{terminal?.name || '-'}</p>
                            {berth.productTypeRefIds && berth.productTypeRefIds.length > 0 && (
                              <div className="text-xs text-gray-500 text-right flex-shrink-0">
                                {berth.productTypeRefIds.map(id => productTypes.find(pt => pt.id === id)?.code).filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-3 text-xs text-gray-600">
                      <span>LOA: {berth.max_loa ? `${berth.max_loa}m` : '-'}</span>
                      <span>•</span>
                      <span>Draft: {berth.max_draft ? `${berth.max_draft}m` : '-'}</span>
                      <span>•</span>
                      <span>Cap: {berth.max_cargo_capacity ? `${berth.max_cargo_capacity.toLocaleString()}m³` : '-'}</span>
                    </div>
                  </div>
                </CardContent>
                <div className="px-4 pb-4 flex items-center justify-between gap-2">
                  <Badge className={`${statusColors[berth.status] || statusColors['Inactive']} border text-xs`}>
                    {berth.status}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {berth.isArchived ? (
                      <IconButton
                        icon={ArchiveRestore}
                        tooltip="Unarchive"
                        variant="ghost"
                        onClick={(e) => handleUnarchive(berth, e)}
                        className="h-8 w-8 text-green-500 hover:text-green-700"
                      />
                    ) : (
                      <>
                        <IconButton
                          icon={ToggleLeft}
                          tooltip="Change status"
                          variant="ghost"
                          onClick={(e) => handleChangeStatus(berth, e)}
                          className="h-8 w-8 text-blue-500 hover:text-blue-700"
                        />
                        <Link to={createPageUrl(`EditBerth?id=${berth.id}`)}>
                          <IconButton
                            icon={Edit}
                            tooltip="Edit"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 text-gray-400 hover:text-gray-900"
                          />
                        </Link>
                        <IconButton
                          icon={Trash2}
                          tooltip="Delete"
                          variant="ghost"
                          onClick={(e) => handleDeleteClick(berth, e)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        />
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Compact View */}
      {viewMode === 'compact' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-3 space-y-1">
            {filteredBerths.map((berth) => {
              const terminal = berth.terminal;
              return (
                <div key={berth.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = getBerthDetailUrl(berth.publicId)}>
                  <div className="flex items-center gap-3 flex-1">
                    <div onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}>
                      <FavoriteToggle
                        isFavorite={isFavorite(berth.id)}
                        onToggle={() => toggleFavoriteMutation.mutate(berth.id)}
                        size="sm"
                      />
                    </div>
                    <Anchor className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{berth.berthName || berth.berth_name || berth.berthCode || berth.berth_number}</p>
                      <p className="text-xs text-gray-600">{terminal?.name || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusColors[berth.status] || statusColors['Inactive']} border text-xs`}>
                      {berth.status}
                    </Badge>
                    {berth.isArchived ? (
                      <IconButton
                        icon={<ArchiveRestore className="w-3 h-3" />}
                        tooltip="Unarchive"
                        variant="ghost"
                        onClick={(e) => handleUnarchive(berth, e)}
                        className="h-7 w-7 text-green-500 hover:text-green-700"
                      />
                    ) : (
                      <>
                        <IconButton
                          icon={<ToggleLeft className="w-3 h-3" />}
                          tooltip="Change status"
                          variant="ghost"
                          onClick={(e) => handleChangeStatus(berth, e)}
                          className="h-7 w-7 text-blue-500 hover:text-blue-700"
                        />
                        <Link to={createPageUrl(`EditBerth?id=${berth.id}`)}>
                          <IconButton
                            icon={<Edit className="w-3 h-3" />}
                            tooltip="Edit"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 w-7 text-gray-400 hover:text-gray-900"
                          />
                        </Link>
                        <IconButton
                          icon={<Trash2 className="w-3 h-3" />}
                          tooltip="Delete"
                          variant="ghost"
                          onClick={(e) => handleDeleteClick(berth, e)}
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                        />
                      </>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {filteredBerths.length === 0 && (
        <div className="text-center py-16">
          <Anchor className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No berths found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterStatus !== 'all' || filterProduct !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No berths configured in the system'}
              </p>
              </div>
              )}

              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-white border-gray-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-900">Permanently Delete Berth</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600">
                      Are you sure you want to permanently delete "{berthToDelete?.berthName || berthToDelete?.berth_name || berthToDelete?.berthCode || berthToDelete?.berth_number}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleConfirmDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <ChangeStatusDialog
                open={showChangeStatus}
                onOpenChange={setShowChangeStatus}
                berth={berthToChangeStatus}
                onSave={handleStatusSave}
              />

              <ArchiveBerthDialog
                open={showArchiveDialog}
                onOpenChange={setShowArchiveDialog}
                berth={berthToArchive}
                onArchive={handleArchive}
              />
              </div>
              );
              }