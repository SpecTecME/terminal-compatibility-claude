/**
 * System Tags List Page (Admin-Managed Taxonomy)
 * 
 * PURPOSE:
 * Registry of system-wide tags for categorizing contacts and companies.
 * Admin-controlled taxonomy separate from user-created personal tags.
 * 
 * DOMAIN CONTEXT - DUAL TAGGING SYSTEM:
 * 
 * SYSTEM TAGS (this page):
 * - Admin-created, organization-wide
 * - Consistent across all users
 * - Examples: "Key Customer", "IACS Member", "Preferred Vendor"
 * - Managed via this configuration page
 * - Can be locked (isLocked=true) to prevent deletion
 * 
 * USER TAGS (MyTags page):
 * - User-created, personal taxonomy
 * - Different per user
 * - Examples: "Follow Up", "Hot Lead", "My Network"
 * - Self-service management
 * - Cannot be locked
 * 
 * WHY BOTH:
 * - System tags: Official categorization, reporting, access control
 * - User tags: Personal workflow, CRM, relationship management
 * 
 * TAG ATTRIBUTES:
 * 
 * 1. NAME (line 189, 204):
 *    Display name for the tag.
 * 
 * 2. CODE (line 190, 207-210):
 *    Machine-readable identifier.
 *    Uppercase convention.
 *    Used in APIs and integrations.
 * 
 * 3. CATEGORY (line 191, 212):
 *    Optional grouping (e.g., "Customer Classification", "Partner Status").
 *    Free-text for flexibility.
 * 
 * 4. APPLIES TO (line 192, 213-220):
 *    Defines which entity types can use this tag.
 *    Array field, multiple selection allowed.
 *    
 *    OPTIONS:
 *    - Contact: Tag for individual people
 *    - Company: Tag for organizations
 *    - Both: Tag for either entity type
 *    
 *    EXAMPLES:
 *    - "Key Contact" → Contact only
 *    - "Strategic Partner" → Company only
 *    - "VIP" → Both Contact and Company
 * 
 * 5. ISSYSTEM (line 193, 222-228):
 *    Indicates tag is system-defined (vs user-created).
 *    
 *    SYSTEM TAGS:
 *    - Created by admin
 *    - Available to all users
 *    - Can be locked
 *    
 *    Visual: Purple shield badge.
 * 
 * 6. ISLOCKED (line 203, 279, 345):
 *    Prevents deletion/modification of critical tags.
 *    
 *    LOCKED TAGS:
 *    - Cannot be deleted
 *    - Code cannot be changed (in edit form)
 *    - appliesTo might be locked (in edit form)
 *    
 *    USE CASES:
 *    - "IACS_MEMBER" locked (critical for class society filtering)
 *    - "AUTHORITY" locked (used in security rules)
 *    
 *    Visual: Lock icon next to name.
 * 
 * 7. ISACTIVE (line 194, 230-236):
 *    Controls visibility in tag selection dropdowns.
 *    Soft delete mechanism.
 * 
 * SORT LOGIC (lines 89-93):
 * 
 * THREE-LEVEL SORT:
 * 1. System tags first (isSystem=true on top)
 * 2. Then by sortOrder (admin-defined priority)
 * 3. Finally alphabetically by name
 * 
 * RATIONALE:
 * - System tags more important (show first)
 * - sortOrder for fine-tuning within system/user groups
 * - Alphabetical for predictable browsing
 * 
 * SEARCH SCOPE (lines 78-88):
 * Searches across name, code, and category.
 * Comprehensive coverage for finding tags.
 * 
 * SOFT DELETE (lines 51-62):
 * Sets isActive=false instead of hard delete.
 * Preserves tag assignments on contacts/companies.
 * Tag still exists in database, just hidden.
 * 
 * THREE VIEW MODES:
 * Standard pattern: List (table), Grid (cards), Compact (condensed).
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Tag, Plus, Search, Eye, Edit, Trash2, Lock, Shield, Grid3x3, List, LayoutList, X, ArrowLeft } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SystemTags() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [viewMode, setViewMode] = useState('list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['systemTags'],
    queryFn: () => base44.entities.SystemTag.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SystemTag.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['systemTags']);
      toast.success('Tag deactivated');
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to deactivate tag: ' + error.message);
    }
  });

  const handleDeleteClick = (tag, e) => {
    e.preventDefault();
    e.stopPropagation();
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (tagToDelete) {
      deleteMutation.mutate(tagToDelete.id);
    }
  };

  const filteredTags = tags
    .filter(t => {
      const matchesSearch = (
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && t.isActive !== false) ||
        (statusFilter === 'inactive' && t.isActive === false);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (b.isSystem !== a.isSystem) return b.isSystem ? 1 : -1;
      if ((a.sortOrder || 999) !== (b.sortOrder || 999)) return (a.sortOrder || 999) - (b.sortOrder || 999);
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('ConfigurationSystemConfig')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Tags</h1>
            <p className="text-gray-600 mt-1">Manage system tagging for contacts and companies</p>
          </div>
          <Link to={createPageUrl('AddSystemTag')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Tag
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-white border-gray-300 text-gray-900"
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
            ) : filteredTags.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tags found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Name</TableHead>
                    <TableHead className="text-gray-600">Code</TableHead>
                    <TableHead className="text-gray-600">Category</TableHead>
                    <TableHead className="text-gray-600">Applies To</TableHead>
                    <TableHead className="text-gray-600">Type</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTags.map((tag) => (
                    <TableRow key={tag.id} className="border-gray-200">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tag.isLocked && <Lock className="w-3 h-3 text-gray-500" />}
                          <span className="font-medium text-gray-900">{tag.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-mono">
                          {tag.code}
                        </code>
                      </TableCell>
                      <TableCell className="text-gray-700">{tag.category || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tag.appliesTo?.map(type => (
                            <Badge key={type} className="bg-blue-500/10 text-blue-600 border-blue-500/30 border text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tag.isSystem && (
                          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 border">
                            <Shield className="w-3 h-3 mr-1" />
                            System
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={tag.isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
                        }>
                          {tag.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link to={createPageUrl(`SystemTagDetail?id=${tag.id}`)}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={createPageUrl(`EditSystemTag?id=${tag.id}`)}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={(e) => handleDeleteClick(tag, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          </div>
                          </TableCell>
                          </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTags.map((tag) => (
            <Card key={tag.id} className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                      <Tag className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {tag.isLocked && <Lock className="w-4 h-4 text-gray-500" />}
                      <Badge className={tag.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
                      }>
                        {tag.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <Link to={createPageUrl(`SystemTagDetail?id=${tag.id}`)}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
                      {tag.name}
                    </h3>
                  </Link>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                    {tag.code}
                  </code>
                  {tag.isSystem && (
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 border mt-2">
                      <Shield className="w-3 h-3 mr-1" />
                      System
                    </Badge>
                  )}
                  {tag.category && (
                    <p className="text-sm text-gray-600 mt-2">{tag.category}</p>
                  )}
                  <div className="flex gap-1 mt-3 pt-3 border-t border-gray-200">
                    <Link to={createPageUrl(`SystemTagDetail?id=${tag.id}`)} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link to={createPageUrl(`EditSystemTag?id=${tag.id}`)} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleDeleteClick(tag, e)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
                </Card>
          ))}
        </div>
      )}

      {viewMode === 'compact' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredTags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                        <Tag className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {tag.isLocked && <Lock className="w-3 h-3 text-gray-500" />}
                          <p className="font-medium text-gray-900 text-sm">{tag.name}</p>
                        </div>
                        <code className="text-xs text-gray-600 font-mono">{tag.code}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tag.isSystem && (
                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs">
                          System
                        </Badge>
                      )}
                      <Badge className={`${tag.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                        {tag.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Link to={createPageUrl(`SystemTagDetail?id=${tag.id}`)}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Link to={createPageUrl(`EditSystemTag?id=${tag.id}`)}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={(e) => handleDeleteClick(tag, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{tagToDelete?.name}"? The tag will be hidden from lists but can be reactivated later.
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