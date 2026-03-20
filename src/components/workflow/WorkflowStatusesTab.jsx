import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const EMPTY = { status_name: '', status_code: '', color_code: '#3B82F6', is_initial: false, is_final: false, sort_order: 10 };

export default function WorkflowStatusesTab({ workflowId, readOnly = false }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  const { data: statuses = [] } = useQuery({
    queryKey: ['workflowStatuses', workflowId],
    queryFn: () => base44.entities.WorkflowStatus.filter({ workflow_definition_id: workflowId })
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.WorkflowStatus.create({ ...data, workflow_definition_id: workflowId }),
    onSuccess: () => { qc.invalidateQueries(['workflowStatuses', workflowId]); toast.success('Status created'); close(); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkflowStatus.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['workflowStatuses', workflowId]); toast.success('Status updated'); close(); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.WorkflowStatus.delete(id),
    onSuccess: () => { qc.invalidateQueries(['workflowStatuses', workflowId]); toast.success('Status deleted'); }
  });

  const close = () => { setDialogOpen(false); setEditing(null); setForm(EMPTY); };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ status_name: s.status_name, status_code: s.status_code, color_code: s.color_code || '#3B82F6',
      is_initial: s.is_initial || false, is_final: s.is_final || false, sort_order: s.sort_order || 10 });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.status_name || !form.status_code) { toast.error('Name and code required'); return; }
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  const sorted = [...statuses].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">Define the states an entity can be in during this workflow.</p>
        {!readOnly && (
          <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Plus className="w-4 h-4 mr-1" /> Add Status
          </Button>
        )}
      </div>
      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Order</TableHead>
                <TableHead className="text-gray-600">Status Name</TableHead>
                <TableHead className="text-gray-600">Code</TableHead>
                <TableHead className="text-gray-600">Color</TableHead>
                <TableHead className="text-gray-600">Initial</TableHead>
                <TableHead className="text-gray-600">Final</TableHead>
                <TableHead className="text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No statuses defined</TableCell></TableRow>
              ) : sorted.map(s => (
                <TableRow key={s.id} className="border-gray-200">
                  <TableCell className="text-gray-600">{s.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color_code || '#3B82F6' }} />
                      <span className="font-medium text-gray-900">{s.status_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-700">{s.status_code}</TableCell>
                  <TableCell><span className="font-mono text-xs text-gray-500">{s.color_code}</span></TableCell>
                  <TableCell>{s.is_initial && <Badge className="bg-green-100 text-green-700 border-green-200">Initial</Badge>}</TableCell>
                  <TableCell>{s.is_final && <Badge className="bg-gray-100 text-gray-600 border-gray-200">Final</Badge>}</TableCell>
                  <TableCell className="text-right">
                   {!readOnly && (
                     <div className="flex justify-end gap-1">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900" onClick={() => openEdit(s)}><Edit className="w-4 h-4" /></Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteMut.mutate(s.id)}><Trash2 className="w-4 h-4" /></Button>
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
          <DialogHeader><DialogTitle className="text-gray-900">{editing ? 'Edit Status' : 'Add Status'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Status Name *</Label>
                <Input value={form.status_name} onChange={e => setForm({...form, status_name: e.target.value})} className="bg-white border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Status Code *</Label>
                <Input value={form.status_code} onChange={e => setForm({...form, status_code: e.target.value.toUpperCase()})} className="bg-white border-gray-300 font-mono" placeholder="e.g. DRAFT" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Color</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.color_code} onChange={e => setForm({...form, color_code: e.target.value})} className="w-10 h-9 rounded border border-gray-300 cursor-pointer" />
                  <Input value={form.color_code} onChange={e => setForm({...form, color_code: e.target.value})} className="bg-white border-gray-300 font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)})} className="bg-white border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Initial Status</Label>
                <Select value={form.is_initial ? 'yes' : 'no'} onValueChange={v => setForm({...form, is_initial: v === 'yes'})}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Final Status</Label>
                <Select value={form.is_final ? 'yes' : 'no'} onValueChange={v => setForm({...form, is_final: v === 'yes'})}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
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