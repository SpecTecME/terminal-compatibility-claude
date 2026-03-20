/**
 * Terminal Complexes List Page
 * 
 * PURPOSE:
 * Manages port and industrial terminal complexes - the highest level grouping entity
 * in the maritime facility hierarchy.
 * 
 * ENTITY HIERARCHY:
 * TerminalComplex (this entity) → Terminal → Berth
 * 
 * DOMAIN CONTEXT:
 * A Terminal Complex represents a large port or industrial zone that contains multiple
 * individual terminals. Examples:
 * - "Port of Rotterdam" complex containing multiple oil/gas/container terminals
 * - "Ras Laffan Industrial City" containing multiple LNG export terminals
 * - "Singapore Port" containing numerous specialized terminals
 * 
 * KEY DESIGN DECISIONS:
 * 
 * 1. OPTIONAL PARENT RELATIONSHIP:
 *    - Terminal Complexes are OPTIONAL
 *    - Terminals can exist without a parent complex
 *    - Used when organizational grouping provides value
 *    - Not enforced for simple single-terminal facilities
 * 
 * 2. SOFT DELETE ONLY (lines 172-183):
 *    - Deactivation (isActive = false) instead of deletion
 *    - Preserves data for reporting and historical context
 *    - Child terminals remain intact when complex is deactivated
 *    - No cascading delete (unlike Terminal → Berth relationship)
 * 
 * 3. GEOGRAPHIC GROUPING:
 *    - Complexes have country and city (physical location)
 *    - Used for regional reporting and filtering
 *    - Helps users navigate large datasets by geography
 * 
 * 4. OPERATIONAL AUTHORITY:
 *    - operatorAuthority field tracks managing entity
 *    - Often different from terminal operators (hierarchical management)
 *    - Examples: Port authority, industrial zone management
 * 
 * SIMPLER THAN TERMINALS:
 * - No status management (Operational/Maintenance/etc)
 * - No archive/unarchive workflow (just active/inactive)
 * - No cascading operations to children
 * - Purely organizational, not operational
 * 
 * FAVORITE SYSTEM (lines 155-170, 208-209):
 * User-specific favorites stored in favoriteComplexIds array.
 * Favorites sort to top for quick access to frequently monitored complexes.
 * 
 * TERMINAL COUNT AGGREGATION (line 206):
 * Shows how many terminals belong to each complex.
 * Useful for understanding complex size and importance.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Building2, 
  Plus, 
  Search,
  MapPin,
  Edit,
  Trash2,
  List,
  Grid3x3,
  LayoutList,
  X,
  Star,
  ChevronRight,
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
import ArchivedToggle from '../components/ui/ArchivedToggle';
import FavoriteToggle from '../components/ui/FavoriteToggle';
import IconButton from '../components/ui/IconButton';
import { motion } from 'framer-motion';

/**
 * Terminal Complexes List Page
 * 
 * PURPOSE:
 * Manages port and industrial terminal complexes - the highest level grouping entity
 * in the maritime facility hierarchy.
 * 
 * ENTITY HIERARCHY:
 * TerminalComplex (this entity) → Terminal → Berth
 * 
 * DOMAIN CONTEXT:
 * A Terminal Complex represents a large port or industrial zone that contains multiple
 * individual terminals. Examples:
 * - "Port of Rotterdam" complex containing multiple oil/gas/container terminals
 * - "Ras Laffan Industrial City" containing multiple LNG export terminals
 * - "Singapore Port" containing numerous specialized terminals
 * 
 * KEY DESIGN DECISIONS:
 * 
 * 1. OPTIONAL PARENT RELATIONSHIP:
 *    - Terminal Complexes are OPTIONAL
 *    - Terminals can exist without a parent complex
 *    - Used when organizational grouping provides value
 *    - Not enforced for simple single-terminal facilities
 * 
 * 2. SOFT DELETE ONLY:
 *    - Deactivation (isActive = false) instead of deletion
 *    - Preserves data for reporting and historical context
 *    - Child terminals remain intact when complex is deactivated
 *    - No cascading delete (unlike Terminal → Berth relationship)
 * 
 * 3. GEOGRAPHIC GROUPING:
 *    - Complexes have country and city (physical location)
 *    - Used for regional reporting and filtering
 *    - Helps users navigate large datasets by geography
 * 
 * 4. OPERATIONAL AUTHORITY:
 *    - operatorAuthority field tracks managing entity
 *    - Often different from terminal operators (hierarchical management)
 *    - Examples: Port authority, industrial zone management
 * 
 * SIMPLER THAN TERMINALS:
 * - No status management (Operational/Maintenance/etc)
 * - No archive/unarchive workflow (just active/inactive)
 * - No cascading operations to children
 * - Purely organizational, not operational
 */
