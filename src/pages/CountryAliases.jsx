/**
 * Country Aliases Page (Alternative Country Names)
 * 
 * PURPOSE:
 * Manage alternative names for countries to improve matching and search.
 * Enables flexible data entry while maintaining canonical country records.
 * 
 * DOMAIN CONTEXT - WHY ALIASES NEEDED:
 * 
 * THE PROBLEM:
 * Different data sources use different country names:
 * - Official: "United States of America"
 * - Common: "USA", "United States", "US"
 * - Other: "United Kingdom" vs "UK" vs "Great Britain"
 * 
 * WITHOUT ALIASES:
 * User must know exact canonical name.
 * Search for "USA" finds nothing (if stored as "United States of America").
 * 
 * WITH ALIASES:
 * - Canonical: "United States of America" (Country.nameEn)
 * - Aliases: "USA", "US", "United States" (CountryAlias records)
 * - Search works for all variants
 * 
 * IMPORTANT (line 194, 303-305):
 * "Used for matching and search only (not stored as country name)"
 * 
 * ALIASES ARE NOT:
 * - Alternative official names
 * - Display names
 * - Translations
 * 
 * ALIASES ARE:
 * - Search helpers
 * - Import matching keys
 * - Data normalization aids
 * 
 * GROUPED DISPLAY (lines 154-176):
 * 
 * Organizes aliases by country.
 * 
 * ALGORITHM (lines 154-168):
 * 1. Reduce aliases into country groups
 * 2. Find each alias's country
 * 3. Group by country.nameEn
 * 4. Result: { "United States": { country, aliases: [...] } }
 * 
 * BENEFITS:
 * - Clear which country has which aliases
 * - Easy to spot missing aliases
 * - Grouped management
 * 
 * SEARCH FILTER (lines 170-175):
 * Searches both country names AND alias text.
 * Comprehensive filtering.
 * 
 * DISPLAY (lines 224-264):
 * Each country section:
 * - Country name heading (line 226)
 * - Badge for each alias (lines 228-262)
 * - Sorted alphabetically within group (line 229)
 * 
 * ALIAS BADGES (lines 231-261):
 * 
 * ACTIVE ALIASES:
 * - Blue background (bg-blue-50)
 * - Blue border
 * 
 * INACTIVE ALIASES:
 * - Gray background (bg-gray-50)
 * - "Inactive" badge (line 240-242)
 * 
 * HOVER ACTIONS:
 * Edit and delete buttons appear on hover (line 243).
 * Clean UI, actions accessible when needed.
 * 
 * DUPLICATE CHECK (lines 132-142):
 * 
 * Before save, validates:
 * - Same country
 * - Same alias (case-insensitive)
 * - Different ID (allow editing current)
 * 
 * PREVENTS:
 * Creating "USA" twice for same country.
 * 
 * ERROR MESSAGE (line 140):
 * "This alias already exists for this country"
 * 
 * DUAL ID STORAGE (lines 55-60):
 * Stores both countryId and countryPublicId.
 * Migration portability pattern.
 * 
 * SEARCHABLE SELECT (lines 282-291):
 * Country picker with search.
 * Essential when 200+ countries in database.
 * 
 * HARD DELETE (lines 89-99):
 * Permanently removes alias.
 * Low risk (just search helper).
 * Can always recreate if needed.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import SearchableSelect from '../components/ui/SearchableSelect';

export default function CountryAliases() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAlias, setEditingAlias] = useState(null);
  const [deletingAlias, setDeletingAlias] = useState(null);
  const [formData, setFormData] = useState({
    countryId: '',
    alias: '',
    isActive: true
  });

  const { data: aliases = [], isLoading } = useQuery({
    queryKey: ['countryAliases'],
    queryFn: () => base44.entities.CountryAlias.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const country = countries.find(c => c.id === data.countryId);
      return base44.entities.CountryAlias.create({
        ...data,
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        countryPublicId: country.publicId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['countryAliases']);
      setShowDialog(false);
      setEditingAlias(null);
      resetForm();
      toast.success('Alias created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create alias: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CountryAlias.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['countryAliases']);
      setShowDialog(false);
      setEditingAlias(null);
      resetForm();
      toast.success('Alias updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update alias: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CountryAlias.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['countryAliases']);
      setDeletingAlias(null);
      toast.success('Alias deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete alias: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      countryId: '',
      alias: '',
      isActive: true
    });
  };

  const handleAdd = () => {
    setEditingAlias(null);
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (alias) => {
    setEditingAlias(alias);
    setFormData({
      countryId: alias.countryId,
      alias: alias.alias,
      isActive: alias.isActive ?? true
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.countryId || !formData.alias.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check for duplicate alias (case-insensitive)
    const duplicate = aliases.find(a => 
      a.id !== editingAlias?.id &&
      a.countryId === formData.countryId &&
      a.alias.toLowerCase() === formData.alias.trim().toLowerCase()
    );

    if (duplicate) {
      toast.error('This alias already exists for this country');
      return;
    }

    if (editingAlias) {
      updateMutation.mutate({
        id: editingAlias.id,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Group aliases by country
  const aliasesByCountry = aliases.reduce((acc, alias) => {
    const country = countries.find(c => c.id === alias.countryId);
    if (!country) return acc;
    
    const countryName = country.nameEn;
    if (!acc[countryName]) {
      acc[countryName] = {
        country,
        aliases: []
      };
    }
    acc[countryName].aliases.push(alias);
    return acc;
  }, {});

  // Filter by search term
  const filteredGroups = Object.entries(aliasesByCountry).filter(([countryName, data]) => {
    const term = searchTerm.toLowerCase();
    return countryName.toLowerCase().includes(term) ||
      data.aliases.some(a => a.alias.toLowerCase().includes(term));
  }).sort(([a], [b]) => a.localeCompare(b));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Country Aliases</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Manage alternative names for countries (used for matching and search only)
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-gradient-to-r from-cyan-500 to-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Alias
        </Button>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search countries or aliases..."
                className="pl-10 bg-white border-gray-300"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No aliases found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroups.map(([countryName, data]) => (
                <div key={countryName} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                  <h3 className="font-semibold text-gray-900 mb-3">{countryName}</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.aliases
                      .sort((a, b) => a.alias.localeCompare(b.alias))
                      .map((alias) => (
                        <div
                          key={alias.id}
                          className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                            alias.isActive === false
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <span className="text-sm text-gray-900">{alias.alias}</span>
                          {alias.isActive === false && (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEdit(alias)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-600 hover:text-red-700"
                              onClick={() => setDeletingAlias(alias)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle>
              {editingAlias ? 'Edit Alias' : 'Add Alias'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Country *</Label>
              <SearchableSelect
                value={formData.countryId}
                onValueChange={(value) => setFormData({...formData, countryId: value})}
                options={countries
                  .filter(c => c.nameEn)
                  .sort((a, b) => a.nameEn.localeCompare(b.nameEn))
                  .map(c => ({ value: c.id, label: c.nameEn }))}
                placeholder="Select country"
                searchPlaceholder="Search countries..."
              />
            </div>

            <div className="space-y-2">
              <Label>Alias *</Label>
              <Input
                value={formData.alias}
                onChange={(e) => setFormData({...formData, alias: e.target.value})}
                placeholder="e.g., USA, UK, South Korea"
                className="bg-white border-gray-300"
                required
              />
              <p className="text-xs text-gray-500">
                Alternative name used for matching and search (not stored as country name)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label>Active</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingAlias(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingAlias
                  ? 'Update'
                  : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAlias} onOpenChange={() => setDeletingAlias(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alias</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the alias "{deletingAlias?.alias}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingAlias.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}