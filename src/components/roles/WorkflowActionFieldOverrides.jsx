import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ENTITY_FIELD_SCHEMAS } from './entityFieldSchemas';

const ENTITY_LABELS = {
  Vessel: 'Vessel', Terminal: 'Terminal', Berth: 'Berth', Document: 'Document',
  DocumentType: 'Document Type', Company: 'Company', Contact: 'Contact',
  TerminalRegistrationApplication: 'Registration Application',
  TerminalRegistrationChecklistItem: 'Registration Checklist Item',
};

/**
 * Expandable workflow-action-level field overrides.
 * Shown beneath each workflow action row in RoleWorkflowPermissionsTab.
 * 
 * These overrides apply when the entity reaches a specific WF status (resulting_status_id).
 * WF overrides take priority over table-level and field-level permissions.
 */
export default function WorkflowActionFieldOverrides({ roleId, wfDef, action, workflowStatuses }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newTable, setNewTable] = useState('');
  const [newField, setNewField] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: overrides = [] } = useQuery({
    queryKey: ['roleWfFieldOverrides', roleId, wfDef.id, action.id],
    queryFn: () => base44.entities.RoleWorkflowFieldOverride.filter({
      application_role_id: roleId,
      workflow_definition_id: wfDef.id,
      workflow_action_id: action.id
    }),
    enabled: !!roleId && !!wfDef.id && !!action.id
  });

  const addMut = useMutation({
    mutationFn: () => base44.entities.RoleWorkflowFieldOverride.create({
      application_role_id: roleId,
      workflow_definition_id: wfDef.id,
      workflow_action_id: action.id,
      resulting_status_id: newStatus,
      table_name: newTable,
      field_name: newField,
      can_read: true,
      can_update: false,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['roleWfFieldOverrides', roleId, wfDef.id, action.id]);
      setAdding(false);
      setNewTable(''); setNewField(''); setNewStatus('');
    }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RoleWorkflowFieldOverride.update(id, data),
    onSuccess: () => qc.invalidateQueries(['roleWfFieldOverrides', roleId, wfDef.id, action.id])
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.RoleWorkflowFieldOverride.delete(id),
    onSuccess: () => qc.invalidateQueries(['roleWfFieldOverrides', roleId, wfDef.id, action.id])
  });

  const statusesForWf = workflowStatuses.filter(s => s.workflow_definition_id === wfDef.id);
  const availableFields = newTable ? (ENTITY_FIELD_SCHEMAS[newTable] || []) : [];
  const availableEntities = Object.keys(ENTITY_FIELD_SCHEMAS);

  const getStatusName = (statusId) => workflowStatuses.find(s => s.id === statusId)?.status_name || statusId;

  return (
    <>
      <TableRow className="bg-indigo-50/40 border-b border-indigo-100">
        <TableCell colSpan={3} className="py-1 pl-10 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          Field Overrides when action "{action.action_name}" results in a WF status
          <span className="ml-2 font-normal normal-case text-indigo-400">(these override table & field permissions)</span>
        </TableCell>
      </TableRow>

      {overrides.length === 0 && !adding && (
        <TableRow className="bg-indigo-50/20">
          <TableCell colSpan={3} className="py-2 pl-12 text-xs text-gray-400 italic">
            No field overrides defined for this action.
          </TableCell>
        </TableRow>
      )}

      {overrides.map(ov => {
        const entityFields = ENTITY_FIELD_SCHEMAS[ov.table_name] || [];
        const fieldLabel = entityFields.find(f => f.field === ov.field_name)?.label || ov.field_name;
        return (
          <TableRow key={ov.id} className="bg-indigo-50/30 hover:bg-indigo-50/50 border-b border-indigo-100">
            <TableCell className="py-1.5 pl-14 text-xs text-slate-700">
              <span className="font-medium">{ENTITY_LABELS[ov.table_name] || ov.table_name}</span>
              <span className="mx-1 text-slate-400">›</span>
              <span className="font-mono text-slate-600">{fieldLabel}</span>
              <span className="mx-1 text-slate-400">when status =</span>
              <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700">{getStatusName(ov.resulting_status_id)}</Badge>
            </TableCell>
            <TableCell className="py-1.5 text-center">
              <div className="flex items-center justify-center gap-4">
                <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ov.can_read}
                    onChange={e => updateMut.mutate({ id: ov.id, data: { ...ov, can_read: e.target.checked } })}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 cursor-pointer"
                  />
                  Read
                </label>
                <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ov.can_update}
                    onChange={e => updateMut.mutate({ id: ov.id, data: { ...ov, can_update: e.target.checked } })}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 cursor-pointer"
                  />
                  Update
                </label>
              </div>
            </TableCell>
            <TableCell className="py-1.5 text-center">
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => deleteMut.mutate(ov.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </TableCell>
          </TableRow>
        );
      })}

      {adding ? (
        <TableRow className="bg-indigo-50/60 border-b border-indigo-200">
          <TableCell colSpan={3} className="py-2 pl-12">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-7 text-xs w-44">
                  <SelectValue placeholder="When status is..." />
                </SelectTrigger>
                <SelectContent>
                  {statusesForWf.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.status_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newTable} onValueChange={v => { setNewTable(v); setNewField(''); }}>
                <SelectTrigger className="h-7 text-xs w-40">
                  <SelectValue placeholder="Entity..." />
                </SelectTrigger>
                <SelectContent>
                  {availableEntities.map(e => (
                    <SelectItem key={e} value={e} className="text-xs">{ENTITY_LABELS[e] || e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newField} onValueChange={setNewField} disabled={!newTable}>
                <SelectTrigger className="h-7 text-xs w-44">
                  <SelectValue placeholder="Field..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map(f => (
                    <SelectItem key={f.field} value={f.field} className="text-xs">{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                disabled={!newStatus || !newTable || !newField}
                onClick={() => addMut.mutate()}
              >
                Add
              </Button>
              <Button
                size="sm" variant="ghost" className="h-7 text-xs"
                onClick={() => { setAdding(false); setNewTable(''); setNewField(''); setNewStatus(''); }}
              >
                Cancel
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ) : (
        <TableRow className="bg-indigo-50/20 border-b border-indigo-100">
          <TableCell colSpan={3} className="py-1.5 pl-12">
            <Button
              variant="ghost" size="sm"
              className="h-6 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 px-2"
              onClick={() => setAdding(true)}
            >
              <Plus className="w-3 h-3 mr-1" /> Add field override
            </Button>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}