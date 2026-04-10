/**
 * Add System Tag Page
 * 
 * PURPOSE:
 * Create new system-wide tags for contacts and companies.
 * Enables admin-controlled categorization across the organization.
 * 
 * FIELD EXPLANATIONS:
 * 
 * 1. NAME (line 82-88):
 *    - Display name for the tag
 *    - Examples: "Key Customer", "IACS Member", "Preferred Vendor"
 *    - REQUIRED
 * 
 * 2. CODE (line 90-98):
 *    - Machine-readable identifier
 *    - Auto-uppercased (line 94)
 *    - Examples: "KEY_CUSTOMER", "IACS_MEMBER", "PREF_VENDOR"
 *    - REQUIRED
 *    - Used in APIs, integrations, programmatic access
 * 
 * 3. CATEGORY (line 103-109):
 *    - Optional grouping for organizing tags
 *    - Examples: "Customer Classification", "Partner Status", "Vendor Tier"
 *    - Free-text for flexibility
 *    - Helps when managing many tags
 * 
 * 4. APPLIES TO (line 122-150):
 *    - Defines which entity types can use this tag
 *    - Multi-select checkboxes
 *    - REQUIRED (at least one must be selected, validated line 53-56)
 *    
 *    OPTIONS:
 *    - Contact: Tag individual people
 *    - Company: Tag organizations
 *    - Both: Tag either type
 *    
 *    VALIDATION:
 *    System blocks submission if neither selected.
 *    
 *    EXAMPLES:
 *    - "Key Contact" → Contact only
 *    - "Strategic Partner" → Company only
 *    - "VIP" → Both (person or organization can be VIP)
 * 
 * 5. SORT ORDER (line 111-119):
 *    - Controls display order in tag lists
 *    - Lower numbers appear first
 *    - Optional (undefined = lowest priority)
 * 
 * 6. ISACTIVE (line 152-158):
 *    - Default true (line 24)
 *    - Controls visibility in tag selection UI
 * 
 * DEFAULT APPLIES TO (line 23):
 * Form defaults to ['Contact'].
 * Most common use case (tagging people).
 * User can add Company if needed.
 * 
 * FORCED VALUES ON CREATE (lines 33-34):
 * 
 * isSystem: false
 * - User-created tags are NOT system tags
 * - System tags created programmatically or via special admin function
 * 
 * isLocked: false
 * - User-created tags are NOT locked
 * - Can be edited or deleted later
 * - Only special system tags should be locked
 * 
 * VALIDATION (lines 47-57):
 * Two required field checks:
 * 1. Name and code must have values
 * 2. At least one "applies to" option selected
 * 
 * Prevents invalid tag creation.
 * 
 * USE CASES:
 * - Categorize key customers vs prospects
 * - Mark IACS member classification societies
 * - Flag preferred vendors
 * - Identify strategic partners
 * - Track relationship types
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function AddSystemTag() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    appliesTo: ['Contact'],
    isSystem: true,
    isLocked: false,
    isActive: true,
    sortOrder: ''
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemTag.create({
      ...data,
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      sortOrder: data.sortOrder ? parseInt(data.sortOrder) : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['systemTags']);
      toast.success('System tag created successfully');
      navigate(createPageUrl('SystemTags'));
    },
    onError: (error) => {
      toast.error('Failed to create tag: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error('Name and code are required');
      return;
    }
    if (!formData.appliesTo || formData.appliesTo.length === 0) {
      toast.error('Select at least one "Applies To" option');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Tag</h1>
          <p className="text-gray-600 mt-1">Create a new system tag</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Tag Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="bg-white border-gray-300 text-gray-900 font-mono"
                  placeholder="UPPERCASE_CODE"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Applies To *</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.appliesTo.includes('Contact')}
                    onCheckedChange={(checked) => {
                      const newAppliesTo = checked
                        ? [...formData.appliesTo, 'Contact']
                        : formData.appliesTo.filter(t => t !== 'Contact');
                      setFormData({...formData, appliesTo: newAppliesTo});
                    }}
                  />
                  <Label className="text-gray-700 font-normal">Contact</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.appliesTo.includes('Company')}
                    onCheckedChange={(checked) => {
                      const newAppliesTo = checked
                        ? [...formData.appliesTo, 'Company']
                        : formData.appliesTo.filter(t => t !== 'Company');
                      setFormData({...formData, appliesTo: newAppliesTo});
                    }}
                  />
                  <Label className="text-gray-700 font-normal">Company</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isSystem}
                  onCheckedChange={(checked) => setFormData({...formData, isSystem: checked})}
                />
                <Label className="text-gray-700">System Tag</Label>
                <span className="text-xs text-gray-500">(Shows purple "System" badge)</span>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isLocked}
                  onCheckedChange={(checked) => setFormData({...formData, isLocked: checked})}
                />
                <Label className="text-gray-700">Locked</Label>
                <span className="text-xs text-gray-500">(Prevents deletion)</span>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label className="text-gray-700">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Link to={createPageUrl('SystemTags')}>
                <Button type="button" variant="outline" className="border-gray-300">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit"
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {createMutation.isPending ? 'Creating...' : 'Create Tag'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}