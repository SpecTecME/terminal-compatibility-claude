import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Anchor,
  ChevronRight,
  Trash2,
  Grid3x3,
  List,
  LayoutList,
  Star,
  X,
  Edit,
  ToggleLeft,
  Archive,
  ArchiveRestore,
  ArrowLeft
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
import ChangeTerminalStatusDialog from '../components/terminal/ChangeTerminalStatusDialog';
import ArchiveTerminalDialog from '../components/terminal/ArchiveTerminalDialog';
import UnarchiveTerminalDialog from '../components/terminal/UnarchiveTerminalDialog';
import SetBerthStatusesDialog from '../components/terminal/SetBerthStatusesDialog';
import ArchivedToggle from '../components/ui/ArchivedToggle';
import FavoriteToggle from '../components/ui/FavoriteToggle';
import IconButton from '../components/ui/IconButton';
import { motion } from 'framer-motion';

/**
 * Terminals List Page
 * 
 * PURPOSE:
 * Master list view for maritime terminals with comprehensive filtering, search, and management.
 * Terminals are the top-level operational entities in the port/facility hierarchy.
 * 
 * ENTITY HIERARCHY:
 * TerminalComplex (optional parent) → Terminal → Berth
 * 
 * KEY ARCHITECTURAL DECISIONS:
 * 
 * 1. ARCHIVE vs DELETE:
 *    - Direct deletion ONLY allowed if terminal has no dependencies (berths, compatibilities, requirements)
 *    - Otherwise, ARCHIVE is enforced (soft delete with cascading to berths)
 *    - This preserves historical data integrity and prevents orphaned records
 * 
 * 2. STATUS MANAGEMENT WITH CASCADING:
 *    - Status changes can cascade to child berths with different rules:
 *      * Maintenance → Automatically cascades to ALL berths (no choice)
 *      * Operational → User MUST specify each berth's status (interactive dialog)
 *      * Other statuses → No cascading (terminal-level only)
 *    - This reflects operational reality: maintenance affects all berths, but operational status varies
 * 
 * 3. FAVORITE SYSTEM:
 *    - User-specific favorites stored in user profile (favoriteTerminalIds array)
 *    - Favorites sort to top of list regardless of other sorting
 *    - Enables quick access to frequently monitored terminals
 * 
 * 4. ARCHIVED FILTER STATES:
 *    - 'active' (default) → Show only non-archived terminals
 *    - 'archived' → Show only archived terminals
 *    - 'all' → Show both active and archived
 *    - Three-way toggle pattern provides complete visibility control
 * 
 * 5. URL STATE PERSISTENCE:
 *    - All filters, view mode, and search query sync to URL params
 *    - Enables bookmarking, sharing, and browser back/forward
 *    - State restored on page load from URL
 * 
 * 6. RETURN URL PATTERN:
 *    - When navigating to TerminalDetail, current filter state encoded in returnTo param
 *    - Preserves user's context when they return from detail view
 *    - Critical UX feature for deep workflows
 * 
 * BUSINESS RULES:
 * - Terminals require a product type (primary cargo handled)
 * - Terminals require country and operational status
 * - Only admins can delete/archive terminals
 * - Archived terminals cascade isArchived flag to all child berths
 * - Unarchiving requires explicit berth status selection
 */
