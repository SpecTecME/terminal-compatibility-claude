import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const EMPTY = { action_name: '', action_code: '', description: '', sort_order: 10 };

export default function WorkflowActionsTab({ workflowId, readOnly = false }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  const { data: actions = [] } = useQuery({
    queryKey: ['workflowActions', workflowId],
    queryFn: () => base44.entities.WorkflowAction.filter({ workflow_definition_id: workflowId })
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.WorkflowAction.create({ ...data, workflow_definition_id: workflowId }),
    onSuccess: () => { qc.invalidateQueries(['workflowActions', workflowId]); qc.invalidateQueries(['workflowActions']); toast.success('Action created'); close(); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkflowAction.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['workflowActions', workflowId]); qc.invalidateQueries(['workflowActions']); toast.success('Action updated'); close(); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.WorkflowAction.delete(id),
    onSuccess: () => { qc.invalidateQueries(['workflowActions', workflowId]); toast.success('Action deleted'); }
  });

  const close = () => { setDialogOpen(false); setEditing(null); setForm(EMPTY); };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ action_name: a.action_name, action_code: a.action_code, description: a.description || '', sort_order: a.sort_order || 10 });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.action_name || !form.action_code) { toast.error('Name and code required'); return; }
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  const sorted = [...actions].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">Define the actions that can be executed to trigger transitions.</p>
        {!readOnly && (
          <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Plus className="w-4 h-4 mr-1" /> Add Action
          </Button>
        )}
      </div>
      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Order</TableHead>
                <TableHead className="text-gray-600">Action Name</TableHead>
                <TableHead className="text-gray-600">Code</TableHead>
                <TableHead className="text-gray-600">Description</TableHead>
                <TableHead className="text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No actions defined</TableCell></TableRow>
              ) : sorted.map(a => (
                <TableRow key={a.id} className="border-gray-200">
                  <TableCell className="text-gray-600">{a.sort_order}</TableCell>
                  <TableCell className="font-medium text-gray-900">{a.action_name}</TableCell>
                  <TableCell className="font-mono text-sm text-gray-700">{a.action_code}</TableCell>
                  <TableCell className="text-gray-600 text-sm">{a.description || '-'}</TableCell>
                  <TableCell className="text-right">
                   {!readOnly && (
                     <div className="flex justify-end gap-1">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900" onClick={() => openEdit(a)}><Edit className="w-4 h-4" /></Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteMut.mutate(a.id)}><Trash2 className="w-4 h-4" /></Button>
                     </div>
                   )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) close(); }}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader><DialogTitle className="text-gray-900">{editing ? 'Edit Action' : 'Add Action'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Action Name *</Label>
                <Input value={form.action_name} onChange={e => setForm({...form, action_name: e.target.value})} className="bg-white border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Action Code *</Label>
                <Input value={form.action_code} onChange={e => setForm({...form, action_code: e.target.value.toUpperCase()})} className="bg-white border-gray-300 font-mono" placeholder="e.g. SUBMIT" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)})} className="bg-white border-gray-300" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-white border-gray-300" rows={2} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={close} className="border-gray-300">Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">{editing ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}