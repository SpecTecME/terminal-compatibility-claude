/**
 * Document Category Detail Page
 * 
 * PURPOSE:
 * Read-only view of document category showing all attributes and metadata.
 * Entry point for editing category information.
 * 
 * SIMPLE DISPLAY:
 * No complex logic, just presents category data.
 * 
 * FIELDS SHOWN:
 * 
 * 1. NAME (line 62-63):
 *    Category display name.
 * 
 * 2. STATUS (line 66-69):
 *    Active/Inactive badge.
 *    Green for active, gray for inactive.
 * 
 * 3. SORT ORDER (line 72-73):
 *    Display priority number (or '-' if null).
 * 
 * 4. CREATED (line 76-79):
 *    When category first added.
 *    Formatted with date-fns: "Jan 12, 2026 14:30".
 * 
 * 5. UPDATED (line 82-85):
 *    Last modification timestamp.
 *    Same format as created date.
 * 
 * 6. DESCRIPTION (line 88-93):
 *    Only shown if description exists.
 *    Separated by border for visual clarity.
 * 
 * EDIT BUTTON (lines 44-49):
 * Navigates to EditDocumentCategory page.
 * Passes categoryId as URL parameter.
 * 
 * NAVIGATION:
 * Back button returns to DocumentCategories list.
 * 
 * NO RELATED DATA:
 * Doesn't show which document types use this category.
 * That would require additional query (may add in future).
 * Current design: Simple detail view only.
 */
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Edit, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function DocumentCategoryDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('id');

  const { data: category, isLoading } = useQuery({
    queryKey: ['documentCategory', categoryId],
    queryFn: () => base44.entities.DocumentCategory.filter({ id: categoryId }).then(r => r[0]),
    enabled: !!categoryId
  });

  if (isLoading || !category) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('DocumentCategories')}>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-gray-600 mt-1">Document Category Details</p>
          </div>
        </div>
        <Link to={createPageUrl(`EditDocumentCategory?id=${categoryId}`)}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Category Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-gray-900 font-medium mt-1">{category.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={`${category.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border mt-1`}>
                {category.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sort Order</p>
              <p className="text-gray-900 font-medium mt-1">{category.sortOrder || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-gray-900 font-medium mt-1">
                {category.created_date ? format(new Date(category.created_date), 'MMM d, yyyy HH:mm') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-gray-900 font-medium mt-1">
                {category.updated_date ? format(new Date(category.updated_date), 'MMM d, yyyy HH:mm') : '-'}
              </p>
            </div>
          </div>
          {category.description && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Description</p>
              <p className="text-gray-900">{category.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}