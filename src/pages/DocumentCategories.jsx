/**
 * Document Categories Page (Hierarchical Classification)
 * 
 * PURPOSE:
 * Manages top-level groupings for document types.
 * Provides organizational structure for hundreds of document types.
 * 
 * DOMAIN CONTEXT - MARITIME DOCUMENT ORGANIZATION:
 * 
 * Maritime compliance involves 100+ document types.
 * Categories provide first-level classification for browsing and filtering.
 * 
 * TYPICAL CATEGORIES:
 * 
 * 1. Class & Statutory Certificates:
 *    - Regulatory certificates from class societies and flag states
 *    - Examples: Certificate of Class, Safety Equipment Certificate
 *    - Legally required for vessel operation
 * 
 * 2. Vetting & Inspection Reports:
 *    - SIRE inspections, CDI reports, terminal assessments
 *    - Time-sensitive, short validity
 *    - Critical for commercial acceptance
 * 
 * 3. Terminal Registration Documents:
 *    - Vessel-terminal compatibility approvals
 *    - Pre-arrival questionnaires, berthing plans
 *    - Terminal-specific requirements
 * 
 * 4. Equipment & Technical Drawings:
 *    - Manifold drawings, mooring arrangements
 *    - Cargo system diagrams
 *    - Permanent reference documents
 * 
 * 5. Operational Forms & Checklists:
 *    - Pre-departure checklists, ship/shore safety checklists
 *    - Internal procedures
 *    - Event-driven, not time-sensitive
 * 
 * RELATIONSHIP TO DOCUMENT TYPES:
 * 
 * Hierarchy: Category → Document Type → Document Instance
 * 
 * Example:
 * - Category: "Class & Statutory Certificates"
 *   - Document Type: "Certificate of Class"
 *     - Document: "DNV Class Cert for Vessel ABC, expires 2026-05-15"
 *   - Document Type: "Safety Equipment Certificate"
 *     - Document: "Panama Safety Cert for Vessel XYZ, expires 2025-12-01"
 * 
 * Categories provide first level of navigation/filtering.
 * 
 * SOFT DELETE (lines 64-75):
 * 
 * Categories use isActive flag for deactivation.
 * Cannot hard delete because:
 * - Existing document types reference categories
 * - Historical documents linked to types linked to categories
 * - Deactivation hides from UI but preserves data integrity
 * 
 * SORT ORDER (lines 102-107):
 * 
 * Same pattern as other master data:
 * - Primary sort by sortOrder (admin-defined priority)
 * - Secondary sort alphabetically
 * 
 * Allows admin to order categories by usage frequency:
 * - Statutory certs (most used) → sortOrder 10
 * - Vetting reports → sortOrder 20
 * - Internal forms → sortOrder 100
 * 
 * THREE VIEW MODES:
 * List (table), Grid (cards), Compact (condensed list).
 * Standard pattern across all master data list pages.
 * 
 * SEARCH SCOPE (lines 90-100):
 * Searches both name and description.
 * Description field often contains keywords users might search.
 * Example: "Statutory" category description mentions "SOLAS, MARPOL, ISM".
 * 
 * UPDATED DATE DISPLAY (line 233):
 * Shows when category last modified.
 * Helps identify stale/outdated categories.
 * Uses date-fns for consistent formatting.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit,
  Eye,
  Trash2,
  List,
  Grid3x3,
  LayoutList,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format } from 'date-fns';

export default function DocumentCategories() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [viewMode, setViewMode] = useState('list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: () => base44.entities.DocumentCategory.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentCategory.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentCategories']);
      toast.success('Category deactivated');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to deactivate category: ' + error.message);
    }
  });

  const handleDeleteClick = (category, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  const filteredCategories = categories
    .filter(c => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = (
        c.name?.toLowerCase().includes(search) || 
        c.description?.toLowerCase().includes(search)
      );
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && c.isActive !== false) ||
        (statusFilter === 'inactive' && c.isActive === false);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return (a.sortOrder || 999) - (b.sortOrder || 999);
      }
      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Categories</h1>
            <p className="text-gray-600 mt-1">Manage master document categories</p>
          </div>
          <Link to={createPageUrl('AddDocumentCategory')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
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
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'Create your first category to get started'}
          </p>
          <Link to={createPageUrl('AddDocumentCategory')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </Link>
        </div>
      ) : viewMode === 'list' ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Name</TableHead>
                  <TableHead className="text-gray-600">Description</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600">Sort Order</TableHead>
                  <TableHead className="text-gray-600">Updated</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id} className="border-gray-200">
                    <TableCell className="font-medium text-gray-900">{category.name}</TableCell>
                    <TableCell className="text-gray-700 max-w-md truncate">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${category.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">{category.sortOrder || '-'}</TableCell>
                    <TableCell className="text-gray-700">
                      {category.updated_date ? format(new Date(category.updated_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={createPageUrl(`DocumentCategoryDetail?id=${category.id}`)}>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link to={createPageUrl(`EditDocumentCategory?id=${category.id}`)}>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700"
                          onClick={(e) => handleDeleteClick(category, e)}
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
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-cyan-400" />
                  </div>
                  <Badge className={`${category.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description || 'No description'}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Order: {category.sortOrder || '-'}</span>
                  <span>{category.updated_date ? format(new Date(category.updated_date), 'MMM d') : '-'}</span>
                </div>
                <div className="flex gap-2">
                  <Link to={createPageUrl(`DocumentCategoryDetail?id=${category.id}`)} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full border-gray-300 text-gray-700">
                      <Eye className="w-3.5 h-3.5 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Link to={createPageUrl(`EditDocumentCategory?id=${category.id}`)} className="flex-1">
                    <Button size="sm" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
                      <Edit className="w-3.5 h-3.5 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => handleDeleteClick(category, e)}
                  >
                    <Trash2 className="w-3 h-3" />
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
              {filteredCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{category.name}</p>
                      <p className="text-xs text-gray-600">Order: {category.sortOrder || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${category.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Link to={createPageUrl(`DocumentCategoryDetail?id=${category.id}`)}>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 h-8 w-8">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl(`EditDocumentCategory?id=${category.id}`)}>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 h-8 w-8">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={(e) => handleDeleteClick(category, e)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                    <AlertDialogTitle>Deactivate Category</AlertDialogTitle>
                    <AlertDialogDescription>
                    Are you sure you want to deactivate "{categoryToDelete?.name}"? The category will be hidden from lists but can be reactivated later.
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