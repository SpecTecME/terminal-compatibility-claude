/**
 * User Tag Manager Component (Inline Tag Assignment)
 * 
 * PURPOSE:
 * Reusable component for managing user tags on contacts and companies.
 * Enables quick tagging without leaving detail page.
 * 
 * PROPS:
 * - entityType: 'contact' or 'company'
 * - entityId: The Contact/Company ID
 * - entityPublicId: Migration-portable UUID
 * 
 * REUSABILITY:
 * Same component used in:
 * - ContactDetail page
 * - CompanyDetail page
 * 
 * DYNAMIC ENTITY HANDLING (lines 40-42):
 * 
 * Maps entityType to correct entities:
 * 
 * IF entityType === 'contact':
 * - assignmentEntity = 'UserContactTagAssignment'
 * - entityField = 'contactId'
 * - entityPublicField = 'contactPublicId'
 * 
 * IF entityType === 'company':
 * - assignmentEntity = 'UserCompanyTagAssignment'
 * - entityField = 'companyId'
 * - entityPublicField = 'companyPublicId'
 * 
 * SINGLE COMPONENT, DUAL USE:
 * No code duplication.
 * Consistent tagging UX.
 * 
 * TAG ASSIGNMENT QUERY (lines 44-51):
 * 
 * Loads assignments for this user + this entity.
 * Filters by userId and contactId/companyId.
 * 
 * RESULT:
 * Which tags are currently assigned.
 * 
 * ASSIGNED TAGS DISPLAY (lines 125-137):
 * 
 * Shows above the popover button.
 * Badges with tag names.
 * 
 * COLOR STYLING (line 131):
 * If tag has color property:
 * - Background: color + '20' (opacity)
 * - Border: color + '50'
 * - Text: pure color
 * 
 * CREATES COLOR-CODED TAGS:
 * Each tag visually distinct.
 * 
 * POPOVER UI (lines 139-194):
 * 
 * TRIGGER BUTTON (lines 140-144):
 * "My Tags" button.
 * Ghost variant (subtle).
 * Tag icon.
 * 
 * POPOVER CONTENT:
 * 
 * EXISTING TAGS LIST (lines 150-169):
 * 
 * Checkbox for each tag (lines 154-167):
 * - Checked if assigned
 * - Click to toggle
 * - Shows tag badge
 * 
 * SCROLLABLE (line 153):
 * max-h-48 overflow-y-auto.
 * Handles many tags gracefully.
 * 
 * EMPTY STATE (lines 150-152):
 * "No tags yet. Add one below!"
 * Encourages creation.
 * 
 * ADD NEW TAG SECTION (lines 172-191):
 * 
 * Separated by border (line 172).
 * 
 * INPUT FIELD (lines 175-181):
 * Tag name entry.
 * Enter key submits (line 179).
 * 
 * ADD BUTTON (lines 182-189):
 * Plus icon.
 * Disabled if empty.
 * 
 * QUICK ADD WORKFLOW:
 * Type name → Press Enter → Tag created AND assigned.
 * No need to close popover, navigate to MyTags, etc.
 * 
 * CREATE & ASSIGN FLOW (lines 55-68, 109-118):
 * 
 * 1. CREATE TAG (lines 55-68):
 *    Creates UserTag record.
 *    Auto-assigns to current user.
 * 
 * 2. IMMEDIATE ASSIGNMENT (line 65):
 *    OnSuccess of create, calls assignTagMutation.
 *    Chained mutations.
 * 
 * RESULT:
 * New tag appears checked in list.
 * Applied to entity immediately.
 * 
 * ASSIGN/UNASSIGN (lines 70-107):
 * 
 * ASSIGN (lines 70-88):
 * Creates assignment record.
 * Links tag to entity for this user.
 * 
 * UNASSIGN (lines 90-99):
 * Finds assignment record.
 * Deletes it.
 * 
 * TOGGLE LOGIC (lines 101-107):
 * Checkbox onChange:
 * - If assigned: Unassign
 * - If not assigned: Assign
 * 
 * DUPLICATE CHECK (lines 112-116):
 * 
 * Before creating tag:
 * Checks if tag with same name exists (case-insensitive).
 * 
 * PREVENTS:
 * User creating "VIP" when "vip" already exists.
 * 
 * ERROR:
 * "Tag already exists"
 * 
 * USER SCOPING:
 * All operations filtered by user.id.
 * User only sees/manages their own tags.
 * Privacy and isolation.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from 'sonner';

export default function UserTagManager({ entityType, entityId, entityPublicId }) {
  const [user, setUser] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: userTags = [] } = useQuery({
    queryKey: ['userTags', user?.id],
    queryFn: () => base44.entities.UserTag.filter({ userId: user.id }),
    enabled: !!user
  });

  const assignmentEntity = entityType === 'contact' ? 'UserContactTagAssignment' : 'UserCompanyTagAssignment';
  const entityField = entityType === 'contact' ? 'contactId' : 'companyId';
  const entityPublicField = entityType === 'contact' ? 'contactPublicId' : 'companyPublicId';

  const { data: assignments = [] } = useQuery({
    queryKey: [`user${entityType}TagAssignments`, user?.id, entityId],
    queryFn: () => base44.entities[assignmentEntity].filter({ 
      userId: user.id,
      [entityField]: entityId 
    }),
    enabled: !!user && !!entityId
  });

  const assignedTagIds = assignments.map(a => a.userTagId);

  const createTagMutation = useMutation({
    mutationFn: (name) => base44.entities.UserTag.create({
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      userId: user.id,
      userPublicId: user.publicId || crypto.randomUUID(),
      name
    }),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries(['userTags']);
      assignTagMutation.mutate(newTag.id);
      setNewTagName('');
    }
  });

  const assignTagMutation = useMutation({
    mutationFn: (tagId) => {
      const tag = userTags.find(t => t.id === tagId);
      return base44.entities[assignmentEntity].create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        userId: user.id,
        userPublicId: user.publicId || crypto.randomUUID(),
        [entityField]: entityId,
        [entityPublicField]: entityPublicId,
        userTagId: tagId,
        userTagPublicId: tag?.publicId || crypto.randomUUID()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`user${entityType}TagAssignments`]);
      toast.success('Tag assigned');
    }
  });

  const unassignTagMutation = useMutation({
    mutationFn: (tagId) => {
      const assignment = assignments.find(a => a.userTagId === tagId);
      return base44.entities[assignmentEntity].delete(assignment.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`user${entityType}TagAssignments`]);
      toast.success('Tag removed');
    }
  });

  const handleToggleTag = (tagId) => {
    if (assignedTagIds.includes(tagId)) {
      unassignTagMutation.mutate(tagId);
    } else {
      assignTagMutation.mutate(tagId);
    }
  };

  const handleAddNewTag = () => {
    if (!newTagName.trim()) return;

    const exists = userTags.some(t => t.name.toLowerCase() === newTagName.toLowerCase());
    if (exists) {
      toast.error('Tag already exists');
      return;
    }

    createTagMutation.mutate(newTagName.trim());
  };

  const assignedTags = userTags.filter(t => assignedTagIds.includes(t.id));

  return (
    <>
      {assignedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {assignedTags.map(tag => (
            <Badge 
              key={tag.id}
              className="bg-slate-100 text-slate-700 border-slate-300 border text-xs"
              style={tag.color ? { backgroundColor: tag.color + '20', borderColor: tag.color + '50', color: tag.color } : {}}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Tag className="w-3 h-3 mr-1" />
            My Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-white border-gray-200">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">My Tags</p>
              {userTags.length === 0 ? (
                <p className="text-sm text-gray-500">No tags yet. Add one below!</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userTags.map(tag => (
                    <label key={tag.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={assignedTagIds.includes(tag.id)}
                        onCheckedChange={() => handleToggleTag(tag.id)}
                      />
                      <Badge 
                        className="bg-slate-100 text-slate-700 border-slate-300 border text-xs"
                        style={tag.color ? { backgroundColor: tag.color + '20', borderColor: tag.color + '50', color: tag.color } : {}}
                      >
                        {tag.name}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Add New Tag</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNewTag()}
                  className="bg-white border-gray-300 text-gray-900 text-sm h-8"
                />
                <Button 
                  size="sm" 
                  onClick={handleAddNewTag}
                  disabled={!newTagName.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 h-8"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}