export default function Terminals() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Filter and display state - all synced with URL parameters
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [filterType, setFilterType] = useState(urlParams.get('type') || 'all'); // Import/Export/Both
  const [filterStatus, setFilterStatus] = useState(urlParams.get('status') || 'all'); // Operational/Maintenance/etc
  const [filterProduct, setFilterProduct] = useState(urlParams.get('product') || 'all'); // Product type
  const [viewMode, setViewMode] = useState(urlParams.get('view') || 'grid'); // grid/list/compact
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(urlParams.get('favorites') === 'true');
  const [archivedFilter, setArchivedFilter] = useState(urlParams.get('archived') || 'active'); // active/archived/all
  
  // Dialog state for various operations
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [terminalToDelete, setTerminalToDelete] = useState(null);
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [terminalToChangeStatus, setTerminalToChangeStatus] = useState(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [terminalToArchive, setTerminalToArchive] = useState(null);
  const [showUnarchiveDialog, setShowUnarchiveDialog] = useState(false);
  const [terminalToUnarchive, setTerminalToUnarchive] = useState(null);
  const [showBerthStatusDialog, setShowBerthStatusDialog] = useState(false);
  const [berthStatusContext, setBerthStatusContext] = useState(null);
  
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
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
    if (filterType !== 'all') params.set('type', filterType);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterProduct !== 'all') params.set('product', filterProduct);
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (showFavoritesOnly) params.set('favorites', 'true');
    if (archivedFilter !== 'active') params.set('archived', archivedFilter);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, filterType, filterStatus, filterProduct, viewMode, showFavoritesOnly, archivedFilter]);

  const { data: terminals = [], isLoading } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (terminalId) => {
      const currentFavorites = user?.favoriteTerminalIds || [];
      const isFavorite = currentFavorites.includes(terminalId);
      const newFavorites = isFavorite
        ? currentFavorites.filter(id => id !== terminalId)
        : [...currentFavorites, terminalId];
      
      await base44.auth.updateMe({ favoriteTerminalIds: newFavorites });
      return newFavorites;
    },
    onSuccess: (newFavorites) => {
      setUser({ ...user, favoriteTerminalIds: newFavorites });
      queryClient.invalidateQueries(['terminals']);
    }
  });

  /**
   * Check if terminal can be permanently deleted
   * 
   * DELETION RULES:
   * Terminal can ONLY be permanently deleted if it has NO:
   * - Associated berths (child entities)
   * - Vessel compatibility records (historical operations data)
   * - Document requirements (regulatory/operational requirements)
   * 
   * If ANY dependencies exist → ARCHIVE is enforced instead
   * 
   * RATIONALE:
   * Prevents data integrity violations and preserves operational history.
   * Archived terminals remain queryable for historical reporting.
   */
  const checkTerminalDeletable = (terminal) => {
    const hasBerths = berths.some(b => b.terminal_id === terminal.id);
    const hasCompatibilities = compatibilities.some(c => c.terminal_id === terminal.id);
    const hasRequirements = requirements.some(r => r.terminalId === terminal.id);
    return !hasBerths && !hasCompatibilities && !hasRequirements;
  };

  const deleteTerminalMutation = useMutation({
    mutationFn: (id) => base44.entities.Terminal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['terminals']);
      toast.success('Terminal permanently deleted');
      setDeleteDialogOpen(false);
      setTerminalToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to delete terminal: ' + error.message);
    }
  });

  /**
   * Change terminal status with conditional cascading to berths
   * 
   * CASCADING LOGIC (Critical business rules):
   * 
   * 1. Maintenance Status:
   *    - AUTOMATICALLY cascades to ALL berths (no user choice)
   *    - Rationale: Maintenance shutdowns typically affect entire terminal
   *    - All berths forced to Maintenance status
   * 
   * 2. Operational Status:
   *    - User MUST explicitly set each berth's status (interactive dialog)
   *    - Rationale: Berths can be independently operational/maintenance
   *    - Provides granular control for partial operations
   * 
   * 3. Other Statuses (Planned, Under Construction, Inactive):
   *    - NO cascading to berths
   *    - Rationale: These are planning/configuration states, not operational states
   * 
   * TECHNICAL IMPLEMENTATION:
   * - Uses Promise.all for parallel berth updates (performance)
   * - berthStatuses map provided by SetBerthStatusesDialog for Operational case
   * - Invalidates both terminal and berth query caches to refresh UI
   */
  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, status, berthStatuses }) => {
      const terminalBerths = berths.filter(b => b.terminal_id === id);
      
      // Update terminal status first
      await base44.entities.Terminal.update(id, { status });
      
      // Apply status-specific cascading logic
      if (status === 'Maintenance' && terminalBerths.length > 0) {
        // Maintenance: Force ALL berths to Maintenance (no user choice)
        await Promise.all(terminalBerths.map(berth =>
          base44.entities.Berth.update(berth.id, { status: 'Maintenance' })
        ));
      } else if (status === 'Operational' && terminalBerths.length > 0 && berthStatuses) {
        // Operational: Apply user-selected status for each berth
        await Promise.all(terminalBerths.map(berth =>
          base44.entities.Berth.update(berth.id, { status: berthStatuses[berth.id] || 'Operational' })
        ));
      }
      // Other statuses: No cascading
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['terminals']);
      queryClient.invalidateQueries(['berths']);
      toast.success('Status updated successfully');
      setShowChangeStatus(false);
      setTerminalToChangeStatus(null);
      setShowBerthStatusDialog(false);
      setBerthStatusContext(null);
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });

  /**
   * Archive terminal (soft delete) with cascading to berths
   * 
   * ARCHIVE BEHAVIOR (Critical for data integrity):
   * 
   * Terminal archiving:
   * - Sets isArchived = true (primary soft delete flag)
   * - Sets isActive = false (legacy compatibility)
   * - Forces status = 'Inactive' (operational state)
   * - Records archivedAt timestamp (audit trail)
   * - Stores archivedReason (user-provided explanation)
   * 
   * Berth cascading:
   * - AUTOMATICALLY archives ALL child berths (no choice)
   * - Applies same flags as terminal
   * - Includes parent context in archivedReason for traceability
   * 
   * RATIONALE:
   * - Preserves all historical data for reporting and audit
   * - Prevents orphaned berths (berths without parent terminal)
   * - Maintains referential integrity
   * - Enables full restoration via unarchive
   * 
   * ALTERNATIVE TO:
   * Permanent deletion when terminal has dependencies
   */
  const archiveTerminalMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const terminalBerths = berths.filter(b => b.terminal_id === id);
      
      // Archive terminal with full audit trail
      await base44.entities.Terminal.update(id, { 
        isArchived: true,
        isActive: false,
        status: 'Inactive',
        archivedAt: new Date().toISOString(),
        archivedReason: reason || null
      });
      
      // Cascade archive to all child berths
      if (terminalBerths.length > 0) {
        await Promise.all(terminalBerths.map(berth =>
          base44.entities.Berth.update(berth.id, {
            isArchived: true,
            isActive: false,
            status: 'Inactive',
            archivedAt: new Date().toISOString(),
            archivedReason: `Cascaded from terminal: ${reason || 'Terminal archived'}`
          })
        ));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['terminals']);
      queryClient.invalidateQueries(['berths']);
      toast.success('Terminal and associated berths archived successfully');
      setShowArchiveDialog(false);
      setTerminalToArchive(null);
      setDeleteDialogOpen(false);
      setTerminalToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to archive terminal: ' + error.message);
    }
  });

  const unarchiveTerminalMutation = useMutation({
    mutationFn: async ({ id, berthStatuses }) => {
      const terminalBerths = berths.filter(b => b.terminal_id === id);
      
      // Unarchive terminal and set to Operational
      await base44.entities.Terminal.update(id, { 
        isArchived: false,
        isActive: true,
        status: 'Operational',
        archivedAt: null,
        archivedReason: null
      });
      
      // Update berths with user-selected statuses
      if (terminalBerths.length > 0 && berthStatuses) {
        await Promise.all(terminalBerths.map(berth =>
          base44.entities.Berth.update(berth.id, {
            isArchived: false,
            isActive: true,
            status: berthStatuses[berth.id] || 'Operational',
            archivedAt: null,
            archivedReason: null
          })
        ));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['terminals']);
      queryClient.invalidateQueries(['berths']);
      toast.success('Terminal and associated berths unarchived successfully');
      setShowUnarchiveDialog(false);
      setTerminalToUnarchive(null);
    },
    onError: (error) => {
      toast.error('Failed to unarchive terminal: ' + error.message);
    }
  });

  /**
   * Handle delete button click with smart routing
   * 
   * DECISION LOGIC:
   * 1. Check if terminal has dependencies (berths, compatibilities, requirements)
   * 2. If dependencies exist → Route to ARCHIVE dialog (soft delete)
   * 3. If no dependencies → Route to DELETE dialog (permanent)
   * 
   * This prevents users from attempting invalid operations and guides them
   * to the appropriate action based on data relationships.
   * 
   * UX PATTERN:
   * User clicks "Delete" button → System intelligently shows correct dialog
   * User doesn't need to understand archive vs delete distinction
   */
  const handleDeleteClick = (terminal, e) => {
    e.preventDefault();
    e.stopPropagation();
    setTerminalToDelete(terminal);
    const canDelete = checkTerminalDeletable(terminal);
    if (!canDelete) {
      // Has dependencies → Force archive instead of delete
      setTerminalToArchive(terminal);
      setShowArchiveDialog(true);
    } else {
      // No dependencies → Allow permanent delete
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (terminalToDelete) {
      deleteTerminalMutation.mutate(terminalToDelete.id);
    }
  };

  const handleChangeStatus = (terminal, e) => {
    e.preventDefault();
    e.stopPropagation();
    setTerminalToChangeStatus(terminal);
    setShowChangeStatus(true);
  };

  /**
   * Handle status change confirmation from ChangeTerminalStatusDialog
   * 
   * WORKFLOW BRANCHING:
   * 
   * Case 1: Operational Status + Has Berths
   *   → Show SetBerthStatusesDialog (user must set each berth)
   *   → Preserves change context in berthStatusContext
   *   
   * Case 2: Maintenance Status + Has Berths
   *   → Immediate cascade (no dialog)
   *   → All berths automatically set to Maintenance
   *   
   * Case 3: Other Status OR No Berths
   *   → Immediate update (no cascading)
   *   
   * This implements the cascading logic UI flow described in changeStatusMutation
   */
  const handleStatusSave = (status) => {
    if (terminalToChangeStatus) {
      const terminalBerths = berths.filter(b => b.terminal_id === terminalToChangeStatus.id);
      
      if ((status === 'Operational' || status === 'Maintenance') && terminalBerths.length > 0) {
        if (status === 'Operational') {
          // Operational → Show dialog for individual berth status selection
          setBerthStatusContext({ terminalId: terminalToChangeStatus.id, newStatus: status, berths: terminalBerths });
          setShowChangeStatus(false);
          setShowBerthStatusDialog(true);
        } else {
          // Maintenance → Auto-cascade without dialog
          changeStatusMutation.mutate({ id: terminalToChangeStatus.id, status });
        }
      } else {
        // No special handling needed
        changeStatusMutation.mutate({ id: terminalToChangeStatus.id, status });
      }
    }
  };

  const handleBerthStatusesSave = (berthStatuses) => {
    if (berthStatusContext) {
      changeStatusMutation.mutate({ 
        id: berthStatusContext.terminalId, 
        status: berthStatusContext.newStatus,
        berthStatuses 
      });
    }
  };

  const handleArchive = (reason) => {
    if (terminalToArchive) {
      archiveTerminalMutation.mutate({ id: terminalToArchive.id, reason });
    }
  };

  const handleUnarchiveClick = (terminal, e) => {
    e.preventDefault();
    e.stopPropagation();
    setTerminalToUnarchive(terminal);
    setShowUnarchiveDialog(true);
  };

  const handleUnarchive = (berthStatuses) => {
    if (terminalToUnarchive) {
      unarchiveTerminalMutation.mutate({ id: terminalToUnarchive.id, berthStatuses });
    }
  };



  const handleFavoriteClick = (terminal, e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteMutation.mutate(terminal.id);
  };

  const { data: berths = [] } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const { data: compatibilities = [] } = useQuery({
    queryKey: ['compatibilities'],
    queryFn: () => base44.entities.VesselCompatibility.list()
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.TerminalDocumentRequirement.list()
  });

  const getCountryName = (terminal) => {
    if (terminal.countryId) {
      const country = countries.find(c => c.id === terminal.countryId);
      return country?.nameEn || terminal.legacyCountryName || 'Unknown';
    }
    return terminal.legacyCountryName || 'Unknown';
  };

  const getProductTypeName = (terminal) => {
    if (terminal.productTypeRefId) {
      const productType = productTypes.find(pt => pt.id === terminal.productTypeRefId);
      return productType?.code || 'N/A';
    }
    return 'N/A';
  };

  const getProductType = (terminal) => {
    if (terminal.productTypeRefId) {
      return productTypes.find(pt => pt.id === terminal.productTypeRefId);
    }
    return null;
  };

  const uniqueProducts = [...new Set(
    terminals
      .filter(t => t.productTypeRefId)
      .map(t => {
        const pt = productTypes.find(p => p.id === t.productTypeRefId);
        return pt ? JSON.stringify({ id: pt.id, code: pt.code, name: pt.name }) : null;
      })
      .filter(Boolean)
  )].map(s => JSON.parse(s));

  const getBerthCount = (terminalId) => berths.filter(b => b.terminal_id === terminalId).length;

  const favoriteTerminalIds = user?.favoriteTerminalIds || [];
  const isFavorite = (terminalId) => favoriteTerminalIds.includes(terminalId);

  const statusOrder = { 'Operational': 1, 'Maintenance': 2, 'Under Construction': 3, 'Planned': 4, 'Inactive': 5 };

  /**
   * Filter and sort terminals based on all active filters
   * 
   * FILTER CRITERIA (ALL must match - AND logic):
   * 1. Search query - matches name, country, port, product type, operator
   * 2. Operation type filter - Import/Export/Both
   * 3. Status filter - Operational/Maintenance/etc
   * 4. Product type filter - specific product (LNG, crude oil, etc)
   * 5. Favorite filter - if enabled, only show favorited terminals
   * 6. Archived filter - active/archived/all
   * 
   * SORT PRIORITY:
   * 1. Favorites first (user-specific convenience)
   * 2. Then by operational status (Operational > Maintenance > Under Construction > Planned > Inactive)
   * 
   * This ensures critical operational terminals are always visible at top
   */
  const filteredTerminals = terminals
    .filter(t => {
      const countryName = getCountryName(t);
      const productTypeName = getProductTypeName(t);
      
      // Multi-field search (case-insensitive)
      const matchesSearch = t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            countryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.port?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            productTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.operator?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Discrete filters
      const matchesType = filterType === 'all' || t.operation_type === filterType;
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesProduct = filterProduct === 'all' || t.productTypeRefId === filterProduct;
      const matchesFavorite = !showFavoritesOnly || isFavorite(t.id);
      const matchesArchived = archivedFilter === 'all' ? true : 
                              archivedFilter === 'archived' ? t.isArchived : 
                              !t.isArchived;
      
      return matchesSearch && matchesType && matchesStatus && matchesProduct && matchesFavorite && matchesArchived;
    })
    .sort((a, b) => {
      // Favorites always sort to top
      const aFav = isFavorite(a.id);
      const bFav = isFavorite(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      
      // Then sort by operational priority
      return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
    });

  const statusColors = {
    'Operational': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Maintenance': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Under Construction': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Planned': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Inactive': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Terminals</h1>
            <p className="text-gray-600 mt-1">Manage global terminal network</p>
          </div>
          <Link to={createPageUrl('AddTerminal')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Terminal
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search terminals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-20 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
          {searchQuery && (
            <>
              <span className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                ({filteredTerminals.length})
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-40 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Types</SelectItem>
            <SelectItem value="Import" className="text-gray-900">Import</SelectItem>
            <SelectItem value="Export" className="text-gray-900">Export</SelectItem>
            <SelectItem value="Import/Export" className="text-gray-900">Import/Export</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-full md:w-40 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Products" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Products</SelectItem>
            {uniqueProducts.map((pt) => (
              <SelectItem key={pt.id} value={pt.id} className="text-gray-900">{pt.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-48 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-gray-900">All Status</SelectItem>
            <SelectItem value="Operational" className="text-gray-900">Operational</SelectItem>
            <SelectItem value="Maintenance" className="text-gray-900">Maintenance</SelectItem>
            <SelectItem value="Under Construction" className="text-gray-900">Under Construction</SelectItem>
            <SelectItem value="Planned" className="text-gray-900">Planned</SelectItem>
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
          tooltip={showFavoritesOnly ? "Show all terminals" : "Show favorites only"}
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

      {/* Grid View */}
      {viewMode === 'grid' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filteredTerminals.map((terminal) => {
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);
            if (filterType !== 'all') params.set('type', filterType);
            if (filterStatus !== 'all') params.set('status', filterStatus);
            if (filterProduct !== 'all') params.set('product', filterProduct);
            if (viewMode !== 'grid') params.set('view', viewMode);
            if (showFavoritesOnly) params.set('favorites', 'true');
            if (archivedFilter !== 'active') params.set('archived', archivedFilter);
            const returnUrl = `Terminals${params.toString() ? '?' + params.toString() : ''}`;
            return (
            <Link key={terminal.id} to={createPageUrl(`TerminalDetail?id=${terminal.id}&returnTo=${encodeURIComponent(returnUrl)}`)}>
              <Card className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all group cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                    <Building2 className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <div onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}>
                        <FavoriteToggle
                          isFavorite={isFavorite(terminal.id)}
                          onToggle={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();
                            toggleFavoriteMutation.mutate(terminal.id);
                          }}
                          size="sm"
                        />
                      </div>
                      {!terminal.isArchived && (
                        <>
                          <IconButton
                            icon={ToggleLeft}
                            tooltip="Change status"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleChangeStatus(terminal, e)}
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all h-auto text-blue-500"
                          />
                          <IconButton
                            icon={Trash2}
                            tooltip="Delete"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteClick(terminal, e)}
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all h-auto text-red-500"
                          />
                        </>
                      )}
                    </div>
                    <Badge className={`${statusColors[terminal.status]} border`}>
                      {terminal.status}
                    </Badge>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
                  {terminal.name}
                </h3>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5" />
                    {terminal.port}, {getCountryName(terminal)}
                  </div>
                  <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                    {getProductTypeName(terminal)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Anchor className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{getBerthCount(terminal.id)} Berths</span>
                    </div>
                    <Badge variant="outline" className="border-gray-300 text-gray-700">
                      {terminal.operation_type || 'N/A'}
                    </Badge>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                </div>
                </CardContent>
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
                  <TableHead className="text-gray-600">Terminal</TableHead>
                  <TableHead className="text-gray-600">Location</TableHead>
                  <TableHead className="text-gray-600">Product</TableHead>
                  <TableHead className="text-gray-600">Type</TableHead>
                  <TableHead className="text-gray-600 text-right">Berths</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerminals.map((terminal) => {
                  const params = new URLSearchParams();
                  if (searchQuery) params.set('search', searchQuery);
                  if (filterType !== 'all') params.set('type', filterType);
                  if (filterStatus !== 'all') params.set('status', filterStatus);
                  if (filterProduct !== 'all') params.set('product', filterProduct);
                  if (viewMode !== 'grid') params.set('view', viewMode);
                  if (showFavoritesOnly) params.set('favorites', 'true');
                  if (archivedFilter !== 'active') params.set('archived', archivedFilter);
                  const returnUrl = `Terminals${params.toString() ? '?' + params.toString() : ''}`;
                  return (
                  <TableRow key={terminal.id} className="border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = createPageUrl(`TerminalDetail?id=${terminal.id}&returnTo=${encodeURIComponent(returnUrl)}`)}>
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <div onClick={(e) => e.stopPropagation()}>
                          <FavoriteToggle
                            isFavorite={isFavorite(terminal.id)}
                            onToggle={() => toggleFavoriteMutation.mutate(terminal.id)}
                            size="sm"
                          />
                        </div>
                        {terminal.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        {terminal.port}, {getCountryName(terminal)}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm">
                      {getProductTypeName(terminal)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gray-300 text-gray-700">
                        {terminal.operation_type || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700 text-right">{getBerthCount(terminal.id)}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[terminal.status]} border`}>
                        {terminal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {terminal.isArchived ? (
                          <IconButton
                            icon={ArchiveRestore}
                            tooltip="Unarchive"
                            variant="ghost"
                            onClick={(e) => handleUnarchiveClick(terminal, e)}
                            className="h-8 w-8 text-green-500 hover:text-green-700"
                          />
                        ) : (
                          <>
                            <IconButton
                              icon={ToggleLeft}
                              tooltip="Change status"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeStatus(terminal, e);
                              }}
                              className="h-8 w-8 text-blue-500 hover:text-blue-700"
                            />
                            <Link to={createPageUrl(`EditTerminal?id=${terminal.id}`)}>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(terminal, e);
                              }}
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

      {/* Compact View */}
      {viewMode === 'compact' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredTerminals.map((terminal) => {
                const params = new URLSearchParams();
                if (searchQuery) params.set('search', searchQuery);
                if (filterType !== 'all') params.set('type', filterType);
                if (filterStatus !== 'all') params.set('status', filterStatus);
                if (filterProduct !== 'all') params.set('product', filterProduct);
                if (viewMode !== 'grid') params.set('view', viewMode);
                if (showFavoritesOnly) params.set('favorites', 'true');
                if (archivedFilter !== 'active') params.set('archived', archivedFilter);
                const returnUrl = `Terminals${params.toString() ? '?' + params.toString() : ''}`;
                return (
                <div key={terminal.id} className="relative">
                  <Link to={createPageUrl(`TerminalDetail?id=${terminal.id}&returnTo=${encodeURIComponent(returnUrl)}`)}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}>
                          <FavoriteToggle
                            isFavorite={isFavorite(terminal.id)}
                            onToggle={() => toggleFavoriteMutation.mutate(terminal.id)}
                            size="sm"
                          />
                        </div>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm group-hover:text-cyan-600 transition-colors">{terminal.name}</p>
                            <p className="text-xs text-gray-600">{terminal.port}, {getCountryName(terminal)}</p>
                          </div>
                          <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                            {getProductTypeName(terminal)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[terminal.status]} border text-xs`}>
                        {terminal.status}
                      </Badge>
                      {terminal.isArchived ? (
                        <IconButton
                          icon={<ArchiveRestore className="w-3 h-3" />}
                          tooltip="Unarchive"
                          variant="ghost"
                          onClick={(e) => handleUnarchiveClick(terminal, e)}
                          className="h-7 w-7 text-green-500 hover:text-green-700"
                        />
                      ) : (
                        <>
                          <IconButton
                            icon={<ToggleLeft className="w-3 h-3" />}
                            tooltip="Change status"
                            variant="ghost"
                            onClick={(e) => handleChangeStatus(terminal, e)}
                            className="h-7 w-7 text-blue-500 hover:text-blue-700"
                          />
                          <Link to={createPageUrl(`EditTerminal?id=${terminal.id}`)}>
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
                            onClick={(e) => handleDeleteClick(terminal, e)}
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                          />
                        </>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                    </div>
                    </div>
                    </Link>
                    </div>
                    );
                    })}
                    </div>
                    </CardContent>
        </Card>
      )}

      {filteredTerminals.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No terminals found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first terminal'}
          </p>
          <Link to={createPageUrl('AddTerminal')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Terminal
            </Button>
          </Link>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Permanently Delete Terminal</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to permanently delete "{terminalToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTerminalMutation.isPending}
            >
              {deleteTerminalMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChangeTerminalStatusDialog
        open={showChangeStatus}
        onOpenChange={setShowChangeStatus}
        terminal={terminalToChangeStatus}
        onSave={handleStatusSave}
      />

      <ArchiveTerminalDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        terminal={terminalToArchive}
        berthCount={terminalToArchive ? berths.filter(b => b.terminal_id === terminalToArchive.id).length : 0}
        onArchive={handleArchive}
      />

      <UnarchiveTerminalDialog
        open={showUnarchiveDialog}
        onOpenChange={setShowUnarchiveDialog}
        terminal={terminalToUnarchive}
        berths={terminalToUnarchive ? berths.filter(b => b.terminal_id === terminalToUnarchive.id) : []}
        onUnarchive={handleUnarchive}
      />

      <SetBerthStatusesDialog
        open={showBerthStatusDialog}
        onOpenChange={setShowBerthStatusDialog}
        berths={berthStatusContext?.berths || []}
        defaultStatus={berthStatusContext?.newStatus === 'Operational' ? 'Operational' : 'Maintenance'}
        title="Update Berth Statuses"
        description={`Set the operational status for each berth:`}
        onSave={handleBerthStatusesSave}
      />
    </div>
  );
}