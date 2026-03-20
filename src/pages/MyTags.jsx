/**
 * My Tags Page (Personal Tag Management)
 * 
 * PURPOSE:
 * User-created tags for personal CRM and workflow organization.
 * Private to each user, distinct from system tags.
 * 
 * DOMAIN CONTEXT - USER TAGS vs SYSTEM TAGS:
 * 
 * USER TAGS (this page):
 * - Personal taxonomy
 * - Each user has their own set
 * - Examples: "Follow Up", "Hot Lead", "VIP Contact"
 * - Self-service creation
 * - Only visible to creator
 * 
 * SYSTEM TAGS (SystemTags page):
 * - Organization-wide taxonomy
 * - Admin-created
 * - Examples: "Key Customer", "IACS Member", "Preferred Vendor"
 * - Visible to all users
 * - Configuration-managed
 * 
 * WHY BOTH:
 * - System tags: Official categorization, reporting
 * - User tags: Personal workflow, relationship tracking
 * 
 * FIELDS:
 * 
 * 1. NAME (line 173-179, 274-279):
 *    Tag display text.
 *    Examples: "Follow Up", "Needs Review", "Star Contact".
 *    REQUIRED (validated lines 107-111, 123-127).
 * 
 * 2. COLOR (line 181-194, 281-294):
 *    Visual identifier for the tag.
 *    
 *    PREDEFINED PALETTE (lines 134-143):
 *    8 colors: blue, green, amber, red, purple, pink, teal, orange.
 *    
 *    COLOR PICKER UI:
 *    Circular buttons showing each color.
 *    Selected color: Larger, black border.
 *    
 *    DEFAULT (line 37, 73):
 *    Blue (#3B82F6) if not specified.
 *    
 *    USAGE:
 *    When tag displayed on contacts/companies:
 *    - Badge background color
 *    - Colored dot
 *    - Visual differentiation
 * 
 * DIALOG-BASED CRUD:
 * 
 * ADD DIALOG (lines 160-205):
 * Inline dialog, not separate page.
 * Quick workflow for tag creation.
 * 
 * EDIT DIALOG (lines 266-314):
 * Same fields as add.
 * Pre-populated with existing data.
 * Separate dialog instance.
 * 
 * DELETE CONFIRMATION (lines 316-336):
 * Alert dialog with warning:
 * "This will remove it from all contacts and companies."
 * 
 * IMPACT:
 * Tag assignments deleted (cascade).
 * User loses categorization on those entities.
 * 
 * HARD DELETE (lines 94-104):
 * Permanently removes tag.
 * No soft delete (personal data, low risk).
 * 
 * TAG DISPLAY (lines 228-261):
 * 
 * GRID LAYOUT:
 * 2-column responsive grid (line 228).
 * 
 * TAG CARD:
 * - Colored circle indicator (lines 235-238)
 * - Tag name
 * - Edit/delete buttons (hover-revealed could be added)
 * 
 * EMPTY STATE (lines 221-226):
 * Shown when no tags created.
 * Encourages creating first tag.
 * 
 * USER SCOPING (lines 54-60):
 * Query filters UserTag by userId.
 * 
 * ENSURES:
 * User only sees their own tags.
 * Privacy between users.
 * 
 * DATA STRUCTURE:
 * {
 *   id, publicId, tenantId,
 *   userId: "user-123",  // Links to specific user
 *   name: "Follow Up",
 *   color: "#3B82F6"
 * }
 * 
 * USAGE IN APP:
 * User applies tags to contacts/companies via:
 * - UserContactTagAssignment entity
 * - UserCompanyTagAssignment entity
 * 
 * Both managed in contact/company detail pages.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from 'sonner';
import { getCurrentUserCached } from '../components/utils/currentUser';

export default function MyTags() {
  const [user, setUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [deleteTag, setDeleteTag] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6'
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUserCached();
        setUser(userData);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['userTags', user?.id],
    queryFn: async () => {
      return await base44.entities.UserTag.filter({ userId: user.id });
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserTag.create({
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      userId: user.id,
      userPublicId: user.publicId || crypto.randomUUID(),
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['userTags']);
      setShowAddDialog(false);
      setFormData({ name: '', color: '#3B82F6' });
      toast.success('Tag created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create tag: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserTag.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userTags']);
      setEditingTag(null);
      setFormData({ name: '', color: '#3B82F6' });
      toast.success('Tag updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update tag: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserTag.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['userTags']);
      setDeleteTag(null);
      toast.success('Tag deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete tag: ' + error.message);
    }
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || '#3B82F6'
    });
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }
    updateMutation.mutate({ id: editingTag.id, data: formData });
  };

  const handleDelete = (tag) => {
    setDeleteTag(tag);
  };

  const predefinedColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tags</h1>
          <p className="text-gray-600 mt-1">Create and manage your personal tags for contacts and companies</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Tag Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., VIP, Follow-up, Partner"
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Color</Label>
                <div className="flex gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Tag'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Your Tags
          </CardTitle>
          <CardDescription>Personal tags visible only to you</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tags created yet</p>
              <p className="text-sm">Create your first tag to get started</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color || '#3B82F6' }}
                    />
                    <span className="font-medium text-gray-900">{tag.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-900"
                      onClick={() => handleEdit(tag)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(tag)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Tag Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Color</Label>
              <div className="flex gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingTag(null)}
                className="flex-1 border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTag} onOpenChange={(open) => !open && setDeleteTag(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Tag</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete "{deleteTag?.name}"? This will remove it from all contacts and companies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTag.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Tag'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}