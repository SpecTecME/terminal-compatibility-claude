/**
 * Edit UDF Configuration Page (Two-Panel Interface)
 * 
 * PURPOSE:
 * Configure UDF slot metadata and manage dropdown values.
 * Split-screen: Configuration form (left) + List values manager (right).
 * 
 * UDF CONFIGURATION (Left Panel, lines 222-296):
 * 
 * DISABLED FIELDS (lines 229-248):
 * Module, UDF Code, Field Type, Max Length are READ-ONLY.
 * Preconfigured during initialization, cannot change.
 * 
 * RATIONALE:
 * - module/udfCode: Hardcoded in database schema (Vessel.udf01)
 * - fieldType: Would require schema migration (always Text)
 * - maxLength: Database constraint, cannot change dynamically
 * 
 * EDITABLE FIELDS:
 * 
 * 1. LABEL (line 251-260):
 *    Display name for the UDF.
 *    
 *    SPECIAL BEHAVIOR:
 *    - NULL/Empty → Field HIDDEN everywhere (forms, lists, views)
 *    - Set → Field VISIBLE with this label
 *    
 *    USE CASE:
 *    - Want UDF01: Set label = "Fleet Number"
 *    - Don't want UDF02: Leave label empty (hidden)
 *    
 *    VISIBILITY CONTROL:
 *    Admin controls which UDFs are active via label presence.
 * 
 * 2. INCLUDE IN SEARCH (line 263-272):
 *    - Only applies if label is set
 *    - Adds UDF to vessel list page search/filter
 *    - Enables finding vessels by custom field values
 *    
 *    EXAMPLE:
 *    - label="Fleet Number", includeInSearch=true
 *    - User can search vessels by fleet number
 * 
 * 3. CREATE LIST (line 274-283):
 *    Determines input type:
 *    
 *    FALSE (default):
 *    - Free-text input
 *    - User types any value
 *    - Example: Serial numbers, free-form codes
 *    
 *    TRUE:
 *    - Dropdown select
 *    - User picks from predefined list
 *    - Managed in right panel
 *    - Example: Fleet assignments, project codes
 *    
 *    ENABLES RIGHT PANEL (line 299):
 *    List values editor only shown when createList=true.
 * 
 * LIST VALUES MANAGER (Right Panel, lines 299-365):
 * 
 * CONDITIONAL RENDERING (line 299):
 * Only shows if formData.createList is true.
 * No dropdown values needed for free-text fields.
 * 
 * VALUE TABLE (lines 309-363):
 * Manages dropdown options for this UDF.
 * 
 * COLUMNS:
 * - Grip icon: Visual affordance (drag-drop future feature?)
 * - Value: The option text (e.g., "FLEET-A")
 * - Sort Order: Display sequence in dropdown
 * - Actions: Edit/delete buttons
 * 
 * ADD VALUE FLOW (lines 154-158, 303-306):
 * 1. Click "Add Value" button
 * 2. Dialog opens (lines 369-405)
 * 3. Enter value and sort order
 * 4. Creates UdfListValue record (lines 98-116)
 * 
 * AUTO-INCREMENT SORT (line 156):
 * New values get sortOrder = listValues.length * 10.
 * Leaves gaps for inserting between (10, 20, 30... can insert 15).
 * 
 * EDIT VALUE FLOW (lines 160-164, 337-340):
 * 1. Click pencil icon
 * 2. Same dialog, pre-populated
 * 3. Updates existing UdfListValue (lines 118-130)
 * 
 * DELETE VALUE (lines 132-143, 341-351):
 * Soft delete (isActive=false).
 * Value hidden from dropdown but preserved in database.
 * Existing vessel records with this value still valid.
 * 
 * VALUE DIALOG (lines 369-405):
 * Shared for both add and edit.
 * Title changes: "Add Value" vs "Edit Value" (line 372).
 * 
 * MAX LENGTH ENFORCEMENT (line 381):
 * Input maxLength tied to UDF config.
 * Enforces same limit as vessel form field.
 * Prevents creating invalid values.
 * 
 * SORTED DISPLAY (lines 184-186):
 * Values sorted by sortOrder.
 * Filters out inactive (deleted) values.
 * Dropdown shows same order as this table.
 * 
 * TWO-PANEL LAYOUT (line 221):
 * Grid with 1 or 2 columns (responsive).
 * Desktop: Side-by-side panels.
 * Mobile: Stacked vertically.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Plus, Pencil, Trash2, GripVertical, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function EditUdfConfiguration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const configId = urlParams.get('id');

  const [formData, setFormData] = useState({
    label: '',
    includeInSearch: true,
    createList: false
  });

  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [valueFormData, setValueFormData] = useState({ value: '', sortOrder: 0 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [valueToDelete, setValueToDelete] = useState(null);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['udfConfiguration', configId],
    queryFn: async () => {
      const configs = await base44.entities.UdfConfiguration.filter({ id: configId });
      return configs[0];
    },
    enabled: !!configId
  });

  const { data: listValues = [], isLoading: valuesLoading } = useQuery({
    queryKey: ['udfListValues', config?.module, config?.udfCode],
    queryFn: () => base44.entities.UdfListValue.filter({
      module: config.module,
      udfCode: config.udfCode
    }),
    enabled: !!config && config.createList
  });

  useEffect(() => {
    if (config) {
      setFormData({
        label: config.label || '',
        includeInSearch: config.includeInSearch ?? true,
        createList: config.createList ?? false
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.UdfConfiguration.update(configId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['udfConfigurations']);
      queryClient.invalidateQueries(['udfConfiguration', configId]);
      toast.success('Configuration updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    }
  });

  const createValueMutation = useMutation({
    mutationFn: (data) => base44.entities.UdfListValue.create({
      ...data,
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      module: config.module,
      udfCode: config.udfCode,
      isActive: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['udfListValues']);
      setValueDialogOpen(false);
      setValueFormData({ value: '', sortOrder: 0 });
      toast.success('Value added');
    },
    onError: (error) => {
      toast.error('Failed to add value: ' + error.message);
    }
  });

  const updateValueMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UdfListValue.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['udfListValues']);
      setValueDialogOpen(false);
      setEditingValue(null);
      setValueFormData({ value: '', sortOrder: 0 });
      toast.success('Value updated');
    },
    onError: (error) => {
      toast.error('Failed to update value: ' + error.message);
    }
  });

  const deleteValueMutation = useMutation({
    mutationFn: (id) => base44.entities.UdfListValue.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['udfListValues']);
      setDeleteDialogOpen(false);
      setValueToDelete(null);
      toast.success('Value deactivated');
    },
    onError: (error) => {
      toast.error('Failed to deactivate value: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      label: formData.label || null,
      includeInSearch: formData.includeInSearch,
      createList: formData.createList
    });
  };

  const handleAddValue = () => {
    setEditingValue(null);
    setValueFormData({ value: '', sortOrder: listValues.length * 10 });
    setValueDialogOpen(true);
  };

  const handleEditValue = (value) => {
    setEditingValue(value);
    setValueFormData({ value: value.value, sortOrder: value.sortOrder || 0 });
    setValueDialogOpen(true);
  };

  const handleSaveValue = () => {
    if (!valueFormData.value.trim()) {
      toast.error('Value is required');
      return;
    }
    if (editingValue) {
      updateValueMutation.mutate({
        id: editingValue.id,
        data: { value: valueFormData.value, sortOrder: parseInt(valueFormData.sortOrder) || 0 }
      });
    } else {
      createValueMutation.mutate({
        value: valueFormData.value,
        sortOrder: parseInt(valueFormData.sortOrder) || 0
      });
    }
  };

  const sortedValues = [...listValues]
    .filter(v => v.isActive !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Configuration not found</h3>
        <Link to={createPageUrl('UdfConfigurations')}>
          <Button className="mt-4">Back to Configurations</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UDF Configuration</h1>
          <p className="text-sm text-gray-600 mt-1">{config.module} - {config.udfCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Configuration Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Module</Label>
                  <Input value={config.module} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label className="text-gray-500">UDF Code</Label>
                  <Input value={config.udfCode} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Field Type</Label>
                  <Input value={config.fieldType} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label className="text-gray-500">Max Length</Label>
                  <Input value={config.maxLength} disabled className="bg-gray-50" />
                </div>
              </div>

              <div>
                <Label>Label</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Enter label (leave empty to hide)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to hide this UDF field everywhere
                </p>
              </div>

              <div className="flex gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeInSearch"
                    checked={formData.includeInSearch}
                    onCheckedChange={(c) => setFormData({ ...formData, includeInSearch: c })}
                  />
                  <Label htmlFor="includeInSearch" className="cursor-pointer">
                    Include in Search
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="createList"
                    checked={formData.createList}
                    onCheckedChange={(c) => setFormData({ ...formData, createList: c })}
                  />
                  <Label htmlFor="createList" className="cursor-pointer">
                    Create List (Dropdown)
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Link to={createPageUrl('UdfConfigurations')}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List Values (only shown when createList=true) */}
        {formData.createList && (
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dropdown Values</CardTitle>
              <Button size="sm" onClick={handleAddValue}>
                <Plus className="w-4 h-4 mr-2" />
                Add Value
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {sortedValues.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="text-gray-600">Value</TableHead>
                      <TableHead className="text-gray-600">Sort Order</TableHead>
                      <TableHead className="text-gray-600 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedValues.map((value) => (
                      <TableRow key={value.id} className="border-gray-200">
                        <TableCell>
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {value.value}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {value.sortOrder || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditValue(value)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => {
                                setValueToDelete(value);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No dropdown values yet. Click "Add Value" to create one.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Value Dialog */}
      <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingValue ? 'Edit Value' : 'Add Value'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Value *</Label>
              <Input
                value={valueFormData.value}
                onChange={(e) => setValueFormData({ ...valueFormData, value: e.target.value })}
                placeholder="Enter dropdown value"
                maxLength={config.maxLength}
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={valueFormData.sortOrder}
                onChange={(e) => setValueFormData({ ...valueFormData, sortOrder: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValueDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveValue}
              disabled={createValueMutation.isPending || updateValueMutation.isPending}
            >
              {editingValue ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Value</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{valueToDelete?.value}"? It will no longer appear in the dropdown.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteValueMutation.mutate(valueToDelete.id)}
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