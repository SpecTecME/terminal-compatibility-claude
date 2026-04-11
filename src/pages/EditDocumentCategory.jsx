/**
 * Edit/Add Document Category Page (Unified Form)
 * 
 * PURPOSE:
 * Unified form for creating or editing document categories.
 * Organizes document types into hierarchical groups.
 * 
 * UNIFIED PATTERN (lines 21-23):
 * Single component handles both create and edit:
 * - Has id param → Edit mode
 * - No id param → Create mode
 * 
 * USAGE WARNING (lines 111-120):
 * 
 * In edit mode, shows warning if category has document types.
 * 
 * DISPLAYS:
 * "⚠️ This category is used by N document type(s).
 * Disabling it will affect those document types."
 * 
 * RATIONALE:
 * - Informs user of downstream impact
 * - Prevents accidental deactivation
 * - Transparency about relationships
 * 
 * QUERY (lines 38-42):
 * Loads document types filtered by this category.
 * Count shows dependency scale.
 * 
 * EXAMPLE:
 * "Class & Statutory" category has 25 document types.
 * Warning prevents user from blindly deactivating it.
 * 
 * FIELD EXPLANATIONS:
 * 
 * 1. NAME (line 129-136):
 *    - Category display name
 *    - Examples: "Class & Statutory Certificates", "Vetting & Inspection Reports"
 *    - REQUIRED
 *    - Trimmed before save (line 86)
 * 
 * 2. DESCRIPTION (line 139-146):
 *    - Detailed explanation of category scope
 *    - Example: "Certificates issued by classification societies and flag states..."
 *    - Optional (converted to null if empty, line 87)
 *    - Searchable field (helps users find categories)
 * 
 * 3. SORT ORDER (line 150-158):
 *    - Display priority in category lists
 *    - Lower numbers first
 *    - Examples: Statutory certs=10, Internal forms=100
 *    - Optional (null treated as lowest priority)
 * 
 * 4. STATUS (line 161-172):
 *    - isActive toggle
 *    - Switch component for boolean
 *    - Default true for new categories (line 29)
 *    - Soft delete mechanism
 * 
 * DATA TRANSFORMATION (lines 85-90):
 * 
 * Before save:
 * - Trim name (remove whitespace)
 * - Trim description OR set to null (not empty string)
 * - Parse sortOrder to integer OR null
 * 
 * CLEAN DATA PRINCIPLE:
 * No empty strings in database.
 * null vs '' distinction important for queries.
 * 
 * NAVIGATION:
 * Both create and edit return to DocumentCategories list.
 * Consistent with other entity forms.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function EditDocumentCategory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('id');
  const isEdit = !!categoryId;

  const [category, setCategory] = useState({
    name: '',
    description: '',
    isActive: true,
    sortOrder: null
  });

  const { data: existingCategory } = useQuery({
    queryKey: ['documentCategory', categoryId],
    queryFn: () => base44.entities.DocumentCategory.filter({ publicId: categoryId }).then(r => r[0]),
    enabled: isEdit
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes', categoryId],
    queryFn: () => base44.entities.DocumentType.filter({ categoryId }),
    enabled: isEdit
  });

  useEffect(() => {
    if (existingCategory) {
      setCategory({
        name: existingCategory.name || '',
        description: existingCategory.description || '',
        isActive: existingCategory.isActive ?? true,
        sortOrder: existingCategory.sortOrder
      });
    }
  }, [existingCategory]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return await base44.entities.DocumentCategory.update(categoryId, data);
      } else {
        return await base44.entities.DocumentCategory.create({
          ...data,
          publicId: generateUUID(),
          tenantId: getCurrentTenantId()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentCategories'] });
      toast.success(isEdit ? 'Category updated' : 'Category created');
      navigate(createPageUrl('DocumentCategories'));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save category');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!category.name.trim()) {
      toast.error('Name is required');
      return;
    }

    saveMutation.mutate({
      name: category.name.trim(),
      description: category.description.trim() || null,
      isActive: category.isActive,
      sortOrder: category.sortOrder ? parseInt(category.sortOrder) : null
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Category</h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update category details' : 'Create a new document category'}
          </p>
        </div>
      </div>

      {isEdit && documentTypes.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-900">
              ⚠️ This category is used by {documentTypes.length} document type(s).
              Disabling it will affect those document types.
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Category Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Name *</Label>
              <Input
                required
                value={category.name}
                onChange={(e) => setCategory({...category, name: e.target.value})}
                className="bg-white border-gray-300"
                placeholder="e.g., Vessel Design"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Description</Label>
              <Textarea
                value={category.description}
                onChange={(e) => setCategory({...category, description: e.target.value})}
                className="bg-white border-gray-300 min-h-[100px]"
                placeholder="Category description..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Sort Order</Label>
                <Input
                  type="number"
                  value={category.sortOrder || ''}
                  onChange={(e) => setCategory({...category, sortOrder: e.target.value})}
                  className="bg-white border-gray-300"
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={category.isActive}
                    onCheckedChange={(checked) => setCategory({...category, isActive: checked})}
                  />
                  <span className="text-sm text-gray-700">
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to={createPageUrl('DocumentCategories')}>
            <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}