/**
 * Product Types List Page (Terminal/Berth Product Classification)
 * 
 * PURPOSE:
 * Registry of product types that terminals and berths can handle.
 * Foundation for vessel-terminal compatibility matching.
 * 
 * DOMAIN CONTEXT - PRODUCT vs CARGO:
 * 
 * PRODUCT TYPE (this page):
 * - What terminals/berths HANDLE
 * - Facility capability
 * - Examples: LNG, Crude Oil, Refined Products
 * 
 * CARGO TYPE (separate page):
 * - What vessels CARRY
 * - Vessel capability
 * - Links to product types for matching
 * 
 * COMPATIBILITY FLOW:
 * 1. Terminal has productTypeId = "LNG"
 * 2. Vessel has cargoType with productTypeId = "LNG"
 * 3. System matches → Compatible
 * 
 * FIELDS DISPLAYED:
 * 
 * CODE (line 121, 132):
 * Short identifier (LNG, CRUDE, LPG).
 * Used in reports and APIs.
 * 
 * NAME (line 122, 133):
 * Full descriptive name.
 * Displayed in UI dropdowns.
 * 
 * CATEGORY (line 123, 134-137):
 * High-level classification.
 * Color-coded badges for quick identification (lines 58-65).
 * 
 * CRYOGENIC FLAG (line 124, 139-144):
 * Special indicator for ultra-low temperature products.
 * 
 * VISUAL INDICATORS:
 * - CheckCircle (green): Is cryogenic
 * - XCircle (gray): Not cryogenic
 * 
 * IMPORTANCE:
 * Cryogenic products require specialized equipment.
 * Affects terminal infrastructure requirements.
 * 
 * CATEGORY COLORS (lines 58-65):
 * Visual coding system:
 * - GAS: Blue (LNG, LPG)
 * - LIQUID_BULK: Purple (oil, chemicals)
 * - DRY_BULK: Amber (coal, grain)
 * - UNITIZED: Cyan (containers)
 * - PASSENGER: Pink (cruise terminals)
 * - OTHER: Gray (miscellaneous)
 * 
 * Enables quick visual scanning in large lists.
 * 
 * SOFT DELETE (lines 41-51):
 * Deactivates product types instead of deleting.
 * Preserves historical terminal/berth configurations.
 * 
 * CONDITIONAL DELETE BUTTON (line 158):
 * Delete button only shown for active product types.
 * Cannot deactivate already-inactive types.
 * Prevents confusion and redundant operations.
 * 
 * SORT ORDER (line 56):
 * Primary sort by sortOrder field.
 * Allows admin to prioritize common product types.
 * Secondary alphabetical fallback for unordered items.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Plus, Edit, Trash2, Search, Package, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

export default function ProductTypes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { data: productTypes = [], isLoading } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductTypeRef.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      toast.success('Product type deactivated');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to deactivate product type');
    }
  });

  const filtered = productTypes.filter(pt => 
    pt.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pt.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));

  const categoryColors = {
    GAS: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    LIQUID_BULK: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    DRY_BULK: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    UNITIZED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    PASSENGER: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    OTHER: 'bg-gray-500/10 text-gray-400 border-gray-500/30'
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
            <h1 className="text-2xl font-bold text-gray-900">Product Types</h1>
            <p className="text-gray-600 mt-1">Manage terminal product type classifications</p>
          </div>
          <Link to={createPageUrl('AddProductType')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Product Type
            </Button>
          </Link>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No product types found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Code</TableHead>
                    <TableHead className="text-gray-600">Name</TableHead>
                    <TableHead className="text-gray-600">Category</TableHead>
                    <TableHead className="text-gray-600 text-center">Cryogenic</TableHead>
                    <TableHead className="text-gray-600 text-center">Active</TableHead>
                    <TableHead className="text-gray-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((productType) => (
                    <TableRow key={productType.id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{productType.code}</TableCell>
                      <TableCell className="text-gray-700">{productType.name}</TableCell>
                      <TableCell>
                        <Badge className={`${categoryColors[productType.productCategory]} border`}>
                          {productType.productCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {productType.isCryogenic ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${productType.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border`}>
                          {productType.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={createPageUrl(`EditProductType?id=${productType.id}`)}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          {productType.isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(productType.id)}
                              className="h-8 w-8 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Deactivate Product Type</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to deactivate this product type? It will no longer be available for selection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
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