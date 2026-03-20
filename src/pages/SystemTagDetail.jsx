/**
 * System Tag Detail Page
 * 
 * PURPOSE:
 * Read-only view of system tag with all attributes and metadata.
 * Shows lock status and applies-to scoping.
 * 
 * HEADER BADGES (lines 40-57):
 * 
 * LOCK ICON (line 41):
 * - Shown if tag.isLocked
 * - Indicates tag cannot be deleted
 * - Code and appliesTo fields protected in edit mode
 * 
 * SYSTEM BADGE (lines 45-50):
 * - Purple badge with shield icon
 * - Indicates admin-created system tag
 * - Available to all users
 * 
 * ACTIVE/INACTIVE BADGE (lines 51-56):
 * - Green: Active (visible in selection dropdowns)
 * - Gray: Inactive (hidden but preserved)
 * 
 * CONDITIONAL EDIT BUTTON (lines 60-67):
 * 
 * Edit button hidden if tag.isLocked.
 * 
 * LOCKED TAGS:
 * - Critical system tags
 * - Shouldn't be modified
 * - Examples: tags used in security rules, workflows
 * 
 * UNLOCKED TAGS:
 * - Can be edited/deactivated
 * - Most system tags are unlocked (only name/description changes)
 * 
 * APPLIES TO DISPLAY (lines 103-113):
 * 
 * Shows which entity types can use this tag.
 * Array of badges for each type (Contact, Company).
 * 
 * EXAMPLES:
 * - Contact only: [Contact]
 * - Company only: [Company]
 * - Both: [Contact] [Company]
 * 
 * METADATA SECTION (lines 115-126):
 * 
 * Shows system fields:
 * - publicId: UUID for portability
 * - created_date: When tag created
 * 
 * DATE FORMATTING:
 * Uses date-fns format(date, 'PPP').
 * Produces readable format: "Jan 12, 2026".
 * 
 * NAVIGATION:
 * Back button returns to SystemTags list.
 * Edit button (if shown) goes to EditSystemTag form.
 */
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Edit, Shield, Lock, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function SystemTagDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const tagId = urlParams.get('id');

  const { data: tag, isLoading } = useQuery({
    queryKey: ['systemTag', tagId],
    queryFn: () => base44.entities.SystemTag.filter({ id: tagId }).then(r => r[0]),
    enabled: !!tagId
  });

  if (isLoading || !tag) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('SystemTags')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              {tag.isLocked && <Lock className="w-5 h-5 text-gray-500" />}
              <h1 className="text-2xl font-bold text-gray-900">{tag.name}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {tag.isSystem && (
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 border">
                  <Shield className="w-3 h-3 mr-1" />
                  System
                </Badge>
              )}
              <Badge className={tag.isActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
              }>
                {tag.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        {!tag.isLocked && (
          <Link to={createPageUrl(`EditSystemTag?id=${tagId}`)}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Tag Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Name</p>
              <p className="text-gray-900 font-medium">{tag.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Code</p>
              <code className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-sm font-mono">
                {tag.code}
              </code>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {tag.category && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Category</p>
                <p className="text-gray-900">{tag.category}</p>
              </div>
            )}
            {tag.sortOrder !== undefined && tag.sortOrder !== null && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Sort Order</p>
                <p className="text-gray-900">{tag.sortOrder}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Applies To</p>
            <div className="flex flex-wrap gap-2">
              {tag.appliesTo?.map(type => (
                <Badge key={type} className="bg-blue-500/10 text-blue-600 border-blue-500/30 border">
                  <Tag className="w-3 h-3 mr-1" />
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Public ID</p>
                <code className="text-gray-900 font-mono text-xs">{tag.publicId}</code>
              </div>
              <div>
                <p className="text-gray-600">Created</p>
                <p className="text-gray-900">{format(new Date(tag.created_date), 'PPP')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}