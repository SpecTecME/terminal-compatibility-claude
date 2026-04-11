/**
 * Edit System Tag Page
 * 
 * PURPOSE:
 * Update existing system tags with field locking for protected tags.
 * Respects isSystem and isLocked constraints.
 * 
 * SYSTEM TAG WARNING (lines 100-107):
 * 
 * Purple alert banner for system tags:
 * - Warns user this is a system tag
 * - Indicates code field is immutable
 * - Shield icon reinforces system nature
 * 
 * WHY SHOW WARNING:
 * System tags have special behavior.
 * User should know they're editing protected data.
 * 
 * FIELD LOCKING:
 * 
 * CODE FIELD (lines 126-136):
 * - disabled={tag?.isSystem} (line 131)
 * - System tags: Code immutable
 * - User tags: Code editable
 * 
 * RATIONALE:
 * Code used in programmatic logic.
 * Changing "IACS_MEMBER" breaks features.
 * Name can change, code cannot.
 * 
 * APPLIES TO CHECKBOXES (lines 164-189):
 * - disabled={tag?.isLocked} (lines 172, 185)
 * - Locked tags: Cannot change entity types
 * - Unlocked tags: Full flexibility
 * 
 * RATIONALE:
 * Critical tags locked to specific entity types.
 * Example: "IACS_MEMBER" must apply to Company only.
 * Changing to Contact would break filtering logic.
 * 
 * NAVIGATION DIFFERENCE (line 58, 201):
 * - Cancel returns to SystemTagDetail (not list)
 * - After save navigates to SystemTagDetail (line 58)
 * 
 * Pattern: Edit → return to detail view.
 * User sees updated tag in context.
 * 
 * DUAL QUERY INVALIDATION (lines 55-56):
 * Refreshes list and detail caches.
 * Ensures all views show latest data.
 * 
 * VALIDATION (lines 65-75):
 * Same as AddSystemTag:
 * - Name and code required
 * - At least one "applies to" selected
 * 
 * STATE INITIALIZATION (lines 36-47):
 * Populates form from loaded tag data.
 * Handles null/undefined with || operators.
 * Converts sortOrder to string for input field.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Save, Lock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function EditSystemTag() {
  const urlParams = new URLSearchParams(window.location.search);
  const tagId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    appliesTo: ['Contact'],
    isSystem: false,
    isLocked: false,
    isActive: true,
    sortOrder: ''
  });

  const { data: tag, isLoading } = useQuery({
    queryKey: ['systemTag', tagId],
    queryFn: () => base44.entities.SystemTag.filter({ id: parseInt(tagId) }).then(r => r[0]),
    enabled: !!tagId
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name || '',
        code: tag.code || '',
        category: tag.category || '',
        appliesTo: tag.appliesTo || ['Contact'],
        isSystem: tag.isSystem ?? false,
        isLocked: tag.isLocked ?? false,
        isActive: tag.isActive ?? true,
        sortOrder: tag.sortOrder?.toString() || ''
      });
    }
  }, [tag]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemTag.update(tagId, {
      ...data,
      sortOrder: data.sortOrder ? parseInt(data.sortOrder) : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemTags'] });
      queryClient.invalidateQueries({ queryKey: ['systemTag', tagId] });
      toast.success('System tag updated successfully');
      navigate(createPageUrl(`SystemTagDetail?id=${tagId}`));
    },
    onError: (error) => {
      toast.error('Failed to update tag: ' + error.message);
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
    updateMutation.mutate(formData);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Tag</h1>
          <p className="text-gray-600 mt-1">{tag?.name}</p>
        </div>
      </div>

      {tag?.isSystem && (
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
          <p className="text-sm text-purple-800">
            <Shield className="w-4 h-4 inline mr-1" />
            This is a system tag. Code field is immutable.
          </p>
        </div>
      )}

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
                  disabled={tag?.isSystem}
                  required
                />
                {tag?.isSystem && (
                  <p className="text-xs text-gray-500">Code cannot be changed for system tags</p>
                )}
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
                    disabled={tag?.isLocked}
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
                    disabled={tag?.isLocked}
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
              <Link to={createPageUrl(`SystemTagDetail?id=${tagId}`)}>
                <Button type="button" variant="outline" className="border-gray-300">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}