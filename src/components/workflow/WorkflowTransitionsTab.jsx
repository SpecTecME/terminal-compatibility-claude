import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ArrowRight, CheckCircle, XCircle, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const EMPTY = { is_initial_transition: false, from_status_id: '', to_status_id: '', workflow_action_id: '', is_active: true };
const toForm = (t) => ({
  is_initial_transition: !t.from_status_id,
  from_status_id: t.from_status_id || '',
  to_status_id: t.to_status_id,
  workflow_action_id: t.workflow_action_id,
  is_active: t.is_active ?? true,
});

export default function WorkflowTransitionsTab({ workflowId, readOnly = false }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const qc = useQueryClient();

  const { data: transitions = [] } = useQuery({
    queryKey: ['workflowTransitions', workflowId],
    queryFn: () => base44.entities.WorkflowTransition.filter({ workflow_definition_id: workflowId })
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['workflowStatuses', workflowId],
    queryFn: () => base44.entities.WorkflowStatus.filter({ workflow_definition_id: workflowId })
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['workflowActions', workflowId],
    queryFn: () => base44.entities.WorkflowAction.filter({ workflow_definition_id: workflowId })
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.WorkflowTransition.create({ ...data, workflow_definition_id: workflowId }),
    onSuccess: () => { qc.invalidateQueries(['workflowTransitions', workflowId]); toast.success('Transition created'); close(); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkflowTransition.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['workflowTransitions', workflowId]); toast.success('Transition updated'); close(); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.WorkflowTransition.delete(id),
    onSuccess: () => { qc.invalidateQueries(['workflowTransitions', workflowId]); toast.success('Transition deleted'); }
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.WorkflowTransition.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries(['workflowTransitions', workflowId])
  });

  const close = () => { setDialogOpen(false); setForm(EMPTY); setEditingId(null); };
  const openEdit = (t) => { setForm(toForm(t)); setEditingId(t.id); setDialogOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.is_initial_transition && !form.from_status_id) { toast.error('From status required'); return; }
    if (!form.to_status_id || !form.workflow_action_id) { toast.error('To status and action are required'); return; }
    const payload = { ...form };
    if (form.is_initial_transition) {
      delete payload.from_status_id;
    } else if (!payload.from_status_id) {
      payload.from_status_id = undefined;
    }
    delete payload.is_initial_transition;
    if (editingId) {
      updateMut.mutate({ id: editingId, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const getStatusName = (id) => statuses.find(s => s.id === id)?.status_name || id;
  const getStatusColor = (id) => statuses.find(s => s.id === id)?.color_code || '#9CA3AF';
  const getActionName = (id) => actions.find(a => a.id === id)?.action_name || id;



  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">Configure which statuses can transition to others via which actions.</p>
        {!readOnly && (
          <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600"
            disabled={statuses.length < 2 || actions.length === 0}>
            <Plus className="w-4 h-4 mr-1" /> Add Transition
          </Button>
        )}
      </div>

      {(statuses.length < 2 || actions.length === 0) && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          You need at least 2 statuses and 1 action before adding transitions.
        </div>
      )}

      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">From Status</TableHead>
                <TableHead className="text-gray-600 text-center"></TableHead>
                <TableHead className="text-gray-600">To Status</TableHead>
                <TableHead className="text-gray-600">Triggered By</TableHead>
                <TableHead className="text-gray-600">Active</TableHead>
                <TableHead className="text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transitions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No transitions defined</TableCell></TableRow>
              ) : transitions.map(t => (
                <TableRow key={t.id} className="border-gray-200">
                  <TableCell>
                   {t.from_status_id
                     ? <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor(t.from_status_id) }} />
                         <span className="font-medium text-gray-900">{getStatusName(t.from_status_id)}</span>
                       </div>
                     : <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">On Create</span>
                   }
                  </TableCell>
                  <TableCell className="text-center"><ArrowRight className="w-4 h-4 text-gray-400 mx-auto" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor(t.to_status_id) }} />
                      <span className="font-medium text-gray-900">{getStatusName(t.to_status_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="border-cyan-300 text-cyan-700">{getActionName(t.workflow_action_id)}</Badge></TableCell>
                  <TableCell>
                    <button onClick={() => toggleMut.mutate({ id: t.id, is_active: !t.is_active })}>
                      {t.is_active
                        ? <CheckCircle className="w-5 h-5 text-green-600" />
                        : <XCircle className="w-5 h-5 text-gray-300" />}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                  {!readOnly && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-800" onClick={() => openEdit(t)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteMut.mutate(t.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
          <DialogHeader><DialogTitle className="text-gray-900">{editingId ? 'Edit Transition' : 'Add Transition'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="is_initial_transition"
                checked={form.is_initial_transition}
                onChange={e => setForm({...form, is_initial_transition: e.target.checked, from_status_id: ''})}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <Label htmlFor="is_initial_transition" className="text-blue-800 cursor-pointer font-medium">
                Initial transition (triggered on record creation — no "from" status)
              </Label>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">From Status {form.is_initial_transition ? '' : '*'}</Label>
              <Select
                value={form.from_status_id}
                onValueChange={v => setForm({...form, from_status_id: v})}
                disabled={form.is_initial_transition}
              >
                <SelectTrigger className="bg-white border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={form.is_initial_transition ? '— N/A (initial transition) —' : 'Select from status...'} />
                </SelectTrigger>
                <SelectContent>{statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.status_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Triggered By Action *</Label>
              <Select value={form.workflow_action_id} onValueChange={v => setForm({...form, workflow_action_id: v})}>
                <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select action..." /></SelectTrigger>
                <SelectContent>{actions.map(a => <SelectItem key={a.id} value={a.id}>{a.action_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">To Status *</Label>
              <Select value={form.to_status_id} onValueChange={v => setForm({...form, to_status_id: v})}>
                <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select to status..." /></SelectTrigger>
                <SelectContent>{statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.status_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={close} className="border-gray-300">Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">{editingId ? 'Save' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}