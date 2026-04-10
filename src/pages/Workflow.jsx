import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GitBranch, Plus, Edit, Trash2, ChevronRight, Copy, CheckCircle, XCircle, Send, Clock, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkflowStatusesTab from '../components/workflow/WorkflowStatusesTab.jsx';
import WorkflowActionsTab from '../components/workflow/WorkflowActionsTab.jsx';
import WorkflowTransitionsTab from '../components/workflow/WorkflowTransitionsTab.jsx';
import WorkflowDiagramTab from '../components/workflow/WorkflowDiagramTab.jsx';
import WorkflowPermissionsTab from '../components/workflow/WorkflowPermissionsTab.jsx';
import { setBreadcrumbSubPage, clearBreadcrumbSubPage } from '../components/ui/Breadcrumbs.jsx';
import { toast } from 'sonner';

const ALL_TABLES = [
  'Vessel', 'Terminal', 'Berth', 'Document', 'Company', 'Contact',
  'TerminalRegistrationApplication', 'VesselCompatibility', 'ApplicationUser', 'Other'
];

// Generate abbreviated version prefix from table name
function getTableAbbrev(tableName) {
  if (!tableName) return 'WF';
  const abbrevMap = {
    Vessel: 'VSL', Terminal: 'TRM', Berth: 'BTH', Document: 'DOC',
    Company: 'CMP', Contact: 'CNT', TerminalRegistrationApplication: 'TRA',
    VesselCompatibility: 'VCP', ApplicationUser: 'USR', Other: 'WF'
  };
  return abbrevMap[tableName] || tableName.replace(/[^A-Z]/g, '').slice(0, 3) || 'WF';
}