export default function TerminalComplexes() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  
  // Filter and display state
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [viewMode, setViewMode] = useState(urlParams.get('view') || 'grid');
  const [archivedFilter, setArchivedFilter] = useState(urlParams.get('archived') || 'active');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(urlParams.get('favorites') === 'true');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [complexToDelete, setComplexToDelete] = useState(null);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
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
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (showFavoritesOnly) params.set('favorites', 'true');
    if (archivedFilter !== 'active') params.set('archived', archivedFilter);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, viewMode, showFavoritesOnly, archivedFilter]);

  const { data: complexes = [], isLoading } = useQuery({
    queryKey: ['terminalComplexes'],
    queryFn: () => base44.entities.TerminalComplex.list()
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (complexId) => {
      const currentFavorites = user?.favoriteComplexIds || [];
      const isFavorite = currentFavorites.includes(complexId);
      const newFavorites = isFavorite
        ? currentFavorites.filter(id => id !== complexId)
        : [...currentFavorites, complexId];
      
      await base44.auth.updateMe({ favoriteComplexIds: newFavorites });
      return newFavorites;
    },
    onSuccess: (newFavorites) => {
      setUser({ ...user, favoriteComplexIds: newFavorites });
      queryClient.invalidateQueries(['terminalComplexes']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TerminalComplex.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminalComplexes'] });
      toast.success('Terminal complex deactivated');
      setDeleteDialogOpen(false);
      setComplexToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to deactivate terminal complex: ' + error.message);
    }
  });

  const handleDeleteClick = (complex, e) => {
    e.preventDefault();
    e.stopPropagation();
    setComplexToDelete(complex);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (complexToDelete) {
      deleteMutation.mutate(complexToDelete.id);
    }
  };

  const getCountryName = (complex) => {
    if (complex.countryId) {
      const country = countries.find(c => c.id === complex.countryId);
      return country?.nameEn || 'Unknown';
    }
    return '-';
  };

  const getTerminalCount = (complexId) => terminals.filter(t => t.terminalComplexId === complexId).length;

  const favoriteComplexIds = user?.favoriteComplexIds || [];
  const isFavorite = (complexId) => favoriteComplexIds.includes(complexId);

  const filteredComplexes = complexes
    .filter(c => {
      const matchesSearch = (
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCountryName(c)?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesFavorite = !showFavoritesOnly || isFavorite(c.id);
      const matchesArchived = archivedFilter === 'all' ? true : 
                              archivedFilter === 'archived' ? c.isArchived : 
                              !c.isArchived;
      return matchesSearch && matchesFavorite && matchesArchived;
    })
    .sort((a, b) => {
      const aFav = isFavorite(a.id);
      const bFav = isFavorite(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Terminal Complexes</h1>
            <p className="text-gray-600 mt-1">Manage port and industrial terminal complexes</p>
          </div>
          <Link to={createPageUrl('AddTerminalComplex')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Terminal Complex
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search terminal complexes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-20 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
          {searchQuery && (
            <>
              <span className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                ({filteredComplexes.length})
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
        <ArchivedToggle 
          archivedFilter={archivedFilter}
          onToggle={() => {
            const next = archivedFilter === 'active' ? 'archived' : archivedFilter === 'archived' ? 'all' : 'active';
            setArchivedFilter(next);
          }}
        />
        <IconButton
          icon={<Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-amber-500' : ''}`} />}
          tooltip={showFavoritesOnly ? "Show all complexes" : "Show favorites only"}
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

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredComplexes.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No terminal complexes found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'Create your first terminal complex to get started'}
          </p>
          <Link to={createPageUrl('AddTerminalComplex')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Terminal Complex
            </Button>
          </Link>
        </div>
      ) : viewMode === 'list' ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600 w-8"></TableHead>
                  <TableHead className="text-gray-600">Name</TableHead>
                  <TableHead className="text-gray-600">Country</TableHead>
                  <TableHead className="text-gray-600">City</TableHead>
                  <TableHead className="text-gray-600">Operator</TableHead>
                  <TableHead className="text-gray-600 text-right">Terminals</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplexes.map((complex) => (
                  <TableRow 
                    key={complex.id} 
                    className="border-gray-200 cursor-pointer hover:bg-gray-50"
                    onClick={() => window.location.href = createPageUrl(`TerminalComplexDetail?id=${complex.id}`)}
                  >
                    <TableCell>
                      <div onClick={(e) => e.stopPropagation()}>
                        <FavoriteToggle
                          isFavorite={isFavorite(complex.id)}
                          onToggle={() => toggleFavoriteMutation.mutate(complex.id)}
                          size="sm"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{complex.name}</TableCell>
                    <TableCell className="text-gray-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        {getCountryName(complex)}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">{complex.city || '-'}</TableCell>
                    <TableCell className="text-gray-700">{complex.operatorAuthority || '-'}</TableCell>
                    <TableCell className="text-gray-700 text-right">{getTerminalCount(complex.id)}</TableCell>
                    <TableCell>
                      <Badge className={`${complex.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'} border`}>
                        {complex.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={createPageUrl(`EditTerminalComplex?id=${complex.id}`)}>
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
                          tooltip="Deactivate"
                          variant="ghost"
                          onClick={(e) => handleDeleteClick(complex, e)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filteredComplexes.map((complex) => (
            <Link key={complex.id} to={createPageUrl(`TerminalComplexDetail?id=${complex.id}`)}>
              <Card className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all group cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                      <Building2 className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}>
                        <FavoriteToggle
                          isFavorite={isFavorite(complex.id)}
                          onToggle={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();
                            toggleFavoriteMutation.mutate(complex.id);
                          }}
                          size="sm"
                        />
                      </div>
                      <Badge className={`${complex.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'} border`}>
                        {complex.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
                    {complex.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{complex.city ? `${complex.city}, ${getCountryName(complex)}` : getCountryName(complex)}</span>
                  </div>
                  {complex.operatorAuthority && (
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-medium">Operator:</span> {complex.operatorAuthority}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{getTerminalCount(complex.id)} Terminals</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </motion.div>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredComplexes.map((complex) => (
                <div key={complex.id} className="relative">
                  <Link to={createPageUrl(`TerminalComplexDetail?id=${complex.id}`)}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}>
                          <FavoriteToggle
                            isFavorite={isFavorite(complex.id)}
                            onToggle={() => toggleFavoriteMutation.mutate(complex.id)}
                            size="sm"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                          <Building2 className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-900 text-sm group-hover:text-cyan-600 transition-colors">{complex.name}</p>
                              <p className="text-xs text-gray-600">
                                {complex.city ? `${complex.city}, ${getCountryName(complex)}` : getCountryName(complex)}
                              </p>
                            </div>
                            <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                              {getTerminalCount(complex.id)} Terminals
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${complex.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'} border text-xs`}>
                          {complex.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                        <Link to={createPageUrl(`EditTerminalComplex?id=${complex.id}`)}>
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
                          tooltip="Deactivate"
                          variant="ghost"
                          onClick={(e) => handleDeleteClick(complex, e)}
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                        />
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Deactivate Terminal Complex</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to deactivate "{complexToDelete?.name}"? This will hide the terminal complex but preserve all related terminals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
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