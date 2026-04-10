/**
 * Countries List Page (Master Geo-Political Data)
 * 
 * PURPOSE:
 * Global registry of countries with ISO standard codes and temporal validity.
 * Foundation for flag state, geographic filtering, and regulatory jurisdiction tracking.
 * 
 * DOMAIN CONTEXT - MARITIME GEOGRAPHY:
 * 
 * Countries critical for:
 * - Flag state registration (vessel's legal nationality)
 * - Port/terminal locations
 * - Company headquarters and offices
 * - Regulatory jurisdiction (which maritime laws apply)
 * - Maritime zones (EEZ, territorial waters, ECAs)
 * 
 * TEMPORAL VALIDITY SYSTEM (lines 52-63, 98-102):
 * 
 * Countries have lifecycle managed by validFrom/validTo dates:
 * 
 * RATIONALE FOR TEMPORAL TRACKING:
 * Countries change over time:
 * - New countries created (South Sudan 2011, East Timor 2002)
 * - Countries merge/split (USSR → Russia + others, Yugoslavia split)
 * - Name changes (Burma → Myanmar, Swaziland → Eswatini)
 * - Sovereignty transfers (Hong Kong pre/post 1997)
 * 
 * VALIDITY CALCULATION (isCountryActive function):
 * 1. Compare today's date against validFrom/validTo
 * 2. validFrom not set OR in past → can be active
 * 3. validTo not set → currently active (no end date)
 * 4. validTo in future → still active
 * 5. validTo in past → historical (inactive)
 * 
 * EXAMPLES:
 * - United States: validFrom=null, validTo=null → Always active
 * - USSR: validFrom=1922, validTo=1991 → Inactive (historical)
 * - South Sudan: validFrom=2011-07-09, validTo=null → Active since 2011
 * 
 * BENEFITS:
 * - Preserve historical vessel/terminal data (USSR-flagged vessels in 1980s)
 * - Accurate reporting for any time period
 * - Regulatory compliance (historical flag state tracking)
 * 
 * ISO CODES SYSTEM:
 * 
 * ISO2 (line 189, 203):
 * - ISO 3166-1 alpha-2 code (2 letters)
 * - Examples: US, GB, AE, JP
 * - Primary identifier, globally unique
 * - Used in database keys, APIs, URLs
 * 
 * ISO3 (line 190, 204):
 * - ISO 3166-1 alpha-3 code (3 letters)
 * - Examples: USA, GBR, ARE, JPN
 * - Optional, more readable
 * - Some systems prefer 3-letter codes
 * 
 * WHY BOTH:
 * Different external systems use different formats.
 * Storing both enables integration flexibility.
 * 
 * SEARCH SCOPE (lines 91-96):
 * Multi-field search across:
 * - Country name (e.g., "United Kingdom")
 * - ISO2 (e.g., "GB")
 * - ISO3 (e.g., "GBR")
 * 
 * USER BENEFIT:
 * Can search by any identifier they remember.
 * Type "US" or "USA" or "United States" → all find same country.
 * 
 * SOFT DELETE (lines 65-76):
 * Updates isActive to false instead of hard delete.
 * 
 * PRESERVES:
 * - Historical vessel flag states
 * - Terminal/company locations
 * - Regulatory history
 * 
 * ALTERNATIVE REJECTED:
 * Hard delete would orphan foreign keys.
 * Soft delete maintains referential integrity.
 * 
 * ALPHABETICAL SORTING (line 106):
 * Countries sorted by name (not ISO code).
 * More intuitive for users browsing list.
 * No sortOrder field (not prioritization like other entities).
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { MapPin, Plus, Search, Eye, Edit, Trash2, Grid3x3, List, LayoutList } from 'lucide-react';
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

export default function Countries() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [viewMode, setViewMode] = useState('list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState(null);

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const isCountryActive = (country) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validFrom = country.validFrom ? new Date(country.validFrom) : null;
    const validTo = country.validTo ? new Date(country.validTo) : null;
    
    if (validFrom && validFrom > today) return false;
    if (validTo && validTo < today) return false;
    
    return true;
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Country.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['countries']);
      toast.success('Country deactivated');
      setDeleteDialogOpen(false);
      setCountryToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to deactivate country: ' + error.message);
    }
  });

  const handleDeleteClick = (country, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCountryToDelete(country);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (countryToDelete) {
      deleteMutation.mutate(countryToDelete.id);
    }
  };

  const filteredCountries = countries
    .filter(c => {
      const matchesSearch = 
        c.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.iso2?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.iso3?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const active = isCountryActive(c);
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && active) ||
        (statusFilter === 'inactive' && !active);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Countries</h1>
          <p className="text-gray-600 mt-1">Manage country master data</p>
        </div>
        <Link to={createPageUrl('AddCountry')}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Country
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-gray-300 text-gray-900"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
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
            className={viewMode === 'list' ? 'bg-cyan-600 text-white' : 'border-gray-300 text-gray-700'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'border-gray-300 text-gray-700'}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('compact')}
            className={viewMode === 'compact' ? 'bg-cyan-600 text-white' : 'border-gray-300 text-gray-700'}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'list' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No countries found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Name</TableHead>
                    <TableHead className="text-gray-600">ISO2</TableHead>
                    <TableHead className="text-gray-600">ISO3</TableHead>
                    <TableHead className="text-gray-600">Valid From</TableHead>
                    <TableHead className="text-gray-600">Valid To</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCountries.map((country) => {
                    const active = isCountryActive(country);
                    return (
                      <TableRow key={country.id} className="border-gray-200">
                        <TableCell className="font-medium text-gray-900">{country.nameEn}</TableCell>
                        <TableCell className="text-gray-700">{country.iso2}</TableCell>
                        <TableCell className="text-gray-700">{country.iso3 || '-'}</TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {country.validFrom ? new Date(country.validFrom).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {country.validTo ? new Date(country.validTo).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={active 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
                          }>
                            {active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link to={createPageUrl(`CountryDetail?id=${country.id}`)}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to={createPageUrl(`EditCountry?id=${country.id}`)}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(country, e);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCountries.map((country) => {
            const active = isCountryActive(country);
            return (
              <Link key={country.id} to={createPageUrl(`CountryDetail?id=${country.id}`)}>
                <Card className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all group cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                        <MapPin className="w-6 h-6 text-cyan-400" />
                      </div>
                      <Badge className={active 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
                      }>
                        {active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
                      {country.nameEn}
                    </h3>
                    <div className="flex gap-2 text-sm text-gray-600">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{country.iso2}</code>
                      {country.iso3 && <code className="bg-gray-100 px-2 py-1 rounded text-xs">{country.iso3}</code>}
                    </div>
                  </CardContent>
                  <div className="px-5 pb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleDeleteClick(country, e)}
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Deactivate
                    </Button>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {viewMode === 'compact' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredCountries.map((country) => {
                const active = isCountryActive(country);
                return (
                  <Link key={country.id} to={createPageUrl(`CountryDetail?id=${country.id}`)}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                          <MapPin className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm group-hover:text-cyan-600 transition-colors">{country.nameEn}</p>
                          <p className="text-xs text-gray-600">{country.iso2}{country.iso3 ? ` • ${country.iso3}` : ''}</p>
                        </div>
                      </div>
                      <Badge className={`${active 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                        {active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={(e) => handleDeleteClick(country, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Country</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{countryToDelete?.nameEn}"? The country will be hidden from lists but can be reactivated later.
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