function buildVersionNumber(tableName, existingVersions) {
  const abbrev = getTableAbbrev(tableName);
  const nums = existingVersions
    .filter(v => v.version_number && v.version_number.startsWith(abbrev + '-'))
    .map(v => parseInt(v.version_number.split('-')[1] || '0', 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${abbrev}-${String(next).padStart(3, '0')}`;
}

const LIFECYCLE_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Edit },
  PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
  OBSOLETE: { label: 'Obsolete', color: 'bg-gray-100 text-gray-500 border-gray-300', icon: Archive },
};

function LifecycleBadge({ status }) {
  const cfg = LIFECYCLE_CONFIG[status] || LIFECYCLE_CONFIG.DRAFT;
  return <Badge variant="outline" className={`${cfg.color} text-xs`}>{cfg.label}</Badge>;
}

const EMPTY_FORM = { workflow_name: '', table_name: '', description: '' };

export default function Workflow() {
  const [newDraftDialog, setNewDraftDialog] = useState(false);
  const [newDraftMode, setNewDraftMode] = useState(null); // 'blank' | 'copy'
  const [editDialog, setEditDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [publishDialog, setPublishDialog] = useState(false);
  const [toPublish, setToPublish] = useState(null);
  const [selectedWf, setSelectedWf] = useState(null);
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | table name
  const qc = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflowDefinitions'],
    queryFn: () => base44.entities.WorkflowDefinition.list()
  });

  // --- mutations ---
  const createMut = useMutation({
    mutationFn: (data) => base44.entities.WorkflowDefinition.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries(['workflowDefinitions']);
      toast.success('Draft workflow created');
      setNewDraftDialog(false);
      setForm(EMPTY_FORM);
      setNewDraftMode(null);
      setSelectedWf(created);
    }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkflowDefinition.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['workflowDefinitions']); toast.success('Workflow updated'); setEditDialog(false); setEditing(null); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.WorkflowDefinition.delete(id),
    onSuccess: () => { qc.invalidateQueries(['workflowDefinitions']); toast.success('Workflow deleted'); setDeleteDialog(false); }
  });

  // Publish: set this to PUBLISHED, set existing PUBLISHED for same table to OBSOLETE
  const publishMut = useMutation({
    mutationFn: async (wf) => {
      const existing = workflows.filter(w => w.table_name === wf.table_name && w.lifecycle_status === 'PUBLISHED' && w.id !== wf.id);
      await Promise.all(existing.map(w => base44.entities.WorkflowDefinition.update(w.id, { ...w, lifecycle_status: 'OBSOLETE' })));
      return base44.entities.WorkflowDefinition.update(wf.id, { ...wf, lifecycle_status: 'PUBLISHED', published_date: new Date().toISOString().split('T')[0] });
    },
    onSuccess: () => {
      qc.invalidateQueries(['workflowDefinitions']);
      toast.success('Workflow published. Previous version moved to Obsolete.');
      setPublishDialog(false);
      setToPublish(null);
    }
  });

  // Copy: deep copy statuses, actions, transitions from source
  const copyMut = useMutation({
    mutationFn: async ({ sourceName, sourceTable, sourceDesc, sourceId, versionNumber }) => {
      const newWf = await base44.entities.WorkflowDefinition.create({
        workflow_name: sourceName,
        table_name: sourceTable,
        description: sourceDesc,
        version_number: versionNumber,
        lifecycle_status: 'DRAFT',
        parent_workflow_id: sourceId,
      });
      // Copy statuses
      const srcStatuses = await base44.entities.WorkflowStatus.filter({ workflow_definition_id: sourceId });
      const statusIdMap = {};
      await Promise.all(srcStatuses.map(async s => {
        const created = await base44.entities.WorkflowStatus.create({
          workflow_definition_id: newWf.id,
          status_name: s.status_name, status_code: s.status_code,
          color_code: s.color_code, is_initial: s.is_initial, is_final: s.is_final, sort_order: s.sort_order
        });
        statusIdMap[s.id] = created.id;
      }));
      // Copy actions
      const srcActions = await base44.entities.WorkflowAction.filter({ workflow_definition_id: sourceId });
      const actionIdMap = {};
      await Promise.all(srcActions.map(async a => {
        const created = await base44.entities.WorkflowAction.create({
          workflow_definition_id: newWf.id,
          action_name: a.action_name, action_code: a.action_code,
          description: a.description, sort_order: a.sort_order
        });
        actionIdMap[a.id] = created.id;
      }));
      // Copy transitions (remapping IDs)
      const srcTransitions = await base44.entities.WorkflowTransition.filter({ workflow_definition_id: sourceId });
      await Promise.all(srcTransitions.map(t => base44.entities.WorkflowTransition.create({
        workflow_definition_id: newWf.id,
        from_status_id: t.from_status_id ? statusIdMap[t.from_status_id] : null,
        to_status_id: statusIdMap[t.to_status_id],
        workflow_action_id: actionIdMap[t.workflow_action_id],
        is_active: t.is_active
      })));
      return newWf;
    },
    onSuccess: (newWf) => {
      qc.invalidateQueries(['workflowDefinitions']);
      toast.success('Draft created as copy of published version');
      setNewDraftDialog(false);
      setNewDraftMode(null);
      setSelectedWf(newWf);
    }
  });

  const hasDraftForTable = (tableName) => workflows.some(w => w.table_name === tableName && w.lifecycle_status === 'DRAFT');
  const getPublishedForTable = (tableName) => workflows.find(w => w.table_name === tableName && w.lifecycle_status === 'PUBLISHED');

  const handleCreateDraft = (e) => {
    e.preventDefault();
    if (!form.workflow_name || !form.table_name) { toast.error('Name and target table required'); return; }
    if (hasDraftForTable(form.table_name)) { toast.error('A DRAFT already exists for this entity. Only one draft allowed at a time.'); return; }
    const versionNumber = buildVersionNumber(form.table_name, workflows);
    createMut.mutate({ ...form, version_number: versionNumber, lifecycle_status: 'DRAFT' });
  };

  const handleCopyDraft = () => {
    const published = getPublishedForTable(form.table_name);
    if (!published) { toast.error('No published version found to copy from'); return; }
    if (hasDraftForTable(form.table_name)) { toast.error('A DRAFT already exists for this entity'); return; }
    const versionNumber = buildVersionNumber(form.table_name, workflows);
    copyMut.mutate({
      sourceName: published.workflow_name,
      sourceTable: published.table_name,
      sourceDesc: published.description,
      sourceId: published.id,
      versionNumber
    });
  };

  // Group workflows by entity for display
  const tables = [...new Set(workflows.map(w => w.table_name))].sort();
  const filtered = groupFilter === 'all' ? workflows : workflows.filter(w => w.table_name === groupFilter);
  const sorted = [...filtered].sort((a, b) => {
    const order = { PUBLISHED: 0, DRAFT: 1, OBSOLETE: 2 };
    if (a.table_name !== b.table_name) return a.table_name.localeCompare(b.table_name);
    return (order[a.lifecycle_status] ?? 3) - (order[b.lifecycle_status] ?? 3);
  });

  // Auto-patch missing version_number when a workflow is selected
  const handleSelectWf = async (wf) => {
    if (!wf.version_number) {
      const versionNumber = buildVersionNumber(wf.table_name, workflows);
      await base44.entities.WorkflowDefinition.update(wf.id, { version_number: versionNumber });
      qc.invalidateQueries(['workflowDefinitions']);
    }
    setSelectedWf(wf);
  };

  if (selectedWf) {
    // Re-fetch the latest version of the selected wf from cache
    const latestWf = workflows.find(w => w.id === selectedWf.id) || selectedWf;
    return <WorkflowEditor workflow={latestWf} onBack={() => setSelectedWf(null)} onRefresh={() => qc.invalidateQueries(['workflowDefinitions'])} />;
  }

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Engine</h1>
          <p className="text-gray-600 mt-1">Versioned workflows with lifecycle management (Draft → Published → Obsolete)</p>
        </div>
        <Button onClick={() => setNewDraftDialog(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New Draft
        </Button>
      </div>

      {/* Entity filter tabs */}
      {tables.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={groupFilter === 'all' ? 'default' : 'outline'} onClick={() => setGroupFilter('all')} className="h-7 text-xs">All</Button>
          {tables.map(t => (
            <Button key={t} size="sm" variant={groupFilter === t ? 'default' : 'outline'} onClick={() => setGroupFilter(t)} className="h-7 text-xs">{t}</Button>
          ))}
        </div>
      )}

      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Version</TableHead>
                <TableHead className="text-gray-600">Workflow Name</TableHead>
                <TableHead className="text-gray-600">Target Entity</TableHead>
                <TableHead className="text-gray-600">Lifecycle</TableHead>
                <TableHead className="text-gray-600">Published</TableHead>
                <TableHead className="text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No workflows defined yet</p>
                    <p className="text-sm mt-1">Click "New Draft" to create your first workflow</p>
                  </TableCell>
                </TableRow>
              ) : sorted.map(wf => (
                <TableRow
                  key={wf.id}
                  className={`border-gray-200 cursor-pointer hover:bg-gray-50 ${wf.lifecycle_status === 'OBSOLETE' ? 'opacity-60' : ''}`}
                  onClick={() => handleSelectWf(wf)}
                >
                  <TableCell className="font-mono text-sm font-bold text-gray-700">{wf.version_number || '—'}</TableCell>
                  <TableCell className="font-medium text-gray-900">{wf.workflow_name}</TableCell>
                  <TableCell><Badge variant="outline" className="border-gray-300 text-gray-700">{wf.table_name}</Badge></TableCell>
                  <TableCell><LifecycleBadge status={wf.lifecycle_status || 'DRAFT'} /></TableCell>
                  <TableCell className="text-gray-500 text-sm">{wf.published_date || '—'}</TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {wf.lifecycle_status === 'DRAFT' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900" title="Edit name/description"
                            onClick={() => { setEditing(wf); setForm({ workflow_name: wf.workflow_name, table_name: wf.table_name, description: wf.description || '' }); setEditDialog(true); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-50" title="Publish this draft"
                            onClick={() => { setToPublish(wf); setPublishDialog(true); }}>
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => { setToDelete(wf); setDeleteDialog(true); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 text-gray-400 hover:text-gray-700 px-2" onClick={() => handleSelectWf(wf)}>
                        View <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Draft Dialog */}
      <Dialog open={newDraftDialog} onOpenChange={o => { if (!o) { setNewDraftDialog(false); setNewDraftMode(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create New Draft Workflow</DialogTitle>
          </DialogHeader>

          {!newDraftMode ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">How do you want to create this draft?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setNewDraftMode('blank')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-cyan-400 hover:bg-cyan-50 text-left transition-all group"
                >
                  <Plus className="w-8 h-8 text-cyan-500 mb-2" />
                  <p className="font-semibold text-gray-900">Start Blank</p>
                  <p className="text-xs text-gray-500 mt-1">New empty workflow — define everything from scratch</p>
                </button>
                <button
                  onClick={() => setNewDraftMode('copy')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 text-left transition-all group"
                >
                  <Copy className="w-8 h-8 text-indigo-500 mb-2" />
                  <p className="font-semibold text-gray-900">Copy Published</p>
                  <p className="text-xs text-gray-500 mt-1">Copy the current published version and edit it</p>
                </button>
              </div>
            </div>
          ) : newDraftMode === 'blank' ? (
            <form onSubmit={handleCreateDraft} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Workflow Name *</Label>
                <Input value={form.workflow_name} onChange={e => setForm({...form, workflow_name: e.target.value})} className="bg-white border-gray-300" placeholder="e.g. Terminal Approval" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Target Entity *</Label>
                <Select value={form.table_name} onValueChange={v => setForm({...form, table_name: v})}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select entity..." /></SelectTrigger>
                  <SelectContent>{ALL_TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                {form.table_name && hasDraftForTable(form.table_name) && (
                  <p className="text-xs text-red-600">A DRAFT already exists for {form.table_name}. Only one draft allowed at a time.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Description</Label>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-white border-gray-300" rows={2} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setNewDraftMode(null)} className="border-gray-300">Back</Button>
                <Button type="submit" disabled={createMut.isPending} className="bg-gradient-to-r from-cyan-500 to-blue-600">Create Draft</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Select Entity to copy published version from *</Label>
                <Select value={form.table_name} onValueChange={v => setForm({...form, table_name: v})}>
                  <SelectTrigger className="bg-white border-gray-300"><SelectValue placeholder="Select entity..." /></SelectTrigger>
                  <SelectContent>
                    {ALL_TABLES.map(t => {
                      const pub = getPublishedForTable(t);
                      return pub ? <SelectItem key={t} value={t}>{t} — {pub.version_number}</SelectItem> : null;
                    }).filter(Boolean)}
                  </SelectContent>
                </Select>
                {form.table_name && !getPublishedForTable(form.table_name) && (
                  <p className="text-xs text-amber-600">No published workflow exists for {form.table_name}</p>
                )}
                {form.table_name && hasDraftForTable(form.table_name) && (
                  <p className="text-xs text-red-600">A DRAFT already exists for {form.table_name}</p>
                )}
                {form.table_name && getPublishedForTable(form.table_name) && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700">
                    Will copy <strong>{getPublishedForTable(form.table_name)?.version_number}</strong> — "{getPublishedForTable(form.table_name)?.workflow_name}" including all statuses, actions and transitions.
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setNewDraftMode(null)} className="border-gray-300">Back</Button>
                <Button
                  disabled={!form.table_name || !getPublishedForTable(form.table_name) || hasDraftForTable(form.table_name) || copyMut.isPending}
                  onClick={handleCopyDraft}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  {copyMut.isPending ? 'Copying...' : 'Create Copy as Draft'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog (name/description only, not table/version) */}
      <Dialog open={editDialog} onOpenChange={o => { if (!o) { setEditDialog(false); setEditing(null); } }}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader><DialogTitle className="text-gray-900">Edit Draft Workflow</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); updateMut.mutate({ id: editing.id, data: { ...editing, workflow_name: form.workflow_name, description: form.description } }); }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Workflow Name *</Label>
              <Input value={form.workflow_name} onChange={e => setForm({...form, workflow_name: e.target.value})} className="bg-white border-gray-300" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-white border-gray-300" rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditDialog(false)} className="border-gray-300">Cancel</Button>
              <Button type="submit" disabled={updateMut.isPending} className="bg-gradient-to-r from-cyan-500 to-blue-600">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Publish confirmation */}
      <AlertDialog open={publishDialog} onOpenChange={setPublishDialog}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Publish Workflow</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Publishing <strong>{toPublish?.version_number} — {toPublish?.workflow_name}</strong> will:{' '}
              {getPublishedForTable(toPublish?.table_name)
                ? <>move <strong>{getPublishedForTable(toPublish?.table_name)?.version_number}</strong> to <em>Obsolete</em>, then set this draft as <em>Published</em>.</>
                : <>set this draft as the Published version.</>
              }
              {' '}Records already in-flight will continue using their original workflow version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toPublish && publishMut.mutate(toPublish)} className="bg-green-600 hover:bg-green-700">Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Draft Workflow</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">Delete draft "{toDelete?.version_number} — {toDelete?.workflow_name}"? All statuses, actions and transitions will also be deleted. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && deleteMut.mutate(toDelete.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WorkflowEditor({ workflow, onBack }) {
  const isDraft = (workflow.lifecycle_status || 'DRAFT') === 'DRAFT';
  const [publishDialog, setPublishDialog] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    setBreadcrumbSubPage(workflow.workflow_name);
    return () => clearBreadcrumbSubPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow.workflow_name]);
  const { data: allWorkflows = [] } = useQuery({ queryKey: ['workflowDefinitions'], queryFn: () => base44.entities.WorkflowDefinition.list() });

  const publishMut = useMutation({
    mutationFn: async (wf) => {
      const existing = allWorkflows.filter(w => w.table_name === wf.table_name && w.lifecycle_status === 'PUBLISHED' && w.id !== wf.id);
      await Promise.all(existing.map(w => base44.entities.WorkflowDefinition.update(w.id, { lifecycle_status: 'OBSOLETE' })));
      return base44.entities.WorkflowDefinition.update(wf.id, { lifecycle_status: 'PUBLISHED', published_date: new Date().toISOString().split('T')[0] });
    },
    onSuccess: () => {
      qc.invalidateQueries(['workflowDefinitions']);
      toast.success('Workflow published!');
      setPublishDialog(false);
      onBack();
    }
  });

  const currentPublished = allWorkflows.find(w => w.table_name === workflow.table_name && w.lifecycle_status === 'PUBLISHED' && w.id !== workflow.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{workflow.workflow_name}</h1>
            <LifecycleBadge status={workflow.lifecycle_status || 'DRAFT'} />
            <span className="font-mono text-sm text-gray-500">{workflow.version_number}</span>
          </div>
          <p className="text-gray-600 mt-1">Target: <strong>{workflow.table_name}</strong>{workflow.description ? ` — ${workflow.description}` : ''}</p>
          {!isDraft && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2 inline-block">
              This version is <strong>{workflow.lifecycle_status}</strong>. To make changes, create a new Draft from the workflow list.
            </p>
          )}
        </div>
        {isDraft && (
          <Button onClick={() => setPublishDialog(true)} className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0">
            <Send className="w-4 h-4 mr-2" /> Publish
          </Button>
        )}
      </div>

      <AlertDialog open={publishDialog} onOpenChange={setPublishDialog}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Publish Workflow</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Publishing <strong>{workflow.version_number} — {workflow.workflow_name}</strong> will:{' '}
              {currentPublished
                ? <>move <strong>{currentPublished.version_number}</strong> to <em>Obsolete</em>, then set this draft as <em>Published</em>.</>
                : <>set this draft as the Published version.</>
              }
              {' '}Records already in-flight will continue using their original workflow version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => publishMut.mutate(workflow)} className="bg-green-600 hover:bg-green-700" disabled={publishMut.isPending}>
              {publishMut.isPending ? 'Publishing...' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Tabs defaultValue="statuses">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="transitions">Transitions</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="diagram">Diagram</TabsTrigger>
        </TabsList>
        <TabsContent value="statuses" className="mt-4">
          <WorkflowStatusesTab workflowId={workflow.id} readOnly={!isDraft} />
        </TabsContent>
        <TabsContent value="actions" className="mt-4">
          <WorkflowActionsTab workflowId={workflow.id} readOnly={!isDraft} />
        </TabsContent>
        <TabsContent value="transitions" className="mt-4">
          <WorkflowTransitionsTab workflowId={workflow.id} readOnly={!isDraft} />
        </TabsContent>
        <TabsContent value="permissions" className="mt-4">
          <WorkflowPermissionsTab workflowId={workflow.id} readOnly={!isDraft} />
        </TabsContent>
        <TabsContent value="diagram" className="mt-4">
          <WorkflowDiagramTab workflowId={workflow.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}